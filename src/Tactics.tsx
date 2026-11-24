import { useEffect, useMemo, useState } from 'react'
import { readClubRoster } from './ClubManager'
import { loadChampionCatalog, type ChampionData, type Role } from './champions'
import './Tactics.css'

type Player = {
  id?: string
  name: string
  role: Role
  status?: string
  champions?: (string | { name: string; mastery?: number })[]
}
type DraftState = {
  ourPicks: Record<Role, string>
  enemyPicks: Record<Role, string>
  ourBans: string[]
  enemyBans: string[]
  strategy: string
}
const roles: Role[] = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']
const roleNames: Record<Role, string> = { TOP: '탑', JNG: '정글', MID: '미드', ADC: '원딜', SUP: '서포터' }
const emptyPicks: Record<Role, string> = { TOP: '', JNG: '', MID: '', ADC: '', SUP: '' }
const strategies = ['균형 잡힌 운영', '초반 공격 중심', '후반 성장 중심', '한타 중심', '스플릿 푸시 중심']
const emptyDraft: DraftState = {
  ourPicks: { ...emptyPicks },
  enemyPicks: { ...emptyPicks },
  ourBans: [],
  enemyBans: [],
  strategy: '균형 잡힌 운영',
}
const rolePool: Record<Role, string[]> = {
  TOP: ['aatrox','ambessa','camille','darius','fiora','gnar','gwen','jayce','jax','kennen','ksante','mordekaiser','renekton','rumble','shen','sion'],
  JNG: ['belveth','briar','diana','graves','hecarim','jarvaniv','karthus','kayn','leesin','lillia','maokai','nidalee','nocturne','sejuani','vi','viego','xinzhao'],
  MID: ['ahri','akali','azir','corki','galio','leblanc','orianna','ryze','sylas','syndra','taliyah','viktor','yone','zoe'],
  ADC: ['aphelios','ashe','caitlyn','draven','jhin','jinx','kaisa','kalista','kogmaw','lucian','missfortune','nilah','samira','sivir','smolder','tristana','varus','xayah','zeri'],
  SUP: ['alistar','bard','blitzcrank','braum','janna','karma','leona','lulu','milio','nami','nautilus','pyke','rakan','rell','renata','senna','seraphine','thresh','yuumi'],
}
function belongsToRole(champion: ChampionData, role: Role) {
  const id = champion.id.toLowerCase().replace(/[^a-z]/g, '')
  return rolePool[role].some(item => item.replace(/[^a-z]/g, '') === id)
}
function readInitialDraft(key: string): DraftState {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return emptyDraft
    const parsed = JSON.parse(saved) as Partial<DraftState>
    return {
      ...emptyDraft,
      ...parsed,
      ourPicks: { ...emptyPicks, ...(parsed.ourPicks ?? {}) },
      enemyPicks: { ...emptyPicks, ...(parsed.enemyPicks ?? {}) },
      ourBans: Array.isArray(parsed.ourBans) ? parsed.ourBans : [],
      enemyBans: Array.isArray(parsed.enemyBans) ? parsed.enemyBans : [],
    }
  } catch {
    return emptyDraft
  }
}

