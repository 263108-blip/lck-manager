import type { Role } from './champions'

export type Side = 'blue' | 'red'
export type Lane = 'TOP' | 'MID' | 'BOT'
export type SimPlayer = {
  id: string
  name: string
  role: Role
  championId: string
  overall: number
  morale: number
  mastery: number
}
export type PlayerMatchStats = SimPlayer & {
  kills: number
  deaths: number
  assists: number
  cs: number
  gold: number
  damage: number
  vision: number
  level: number
}
export type TeamMatchState = {
  name: string
  players: PlayerMatchStats[]
  kills: number
  gold: number
  dragons: string[]
  grubs: number
  herald: boolean
  baronBuffUntil: number
  elderBuffUntil: number
  towersRemaining: Record<Lane, number>
  inhibitorsAlive: Record<Lane, boolean>
  nexusTowersRemaining: number
  nexusHealth: number
}
export type MatchEvent = {
  id: number
  seconds: number
  kind: 'system' | 'kill' | 'objective' | 'structure' | 'jungle'
  message: string
}
export type MatchState = {
  seconds: number
  rng: number
  over: boolean
  winner: Side | null
  blue: TeamMatchState
  red: TeamMatchState
  dragonType: string
  nextDragonAt: number
  dragonAvailable: boolean
  dragonSoul: Side | null
  elderAvailableAt: number | null
  elderAvailable: boolean
  grubsAvailable: boolean
  grubsResolved: boolean
  heraldAvailable: boolean
  heraldResolved: boolean
  baronAvailable: boolean
  nextBaronAt: number
  minionWaves: number
  jungleClears: { blue: number; red: number }
  events: MatchEvent[]
}

const LANES: Lane[] = ['TOP', 'MID', 'BOT']
const DRAGONS = ['화염', '대지', '바람', '바다']
const CAMP_NAMES = ['블루 버프', '레드 버프', '늑대', '칼날부리', '두꺼비', '돌거북', '바위게']

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function cloneTeam(team: TeamMatchState): TeamMatchState {
  return {
    ...team,
    players: team.players.map(player => ({ ...player })),
    dragons: [...team.dragons],
    towersRemaining: { ...team.towersRemaining },
    inhibitorsAlive: { ...team.inhibitorsAlive },
  }
}

function addEvent(state: MatchState, kind: MatchEvent['kind'], message: string) {
  state.events.unshift({
    id: state.events.length ? state.events[0].id + 1 : 1,
    seconds: state.seconds,
    kind,
    message,
  })
  state.events = state.events.slice(0, 24)
}

function seededRandom(state: MatchState): number {
  state.rng = (state.rng * 1664525 + 1013904223) % 4294967296
  return state.rng / 4294967296
}

function teamPower(team: TeamMatchState): number {
  const players = team.players
  if (!players.length) return 60
  const average = players.reduce((sum, player) => sum + player.overall, 0) / players.length
  const morale = players.reduce((sum, player) => sum + player.morale, 0) / players.length
  return average + (morale - 75) * 0.08
}

function objectivePower(team: TeamMatchState): number {
  const jungle = team.players.find(player => player.role === 'JNG')
  const support = team.players.find(player => player.role === 'SUP')
  return teamPower(team) * 0.7 + (jungle?.overall ?? 60) * 0.2 + (support?.vision ?? 0) * 0.1
}

function addKill(state: MatchState, winner: Side) {
  const loser: Side = winner === 'blue' ? 'red' : 'blue'
  const winningTeam = state[winner]
  const losingTeam = state[loser]
  const carry = winningTeam.players
    .map(player => ({ player, weight: player.role === 'ADC' ? 1.7 : player.role === 'MID' ? 1.45 : player.role === 'JNG' ? 1.2 : player.role === 'SUP' ? 0.65 : 0.9 }))
    .sort((a, b) => b.weight * b.player.overall - a.weight * a.player.overall)[0]?.player
  const victim = losingTeam.players.slice().sort((a, b) => a.overall - b.overall)[0]
  if (carry) {
    carry.kills += 1
    carry.gold += 300
    carry.damage += Math.round(350 + carry.overall * 8)
  }
  if (victim) {
    victim.deaths += 1
    victim.damage += Math.round(victim.overall * 2)
  }
  winningTeam.players.forEach(player => {
    if (player !== carry) player.assists += 1
  })
  winningTeam.kills += 1
  winningTeam.gold += 300
  addEvent(state, 'kill', `${winner === 'blue' ? winningTeam.name : winningTeam.name} 교전 승리 · ${carry?.name ?? '선수'} 킬`)
}

