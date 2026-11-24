import { useEffect, useState } from 'react'

export type Group = 'LEGEND' | 'RISE'
export type Match = {
  id:number
  date:string
  time:string
  home:string
  away:string
  status:'예정'|'종료'
  homeScore?:number
  awayScore?:number
  stage?:'R1-2'|'R3-4'
  group?:Group
  round?:string
}
export const teams=['T1','GEN.G','HLE','DK','KT','DRX','BNK FEARX','NS','BRO','DN']
const STORAGE_KEY='lck-manager-matches-2026'
const UPDATE_EVENT='lck-matches-updated'
const dateKey=(date:Date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')
function shiftDate(date:string,days:number){
  const value=new Date(date+'T00:00:00')
  value.setDate(value.getDate()+days)
  return dateKey(value)
}
function buildSeasonFixtures():Match[] {
  const rotation=[...teams]
  const firstHalf:{home:string;away:string}[][]=[]
  for(let round=0;round<9;round++){
    const games:{home:string;away:string}[]=[]
    for(let i=0;i<5;i++){
      const a=rotation[i],b=rotation[9-i]
      games.push(round%2===0?{home:a,away:b}:{home:b,away:a})
    }
    firstHalf.push(games)
    const fixed=rotation[0]
    const rest=rotation.slice(1)
    rest.unshift(rest.pop()!)
    rotation.splice(0,rotation.length,fixed,...rest)
  }
  const fixtures:Match[]=[]
  let id=1
  const start=new Date(2026,0,14)
  for(let round=0;round<18;round++){
    const reverse=round>=9
    const games=firstHalf[round%9]
    games.forEach((game,index)=>{
      const date=new Date(start)
      date.setDate(start.getDate()+round*7+Math.floor(index/3))
      fixtures.push({
        id:id++,
        date:dateKey(date),
        time:['14:00','17:00','19:00'][index%3],
        home:reverse?game.away:game.home,
        away:reverse?game.home:game.away,
        status:'예정',
        stage:'R1-2',
        round:'R'+(round+1),
      })
    })
  }
  return fixtures
}
function buildGroupFixtures(ids:string[],group:Group):Match[]{
  const pool:(string|null)[]=[...ids]
  if(pool.length%2===1)pool.push(null)
  const rounds:Array<Array<[string,string]>>=[]
  for(let round=0;round<pool.length-1;round++){
    const games:Array<[string,string]>=[]
    for(let i=0;i<pool.length/2;i++){
      const home=pool[i],away=pool[pool.length-1-i]
      if(home&&away)games.push(round%2===0?[home,away]:[away,home])
    }
    rounds.push(games)
    const fixed=pool[0]
    const rest=pool.slice(1)
    rest.unshift(rest.pop()??null)
    pool.splice(0,pool.length,fixed,...rest)
  }
  const first:Match[]=[]
  rounds.forEach((games,round)=>games.forEach((pair,index)=>first.push({
    id:1000+(group==='LEGEND'?0:100)+(round*10)+index,
    date:shiftDate('2026-07-29',round*3+Math.floor(index/2)),
    time:index%2===0?'17:00':'19:00',
    home:pair[0],
    away:pair[1],
    status:'予定',
    stage:'R3-4',
    group,
    round:'R'+(round+1),
  })))
  const reverse=first.map((match,index)=>({
    ...match,
    id:2000+(group==='LEGEND'?0:100)+(index),
    date:shiftDate(match.date,15),
    time:match.time,
    home:match.away,
    away:match.home,
    round:'R'+(Number(match.round?.slice(1))+rounds.length),
  }))
  return [...first,...reverse]
}
export const initialMatches=buildSeasonFixtures()

function calculateTable(matches:Match[],include:(match:Match)=>boolean){
  const table:Record<string,{name:string;played:number;wins:number;losses:number;setWins:number;setLosses:number;setDiff:number;winRate:number}>={}
  teams.forEach(name=>table[name]={name,played:0,wins:0,losses:0,setWins:0,setLosses:0,setDiff:0,winRate:0})
  matches.forEach(match=>{
    if(!include(match)||match.status!=='종료'||match.homeScore===undefined||match.awayScore===undefined)return
    const home=table[match.home],away=table[match.away]
    if(!home||!away)return
    home.played++;away.played++
    home.setWins+=match.homeScore;home.setLosses+=match.awayScore
    away.setWins+=match.awayScore;away.setLosses+=match.homeScore
    if(match.homeScore>match.awayScore){home.wins++;away.losses++}
    else if(match.awayScore>match.homeScore){away.wins++;home.losses++}
  })
  return Object.values(table).map(team=>({...team,setDiff:team.setWins-team.setLosses,winRate:team.played?Math.round(team.wins/team.played*100):0}))
    .sort((a,b)=>b.wins-a.wins||b.setDiff-a.setDiff||b.setWins-a.setWins||a.name.localeCompare(b.name))
}
function ensureGroupStage(matches:Match[]):Match[]{
  if(matches.some(match=>match.stage==='R3-4'))return matches
  const firstStage=matches.filter(match=>match.stage!=='R3-4')
  if(firstStage.length<90||!firstStage.every(match=>match.status==='종료'))return matches
  const ranking=calculateTable(firstStage,()=>true)
  const legend=ranking.slice(0,5).map(row=>row.name)
  const rise=ranking.slice(5).map(row=>row.name)
  return [...matches,...buildGroupFixtures(legend,'LEGEND'),...buildGroupFixtures(rise,'RISE')]
}

export function loadMatches():Match[] {
  try {
    const saved=localStorage.getItem(STORAGE_KEY)
    if(!saved)return initialMatches
    const parsed=JSON.parse(saved) as Match[]
    const byId=new Map(parsed.map(match=>[match.id,match]))
    const initialIds=new Set(initialMatches.map(match=>match.id))
    const merged=initialMatches.map(match=>byId.get(match.id)??match)
    const extra=parsed.filter(match=>!initialIds.has(match.id))
    return ensureGroupStage([...merged,...extra])
  } catch { return initialMatches }
}
export function saveMatches(matches:Match[]) {
  const updated=ensureGroupStage(matches)
  localStorage.setItem(STORAGE_KEY,JSON.stringify(updated))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}
export function useLeagueMatches() {
  const [matches,setMatches]=useState<Match[]>(loadMatches)
  useEffect(()=>{
    const refresh=()=>setMatches(loadMatches())
    window.addEventListener(UPDATE_EVENT,refresh)
    window.addEventListener('storage',refresh)
    return()=>{window.removeEventListener(UPDATE_EVENT,refresh);window.removeEventListener('storage',refresh)}
  },[])
  return matches
}
export type Standing={
  name:string;played:number;wins:number;losses:number;setWins:number;setLosses:number;setDiff:number;winRate:number;group?:Group
}
export function buildStandings(matches:Match[]):Standing[] {
  const hasGroups=matches.some(match=>match.stage==='R3-4')
  if(!hasGroups)return calculateTable(matches,match=>match.stage!=='R3-4')
  const firstStage=matches.filter(match=>match.stage!=='R3-4')
  const seed=calculateTable(firstStage,()=>true)
  const legend=new Set(seed.slice(0,5).map(row=>row.name))
  const rise=new Set(seed.slice(5).map(row=>row.name))
  const relevant=matches.filter(match=>{
    if(match.stage==='R3-4')return true
    return (legend.has(match.home)&&legend.has(match.away))||(rise.has(match.home)&&rise.has(match.away))
  })
  return calculateTable(relevant,()=>true).map(row=>({...row,group:legend.has(row.name)?'LEGEND':'RISE'}))
    .sort((a,b)=>(a.group===b.group?0:a.group==='LEGEND'?-1:1)||b.wins-a.wins||b.setDiff-a.setDiff||a.name.localeCompare(b.name))
}
