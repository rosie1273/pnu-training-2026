/**
 * 2026 부산대학교 직무연수 포털 - 상세 페이지 로직 (detail.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const courseCode = urlParams.get('code');

  const mainContainer = document.getElementById('detailMainContainer');
  const btnRefresh = document.getElementById('btnRefresh');

  if (!courseCode) {
    renderNotFound('과정 코드가 지정되지 않았습니다.');
    return;
  }

  loadCourseDetail(courseCode);

  async function loadCourseDetail(code, force = false) {
    try {
      const courses = await PNUApi.fetchCourses(force);
      const course = courses.find(c => (c['과정코드'] || '').toUpperCase() === code.trim().toUpperCase());

      if (!course) {
        renderNotFound(`코드 [${code}]에 해당하는 직무연수 과정을 찾을 수 없습니다.`);
        return;
      }

      renderDetail(course, courses);
    } catch (err) {
      console.error('상세 정보 로드 오류:', err);
      renderNotFound(`데이터를 불러오는 중 오류가 발생했습니다: ${err.message}`);
    }
  }

  function renderDetail(c, allCourses) {
    const code = c['과정코드'] || '';
    const name = c['과정명'] || '';
    const field = c['분야'] || '직무연수';
    const req = c['이수구분'] || '선택';
    const method = c['교육방식'] || '집합';
    const hours = c['교육시간'] || '-';
    const target = c['대상'] || '전 교직원';
    const capacity = c['정원'] || '제한 없음';
    const period = c['교육기간'] || '상시 운영';
    const applyPeriod = c['신청기간'] || '상시 신청';
    const dept = c['담당부서'] || '부산대학교';
    const oneLiner = c['한줄소개'] || '';
    const fullDesc = c['상세소개'] || oneLiner;
    const goals = c['학습목표'] || '';
    const curriculum = c['주요내용'] || '';
    const applyUrl = c['신청링크'] || `https://hrd.pusan.ac.kr/course/${code}`;
    const contact = c['문의'] || `${dept} 담당자`;

    // Extract telephone number
    const phoneMatch = contact.match(/051-[\d-]+/);
    const phoneNumber = phoneMatch ? phoneMatch[0] : '';

    // Set Document Title
    document.title = `${name} | 2026 부산대학교 직무연수`;

    // Badges classes
    let reqBadgeClass = 'badge-req-optional';
    if (req.includes('필수')) reqBadgeClass = 'badge-req-required';
    else if (req.includes('권장')) reqBadgeClass = 'badge-req-recommended';

    let methodBadgeClass = 'badge-method-offline';
    if (method.includes('온라인')) methodBadgeClass = 'badge-method-online';
    else if (method.includes('혼합')) methodBadgeClass = 'badge-method-hybrid';

    // Parse Objectives (split by '·' or newline)
    const goalList = goals.split(/[·\n]/).map(g => g.trim()).filter(Boolean);
    let goalsHtml = '';
    if (goalList.length > 0) {
      goalsHtml = `
        <ul class="objectives-list">
          ${goalList.map(g => `
            <li class="objective-item">
              <svg class="objective-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>${g}</span>
            </li>
          `).join('')}
        </ul>
      `;
    } else {
      goalsHtml = '<p class="block-body-text">본 과정은 교직원의 현업 직무 역량 함양을 목표로 합니다.</p>';
    }

    // Parse Curriculum (split by '·' or newline)
    const currList = curriculum.split(/[·\n]/).map(item => item.trim()).filter(Boolean);
    let currHtml = '';
    if (currList.length > 0) {
      currHtml = `
        <div class="curriculum-grid">
          ${currList.map((item, idx) => `
            <div class="curriculum-module">
              <span class="module-badge">모듈 ${idx + 1}</span>
              <span class="module-text">${item}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      currHtml = '<p class="block-body-text">세부 커리큘럼은 교안 및 수강 안내 페이지에서 확인하실 수 있습니다.</p>';
    }

    // Render Full Page
    mainContainer.innerHTML = `
      <!-- Top Navigation & Breadcrumbs -->
      <div class="detail-top-nav">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="index.html">홈</a>
          <span class="sep">/</span>
          <a href="index.html">${field}</a>
          <span class="sep">/</span>
          <span class="current">${code}</span>
        </nav>
        <a href="index.html" class="btn-back-link">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          전체 연수 목록으로
        </a>
      </div>

      <!-- Detail Hero Header -->
      <section class="detail-hero">
        <div class="detail-header-meta">
          <div class="detail-badges">
            <span class="badge ${reqBadgeClass}">${req}</span>
            <span class="badge ${methodBadgeClass}">${method}</span>
            <span class="badge badge-field">${field}</span>
          </div>
          <span class="detail-code-badge">${code}</span>
        </div>
        <h1 class="detail-title">${name}</h1>
        ${oneLiner ? `<p class="detail-one-liner">${oneLiner}</p>` : ''}
      </section>

      <!-- 6-Grid Key Metrics -->
      <section class="detail-metrics-grid">
        <div class="metric-tile">
          <div class="metric-tile-icon">⏱</div>
          <div class="metric-tile-body">
            <span class="metric-tile-label">총 이수시간</span>
            <span class="metric-tile-val">${hours}</span>
          </div>
        </div>

        <div class="metric-tile">
          <div class="metric-tile-icon">👥</div>
          <div class="metric-tile-body">
            <span class="metric-tile-label">수강대상 / 정원</span>
            <span class="metric-tile-val">${target} (${capacity})</span>
          </div>
        </div>

        <div class="metric-tile">
          <div class="metric-tile-icon">📅</div>
          <div class="metric-tile-body">
            <span class="metric-tile-label">교육기간</span>
            <span class="metric-tile-val">${period}</span>
          </div>
        </div>

        <div class="metric-tile">
          <div class="metric-tile-icon">📝</div>
          <div class="metric-tile-body">
            <span class="metric-tile-label">신청기간</span>
            <span class="metric-tile-val">${applyPeriod}</span>
          </div>
        </div>
      </section>

      <!-- Main Layout: 2 Columns Split -->
      <div class="detail-layout">
        <!-- Left: Course Body -->
        <div class="detail-main-content">
          <!-- 상세 소개 -->
          <article class="content-block">
            <h2 class="block-title">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              과정 상세 소개
            </h2>
            <div class="block-body-text">${fullDesc}</div>
          </article>

          <!-- 학습 목표 -->
          <article class="content-block">
            <h2 class="block-title">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              핵심 학습 목표
            </h2>
            ${goalsHtml}
          </article>

          <!-- 주요 커리큘럼 -->
          <article class="content-block">
            <h2 class="block-title">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              주요 교육 내용
            </h2>
            ${currHtml}
          </article>
        </div>

        <!-- Right: Sticky CTA Sidebar -->
        <aside class="detail-sidebar">
          <div class="sticky-action-card">
            <div class="action-card-title">수강 신청 안내</div>

            <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" class="btn-apply-primary">
              <span>수강신청 바로가기</span>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <!-- Contact Box -->
            <div class="sidebar-contact-box">
              <div class="contact-box-label">과정 문의처</div>
              <div class="contact-dept-name">🏢 ${dept}</div>
              ${phoneNumber ? `
                <a href="tel:${phoneNumber.replace(/-/g, '')}" class="contact-phone-link">
                  📞 ${phoneNumber}
                </a>
              ` : `
                <div class="contact-phone-link">📞 ${contact}</div>
              `}
            </div>

            <!-- Utility Tools -->
            <div class="sidebar-tools">
              <button type="button" class="btn-sidebar-tool" id="btnCopyUrl">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                공유하기
              </button>
              <button type="button" class="btn-sidebar-tool" onclick="window.print()">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                인쇄하기
              </button>
            </div>
          </div>
        </aside>
      </div>

      <!-- Related Courses Section -->
      <section class="related-courses-section">
        <h3 class="related-section-title">같은 분야 [${field}]의 다른 추천 연수</h3>
        <div class="courses-grid" id="relatedCoursesGrid">
          <!-- Populated by JS -->
        </div>
      </section>
    `;

    // Hook up Copy URL
    const btnCopyUrl = document.getElementById('btnCopyUrl');
    if (btnCopyUrl) {
      btnCopyUrl.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          btnCopyUrl.textContent = '✓ 복사완료';
          setTimeout(() => {
            btnCopyUrl.innerHTML = `
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              공유하기
            `;
          }, 1500);
        });
      });
    }

    // Render Related Courses
    renderRelatedCourses(c, allCourses);
  }

  function renderRelatedCourses(currentCourse, allCourses) {
    const grid = document.getElementById('relatedCoursesGrid');
    if (!grid) return;

    const related = allCourses
      .filter(c => c['분야'] === currentCourse['분야'] && c['과정코드'] !== currentCourse['과정코드'])
      .slice(0, 3);

    if (related.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-muted);">해당 분야에 등록된 다른 연수 과정이 없습니다.</p>';
      return;
    }

    let html = '';
    related.forEach(c => {
      const code = c['과정코드'] || '';
      const name = c['과정명'] || '';
      const req = c['이수구분'] || '선택';
      const method = c['교육방식'] || '집합';
      const hours = c['교육시간'] || '-';
      const dept = c['담당부서'] || '';

      let reqBadgeClass = 'badge-req-optional';
      if (req.includes('필수')) reqBadgeClass = 'badge-req-required';
      else if (req.includes('권장')) reqBadgeClass = 'badge-req-recommended';

      html += `
        <article class="course-card" onclick="location.href='detail.html?code=${encodeURIComponent(code)}'">
          <div class="card-top">
            <div class="card-badges">
              <span class="badge ${reqBadgeClass}">${req}</span>
              <span class="badge badge-field">${method}</span>
            </div>
            <span class="card-code">${code}</span>
          </div>
          <h4 class="card-title" title="${name}">${name}</h4>
          <p class="card-desc">${c['한줄소개'] || ''}</p>
          <div class="card-footer" style="margin-top:auto;">
            <span class="card-period-tag">⏱ ${hours} · 🏢 ${dept}</span>
            <span class="btn-card-detail">상세보기 →</span>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;
  }

  function renderNotFound(msg) {
    mainContainer.innerHTML = `
      <div style="padding: 80px 20px; text-align: center;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #b91c1c; margin-bottom: 12px;">직무연수 과정을 찾을 수 없습니다</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">${msg}</p>
        <a href="index.html" class="btn-reset-filters" style="display:inline-flex; align-items:center; gap:6px;">
          ← 전체 연수 목록으로 돌아가기
        </a>
      </div>
    `;
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadCourseDetail(courseCode, true);
    });
  }
});
