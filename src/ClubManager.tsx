import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { academyPool, marketPool, seasonClubs, staffPool, type ClubData, type PlayerData, roleOrder } from './seasonData'
import { ageAtDate, staffByTeam } from './staffData'

export type Club = { name: string; short: string; strength: number; budget: number; difficulty: string; color: string }
export const clubs: Club[] = seasonClubs.map(team => ({
  name: team.name, short: team.short,
  strength: team.players.length ? Math.round(team.players.reduce((sum,p)=>sum+p.overall,0)/team.players.length) : 78,
  budget: team.budget, difficulty: team.reputation >= 95 ? '우승 도전' : team.reputation >= 85 ? '상위권 도전' : '리빌딩',
  color: team.color,
}))
const rosterKey = (short:string) => 'lck-manager-roster-' + short
export function seedRosterForClub(club: Club | ClubData) {
  const data = seasonClubs.find(team=>team.short===club.short)
  return (data?.players ?? []).map(player=>({...player,team:club.name}))
}
export function readClubRoster(short:string) {
  try {
    const raw=localStorage.getItem(rosterKey(short))
    if(raw) return JSON.parse(raw) as PlayerData[]
  } catch {}
  const club=seasonClubs.find(team=>team.short===short)
  return club ? seedRosterForClub(club) : []
}
export function saveClubRoster(short:string, roster:PlayerData[]) {
  localStorage.setItem(rosterKey(short),JSON.stringify(roster))
  let activeShort=''
  try { activeShort=JSON.parse(localStorage.getItem('lck-manager-selected-club')||'{}').short||'' } catch {}
  if(activeShort===short) localStorage.setItem('lck-manager-roster',JSON.stringify(roster))
  window.dispatchEvent(new Event('lck-roster-updated'))
}
export type Staff = {id:string;name:string;realName?:string;birthDate?:string;role:string;rating:number;salary:number;focus:string;sourceNote?:string;age?:number|null}
type Career = {
  budget:number; initialBudget:number; week:number; morale:number; training:string
  sponsorIncome:number; sponsorName:string; transferSpent:number; wageSpent:number
  scoutingBudget:number; scouted:string[]; staff:Staff[]; history:string[]
  signedPlayers:string[]; releasedPlayers:string[]; listedPlayers:string[]; mediaReputation:number; pressure:number
}
const careerKey=(short:string)=>'lck-career-2026-'+short
const baseStaff=(club:ClubData):Staff[]=>staffByTeam[club.short] ?? (club.coach==='미정' ? [] : [{id:'head-'+club.short,name:club.coach,realName:'',role:'감독',rating:club.reputation>=95?90:85,salary:0,focus:'팀 운영·밴픽'}])
const defaultCareer=(club:ClubData):Career=>({
  budget:club.budget,initialBudget:club.budget,week:1,morale:76,training:'균형 훈련',
  sponsorIncome:1.2,sponsorName:'기본 파트너',transferSpent:0,wageSpent:0,
  scoutingBudget:2,scouted:[],staff:baseStaff(club),history:['2026 시즌 LCK 커리어를 시작했습니다.'],
  signedPlayers:[],releasedPlayers:[],listedPlayers:[],mediaReputation:50,pressure:35,
})
const readCareer=(club:ClubData):Career=>{
  const defaults=defaultCareer(club)
  try {
    const raw=localStorage.getItem(careerKey(club.short))
    if(!raw) return defaults
    const saved=JSON.parse(raw) as Partial<Career>
    const savedStaff=Array.isArray(saved.staff)?saved.staff:[]
    const mergedStaff=defaults.staff.map(profile=>{
      const previous=savedStaff.find(item=>item.id===profile.id || item.name===profile.name)
      return previous ? {...profile,...previous,birthDate:profile.birthDate,realName:profile.realName} : profile
    })
    return {...defaults,...saved,staff:mergedStaff} as Career
  } catch { return defaults }
}
const save=(key:string,value:unknown)=>localStorage.setItem(key,JSON.stringify(value))
const money=(n:number)=>'₩'+n.toFixed(1).replace(/\.0$/,'')+'억'
const overall=(p:PlayerData)=>Math.round((p.lane*.22+p.mechanics*.22+p.macro*.20+p.teamfight*.20+p.consistency*.10+p.clutch*.06))

export function readClubStaff(short:string,currentDate:string):Staff[] {
  const team=seasonClubs.find(item=>item.short===short)
  if(!team) return []
  return readCareer(team).staff.map(member=>({...member,age:ageAtDate(member.birthDate,currentDate)}))
}

