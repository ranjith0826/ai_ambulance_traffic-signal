import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import { Siren, AlertTriangle, CheckCircle, Hospital, Zap, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'emergency' | 'corridor' | 'conflict' | 'hospital' | 'deviation';
  title: string;
  detail: string;
  timestamp: string;
}

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    socketService.connect();

    const addToast = (type: ToastMessage['type'], title: string, detail: string) => {
      const newToast: ToastMessage = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        detail,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    };

    socketService.on('emergency_started', (data: any) => {
      addToast(
        'emergency',
        '🚨 Emergency Corridor Activated',
        `Ambulance ${data.ambulance_number} en route to ${data.hospital_name} (${data.severity})`
      );
    });

    socketService.on('green_corridor_activated', (data: any) => {
      addToast(
        'corridor',
        '🟢 Green Corridor Preempted',
        `Signal at ${data.signal_name} switched to EMERGENCY GREEN for ${data.ambulance_number} (${data.distance_meters}m)`
      );
    });

    socketService.on('conflict_detected', (data: any) => {
      addToast(
        'conflict',
        '⚠️ Multi-Ambulance Conflict Resolved',
        `Intersection ${data.intersection_name}: Granted to ${data.granted_ambulance_number}`
      );
    });

    socketService.on('hospital_accepted', (data: any) => {
      addToast(
        'hospital',
        '🏥 Hospital Triage Accepted',
        `${data.hospital_name} accepted incoming patient from ${data.ambulance_number}`
      );
    });

    socketService.on('route_deviation_detected', (data: any) => {
      addToast(
        'deviation',
        '🔄 Route Deviation Detected',
        `Ambulance ${data.ambulance_number} drifted ${data.drift_distance_meters}m. Dynamic reroute calculated.`
      );
    });

    return () => {
      socketService.off('emergency_started');
      socketService.off('green_corridor_activated');
      socketService.off('conflict_detected');
      socketService.off('hospital_accepted');
      socketService.off('route_deviation_detected');
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-emerald-500';
        let bgClass = 'bg-white';
        let icon = <CheckCircle className="w-5 h-5 text-emerald-600" />;

        if (toast.type === 'emergency') {
          borderClass = 'border-red-500';
          icon = <Siren className="w-5 h-5 text-red-600 animate-pulse" />;
        } else if (toast.type === 'conflict' || toast.type === 'deviation') {
          borderClass = 'border-amber-500';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600" />;
        } else if (toast.type === 'corridor') {
          borderClass = 'border-emerald-500';
          icon = <Zap className="w-5 h-5 text-emerald-600" />;
        } else if (toast.type === 'hospital') {
          borderClass = 'border-blue-500';
          icon = <Hospital className="w-5 h-5 text-blue-600" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border-2 ${borderClass} ${bgClass} shadow-xl flex items-start gap-3 transform transition-all duration-300 translate-y-0`}
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-gray-900">{toast.title}</span>
                <span className="text-[10px] text-gray-500 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-gray-600 mt-1 leading-snug">{toast.detail}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-800 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
