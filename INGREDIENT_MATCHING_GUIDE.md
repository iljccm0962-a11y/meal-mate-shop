# MealMate Shop - 재료 매칭 시스템 가이드

## 📋 개요

MealMate Shop의 핵심 기능은 **AI가 추출한 재료를 쇼핑몰 최저가와 연결하는 것**입니다. 이 문서에서는 이 시스템의 구조와 사용 방법을 설명합니다.

---

## 🏗️ 시스템 아키텍처

### 파일 구조
```
js/
├── database.js                 # IndexedDB 데이터베이스 서비스
├── shopping-api.js             # 쇼핑몰 API 통합 (네이버, 쿠팡, 위메프)
├── ingredient-matcher.js       # 핵심 재료 매칭 엔진
├── examples.js                 # 사용 예시 및 테스트 코드
└── INTEGRATION_GUIDE.js        # 상세 통합 가이드
```

### 데이터 흐름
```
사용자 선택 (요리)
    ↓
AI 재료 추출 (계란, 우유, 밀가루, ...)
    ↓
재료 매칭 (matchGroceryToMall)
    ├─→ 네이버 쇼핑 API 검색
    ├─→ 쿠팡 API 검색
    └─→ 위메프 API 검색
    ↓
최저가 선택 및 정렬
    ↓
IndexedDB 저장
    ↓
사용자 표시 (가격, 링크, 평점 등)
    ↓
장바구니 추가 (선택 사항)
    ↓
쇼핑몰 결제 페이지로 이동
```

---

## 🚀 빠른 시작

### 1. 기본 재료 매칭

```javascript
// AI가 추출한 재료 리스트
const ingredients = [
    { name: '계란', quantity: '10개' },
    { name: '우유', quantity: '1L' },
    { name: '밀가루', quantity: '1kg' }
];

// 재료를 쇼핑몰과 매칭
const results = await ingredientMatcher.matchGroceryToMall(ingredients);

// 결과 확인
results.forEach(item => {
    console.log(`${item.name}: ${item.bestPrice}원 (${item.mallName})`);
});
```

**출력 예시:**
```
계란: 4,500원 (쿠팡)
우유: 3,200원 (네이버 쇼핑)
밀가루: 2,800원 (위메프)
```

### 2. 요리 기반 자동 매칭

```javascript
// 특정 요리의 모든 재료 자동 매칭
const matchedItems = await ingredientMatcher.matchRecipeIngredients('recipe_001');

// 총 금액 계산
const totalPrice = matchedItems.reduce((sum, item) => sum + item.totalPrice, 0);
console.log(`총액: ${totalPrice.toLocaleString()}원`);
```

### 3. 장바구니에 추가

```javascript
// 매칭된 재료를 장바구니에 추가
const cartResult = await ingredientMatcher.addToCart(matchedItems, userId);

console.log(`
장바구니 ID: ${cartResult.cartId}
추가된 상품: ${cartResult.itemCount}개
총액: ${cartResult.totalPrice.toLocaleString()}원
`);
```

---

## 📚 주요 API

### IngredientMatcher 클래스

#### matchGroceryToMall(ingredientList)
재료 리스트를 받아 최저가 정보와 함께 반환합니다.

**매개변수:**
- `ingredientList` (Array): 재료 정보 배열
  ```javascript
  [
    { name: '계란', quantity: '10개', category: 'egg' },
    { name: '우유', quantity: '1L', category: 'dairy' }
  ]
  ```

**반환값:**
```javascript
[
  {
    id: 'match_1234567890_abc123def',
    name: '계란',
    quantity: '10개',
    category: 'egg',
    bestPrice: 4500,              // 최저가
    originalPrice: 5500,           // 원가
    discountPercent: 18,           // 할인율
    mallLink: 'https://...',       // 상품 링크
    mallName: '쿠팡',
    deliveryFee: 0,                // 배송료
    totalPrice: 4500,              // 총액 (배송료 포함)
    image: 'https://...',          // 상품 이미지
    rating: 4.8,                   // 평점
    reviews: 250,                  // 리뷰 수
    inStock: true,                 // 재고
    updatedAt: '2024-01-15T10:30:00Z'
  },
  ...
]
```

#### compareMultipleMalls(ingredientName)
특정 재료의 쇼핑몰별 가격을 비교합니다.

**예시:**
```javascript
const comparison = await ingredientMatcher.compareMultipleMalls('계란');

console.log(`최저가: ${comparison.lowest}원 (${comparison.mall})`);
comparison.alternatives.forEach(alt => {
    console.log(`${alt.mallName}: ${alt.price}원`);
});
```

#### addToCart(matchedItems, userId)
매칭된 재료를 장바구니에 추가합니다.

**매개변수:**
- `matchedItems` (Array): matchGroceryToMall의 반환값
- `userId` (String): 사용자 ID

