/**
 * in8 - Admin Service
 * 관리자 기능
 */

// 전역 변수: 현재 로드된 사용자 목록
let currentUserList = [];

/**
 * Firebase Timestamp를 한국 시간(KST)으로 변환
 */
function formatKSTDateTime(timestamp) {
    if (!timestamp) return '-';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        // UTC 시간을 KST(+9시간)로 변환
        const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        
        const year = kstDate.getUTCFullYear();
        const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(kstDate.getUTCDate()).padStart(2, '0');
        const hours = String(kstDate.getUTCHours()).padStart(2, '0');
        const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
        const seconds = String(kstDate.getUTCSeconds()).padStart(2, '0');
        
        return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.warn('⚠️ 날짜 변환 오류:', error);
        return '-';
    }
}

/**
 * 회원 검색 필터링
 */
function filterUserList(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    const container = document.getElementById('userList');
    const resultCount = document.getElementById('searchResultCount');
    
    if (!container || currentUserList.length === 0) return;
    
    let filteredUsers = currentUserList;
    
    if (searchTerm) {
        filteredUsers = currentUserList.filter(user => {
            const name = (user.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const loginId = (user.loginId || '').toLowerCase();
            const constitution = (user.lastConstitution || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   loginId.includes(searchTerm) || 
                   constitution.includes(searchTerm);
        });
    }
    
    // 검색 결과 표시
    renderUserList(filteredUsers);
    
    // 결과 수 표시
    if (resultCount) {
        if (searchTerm) {
            resultCount.textContent = `검색 결과: ${filteredUsers.length}명 / 전체 ${currentUserList.length}명`;
        } else {
            resultCount.textContent = '';
        }
    }
}

/**
 * 회원 검색 초기화
 */
function clearUserSearch() {
    const searchInput = document.getElementById('userSearchInput');
    const resultCount = document.getElementById('searchResultCount');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (resultCount) {
        resultCount.textContent = '';
    }
    
    // 전체 목록 다시 표시
    renderUserList(currentUserList);
}

/**
 * 회원 목록 렌더링
 */
function renderUserList(users) {
    const container = document.getElementById('userList');
    if (!container) return;
    
    let html = '<h3>사용자 목록</h3><div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">';
    
    if (users.length === 0) {
        html += `
            <div style="padding: 40px; text-align: center; color: #666;">
                검색 결과가 없습니다.
            </div>
        `;
    } else {
        users.forEach(user => {
            const loginTypeLabel = user.loginType === 'kakao' ? '카카오' : '간편';
            const loginTypeBadge = user.loginType === 'kakao' 
                ? 'background: #FEE500; color: #3C1E1E;' 
                : 'background: #2ecc71; color: white;';
            
            const lastConstitution = user.lastConstitution || '-';
            
            // 한국 시간으로 변환
            const lastAccessText = formatKSTDateTime(user.lastAccessDate);
            const lastSurveyText = formatKSTDateTime(user.lastSurveyDate);
            
            html += `
                <div style="padding: 15px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${user.name || user.loginId}</strong> (${user.email || '-'})
                        <span style="${loginTypeBadge} padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px;">
                            ${loginTypeLabel}
                        </span>
                        <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 5px;">
                            ${lastConstitution}
                        </span>
                    </div>
                    <div style="color: #666; font-size: 0.9rem; text-align: right;">
                        <div>진단 ${user.actualSurveyCount || 0}회</div>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 4px;">최종접속: ${lastAccessText}</div>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 2px;">최종설문: ${lastSurveyText}</div>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * 회원 목록 새로고침 (실시간 업데이트)
 */
async function refreshUserList() {
    console.log('🔄 회원 목록 새로고침 시작...');
    const refreshBtn = event?.target;
    
    // 버튼 비활성화 및 로딩 표시
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '⏳ 새로고침 중...';
    }
    
    try {
        await loadUserList();
        await updateAdminStats();
        
        // 버튼 복원
        if (refreshBtn) {
            refreshBtn.textContent = '✅ 완료!';
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.textContent = '🔄 새로고침';
            }, 1000);
        }
        
        console.log('✅ 회원 목록 새로고침 완료');
    } catch (error) {
        console.error('❌ 회원 목록 새로고침 실패:', error);
        if (refreshBtn) {
            refreshBtn.textContent = '❌ 실패';
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.textContent = '🔄 새로고침';
            }, 1500);
        }
    }
}

/**
 * 관리자 탭 전환
 */
function showAdminTab(tabName, event) {
    console.log('🔄 탭 전환:', tabName);
    
    // event가 없으면 (다른 곳에서 호출된 경우) 해당 탭 버튼 찾기
    let clickedButton = event ? event.target : null;
    
    // 탭 버튼 활성화
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 탭 콘텐츠 표시
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    // 클릭된 버튼 활성화
    if (clickedButton) {
        clickedButton.classList.add('active');
    } else {
        // event가 없을 경우 버튼 찾아서 활성화
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => {
            if (btn.textContent.includes('엑셀') && tabName === 'excel') btn.classList.add('active');
            if (btn.textContent.includes('회원') && tabName === 'users') btn.classList.add('active');
            if (btn.textContent.includes('통계') && tabName === 'results') btn.classList.add('active');
            if (btn.textContent.includes('한의원') && tabName === 'hospital') btn.classList.add('active');
        });
    }
    
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.remove('hidden');
        targetTab.classList.add('active');
        console.log('✅ 탭 표시:', tabName + 'Tab');
    } else {
        console.error('❌ 탭을 찾을 수 없습니다:', tabName + 'Tab');
    }
    
    // 각 탭별 데이터 로드
    if (tabName === 'users') {
        loadUserList();
        updateAdminStats();
        
        // 자동 새로고침 설정 (30초마다)
        if (window.userListRefreshInterval) {
            clearInterval(window.userListRefreshInterval);
        }
        window.userListRefreshInterval = setInterval(() => {
            console.log('🔄 자동 새로고침 (30초)');
            loadUserList();
            updateAdminStats();
        }, 30000);
        
    } else if (tabName === 'results') {
        // 다른 탭으로 이동 시 자동 새로고침 중지
        if (window.userListRefreshInterval) {
            clearInterval(window.userListRefreshInterval);
            window.userListRefreshInterval = null;
        }
        updateResultStats();
    } else if (tabName === 'excel') {
        // 다른 탭으로 이동 시 자동 새로고침 중지
        if (window.userListRefreshInterval) {
            clearInterval(window.userListRefreshInterval);
            window.userListRefreshInterval = null;
        }
        updateCurrentSurveyInfo();
        setupExcelDropZone(); // 드래그/드롭 설정
    } else if (tabName === 'hospital') {
        // 다른 탭으로 이동 시 자동 새로고침 중지
        if (window.userListRefreshInterval) {
            clearInterval(window.userListRefreshInterval);
            window.userListRefreshInterval = null;
        }
        loadHospitalList();
    }
}

/**
 * 엑셀 드래그/드롭 영역 설정
 */
function setupExcelDropZone() {
    const fileUploadLabel = document.querySelector('.file-upload-label');
    const fileInput = document.getElementById('surveyFile');
    
    if (!fileUploadLabel || !fileInput) return;
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    fileUploadLabel.ondragover = null;
    fileUploadLabel.ondragleave = null;
    fileUploadLabel.ondrop = null;
    
    // 드래그 오버
    fileUploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadLabel.style.background = 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)';
        fileUploadLabel.style.borderColor = '#667eea';
    });
    
    // 드래그 떠남
    fileUploadLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadLabel.style.background = '';
        fileUploadLabel.style.borderColor = '';
    });
    
    // 드롭
    fileUploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadLabel.style.background = '';
        fileUploadLabel.style.borderColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            
            // 파일 확장자 확인
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // FileInput에 파일 설정
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // 업로드 실행
                uploadExcel();
            } else {
                alert('⚠️ .xlsx 또는 .xls 파일만 업로드할 수 있습니다.');
            }
        }
    });
    
    console.log('✅ 엑셀 드래그/드롭 영역 설정 완료');
}

/**
 * 엑셀 파일 업로드
 */
function uploadExcel() {
    const fileInput = document.getElementById('surveyFile');
    const file = fileInput.files[0];
    const statusDiv = document.getElementById('uploadStatus');

    if (!file) return;

    statusDiv.innerHTML = '<div class="alert alert-info">📤 파일을 업로드하고 파싱 중입니다...</div>';

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            const newSurveyData = parseExcelData(jsonData);
            
            if (newSurveyData && newSurveyData.questions && newSurveyData.questions.length > 0) {
                // Firebase에 저장
                await saveSurveyData(newSurveyData);
                
                // 전역 surveyData 업데이트
                surveyData = newSurveyData;
                
                statusDiv.innerHTML = `<div class="alert alert-success">✅ 설문 데이터가 성공적으로 업로드되었습니다! (${surveyData.questions.length}개 질문)</div>`;
                updateCurrentSurveyInfo();
                
                console.log('✅ 새로운 설문 데이터가 로드되었습니다:', surveyData);
            } else {
                throw new Error('유효한 설문 데이터를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('❌ 엑셀 파일 처리 오류:', error);
            statusDiv.innerHTML = '<div class="alert alert-error">⚠ 파일 처리 중 오류가 발생했습니다. 파일 형식을 확인해주세요.</div>';
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * 엑셀 데이터 파싱
 */
function parseExcelData(jsonData) {
    try {
        const questions = [];
        const constitutions = ["목양", "목음", "금양", "금음", "토양", "토음", "수양", "수음"];
        
        function cleanOptionText(text) {
            if (!text) return "";
            return text.split('\n')[0] || text;
        }

        let questionCounter = 1;

        for (let i = 2; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row[1] && row[2]) {
                const question = {
                    id: questionCounter++,
                    text: cleanOptionText(row[0]) || `질문 ${questionCounter - 1}`,
                    options: [
                        {
                            text: cleanOptionText(row[1]),
                            scores: {}
                        },
                        {
                            text: cleanOptionText(row[2]),
                            scores: {}
                        },
                        {
                            text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                            scores: {}
                        }
                    ]
                };
                
                // 점수 매핑
                for (let j = 0; j < constitutions.length; j++) {
                    question.options[0].scores[constitutions[j]] = parseFloat(row[5 + j]) || 0;
                    question.options[1].scores[constitutions[j]] = parseFloat(row[13 + j]) || 0;
                    question.options[2].scores[constitutions[j]] = 0;
                }
                
                questions.push(question);
            }
        }

        return { questions, constitutions };
    } catch (error) {
        console.error('❌ 엑셀 데이터 파싱 오류:', error);
        return null;
    }
}

/**
 * 현재 설문 정보 업데이트
 */
function updateCurrentSurveyInfo() {
    const element = document.getElementById('currentSurveyInfo');
    if (element && surveyData && surveyData.questions) {
        const questionCount = surveyData.questions.length;
        element.textContent = `${questionCount}개 질문`;
    }
}

/**
 * 사용자 목록 로드
 */
async function loadUserList() {
    const container = document.getElementById('userList');
    if (!container) return;
    
    container.innerHTML = '<div class="alert alert-info">📥 사용자 목록을 불러오는 중...</div>';
    
    try {
        console.log('👥 사용자 목록 로딩 시작...');
        const users = await getAllUsers();
        console.log(`✅ ${users.length}명의 사용자 데이터 로드 완료`);
        
        // 전역 변수에 저장
        currentUserList = users;
        
        // 검색어 확인
        const searchInput = document.getElementById('userSearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        let displayUsers = users;
        
        // 검색어가 있으면 필터링
        if (searchTerm) {
            displayUsers = users.filter(user => {
                const name = (user.name || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                const loginId = (user.loginId || '').toLowerCase();
                const constitution = (user.lastConstitution || '').toLowerCase();
                
                return name.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       loginId.includes(searchTerm) || 
                       constitution.includes(searchTerm);
            });
            
            // 검색 결과 수 업데이트
            const resultCount = document.getElementById('searchResultCount');
            if (resultCount) {
                resultCount.textContent = `검색 결과: ${displayUsers.length}명 / 전체 ${users.length}명`;
            }
        }
        
        // 사용자 목록 렌더링
        renderUserList(displayUsers);
        
    } catch (error) {
        console.error('❌ 사용자 목록 로드 실패:', error);
        console.error('에러 세부정보:', error.message, error.code);
        container.innerHTML = `
            <div class="alert alert-error">
                <p><strong>⚠️ 사용자 목록을 불러올 수 없습니다.</strong></p>
                <p style="font-size: 0.9rem; margin-top: 8px;">
                    오류: ${error.message || '알 수 없는 오류'}
                </p>
                <p style="font-size: 0.9rem; margin-top: 8px; color: #666;">
                    Firebase 연결 상태를 확인해주세요. 또는 Firestore 보안 규칙에서 관리자 권한이 있는지 확인해주세요.
                </p>
            </div>
        `;
    }
}

/**
 * 관리자 통계 업데이트
 */
async function updateAdminStats() {
    try {
        console.log('📊 관리자 통계 업데이트 시작...');
        const users = await getAllUsers();
        
        const totalUsers = users.length;
        const kakaoUsers = users.filter(u => u.loginType === 'kakao').length;
        const simpleUsers = users.filter(u => u.loginType === 'simple').length;
        
        const totalUsersElement = document.getElementById('totalUsers');
        const kakaoUsersElement = document.getElementById('kakaoUsers');
        const simpleUsersElement = document.getElementById('simpleUsers');
        
        if (totalUsersElement) totalUsersElement.textContent = totalUsers;
        if (kakaoUsersElement) kakaoUsersElement.textContent = kakaoUsers;
        if (simpleUsersElement) simpleUsersElement.textContent = simpleUsers;
        
        console.log(`✅ 관리자 통계 업데이트 완료 - 총 ${totalUsers}명 (카카오: ${kakaoUsers}, 간편: ${simpleUsers})`);
        
    } catch (error) {
        console.error('❌ 관리자 통계 업데이트 실패:', error);
        console.error('에러 세부정보:', error.message, error.code);
        
        // 에러 시 0으로 표시
        const totalUsersElement = document.getElementById('totalUsers');
        const kakaoUsersElement = document.getElementById('kakaoUsers');
        const simpleUsersElement = document.getElementById('simpleUsers');
        
        if (totalUsersElement) totalUsersElement.textContent = '-';
        if (kakaoUsersElement) kakaoUsersElement.textContent = '-';
        if (simpleUsersElement) simpleUsersElement.textContent = '-';
    }
}

/**
 * 결과 통계 업데이트
 */
async function updateResultStats() {
    const chartContainer = document.getElementById('resultsChart');
    const totalSurveysElement = document.getElementById('totalSurveys');
    const mostCommonTypeElement = document.getElementById('mostCommonType');
    
    try {
        console.log('📊 결과 통계 업데이트 시작...');
        
        // 로딩 표시
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="alert alert-info">📊 통계를 불러오는 중...</div>';
        }
        
        const stats = await getSurveyStatistics();
        
        const totalSurveys = stats.totalCount;
        if (totalSurveysElement) totalSurveysElement.textContent = totalSurveys;
        
        if (totalSurveys > 0) {
            // 가장 많은 체질 찾기
            let maxCount = 0;
            let mostCommon = '-';
            
            for (const [constitution, count] of Object.entries(stats.constitutionCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommon = constitution;
                }
            }
            
            if (mostCommonTypeElement) mostCommonTypeElement.textContent = mostCommon;
            
            // 차트 그리기
            if (chartContainer) {
                chartContainer.innerHTML = '<h3>체질별 분포</h3>';
                
                const sortedConstitutions = Object.entries(stats.constitutionCounts)
                    .sort(([,a], [,b]) => b - a);
                
                sortedConstitutions.forEach(([constitution, count]) => {
                    const percentage = (count / totalSurveys * 100).toFixed(1);
                    chartContainer.innerHTML += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; margin: 10px 0; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <span style="font-weight: 600; font-size: 1.1rem;">${constitution}</span>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="width: 200px; height: 12px; background: #e1e5e9; border-radius: 6px; overflow: hidden;">
                                    <div style="width: ${percentage}%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                                </div>
                                <span style="font-size: 1rem; color: #667eea; font-weight: 600; min-width: 80px;">${count}명 (${percentage}%)</span>
                            </div>
                        </div>
                    `;
                });
            }
            
            console.log('✅ 결과 통계 업데이트 완료');
        } else {
            if (mostCommonTypeElement) mostCommonTypeElement.textContent = '-';
            if (chartContainer) {
                chartContainer.innerHTML = '<h3>체질별 분포</h3><p style="text-align: center; color: #666; padding: 40px;">아직 진단 결과가 없습니다.</p>';
            }
            console.log('ℹ️ 진단 결과 없음');
        }
        
    } catch (error) {
        console.error('❌ 결과 통계 업데이트 실패:', error);
        console.error('에러 세부정보:', error.message, error.code);
        
        if (totalSurveysElement) totalSurveysElement.textContent = '-';
        if (mostCommonTypeElement) mostCommonTypeElement.textContent = '-';
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="alert alert-error">
                    <p><strong>⚠️ 통계를 불러올 수 없습니다.</strong></p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">
                        오류: ${error.message || '알 수 없는 오류'}
                    </p>
                    <p style="font-size: 0.9rem; margin-top: 8px; color: #666;">
                        Firebase 연결 상태를 확인해주세요. 또는 Firestore 보안 규칙에서 관리자 권한이 있는지 확인해주세요.
                    </p>
                </div>
            `;
        }
    }
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ in8 관리자 시스템 초기화 완료');
});

/**
 * ==================== 한의원 관리 기능 ====================
 */

// 선택된 로고 이미지 (Base64)
let selectedLogoImage = null;

// 로고 파일 선택 처리
function handleLogoFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        alert('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
    }
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }
    
    // 파일을 Base64로 변환
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedLogoImage = e.target.result;
        
        // 미리보기 표시
        const preview = document.getElementById('logoPreview');
        const previewContainer = document.getElementById('logoPreviewContainer');
        
        if (preview && previewContainer) {
            preview.src = selectedLogoImage;
            previewContainer.style.display = 'block';
        }
        
        // URL 입력창 비우기
        const urlInput = document.getElementById('hospitalLogoUrl');
        if (urlInput) {
            urlInput.value = '';
        }
        
        console.log('✅ 로고 이미지 선택 완료');
    };
    
    reader.onerror = function() {
        alert('이미지 파일을 읽는데 실패했습니다.');
        console.error('❌ 파일 읽기 실패');
    };
    
    reader.readAsDataURL(file);
}

// URL 입력 시 처리
function handleLogoUrlChange() {
    const urlInput = document.getElementById('hospitalLogoUrl');
    const url = urlInput.value.trim();
    
    if (url) {
        selectedLogoImage = url;
        
        // 미리보기 표시
        const preview = document.getElementById('logoPreview');
        const previewContainer = document.getElementById('logoPreviewContainer');
        
        if (preview && previewContainer) {
            preview.src = url;
            previewContainer.style.display = 'block';
        }
        
        console.log('✅ 로고 URL 입력 완료');
    }
}

// 로고 이미지 제거
function removeLogoImage() {
    selectedLogoImage = null;
    
    // 미리보기 숨기기
    const previewContainer = document.getElementById('logoPreviewContainer');
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    // 입력 필드 초기화
    const fileInput = document.getElementById('hospitalLogoFile');
    const urlInput = document.getElementById('hospitalLogoUrl');
    
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    
    console.log('✅ 로고 이미지 제거 완료');
}

// 한의원 목록 로드
async function loadHospitalList() {
    try {
        console.log('🔄 한의원 목록 로딩...');
        const hospitals = await getAllHospitals();
        const listContainer = document.getElementById('hospitalListContainer');
        
        if (!listContainer) {
            console.error('❌ hospitalListContainer 요소를 찾을 수 없습니다.');
            return;
        }
        
        if (hospitals.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #e0e0e0;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🏥</div>
                    <p style="color: #666; font-size: 1.1rem; margin-bottom: 10px;">등록된 한의원이 없습니다.</p>
                    <p style="color: #999; font-size: 0.9rem;">상단의 "한의원 등록" 버튼을 클릭하여 첫 한의원을 등록하세요.</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = '';
        hospitals.forEach((hospital, index) => {
            const card = document.createElement('div');
            card.className = 'hospital-card';
            card.style.cssText = `
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
                transition: all 0.3s ease;
            `;
            
            card.innerHTML = `
                <div style="display: flex; gap: 20px; align-items: start;">
                    ${hospital.logoUrl ? `
                        <div style="flex-shrink: 0;">
                            <img src="${hospital.logoUrl}" 
                                 alt="${hospital.name}" 
                                 style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                 onerror="this.style.display='none'">
                        </div>
                    ` : `
                        <div style="flex-shrink: 0; width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 2rem; border: 3px solid #667eea;">
                            🏥
                        </div>
                    `}
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <h3 style="margin: 0 0 5px 0; font-size: 1.3rem; color: #333;">
                                ${index + 1}. ${hospital.name}
                            </h3>
                            <span style="background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                등록됨
                            </span>
                        </div>
                        ${hospital.description ? `
                            <p style="color: #666; margin-bottom: 15px; line-height: 1.6;">${hospital.description}</p>
                        ` : `
                            <p style="color: #999; margin-bottom: 15px; font-style: italic;">소개글이 없습니다.</p>
                        `}
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn" onclick="editHospital('${hospital.id}')" 
                                    style="flex: 1; min-width: 120px; padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-size: 0.95rem;">
                                ✏️ 수정
                            </button>
                            <button class="btn btn-danger" onclick="deleteHospitalConfirm('${hospital.id}')" 
                                    style="flex: 1; min-width: 120px; padding: 10px 20px; font-size: 0.95rem;">
                                🗑️ 삭제
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // 호버 효과
            card.addEventListener('mouseenter', function() {
                this.style.borderColor = '#667eea';
                this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                this.style.transform = 'translateY(-2px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e0e0e0';
                this.style.boxShadow = 'none';
                this.style.transform = 'translateY(0)';
            });
            
            listContainer.appendChild(card);
        });
        
        console.log('✅ 한의원 목록 로드 완료:', hospitals.length + '개');
    } catch (error) {
        console.error('❌ 한의원 목록 로드 실패:', error);
        const listContainer = document.getElementById('hospitalListContainer');
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px;">
                    <p style="color: #856404; font-size: 1rem; margin-bottom: 10px;">⚠️ 한의원 목록을 불러오는데 실패했습니다.</p>
                    <p style="color: #856404; font-size: 0.9rem;">오류: ${error.message}</p>
                    <button class="btn" onclick="loadHospitalList()" style="margin-top: 15px;">🔄 다시 시도</button>
                </div>
            `;
        }
    }
}

// 한의원 등록 폼 표시
function showAddHospitalForm() {
    const form = document.getElementById('addHospitalForm');
    const list = document.getElementById('hospitalListSection');
    
    if (form) form.style.display = 'block';
    if (list) list.style.display = 'none';
    
    // 폼 초기화
    document.getElementById('hospitalId').value = '';
    document.getElementById('hospitalName').value = '';
    document.getElementById('hospitalLogoUrl').value = '';
    document.getElementById('hospitalDescription').value = '';
    document.getElementById('hospitalFormTitle').textContent = '한의원 등록';
    
    // 이미지 초기화
    selectedLogoImage = null;
    const fileInput = document.getElementById('hospitalLogoFile');
    if (fileInput) fileInput.value = '';
    
    const previewContainer = document.getElementById('logoPreviewContainer');
    if (previewContainer) previewContainer.style.display = 'none';
}

// 한의원 등록/수정
async function saveHospital() {
    const hospitalId = document.getElementById('hospitalId').value;
    const name = document.getElementById('hospitalName').value.trim();
    const description = document.getElementById('hospitalDescription').value.trim();
    const imageUrl = document.getElementById('hospitalImageUrl').value.trim();
    const websiteUrl = document.getElementById('hospitalWebsiteUrl').value.trim();
    
    if (!name) {
        alert('한의원명을 입력해주세요.');
        return;
    }
    
    // 로고 이미지: selectedLogoImage (Base64 또는 URL)
    const logoUrl = selectedLogoImage || '';
    
    try {
        const hospitalData = {
            name,
            logoUrl,
            description,
            imageUrl: imageUrl || null,
            websiteUrl: websiteUrl || null
        };
        
        console.log('💾 한의원 저장 중...', hospitalData.name);
        
        if (hospitalId) {
            // 수정
            await updateHospitalInfo(hospitalId, hospitalData);
            alert('한의원 정보가 수정되었습니다.');
            console.log('✅ 한의원 수정 완료:', hospitalId);
        } else {
            // 신규 등록
            const newId = await saveHospitalInfo(hospitalData);
            alert('한의원이 등록되었습니다.');
            console.log('✅ 한의원 등록 완료:', newId);
        }
        
        // 목록으로 돌아가기
        cancelHospitalForm();
        loadHospitalList();
    } catch (error) {
        console.error('❌ 한의원 저장 실패:', error);
        alert('한의원 정보 저장에 실패했습니다.\n오류: ' + error.message);
    }
}

// 한의원 수정 폼 표시
async function editHospital(hospitalId) {
    try {
        const hospital = await getHospitalInfo(hospitalId);
        
        if (!hospital) {
            alert('한의원 정보를 찾을 수 없습니다.');
            return;
        }
        
        // 폼 표시
        const form = document.getElementById('addHospitalForm');
        const list = document.getElementById('hospitalListSection');
        
        if (form) form.style.display = 'block';
        if (list) list.style.display = 'none';
        
        // 폼에 데이터 입력
        document.getElementById('hospitalId').value = hospital.id;
        document.getElementById('hospitalName').value = hospital.name;
        document.getElementById('hospitalLogoUrl').value = '';
        document.getElementById('hospitalDescription').value = hospital.description || '';
        document.getElementById('hospitalImageUrl').value = hospital.imageUrl || '';
        document.getElementById('hospitalWebsiteUrl').value = hospital.websiteUrl || '';
        document.getElementById('hospitalFormTitle').textContent = '한의원 수정';
        
        // 기존 로고 이미지 표시
        if (hospital.logoUrl) {
            selectedLogoImage = hospital.logoUrl;
            
            const preview = document.getElementById('logoPreview');
            const previewContainer = document.getElementById('logoPreviewContainer');
            
            if (preview && previewContainer) {
                preview.src = hospital.logoUrl;
                previewContainer.style.display = 'block';
            }
        } else {
            selectedLogoImage = null;
            const previewContainer = document.getElementById('logoPreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
        }
        
        console.log('✅ 한의원 수정 폼 로드 완료:', hospital.name);
        
    } catch (error) {
        console.error('❌ 한의원 정보 로드 실패:', error);
        alert('한의원 정보를 불러오는데 실패했습니다.');
    }
}

// 한의원 삭제 확인
function deleteHospitalConfirm(hospitalId) {
    if (confirm('정말로 이 한의원을 삭제하시겠습니까?')) {
        deleteHospitalAction(hospitalId);
    }
}

// 한의원 삭제 실행
async function deleteHospitalAction(hospitalId) {
    try {
        await deleteHospital(hospitalId);
        alert('한의원이 삭제되었습니다.');
        loadHospitalList();
    } catch (error) {
        console.error('❌ 한의원 삭제 실패:', error);
        alert('한의원 삭제에 실패했습니다.');
    }
}

// 한의원 폼 취소
function cancelHospitalForm() {
    const form = document.getElementById('addHospitalForm');
    const list = document.getElementById('hospitalListSection');
    
    if (form) form.style.display = 'none';
    if (list) list.style.display = 'block';
    
    // 이미지 초기화
    selectedLogoImage = null;
    const fileInput = document.getElementById('hospitalLogoFile');
    if (fileInput) fileInput.value = '';
    
    const previewContainer = document.getElementById('logoPreviewContainer');
    if (previewContainer) previewContainer.style.display = 'none';
}

