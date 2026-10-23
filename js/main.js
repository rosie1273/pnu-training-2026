/**
 * 2026 부산대학교 직무연수 포털 - 메인 페이지 로직 (main.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    allCourses: [],
    category: 'all',
    requirement: 'all',
    method: 'all',
    target: 'all',
    department: 'all',
    sort: 'default',
    searchQuery: ''
  };

  // DOM Elements
  const coursesContainer = document.getElementById('coursesContainer');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const categoryTabs = document.getElementById('categoryTabs');
  const filterRequirement = document.getElementById('filterRequirement');
  const filterMethod = document.getElementById('filterMethod');
  const filterTarget = document.getElementById('filterTarget');
  const filterDepartment = document.getElementById('filterDepartment');
  const sortSelect = document.getElementById('sortSelect');
  const resultsCountEl = document.getElementById('resultsCount');
  const btnRefresh = document.getElementById('btnRefresh');

  // Stat Elements
  const statTotal = document.getElementById('statTotal');
  const statMandatory = document.getElementById('statMandatory');
  const statOnline = document.getElementById('statOnline');
  const statSpecialized = document.getElementById('statSpecialized');

  // 1. Initial Load
  init();

  async function init(force = false) {
    renderSkeleton();
    try {
      const courses = await PNUApi.fetchCourses(force);
      state.allCourses = courses;
      updateStats(courses);
      populateCategoryTabs(courses);
      populateDepartmentSelect(courses);
      applyFilters();
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      renderError(err.message);
    }
  }

  // 2. Stats calculation
  function updateStats(courses) {
    if (statTotal) statTotal.textContent = courses.length;
    
    // 법정의무 / 필수 과정
    const mandatoryCount = courses.filter(c => 
      (c['이수구분'] || '').includes('필수') || (c['분야'] || '').includes('법정의무')
    ).length;
    if (statMandatory) statMandatory.textContent = mandatoryCount;

    // 온라인 과정
    const onlineCount = courses.filter(c => (c['교육방식'] || '').includes('온라인')).length;
    if (statOnline) statOnline.textContent = onlineCount;

    // 실무·특화 과정 (대학행정, AI, 직무공통, 예산회계, 인사노무)
    const specializedCount = courses.filter(c => {
      const field = c['분야'] || '';
      return field.includes('대학행정') || field.includes('AI') || field.includes('문서') || field.includes('회계') || field.includes('노무');
    }).length;
    if (statSpecialized) statSpecialized.textContent = specializedCount;
  }

  // 3. Populate Category Tabs
  function populateCategoryTabs(courses) {
    const counts = { all: courses.length };
    courses.forEach(c => {
      const f = c['분야'] || '기타';
      counts[f] = (counts[f] || 0) + 1;
    });

    const categories = Object.keys(counts).filter(k => k !== 'all');

    let html = `
      <button class="tab-btn ${state.category === 'all' ? 'active' : ''}" data-category="all">
        전체보기 <span class="tab-count">${counts.all}</span>
      </button>
    `;

    categories.forEach(cat => {
      html += `
        <button class="tab-btn ${state.category === cat ? 'active' : ''}" data-category="${cat}">
          ${cat} <span class="tab-count">${counts[cat]}</span>
        </button>
      `;
    });

    categoryTabs.innerHTML = html;

    // Add Tab click event
    categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.category = btn.getAttribute('data-category');
        applyFilters();
      });
    });
  }

  // 4. Populate Department Select Options
  function populateDepartmentSelect(courses) {
    const depts = new Set();
    courses.forEach(c => {
      if (c['담당부서']) depts.add(c['담당부서']);
    });

    const currentVal = filterDepartment.value;
    filterDepartment.innerHTML = '<option value="all">담당부서: 전체</option>';
    Array.from(depts).sort().forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept;
      opt.textContent = dept;
      filterDepartment.appendChild(opt);
    });
    filterDepartment.value = currentVal || 'all';
  }

  // 5. Filter & Sort Logic
  function applyFilters() {
    let filtered = [...state.allCourses];

    // Category
    if (state.category !== 'all') {
      filtered = filtered.filter(c => c['분야'] === state.category);
    }

    // Requirement (이수구분)
    if (state.requirement !== 'all') {
      filtered = filtered.filter(c => (c['이수구분'] || '').includes(state.requirement));
    }

    // Method (교육방식)
    if (state.method !== 'all') {
      filtered = filtered.filter(c => (c['교육방식'] || '').includes(state.method));
    }

    // Target (대상)
    if (state.target !== 'all') {
      filtered = filtered.filter(c => (c['대상'] || '').includes(state.target));
    }

    // Department (담당부서)
    if (state.department !== 'all') {
      filtered = filtered.filter(c => c['담당부서'] === state.department);
    }

    // Search Query (과정명, 과정코드, 한줄소개, 담당부서)
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(c => {
        return (
          (c['과정명'] || '').toLowerCase().includes(q) ||
          (c['과정코드'] || '').toLowerCase().includes(q) ||
          (c['한줄소개'] || '').toLowerCase().includes(q) ||
          (c['담당부서'] || '').toLowerCase().includes(q) ||
          (c['분야'] || '').toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      if (state.sort === 'name') {
        return (a['과정명'] || '').localeCompare(b['과정명'] || '', 'ko');
      }
      if (state.sort === 'code') {
        return (a['과정코드'] || '').localeCompare(b['과정코드'] || '');
      }
      if (state.sort === 'hours-desc') {
        return extractHours(b['교육시간']) - extractHours(a['교육시간']);
      }
      if (state.sort === 'hours-asc') {
        return extractHours(a['교육시간']) - extractHours(b['교육시간']);
      }
      // default: preserve sheet order
      return 0;
    });

    resultsCountEl.innerHTML = `총 <strong>${filtered.length}</strong>개의 과정`;
    renderCourses(filtered);
  }

  function extractHours(str) {
    if (!str) return 0;
    const match = str.match(/(\d+)시간/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // 6. Render Course Cards
  function renderCourses(courses) {
    if (!courses || courses.length === 0) {
      coursesContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="empty-title">일치하는 직무연수 과정이 없습니다</h3>
          <p class="empty-desc">검색어나 선택한 필터 조건을 변경하여 다시 확인해보세요.</p>
          <button class="btn-reset-filters" id="emptyResetBtn" style="margin: 0 auto;">필터 조건 초기화</button>
        </div>
      `;
      const emptyResetBtn = document.getElementById('emptyResetBtn');
      if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);
      return;
    }

    let html = '';
    courses.forEach(c => {
      const code = c['과정코드'] || '';
      const name = c['과정명'] || '';
      const field = c['분야'] || '';
      const req = c['이수구분'] || '선택';
      const method = c['교육방식'] || '집합';
      const hours = c['교육시간'] || '-';
      const target = c['대상'] || '전 교직원';
      const period = c['교육기간'] || '일정 협의';
      const dept = c['담당부서'] || '부산대학교';
      const desc = c['한줄소개'] || '부산대학교 교직원 직무역량 강화를 위한 전문 과정입니다.';

      // Badge Class
      let reqBadgeClass = 'badge-req-optional';
      if (req.includes('필수')) reqBadgeClass = 'badge-req-required';
      else if (req.includes('권장')) reqBadgeClass = 'badge-req-recommended';

      let methodBadgeClass = 'badge-method-offline';
      if (method.includes('온라인')) methodBadgeClass = 'badge-method-online';
      else if (method.includes('혼합')) methodBadgeClass = 'badge-method-hybrid';

      html += `
        <article class="course-card" onclick="location.href='detail.html?code=${encodeURIComponent(code)}'">
          <div class="card-top">
            <div class="card-badges">
              <span class="badge ${reqBadgeClass}">${req}</span>
              <span class="badge ${methodBadgeClass}">${method}</span>
              <span class="badge badge-field">${field}</span>
            </div>
            <span class="card-code">${code}</span>
          </div>

          <h3 class="card-title" title="${name}">${name}</h3>
          <p class="card-desc">${desc}</p>

          <div class="card-meta-list">
            <div class="meta-item">
              <span class="meta-item-label">교육시간</span>
              <span class="meta-item-val">⏱ ${hours}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">대상 / 정원</span>
              <span class="meta-item-val">👥 ${target}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">교육기간</span>
              <span class="meta-item-val">📅 ${period}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">담당부서</span>
              <span class="meta-item-val">🏢 ${dept}</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-period-tag">${c['신청기간'] === '상시' ? '🟢 상시 신청 가능' : '📅 ' + (c['신청기간'] || '신청기간 확인')}</span>
            <span class="btn-card-detail">
              상세보기
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </span>
          </div>
        </article>
      `;
    });

    coursesContainer.innerHTML = html;
  }

  // 7. Render Skeleton
  function renderSkeleton() {
    let html = '';
    for (let i = 0; i < 6; i++) {
      html += `
        <div class="skeleton-card">
          <div style="display:flex; justify-content:space-between;">
            <div class="skeleton-shimmer" style="width: 120px; height: 22px;"></div>
            <div class="skeleton-shimmer" style="width: 80px; height: 22px;"></div>
          </div>
          <div class="skeleton-shimmer" style="width: 85%; height: 26px;"></div>
          <div class="skeleton-shimmer" style="width: 100%; height: 40px;"></div>
          <div class="skeleton-shimmer" style="width: 100%; height: 80px; border-radius: 8px;"></div>
          <div class="skeleton-shimmer" style="width: 100%; height: 36px; margin-top: auto;"></div>
        </div>
      `;
    }
    coursesContainer.innerHTML = html;
  }

  // 8. Render Error
  function renderError(msg) {
    coursesContainer.innerHTML = `
      <div class="empty-state" style="border-color: #fca5a5; background-color: #fef2f2;">
        <h3 class="empty-title" style="color: #b91c1c;">데이터를 불러오는 중 문제가 발생했습니다</h3>
        <p class="empty-desc" style="color: #7f1d1d;">구글 시트 접근 오류: ${msg}</p>
        <button class="btn-reset-filters" onclick="location.reload()" style="margin: 0 auto; background-color: #ffffff;">다시 시도하기</button>
      </div>
    `;
  }

  // 9. Reset All Filters
  function resetAllFilters() {
    state.category = 'all';
    state.requirement = 'all';
    state.method = 'all';
    state.target = 'all';
    state.department = 'all';
    state.sort = 'default';
    state.searchQuery = '';

    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    filterRequirement.value = 'all';
    filterMethod.value = 'all';
    filterTarget.value = 'all';
    filterDepartment.value = 'all';
    sortSelect.value = 'default';

    if (categoryTabs) {
      categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
      });
    }

    applyFilters();
  }

  // Event Listeners
  let debounceTimer = null;
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    searchClearBtn.style.display = e.target.value ? 'block' : 'none';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, 200);
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClearBtn.style.display = 'none';
    applyFilters();
    searchInput.focus();
  });

  filterRequirement.addEventListener('change', (e) => {
    state.requirement = e.target.value;
    applyFilters();
  });

  filterMethod.addEventListener('change', (e) => {
    state.method = e.target.value;
    applyFilters();
  });

  filterTarget.addEventListener('change', (e) => {
    state.target = e.target.value;
    applyFilters();
  });

  filterDepartment.addEventListener('change', (e) => {
    state.department = e.target.value;
    applyFilters();
  });

  sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    applyFilters();
  });

  resetFiltersBtn.addEventListener('click', resetAllFilters);

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      btnRefresh.querySelector('svg').style.transform = 'rotate(360deg)';
      init(true);
      setTimeout(() => {
        btnRefresh.querySelector('svg').style.transform = '';
      }, 500);
    });
  }
});