**반환값:**
```javascript
{
    success: true,
    cartId: 'cart_1234567890',
    itemCount: 3,
    totalPrice: 12500
}
```

#### matchRecipeIngredients(recipeId)
특정 요리의 모든 재료를 자동으로 매칭합니다.

**예시:**
```javascript
const items = await ingredientMatcher.matchRecipeIngredients('recipe_breakfast');
// 2024년 아침 식사 레시피의 모든 재료 최저가 정보 반환
```

#### saveSearchHistory(userId, ingredientList)
검색 기록을 데이터베이스에 저장합니다.

```javascript
await ingredientMatcher.saveSearchHistory('user_001', [
    { name: '계란', quantity: '10개' },
    { name: '우유', quantity: '1L' }
]);
```

---

### ShoppingAPI 클래스

#### searchLowestPrice(ingredientName)
모든 쇼핑몰에서 동시에 검색하여 최저가를 반환합니다.

**최적화:**
- Promise.allSettled()로 한 쇼핑몰 실패 시에도 다른 결과 반환
- 병렬 처리로 빠른 응답

#### searchNaver(query)
네이버 쇼핑에서 검색합니다.

**필요한 환경변수:**
```
NAVER_CLIENT_ID=your_id
NAVER_CLIENT_SECRET=your_secret
```

#### searchCoupang(query)
쿠팡에서 검색합니다.

**필요한 환경변수:**
```
COUPANG_API_KEY=your_api_key
```

#### searchWemakePrice(query)
위메프에서 검색합니다.

#### getRecommendedProducts(ingredientName, options)
추천 상품을 조회합니다.

```javascript
const products = await shoppingAPI.getRecommendedProducts('계란', {
    brand: '프리미엄',
    quality: '신선'
});
```

---

### DatabaseService 클래스

#### saveIngredientMatch(ingredientMatch)
매칭 결과를 IndexedDB에 저장합니다.

#### getIngredientMatch(id)
저장된 매칭 결과를 조회합니다.

#### saveCart(cart)
장바구니를 저장합니다.

```javascript
const cartId = await database.saveCart({
    userId: 'user_001',
    items: [...],
    totalPrice: 12500,
    createdAt: '2024-01-15T10:35:00Z'
});
```

#### getUserCarts(userId)
사용자의 모든 장바구니를 조회합니다.

```javascript
const carts = await database.getUserCarts('user_001');
```

#### saveSearchHistory(searchHistory)
검색 기록을 저장합니다.

#### getUserSearchHistory(userId, limit)
사용자의 검색 기록을 조회합니다.

```javascript
const history = await database.getUserSearchHistory('user_001', 10);
```

---

## 🔧 환경 설정

### 1. API 키 설정

`.env` 파일을 생성하고 다음을 추가하세요:

```env
# 네이버 쇼핑 API
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 쿠팡 API
COUPANG_API_KEY=your_coupang_api_key

# 위메프 API
WEMAKEPRICE_API_KEY=your_wemakeprice_api_key
```

### 2. HTML에 스크립트 추가

```html
<head>
    <!-- 기본 순서를 지켜주세요 -->
    <script src="js/database.js"></script>
    <script src="js/shopping-api.js"></script>
    <script src="js/ingredient-matcher.js"></script>
    <script src="js/examples.js"></script>
</head>
```

### 3. Node.js 백엔드 설정 (선택사항)

```bash
npm install express dotenv node-fetch
```

---

## 💡 실전 예시

### 예시 1: 아침 식사 요리 자동 매칭

```javascript
async function cookBreakfast() {
    // 계란 계란말이 레시피
    const recipe = 'recipe_egg_roll';
    
    // 재료 자동 매칭
    const ingredients = await ingredientMatcher.matchRecipeIngredients(recipe);
    
    // 결과 표시
    console.log('🍳 계란 계란말이 레시피');
    console.log('필요한 재료:');
    
    let total = 0;
    ingredients.forEach(item => {
        console.log(`- ${item.name}: ${item.bestPrice}원`);
        total += item.totalPrice;
    });
    
    console.log(`\n총액: ${total.toLocaleString()}원`);
    
    // 장바구니 추가
    const cart = await ingredientMatcher.addToCart(ingredients, 'user_123');
    console.log(`장바구니 ID: ${cart.cartId}`);
}

await cookBreakfast();
```

### 예시 2: 여러 재료 가격 비교

```javascript
async function comparePrices() {
    const ingredients = ['계란', '우유', '버터', '치즈'];
    
    for (const item of ingredients) {
        const result = await ingredientMatcher.compareMultipleMalls(item);
        console.log(`\n${item}:`);
        console.log(`최저가: ${result.lowest.toLocaleString()}원 (${result.mall})`);
        
        result.alternatives.forEach((alt, idx) => {
            console.log(`${idx + 1}. ${alt.mallName}: ${alt.price.toLocaleString()}원`);
        });
    }
}

await comparePrices();
```

