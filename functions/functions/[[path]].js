/* The Pages project publishes the repository root, so the source of these
   Pages Functions in /functions would also be served as static files.
   It is not public content: answer 404. */
export function onRequest() {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
  });
}
