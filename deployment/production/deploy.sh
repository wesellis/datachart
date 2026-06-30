#!/bin/bash

# DataChart SaaS - Production Deployment Script
# Automated deployment to production environment with safety checks

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DEPLOY_ENV="${1:-production}"
DEPLOY_VERSION="${2:-latest}"
DRY_RUN="${3:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "kubectl" "helm" "aws" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' is not installed"
        fi
    done
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
    fi
    
    # Check environment file
    if [[ ! -f "$SCRIPT_DIR/${DEPLOY_ENV}.env" ]]; then
        log_error "Environment file ${DEPLOY_ENV}.env not found"
    fi
    
    # Check if on production branch for production deployments
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        local current_branch=$(git rev-parse --abbrev-ref HEAD)
        if [[ "$current_branch" != "main" && "$current_branch" != "production" ]]; then
            log_warning "Not on main/production branch (currently on $current_branch)"
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "Deployment cancelled"
            fi
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if services are healthy
    local services=("database" "redis" "elasticsearch")
    for service in "${services[@]}"; do
        log_info "Checking $service health..."
        if ! docker-compose -f "$PROJECT_ROOT/deployment/docker-compose.yml" exec "$service" echo "healthy" &> /dev/null; then
            log_warning "$service is not responding"
        fi
    done
    
    # Run backend tests
    log_info "Running backend tests..."
    cd "$PROJECT_ROOT/backend"
    if ! python -m pytest tests/ -v --tb=short; then
        log_error "Backend tests failed"
    fi
    
    # Run frontend build check
    log_info "Checking frontend build..."
    cd "$PROJECT_ROOT/frontend"
    if ! npm run build; then
        log_error "Frontend build failed"
    fi
    
    # Check for security vulnerabilities
    log_info "Checking for security vulnerabilities..."
    if ! npm audit --audit-level=high; then
        log_warning "Security vulnerabilities found in frontend dependencies"
    fi
    
    cd "$PROJECT_ROOT/backend"
    if ! pip-audit; then
        log_warning "Security vulnerabilities found in backend dependencies"
    fi
    
    log_success "Pre-deployment checks completed"
}

# Build and tag Docker images
build_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend image
    log_info "Building backend image..."
    docker build -f backend/Dockerfile.prod \
        -t "datachart/backend:$DEPLOY_VERSION" \
        -t "datachart/backend:latest" \
        backend/
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -f frontend/Dockerfile.prod \
        -t "datachart/frontend:$DEPLOY_VERSION" \
        -t "datachart/frontend:latest" \
        frontend/
    
    # Tag images for registry
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        docker tag "datachart/backend:$DEPLOY_VERSION" "your-registry.com/datachart/backend:$DEPLOY_VERSION"
        docker tag "datachart/frontend:$DEPLOY_VERSION" "your-registry.com/datachart/frontend:$DEPLOY_VERSION"
    fi
    
    log_success "Docker images built successfully"
}

# Push images to registry
push_images() {
    if [[ "$DEPLOY_ENV" != "production" ]]; then
        log_info "Skipping image push for non-production environment"
        return
    fi
    
    log_info "Pushing images to registry..."
    
    # Login to registry
    # aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-registry.com
    
    # Push images
    docker push "your-registry.com/datachart/backend:$DEPLOY_VERSION"
    docker push "your-registry.com/datachart/frontend:$DEPLOY_VERSION"
    
    log_success "Images pushed to registry"
}

# Database migration
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if dry run
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would run database migrations"
        return
    fi
    
    # Run Alembic migrations
    docker-compose -f "$PROJECT_ROOT/deployment/docker-compose.yml" \
        exec backend alembic upgrade head
    
    log_success "Database migrations completed"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT/deployment"
    
    # Copy environment file
    cp "$SCRIPT_DIR/${DEPLOY_ENV}.env" .env
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy with Docker Compose"
        return
    fi
    
    # Pull latest images
    docker-compose pull
    
    # Deploy services with rolling update
    docker-compose up -d --remove-orphans --force-recreate
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Attempt $attempt/$max_attempts - waiting for backend..."
        sleep 10
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Services failed to become healthy"
    fi
    
    log_success "Docker Compose deployment completed"
}

