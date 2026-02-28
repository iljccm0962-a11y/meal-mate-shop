/**
 * MealMate Shop - Publish API
 * Admin Studio에서 콘텐츠를 D1 데이터베이스에 저장하는 API
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
async function handleOptions() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
}

/**
 * 콘텐츠 생성 (POST)
 * @param {Request} request
 * @param {D1Database} DB
 */
async function handlePost(request, DB) {
    try {
        const data = await request.json();
        
        // 필수 필드 검증
        if (!data.userId || !data.title || !data.contentType) {
            return new Response(JSON.stringify({
                success: false,
                error: '필수 필드가 누락되었습니다. (userId, title, contentType)'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const id = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        // D1에 데이터 삽입
        const result = await DB.prepare(`
            INSERT INTO published_content 
            (id, user_id, title, content, content_type, status, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            data.userId,
            data.title,
            data.content || '',
            data.contentType,
            data.status || 'draft',
            JSON.stringify(data.tags || []),
            now,
            now
        ).run();

        if (result.success) {
            return new Response(JSON.stringify({
                success: true,
                data: {
                    id,
                    userId: data.userId,
                    title: data.title,
                    contentType: data.contentType,
                    status: data.status || 'draft',
                    createdAt: now
                }
            }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('데이터베이스 저장 실패');
        }
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 콘텐츠 조회 (GET)
 * @param {Request} request
 * @param {D1Database} DB
 */
async function handleGet(request, DB) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const userId = url.searchParams.get('userId');
        const status = url.searchParams.get('status');

        let query;
        let params = [];

        if (id) {
            // 특정 콘텐츠 조회
            query = 'SELECT * FROM published_content WHERE id = ?';
            params = [id];
        } else if (userId) {
            // 사용자의 모든 콘텐츠 조회
            if (status) {
                query = 'SELECT * FROM published_content WHERE user_id = ? AND status = ? ORDER BY created_at DESC';
                params = [userId, status];
            } else {
                query = 'SELECT * FROM published_content WHERE user_id = ? ORDER BY created_at DESC';
                params = [userId];
            }
        } else {
            // 모든 게시된 콘텐츠 조회
            query = 'SELECT * FROM published_content WHERE status = ? ORDER BY created_at DESC LIMIT 100';
            params = ['published'];
        }

        const result = await DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
            success: true,
            data: result.results || []
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 콘텐츠 업데이트 (PUT)
 * @param {Request} request
 * @param {D1Database} DB
 */
async function handlePut(request, DB) {
    try {
        const data = await request.json();
        
        if (!data.id) {
            return new Response(JSON.stringify({
                success: false,
                error: '콘텐츠 ID가 필요합니다.'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const now = new Date().toISOString();
        const publishedAt = data.status === 'published' ? now : null;

        let updateFields = ['updated_at = ?'];
        let params = [now];

        if (data.title) {
            updateFields.push('title = ?');
            params.push(data.title);
        }
        if (data.content !== undefined) {
            updateFields.push('content = ?');
            params.push(data.content);
        }
        if (data.status) {
            updateFields.push('status = ?');
            params.push(data.status);
            if (data.status === 'published') {
                updateFields.push('published_at = ?');
                params.push(publishedAt);
            }
        }
        if (data.tags) {
            updateFields.push('tags = ?');
            params.push(JSON.stringify(data.tags));
        }

        params.push(data.id);

        const result = await DB.prepare(`
            UPDATE published_content 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `).bind(...params).run();

        if (result.success) {
            return new Response(JSON.stringify({
                success: true,
                data: { id: data.id, updatedAt: now }
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('데이터베이스 업데이트 실패');
        }
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 콘텐츠 삭제 (DELETE)
 * @param {Request} request
 * @param {D1Database} DB
 */
async function handleDelete(request, DB) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({
                success: false,
                error: '콘텐츠 ID가 필요합니다.'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const result = await DB.prepare('DELETE FROM published_content WHERE id = ?')
            .bind(id)
            .run();

        if (result.success) {
            return new Response(JSON.stringify({
                success: true,
                data: { id }
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('데이터베이스 삭제 실패');
        }
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Cloudflare Pages Functions 진입점
 * @param {Object} context - Cloudflare Pages context
 */
export async function onRequest(context) {
    const { request, env } = context;
    const { DB } = env;

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
        return handleOptions();
    }

    // D1 데이터베이스 확인
    if (!DB) {
        return new Response(JSON.stringify({
            success: false,
            error: 'D1 데이터베이스가 설정되지 않았습니다.'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 요청 메서드에 따라 처리
    switch (request.method) {
        case 'POST':
            return handlePost(request, DB);
        case 'GET':
            return handleGet(request, DB);
        case 'PUT':
            return handlePut(request, DB);
        case 'DELETE':
            return handleDelete(request, DB);
        default:
            return new Response(JSON.stringify({
                success: false,
                error: '지원하지 않는 HTTP 메서드입니다.'
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
    }
}
