import { useEffect, useMemo, useState } from 'react'
import { readClubRoster } from './ClubManager'
import { roleOrder, seasonClubs, type PlayerData, type Role } from './seasonData'
import './SeasonAwards.css'

type PlayerStats={matches:number;wins:number;losses:number;kills:number;deaths:number;assists:number;mvp:number;cs?:number}
type PlayerEntry=PlayerData & {teamShort:string;stats:PlayerStats}
type RetiredEntry={id:string;name:string;role:string;team:string;age:number;overall:number;retiredDate:string;season:number;mvp:number}
type HallEntry=RetiredEntry & {inductedSeason:number}
type AwardSave={season:number;mvp:string;rookie:string;allPro:Record<Role,string[]>;awardedAt:string}
const defaultStats:PlayerStats={matches:0,wins:0,losses:0,kills:0,deaths:0,assists:0,mvp:0,cs:0}
function readStats():Record<string,PlayerStats>{try{return JSON.parse(localStorage.getItem('lck-player-season-stats-2026')||'{}')}catch{return {}}}
function readHall():HallEntry[]{try{return JSON.parse(localStorage.getItem('lck-manager-hall-of-fame-2026')||'[]')}catch{return []}}
function readRetired():RetiredEntry[]{
 const entries:RetiredEntry[]=[]
 for(const team of seasonClubs){
  try{
   const career=JSON.parse(localStorage.getItem('lck-career-2026-'+team.short)||'{}')
   if(Array.isArray(career.retiredPlayers))entries.push(...career.retiredPlayers)
  }catch{/* A damaged club save must not break the honours page. */}
 }
 return entries.sort((a,b)=>b.season-a.season||b.overall-a.overall)
}
function playerScore(entry:PlayerEntry){
 const s=entry.stats
 const winRate=s.matches?s.wins/s.matches:0
 const kda=(s.kills+s.assists*.65)/Math.max(1,s.deaths)
 return entry.overall*.65+Math.min(8,s.matches*.35)+winRate*5+Math.min(7,kda)+s.mvp*2+Math.min(3,(s.cs??0)/100)
}
function playerLabel(entry:PlayerEntry){return entry.name+' · '+entry.teamShort}
export default function SeasonAwards({currentDate='2026-11-14'}:{currentDate?:string}){
 const [revision,setRevision]=useState(0)
 const [saved,setSaved]=useState<AwardSave|null>(()=>{try{return JSON.parse(localStorage.getItem('lck-manager-season-awards-2026')||'null')}catch{return null}})
 const [hall,setHall]=useState<HallEntry[]>(readHall)
 const [retired,setRetired]=useState<RetiredEntry[]>(readRetired)
 const [tab,setTab]=useState<'awards'|'allpro'|'hall'>('awards')
 useEffect(()=>{
  const refresh=()=>{setRevision(value=>value+1);setHall(readHall());setRetired(readRetired())}
  window.addEventListener('lck-player-stats-updated',refresh)
  window.addEventListener('lck-roster-updated',refresh)
  window.addEventListener('lck-career-updated',refresh)
  window.addEventListener('storage',refresh)
  return ()=>{window.removeEventListener('lck-player-stats-updated',refresh);window.removeEventListener('lck-roster-updated',refresh);window.removeEventListener('lck-career-updated',refresh);window.removeEventListener('storage',refresh)}
 },[])
 const entries=useMemo(()=>{
  const stats=readStats()
  return seasonClubs.flatMap(team=>readClubRoster(team.short).map(player=>({...player,teamShort:team.short,stats:stats[player.name]??defaultStats})))
 },[revision])
 const allPro=useMemo(()=>{
  const result={} as Record<Role,PlayerEntry[]>
  roleOrder.forEach(role=>{result[role]=entries.filter(player=>player.role===role).sort((a,b)=>playerScore(b)-playerScore(a)).slice(0,3)})
  return result
 },[entries])
 const mvp=useMemo(()=>entries.filter(player=>player.stats.matches>0).sort((a,b)=>{
  const aScore=a.stats.mvp*12+a.stats.wins*1.7+a.stats.kills*.2+a.stats.assists*.08-a.stats.deaths*.15
  const bScore=b.stats.mvp*12+b.stats.wins*1.7+b.stats.kills*.2+b.stats.assists*.08-b.stats.deaths*.15
  return bScore-aScore
 })[0],[entries])
 const rookie=useMemo(()=>entries.filter(player=>player.age<=22&&player.stats.matches>0).sort((a,b)=>playerScore(b)-playerScore(a))[0],[entries])
 const gamesRecorded=entries.reduce((sum,player)=>sum+player.stats.matches,0)/10
 const awardSeason=()=>{
  if(!mvp){window.alert('시즌 경기를 완료한 선수가 없어 MVP를 확정할 수 없습니다.');return}
  const value:AwardSave={season:2026,mvp:playerLabel(mvp),rookie:rookie?playerLabel(rookie):'신인 후보 없음',allPro:Object.fromEntries(roleOrder.map(role=>[role,allPro[role].map(playerLabel)])) as Record<Role,string[]>,awardedAt:currentDate}
  localStorage.setItem('lck-manager-season-awards-2026',JSON.stringify(value))
  setSaved(value)
 }
 return <div className="season-awards-page">
  <header className="season-awards-header"><div><span>2026 LCK SEASON HONOURS</span><h1>시즌 시상식 · 명예의 전당</h1><p>저장된 경기 기록과 선수단 평가를 기반으로 시즌 수상자와 올프로 팀을 정리합니다.</p></div><div><small>시즌 종료 날짜</small><strong>{currentDate}</strong></div></header>
  <nav className="season-awards-tabs"><button className={tab==='awards'?'active':''} onClick={()=>setTab('awards')}>시즌 시상식</button><button className={tab==='allpro'?'active':''} onClick={()=>setTab('allpro')}>All-Pro Team</button><button className={tab==='hall'?'active':''} onClick={()=>setTab('hall')}>명예의 전당</button></nav>
  {tab==='awards'&&<section className="season-award-content">
   <div className="season-award-summary"><div><small>선수 경기 기록</small><strong>{Math.round(gamesRecorded)}<em>회</em></strong></div><div><small>시즌 MVP 후보</small><strong>{mvp?.name??'기록 대기'}</strong></div><div><small>신인상 후보</small><strong>{rookie?.name??'기록 대기'}</strong></div></div>
   <div className="season-award-grid">
    <article className="season-award-card featured"><span>PLAYER OF THE YEAR</span><small>2026 SEASON MVP</small><strong>{mvp?.name??'아직 미정'}</strong><p>{mvp?mvp.teamShort+' · '+mvp.role+' · '+mvp.stats.matches+'경기 · '+mvp.stats.mvp+'회 MVP:' :'선수가 경기를 완료하면 실제 플레이 기록으로 후보를 계산합니다.'}</p>{mvp&&<b>KDA {mvp.stats.kills}/{mvp.stats.deaths}/{mvp.stats.assists}</b>}</article>
    <article className="season-award-card"><span>ROOKIE OF THE YEAR</span><small>2026 NEWCOMER</small><strong>{rookie?.name??'아직 미정'}</strong><p>{rookie?rookie.teamShort+' · '+rookie.role+' · 만 '+rookie.age+'세':'만 22세 이하 출전 선수가 생기면 후보를 계산합니다.'}</p></article>
    <article className="season-award-card"><span>COACH OF THE YEAR</span><small>MANAGEMENT AWARD</small><strong>시즌 종료 후 확정</strong><p>승률, 플레이오프 성적, 선수 성장 기록을 통합한 감독 평가가 준비됩니다.</p></article>
   </div>
   <div className="season-award-footer"><div><strong>{saved?'2026 수상 결과 저장 완료':'수상 결과 미확정'}</strong><span>{saved?'확정일 '+saved.awardedAt+' · MVP '+saved.mvp:'실제 경기를 진행한 선수 기록을 모은 뒤 시상식을 확정하세요.'}</span></div><button onClick={awardSeason} disabled={!mvp}>2026 시상식 결과 확정</button></div>
   {saved&&<p className="season-award-note">확정된 결과는 브라우저 저장 데이터에 보존됩니다. 다시 확정하면 현재 시즌 기록으로 갱신됩니다.</p>}
  </section>}
  {tab==='allpro'&&<section className="season-award-content">
   <div className="season-section-heading"><div><span>POSITIONAL HONOURS</span><h2>2026 LCK All-Pro Team</h2><p>포지션별 OVR과 저장된 2026 시즌 성적을 반영한 게임 내 평가입니다.</p></div></div>
   <div className="allpro-list">{roleOrder.map(role=><article className="allpro-role" key={role}><header><b>{role}</b><span>{role==='TOP'?'TOP':role==='JNG'?'JUNGLE':role==='MID'?'MID':role==='ADC'?'BOT LANE':'SUPPORT'}</span></header>{allPro[role].map((player,index)=><div className="allpro-player" key={player.id}><strong>{index+1}</strong><div><b>{player.name}</b><small>{player.teamShort} · {player.stats.matches}경기 · {player.stats.wins}승</small></div><span>{Math.round(playerScore(player))}<small>평가</small></span></div>)}</article>)}</div>
  </section>}
  {tab==='hall'&&<section className="season-award-content">
   <div className="season-section-heading"><div><span>LEGACY ARCHIVE</span><h2>명예의 전당 · 은퇴 선수</h2><p>은퇴 처리된 선수는 구단 기록에 남고, 기준을 충족한 선수는 명예의 전당에 헌액됩니다.</p></div></div>
   <div className="hall-grid"><section><h3>명예의 전당</h3>{hall.length?hall.map(player=><article className="hall-player" key={player.id}><span>HALL OF FAME · {player.inductedSeason}</span><strong>{player.name}</strong><small>{player.team} · {player.role} · OVR {player.overall} · 시즌 MVP {player.mvp}회</small></article>):<p className="season-empty">아직 명예의 전당에 헌액된 선수가 없습니다. 은퇴한 선수 중 OVR 95 이상 또는 시즌 MVP 3회 이상인 선수가 자동 헌액됩니다.</p>}</section>
   <section><h3>은퇴 선수 기록</h3>{retired.length?retired.map(player=><article className="hall-player retired" key={player.id}><span>RETIRED · {player.retiredDate}</span><strong>{player.name}</strong><small>{player.team} · {player.role} · 은퇴 당시 OVR {player.overall}</small></article>):<p className="season-empty">은퇴 처리된 선수가 아직 없습니다. 선수 프로필의 은퇴 처리 버튼을 사용하면 이곳에 기록됩니다.</p>}</section></div>
  </section>}
  <p className="season-award-disclaimer">※ OVR·선수 평가는 게임 밸런스용 추정치입니다. 실제 경기 기록은 직접 진행해 저장된 경기만 집계합니다. 신인상은 22세 이하이며 출전 기록이 있는 선수 중에서 계산합니다.</p>
 </div>
}
