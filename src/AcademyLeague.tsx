import { useMemo, useState } from 'react'
import { academyRosterNotes, academyTeams } from './academyData'
import './AcademyLeague.css'

type Stage = 'R1-2' | 'R3-4' | 'PLAYIN' | 'PLAYOFFS' | 'OFFSEASON'
type Match = {
  id: string
  date: string
  stage: Exclude<Stage,'OFFSEASON'>
  group?: 'CHALLENGE' | 'TRIAL'
  round: string
  home: string
  away: string
  bestOf: 3 | 5
  homeScore?: number
  awayScore?: number
  winner?: string
  status: '예정' | '종료'
}
type Save = {
  version: number
  stage: Stage
  matches: Match[]
  challenge: string[]
  trial: string[]
  champion: string
  lastDate: string
  history: string[]
}
type Row = {id:string;played:number;wins:number;losses:number;setsFor:number;setsAgainst:number;setDiff:number;points:number}
const KEY = 'lck-cl-career-2026-v1'
const labels: Record<Stage,string> = {
  'R1-2':'정규 라운드 1~2',
  'R3-4':'그룹 라운드 3~4',
  PLAYIN:'플레이-인',
  PLAYOFFS:'플레이오프',
  OFFSEASON:'시즌 종료',
}
const teamMap = new Map(academyTeams.map(team => [team.id,team]))
function dateKey(date:Date):string {
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')
}
function plusDays(value:string,days:number):string {
  const date=new Date(value+'T00:00:00')
  date.setDate(date.getDate()+days)
  return dateKey(date)
}
function roundsFor(ids:string[],prefix:string,stage:'R1-2'|'R3-4',start:string,group?:'CHALLENGE'|'TRIAL'):Match[] {
  const rotation:(string|null)[]=[...ids]
  if(rotation.length%2===1) rotation.push(null)
  const first:Array<Array<[string,string]>>=[]
  const roundCount=rotation.length-1
  for(let round=0;round<roundCount;round++){
    const games:Array<[string,string]>=[]
    for(let i=0;i<rotation.length/2;i++){
      const a=rotation[i],b=rotation[rotation.length-1-i]
      if(a&&b) games.push(round%2===0?[a,b]:[b,a])
    }
    first.push(games)
    const fixed=rotation[0]
    const rest=rotation.slice(1)
    rest.unshift(rest.pop() ?? null)
    rotation.splice(0,rotation.length,fixed,...rest)
  }
  const all=first.flatMap((round,index)=>round.map((pair,gameIndex)=>({
    id:prefix+'-'+(index+1)+'-'+(gameIndex+1),
    date:plusDays(start,index*3+Math.floor(gameIndex/2)),
    stage,
    group,
    round:'R'+(index+1),
    home:pair[0],
    away:pair[1],
    bestOf:3 as const,
    status:'예정' as const,
  })))
  const reverse=all.map(match=>({
    ...match,
    id:match.id+'-REV',
    date:plusDays(match.date,roundCount*3),
    round:'R'+(Number(match.round.slice(1))+roundCount),
    home:match.away,
    away:match.home,
  }))
  return [...all,...reverse]
}
function firstState():Save {
  return {
    version:1,
    stage:'R1-2',
    matches:roundsFor(academyTeams.map(team=>team.id),'CL-R12','R1-2','2026-04-01'),
    challenge:[],
    trial:[],
    champion:'',
    lastDate:'',
    history:['2026 LCK CL 시즌이 시작되었습니다.'],
  }
}
function readSave():Save {
  try {
    const raw=localStorage.getItem(KEY)
    if(!raw)return firstState()
    const parsed=JSON.parse(raw) as Save
    if(parsed.version!==1||!Array.isArray(parsed.matches))return firstState()
    return parsed
  } catch { return firstState() }
}
function power(id:string):number {
  const team=teamMap.get(id)
  if(!team)return 70
  const starters=team.players.filter(player=>player.status==='주전')
  if(!starters.length)return 70
  return starters.reduce((sum,player)=>sum+player.overall,0)/starters.length
}
function simulate(match:Match):Match {
  const chance=Math.max(.18,Math.min(.82,.5+(power(match.home)-power(match.away))*.018))
  let home=0,away=0
  const required=Math.ceil(match.bestOf/2)
  for(let i=0;i<match.bestOf&&home<required&&away<required;i++){
    if(Math.random()<chance)home++
    else away++
  }
  return {...match,homeScore:home,awayScore:away,winner:home>away?match.home:match.away,status:'종료'}
}
function rowsFor(state:Save,ids:string[],carry:boolean):Row[] {
  const table=new Map<string,Row>()
  ids.forEach(id=>table.set(id,{id,played:0,wins:0,losses:0,setsFor:0,setsAgainst:0,setDiff:0,points:0}))
  state.matches.forEach(match=>{
    if(match.status!=='종료')return
    const belongs = match.stage==='R1-2' ? carry && ids.includes(match.home) && ids.includes(match.away) : match.stage==='R3-4' && ids.includes(match.home) && ids.includes(match.away)
    if(!belongs)return
    const home=table.get(match.home),away=table.get(match.away)
    if(!home||!away)return
    home.played++;away.played++
    home.setsFor+=match.homeScore ?? 0
    home.setsAgainst+=match.awayScore ?? 0
    away.setsFor+=match.awayScore ?? 0
    away.setsAgainst+=match.homeScore ?? 0
    if((match.homeScore??0)>(match.awayScore??0)){home.wins++;away.losses++;home.points+=1}
    else{away.wins++;home.losses++;away.points+=1}
  })
  return [...table.values()].map(row=>({...row,setDiff:row.setsFor-row.setsAgainst}))
    .sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff||b.setsFor-a.setsFor||power(b.id)-power(a.id))
}
function playinMatches(challenge:string[],trial:string[]):Match[] {
  return [
    {id:'CL-PI-1',date:'2026-09-02',stage:'PLAYIN',round:'준결승 1',home:challenge[4],away:trial[1],bestOf:3,status:'예정'},
    {id:'CL-PI-2',date:'2026-09-03',stage:'PLAYIN',round:'준결승 2',home:trial[0],away:trial[2],bestOf:3,status:'예정'},
  ]
}
function afterPlayin(challenge:string[],winners:string[]):Match[] {
  return [
    {id:'CL-QF-1',date:'2026-09-08',stage:'PLAYOFFS',round:'플레이오프 1라운드',home:challenge[2],away:winners[1],bestOf:5,status:'예정'},
    {id:'CL-QF-2',date:'2026-09-08',stage:'PLAYOFFS',round:'플레이오프 1라운드',home:challenge[3],away:winners[0],bestOf:5,status:'예정'},
  ]
}
function transition(state:Save):Save {
  if(state.stage==='R1-2'&&state.matches.filter(match=>match.stage==='R1-2').every(match=>match.status==='종료')){
    const ranking=rowsFor(state,academyTeams.map(team=>team.id),false)
    const challenge=ranking.slice(0,5).map(row=>row.id)
    const trial=ranking.slice(5).map(row=>row.id)
    return {...state,stage:'R3-4',challenge,trial,matches:[...state.matches,...roundsFor(challenge,'CL-R34-C','R3-4','2026-07-01','CHALLENGE'),...roundsFor(trial,'CL-R34-T','R3-4','2026-07-01','TRIAL')],history:['R1~2 종료 · Challenge Group과 Trial Group 편성 완료',...state.history]}
  }
  if(state.stage==='R3-4'&&state.matches.filter(match=>match.stage==='R3-4').every(match=>match.status==='종료')){
    return {...state,stage:'PLAYIN',matches:[...state.matches,...playinMatches(state.challenge,state.trial)],history:['R3~4 종료 · 플레이-인 4팀 진출',...state.history]}
  }
  if(state.stage==='PLAYIN'&&state.matches.filter(match=>match.stage==='PLAYIN').every(match=>match.status==='종료')){
    const winners=state.matches.filter(match=>match.stage==='PLAYIN').map(match=>match.winner ?? '')
    if(winners.length===2&&winners.every(Boolean)){
      return {...state,stage:'PLAYOFFS',matches:[...state.matches,...afterPlayin(state.challenge,winners)],history:['플레이-인 종료 · 2팀이 플레이오프 1라운드 진출',...state.history]}
    }
  }
  if(state.stage==='PLAYOFFS'){
    const quarter=state.matches.filter(match=>match.round==='플레이오프 1라운드')
    const semi=state.matches.filter(match=>match.round==='플레이오프 2라운드')
    const final=state.matches.find(match=>match.round==='결승')
    if(quarter.length===2&&quarter.every(match=>match.status==='종료')&&semi.length===0){
      const winners=quarter.map(match=>match.winner ?? '')
      const next:Match[]=[
        {id:'CL-SF-1',date:'2026-09-12',stage:'PLAYOFFS',round:'플레이오프 2라운드',home:state.challenge[0],away:winners[1],bestOf:5,status:'예정'},
        {id:'CL-SF-2',date:'2026-09-12',stage:'PLAYOFFS',round:'플레이오프 2라운드',home:state.challenge[1],away:winners[0],bestOf:5,status:'예정'},
      ]
      return {...state,matches:[...state.matches,...next],history:['플레이오프 2라운드 진출팀 확정',...state.history]}
    }
    if(semi.length===2&&semi.every(match=>match.status==='종료')&&!final){
      return {...state,matches:[...state.matches,{id:'CL-FINAL',date:'2026-09-16',stage:'PLAYOFFS',round:'결승',home:semi[0].winner ?? '',away:semi[1].winner ?? '',bestOf:5,status:'예정'}],history:['결승 대진 확정',...state.history]}
    }
    if(final&&final.status==='종료'){
      return {...state,stage:'OFFSEASON',champion:final.winner ?? '',history:['2026 LCK CL 우승팀 · '+(final.winner ?? '미정'),...state.history]}
    }
  }
  return state
}
function progressDate(input:Save):Save {
  let state=transition(input)
  if(state.stage==='OFFSEASON')return state
  const pending=state.matches.filter(match=>match.stage===state.stage&&match.status==='예정')
  if(!pending.length)return transition(state)
  const date=pending.map(match=>match.date).sort()[0]
  const matches=state.matches.map(match=>match.stage===state.stage&&match.date===date&&match.status==='예정'?simulate(match):match)
  state={...state,matches,lastDate:date,history:[date+' · '+labels[state.stage]+' 경기 결과 처리',...state.history].slice(0,80)}
  return transition(state)
}
function teamName(id:string):string { return teamMap.get(id)?.name ?? id }
function TeamTable({rows,current}:{rows:Row[];current:string}){
  return <div className="cl-table-wrap"><table><thead><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>세트 득실</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id} className={teamMap.get(row.id)?.short===current?'current':''}><td>{index+1}</td><td>{teamName(row.id)}</td><td>{row.played}</td><td>{row.wins}</td><td>{row.losses}</td><td>{row.setDiff>0?'+':''}{row.setDiff}</td></tr>)}</tbody></table></div>
}

