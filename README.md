# AI 소송 인텔리전스 플랫폼 (MariaDB 최종 버전)

인공지능(AI) 관련 소송을 추적, 처리 및 시각화하기 위한 종합 시스템입니다. 이 플랫폼은 CourtListener에서 법적 문서를 수집하는 과정을 자동화하고, 실시간 데이터와 과거 CSV 데이터셋을 모두 지원하는 현대적인 인터랙티브 대시보드를 제공합니다.

## 🖼️ 시각적 미리보기

![글로벌 소송 대시보드](image/dashboard.png)

*AI 소송 인텔리전스 플랫폼 대시보드*

![미국 지도 시각화](image/case_list.png)

*AI 소송의 인터랙티브 미국 지도*


## 🚀 빠른 시작 (Ubuntu 24.04)

새로 설치된 Ubuntu 24.04 환경에서 환경을 재현하고 결과를 확인하려면 다음 단계를 따르세요.

### 1. 사전 요구 사항
Docker 및 Git 설치:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# 참고: 그룹 변경을 적용하려면 세션을 다시 시작해야 할 수도 있습니다.
```

### 2. 디렉토리 구조 설정
저장소를 복제하고 데이터베이스 초기화 스크립트를 준비합니다:
```bash
git clone https://github.com/leemgs/ai-suit-visualizer-v01.git
cd ai-suit-visualizer-v01

# MariaDB가 schema.sql 파일을 찾을 수 있도록 설정
mkdir -p docker/database
cp database/schema.sql docker/database/
```

### 3. 서비스 실행
Docker Compose를 사용하여 MariaDB 데이터베이스와 FastAPI 백엔드를 시작합니다:  
```bash
docker-compose -f docker/docker-compose.yml up -d
```
*서비스는 다음 주소에서 사용할 수 있습니다:*
- **웹 대시보드**: [http://localhost:8007](http://localhost:8007)
- **API 문서 (Swagger)**: [http://localhost:8007/docs](http://localhost:8007/docs)

---

## 📊 대시보드 및 시각화

이 플랫폼은 미국 전역의 AI 소송을 시각화하기 위한 프리미엄 웹 인터페이스를 제공합니다.

### 주요 기능:
1.  **데이터셋 선택**: `./data/` 디렉토리에 있는 다양한 아카이브 `.csv` 파일 중에서 선택합니다.
2.  **시간 필터링**: 특정 날짜를 선택하여 해당 시점의 소송 현황을 확인합니다.
3.  **인터랙티브 미국 지도**: 
    *   활성 소송이 있는 주(State)를 강조 표시합니다.
    *   주를 클릭하면 상세 내용을 확인할 수 있도록 **CourtListener** 사건 목록으로 직접 연결됩니다.
4.  **실시간 사이드 패널**: 기준에 부합하는 최신 20개 사건을 확인합니다.

### 데이터 방식:
- **방법 1 (실시간 API)**: CourtListener에서 실시간 데이터를 가져옵니다.
- **방법 2 (CSV)**: 로컬 데이터셋에서 소송 기록을 재구성합니다.

---

## 🛠️ API 문서

| 엔드포인트 | 설명 | 파라미터 |
| :--- | :--- | :--- |
| `GET /api/cases` | 메인 데이터 엔드포인트 (실시간 또는 CSV) | `file_name` (선택 사항) |
| `GET /api/files` | `./data/`에 있는 사용 가능한 CSV 파일 목록 | 없음 |
| `GET /api/db-cases`| 현재 MariaDB에 저장된 사건 목록을 가져옴 | 없음 |
| `/` | 인터랙티브 웹 대시보드 | 없음 |

---

## 🏗️ 프로젝트 아키텍처

| 구성 요소 | 기술 | 설명 |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JS (Vanilla) | SVG 지도를 포함한 현대적인 반응형 대시보드. |
| **Backend** | FastAPI (Python 3.10) | 사건 데이터 및 정적 파일을 제공하는 REST API. |
| **Database** | MariaDB 10.6 | 소송 메타데이터를 위한 영구 저장소. |
| **Collector** | Python Requests | CourtListener에서 데이터를 가져옵니다. |
| **Builder** | Python / Pandas | 시각화 도구를 위해 API/CSV 데이터를 통합합니다. |

---

## 📂 프로젝트 구조
```text
.
├── backend/            # FastAPI 소스 코드
│   └── main.py         # API 엔드포인트 및 정적 파일 제공
├── frontend/           # 웹 대시보드 인터페이스
│   ├── index.html      # 메인 레이아웃
│   ├── css/            # 스타일시트 (다크 모드 / 글래스모피즘)
│   └── js/             # 애플리케이션 로직 및 지도 상호작용
├── collector/          # 데이터 수집 및 처리
│   ├── main.py         # DB 입력 엔트리 포인트
│   ├── builder.py      # 이중 모드 데이터 생성기 (API/CSV)
│   ├── courtlistener.py# CourtListener API 클라이언트
│   └── tracker.py      # 메타데이터 추적 로직
├── database/           # 데이터베이스 스키마 정의
├── docker/             # Docker Compose 설정
└── data/               # 과거 데이터셋 (.csv)
```

---

## 🛠️ 유지 관리

### 데이터베이스 검사
```bash
docker compose -f docker/docker-compose.yml exec mariadb mariadb -u root -ppassword ai_lawsuits
```

### 모니터링 및 로그
```bash
docker compose -f docker/docker-compose.yml logs -f
```

### 로컬 결과 재현
특정 날짜(예: 2026년 3월 10일)를 확인하려면:
1. 브라우저에서 `http://localhost:8007`을 엽니다.
2. `aisuit_20260313.csv`를 선택합니다.
3. 날짜 선택기에서 `2026-03-10`으로 설정합니다.
4. **시각화(Visualize)**를 클릭합니다.
