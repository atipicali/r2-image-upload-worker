/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { v4 as uuidv4 } from 'uuid'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Content-Type must be multipart/form-data", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    let uuid = formData.get("uuid")?.toString() ?? uuidv4();

    if (!file) {
      return new Response("Missing image file", { status: 400 });
    }

    // Upload to R2
    await env.BUCKET.put(`${uuid}.jpg`, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Opcional: URL pública (precisa configurar public access no R2 ou via CDN)
    const publicUrl = `https://<sua-url-de-publicacao>/${uuid}.jpg`;

    return Response.json({ uuid, url: publicUrl });
  },
};

interface Env {
  BUCKET: R2Bucket;
}
