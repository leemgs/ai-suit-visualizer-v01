# AI Litigation Intelligence Platform (MariaDB Final Version)

A comprehensive system for tracking, processing, and visualizing litigation involving Artificial Intelligence companies. This platform automates the collection of legal dockets from CourtListener and serves them via a modern API, supporting both live data and historical CSV datasets.

## 🖼️ Visual Preview

![Global Litigation Dashboard](file:///work/github/ai-suit-visualizer-v01/image/dashboard.png)
*AI Litigation Intelligence Platform Dashboard*

![API Documentation](file:///work/github/ai-suit-visualizer-v01/image/api_docs.png)
*Standardized API Documentation (Swagger UI)*

![Case Details Table](file:///work/github/ai-suit-visualizer-v01/image/case_list.png)
*Detailed Litigation Case List*

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

---

## 📊 Data Collection & Visualization

The platform provides a dual-method data pipeline to build the raw datasets used by the visualizer.

#### Method 1: Live Data (CourtListener & RECAP)
Fetches live data directly from CourtListener.com/RECAP. This is the default mode.
- **Endpoint**: `GET /api/cases`
- **Logic**: Uses `collector/builder.py` -> `build_from_api()`

#### Method 2: Local CSV Datasets
Processes specific historical datasets stored in the `./data/` directory.
- **Endpoint**: `GET /api/cases?file_name=filename.csv`
- **Logic**: Uses `collector/builder.py` -> `build_from_csv()`

---

## 🛠️ API Documentation

| Endpoint | Description | Parameters |
| :--- | :--- | :--- |
| `GET /api/cases` | Main data endpoint (Live or CSV) | `file_name` (optional) |
| `GET /api/files` | Lists available CSV files in `./data/` | None |
| `GET /api/db-cases`| Fetches cases currently stored in MariaDB | None |
| `/docs` | Interactive Swagger UI | None |

---

## ⚖️ Nature of Suit (NOS) 코드 안내
미국 연방 법원 소송의 성격(Nature of Suit)을 분류하는 코드표입니다.

| NOS 코드 | 의미 | 분류체계 |
| :--- | :--- | :--- |
| 820 | Copyright | 지식재산권 (Intellectual Property) |
| 830 | Patent | 지식재산권 (Intellectual Property) |
| 840 | Trademark | 지식재산권 (Intellectual Property) |
| 3820 | Copyright (Special/Software) | 지식재산권 (Intellectual Property) |
| 17:101 | Copyright Act Definitions | 지식재산권 (Intellectual Property) |
| 820 (820:1) | Copyright - Statutory | 지식재산권 (Intellectual Property) |

---

## 🏗️ Project Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | FastAPI (Python 3.10) | REST API serving case data. |
| **Database** | MariaDB 10.6 | Persistent storage for litigation metadata. |
| **Collector** | Python Requests | Fetches data from CourtListener. |
| **Builder** | Python / Pandas | unifies data from API/CSV for visualizer. |
| **Orchestration** | Docker Compose | Manages containerized services. |

---

## 📂 Project Structure
```text
.
├── backend/            # FastAPI source code
│   └── main.py         # API endpoints and logic
├── collector/          # Data harvesting & processing
│   ├── main.py         # Entry point for DB ingestion
│   ├── builder.py      # Dual-mode data constructor (API/CSV)
│   ├── courtlistener.py# CourtListener API client
│   ├── processor.py    # Company & metadata extraction
│   └── storage.py      # Database injection logic
├── database/           # Database schema definitions
├── docker/             # Docker Compose configuration
└── data/               # Historical datasets (.csv)
```

---

## 🛠️ Maintenance

### Database Inspection
```bash
docker compose -f docker/docker-compose.yml exec mariadb mariadb -u root -ppassword ai_lawsuits
```

### Dependency Management
Edit `docker/docker-compose.yml` to update `pip install` commands, then:
```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### Application Logs
```bash
docker compose -f docker/docker-compose.yml logs -f
```