# Deploy with Kubernetes
deploy_kubernetes() {
    log_info "Deploying with Kubernetes..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy to Kubernetes"
        return
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
    fi
    
    # Create namespace if it doesn't exist
    kubectl create namespace datachart --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configuration maps and secrets
    kubectl apply -f "$PROJECT_ROOT/deployment/kubernetes/" -n datachart
    
    # Deploy application
    helm upgrade --install datachart \
        "$PROJECT_ROOT/deployment/helm/datachart" \
        --namespace datachart \
        --values "$SCRIPT_DIR/helm-values-${DEPLOY_ENV}.yaml" \
        --set image.tag="$DEPLOY_VERSION" \
        --wait --timeout=600s
    
    # Wait for rollout to complete
    kubectl rollout status deployment/backend-deployment -n datachart
    kubectl rollout status deployment/frontend-deployment -n datachart
    
    log_success "Kubernetes deployment completed"
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."
    
    local api_url="http://localhost:8000"
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        api_url="https://api.datachart.app"
    fi
    
    # Health check
    if ! curl -f "$api_url/health" &> /dev/null; then
        log_error "Health check failed"
    fi
    
    # API functionality test
    local auth_response=$(curl -s -X POST "$api_url/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"testpassword"}')
    
    if [[ -z "$auth_response" ]]; then
        log_warning "API authentication test failed"
    fi
    
    # Database connectivity test
    if ! curl -f "$api_url/api/v1/health/database" &> /dev/null; then
        log_error "Database connectivity test failed"
    fi
    
    # Redis connectivity test
    if ! curl -f "$api_url/api/v1/health/redis" &> /dev/null; then
        log_error "Redis connectivity test failed"
    fi
    
    log_success "Deployment verification completed"
}

# Send deployment notification
send_notification() {
    log_info "Sending deployment notification..."
    
    local status="$1"
    local slack_webhook="${SLACK_WEBHOOK_URL:-}"
    
    if [[ -z "$slack_webhook" ]]; then
        log_warning "No Slack webhook configured, skipping notification"
        return
    fi
    
    local color="good"
    local emoji=":white_check_mark:"
    if [[ "$status" != "success" ]]; then
        color="danger"
        emoji=":x:"
    fi
    
    local message="$emoji DataChart deployment to $DEPLOY_ENV $status"
    local payload=$(jq -n \
        --arg channel "#deployments" \
        --arg username "Deploy Bot" \
        --arg color "$color" \
        --arg message "$message" \
        --arg version "$DEPLOY_VERSION" \
        --arg environment "$DEPLOY_ENV" \
        '{
            channel: $channel,
            username: $username,
            attachments: [{
                color: $color,
                title: $message,
                fields: [
                    {title: "Environment", value: $environment, short: true},
                    {title: "Version", value: $version, short: true}
                ],
                ts: now
            }]
        }')
    
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$slack_webhook"
    
    log_success "Notification sent"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    if command -v helm &> /dev/null; then
        helm rollback datachart -n datachart
    else
        # Docker Compose rollback
        git checkout HEAD~1
        docker-compose up -d --force-recreate
    fi
    
    log_success "Rollback completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove old Docker images
    docker image prune -f --filter "until=24h"
    
    # Clean up temporary files
    rm -f "$PROJECT_ROOT/deployment/.env"
    
    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting DataChart deployment to $DEPLOY_ENV (version: $DEPLOY_VERSION)"
    
    # Set error handler
    trap 'log_error "Deployment failed! Check logs above."; send_notification "failed"; exit 1' ERR
    
    # Show dry run notice
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Run deployment steps
    check_prerequisites
    pre_deployment_checks
    build_images
    
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        push_images
    fi
    
    run_migrations
    
    # Choose deployment method
    if [[ -f "$PROJECT_ROOT/deployment/kubernetes/production-deployment.yaml" ]] && command -v kubectl &> /dev/null; then
        deploy_kubernetes
    else
        deploy_docker_compose
    fi
    
    verify_deployment
    cleanup
    send_notification "success"
    
    log_success "Deployment completed successfully!"
    
    # Show access URLs
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        echo
        echo "🚀 Production URLs:"
        echo "   Frontend: https://app.datachart.app"
        echo "   API:      https://api.datachart.app"
        echo "   Admin:    https://admin.datachart.app"
        echo "   Docs:     https://docs.datachart.app"
    else
        echo
        echo "🚀 Local URLs:"
        echo "   Frontend: http://localhost:3000"
        echo "   API:      http://localhost:8000"
        echo "   Docs:     http://localhost:8000/docs"
    fi
}

# Handle command line arguments
case "${1:-help}" in
    production|staging|development)
        main "$@"
        ;;
    rollback)
        rollback
        ;;
    help)
        echo "Usage: $0 [environment] [version] [dry_run]"
        echo
        echo "Commands:"
        echo "  production   Deploy to production environment"
        echo "  staging      Deploy to staging environment"
        echo "  development  Deploy to development environment"
        echo "  rollback     Rollback to previous version"
        echo "  help         Show this help message"
        echo
        echo "Options:"
        echo "  version      Docker image version tag (default: latest)"
        echo "  dry_run      true/false - show what would be done (default: false)"
        echo
        echo "Examples:"
        echo "  $0 production v1.2.3"
        echo "  $0 staging latest true"
        echo "  $0 rollback"
        ;;
    *)
        log_error "Unknown command: $1. Use '$0 help' for usage information."
        ;;
esac