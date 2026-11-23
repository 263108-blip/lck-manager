import { useEffect, useMemo, useState } from 'react'
import type { Match } from './matchData'
import './MatchCenter.css'

type Role = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'
type Player = { name: string; role: Role; overall?: number; champions?: (string | { name: string; mastery?: number })[] }
type Props = { match: Match; onFinish: (homeScore: number, awayScore: number) => void; onExit: () => void }
type Unit = { id: string; name: string; role: Role; team: 'blue' | 'red'; champion: string; power: number }

const roles: Role[] = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']
const championPool = ['제이스','그웬','레넥톤','오른','아트록스','바이','리 신','비에고','신 짜오','아리','아지르','오리아나','요네','루시안','징크스','카이사','애쉬','진','라칸','노틸러스','레오나','렐','쓰레쉬','브라움','헤카림','렝가','암베사','오로라','브라이어','나피리','스몰더']
const defaultPlayers: Player[] = [
  {name:'Zeus',role:'TOP',overall:96,champions:['제이스','그웬','럼블']},
  {name:'Oner',role:'JNG',overall:95,champions:['바이','리 신','비에고']},
  {name:'Faker',role:'MID',overall:99,champions:['아지르','오리아나','아리']},
  {name:'Gumayusi',role:'ADC',overall:95,champions:['진','징크스','카이사']},
  {name:'Keria',role:'SUP',overall:97,champions:['라칸','노틸러스','레나타 글라스크']},
]

function readRoster(): Player[] {
  try {
    const raw = localStorage.getItem('lck-manager-roster')
    if (!raw) return defaultPlayers
    const parsed = JSON.parse(raw) as Player[]
    return roles.map(role => parsed.find(p => p.role === role && (p as any).status === '주전') || parsed.find(p => p.role === role) || defaultPlayers.find(p => p.role === role)!)
  } catch { return defaultPlayers }
}

function MatchCenter({ match, onFinish, onExit }: Props) {
  const roster = useMemo(readRoster, [])
  const [stage, setStage] = useState<'draft'|'game'|'result'>('draft')
  const [picks, setPicks] = useState<string[]>(['제이스','바이','아지르','징크스','라칸'])
  const [enemyPicks, setEnemyPicks] = useState<string[]>(['레넥톤','비에고','오리아나','카이사','노틸러스'])
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

  const blueName = match.home
  const redName = match.away
  const blueUnits: Unit[] = roster.map((p,i)=>({id:`b${i}`,name:p.name,role:roles[i],team:'blue',champion:picks[i],power:p.overall ?? 85}))
  const redUnits: Unit[] = roles.map((role,i)=>({id:`r${i}`,name:`${redName} ${role}`,role,team:'red',champion:enemyPicks[i],power:84+(i%3)*2}))
  const allUnits = [...blueUnits,...redUnits]

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
    if (stage !== 'game' || minute === 0 || minute % 4 !== 0) return
    const blueWins = Math.random() < 0.52
    if (blueWins) {
      setBlueKills(v=>v+1); setBlueGold(v=>v+850)
      setEvents(v=>[`[${String(minute).padStart(2,'0')}:00] ${blueName} 팀이 교전에서 이득을 봤습니다.`,...v].slice(0,7))
    } else {
      setRedKills(v=>v+1); setRedGold(v=>v+850)
      setEvents(v=>[`[${String(minute).padStart(2,'0')}:00] ${redName} 팀이 교전에서 이득을 봤습니다.`,...v].slice(0,7))
    }
    if (minute === 12 || minute === 24) setEvents(v=>[`[${minute}:00] 드래곤 오브젝트가 등장했습니다.`,...v].slice(0,7))
  }, [minute,stage,blueName,redName])

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
    onFinish(blueScore,redScore)
  }

  const mapPositions = allUnits.map((unit,index)=>{
    const progress = (minute % 18) / 18
    const lane = index % 5
    const baseX = unit.team === 'blue' ? 20 + progress*42 : 80 - progress*42
    const laneY = [24,37,50,63,76][lane]
    const drift = Math.sin((minute+index*3)/3)*4
    return {...unit,x:Math.max(10,Math.min(90,baseX+(unit.team==='blue'?drift:-drift))),y:laneY+Math.cos((minute+index)/4)*3}
  })

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
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mc-map">
              <defs><linearGradient id="riftbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#193e3c"/><stop offset="100%" stopColor="#23344a"/></linearGradient></defs>
              <rect width="100" height="100" fill="url(#riftbg)"/>
              <path d="M8 90 L90 8 M8 8 L90 90 M50 0 L50 100" stroke="#547267" strokeWidth="2" opacity=".5"/>
              <path d="M10 85 L85 10 M10 15 L85 90" stroke="#a4b8a0" strokeWidth=".7" strokeDasharray="2 2" opacity=".5"/>
              <circle cx="50" cy="50" r="9" fill="#b49a58" opacity=".35"/>
              {mapPositions.map(unit=><g key={unit.id} transform={`translate(${unit.x} ${unit.y})`}><circle r="3.2" fill={unit.team==='blue'?'#54a9ff':'#f07182'} stroke="#fff" strokeWidth=".6"/><text y=".9" textAnchor="middle" fontSize="2.2" fill="#07111d" fontWeight="bold">{unit.role}</text></g>)}
            </svg>
            <div className="mc-camera"><span>PLAYER TRACKING</span><strong>{mapPositions[Math.floor((minute/2)%10)]?.name ?? '선수'}</strong><small>카메라가 주요 교전을 추적합니다</small></div>
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
