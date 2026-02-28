export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const data = await request.json();

        // D1 데이터베이스의 recipes 테이블에 저장
        const result = await env.DB.prepare(
            "INSERT INTO recipes (title, description, category) VALUES (?, ?, ?)"
        ).bind(data.title, data.description, data.category).run();

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
