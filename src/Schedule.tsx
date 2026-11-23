
import { useEffect, useState } from 'react'
import { useLeagueMatches, saveMatches, type Match } from './matchData'

const filters = ['전체', '예정', '종료']

type ScheduleProps = { onStartMatch?: (match: Match) => void; teamName?: string }

function Schedule({ onStartMatch, teamName = 'T1' }: ScheduleProps) {
  const matches = useLeagueMatches()
  const [filter, setFilter] = useState('전체')
  const [selectedDate, setSelectedDate] = useState('전체')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [homeScore, setHomeScore] = useState('2')
  const [awayScore, setAwayScore] = useState('0')
  const [message, setMessage] = useState('')

  const selectedMatch = matches.find(match => match.id === selectedId) ?? null

  const dates = [
    '전체',
    ...Array.from(new Set(matches.map(match => match.date))).sort(),
  ]

  const filteredMatches = matches.filter(match => {
    const filterMatch = filter === '전체' || match.status === filter
    const dateMatch = selectedDate === '전체' || match.date === selectedDate
    return filterMatch && dateMatch
  })

  const upcomingCount = matches.filter(match => match.status === '예정').length
  const finishedCount = matches.filter(match => match.status === '종료').length

  useEffect(() => {
    if (selectedMatch) {
      setHomeScore(String(selectedMatch.homeScore ?? 2))
      setAwayScore(String(selectedMatch.awayScore ?? 0))
      setMessage('')
    }
  }, [selectedId])

  function formatDate(date: string) {
    const [year, month, day] = date.split('-')
    return `${year}년 ${Number(month)}월 ${Number(day)}일`
  }

  function registerResult() {
    if (!selectedMatch) return

    const home = Number(homeScore)
    const away = Number(awayScore)

    if (
      homeScore.trim() === '' ||
      awayScore.trim() === '' ||
      !Number.isInteger(home) ||
      !Number.isInteger(away) ||
      home < 0 ||
      away < 0 ||
      home > 2 ||
      away > 2 ||
      home === away
    ) {
      setMessage('BO3 경기 결과는 2:0, 2:1, 1:2, 0:2 중 하나로 입력해 주세요.')
      return
    }

    if (home !== 2 && away !== 2) {
      setMessage('BO3 경기는 한 팀이 먼저 2세트를 이겨야 종료됩니다.')
      return
    }

    const updated = matches.map(match =>
      match.id === selectedMatch.id
        ? {
            ...match,
            status: '종료' as const,
            homeScore: home,
            awayScore: away,
          }
        : match
    )

    saveMatches(updated)
    setMessage('경기 결과가 저장되었습니다. 리그 순위도 갱신됐어요!')
  }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <div>
          <span className="schedule-eyebrow">MATCH CENTER</span>
          <h1>경기 일정</h1>
          <p>경기 결과를 입력하고 리그 순위에 반영하세요.</p>
        </div>
        <div className="schedule-season">
          <span>SEASON</span>
          <strong>2026</strong>
          <small>SPRING SPLIT</small>
        </div>
      </div>

      <div className="schedule-summary">
        <div className="schedule-summary-card">
          <span>전체 경기</span>
          <strong>{matches.length}<small>경기</small></strong>
        </div>
        <div className="schedule-summary-card">
          <span>예정 경기</span>
          <strong>{upcomingCount}<small>경기</small></strong>
        </div>
        <div className="schedule-summary-card">
          <span>종료 경기</span>
          <strong>{finishedCount}<small>경기</small></strong>
        </div>
      </div>

      <div className="schedule-content">
        <section className="schedule-list-panel">
          <div className="schedule-panel-heading">
            <div>
              <span>FIXTURES & RESULTS</span>
              <h2>경기 목록</h2>
            </div>
          </div>

          <div className="schedule-filters">
            {filters.map(item => (
              <button
                key={item}
                className={filter === item ? 'selected' : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="schedule-date-filter">
            <label htmlFor="schedule-date">경기 날짜</label>
            <select
              id="schedule-date"
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value)}
            >
              {dates.map(date => (
                <option key={date} value={date}>
                  {date === '전체' ? '전체 날짜' : formatDate(date)}
                </option>
              ))}
            </select>
          </div>

          <div className="schedule-matches">
            {filteredMatches.length === 0 ? (
              <div className="schedule-empty">해당 조건의 경기가 없습니다.</div>
            ) : (
              filteredMatches.map(match => (
                <button
                  className={`schedule-match ${selectedId === match.id ? 'active' : ''}`}
                  key={match.id}
                  onClick={() => setSelectedId(match.id)}
                >
                  <div className="schedule-match-date">
                    <strong>{match.date.slice(5).replace('-', '.')}</strong>
                    <span>{match.time}</span>
                  </div>
                  <div className="schedule-match-teams">
                    <strong>{match.home}</strong>
                    <span className="schedule-match-score">
                      {match.status === '종료'
                        ? `${match.homeScore} : ${match.awayScore}`
                        : 'VS'}
                    </span>
                    <strong>{match.away}</strong>
                  </div>
                  <span className={`schedule-status ${match.status === '예정' ? 'upcoming' : 'finished'}`}>
                    {match.status}
                  </span>
                </button>
              ))
            )}
          </div>

          <p className="schedule-notice">
            ※ 현재 경기는 게임 테스트를 위한 예시 데이터입니다.
          </p>
        </section>

        <section className="schedule-detail-panel">
          <div className="schedule-panel-heading">
            <div>
              <span>MATCH INFORMATION</span>
              <h2>경기 상세 정보</h2>
            </div>
          </div>

          {selectedMatch ? (
            <div className="schedule-detail">
              <span className="schedule-detail-date">
                {formatDate(selectedMatch.date)} · {selectedMatch.time}
              </span>

              <div className="schedule-detail-teams">
                <div>
                  <div className="schedule-detail-logo">{selectedMatch.home}</div>
                  <strong>{selectedMatch.home}</strong>
                </div>
                <span className="schedule-detail-vs">
                  {selectedMatch.status === '종료'
                    ? `${selectedMatch.homeScore} : ${selectedMatch.awayScore}`
                    : 'VS'}
                </span>
                <div>
                  <div className="schedule-detail-logo opponent">{selectedMatch.away}</div>
                  <strong>{selectedMatch.away}</strong>
                </div>
              </div>

              <div className="schedule-detail-info">
                <div><span>대회</span><strong>LCK</strong></div>
                <div><span>경기 상태</span><strong>{selectedMatch.status}</strong></div>
                <div><span>경기 방식</span><strong>BO3</strong></div>
              </div>

              {selectedMatch.status === '예정' && (selectedMatch.home === teamName || selectedMatch.away === teamName) && (
                <button
                  className="schedule-start-match"
                  onClick={() => onStartMatch?.(selectedMatch)}
                >
                  경기 준비 및 시작하기
                </button>
              )}

              <div className="schedule-result-editor">
                <h3>경기 결과 입력</h3>
                <p>각 팀이 승리한 세트 수를 입력하세요.</p>
                <div className="schedule-score-inputs">
                  <label>
                    {selectedMatch.home}
                    <input
                      type="number"
                      min="0"
                      max="2"
                      value={homeScore}
                      onChange={event => setHomeScore(event.target.value)}
                    />
                  </label>
                  <span>:</span>
                  <label>
                    {selectedMatch.away}
                    <input
                      type="number"
                      min="0"
                      max="2"
                      value={awayScore}
                      onChange={event => setAwayScore(event.target.value)}
                    />
                  </label>
                </div>
                <button className="schedule-save-result" onClick={registerResult}>
                  {selectedMatch.status === '종료' ? '결과 수정하기' : '경기 결과 등록'}
                </button>
                {message && <p className="schedule-result-message">{message}</p>}
              </div>
            </div>
          ) : (
            <div className="schedule-detail-empty">
              <span>VS</span>
              <strong>경기를 선택하세요</strong>
              <p>왼쪽 경기 목록에서 경기를 선택하면 결과를 입력하거나 수정할 수 있습니다.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Schedule
