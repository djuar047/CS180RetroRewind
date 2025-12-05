#!/bin/bash

echo "=============================="
echo " RetroRewind Setup (Mac/Linux)"
echo "=============================="

# ---- Check Python ----
if ! command -v python3 &> /dev/null
then
    echo "Python3 not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install python
    else
        sudo apt update
        sudo apt install -y python3 python3-venv python3-pip
    fi
else
    echo "Python found: $(python3 --version)"
fi

# ---- Install  backend dependencies ----
echo "Installing required packages..."
pip install --upgrade pip
pip install flask flask_cors pymongo python-dotenv requests 

# ---- Create .env if missing ----
if [ ! -f .env ]; then
    echo "Creating .env..."
    echo "MONGO_URI=mongodb://localhost:27017/retrorewind" > .env
fi

echo ""
echo "Checking for Node.js..."
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    else
        sudo apt update
        sudo apt install -y nodejs npm
    fi
else
    echo "Node found: $(node -v)"
fi

echo ""
echo "Installing frontend dependencies..."
cd retrorewind-frontend/ || { echo "Frontend folder missing!"; exit 1; }

npm install
npm install vite

echo "=============================="
echo "Installation complete!"
echo "To run the server:"
echo
echo "    cd backend/"
echo "    python3 app.py"
echo "On a different terminal..."
echo "    cd retrorewind-frontend/"
echo "     npm run dev"
echo
echo "=============================="
echo ""
echo "Starting backend in new Terminal window..."
osascript -e 'tell application "Terminal"
    do script "cd '"$(pwd)"'/backend && ./run_backend.sh"
end tell'

echo "Starting frontend in new Terminal window..."
osascript -e 'tell application "Terminal"
    do script "cd '"$(pwd)"'/retrorewind-frontend && ./run_frontend.sh"
end tell'
