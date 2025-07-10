export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = `http://162.144.105.50:3000${url.pathname.replace(/^\/access/, '')}${url.search}`;

    return fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });
  },
};
