from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

# Enums
class UserRole(str, Enum):
    DRIVER = "driver"
    TRAFFIC_OFFICER = "traffic_officer"
    HOSPITAL_ADMIN = "hospital_admin"
    ADMIN = "admin"

class EmergencyType(str, Enum):
    ACCIDENT = "Accident"
    CARDIAC = "Cardiac"
    STROKE = "Stroke"
    TRAUMA = "Trauma"
    OTHER = "Other"

class SeverityLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"

class SignalState(str, Enum):
    RED = "RED"
    YELLOW = "YELLOW"
    GREEN = "GREEN"
    EMERGENCY_GREEN = "EMERGENCY_GREEN"
    HOLD = "HOLD"

# User Models
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: str
    phone: str = Field(..., min_length=7)
    password: str = Field(..., min_length=6)
    confirm_password: str
    role: UserRole
    # Conditional fields based on role
    ambulance_number: Optional[str] = None
    driver_license: Optional[str] = None
    department: Optional[str] = None
    officer_id: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    department: Optional[str] = None
    officer_id: Optional[str] = None
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    ambulance_id: Optional[str] = None
    ambulance_number: Optional[str] = None
    driver_license: Optional[str] = None
    status: str
    created_at: str

class UserStatusUpdate(BaseModel):
    status: str # "active" | "disabled"

# Ambulance Models
class Location(BaseModel):
    latitude: float
    longitude: float

class AmbulanceCreate(BaseModel):
    ambulance_number: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    status: str = "available" # "available" | "busy" | "maintenance"
    current_location: Location = Location(latitude=12.9716, longitude=77.5946)
    heading: float = 0.0
    speed: float = 0.0

class AmbulanceResponse(BaseModel):
    id: str
    ambulance_number: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    status: str
    current_location: Location
    heading: float = 0.0
    speed: float = 0.0
    active_trip_id: Optional[str] = None
    updated_at: Optional[str] = None

# Hospital Models
class HospitalCreate(BaseModel):
    name: str
    address: str
    location: Location
    phone: str
    emergency_beds: int = 10
    emergency_beds_available: int = 5
    icu_beds: int = 5
    icu_beds_available: int = 2
    ventilators: int = 4
    ventilators_available: int = 2
    specialists: List[str] = ["Cardiology", "Neurology", "Trauma", "Orthopedics"]
    emergency_readiness: int = 90 # 0 - 100 score

class HospitalAvailabilityUpdate(BaseModel):
    emergency_beds_available: int
    icu_beds_available: int
    ventilators_available: int
    specialists: Optional[List[str]] = None
    emergency_readiness: Optional[int] = None

class HospitalResponse(BaseModel):
    id: str
    name: str
    address: str
    location: Location
    phone: str
    emergency_beds: int
    emergency_beds_available: int
    icu_beds: int
    icu_beds_available: int
    ventilators: int
    ventilators_available: int
    specialists: List[str]
    emergency_readiness: int
    incoming_patients_count: int = 0
    updated_at: Optional[str] = None

# Traffic Signal Models
class TrafficSignalCreate(BaseModel):
    name: str
    intersection_id: str
    location: Location
    status: SignalState = SignalState.GREEN
    emergency_corridor_active: bool = False
    approaching_ambulance_id: Optional[str] = None
    approaching_ambulance_number: Optional[str] = None
    distance_to_signal: Optional[float] = None
    eta_seconds: Optional[float] = None
    cycle_time_seconds: int = 60

class SignalOverrideRequest(BaseModel):
    action: str # "EMERGENCY_GREEN" | "NORMAL" | "HOLD"
    ambulance_id: Optional[str] = None
    reason: Optional[str] = None

class TrafficSignalResponse(BaseModel):
    id: str
    name: str
    intersection_id: str
    location: Location
    status: SignalState
    emergency_corridor_active: bool
    approaching_ambulance_id: Optional[str] = None
    approaching_ambulance_number: Optional[str] = None
    distance_to_signal: Optional[float] = None
    eta_seconds: Optional[float] = None
    cycle_time_seconds: int
    updated_at: Optional[str] = None

# Trip / Emergency Models
class TripStartRequest(BaseModel):
    ambulance_id: str
    emergency_type: EmergencyType
    severity: SeverityLevel
    hospital_id: str
    current_location: Location
    simulation_mode: bool = True
    speed_kmh: float = 60.0

class TripLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    speed: float = 0.0
    heading: float = 0.0

class TripEndRequest(BaseModel):
    notes: Optional[str] = None

class TripResponse(BaseModel):
    id: str
    ambulance_id: str
    ambulance_number: str
    driver_id: str
    driver_name: str
    hospital_id: str
    hospital_name: str
    emergency_type: str
    severity: str
    status: str # "active" | "completed" | "cancelled"
    priority_score: float
    source: Location
    destination: Location
    current_location: Location
    eta_minutes: float
    distance_remaining_km: float
    total_distance_km: float
    travel_time_seconds: int
    estimated_time_saved_minutes: float
    signals_prioritized_count: int
    conflicts_resolved_count: int
    route_coordinates: List[List[float]] # [[lat, lng], ...]
    started_at: str
    ended_at: Optional[str] = None

# Conflict Models
class ApproachingAmbulanceInfo(BaseModel):
    ambulance_id: str
    ambulance_number: str
    driver_name: Optional[str] = "Driver"
    direction: str # "North -> South", "East -> West", etc.
    approach_angle: float # degrees
    severity: SeverityLevel
    eta_seconds: float
    distance_meters: float
    hospital_readiness: float
    hospital_name: Optional[str] = "Central Hospital"

class ConflictDetectionRequest(BaseModel):
    intersection_id: str
    intersection_name: str
    ambulances: List[ApproachingAmbulanceInfo]

class PriorityBreakdown(BaseModel):
    ambulance_id: str
    ambulance_number: str
    direction: str
    severity_score: float
    eta_score: float
    distance_score: float
    hospital_score: float
    total_priority: float

class ConflictResolutionResponse(BaseModel):
    conflict_detected: bool
    intersection_id: str
    intersection_name: str
    conflict_window_seconds: int
    ambulances_in_conflict: List[ApproachingAmbulanceInfo]
    priority_breakdowns: List[PriorityBreakdown]
    granted_ambulance_id: Optional[str] = None
    granted_ambulance_number: Optional[str] = None
    granted_direction: Optional[str] = None
    held_ambulances: List[Dict[str, Any]] = []
    decision_reason: str
    system_action: str
    timestamp: str

# Audit Log Models
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = "System"
    role: Optional[str] = "system"
    action: str
    entity: str
    entity_id: Optional[str] = None
    details: Dict[str, Any]
    timestamp: str
