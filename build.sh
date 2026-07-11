#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Building frontend..."
npm install --prefix frontend
npm run build --prefix frontend

echo "Installing backend dependencies..."
pip install -r backend/requirements.txt
