package services

import (
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/watch"

	"k8s-monitor/internal/models"
)

// MonitorService handles real-time monitoring and broadcasting
type MonitorService struct {
	k8sService K8sService
	logger     *logrus.Logger
	watchers   map[string]watch.Interface
	clients    map[string]map[*Client]bool
	mu         sync.RWMutex
	ctx        context.Context
	cancel     context.CancelFunc
}

// Client represents a WebSocket client connection
type Client struct {
	ID        string
	Namespace string
	Send      chan models.WebSocketMessage
	Hub       *MonitorService
}

// NewMonitorService creates a new monitoring service
func NewMonitorService(k8sService K8sService, logger *logrus.Logger) *MonitorService {
	ctx, cancel := context.WithCancel(context.Background())
	
	return &MonitorService{
		k8sService: k8sService,
		logger:     logger,
		watchers:   make(map[string]watch.Interface),
		clients:    make(map[string]map[*Client]bool),
		ctx:        ctx,
		cancel:     cancel,
	}
}

// RegisterClient registers a new WebSocket client for a namespace
func (m *MonitorService) RegisterClient(client *Client) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.clients[client.Namespace]; !exists {
		m.clients[client.Namespace] = make(map[*Client]bool)
		// Start watching this namespace if not already watching
		go m.watchNamespace(client.Namespace)
	}

	m.clients[client.Namespace][client] = true
	
	m.logger.WithFields(logrus.Fields{
		"client_id": client.ID,
		"namespace": client.Namespace,
	}).Info("Client registered for monitoring")

	// Send initial pod state
	go m.sendInitialState(client)
}

// UnregisterClient removes a WebSocket client
func (m *MonitorService) UnregisterClient(client *Client) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if clients, exists := m.clients[client.Namespace]; exists {
		delete(clients, client)
		
		// If no more clients for this namespace, stop watching
		if len(clients) == 0 {
			delete(m.clients, client.Namespace)
			if watcher, exists := m.watchers[client.Namespace]; exists {
				watcher.Stop()
				delete(m.watchers, client.Namespace)
			}
		}
	}

	close(client.Send)
	
	m.logger.WithFields(logrus.Fields{
		"client_id": client.ID,
		"namespace": client.Namespace,
	}).Info("Client unregistered from monitoring")
}

// Broadcast sends a message to all clients watching a namespace
func (m *MonitorService) Broadcast(namespace string, message models.WebSocketMessage) {
	m.mu.RLock()
	clients, exists := m.clients[namespace]
	m.mu.RUnlock()

	if !exists {
		return
	}

	for client := range clients {
		select {
		case client.Send <- message:
		default:
			// Client's send channel is full, remove it
			m.UnregisterClient(client)
		}
	}
}

// watchNamespace starts watching pod events for a specific namespace
func (m *MonitorService) watchNamespace(namespace string) {
	logger := m.logger.WithField("namespace", namespace)
	logger.Info("Starting to watch namespace")

	watcher, err := m.k8sService.WatchPods(namespace)
	if err != nil {
		logger.WithError(err).Error("Failed to start watching namespace")
		return
	}

	m.mu.Lock()
	m.watchers[namespace] = watcher
	m.mu.Unlock()

	defer func() {
		watcher.Stop()
		m.mu.Lock()
		delete(m.watchers, namespace)
		m.mu.Unlock()
		logger.Info("Stopped watching namespace")
	}()

	for {
		select {
		case event, ok := <-watcher.ResultChan():
			if !ok {
				logger.Warning("Watch channel closed, restarting...")
				// Restart watcher after a delay
				time.Sleep(5 * time.Second)
				go m.watchNamespace(namespace)
				return
			}

			m.handlePodEvent(namespace, event)

		case <-m.ctx.Done():
			return
		}
	}
}

// handlePodEvent processes a pod event and broadcasts to clients
func (m *MonitorService) handlePodEvent(namespace string, event watch.Event) {
	pod, ok := event.Object.(*corev1.Pod)
	if !ok {
		m.logger.Warning("Received non-pod object in pod watch")
		return
	}

	var messageType string
	switch event.Type {
	case watch.Added:
		messageType = models.MessageTypePodAdd
	case watch.Modified:
		messageType = models.MessageTypePodUpdate
	case watch.Deleted:
		messageType = models.MessageTypePodDelete
	default:
		return // Ignore other event types
	}

	podStatus := models.NewPodStatusFromK8s(pod)
	
	message := models.WebSocketMessage{
		Type:      messageType,
		Namespace: namespace,
		Data:      podStatus,
		Timestamp: time.Now(),
	}

	m.Broadcast(namespace, message)

	m.logger.WithFields(logrus.Fields{
		"pod":       pod.Name,
		"namespace": namespace,
		"event":     event.Type,
		"status":    podStatus.Status,
	}).Debug("Pod event processed")
}

// sendInitialState sends the current pod state to a newly connected client
func (m *MonitorService) sendInitialState(client *Client) {
	pods, err := m.k8sService.GetPods(client.Namespace)
	if err != nil {
		m.logger.WithError(err).Error("Failed to get initial pod state")
		return
	}

	for _, pod := range pods {
		message := models.WebSocketMessage{
			Type:      models.MessageTypePodAdd,
			Namespace: client.Namespace,
			Data:      pod,
			Timestamp: time.Now(),
		}

		select {
		case client.Send <- message:
		default:
			m.logger.Warning("Failed to send initial state to client")
			return
		}
	}
}

// SendHeartbeat sends periodic heartbeat messages to all clients
func (m *MonitorService) SendHeartbeat() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			message := models.WebSocketMessage{
				Type:      models.MessageTypeHeartbeat,
				Timestamp: time.Now(),
			}

			m.mu.RLock()
			for namespace := range m.clients {
				m.Broadcast(namespace, message)
			}
			m.mu.RUnlock()

		case <-m.ctx.Done():
			return
		}
	}
}

// Shutdown gracefully shuts down the monitoring service
func (m *MonitorService) Shutdown() {
	m.cancel()
	
	m.mu.Lock()
	defer m.mu.Unlock()

	// Stop all watchers
	for _, watcher := range m.watchers {
		watcher.Stop()
	}

	// Close all client connections
	for _, clients := range m.clients {
		for client := range clients {
			close(client.Send)
		}
	}

	m.logger.Info("Monitor service shutdown complete")
}