function destroyStructure(state: MatchState, attacker: Side, lane: Lane) {
  const team = state[attacker]
  if (team.towersRemaining[lane] > 0) {
    team.towersRemaining[lane] -= 1
    team.gold += 250
    addEvent(state, 'structure', `${team.name} ${lane} 라인 포탑 파괴`)
    return
  }
  if (team.inhibitorsAlive[lane]) {
    team.inhibitorsAlive[lane] = false
    team.gold += 300
    addEvent(state, 'structure', `${team.name} ${lane} 억제기 파괴 · 슈퍼 미니언 생성`)
    return
  }
  if (team.nexusTowersRemaining > 0) {
    team.nexusTowersRemaining -= 1
    team.gold += 150
    addEvent(state, 'structure', `${team.name} 넥서스 포탑 파괴`)
    return
  }
  team.nexusHealth = clamp(team.nexusHealth - 35, 0, 100)
  addEvent(state, 'structure', `${team.name} 넥서스 공략 · 내구도 ${team.nexusHealth}%`)
}

function resolveObjective(state: MatchState, objective: 'dragon' | 'grubs' | 'herald' | 'baron' | 'elder') {
  const blueScore = objectivePower(state.blue)
  const redScore = objectivePower(state.red)
  const blueChance = clamp(0.5 + (blueScore - redScore) * 0.012, 0.2, 0.8)
  const winner: Side = seededRandom(state) < blueChance ? 'blue' : 'red'
  const team = state[winner]
  const loser: Side = winner === 'blue' ? 'red' : 'blue'

  if (objective === 'dragon') {
    const dragon = state.dragonType
    team.dragons.push(dragon)
    team.gold += 250
    state.dragonAvailable = false
    if (team.dragons.length >= 4 && !state.dragonSoul) {
      state.dragonSoul = winner
      state.elderAvailableAt = state.seconds + 360
      addEvent(state, 'objective', `${team.name} 드래곤 영혼 획득 · 장로 드래곤이 6분 후 등장합니다`)
    } else {
      state.nextDragonAt = state.seconds + 300
      state.dragonType = DRAGONS[(team.dragons.length + state.red.dragons.length) % DRAGONS.length]
      addEvent(state, 'objective', `${team.name} ${dragon} 드래곤 처치`)
    }
  } else if (objective === 'grubs') {
    const count = 1 + Math.floor(seededRandom(state) * 3)
    team.grubs += count
    team.gold += count * 100
    state.grubsAvailable = false
    state.grubsResolved = true
    addEvent(state, 'objective', `${team.name} 공허 유충 ${count}마리 처치`)
  } else if (objective === 'herald') {
    team.herald = true
    team.gold += 300
    state.heraldAvailable = false
    state.heraldResolved = true
    addEvent(state, 'objective', `${team.name} 협곡의 전령 처치 · 소환 가능`)
  } else if (objective === 'baron') {
    team.baronBuffUntil = state.seconds + 180
    team.gold += 300
    state.baronAvailable = false
    state.nextBaronAt = state.seconds + 360
    addEvent(state, 'objective', `${team.name} 내셔 남작 처치 · 3분간 바론 버프`)
  } else {
    team.elderBuffUntil = state.seconds + 150
    team.gold += 250
    state.elderAvailable = false
    state.elderAvailableAt = state.seconds + 360
    addEvent(state, 'objective', `${team.name} 장로 드래곤 처치 · 장로의 힘 획득`)
  }
  state[loser].players.forEach(player => { player.vision += 1 })
}

