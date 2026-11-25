import { useState } from 'react'
import type { CSSProperties } from 'react'

export type ManagerProfile = {
  name: string
  nationality: string
  age: number
  experience: '신인 감독' | '성과형 감독' | '베테랑 감독'
  tacticalStyle: '밸런스형' | '공격형' | '운영형' | '육성형'
  leadership: number
  tactics: number
  development: number
  draft: number
}

const defaultProfile: ManagerProfile = {
  name: '', nationality: '대한민국', age: 42, experience: '신인 감독', tacticalStyle: '밸런스형',
  leadership: 72, tactics: 72, development: 68, draft: 70,
}

export default function ManagerSetup({onCreate}:{onCreate:(profile:ManagerProfile)=>void}) {
  const [profile,setProfile]=useState<ManagerProfile>(()=>{
    try { return {...defaultProfile,...JSON.parse(localStorage.getItem('lck-manager-profile')||'{}')} } catch { return defaultProfile }
  })
  const [error,setError]=useState('')
  function create() {
    if(profile.name.trim().length<2){setError('감독 이름은 두 글자 이상 입력해 주세요.');return}
    localStorage.setItem('lck-manager-profile',JSON.stringify(profile))
    onCreate({...profile,name:profile.name.trim()})
  }

  function setExperience(value:ManagerProfile['experience']) {
    const presets={
      '신인 감독':{leadership:72,tactics:72,development:68,draft:70},
      '성과형 감독':{leadership:82,tactics:84,development:76,draft:83},
      '베테랑 감독':{leadership:88,tactics:86,development:82,draft:80},
    }[value]
    setProfile(old=>({...old,experience:value,...presets}))
  }

  return <main className="manager-setup-shell">
    <section className="manager-setup-hero">
      <span>NEW CAREER · MANAGER PROFILE</span>
      <h1>감독의 정체성을 만드세요.</h1>
      <p>감독의 경력과 전술 성향은 선수 성장, 밴픽 준비, 언론 압박에 영향을 줍니다.</p>
    </section>
    <section className="manager-setup-panel">
      <div className="manager-fields">
        <label>감독 이름<input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} placeholder="예: 김도현" /></label>
        <label>국적<select value={profile.nationality} onChange={e=>setProfile({...profile,nationality:e.target.value})}><option>대한민국</option><option>중국</option><option>미국</option><option>영국</option><option>캐나다</option><option>덴마크</option></select></label>
        <label>나이<input type="number" min="24" max="70" value={profile.age} onChange={e=>setProfile({...profile,age:Math.max(24,Math.min(70,Number(e.target.value)))})}/></label>
        <label>감독 경력<select value={profile.experience} onChange={e=>setExperience(e.target.value as ManagerProfile['experience'])}><option>신인 감독</option><option>성과형 감독</option><option>베테랑 감독</option></select></label>
        <label>전술 성향<select value={profile.tacticalStyle} onChange={e=>setProfile({...profile,tacticalStyle:e.target.value as ManagerProfile['tacticalStyle']})}><option>밸런스형</option><option>공격형</option><option>운영형</option><option>육성형</option></select></label>
      </div>
      <div className="manager-rating-grid">
        {([
          ['leadership','리더십'],['tactics','전술 이해'],['development','선수 육성'],['draft','밴픽 능력'],
        ] as const).map(([key,label])=><div className="manager-rating" key={key}><span>{label}</span><b>{profile[key]}</b><i><em style={{width:`${profile[key]}%`} as CSSProperties}/></i></div>)}
      </div>
      {error&&<p className="manager-error">{error}</p>}
      <button className="manager-create-button" onClick={create}>구단 선택으로 이동 <span>→</span></button>
    </section>
  </main>
}
