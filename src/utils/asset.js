const BASE = import.meta.env.BASE_URL

export const asset = (path) => `${BASE}${path.replace(/^\//, '')}`
