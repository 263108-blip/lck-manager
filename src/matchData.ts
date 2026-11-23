
import { useEffect, useState } from 'react'

export type Match = {
  id: number
  date: string
  time: string
  home: string
  away: string
  status: '예정' | '종료'
  homeScore?: number
  awayScore?: number
}

const STORAGE_KEY = 'lck-manager-matches'
const UPDATE_EVENT = 'lck-matches-updated'

export const initialMatches: Match[] = [
  { id: 1, date: '2026-01-15', time: '17:00', home: 'T1', away: 'GEN.G', status: '예정' },
  { id: 2, date: '2026-01-15', time: '19:00', home: 'HLE', away: 'DK', status: '예정' },
  { id: 3, date: '2026-01-16', time: '17:00', home: 'KT', away: 'T1', status: '예정' },
  { id: 4, date: '2026-01-16', time: '19:00', home: 'GEN.G', away: 'HLE', status: '예정' },
  { id: 5, date: '2026-01-12', time: '17:00', home: 'T1', away: 'DK', status: '종료', homeScore: 2, awayScore: 0 },
  { id: 6, date: '2026-01-12', time: '19:00', home: 'GEN.G', away: 'KT', status: '종료', homeScore: 2, awayScore: 1 },
  { id: 7, date: '2026-01-13', time: '17:00', home: 'HLE', away: 'T1', status: '종료', homeScore: 1, awayScore: 2 },
]

export const teams = [
  'T1',
  'GEN.G',
  'HLE',
  'DK',
  'KT',
  'DRX',
  'BNK FEARX',
  'NS',
  'BRO',
  'KDF',
]

export function loadMatches(): Match[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as Match[] : initialMatches
  } catch {
    return initialMatches
  }
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function useLeagueMatches() {
  const [matches, setMatches] = useState<Match[]>(loadMatches)

  useEffect(() => {
    const refresh = () => setMatches(loadMatches())

    window.addEventListener(UPDATE_EVENT, refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return matches
}

export type Standing = {
  name: string
  played: number
  wins: number
  losses: number
  setWins: number
  setLosses: number
  setDiff: number
  winRate: number
}

export function buildStandings(matches: Match[]): Standing[] {
  const table: Record<string, Standing> = {}

  teams.forEach(name => {
    table[name] = {
      name,
      played: 0,
      wins: 0,
      losses: 0,
      setWins: 0,
      setLosses: 0,
      setDiff: 0,
      winRate: 0,
    }
  })

  matches.forEach(match => {
    if (
      match.status !== '종료' ||
      match.homeScore === undefined ||
      match.awayScore === undefined
    ) return

    const home = table[match.home]
    const away = table[match.away]

    if (!home || !away) return

    home.played++
    away.played++

    home.setWins += match.homeScore
    home.setLosses += match.awayScore
    away.setWins += match.awayScore
    away.setLosses += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.wins++
      away.losses++
    } else if (match.awayScore > match.homeScore) {
      away.wins++
      home.losses++
    }
  })

  const result = Object.values(table).map(team => ({
    ...team,
    setDiff: team.setWins - team.setLosses,
    winRate: team.played === 0
      ? 0
      : Math.round((team.wins / team.played) * 100),
  }))

  return result.sort((a, b) =>
    b.wins - a.wins ||
    b.setDiff - a.setDiff ||
    b.setWins - a.setWins ||
    a.name.localeCompare(b.name)
  )
}
