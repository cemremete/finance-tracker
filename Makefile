# Finance Tracker - Makefile
# Common commands for development and deployment

.PHONY: help install dev test build deploy clean

# Default target
help:
	@echo "Finance Tracker - Available Commands"
	@echo "====================================="
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start all services locally with docker-compose"
	@echo "  make dev-down     - Stop all local services"
	@echo "  make logs         - View docker-compose logs"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-auth    - Run auth-service tests"
	@echo "  make lint         - Run linters"
	@echo ""
	@echo "Building:"
	@echo "  make build        - Build all Docker images"
	@echo "  make build-auth   - Build auth-service image"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed database with test data"
	@echo "  make db-reset     - Reset database (rollback + migrate + seed)"
	@echo ""
	@echo "Kubernetes:"
	@echo "  make k8s-dev      - Deploy to dev environment"
	@echo "  make k8s-staging  - Deploy to staging environment"
	@echo "  make k8s-prod     - Deploy to production environment"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Remove build artifacts and containers"

# ============================================
# Development
# ============================================

install:
	cd services/auth-service && npm install
	@echo "Dependencies installed"

dev:
	docker-compose up -d
	@echo "Services started. Auth service available at http://localhost:3001"

dev-build:
	docker-compose up -d --build
	@echo "Services rebuilt and started"

dev-down:
	docker-compose down
	@echo "Services stopped"

logs:
	docker-compose logs -f

logs-auth:
	docker-compose logs -f auth-service

# ============================================
# Testing
# ============================================

test: test-auth
	@echo "All tests completed"

test-auth:
	cd services/auth-service && npm test

lint:
	cd services/auth-service && npm run lint

# ============================================
# Building
# ============================================

build: build-auth
	@echo "All images built"

build-auth:
	docker build -t finance-tracker/auth-service:latest ./services/auth-service
	@echo "Auth service image built"

# ============================================
# Database
# ============================================

migrate:
	cd services/auth-service && npm run migrate

seed:
	cd services/auth-service && npm run seed

db-reset:
	cd services/auth-service && npm run migrate:rollback
	cd services/auth-service && npm run migrate
	cd services/auth-service && npm run seed
	@echo "Database reset complete"

# ============================================
# Kubernetes
# ============================================

k8s-dev:
	kubectl apply -k kubernetes/overlays/dev
	@echo "Deployed to dev environment"

k8s-staging:
	kubectl apply -k kubernetes/overlays/staging
	@echo "Deployed to staging environment"

k8s-prod:
	@echo "WARNING: Deploying to production!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	kubectl apply -k kubernetes/overlays/production
	@echo "Deployed to production environment"

k8s-status:
	kubectl get pods -n finance-tracker
	kubectl get services -n finance-tracker

# ============================================
# Cleanup
# ============================================

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f
	rm -rf services/*/node_modules
	rm -rf services/*/coverage
	rm -rf services/*/__pycache__
	@echo "Cleanup complete"
