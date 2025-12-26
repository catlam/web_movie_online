Web Movie Project

Introduction
Web Movie is a web application consisting of three main components: client, server, and recommender system.

Project Structure
web_movie

client

server

recommender

README.md

System Requirements
Node.js >= 18
Python >= 3.11
Git
Docker & Docker Compose (optional, for Docker run)

How to Run the Project (Without Docker)

Clone the project

git clone https://github.com/username/web_movie.git

cd web_movie

Run Backend (Server)

cd server
npm install
npm run dev

The server will run at http://localhost:3000

Run Frontend (Client)

cd client
npm install
npm run start

The client will run at http://localhost:3000
 or http://localhost:5173

Run Recommender System (Python)

Important Note
The venv311 directory is NOT included in the repository.
Each user must create the virtual environment locally.

Create virtual environment

cd recommender
python -m venv venv311

Activate virtual environment (Windows PowerShell)

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv311\Scripts\Activate.ps1

Install dependencies

pip install -r requirements.txt

Run recommender API

python -m uvicorn serve_api:app --reload --port 8002

The recommender API will run at http://localhost:8002

Recommended Run Order

Server

Recommender

Client

Run the Project Using Docker

Requirements
Docker and Docker Compose must be installed.

From the web_movie directory, run

docker-compose up --build

Services and Ports
Client: port 3000
Server: port 3001
Recommender: port 8002

Stop Docker containers

docker-compose down

Notes
Do not upload the venv311 directory
If PowerShell execution is blocked, use the ExecutionPolicy command above
If a port is already in use, change the port in configuration or run commands