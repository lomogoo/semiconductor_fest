// Cloudflare Pages Function for pre-registration URL
// Redirects /pre-registration to /?mode=prereg

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Redirect to the main page with prereg mode parameter
  const redirectUrl = `${url.origin}/?mode=prereg`;

  return Response.redirect(redirectUrl, 302);
}