export default function Tactics({ teamName = 'T1' }: { teamName?: string }) {
  const storageKey = `lck-manager-tactics-2026-${teamName}`
  const [catalog, setCatalog] = useState<ChampionData[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [roster, setRoster] = useState<Player[]>([])
  const [draft, setDraft] = useState<DraftState>(() => readInitialDraft(storageKey))
  const [side, setSide] = useState<'our' | 'enemy'>('our')
  const [mode, setMode] = useState<'pick' | 'ban'>('pick')
  const [activeRole, setActiveRole] = useState<Role>('TOP')
  const [selectedChampion, setSelectedChampion] = useState<ChampionData | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')

  useEffect(() => {
    setRoster(readClubRoster(teamName) as Player[])
  }, [teamName])

  useEffect(() => {
    let active = true
    loadChampionCatalog().then(items => {
      if (!active) return
      setCatalog(items)
      setSelectedChampion(items[0] ?? null)
      setCatalogError('')
    }).catch(error => {
      if (active) setCatalogError(error instanceof Error ? error.message : '챔피언 데이터를 불러오지 못했습니다.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draft))
  }, [draft, storageKey])

  useEffect(() => {
    const refresh = () => setRoster(readClubRoster(teamName) as Player[])
    window.addEventListener('lck-roster-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('lck-roster-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [teamName])

  const activePicks = side === 'our' ? draft.ourPicks : draft.enemyPicks
  const activeBans = side === 'our' ? draft.ourBans : draft.enemyBans
  const usedPicks = [...Object.values(draft.ourPicks), ...Object.values(draft.enemyPicks)].filter(Boolean)
  const allBans = [...draft.ourBans, ...draft.enemyBans]
  const activePlayer = roster.find(player => player.role === activeRole && player.status === '주전')
    ?? roster.find(player => player.role === activeRole)
  const filteredChampions = useMemo(() => catalog.filter(champion => {
    const matchesSearch = !search || champion.name.toLowerCase().includes(search.toLowerCase()) || champion.id.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || belongsToRole(champion, roleFilter)
    return matchesSearch && matchesRole
  }), [catalog, search, roleFilter])

  function masteryFor(player: Player | undefined, champion: ChampionData | null) {
    if (!player || !champion) return 0
    const found = (player.champions ?? []).find(item => {
      const name = typeof item === 'string' ? item : item.name
      return name === champion.name || name === champion.id
    })
    return typeof found === 'object' ? Math.round(found.mastery ?? 0) : 0
  }

  function chooseChampion(champion: ChampionData) {
    if (mode === 'ban') {
      if (allBans.includes(champion.id) || usedPicks.includes(champion.id)) return
      if (activeBans.length >= 5) return
      setDraft(current => ({
        ...current,
        [side === 'our' ? 'ourBans' : 'enemyBans']: [...activeBans, champion.id],
      }))
      setSelectedChampion(champion)
      return
    }
    if (allBans.includes(champion.id)) return
    if (Object.entries(activePicks).some(([role, id]) => role !== activeRole && id === champion.id)) return
    if (Object.values(side === 'our' ? draft.enemyPicks : draft.ourPicks).includes(champion.id)) return
    setDraft(current => ({
      ...current,
      [side === 'our' ? 'ourPicks' : 'enemyPicks']: { ...activePicks, [activeRole]: champion.id },
    }))
    setSelectedChampion(champion)
  }

  function resetDraft() {
    if (!window.confirm('저장된 전술과 밴픽 계획을 초기화할까요?')) return
    setDraft(emptyDraft)
    setMode('pick')
    setSide('our')
    setActiveRole('TOP')
  }

  const ourPickCount = Object.values(draft.ourPicks).filter(Boolean).length
  const enemyPickCount = Object.values(draft.enemyPicks).filter(Boolean).length
  const ourSelected = roles.map(role => catalog.find(champion => champion.id === draft.ourPicks[role])).filter((value): value is ChampionData => Boolean(value))
  const engageTags = ['Tank', 'Fighter']
  const engageCount = ourSelected.filter(champion => champion.tags.some(tag => engageTags.includes(tag))).length
  const scalingCount = ourSelected.filter(champion => ['Marksman', 'Mage'].some(tag => champion.tags.includes(tag))).length
  const compositionScore = Math.min(100, ourPickCount * 12 + engageCount * 4 + scalingCount * 4)

  return (
    <div className="tactics-page">
      <header className="tactics-heading">
        <div><span>TACTICS & DRAFT</span><h1>전술 및 밴픽</h1><p>{teamName} 선수단의 포지션에 맞춰 챔피언을 계획합니다.</p></div>
        <button className="tactics-reset" onClick={resetDraft}>전술 초기화</button>
      </header>

      <section className="tactics-overview">
        <div><span>우리 팀 픽</span><strong>{ourPickCount}/5</strong></div>
        <div><span>상대 팀 픽</span><strong>{enemyPickCount}/5</strong></div>
        <div><span>밴</span><strong>{allBans.length}/10</strong></div>
        <div><span>조합 점수</span><strong>{compositionScore}</strong></div>
      </section>

      <section className="tactics-panel tactics-draft-panel">
        <div className="tactics-panel-title">
          <div><span>CHAMPION DATABASE</span><h2>챔피언 데이터베이스</h2></div>
          <span className="tactics-status">{catalog.length ? `${catalog.length} CHAMPIONS` : 'LOADING'}</span>
        </div>
        <div className="tactics-controls">
          <div className="tactics-side-switch"><button className={side === 'our' ? 'active' : ''} onClick={() => setSide('our')}>우리 팀</button><button className={side === 'enemy' ? 'active' : ''} onClick={() => setSide('enemy')}>상대 팀</button></div>
          <div className="tactics-mode-switch"><button className={mode === 'pick' ? 'active' : ''} onClick={() => setMode('pick')}>픽</button><button className={mode === 'ban' ? 'active' : ''} onClick={() => setMode('ban')}>밴</button></div>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="챔피언 검색"/>
          <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as Role | 'ALL')}><option value="ALL">전체 포지션</option>{roles.map(role => <option key={role} value={role}>{roleNames[role]}</option>)}</select>
        </div>

        <div className="tactics-role-tabs">{roles.map(role => {
          const player = roster.find(item => item.role === role && item.status === '주전') ?? roster.find(item => item.role === role)
          const champion = catalog.find(item => item.id === activePicks[role])
          return <button key={role} className={activeRole === role ? 'active' : ''} onClick={() => setActiveRole(role)}><b>{roleNames[role]}</b><span>{player?.name ?? '선수 없음'}</span><small>{champion?.name ?? '미선택'}</small></button>
        })}</div>

        <div className="tactics-draft-layout">
          <div className="tactics-champion-grid">
            {filteredChampions.map(champion => {
              const banned = allBans.includes(champion.id)
              const picked = usedPicks.includes(champion.id)
              return <button key={champion.id} className={`tactics-champion-tile ${selectedChampion?.id === champion.id ? 'selected' : ''} ${banned ? 'banned' : ''} ${picked ? 'picked' : ''}`} disabled={banned || (picked && activePicks[activeRole] !== champion.id)} onClick={() => chooseChampion(champion)}>
                <img src={champion.image} alt={champion.name} loading="lazy"/><span>{champion.name}</span>
                {banned && <i>BAN</i>}
                {picked && <i>PICK</i>}
              </button>
            })}
          </div>
          <aside className="tactics-champion-preview">
            {selectedChampion ? <><img src={selectedChampion.splash} alt=""/><div><span>CHAMPION PREVIEW</span><h3>{selectedChampion.name}</h3><p>{selectedChampion.title}</p><small>{selectedChampion.tags.join(' · ')}</small></div></> : <p>챔피언을 선택하세요.</p>}
            <div className="tactics-preview-player"><b>{roleNames[activeRole]} · {activePlayer?.name ?? '선수 없음'}</b><span>숙련도 {masteryFor(activePlayer, selectedChampion) || '기록 없음'}</span></div>
            <div className="tactics-preview-actions"><span>{mode === 'ban' ? `${activeBans.length}/5 밴` : `${activeRole} 포지션 픽`}</span><button disabled={!selectedChampion} onClick={() => selectedChampion && chooseChampion(selectedChampion)}>선택 적용</button></div>
          </aside>
        </div>
        {catalogError && <div className="mc-error">{catalogError}<button onClick={() => loadChampionCatalog(true).then(setCatalog).catch(error => setCatalogError(error.message))}>다시 불러오기</button></div>}
      </section>

      <div className="tactics-team-columns">
        <section className="tactics-panel"><h2>우리 팀 · {teamName}</h2>{roles.map(role => {
          const player = roster.find(item => item.role === role && item.status === '주전') ?? roster.find(item => item.role === role)
          const champion = catalog.find(item => item.id === draft.ourPicks[role])
          return <div className="tactics-selected-row" key={role}><span>{roleNames[role]}</span><b>{player?.name ?? '선수 없음'}</b>{champion ? <><img src={champion.image} alt=""/><strong>{champion.name}</strong></> : <small>미선택</small>}</div>
        })}<div className="tactics-ban-row"><b>우리 팀 밴</b>{draft.ourBans.map(id => { const champion = catalog.find(item => item.id === id); return champion ? <img key={id} src={champion.image} title={champion.name} alt={champion.name}/> : null })}</div></section>
        <section className="tactics-panel"><h2>상대 팀</h2>{roles.map(role => {
          const champion = catalog.find(item => item.id === draft.enemyPicks[role])
          return <div className="tactics-selected-row" key={role}><span>{roleNames[role]}</span><b>{role}</b>{champion ? <><img src={champion.image} alt=""/><strong>{champion.name}</strong></> : <small>미선택</small>}</div>
        })}<div className="tactics-ban-row"><b>상대 팀 밴</b>{draft.enemyBans.map(id => { const champion = catalog.find(item => item.id === id); return champion ? <img key={id} src={champion.image} title={champion.name} alt={champion.name}/> : null })}</div></section>
      </div>

      <section className="tactics-bottom-grid">
        <div className="tactics-panel"><span className="tactics-small-title">TEAM STRATEGY</span><h2>팀 전술 설정</h2><p>이번 경기에서 사용할 팀의 기본 전략을 선택하세요.</p><select className="strategy-select" value={draft.strategy} onChange={event => setDraft(current => ({ ...current, strategy: event.target.value }))}>{strategies.map(strategy => <option key={strategy}>{strategy}</option>)}</select></div>
        <div className="tactics-panel composition-panel"><span className="tactics-small-title">COMPOSITION ANALYSIS</span><h2>우리 팀 조합 분석</h2><div className="composition-stat"><span>챔피언 선택</span><strong>{ourPickCount}/5</strong></div><div className="composition-stat"><span>탱커·전사 태그</span><strong>{engageCount}명</strong></div><div className="composition-stat"><span>원딜·마법사 태그</span><strong>{scalingCount}명</strong></div><div className="composition-score"><span>조합 점수</span><strong>{compositionScore}<small> / 100</small></strong></div><p className="tactics-disclaimer">※ Data Dragon 분류 태그를 이용한 기본 조합 참고값입니다.</p></div>
      </section>
    </div>
  )
}
