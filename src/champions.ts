export type Role = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'

export type ChampionData = {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  image: string
  splash: string
  version: string
}

type DataDragonChampion = {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  image: { full: string }
}

type DataDragonResponse = { data: Record<string, DataDragonChampion> }

const VERSION_URL = 'https://ddragon.leagueoflegends.com/api/versions.json'
const CACHE_KEY = 'lck-manager-champion-catalog-v1'

let catalogPromise: Promise<ChampionData[]> | null = null

function toChampionData(item: DataDragonChampion, version: string): ChampionData {
  return {
    id: item.id,
    key: item.key,
    name: item.name,
    title: item.title,
    tags: Array.isArray(item.tags) ? item.tags : [],
    image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${item.image.full}`,
    splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${item.id}_0.jpg`,
    version,
  }
}

function readCachedCatalog(): ChampionData[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { champions?: ChampionData[] }
    return Array.isArray(parsed.champions) ? parsed.champions : []
  } catch {
    return []
  }
}

/**
 * Loads the complete Korean champion catalog from Riot Data Dragon.
 * The result is cached locally so a later career can still show champions
 * when the static-data endpoint is temporarily unavailable.
 */
export function loadChampionCatalog(forceRefresh = false): Promise<ChampionData[]> {
  if (catalogPromise && !forceRefresh) return catalogPromise
  catalogPromise = (async () => {
    try {
      const versionResponse = await fetch(VERSION_URL, { cache: forceRefresh ? 'no-store' : 'default' })
      if (!versionResponse.ok) throw new Error('Data Dragon 버전 정보를 불러오지 못했습니다.')
      const versions = await versionResponse.json() as string[]
      const version = versions[0]
      if (!version) throw new Error('사용 가능한 Data Dragon 버전이 없습니다.')

      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`,
        { cache: forceRefresh ? 'no-store' : 'default' },
      )
      if (!response.ok) throw new Error('챔피언 데이터를 불러오지 못했습니다.')
      const payload = await response.json() as DataDragonResponse
      const champions = Object.values(payload.data)
        .map(item => toChampionData(item, version))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

      if (champions.length < 100) throw new Error('챔피언 데이터가 불완전합니다.')
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ version, champions, updatedAt: new Date().toISOString() }))
      } catch {
        // A full catalog is still usable for the current session if storage is full.
      }
      return champions
    } catch (error) {
      const cached = readCachedCatalog()
      if (cached.length >= 100) return cached
      throw error instanceof Error ? error : new Error('챔피언 데이터를 불러오지 못했습니다.')
    }
  })()
  return catalogPromise
}

export function getChampionImage(champion: ChampionData | undefined): string {
  return champion?.image ?? ''
}

export function getChampionById(catalog: ChampionData[], id: string): ChampionData | undefined {
  return catalog.find(champion => champion.id === id || champion.key === id)
}