export function createMatchState(blueName: string, redName: string, bluePlayers: SimPlayer[], redPlayers: SimPlayer[], seed = Date.now()): MatchState {
  const makeTeam = (name: string, players: SimPlayer[]): TeamMatchState => ({
    name,
    players: players.map(player => ({
      ...player,
      kills: 0,
      deaths: 0,
      assists: 0,
      cs: 0,
      gold: 500,
      damage: 0,
      vision: player.role === 'SUP' ? 2 : 0,
      level: 1,
    })),
    kills: 0,
    gold: 2500,
    dragons: [],
    grubs: 0,
    herald: false,
    baronBuffUntil: 0,
    elderBuffUntil: 0,
    towersRemaining: { TOP: 3, MID: 3, BOT: 3 },
    inhibitorsAlive: { TOP: true, MID: true, BOT: true },
    nexusTowersRemaining: 2,
    nexusHealth: 100,
  })

  return {
    seconds: 0,
    rng: Math.abs(seed) % 4294967296,
    over: false,
    winner: null,
    blue: makeTeam(blueName, bluePlayers),
    red: makeTeam(redName, redPlayers),
    dragonType: DRAGONS[0],
    nextDragonAt: 300,
    dragonAvailable: false,
    dragonSoul: null,
    elderAvailableAt: null,
    elderAvailable: false,
    grubsAvailable: false,
    grubsResolved: false,
    heraldAvailable: false,
    heraldResolved: false,
    baronAvailable: false,
    nextBaronAt: 1200,
    minionWaves: 0,
    jungleClears: { blue: 0, red: 0 },
    events: [{ id: 1, seconds: 0, kind: 'system', message: '경기 시작 · 양 팀이 라인으로 이동합니다.' }],
  }
}

