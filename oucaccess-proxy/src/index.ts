export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const upstreamUrl = `http://app.oucsda.org:3000/access${url.pathname === '/' ? '' : url.pathname}`;

      const modifiedRequest = new Request(upstreamUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      });

      let response = await fetch(modifiedRequest);

      response = new Response(response.body, response);

      // Add CORS headers
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      return response;
    } catch (err: any) {
      return new Response(`Worker Error: ${err.message}`, { status: 500 });
    }
  }
};



