import { useEffect, useMemo, useState } from 'react'
import type { Standing } from './matchData'
import { readClubRoster } from './ClubManager'

type Series = {
  id:string
  round:string
  home:string
  away:string
  bestOf:3|5
  homeWins:number
  awayWins:number
  winner?:string
  status:'예정'|'종료'
}
type Save = {version:number;season:number;series:Series[];champion?:string}
const KEY='lck-manager-playoffs-2026'
const readPower=(team:string)=>{
  const roster=readClubRoster(team)
  const starters=roster.filter(player=>player.status==='주전')
  if(!starters.length)return 72
  return starters.reduce((sum,player)=>sum+(player.overall||70),0)/Math.max(1,starters.length)
}
function makeBracket(table:Standing[]):Series[] {
  const legend=table.filter(team=>team.group==='LEGEND').sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff)
  const rise=table.filter(team=>team.group==='RISE').sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff)
  if(legend.length!==5||rise.length!==5)return []
  return [
    {id:'pi1',round:'플레이-인',home:legend[4].name,away:rise[1].name,bestOf:3,homeWins:0,awayWins:0,status:'예정'},
    {id:'pi2',round:'플레이-인',home:rise[0].name,away:rise[2].name,bestOf:3,homeWins:0,awayWins:0,status:'예정'},
    {id:'r1a',round:'플레이오프 1라운드',home:legend[2].name,away:'TBD-PI2',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
    {id:'r1b',round:'플레이오프 1라운드',home:legend[3].name,away:'TBD-PI1',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
    {id:'sf1',round:'플레이오프 2라운드',home:legend[0].name,away:'TBD-R1B',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
    {id:'sf2',round:'플레이오프 2라운드',home:legend[1].name,away:'TBD-R1A',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
    {id:'final',round:'결승',home:'TBD-SF1',away:'TBD-SF2',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
  ]
}
function freshSave(table:Standing[]):Save{return {version:2,season:2026,series:makeBracket(table)}}
function resolveTeam(value:string,series:Series[]):string {
  if(!value.startsWith('TBD-'))return value
  const id=value.slice(4).toLowerCase()
  return series.find(item=>item.id.toLowerCase()===id)?.winner ?? ''
}
export default function Playoffs({standings,myTeam,ready=false}:{standings:Standing[];myTeam:string;ready?:boolean}){
  const [save,setSave]=useState<Save>(()=>{try{const raw=localStorage.getItem(KEY);if(!raw)return ready?freshSave(standings):{version:2,season:2026,series:[]};const parsed=JSON.parse(raw) as Save;return parsed.version===2?parsed:(ready?freshSave(standings):{version:2,season:2026,series:[]})}catch{return ready?freshSave(standings):{version:2,season:2026,series:[]}}})
  useEffect(()=>{
    if(ready&&!save.series.length&&standings.some(team=>team.group==='LEGEND'))setSave(freshSave(standings))
  },[standings,save.series.length,ready])
  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(save))},[save])
  const resolved=useMemo(()=>save.series.map(item=>({...item,home:resolveTeam(item.home,save.series)||'진출팀 대기',away:resolveTeam(item.away,save.series)||'진출팀 대기'})),[save.series])
  const champion=save.champion
  const complete=save.series.length>0&&save.series.every(item=>item.status==='종료')
  const legend=standings.filter(team=>team.group==='LEGEND').sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff)
  const rise=standings.filter(team=>team.group==='RISE').sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff)
  function play(id:string){
    setSave(current=>{
      const series=current.series.map(item=>({...item}))
      const target=series.find(item=>item.id===id)
      if(!target||target.status==='종료')return current
      const home=resolveTeam(target.home,series),away=resolveTeam(target.away,series)
      if(!home||!away)return current
      const chance=Math.max(.18,Math.min(.82,.5+(readPower(home)-readPower(away))*.018))
      let homeWins=0,awayWins=0
      const needed=Math.ceil(target.bestOf/2)
      for(let game=0;game<target.bestOf&&homeWins<needed&&awayWins<needed;game++){
        if(Math.random()<chance)homeWins++
        else awayWins++
      }
      const winner=homeWins>awayWins?home:away
      const updated=series.map(item=>item.id===id?{...item,home,away,homeWins,awayWins,winner,status:'종료' as const}:item)
      const final=updated.find(item=>item.id==='final')
      return {...current,series:updated,champion:final?.status==='종료'?final.winner:undefined}
    })
  }
  function reset(){
    if(!ready){return}
    if(!window.confirm('2026 LCK 플레이오프 결과를 초기화할까요?'))return
    setSave(freshSave(standings))
  }
  const rounds=['플레이-인','플레이오프 1라운드','플레이오프 2라운드','결승']
  return <div className="playoffs-page">
    <header className="playoffs-header"><div><span>2026 LCK POSTSEASON</span><h1>플레이-인 · 플레이오프</h1><p>LEGEND GROUP 상위 4팀과 플레이-인 통과 2팀이 6팀 플레이오프에 진출합니다.</p></div><div className="playoffs-status"><small>FORMAT</small><strong>2026 · BO3 / BO5</strong></div></header>
    <div className="playoffs-seeding-grid">
      <section className="playoffs-seeds"><h2>LEGEND GROUP</h2>{legend.map((team,index)=><div className={team.name===myTeam?'my-seed':''} key={team.name}><b>{index+1}</b><strong>{team.name}</strong><span>{team.wins}승 {team.losses}패</span>{index<2&&<small>2라운드 직행</small>}</div>)}</section>
      <section className="playoffs-seeds rise-seeds"><h2>RISE GROUP</h2>{rise.map((team,index)=><div className={team.name===myTeam?'my-seed':''} key={team.name}><b>{index+1}</b><strong>{team.name}</strong><span>{team.wins}승 {team.losses}패</span>{index<3&&<small>플레이-인 경쟁</small>}</div>)}</section>
    </div>
    {!save.series.length?<div className="playoffs-waiting">R3~4 그룹 리그가 종료되면 LEGEND 5위와 RISE 1~3위의 플레이-인 대진이 생성됩니다.</div>:<section className="playoffs-bracket"><h2>토너먼트 대진표</h2><div className="playoffs-rounds">{rounds.map(round=><div className="playoffs-round" key={round}><h3>{round}</h3>{resolved.filter(item=>item.round===round).map(item=><article className="playoff-series" key={item.id}><div className="playoff-series-meta">{item.bestOf===3?'BEST OF 3':'BEST OF 5'} · {item.status}</div><div className={item.winner===item.home?'series-winner':''}><strong>{item.home}</strong><b>{item.homeWins}</b></div><div className={item.winner===item.away?'series-winner':''}><strong>{item.away}</strong><b>{item.awayWins}</b></div>{item.status==='예정'&&<button disabled={item.home==='진출팀 대기'||item.away==='진출팀 대기'} onClick={()=>play(item.id)}>경기 진행</button>}{item.winner&&<small>승리: {item.winner}</small>}</article>)}</div>)}</div></section>}
    {complete&&champion&&<div className="playoffs-champion"><span>2026 LCK CHAMPIONS</span><strong>{champion}</strong><p>2026 시즌 우승팀이 결정되었습니다.</p></div>}
    <div className="playoffs-foot"><span>현재 구단: {myTeam}</span><button onClick={reset}>플레이오프 초기화</button></div>
  </div>
}
