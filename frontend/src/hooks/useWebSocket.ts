import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type { WebSocketMessage, PodStatus } from '@/types';

interface UseWebSocketOptions {
  namespace?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    namespace = 'default',
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    try {
      const wsUrl = apiClient.getWebSocketUrl(namespace);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log(`WebSocket connected to namespace: ${namespace}`);
        onConnect?.();
      };

      ws.current.onclose = (event) => {
        console.log(
          `WebSocket disconnected from namespace: ${namespace}`,
          event
        );
        onDisconnect?.();

        // Auto-reconnect if enabled and connection wasn't closed intentionally
        if (autoReconnect && event.code !== 1000) {
          reconnectTimer.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle different message types
          switch (message.type) {
            case 'pod_add':
            case 'pod_update':
              // Update pods query cache
              queryClient.setQueryData(['pods', namespace], (oldData: any) => {
                if (!oldData) return oldData;

                const updatedPod = message.data as PodStatus;
                const existingPods = oldData.pods || [];
                const podIndex = existingPods.findIndex(
                  (p: PodStatus) => p.name === updatedPod.name
                );

                let newPods;
                if (podIndex >= 0) {
                  // Update existing pod
                  newPods = [...existingPods];
                  newPods[podIndex] = updatedPod;
                } else {
                  // Add new pod
                  newPods = [...existingPods, updatedPod];
                }

                return {
                  ...oldData,
                  pods: newPods,
                  count: newPods.length,
                };
              });

              // Also invalidate applications query to update aggregated status
              queryClient.invalidateQueries({
                queryKey: ['applications', namespace],
              });
              break;

            case 'pod_delete':
              // Remove pod from cache
              queryClient.setQueryData(['pods', namespace], (oldData: any) => {
                if (!oldData) return oldData;

                const deletedPod = message.data as PodStatus;
                const filteredPods = (oldData.pods || []).filter(
                  (p: PodStatus) => p.name !== deletedPod.name
                );

                return {
                  ...oldData,
                  pods: filteredPods,
                  count: filteredPods.length,
                };
              });

              queryClient.invalidateQueries({
                queryKey: ['applications', namespace],
              });
              break;

            case 'heartbeat':
              // Handle heartbeat silently
              break;

            case 'error':
              console.error('WebSocket error message:', message.data);
              break;
          }

          // Call custom message handler
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError?.(error as Event);
    }
  }, [
    namespace,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    autoReconnect,
    reconnectInterval,
    queryClient,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Intentional disconnect');
      ws.current = null;
    }
  }, []);

  const send = useCallback((data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Reconnect when namespace changes
  useEffect(() => {
    if (ws.current) {
      disconnect();
      connect();
    }
  }, [namespace, connect, disconnect]);

  return {
    connect,
    disconnect,
    send,
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
};
