import { useEffect, useState } from 'react'

export type Match = {
  id:number
  date:string
  time:string
  home:string
  away:string
  status:'예정'|'종료'
  homeScore?:number
  awayScore?:number
}
export const teams=['T1','GEN.G','HLE','DK','KT','DRX','BNK FEARX','NS','BRO','DN']
const STORAGE_KEY='lck-manager-matches-2027'
const UPDATE_EVENT='lck-matches-updated'

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
  const start=new Date(2027,0,13)
  for(let round=0;round<18;round++){
    const reverse=round>=9
    const games=firstHalf[round%9]
    games.forEach((game,index)=>{
      const date=new Date(start)
      date.setDate(start.getDate()+round*7+Math.floor(index/3))
      fixtures.push({
        id:id++,date:date.toISOString().slice(0,10),
        time:['14:00','17:00','19:00'][index%3],
        home:reverse?game.away:game.home,
        away:reverse?game.home:game.away,
        status:'예정',
      })
    })
  }
  return fixtures
}
export const initialMatches=buildSeasonFixtures()
export function loadMatches():Match[] {
  try {
    const saved=localStorage.getItem(STORAGE_KEY)
    if(!saved)return initialMatches
    const parsed=JSON.parse(saved) as Match[]
    const byId=new Map(parsed.map(match=>[match.id,match]))
    return initialMatches.map(match=>byId.get(match.id)??match)
  } catch { return initialMatches }
}
export function saveMatches(matches:Match[]) {
  localStorage.setItem(STORAGE_KEY,JSON.stringify(matches))
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
  name:string;played:number;wins:number;losses:number;setWins:number;setLosses:number;setDiff:number;winRate:number
}
export function buildStandings(matches:Match[]):Standing[] {
  const table:Record<string,Standing>={}
  teams.forEach(name=>table[name]={name,played:0,wins:0,losses:0,setWins:0,setLosses:0,setDiff:0,winRate:0})
  matches.forEach(match=>{
    if(match.status!=='종료'||match.homeScore===undefined||match.awayScore===undefined)return
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
