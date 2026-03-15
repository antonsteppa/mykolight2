addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const target = 'https://off.energy.mk.ua' + url.pathname + url.search

  const resp = await fetch(target, {
    headers: { 'Accept': 'application/json' }
  })

  const body = await resp.text()

  return new Response(body, {
    status: resp.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    }
  })
}
