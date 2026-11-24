import { useMemo, useState } from 'react'
import { readClubRoster } from './ClubManager'
import './LCKCup.css'

type CupStage='GROUP'|'PLAYIN'|'PLAYOFFS'|'FINISHED'
type CupMatch={
 id:string;date:string;stage:CupStage;round:string;home:string;away:string;bestOf:3|5;
 homeScore?:number;awayScore?:number;winner?:string;status:'예정'|'종료'
}
type CupSave={version:number;stage:CupStage;matches:CupMatch[];winnerGroup?:string;loserGroup?:string;playoffWinner?:string;qualified:string[];history:string[]}
type TeamRow={team:string;played:number;wins:number;losses:number;setsFor:number;setsAgainst:number;setDiff:number;points:number}
const KEY='lck-cup-2026-v1'
const groups={BARON:['GEN.G','T1','NS','DN','BRO'],ELDER:['HLE','DK','KT','BNK FEARX','DRX']}
const dateFor=(round:number)=>['2026-01-14','2026-01-18','2026-01-22','2026-01-26','2026-02-01'][round]
function makeGroupMatches():CupMatch[]{
 const matches:CupMatch[]=[]
 for(let round=0;round<4;round++){
  groups.BARON.forEach((home,index)=>{
   const away=groups.ELDER[(index+round+1)%5]
   matches.push({id:'cup-group-'+round+'-'+index,date:dateFor(round),stage:'GROUP',round:'GROUP '+(round+1),home,away,bestOf:3,status:'예정'})
  })
 }
 groups.BARON.forEach((home,index)=>{
  const away=groups.ELDER[index]
  matches.push({id:'cup-super-'+index,date:dateFor(4),stage:'GROUP',round:'SUPER WEEK',home,away,bestOf:5,status:'예정'})
 })
 return matches
}
function initialSave():CupSave{return {version:1,stage:'GROUP',matches:makeGroupMatches(),qualified:[],history:['2026 LCK Cup · Group Battle 시작']}}
function readSave():CupSave{
 try{const raw=localStorage.getItem(KEY);if(!raw)return initialSave();const parsed=JSON.parse(raw) as CupSave;return parsed.version===1&&Array.isArray(parsed.matches)?parsed:initialSave()}catch{return initialSave()}
}
function power(team:string){const starters=readClubRoster(team).filter(player=>player.status==='주전');return starters.length?starters.reduce((sum,p)=>sum+p.overall,0)/starters.length:70}
function simulate(match:CupMatch):CupMatch{
 const p=Math.max(.18,Math.min(.82,.5+(power(match.home)-power(match.away))*.018))
 const need=Math.ceil(match.bestOf/2)
 let homeScore=0,awayScore=0
 for(let i=0;i<match.bestOf&&homeScore<need&&awayScore<need;i++){
  if(Math.random()<p)homeScore++;else awayScore++
 }
 return {...match,homeScore,awayScore,winner:homeScore>awayScore?match.home:match.away,status:'종료'}
}
function groupRows(save:CupSave,group:'BARON'|'ELDER'):TeamRow[]{
 return groups[group].map(team=>{
  const matches=save.matches.filter(m=>m.stage==='GROUP'&&m.status==='종료'&&(m.home===team||m.away===team))
  const row:TeamRow={team,played:matches.length,wins:0,losses:0,setsFor:0,setsAgainst:0,setDiff:0,points:0}
  matches.forEach(m=>{
   const isHome=m.home===team
   const teamScore=isHome?m.homeScore??0:m.awayScore??0
   const opponentScore=isHome?m.awayScore??0:m.homeScore??0
   row.setsFor+=teamScore;row.setsAgainst+=opponentScore
   if(teamScore>opponentScore){row.wins++;row.points+=m.bestOf===5?2:1}else row.losses++
  })
  row.setDiff=row.setsFor-row.setsAgainst
  return row
 }).sort((a,b)=>b.wins-a.wins||b.points-a.points||b.setDiff-a.setDiff||b.setsFor-a.setsFor)
}
const newMatch=(id:string,round:string,home:string,away:string,date:string,bestOf:3|5=5):CupMatch=>({id,round,home,away,date,bestOf,stage:'PLAYIN',status:'예정'})
const newPlayoff=(id:string,round:string,home:string,away:string):CupMatch=>({id,round,home,away,date:'2026-02-12',bestOf:5,stage:'PLAYOFFS',status:'예정'})
function winner(save:CupSave,id:string){return save.matches.find(m=>m.id===id)?.winner??''}
function loser(save:CupSave,id:string){const m=save.matches.find(m=>m.id===id);return m?.winner?(m.winner===m.home?m.away:m.home):''}
function done(save:CupSave,id:string){return save.matches.some(m=>m.id===id&&m.status==='종료')}
function exists(save:CupSave,id:string){return save.matches.some(m=>m.id===id)}
function advanceBrackets(input:CupSave):CupSave{
 let save={...input,matches:[...input.matches]}
 if(save.stage==='GROUP'&&save.matches.filter(m=>m.stage==='GROUP').every(m=>m.status==='종료')){
  const baron=groupRows(save,'BARON'),elder=groupRows(save,'ELDER')
  const baronPts=baron.reduce((s,r)=>s+r.points,0),elderPts=elder.reduce((s,r)=>s+r.points,0)
  const winnerGroup=baronPts>=elderPts?'BARON':'ELDER'
  const loserGroup=winnerGroup==='BARON'?'ELDER':'BARON'
  const winningRows=winnerGroup==='BARON'?baron:elder
  const losingRows=loserGroup==='BARON'?baron:elder
  const playinTeams=[...winningRows.slice(2,5),...losingRows.slice(1,4)]
  const ranked=[...playinTeams].sort((a,b)=>b.wins-a.wins||b.points-a.points||b.setDiff-a.setDiff)
  const matches=[
   newMatch('cup-pi-r1a','PLAY-IN R1',ranked[5].team,ranked[4].team,'2026-02-06'),
   newMatch('cup-pi-r1b','PLAY-IN R1',ranked[3].team,ranked[2].team,'2026-02-06'),
  ]
  return {...save,stage:'PLAYIN',winnerGroup,loserGroup,matches:[...save.matches,...matches],history:['Group Battle 종료 · '+winnerGroup+' 승자 그룹 · '+loserGroup+' 패자 그룹',...save.history]}
 }
 if(save.stage==='PLAYIN'&&done(save,'cup-pi-r1a')&&done(save,'cup-pi-r1b')&&!exists(save,'cup-pi-r2a')){
  const winningRows=save.winnerGroup==='BARON'?groupRows(save,'BARON'):groupRows(save,'ELDER')
  const losingRows=save.loserGroup==='BARON'?groupRows(save,'BARON'):groupRows(save,'ELDER')
  const playinTeams=[...winningRows.slice(2,5),...losingRows.slice(1,4)].sort((a,b)=>b.wins-a.wins||b.points-a.points||b.setDiff-a.setDiff)
  const byeA=playinTeams[0].team,byeB=playinTeams[1].team
  save.matches.push(
   newMatch('cup-pi-r2a','PLAY-IN R2',byeA,winner(save,'cup-pi-r1b'),'2026-02-07'),
   newMatch('cup-pi-r2b','PLAY-IN R2',byeB,winner(save,'cup-pi-r1a'),'2026-02-07')
  )
 }
 if(save.stage==='PLAYIN'&&done(save,'cup-pi-r2a')&&done(save,'cup-pi-r2b')&&!exists(save,'cup-pi-final')){
  save.matches.push(newMatch('cup-pi-final','PLAY-IN FINAL',loser(save,'cup-pi-r2a'),loser(save,'cup-pi-r2b'),'2026-02-08'))
 }
 if(save.stage==='PLAYIN'&&done(save,'cup-pi-final')&&!exists(save,'cup-ubr1a')){
  const winRows=save.winnerGroup==='BARON'?groupRows(save,'BARON'):groupRows(save,'ELDER')
  const loseRows=save.loserGroup==='BARON'?groupRows(save,'BARON'):groupRows(save,'ELDER')
  const playinQualifiers=[winner(save,'cup-pi-r2a'),winner(save,'cup-pi-r2b'),winner(save,'cup-pi-final')]
  save.qualified=[winRows[0].team,winRows[1].team,loseRows[0].team,...playinQualifiers]
  save.stage='PLAYOFFS'
  save.matches.push(
   newPlayoff('cup-ubr1a','UPPER R1',loseRows[0].team,playinQualifiers[2]),
   newPlayoff('cup-ubr1b','UPPER R1',playinQualifiers[0],playinQualifiers[1])
  )
  save.history=['플레이-인 종료 · 6팀 플레이오프 진출 확정',...save.history]
 }
 if(save.stage==='PLAYOFFS'&&done(save,'cup-ubr1a')&&done(save,'cup-ubr1b')&&!exists(save,'cup-ubr2a')){
  const winRows=save.winnerGroup==='BARON'?groupRows(save,'BARON'):groupRows(save,'ELDER')
  save.matches.push(
   newPlayoff('cup-ubr2a','UPPER R2',winRows[0].team,winner(save,'cup-ubr1b')),
   newPlayoff('cup-ubr2b','UPPER R2',winRows[1].team,winner(save,'cup-ubr1a')),
   newPlayoff('cup-lbr1','LOWER R1',loser(save,'cup-ubr1a'),loser(save,'cup-ubr1b'))
  )
 }
 if(save.stage==='PLAYOFFS'&&done(save,'cup-ubr2a')&&done(save,'cup-ubr2b')&&done(save,'cup-lbr1')&&!exists(save,'cup-lbr2')){
  save.matches.push(
   newPlayoff('cup-ubf','UPPER FINAL',winner(save,'cup-ubr2a'),winner(save,'cup-ubr2b')),
   newPlayoff('cup-lbr2','LOWER R2',winner(save,'cup-lbr1'),loser(save,'cup-ubr2b'))
  )
 }
 if(save.stage==='PLAYOFFS'&&done(save,'cup-lbr2')&&done(save,'cup-ubr2a')&&!exists(save,'cup-lbr3')){
  save.matches.push(newPlayoff('cup-lbr3','LOWER R3',winner(save,'cup-lbr2'),loser(save,'cup-ubr2a')))
 }
 if(save.stage==='PLAYOFFS'&&done(save,'cup-lbr3')&&done(save,'cup-ubf')&&!exists(save,'cup-lbf')){
  save.matches.push(newPlayoff('cup-lbf','LOWER FINAL',winner(save,'cup-lbr3'),loser(save,'cup-ubf')))
 }
 if(save.stage==='PLAYOFFS'&&done(save,'cup-lbf')&&done(save,'cup-ubf')&&!exists(save,'cup-gf')){
  save.matches.push(newPlayoff('cup-gf','GRAND FINAL',winner(save,'cup-ubf'),winner(save,'cup-lbf')))
 }
 if(save.stage==='PLAYOFFS'&&done(save,'cup-gf')){
  save.stage='FINISHED';save.playoffWinner=winner(save,'cup-gf')
  save.history=['LCK Cup 2026 우승 · '+save.playoffWinner,...save.history]
 }
 return save
}
export function getNextLckCupDate(currentDate:string):string|undefined{
 try{
  const raw=localStorage.getItem(KEY)
  const save=raw?JSON.parse(raw) as CupSave:initialSave()
  return save.matches.filter(m=>m.status==='예정'&&m.date>currentDate).map(m=>m.date).sort()[0]
 }catch{return undefined}
}
function TeamTable({rows}:{rows:TeamRow[]}){
 return <table><thead><tr><th>순위</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>세트</th><th>포인트</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.team}><td>{i+1}</td><td>{r.team}</td><td>{r.played}</td><td>{r.wins}</td><td>{r.losses}</td><td>{r.setsFor}-{r.setsAgainst}</td><td>{r.points}</td></tr>)}</tbody></table>
}
export default function LCKCup({myTeam}:{myTeam:string}){
 const [save,setSave]=useState<CupSave>(readSave)
 const [tab,setTab]=useState<'overview'|'schedule'|'bracket'>('overview')
 const [selectedDate,setSelectedDate]=useState('')
 const saveNext=(next:CupSave)=>{setSave(next);localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new Event('lck-cup-updated'))}
 const baron=useMemo(()=>groupRows(save,'BARON'),[save])
 const elder=useMemo(()=>groupRows(save,'ELDER'),[save])
 const baronPoints=baron.reduce((s,r)=>s+r.points,0)
 const elderPoints=elder.reduce((s,r)=>s+r.points,0)
 const nextDate=save.matches.filter(m=>m.status==='예정').map(m=>m.date).sort()[0]
 const dayMatches=save.matches.filter(m=>m.date===nextDate&&m.status==='예정')
 const progress=save.matches.filter(m=>m.status==='종료').length
 function playDate(){
  if(!nextDate)return
  let next={...save,matches:save.matches.map(m=>m.date===nextDate&&m.status==='예정'?simulate(m):m),history:[nextDate+' · '+save.matches.filter(m=>m.date===nextDate).length+'경기 결과 반영',...save.history].slice(0,50)}
  next=advanceBrackets(next)
  saveNext(next)
 }
 const upcoming=save.matches.filter(m=>m.stage==='PLAYIN'||m.stage==='PLAYOFFS')
 return <div className="lck-cup-page">
  <header className="lck-cup-header"><div><span>2026 LCK CUP · SPLIT 1</span><h1>Group Battle · First Stand 진출 경쟁</h1><p>Baron/Elder 두 그룹의 교차 대결, Super Week, 플레이-인과 더블 엘리미네이션</p></div><div><small>현재 단계</small><strong>{save.stage==='GROUP'?'GROUP BATTLE':save.stage==='PLAYIN'?'PLAY-IN':save.stage==='PLAYOFFS'?'PLAYOFFS':'FINISHED'}</strong><span>{progress} / {save.matches.length}경기 종료</span></div></header>
  <nav className="lck-cup-tabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>그룹 순위</button><button className={tab==='schedule'?'active':''} onClick={()=>setTab('schedule')}>일정 · 결과</button><button className={tab==='bracket'?'active':''} onClick={()=>setTab('bracket')}>플레이-인 · 플레이오프</button></nav>
  <section className="lck-cup-next"><div><small>다음 경기일</small><strong>{nextDate??'대회 종료'}</strong><span>{dayMatches.length}개 시리즈 · {dayMatches.reduce((s,m)=>s+m.bestOf,0)}게임 최대</span></div><button disabled={!nextDate} onClick={playDate}>다음 경기일 결과 진행 →</button></section>
  {tab==='overview'&&<div className="lck-cup-groups">
   <section><header><span>BARON GROUP</span><strong>{baronPoints}pt</strong></header><TeamTable rows={baron}/></section>
   <section><header><span>ELDER GROUP</span><strong>{elderPoints}pt</strong></header><TeamTable rows={elder}/></section>
   <p className="lck-cup-format-note">BO3 승리 1포인트, Super Week BO5 승리 2포인트. 두 그룹의 합산 포인트를 비교해 승자 그룹과 패자 그룹을 결정합니다. 승자 그룹 1·2위는 플레이오프 2라운드, 패자 그룹 1위는 1라운드에 직행합니다.</p>
  </div>}
  {tab==='schedule'&&<section className="lck-cup-schedule">{save.matches.filter(m=>m.stage==='GROUP').sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).map(m=><article key={m.id}><time>{m.date}</time><b>{m.home}</b><strong>{m.status==='종료'?m.homeScore+' : '+m.awayScore:'VS'}</strong><b>{m.away}</b><small>{m.bestOf===5?'SUPER WEEK · BO5':'GROUP BATTLE · BO3'}</small></article>)}</section>}
  {tab==='bracket'&&<section className="lck-cup-bracket">{save.stage==='GROUP'&&<p>그룹 배틀의 모든 결과가 확정되면 6팀 플레이-인 대진이 생성됩니다.</p>}{upcoming.map(m=><article key={m.id}><small>{m.round} · BO{m.bestOf}</small><b>{m.home}</b><strong>{m.status==='종료'?m.homeScore+' : '+m.awayScore:'VS'}</strong><b>{m.away}</b><span>{m.winner?'승리 · '+m.winner:m.status}</span></article>)}{save.qualified.length>0&&<p>플레이오프 진출 · {save.qualified.join(' · ')}</p>}{save.playoffWinner&&<div className="lck-cup-champion">2026 LCK CUP CHAMPION <strong>{save.playoffWinner}</strong><span>First Stand 진출</span></div>}</section>}
  <footer className="lck-cup-history"><b>최근 대회 기록</b>{save.history.slice(0,6).map((item,index)=><span key={index}>{item}</span>)}</footer>
 </div>
}
