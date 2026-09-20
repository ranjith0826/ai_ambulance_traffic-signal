export type UserRole = 'driver' | 'traffic_officer' | 'hospital_admin' | 'admin';

export type EmergencyType = 'Accident' | 'Cardiac' | 'Stroke' | 'Trauma' | 'Other';
export type SeverityLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type SignalState = 'RED' | 'YELLOW' | 'GREEN' | 'EMERGENCY_GREEN' | 'HOLD';

export interface Location {
  latitude: float;
  longitude: float;
}

export type float = number;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department?: string;
  officer_id?: string;
  hospital_id?: string;
  hospital_name?: string;
  ambulance_id?: string;
  ambulance_number?: string;
  driver_license?: string;
  status: 'active' | 'disabled';
  created_at: string;
}

export interface Ambulance {
  id: string;
  ambulance_number: string;
  driver_id?: string;
  driver_name?: string;
  status: 'available' | 'busy' | 'maintenance';
  current_location: Location;
  heading?: number;
  speed?: number;
  active_trip_id?: string;
  updated_at?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  location: Location;
  phone: string;
  emergency_beds: number;
  emergency_beds_available: number;
  icu_beds: number;
  icu_beds_available: number;
  ventilators: number;
  ventilators_available: number;
  specialists: string[];
  emergency_readiness: number;
  incoming_patients_count?: number;
  match_score?: number;
  distance_km?: number;
  eta_minutes?: number;
  badges?: string[];
  recommended?: boolean;
}

export interface TrafficSignal {
  id: string;
  name: string;
  intersection_id: string;
  location: Location;
  status: SignalState;
  emergency_corridor_active: boolean;
  approaching_ambulance_id?: string;
  approaching_ambulance_number?: string;
  distance_to_signal?: number;
  eta_seconds?: number;
  cycle_time_seconds: number;
  updated_at?: string;
}

export interface Trip {
  id: string;
  ambulance_id: string;
  ambulance_number: string;
  driver_id: string;
  driver_name: string;
  hospital_id: string;
  hospital_name: string;
  emergency_type: EmergencyType;
  severity: SeverityLevel;
  status: 'active' | 'completed' | 'cancelled';
  priority_score: number;
  priority_breakdown?: {
    severity_score: number;
    eta_urgency_score: number;
    distance_urgency_score: number;
    hospital_urgency_score: number;
    total_priority: number;
  };
  source: Location;
  destination: Location;
  current_location: Location;
  speed_kmh?: number;
  eta_minutes: number;
  distance_remaining_km: number;
  total_distance_km: number;
  travel_time_seconds: number;
  estimated_time_saved_minutes: number;
  signals_prioritized_count: number;
  conflicts_resolved_count: number;
  route_coordinates: [number, number][];
  route_source?: string;
  started_at: string;
  ended_at?: string;
}

export interface ApproachingAmbulance {
  ambulance_id: string;
  ambulance_number: string;
  driver_name?: string;
  direction: string;
  approach_angle?: number;
  severity: SeverityLevel;
  eta_seconds: number;
  distance_meters: number;
  hospital_readiness?: number;
  hospital_name?: string;
  priority_score?: number;
}

export interface PriorityBreakdown {
  ambulance_id: string;
  ambulance_number: string;
  direction: string;
  severity_score: number;
  eta_score: number;
  distance_score: number;
  hospital_score: number;
  total_priority: number;
}

export interface ConflictResolution {
  conflict_detected: boolean;
  intersection_id: string;
  intersection_name: string;
  conflict_window_seconds: number;
  ambulances_in_conflict: ApproachingAmbulance[];
  priority_breakdowns: PriorityBreakdown[];
  granted_ambulance_id?: string;
  granted_ambulance_number?: string;
  granted_direction?: string;
  held_ambulances: any[];
  decision_reason: string;
  system_action: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  role: string;
  action: string;
  entity: string;
  entity_id?: string;
  details: Record<string, any>;
  timestamp: string;
}
