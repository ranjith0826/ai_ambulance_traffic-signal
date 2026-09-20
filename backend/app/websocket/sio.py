import socketio
import logging
from typing import Any, Dict

logger = logging.getLogger("lifelane.websocket")

# Create Async Socket.IO server with CORS allowed
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

@sio.event
async def connect(sid, environ):
    logger.info(f"Socket.IO client connected: {sid}")
    await sio.emit("connection_ack", {"status": "connected", "sid": sid}, to=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Socket.IO client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get("room")
    if room:
        sio.enter_room(sid, room)
        logger.info(f"Client {sid} joined room: {room}")

@sio.event
async def leave_room(sid, data):
    room = data.get("room")
    if room:
        sio.leave_room(sid, room)
        logger.info(f"Client {sid} left room: {room}")

# Global Broadcast Helpers
async def emit_ambulance_location(data: Dict[str, Any]):
    await sio.emit("ambulance_location_updated", data)

async def emit_emergency_started(data: Dict[str, Any]):
    await sio.emit("emergency_started", data)

async def emit_emergency_completed(data: Dict[str, Any]):
    await sio.emit("emergency_completed", data)

async def emit_signal_changed(data: Dict[str, Any]):
    await sio.emit("signal_changed", data)

async def emit_green_corridor_activated(data: Dict[str, Any]):
    await sio.emit("green_corridor_activated", data)

async def emit_green_corridor_restored(data: Dict[str, Any]):
    await sio.emit("green_corridor_restored", data)

async def emit_conflict_detected(data: Dict[str, Any]):
    await sio.emit("conflict_detected", data)

async def emit_conflict_resolved(data: Dict[str, Any]):
    await sio.emit("conflict_resolved", data)

async def emit_hospital_updated(data: Dict[str, Any]):
    await sio.emit("hospital_updated", data)

async def emit_hospital_accepted(data: Dict[str, Any]):
    await sio.emit("hospital_accepted", data)

async def emit_route_updated(data: Dict[str, Any]):
    await sio.emit("route_updated", data)

async def emit_route_deviation(data: Dict[str, Any]):
    await sio.emit("route_deviation_detected", data)

async def emit_notification(data: Dict[str, Any]):
    await sio.emit("notification_created", data)
