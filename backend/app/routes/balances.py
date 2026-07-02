from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_current_user
from app.database import get_db
from app.models.expense import Expense
from app.models.group_member import GroupMember
from app.models.user import User
from app.routes.groups import get_group_if_member
from app.schemas.balance import (
    GroupBalanceResponse,
    MemberBalanceResponse,
    SettlementResponse,
)


router = APIRouter(
    prefix="/groups/{group_id}",
    tags=["Balances"],
)


def calculate_settlements(
    balances: dict[int, Decimal],
) -> list[tuple[int, int, Decimal]]:
    creditors = []
    debtors = []

    for user_id, balance in balances.items():
        rounded_balance = balance.quantize(Decimal("0.01"))

        if rounded_balance > Decimal("0.00"):
            creditors.append([user_id, rounded_balance])

        elif rounded_balance < Decimal("0.00"):
            debtors.append([user_id, abs(rounded_balance)])

    creditors.sort(key=lambda item: item[1], reverse=True)
    debtors.sort(key=lambda item: item[1], reverse=True)

    settlements = []

    while creditors and debtors:
        creditor_id, credit = creditors[0]
        debtor_id, debt = debtors[0]

        payment = min(credit, debt).quantize(Decimal("0.01"))

        settlements.append(
            (
                debtor_id,
                creditor_id,
                payment,
            )
        )

        creditors[0][1] -= payment
        debtors[0][1] -= payment

        if creditors[0][1] <= Decimal("0.00"):
            creditors.pop(0)

        if debtors[0][1] <= Decimal("0.00"):
            debtors.pop(0)

    return settlements


@router.get(
    "/balances",
    response_model=GroupBalanceResponse,
)
def get_group_balances(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_group_if_member(group_id, current_user, db)

    members = db.scalars(
        select(User)
        .join(GroupMember)
        .where(GroupMember.group_id == group_id)
        .order_by(User.username)
    ).all()

    expenses = db.scalars(
        select(Expense)
        .options(selectinload(Expense.splits))
        .where(Expense.group_id == group_id)
    ).all()

    balances = defaultdict(lambda: Decimal("0.00"))

    for member in members:
        balances[member.id] = Decimal("0.00")

    for expense in expenses:
        balances[expense.paid_by] += expense.amount

        for split in expense.splits:
            balances[split.user_id] -= split.amount_owed

    user_map = {
        member.id: member
        for member in members
    }

    balance_responses = [
        MemberBalanceResponse(
            user_id=member.id,
            username=member.username,
            balance=balances[member.id].quantize(Decimal("0.01")),
        )
        for member in members
    ]

    settlements = calculate_settlements(balances)

    settlement_responses = [
        SettlementResponse(
            from_user_id=from_user_id,
            from_username=user_map[from_user_id].username,
            to_user_id=to_user_id,
            to_username=user_map[to_user_id].username,
            amount=amount,
        )
        for from_user_id, to_user_id, amount in settlements
    ]

    return GroupBalanceResponse(
        balances=balance_responses,
        settlements=settlement_responses,
    )