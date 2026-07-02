from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    __table_args__ = (
        UniqueConstraint(
            "expense_id",
            "user_id",
            name="uq_expense_splits_expense_user",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    expense_id: Mapped[int] = mapped_column(
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    amount_owed: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    expense: Mapped["Expense"] = relationship(
        back_populates="splits",
    )