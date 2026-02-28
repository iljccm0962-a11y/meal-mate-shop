/**
 * MealMate Shop - 데이터베이스 서비스
 * 재료 매칭, 장바구니, 검색 히스토리 등을 저장하는 모듈
 */

class DatabaseService {
    constructor() {
        this.dbName = 'MealMateDB';
        this.version = 1;
        this.db = null;
        this._initializeDB();
    }

    /**
     * IndexedDB 초기화
     */
    _initializeDB() {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
            console.error('데이터베이스 열기 실패:', request.error);
        };

        request.onsuccess = () => {
            this.db = request.result;
            console.log('데이터베이스 연결 성공');
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 재료 매칭 저장소
            if (!db.objectStoreNames.contains('ingredientMatches')) {
                db.createObjectStore('ingredientMatches', { keyPath: 'id' });
            }

            // 장바구니 저장소
            if (!db.objectStoreNames.contains('carts')) {
                const cartStore = db.createObjectStore('carts', { keyPath: 'id' });
                cartStore.createIndex('userId', 'userId', { unique: false });
            }

            // 검색 결과 저장소
            if (!db.objectStoreNames.contains('searchResults')) {
                const searchStore = db.createObjectStore('searchResults', { keyPath: 'id' });
                searchStore.createIndex('userId', 'userId', { unique: false });
                searchStore.createIndex('searchedAt', 'searchedAt', { unique: false });
            }

            // 요리 저장소
            if (!db.objectStoreNames.contains('recipes')) {
                db.createObjectStore('recipes', { keyPath: 'id' });
            }

            // 사용자 저장소
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'id' });
                userStore.createIndex('email', 'email', { unique: true });
            }
        };
    }

    /**
     * 재료 매칭 결과 저장
     * @param {Object} ingredientMatch - 재료 매칭 정보
     * @returns {Promise<String>} 저장된 ID
     */
    async saveIngredientMatch(ingredientMatch) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['ingredientMatches'], 'readwrite');
            const store = transaction.objectStore('ingredientMatches');
            const request = store.add(ingredientMatch);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 재료 매칭 결과 조회
     * @param {String} id - 매칭 ID
     * @returns {Promise<Object>} 재료 매칭 정보
     */
    async getIngredientMatch(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['ingredientMatches'], 'readonly');
            const store = transaction.objectStore('ingredientMatches');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 장바구니 저장
     * @param {Object} cart - 장바구니 정보
     * @returns {Promise<String>} 생성된 장바구니 ID
     */
    async saveCart(cart) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['carts'], 'readwrite');
            const store = transaction.objectStore('carts');
            const cartData = {
                id: `cart_${Date.now()}`,
                ...cart
            };
            const request = store.add(cartData);

            request.onsuccess = () => resolve(cartData.id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 사용자 장바구니 조회
     * @param {String} userId - 사용자 ID
     * @returns {Promise<Array>} 장바구니 리스트
     */
    async getUserCarts(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['carts'], 'readonly');
            const store = transaction.objectStore('carts');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 검색 히스토리 저장
     * @param {Object} searchHistory - 검색 히스토리
     * @returns {Promise<String>} 저장된 ID
     */
    async saveSearchHistory(searchHistory) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['searchResults'], 'readwrite');
            const store = transaction.objectStore('searchResults');
            const historyData = {
                id: `search_${Date.now()}`,
                ...searchHistory
            };
            const request = store.add(historyData);

            request.onsuccess = () => resolve(historyData.id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 사용자의 검색 히스토리 조회
     * @param {String} userId - 사용자 ID
     * @returns {Promise<Array>} 검색 히스토리 리스트
     */
    async getUserSearchHistory(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['searchResults'], 'readonly');
            const store = transaction.objectStore('searchResults');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                const results = request.result
                    .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
                    .slice(0, limit);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 요리 정보 저장
     * @param {Object} recipe - 요리 정보
     * @returns {Promise<String>} 저장된 ID
     */
    async saveRecipe(recipe) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['recipes'], 'readwrite');
            const store = transaction.objectStore('recipes');
            const recipeData = {
                id: recipe.id || `recipe_${Date.now()}`,
                ...recipe
            };
            const request = store.add(recipeData);

            request.onsuccess = () => resolve(recipeData.id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 요리 정보 조회
     * @param {String} recipeId - 요리 ID
     * @returns {Promise<Object>} 요리 정보
     */
    async getRecipe(recipeId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['recipes'], 'readonly');
            const store = transaction.objectStore('recipes');
            const request = store.get(recipeId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 사용자 정보 저장
     * @param {Object} user - 사용자 정보
     * @returns {Promise<String>} 저장된 사용자 ID
     */
    async saveUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const userData = {
                id: user.id || `user_${Date.now()}`,
                ...user,
                createdAt: new Date().toISOString()
            };
            const request = store.add(userData);

            request.onsuccess = () => resolve(userData.id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 사용자 정보 조회
     * @param {String} userId - 사용자 ID
     * @returns {Promise<Object>} 사용자 정보
     */
    async getUser(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 모든 데이터 삭제 (테스트용)
     * @returns {Promise<void>}
     */
    async clearAll() {
        const stores = ['ingredientMatches', 'carts', 'searchResults', 'recipes', 'users'];
        
        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }
}

// 글로벌 인스턴스
const database = new DatabaseService();
