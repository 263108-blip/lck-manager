import { useEffect, useMemo, useState } from 'react'
import type { Standing } from './matchData'
import { readClubRoster } from './ClubManager'

type Series = { id:string; round:string; home:string; away:string; bestOf:5; homeWins:number; awayWins:number; winner?:string; status:'예정'|'종료' }
type Save = { version:number; season:number; series:Series[]; champion?:string; r1Pick?:string; r2Pick?:string }
const KEY='lck-manager-playoffs-2026'
const labels:Record<string,string>={PI1:'플레이-인 1경기',PI2:'플레이-인 2경기',PI3:'플레이-인 최종 진출전',UBR1A:'승자조 1라운드 · 1경기',UBR1B:'승자조 1라운드 · 2경기',LBR1:'패자조 1라운드',UBR2A:'승자조 2라운드 · 1경기',UBR2B:'승자조 2라운드 · 2경기',LBR2:'패자조 2라운드',UBF:'승자조 결승',LBR3:'패자조 3라운드',LBF:'패자조 결승',GF:'최종 결승'}
const makeSeries=(id:string,round:string,home:string,away:string):Series=>({id,round,home,away,bestOf:5,homeWins:0,awayWins:0,status:'예정'})
const readPower=(team:string)=>{const starters=readClubRoster(team).filter(p=>p.status==='주전');return starters.length?starters.reduce((sum,p)=>sum+(p.overall||70),0)/starters.length:72}
const find=(save:Save,id:string)=>save.series.find(s=>s.id===id)
const winner=(save:Save,id:string)=>find(save,id)?.winner??''
const loser=(save:Save,id:string)=>{const s=find(save,id);return s?.winner?(s.winner===s.home?s.away:s.home):''}
const done=(save:Save,id:string)=>find(save,id)?.status==='종료'
const exists=(save:Save,id:string)=>Boolean(find(save,id))
function seeds(table:Standing[]){return {legend:table.filter(t=>t.group==='LEGEND').sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff),rise:table.filter(t=>t.group==='RISE').sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff)}}
function freshSave(table:Standing[]):Save{
 const {legend,rise}=seeds(table)
 if(legend.length!==5||rise.length!==5)return {version:3,season:2026,series:[]}
 return {version:3,season:2026,series:[
  makeSeries('PI1','PI1',legend[4].name,rise[0].name),
  makeSeries('PI2','PI2',rise[1].name,rise[2].name),
 ],r1Pick:'',r2Pick:''}
}
function deriveBracket(input:Save):Save{
 let state={...input,series:[...input.series]}
 if(done(state,'UBR1A')&&done(state,'UBR1B')&&!exists(state,'LBR1')){
  state.series.push(makeSeries('LBR1','LBR1',loser(state,'UBR1A'),loser(state,'UBR1B')))
 }
 if(done(state,'UBR2A')&&done(state,'UBR2B')&&!exists(state,'UBF')){
  state.series.push(makeSeries('UBF','UBF',winner(state,'UBR2A'),winner(state,'UBR2B')))
 }
 if(done(state,'LBR1')&&done(state,'UBR2A')&&done(state,'UBR2B')&&!exists(state,'LBR2')){
  state.series.push(makeSeries('LBR2','LBR2',winner(state,'LBR1'),loser(state,'UBR2B')))
 }
 if(done(state,'LBR2')&&done(state,'UBR2A')&&done(state,'UBR2B')&&!exists(state,'LBR3')){
  state.series.push(makeSeries('LBR3','LBR3',winner(state,'LBR2'),loser(state,'UBR2A')))
 }
 if(done(state,'LBR3')&&done(state,'UBF')&&!exists(state,'LBF')){
  state.series.push(makeSeries('LBF','LBF',winner(state,'LBR3'),loser(state,'UBF')))
 }
 if(done(state,'LBF')&&done(state,'UBF')&&!exists(state,'GF')){
  state.series.push(makeSeries('GF','GF',winner(state,'UBF'),winner(state,'LBF')))
 }
 if(done(state,'GF'))state.champion=winner(state,'GF')
 return state
}
function simulate(game:Series):Series{
 const chance=Math.max(.18,Math.min(.82,.5+(readPower(game.home)-readPower(game.away))*.018))
 let homeWins=0,awayWins=0
 for(let i=0;i<game.bestOf&&homeWins<3&&awayWins<3;i++){if(Math.random()<chance)homeWins++;else awayWins++}
 return {...game,homeWins,awayWins,winner:homeWins>awayWins?game.home:game.away,status:'종료'}
}
export default function Playoffs({standings,myTeam,ready=false}:{standings:Standing[];myTeam:string;ready?:boolean}){
 const [save,setSave]=useState<Save>(()=>{try{const raw=localStorage.getItem(KEY);if(!raw)return ready?freshSave(standings):{version:3,season:2026,series:[]};const old=JSON.parse(raw) as Save;return old.version===3?old:(ready?freshSave(standings):{version:3,season:2026,series:[]})}catch{return ready?freshSave(standings):{version:3,season:2026,series:[]}}})
 useEffect(()=>{if(ready&&!save.series.length&&standings.some(t=>t.group==='LEGEND'))setSave(freshSave(standings))},[ready,standings,save.series.length])
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(save))},[save])
 const {legend,rise}=useMemo(()=>seeds(standings),[standings])
 const progress=Math.round(save.series.filter(s=>s.status==='종료').length/13*100)
 function pickR1(){
  if(!done(save,'PI3'))return
  const a=winner(save,'PI1'),b=winner(save,'PI3')
  const selected=save.r1Pick===a||save.r1Pick===b?save.r1Pick:a
  const other=selected===a?b:a
  setSave(current=>({...current,r1Pick:selected,series:[...current.series,makeSeries('UBR1A','UBR1A',legend[2].name,selected),makeSeries('UBR1B','UBR1B',legend[3].name,other)]}))
 }
 function pickR2(){
  if(!done(save,'UBR1A')||!done(save,'UBR1B'))return
  const a=winner(save,'UBR1A'),b=winner(save,'UBR1B')
  const selected=save.r2Pick===a||save.r2Pick===b?save.r2Pick:a
  const other=selected===a?b:a
  const next={...save,r2Pick:selected,series:[...save.series,makeSeries('UBR2A','UBR2A',legend[0].name,selected),makeSeries('UBR2B','UBR2B',legend[1].name,other)]}
  setSave(deriveBracket(next))
 }
 function play(id:string){
  setSave(current=>{
   const target=find(current,id)
   if(!target||target.status==='종료')return current
   const simulated=simulate(target)
   const updated={...current,series:current.series.map(s=>s.id===id?simulated:s)}
   if(id==='PI1'&&done(updated,'PI2')&&!exists(updated,'PI3')){
    updated.series.push(makeSeries('PI3','PI3',loser(updated,'PI1'),winner(updated,'PI2')))
   }
   if(id==='PI2'&&done(updated,'PI1')&&!exists(updated,'PI3')){
    updated.series.push(makeSeries('PI3','PI3',loser(updated,'PI1'),winner(updated,'PI2')))
   }
   return deriveBracket(updated)
  })
 }
 function reset(){if(!ready||!window.confirm('2026 LCK 플레이-인과 플레이오프 결과를 초기화할까요?'))return;setSave(freshSave(standings))}
 const groups=[
  {title:'플레이-인 · BO5',ids:['PI1','PI2','PI3']},
  {title:'승자조 1라운드 · BO5',ids:['UBR1A','UBR1B']},
  {title:'패자조 1라운드 · BO5',ids:['LBR1']},
  {title:'승자조 2라운드 · BO5',ids:['UBR2A','UBR2B']},
  {title:'패자조 2~3라운드 · BO5',ids:['LBR2','LBR3']},
  {title:'승자조 결승 · BO5',ids:['UBF']},
  {title:'패자조 결승 · BO5',ids:['LBF']},
  {title:'최종 결승 · BO5',ids:['GF']},
 ]
 const byId=new Map(save.series.map(s=>[s.id,s]))
 return <div className="playoffs-page">
  <header className="playoffs-header"><div><span>2026 LCK POSTSEASON</span><h1>플레이-인 · 더블 엘리미네이션</h1><p>4팀 플레이-인으로 2팀을 선발하고, 6팀 더블 엘리미네이션으로 우승팀을 결정합니다.</p></div><div className="playoffs-status"><small>FORMAT</small><strong>BO5 · 2패 탈락</strong><span>{save.champion?'우승 확정':progress+'% 진행'}</span></div></header>
  <div className="playoffs-seeding-grid">
   <section className="playoffs-seeds"><h2>LEGEND GROUP</h2>{legend.map((t,i)=><div className={t.name===myTeam?'my-seed':''} key={t.name}><b>{i+1}</b><strong>{t.name}</strong><span>{t.wins}승 {t.losses}패</span>{i<2&&<small>승자조 2R 직행</small>}{i===2&&<small>승자조 1R</small>}</div>)}</section>
   <section className="playoffs-seeds rise-seeds"><h2>RISE GROUP</h2>{rise.map((t,i)=><div className={t.name===myTeam?'my-seed':''} key={t.name}><b>{i+1}</b><strong>{t.name}</strong><span>{t.wins}승 {t.losses}패</span>{i<3&&<small>플레이-인</small>}</div>)}</section>
  </div>
  {!ready?<div className="playoffs-waiting">R3~4 그룹 리그가 종료되면 플레이-인 대진이 생성됩니다.</div>:!save.series.length?<div className="playoffs-waiting">최종 그룹 순위를 확인해 대진을 준비하고 있습니다.</div>:<>
   {done(save,'PI3')&&!exists(save,'UBR1A')&&<section className="playoffs-choice-panel"><div><small>LEGEND GROUP 3위 팀</small><b>승자조 1라운드 상대 선택</b><select value={save.r1Pick??''} onChange={e=>setSave(current=>({...current,r1Pick:e.target.value}))}><option value="">상대팀 선택</option>{[winner(save,'PI1'),winner(save,'PI3')].filter(Boolean).map(t=><option key={t} value={t}>{t}</option>)}</select><button onClick={pickR1}>상대 선택 확정</button></div></section>}
   {done(save,'UBR1A')&&done(save,'UBR1B')&&!exists(save,'UBR2A')&&<section className="playoffs-choice-panel"><div><small>LEGEND GROUP 1위 팀</small><b>승자조 2라운드 상대 선택</b><select value={save.r2Pick??''} onChange={e=>setSave(current=>({...current,r2Pick:e.target.value}))}><option value="">상대팀 선택</option>{[winner(save,'UBR1A'),winner(save,'UBR1B')].filter(Boolean).map(t=><option key={t} value={t}>{t}</option>)}</select><button onClick={pickR2}>상대 선택 확정</button></div></section>}
   <section className="playoffs-bracket"><h2>더블 엘리미네이션 대진표</h2><div className="playoffs-rounds">{groups.map(group=><div className="playoffs-round" key={group.title}><h3>{group.title}</h3>{group.ids.map(id=>{const item=byId.get(id);return item?<article className="playoff-series" key={id}><div className="playoff-series-meta">{labels[id]} · {item.status}</div><div className={item.winner===item.home?'series-winner':''}><strong>{item.home}</strong><b>{item.homeWins}</b></div><div className={item.winner===item.away?'series-winner':''}><strong>{item.away}</strong><b>{item.awayWins}</b></div>{item.status==='예정'&&<button onClick={()=>play(id)}>경기 진행</button>}{item.winner&&<small>승리 · {item.winner}</small>}</article>:<article className="playoff-series waiting" key={id}><div className="playoff-series-meta">{labels[id]} · 대진 대기</div><span>이전 라운드 결과를 기다리는 중</span></article>})}</div>)}</div></section>
  </>}
  {save.champion&&<div className="playoffs-champion"><span>2026 LCK CHAMPION</span><strong>{save.champion}</strong><p>더블 엘리미네이션 최종 우승팀입니다.</p></div>}
  <div className="playoffs-foot"><span>현재 구단: {myTeam}</span><button onClick={reset}>플레이오프 초기화</button></div>
 </div>
}
