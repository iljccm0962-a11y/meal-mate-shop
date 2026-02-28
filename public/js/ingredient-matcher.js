/**
 * MealMate Shop - 핵심 재료 매칭 로직
 * AI가 추출한 재료를 쇼핑몰과 연결하는 엔진
 */

class IngredientMatcher {
    constructor() {
        this.shoppingAPI = new ShoppingAPI();
        this.database = new DatabaseService();
        this.cache = new Map();
    }

    /**
     * 추출된 재료 리스트를 쇼핑몰과 연결하는 핵심 로직
     * @param {Array} ingredientList - AI가 추출한 재료 리스트
     * @returns {Promise<Array>} 최저가 정보가 포함된 재료 리스트
     */
    async matchGroceryToMall(ingredientList) {
        try {
            const results = [];
            
            for (const item of ingredientList) {
                // 캐시 확인
                if (this.cache.has(item.name)) {
                    results.push(this.cache.get(item.name));
                    continue;
                }

                // 1. 네이버 쇼핑/쿠팡 API에서 최저가 검색
                const priceInfo = await this.shoppingAPI.searchLowestPrice(item.name);
                
                // 2. 재료 정보 구성
                const matchedItem = {
                    id: this._generateId(),
                    name: item.name,
                    quantity: item.quantity || '1개',
                    category: item.category || 'general',
                    bestPrice: priceInfo.lowest,
                    originalPrice: priceInfo.originalPrice,
                    discountPercent: this._calculateDiscount(priceInfo),
                    mallLink: priceInfo.link,
                    mallName: priceInfo.mallName || '쿠팡',
                    deliveryFee: priceInfo.deliveryFee || 0,
                    totalPrice: priceInfo.lowest + (priceInfo.deliveryFee || 0),
                    image: priceInfo.image,
                    rating: priceInfo.rating || 0,
                    reviews: priceInfo.reviews || 0,
                    inStock: priceInfo.inStock || true,
                    updatedAt: new Date().toISOString()
                };

                // 3. MealMate 데이터베이스에 저장
                await this.database.saveIngredientMatch(matchedItem);
                
                // 캐시에 저장
                this.cache.set(item.name, matchedItem);
                results.push(matchedItem);
            }
            
            return results;
        } catch (error) {
            console.error('재료 매칭 오류:', error);
            throw error;
        }
    }

    /**
     * 여러 쇼핑몰의 가격을 비교하여 최저가 찾기
     * @param {String} ingredientName - 재료명
     * @returns {Promise<Object>} 최저가 정보
     */
    async compareMultipleMalls(ingredientName) {
        try {
            // 병렬로 여러 쇼핑몰에서 검색
            const [naverResult, coupangResult, wemakeprice] = await Promise.all([
                this.shoppingAPI.searchNaver(ingredientName),
                this.shoppingAPI.searchCoupang(ingredientName),
                this.shoppingAPI.searchWemakePrice(ingredientName)
            ]);

            // 최저가 선택
            const allResults = [naverResult, coupangResult, wemakePrice].filter(r => r);
            const lowestPrice = allResults.reduce((min, curr) => 
                curr.price < min.price ? curr : min
            );

            return {
                lowest: lowestPrice.price,
                mall: lowestPrice.mall,
                link: lowestPrice.link,
                alternatives: allResults.sort((a, b) => a.price - b.price)
            };
        } catch (error) {
            console.error('쇼핑몰 비교 오류:', error);
            throw error;
        }
    }

    /**
     * 장바구니에 재료 일괄 추가
     * @param {Array} matchedItems - 매칭된 재료 리스트
     * @param {String} userId - 사용자 ID
     * @returns {Promise<Object>} 장바구니 추가 결과
     */
    async addToCart(matchedItems, userId) {
        try {
            const cartItems = matchedItems.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.bestPrice,
                mallUrl: item.mallLink,
                mallName: item.mallName
            }));

            // 데이터베이스에 장바구니 저장
            const cartId = await this.database.saveCart({
                userId,
                items: cartItems,
                totalPrice: matchedItems.reduce((sum, item) => sum + item.totalPrice, 0),
                createdAt: new Date().toISOString()
            });

            return {
                success: true,
                cartId,
                itemCount: cartItems.length,
                totalPrice: matchedItems.reduce((sum, item) => sum + item.totalPrice, 0)
            };
        } catch (error) {
            console.error('장바구니 추가 오류:', error);
            throw error;
        }
    }

    /**
     * 재료 검색 히스토리 저장
     * @param {String} userId - 사용자 ID
     * @param {Array} ingredientList - 검색한 재료 리스트
     */
    async saveSearchHistory(userId, ingredientList) {
        await this.database.saveSearchHistory({
            userId,
            ingredients: ingredientList,
            savedAt: new Date().toISOString()
        });
    }

    /**
     * 추천 요리 기반 재료 자동 매칭
     * @param {String} recipeId - 요리 ID
     * @returns {Promise<Array>} 요리에 필요한 모든 재료의 최저가 정보
     */
    async matchRecipeIngredients(recipeId) {
        try {
            // 레시피에서 재료 정보 조회
            const recipe = await this.database.getRecipe(recipeId);
            const ingredients = recipe.ingredients;

            // 모든 재료 매칭
            return await this.matchGroceryToMall(ingredients);
        } catch (error) {
            console.error('요리 재료 매칭 오류:', error);
            throw error;
        }
    }

    /**
     * 할인율 계산
     */
    _calculateDiscount(priceInfo) {
        if (!priceInfo.originalPrice || !priceInfo.lowest) return 0;
        return Math.round(
            ((priceInfo.originalPrice - priceInfo.lowest) / priceInfo.originalPrice) * 100
        );
    }

    /**
     * 고유 ID 생성
     */
    _generateId() {
        return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.cache.clear();
    }
}

// 글로벌 인스턴스
const ingredientMatcher = new IngredientMatcher();
