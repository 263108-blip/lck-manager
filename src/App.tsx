import { useEffect, useMemo, useState } from 'react'
import Roster from './Roster'
import './App.css'
import Schedule from './Schedule'
import LeagueTable from './LeagueTable'
import { useLeagueMatches, buildStandings, saveMatches, type Match } from './matchData'
import MatchCenter from './MatchCenter'
import Tactics from './Tactics'
import Playoffs from './Playoffs'
import AcademyLeague from './AcademyLeague'
import SeasonCalendar from './SeasonCalendar'
import SeasonAwards from './SeasonAwards'
import LCKCup, { getNextLckCupDate } from './LCKCup'
import { getCurrentSeasonEvent, getNextSeasonEvent, getSeasonPhase } from './seasonEvents'
import { advanceCareerWeek, applyMatchResult, ClubOffice, ClubSelection, clubs, readClubRoster, readClubStaff, seedRosterForClub, type Club } from './ClubManager'

const menus = ['대시보드','선수단','전술 및 밴픽','경기 일정','리그 순위','이적시장','스카우팅','코칭 스태프','훈련','선수 면담','기자회견','유망주 육성','재정 및 스폰서','구단 기록','2군 · LCK CL','플레이오프','시즌 캘린더','시상식 · 명예의 전당','LCK Cup · Split 1']
function dateFromDay(day:number) { return new Date(2025,10,23+day) }
function dateKey(date:Date) { return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-') }
function phaseLabel(phase:string) {
  const labels:Record<string,string> = {
    PRESEASON:'프리시즌',
    SPLIT_1:'LCK Split 1',
    FIRST_STAND:'First Stand',
    BREAK:'시즌 전환기',
    REGULAR_R1_2:'정규 시즌 R1~2',
    ROAD_TO_MSI:'Road to MSI',
    MSI_PREP:'MSI 준비',
    MSI:'Mid-Season Invitational',
    SUMMER_BREAK:'하계 전환기',
    REGULAR_R3_4:'정규 시즌 R3~4',
    PLAY_IN:'플레이-인',
    PLAYOFFS:'플레이오프',
    WORLDS:'월드 챔피언십',
    OFFSEASON:'오프시즌',
  }
  return labels[phase] ?? phase
}

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
    if(key && key !== 'lck-manager-autosave' && (key.startsWith('lck-manager-') || key.startsWith('lck-career-') || key.startsWith('lck-cl-'))) {
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
    if(key && (key.startsWith('lck-manager-') || key.startsWith('lck-career-') || key.startsWith('lck-cl-'))) keys.push(key)
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
    if (localStorage.getItem('lck-manager-roster-version') !== '2026-r34-v1') {
      // 2026 Round 3-4 roster correction: refresh the official season roster once.
      // Career finances, match history, and saved manager decisions are preserved.
      clubs.forEach(team => localStorage.setItem('lck-manager-roster-' + team.short, JSON.stringify(seedRosterForClub(team))))
      localStorage.setItem('lck-manager-roster-version', '2026-r34-v1')
      window.dispatchEvent(new Event('lck-roster-updated'))
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
  const playoffsReady = matches.some(match=>match.stage==='R3-4') && matches.filter(match=>match.stage==='R3-4').every(match=>match.status==='종료')
  const myStanding = standings.find(t=>t.name===club?.short)
  const myRank = standings.findIndex(t=>t.name===club?.short)+1
  const nextMatch = matches.filter(m=>m.status==='예정'&&(m.home===club?.short||m.away===club?.short)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]
  const opponent = nextMatch ? (nextMatch.home===club?.short?nextMatch.away:nextMatch.home) : null
  const gameDate = dateFromDay(day)
  const seasonPhase = getSeasonPhase(dateKey(gameDate))
  const currentEvent = getCurrentSeasonEvent(dateKey(gameDate))
  const nextSeasonEvent = getNextSeasonEvent(dateKey(gameDate))
  const displayDate = gameDate.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})
  const staffProfiles=readClubStaff(club?.short ?? '',dateKey(gameDate))
  const headCoach=staffProfiles.find(staff=>staff.role==='감독') ?? staffProfiles[0]
  function selectClub(selected: Club) {
    const nextRoster = readClubRoster(selected.short)
    localStorage.setItem('lck-manager-roster-' + selected.short, JSON.stringify(nextRoster))
    localStorage.setItem('lck-manager-roster', JSON.stringify(nextRoster))
    localStorage.setItem('lck-manager-selected-club', JSON.stringify(selected))
    setClub(selected)
    setActive('대시보드')
    window.dispatchEvent(new Event('lck-roster-updated'))
  }
  function advanceDay() {
    if (!club) return
    const currentDate = dateKey(dateFromDay(day))
    const nextUserMatch = matches
      .filter(match => match.status === '예정' && (match.home === club.short || match.away === club.short))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]

    if (nextUserMatch && nextUserMatch.date <= currentDate) {
      setActiveMatch(nextUserMatch)
      return
    }

    const nextSeasonEvent = getNextSeasonEvent(currentDate)
    const nextCupDate = getNextLckCupDate(currentDate)
    const nextDate = [nextUserMatch?.date, nextCupDate, nextSeasonEvent?.start]
      .filter((value): value is string => Boolean(value))
      .sort()[0]
    let targetDay = day + 7
    if (nextDate) {
      const [year, month, date] = nextDate.split('-').map(Number)
      const target = new Date(year, month - 1, date)
      targetDay = Math.max(day + 1, Math.round((target.getTime() - dateFromDay(0).getTime()) / 86400000))
    }

    const teamPowerFor = (short: string) => {
      const lineup = readClubRoster(short).filter(player => player.status === '주전')
      return (lineup.reduce((sum, player) => sum + player.overall, 0) + (5 - lineup.length) * 58) / 5
    }

    let progressed = [...matches]
    let processedOtherMatches = 0
    for (let offset = day + 1; offset <= targetDay; offset++) {
      if (Math.floor(offset / 7) > Math.floor((offset - 1) / 7)) advanceCareerWeek(club)
      const simulatedDate = dateKey(dateFromDay(offset))
      progressed = progressed.map(match => {
        if (match.status !== '예정' || match.date > simulatedDate || match.date <= currentDate) return match
        // The manager's own match is never auto-resolved. The game stops on its date.
        if (match.home === club.short || match.away === club.short) return match
        const difference = teamPowerFor(match.home) - teamPowerFor(match.away)
        const homeWin = Math.random() < Math.max(.18, Math.min(.82, .5 + difference * .018))
        const close = Math.random() < .48
        processedOtherMatches += 1
        return { ...match, status: '종료' as const, homeScore: homeWin ? 2 : (close ? 1 : 0), awayScore: homeWin ? (close ? 1 : 0) : 2 }
      })
    }

    setDay(targetDay)
    localStorage.setItem('lck-manager-day', String(targetDay))
    saveMatches(progressed)
    if (nextUserMatch && nextUserMatch.date === dateKey(dateFromDay(targetDay))) {
      setSaveMessage(`${nextUserMatch.date} 경기일 도착 · 밴픽과 경기 준비를 진행하세요.`)
    } else if (nextCupDate && nextCupDate === dateKey(dateFromDay(targetDay))) {
      setSaveMessage('LCK Cup 경기일 도착 · Group Battle 결과를 진행할 수 있습니다.')
      setActive('LCK Cup · Split 1')
    } else if (nextSeasonEvent && nextSeasonEvent.start === dateKey(dateFromDay(targetDay))) {
      setSaveMessage(`${nextSeasonEvent.name} 시작일 도착 · 시즌 캘린더에서 대회 정보를 확인하세요.`)
      setActive('시즌 캘린더')
    } else if (processedOtherMatches > 0) {
      setSaveMessage(`다음 일정까지 진행 · 다른 구단 ${processedOtherMatches}경기 결과 반영`)
    } else {
      setSaveMessage('다음 주요 일정까지 시간이 진행되었습니다.')
    }
  }
  useEffect(() => {
    const handleSpacebar = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || showLobby || activeMatch) return
      const target = event.target
      if (target instanceof HTMLElement && (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
      )) return
      event.preventDefault()
      advanceDay()
    }
    window.addEventListener('keydown', handleSpacebar)
    return () => window.removeEventListener('keydown', handleSpacebar)
  }, [showLobby, activeMatch, day, club, matches])
  if (showLobby) return <div className="lobby-screen">
    <div className="lobby-top"><div className="lobby-brand"><b>LCK</b><span>MANAGER 2026</span></div><span className="lobby-build">CAREER MODE · KOREA</span></div>
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
      <nav>{menus.map((menu,index)=><button key={menu} className={active===menu?'nav-item active':'nav-item'} onClick={()=>{setActive(menu);setActiveMatch(null)}}><span>{['▦','♙','⚔','▤','▥','⇄','◎','♟','◷','☏','▤','☆','₩','▣','♙','🏆','▤','🏅','🏆'][index]}</span>{menu}</button>)}</nav>
      <div className="sidebar-bottom"><div className="team-mini" style={{background:club.color}}>{club.short.slice(0,3)}</div><div><strong>{club.name}</strong><small>감독 커리어 · 2026</small></div></div>
      <button className="change-club" onClick={()=>{quickSave();setClub(null);setShowLobby(false);setActive('대시보드')}}>구단 변경</button>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="season">2026 {phaseLabel(seasonPhase)}</span><span className="date">{displayDate}</span></div><div className="topbar-actions"><span className="profile"><span className="online-dot"/>MANAGER</span><span className="spacebar-hint">SPACE 계속하기</span><button className="topbar-save" onClick={quickSave}>저장</button><button className="topbar-lobby" onClick={()=>setShowLobby(true)}>로비</button><button onClick={advanceDay}>{nextMatch ? '다음 경기일까지 →' : '다음 일정까지 →'}</button></div></header>
      <section className="content">{saveMessage && <div className="save-toast">{saveMessage}</div>}
        {activeMatch ? <MatchCenter match={activeMatch} myTeam={club.short} onExit={()=>setActiveMatch(null)} onFinish={(homeScore,awayScore)=>{const updated=matches.map(m=>m.id===activeMatch.id?{...m,status:'종료' as const,homeScore,awayScore}:m);saveMatches(updated);const ourScore=activeMatch.home===club.short?homeScore:awayScore;const theirScore=activeMatch.home===club.short?awayScore:homeScore;const opponent=activeMatch.home===club.short?activeMatch.away:activeMatch.home;applyMatchResult(club,ourScore>theirScore,opponent);setActiveMatch(null);setActive('경기 일정')}}/>
        : active==='선수단' ? <Roster key={club.short} teamName={club.name} teamShort={club.short} currentDate={dateKey(gameDate)} onOpenMarket={()=>setActive('이적시장')}/>
       
        
        : active==='전술 및 밴픽' ? <Tactics teamName={club.short}/>
        : active==='경기 일정' ? <Schedule teamName={club.short} onStartMatch={m=>setActiveMatch(m)}/>
         : active==='리그 순위' ? <LeagueTable standings={standings} myTeam={club.short}/>
        : active==='2군 · LCK CL' ? <AcademyLeague teamShort={club.short}/>
        : active==='플레이오프' ? <Playoffs standings={standings} myTeam={club.short} ready={playoffsReady}/>
        : active==='시즌 캘린더' ? <SeasonCalendar currentDate={dateKey(gameDate)}/>
        : active==='시상식 · 명예의 전당' ? <SeasonAwards currentDate={dateKey(gameDate)}/>
        : active==='LCK Cup · Split 1' ? <LCKCup myTeam={club.short}/>
        : ['이적시장','스카우팅','코칭 스태프','훈련','선수 면담','기자회견','유망주 육성','재정 및 스폰서','구단 기록'].includes(active) ? <ClubOffice club={club} page={active} onChangePage={setActive} currentDate={dateKey(gameDate)}/>
        : <div className="fm-dashboard-v2">
          <header className="fm-dash-heading">
            <div><span>2026 LCK MANAGER · CAREER MODE</span><h1>구단 운영 센터</h1><p>{club.name} · {displayDate} · {phaseLabel(seasonPhase)}</p></div>
            <div className="fm-dash-date"><small>현재 대회</small><strong>{currentEvent?.name ?? phaseLabel(seasonPhase)}</strong><span>{nextSeasonEvent ? '다음 일정 · '+nextSeasonEvent.name : '2026 시즌 캘린더'}</span></div>
          </header>
          <section className="fm-club-strip">
            <div className="fm-club-crest" style={{background:club.color}}>{club.short}</div>
            <div className="fm-club-ident"><small>MANAGER · FIRST TEAM</small><strong>{club.name}</strong><span>2026 LCK · 구단 평판 {clubs.find(item=>item.short===club.short)?.strength ?? teamPower}</span></div>
            <div className="fm-club-rating"><small>TEAM OVR</small><b>{teamPower}</b></div>
            <div className="fm-club-record"><small>리그 성적</small><b>{myStanding?.wins??0}승 {myStanding?.losses??0}패</b></div>
          </section>
          <div className="fm-dash-kpis">
            <div><small>현재 순위</small><strong>{myRank||'-'}<em>위</em></strong><span>10개 구단</span></div>
            <div><small>승률</small><strong>{myStanding?.winRate??0}<em>%</em></strong><span>{myStanding?.wins??0}승 {myStanding?.losses??0}패</span></div>
            <div><small>등록 선수</small><strong>{roster.length}<em>명</em></strong><span>주전 {starters.length}명</span></div>
            <div><small>다음 경기</small><strong className="date-value">{nextMatch?nextMatch.date.slice(5).replace('-','.'):'—'}</strong><span>{opponent?opponent+' 상대': '예정 경기 없음'}</span></div>
          </div>
          <div className="fm-dash-columns">
            <section className="fm-dash-panel fm-squad-panel">
              <div className="fm-dash-panel-head"><div><small>FIRST TEAM · SQUAD</small><h2>1군 선수단</h2></div><button onClick={()=>setActive('선수단')}>전체 선수단 →</button></div>
              <div className="fm-squad-table"><div className="fm-squad-table-head"><span>POS</span><span>선수</span><span>OVR</span><span>상태</span></div>
                {['TOP','JNG','MID','ADC','SUP'].map(role=>{
                  const player=starters.find(item=>item.role===role) ?? roster.find(item=>item.role===role)
                  return <div className="fm-squad-line" key={role}><span>{role}</span><strong>{player?.name ?? '공석'}</strong><b>{player?.overall ?? '—'}</b><small>{player?.status ?? '선수 없음'}</small></div>
                })}
              </div>
              <div className="fm-squad-foot"><span>선수단 관리와 능력치 상세</span><button onClick={()=>setActive('선수단')}>선수 프로필 열기</button></div>
            </section>
            <section className="fm-dash-panel fm-fixture-panel">
              <div className="fm-dash-panel-head"><div><small>MATCH CENTER</small><h2>다음 경기</h2></div><span className={nextMatch?'fm-live-tag':'fm-muted-tag'}>{nextMatch?'UPCOMING':'NO FIXTURE'}</span></div>
              {nextMatch ? <>
                <div className="fm-fixture-date">{nextMatch.date} · {nextMatch.time}</div>
                <div className="fm-fixture-versus"><div><span className="fm-fixture-crest" style={{background:club.color}}>{club.short}</span><b>{club.short}</b></div><strong>VS</strong><div><span className="fm-fixture-crest opponent">{opponent}</span><b>{opponent}</b></div></div>
                <p className="fm-fixture-note">경기일에 도착하면 밴픽과 경기 준비를 진행할 수 있습니다.</p>
                <button className="fm-fixture-action" onClick={()=>setActiveMatch(nextMatch)}>경기 준비 및 밴픽 →</button>
              </> : <div className="fm-no-fixture">현재 예정된 구단 경기가 없습니다.</div>}
              <button className="fm-panel-link" onClick={()=>setActive('경기 일정')}>전체 경기 일정 보기</button>
            </section>
            <section className="fm-dash-panel fm-staff-panel">
              <div className="fm-dash-panel-head"><div><small>MANAGEMENT STAFF</small><h2>감독 및 코칭 스태프</h2></div><button onClick={()=>setActive('코칭 스태프')}>관리 →</button></div>
              {headCoach ? <div className="fm-head-coach"><div className="fm-coach-initial">{headCoach.name.slice(0,1)}</div><div><small>HEAD COACH</small><strong>{headCoach.name}</strong><span>{headCoach.realName || '본명 미확인'}</span></div><b>{headCoach.age===null || headCoach.age===undefined?'나이 미확인':headCoach.age+'세'}</b></div> : <div className="fm-no-coach">감독 정보가 등록되어 있지 않습니다.</div>}
              <div className="fm-staff-list">{staffProfiles.filter(staff=>staff.role!=='감독').slice(0,4).map(staff=><div key={staff.id}><span>{staff.role}</span><b>{staff.name}</b><small>{staff.age===null || staff.age===undefined?'나이 확인 불가':staff.age+'세'}</small></div>)}</div>
              <p className="fm-staff-note">생년월일이 확인된 인원만 현재 커리어 날짜 기준 만 나이를 표시합니다.</p>
            </section>
          </div>
          <div className="fm-dash-lower">
            <section className="fm-dash-panel fm-standings-panel">
              <div className="fm-dash-panel-head"><div><small>LCK · TABLE</small><h2>리그 순위</h2></div><button onClick={()=>setActive('리그 순위')}>전체 순위 →</button></div>
              <div className="fm-mini-table-head"><span>#</span><span>구단</span><span>경기</span><span>승률</span></div>
              {standings.slice(0,6).map((team,index)=><div className={team.name===club.short?'fm-mini-table-row my-team':'fm-mini-table-row'} key={team.name}><b>{index+1}</b><strong>{team.name}</strong><span>{team.wins}승 {team.losses}패</span><small>{team.winRate}%</small></div>)}
            </section>
            <section className="fm-dash-panel fm-shortcuts-panel">
              <div className="fm-dash-panel-head"><div><small>CLUB OPERATIONS</small><h2>감독 업무</h2></div></div>
              <div className="fm-manager-shortcuts">{['이적시장','스카우팅','훈련','선수 면담','기자회견','재정 및 스폰서','유망주 육성','2군 · LCK CL','구단 기록','시즌 캘린더','시상식 · 명예의 전당'].map((item,index)=><button key={item} onClick={()=>setActive(item)}><span>{['⇄','◎','◷','☏','▤','₩','☆','♙','▣','▤','🏅','🏆'][index]}</span><b>{item}</b><small>열기 →</small></button>)}</div>
            </section>
          </div>
        </div>}
      </section>
    </main>
  </div>
}
export default App
