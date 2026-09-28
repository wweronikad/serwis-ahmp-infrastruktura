import { useEffect, useState } from 'react'
import { asset } from './asset'

// Each city's descriptions and gallery are separate JSON files that Vite emits as
// their own chunks; they are fetched only when that city is opened.
const opisyLoaders   = import.meta.glob('../data/opisy/*.json', { import: 'default' })
const galleryLoaders = import.meta.glob('../data/galeria/*_gallery.json', { import: 'default' })

const cache = new Map()

function loadOnce(key, loader) {
  if (!loader) return Promise.resolve(null)
  if (!cache.has(key)) {
    cache.set(key, loader().catch((err) => {
      cache.delete(key) // allow a retry after a failed request
      throw err
    }))
  }
  return cache.get(key)
}

export function loadOpisy(cityId) {
  return loadOnce(`opisy:${cityId}`, opisyLoaders[`../data/opisy/${cityId}.json`])
}

// Gallery files and image folders use underscores (lidzbark_warminski), city ids use hyphens.
export async function loadGallery(cityId) {
  const fileId = cityId.replace(/-/g, '_')
  const photos = await loadOnce(`galeria:${cityId}`, galleryLoaders[`../data/galeria/${fileId}_gallery.json`])
  return photos ? { photos, basePath: asset(`/galeria/${fileId}/`) } : null
}

// status: 'loading' | 'ready' | 'missing' (no file for this city) | 'error'
export function useCityResource(load, cityId) {
  const [state, setState] = useState({ cityId: null, status: 'loading', data: null })

  useEffect(() => {
    let cancelled = false
    load(cityId)
      .then((data) => { if (!cancelled) setState({ cityId, status: data ? 'ready' : 'missing', data }) })
      .catch(() => { if (!cancelled) setState({ cityId, status: 'error', data: null }) })
    return () => { cancelled = true }
  }, [load, cityId])

  return state.cityId === cityId ? state : { cityId, status: 'loading', data: null }
}