export default function AcademyLeague({teamShort}:{teamShort:string}){
  const [state,setState]=useState<Save>(readSave)
  const [tab,setTab]=useState<'roster'|'standings'|'fixtures'|'postseason'>('roster')
  const [selected,setSelected]=useState(teamShort)
  const team=academyTeams.find(item=>item.short===selected) ?? academyTeams[0]
  const allIds=academyTeams.map(item=>item.id)
  const allRows=useMemo(()=>rowsFor(state,allIds,false),[state])
  const challengeRows=useMemo(()=>rowsFor(state,state.challenge,true),[state])
  const trialRows=useMemo(()=>rowsFor(state,state.trial,true),[state])
  const pending=state.matches.filter(match=>match.stage===state.stage&&match.status==='예정')
  const nextDate=pending.map(match=>match.date).sort()[0]
  const currentMatches=state.matches.filter(match=>match.stage===state.stage)
  const completed=currentMatches.filter(match=>match.status==='종료').length
  const progress=Math.round(completed/Math.max(1,currentMatches.length)*100)
  const postseason=state.matches.filter(match=>match.stage==='PLAYIN'||match.stage==='PLAYOFFS')
  const save=(next:Save)=>{setState(next);localStorage.setItem(KEY,JSON.stringify(next))}
  const advance=()=>save(progressDate(state))
  const reset=()=>{if(window.confirm('2군 CL 커리어 진행을 모두 초기화할까요?'))save(firstState())}
  const tabs:[string,string][]=[['roster','2군 선수단'],['standings','CL 순위'],['fixtures','일정·결과'],['postseason','플레이-인·PO']]
  return <div className="academy-page">
    <header className="academy-header">
      <div><span>2026 LCK CHALLENGERS LEAGUE</span><h1>2군 · LCK CL</h1><p>1군과 독립적으로 운영되는 2군 선수단 및 리그 커리어</p></div>
      <div className="academy-current"><small>현재 단계</small><strong>{labels[state.stage]}</strong><span>{state.champion?'우승 '+teamName(state.champion):state.matches.filter(match=>match.status==='종료').length+'경기 완료'}</span></div>
    </header>
    <nav className="academy-tabs">{tabs.map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id as typeof tab)}>{label}</button>)}</nav>
    <div className="academy-continue">
      <div><small>다음 CL 경기일</small><strong>{nextDate ?? (state.stage==='OFFSEASON'?'시즌 종료':'다음 라운드 생성 대기')}</strong><span>{progress}% · 현재 단계 진행도</span></div>
      <div><button disabled={state.stage==='OFFSEASON'} onClick={advance}>다음 경기일 진행 →</button><button className="reset" onClick={reset}>CL 초기화</button></div>
    </div>
    {tab==='roster'&&<section className="cl-roster-section">
      <div className="cl-section-heading"><div><span>ACADEMY DIRECTORY</span><h2>10개 구단 2군 선수단</h2></div><select value={selected} onChange={event=>setSelected(event.target.value)}>{academyTeams.map(item=><option key={item.id} value={item.short}>{item.name}</option>)}</select></div>
      <div className="cl-team-banner"><div><small>FIRST TEAM · {team.firstTeam}</small><h3>{team.name}</h3><p>2군 감독 {team.coach}{team.assistantCoaches.length?' · 코치 '+team.assistantCoaches.join(' · '):''}</p></div><strong>{team.players.filter(player=>player.status==='주전').length}<small>주전</small></strong></div>
      <div className="cl-player-grid">{team.players.map(player=><article key={player.id} className={player.status==='후보'?'substitute':''}><div className="cl-avatar">{player.name.charAt(0)}</div><div className="cl-player-info"><span>{player.role} · {player.status}</span><b>{player.name}</b><small>{player.champions.join(' · ')}</small></div><div className="cl-ratings"><strong>{player.overall}<small>OVR</small></strong><span>POT {player.potential}</span></div></article>)}</div>
      <p className="cl-data-note">{academyRosterNotes} 생년월일과 공개되지 않은 계약 정보는 임의로 만들어 넣지 않았습니다.</p>
    </section>}
    {tab==='standings'&&<section className="cl-standings-section">
      <div className="cl-section-heading"><div><span>REGULAR SEASON</span><h2>CL 그룹 순위</h2><p>R1~2 순위를 기준으로 그룹을 나누고, R1~2의 맞대결 성적을 R3~4에 승계합니다.</p></div></div>
      {state.stage==='R1-2'?<div className="cl-table-panel"><h3>R1~2 전체 순위</h3><TeamTable rows={allRows} current={selected}/></div>:<div className="cl-group-tables"><div className="cl-table-panel"><h3>CHALLENGE GROUP</h3><TeamTable rows={challengeRows} current={selected}/></div><div className="cl-table-panel"><h3>TRIAL GROUP</h3><TeamTable rows={trialRows} current={selected}/></div></div>}
      <div className="cl-format-note"><b>2026 CL 포맷</b><p>R1~2 10개 팀 더블 라운드 로빈 → 상위 5팀 Challenge / 하위 5팀 Trial → R3~4 각 그룹 더블 라운드 로빈 → Challenge 1~4위와 플레이-인 2팀이 플레이오프, Challenge 5위와 Trial 1~3위는 플레이-인 경쟁을 진행합니다.</p></div>
    </section>}
    {tab==='fixtures'&&<section className="cl-fixtures-section">
      <div className="cl-section-heading"><div><span>MATCH CENTER</span><h2>CL 경기 일정 및 결과</h2><p>{labels[state.stage]} · 날짜를 진행하면 해당 날짜의 경기가 한꺼번에 처리됩니다.</p></div></div>
      <div className="cl-fixture-list">{state.matches.filter(match=>match.stage===state.stage).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).map(match=><article key={match.id}><time>{match.date}</time><b>{teamName(match.home)}</b><strong>{match.status==='종료'?match.homeScore+' : '+match.awayScore:'VS'}</strong><b>{teamName(match.away)}</b><small>{match.group??match.round} · BO{match.bestOf}</small></article>)}</div>
    </section>}
    {tab==='postseason'&&<section className="cl-postseason-section">
      <div className="cl-section-heading"><div><span>POSTSEASON</span><h2>플레이-인 · 플레이오프</h2><p>그룹 리그 종료 후 대진이 자동으로 생성되고 경기일 진행에 따라 진출팀이 정해집니다.</p></div></div>
      {postseason.length===0?<div className="cl-empty">R3~4 그룹 리그가 끝나면 플레이-인 대진이 생성됩니다.</div>:<div className="cl-fixture-list">{postseason.map(match=><article key={match.id}><time>{match.date}</time><b>{teamName(match.home)}</b><strong>{match.status==='종료'?match.homeScore+' : '+match.awayScore:'VS'}</strong><b>{teamName(match.away)}</b><small>{match.round} · BO{match.bestOf} {match.winner?' · 승자 '+teamName(match.winner):''}</small></article>)}</div>}
      {state.champion&&<div className="cl-champion"><span>2026 LCK CL CHAMPION</span><strong>{teamName(state.champion)}</strong></div>}
    </section>}
    <footer className="cl-history"><b>최근 CL 결과</b>{state.history.slice(0,5).map((item,index)=><span key={index}>{item}</span>)}</footer>
  </div>
}
