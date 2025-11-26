# Docker Setup for Money Guesser

This document explains how to run the Money Guesser application using Docker.

## Prerequisites

- Docker Desktop installed on your system
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Build and Run with Docker Compose

From the project root directory, run:

```bash
docker-compose up --build
```

This will:
- Build both frontend and backend Docker images
- Start both services
- Frontend will be available at http://localhost
- Backend API will be available at http://localhost:3001

### 2. Run in Detached Mode

To run the containers in the background:

```bash
docker-compose up -d --build
```

### 3. Stop the Application

```bash
docker-compose down
```

To stop and remove volumes:

```bash
docker-compose down -v
```

## Individual Service Commands

### Backend Only

Build:
```bash
docker build -t moneyguesser-backend ./backend
```

Run:
```bash
docker run -p 3001:3001 moneyguesser-backend
```

### Frontend Only

Build:
```bash
docker build -t moneyguesser-frontend ./frontend
```

Run:
```bash
docker run -p 80:80 moneyguesser-frontend
```

## Development vs Production

### Development Mode

For development, you may want to use volume mounts to enable hot reloading. Create a `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    volumes:
      - ./backend/src:/app/src
    environment:
      - NODE_ENV=development
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: builder
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev
    ports:
      - "5173:5173"
```

Run with:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Mode

The default `docker-compose.yml` is configured for production with:
- Optimized builds
- Multi-stage builds for smaller images
- Nginx serving static frontend files
- Health checks
- Restart policies

## Monitoring and Logs

### View logs for all services:
```bash
docker-compose logs -f
```

### View logs for specific service:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Check container status:
```bash
docker-compose ps
```

### Check health status:
```bash
docker inspect moneyguesser-backend --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Port conflicts
If ports 80 or 3001 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Change frontend to port 8080
  - "3002:3001"  # Change backend to port 3002
```

### Container won't start
Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Rebuild from scratch
Remove all containers, images, and volumes:
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

## Environment Variables

You can create a `.env` file in the project root to customize settings:

```env
# Backend
BACKEND_PORT=3001
NODE_ENV=production

# Frontend
FRONTEND_PORT=80
VITE_API_URL=http://localhost:3001
```

Then reference them in `docker-compose.yml`:

```yaml
environment:
  - PORT=${BACKEND_PORT}
  - NODE_ENV=${NODE_ENV}
```

## Production Deployment

For production deployment, consider:

1. **Using a reverse proxy** (Nginx or Traefik) in front of both services
2. **Setting up SSL/TLS** with Let's Encrypt
3. **Using environment-specific URLs** for the API
4. **Enabling logging to external services**
5. **Setting up monitoring** with Prometheus/Grafana
6. **Using orchestration** (Kubernetes, Docker Swarm) for scaling

## Image Sizes

The Docker images are optimized:
- Backend: ~150MB (Alpine-based Node.js)
- Frontend: ~25MB (Nginx Alpine with static files)

## Network

Both services communicate through a custom bridge network (`moneyguesser-network`) for isolated and secure communication.
