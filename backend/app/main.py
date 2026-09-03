from fastapi import FastAPI

from app.db.base import Base
from app.db.session import engine


app = FastAPI(
    title="HireSense API",
    description="AI-powered recruitment and job matching platform",
    version="0.1.0",
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "Welcome to HireSense API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }