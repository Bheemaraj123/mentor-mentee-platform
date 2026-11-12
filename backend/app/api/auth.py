
import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import (
    UserCreate,
    UserLogin,
    Token,
    User as UserSchema,
    UserUpdate,
    PasswordChange,
)
from app.core.security import (
    get_password_hash,
    create_access_token,
    verify_password,
)
from app.core.config import settings
from app.api.deps import get_current_user


logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserSchema)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(
            User.email == user_in.email
        ).first()

        if user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        hashed_password = get_password_hash(user_in.password)

        db_user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            password_hash=hashed_password,
            role=user_in.role,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        logger.exception(
            "Unexpected error during user registration"
        )

        raise HTTPException(
            status_code=500,
            detail="Registration failed. Check the backend terminal.",
        )


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == user_in.email
    ).first()

    if not user or not verify_password(
        user_in.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password",
        )

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
        },
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.put("/profile", response_model=UserSchema)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile (full name)"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name

    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
