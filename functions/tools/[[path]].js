/* The Pages project publishes the repository root, which also contains the
   local build tooling in /tools (generator + page partials). These are not
   part of the public site: answer 404 instead of serving them. */
export function onRequest() {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
  });
}