export function advanceMatch(state: MatchState): MatchState {
  if (state.over) return state
  const next: MatchState = {
    ...state,
    seconds: state.seconds + 30,
    blue: cloneTeam(state.blue),
    red: cloneTeam(state.red),
    jungleClears: { ...state.jungleClears },
    events: [...state.events],
  }
  const previousMinute = Math.floor(state.seconds / 60)
  const minute = Math.floor(next.seconds / 60)

  if (next.seconds >= 30 && next.seconds % 30 === 0) next.minionWaves += 1

  if (next.seconds >= 55 && next.jungleClears.blue === 0 && next.jungleClears.red === 0) {
    addEvent(next, 'jungle', '정글 캠프 생성 · 블루와 레드 팀이 첫 정글 동선을 시작합니다.')
  }
  if (next.seconds >= 67 && next.seconds % 60 === 7) {
    addEvent(next, 'jungle', '두꺼비와 돌거북 캠프가 활성화됩니다.')
  }
  if (next.seconds >= 175 && next.seconds % 150 === 25) {
    addEvent(next, 'jungle', '강의 바위게 재생성 구간입니다.')
  }

  if (next.seconds >= 300 && next.seconds >= next.nextDragonAt) next.dragonAvailable = true
  if (next.seconds >= 480 && !next.grubsResolved) next.grubsAvailable = true
  if (next.seconds >= 900 && !next.heraldResolved && next.seconds < 1185) next.heraldAvailable = true
  if (next.seconds >= 1185 && !next.heraldResolved) next.heraldAvailable = false
  if (next.seconds >= next.nextBaronAt) next.baronAvailable = true
  if (next.elderAvailableAt !== null && next.seconds >= next.elderAvailableAt) next.elderAvailable = true

  if (minute > previousMinute) {
    for (const side of ['blue', 'red'] as const) {
      const team = next[side]
      team.gold += 180 + Math.round(teamPower(team) * 0.6)
      team.players.forEach(player => {
        const csRate = player.role === 'ADC' ? 8.2 : player.role === 'MID' ? 7.3 : player.role === 'TOP' ? 6.8 : player.role === 'JNG' ? 5.2 : 1.8
        player.cs += Math.max(0, Math.round(csRate * (0.82 + seededRandom(next) * 0.36)))
        player.gold += 20 + Math.round(csRate * 20)
        player.level = clamp(1 + Math.floor(minute / 2.3), 1, 18)
      })
      if (seededRandom(next) < 0.22) {
        next.jungleClears[side] += 1
        const camp = CAMP_NAMES[next.jungleClears[side] % CAMP_NAMES.length]
        addEvent(next, 'jungle', `${team.name} 정글러가 ${camp} 캠프를 정리했습니다.`)
      }
    }

    const bluePower = teamPower(next.blue)
    const redPower = teamPower(next.red)
    const blueKillChance = clamp(0.42 + (bluePower - redPower) * 0.009, 0.2, 0.8)
    if (seededRandom(next) < 0.43) addKill(next, seededRandom(next) < blueKillChance ? 'blue' : 'red')

    if (next.dragonAvailable && minute >= 5 && seededRandom(next) < 0.34) resolveObjective(next, 'dragon')
    if (next.grubsAvailable && minute >= 8 && seededRandom(next) < 0.38) resolveObjective(next, 'grubs')
    if (next.heraldAvailable && minute >= 15 && seededRandom(next) < 0.3) resolveObjective(next, 'herald')
    if (next.baronAvailable && minute >= 20 && seededRandom(next) < 0.3) resolveObjective(next, 'baron')
    if (next.elderAvailable && seededRandom(next) < 0.32) resolveObjective(next, 'elder')

    // Lane pressure slowly converts minion advantage and team strength into structures.
    // Baron and Herald buffs materially improve siege pressure.
    const sides: Side[] = ['blue', 'red']
    const attacker: Side = seededRandom(next) < clamp(0.5 + (bluePower - redPower) * 0.008, 0.2, 0.8) ? 'blue' : 'red'
    const defender: Side = attacker === 'blue' ? 'red' : 'blue'
    const attackingTeam = next[attacker]
    const buffed = attackingTeam.baronBuffUntil > next.seconds || attackingTeam.herald
    const siegeChance = clamp(0.09 + minute * 0.003 + (buffed ? 0.2 : 0) + (attackingTeam.dragons.length * 0.012), 0.08, 0.56)
    if (minute >= 8 && seededRandom(next) < siegeChance) {
      const lane = LANES[Math.floor(seededRandom(next) * LANES.length)]
      destroyStructure(next, attacker, lane)
      if (attackingTeam.herald) {
        attackingTeam.herald = false
        addEvent(next, 'objective', `${attackingTeam.name}가 협곡의 전령을 소환했습니다.`)
      }
    }
    if (buffed && minute >= 20 && seededRandom(next) < 0.1) {
      const lane = LANES[Math.floor(seededRandom(next) * LANES.length)]
      destroyStructure(next, attacker, lane)
    }

    // A nexus can only be pressured after at least one inhibitor is down.
    for (const side of sides) {
      const team = next[side]
      const hasOpenLane = LANES.some(lane => !team.inhibitorsAlive[lane])
      if (hasOpenLane && team.nexusTowersRemaining === 0 && minute >= 25 && seededRandom(next) < clamp(0.08 + (minute - 25) * 0.015, 0.08, 0.45)) {
        team.nexusHealth = clamp(team.nexusHealth - 20, 0, 100)
        addEvent(next, 'structure', `${team.name} 넥서스에 피해 · 남은 내구도 ${team.nexusHealth}%`)
      }
    }

    if (next.blue.nexusHealth <= 0 || next.red.nexusHealth <= 0) {
      next.over = true
      next.winner = next.blue.nexusHealth <= 0 ? 'red' : 'blue'
      addEvent(next, 'structure', `${next[next.winner].name} 넥서스 파괴 · 경기 종료`)
    }
  }

  // Inhibitors and nexus turrets are checked before the next push can reach the nexus.
  for (const side of ['blue', 'red'] as const) {
    const team = next[side]
    const openLanes = LANES.filter(lane => !team.inhibitorsAlive[lane]).length
    if (openLanes > 0 && team.nexusTowersRemaining > 0 && minute >= 24 && seededRandom(next) < 0.1) {
      team.nexusTowersRemaining -= 1
      addEvent(next, 'structure', `${team.name} 넥서스 포탑 파괴`)
    }
  }

  // Games are not stopped at an arbitrary 32-minute mark. The hard limit is only a
  // failsafe for pathological simulations; the winner is determined by map state.
  if (!next.over && next.seconds >= 5400) {
    const blueScore = next.blue.kills * 2 + next.blue.gold / 1000 + next.blue.dragons.length * 3 + next.blue.grubs + next.blue.herald * 2
      + (LANES.reduce((sum, lane) => sum + (3 - next.blue.towersRemaining[lane]), 0) * 2)
    const redScore = next.red.kills * 2 + next.red.gold / 1000 + next.red.dragons.length * 3 + next.red.grubs + next.red.herald * 2
      + (LANES.reduce((sum, lane) => sum + (3 - next.red.towersRemaining[lane]), 0) * 2)
    next.over = true
    next.winner = blueScore >= redScore ? 'blue' : 'red'
    addEvent(next, 'system', '장기전 안전 종료 · 오브젝트와 구조물 우위를 기준으로 승자를 결정했습니다.')
  }

  return next
}