### 예시 3: 검색 히스토리 기반 추천

```javascript
async function getHistoryBasedRecommendations(userId) {
    // 사용자의 검색 기록 조회
    const history = await database.getUserSearchHistory(userId, 5);
    
    // 최근 검색한 재료 추출
    const recentIngredients = new Set();
    history.forEach(item => {
        item.ingredients.forEach(ing => {
            recentIngredients.add(ing.name);
        });
    });
    
    console.log('추천 상품:');
    for (const ingredient of recentIngredients) {
        const recommendations = await shoppingAPI.getRecommendedProducts(ingredient);
        if (recommendations.length > 0) {
            const cheapest = recommendations[0];
            console.log(`${ingredient}: ${cheapest.price.toLocaleString()}원 (${cheapest.mallName})`);
        }
    }
}

await getHistoryBasedRecommendations('user_123');
```

---

## 🧪 테스트

### 테스트 코드 실행

```javascript
// 모든 함수 테스트
await example1_basicMatching();       // 기본 매칭
await example3_compareShops('계란');  // 쇼핑몰 비교
await example4_addToCart('test_user'); // 장바구니
await completeWorkflow('test_user', 'recipe_001'); // 통합 워크플로우
```

### 성능 테스트

```javascript
console.time('matching');
const results = await ingredientMatcher.matchGroceryToMall([
    { name: '계란', quantity: '10개' },
    { name: '우유', quantity: '1L' },
    { name: '밀가루', quantity: '1kg' }
]);
console.timeEnd('matching');
// 예상 시간: 2-3초
```

---

## ⚡ 성능 최적화

### 1. 캐싱 활용
```javascript
// 캐시된 결과 재사용
const cached = await ingredientMatcher.matchGroceryToMall(['계란']);  // ~3초
const cached2 = await ingredientMatcher.matchGroceryToMall(['계란']); // ~10ms (캐시)

// 캐시 초기화
ingredientMatcher.clearCache();
```

### 2. 배치 처리
```javascript
// 장점: 영원한 처리시간 단축
const items = [
    { name: '계란', quantity: '10개' },
    { name: '우유', quantity: '1L' },
    { name: '밀가루', quantity: '1kg' },
    { name: '버터', quantity: '200g' }
];

// 한 번에 처리 (병렬)
const results = await ingredientMatcher.matchGroceryToMall(items); // ~3초

// vs

// 개별 처리 (순차)
const results = [];
for (const item of items) {
    results.push(await ingredientMatcher.matchGroceryToMall([item])); // ~12초
}
```

### 3. IndexedDB 캐싱
```javascript
// 네트워크 느린 환경에서도 빠른 응답
const cachedResult = await database.getIngredientMatch('match_123');
```

---

## 🐛 에러 처리

### 기본 에러 처리

```javascript
try {
    const results = await ingredientMatcher.matchGroceryToMall(ingredients);
} catch (error) {
    if (error.message.includes('API')) {
        console.error('쇼핑몰 API 오류. 나중에 다시 시도하세요.');
    } else if (error.message.includes('DATABASE')) {
        console.error('데이터베이스 오류. 로컬 캐시를 사용합니다.');
    } else {
        console.error('알 수 없는 오류:', error.message);
    }
}
```

### 재시도 로직

```javascript
async function matchWithRetry(ingredients, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await ingredientMatcher.matchGroceryToMall(ingredients);
        } catch (error) {
            console.warn(`시도 ${attempt} 실패:`, error.message);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            } else {
                throw error;
            }
        }
    }
}
```

---

## 📊 모니터링

### 매칭 결과 분석

```javascript
async function analyzeMatchingResults(userId) {
    const history = await database.getUserSearchHistory(userId, 10);
    
    let totalSearches = history.length;
    let totalPrice = 0;
    let avgDiscount = 0;
    
    history.forEach(search => {
        const avg = search.items.reduce((sum, item) => sum + item.totalPrice, 0) / search.items.length;
        totalPrice += avg;
    });
    
    console.log(`
📊 사용자 분석 (${userId}):
- 총 검색 수: ${totalSearches}회
- 평균 구매액: ${Math.round(totalPrice / totalSearches).toLocaleString()}원
- 평균 재료 수: ${Math.round(history.reduce((sum, h) => sum + h.items.length, 0) / totalSearches)}개
    `);
}
```

---

## 🎯 다음 단계

1. **사용자 추천 시스템** - 검색 히스토리 기반 개인화 추천
2. **가격 추적** - 재료별 가격 변동 추적
3. **요리 추천** - 사용 가능한 재료 기반 요리 추천
4. **구독 시스템** - 정기 배송 구매
5. **커뮤니티** - 사용자 리뷰 및 평가

---

## 📞 지원

문제가 발생하면 `js/INTEGRATION_GUIDE.js`의 상세 가이드를 참조하세요.
