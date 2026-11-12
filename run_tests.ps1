# Run all tests for the Men.AI project

Write-Host "============================================"
Write-Host "Men.AI Test Suite"
Write-Host "============================================"

# Backend tests
Write-Host ""
Write-Host "=== Backend Tests ==="
Set-Location backend
Write-Host "Installing backend dependencies..."
pip install -r requirements.txt -q

Write-Host "Running backend tests..."
pytest tests/ -v --tb=short

Set-Location ..

# Frontend tests
Write-Host ""
Write-Host "=== Frontend Tests ==="
Set-Location frontend
Write-Host "Installing frontend dependencies..."
npm ci

Write-Host "Running frontend tests..."
npm run test:run

Set-Location ..

Write-Host ""
Write-Host "============================================"
Write-Host "All tests completed successfully!"
Write-Host "============================================"