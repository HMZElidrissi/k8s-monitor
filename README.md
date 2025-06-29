# k8s-monitor

An application for monitoring Kubernetes clusters with application-centric visibility. Transforms complex K8s data into fancy **status pages**. The goal was to build a tool that make Kubernetes accessible to the dev team without the need of contacting the ops team.

## Architecture

```
Frontend (React/TS) ←→ Backend API (Go/Gin) ←→ Kubernetes API
```

## Features
- **Application-Centric View** - Monitor apps, not infrastructure
- **90-Day Uptime Charts** - Visual status tracking
- **Incident Timeline** - Track application issues
- **Dynamic Sidebar** - Auto-populated with your apps/namespaces


## Setup

I am using Makefiles to build and run the project.

```bash
make dev     # Start development servers
make build   # Build both frontend and backend
make test    # Run all tests
make docs    # Generate API documentation
make install # Install dependencies
make clean   # Clean build artifacts
```

## Environment Variables

### Frontend

```bash
NODE_ENV=development # or production
VITE_API_URL=http://localhost:8080 # or the actual API URL
```