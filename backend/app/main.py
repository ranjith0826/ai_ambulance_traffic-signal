import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from bson import ObjectId
from fastapi.encoders import ENCODERS_BY_TYPE

# Register ObjectId encoder so all MongoDB documents serialize properly
ENCODERS_BY_TYPE[ObjectId] = str

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.websocket.sio import sio
from app.api import (
    auth_routes,
    user_routes,
    ambulance_routes,
    hospital_routes,
    signal_routes,
    trip_routes,
    priority_conflict_routes,
    analytics_routes,
    audit_routes,
    demo_routes,
    aws_routes
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect MongoDB
    await connect_to_mongo()
    yield
    # Close MongoDB
    await close_mongo_connection()

app = FastAPI(
    title="LifeLane AI — Intelligent Ambulance Priority & Virtual Traffic Management API",
    version="1.0.0",
    description="Full-stack prototype API for real-time ambulance routing, virtual traffic signal preemption, multi-ambulance conflict resolution, and hospital recommendation.",
    lifespan=lifespan
)

# CORS Configuration
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(ambulance_routes.router)
app.include_router(hospital_routes.router)
app.include_router(signal_routes.router)
app.include_router(trip_routes.router)
app.include_router(priority_conflict_routes.router)
app.include_router(analytics_routes.router)
app.include_router(audit_routes.router)
app.include_router(demo_routes.router)
app.include_router(aws_routes.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "LifeLane AI Engine",
        "prototype_version": "1.0.0",
        "mode": "Virtual Traffic & Emergency Simulation"
    }

# Wrap FastAPI with Socket.IO ASGI application
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)
