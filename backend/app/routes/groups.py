from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User
from app.schemas.group import (
    AddGroupMemberRequest,
    GroupCreate,
    GroupMemberResponse,
    GroupResponse,
)


router = APIRouter(
    prefix="/groups",
    tags=["Groups"],
)


def get_group_if_member(
    group_id: int,
    current_user: User,
    db: Session,
) -> Group:
    group = db.scalar(
        select(Group)
        .join(GroupMember)
        .where(
            Group.id == group_id,
            GroupMember.user_id == current_user.id,
        )
    )

    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found or you are not a member.",
        )

    return group


@router.post(
    "/",
    response_model=GroupResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = Group(
        name=group_data.name,
        created_by=current_user.id,
    )

    db.add(group)
    db.flush()

    owner_membership = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
    )

    db.add(owner_membership)
    db.commit()
    db.refresh(group)

    return group


@router.get(
    "/",
    response_model=list[GroupResponse],
)
def list_my_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    groups = db.scalars(
        select(Group)
        .join(GroupMember)
        .where(GroupMember.user_id == current_user.id)
        .order_by(Group.created_at.desc())
    ).all()

    return groups


@router.get(
    "/{group_id}",
    response_model=GroupResponse,
)
def get_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_group_if_member(group_id, current_user, db)


@router.get(
    "/{group_id}/members",
    response_model=list[GroupMemberResponse],
)
def list_group_members(
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

    return members


@router.post(
    "/{group_id}/members",
    response_model=GroupMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_group_member(
    group_id: int,
    member_data: AddGroupMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = get_group_if_member(group_id, current_user, db)

    if group.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group creator can add members.",
        )

    user_to_add = db.scalar(
        select(User).where(User.email == member_data.email)
    )

    if user_to_add is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user found with this email.",
        )

    existing_membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_to_add.id,
        )
    )

    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already in the group.",
        )

    membership = GroupMember(
        group_id=group_id,
        user_id=user_to_add.id,
    )

    db.add(membership)
    db.commit()

    return user_to_add