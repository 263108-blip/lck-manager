import { useEffect, useState, type CSSProperties } from 'react'

export type Club = { name: string; short: string; strength: number; budget: number; difficulty: string; color: string }
export const clubs: Club[] = [
  { name: 'T1', short: 'T1', strength: 96, budget: 120, difficulty: '도전', color: '#d92e46' },
  { name: 'Gen.G', short: 'GEN.G', strength: 95, budget: 115, difficulty: '도전', color: '#c5a64b' },
  { name: '한화생명e스포츠', short: 'HLE', strength: 93, budget: 105, difficulty: '상급', color: '#e65b25' },
  { name: 'Dplus KIA', short: 'DK', strength: 90, budget: 95, difficulty: '상급', color: '#9da9c8' },
  { name: 'KT 롤스터', short: 'KT', strength: 89, budget: 90, difficulty: '보통', color: '#e94a50' },
  { name: 'DRX', short: 'DRX', strength: 83, budget: 72, difficulty: '보통', color: '#4778ce' },
  { name: 'BNK FEARX', short: 'BNK FEARX', strength: 82, budget: 70, difficulty: '보통', color: '#e4b64d' },
  { name: '농심 레드포스', short: 'NS', strength: 80, budget: 68, difficulty: '도전', color: '#d92d35' },
  { name: 'OK저축은행 브리온', short: 'BRO', strength: 77, budget: 62, difficulty: '도전', color: '#66a36d' },
  { name: '광동 프릭스', short: 'KDF', strength: 79, budget: 65, difficulty: '도전', color: '#e85a32' },
]
const save = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))
const read = <T,>(key: string, fallback: T): T => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback } }

export function ClubSelection({ onSelect }: { onSelect: (club: Club) => void }) {
  const [chosen, setChosen] = useState('T1')
  return <div className="club-setup">
    <div className="club-setup-top"><span>NEW CAREER · 2026</span><h1>당신의 LCK는 지금부터 시작됩니다.</h1><p>운영할 구단을 선택하고 감독으로서 첫 시즌을 시작하세요.</p></div>
    <div className="club-setup-heading"><div><small>SELECT YOUR CLUB</small><h2>어느 팀을 지휘하시겠습니까?</h2></div><span>10 CLUBS · LCK</span></div>
    <div className="club-choice-grid">{clubs.map(club => <button key={club.short} className={chosen === club.short ? 'club-choice selected' : 'club-choice'} onClick={() => setChosen(club.short)} style={{'--club-color':club.color} as CSSProperties}>
      <span className="club-choice-mark">{club.short}</span><span className="club-choice-info"><strong>{club.name}</strong><small>팀 전력 {club.strength} · 운영 예산 ₩{club.budget}억</small></span><span className="club-difficulty">{club.difficulty}</span>
    </button>)}</div>
    <div className="club-setup-footer"><p>선택한 팀의 예산과 전력에 따라 시즌 운영 난이도가 달라집니다.</p><button onClick={() => onSelect(clubs.find(c => c.short === chosen)!)}>이 구단으로 커리어 시작 <span>→</span></button></div>
  </div>
}

type MarketPlayer = { id: number; name: string; role: string; age: number; overall: number; price: number; potential: number }
type Staff = { id: number; role: string; name: string; rating: number; salary: number }
type Career = { budget: number; week: number; training: string; morale: number; sponsor: number; transfers: string[]; staff: Staff[]; history: string[]; scouted: number[] }
const market: MarketPlayer[] = [
  {id:1,name:'Rookie',role:'TOP',age:19,overall:82,price:18,potential:94},{id:2,name:'Canyon',role:'JNG',age:24,overall:94,price:42,potential:95},
  {id:3,name:'Zeka',role:'MID',age:23,overall:92,price:38,potential:94},{id:4,name:'Aiming',role:'ADC',age:25,overall:89,price:29,potential:91},
  {id:5,name:'Life',role:'SUP',age:26,overall:85,price:20,potential:87},{id:6,name:'Clear',role:'TOP',age:21,overall:80,price:15,potential:90},
  {id:7,name:'Lucid',role:'JNG',age:21,overall:84,price:22,potential:93},{id:8,name:'Scout',role:'MID',age:28,overall:93,price:35,potential:93},
  {id:9,name:'Jiwoo',role:'ADC',age:20,overall:81,price:16,potential:92},{id:10,name:'Andil',role:'SUP',age:22,overall:79,price:12,potential:89},
]
const staffMarket: Staff[] = [
  {id:1,role:'수석 코치',name:'김도현',rating:91,salary:8},{id:2,role:'전략 분석가',name:'이준호',rating:88,salary:5},
  {id:3,role:'코치',name:'박민수',rating:84,salary:4},{id:4,role:'멘탈 코치',name:'최서연',rating:86,salary:4},
]
const defaultCareer = (club: Club): Career => ({budget:club.budget,week:1,training:'균형 훈련',morale:75,sponsor:12,transfers:[],staff:[{id:99,role:'감독',name:'나',rating:80,salary:0}],history:['2026 시즌 감독으로 부임했습니다.'],scouted:[]})

