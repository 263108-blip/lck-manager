import { useEffect, useMemo, useState } from 'react'
import Roster from './Roster'
import './App.css'
import Schedule from './Schedule'
import LeagueTable from './LeagueTable'
import { useLeagueMatches, buildStandings, saveMatches, type Match } from './matchData'
import Tactics from './Tactics'
import MatchCenter from './MatchCenter'
import { applyMatchResult, ClubOffice, ClubSelection, clubs, type Club } from './ClubManager'

const menus = ['대시보드','선수단','전술 및 밴픽','경기 일정','리그 순위','이적시장','스카우팅','코칭 스태프','훈련','재정 및 스폰서','구단 기록']
const roleOrder = ['TOP','JNG','MID','ADC','SUP']
const starterNames: Record<string,string[]> = {
  'T1':['Zeus','Oner','Faker','Gumayusi','Keria'],
  'GEN.G':['Kiin','Canyon','Chovy','Ruler','Duro'],
  'HLE':['Zeus','Peanut','Zeka','Viper','Delight'],
  'DK':['Siwoo','Lucid','ShowMaker','Aiming','BeryL'],
  'KT':['PerfecT','Cuzz','Bdd','Deokdam','Peter'],
  'DRX':['Rich','Sponge','Ucal','Teddy','Andil'],
  'BNK FEARX':['Clear','Raptor','VicLa','Diable','Kellin'],
  'NS':['Kingen','Sylvie','Calix','Jiwoo','Lehends'],
  'BRO':['Morgan','Gideon','Clozer','Hena','Pollu'],
  'KDF':['DuDu','YoungJae','BuLLDoG','Taeyoon','Andil'],
}
function makeRoster(club: Club) {
  const names = starterNames[club.short] || ['TOP 유망주','JNG 유망주','MID 유망주','ADC 유망주','SUP 유망주']
  return roleOrder.map((role,i) => {
    const value = Math.max(68,club.strength - (i===2?0:i%2===0?2:4))
    return {name:names[i],role,team:club.name,age:20+i,overall:value,lane:value,teamfight:value,macro:value,mechanics:value,champions:['미등록'],status:'주전'}
  })
}
function readClub(): Club | null {
  try { const raw=localStorage.getItem('lck-manager-selected-club'); if(!raw)return null; const saved=JSON.parse(raw); return clubs.find(c=>c.short===saved.short)||null } catch { return null }
}

