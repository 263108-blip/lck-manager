import { useEffect, useMemo, useState } from 'react'
import { fallbackChampionData, loadChampionDatabase, type ChampionData, type ChampionPosition } from './championData'

export type DraftRole = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'
export type DraftSide = 'blue' | 'red'
export type DraftPlayer = {
  name: string
  role: DraftRole
  overall?: number
  champions?: (string | { name: string; mastery?: number })[]
}
export type DraftPicks = Record<DraftRole, string>

type Champion = ChampionData
type DraftAction = { phase: string; type: 'ban' | 'pick'; side: DraftSide }
type Props = {
  blueName: string
  redName: string
  blueRoster: DraftPlayer[]
  redRoster: DraftPlayer[]
  myTeam: string
  gameNumber: number
  blueSeriesWins: number
  redSeriesWins: number
  seriesUsedChampions?: string[]
  onExit: () => void
  onStart: (bluePicks: DraftPicks, redPicks: DraftPicks, blueBans: string[], redBans: string[]) => void
}

const roles: DraftRole[] = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']
const roleLabels: Record<DraftRole, string> = { TOP: '탑', JNG: '정글', MID: '미드', ADC: '바텀', SUP: '서포터' }
const emptyPicks = (): DraftPicks => ({ TOP: '', JNG: '', MID: '', ADC: '', SUP: '' })
const actions: DraftAction[] = [
  ...(['blue', 'red', 'blue', 'red', 'blue', 'red'] as DraftSide[]).map(side => ({ phase: '1차 밴', type: 'ban' as const, side })),
  ...(['blue', 'red', 'red', 'blue', 'blue', 'red'] as DraftSide[]).map(side => ({ phase: '1차 픽', type: 'pick' as const, side })),
  ...(['red', 'blue', 'red', 'blue'] as DraftSide[]).map(side => ({ phase: '2차 밴', type: 'ban' as const, side })),
  ...(['red', 'blue', 'blue', 'red'] as DraftSide[]).map(side => ({ phase: '마무리 픽', type: 'pick' as const, side })),
]

function championName(value: string | { name: string }): string {
  return typeof value === 'string' ? value : value.name
}