export function ClubOffice({ club, page, onChangePage }: { club: Club; page: string; onChangePage: (page: string) => void }) {
  const key = 'lck-career-' + club.short
  const [career,setCareer] = useState<Career>(() => read(key,defaultCareer(club)))
  const [marketFilter,setMarketFilter] = useState('전체')
  const [notice,setNotice] = useState('')
  useEffect(() => { save(key,career) },[key,career])
  const [scoutRole,setScoutRole] = useState('전체')
  const [scoutAge,setScoutAge] = useState('전체')
  const available = market.filter(p => !career.transfers.includes(p.name))
  const filteredMarket = available.filter(p => marketFilter === '전체' || p.role === marketFilter)
  const candidates = market.filter(p => (scoutRole === '전체' || p.role === scoutRole) && (scoutAge === '전체' || (scoutAge === '유망주' ? p.age <= 21 : p.age >= 25)))
  const spent = club.budget - career.budget
  const update = (patch: Partial<Career>, message?: string) => { setCareer(old => ({...old,...patch})); if(message) setNotice(message) }
  const signPlayer = (player: MarketPlayer) => {
    if (career.budget < player.price) { setNotice('이적 예산이 부족합니다.'); return }
    const next = {...career,budget:career.budget-player.price,transfers:[...career.transfers,player.name],history:[player.name+' 선수와 계약했습니다.',...career.history]}
    setCareer(next); setNotice(player.name+' 선수 영입 완료!')
    const current = read<any[]>('lck-manager-roster',[])
    const roleExists = current.some(p => p.role === player.role && p.status === '주전')
    const newPlayer = {name:player.name,role:player.role,team:club.name,age:player.age,overall:player.overall,lane:player.overall,teamfight:player.overall,macro:player.overall,mechanics:player.overall,champions:['미등록'],status:roleExists?'후보':'주전'}
    save('lck-manager-roster',[...current,newPlayer]); window.dispatchEvent(new Event('lck-roster-updated'))
  }
  const train = () => {
    const morale = Math.min(100,career.morale + (career.training === '팀워크 집중' ? 5 : 2))
    const next = {...career,week:career.week+1,morale,history:[career.training+'을(를) 진행하고 1주가 지났습니다.',...career.history]}
    try {
      const savedRoster = JSON.parse(localStorage.getItem('lck-manager-roster') || '[]')
      const trainedRoster = savedRoster.map((player: any) => {
        const stats = {
          lane: Number(player.lane ?? player.overall ?? 70),
          teamfight: Number(player.teamfight ?? player.overall ?? 70),
          macro: Number(player.macro ?? player.overall ?? 70),
          mechanics: Number(player.mechanics ?? player.overall ?? 70),
        }
        if (career.training === '라인전 집중') stats.lane = Math.min(100, stats.lane + 2)
        else if (career.training === '한타 집중') stats.teamfight = Math.min(100, stats.teamfight + 2)
        else if (career.training === '개인 기량 집중') stats.mechanics = Math.min(100, stats.mechanics + 2)
        else if (career.training === '균형 훈련') {
          stats.lane = Math.min(100, stats.lane + 1)
          stats.teamfight = Math.min(100, stats.teamfight + 1)
          stats.macro = Math.min(100, stats.macro + 1)
          stats.mechanics = Math.min(100, stats.mechanics + 1)
        }
        return {...player,...stats,overall:Math.round((stats.lane+stats.teamfight+stats.macro+stats.mechanics)/4)}
      })
      save('lck-manager-roster',trainedRoster)
      window.dispatchEvent(new Event('lck-roster-updated'))
    } catch {
      setNotice('훈련은 진행했지만 선수단 능력치 저장에 실패했습니다.')
    }
    setCareer(next)
    setNotice('훈련 완료! 선택한 훈련에 따라 선수들의 능력치와 팀 사기가 성장했습니다.')
  }
  const hire = (person: Staff) => {
    if(career.staff.some(s=>s.id===person.id)){setNotice('이미 계약한 스태프입니다.');return}
    if(career.budget<person.salary){setNotice('예산이 부족합니다.');return}
    update({budget:career.budget-person.salary,staff:[...career.staff,person],history:[person.name+' '+person.role+' 영입',...career.history]},person.name+' 스태프와 계약했습니다.')
  }
  const title = page === '이적시장' ? '이적시장' : page === '스카우팅' ? '스카우팅' : page === '코칭 스태프' ? '코칭 스태프' : page === '훈련' ? '훈련 센터' : page === '재정 및 스폰서' ? '재정 및 스폰서' : '구단 기록'
  return <div className="club-office">
    <div className="office-heading"><div><span>CLUB OPERATIONS · {club.short}</span><h1>{title}</h1><p>{club.name}의 시즌 운영과 장기적인 성장을 관리하세요.</p></div><div className="office-budget"><small>AVAILABLE BUDGET</small><strong>₩{career.budget}억</strong><span>시즌 {career.week}주차</span></div></div>
    <div className="office-tabs">{['이적시장','스카우팅','코칭 스태프','훈련','재정 및 스폰서','구단 기록'].map(tab=><button className={page===tab?'active':''} key={tab} onClick={()=>onChangePage(tab)}>{tab}</button>)}</div>
    {notice && <div className="office-notice"><span>{notice}</span><button onClick={()=>setNotice('')}>확인</button></div>}
    {page==='이적시장' && <><div className="office-summary"><div><small>등록된 영입</small><strong>{career.transfers.length}명</strong></div><div><small>사용 예산</small><strong>₩{spent}억</strong></div><div><small>남은 예산</small><strong>₩{career.budget}억</strong></div><div><small>영입 가능 선수</small><strong>{available.length}명</strong></div></div><section className="office-panel"><div className="office-panel-head"><div><small>TRANSFER TARGETS</small><h2>영입 후보</h2></div><select value={marketFilter} onChange={e=>setMarketFilter(e.target.value)}>{['전체','TOP','JNG','MID','ADC','SUP'].map(x=><option key={x}>{x}</option>)}</select></div><div className="market-list">{filteredMarket.map(p=><div className="market-row" key={p.id}><b className="market-role">{p.role}</b><div className="market-player"><strong>{p.name}</strong><small>{p.age}세 · 잠재력 {p.potential}</small></div><div className="market-rating"><strong>{p.overall}</strong><small>OVR</small></div><div className="market-price">₩{p.price}억</div><button disabled={career.budget<p.price} onClick={()=>signPlayer(p)}>영입 협상</button></div>)}</div></section></>}
    {page==='스카우팅' && <><section className="office-panel"><div className="office-panel-head"><div><small>SCOUT NETWORK</small><h2>선수 탐색</h2></div><span>관찰 보고서 {career.scouted.length}건</span></div><div className="scout-filters"><label>포지션<select value={scoutRole} onChange={e=>setScoutRole(e.target.value)}>{['전체','TOP','JNG','MID','ADC','SUP'].map(x=><option key={x}>{x}</option>)}</select></label><label>연령대<select value={scoutAge} onChange={e=>setScoutAge(e.target.value)}><option>전체</option><option>유망주</option><option>베테랑</option></select></label></div><div className="market-list">{candidates.map(p=><div className="market-row" key={p.id}><b className="market-role">{p.role}</b><div className="market-player"><strong>{p.name}</strong><small>{p.age}세 · 잠재력 {p.potential}</small></div><div className="market-rating"><strong>{p.overall}</strong><small>현재 능력</small></div><button onClick={()=>{if(career.scouted.includes(p.id)){setNotice('이미 보고서를 작성한 선수입니다.');return}update({scouted:[...career.scouted,p.id]},p.name+' 선수의 스카우팅 보고서가 도착했습니다.')}}>{career.scouted.includes(p.id)?'보고서 완료':'보고서 요청'}</button></div>)}</div></section></>}
    {page==='코칭 스태프' && <><div className="office-summary"><div><small>스태프</small><strong>{career.staff.length}명</strong></div><div><small>평균 능력</small><strong>{Math.round(career.staff.reduce((s,p)=>s+p.rating,0)/career.staff.length)}</strong></div><div><small>주간 급여 예산</small><strong>₩{career.staff.reduce((s,p)=>s+p.salary,0)}억</strong></div><div><small>운영 체계</small><strong>{career.staff.length>=4?'안정':'보강 필요'}</strong></div></div><section className="office-panel"><div className="office-panel-head"><div><small>STAFF RECRUITMENT</small><h2>스태프 영입</h2></div></div>{staffMarket.map(s=><div className="market-row" key={s.id}><b className="market-role">STAFF</b><div className="market-player"><strong>{s.name}</strong><small>{s.role}</small></div><div className="market-rating"><strong>{s.rating}</strong><small>능력치</small></div><div className="market-price">₩{s.salary}억</div><button disabled={career.staff.some(x=>x.id===s.id)||career.budget<s.salary} onClick={()=>hire(s)}>{career.staff.some(x=>x.id===s.id)?'계약 완료':'영입'}</button></div>)}</section><section className="office-panel"><h2>현재 코칭 스태프</h2>{career.staff.map(s=><div className="staff-chip" key={s.id}><strong>{s.name}</strong><span>{s.role}</span><b>{s.rating}</b></div>)}</section></>}
    {page==='훈련' && <><section className="office-panel training-panel"><small>WEEKLY TRAINING</small><h2>주간 훈련 계획</h2><p>훈련 계획을 선택하고 한 주를 진행하세요. 훈련은 선수단 사기와 시즌 진행도에 반영됩니다.</p><div className="training-options">{['균형 훈련','라인전 집중','한타 집중','팀워크 집중','개인 기량 집중'].map(t=><button key={t} className={career.training===t?'active':''} onClick={()=>update({training:t})}><strong>{t}</strong><small>{t==='균형 훈련'?'전반적인 팀 능력 유지':t==='라인전 집중'?'초반 라인 운영':t==='한타 집중'?'교전 판단과 집중력':t==='팀워크 집중'?'팀 사기 상승 효과':'개인 기량과 숙련도'}</small></button>)}</div><div className="morale-bar"><span>팀 사기</span><strong>{career.morale}/100</strong><div><i style={{width:career.morale+'%'}}/></div></div><button className="office-primary" onClick={train}>훈련 진행 · 1주 경과</button></section></>}
    {page==='재정 및 스폰서' && <><div className="office-summary"><div><small>시작 예산</small><strong>₩{club.budget}억</strong></div><div><small>이적 지출</small><strong>₩{spent}억</strong></div><div><small>스폰서 수익</small><strong>₩{career.sponsor}억</strong></div><div><small>가용 자금</small><strong>₩{career.budget}억</strong></div></div><section className="office-panel"><small>FINANCIAL REPORT</small><h2>구단 재정 보고서</h2><div className="finance-line"><span>시즌 운영 예산</span><b>₩{club.budget}억</b></div><div className="finance-line"><span>선수 및 스태프 영입</span><b className="negative">-₩{spent}억</b></div><div className="finance-line"><span>스폰서 계약 수익</span><b className="positive">+₩{career.sponsor}억</b></div><div className="finance-line total"><span>현재 가용 예산</span><b>₩{career.budget}억</b></div><button className="office-primary" onClick={()=>update({sponsor:career.sponsor+3,budget:career.budget+3,history:['신규 스폰서 계약으로 3억 원을 확보했습니다.',...career.history]},'스폰서 계약을 체결해 3억 원을 확보했습니다.')}>스폰서 계약 협상</button></section></>}
    {page==='구단 기록' && <><div className="office-summary"><div><small>시즌 주차</small><strong>{career.week}주</strong></div><div><small>팀 사기</small><strong>{career.morale}</strong></div><div><small>영입 선수</small><strong>{career.transfers.length}명</strong></div><div><small>스카우팅</small><strong>{career.scouted.length}건</strong></div></div><section className="office-panel"><small>CLUB JOURNAL</small><h2>구단 활동 기록</h2>{career.history.map((item,i)=><div className="history-row" key={i}><span>#{career.history.length-i}</span><p>{item}</p></div>)}</section></>}
  </div>
}
