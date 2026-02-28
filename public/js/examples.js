/**
 * MealMate Shop - 재료 매칭 사용 예시
 * AI가 추출한 재료를 쇼핑몰과 연결하는 실제 구현 예제
 */

// ============================================
// 예제 1: 기본 재료 매칭
// ============================================

async function example1_basicMatching() {
    try {
        // AI가 추출한 재료 리스트
        const ingredientList = [
            { name: '계란', quantity: '10개' },
            { name: '우유', quantity: '1L' },
            { name: '밀가루', quantity: '1kg' },
            { name: '버터', quantity: '200g' }
        ];

        console.log('🔍 재료 매칭 시작...');
        
        // 재료를 쇼핑몰과 매칭
        const results = await ingredientMatcher.matchGroceryToMall(ingredientList);

        console.log('✅ 매칭 완료!');
        console.log('재료별 최저가 정보:');
        
        results.forEach(item => {
            console.log(`
  - ${item.name} (${item.quantity})
    가격: ${item.bestPrice.toLocaleString()}원
    할인율: ${item.discountPercent}%
    판매처: ${item.mallName}
    배송료: ${item.deliveryFee.toLocaleString()}원
    총액: ${item.totalPrice.toLocaleString()}원
            `);
        });

        return results;
    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

// ============================================
// 예제 2: 요리 기반 재료 매칭
// ============================================

async function example2_recipeMatching(recipeId) {
    try {
        console.log(`🍳 요리 ID ${recipeId}의 재료 매칭 중...`);
        
        // 특정 요리의 모든 재료 자동 매칭
        const matchedIngredients = await ingredientMatcher.matchRecipeIngredients(recipeId);

        console.log('✅ 요리 재료 매칭 완료!');
        
        // 총 금액 계산
        const totalPrice = matchedIngredients.reduce((sum, item) => sum + item.totalPrice, 0);
        
        console.log(`
📊 매칭 결과:
- 재료 개수: ${matchedIngredients.length}개
- 총 금액: ${totalPrice.toLocaleString()}원
- 평균 가격: ${Math.round(totalPrice / matchedIngredients.length).toLocaleString()}원
        `);

        return matchedIngredients;
    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

// ============================================
// 예제 3: 여러 쇼핑몰 비교
// ============================================

async function example3_compareShops(ingredientName) {
    try {
        console.log(`🏪 ${ingredientName}의 쇼핑몰별 가격 비교...`);
        
        const comparison = await ingredientMatcher.compareMultipleMalls(ingredientName);

        console.log(`
✅ 가격 비교 결과:
최저가: ${comparison.lowest.toLocaleString()}원 (${comparison.mall})
링크: ${comparison.link}

📊 다른 쇼핑몰 가격:
        `);

        comparison.alternatives.forEach((alt, index) => {
            console.log(`${index + 1}. ${alt.mallName}: ${alt.price.toLocaleString()}원`);
        });

        return comparison;
    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

// ============================================
// 예제 4: 자동 장바구니 추가
// ============================================

async function example4_addToCart(userId) {
    try {
        // STEP 1: 재료 검색
        const ingredients = [
            { name: '계란', quantity: '10개' },
            { name: '우유', quantity: '1L' }
        ];

        console.log('🛒 장바구니 추가 프로세스 시작...');
        console.log('STEP 1: 재료 최저가 검색 중...');

        // STEP 2: 재료 매칭
        const matchedItems = await ingredientMatcher.matchGroceryToMall(ingredients);
        console.log('STEP 2: 재료 매칭 완료');

        // STEP 3: 장바구니에 추가
        console.log('STEP 3: 장바구니에 추가 중...');
        const cartResult = await ingredientMatcher.addToCart(matchedItems, userId);

        console.log(`
✅ 장바구니 추가 완료!
- 장바구니 ID: ${cartResult.cartId}
- 추가된 상품: ${cartResult.itemCount}개
- 총액: ${cartResult.totalPrice.toLocaleString()}원
        `);

        return cartResult;
    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

// ============================================
// 예제 5: 검색 히스토리 저장
// ============================================

async function example5_saveSearchHistory(userId) {
    try {
        const ingredients = [
            { name: '토마토', quantity: '1kg' },
            { name: '양파', quantity: '500g' },
            { name: '마늘', quantity: '100g' }
        ];

        console.log('💾 검색 히스토리 저장 중...');

        // 검색 결과 매칭
        const results = await ingredientMatcher.matchGroceryToMall(ingredients);

        // 히스토리 저장
        await ingredientMatcher.saveSearchHistory(userId, ingredients);

        console.log('✅ 검색 히스토리 저장 완료!');
        console.log(`저장된 재료: ${ingredients.map(i => i.name).join(', ')}`);

        return results;
    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

// ============================================
// 예제 6: 추천 상품 조회
// ============================================

async function example6_getRecommendations(ingredientName) {
    try {
        console.log(`🎁 ${ingredientName}의 추천 상품 조회 중...`);

        const recommendations = await shoppingAPI.getRecommendedProducts(ingredientName, {
            brand: '프리미엄',
            quality: '신선'
        });

        console.log(`✅ 추천 상품 조회 완료! (${recommendations.length}개)`);

        recommendations.forEach((item, index) => {
            console.log(`
${index + 1}. ${item.title}
   가격: ${item.price.toLocaleString()}원
   판매처: ${item.mallName}
   평점: ${item.rating}점 (${item.reviews}개 리뷰)
            `);
        });

        return recommendations;
    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

// ============================================
// 통합 사용 예시: 요리 선택 → 재료 매칭 → 장바구니 추가
// ============================================

async function completeWorkflow(userId, recipeId) {
    try {
        console.log('🚀 MealMate 통합 워크플로우 시작...\n');

        // STEP 1: 요리 선택 및 재료 매칭
        console.log('📖 STEP 1: 요리 재료 매칭');
        const matchedIngredients = await ingredientMatcher.matchRecipeIngredients(recipeId);
        console.log(`- ${matchedIngredients.length}개 재료 매칭 완료\n`);

        // STEP 2: 장바구니 추가
        console.log('🛒 STEP 2: 장바구니에 추가');
        const cartResult = await ingredientMatcher.addToCart(matchedIngredients, userId);
        console.log(`- 장바구니 ID: ${cartResult.cartId}\n`);

        // STEP 3: 검색 히스토리 저장
        console.log('💾 STEP 3: 검색 히스토리 저장');
        const ingredients = matchedIngredients.map(item => ({
            name: item.name,
            quantity: item.quantity
        }));
        await ingredientMatcher.saveSearchHistory(userId, ingredients);
        console.log('- 히스토리 저장 완료\n');

        // STEP 4: 최종 결과
        const totalPrice = matchedIngredients.reduce((sum, item) => sum + item.totalPrice, 0);
        console.log(`
✅ 워크플로우 완료!

📊 최종 결과:
- 재료 개수: ${matchedIngredients.length}개
- 총 금액: ${totalPrice.toLocaleString()}원
- 예상 배송료: ${matchedIngredients.reduce((sum, item) => sum + item.deliveryFee, 0).toLocaleString()}원

🎯 다음 단계: 쿠팡/네이버 쇼핑 페이지로 이동하여 결제
        `);

        return {
            recipe: recipeId,
            cartId: cartResult.cartId,
            totalPrice,
            items: matchedIngredients
        };
    } catch (error) {
        console.error('❌ 워크플로우 오류:', error);
    }
}

// ============================================
// 사용 방법
// ============================================

/*
// 1. 기본 재료 매칭 실행
await example1_basicMatching();

// 2. 특정 요리의 재료 매칭
await example2_recipeMatching('recipe_001');

// 3. 특정 재료의 쇼핑몰 비교
await example3_compareShops('계란');

// 4. 장바구니에 재료 추가
await example4_addToCart('user_001');

// 5. 검색 히스토리 저장
await example5_saveSearchHistory('user_001');

// 6. 추천 상품 조회
await example6_getRecommendations('계란');

// 7. 전체 워크플로우 실행 (추천!)
await completeWorkflow('user_001', 'recipe_breakfast');
*/
