import { useEffect, useMemo, useState } from 'react'
import type { Match } from './matchData'
import { seasonClubs } from './seasonData'
import './MatchCenter.css'

type Role = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'
type Player = { name: string; role: Role; overall?: number; champions?: (string | { name: string; mastery?: number })[] }
type Props = { match: Match; myTeam?: string; onFinish: (homeScore: number, awayScore: number) => void; onExit: () => void }
type Unit = { id: string; name: string; role: Role; team: 'blue' | 'red'; champion: string; power: number }

const roles: Role[] = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']
const championPool = ['제이스','그웬','레넥톤','오른','아트록스','바이','리 신','비에고','신 짜오','아리','아지르','오리아나','요네','루시안','징크스','카이사','애쉬','진','라칸','노틸러스','레오나','렐','쓰레쉬','브라움','헤카림','렝가','암베사','오로라','브라이어','나피리','스몰더']
function readRoster(teamShort:string): Player[] {
  try {
    const raw=localStorage.getItem('lck-manager-roster-'+teamShort)
    const parsed=raw?JSON.parse(raw) as Player[]:(seasonClubs.find(t=>t.short===teamShort)?.players??[])
    return roles.map(role=>parsed.find(p=>p.role===role&&(p as any).status==='주전')||parsed.find(p=>p.role===role)||{name:'공석',role,overall:55,champions:[]})
  } catch {
    return roles.map(role=>({name:'공석',role,overall:55,champions:[]}))
  }
}

