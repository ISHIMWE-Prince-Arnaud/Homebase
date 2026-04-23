# Health Checks

## Endpoints

| Endpoint | Use Case |
|----------|----------|
| `GET /health` | General status with all indicators |
| `GET /health/live` | Kubernetes liveness probe (app running) |
| `GET /health/ready` | Kubernetes readiness probe (app + DB ready) |

## Health Indicators

### Database
- **Check**: Prisma connection query (`SELECT 1`)
- **Critical**: Yes
- **Response**: `{ status: 'up', responseTime: '12ms' }` or `{ status: 'down', message: '...' }`

### WebSocket
- **Check**: RealtimeService server status
- **Critical**: No
- **Response**: `{ status: 'up', connections: 3 }` or `{ status: 'down' }`

### Memory
- **Check**: Process memory usage
- **Critical**: No
- **Response**: `{ status: 'up', used: '125MB', total: '512MB', percentage: '24%' }`
- **Threshold**: Warns if heap usage > 90%

## Response Format

### Healthy Response (200 OK)

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up", "responseTime": "12ms" },
    "memory": { "status": "up", "used": "125MB", "total": "512MB", "percentage": "24%" },
    "websocket": { "status": "up", "connections": 3 }
  },
  "details": {
    "database": { "status": "up", "responseTime": "12ms" },
    "memory": { "status": "up", "used": "125MB", "total": "512MB", "percentage": "24%" },
    "websocket": { "status": "up", "connections": 3 }
  }
}
```

### Unhealthy Response (503 Service Unavailable)

```json
{
  "status": "error",
  "info": {
    "database": { "status": "up" }
  },
  "error": {
    "websocket": { "status": "down", "message": "Socket.IO server not initialized" }
  },
  "details": {
    "database": { "status": "up" },
    "websocket": { "status": "down" }
  }
}
```

## Monitoring Integration

### Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Docker Compose

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 3s
  retries: 3
```

## Rate Limiting

Health endpoints are excluded from rate limiting using `@SkipThrottle()` decorator to allow monitoring tools to check status without being throttled.

## Testing

```bash
# Check overall health
curl http://localhost:3000/health

# Check liveness
curl http://localhost:3000/health/live

# Check readiness
curl http://localhost:3000/health/ready
```
