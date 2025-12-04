// 8체질 섭생표 JavaScript

// 전역 변수
let dietData = [];
let currentConstitution = '';
let activeFilters = ['all'];

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadDietData();
});

// 섭생표 데이터 로드
async function loadDietData() {
    try {
        const response = await fetch('data/diet-data.json');
        dietData = await response.json();
        console.log('섭생표 데이터 로드 완료:', dietData.length, '개 음식');
    } catch (error) {
        console.error('섭생표 데이터 로드 실패:', error);
        alert('섭생표 데이터를 불러올 수 없습니다.');
    }
}

// 체질 선택
function selectConstitution(constitution) {
    currentConstitution = constitution;
    
    // 체질 이름 업데이트
    const constitutionNames = {
        '목양': '목양체질',
        '목음': '목음체질',
        '토양': '토양체질',
        '토음': '토음체질',
        '금양': '금양체질',
        '금음': '금음체질',
        '수양': '수양체질',
        '수음': '수음체질'
    };
    
    document.getElementById('selectedConstitutionName').textContent = constitutionNames[constitution];
    
    // 화면 전환
    document.getElementById('constitutionSelect').classList.add('hidden');
    document.getElementById('foodList').classList.remove('hidden');
    
    // 필터 초기화
    resetFilters();
    
    // 음식 목록 표시
    displayFoods();
}

// 체질 선택 화면으로 돌아가기
function showConstitutionSelect() {
    document.getElementById('foodList').classList.add('hidden');
    document.getElementById('constitutionSelect').classList.remove('hidden');
    
    // 검색창 초기화
    document.getElementById('searchInput').value = '';
    document.getElementById('clearBtn').style.display = 'none';
}

