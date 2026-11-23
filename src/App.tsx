import { useEffect, useMemo, useState } from 'react'
import Roster from './Roster'
import './App.css'
import Schedule from './Schedule'
import LeagueTable from './LeagueTable'
import { useLeagueMatches, buildStandings, saveMatches, type Match } from './matchData'
import MatchCenter from './MatchCenter'
import { advanceCareerWeek, applyMatchResult, ClubOffice, ClubSelection, clubs, readClubRoster, seedRosterForClub, type Club } from './ClubManager'

const menus = ['대시보드','선수단','경기 일정','리그 순위','이적시장','스카우팅','코칭 스태프','훈련','선수 면담','기자회견','유망주 육성','재정 및 스폰서','구단 기록']
function readClub(): Club | null {
  try { const raw=localStorage.getItem('lck-manager-selected-club'); if(!raw)return null; const saved=JSON.parse(raw); return clubs.find(c=>c.short===saved.short)||null } catch { return null }
}


function readSaveSlot(slot:number) {
  try { return JSON.parse(localStorage.getItem('lck-save-slot-'+slot)||'null') } catch { return null }
}
function createSnapshot() {
  const values:Record<string,string>={}
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)
    if(key && key !== 'lck-manager-autosave' && (key.startsWith('lck-manager-') || key.startsWith('lck-career-'))) {
      const value=localStorage.getItem(key)
      if(value!==null) values[key]=value
    }
  }
  return {version:1,savedAt:new Date().toISOString(),values}
}
function saveSnapshot(slot:number) {
  localStorage.setItem('lck-save-slot-'+slot,JSON.stringify(createSnapshot()))
}
function restoreSnapshot(slot:number) {
  const snapshot=readSaveSlot(slot)
  if(!snapshot?.values) return false
  const keys:string[]=[]
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)
    if(key && (key.startsWith('lck-manager-') || key.startsWith('lck-career-'))) keys.push(key)
  }
  keys.forEach(key=>localStorage.removeItem(key))
  Object.entries(snapshot.values as Record<string,string>).forEach(([key,value])=>localStorage.setItem(key,value))
  window.dispatchEvent(new Event('lck-matches-updated'))
  window.dispatchEvent(new Event('lck-roster-updated'))
  window.dispatchEvent(new Event('lck-career-updated'))
  return true
}

