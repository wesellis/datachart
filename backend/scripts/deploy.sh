#!/bin/bash
# Production Deployment Script for DataChart SaaS

set -e  # Exit on any error

echo "🚀 Starting DataChart SaaS Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check required environment variables
check_env() {
    if [ -z "${DATABASE_URL}" ]; then
        print_error "DATABASE_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "${SECRET_KEY}" ]; then
        print_error "SECRET_KEY environment variable is required"  
        exit 1
    fi
    
    print_status "Environment variables validated"
}

# Install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    sudo apt-get update
    sudo apt-get install -y \
        postgresql-client \
        redis-tools \
        nginx \
        supervisor \
        python3 \
        python3-pip \
        python3-venv \
        curl \
        git
    
    print_status "System dependencies installed"
}

# Setup Python virtual environment
setup_venv() {
    print_status "Setting up Python virtual environment..."
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    print_status "Python environment ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    source venv/bin/activate
    
    # Test database connection
    python -c "from app.database import test_db_connection; assert test_db_connection(), 'Database connection failed'"
    
    # Run migrations
    alembic upgrade head
    
    print_status "Database migrations completed"
}

# Setup systemd service
setup_service() {
    print_status "Setting up systemd service..."
    
    APP_DIR=$(pwd)
    USER=$(whoami)
    
    sudo tee /etc/systemd/system/datachart.service > /dev/null <<EOF
[Unit]
Description=DataChart SaaS API
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=$USER
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv/bin
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
KillMode=mixed
TimeoutStopSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable datachart.service
    
    print_status "Systemd service configured"
}

# Setup nginx reverse proxy
setup_nginx() {
    print_status "Setting up Nginx reverse proxy..."
    
    sudo tee /etc/nginx/sites-available/datachart > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # Change this to your domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
    }
    
    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }
    
    # Static files (if any)
    location /static/ {
        alias $APP_DIR/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    sudo ln -sf /etc/nginx/sites-available/datachart /etc/nginx/sites-enabled/
    sudo nginx -t
    
    print_status "Nginx configuration complete"
}

# Setup SSL with certbot (optional)
setup_ssl() {
    if command -v certbot &> /dev/null; then
        print_warning "Certbot found. Run 'sudo certbot --nginx' manually after deployment"
    else
        print_warning "Install certbot for SSL: sudo apt install certbot python3-certbot-nginx"
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up basic monitoring..."
    
    # Setup logrotate
    sudo tee /etc/logrotate.d/datachart > /dev/null <<EOF
/var/log/datachart/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF
    
    # Create log directory
    sudo mkdir -p /var/log/datachart
    sudo chown $USER:$USER /var/log/datachart
    
    print_status "Monitoring setup complete"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    sudo systemctl start datachart
    sudo systemctl restart nginx
    
    # Wait for service to start
    sleep 5
    
    # Check if service is running
    if systemctl is-active --quiet datachart; then
        print_status "DataChart service is running"
    else
        print_error "DataChart service failed to start"
        sudo journalctl -u datachart --lines 20
        exit 1
    fi
    
    print_status "All services started successfully"
}

# Health check
health_check() {
    print_status "Running health check..."
    
    # Wait a moment for services to fully start
    sleep 10
    
    # Test API endpoint
    if curl -f -s http://localhost:8000/health > /dev/null; then
        print_status "Health check passed"
    else
        print_error "Health check failed"
        exit 1
    fi
}

# Main deployment flow
main() {
    echo "DataChart SaaS Production Deployment"
    echo "========================================"
    
    # Load environment variables
    if [ -f ".env" ]; then
        source .env
        print_status "Environment variables loaded from .env"
    else
        print_warning "No .env file found. Make sure environment variables are set."
    fi
    
    # Run deployment steps
    check_env
    install_dependencies
    setup_venv
    run_migrations
    setup_service
    setup_nginx
    setup_ssl
    setup_monitoring
    start_services
    health_check
    
    echo "========================================"
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your domain in /etc/nginx/sites-available/datachart"
    echo "2. Run 'sudo certbot --nginx' for SSL"
    echo "3. Update CORS_ORIGINS in your .env file"
    echo "4. Monitor logs: sudo journalctl -u datachart -f"
    echo "5. Check status: sudo systemctl status datachart"
    echo ""
    print_status "Your DataChart SaaS is now running!"
}

# Run main function
main "$@"