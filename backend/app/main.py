from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import Expense, ExpenseSplit, Group, GroupMember, User  # noqa: F401
from app.routes.users import router as users_router
from app.routes.auth import router as auth_router
from app.routes.groups import router as groups_router
from app.routes.expenses import router as expenses_router
from app.routes.balances import router as balances_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expense Splitter API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(expenses_router)
app.include_router(balances_router)

@app.get("/")
def root():
    return {"message": "Expense Splitter API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}