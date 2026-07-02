from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    description: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    paid_by_user_id: int
    participant_user_ids: list[int] = Field(min_length=1)


class ExpenseSplitResponse(BaseModel):
    user_id: int
    amount_owed: Decimal

    model_config = ConfigDict(from_attributes=True)


class ExpenseResponse(BaseModel):
    id: int
    group_id: int
    paid_by: int
    description: str
    amount: Decimal
    created_at: datetime
    splits: list[ExpenseSplitResponse]

    model_config = ConfigDict(from_attributes=True)