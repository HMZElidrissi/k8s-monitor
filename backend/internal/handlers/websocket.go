package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"

	"k8s-monitor/internal/models"
	"k8s-monitor/internal/services"
)

// WebSocketHandler handles WebSocket connections for real-time updates
type WebSocketHandler struct {
	monitorService *services.MonitorService
	logger         *logrus.Logger
	upgrader       websocket.Upgrader
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(monitorService *services.MonitorService, logger *logrus.Logger) *WebSocketHandler {
	return &WebSocketHandler{
		monitorService: monitorService,
		logger:         logger,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// In production, implement proper origin checking
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	}
}

// HandleWebSocket handles GET /api/v1/ws
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	namespace := c.DefaultQuery("namespace", "default")

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		h.logger.WithError(err).Error("Failed to upgrade WebSocket connection")
		return
	}

	client := &services.Client{
		ID:        generateClientID(),
		Namespace: namespace,
		Send:      make(chan models.WebSocketMessage, 256),
		Hub:       h.monitorService,
	}

	// Register client
	h.monitorService.RegisterClient(client)

	h.logger.WithFields(logrus.Fields{
		"client_id":   client.ID,
		"namespace":   namespace,
		"remote_addr": c.Request.RemoteAddr,
	}).Info("WebSocket client connected")

	// Start goroutines for reading and writing
	go h.writePump(conn, client)
	go h.readPump(conn, client)
}

// writePump pumps messages from the hub to the websocket connection
func (h *WebSocketHandler) writePump(conn *websocket.Conn, client *services.Client) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Channel closed
				conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := conn.WriteJSON(message); err != nil {
				h.logger.WithError(err).WithField("client_id", client.ID).Error("Failed to write message")
				return
			}

		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// readPump pumps messages from the websocket connection to the hub
func (h *WebSocketHandler) readPump(conn *websocket.Conn, client *services.Client) {
	defer func() {
		h.monitorService.UnregisterClient(client)
		conn.Close()

		h.logger.WithField("client_id", client.ID).Info("WebSocket client disconnected")
	}()

	conn.SetReadLimit(512)
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				h.logger.WithError(err).WithField("client_id", client.ID).Error("WebSocket error")
			}
			break
		}
	}
}

// generateClientID generates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
