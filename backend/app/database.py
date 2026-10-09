from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

DATABASE_URL = settings.DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
    # Enable SQLite foreign key constraints
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_database_schema():
    """Ensures incident location columns exist in SQLite database if safety_reports was already created."""
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(safety_reports)"))
            existing_cols = {row[1] for row in result.fetchall()}
            if existing_cols:
                new_cols = [
                    ("incident_latitude", "FLOAT"),
                    ("incident_longitude", "FLOAT"),
                    ("incident_address", "VARCHAR(500)"),
                    ("incident_location_name", "VARCHAR(200)")
                ]
                for col_name, col_type in new_cols:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE safety_reports ADD COLUMN {col_name} {col_type}"))
                conn.commit()
        except Exception as e:
            print("Database schema update notice:", e)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
