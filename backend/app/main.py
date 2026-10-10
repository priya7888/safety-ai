from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, ensure_database_schema
from .config import settings
from .routers import auth, reports, analysis, sif_intelligence, feedback, dashboard, weak_signals, sif_precursors, response_tasks
from .seed_data import seed_sample_data

# Create DB Tables & Ensure Schema
Base.metadata.create_all(bind=engine)
ensure_database_schema()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered SIF Precursor Detection & Safety Intelligence for Smart India Hackathon PS 165",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(analysis.router)
app.include_router(analysis.ai_analysis_router)
app.include_router(sif_intelligence.router)
app.include_router(feedback.router)
app.include_router(dashboard.router)
app.include_router(weak_signals.router)
app.include_router(sif_precursors.router)
app.include_router(response_tasks.router)

@app.on_event("startup")
def startup_event():
    seed_sample_data()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "api_docs": "/docs"
    }
