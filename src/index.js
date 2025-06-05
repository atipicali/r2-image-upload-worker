/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export default {
  async fetch(request, env, ctx) {
    // Suporte ao método OPTIONS para pré-verificação CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders(),
      });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Content-Type must be multipart/form-data", {
        status: 400,
        headers: corsHeaders(),
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("image");
      let uuid = formData.get("uuid")?.toString() ?? crypto.randomUUID();

      if (!file || !(file instanceof File)) {
        return new Response("Missing or invalid image file", {
          status: 400,
          headers: corsHeaders(),
        });
      }

      await env.BUCKET.put(`${uuid}.jpg`, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
      });

      const publicUrl = `https://pub-0bb1d8f7c010457cba8e7b4e490786d2.r2.dev/${uuid}.jpg`;

      return new Response(JSON.stringify({ uuid, url: publicUrl }), {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders(),
      });
    }
  },
};

// Função utilitária para headers CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // Você pode limitar ao domínio do seu app depois
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

