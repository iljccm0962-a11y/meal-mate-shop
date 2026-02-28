-- MealMate Shop D1 데이터베이스 스키마
-- 생성 날짜: 2026-02-28

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 요리 레시피 테이블
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ingredients TEXT,  -- JSON 형식으로 저장
    instructions TEXT,
    image_url TEXT,
    cooking_time INTEGER,
    difficulty TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 재료 매칭 테이블
CREATE TABLE IF NOT EXISTS ingredient_matches (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    recipe_id TEXT,
    matched_ingredients TEXT,  -- JSON 형식으로 저장
    match_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- 장바구니 테이블
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    items TEXT,  -- JSON 형식으로 저장
    total_price REAL,
    status TEXT DEFAULT 'active',  -- active, completed, abandoned
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 검색 결과 테이블
CREATE TABLE IF NOT EXISTS search_results (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    query TEXT NOT NULL,
    results TEXT,  -- JSON 형식으로 저장
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 게시 콘텐츠 테이블 (Admin Studio용)
CREATE TABLE IF NOT EXISTS published_content (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    content_type TEXT,  -- recipe, ingredient, tip 등
    status TEXT DEFAULT 'draft',  -- draft, published, archived
    tags TEXT,  -- JSON 형식으로 저장
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_search_results_user_id ON search_results(user_id);
CREATE INDEX IF NOT EXISTS idx_search_results_searched_at ON search_results(searched_at);
CREATE INDEX IF NOT EXISTS idx_ingredient_matches_user_id ON ingredient_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_published_content_user_id ON published_content(user_id);
CREATE INDEX IF NOT EXISTS idx_published_content_status ON published_content(status);
