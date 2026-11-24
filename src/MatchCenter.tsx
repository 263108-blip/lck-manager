import { useEffect, useMemo, useRef, useState } from 'react'
import type { Match } from './matchData'
import { seasonClubs } from './seasonData'
import { loadChampionCatalog, type ChampionData, type Role } from './champions'
import { advanceMatch, createMatchState, type MatchState, type PlayerMatchStats, type SimPlayer } from './matchEngine'
import './MatchCenter.css'

type Player = {
  id?: string
  name: string
  role: Role
  team?: string
  overall?: number
  morale?: number
  status?: string
  champions?: (string | { name: string; mastery?: number })[]
}
type Props = {
  match: Match
  myTeam?: string
  onFinish: (homeScore: number, awayScore: number) => void
  onExit: () => void
}
type DraftMode = 'ban' | 'pick'
type Side = 'blue' | 'red'
const roles: Role[] = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']
const ROLE_LABEL: Record<Role, string> = { TOP: '탑', JNG: '정글', MID: '미드', ADC: '원딜', SUP: '서포터' }
const ROLE_HINTS: Record<Role, string[]> = {
  TOP: ['Aatrox','Ambessa','Camille','Darius','Fiora','Gnar','Gwen','Jayce','Jax','Kennen','K Sante','Renekton','Rumble','Shen','Udyr'],
  JNG: ['Belveth','Briar','Diana','Graves','Hecarim','JarvanIV','Karthus','Kayn','LeeSin','Lillia','Maokai','Nidalee','Nocturne','Sejuani','Vi','Viego','XinZhao'],
  MID: ['Ahri','Akali','Azir','Corki','Galio','LeBlanc','Orianna','Ryze','Sylas','Syndra','Taliyah','Viktor','Yone','Zoe'],
  ADC: ['Aphelios','Ashe','Caitlyn','Draven','Jhin','Jinx','KaiSa','Kalista','KogMaw','Lucian','MissFortune','Nilah','Samira','Sivir','Smolder','Tristana','Varus','Xayah','Zeri'],
  SUP: ['Alistar','Bard','Blitzcrank','Braum','Janna','Karma','Leona','Lulu','Milio','Nami','Nautilus','Pyke','Rakan','Rell','Renata','Senna','Seraphine','Thresh','Yuumi'],
}
const roleHint = (champion: ChampionData, role: Role) => ROLE_HINTS[role].some(value => champion.id.toLowerCase().replace(/[^a-z]/g,'').includes(value.toLowerCase().replace(/[^a-z]/g,'')))

function readRoster(teamShort: string): Player[] {
  let saved: Player[] = []
  try {
    const raw = localStorage.getItem('lck-manager-roster-' + teamShort)
    if (raw) saved = JSON.parse(raw) as Player[]
  } catch {
    saved = []
  }
  if (!saved.length) {
    saved = (seasonClubs.find(team => team.short === teamShort)?.players ?? []) as Player[]
  }
  return roles.map(role => {
    const candidates = saved.filter(player => player.role === role)
    return candidates.find(player => player.status === '주전') ?? candidates[0] ?? {
      id: `vacant-${teamShort}-${role}`, name: '공석', role, overall: 55, morale: 65, status: '공석', champions: [],
    }
  })
}

function playerMastery(player: Player, champion: ChampionData): number {
  const entry = player.champions?.find(item => (typeof item === 'string' ? item : item.name) === champion.name || (typeof item === 'string' ? item : item.name) === champion.id)
  return typeof entry === 'object' ? Math.max(0, Math.min(100, entry.mastery ?? 0)) : 0
}

function makeSimPlayers(roster: Player[], picks: Record<Role, string>, catalog: ChampionData[]): SimPlayer[] {
  return roles.map(role => {
    const player = roster.find(item => item.role === role)!
    const champion = catalog.find(item => item.id === picks[role])
    return {
      id: player.id || `${player.team ?? 'team'}-${player.name}`,
      name: player.name,
      role,
      championId: champion?.id ?? '',
      overall: player.overall ?? 70,
      morale: player.morale ?? 75,
      mastery: champion ? playerMastery(player, champion) : 0,
    }
  })
}

function timeLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function randomEnemyDraft(catalog: ChampionData[], banned: string[], ourPicks: Record<Role, string>): Record<Role, string> {
  const used = new Set([...banned, ...Object.values(ourPicks)])
  const result = {} as Record<Role, string>
  for (const role of roles) {
    const candidates = catalog.filter(champion => !used.has(champion.id))
    const preferred = candidates.filter(champion => roleHint(champion, role))
    const pool = preferred.length ? preferred : candidates
    const chosen = pool[Math.floor(Math.random() * pool.length)] ?? candidates[0]
    if (!chosen) continue
    result[role] = chosen.id
    used.add(chosen.id)
  }
  return result
}

function saveGameStats(state: MatchState, matchId: number, gameNumber: number, blueWinner: boolean) {
  const historyKey = 'lck-player-match-history-2026'
  const seasonKey = 'lck-player-season-stats-2026'
  const championKey = 'lck-player-champion-stats-2026'
  const gameKey = `${matchId}-${gameNumber}`
  try {
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]') as Array<{ gameKey: string; [key: string]: unknown }>
    if (history.some(item => item.gameKey === gameKey)) return
    const season = JSON.parse(localStorage.getItem(seasonKey) || '{}') as Record<string, { matches: number; wins: number; losses: number; kills: number; deaths: number; assists: number; mvp: number; cs: number }>
    const champions = JSON.parse(localStorage.getItem(championKey) || '{}') as Record<string, Record<string, { matches: number; wins: number; losses: number; kills: number; deaths: number; assists: number }>>
    const allPlayers = [
      ...state.blue.players.map(player => ({ player, team: state.blue.name, won: blueWinner })),
      ...state.red.players.map(player => ({ player, team: state.red.name, won: !blueWinner })),
    ]
    const winningPlayers = allPlayers.filter(entry => entry.won)
    const mvp = winningPlayers.map(entry => entry.player).sort((a, b) => (b.kills * 2 + b.assists + b.cs / 30 + b.damage / 1000) - (a.kills * 2 + a.assists + a.cs / 30 + a.damage / 1000))[0]?.name
    for (const { player, team, won } of allPlayers) {
      const previous = season[player.name] ?? { matches: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, mvp: 0, cs: 0 }
      season[player.name] = {
        matches: previous.matches + 1,
        wins: previous.wins + (won ? 1 : 0),
        losses: previous.losses + (won ? 0 : 1),
        kills: previous.kills + player.kills,
        deaths: previous.deaths + player.deaths,
        assists: previous.assists + player.assists,
        mvp: previous.mvp + (player.name === mvp ? 1 : 0),
        cs: previous.cs + player.cs,
      }
      const playerKey = player.id || `${team}-${player.name}`
      const playerChampions = champions[playerKey] ?? {}
      const previousChampion = playerChampions[player.championId] ?? { matches: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 }
      playerChampions[player.championId] = {
        matches: previousChampion.matches + 1,
        wins: previousChampion.wins + (won ? 1 : 0),
        losses: previousChampion.losses + (won ? 0 : 1),
        kills: previousChampion.kills + player.kills,
        deaths: previousChampion.deaths + player.deaths,
        assists: previousChampion.assists + player.assists,
      }
      champions[playerKey] = playerChampions
    }
    history.unshift({
      gameKey,
      matchId,
      gameNumber,
      seconds: state.seconds,
      blue: state.blue.name,
      red: state.red.name,
      blueKills: state.blue.kills,
      redKills: state.red.kills,
      blueGold: state.blue.gold,
      redGold: state.red.gold,
      winner: blueWinner ? state.blue.name : state.red.name,
      players: allPlayers.map(entry => ({ ...entry.player, team: entry.team, won: entry.won })),
    })
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 500)))
    localStorage.setItem(seasonKey, JSON.stringify(season))
    localStorage.setItem(championKey, JSON.stringify(champions))
    window.dispatchEvent(new Event('lck-player-stats-updated'))
  } catch {
    // Match results still remain visible if browser storage is temporarily unavailable.
  }
}

