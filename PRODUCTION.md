# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Inventory Hub application in production using Docker.

## Quick Start

### 1. Prepare Environment Variables

Create a `.env.prod` file in the root directory:

```bash
# Database
DB_PASSWORD=your_secure_password_here

# Stack Auth
STACK_SECRET_SERVER_KEY=your_secret_server_key
REACT_APP_STACK_PROJECT_ID=your_project_id
REACT_APP_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key

# API Configuration
REACT_APP_API_URL=http://your-domain.com:5000

# Ports (optional)
BACKEND_PORT=5000
FRONTEND_PORT=80
DB_PORT=5432
```

### 2. Deploy

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Access

- **Frontend**: http://localhost (or your configured port)
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432 (internal only)

## Architecture

### Services

1. **PostgreSQL** (`inventory_postgres_prod`)
   - Database server
   - Persistent volume: `postgres_data_prod`
   - Health checks enabled

2. **Backend** (`inventory_backend_prod`)
   - Node.js/Express API server
   - Serves API endpoints
   - Persistent volume: `uploads_prod` for uploaded images

3. **Frontend** (`inventory_frontend_prod`)
   - React app built and served via nginx
   - Optimized production build
   - Gzip compression and caching enabled

### Network

All services communicate via the `inventory_network` Docker bridge network.

## Management Commands

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Stop and Remove Volumes (⚠️ Deletes Data)
```bash
docker-compose -f docker-compose.prod.yml down -v
```

### Rebuild After Code Changes
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Execute Commands in Containers
```bash
# Backend shell
docker exec -it inventory_backend_prod sh

# Database shell
docker exec -it inventory_postgres_prod psql -U inventory_app -d inventory_app
```

## Backup & Restore

### Backup Database
```bash
docker exec inventory_postgres_prod pg_dump -U inventory_app inventory_app > backup.sql
```

### Restore Database
```bash
docker exec -i inventory_postgres_prod psql -U inventory_app inventory_app < backup.sql
```

### Backup Uploads
```bash
docker cp inventory_backend_prod:/app/uploads ./uploads_backup
```

## Production Considerations

### 1. API URL Configuration

The `REACT_APP_API_URL` must be accessible from the browser. Options:

- **Same Domain**: If frontend and backend are on the same domain, use relative URLs or configure nginx as reverse proxy
- **Different Domains**: Use full URL (e.g., `https://api.yourdomain.com`)
- **Docker Host**: If accessing from outside Docker, use host IP or domain

### 2. HTTPS/SSL

For production, add a reverse proxy (nginx, Traefik, Caddy) with SSL certificates:

```nginx
# Example nginx reverse proxy configuration
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;  # Frontend
    }
    
    location /api {
        proxy_pass http://localhost:5000;  # Backend
    }
}
```

### 3. Database Security

- Use strong passwords
- Consider using Docker secrets for sensitive data
- Restrict database port exposure (remove from docker-compose if not needed externally)
- Enable PostgreSQL SSL connections for remote access

### 4. Monitoring

Consider adding:
- Health check endpoints
- Log aggregation (ELK, Loki)
- Monitoring (Prometheus, Grafana)
- Error tracking (Sentry)

### 5. Scaling

For high traffic:
- Use a load balancer for multiple backend instances
- Consider database connection pooling
- Use CDN for static assets
- Implement caching strategies

## Troubleshooting

### Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker exec -it inventory_postgres_prod psql -U inventory_app -d inventory_app -c "SELECT 1;"
```

### Frontend Not Loading
```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs frontend

# Verify build
docker exec -it inventory_frontend_prod ls -la /usr/share/nginx/html
```

### Backend API Errors
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Verify environment variables
docker exec -it inventory_backend_prod env | grep DB_
```

### Port Conflicts

If ports are already in use, update `.env.prod`:
```bash
BACKEND_PORT=5001
FRONTEND_PORT=8080
DB_PORT=5433
```

## Updates

To update the application:

1. Pull latest code
2. Rebuild containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```
3. Database migrations run automatically on backend startup

## Cleanup

To completely remove everything:

```bash
# Stop and remove containers, networks, and volumes
docker-compose -f docker-compose.prod.yml down -v

# Remove images (optional)
docker rmi inventory-hub_backend inventory-hub_frontend
```
