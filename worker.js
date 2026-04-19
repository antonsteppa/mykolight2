const UPSTREAM_ORIGIN = 'https://off.energy.mk.ua';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    return json(
      { error: 'not_found', message: 'Use /api/* routes on this worker.' },
      404
    );
  }

  const upstreamUrl = new URL(UPSTREAM_ORIGIN + url.pathname + url.search);
  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'mykolight2-worker/1.0',
    },
    cf: {
      cacheEverything: false,
    },
  });

  const headers = new Headers(upstreamResponse.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  headers.set('Cache-Control', 'no-store');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}
