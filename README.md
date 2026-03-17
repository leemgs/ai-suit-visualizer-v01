
# AI Litigation Intelligence Platform (MariaDB Final Version)

A comprehensive system for tracking, processing, and visualizing litigation involving Artificial Intelligence companies. This platform automates the collection of legal dockets from CourtListener and serves them via a modern API.

## 🚀 Quick Start (Ubuntu 24.04)

Follow these steps to reproduce the environment and output on a fresh Ubuntu 24.04 installation.

### 1. Prerequisites
Install Docker and Git:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# Note: You may need to restart your session for group changes to take effect.
```

### 2. Setup Directory Structure
Clone the repository and prepare the database initialization script:
```bash
git clone https://github.com/leemgs/ai-suit-visualizer-v01.git
cd ai-suit-visualizer-v01

# Ensure MariaDB can find the schema.sql file
mkdir -p docker/database
cp database/schema.sql docker/database/
```

### 3. Launch Services
Start the MariaDB database and FastAPI backend using Docker Compose:
```bash
docker compose -f docker/docker-compose.yml up -d
```
*The services will be available at:*
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Data Collection & Visualization Options
The platform supports two methods for building raw data:

#### Method 1: Live Data (CourtListener & RECAP)
By default, the API will fetch live data directly from CourtListener.com/RECAP if no file is specified.
```bash
# Fetch live data from API
curl http://localhost:8000/api/cases
```

#### Method 2: Local CSV Files
If you choose a file from the `./data/*.csv` directory, the visualizer will build the map from that specific file.
```bash
# List available data files
curl http://localhost:8000/api/files

# Fetch data from a specific CSV (e.g., aisuit_20260313.csv)
curl "http://localhost:8000/api/cases?file_name=aisuit_20260313.csv"
```

---

## 🏗️ Project Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | FastAPI (Python 3.10) | REST API serving case data from MariaDB. |
| **Database** | MariaDB 10.6 | Relational storage for dockets and litigation metadata. |
| **Collector** | Requests / Processor | Fetches data from CourtListener and identifies AI companies. |
| **Orchestration** | Docker Compose | Manages containerized services and networking. |

---

## 📂 Project Structure
```text
.
├── backend/            # FastAPI source code
│   └── main.py         # API endpoints and DB connection
├── collector/          # Data harvesting logic
│   ├── main.py         # Entry point for data collection
│   ├── courtlistener.py# API client for CourtListener
│   ├── processor.py    # Company detection logic
│   └── storage.py      # Database injection logic
├── database/           # Database schema definitions
├── docker/             # Docker Compose configuration
└── data/               # Archived datasets (e.g., aisuit_20260313.csv)
```

---

## 🛠️ Maintenance & Reproduction

### Reproducing Output
To verify the system is working correctly:
1. Visit `http://localhost:8000/api/cases` in your browser.
2. You should see a JSON array of cases, including fields like `case_name`, `company`, `court`, and `file_date`.
3. Major companies like **OpenAI**, **Google**, and **Meta** are automatically tagged in the `company` field.

### Database Management
To inspect the database manually:
```bash
docker compose -f docker/docker-compose.yml exec mariadb mariadb -u root -ppassword ai_lawsuits
```

### Updating Dependencies
The backend installs dependencies at startup. If you need to add more:
1. Edit `docker/docker-compose.yml`.
2. Update the `pip install` command.
3. Restart the container: `docker compose -f docker/docker-compose.yml up -d --build`.

### Logs
Monitor application logs for troubleshooting:
```bash
docker compose -f docker/docker-compose.yml logs -f
```
