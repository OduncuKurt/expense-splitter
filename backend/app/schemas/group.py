from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class GroupMemberResponse(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class GroupResponse(BaseModel):
    id: int
    name: str
    created_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AddGroupMemberRequest(BaseModel):
    email: str