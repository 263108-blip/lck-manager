
import { useEffect, useMemo, useState } from 'react'
import type { Match } from './matchData'
import './MatchCenter.css'

type Role = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'

type Player = {
  name: string
  role: Role
  champions?: string[]
  status?: string
  overall?: number
}

type Fighter = {
  id: number
  name: string
  champion: string
  role: Role
  team: 'blue' | 'red'
  x: number
  y: number
  kills: number
  deaths: number
  assists: number
  gold: number
  hp: number
}

type EventItem = {
  time: string
  message: string
  type: 'kill' | 'objective' | 'info'
}

const roles: Role[] = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']

const champions = [
  '아트록스', '가렌', '갈리오', '갱플랭크', '그라가스',
  '그레이브즈', '그웬', '나르', '나미', '나서스',
  '녹턴', '니달리', '니코', '닐라', '다리우스',
  '다이애나', '라이즈', '라칸', '람머스', '럭스',
  '레넥톤', '레오나', '렐', '렝가', '루시안',
  '룰루', '르블랑', '리 신', '리븐', '리산드라',
  '마스터 이', '말파이트', '모데카이저', '모르가나',
  '문도 박사', '미스 포츈', '바루스', '바이', '베인',
  '벨베스', '브라움', '브라이어', '블라디미르',
  '블리츠크랭크', '비에고', '빅토르', '뽀삐',
  '사미라', '사이온', '사일러스', '세나', '세라핀',
  '세트', '소라카', '스몰더', '쉔', '신 짜오',
  '신드라', '신지드', '아리', '아무무', '아칼리',
  '아크샨', '아펠리오스', '애니', '애쉬', '야스오',
  '에코', '오공', '오른', '오리아나', '오로라',
  '요네', '요릭', '우디르', '워윅', '유나라',
  '이렐리아', '이블린', '이즈리얼', '일라오이',
  '자르반 4세', '자야', '자이라', '잭스', '제드',
  '제라스', '제이스', '조이', '직스', '진',
  '질리언', '징크스', '초가스', '카르마', '카밀',
  '카사딘', '카서스', '카시오페아', '카이사',
  '카직스', '카타리나', '칼리스타', '케넨',
  '케이틀린', '케일', '코그모', '코르키', '퀸',
  '크산테', '클레드', '키아나', '킨드레드',
  '타릭', '탈론', '탈리야', '탐 켄치', '트런들',
  '트리스타나', '트린다미어', '트위스티드 페이트',
  '트위치', '티모', '파이크', '판테온', '피들스틱',
  '피오라', '피즈', '헤카림', '암베사', '나피리',
  '볼리베어', '벨코즈', '자헨', '로크',
]

const defaultBlue = [
  { name: 'Zeus', role: 'TOP' as Role, champion: '제이스' },
  { name: 'Oner', role: 'JNG' as Role, champion: '리 신' },
  { name: 'Faker', role: 'MID' as Role, champion: '아리' },
  { name: 'Gumayusi', role: 'ADC' as Role, champion: '진' },
  { name: 'Keria', role: 'SUP' as Role, champion: '라칸' },
]

const defaultRed = [
  { name: '상대 탑', role: 'TOP' as Role, champion: '아트록스' },
  { name: '상대 정글', role: 'JNG' as Role, champion: '바이' },
  { name: '상대 미드', role: 'MID' as Role, champion: '아칼리' },
  { name: '상대 원딜', role: 'ADC' as Role, champion: '카이사' },
  { name: '상대 서폿', role: 'SUP' as Role, champion: '레오나' },
]

type Props = {
  match: Match
  onFinish: (matchId: number, blueScore: number, redScore: number) => void
  onExit: () => void
}