export function applyMatchResult(club:Club,won:boolean,opponent:string) {
  const data=seasonClubs.find(team=>team.short===club.short)
  if(!data) return
  const career=readCareer(data)
  const prize=won?1.8:0.65
  const updatedRoster=readClubRoster(club.short).map(player=>({...player,morale:Math.max(0,Math.min(100,(player.morale??76)+(won?3:-4)))}))
  saveClubRoster(club.short,updatedRoster)
  save(careerKey(club.short),{
    ...career,budget:Math.max(0,career.budget+prize),morale:Math.max(0,Math.min(100,career.morale+(won?4:-5))),
    history:[opponent+'전 '+(won?'승리':'패배')+' · 경기 수당 '+money(prize)+' 반영',...career.history].slice(0,100),
  })
  window.dispatchEvent(new Event('lck-career-updated'))
}
export function advanceCareerWeek(club:Club) {
  const data=seasonClubs.find(team=>team.short===club.short)
  if(!data) return
  const career=readCareer(data)
  const roster=readClubRoster(club.short)
  const annualPayroll=roster.reduce((sum,p)=>sum+p.salary,0)+career.staff.reduce((sum,s)=>sum+s.salary,0)
  const weeklyPayroll=annualPayroll/52
  const coachAverage=career.staff.length?career.staff.reduce((sum,s)=>sum+s.rating,0)/career.staff.length:65
  const coachBonus=Math.max(0,(coachAverage-75)/100)
  const trained=roster.map(player=>{
    const amount=(player.age<=21?1.05:player.age<=24?.62:.18)+coachBonus*.3
    const next={...player}
    if(career.training==='라인전') next.lane=Math.min(100,next.lane+amount)
    else if(career.training==='개인 기량') next.mechanics=Math.min(100,next.mechanics+amount)
    else if(career.training==='운영') next.macro=Math.min(100,next.macro+amount)
    else if(career.training==='한타') next.teamfight=Math.min(100,next.teamfight+amount)
    else if(career.training==='챔피언 숙련') {
      const masteryGain=Math.round((0.45+coachBonus*.25)*10)/10
      next.champions=player.champions.map(champion=>{
        const name=typeof champion==='string'?champion:champion.name
        const mastery=typeof champion==='string'?0:(champion.mastery??0)
        return {name,mastery:Math.min(100,Math.round((mastery+masteryGain)*10)/10)}
      })
    } else {next.lane=Math.min(100,next.lane+amount*.3);next.mechanics=Math.min(100,next.mechanics+amount*.3);next.macro=Math.min(100,next.macro+amount*.3);next.teamfight=Math.min(100,next.teamfight+amount*.3)}
    next.overall=Math.min(next.potential,overall(next))
    return next
  })
  let activeRoster=trained
  let transferIncome=0
  let remainingListed=[...(career.listedPlayers??[])]
  for(const playerId of remainingListed){
    const listedPlayer=activeRoster.find(player=>player.id===playerId)
    if(!listedPlayer) continue
    const buyer=seasonClubs.filter(team=>team.short!==club.short).find(team=>{
      const buyerRoster=readClubRoster(team.short)
      const vacancy=!buyerRoster.some(player=>player.role===listedPlayer.role&&player.status==='주전')
      return vacancy&&readCareer(team).budget>=listedPlayer.value
    })
    if(!buyer) continue
    const buyerRoster=readClubRoster(buyer.short)
    const buyerCareer=readCareer(buyer)
    saveClubRoster(buyer.short,[...buyerRoster,{...listedPlayer,team:buyer.short,status:'주전',contractStatus:'확정'}])
    save(careerKey(buyer.short),{...buyerCareer,budget:buyerCareer.budget-listedPlayer.value,history:[listedPlayer.name+' 영입 · 이적료 '+money(listedPlayer.value),...buyerCareer.history].slice(0,100)})
    activeRoster=activeRoster.filter(player=>player.id!==playerId)
    transferIncome+=listedPlayer.value
    remainingListed=remainingListed.filter(id=>id!==playerId)
  }
  saveClubRoster(club.short,activeRoster)
  // AI 구단도 프리시즌 이적시장에서 매주 한 건씩 영입을 진행합니다.
  const aiTeams=seasonClubs.filter(team=>team.short!==club.short)
  for(let offset=0;offset<aiTeams.length;offset++){
    const aiTeam=aiTeams[(career.week-1+offset)%aiTeams.length]
    const aiRoster=readClubRoster(aiTeam.short)
    const vacant=roleOrder.find(role=>!aiRoster.some(player=>player.role===role&&player.status==='주전'))
    if(!vacant) continue
    const occupied=new Set(seasonClubs.flatMap(team=>readClubRoster(team.short)).map(player=>player.id))
    const aiCareer=readCareer(aiTeam)
    const candidate=marketPool.filter(player=>player.team==='FA'&&player.role===vacant&&!occupied.has(player.id))
      .sort((a,b)=>b.overall-a.overall).find(player=>aiCareer.budget>=player.value+player.salary*.12)
    if(!candidate) continue
    const signing={...candidate,team:aiTeam.short,contractUntil:2028,contractStatus:'확정' as const,status:'주전' as const}
    saveClubRoster(aiTeam.short,[...aiRoster,signing])
    const fee=candidate.value
    save(careerKey(aiTeam.short),{...aiCareer,budget:aiCareer.budget-fee-candidate.salary*.12,transferSpent:aiCareer.transferSpent+fee,signedPlayers:[...aiCareer.signedPlayers,candidate.id],history:[candidate.name+' 영입 완료 · 이적료 '+money(fee),...aiCareer.history].slice(0,100)})
    break
  }
  const nextBudget=career.budget+transferIncome-weeklyPayroll+career.sponsorIncome
  const next={...career,listedPlayers:remainingListed,week:career.week+1,budget:nextBudget,wageSpent:career.wageSpent+weeklyPayroll,
    morale:Math.min(100,career.morale+(career.training==='균형 훈련'?2:1)),
    history:[...(transferIncome>0?['이적 명단 선수 판매 · 수입 '+money(transferIncome)]:[]),career.week+'주차 종료 · '+career.training+' · 급여 '+money(weeklyPayroll)+' 지급 · 스폰서 '+money(career.sponsorIncome)+' 수입',...career.history].slice(0,100)}
  save(careerKey(club.short),next)
  window.dispatchEvent(new Event('lck-career-updated'))
  return next
}
export function releasePlayerFromClub(short:string,playerId:string) {
  const team=seasonClubs.find(c=>c.short===short)
  if(!team) return null
  const roster=readClubRoster(short)
  const player=roster.find(p=>p.id===playerId)
  if(!player) return null
  const career=readCareer(team)
  const yearsLeft=Math.max(0,(player.contractUntil??2026)-2026)
  const compensation=player.salary*yearsLeft*.35
  saveClubRoster(short,roster.filter(p=>p.id!==playerId))
  save(careerKey(short),{...career,budget:career.budget-compensation,releasedPlayers:[...career.releasedPlayers,playerId],history:[player.name+' 계약 해지 · 보상금 '+money(compensation),...career.history].slice(0,100)})
  window.dispatchEvent(new Event('lck-career-updated'))
  return {player,compensation,roster:roster.filter(p=>p.id!==playerId)}
}
export function renewPlayerContract(short:string,playerId:string,years:number) {
  const team=seasonClubs.find(c=>c.short===short)
  if(!team) return false
  const roster=readClubRoster(short)
  const player=roster.find(p=>p.id===playerId)
  if(!player) return false
  const career=readCareer(team)
  const raise=Math.round(player.salary*(1+years*.05)*10)/10
  const bonus=raise*.12*years
  if(career.budget<bonus) return false
  const updated=roster.map(p=>p.id===playerId?{...p,salary:raise,contractUntil:Math.max(2026,p.contractUntil??2026)+years,contractStatus:'확정' as const}:p)
  saveClubRoster(short,updated)
  save(careerKey(short),{...career,budget:career.budget-bonus,history:[player.name+' 재계약 · '+years+'년 연장 · 연봉 '+money(raise),...career.history].slice(0,100)})
  window.dispatchEvent(new Event('lck-career-updated'))
  return true
}