function App() {
  const [club,setClub] = useState<Club | null>(readClub)
  const [active,setActive] = useState('대시보드')
  const [activeMatch,setActiveMatch] = useState<Match | null>(null)
  const [day,setDay] = useState(() => Number(localStorage.getItem('lck-manager-day')||0))
  const [roster,setRoster] = useState<any[]>([])
  const matches = useLeagueMatches()
  const standings = buildStandings(matches)
  useEffect(() => {
    const refresh = () => { try { setRoster(JSON.parse(localStorage.getItem('lck-manager-roster')||'[]')) } catch { setRoster([]) } }
    refresh()
    window.addEventListener('lck-roster-updated',refresh)
    window.addEventListener('storage',refresh)
    return () => { window.removeEventListener('lck-roster-updated',refresh); window.removeEventListener('storage',refresh) }
  },[club,active])
  const starters = useMemo(() => roster.filter(p=>p.status==='주전').sort((a,b)=>roleOrder.indexOf(a.role)-roleOrder.indexOf(b.role)),[roster])
  const teamPower = starters.length ? Math.round(starters.reduce((sum,p)=>sum+(p.overall||70),0)/starters.length) : club?.strength || 0
  const myStanding = standings.find(t=>t.name===club?.short)
  const myRank = standings.findIndex(t=>t.name===club?.short)+1
  const nextMatch = matches.filter(m=>m.status==='예정'&&(m.home===club?.short||m.away===club?.short)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]
  const opponent = nextMatch ? (nextMatch.home===club?.short?nextMatch.away:nextMatch.home) : null
  const displayDate = new Date(2026,0,12+day).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})
  function selectClub(selected: Club) {
    const current = localStorage.getItem('lck-manager-roster')
    let currentTeam = ''
    try {
      const parsed = JSON.parse(current || '[]')
      currentTeam = parsed[0]?.team || ''
      const previousClub = clubs.find(item => item.name === currentTeam)
      if (previousClub && current) {
        localStorage.setItem('lck-manager-roster-' + previousClub.short, current)
      }
    } catch {
      currentTeam = ''
    }
    const savedForClub = localStorage.getItem('lck-manager-roster-' + selected.short)
    const nextRoster = savedForClub || (currentTeam === selected.name && current ? current : JSON.stringify(makeRoster(selected)))
    localStorage.setItem('lck-manager-roster', nextRoster)
    localStorage.setItem('lck-manager-selected-club', JSON.stringify(selected))
    setClub(selected)
    setActive('대시보드')
    window.dispatchEvent(new Event('lck-roster-updated'))
  }
  function advanceDay() {
    const next=day+1; setDay(next); localStorage.setItem('lck-manager-day',String(next))
  }
  if (!club) return <ClubSelection onSelect={selectClub}/>
  return <div className="app">
    <aside className="sidebar">
      <div className="logo"><span className="logo-icon">L</span><div><h2>LCK MANAGER</h2><small>ESPORTS MANAGEMENT</small></div></div>
      <div className="manager-label">MANAGEMENT</div>
      <nav>{menus.map((menu,index)=><button key={menu} className={active===menu?'nav-item active':'nav-item'} onClick={()=>{setActive(menu);setActiveMatch(null)}}><span>{['▦','♙','⚔','▤','▥','⇄','◎','♟','◷','₩','▣'][index]}</span>{menu}</button>)}</nav>
      <div className="sidebar-bottom"><div className="team-mini" style={{background:club.color}}>{club.short.slice(0,3)}</div><div><strong>{club.name}</strong><small>감독 커리어 · 2026</small></div></div>
      <button className="change-club" onClick={()=>{if(confirm('현재 커리어를 저장한 상태로 구단 선택 화면으로 돌아갈까요?')){setClub(null);setActive('대시보드')}}}>구단 변경</button>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="season">2026 SEASON</span><span className="date">{displayDate}</span></div><div className="topbar-actions"><span className="profile"><span className="online-dot"/>MANAGER</span><button onClick={advanceDay}>하루 진행 →</button></div></header>
      <section className="content">
        {activeMatch ? <MatchCenter match={activeMatch} myTeam={club.short} onExit={()=>setActiveMatch(null)} onFinish={(homeScore,awayScore)=>{const updated=matches.map(m=>m.id===activeMatch.id?{...m,status:'종료' as const,homeScore,awayScore}:m);saveMatches(updated);const ourScore=activeMatch.home===club.short?homeScore:awayScore;const theirScore=activeMatch.home===club.short?awayScore:homeScore;const opponent=activeMatch.home===club.short?activeMatch.away:activeMatch.home;applyMatchResult(club,ourScore>theirScore,opponent);setActiveMatch(null);setActive('경기 일정')}}/>
        : active==='선수단' ? <Roster teamName={club.name}/>
        : active==='전술 및 밴픽' ? <Tactics teamName={club.name}/>
        : active==='경기 일정' ? <Schedule teamName={club.short} onStartMatch={m=>setActiveMatch(m)}/>
        : active==='리그 순위' ? <LeagueTable standings={standings} myTeam={club.short}/>
        : ['이적시장','스카우팅','코칭 스태프','훈련','재정 및 스폰서','구단 기록'].includes(active) ? <ClubOffice club={club} page={active} onChangePage={setActive}/>
        : <div className="fm-dashboard">
          <div className="fm-welcome"><div><p className="fm-eyebrow">LEAGUE OF LEGENDS · KOREA</p><h1>구단 운영 센터</h1><p>{club.name}의 2026 시즌을 지휘하세요.</p></div><div className="fm-season"><span>2026 SEASON</span><strong>SPRING</strong><small>시즌 {day+1}일차</small></div></div>
          <div className="fm-team-banner"><div className="fm-team-symbol" style={{background:club.color}}>{club.short}</div><div className="fm-team-info"><span>YOUR CLUB</span><h2>{club.name}</h2><p>대한민국 · LCK</p></div><div className="fm-team-power"><span>TEAM RATING</span><strong>{teamPower}</strong><small>OVERALL POWER</small></div></div>
          <div className="fm-stats">
            <div className="fm-stat-card"><span>선수단</span><strong>{roster.length}<small>명</small></strong><p>등록 선수</p></div>
            <div className="fm-stat-card"><span>리그 순위</span><strong>{myRank||'-'}<small>위</small></strong><p>현재 리그 순위</p></div>
            <div className="fm-stat-card"><span>승률</span><strong>{myStanding?.winRate??0}<small>%</small></strong><p>{myStanding?.wins??0}승 {myStanding?.losses??0}패</p></div>
            <div className="fm-stat-card"><span>다음 경기</span><strong className="fm-date-number">{nextMatch?nextMatch.date.slice(5).replace('-','.'): '-'}</strong><p>{opponent?opponent+'와 대결':'예정된 경기 없음'}</p></div>
          </div>
          <div className="fm-dashboard-grid">
            <section className="fm-panel"><div className="fm-panel-heading"><div><span>FIRST TEAM</span><h2>주요 선수단</h2></div><button onClick={()=>setActive('선수단')}>선수단 관리 →</button></div>{starters.map((p,i)=><div className="fm-player-row" key={p.name}><span className="fm-player-number">0{i+1}</span><div className="fm-player-avatar">{p.name[0]}</div><div className="fm-player-name"><strong>{p.name}</strong><small>{p.role}</small></div><div className="fm-player-rating"><strong>{p.overall}</strong><small>OVR</small></div></div>)}</section>
            <section className="fm-panel"><div className="fm-panel-heading"><div><span>MATCH CENTER</span><h2>다음 경기</h2></div><span className="fm-upcoming">{nextMatch?'UPCOMING':'NO MATCH'}</span></div>{nextMatch?<><div className="fm-match-date">{nextMatch.date} · {nextMatch.time}</div><div className="fm-match-teams"><div className="fm-match-team"><div className="fm-match-logo" style={{background:club.color}}>{club.short}</div><strong>{club.short}</strong></div><div className="fm-match-vs"><strong>VS</strong><small>LCK</small></div><div className="fm-match-team"><div className="fm-match-logo geng">{opponent}</div><strong>{opponent}</strong></div></div></>:<p>예정된 경기가 없습니다.</p>}<button className="fm-primary-button" onClick={()=>setActive('경기 일정')}>경기 일정 확인하기</button></section>
            <section className="fm-panel"><div className="fm-panel-heading"><div><span>LEAGUE TABLE</span><h2>LCK 리그 순위</h2></div><button onClick={()=>setActive('리그 순위')}>전체 보기 →</button></div><div className="fm-standing-header"><span>순위</span><span>구단</span><span>전적</span></div>{standings.slice(0,5).map((team,index)=><div className="fm-standing-row" key={team.name}><strong>{index+1}</strong><span>{team.name}</span><small>{team.wins}승 {team.losses}패</small></div>)}</section>
            <section className="fm-panel"><div className="fm-panel-heading"><div><span>MANAGER SHORTCUTS</span><h2>구단 운영 바로가기</h2></div></div><div className="dashboard-shortcuts">{['이적시장','스카우팅','코칭 스태프','훈련','재정 및 스폰서','구단 기록'].map((item,i)=><button key={item} onClick={()=>setActive(item)}><span>{['⇄','◎','♟','◷','₩','▣'][i]}</span><strong>{item}</strong><small>운영 메뉴 열기 →</small></button>)}</div></section>
          </div>
        </div>}
      </section>
    </main>
  </div>
}
export default App
