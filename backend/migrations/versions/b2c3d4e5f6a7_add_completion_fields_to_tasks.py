"""Add completion fields to tasks

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add completion fields to tasks table."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('require_file_upload', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('completion_description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('uploaded_file_path', sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column('uploaded_file_name', sa.String(length=255), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema - remove completion fields from tasks table."""
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_column('uploaded_file_name')
        batch_op.drop_column('uploaded_file_path')
        batch_op.drop_column('completion_description')
        batch_op.drop_column('require_file_upload')
    # ### end Alembic commands ###