function getRoster(): Player[] {
  try {
    const data = JSON.parse(localStorage.getItem('lck-manager-roster') || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default function MatchCenter({ match, onFinish, onExit }: Props) {
  const roster = useMemo(() => getRoster(), [])
  const bluePlayers = roles.map((role, i) => {
    const player = roster.find((p: Player) => p.role === role && p.status === '주전')
      || roster.find((p: Player) => p.role === role)
    return {
      ...defaultBlue[i],
      name: player?.name || defaultBlue[i].name,
      champion: player?.champions?.[0] || defaultBlue[i].champion,
    }
  })

  const [screen, setScreen] = useState<'draft' | 'game' | 'result'>('draft')
  const [bluePicks, setBluePicks] = useState(bluePlayers.map(p => p.champion))
  const [redPicks, setRedPicks] = useState(defaultRed.map(p => p.champion))
  const [blueBans, setBlueBans] = useState<string[]>([])
  const [redBans, setRedBans] = useState<string[]>([])
  const [strategy, setStrategy] = useState('균형 잡힌 운영')

  const [fighters, setFighters] = useState<Fighter[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [seconds, setSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [followId, setFollowId] = useState(2)
  const [blueScore, setBlueScore] = useState(0)
  const [redScore, setRedScore] = useState(0)
  const [blueGold, setBlueGold] = useState(5000)
  const [redGold, setRedGold] = useState(5000)
  const [ended, setEnded] = useState(false)

  const timeText = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  const startGame = () => {
    const blue: Fighter[] = bluePlayers.map((p, i) => ({
      id: i,
      name: p.name,
      champion: bluePicks[i],
      role: p.role,
      team: 'blue',
      x: [20, 28, 35, 24, 17][i],
      y: [23, 50, 50, 77, 85][i],
      kills: 0,
      deaths: 0,
      assists: 0,
      gold: 500,
      hp: 100,
    }))

    const red: Fighter[] = defaultRed.map((p, i) => ({
      id: i + 5,
      name: p.name,
      champion: redPicks[i],
      role: p.role,
      team: 'red',
      x: [80, 72, 65, 76, 83][i],
      y: [77, 50, 50, 23, 15][i],
      kills: 0,
      deaths: 0,
      assists: 0,
      gold: 500,
      hp: 100,
    }))

    setFighters([...blue, ...red])
    setSeconds(0)
    setBlueScore(0)
    setRedScore(0)
    setBlueGold(5000)
    setRedGold(5000)
    setEvents([{ time: '0:00', message: '소환사의 협곡에 입장했습니다.', type: 'info' }])
    setEnded(false)
    setPaused(false)
    setScreen('game')
  }

  useEffect(() => {
    if (screen !== 'game' || paused || ended) return

    const timer = window.setInterval(() => {
      setSeconds(old => old + speed)
    }, 250)

    return () => window.clearInterval(timer)
  }, [screen, paused, ended, speed])

  useEffect(() => {
    if (screen !== 'game' || paused || ended || fighters.length !== 10) return

    const timer = window.setInterval(() => {
      setFighters(old => {
        const next = old.map(f => {
          const direction = f.team === 'blue' ? 1 : -1
          const wave = Math.sin((seconds + f.id * 7) / 8)
          const x = Math.max(8, Math.min(92, f.x + direction * (Math.random() - 0.43) * 2))
          const y = Math.max(8, Math.min(92, f.y + wave * 1.3))
          return { ...f, x, y, gold: f.gold + 2 }
        })
        return next
      })

      if (seconds > 0 && seconds % 18 === 0) {
        const blueWins = Math.random() > 0.48
        const team = blueWins ? 'blue' : 'red'
        const candidates = fighters.filter(f => f.team === team)
        const victimCandidates = fighters.filter(f => f.team !== team)
        const killer = candidates[Math.floor(Math.random() * candidates.length)]
        const victim = victimCandidates[Math.floor(Math.random() * victimCandidates.length)]

        if (killer && victim) {
          setFighters(old => old.map(f => {
            if (f.id === killer.id) return { ...f, kills: f.kills + 1, gold: f.gold + 300 }
            if (f.id === victim.id) return { ...f, deaths: f.deaths + 1, hp: 35 }
            return f
          }))
          if (blueWins) {
            setBlueScore(v => v + 1)
            setBlueGold(v => v + 300)
          } else {
            setRedScore(v => v + 1)
            setRedGold(v => v + 300)
          }
          const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
          setEvents(old => [{
            time,
            message: `${killer.name} (${killer.champion})이(가) ${victim.name}을(를) 처치했습니다!`,
            type: 'kill' as const,
          }, ...old].slice(0, 35))
        }
      }

      if (seconds > 0 && seconds % 90 === 0) {
        const blueWins = Math.random() > 0.5
        if (blueWins) setBlueGold(v => v + 500)
        else setRedGold(v => v + 500)
        const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
        setEvents(old => [{
          time,
          message: blueWins ? 'T1이 드래곤을 처치했습니다!' : `${match.away}가 드래곤을 처치했습니다!`,
          type: 'objective' as const,
        }, ...old].slice(0, 35))
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [screen, paused, ended, seconds, fighters, match.away])

  useEffect(() => {
    if (screen !== 'game' || seconds < 1500 || ended) return
    setEnded(true)
    setScreen('result')
  }, [seconds, screen, ended])

  const finishMatch = () => {
    const blueWon = blueScore >= redScore
    const blueSeries = blueWon ? 2 : 0
    const redSeries = blueWon ? 0 : 2
    onFinish(match.id, blueSeries, redSeries)
  }

  const toggleBan = (team: 'blue' | 'red', champion: string) => {
    const setter = team === 'blue' ? setBlueBans : setRedBans
    setter(old => old.includes(champion)
      ? old.filter(c => c !== champion)
      : old.length < 5 ? [...old, champion] : old)
  }

  const followed = fighters.find(f => f.id === followId)
  const trackedFighter = followed || fighters[2]

  return (
    <div className="match-center">
      <header className="mc-header">
        <div>
          <span className="mc-eyebrow">LCK MANAGER · MATCH CENTER</span>
          <h1>{match.home} <span>VS</span> {match.away}</h1>
          <p>{match.date} · {match.time} · BO3</p>
        </div>
        <button className="mc-exit" onClick={onExit}>나가기</button>
      </header>

      {screen === 'draft' && (
        <section className="mc-draft">
          <div className="mc-section-heading">
            <div>
              <span className="mc-eyebrow">CHAMPION SELECT</span>
              <h2>밴픽 단계</h2>
              <p>우리 팀의 챔피언과 상대 팀의 챔피언을 선택하세요.</p>
            </div>
            <span className="mc-phase">DRAFT</span>
          </div>

          <div className="mc-draft-columns">
            <div className="mc-draft-team blue">
              <h3>{match.home}</h3>
              {roles.map((role, i) => (
                <label className="mc-pick-row" key={role}>
                  <span>{role}</span>
                  <div>
                    <strong>{bluePlayers[i].name}</strong>
                    <select value={bluePicks[i]} onChange={e => setBluePicks(old => old.map((v, n) => n === i ? e.target.value : v))}>
                      {champions.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </label>
              ))}
              <h4>우리 팀 밴 ({blueBans.length}/5)</h4>
              <div className="mc-ban-list">
                {champions.slice(0, 35).map(c => (
                  <button className={blueBans.includes(c) ? 'selected' : ''} key={c} onClick={() => toggleBan('blue', c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="mc-draft-vs">VS</div>

            <div className="mc-draft-team red">
              <h3>{match.away}</h3>
              {roles.map((role, i) => (
                <label className="mc-pick-row" key={role}>
                  <span>{role}</span>
                  <div>
                    <strong>{defaultRed[i].name}</strong>
                    <select value={redPicks[i]} onChange={e => setRedPicks(old => old.map((v, n) => n === i ? e.target.value : v))}>
                      {champions.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </label>
              ))}
              <h4>상대 팀 밴 ({redBans.length}/5)</h4>
              <div className="mc-ban-list">
                {champions.slice(0, 35).map(c => (
                  <button className={redBans.includes(c) ? 'selected' : ''} key={c} onClick={() => toggleBan('red', c)}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mc-strategy">
            <label>우리 팀 전략</label>
            <select value={strategy} onChange={e => setStrategy(e.target.value)}>
              <option>균형 잡힌 운영</option>
              <option>초반 공격 중심</option>
              <option>후반 성장 중심</option>
              <option>한타 중심</option>
              <option>스플릿 푸시 중심</option>
            </select>
          </div>
          <button className="mc-start" onClick={startGame}>밴픽 완료 · 경기 시작</button>
        </section>
      )}

      {screen === 'game' && (
        <section className="mc-game">
          <div className="mc-scoreboard">
            <div className="blue-score">
              <strong>{match.home}</strong>
              <b>{blueScore}</b>
              <span>{blueGold.toLocaleString()} G</span>
            </div>
            <div className="mc-clock">
              <strong>{timeText}</strong>
              <span>LIVE MATCH</span>
            </div>
            <div className="red-score">
              <strong>{match.away}</strong>
              <b>{redScore}</b>
              <span>{redGold.toLocaleString()} G</span>
            </div>
          </div>

          <div className="mc-game-layout">
            <div className="mc-map-panel">
              <div className="mc-map-heading">
                <strong>SUMMONER'S RIFT</strong>
                <span>{strategy}</span>
              </div>
              <div className="mc-map">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grass" width="5" height="5" patternUnits="userSpaceOnUse">
                      <path d="M0 5 L5 0" stroke="#315044" strokeWidth=".25" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="#203c35" />
                  <rect width="100" height="100" fill="url(#grass)" />
                  <path d="M5 95 L95 5" stroke="#9b9b79" strokeWidth="10" opacity=".8" />
                  <path d="M5 95 L95 5" stroke="#4e6252" strokeWidth="7" />
                  <path d="M0 30 L70 100 M30 0 L100 70" stroke="#697c62" strokeWidth="3" opacity=".7" />
                  <path d="M5 95 L95 5" stroke="#c1b78d" strokeWidth=".5" strokeDasharray="2 2" />
                  <circle cx="5" cy="95" r="4" fill="#4b9ee8" />
                  <circle cx="95" cy="5" r="4" fill="#e36d7c" />
                  <circle cx="50" cy="50" r="7" fill="#314e40" stroke="#d5c78b" strokeWidth=".8" />
                  {fighters.map(f => (
                    <g key={f.id} onClick={() => setFollowId(f.id)} style={{ cursor: 'pointer' }}>
                      <circle cx={f.x} cy={f.y} r={followId === f.id ? 3.5 : 2.5} fill={f.team === 'blue' ? '#48aaff' : '#ff687a'} stroke="#fff" strokeWidth=".5" />
                      {followId === f.id && <circle cx={f.x} cy={f.y} r="5" fill="none" stroke="#fff" strokeWidth=".6" />}
                    </g>
                  ))}
                </svg>
                {trackedFighter && (
                  <div className="mc-follow-label">
                    추적 중: {trackedFighter.name} · {trackedFighter.champion}
                  </div>
                )}
              </div>
              <div className="mc-camera-list">
                {fighters.map(f => (
                  <button key={f.id} className={followId === f.id ? 'active' : ''} onClick={() => setFollowId(f.id)}>
                    <span className={f.team}>{f.team === 'blue' ? 'B' : 'R'}</span>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <aside className="mc-side-panel">
              <h3>선수 현황</h3>
              {fighters.map(f => (
                <button key={f.id} className="mc-player-line" onClick={() => setFollowId(f.id)}>
                  <span className={f.team}>{f.role}</span>
                  <span>{f.name}<small>{f.champion}</small></span>
                  <strong>{f.kills}/{f.deaths}/{f.assists}</strong>
                </button>
              ))}
              <h3>경기 로그</h3>
              <div className="mc-event-list">
                {events.map((event, i) => (
                  <div className={`mc-event ${event.type}`} key={`${event.time}-${i}`}>
                    <time>{event.time}</time>
                    <span>{event.message}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="mc-controls">
            <button onClick={() => setPaused(v => !v)}>{paused ? '▶ 재개' : 'Ⅱ 일시정지'}</button>
            <span>경기 속도</span>
            {[1, 2, 4].map(v => (
              <button className={speed === v ? 'active' : ''} key={v} onClick={() => setSpeed(v)}>{v}배속</button>
            ))}
            <span className="mc-auto-label">자동 경기 진행 중</span>
          </div>
        </section>
      )}

      {screen === 'result' && (
        <section className="mc-result">
          <span className="mc-eyebrow">MATCH RESULT</span>
          <h2>경기 종료</h2>
          <div className="mc-result-score">
            <div><span>{match.home}</span><strong>{blueScore}</strong></div>
            <b>:</b>
            <div><span>{match.away}</span><strong>{redScore}</strong></div>
          </div>
          <p className="mc-winner">
            {blueScore >= redScore ? match.home : match.away} 승리
          </p>
          <div className="mc-result-players">
            {fighters.slice().sort((a, b) => b.kills - a.kills).slice(0, 3).map(f => (
              <div key={f.id}>
                <span>{f.name}</span>
                <strong>{f.champion}</strong>
                <small>{f.kills}/{f.deaths}/{f.assists}</small>
              </div>
            ))}
          </div>
          <button className="mc-start" onClick={finishMatch}>결과 저장하고 일정으로 돌아가기</button>
        </section>
      )}
    </div>
  )
}
