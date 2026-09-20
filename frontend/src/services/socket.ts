import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8000';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('⚡ Connected to LifeLane AI Real-Time WebSocket Server');
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('🔌 Disconnected from WebSocket Server');
      });
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  public emit(event: string, data: any) {
    if (!this.socket) this.connect();
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();
