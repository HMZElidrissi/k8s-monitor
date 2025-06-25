package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS middleware handles cross-origin requests
func CORS() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		fmt.Println("Origin:", origin)
		
		// In development, allowing all origins
		// In production, configure specific origins
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})
}