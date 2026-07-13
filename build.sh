#!/usr/bin/env bash
# exit on error
set -o errexit

if command -v npm >/dev/null 2>&1; then
    echo "Building frontend..."
    npm install --prefix frontend
    npm run build --prefix frontend
else
    echo "npm not found, skipping frontend build."
fi

if command -v pip >/dev/null 2>&1; then
    echo "Installing backend dependencies..."
    pip install -r backend/requirements.txt
else
    echo "pip not found, skipping backend dependencies installation."
fi
