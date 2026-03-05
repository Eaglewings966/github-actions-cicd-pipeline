#!/bin/bash
# Deployment Script
# Author: Emmanuel Ubani - Cloud & DevOps Engineer

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
APP_NAME="emmanuel-cicd-app"
AWS_REGION="us-east-1"
ECR_REPOSITORY="emmanuel-app"
ECS_CLUSTER="emmanuel-cluster"
ECS_SERVICE="emmanuel-service"

# Functions
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

    command -v aws >/dev/null 2>&1 || \
        log_error "AWS CLI not installed"
    command -v docker >/dev/null 2>&1 || \
        log_error "Docker not installed"

    log_success "All prerequisites met"
}

# Login to ECR
login_ecr() {
    log_info "Logging into Amazon ECR..."

    AWS_ACCOUNT_ID=$(aws sts get-caller-identity \
        --query Account \
        --output text)

    ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    aws ecr get-login-password \
        --region ${AWS_REGION} | \
        docker login \
        --username AWS \
        --password-stdin ${ECR_REGISTRY}

    log_success "Successfully logged into ECR"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."

    IMAGE_TAG=$(git rev-parse --short HEAD)
    FULL_IMAGE_NAME="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

    docker build \
        -t ${FULL_IMAGE_NAME} \
        -f docker/Dockerfile \
        .

    log_success "Docker image built: ${FULL_IMAGE_NAME}"
}

# Push image to ECR
push_image() {
    log_info "Pushing image to ECR..."

    docker push ${FULL_IMAGE_NAME}
    docker tag ${FULL_IMAGE_NAME} \
        ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
    docker push \
        ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

    log_success "Image pushed to ECR successfully"
}

# Deploy to ECS
deploy_ecs() {
    log_info "Deploying to ECS..."

    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --force-new-deployment \
        --region ${AWS_REGION}

    log_info "Waiting for deployment to complete..."

    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION}

    log_success "Deployment completed successfully!"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "  Emmanuel Ubani - Deploy Script  "
    echo "  Cloud & DevOps Engineer         "
    echo "=================================="
    echo -e "${NC}"

    check_prerequisites
    login_ecr
    build_image
    push_image
    deploy_ecs

    echo -e "${GREEN}"
    echo "=================================="
    echo "  Deployment Successful! 🚀       "
    echo "=================================="
    echo -e "${NC}"
}

main "$@" 