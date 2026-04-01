# AI Litigation Dashboard

## Overview
AI Litigation Dashboard는 인공지능(AI)과 관련된 글로벌 소송 데이터를 수집하여 시각적으로 분석하고, 현재의 법적 리스크와 트렌드를 한눈에 파악할 수 있도록 돕는 종합 상황판(Dashboard)입니다.

이 도구는 단순한 시각화를 넘어, 주요 국가 및 주의 소송 집중도, 진행 상태별 통계, 그리고 개별 사건의 상세 정보를 유기적으로 연결하여 사용자에게 깊이 있는 인사이트를 제공합니다.

## Key Features
- **Interactive USA & World Maps**: 미국 50개 주 및 전 세계 국가별 소송 현황을 히트맵 형식으로 제공.
- **Unified Status Filtering**: 준비, 시작, 1심, 항소, 종료 등 모든 소송 상태를 실시간으로 필터링.
- **Detailed Summary Reports**: 지도 하단에서 국가별/주별 소송 비중 테이블 제공 및 CSV 내보내기 지원.
- **Deep-dive Case Modals**: 특정 지역 클릭 시 해당 지역의 모든 소송 목록과 개별 사건의 개요, 공식 문서 링크 확인 가능.
- **Help Guide**: 대시보드 내 Help 메뉴를 통해 상세한 사용 가이드 제공.

## Quick Start
1.  **Backend 설정**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install fastapi uvicorn pandas requests
    uvicorn backend.main:app --host 0.0.0.0 --port 8008
    ```
2.  **Dashboard 접속**:
    브라우저에서 `http://localhost:8008` (또는 지정된 포트)로 접속합니다.

## Data Structure
데이터는 `data/` 디렉토리의 CSV 파일을 기반으로 하며, 다음과 같은 형식을 따릅니다:
- `국가`: 미국, 한국 등
- `법원`: 소송이 제기된 법원 명칭
- `진행상태`: 준비중, 시작, 판결 등
- `소송제목`, `개요 및 배경` 등 상세 정보

## Documentation
- 상세한 사용 방법은 [User Guide](doc/user_guide.md)를 참조하세요.
