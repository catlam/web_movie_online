# 🎬 Web Movie Project
> A full-stack web application for movie streaming with a recommendation system.

---

## 📖 Overview
Web Movie is a web application consisting of three main components:
- Client (Frontend)
- Server (Backend API)
- Recommender System (Python – FastAPI)

---

## 🚀 Features
- Movie browsing and streaming
- User authentication
- Movie recommendation system
- RESTful API architecture

---

## 🧱 Tech Stack
- Frontend: Node.js
- Backend: Node.js (Express)
- Recommender: Python, FastAPI, Uvicorn
- Database: MySQL / MongoDB
- Containerization: Docker

---

## 📁 Project Structure
web_movie
├── client
├── server
├── recommender
└── README.md

---

## ⚙️ System Requirements
- Node.js >= 18
- Python >= 3.11
- Git
- Docker & Docker Compose (optional)

---

## ▶️ Getting Started (Without Docker)

### 1. Clone the repository
git clone https://github.com/catlam/web_movie_online.git

cd web_movie

### 2. Run Backend
cd server
npm install
npm run dev

### 3. Run Frontend
cd client
npm install
npm run start

### 4. Run Recommender System
> The `venv311` directory is NOT included in the repository.

cd recommender
python -m venv venv311
.\venv311\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn serve_api:app --reload --port 8002

---

## 🐳 Running with Docker

docker-compose up --build

---

## 🔁 Recommended Run Order
1. Server  
2. Recommender  
3. Client  

---

## 📝 Notes
- Do not upload the `venv311` directory
- If PowerShell execution is blocked, use ExecutionPolicy Bypass
- Change ports if they are already in use
