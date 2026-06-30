// WebSocket Hook for Real-time Collaboration
import { useState, useEffect, useRef, useCallback } from 'react';
import { wsManager, WebSocketManager } from '../services/api';
import { CollaborationEvent, CursorPosition } from '../types/dashboard';
import { useAuth } from './useAuth';

interface UseWebSocketProps {
  dashboardId?: string;
  onMessage?: (message: any) => void;
  onUserJoined?: (user: { id: string; name: string }) => void;
  onUserLeft?: (user: { id: string; name: string }) => void;
  onCursorMove?: (cursor: CursorPosition) => void;
  onWidgetUpdate?: (event: CollaborationEvent) => void;
  onChatMessage?: (message: { user: string; text: string; timestamp: string }) => void;
}

export const useWebSocket = ({
  dashboardId,
  onMessage,
  onUserJoined,
  onUserLeft,
  onCursorMove,
  onWidgetUpdate,
  onChatMessage,
}: UseWebSocketProps = {}) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!dashboardId || !user) return;

    try {
      setError(null);
      const ws = wsManager.connect(dashboardId, user.id.toString(), `${user.full_name || user.first_name + ' ' + user.last_name}`.trim() || user.email);
      
      if (ws) {
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setError(null);
          
          // Start heartbeat
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
          }, 30000);
        };

        ws.onclose = () => {
          setConnected(false);
          clearInterval(heartbeatIntervalRef.current);
          
          // Attempt reconnection after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error occurred');
        };

        // Set up message handler
        wsManager.onMessage(handleMessage);
      }
    } catch (err) {
      setError('Failed to connect to real-time service');
      console.error('WebSocket connection error:', err);
    }
  }, [dashboardId, user]);

  // Handle incoming messages
  const handleMessage = useCallback((message: any) => {
    onMessage?.(message);

    switch (message.type) {
      case 'user_joined':
        setActiveUsers(prev => {
          const existing = prev.find(u => u.id === message.data.user_id);
          if (existing) return prev;
          
          const newUser = {
            id: message.data.user_id,
            name: message.data.user_name,
            color: message.data.color || getRandomColor(),
          };
          
          onUserJoined?.(newUser);
          return [...prev, newUser];
        });
        break;

      case 'user_left':
        setActiveUsers(prev => {
          const updatedUsers = prev.filter(u => u.id !== message.data.user_id);
          onUserLeft?.(message.data);
          return updatedUsers;
        });
        setCursors(prev => prev.filter(c => c.user_id !== message.data.user_id));
        break;

      case 'cursor_move':
        const cursorData: CursorPosition = {
          user_id: message.data.user_id,
          user_name: message.data.user_name,
          x: message.data.x,
          y: message.data.y,
          color: message.data.color,
        };
        
        setCursors(prev => {
          const filtered = prev.filter(c => c.user_id !== cursorData.user_id);
          return [...filtered, cursorData];
        });
        
        onCursorMove?.(cursorData);
        break;

      case 'widget_update':
      case 'widget_create':
      case 'widget_delete':
        onWidgetUpdate?.(message as CollaborationEvent);
        break;

      case 'chat_message':
        onChatMessage?.({
          user: message.data.user_name,
          text: message.data.text,
          timestamp: message.data.timestamp,
        });
        break;

      case 'dashboard_update':
        // Handle dashboard-level changes
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [onMessage, onUserJoined, onUserLeft, onCursorMove, onWidgetUpdate, onChatMessage]);

  // Send messages
  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current && connected) {
      wsManager.sendMessage(type, data);
    }
  }, [connected]);

  // Send cursor position
  const sendCursorMove = useCallback((x: number, y: number) => {
    sendMessage('cursor_move', { x, y });
  }, [sendMessage]);

  // Send widget updates
  const sendWidgetUpdate = useCallback((type: 'create' | 'update' | 'delete', widgetData: any) => {
    sendMessage(`widget_${type}`, widgetData);
  }, [sendMessage]);

  // Send chat message
  const sendChatMessage = useCallback((text: string) => {
    sendMessage('chat_message', { text });
  }, [sendMessage]);

  // Send dashboard updates
  const sendDashboardUpdate = useCallback((updates: any) => {
    sendMessage('dashboard_update', updates);
  }, [sendMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    wsManager.disconnect();
    setConnected(false);
    setActiveUsers([]);
    setCursors([]);
  }, []);

  // Setup connection when dashboard changes
  useEffect(() => {
    if (dashboardId && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [dashboardId, user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected,
    activeUsers,
    cursors,
    error,
    sendMessage,
    sendCursorMove,
    sendWidgetUpdate,
    sendChatMessage,
    sendDashboardUpdate,
    connect,
    disconnect,
  };
};

// Hook for managing cursor tracking
export const useCursorTracking = (dashboardId?: string, enabled: boolean = true) => {
  const { sendCursorMove } = useWebSocket({ dashboardId });
  const throttleRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled) return;

    // Throttle cursor updates to avoid spam
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    throttleRef.current = setTimeout(() => {
      const rect = (event.target as HTMLElement)?.getBoundingClientRect();
      if (rect) {
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        sendCursorMove(x, y);
      }
    }, 100); // Throttle to 10 FPS
  }, [enabled, sendCursorMove]);

  useEffect(() => {
    if (enabled && dashboardId) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (throttleRef.current) {
          clearTimeout(throttleRef.current);
        }
      };
    }
  }, [enabled, dashboardId, handleMouseMove]);
};

// Hook for collaboration chat
export const useCollaborationChat = (dashboardId?: string) => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    user: string;
    text: string;
    timestamp: string;
  }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { sendChatMessage } = useWebSocket({
    dashboardId,
    onChatMessage: (message) => {
      const chatMessage = {
        id: `${Date.now()}_${Math.random()}`,
        ...message,
      };
      
      setMessages(prev => [...prev, chatMessage]);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    },
  });

  const sendMessage = useCallback((text: string) => {
    if (text.trim()) {
      sendChatMessage(text);
    }
  }, [sendChatMessage]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
  }, []);

  return {
    messages,
    isOpen,
    unreadCount,
    sendMessage,
    openChat,
    closeChat,
    clearMessages,
  };
};

// Utility function to generate random colors for users
const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
    '#00D2D3', '#FF9F43', '#54A0FF', '#2E86DE'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};