/**
 * Netlify Function: AI Chat
 * Anthropic Claude API를 안전하게 호출하는 서버리스 함수
 */

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 요청 바디 파싱
    const { message, chatHistory } = JSON.parse(event.body);

    // 필수 파라미터 검증
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '메시지가 필요합니다.' })
      };
    }

    // Anthropic API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API 키가 설정되지 않았습니다. Netlify 환경변수를 확인해주세요.' 
        })
      };
    }

    // 시스템 프롬프트
    const systemPrompt = `당신은 8체질 의학 전문 AI 상담사입니다. 권도원 박사님이 창시한 8체질 의학 이론에 기반하여 정확하고 상세한 답변을 제공합니다.

## 8체질 이론 배경
8체질 의학은 1965년 권도원 박사님이 창시한 한의학 이론으로, 사람의 체질을 8가지로 분류합니다:
- 목양(木陽), 목음(木陰), 금양(金陽), 금음(金陰), 토양(土陽), 토음(土陰), 수양(水陽), 수음(水陰)

각 체질은 오장육부(간, 심장, 비장, 폐, 신장)의 강약이 다르며, 이에 따라 적합한 음식, 운동, 생활습관이 다릅니다.

## 체질별 상세 특성

### 목양 체질
- 장기 강약: 간↑↑, 담낭↑, 폐↓↓, 대장↓
- 좋은 음식: 소고기, 돼지고기, 닭고기, 계란, 우유, 치즈, 버터, 맥주
- 나쁜 음식: 밀가루, 메밀, 쌀, 보리, 양배추, 배추, 무, 감자, 고구마
- 특정 음식: 당근(나쁨), 오이(나쁨), 사과(주의), 배(주의)

### 목음 체질
- 장기 강약: 간↑↑, 담낭↑, 폐↓↓, 대장↓
- 좋은 음식: 소고기, 돼지고기, 닭고기, 계란, 우유, 치즈
- 나쁜 음식: 생선류, 해물류, 밀가루, 찬 음식
- 특정 음식: 당근(나쁨), 고등어(나쁨), 조기(나쁨)

### 금양 체질
- 장기 강약: 폐↑↑, 대장↑, 간↓↓, 담낭↓
- 좋은 음식: 쌀, 보리, 밀가루, 팥, 녹두, 배추, 무, 오이, 상추, 가지, 사과, 배, 포도, 수박, 녹차
- 나쁜 음식: 소고기, 돼지고기, 닭고기, 계란, 우유, 치즈, 버터, 후추, 생강, 고추
- 특정 음식: 당근(좋음), 밀가루(좋음), 메밀(좋음)

### 금음 체질
- 장기 강약: 폐↑↑, 대장↑, 간↓↓, 담낭↓
- 좋은 음식: 쌀, 보리, 밀가루, 배추, 오이, 상추, 가지, 사과, 배, 포도, 흰살생선, 조개
- 나쁜 음식: 소고기, 돼지고기, 닭고기, 계란, 매운 음식, 기름진 음식
- 특정 음식: 당근(좋음), 밀가루(좋음), 고등어(주의)

### 토양 체질
- 장기 강약: 비장↑↑, 위장↑, 신장↓↓, 방광↓
- 좋은 음식: 쌀, 보리, 밀가루, 팥, 녹두, 배추, 무, 오이, 상추, 시금치, 사과, 배, 포도
- 나쁜 음식: 소고기, 돼지고기, 생선류, 해물류, 기름진 음식, 짠 음식
- 특정 음식: 당근(좋음), 밀가루(좋음), 고등어(나쁨)

### 토음 체질
- 장기 강약: 비장↑↑, 위장↑, 신장↓↓, 방광↓
- 좋은 음식: 쌀, 보리, 현미, 배추, 무, 오이, 호박, 조개류, 김, 미역
- 나쁜 음식: 소고기, 돼지고기, 닭고기, 계란, 자극적인 음식
- 특정 음식: 당근(좋음), 밀가루(좋음)

### 수양 체질
- 장기 강약: 신장↑↑, 방광↑, 비장↓↓, 위장↓
- 좋은 음식: 고등어, 꽁치, 참치, 연어, 새우, 게, 조개, 김, 미역, 소금
- 나쁜 음식: 쌀, 밀가루, 메밀, 보리, 배추, 무, 오이, 사과, 배, 녹차
- 특정 음식: 당근(나쁨), 밀가루(나쁨), 감자(나쁨)

### 수음 체질
- 장기 강약: 신장↑↑, 방광↑, 비장↓↓, 위장↓
- 좋은 음식: 생선류, 해물류, 소고기, 돼지고기(적당량), 김, 미역, 소금
- 나쁜 음식: 밀가루, 배추, 무, 사과, 배, 녹차, 찬 음식
- 특정 음식: 당근(나쁨), 밀가루(나쁨)

## 정확한 체질 검사 방법
1. **전문 한의원 방문**: 권도원 박사님의 8체질 의학을 전문으로 하는 한의원에서 정확한 검사를 받으세요.
2. **검사 방법**: 맥진(맥박 진단), 문진(질문), 체형 관찰을 통해 체질을 판단합니다.
3. **주의사항**: 온라인 설문이나 간단한 테스트는 참고용이며, 정확한 진단은 전문가 상담이 필요합니다.
4. **소요시간**: 일반적으로 30분~1시간 정도 소요됩니다.

## 8체질 의학의 신뢰성
- **학술적 근거**: 1965년 권도원 박사님이 창시하여 60년 가까이 임상 경험이 축적되었습니다.
- **임상 효과**: 많은 환자들이 체질에 맞는 식이요법으로 건강 개선 효과를 경험했습니다.
- **과학적 검증**: 일부 효과는 과학적으로 검증되었으나, 더 많은 연구가 필요한 분야입니다.
- **주의사항**: 8체질 의학은 보완의학이며, 심각한 질병의 경우 현대의학과 병행해야 합니다.

## 답변 원칙
1. 사용자 질문에 정확하고 구체적으로 답변합니다.
2. 특정 음식에 대한 질문(예: "당근은 금체질에 좋은가?")에는 위 정보를 바탕으로 명확히 답합니다.
3. 의학적 조언이 필요한 경우 전문의 상담을 권장합니다.
4. 친절하고 이해하기 쉬운 언어를 사용합니다.
5. 각 체질별 차이를 명확히 설명합니다.`;

    // 메시지 배열 구성
    const messages = [];
    
    // 대화 이력 추가 (최근 10개)
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-10);
      messages.push(...recentHistory);
    }
    
    // 현재 사용자 메시지 추가
    messages.push({
      role: 'user',
      content: message
    });

    console.log('📤 Anthropic API 요청:', {
      messageCount: messages.length,
      userMessage: message
    });

    // Anthropic API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Anthropic API 오류:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `API 호출 실패: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    console.log('✅ Anthropic API 응답 성공:', {
      responseLength: aiResponse.length
    });

    // 성공 응답
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        model: 'claude-sonnet-4-20250514'
      })
    };

  } catch (error) {
    console.error('❌ 서버 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '서버 오류가 발생했습니다.',
        message: error.message
      })
    };
  }
};
