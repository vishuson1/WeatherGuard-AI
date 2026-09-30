import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import router
from app.services.scheduler import pipeline_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("weatherguard.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: init DB and background scheduler
    logger.info("Initializing WeatherGuard AI backend database schema...")
    try:
        init_db()
        logger.info("Database schema initialized.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

    try:
        pipeline_scheduler.start()
    except Exception as e:
        logger.warning(f"Scheduler start warning: {e}")

    yield

    # Shutdown
    logger.info("Shutting down WeatherGuard AI services...")

app = FastAPI(
    title="WeatherGuard AI - Meteorological Forecast Confidence & Bust Detection System",
    description="Operational AI Decision Support Layer for Medium-Range Weather Forecasts",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error at {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal meteorological processing error", "error": str(exc)}
    )

@app.get("/")
def root():
    return {
        "service": "WeatherGuard AI",
        "description": "AI-Powered Medium-Range Forecast Confidence & Bust Detection Platform",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
