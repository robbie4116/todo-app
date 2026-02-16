from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, todos
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    connect_to_mongo()
    yield
    # Shutdown
    close_mongo_connection()

# Create FastAPI app
app = FastAPI(
    title="Todo API",
    description="A simple todo API with JWT authentication",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://todo-app-lgj6.onrender.com"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(todos.router, prefix="/api/todos", tags=["Todos"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Todo API is running! Visit /docs for API documentation"}

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy"}