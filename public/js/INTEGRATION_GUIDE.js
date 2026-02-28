/**
 * MealMate Shop - 통합 구성 및 사용 가이드
 * HTML 페이지에서 필요한 스크립트 연결 방법
 */

// ============================================
// HTML에 다음 스크립트를 추가하세요
// ============================================

/*
<head>
    <!-- 데이터베이스 서비스 -->
    <script src="/js/database.js"></script>
    
    <!-- 쇼핑몰 API 통합 -->
    <script src="/js/shopping-api.js"></script>
    
    <!-- 핵심 재료 매칭 로직 -->
    <script src="/js/ingredient-matcher.js"></script>
    
    <!-- 사용 예시 -->
    <script src="/js/examples.js"></script>
</head>
*/

// ============================================
// 환경 변수 설정 (Node.js 백엔드에서)
// ============================================

/*
# .env 파일에 다음을 추가하세요:

# 네이버 API
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 쿠팡 API
COUPANG_API_KEY=your_coupang_api_key

# 위메프 API
WEMAKEPRICE_API_KEY=your_wemakeprice_api_key
*/

// ============================================
// API 흐름도
// ============================================

/*
┌─────────────────────────────────────────────┐
│      사용자가 레시피 선택                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   AI가 레시피에서 재료 추출                    │
│  예) 계란, 우유, 밀가루, 버터                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  ingredientMatcher.matchRecipeIngredients() │
│  각 재료에 대해 쇼핑몰 API 호출              │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        ▼             ▼          ▼
   ┌───────┐    ┌───────┐   ┌────────┐
   │ 네이버 │    │쿠팡   │   │위메프  │
   │ 쇼핑  │    │      │   │       │
   └───────┘    └───────┘   └────────┘
        │             │          │
        └──────┬──────┴──────────┘
               ▼
    ┌─────────────────────────┐
    │  최저가 선택 및 통합     │
    │  - 가격 비교            │
    │  - 배송료 고려          │
    │  - 재고 확인            │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │   IndexedDB 저장        │
    │  - 매칭 결과 저장      │
    │  - 검색 히스토리 저장   │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │  사용자에게 결과 표시    │
    │  - 재료별 최저가        │
    │  - 판매처 및 링크       │
    │  - 총 금액              │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │  장바구니에 추가        │
    │  addToCart()            │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │  쇼핑몰 결제 페이지로   │
    │  리다이렉트            │
    └─────────────────────────┘
*/

// ============================================
// 주요 함수별 설명
// ============================================

/*
1. matchGroceryToMall(ingredientList)
   - 용도: 재료 리스트를 받아 최저가 정보 반환
   - 입력: [{ name: '계란', quantity: '10개' }, ...]
   - 출력: 최저가, 판매처, 링크 등 포함된 객체 배열
   - 처리: 네이버/쿠팡/위메프 동시 검색 → 최저가 선택

2. compareMultipleMalls(ingredientName)
   - 용도: 특정 재료의 쇼핑몰별 가격 비교
   - 입력: '계란'
   - 출력: 가격 + 판매처 정보가 정렬된 배열

3. addToCart(matchedItems, userId)
   - 용도: 매칭된 재료를 장바구니에 추가
   - 입력: 매칭 결과 배열, 사용자 ID
   - 출력: 장바구니 ID, 추가된 상품 수, 총액

4. saveSearchHistory(userId, ingredientList)
   - 용도: 검색 기록을 DB에 저장
   - 입력: 사용자 ID, 검색한 재료 리스트
   - 출력: 저장된 히스토리 ID

5. matchRecipeIngredients(recipeId)
   - 용도: 전체 요리 재료 한 번에 매칭
   - 입력: 요리 ID
   - 출력: 모든 재료의 최저가 정보

6. searchLowestPrice(ingredientName)
   - 용도: 단일 재료의 최저가 검색
   - 입력: 재료명
   - 출력: 최저가, 판매처, 링크
*/

// ============================================
// 데이터 구조
// ============================================

/*
매칭된 재료 객체 (MatchedItem):
{
    id: 'match_1234567890_abc123def',
    name: '계란',
    quantity: '10개',
    category: 'general',
    bestPrice: 4500,           // 가장 저렴한 가격
    originalPrice: 5500,       // 원래 가격
    discountPercent: 18,       // 할인율
    mallLink: 'https://....',  // 쇼핑몰 링크
    mallName: '쿠팡',
    deliveryFee: 0,            // 배송료
    totalPrice: 4500,          // 배송료 포함 총액
    image: 'https://....',     // 상품 이미지
    rating: 4.8,               // 평점
    reviews: 250,              // 리뷰 수
    inStock: true,             // 재고 여부
    updatedAt: '2024-01-15T10:30:00Z'
}

장바구니 객체 (Cart):
{
    id: 'cart_1234567890',
    userId: 'user_001',
    items: [
        {
            productId: 'match_xxx',
            name: '계란',
            quantity: '10개',
            price: 4500,
            mallUrl: 'https://...',
            mallName: '쿠팡'
        },
        ...
    ],
    totalPrice: 15000,
    createdAt: '2024-01-15T10:35:00Z'
}
*/

// ============================================
// 성능 최적화 팁
// ============================================

/*
1. 캐싱
   - ingredientMatcher.cache를 사용하여 최근 검색 결과 캐싱
   - 같은 재료를 다시 검색할 때 API 호출 줄임
   - 캐시 초기화: ingredientMatcher.clearCache()

2. 배치 처리
   - 여러 재료를 한 번에 처리하는 것이 개별 처리보다 효율적
   - Promise.allSettled()로 실패에 강함

3. 데이터베이스
   - IndexedDB를 사용하여 로컬에 캐싱
   - 네트워크 느린 환경에서 빠른 응답 가능
   - 오프라인 상태에서도 이전 검색 결과 사용 가능

4. API 요청 제한
   - 각 쇼핑몰의 rate limit 준수
   - 실패한 요청은 재시도 로직 구현 권장
*/

// ============================================
// 에러 처리
// ============================================

/*
try {
    const results = await ingredientMatcher.matchGroceryToMall(ingredients);
} catch (error) {
    // 에러 타입별 처리
    if (error.message.includes('API')) {
        // API 오류 처리
        console.error('쇼핑몰 API 오류:', error);
    } else if (error.message.includes('DATABASE')) {
        // 데이터베이스 오류 처리
        console.error('데이터베이스 오류:', error);
    } else {
        // 일반 오류 처리
        console.error('알 수 없는 오류:', error);
    }
}
*/

// ============================================
// 통합 테스트
// ============================================

/*
async function runFullTest() {
    console.log('=== MealMate 통합 테스트 시작 ===\n');

    try {
        // 1. 기본 매칭 테스트
        console.log('✓ 기본 재료 매칭 테스트');
        await example1_basicMatching();
        
        // 2. 쇼핑몰 비교 테스트
        console.log('✓ 쇼핑몰 가격 비교 테스트');
        await example3_compareShops('계란');
        
        // 3. 장바구니 테스트
        console.log('✓ 장바구니 추가 테스트');
        await example4_addToCart('test_user_001');
        
        // 4. 통합 워크플로우 테스트
        console.log('✓ 전체 워크플로우 테스트');
        await completeWorkflow('test_user_001', 'recipe_001');
        
        console.log('\n=== 모든 테스트 완료! ===');
    } catch (error) {
        console.error('테스트 실패:', error);
    }
}

// 테스트 실행
// await runFullTest();
*/
