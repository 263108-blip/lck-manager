import { useEffect, useMemo, useState } from 'react'

export type InboxMessage = {
  id:string
  title:string
  sender:string
  date:string
  category:'경기'|'이적'|'선수'|'코치'|'재정'|'구단'|'전술'|'시즌'
  priority:'높음'|'보통'|'낮음'
  read:boolean
  body:string
  actionLabel?:string
  actionPage?:string
}

const key='lck-manager-inbox'

export function addInboxMessage(message:Omit<InboxMessage,'id'|'read'>) {
  let messages:InboxMessage[]=[]
  try { messages=JSON.parse(localStorage.getItem(key)||'[]') } catch {}
  const record={...message,id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,read:false}
  localStorage.setItem(key,JSON.stringify([record,...messages].slice(0,100)))
  window.dispatchEvent(new Event('lck-inbox-updated'))
}

function seedInbox():InboxMessage[] {
  return [
    {id:'welcome',title:'새 커리어에 오신 것을 환영합니다',sender:'구단 사무국',date:'2026-11-24',category:'구단',priority:'높음',read:false,body:'프리시즌 기간입니다. 선수단을 확인하고 훈련 계획과 전술을 먼저 점검하세요.',actionLabel:'선수단 열기',actionPage:'선수단'},
    {id:'schedule',title:'2026 정규 시즌 일정이 생성되었습니다',sender:'LCK 운영팀',date:'2026-11-24',category:'경기',priority:'보통',read:false,body:'정규 시즌은 BO3 방식으로 진행되며 상위 6개 구단이 플레이오프에 진출합니다.',actionLabel:'경기 일정 보기',actionPage:'경기 일정'},
  ]
}

export default function Inbox({onChangePage}:{onChangePage:(page:string)=>void}) {
  const [messages,setMessages]=useState<InboxMessage[]>(()=>{
    try { const saved=JSON.parse(localStorage.getItem(key)||'null'); if(Array.isArray(saved)&&saved.length)return saved } catch {}
    const seeded=seedInbox(); localStorage.setItem(key,JSON.stringify(seeded)); return seeded
  })
  const [selectedId,setSelectedId]=useState<string|null>(null)
  const [filter,setFilter]=useState('전체')
  useEffect(()=>{const refresh=()=>{try{setMessages(JSON.parse(localStorage.getItem(key)||'[]'))}catch{setMessages([])}};window.addEventListener('lck-inbox-updated',refresh);return()=>window.removeEventListener('lck-inbox-updated',refresh)},[])
  const filtered=useMemo(()=>messages.filter(message=>filter==='전체'||message.category===filter),[messages,filter])
  const selected=messages.find(message=>message.id===selectedId)||filtered[0]||null

  function openMessage(message:InboxMessage) {
    setSelectedId(message.id)
    if(message.read)return
    const updated=messages.map(item=>item.id===message.id?{...item,read:true}:item)
    setMessages(updated);localStorage.setItem(key,JSON.stringify(updated));window.dispatchEvent(new Event('lck-inbox-updated'))
  }

  function markAllRead(){const updated=messages.map(message=>({...message,read:true}));setMessages(updated);localStorage.setItem(key,JSON.stringify(updated));window.dispatchEvent(new Event('lck-inbox-updated'))}

  return <div className="inbox-page">
    <header className="inbox-header"><div><span>MANAGER OFFICE · INBOX</span><h1>수신함</h1><p>읽지 않은 소식과 중요한 일정 알림을 확인하세요.</p></div><button onClick={markAllRead}>전체 읽음 처리</button></header>
    <div className="inbox-layout">
      <aside className="inbox-list"><div className="inbox-filters">{['전체','경기','이적','선수','코치','재정','구단','시즌'].map(category=><button className={filter===category?'active':''} key={category} onClick={()=>setFilter(category)}>{category}</button>)}</div>{filtered.map(message=><button className={`inbox-row ${message.read?'read':''} ${selected?.id===message.id?'selected':''}`} key={message.id} onClick={()=>openMessage(message)}><i className={`inbox-priority ${message.priority}`}/><div><strong>{message.title}</strong><small>{message.sender} · {message.date}</small></div><b>{message.category}</b></button>)}{filtered.length===0&&<p className="inbox-empty">해당 유형의 메시지가 없습니다.</p>}</aside>
      <section className="inbox-detail">{selected?<><div className="inbox-detail-meta"><span>{selected.category}</span><b className={`priority-${selected.priority}`}>{selected.priority}</b></div><h2>{selected.title}</h2><div className="inbox-meta"><span>{selected.sender}</span><span>{selected.date}</span></div><p>{selected.body}</p>{selected.actionLabel && selected.actionPage ? <button onClick={()=>onChangePage(selected.actionPage as string)}>{selected.actionLabel} →</button> : null}</>:<div className="inbox-empty-detail">메시지를 선택하세요.</div>}</section>
    </div>
  </div>
}