function MatchCenter({ match, myTeam = 'T1', onFinish, onExit }: Props) {
  const roster = useMemo(()=>readRoster(myTeam),[myTeam])
  const [stage, setStage] = useState<'draft'|'game'|'result'>('draft')
  const [picks, setPicks] = useState<string[]>(()=>roles.map((role,i)=>roster[i]?.champions?.[0]||championPool[i]))
  const [enemyPicks, setEnemyPicks] = useState<string[]>(()=>roles.map((role,i)=>readRoster(match.home===myTeam?match.away:match.home)[i]?.champions?.[0]||championPool[i+5]))
  const [minute, setMinute] = useState(0)
  const [speed, setSpeed] = useState(2)
  const [paused, setPaused] = useState(false)
  const [blueKills, setBlueKills] = useState(0)
  const [redKills, setRedKills] = useState(0)
  const [blueGold, setBlueGold] = useState(15000)
  const [redGold, setRedGold] = useState(15000)
  const [events, setEvents] = useState<string[]>(['밴픽을 완료하고 경기를 시작하세요.'])
  const [winner, setWinner] = useState<'blue'|'red'|null>(null)
  const [finished, setFinished] = useState(false)

  const blueName = myTeam
  const redName = match.home === myTeam ? match.away : match.home
  const enemyRoster = useMemo(()=>readRoster(redName),[redName])
  const blueUnits: Unit[] = roles.map((role,i)=>({id:`b${i}`,name:roster[i]?.name??'공석',role,team:'blue',champion:picks[i],power:roster[i]?.overall??55}))
  const redUnits: Unit[] = roles.map((role,i)=>({id:`r${i}`,name:enemyRoster[i]?.name??'공석',role,team:'red',champion:enemyPicks[i],power:enemyRoster[i]?.overall??55}))
  const allUnits = [...blueUnits,...redUnits]
  const blueRating=blueUnits.reduce((sum,p)=>sum+p.power,0)/5
  const redRating=redUnits.reduce((sum,p)=>sum+p.power,0)/5
  const draftFit=(players:Player[],selected:string[])=>players.reduce((sum,p,i)=>sum+((p.champions??[]).includes(selected[i])?3:0),0)/5
  const draftEdge=draftFit(roster,picks)-draftFit(enemyRoster,enemyPicks)

  useEffect(() => {
    if (stage !== 'game' || paused || finished) return
    const timer = window.setInterval(() => {
      setMinute(current => {
        const next = current + speed
        if (next >= 32) return 32
        return next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [stage,paused,speed,finished])

  useEffect(() => {
    if (stage !== 'game' || minute === 0 || minute % 4 !== 0 || minute >= 32) return
    const blueChance = Math.max(0.12, Math.min(0.88, 0.5 + (blueRating-redRating)*0.022 + draftEdge*0.035))
    const blueWins = Math.random() < blueChance
    if (blueWins) {
      setBlueKills(v=>v+1); setBlueGold(v=>v+850)
      setEvents(v=>[`[${String(minute).padStart(2,'0')}:00] ${blueName} 팀이 교전에서 이득을 봤습니다.`,...v].slice(0,7))
    } else {
      setRedKills(v=>v+1); setRedGold(v=>v+850)
      setEvents(v=>[`[${String(minute).padStart(2,'0')}:00] ${redName} 팀이 교전에서 이득을 봤습니다.`,...v].slice(0,7))
    }
    if (minute === 12 || minute === 24) setEvents(v=>[`[${minute}:00] 드래곤 오브젝트가 등장했습니다.`,...v].slice(0,7))
  }, [minute,stage,blueName,redName,blueRating,redRating,draftEdge])

  useEffect(() => {
    if (stage !== 'game' || minute < 32 || finished) return
    const blueWon = blueKills >= redKills
    setWinner(blueWon ? 'blue' : 'red')
    setFinished(true)
    setStage('result')
  }, [minute,stage,blueKills,redKills,finished])

  function startGame() {
    if (picks.some(p=>!p) || enemyPicks.some(p=>!p)) return
    setEvents(['경기가 시작되었습니다. 양 팀이 라인에 배치됩니다.'])
    setStage('game')
  }

  function completeSeries() {
    const blueWon = winner === 'blue'
    const blueScore = blueWon ? (blueKills - redKills >= 3 ? 2 : 2) : 0
    const redScore = blueWon ? (blueScore === 2 && blueKills - redKills >= 3 ? 0 : 1) : 2
    if (match.home === blueName) onFinish(blueScore,redScore)
    else onFinish(redScore,blueScore)
  }

  const mapPositions = allUnits.map((unit,index)=>{
    const progress = (minute % 18) / 18
    const lane = index % 5
    const baseX = unit.team === 'blue' ? 20 + progress*42 : 80 - progress*42
    const laneY = [24,37,50,63,76][lane]
    const drift = Math.sin((minute+index*3)/3)*4
    return {...unit,x:Math.max(10,Math.min(90,baseX+(unit.team==='blue'?drift:-drift))),y:laneY+Math.cos((minute+index)/4)*3}
  })

  const trackedUnit = mapPositions[Math.floor((minute / 2) % mapPositions.length)]

  return (
    <div className="match-center">
      <header className="mc-header">
        <button className="mc-back" onClick={onExit}>← 경기 일정</button>
        <div><span>2026 LCK · MATCH DAY</span><h1>{blueName} <small>VS</small> {redName}</h1></div>
        <div className="mc-live">{stage==='game'?'LIVE':stage==='result'?'FINISHED':'PRE MATCH'}</div>
      </header>

      {stage==='draft' ? (
        <div className="mc-draft">
          <div className="mc-section-title"><span>PRE-MATCH</span><h2>경기 준비 및 챔피언 선택</h2><p>선수별 챔피언을 선택한 뒤 자동 진행 경기를 시작하세요.</p></div>
          <div className="mc-draft-columns">
            <section className="mc-draft-team blue"><h3>{blueName} · 우리 팀</h3>{roles.map((role,i)=><label key={role}><span>{role} · {roster[i]?.name}</span><select value={picks[i]} onChange={e=>setPicks(v=>v.map((x,j)=>j===i?e.target.value:x))}>{championPool.map(c=><option key={c}>{c}</option>)}</select></label>)}</section>
            <div className="mc-vs">VS</div>
            <section className="mc-draft-team red"><h3>{redName} · 상대 팀</h3>{roles.map((role,i)=><label key={role}><span>{role}</span><select value={enemyPicks[i]} onChange={e=>setEnemyPicks(v=>v.map((x,j)=>j===i?e.target.value:x))}>{championPool.map(c=><option key={c}>{c}</option>)}</select></label>)}</section>
          </div>
          <div className="mc-draft-footer"><p>선수 능력치와 선택한 챔피언을 바탕으로 경기가 자동 시뮬레이션됩니다.</p><button onClick={startGame}>밴픽 완료 · 경기 시작</button></div>
        </div>
      ) : stage==='game' ? (
        <div className="mc-game">
          <div className="mc-scorebar"><div><span>{blueName}</span><strong>{blueKills}</strong><small>{blueGold.toLocaleString()} G</small></div><div className="mc-clock">{String(minute).padStart(2,'0')}:00</div><div><span>{redName}</span><strong>{redKills}</strong><small>{redGold.toLocaleString()} G</small></div></div>
          <div className="mc-arena">
            <div className="mc-map-label">SUMMONER'S RIFT · LIVE SIMULATION</div>
            <svg viewBox={trackedUnit ? `${Math.max(0, trackedUnit.x - 22)} ${Math.max(0, trackedUnit.y - 22)} 44 44` : "0 0 100 100"} preserveAspectRatio="xMidYMid slice" className="mc-map">
              <defs><linearGradient id="riftbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#193e3c"/><stop offset="100%" stopColor="#23344a"/></linearGradient></defs>
              <rect width="100" height="100" fill="url(#riftbg)"/>
              <path d="M8 90 L90 8 M8 8 L90 90 M50 0 L50 100" stroke="#547267" strokeWidth="2" opacity=".5"/>
              <path d="M10 85 L85 10 M10 15 L85 90" stroke="#a4b8a0" strokeWidth=".7" strokeDasharray="2 2" opacity=".5"/>
              <circle cx="50" cy="50" r="9" fill="#b49a58" opacity=".35"/>
              {mapPositions.map(unit=><g key={unit.id} transform={`translate(${unit.x} ${unit.y})`}><circle r="3.2" fill={unit.team==='blue'?'#54a9ff':'#f07182'} stroke="#fff" strokeWidth=".6"/><text y=".9" textAnchor="middle" fontSize="2.2" fill="#07111d" fontWeight="bold">{unit.role}</text></g>)}
            </svg>
            <div className="mc-camera"><span>PLAYER TRACKING</span><strong>{trackedUnit?.name ?? '선수'}</strong><small>개별 선수 중심으로 화면을 확대합니다</small></div>
          </div>
          <div className="mc-controls"><button onClick={()=>setPaused(v=>!v)}>{paused?'▶ 재개':'Ⅱ 일시정지'}</button>{[1,2,4].map(v=><button key={v} className={speed===v?'active':''} onClick={()=>setSpeed(v)}>{v}x</button>)}<span>게임 시간 32분 종료 후 결과가 반영됩니다.</span></div>
          <div className="mc-lower"><section className="mc-roster-strip"><h3>선수 추적</h3>{mapPositions.map(u=><div key={u.id}><i className={u.team}/><span>{u.name}</span><small>{u.champion}</small></div>)}</section><section className="mc-events"><h3>경기 중계</h3>{events.map((e,i)=><p key={i}>{e}</p>)}</section></div>
        </div>
      ) : (
        <div className="mc-result"><span>FINAL RESULT</span><h2>{winner==='blue'?blueName:redName} 승리!</h2><p>{blueName} {blueKills} : {redKills} {redName}</p><p>시뮬레이션 결과를 BO3 경기 기록에 반영합니다.</p><button onClick={completeSeries}>경기 결과 저장하고 일정으로</button></div>
      )}
    </div>
  )
}

export default MatchCenter
