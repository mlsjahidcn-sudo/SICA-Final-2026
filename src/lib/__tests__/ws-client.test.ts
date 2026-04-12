import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWsConnection, type WsMessage, type WsOptions } from '../ws-client';

// Mock WebSocket class
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;
  
  readyState = 0; // CONNECTING
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }
  
  send = vi.fn();
  close = vi.fn();
}

describe('WebSocket Client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    
    // Mock global WebSocket
    vi.stubGlobal('WebSocket', MockWebSocket);
    
    // Mock window.location
    vi.stubGlobal('location', {
      protocol: 'https:',
      host: 'test.example.com',
    });
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });
  
  it('should create WebSocket connection with correct URL', () => {
    const onMessage = vi.fn();
    const opts: WsOptions = {
      path: '/ws/notifications',
      onMessage,
    };
    
    createWsConnection(opts);
    
    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toBe('wss://test.example.com/ws/notifications');
  });
  
  it('should call onOpen when connection is established', async () => {
    const onOpen = vi.fn();
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage: vi.fn(),
      onOpen,
    };
    
    createWsConnection(opts);
    
    // Simulate connection open
    const ws = MockWebSocket.instances[0];
    ws.readyState = 1; // OPEN
    ws.onopen?.(new Event('open'));
    
    expect(onOpen).toHaveBeenCalled();
  });
  
  it('should handle incoming messages', () => {
    const onMessage = vi.fn();
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage,
    };
    
    createWsConnection(opts);
    
    // Simulate receiving a message
    const ws = MockWebSocket.instances[0];
    const testMessage: WsMessage = { type: 'notification', payload: { id: '1' } };
    ws.onmessage?.(new MessageEvent('message', { 
      data: JSON.stringify(testMessage) 
    }));
    
    expect(onMessage).toHaveBeenCalledWith(testMessage);
  });
  
  it('should ignore pong messages', () => {
    const onMessage = vi.fn();
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage,
    };
    
    createWsConnection(opts);
    
    // Simulate receiving a pong message
    const ws = MockWebSocket.instances[0];
    ws.onmessage?.(new MessageEvent('message', { 
      data: JSON.stringify({ type: 'pong', payload: null }) 
    }));
    
    expect(onMessage).not.toHaveBeenCalled();
  });
  
  it('should send messages correctly', () => {
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage: vi.fn(),
    };
    
    const conn = createWsConnection(opts);
    
    // Set ready state to OPEN and mock WebSocket.OPEN constant
    const ws = MockWebSocket.instances[0];
    ws.readyState = 1; // OPEN
    vi.stubGlobal('WebSocket', Object.assign(MockWebSocket, { OPEN: 1 }));
    
    const message: WsMessage = { type: 'test', payload: { data: 'hello' } };
    conn.send(message);
    
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify(message));
  });
  
  it('should close connection properly', () => {
    const onClose = vi.fn();
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage: vi.fn(),
      onClose,
    };
    
    const conn = createWsConnection(opts);
    
    // Set ready state to OPEN
    const ws = MockWebSocket.instances[0];
    ws.readyState = 1; // OPEN
    
    conn.close();
    
    expect(ws.close).toHaveBeenCalled();
  });
  
  it('should attempt reconnection on close if enabled', async () => {
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage: vi.fn(),
      reconnect: true,
      reconnectDelay: 1000,
    };
    
    createWsConnection(opts);
    
    // Simulate connection close
    const ws = MockWebSocket.instances[0];
    ws.readyState = 3; // CLOSED
    ws.onclose?.(new CloseEvent('close'));
    
    // Wait for reconnect delay
    await vi.advanceTimersByTimeAsync(1000);
    
    // Should have created a new WebSocket instance
    expect(MockWebSocket.instances.length).toBe(2);
  });
  
  it('should not attempt reconnection if manually closed', async () => {
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage: vi.fn(),
      reconnect: true,
      reconnectDelay: 1000,
    };
    
    const conn = createWsConnection(opts);
    
    // Set ready state to OPEN
    const ws = MockWebSocket.instances[0];
    ws.readyState = 1; // OPEN
    
    conn.close();
    
    // Wait for reconnect delay
    await vi.advanceTimersByTimeAsync(1000);
    
    // Should not have created a new WebSocket instance
    expect(MockWebSocket.instances.length).toBe(1);
  });
  
  it('should handle errors', () => {
    const onError = vi.fn();
    const opts: WsOptions = {
      path: '/ws/test',
      onMessage: vi.fn(),
      onError,
    };
    
    createWsConnection(opts);
    
    // Simulate error
    const ws = MockWebSocket.instances[0];
    ws.onerror?.(new Event('error'));
    
    expect(onError).toHaveBeenCalled();
  });
});
