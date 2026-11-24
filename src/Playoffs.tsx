import { useEffect, useMemo, useState } from 'react'
import type { Standing } from './matchData'
import { readClubRoster } from './ClubManager'

type Series = { id:string; round:string; home:string; away:string; bestOf:3|5; homeWins:number; awayWins:number; winner?:string; status:'예정'|'종료' }
type PlayoffSave = { version:number; series:Series[]; champion?:string; season:number }
const KEY='lck-manager-playoffs-2026'
const readPower=(team:string)=>{
  const roster=readClubRoster(team)
  const starters=roster.filter(p=>p.status==='주전')
  if(!starters.length) return 72
  return starters.reduce((sum,p)=>sum+(p.overall||70),0)/5+(5-starters.length)*8
}
function makeBracket(table:Standing[]):Series[] {
  const seeds=[...table].sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff).slice(0,6)
  if(seeds.length<6) return []
  return [
    {id:'qf1',round:'와일드카드',home:seeds[2].name,away:seeds[5].name,bestOf:3,homeWins:0,awayWins:0,status:'예정'},
    {id:'qf2',round:'와일드카드',home:seeds[3].name,away:seeds[4].name,bestOf:3,homeWins:0,awayWins:0,status:'예정'},
    {id:'sf1',round:'플레이오프 2라운드',home:seeds[0].name,away:'TBD-QF2',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
    {id:'sf2',round:'플레이오프 2라운드',home:seeds[1].name,away:'TBD-QF1',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
    {id:'final',round:'결승',home:'TBD-SF1',away:'TBD-SF2',bestOf:5,homeWins:0,awayWins:0,status:'예정'},
  ]
}
function freshSave(table:Standing[]):PlayoffSave { return {version:1,season:2026,series:makeBracket(table)} }
export default function Playoffs({standings,myTeam}:{standings:Standing[];myTeam:string}) {
  const [save,setSave]=useState<PlayoffSave>(()=>{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):freshSave(standings)}catch{return freshSave(standings)}})
  useEffect(()=>{if(!save.series.length&&standings.length>=6)setSave(freshSave(standings))},[standings,save.series.length])
  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(save))},[save])
  const completed=save.series.every(s=>s.status==='종료')
  const champion=save.champion
  const resolved=useMemo(()=>save.series.map(s=>({...s,
    home:s.home.startsWith('TBD-')?(save.series.find(x=>x.id===s.home.slice(4).toLowerCase())?.winner||'진출팀 대기'):s.home,
    away:s.away.startsWith('TBD-')?(save.series.find(x=>x.id===s.away.slice(4).toLowerCase())?.winner||'진출팀 대기'):s.away,
  })),[save.series])
  function play(id:string) {
    setSave(current=>{
      const series=current.series.map(s=>({...s}))
      const target=series.find(s=>s.id===id)
      if(!target||target.status==='종료')return current
      const resolve=(name:string)=>name.startsWith('TBD-')?(series.find(s=>s.id===name.slice(4).toLowerCase())?.winner||''):name
      const home=resolve(target.home),away=resolve(target.away)
      if(!home||!away||home==='진출팀 대기'||away==='진출팀 대기')return current
      let h=0,a=0
      const targetWins=Math.ceil(target.bestOf/2)
      const diff=readPower(home)-readPower(away)
      for(let game=0;game<target.bestOf&&h<targetWins&&a<targetWins;game++){
        const homeChance=Math.max(.2,Math.min(.8,.5+diff*.018))
        if(Math.random()<homeChance)h++;else a++
      }
      const winner=h>a?home:away
      const updated=series.map(s=>s.id===id?{...s,home,away,homeWins:h,awayWins:a,winner,status:'종료' as const}:s)
      const final=updated.find(s=>s.id==='final')
      const nextChampion=final?.winner
      return {...current,series:updated,champion:nextChampion}
    })
  }
  const roundLabel=['와일드카드','플레이오프 2라운드','결승']
  return <div className="playoffs-page">
    <header className="playoffs-header"><div><span>2026 LCK POSTSEASON</span><h1>플레이오프</h1><p>정규 시즌 상위 6개 팀이 우승을 놓고 경쟁합니다. 상위 2개 팀은 2라운드에 직행합니다.</p></div><div className="playoffs-status">{champion?<><small>2026 CHAMPION</small><strong>{champion}</strong></>:<><small>FORMAT</small><strong>TOP 6 · BO3 / BO5</strong></>}</div></header>
    <section className="playoffs-seeds"><h2>정규 시즌 최종 순위</h2><div>{standings.slice(0,6).map((team,index)=><div className={team.name===myTeam?'my-seed':''} key={team.name}><b>{index+1}</b><strong>{team.name}</strong><span>{team.wins}승 {team.losses}패</span>{index<2&&<small>2라운드 직행</small>}</div>)}</div></section>
    <section className="playoffs-bracket"><h2>토너먼트 대진표</h2><div className="playoffs-rounds">{roundLabel.map(label=><div className="playoffs-round" key={label}><h3>{label}</h3>{resolved.filter(s=>s.round===label).map(s=><article className="playoff-series" key={s.id}><div className="playoff-series-meta">{s.bestOf===3?'BEST OF 3':'BEST OF 5'} · {s.status==='종료'?'종료':'예정'}</div><div className={s.winner===s.home?'series-winner':''}><strong>{s.home}</strong><b>{s.homeWins}</b></div><div className={s.winner===s.away?'series-winner':''}><strong>{s.away}</strong><b>{s.awayWins}</b></div>{s.status==='예정'&&<button disabled={s.home==='진출팀 대기'||s.away==='진출팀 대기'} onClick={()=>play(s.id)}>경기 진행</button>}{s.winner&&<small>승리: {s.winner}</small>}</article>)}</div>)}</div></section>
    {completed&&champion&&<div className="playoffs-champion"><span>2026 LCK CHAMPIONS</span><strong>{champion}</strong><p>2026 시즌 우승팀이 결정되었습니다.</p></div>}
    <div className="playoffs-foot"><span>현재 구단: {myTeam}</span><button onClick={()=>{if(window.confirm('플레이오프 결과를 초기화할까요?'))setSave(freshSave(standings))}}>플레이오프 초기화</button></div>
  </div>
}
