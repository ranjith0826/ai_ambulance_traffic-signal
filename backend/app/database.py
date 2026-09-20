import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("lifelane.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        # Verify connection
        await db_instance.client.admin.command('ping')
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URI}, Database: {settings.DATABASE_NAME}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        # Keep client instantiated so errors surface gracefully on queries

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("Closed MongoDB connection.")

def get_db():
    return db_instance.db

# Collections helper getters
def get_users_col():
    return db_instance.db["users"]

def get_ambulances_col():
    return db_instance.db["ambulances"]

def get_hospitals_col():
    return db_instance.db["hospitals"]

def get_trips_col():
    return db_instance.db["trips"]

def get_signals_col():
    return db_instance.db["signals"]

def get_conflicts_col():
    return db_instance.db["conflicts"]

def get_audit_logs_col():
    return db_instance.db["audit_logs"]

def get_traffic_history_col():
    return db_instance.db["traffic_history"]

def get_simulation_runs_col():
    return db_instance.db["simulation_runs"]
