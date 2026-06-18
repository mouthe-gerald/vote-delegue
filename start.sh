#!/bin/bash
echo "Demarrage de VotingApp..."

# Tuer les processus existants
pkill -f "manage.py runsslserver" 2>/dev/null
pkill -f vite 2>/dev/null
sleep 2

# Backend Django SSL
gnome-terminal --title="Backend Django" -- bash -c "
cd ~/vote_delegue/backend
source venv/bin/activate
python manage.py runsslserver 0.0.0.0:8000 \
  --certificate /home/leslie/vote_delegue/ssl/cert.pem \
  --key /home/leslie/vote_delegue/ssl/key.pem
exec bash"

# Frontend Vite
gnome-terminal --title="Frontend Vite" -- bash -c "
cd ~/vote_delegue/frontend
npm run dev -- --host
exec bash"

echo "VotingApp demarre !"
echo "PC    : https://localhost:5173"
echo "Mobile: https://192.168.11.203:5173"