function MatchCenter({ match, myTeam = 'T1', onFinish, onExit }: Props) {
  const roster = useMemo(() => readRoster(myTeam), [myTeam])
  const redName = match.home === myTeam ? match.away : match.home
  const enemyRoster = useMemo(() => readRoster(redName), [redName])
  const [catalog, setCatalog] = useState<ChampionData[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [stage, setStage] = useState<'draft' | 'game' | 'between' | 'result'>('draft')
  const [draftMode, setDraftMode] = useState<DraftMode>('ban')
  const [activeRole, setActiveRole] = useState<Role>('TOP')
  const [bans, setBans] = useState<string[]>([])
  const [picks, setPicks] = useState<Record<Role, string>>({ TOP: '', JNG: '', MID: '', ADC: '', SUP: '' })
  const [enemyPicks, setEnemyPicks] = useState<Record<Role, string>>({ TOP: '', JNG: '', MID: '', ADC: '', SUP: '' })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const [selectedChampion, setSelectedChampion] = useState<ChampionData | null>(null)
  const [gameState, setGameState] = useState<MatchState | null>(null)
  const [speed, setSpeed] = useState(2)
  const [paused, setPaused] = useState(false)
  const [gameNumber, setGameNumber] = useState(1)
  const [blueSeriesWins, setBlueSeriesWins] = useState(0)
  const [redSeriesWins, setRedSeriesWins] = useState(0)
  const [winner, setWinner] = useState<Side | null>(null)
  const handledGame = useRef(false)
  const blueName = myTeam
  const matchWinnerWins = 2
  const allBanned = bans.length >= 5

  useEffect(() => {
    let active = true
    loadChampionCatalog().then(data => {
      if (!active) return
      setCatalog(data)
      setSelectedChampion(data[0] ?? null)
      setCatalogError('')
    }).catch(error => {
      if (active) setCatalogError(error instanceof Error ? error.message : '챔피언 데이터를 불러오지 못했습니다.')
    })
    return () => { active = false }
  }, [])

  const pickedIds = Object.values(picks).filter(Boolean)
  const filteredChampions = useMemo(() => catalog.filter(champion => {
    const matchesSearch = !search || champion.name.toLowerCase().includes(search.toLowerCase()) || champion.id.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || roleHint(champion, roleFilter)
    return matchesSearch && matchesRole
  }), [catalog, search, roleFilter])

  function chooseChampion(champion: ChampionData) {
    if (draftMode === 'ban') {
      if (bans.includes(champion.id)) {
        setBans(current => current.filter(id => id !== champion.id))
        return
      }
      if (bans.length >= 5) return
      if (pickedIds.includes(champion.id)) return
      setBans(current => [...current, champion.id])
      setSelectedChampion(champion)
      return
    }
    if (bans.includes(champion.id)) return
    if (Object.entries(picks).some(([role, id]) => role !== activeRole && id === champion.id)) return
    setPicks(current => ({ ...current, [activeRole]: champion.id }))
    setSelectedChampion(champion)
  }

  function beginPicking() {
    if (bans.length !== 5) {
      setCatalogError('우리 팀 밴 5개를 선택한 다음 픽 단계로 이동하세요.')
      return
    }
    const aiBans: string[] = []
    const available = catalog.filter(champion => !bans.includes(champion.id))
    while (aiBans.length < 5 && available.length) {
      const index = Math.floor(Math.random() * available.length)
      aiBans.push(available.splice(index, 1)[0].id)
    }
    const combined = [...bans, ...aiBans]
    setBans(combined)
    setDraftMode('pick')
    setRoleFilter('ALL')
    setCatalogError('')
  }

  function startGame() {
    if (roles.some(role => !picks[role])) {
      setCatalogError('TOP · JNG · MID · ADC · SUP에 챔피언을 각각 지정해야 합니다.')
      return
    }
    if (new Set(Object.values(picks)).size !== 5) {
      setCatalogError('한 팀에서 같은 챔피언을 중복 선택할 수 없습니다.')
      return
    }
    const ai = randomEnemyDraft(catalog, bans, picks)
    if (roles.some(role => !ai[role])) {
      setCatalogError('상대 팀 챔피언 선택을 완료하지 못했습니다. 챔피언 목록을 다시 불러오세요.')
      return
    }
    setEnemyPicks(ai)
    const bluePlayers = makeSimPlayers(roster, picks, catalog)
    const redPlayers = makeSimPlayers(enemyRoster, ai, catalog)
    setGameState(createMatchState(blueName, redName, bluePlayers, redPlayers, match.id * 100 + gameNumber))
    setPaused(false)
    handledGame.current = false
    setStage('game')
    setCatalogError('')
  }

  useEffect(() => {
    if (stage !== 'game' || paused || !gameState || gameState.over) return
    const interval = window.setInterval(() => {
      setGameState(current => current ? advanceMatch(current) : current)
    }, Math.max(100, 600 / speed))
    return () => window.clearInterval(interval)
  }, [stage, paused, gameState?.over, speed])

  useEffect(() => {
    if (stage !== 'game' || !gameState?.over || handledGame.current) return
    handledGame.current = true
    const blueWon = gameState.winner === 'blue'
    saveGameStats(gameState, match.id, gameNumber, blueWon)
    const nextBlue = blueSeriesWins + (blueWon ? 1 : 0)
    const nextRed = redSeriesWins + (blueWon ? 0 : 1)
    setBlueSeriesWins(nextBlue)
    setRedSeriesWins(nextRed)
    if (nextBlue >= matchWinnerWins || nextRed >= matchWinnerWins) {
      setWinner(blueWon ? 'blue' : 'red')
      setStage('result')
    } else {
      setStage('between')
    }
  }, [stage, gameState, match.id, gameNumber, blueSeriesWins, redSeriesWins])

  function nextGame() {
    setGameNumber(value => value + 1)
    setPicks({ TOP: '', JNG: '', MID: '', ADC: '', SUP: '' })
    setEnemyPicks({ TOP: '', JNG: '', MID: '', ADC: '', SUP: '' })
    setBans([])
    setDraftMode('ban')
    setActiveRole('TOP')
    setSearch('')
    setGameState(null)
    setPaused(false)
    setWinner(null)
    setStage('draft')
  }

  function completeSeries() {
    if (match.home === blueName) onFinish(blueSeriesWins, redSeriesWins)
    else onFinish(redSeriesWins, blueSeriesWins)
  }

  const playerForRole = roster.find(player => player.role === activeRole)
  const selectedMastery = playerForRole && selectedChampion ? playerMastery(playerForRole, selectedChampion) : 0

  if (stage === 'draft') {
    return (
      <div className="match-center mc-draft-screen">
        <header className="mc-header">
          <button className="mc-back" onClick={onExit}>← 경기 일정</button>
          <div><span>2026 LCK · MATCH DAY · GAME {gameNumber}</span><h1>{blueName} <small>VS</small> {redName}</h1></div>
          <div className="mc-stage-pill">CHAMPION SELECT</div>
        </header>
        <div className="mc-draft-shell">
          <div className="mc-draft-topline">
            <div><span className="mc-eyebrow">PRE-MATCH PREPARATION</span><h2>밴픽 전략</h2><p>선수 포지션에 맞춰 챔피언을 지정합니다. ADC 픽은 반드시 ADC 선수에게 배정됩니다.</p></div>
            <div className="mc-draft-phases"><button className={draftMode === 'ban' ? 'active' : ''} onClick={() => setDraftMode('ban')}>BAN <b>{Math.min(bans.length, 5)}/5</b></button><button className={draftMode === 'pick' ? 'active' : ''} onClick={() => { if (allBanned) setDraftMode('pick'); else setCatalogError('밴 5개를 먼저 선택하세요.') }}>PICK <b>{pickedIds.length}/5</b></button></div>
          </div>
          <div className="mc-draft-workspace">
            <section className="mc-draft-team-panel blue">
              <div className="mc-draft-team-heading"><span>BLUE SIDE · OUR TEAM</span><strong>{blueName}</strong></div>
              {roles.map(role => {
                const player = roster.find(item => item.role === role)!
                const champion = catalog.find(item => item.id === picks[role])
                return <button key={role} className={activeRole === role && draftMode === 'pick' ? 'mc-player-slot active' : 'mc-player-slot'} onClick={() => { setActiveRole(role); setDraftMode('pick') }}>
                  <span className="mc-role-chip">{ROLE_LABEL[role]}</span><span className="mc-slot-player"><b>{player.name}</b><small>{role}</small></span>
                  {champion ? <img src={champion.image} alt={champion.name}/> : <span className="mc-slot-empty">CHOOSE</span>}
                  <span className="mc-slot-champion">{champion?.name ?? '챔피언 선택'}</span>
                </button>
              })}
              <div className="mc-ban-list"><span>우리 팀 밴</span>{bans.slice(0, 5).map(id => { const champ = catalog.find(item => item.id === id); return champ ? <img key={id} src={champ.image} title={champ.name} alt={champ.name}/> : null })}</div>
            </section>
            <section className="mc-champion-picker">
              <div className="mc-champion-selected">
                {selectedChampion ? <><img src={selectedChampion.splash} alt="" /><div><span>CHAMPION PREVIEW</span><h3>{selectedChampion.name}</h3><p>{selectedChampion.title}</p></div></> : <div className="mc-preview-placeholder">챔피언을 선택하세요.</div>}
              </div>
              <div className="mc-picker-controls">
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="챔피언 검색"/>
                <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as Role | 'ALL')}><option value="ALL">전체 포지션</option>{roles.map(role => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}</select>
              </div>
              <div className="mc-champion-grid">
                {filteredChampions.map(champion => {
                  const isBanned = bans.includes(champion.id)
                  const isPicked = pickedIds.includes(champion.id)
                  return <button key={champion.id} className={`mc-champion-tile ${selectedChampion?.id === champion.id ? 'selected' : ''} ${isBanned ? 'banned' : ''} ${isPicked ? 'picked' : ''}`} onClick={() => { setSelectedChampion(champion); chooseChampion(champion) }} disabled={(draftMode === 'pick' && isBanned) || (draftMode === 'pick' && isPicked && picks[activeRole] !== champion.id)}>
                    <img src={champion.image} alt="" loading="lazy"/><span>{champion.name}</span>{isBanned && <i>BAN</i>}{isPicked && <i>PICK</i>}
                  </button>
                })}
              </div>
              <div className="mc-picker-footer">
                {draftMode === 'ban' ? <><span>밴할 챔피언을 선택하세요 · {bans.length}/5</span><button disabled={bans.length !== 5} onClick={beginPicking}>상대 밴 확정 후 픽 진행 →</button></> : <><span>{ROLE_LABEL[activeRole]} · {playerForRole?.name} · 등록 숙련도 {selectedChampion ? selectedMastery : 0}/100</span><button disabled={roles.some(role => !picks[role])} onClick={startGame}>밴픽 완료 · 경기 시작</button></>}
              </div>
            </section>
            <section className="mc-draft-team-panel red">
              <div className="mc-draft-team-heading"><span>RED SIDE · OPPONENT</span><strong>{redName}</strong></div>
              {roles.map(role => <div key={role} className="mc-player-slot enemy">
                <span className="mc-role-chip">{ROLE_LABEL[role]}</span><span className="mc-slot-player"><b>{enemyRoster.find(item => item.role === role)?.name ?? '공석'}</b><small>{role}</small></span>
                <span className="mc-slot-empty">AI DRAFT</span><span className="mc-slot-champion">{enemyPicks[role] ? catalog.find(item => item.id === enemyPicks[role])?.name : '상대 선택 대기'}</span>
              </div>)}
              <div className="mc-ban-list"><span>상대 팀 밴</span><small>상대 밴은 픽 단계 진입 시 자동 처리됩니다.</small></div>
            </section>
          </div>
          {catalogError && <div className="mc-error">{catalogError}</div>}
          <div className="mc-draft-note">
            {catalog.length ? `Data Dragon · ${catalog[0]?.version} · 전체 ${catalog.length}개 챔피언` : '챔피언 데이터 불러오는 중…'}
            {catalogError && <button onClick={() => { setCatalogError(''); loadChampionCatalog(true).then(setCatalog).catch(error => setCatalogError(error.message)) }}>챔피언 데이터 다시 불러오기</button>}
          </div>
        </div>
      </div>
    )
  }

  if (!gameState) return <div className="mc-loading">경기 데이터를 준비하고 있습니다…</div>

  const blueWon = gameState.winner === 'blue'
  const dragonCounts = { blue: gameState.blue.dragons.length, red: gameState.red.dragons.length }
  const objectives = [
    { name: '드래곤', timer: gameState.dragonAvailable ? '처치 가능' : timeLabel(Math.max(0, gameState.nextDragonAt - gameState.seconds)), state: gameState.dragonAvailable ? 'LIVE' : `${gameState.blue.dragons.length} : ${gameState.red.dragons.length}` },
    { name: '공허 유충', timer: gameState.grubsResolved ? '처치 완료' : gameState.grubsAvailable ? '처치 가능' : timeLabel(Math.max(0, 480 - gameState.seconds)), state: `${gameState.blue.grubs} : ${gameState.red.grubs}` },
    { name: '협곡의 전령', timer: gameState.heraldResolved ? '처치 완료' : gameState.heraldAvailable ? '처치 가능' : timeLabel(Math.max(0, 900 - gameState.seconds)), state: gameState.blue.herald ? blueName : gameState.red.herald ? redName : '대기' },
    { name: '바론', timer: gameState.baronAvailable ? '처치 가능' : timeLabel(Math.max(0, gameState.nextBaronAt - gameState.seconds)), state: gameState.blue.baronBuffUntil > gameState.seconds ? blueName : gameState.red.baronBuffUntil > gameState.seconds ? redName : '대기' },
    { name: '장로 드래곤', timer: gameState.elderAvailable ? '처치 가능' : gameState.elderAvailableAt ? timeLabel(Math.max(0, gameState.elderAvailableAt - gameState.seconds)) : '영혼 이후', state: gameState.blue.elderBuffUntil > gameState.seconds ? blueName : gameState.red.elderBuffUntil > gameState.seconds ? redName : '대기' },
  ]
  const bluePlayers = gameState.blue.players
  const redPlayers = gameState.red.players
  const allMapPlayers = [
    ...bluePlayers.map((player, index) => ({ player, side: 'blue' as const, index })),
    ...redPlayers.map((player, index) => ({ player, side: 'red' as const, index })),
  ]
  const lanePositions: Record<Role, { blue: [number, number]; red: [number, number] }> = {
    TOP: { blue: [17, 22], red: [83, 14] },
    JNG: { blue: [32 + Math.sin(gameState.seconds / 50) * 5, 39 + Math.cos(gameState.seconds / 45) * 5], red: [68 + Math.sin(gameState.seconds / 47) * 5, 61 + Math.cos(gameState.seconds / 43) * 5] },
    MID: { blue: [34, 48], red: [66, 52] },
    ADC: { blue: [17, 78], red: [83, 86] },
    SUP: { blue: [29, 72], red: [71, 28] },
  }
  const structures = (team: MatchState['blue']) => LANES.map(lane => ({ lane, remaining: team.towersRemaining[lane], inhibitor: team.inhibitorsAlive[lane] }))
  const LANES: Role[] = ['TOP', 'MID', 'ADC']
  const minionDots = Math.max(2, Math.min(7, gameState.minionWaves % 8))
  return (
    <div className="match-center mc-live-screen">
      <header className="mc-header">
        <button className="mc-back" onClick={onExit}>← 경기 일정</button>
        <div><span>2026 LCK · LIVE MATCH · GAME {gameNumber}</span><h1>{blueName} <small>VS</small> {redName}</h1></div>
        <div className={stage === 'result' ? 'mc-stage-pill finished' : 'mc-stage-pill live'}>{stage === 'result' ? 'SERIES COMPLETE' : stage === 'between' ? 'BETWEEN GAMES' : 'LIVE'}</div>
      </header>

      {stage === 'game' && <>
        <div className="mc-broadcast-bar">
          <div><b>{blueName}</b><strong>{gameState.blue.kills}</strong><small>{gameState.blue.gold.toLocaleString()} G</small></div>
          <div className="mc-match-clock"><strong>{timeLabel(gameState.seconds)}</strong><span>GAME {gameNumber} · BO3</span><i>{gameState.minionWaves} 웨이브</i></div>
          <div><strong>{gameState.red.kills}</strong><b>{redName}</b><small>{gameState.red.gold.toLocaleString()} G</small></div>
        </div>
        <div className="mc-objective-bar">{objectives.map(item => <div key={item.name}><span>{item.name}</span><b>{item.state}</b><small>{item.timer}</small></div>)}</div>
        <div className="mc-match-layout">
          <section className="mc-rift-board">
            <div className="mc-board-title"><span>TACTICAL ARENA · 3 LANES / JUNGLE / RIVER</span><small>시뮬레이션 맵 · 실제 클라이언트 리플레이가 아닙니다.</small></div>
            <div className="mc-map-canvas">
              <svg className="mc-map-svg" viewBox="0 0 100 100" role="img" aria-label="세 개의 라인과 정글, 강, 오브젝트 둥지를 표시하는 경기 전술 지도">
                <defs><linearGradient id="arena-ground" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#1d3a32"/><stop offset="50%" stopColor="#294638"/><stop offset="100%" stopColor="#1b332e"/></linearGradient></defs>
                <rect width="100" height="100" fill="url(#arena-ground)"/>
                <path d="M5 18 L82 18 L95 5 M18 95 L18 20 L95 20" stroke="#6a8066" strokeWidth="8" opacity=".28" fill="none"/>
                <path d="M8 90 L90 8" stroke="#b0bd8b" strokeWidth="7" opacity=".18" fill="none"/>
                <path d="M8 12 L92 88" stroke="#b0bd8b" strokeWidth="7" opacity=".12" fill="none"/>
                <path d="M8 22 L78 22 L90 10 M22 92 L22 25 M10 90 L90 10 M22 78 L90 78" stroke="#c2cba1" strokeWidth="1.3" opacity=".75" fill="none"/>
                <path d="M0 52 Q20 38 37 52 T70 52 T100 45" stroke="#5c9d9b" strokeWidth="8" opacity=".42" fill="none"/>
                <path d="M0 52 Q20 38 37 52 T70 52 T100 45" stroke="#a4d5c2" strokeWidth="1" opacity=".45" fill="none"/>
                <path d="M7 33 Q24 23 35 38 Q28 52 12 50Z M65 60 Q80 45 93 57 Q88 77 69 78Z" fill="#132b25" opacity=".8"/>
                <path d="M36 18 Q48 10 61 19 L58 33 Q45 40 34 30Z M38 68 Q50 61 62 70 L57 86 Q43 89 34 80Z" fill="#142e27" opacity=".82"/>
                <rect x="4" y="80" width="15" height="15" rx="2" fill="#1d4265" stroke="#75bfff" strokeWidth="1.2"/>
                <rect x="81" y="4" width="15" height="15" rx="2" fill="#67313b" stroke="#ff8c9a" strokeWidth="1.2"/>
                <text x="11" y="89" fill="#d8ebff" fontSize="3">BLUE BASE</text>
                <text x="84" y="13" fill="#ffe0e5" fontSize="3">RED BASE</text>
                <g fill="#d4c47c" stroke="#3a392a" strokeWidth=".6"><path d="M16 22l2-4 2 4z"/><path d="M50 50l2-4 2 4z"/><path d="M82 78l2-4 2 4z"/></g>
                <g fill="#8dbb83" opacity=".25">{Array.from({ length: 28 }, (_, i) => <circle key={i} cx={(i * 29) % 97 + 1} cy={(i * 17) % 97 + 1} r="1.5"/>)}</g>
                <g className="mc-map-objectives"><circle cx="74" cy="43" r="5" fill="#b67f4e" stroke="#f0d19a" strokeWidth=".8"/><text x="74" y="44" textAnchor="middle" fill="#fff" fontSize="2.5">DR</text><circle cx="28" cy="57" r="5" fill="#7655a0" stroke="#d9b5ff" strokeWidth=".8"/><text x="28" y="58" textAnchor="middle" fill="#fff" fontSize="2.5">VOID</text></g>
                {LANES.map((lane, index) => <g key={lane} opacity=".7"><circle cx={index === 0 ? 30 : index === 1 ? 50 : 70} cy={index === 0 ? 24 : index === 1 ? 50 : 76} r="2.3" fill="#e1d2a1" stroke="#443c2e" strokeWidth=".7"/><text x={index === 0 ? 30 : index === 1 ? 50 : 70} y={index === 0 ? 27 : index === 1 ? 53 : 79} textAnchor="middle" fill="#f4edcf" fontSize="2.4">{lane}</text></g>)}
              </svg>
              <div className="mc-minion-wave blue-wave" style={{ left: '23%', top: '29%' }}>{Array.from({ length: minionDots }, (_, i) => <i key={i}/>)}</div>
              <div className="mc-minion-wave red-wave" style={{ left: '69%', top: '65%' }}>{Array.from({ length: minionDots }, (_, i) => <i key={i}/>)}</div>
              {allMapPlayers.map(({ player, side }) => {
                const champion = catalog.find(item => item.id === player.championId)
                const base = lanePositions[player.role]
                const [x, y] = base[side]
                const movement = player.role === 'JNG' ? Math.sin(gameState.seconds / 37) * 3 : Math.sin(gameState.seconds / 95 + player.role.length) * 1.5
                return <div key={player.id} className={`mc-map-player ${side}`} style={{ left: `${x + movement}%`, top: `${y}%` }} title={`${player.name} · ${player.role} · ${champion?.name ?? player.championId}`}>
                  {champion ? <img src={champion.image} alt={champion.name}/> : <b>{ROLE_LABEL[player.role]}</b>}<span>{player.name}</span>
                </div>
              })}
              <div className="mc-map-legend"><span><i className="blue-dot"/> {blueName}</span><span><i className="red-dot"/> {redName}</span><span>● 선수 위치</span><span>◆ 오브젝트</span></div>
            </div>
            <div className="mc-map-substatus"><div><b>미니언 웨이브</b><span>{gameState.minionWaves}회 생성</span></div><div><b>정글 캠프</b><span>블루 {gameState.jungleClears.blue} · 레드 {gameState.jungleClears.red}</span></div><div><b>드래곤 영혼</b><span>{gameState.dragonSoul === 'blue' ? blueName : gameState.dragonSoul === 'red' ? redName : '아직 없음'}</span></div></div>
          </section>
          <aside className="mc-match-sidebar">
            <section className="mc-side-panel"><h3>오브젝트 현황</h3>{objectives.map(item => <div className="mc-objective-row" key={item.name}><span>{item.name}</span><b>{item.state}</b><small>{item.timer}</small></div>)}</section>
            <section className="mc-side-panel"><h3>구조물 현황</h3>{([{ name: blueName, team: gameState.blue }, { name: redName, team: gameState.red }]).map(({ name, team }) => <div className="mc-structure-team" key={name}><b>{name}</b>{(['TOP','MID','BOT'] as const).map(lane => <span key={lane}>{lane} 포탑 {team.towersRemaining[lane]} · 억제기 {team.inhibitorsAlive[lane] ? '생존' : '파괴'}</span>)}<span>넥서스 포탑 {team.nexusTowersRemaining} · 넥서스 {team.nexusHealth}%</span></div>)}</section>
            <section className="mc-side-panel"><h3>선수 현황</h3>{[{ name: blueName, players: bluePlayers, side: 'blue' }, { name: redName, players: redPlayers, side: 'red' }].map(team => <div key={team.name} className="mc-mini-roster"><b className={team.side}>{team.name}</b>{team.players.map(player => <div key={player.id}><span>{ROLE_LABEL[player.role]} · {player.name}</span><strong>{player.kills}/{player.deaths}/{player.assists}</strong><small>CS {player.cs} · Lv.{player.level}</small></div>)}</div>)}</section>
          </aside>
        </div>
        <div className="mc-live-controls"><div><button onClick={() => setPaused(value => !value)}>{paused ? '▶ 재개' : 'Ⅱ 일시정지'}</button>{[1,2,4].map(value => <button key={value} className={speed === value ? 'active' : ''} onClick={() => setSpeed(value)}>{value}x</button>)}</div><span>{paused ? '경기 일시정지' : '경기 진행 중'} · 넥서스 파괴 시 종료</span></div>
        <section className="mc-event-feed"><h3>경기 중계 로그</h3>{gameState.events.map(event => <div key={event.id} className={`mc-event-line ${event.kind}`}><time>{timeLabel(event.seconds)}</time><span>{event.message}</span></div>)}</section>
      </>}
      {stage === 'between' && <div className="mc-series-panel"><span>GAME {gameNumber} COMPLETE</span><h2>{blueWon ? blueName : redName} 세트 승리</h2><p>시리즈 스코어 · {blueName} {blueSeriesWins} : {redSeriesWins} {redName}</p><p>다음 세트에서는 새 밴픽을 진행합니다.</p><button onClick={nextGame}>다음 세트 밴픽 진행 →</button></div>}
      {stage === 'result' && <div className="mc-series-panel final"><span>FINAL SERIES RESULT</span><h2>{winner === 'blue' ? blueName : redName} 시리즈 승리</h2><p>{blueName} {blueSeriesWins} : {redSeriesWins} {redName}</p><p>경기 기록과 선수별 챔피언 사용 기록이 저장되었습니다.</p><button onClick={completeSeries}>경기 결과 저장하고 일정으로</button></div>}
    </div>
  )
}

export default MatchCenter
