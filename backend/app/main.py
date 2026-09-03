from fastapi import FastAPI

app = FastAPI(
    title="HireSense API",
    description="AI-powered recruitment and job matching platform",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to HireSense API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }