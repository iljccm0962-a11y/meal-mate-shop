/**
 * MealMate Shop - Recipes API
 * 레시피 및 재료 정보를 D1 데이터베이스에 저장하는 API
 */

/**
 * CORS 헤더 설정
 */
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
}

/**
 * POST 요청 처리 - 레시피 저장
 */
export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const data = await request.json();
        const { title, category, description, ingredients } = data;

        // 1. 레시피 기본 정보 저장
        const recipeResult = await env.DB.prepare(
            "INSERT INTO recipes (title, category, description) VALUES (?, ?, ?)"
        ).bind(title, category, description).run();

        const recipeId = recipeResult.meta.last_row_id;

        // 2. 재료 정보가 있다면 함께 저장 (선택 사항)
        if (ingredients && ingredients.length > 0) {
            const stmt = env.DB.prepare(
                "INSERT INTO ingredients (recipe_id, name, lowest_price) VALUES (?, ?, ?)"
            );
            await env.DB.batch(
                ingredients.map(ing => stmt.bind(recipeId, ing.name, ing.price))
            );
        }

        return new Response(JSON.stringify({ success: true, id: recipeId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}
