from pymongo import MongoClient
from app.core.config import settings

# MongoDB client
client = None
db = None

def connect_to_mongo():
    """Connect to MongoDB"""
    global client, db
    try:
        client = MongoClient(settings.MONGODB_URI)
        db = client.get_database()
        
        # Create indexes
        db.users.create_index("email", unique=True)
        db.todos.create_index("user_id")
        db.todos.create_index([("user_id", 1), ("deadline", 1)])
        db.todos.create_index([("user_id", 1), ("priority", 1), ("deadline", 1)])


        
        print("✅ Connected to MongoDB successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise e

def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("⚠️ MongoDB connection closed")

def get_database():
    """Get database instance"""
    return db