/**
 * Google Sheets 실시간 연동 및 데이터 관리 모듈
 * 2026 부산대학교 직무연수 포털
 */

const PNU_SHEET_CONFIG = {
  sheetId: '1sWeq6LCPTp0I6ith07XQizLm-KcDvAcbeNZBHkOBOvk',
  sheetName: 'data',
  gid: '1980309032',
  get gvizUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${this.sheetName}&headers=1&_t=${Date.now()}`;
  },
  get exportUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv&gid=${this.gid}&_t=${Date.now()}`;
  }
};

let cachedCourses = null;

/**
 * 구글 시트에서 실시간으로 CSV 데이터를 불러와 파싱 후 객체 배열로 반환
 * @param {boolean} force - 강제 새로고침 여부
 * @returns {Promise<Array<Object>>}
 */
async function fetchCourses(force = false) {
  if (cachedCourses && !force) {
    return cachedCourses;
  }

  let csvText = '';
  try {
    const response = await fetch(PNU_SHEET_CONFIG.gvizUrl);
    if (!response.ok) {
      throw new Error(`gviz fetch failed with status ${response.status}`);
    }
    csvText = await response.text();
  } catch (err) {
    console.warn('gviz URL 요청 실패, 대체 export URL로 재시도합니다:', err);
    const fallbackResponse = await fetch(PNU_SHEET_CONFIG.exportUrl);
    if (!fallbackResponse.ok) {
      throw new Error(`데이터를 불러올 수 없습니다. (상태: ${fallbackResponse.status})`);
    }
    csvText = await fallbackResponse.text();
  }

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      transform: (value) => (typeof value === 'string' ? value.trim() : value),
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('PapaParse 경고:', results.errors);
        }

        // 유효한 과정코드 및 과정명이 있는 행만 필터링
        const validCourses = results.data.filter((item) => {
          return item['과정코드'] && item['과정명'] && item['과정코드'].startsWith('PNU-');
        });

        cachedCourses = validCourses;
        resolve(validCourses);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * 과정코드로 단일 과정 조회
 * @param {string} code 
 * @returns {Promise<Object|null>}
 */
async function getCourseByCode(code) {
  const courses = await fetchCourses();
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  return courses.find((c) => (c['과정코드'] || '').toUpperCase() === cleanCode) || null;
}

window.PNUApi = {
  fetchCourses,
  getCourseByCode
};
