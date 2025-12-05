#!/usr/bin/env bash

# go to backend folder
cd "$(dirname "$0")/backend" || exit 1

# activate virtualenv
source .venv/bin/activate

# run Flask app
python app.py

