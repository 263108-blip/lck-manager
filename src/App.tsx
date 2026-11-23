import { useEffect, useState } from 'react'
import Roster from './Roster'
import './App.css'
import Schedule from './Schedule'
import LeagueTable from './LeagueTable'
import { useLeagueMatches, buildStandings } from './matchData'
import Tactics from './Tactics'

const menus = [
  '대시보드',
  '선수단',
  '전술 및 밴픽',
  '경기 일정',
  '리그 순위',
  '이적시장',
  '스카우팅',
  '구단 기록',
]

function App() {
  const [active, setActive] = useState('대시보드')
  const [roster, setRoster] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('lck-manager-roster')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const refreshRoster = () => {
      try {
        const saved = localStorage.getItem('lck-manager-roster')
        setRoster(saved ? JSON.parse(saved) : [])
      } catch {
        console.warn('선수단 데이터를 불러오지 못했습니다.')
      }
    }

    window.addEventListener('lck-roster-updated', refreshRoster)

    return () => {
      window.removeEventListener('lck-roster-updated', refreshRoster)
    }
  }, [])

  const starters = roster
    .filter(player => player.status === '주전')
    .sort((a, b) => {
      const order = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']
      return order.indexOf(a.role) - order.indexOf(b.role)
    })

  const teamPower = starters.length
    ? Math.round(
        starters.reduce((sum, player) => sum + player.overall, 0) /
          starters.length
      )
    : 0

  const matches = useLeagueMatches()
  const standings = buildStandings(matches)

  const t1Standing = standings.find(team => team.name === 'T1')
  const t1Rank = standings.findIndex(team => team.name === 'T1') + 1

  const nextMatch = matches
    .filter(
      match =>
        match.status === '예정' &&
        (match.home === 'T1' || match.away === 'T1')
    )
    .sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    )[0]

  const nextOpponent = nextMatch
    ? nextMatch.home === 'T1'
      ? nextMatch.away
      : nextMatch.home
    : null

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">L</span>
          <div>
            <h2>LCK MANAGER</h2>
            <small>ESPORTS MANAGEMENT</small>
          </div>
        </div>

        <div className="manager-label">MANAGEMENT</div>

        <nav>
          {menus.map((menu, index) => (
            <button
              key={menu}
              className={active === menu ? 'nav-item active' : 'nav-item'}
              onClick={() => setActive(menu)}
            >
              <span>
                {['▦', '♙', '⚔', '▤', '▥', '⇄', '◎', '▣'][index]}
              </span>
              {menu}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="team-mini">T1</div>
          <div>
            <strong>T1</strong>
            <small>감독 모드</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="season">2026 SEASON</span>
            <span className="date">1월 12일 · 월요일</span>
          </div>
          <div className="profile">
            <span className="online-dot" />
            MANAGER
          </div>
        </header>

        <section className="content">
          {active === '선수단' ? (
            <Roster />
          ) : active === '전술 및 밴픽' ? (
            <Tactics />
          ) : active === '경기 일정' ? (
            <Schedule />
          ) : active === '리그 순위' ? (
            <LeagueTable standings={standings} />
          ) : active === '대시보드' ? (
            <div className="fm-dashboard">
              <div className="fm-welcome">
                <div>
                  <p className="fm-eyebrow">LEAGUE OF LEGENDS · KOREA</p>
                  <h1>구단 운영 센터</h1>
                  <p>팀을 관리하고 최고의 자리에 도전하세요.</p>
                </div>

                <div className="fm-season">
                  <span>2026 SEASON</span>
                  <strong>SPRING</strong>
                  <small>정규 시즌 진행 중</small>
                </div>
              </div>

              <div className="fm-team-banner">
                <div className="fm-team-symbol">T1</div>
                <div className="fm-team-info">
                  <span>YOUR CLUB</span>
                  <h2>T1</h2>
                  <p>대한민국 · LCK</p>
                </div>
                <div className="fm-team-power">
                  <span>TEAM RATING</span>
                  <strong>{teamPower}</strong>
                  <small>WORLD CLASS</small>
                </div>
              </div>

              <div className="fm-stats">
                <div className="fm-stat-card">
                  <span>선수단</span>
                  <strong>{roster.length}<small>명</small></strong>
                  <p>등록 선수</p>
                </div>

                <div className="fm-stat-card">
                  <span>리그 순위</span>
                  <strong>{t1Rank || '-'}<small>위</small></strong>
                  <p>현재 리그 순위</p>
                </div>

                <div className="fm-stat-card">
                  <span>승률</span>
                  <strong>{t1Standing?.winRate ?? 0}<small>%</small></strong>
                  <p>
                    {t1Standing?.wins ?? 0}승 {t1Standing?.losses ?? 0}패
                  </p>
                </div>

                <div className="fm-stat-card">
                  <span>다음 경기</span>
                  <strong className="fm-date-number">
                    {nextMatch ? nextMatch.date.slice(5).replace('-', '.') : '-'}
                  </strong>
                  <p>
                    {nextOpponent ? `${nextOpponent}와 대결` : '예정된 경기 없음'}
                  </p>
                </div>
              </div>

              <div className="fm-dashboard-grid">
                <section className="fm-panel fm-roster-panel">
                  <div className="fm-panel-heading">
                    <div>
                      <span>FIRST TEAM</span>
                      <h2>주요 선수단</h2>
                    </div>
                    <button onClick={() => setActive('선수단')}>
                      선수단 관리 →
                    </button>
                  </div>

                  <div className="fm-player-list">
                    {starters.map((player, index) => (
                      <div className="fm-player-row" key={player.name}>
                        <span className="fm-player-number">
                          0{index + 1}
                        </span>

                        <div className="fm-player-avatar">
                          {player.name[0]}
                        </div>

                        <div className="fm-player-name">
                          <strong>{player.name}</strong>
                          <small>{player.role}</small>
                        </div>

                        <div className="fm-player-rating">
                          <strong>{player.overall}</strong>
                          <small>OVR</small>
                        </div>
                      </div>
                    ))}
                    {starters.length === 0 && (
                      <p>등록된 주전 선수가 없습니다.</p>
                    )}
                  </div>
                </section>

                <section className="fm-panel fm-match-panel">
                  <div className="fm-panel-heading">
                    <div>
                      <span>MATCH CENTER</span>
                      <h2>다음 경기</h2>
                    </div>
                    <span className="fm-upcoming">
                      {nextMatch ? 'UPCOMING' : 'NO MATCH'}
                    </span>
                  </div>

                  {nextMatch ? (
                    <>
                      <div className="fm-match-date">
                        {nextMatch.date} · {nextMatch.time}
                      </div>

                      <div className="fm-match-teams">
                        <div className="fm-match-team">
                          <div className="fm-match-logo t1">T1</div>
                          <strong>T1</strong>
                        </div>

                        <div className="fm-match-vs">
                          <strong>VS</strong>
                          <small>LCK</small>
                        </div>

                        <div className="fm-match-team">
                          <div className="fm-match-logo geng">
                            {nextOpponent?.slice(0, 3)}
                          </div>
                          <strong>{nextOpponent}</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p>현재 예정된 T1 경기가 없습니다.</p>
                  )}

                  <button
                    className="fm-primary-button"
                    onClick={() => setActive('경기 일정')}
                  >
                    경기 일정 확인하기
                  </button>
                </section>

                <section className="fm-panel fm-standing-panel">
                  <div className="fm-panel-heading">
                    <div>
                      <span>LEAGUE TABLE</span>
                      <h2>LCK 리그 순위</h2>
                    </div>
                    <button onClick={() => setActive('리그 순위')}>
                      전체 보기 →
                    </button>
                  </div>

                  <div className="fm-standing-header">
                    <span>순위</span>
                    <span>구단</span>
                    <span>전적</span>
                  </div>

                  {standings.slice(0, 5).map((team, index) => (
                    <div
                      className={`fm-standing-row ${index === 0 ? 'first' : ''}`}
                      key={team.name}
                    >
                      <strong>{index + 1}</strong>
                      <span>{team.name}</span>
                      <small>
                        {team.wins}승 {team.losses}패
                      </small>
                    </div>
                  ))}

                  <p className="fm-notice">
                    ※ 경기 일정에 입력한 결과를 기준으로 계산됩니다.
                  </p>
                </section>

                <section className="fm-panel fm-news-panel">
                  <div className="fm-panel-heading">
                    <div>
                      <span>CLUB NEWS</span>
                      <h2>구단 소식</h2>
                    </div>
                  </div>

                  <div className="fm-news-item">
                    <span>01.12</span>
                    <div>
                      <strong>2026 시즌 구단 운영 시작</strong>
                      <small>새로운 시즌이 시작되었습니다.</small>
                    </div>
                  </div>

                  <div className="fm-news-item">
                    <span>01.11</span>
                    <div>
                      <strong>선수단 구성 및 전술 점검</strong>
                      <small>선수들의 컨디션을 확인하세요.</small>
                    </div>
                  </div>

                  <div className="fm-news-item">
                    <span>01.10</span>
                    <div>
                      <strong>새로운 시즌 준비</strong>
                      <small>올해의 목표를 설정하세요.</small>
                    </div>
                  </div>

                  <p className="fm-notice">
                    ※ 구단 소식은 예시 데이터입니다.
                  </p>
                </section>
              </div>
            </div>
          ) : (
            <div className="fm-empty-page">
              <span>CLUB MANAGEMENT</span>
              <h1>{active}</h1>
              <p>이 메뉴는 다음 개발 단계에서 구현할 예정입니다.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
