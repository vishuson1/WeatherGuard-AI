import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

db_url = settings.DATABASE_URL

# Handle SQLite vs PostgreSQL/PostGIS connection args
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine = create_engine(db_url, connect_args=connect_args)
else:
    # PostgreSQL / PostGIS
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models.schema import (
        User, WeatherObservation, ForecastData, ForecastError,
        ModelPrediction, ModelVersion, SystemConfig, DatasetUpload
    )
    Base.metadata.create_all(bind=engine)
