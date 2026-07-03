import Fuse from 'fuse.js'
import { cities, MAP_TYPE_LABELS } from '../data/cities'

const galleryModules = import.meta.glob('../data/galeria/*.json', { eager: true })
const opisyModules   = import.meta.glob('../data/opisy/*.json',   { eager: true })

const OPISY_LABELS = {
  uklad_przestrzenny: 'Układ przestrzenny',
  fortyfikacje:       'Fortyfikacje',
  koscioly:           'Kościoły i klasztory',
  ludnosc:            'Ludność',
  gospodarka:         'Gospodarka i handel',
  wladza:             'Władza i administracja',
  srodowisko:         'Środowisko i topografia',
  zrodla:             'Źródła i literatura',
}

const cityNameById = Object.fromEntries(cities.map(c => [c.id, c.name]))

function buildEntries() {
  const entries = []

  for (const city of cities) {
    // City entry
    entries.push({
      type:       'city',
      id:         `city_${city.id}`,
      cityId:     city.id,
      label:      city.name,
      sublabel:   `${city.region} · ${city.volume}`,
      searchText: `${city.name} ${city.region} ${city.description} ${city.volume}`,
    })

    // Map entries
    for (const map of city.maps) {
      const typeLabel = MAP_TYPE_LABELS[map.type] ?? map.type
      entries.push({
        type:       'map',
        id:         `map_${map.id}`,
        cityId:     city.id,
        mapId:      map.id,
        label:      map.title,
        sublabel:   `${city.name} · ${map.yearDisplay}`,
        searchText: `${map.title} ${map.subtitle ?? ''} ${map.yearDisplay} ${map.era} ${typeLabel} ${city.name}`,
      })
    }
  }

  // Gallery photo entries
  for (const [path, mod] of Object.entries(galleryModules)) {
    const filename = path.split('/').pop()
    const rawId    = filename.replace('_gallery.json', '')
    const cityId   = rawId.replace(/_/g, '-')
    const cityName = cityNameById[cityId] ?? cityId
    const photos   = mod.default ?? mod

    for (const photo of photos) {
      const pinLabels = (photo.imgPins ?? []).map(p => p.label).join(' ')
      entries.push({
        type:       'photo',
        id:         `photo_${cityId}_${photo.id}`,
        cityId,
        photoId:    photo.id,
        label:      `${photo.title} (${photo.date})`,
        sublabel:   cityName,
        searchText: `${photo.title} ${photo.date} ${pinLabels} ${cityName}`,
      })
    }
  }

  // Opis (historical text) entries
  for (const [path, mod] of Object.entries(opisyModules)) {
    const cityId   = path.split('/').pop().replace('.json', '')
    const cityName = cityNameById[cityId] ?? cityId
    const data     = mod.default ?? mod

    for (const [key, karta] of Object.entries(data.karty ?? {})) {
      if (!karta.dostepne) continue
      entries.push({
        type:       'opis',
        id:         `opis_${cityId}_${key}`,
        cityId,
        label:      `${OPISY_LABELS[key] ?? key} — ${cityName}`,
        sublabel:   'Karta historyczna',
        searchText: `${OPISY_LABELS[key] ?? key} ${karta.zajawka} ${karta.tekst} ${cityName}`,
      })
    }
  }

  return entries
}

const searchEntries = buildEntries()

const fuse = new Fuse(searchEntries, {
  keys: [
    { name: 'label',      weight: 4 },
    { name: 'sublabel',   weight: 2 },
    { name: 'searchText', weight: 1 },
  ],
  threshold:         0.35,
  minMatchCharLength: 2,
  includeScore:      true,
  ignoreLocation:    true,
})

export function search(query) {
  if (!query || query.trim().length < 2) return []
  return fuse.search(query.trim(), { limit: 14 }).map(r => r.item)
}
