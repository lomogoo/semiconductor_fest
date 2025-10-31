// Cloudflare Pages Function for booth QR URLs
// Redirects /booth/[A-F] to /?stamp=[A-F]

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const boothId = context.params.id.toUpperCase();

  // Validate booth ID (A-F)
  const validBooths = ['A', 'B', 'C', 'D', 'E', 'F'];
  if (!validBooths.includes(boothId)) {
    return new Response('Invalid booth ID. Valid booths: A, B, C, D, E, F', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Redirect to the main page with stamp parameter
  const redirectUrl = `${url.origin}/?stamp=${boothId}`;

  return Response.redirect(redirectUrl, 302);
}
