from sqlalchemy.orm import Session
from app.db.session import SessionLocal, Base, engine
from app.models.models import User
from passlib.context import CryptContext

# Use sha256_crypt which doesn't have the bcrypt version issue
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_demo_users():
    db = SessionLocal()
    try:
        # Check if demo users already exist
        mentor = db.query(User).filter(User.email == "mentor.demo@example.com").first()
        if not mentor:
            mentor = User(
                email="mentor.demo@example.com",
                full_name="Demo Mentor",
                password_hash=get_password_hash("Mentor@123"),
                role="mentor"
            )
            db.add(mentor)
            print("Created demo mentor user")

        mentee = db.query(User).filter(User.email == "mentee.demo@example.com").first()
        if not mentee:
            mentee = User(
                email="mentee.demo@example.com",
                full_name="Demo Mentee",
                password_hash=get_password_hash("Mentee@123"),
                role="mentee"
            )
            db.add(mentee)
            print("Created demo mentee user")

        db.commit()
        print("Demo users seeded successfully")
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_demo_users()