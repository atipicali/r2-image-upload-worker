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
    const { method, url } = request;
    const parsedUrl = new URL(url);

    // Suporte CORS para qualquer origem
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Apenas para rota /upload
    if (parsedUrl.pathname !== "/upload") {
      return new Response("Not Found", { status: 404 });
    }

    if (method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Content-Type must be multipart/form-data", {
        status: 400,
        headers: corsHeaders,
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("image");
      const uuid = formData.get("uuid")?.toString() ?? crypto.randomUUID();

      if (!file || !(file instanceof File)) {
        return new Response("Missing or invalid image file", {
          status: 400,
          headers: corsHeaders,
        });
      }

      await env.BUCKET.put(`${uuid}.jpg`, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
      });

      return new Response(JSON.stringify({ uuid }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      return new Response("Internal Error: " + err.message, {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};


