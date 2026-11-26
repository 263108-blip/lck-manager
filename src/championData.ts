export type ChampionPosition = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'

export type ChampionData = {
  id: string
  name: string
  roles: ChampionPosition[]
  version: string
  portrait: string
  splash: string
}

const DDRAGON_IMAGE_BASE = 'https://ddragon.leagueoflegends.com/cdn'

const fallbackChampions: Array<[string, string, ChampionPosition[]]> = [
  ['Aatrox','아트록스',['TOP']],['Ahri','아리',['MID']],['Akali','아칼리',['MID','TOP']],
  ['Alistar','알리스타',['SUP']],['Ambessa','암베사',['TOP','JNG']],['Anivia','애니비아',['MID']],
  ['Aphelios','아펠리오스',['ADC']],['Ashe','애쉬',['ADC']],['Aurora','오로라',['MID','TOP']],
  ['Bard','바드',['SUP']],['Belveth','벨베스',['JNG']],['Braum','브라움',['SUP']],
  ['Caitlyn','케이틀린',['ADC']],['Camille','카밀',['TOP']],['Darius','다리우스',['TOP']],
  ['Draven','드레이븐',['ADC']],['Ekko','에코',['MID','JNG']],['Ezreal','이즈리얼',['ADC']],
  ['Fiddlesticks','피들스틱',['JNG']],['Garen','가렌',['TOP']],['Gnar','나르',['TOP']],
  ['Gragas','그라가스',['JNG','TOP']],['Gwen','그웬',['TOP']],['Irelia','이렐리아',['TOP','MID']],
  ['Jax','잭스',['TOP','JNG']],['Jayce','제이스',['TOP','MID']],['Jhin','진',['ADC']],
  ['Jinx','징크스',['ADC']],['Kaisa','카이사',['ADC']],['Kalista','칼리스타',['ADC']],
  ['Karma','카르마',['SUP','MID']],['Karthus','카서스',['JNG','MID']],['Kennen','케넨',['TOP']],
  ['KhaZix','카직스',['JNG']],['LeBlanc','르블랑',['MID']],['LeeSin','리 신',['JNG']],
  ['Leona','레오나',['SUP']],['Lillia','릴리아',['JNG']],['Lucian','루시안',['ADC','MID']],
  ['Lulu','룰루',['SUP']],['Lux','럭스',['MID','SUP']],['Malphite','말파이트',['TOP','SUP']],
  ['Maokai','마오카이',['TOP','JNG']],['MissFortune','미스 포츈',['ADC']],['Morgana','모르가나',['SUP','JNG']],
  ['Nautilus','노틸러스',['SUP']],['Nidalee','니달리',['JNG']],['Nocturne','녹턴',['JNG']],
  ['Orianna','오리아나',['MID']],['Pantheon','판테온',['MID','TOP','SUP']],['Pyke','파이크',['SUP']],
  ['Rakan','라칸',['SUP']],['Renekton','레넥톤',['TOP']],['Rell','렐',['SUP']],
  ['Rumble','럼블',['TOP','MID']],['Ryze','라이즈',['MID','TOP']],['Sejuani','세주아니',['JNG','TOP']],
  ['Senna','세나',['ADC','SUP']],['Seraphine','세라핀',['SUP','MID']],['Sett','세트',['TOP']],
  ['Shyvana','쉬바나',['JNG','TOP']],['Smolder','스몰더',['ADC']],['Sona','소나',['SUP']],
  ['Soraka','소라카',['SUP']],['Sylas','사일러스',['MID','TOP']],['Syndra','신드라',['MID']],
  ['Taliyah','탈리야',['MID','JNG']],['Thresh','쓰레쉬',['SUP']],['Tristana','트리스타나',['ADC']],
  ['Varus','바루스',['ADC','MID']],['Viego','비에고',['JNG']],['Viktor','빅토르',['MID']],
  ['Vex','벡스',['MID']],['Vi','바이',['JNG']],['Vayne','베인',['ADC']],
  ['Volibear','볼리베어',['TOP','JNG']],['Xayah','자야',['ADC']],['XinZhao','신 짜오',['JNG']],
  ['Yasuo','야스오',['MID','TOP']],['Yone','요네',['MID','TOP']],['Yuumi','유미',['SUP']],
  ['Zeri','제리',['ADC']],['Ziggs','직스',['ADC','MID']],['Zilean','질리언',['SUP','MID']],
  ['Zoe','조이',['MID']],['Zyra','자이라',['SUP','JNG']]
]

export function fallbackChampionData(version = '16.23.1'): ChampionData[] {
  return fallbackChampions.map(([id, name, roles]) => ({
    id,
    name,
    roles,
    version,
    portrait: `${DDRAGON_IMAGE_BASE}/${version}/img/champion/${id}.png`,
    splash: `${DDRAGON_IMAGE_BASE}/img/champion/splash/${id}_0.jpg`,
  }))
}

export async function loadChampionDatabase(): Promise<ChampionData[]> {
  try {
    const versionsResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    if (!versionsResponse.ok) throw new Error('Data Dragon versions unavailable')
    const versions = await versionsResponse.json() as string[]
    const version = versions[0]
    const response = await fetch(`${DDRAGON_IMAGE_BASE}/${version}/data/ko_KR/champion.json`)
    if (!response.ok) throw new Error('Champion data unavailable')
    const payload = await response.json() as { data: Record<string, { id:string; name:string; tags:string[] }> }
    const roleForTag = (tag: string): ChampionPosition => tag === 'Fighter' ? 'TOP' : tag === 'Assassin' ? 'JNG' : tag === 'Mage' ? 'MID' : tag === 'Marksman' ? 'ADC' : 'SUP'
    const champions = Object.values(payload.data).map(champion => {
      const tags = champion.tags ?? []
      const roles = Array.from(new Set(tags.map(roleForTag)))
      return {
        id: champion.id,
        name: champion.name,
        roles: roles.length ? roles : ['MID'] as ChampionPosition[],
        version,
        portrait: `${DDRAGON_IMAGE_BASE}/${version}/img/champion/${champion.id}.png`,
        splash: `${DDRAGON_IMAGE_BASE}/img/champion/splash/${champion.id}_0.jpg`,
      }
    })
    if (champions.length < 170) throw new Error(`Incomplete champion data: ${champions.length}`)
    localStorage.setItem('lck-champion-database', JSON.stringify({ version, champions, checkedAt: new Date().toISOString() }))
    return champions
  } catch {
    try {
      const cached = JSON.parse(localStorage.getItem('lck-champion-database') || 'null')
      if (Array.isArray(cached?.champions) && cached.champions.length >= 170) return cached.champions as ChampionData[]
    } catch {}
    return fallbackChampionData()
  }
}
