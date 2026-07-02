from decimal import Decimal, ROUND_DOWN

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_current_user
from app.database import get_db
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.group_member import GroupMember
from app.models.user import User
from app.routes.groups import get_group_if_member
from app.schemas.expense import ExpenseCreate, ExpenseResponse


router = APIRouter(
    prefix="/groups/{group_id}/expenses",
    tags=["Expenses"],
)


def get_group_member_ids(group_id: int, db: Session) -> set[int]:
    member_ids = db.scalars(
        select(GroupMember.user_id).where(
            GroupMember.group_id == group_id
        )
    ).all()

    return set(member_ids)


def split_amount_equally(
    amount: Decimal,
    participant_count: int,
) -> list[Decimal]:
    """
    Toplamı kuruş seviyesinde eşit böler.
    Örn: 100 / 3 -> 33.34, 33.33, 33.33
    """
    cents = int((amount * 100).to_integral_value())
    base_cents, remainder = divmod(cents, participant_count)

    amounts = [
        Decimal(base_cents) / 100
        for _ in range(participant_count)
    ]

    for index in range(remainder):
        amounts[index] += Decimal("0.01")

    return amounts


@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    group_id: int,
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_group_if_member(group_id, current_user, db)

    participant_ids = list(dict.fromkeys(expense_data.participant_user_ids))
    group_member_ids = get_group_member_ids(group_id, db)

    if expense_data.paid_by_user_id not in group_member_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The payer must be a member of this group.",
        )

    invalid_participant_ids = set(participant_ids) - group_member_ids

    if invalid_participant_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All participants must be members of this group.",
        )

    split_amounts = split_amount_equally(
        expense_data.amount,
        len(participant_ids),
    )

    expense = Expense(
        group_id=group_id,
        paid_by=expense_data.paid_by_user_id,
        description=expense_data.description.strip(),
        amount=expense_data.amount,
    )

    db.add(expense)
    db.flush()

    for user_id, amount_owed in zip(participant_ids, split_amounts):
        db.add(
            ExpenseSplit(
                expense_id=expense.id,
                user_id=user_id,
                amount_owed=amount_owed,
            )
        )

    db.commit()

    created_expense = db.scalar(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.id == expense.id)
    )

    return created_expense


@router.get(
    "/",
    response_model=list[ExpenseResponse],
)
def list_group_expenses(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_group_if_member(group_id, current_user, db)

    expenses = db.scalars(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.group_id == group_id)
        .order_by(Expense.created_at.desc())
    ).all()

    return expenses