export function ClubSelection({onSelect}:{onSelect:(club:Club)=>void}) {
  const [chosen,setChosen]=useState('T1')
  const [showInfo,setShowInfo]=useState(false)
  const selected=clubs.find(c=>c.short===chosen)!
  const data=seasonClubs.find(c=>c.short===chosen)!
  return <div className="career-start">
    <div className="career-start-hero">
      <div className="career-start-kicker">LCK MANAGER · CAREER MODE · 2026</div>
      <h1>당신의 팀을 선택하세요.</h1>
      <p>2026 월드 챔피언십 이후, 2026 시즌을 앞둔 LCK 프리시즌에서 새로운 역사를 만드세요.</p>
      <div className="career-start-meta"><span>10 CLUBS</span><i/> <span>2026.11.23 START DATE</span><i/> <span>TRANSFER WINDOW OPEN</span></div>
    </div>
    <div className="career-start-layout">
      <section className="career-club-picker">
        <div className="career-section-title"><div><small>CHOOSE YOUR DESTINATION</small><h2>구단 선택</h2></div><span>2026 LCK</span></div>
        <div className="career-club-grid">{clubs.map((club,i)=>{const team=seasonClubs[i];return <button key={club.short} className={'career-club-card '+(chosen===club.short?'is-selected':'')} onClick={()=>{setChosen(club.short);setShowInfo(false)}} style={{'--club-accent':club.color} as CSSProperties}>
          <span className="career-club-logo">{club.short}</span><span className="career-club-copy"><strong>{club.name}</strong><small>{team.players.length}/5 포지션 확정 · 평판 {team.reputation}</small></span><span className="career-club-arrow">›</span>
        </button>})}</div>
      </section>
      <aside className="career-club-preview">
        <div className="career-preview-top"><span>CLUB PROFILE</span><b style={{background:selected.color}}>{selected.short}</b></div>
        <h2>{selected.name}</h2><p>2026 시즌 구단 정보 · 게임 내 추정치</p>
        <div className="career-preview-metrics"><div><small>운영 예산</small><strong>{money(selected.budget)}</strong></div><div><small>구단 평판</small><strong>{data.reputation}<em>/100</em></strong></div><div><small>시설 수준</small><strong>{data.facilities}<em>/100</em></strong></div><div><small>선수단 규모</small><strong>{data.players.length}<em>명</em></strong></div></div>
        <div className="career-preview-roster"><small>CONFIRMED / CONTRACTED</small>{data.players.length?data.players.map(p=><div key={p.id}><span>{p.role}</span><strong>{p.name}</strong><b>{p.overall}</b></div>):<p>현재 공개된 2026 선수단 계약이 없어 리빌딩부터 시작합니다.</p>}</div>
        <button className="career-start-button" onClick={()=>onSelect(selected)}>이 구단으로 커리어 시작 <span>→</span></button>
        <button className="career-data-note" onClick={()=>setShowInfo(v=>!v)}>{showInfo?'데이터 안내 닫기':'선수 능력치·재정 데이터 안내'}</button>
        {showInfo&&<p className="career-data-disclaimer">선수단 이동은 2026년 11월 23일까지 확인된 공개 발표와 보도 기준입니다. 능력치·연봉·이적 가치는 실제 공식 수치가 공개되지 않아 최근 경기력에 기반한 게임 밸런스용 추정치입니다. 미확정 영입설은 확정 로스터에 넣지 않았습니다.</p>}
      </aside>
    </div>
  </div>
}

