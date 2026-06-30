from fastapi import FastAPI

app = FastAPI(
    title="Expense Splitter API",
    version="0.1.0",
)


@app.get("/")
def root():
    return {"message": "Expense Splitter API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}