function App() {
  const [club,setClub] = useState<Club | null>(readClub)
  const [showLobby,setShowLobby] = useState(true)
  const [saveMessage,setSaveMessage] = useState('')
  const [active,setActive] = useState('대시보드')
  const [activeMatch,setActiveMatch] = useState<Match | null>(null)
  const [day,setDay] = useState(() => Number(localStorage.getItem('lck-manager-day')||0))
  const [roster,setRoster] = useState<any[]>([])
  const matches = useLeagueMatches()
  const standings = buildStandings(matches)
  useEffect(() => {
    if (!club) return
    if (localStorage.getItem('lck-manager-roster-version') !== '2027-v3') {
      try {
        const oldHle=JSON.parse(localStorage.getItem('lck-manager-roster-HLE')||'[]')
        if(oldHle.length===3 && oldHle.some((player:any)=>player.name==='Delight')) {
          const hle=clubs.find(team=>team.short==='HLE')
          if(hle) localStorage.setItem('lck-manager-roster-HLE',JSON.stringify(seedRosterForClub(hle)))
        }
      } catch {}
      localStorage.setItem('lck-manager-roster-version', '2027-v3')
    }
    const key = 'lck-manager-roster-' + club.short
    if (!localStorage.getItem(key)) {
      const seeded = seedRosterForClub(club)
      localStorage.setItem(key, JSON.stringify(seeded))
    }
    const refresh = () => {
      try {
        const raw = localStorage.getItem(key) || JSON.stringify(seedRosterForClub(club))
        localStorage.setItem('lck-manager-roster', raw)
        setRoster(JSON.parse(raw))
      } catch { setRoster([]) }
    }
    refresh()
    window.addEventListener('lck-roster-updated',refresh)
    window.addEventListener('storage',refresh)
    return () => { window.removeEventListener('lck-roster-updated',refresh); window.removeEventListener('storage',refresh) }
  },[club,active])
  useEffect(() => {
    if(!club || showLobby) return
    localStorage.setItem('lck-manager-autosave',JSON.stringify(createSnapshot()))
  },[club,showLobby,day,roster,matches])
  function quickSave() {
    saveSnapshot(1)
    setSaveMessage('슬롯 1에 저장 완료')
  }
  function loadSlot(slot:number) {
    if(!restoreSnapshot(slot)) return
    setClub(readClub())
    setDay(Number(localStorage.getItem('lck-manager-day')||0))
    setActive('대시보드')
    setActiveMatch(null)
    setShowLobby(false)
  }
  const starters = useMemo(() => roster.filter(p=>p.status==='주전'),[roster])
  const teamPower = club ? Math.round((starters.reduce((sum,p)=>sum+(p.overall||70),0)+(5-starters.length)*58)/5) : 0
  const myStanding = standings.find(t=>t.name===club?.short)
  const myRank = standings.findIndex(t=>t.name===club?.short)+1
  const nextMatch = matches.filter(m=>m.status==='예정'&&(m.home===club?.short||m.away===club?.short)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]
  const opponent = nextMatch ? (nextMatch.home===club?.short?nextMatch.away:nextMatch.home) : null
  const displayDate = new Date(2026,10,23+day).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})
  function selectClub(selected: Club) {
    const nextRoster = readClubRoster(selected.short)
    localStorage.setItem('lck-manager-roster-' + selected.short, JSON.stringify(nextRoster))
    localStorage.setItem('lck-manager-roster', JSON.stringify(nextRoster))
    localStorage.setItem('lck-manager-selected-club', JSON.stringify(selected))
    localStorage.setItem('lck-manager-roster-version', '2027-v2')
    setClub(selected)
    setActive('대시보드')
    window.dispatchEvent(new Event('lck-roster-updated'))
  }
  function advanceDay() {
    const next=day+7
    setDay(next)
    localStorage.setItem('lck-manager-day',String(next))
    if (club) {
      advanceCareerWeek(club)
      const calendarDate=new Date(2026,10,23+next)
      const currentDate=[calendarDate.getFullYear(),String(calendarDate.getMonth()+1).padStart(2,'0'),String(calendarDate.getDate()).padStart(2,'0')].join('-')
      const teamPowerFor=(short:string)=>{
        const lineup=readClubRoster(short).filter(player=>player.status==='주전')
        return (lineup.reduce((sum,player)=>sum+player.overall,0)+(5-lineup.length)*58)/5
      }
      const progressed=matches.map(match=>{
        if(match.status!=='예정'||match.date>currentDate||match.home===club.short||match.away===club.short) return match
        const difference=teamPowerFor(match.home)-teamPowerFor(match.away)
        const homeWin=Math.random()<Math.max(.18,Math.min(.82,.5+difference*.018))
        const close=Math.random()<.48
        return {...match,status:'종료' as const,homeScore:homeWin?2:(close?1:0),awayScore:homeWin?(close?1:0):2}
      })
      saveMatches(progressed)
    }
  }
  if (showLobby) return <div className="lobby-screen">
    <div className="lobby-top"><div className="lobby-brand"><b>LCK</b><span>MANAGER 2027</span></div><span className="lobby-build">CAREER MODE · KOREA</span></div>
    <div className="lobby-hero"><div className="lobby-kicker">THE NEXT ERA STARTS HERE</div><h1>당신의 선택으로<br/><em>LCK의 역사가 바뀝니다.</em></h1><p>구단을 운영하고, 선수단을 구성하고, 무대 위에서 승리를 만들어 보세요.</p>
      <div className="lobby-actions"><button className="lobby-primary" onClick={()=>{if(club){setShowLobby(false)}else{setShowLobby(false)}}}>{club?'커리어 이어하기':'새 커리어 시작'} <span>→</span></button><button className="lobby-secondary" onClick={()=>{setClub(null);setShowLobby(false)}}>새 게임</button></div>
    </div>
    <div className="lobby-save-area"><div className="lobby-section-title"><div><span>CAREER DATA</span><h2>저장 슬롯</h2></div><small>수동 저장 · 불러오기</small></div>
      <div className="lobby-slots">{[1,2,3].map(slot=>{const saved=readSaveSlot(slot);const savedClub=saved?.values?.['lck-manager-selected-club'];let savedName='빈 슬롯';try{savedName=savedClub?JSON.parse(savedClub).name:'빈 슬롯'}catch{}return <div className="lobby-slot" key={slot}><div className="lobby-slot-head"><b>SLOT 0{slot}</b><span className={saved?'slot-used':'slot-empty'}>{saved?'SAVED':'EMPTY'}</span></div><strong>{savedName}</strong><small>{saved?.savedAt?new Date(saved.savedAt).toLocaleString('ko-KR'):'저장된 커리어가 없습니다.'}</small><div className="lobby-slot-actions"><button disabled={!saved} onClick={()=>loadSlot(slot)}>불러오기</button><button className="slot-save-button" disabled={!club} onClick={()=>{saveSnapshot(slot);setSaveMessage('슬롯 '+slot+' 저장 완료')}}>현재 커리어 저장</button></div></div>})}</div>
      {saveMessage && <div className="lobby-save-notice">{saveMessage}</div>}<div className="lobby-footnote">자동 저장은 현재 커리어에 적용됩니다. 수동 저장은 슬롯 1~3에 별도로 보관됩니다.</div>
    </div>
  </div>
  if (!club) return <div className="selection-shell"><button className="return-lobby" onClick={()=>setShowLobby(true)}>← 로비로 돌아가기</button><ClubSelection onSelect={selectClub}/></div>
  return <div className="app">
    <aside className="sidebar">
      <div className="logo"><span className="logo-icon">L</span><div><h2>LCK MANAGER</h2><small>ESPORTS MANAGEMENT</small></div></div>
      <div className="manager-label">MANAGEMENT</div>
      <nav>{menus.map((menu,index)=><button key={menu} className={active===menu?'nav-item active':'nav-item'} onClick={()=>{setActive(menu);setActiveMatch(null)}}><span>{['▦','♙','▤','▥','⇄','◎','♟','◷','☏','▤','☆','₩','▣'][index]}</span>{menu}</button>)}</nav>
      <div className="sidebar-bottom"><div className="team-mini" style={{background:club.color}}>{club.short.slice(0,3)}</div><div><strong>{club.name}</strong><small>감독 커리어 · 2027</small></div></div>
      <button className="change-club" onClick={()=>{quickSave();setClub(null);setShowLobby(false);setActive('대시보드')}}>구단 변경</button>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="season">2027 PRESEASON</span><span className="date">{displayDate}</span></div><div className="topbar-actions"><span className="profile"><span className="online-dot"/>MANAGER</span><button className="topbar-save" onClick={quickSave}>저장</button><button className="topbar-lobby" onClick={()=>setShowLobby(true)}>로비</button><button onClick={advanceDay}>1주 진행 →</button></div></header>
      <section className="content">{saveMessage && <div className="save-toast">{saveMessage}</div>}
        {activeMatch ? <MatchCenter match={activeMatch} myTeam={club.short} onExit={()=>setActiveMatch(null)} onFinish={(homeScore,awayScore)=>{const updated=matches.map(m=>m.id===activeMatch.id?{...m,status:'종료' as const,homeScore,awayScore}:m);saveMatches(updated);const ourScore=activeMatch.home===club.short?homeScore:awayScore;const theirScore=activeMatch.home===club.short?awayScore:homeScore;const opponent=activeMatch.home===club.short?activeMatch.away:activeMatch.home;applyMatchResult(club,ourScore>theirScore,opponent);setActiveMatch(null);setActive('경기 일정')}}/>
        : active==='선수단' ? <Roster key={club.short} teamName={club.name} teamShort={club.short} onOpenMarket={()=>setActive('이적시장')}/>
       
        : active==='경기 일정' ? <Schedule teamName={club.short} onStartMatch={m=>setActiveMatch(m)}/>
        : active==='리그 순위' ? <LeagueTable standings={standings} myTeam={club.short}/>
        : ['이적시장','스카우팅','코칭 스태프','훈련','선수 면담','기자회견','유망주 육성','재정 및 스폰서','구단 기록'].includes(active) ? <ClubOffice club={club} page={active} onChangePage={setActive}/>
        : <div className="fm-dashboard">
          <div className="fm-welcome"><div><p className="fm-eyebrow">LEAGUE OF LEGENDS · KOREA</p><h1>구단 운영 센터</h1><p>{club.name}의 2027 시즌을 준비하세요.</p></div><div className="fm-season"><span>2027 PRESEASON</span><strong>PRESEASON</strong><small>프리시즌 {Math.floor(day/7)+1}주차</small></div></div>
          <div className="fm-team-banner"><div className="fm-team-symbol" style={{background:club.color}}>{club.short}</div><div className="fm-team-info"><span>YOUR CLUB</span><h2>{club.name}</h2><p>대한민국 · LCK · 2027 시즌 프리시즌</p></div><div className="fm-team-power"><span>TEAM RATING</span><strong>{teamPower}</strong><small>OVERALL POWER</small></div></div>
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
            <section className="fm-panel"><div className="fm-panel-heading"><div><span>MANAGER SHORTCUTS</span><h2>구단 운영 바로가기</h2></div></div><div className="dashboard-shortcuts">{['이적시장','스카우팅','코칭 스태프','훈련','선수 면담','기자회견','유망주 육성','재정 및 스폰서','구단 기록'].map((item,i)=><button key={item} onClick={()=>setActive(item)}><span>{['⇄','◎','♟','◷','☏','▤','☆','₩','▣'][i]}</span><strong>{item}</strong><small>운영 메뉴 열기 →</small></button>)}</div></section>
          </div>
        </div>}
      </section>
    </main>
  </div>
}
export default App
