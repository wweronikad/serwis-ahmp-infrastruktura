const BASE = import.meta.env.BASE_URL

export const asset = (path) =>
  /^https?:\/\//.test(path) ? path : `${BASE}${path.replace(/^\//, '')}`
