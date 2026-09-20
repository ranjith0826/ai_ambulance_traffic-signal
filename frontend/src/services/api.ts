import axios from 'axios';
import {
  User,
  Ambulance,
  Hospital,
  TrafficSignal,
  Trip,
  ConflictResolution,
  AuditLog,
  EmergencyType,
  SeverityLevel,
  Location
} from '../types';

const API_BASE = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('lifelane_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired, clear and redirect to login if on protected route
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('lifelane_token');
        localStorage.removeItem('lifelane_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  register: (data: any) => apiClient.post('/api/auth/register', data).then(r => r.data),
  login: (data: any) => apiClient.post('/api/auth/login', data).then(r => r.data),
  getProfile: () => apiClient.get('/api/auth/profile').then(r => r.data),
  logout: () => apiClient.post('/api/auth/logout').then(r => r.data),
};

// Users Service
export const userService = {
  listUsers: () => apiClient.get('/api/users').then(r => r.data.users),
  toggleStatus: (userId: string, status: 'active' | 'disabled') =>
    apiClient.put(`/api/users/${userId}/status`, { status }).then(r => r.data),
};

// Ambulances Service
export const ambulanceService = {
  list: (): Promise<Ambulance[]> => apiClient.get('/api/ambulances').then(r => r.data.ambulances),
  create: (data: any) => apiClient.post('/api/ambulances', data).then(r => r.data),
  get: (id: string): Promise<Ambulance> => apiClient.get(`/api/ambulances/${id}`).then(r => r.data.ambulance),
};

// Hospitals Service
export const hospitalService = {
  list: (): Promise<Hospital[]> => apiClient.get('/api/hospitals').then(r => r.data.hospitals),
  create: (data: any) => apiClient.post('/api/hospitals', data).then(r => r.data),
  updateAvailability: (id: string, data: any) => apiClient.put(`/api/hospitals/${id}/availability`, data).then(r => r.data),
  triagePatient: (id: string, data: { trip_id: string; ambulance_number: string; action: 'ACCEPT' | 'REJECT'; notes?: string }) =>
    apiClient.post(`/api/hospitals/${id}/triage`, data).then(r => r.data),
  recommend: (data: { current_location: Location; emergency_type: EmergencyType; severity: SeverityLevel }) =>
    apiClient.post('/api/hospitals/recommend', data).then(r => r.data),
};

// Traffic Signals Service
export const signalService = {
  list: (): Promise<TrafficSignal[]> => apiClient.get('/api/signals').then(r => r.data.signals),
  create: (data: any) => apiClient.post('/api/signals', data).then(r => r.data),
  override: (id: string, action: 'EMERGENCY_GREEN' | 'NORMAL' | 'HOLD', ambulance_id?: string, reason?: string) =>
    apiClient.post(`/api/signals/${id}/override`, { action, ambulance_id, reason }).then(r => r.data),
};

// Trips Service
export const tripService = {
  start: (data: {
    ambulance_id: string;
    emergency_type: EmergencyType;
    severity: SeverityLevel;
    hospital_id: string;
    current_location: Location;
    simulation_mode: boolean;
    speed_kmh: number;
  }): Promise<{ message: string; trip: Trip }> => apiClient.post('/api/trips/start', data).then(r => r.data),
  updateLocation: (tripId: string, data: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
    apiClient.post(`/api/trips/${tripId}/location`, data).then(r => r.data),
  end: (tripId: string, notes?: string): Promise<{ message: string; trip_summary: Trip }> =>
    apiClient.post(`/api/trips/${tripId}/end`, { notes }).then(r => r.data),
  getActive: (): Promise<Trip[]> => apiClient.get('/api/trips/active').then(r => r.data.active_trips),
  getHistory: (): Promise<Trip[]> => apiClient.get('/api/trips/history').then(r => r.data.trips),
  get: (tripId: string): Promise<Trip> => apiClient.get(`/api/trips/${tripId}`).then(r => r.data.trip),
};

// Priority & Conflicts Service
export const conflictService = {
  calculatePriority: (data: any) => apiClient.post('/api/priority/calculate', data).then(r => r.data),
  detect: (data: any): Promise<ConflictResolution> => apiClient.post('/api/conflicts/detect', data).then(r => r.data),
  resolve: (data: any): Promise<ConflictResolution> => apiClient.post('/api/conflicts/resolve', data).then(r => r.data),
  getActive: (): Promise<ConflictResolution[]> => apiClient.get('/api/conflicts/active').then(r => r.data.conflicts),
};

// Analytics Service
export const analyticsService = {
  getSummary: () => apiClient.get('/api/analytics').then(r => r.data),
};

// Audit Logs Service
export const auditService = {
  getLogs: (limit = 50): Promise<AuditLog[]> => apiClient.get(`/api/audit-logs?limit=${limit}`).then(r => r.data.audit_logs),
};

// Demo Service
export const demoService = {
  getScenario1: () => apiClient.get('/api/demo/scenario/1').then(r => r.data),
  getScenario2: () => apiClient.get('/api/demo/scenario/2').then(r => r.data),
  getScenario3: () => apiClient.get('/api/demo/scenario/3').then(r => r.data),
  getScenario4: () => apiClient.get('/api/demo/scenario/4').then(r => r.data),
};

// AWS Cloud Services (Bedrock & S3)
export const awsService = {
  getStatus: () => apiClient.get('/api/aws/status').then(r => r.data),
  testConfig: (data: any) => apiClient.post('/api/aws/test-config', data).then(r => r.data),
  bedrockTriage: (patientData: any) => apiClient.post('/api/aws/bedrock-triage', patientData).then(r => r.data),
  uploadReport: (data: { filename: string; content_base64: string; report_type?: string; generated_by?: string }) =>
    apiClient.post('/api/aws/upload-report', data).then(r => r.data),
  listS3Reports: () => apiClient.get('/api/aws/s3-reports').then(r => r.data),
};
