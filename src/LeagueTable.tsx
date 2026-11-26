import type { Standing } from './matchData'

type Props = { standings: Standing[]; myTeam?: string }

function StandingsTable({ rows, myTeam }: { rows: Standing[]; myTeam: string }) {
  return <div className="league-table-scroll">
    <table className="league-table">
      <thead><tr><th>순위</th><th>구단</th><th>경기</th><th>승</th><th>패</th><th>승률</th><th>세트 득실</th></tr></thead>
      <tbody>{rows.map((team,index)=><tr key={team.name} className={team.name===myTeam?'my-team':''}>
        <td><strong className="league-rank">{index+1}</strong></td>
        <td><strong className="league-team-name">{team.name}</strong>{team.name===myTeam&&<span className="league-my-team">MY CLUB</span>}</td>
        <td>{team.played}</td><td className="league-wins">{team.wins}</td><td>{team.losses}</td><td>{team.winRate}%</td>
        <td className={team.setDiff>0?'league-wins':team.setDiff<0?'league-losses':''}>{team.setDiff>0?'+':''}{team.setDiff}</td>
      </tr>)}</tbody>
    </table>
  </div>
}

export default function LeagueTable({standings,myTeam='T1'}:Props) {
  const leader=standings[0]
  const completed=standings.reduce((sum,team)=>sum+team.played,0)/2
  const split=standings.some(team=>team.group)
  const legend=standings.filter(team=>team.group==='LEGEND')
  const rise=standings.filter(team=>team.group==='RISE')
  const all=standings.filter(team=>!team.group)
  return <div className="league-page">
    <header className="league-header">
      <div><span>LCK · 2026 SEASON FORMAT</span><h1>리그 순위</h1><p>{split?'R3~4 그룹 리그 · R1~2 맞대결 성적 승계':'R1~2 전체 더블 라운드 로빈'}</p></div>
      <div className="league-season"><span>SEASON</span><strong>2026</strong><small>{split?'ROUND 3–4':'ROUND 1–2'}</small></div>
    </header>
    <div className="league-summary">
      <div><span>참가 구단</span><strong>10<small>팀</small></strong></div>
      <div><span>완료된 경기</span><strong>{completed}<small>경기</small></strong></div>
      <div><span>현재 선두</span><strong>{leader?.name??'-'}</strong></div>
    </div>
    {split ? <div className="league-group-grid">
      <section className="league-table-panel">
        <div className="league-panel-heading"><div><span>UPPER GROUP</span><h2>LEGEND GROUP</h2></div><span>상위 5개 팀</span></div>
        <StandingsTable rows={legend} myTeam={myTeam}/>
      </section>
      <section className="league-table-panel">
        <div className="league-panel-heading"><div><span>LOWER GROUP</span><h2>RISE GROUP</h2></div><span>하위 5개 팀</span></div>
        <StandingsTable rows={rise} myTeam={myTeam}/>
      </section>
    </div> : <section className="league-table-panel">
      <div className="league-panel-heading"><div><span>ROUND 1–2 · REGULAR SEASON</span><h2>팀 순위표</h2></div><span>10 TEAMS</span></div>
      <StandingsTable rows={all} myTeam={myTeam}/>
    </section>}
    <p className="league-notice">※ R1~2 종료 후 상위 5개 팀은 LEGEND, 하위 5개 팀은 RISE로 분리됩니다. 두 그룹은 R1~2에서 같은 그룹에 속한 팀과의 맞대결 성적을 승계합니다.</p>
  </div>
}
