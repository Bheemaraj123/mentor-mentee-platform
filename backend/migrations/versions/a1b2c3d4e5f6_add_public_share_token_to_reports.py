"""Add public share token to reports

Revision ID: a1b2c3d4e5f6
Revises: 27336314adcb
Create Date: 2026-11-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '5d9355842a82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'reports',
        sa.Column('share_token_hash', sa.String(length=128), nullable=True),
    )
    op.add_column(
        'reports',
        sa.Column('share_revoked', sa.Boolean(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('reports', 'share_revoked')
    op.drop_column('reports', 'share_token_hash')