export default function MatchDraft({ blueName, redName, blueRoster, redRoster, myTeam, gameNumber, blueSeriesWins, redSeriesWins, seriesUsedChampions = [], onExit, onStart }: Props) {
  const mySide: DraftSide = myTeam === blueName ? 'blue' : 'red'
  const [step, setStep] = useState(0)
  const [bluePicks, setBluePicks] = useState<DraftPicks>(emptyPicks)
  const [redPicks, setRedPicks] = useState<DraftPicks>(emptyPicks)
  const [blueBans, setBlueBans] = useState<string[]>([])
  const [redBans, setRedBans] = useState<string[]>([])
  const [roleChoice, setRoleChoice] = useState<DraftRole>('TOP')
  const [roleFilter, setRoleFilter] = useState<'ALL' | DraftRole>('ALL')
  const [search, setSearch] = useState('')
  const [champions, setChampions] = useState<Champion[]>(fallbackChampionData())

  useEffect(() => {
    let mounted = true
    loadChampionDatabase().then(pool => { if (mounted) setChampions(pool) })
    return () => { mounted = false }
  }, [])

  const current = actions[step]
  const userTurn = current?.side === mySide
  const usedChampions = useMemo(() => new Set([
    ...Object.values(bluePicks), ...Object.values(redPicks), ...blueBans, ...redBans, ...seriesUsedChampions,
  ].filter(Boolean)), [bluePicks, redPicks, blueBans, redBans, seriesUsedChampions])
  const ownPicks = mySide === 'blue' ? bluePicks : redPicks
  const openRoles = roles.filter(role => !ownPicks[role])
  const activeRole = openRoles.includes(roleChoice) ? roleChoice : openRoles[0]
  const visibleChampions = champions.filter(champion =>
    (roleFilter === 'ALL' || champion.roles.includes(roleFilter)) &&
    champion.name.toLocaleLowerCase('ko-KR').includes(search.trim().toLocaleLowerCase('ko-KR'))
  )

  function applyChoice(champion: Champion, side: DraftSide, action: DraftAction, role?: DraftRole) {
    if (action.type === 'ban') {
      (side === 'blue' ? setBlueBans : setRedBans)(old => [...old, champion.name])
    } else if (role) {
      (side === 'blue' ? setBluePicks : setRedPicks)(old => ({ ...old, [role]: champion.name }))
      if (side === mySide) {
        const remaining = roles.find(candidate => candidate !== role && !(side === 'blue' ? bluePicks : redPicks)[candidate])
        if (remaining) setRoleChoice(remaining)
      }
    }
    setSearch('')
    setStep(value => value + 1)
  }

  useEffect(() => {
    if (!current || current.side === mySide) return
    const timer = window.setTimeout(() => {
      const roster = current.side === 'blue' ? blueRoster : redRoster
      const teamPicks = current.side === 'blue' ? bluePicks : redPicks
      if (current.type === 'ban') {
        const targetRoster = current.side === 'blue' ? redRoster : blueRoster
        const priority = targetRoster.flatMap(player => (player.champions ?? []).map(champion => championName(champion)))
        const candidate = champions.find(champion => priority.includes(champion.name) && !usedChampions.has(champion.name))
          ?? champions.find(champion => !usedChampions.has(champion.name))
        if (candidate) {
          (current.side === 'blue' ? setBlueBans : setRedBans)(old => [...old, candidate.name])
          setStep(value => value + 1)
        }
        return
      }
      const role = roles.find(candidate => !teamPicks[candidate])
      if (!role) return
      const player = roster.find(candidate => candidate.role === role)
      const preferred = (player?.champions ?? []).map(champion => championName(champion))
      const candidate = champions.find(champion => preferred.includes(champion.name) && !usedChampions.has(champion.name))
        ?? champions.find(champion => champion.roles.includes(role) && !usedChampions.has(champion.name))
        ?? champions.find(champion => !usedChampions.has(champion.name))
      if (candidate) {
        (current.side === 'blue' ? setBluePicks : setRedPicks)(old => ({ ...old, [role]: candidate.name }))
        setStep(value => value + 1)
      }
    }, 420)
    return () => window.clearTimeout(timer)
  }, [current, mySide, blueRoster, redRoster, bluePicks, redPicks, usedChampions])

  function choose(champion: Champion) {
    if (!current || !userTurn || usedChampions.has(champion.name)) return
    if (current.type === 'pick' && !activeRole) return
    applyChoice(champion, current.side, current, current.type === 'pick' ? activeRole : undefined)
  }

  const currentTeam = current?.side === 'blue' ? blueName : redName
  const phaseProgress = current ? actions.slice(0, step).filter(action => action.phase === current.phase).length + 1 : 0
  const phaseTotal = current ? actions.filter(action => action.phase === current.phase).length : 0

  return (
    <main className="match-center mc-draft-screen">
      <header className="mc-header mc-draft-header">
        <button className="mc-back" onClick={onExit}>일정으로 돌아가기</button>
        <div className="mc-draft-title"><span>2026 LCK · GAME {gameNumber} · FEARLESS CHAMPION SELECT</span><h1>{blueName}<small>VS</small>{redName}</h1></div>
        <div className="mc-draft-series">BO3 <b>{blueSeriesWins} : {redSeriesWins}</b></div>
      </header>

      <section className="mc-draft-scoreline">
        <div className="mc-draft-side blue"><span>BLUE SIDE</span><strong>{blueName}</strong><small>{blueRoster.map(player => player.name).join(' · ')}</small></div>
        <div className="mc-draft-status"><span>{current ? current.phase : 'DRAFT COMPLETE'}</span><strong>{current ? `${currentTeam} ${current.type === 'ban' ? '밴 선택 중' : '챔피언 선택 중'}` : '진영 선택 완료'}</strong><small>{current ? `ACTION ${step + 1} / ${actions.length}` : '양 팀의 조합이 확정되었습니다.'}</small></div>
        <div className="mc-draft-side red"><span>RED SIDE</span><strong>{redName}</strong><small>{redRoster.map(player => player.name).join(' · ')}</small></div>
      </section>

      <div className="mc-draft-progress" aria-label="밴픽 진행">
        {['1차 밴', '1차 픽', '2차 밴', '마무리 픽'].map(phase => {
          const phaseSteps = actions.filter(action => action.phase === phase).length
          const done = actions.slice(0, step).filter(action => action.phase === phase).length
          return <div className={done === phaseSteps ? 'complete' : current?.phase === phase ? 'active' : ''} key={phase}><span>{phase}</span><b>{done}/{phaseSteps}</b><i><em style={{ width: `${done / phaseSteps * 100}%` }} /></i></div>
        })}
      </div>

      <div className="mc-draft-content">
        <section className="mc-draft-champions">
          <div className="mc-draft-picker-head"><div><span>CHAMPION POOL</span><h2>{current?.type === 'ban' ? '밴할 챔피언을 선택하세요' : '소환할 챔피언을 선택하세요'}</h2></div><label className="mc-champion-search"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="챔피언 검색" /></label></div>
          <div className="mc-role-filters"><button className={roleFilter === 'ALL' ? 'active' : ''} onClick={() => setRoleFilter('ALL')}>전체</button>{roles.map(role => <button className={roleFilter === role ? 'active' : ''} key={role} onClick={() => setRoleFilter(role)}>{roleLabels[role]}</button>)}</div>
          {current?.type === 'pick' && userTurn && <div className="mc-role-select"><span>선택할 포지션</span>{openRoles.map(role => <button className={activeRole === role ? 'active' : ''} key={role} onClick={() => setRoleChoice(role)}>{roleLabels[role]}</button>)}</div>}
          <div className="mc-champion-grid">
            {visibleChampions.map((champion, index) => {
              const unavailable = usedChampions.has(champion.name)
              return <button className={`mc-champion-tile ${unavailable ? 'unavailable' : ''}`} disabled={unavailable || !userTurn || !current} key={champion.name} onClick={() => choose(champion)}>
                <span className={`mc-champion-art art-${index % 8}`}><img src={champion.portrait} alt="" onError={event => { event.currentTarget.style.display = 'none' }} /><b>{champion.name.slice(0, 1)}</b><i>{champion.roles.map(role => roleLabels[role as ChampionPosition]).join(' · ')}</i></span>
                <strong>{champion.name}</strong>
                {unavailable && <small>{[...blueBans, ...redBans].includes(champion.name) ? 'BANNED' : seriesUsedChampions.includes(champion.name) ? 'FEARLESS' : 'PICKED'}</small>}
              </button>
            })}
            {!visibleChampions.length && <p className="mc-draft-empty">검색 결과가 없습니다.</p>}
          </div>
        </section>

        <aside className="mc-draft-lineups">
          <section className="mc-draft-lineup blue"><div className="mc-draft-lineup-head"><span>BLUE SIDE</span><strong>{blueName}</strong></div>{roles.map(role => <div className={`mc-draft-slot ${bluePicks[role] ? 'locked' : ''}`} key={role}><span>{roleLabels[role]}</span><div><strong>{bluePicks[role] || '챔피언 선택'}</strong><small>{blueRoster.find(player => player.role === role)?.name || '선수 미등록'}</small></div><b>{bluePicks[role] ? 'LOCK' : role}</b></div>)}<div className="mc-draft-bans"><span>TEAM BANS</span><div>{Array.from({ length: 5 }, (_, index) => <b className={blueBans[index] ? 'filled' : ''} key={index}>{blueBans[index] || '—'}</b>)}</div></div></section>
          <section className="mc-draft-lineup red"><div className="mc-draft-lineup-head"><span>RED SIDE</span><strong>{redName}</strong></div>{roles.map(role => <div className={`mc-draft-slot ${redPicks[role] ? 'locked' : ''}`} key={role}><span>{roleLabels[role]}</span><div><strong>{redPicks[role] || '챔피언 선택'}</strong><small>{redRoster.find(player => player.role === role)?.name || '선수 미등록'}</small></div><b>{redPicks[role] ? 'LOCK' : role}</b></div>)}<div className="mc-draft-bans"><span>TEAM BANS</span><div>{Array.from({ length: 5 }, (_, index) => <b className={redBans[index] ? 'filled' : ''} key={index}>{redBans[index] || '—'}</b>)}</div></div></section>
          <div className={`mc-draft-turn ${userTurn ? 'your-turn' : ''}`}><i /><div><strong>{current ? userTurn ? '감독님의 선택입니다' : `${currentTeam} 밴픽 중` : '피어리스 밴픽이 완료되었습니다'}</strong><small>{current ? `${current.phase} · ${phaseProgress}/${phaseTotal}` : `이전 세트 사용 챔피언 ${seriesUsedChampions.length}개 차단`}</small></div></div>
          <button className="mc-draft-start" disabled={step < actions.length} onClick={() => onStart(bluePicks, redPicks, blueBans, redBans)}>선수 입장 · 경기 시작 <span>→</span></button>
        </aside>
      </div>
    </main>
  )
}