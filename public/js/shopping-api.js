/**
 * MealMate Shop - 쇼핑몰 API 통합 모듈
 * 네이버 쇼핑, 쿠팡 등 다양한 쇼핑몰의 가격 검색
 */

class ShoppingAPI {
    constructor() {
        this.baseUrls = {
            naver: 'https://openapi.naver.com/v1/search/shop.json',
            coupang: 'https://api.coupang.com/v2/search',
            wemakePrice: 'https://api.wemakeprice.com/search'
        };
        
        this.headers = {
            naver: {
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
            },
            coupang: {
                'Authorization': `Bearer ${process.env.COUPANG_API_KEY}`
            }
        };
    }

    /**
     * 최저가 검색 (모든 쇼핑몰 통합)
     * @param {String} ingredientName - 재료명
     * @returns {Promise<Object>} 최저가 정보
     */
    async searchLowestPrice(ingredientName) {
        try {
            const results = await Promise.allSettled([
                this.searchNaver(ingredientName),
                this.searchCoupang(ingredientName),
                this.searchWemakePrice(ingredientName)
            ]);

            // 성공한 결과만 필터링
            const successResults = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value)
                .filter(r => r !== null);

            if (successResults.length === 0) {
                throw new Error(`${ingredientName}에 대한 검색 결과가 없습니다.`);
            }

            // 최저가 선택
            const lowestPrice = successResults.reduce((min, curr) => 
                (curr.price || Infinity) < (min.price || Infinity) ? curr : min
            );

            return {
                lowest: lowestPrice.price,
                originalPrice: lowestPrice.originalPrice,
                mallName: lowestPrice.mallName,
                link: lowestPrice.link,
                image: lowestPrice.image,
                rating: lowestPrice.rating,
                reviews: lowestPrice.reviews,
                inStock: lowestPrice.inStock,
                deliveryFee: lowestPrice.deliveryFee || 0,
                alternatives: successResults.sort((a, b) => (a.price || 0) - (b.price || 0))
            };
        } catch (error) {
            console.error('최저가 검색 오류:', error);
            throw error;
        }
    }

    /**
     * 네이버 쇼핑 API 검색
     * @param {String} query - 검색어
     * @returns {Promise<Object>} 검색 결과
     */
    async searchNaver(query) {
        try {
            const params = new URLSearchParams({
                query: encodeURI(query),
                display: 1,
                sort: 'asc'
            });

            const response = await fetch(`${this.baseUrls.naver}?${params}`, {
                headers: this.headers.naver
            });

            if (!response.ok) throw new Error('네이버 API 요청 실패');

            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                return null;
            }

            const item = data.items[0];
            return {
                price: this._parsePrice(item.lprice),
                originalPrice: this._parsePrice(item.hprice),
                mallName: '네이버 쇼핑',
                link: item.link,
                image: item.image,
                title: item.title,
                rating: item.ratingAverage || 0,
                reviews: item.ratingCount || 0,
                inStock: true,
                deliveryFee: 0,
                source: 'naver'
            };
        } catch (error) {
            console.error('네이버 쇼핑 검색 오류:', error);
            return null;
        }
    }

    /**
     * 쿠팡 API 검색
     * @param {String} query - 검색어
     * @returns {Promise<Object>} 검색 결과
     */
    async searchCoupang(query) {
        try {
            const response = await fetch(`${this.baseUrls.coupang}?keyword=${encodeURIComponent(query)}`, {
                headers: this.headers.coupang
            });

            if (!response.ok) throw new Error('쿠팡 API 요청 실패');

            const data = await response.json();
            
            if (!data.productData || data.productData.length === 0) {
                return null;
            }

            const product = data.productData[0];
            return {
                price: product.salePrice || product.price,
                originalPrice: product.price,
                mallName: '쿠팡',
                link: `https://www.coupang.com/vp/products/${product.productId}`,
                image: product.imageUrl,
                title: product.name,
                rating: product.ratingScore || 0,
                reviews: product.reviewCount || 0,
                inStock: product.stockQuantity > 0,
                deliveryFee: product.deliveryType === 'ROCKET' ? 0 : 2500,
                source: 'coupang'
            };
        } catch (error) {
            console.error('쿠팡 검색 오류:', error);
            return null;
        }
    }

    /**
     * 위메프 API 검색
     * @param {String} query - 검색어
     * @returns {Promise<Object>} 검색 결과
     */
    async searchWemakePrice(query) {
        try {
            const response = await fetch(
                `${this.baseUrls.wemakePrice}?keyword=${encodeURIComponent(query)}`,
                {
                    headers: { 'Authorization': `Bearer ${process.env.WEMAKEPRICE_API_KEY}` }
                }
            );

            if (!response.ok) throw new Error('위메프 API 요청 실패');

            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                return null;
            }

            const item = data.items[0];
            return {
                price: item.salePrice,
                originalPrice: item.originalPrice,
                mallName: '위메프',
                link: item.productUrl,
                image: item.imageUrl,
                title: item.name,
                rating: item.rating || 0,
                reviews: item.reviewCount || 0,
                inStock: item.inStock,
                deliveryFee: item.deliveryFee || 2500,
                source: 'wemakeprice'
            };
        } catch (error) {
            console.error('위메프 검색 오류:', error);
            return null;
        }
    }

    /**
     * 가격 문자열을 숫자로 변환
     * @param {String} priceString - 가격 문자열
     * @returns {Number} 숫자 가격
     */
    _parsePrice(priceString) {
        if (!priceString) return 0;
        return parseInt(priceString.toString().replace(/[^0-9]/g, ''), 10);
    }

    /**
     * 특정 재료에 대한 추천 상품 조회
     * @param {String} ingredientName - 재료명
     * @param {Object} options - 필터 옵션
     * @returns {Promise<Array>} 추천 상품 리스트
     */
    async getRecommendedProducts(ingredientName, options = {}) {
        try {
            const query = `${ingredientName} ${options.brand || ''} ${options.quality || ''}`.trim();
            
            const results = await Promise.allSettled([
                this.searchNaver(query),
                this.searchCoupang(query),
                this.searchWemakePrice(query)
            ]);

            return results
                .filter(r => r.status === 'fulfilled' && r.value)
                .map(r => r.value)
                .sort((a, b) => (a.price || 0) - (b.price || 0));
        } catch (error) {
            console.error('추천 상품 조회 오류:', error);
            return [];
        }
    }
}

// 글로벌 인스턴스
const shoppingAPI = new ShoppingAPI();
