
import type { Standing } from './matchData'

type Props = {\n  standings: Standing[]\n  myTeam?: string\n}

function LeagueTable({ standings, myTeam = 'T1' }: Props) {
  return (
    <div className="league-page">
      <div className="league-header">
        <div>
          <span>LCK · LEAGUE TABLE</span>
          <h1>리그 순위</h1>
          <p>경기 결과에 따라 자동으로 갱신되는 2026 시즌 순위입니다.</p>
        </div>
        <div className="league-season">
          <span>SEASON</span>
          <strong>2026</strong>
          <small>SPRING SPLIT</small>
        </div>
      </div>

      <div className="league-summary">
        <div>
          <span>참가 구단</span>
          <strong>{standings.length}<small>팀</small></strong>
        </div>
        <div>
          <span>경기 진행 팀</span>
          <strong>{standings.filter(team => team.played > 0).length}<small>팀</small></strong>
        </div>
        <div>
          <span>선두 구단</span>
          <strong>{standings[0]?.name ?? '-'}</strong>
        </div>
      </div>

      <section className="league-table-panel">
        <div className="league-panel-heading">
          <div>
            <span>OFFICIAL STANDINGS</span>
            <h2>팀 순위표</h2>
          </div>
          <span>2026 SPRING</span>
        </div>

        <div className="league-table-scroll">
          <table className="league-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>구단</th>
                <th>경기</th>
                <th>승</th>
                <th>패</th>
                <th>승률</th>
                <th>세트 득실</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.name} className={team.name === myTeam ? 'my-team' : ''}>
                  <td><strong className="league-rank">{index + 1}</strong></td>
                  <td>
                    <strong className="league-team-name">{team.name}</strong>
                    {team.name === myTeam && <span className="league-my-team">MY CLUB</span>}
                  </td>
                  <td>{team.played}</td>
                  <td className="league-wins">{team.wins}</td>
                  <td>{team.losses}</td>
                  <td>{team.winRate}%</td>
                  <td className={team.setDiff > 0 ? 'league-wins' : team.setDiff < 0 ? 'league-losses' : ''}>
                    {team.setDiff > 0 ? '+' : ''}{team.setDiff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="league-notice">
          ※ 현재 팀과 경기 기록은 게임 테스트용 예시 데이터입니다.
        </p>
        <p className="league-notice">
          ※ 승수가 같으면 세트 득실, 세트 승리 수 순서로 정렬합니다.
        </p>
      </section>
    </div>
  )
}

export default LeagueTable
