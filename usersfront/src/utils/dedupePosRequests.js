const pending = new Map()
const originalFetch = window.fetch.bind(window)

const esPeticionPOS = (input, init = {}) => {
  const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (method !== 'GET') return false

  const url = typeof input === 'string' ? input : input?.url
  if (!url) return false

  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.pathname.endsWith('/sales/drafts')
      || parsed.pathname.endsWith('/inventory')
      || (parsed.pathname.endsWith('/inventory/products') && parsed.search === '?active_only=true')
  } catch {
    return false
  }
}

window.fetch = (input, init) => {
  if (!esPeticionPOS(input, init)) return originalFetch(input, init)

  const request = input instanceof Request ? input : null
  const url = request ? request.url : String(input)
  const authorization = init?.headers?.Authorization || init?.headers?.authorization || request?.headers?.get('Authorization') || ''
  const key = `${url}|${authorization}`
  const existing = pending.get(key)
  if (existing) return existing.then((response) => response.clone())

  const promise = originalFetch(input, init).finally(() => pending.delete(key))
  pending.set(key, promise)
  return promise.then((response) => response.clone())
}
