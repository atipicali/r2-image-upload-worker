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
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Content-Type must be multipart/form-data", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("image");
    let uuid = formData.get("uuid")?.toString() ?? crypto.randomUUID();

    if (!file || !(file instanceof File)) {
      return new Response("Missing or invalid image file", { status: 400 });
    }

    await env.BUCKET.put(`${uuid}.jpg`, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const publicUrl = `https://pub-0bb1d8f7c010457cba8e7b4e490786d2.r2.dev/${uuid}.jpg`;

    return Response.json({ uuid, url: publicUrl });
  },
};
