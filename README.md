# RetroRewind: Nostalgic Game/Movie Tracker

**Team Bear 180** - CS180
Diego Juarez, Alexander Chavez, Allen Biju, Leslie Villalta

A web app for tracking and rating nostalgic games and movies.

---

## Features

- User registration and login
- Search for games and movies
- Add items to your personal library
- Rate and review media with 1-5 stars
- Filter search results by type, year, and platform
- User profiles with bio and avatar

---

## Prerequisites

Install these before starting:

- **Python 3.10+**
- **Node.js 18+**
- **Git**

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/djuar047/CS180RetroRewind.git
cd CS180RetroRewind
```

### 2. Install Backend Dependencies
```bash
pip install flask flask-cors pymongo requests bcrypt python-dotenv
```

### 3. Install Frontend Dependencies
```bash
cd retrorewind-frontend
npm install
```

---

## Configuration

Create a file named `.env` in the root directory (same level as `app.py`) and add:
```
CLIENT_ID=8e7zlhcv2vkiih8l9fa1j0v3dvi11i
CLIENT_SECRET=v0wy5tkd7sqortwru98lcjtgz0mwf8
MONGO_URI=mongodb+srv://Cluster52873:fUxudFp%2BUXx2@cluster52873.cjyxx8v.mongodb.net/retro_rewind?retryWrites=true&w=majority
OMDB_API_KEY=5db94d70
SECONDARY_DB_URI=mongodb+srv://Cluster52873:fUxudFp%2BUXx2@cluster52873.cjyxx8v.mongodb.net/?appName=Cluster52873
```

---

## Running the Application

### Start the Backend

Open a terminal and run:
```bash
python app.py
```

You should see: `* Running on http://127.0.0.1:5000`

### Start the Frontend

Open a **new terminal** and run:
```bash
cd retrorewind-frontend/src
npm run dev
```

You should see: `Local: http://localhost:5173/`

### Access the App

Open your browser and go to: **http://localhost:5173**

---

## Running Tests

### Backend Tests

Make sure the backend is running, then open a new terminal:
```bash
python testing.py
```
Expected: All tests should pass

### Frontend Tests
```bash
cd retrorewind-frontend/src
npm test
```
Expected: All tests should pass
---

## Usage

1. **Create Account**: Click "Create Account" and register
2. **Login**: Enter your email and password
3. **Search**: Type a game or movie name and click "Search"
4. **Add to Library**: Click "Add to Library" on any search result
5. **Rate**: Click "Rate ★" to give stars and write a review
6. **View Profile**: Click "Profile" to see your library and ratings
7. **Community Thread**: Share a comment about a movie or game and see comments from other users

---

## Team

- **Allen Biju** (abiju009@ucr.edu)
- **Diego Juarez** (djuar047@ucr.edu)
- **Alexander Chavez** (achav239@ucr.edu)
- **Leslie Villalta** (lvill116@ucr.edu)

---

## Tech Stack

**Backend:** Python, Flask-CORS, MongoDB  
**Frontend:** JavaScript, React, Tailwind CSS  
**APIs:** IGDB (games), OMDb (movies)