// 음식 목록 표시
function displayFoods() {
    const container = document.getElementById('foodItemsContainer');
    const searchInput = document.getElementById('searchInput').value.toLowerCase().trim();
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    // 필터링된 음식 가져오기
    let filteredFoods = dietData.filter(food => {
        // 검색어 필터
        if (searchInput && !food.음식명.toLowerCase().includes(searchInput)) {
            return false;
        }
        
        // 등급 필터
        const rating = food[currentConstitution];
        if (!rating) return false;
        
        if (activeFilters.includes('all')) {
            return true;
        }
        
        return activeFilters.includes(rating);
    });
    
    // 분류별로 그룹화
    const grouped = {};
    filteredFoods.forEach(food => {
        const category = food.분류 || '기타';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(food);
    });
    
    // 분류 순서 정의
    const categoryOrder = [
        '동물성단백질',
        '식물성단백질',
        '탄수화물(곡류)',
        '채소(잎/줄기채소)',
        '근채류(뿌리채소)',
        '과일',
        '해조류',
        '오일',
        '허브 및 양념류'
    ];
    
    // HTML 생성
    let html = '';
    
    if (filteredFoods.length === 0) {
        container.innerHTML = '';
        noResultsMessage.classList.remove('hidden');
        return;
    }
    
    noResultsMessage.classList.add('hidden');
    
    categoryOrder.forEach(category => {
        if (grouped[category] && grouped[category].length > 0) {
            html += `<div class="category-section" style="margin-bottom: 20px;">
                <h3 style="font-size: 1.1rem; color: #667eea; margin-bottom: 12px; padding-left: 4px;">
                    ${getCategoryIcon(category)} ${category}
                </h3>`;
            
            grouped[category].forEach(food => {
                const rating = food[currentConstitution];
                const ratingClass = getRatingClass(rating);
                const ratingText = getRatingText(rating);
                
                html += `
                    <div class="food-item">
                        <div class="food-item-header">
                            <div class="food-name">${food.음식명}</div>
                            <div class="food-rating">
                                <span class="rating-badge ${ratingClass}">${ratingText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
    });
    
    // 기타 카테고리
    Object.keys(grouped).forEach(category => {
        if (!categoryOrder.includes(category)) {
            html += `<div class="category-section" style="margin-bottom: 20px;">
                <h3 style="font-size: 1.1rem; color: #667eea; margin-bottom: 12px; padding-left: 4px;">
                    ${getCategoryIcon(category)} ${category}
                </h3>`;
            
            grouped[category].forEach(food => {
                const rating = food[currentConstitution];
                const ratingClass = getRatingClass(rating);
                const ratingText = getRatingText(rating);
                
                html += `
                    <div class="food-item">
                        <div class="food-item-header">
                            <div class="food-name">${food.음식명}</div>
                            <div class="food-rating">
                                <span class="rating-badge ${ratingClass}">${ratingText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
    });
    
    container.innerHTML = html;
}

// 카테고리 아이콘 가져오기
function getCategoryIcon(category) {
    const icons = {
        '동물성단백질': '🥩',
        '식물성단백질': '🌱',
        '탄수화물(곡류)': '🌾',
        '채소(잎/줄기채소)': '🥬',
        '근채류(뿌리채소)': '🥕',
        '과일': '🍎',
        '해조류': '🌿',
        '오일': '🫒',
        '허브 및 양념류': '🌿'
    };
    return icons[category] || '🍽️';
}

// 등급 클래스 가져오기
function getRatingClass(rating) {
    if (!rating) return '';
    
    const normalized = rating.trim();
    if (normalized === 'OO') return 'oo';
    if (normalized === 'O') return 'o';
    if (normalized === 'Δ') return 'delta';
    if (normalized === 'X') return 'x';
    if (normalized === 'XX') return 'xx';
    return '';
}

// 등급 텍스트 가져오기
function getRatingText(rating) {
    if (!rating) return '';
    
    const normalized = rating.trim();
    if (normalized === 'OO') return '●●';
    if (normalized === 'O') return '●';
    if (normalized === 'Δ') return '△';
    if (normalized === 'X') return '✕';
    if (normalized === 'XX') return '✕✕';
    return rating;
}

// 필터 토글
function toggleFilter(button, rating) {
    if (rating === 'all') {
        // 전체 선택
        activeFilters = ['all'];
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    } else {
        // 특정 등급 선택/해제
        const allButton = document.querySelector('.filter-btn[data-rating="all"]');
        allButton.classList.remove('active');
        
        const index = activeFilters.indexOf(rating);
        if (index > -1) {
            // 이미 선택된 경우 제거
            activeFilters.splice(index, 1);
            button.classList.remove('active');
            
            // 아무것도 선택 안 된 경우 전체로 되돌림
            if (activeFilters.length === 0 || activeFilters.includes('all')) {
                activeFilters = ['all'];
                allButton.classList.add('active');
            }
        } else {
            // 선택되지 않은 경우 추가
            if (activeFilters.includes('all')) {
                activeFilters = [];
            }
            activeFilters.push(rating);
            button.classList.add('active');
        }
    }
    
    displayFoods();
}

// 필터 초기화
function resetFilters() {
    activeFilters = ['all'];
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.filter-btn[data-rating="all"]').classList.add('active');
}

// 음식 필터링 (검색)
function filterFoods() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    
    if (searchInput.value.trim()) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }
    
    displayFoods();
}

// 검색어 지우기
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearBtn').style.display = 'none';
    displayFoods();
}

// 범례 표시
function showLegend() {
    document.getElementById('legendPopup').classList.add('show');
}

// 범례 닫기
function closeLegend() {
    document.getElementById('legendPopup').classList.remove('show');
}

// 뒤로 가기
function goBack() {
    // 음식 목록 화면에서 체질 선택 화면으로
    if (!document.getElementById('foodList').classList.contains('hidden')) {
        showConstitutionSelect();
    } else {
        // 체질 선택 화면에서 홈으로
        // home.html 환경인지 확인 (dietTableContent가 있으면 home.html)
        const dietTableContent = document.getElementById('dietTableContent');
        if (dietTableContent && typeof showHomeFromDietTable === 'function') {
            // home.html 환경 - 홈 화면으로
            showHomeFromDietTable();
        } else {
            // 별도 페이지 - home.html로 이동
            window.location.href = 'home.html';
        }
    }
}
