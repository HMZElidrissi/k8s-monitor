package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// DocsHandler handles API documentation
type DocsHandler struct{}

// NewDocsHandler creates a new docs handler
func NewDocsHandler() *DocsHandler {
	return &DocsHandler{}
}

// ScalarUI serves the Scalar API documentation interface
func (h *DocsHandler) ScalarUI(c *gin.Context) {
	html := `<!DOCTYPE html>
<html>
<head>
    <title>k8s-monitor API Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <script
        id="api-reference"
        data-url="/docs/swagger.json"
        data-configuration='{
            "theme": "default",
            "layout": "modern",
            "defaultHttpClient": {
                "targetKey": "javascript",
                "clientKey": "fetch"
            }
        }'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest"></script>
</body>
</html>`

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

// RedocUI serves the Redoc API documentation interface (alternative)
func (h *DocsHandler) RedocUI(c *gin.Context) {
	html := `<!DOCTYPE html>
<html>
<head>
    <title>k8s-monitor Dashboard API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <redoc spec-url='/docs/swagger.json'></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>`

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