export function ClubOffice({club,page,onChangePage,currentDate='2026-01-01'}:{club:Club;page:string;onChangePage:(page:string)=>void;currentDate?:string}) {
  const team=seasonClubs.find(c=>c.short===club.short)!
  const [career,setCareer]=useState<Career>(()=>readCareer(team))
  const [roster,setRoster]=useState<PlayerData[]>(()=>readClubRoster(club.short))
  const [notice,setNotice]=useState('')
  const [filterRole,setFilterRole]=useState('전체')
  const [filterStatus,setFilterStatus]=useState('전체')
  const [selectedPlayer,setSelectedPlayer]=useState<PlayerData|null>(null)
  const [offerFee,setOfferFee]=useState('0')
  const [offerSalary,setOfferSalary]=useState('5')
  const [offerYears,setOfferYears]=useState('2')
  const [training,setTraining]=useState(career.training)
  const [scoutTarget,setScoutTarget]=useState<PlayerData|null>(null)
  const [sponsorChoice,setSponsorChoice]=useState('프리미엄 파트너')
  const [interviewPlayerId,setInterviewPlayerId]=useState('')
  const [mediaChoice,setMediaChoice]=useState('선수단 보호')
  useEffect(()=>{save(careerKey(club.short),career)},[club.short,career])
  useEffect(()=>{const refresh=()=>setCareer(readCareer(team));window.addEventListener('lck-career-updated',refresh);return()=>window.removeEventListener('lck-career-updated',refresh)},[club.short])
  useEffect(()=>{setRoster(readClubRoster(club.short));setCareer(readCareer(team));setSelectedPlayer(null)},[club.short])
  const payroll=roster.reduce((sum,p)=>sum+p.salary,0)+career.staff.reduce((sum,s)=>sum+s.salary,0)
  const interviewee=roster.find(p=>p.id===interviewPlayerId)||roster[0]
  const marketPlayers=useMemo(()=>{
    const activePlayers=seasonClubs.flatMap(c=>readClubRoster(c.short))
    const occupiedIds=new Set(activePlayers.map(p=>p.id))
    const all=[...activePlayers,...marketPool.filter(p=>(p.team==='FA'||p.contractStatus==='미확정')&&!occupiedIds.has(p.id))]
    const unique=new Map<string,PlayerData>()
    all.forEach(p=>{if(!unique.has(p.id))unique.set(p.id,p)})
    return [...unique.values()].filter(p=>p.team!==club.short&&!career.signedPlayers.includes(p.id)&&!career.releasedPlayers.includes(p.id))
  },[club.short,career.signedPlayers,career.releasedPlayers])
  const filteredMarket=marketPlayers.filter(p=>(filterRole==='전체'||p.role===filterRole)&&(filterStatus==='전체'||(filterStatus==='FA'?p.contractStatus==='FA':p.contractStatus!=='FA')))
  const updateCareer=(patch:Partial<Career>,message?:string)=>{setCareer(old=>({...old,...patch}));if(message)setNotice(message)}
  const updateRoster=(next:PlayerData[])=>{setRoster(next);saveClubRoster(club.short,next)}
  const startNegotiation=(p:PlayerData)=>{setSelectedPlayer(p);setOfferFee(p.contractStatus==='FA'?'0':String(Math.max(1,Math.round(p.value*1.1))));setOfferSalary(String(Math.max(p.salary,3)));setOfferYears('2')}
  const submitOffer=()=>{
    if(!selectedPlayer)return
    const fee=Math.max(0,Number(offerFee)),salary=Math.max(0,Number(offerSalary)),years=Math.max(1,Math.min(5,Number(offerYears)))
    if(!Number.isFinite(fee)||!Number.isFinite(salary)||!Number.isFinite(years)){setNotice('이적 제안 금액을 확인해 주세요.');return}
    if(selectedPlayer.contractStatus==='FA'&&fee>0){setNotice('자유계약 선수에게는 이적료를 지불하지 않습니다.');return}
    if(selectedPlayer.contractStatus!=='FA'&&fee<selectedPlayer.value){setNotice('구단이 제시한 예상 이적료보다 낮습니다. 더 높은 금액을 제안하세요.');return}
    if(salary<selectedPlayer.salary){setNotice('선수의 현재 연봉보다 낮아 협상이 결렬됐습니다.');return}
    const signingCost=fee
    const signingBonus=salary*.12
    if(career.budget<signingCost+signingBonus){setNotice('이적료와 계약 보너스를 감당할 예산이 부족합니다.');return}
    const accepted={...selectedPlayer,team:club.short,contractUntil:2026+years-1,contractStatus:'확정' as const,salary,status:roster.some(p=>p.role===selectedPlayer.role&&p.status==='주전')?'후보' as const:'주전' as const}
    const current=readClubRoster(club.short)
    const newRoster=[...current,accepted]
    updateRoster(newRoster)
    if(selectedPlayer.contractStatus!=='FA'&&selectedPlayer.team!=='FA'){
      const seller=selectedPlayer.team
      const sellerRoster=readClubRoster(seller).filter(p=>p.id!==selectedPlayer.id)
      saveClubRoster(seller,sellerRoster)
      const sellerTeam=seasonClubs.find(t=>t.short===seller)
      if(sellerTeam){
        const sellerCareer=readCareer(sellerTeam)
        save(careerKey(seller),{...sellerCareer,budget:sellerCareer.budget+signingCost,history:[selectedPlayer.name+' 이적료 수입 '+money(signingCost),...sellerCareer.history].slice(0,100)})
      }
    }
    const nextBudget=career.budget-signingCost-signingBonus
    setCareer(old=>({...old,budget:nextBudget,transferSpent:old.transferSpent+signingCost, signedPlayers:[...old.signedPlayers,selectedPlayer.id],history:[selectedPlayer.name+' 영입 완료 · 이적료 '+money(signingCost)+' · 연봉 '+money(salary),...old.history].slice(0,100)}))
    setNotice(selectedPlayer.name+' 영입 완료! 선수단과 재정에 반영했습니다.')
    setSelectedPlayer(null)
  }
  const scout=(p:PlayerData)=>{
    if(career.scouted.includes(p.id)){setScoutTarget(p);return}
    const cost=.25
    if(career.scoutingBudget<cost){setNotice('스카우팅 예산이 부족합니다.');return}
    setCareer(old=>({...old,scoutingBudget:old.scoutingBudget-cost,scouted:[...old.scouted,p.id],history:[p.name+' 스카우팅 보고서 도착 · 비용 '+money(cost),...old.history].slice(0,100)}))
    setScoutTarget(p)
  }
  const conductInterview=(kind:'칭찬'|'출전 약속'|'경쟁 자극')=>{
    if(!interviewee)return
    const change=kind==='칭찬'?8:kind==='출전 약속'?10:-3
    const updated=roster.map(player=>player.id===interviewee.id?{...player,morale:Math.max(0,Math.min(100,(player.morale??76)+change))}:player)
    updateRoster(updated)
    updateCareer({morale:Math.max(0,Math.min(100,career.morale+(kind==='경쟁 자극'?-1:2))),history:[interviewee.name+' 선수 면담 · '+kind+' 선택',...career.history].slice(0,100)},interviewee.name+' 선수와 면담했습니다. 선수 사기가 갱신됐습니다.')
  }
  const holdPressConference=()=>{
    const effects:{[key:string]:{media:number;morale:number;pressure:number}}={
      '선수단 보호':{media:1,morale:4,pressure:-2},
      '우승 도전 선언':{media:4,morale:2,pressure:5},
      '상대 팀 존중':{media:3,morale:1,pressure:-1},
    }
    const effect=effects[mediaChoice]
    updateCareer({mediaReputation:Math.max(0,Math.min(100,career.mediaReputation+effect.media)),morale:Math.max(0,Math.min(100,career.morale+effect.morale)),pressure:Math.max(0,Math.min(100,career.pressure+effect.pressure)),history:['기자회견 · '+mediaChoice+' 발언',...career.history].slice(0,100)},'기자회견을 마쳤습니다. 발언에 따라 언론 평판과 팀 분위기가 변했습니다.')
  }
  const signYouth=(prospect:PlayerData)=>{
    if(career.signedPlayers.includes(prospect.id)||roster.some(p=>p.id===prospect.id)){setNotice('이미 등록된 유망주입니다.');return}
    const fee=.5+prospect.salary*.1
    if(career.budget<fee){setNotice('유망주 계약에 필요한 예산이 부족합니다.');return}
    const signing={...prospect,team:club.short,contractUntil:2029,contractStatus:'확정' as const,status:'후보' as const,morale:72}
    updateRoster([...roster,signing])
    setCareer(old=>({...old,budget:old.budget-fee,signedPlayers:[...old.signedPlayers,prospect.id],history:[prospect.name+' 유망주 영입 · 육성 계약',...old.history].slice(0,100)}))
    setNotice(prospect.name+' 유망주와 육성 계약을 체결했습니다.')
  }
  const saveTrainingPlan=(value:string)=>{
    setTraining(value)
    updateCareer({training:value},value+' 훈련 계획을 저장했습니다. 다음 주 진행부터 적용됩니다.')
  }
  const hireStaff=(person:typeof staffPool[number])=>{
    if(career.staff.some(s=>s.id===person.id)){setNotice('이미 계약한 스태프입니다.');return}
    if(career.budget<person.salary){setNotice('계약 보너스와 운영 예산이 부족합니다.');return}
    const staff=[...career.staff,person]
    setCareer(old=>({...old,budget:old.budget-person.salary*.5,staff,history:[person.name+' '+person.role+' 영입 · 계약 보너스 '+money(person.salary*.5),...old.history].slice(0,100)}))
    setNotice(person.name+' 코칭 스태프 영입 완료!')
  }
  const signSponsor=()=>{
    if(career.sponsorName!=='기본 파트너'){setNotice('현재 스폰서 계약이 유지 중입니다. 다음 시즌 갱신 기간에 다시 협상할 수 있습니다.');return}
    const deals:{[key:string]:{name:string;weekly:number;bonus:number;reputation:number}}={
      '로컬 파트너':{name:'로컬 파트너',weekly:.25,bonus:2,reputation:0},
      '프리미엄 파트너':{name:'프리미엄 파트너',weekly:.55,bonus:5,reputation:0},
      '글로벌 파트너':{name:'글로벌 파트너',weekly:.8,bonus:8,reputation:0},
    }
    const deal=deals[sponsorChoice]
    if(team.reputation<90&&sponsorChoice==='글로벌 파트너'){setNotice('글로벌 파트너는 구단 평판 90 이상이 필요합니다.');return}
    setCareer(old=>({...old,sponsorName:deal.name,sponsorIncome:deal.weekly,budget:old.budget+deal.bonus,history:[deal.name+' 스폰서 계약 · 계약금 '+money(deal.bonus),...old.history].slice(0,100)}))
    setNotice(deal.name+' 계약 완료. 주간 수입이 '+money(deal.weekly)+'로 변경됐습니다.')
  }
  const playerRow=(p:PlayerData,buttonLabel:string,onClick:()=>void,disabled=false)=><div className="pro-market-row" key={p.id}>
    <div className="pro-role">{p.role}</div><div className="pro-player"><strong>{p.name}</strong><small>{p.team==='FA'?'자유계약':p.team+' · '+p.contractUntil+'년까지'} · 만 {p.age}세 · {p.contractStatus}</small></div>
    <div className="pro-ovr"><b>{career.scouted.includes(p.id)?p.overall:'—'}</b><small>{career.scouted.includes(p.id)?'스카우팅 완료':'미확인'}</small></div>
    <div className="pro-value"><b>{money(p.value)}</b><small>예상 가치</small></div><button disabled={disabled} onClick={onClick}>{buttonLabel}</button>
  </div>
  const title=page==='이적시장'?'이적시장':page==='스카우팅'?'스카우팅 센터':page==='코칭 스태프'?'코칭 스태프':page==='훈련'?'훈련 및 선수 성장':page==='선수 면담'?'선수 면담':page==='기자회견'?'기자회견':page==='유망주 육성'?'유망주 육성':page==='재정 및 스폰서'?'재정 및 스폰서':'구단 기록'
  const pages=['이적시장','스카우팅','코칭 스태프','훈련','선수 면담','기자회견','유망주 육성','재정 및 스폰서','구단 기록']
  return <div className="club-office pro-office">
    <div className="pro-office-head"><div><small>2026 SEASON · CLUB OPERATIONS</small><h1>{title}</h1><p>{club.name} · {career.week}주차 · 프리시즌 운영</p></div><div className="pro-cash"><small>TRANSFER & OPERATING BUDGET</small><strong>{money(career.budget)}</strong><span>주간 스폰서 {money(career.sponsorIncome)}</span></div></div>
    <nav className="pro-office-tabs">{pages.map(tab=><button className={page===tab?'active':''} key={tab} onClick={()=>onChangePage(tab)}>{tab}</button>)}</nav>
    {notice&&<div className="pro-notice"><span>{notice}</span><button onClick={()=>setNotice('')}>확인</button></div>}
    <div className="pro-kpis"><div><small>1군 등록</small><b>{roster.length}<em>명</em></b></div><div><small>선수단 연봉</small><b>{money(roster.reduce((s,p)=>s+p.salary,0))}<em>/년</em></b></div><div><small>코칭 스태프</small><b>{career.staff.length}<em>명</em></b></div><div><small>팀 사기</small><b>{career.morale}<em>/100</em></b></div></div>
    {page==='이적시장'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>TRANSFER MARKET · 2026</small><h2>영입 가능한 선수</h2><p>FA는 이적료 없이 협상하고, 계약 중인 선수는 소속 구단의 요구 이적료를 충족해야 합니다.</p></div><div className="pro-filter"><select value={filterRole} onChange={e=>setFilterRole(e.target.value)}>{['전체',...roleOrder].map(r=><option key={r}>{r}</option>)}</select><select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option>전체</option><option value="FA">자유계약</option><option value="계약">계약 선수</option></select></div></div><div className="pro-market-head"><span>포지션</span><span>선수 / 계약</span><span>리포트</span><span>시장 가치</span><span>협상</span></div>{filteredMarket.length?filteredMarket.map(p=>playerRow(p,career.scouted.includes(p.id)?'협상 제안':'스카우팅',()=>{if(career.scouted.includes(p.id))startNegotiation(p);else scout(p)})): <p className="pro-empty">현재 조건에 맞는 영입 대상이 없습니다.</p>}</section>}
    {page==='이적시장'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>OUTGOING TRANSFERS</small><h2>우리 팀 이적 명단</h2><p>선수를 이적 명단에 등록하면 다른 구단이 포지션 공백과 예산에 따라 영입을 제안합니다. 주간 진행 시 협상이 처리됩니다.</p></div><span>{career.listedPlayers.length}명 등록</span></div>{roster.map(player=><div className="pro-staff-row" key={player.id}><div><strong>{player.name}</strong><small>{player.role} · OVR {player.overall} · 계약 {player.contractUntil}년까지</small></div><b>{money(player.value)}</b><button onClick={()=>updateCareer({listedPlayers:career.listedPlayers.includes(player.id)?career.listedPlayers.filter(id=>id!==player.id):[...career.listedPlayers,player.id]},career.listedPlayers.includes(player.id)?player.name+' 선수를 이적 명단에서 제외했습니다.':player.name+' 선수를 이적 명단에 등록했습니다.')}>{career.listedPlayers.includes(player.id)?'명단 제외':'이적 명단 등록'}</button></div>)}</section>}
    {page==='스카우팅'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>SCOUTING NETWORK</small><h2>선수 발굴 및 분석</h2><p>보고서 1건당 {money(.25)} · 잔여 스카우팅 예산 {money(career.scoutingBudget)}</p></div></div><div className="pro-scout-grid">{marketPlayers.filter(p=>!career.scouted.includes(p.id)).slice(0,20).map(p=><button key={p.id} onClick={()=>scout(p)}><span>{p.role} · {p.age}세</span><strong>{p.name}</strong><small>{p.team==='FA'?'FA 시장':p.team+' 소속'} · 잠재력 미확인</small><b>보고서 요청 →</b></button>)}</div>{scoutTarget&&<div className="pro-scout-report"><button className="pro-close" onClick={()=>setScoutTarget(null)}>×</button><small>SCOUTING REPORT</small><h3>{scoutTarget.name} · {scoutTarget.role}</h3><div className="pro-report-stats"><div><span>현재 능력</span><b>{scoutTarget.overall}</b></div><div><span>잠재력</span><b>{scoutTarget.potential}</b></div><div><span>나이</span><b>{scoutTarget.age}</b></div><div><span>일관성</span><b>{scoutTarget.consistency}</b></div></div><p>주요 챔피언: {scoutTarget.champions.map(champion=>typeof champion==='string'?champion:champion.name).join(' · ')}</p><p>선수단 데이터는 공개 경기력 기반의 게임용 평가치입니다.</p></div>}</section>}
    {page==='코칭 스태프'&&<><section className="pro-panel"><div className="pro-panel-head"><div><small>COACHING STAFF</small><h2>현재 코칭 스태프</h2><p>2026 시즌 당시 등록된 감독과 코칭 스태프입니다. 생년월일이 확인된 인원은 현재 커리어 날짜 기준 만 나이로 계산합니다. 연봉과 능력치는 게임 밸런스용 추정치입니다.</p></div></div>{career.staff.map(s=>{
  const age=ageAtDate(s.birthDate,currentDate)
  return <article className="pro-staff-profile" key={s.id}>
    <div className="pro-staff-profile-head"><div><small>{s.role}</small><strong>{s.name}</strong><span>{s.realName || '본명 공개자료 미확인'}</span></div><b>{s.rating}<small> 능력치</small></b></div>
    <div className="pro-staff-profile-data"><span>생년월일 <b>{s.birthDate || '확인된 정보 없음'}</b></span><span>만 나이 <b>{age===null?'확인 불가':age+'세'}</b></span><span>전문 분야 <b>{s.focus}</b></span></div>
    <div className="pro-staff-profile-foot"><span>1군 코칭 스태프</span><span>게임 내 연봉 추정 {money(s.salary)}</span></div>
  </article>
})}</section><section className="pro-panel"><div className="pro-panel-head"><div><small>STAFF MARKET</small><h2>영입 가능한 코칭 스태프</h2></div></div>{staffPool.map(s=><div className="pro-staff-row" key={s.id}><div><strong>{s.name}</strong><small>{s.role} · {s.focus}</small></div><b>{s.rating}</b><span>연봉 {money(s.salary)}</span><button disabled={career.staff.some(x=>x.id===s.id)} onClick={()=>hireStaff(s)}>{career.staff.some(x=>x.id===s.id)?'계약 완료':'영입 제안'}</button></div>)}</section></>}
    {page==='훈련'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>PLAYER DEVELOPMENT</small><h2>주간 훈련 프로그램</h2><p>선수 나이와 코칭 스태프 수준에 따라 성장량이 달라집니다. 25세 이상 선수는 성장보다 유지·숙련 중심입니다.</p></div></div><div className="pro-training-grid">{['균형 훈련','라인전','개인 기량','운영','한타','챔피언 숙련'].map(t=><button className={training===t?'active':''} key={t} onClick={()=>saveTrainingPlan(t)}><strong>{t}</strong><small>{t==='균형 훈련'?'전 능력치 소폭 성장':t==='라인전'?'라인전·교전 시작 능력':t==='개인 기량'?'피지컬 능력치 성장':t==='챔피언 숙련'?'실제 사용 챔피언 숙련도 성장':t==='운영'?'매크로·오브젝트 판단':'팀파이트·한타 판단'}</small></button>)}</div><div className="pro-training-footer"><span>예상 주급 지출 <b>{money(payroll/52)}</b> · 스폰서 수입 <b>{money(career.sponsorIncome)}</b></span><button onClick={()=>setNotice('훈련 계획은 상단의 1주 진행을 누르면 적용됩니다.')}>훈련 계획 저장</button></div></section>}
    {page==='선수 면담'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>PLAYER RELATIONSHIP</small><h2>선수 면담실</h2><p>선수의 사기와 감독에 대한 신뢰를 관리합니다. 출전 약속은 실제 출전 기회를 지켜야 효과가 유지됩니다.</p></div></div>{roster.length?<><div className="pro-interview-select"><label>면담할 선수<select value={interviewee?.id||''} onChange={e=>setInterviewPlayerId(e.target.value)}>{roster.map(p=><option key={p.id} value={p.id}>{p.role} · {p.name}</option>)}</select></label><div className="pro-interview-morale"><span>현재 사기</span><b>{interviewee?.morale??76}/100</b></div></div><div className="pro-interview-actions"><button onClick={()=>conductInterview('칭찬')}><strong>좋은 활약 칭찬</strong><small>선수 사기 상승 · 부담 완화</small></button><button onClick={()=>conductInterview('출전 약속')}><strong>출전 기회 약속</strong><small>사기 상승 · 약속 이행 필요</small></button><button onClick={()=>conductInterview('경쟁 자극')}><strong>주전 경쟁 자극</strong><small>경쟁심 상승 · 일시적 사기 하락</small></button></div></>:<p className="pro-empty">면담할 선수가 없습니다. 이적시장에서 선수를 영입하세요.</p>}</section>}
    {page==='기자회견'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>MEDIA ROOM</small><h2>경기 전 기자회견</h2><p>감독의 발언은 팀 사기, 언론 평판, 외부 압박에 영향을 줍니다.</p></div></div><div className="pro-media-metrics"><div><small>언론 평판</small><b>{career.mediaReputation}/100</b></div><div><small>팀 사기</small><b>{career.morale}/100</b></div><div><small>외부 압박</small><b>{career.pressure}/100</b></div></div><div className="pro-media-options">{['선수단 보호','우승 도전 선언','상대 팀 존중'].map(choice=><button className={mediaChoice===choice?'active':''} key={choice} onClick={()=>setMediaChoice(choice)}><strong>{choice}</strong><small>{choice==='선수단 보호'?'선수들의 부담을 낮추는 발언':choice==='우승 도전 선언'?'언론의 기대와 팀의 부담이 함께 상승':'상대 팀을 존중하는 차분한 발언'}</small></button>)}</div><button className="pro-submit-offer" onClick={holdPressConference}>기자회견 진행</button></section>}
    {page==='유망주 육성'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>ACADEMY & DEVELOPMENT</small><h2>유망주 발굴</h2><p>가상의 생성 유망주 데이터입니다. 어린 선수는 훈련과 코치의 영향을 더 크게 받습니다.</p></div><span>육성 예산 {money(career.budget)}</span></div><div className="pro-youth-grid">{academyPool.filter(p=>!career.signedPlayers.includes(p.id)&&!roster.some(x=>x.id===p.id)).map(p=><div key={p.id}><span>{p.role} · 만 {p.age}세</span><strong>{p.name}</strong><div className="pro-youth-ratings"><b>현재 {p.overall}</b><b>잠재 {p.potential}</b></div><small>연봉 {money(p.salary)} · 계약금 {money(.5+p.salary*.1)}</small><button onClick={()=>signYouth(p)}>육성 선수로 영입</button></div>)}</div></section>}
    {page==='재정 및 스폰서'&&<><section className="pro-panel"><div className="pro-panel-head"><div><small>FINANCIAL OVERVIEW</small><h2>구단 재정 현황</h2><p>금액 단위: 억 원 · 실제 구단 재무 공개 자료가 아닌 게임 밸런스용 추정치</p></div></div><div className="pro-finance-grid"><div><small>현재 가용 예산</small><b>{money(career.budget)}</b></div><div><small>선수 연봉 총액</small><b>{money(roster.reduce((s,p)=>s+p.salary,0))}</b></div><div><small>코칭 스태프 연봉</small><b>{money(career.staff.reduce((s,p)=>s+p.salary,0))}</b></div><div><small>주간 급여</small><b>{money(payroll/52)}</b></div><div><small>누적 이적 지출</small><b>{money(career.transferSpent)}</b></div><div><small>누적 급여 지출</small><b>{money(career.wageSpent)}</b></div></div><div className="pro-ledger-row"><span>주간 스폰서 수입</span><b className="positive">+{money(career.sponsorIncome)}</b></div><div className="pro-ledger-row"><span>예상 주간 급여</span><b className="negative">-{money(payroll/52)}</b></div><div className="pro-ledger-row total"><span>주간 순현금흐름</span><b>{money(career.sponsorIncome-payroll/52)}</b></div></section><section className="pro-panel"><div className="pro-panel-head"><div><small>SPONSORSHIP</small><h2>스폰서 계약</h2></div></div><div className="pro-sponsor-form"><select value={sponsorChoice} onChange={e=>setSponsorChoice(e.target.value)}><option>로컬 파트너</option><option>프리미엄 파트너</option><option>글로벌 파트너</option></select><button onClick={signSponsor}>계약 협상</button></div><p className="pro-muted">현재 계약: {career.sponsorName} · 주간 수입 {money(career.sponsorIncome)} · 글로벌 파트너는 구단 평판 90 이상 필요</p></section></>}
    {page==='구단 기록'&&<section className="pro-panel"><div className="pro-panel-head"><div><small>CLUB HISTORY</small><h2>구단 운영 기록</h2><p>이적, 급여, 스카우팅, 훈련 및 경기 결과가 시간순으로 기록됩니다.</p></div><span>총 {career.history.length}건</span></div>{career.history.map((item,i)=><div className="pro-history-row" key={i}><span>{String(career.week).padStart(2,'0')}</span><p>{item}</p></div>)}</section>}
    {selectedPlayer&&<div className="pro-modal-backdrop" onClick={()=>setSelectedPlayer(null)}><section className="pro-offer-modal" onClick={e=>e.stopPropagation()}><button className="pro-close" onClick={()=>setSelectedPlayer(null)}>×</button><small>CONTRACT NEGOTIATION</small><h2>{selectedPlayer.name} 영입 협상</h2><p>{selectedPlayer.team==='FA'?'자유계약 선수입니다. 이적료 없이 계약할 수 있습니다.':selectedPlayer.team+'와 이적료 협상이 필요합니다.'}</p><div className="pro-offer-fields"><label>이적료 (억 원)<input type="number" min="0" value={offerFee} onChange={e=>setOfferFee(e.target.value)} disabled={selectedPlayer.contractStatus==='FA'}/></label><label>연봉 (억 원)<input type="number" min="0" step=".5" value={offerSalary} onChange={e=>setOfferSalary(e.target.value)}/></label><label>계약 기간<select value={offerYears} onChange={e=>setOfferYears(e.target.value)}>{[1,2,3,4,5].map(y=><option key={y} value={y}>{y}년</option>)}</select></label></div><div className="pro-offer-summary"><span>즉시 지출</span><b>{money(Math.max(0,Number(offerFee)||0)+Math.max(0,Number(offerSalary)||0)*.12)}</b></div><button className="pro-submit-offer" onClick={submitOffer}>최종 영입 제안</button></section></div>}
  </div>
}
