#!/bin/bash
set -e

cd /home/eagbaru/NaijaHelp

echo "=== Initialising git ==="
git init

echo "=== Setting user config ==="
git config user.email "ephraimagbaru29@gmail.com"
git config user.name "Ephraim Agbaru"

echo "=== Staging files ==="
git add .

echo "=== Files staged (should NOT include .env) ==="
git status

echo "=== Verifying .env is ignored ==="
git check-ignore -v backend/.env && echo ".env is IGNORED (safe)" || echo "WARNING: .env is not ignored!"

echo "=== Creating initial commit ==="
git commit -m "Initial NaijaHelp project

- Full-stack Nigerian local-services and emergency finder
- Frontend: HTML/CSS/JS (index, services, login, register, dashboard)
- Backend: Node.js, Express, Supabase, JWT auth
- Responsive design, search/filter, CRUD API"

echo "=== Setting branch to main ==="
git branch -M main

echo "=== Adding remote ==="
git remote add origin https://github.com/ephraimagbaru29-star/NaijaHelp.git || git remote set-url origin https://github.com/ephraimagbaru29-star/NaijaHelp.git

echo "=== Pushing to GitHub ==="
git push -u origin main

echo "=== DONE ==="
