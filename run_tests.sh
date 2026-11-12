#!/bin/bash
# Run all tests for the Men.AI project

set -e

echo "============================================"
echo "Men.AI Test Suite"
echo "============================================"

# Backend tests
echo ""
echo "=== Backend Tests ==="
cd backend
echo "Installing backend dependencies..."
pip install -r requirements.txt -q

echo "Running backend tests..."
pytest tests/ -v --tb=short

cd ..

# Frontend tests
echo ""
echo "=== Frontend Tests ==="
cd frontend
echo "Installing frontend dependencies..."
npm ci

echo "Running frontend tests..."
npm run test:run

cd ..

echo ""
echo "============================================"
echo "All tests completed successfully!"
echo "============================================"