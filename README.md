# 2026 부산대학교 직무연수 안내 포털 (PNU Job Training Portal)

> 부산대학교 교직원을 위한 2026학년도 직무연수 카탈로그 및 수강 신청 포털 사이트입니다.

![PNU Logo](assets/pnu_logo.svg)

## 📌 주요 특징
- **구글 스프레드시트 실시간 연동**: `gviz` CSV API와 `PapaParse`를 이용해 시트의 최신 연수 정보를 실시간으로 반영합니다.
- **2페이지 반응형 정적 웹사이트**:
  - `index.html`: 전체 직무연수 개요, 지표 카운터, 키워드 실시간 검색, 분야별/이수구분별/교육방식별 다중 필터링, 카드 그리드 뷰.
  - `detail.html`: 과정별 세부 소개, 6대 핵심 지표 인포박스, 체크리스트형 학습목표, 모듈별 커리큘럼, 원클릭 수강신청 CTA 및 문의처.
- **PNU 디자인 시스템 적용**: 부산대학교 공식 상징색(PNU Navy `#003876`, PNU Crimson `#c8102e`), Pretendard 타이포그래피, 모바일 반응형 레이아웃, 스켈레톤 로딩 지원.

## 📁 디렉터리 구조
```text
├── index.html              # 메인 페이지 (카탈로그, 검색, 필터링)
├── detail.html             # 상세 페이지 (세부 정보, 커리큘럼, 신청 링크)
├── css/
│   ├── base.css            # PNU 브랜드 토큰, 공통 리셋, 헤더/푸터
│   ├── main.css            # 메인 페이지 전용 스타일 (Hero, 필터 칩, 카드)
│   └── detail.css          # 상세 페이지 전용 스타일 (인포박스, 타임라인, CTA)
├── js/
│   ├── api.js              # Google Sheets CSV 실시간 파서 및 캐시 관리
│   ├── main.js             # 메인 페이지 검색, 필터, 렌더링 로직
│   └── detail.js           # 상세 페이지 데이터 바인딩 및 추천 과정 로직
├── assets/
│   └── pnu_logo.svg        # 부산대학교 공식 심볼 로고
└── PLAN.md                 # 프로젝트 작업 기획서
```

## 🚀 배포 및 로컬 실행 방법
1. **GitHub Pages 배포**:
   - 저장소 Settings > Pages 진입
   - Build and deployment > Source: `Deploy from a branch`
   - Branch: `main` / `(root)` 선택 후 Save
2. **로컬 실행**:
   ```bash
   python -m http.server 8000
   ```
   브라우저에서 `http://localhost:8000` 접속
