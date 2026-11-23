import { useEffect, useMemo, useState } from 'react'
import type { Match } from './matchData'
import { seasonClubs } from './seasonData'
import './MatchCenter.css'

type Role = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'
type Player = { name: string; role: Role; overall?: number; morale?: number; champions?: (string | { name: string; mastery?: number })[] }
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
  const enemySeedRoster = useMemo(()=>readRoster(match.home===myTeam?match.away:match.home),[match.home,match.away,myTeam])
  const [stage, setStage] = useState<'draft'|'game'|'between'|'result'>('draft')
  const [picks, setPicks] = useState<string[]>(()=>roles.map((_,i)=>{const champion=roster[i]?.champions?.[0];return typeof champion==='string'?champion:champion?.name||championPool[i]}))
  const [enemyPicks, setEnemyPicks] = useState<string[]>(()=>roles.map((_,i)=>{const champion=enemySeedRoster[i]?.champions?.[0];return typeof champion==='string'?champion:champion?.name||championPool[i+5]}))
  const [minute, setMinute] = useState(0)
  const [speed, setSpeed] = useState(2)
  const [paused, setPaused] = useState(false)
  const [blueKills, setBlueKills] = useState(0)
  const [redKills, setRedKills] = useState(0)
  const [blueGold, setBlueGold] = useState(15000)
  const [redGold, setRedGold] = useState(15000)
  const [blueTowers,setBlueTowers]=useState(0)
  const [redTowers,setRedTowers]=useState(0)
  const [blueDragons,setBlueDragons]=useState(0)
  const [redDragons,setRedDragons]=useState(0)
  const [blueBarons,setBlueBarons]=useState(0)
  const [redBarons,setRedBarons]=useState(0)
  const [events, setEvents] = useState<string[]>(['밴픽을 완료하고 경기를 시작하세요.'])
  const [winner, setWinner] = useState<'blue'|'red'|null>(null)
  const [finished, setFinished] = useState(false)
  const [gameNumber,setGameNumber]=useState(1)
  const [blueSeriesWins,setBlueSeriesWins]=useState(0)
  const [redSeriesWins,setRedSeriesWins]=useState(0)
  const [lastMapWinner,setLastMapWinner]=useState<'blue'|'red'|null>(null)

  const blueName = myTeam
  const redName = match.home === myTeam ? match.away : match.home
  const enemyRoster = useMemo(()=>readRoster(redName),[redName])
  const blueUnits: Unit[] = roles.map((role,i)=>({id:`b${i}`,name:roster[i]?.name??'공석',role,team:'blue',champion:picks[i],power:(roster[i]?.overall??55)+((roster[i]?.morale??76)-76)*.12}))
  const redUnits: Unit[] = roles.map((role,i)=>({id:`r${i}`,name:enemyRoster[i]?.name??'공석',role,team:'red',champion:enemyPicks[i],power:(enemyRoster[i]?.overall??55)+((enemyRoster[i]?.morale??76)-76)*.12}))
  const allUnits = [...blueUnits,...redUnits]
  const blueRating=blueUnits.reduce((sum,p)=>sum+p.power,0)/5
  const redRating=redUnits.reduce((sum,p)=>sum+p.power,0)/5
  const draftFit=(players:Player[],selected:string[])=>players.reduce((sum,p,i)=>sum+((p.champions??[]).some(champion=>(typeof champion==='string'?champion:champion.name)===selected[i])?3:0),0)/5
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
    const winningName=blueWins?blueName:redName
    if (blueWins) { setBlueKills(v=>v+1); setBlueGold(v=>v+850) }
    else { setRedKills(v=>v+1); setRedGold(v=>v+850) }
    const newEvents=[`[${String(minute).padStart(2,'0')}:00] ${winningName} 교전 승리 · 킬 +1 · 골드 +850`]
    if(minute===8||minute===16||minute===24){
      if(blueWins){setBlueDragons(v=>v+1);setBlueGold(v=>v+300)} else {setRedDragons(v=>v+1);setRedGold(v=>v+300)}
      newEvents.unshift(`[${String(minute).padStart(2,'0')}:00] ${winningName} 드래곤 처치`)
    } else if(minute===12||minute===20){
      if(blueWins){setBlueTowers(v=>v+1);setBlueGold(v=>v+500)} else {setRedTowers(v=>v+1);setRedGold(v=>v+500)}
      newEvents.unshift(`[${String(minute).padStart(2,'0')}:00] ${winningName} 포탑 파괴`)
    } else if(minute===28){
      if(blueWins){setBlueBarons(v=>v+1);setBlueGold(v=>v+1500)} else {setRedBarons(v=>v+1);setRedGold(v=>v+1500)}
      newEvents.unshift(`[${String(minute).padStart(2,'0')}:00] ${winningName} 내셔 남작 처치`)
    }
    setEvents(v=>[...newEvents,...v].slice(0,9))
  }, [minute,stage,blueName,redName,blueRating,redRating,draftEdge])

  useEffect(() => {
    if (stage !== 'game' || minute < 32 || finished) return
    const blueWon = blueKills >= redKills
    const nextBlue=blueSeriesWins+(blueWon?1:0)
    const nextRed=redSeriesWins+(blueWon?0:1)
    setBlueSeriesWins(nextBlue)
    setRedSeriesWins(nextRed)
    setLastMapWinner(blueWon?'blue':'red')
    setEvents(v=>[`GAME ${gameNumber} 종료 · ${blueWon?blueName:redName} 세트 승리`,...v].slice(0,7))
    if(nextBlue>=2||nextRed>=2){
      setWinner(nextBlue>=2?'blue':'red')
      setFinished(true)
      setStage('result')
    } else {
      setStage('between')
    }
  }, [minute,stage,blueKills,redKills,finished,blueSeriesWins,redSeriesWins,gameNumber,blueName,redName])

  function startGame() {
    if (picks.some(p=>!p) || enemyPicks.some(p=>!p)) return
    setEvents(['경기가 시작되었습니다. 양 팀이 라인에 배치됩니다.'])
    setStage('game')
  }

  function nextGame() {
    setGameNumber(value=>value+1)
    setMinute(0)
    setBlueKills(0)
    setRedKills(0)
    setBlueGold(15000)
    setRedGold(15000)
    setBlueTowers(0);setRedTowers(0);setBlueDragons(0);setRedDragons(0);setBlueBarons(0);setRedBarons(0)
    setPaused(false)
    setEvents([`GAME ${gameNumber+1} 밴픽을 시작합니다.`])
    setStage('draft')
  }

  function completeSeries() {
    if (match.home === blueName) onFinish(blueSeriesWins,redSeriesWins)
    else onFinish(redSeriesWins,blueSeriesWins)
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
        <div><span>2027 LCK · MATCH DAY</span><h1>{blueName} <small>VS</small> {redName}</h1></div>
        <div className="mc-live">{stage==='game'?'LIVE':stage==='between'?'BETWEEN MAPS':stage==='result'?'FINISHED':'PRE MATCH'}</div>
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
          <div className="mc-broadcast-top"><div className="mc-broadcast-label"><b>LCK</b><span>2027 SEASON · LIVE BROADCAST</span></div><div className="mc-series-score">BO3 <i/> GAME {gameNumber} <i/> SERIES {blueSeriesWins} : {redSeriesWins}</div><span className="mc-live-pill"><i/> LIVE</span></div>
          <div className="mc-scorebar"><div className="mc-score-team blue-side"><small>BLUE SIDE</small><strong>{blueName}</strong><b>{blueKills}</b><span>{blueGold.toLocaleString()} GOLD</span></div><div className="mc-clock"><strong>{String(minute).padStart(2,'0')}:00</strong><small>GAME {gameNumber}</small></div><div className="mc-score-team red-side"><small>RED SIDE</small><strong>{redName}</strong><b>{redKills}</b><span>{redGold.toLocaleString()} GOLD</span></div></div>
          <div className="mc-objective-strip"><div><span>포탑</span><b>{blueTowers}</b><i>—</i><b>{redTowers}</b></div><div><span>드래곤</span><b>{blueDragons}</b><i>—</i><b>{redDragons}</b></div><div><span>바론</span><b>{blueBarons}</b><i>—</i><b>{redBarons}</b></div><div className="mc-gold-diff">골드 차이 <b>{Math.abs(blueGold-redGold).toLocaleString()}</b></div></div>
          <div className="mc-arena">
            <div className="mc-map-label">SUMMONER’S RIFT · LIVE MAP</div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="mc-map">
              <defs><linearGradient id="riftbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#142e2d"/><stop offset="48%" stopColor="#254b40"/><stop offset="100%" stopColor="#182d3d"/></linearGradient><pattern id="grass" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".25" fill="#b5c9a0" opacity=".2"/></pattern></defs>
              <rect width="100" height="100" fill="url(#riftbg)"/><rect width="100" height="100" fill="url(#grass)"/>
              <path d="M5 95 L95 5 L100 10 L10 100Z" fill="#315b4c" opacity=".9"/><path d="M5 5 L95 95 L100 90 L10 0Z" fill="#315b4c" opacity=".75"/>
              <path d="M7 93 L93 7 M7 7 L93 93" stroke="#b9c5a2" strokeWidth="1.7" opacity=".72"/>
              <path d="M0 52 Q22 38 36 52 T66 52 T100 45" fill="none" stroke="#5b9b9a" strokeWidth="5" opacity=".45"/>
              <path d="M0 52 Q22 38 36 52 T66 52 T100 45" fill="none" stroke="#83c3bd" strokeWidth=".8" opacity=".65"/>
              <path d="M17 83 Q35 62 50 50 Q65 38 83 17 M17 17 Q35 38 50 50 Q65 62 83 83" fill="none" stroke="#7a8d68" strokeWidth="5" opacity=".35"/>
              <g fill="#d2c7a0" stroke="#574f3e" strokeWidth=".5"><path d="M7 91l3-5 3 5z"/><path d="M91 9l3-5 3 5z"/><path d="M47 50l3-5 3 5z"/></g>
              <g fill="#e6c66f" opacity=".85"><circle cx="50" cy="50" r="3.5"/><circle cx="15" cy="85" r="2"/><circle cx="85" cy="15" r="2"/></g>
              <g fill="#b9d0ad" opacity=".25">{Array.from({length:18},(_,i)=><circle key={i} cx={(i*17)%97+1} cy={(i*29)%97+1} r="1.4"/>)}</g>
              {mapPositions.map(unit=><g key={unit.id} transform={'translate(' + unit.x + ' ' + unit.y + ')'}><circle r="3.6" fill={unit.team==='blue'?'#42a5ff':'#f06478'} stroke="#f6f8fb" strokeWidth=".8"/><circle r="1.15" fill="#101722"/><text y=".75" textAnchor="middle" fontSize="1.7" fill="#fff" fontWeight="bold">{unit.role}</text></g>)}
            </svg>
            <div className="mc-camera"><span>PLAYER TRACKING</span><strong>{trackedUnit?.name ?? '선수'}</strong><small>개별 선수 중심으로 화면을 확대합니다</small></div>
          </div>
          <div className="mc-controls"><button onClick={()=>setPaused(v=>!v)}>{paused?'▶ 재개':'Ⅱ 일시정지'}</button>{[1,2,4].map(v=><button key={v} className={speed===v?'active':''} onClick={()=>setSpeed(v)}>{v}x</button>)}<span>게임 시간 32분 종료 후 결과가 반영됩니다.</span></div>
          <div className="mc-lower"><section className="mc-roster-strip"><h3>선수 추적</h3>{mapPositions.map(u=><div key={u.id}><i className={u.team}/><span>{u.name}</span><small>{u.champion}</small></div>)}</section><section className="mc-events"><h3>경기 중계</h3>{events.map((e,i)=><p key={i}>{e}</p>)}</section></div>
        </div>
      ) : stage==='between' ? (
        <div className="mc-result mc-between">
          <span>GAME {gameNumber} COMPLETE</span>
          <h2>{lastMapWinner==='blue'?blueName:redName} 세트 승리</h2>
          <p>현재 시리즈 · {blueName} {blueSeriesWins} : {redSeriesWins} {redName}</p>
          <p>BO3 · 먼저 2세트를 가져가는 팀이 승리합니다.</p>
          <button onClick={nextGame}>다음 세트 밴픽 진행 →</button>
        </div>
      ) : (
        <div className="mc-result"><span>FINAL RESULT</span><h2>{winner==='blue'?blueName:redName} 승리!</h2><p>{blueName} {blueSeriesWins} : {redSeriesWins} {redName}</p><p>총 {gameNumber}세트 진행 · 선수 능력치와 챔피언 숙련도가 반영됐습니다.</p><button onClick={completeSeries}>경기 결과 저장하고 일정으로</button></div>
      )}
    </div>
  )
}

export default MatchCenter
