import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default to local SQLite, use PostgreSQL in production
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./ai_platform.db")

# Render postgres URLs sometimes use "postgres://" instead of "postgresql://"
# We replace it with "postgresql+pg8000://" to use the pure-python pg8000 driver
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

# SQLite threading options
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to yield database sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
