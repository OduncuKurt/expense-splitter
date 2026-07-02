from decimal import Decimal

from pydantic import BaseModel


class MemberBalanceResponse(BaseModel):
    user_id: int
    username: str
    balance: Decimal


class SettlementResponse(BaseModel):
    from_user_id: int
    from_username: str
    to_user_id: int
    to_username: str
    amount: Decimal


class GroupBalanceResponse(BaseModel):
    balances: list[MemberBalanceResponse]
    settlements: list[SettlementResponse]