import { useEffect, useMemo, useState } from 'react'
import { academyPool, roleOrder, type PlayerData } from './seasonData'
import { readClubRoster, saveClubRoster } from './ClubManager'

const clKey=(team:string)=>`lck-manager-cl-${team}`
export function readAcademyRoster(team:string):PlayerData[] {
  try { const saved=JSON.parse(localStorage.getItem(clKey(team))||'null'); if(Array.isArray(saved))return saved } catch {}
  const seed=academyPool.filter((_,index)=>roleOrder[index%roleOrder.length]===academyPool[index].role).slice(0,5).map(player=>({...player,id:`${team}-${player.id}`,team,contractStatus:'확정' as const,status:'후보' as const}))
  localStorage.setItem(clKey(team),JSON.stringify(seed));return seed
}

export default function AcademyOffice({teamShort,teamName}:{teamShort:string;teamName:string}) {
  const [mainRoster,setMainRoster]=useState<PlayerData[]>(()=>readClubRoster(teamShort))
  const [clRoster,setClRoster]=useState<PlayerData[]>(()=>readAcademyRoster(teamShort))
  const [role,setRole]=useState('전체')
  const [selectedId,setSelectedId]=useState<string|null>(null)
  const [notice,setNotice]=useState('')

  useEffect(()=>{saveClubRoster(teamShort,mainRoster)},[teamShort,mainRoster])
  useEffect(()=>{localStorage.setItem(clKey(teamShort),JSON.stringify(clRoster))},[clRoster,teamShort])

  const selected=useMemo(()=>[...mainRoster,...clRoster].find(player=>player.id===selectedId)||null,[mainRoster,clRoster,selectedId])
  const visibleCl=clRoster.filter(player=>role==='전체'||player.role===role)

  function moveToFirstTeam(player:PlayerData){
    if(mainRoster.some(item=>item.id===player.id)){setNotice('이미 1군 명단에 등록된 선수입니다.');return}
    const starterCount=mainRoster.filter(item=>item.role===player.role&&item.status==='주전').length
    const promoted={...player,team:teamShort,status:starterCount?'후보' as const:'주전' as const,contractStatus:'확정' as const}
    setMainRoster(prev=>[...prev,promoted]);setClRoster(prev=>prev.filter(item=>item.id!==player.id));setSelectedId(player.id);setNotice(`${player.name} 선수 콜업 완료 · 1군 명단으로 이동했습니다.`)
  }
  function moveToAcademy(player:PlayerData){
    if(clRoster.some(item=>item.id===player.id)){setNotice('이미 CL 명단에 등록된 선수입니다.');return}
    const demoted={...player,team:teamShort,status:'후보' as const,contractStatus:'확정' as const}
    setClRoster(prev=>[...prev,demoted]);setMainRoster(prev=>prev.filter(item=>item.id!==player.id));setSelectedId(player.id);setNotice(`${player.name} 선수 강등 완료 · CL 명단으로 이동했습니다.`)
  }

  return <div className="academy-page">
    <header className="academy-header"><div><span>DEVELOPMENT & SECOND TEAM</span><h1>{teamName} CL 아카데미</h1><p>콜업과 강등, 유망주 성장과 CL 경기 기록을 관리합니다.</p></div><div className="academy-summary"><span>1군</span><b>{mainRoster.length}</b><span>CL</span><b>{clRoster.length}</b></div></header>
    {notice&&<div className="academy-notice"><span>{notice}</span><button onClick={()=>setNotice('')}>확인</button></div>}
    <div className="academy-layout">
      <section className="academy-list"><div className="academy-list-head"><h2>CL 2군 선수단</h2><div>{['전체',...roleOrder].map(item=><button className={role===item?'active':''} key={item} onClick={()=>setRole(item)}>{item}</button>)}</div></div>{visibleCl.map(player=><button className={`academy-player ${selectedId===player.id?'selected':''}`} key={player.id} onClick={()=>setSelectedId(player.id)}><span>{player.role}</span><strong>{player.name}</strong><b>{player.overall}</b><small>잠재력 {player.potential}</small></button>)}</section>
      <aside className="academy-detail">{selected?<><span>PLAYER DEVELOPMENT</span><h2>{selected.name}</h2><p>{selected.role} · 만 {selected.age}세 · 잠재력 {selected.potential}</p><div className="academy-ratings"><div><small>현재 능력</small><strong>{selected.overall}</strong></div><div><small>라인전</small><strong>{selected.lane}</strong></div><div><small>메카닉</small><strong>{selected.mechanics}</strong></div><div><small>운영</small><strong>{selected.macro}</strong></div></div><div className="academy-actions">{clRoster.some(player=>player.id===selected.id)?<button onClick={()=>moveToFirstTeam(selected)}>1군 콜업</button>:<button onClick={()=>moveToAcademy(selected)}>CL로 강등</button>}</div></>:<div className="academy-empty">선수를 선택하세요.</div>}</aside>
    </div>
  </div>
}
