
import { useEffect, useState } from 'react'
import { readClubRoster, releasePlayerFromClub, renewPlayerContract, retirePlayerFromClub, saveClubRoster } from './ClubManager'
import type { PlayerData } from './seasonData'
type ChampionMastery = {
  name: string
  mastery: number
}
type SeasonStats = { matches:number; wins:number; losses:number; kills:number; deaths:number; assists:number; mvp:number; cs?:number }
type MatchHistoryEntry = { id?:string; name:string; role:string; team:string; championId:string; championName?:string; kills:number; deaths:number; assists:number; cs:number; won:boolean }
type MatchHistory = { gameKey:string; matchId:number; gameNumber:number; blue:string; red:string; winner:string; players:MatchHistoryEntry[] }
type Player = {
  id?: string
  name: string
  role: string
  team: string
  age: number
  overall: number
  lane: number
  teamfight: number
  macro: number
  mechanics: number
  champions: (string | ChampionMastery)[]
  status: string
  potential?: number
  consistency?: number
  clutch?: number
  salary?: number
  value?: number
  contractUntil?: number
  contractStatus?: string
  morale?: number
  physical?: number
  vision?: number
  objectives?: number
  communication?: number
  teamwork?: number
  championPool?: number
  growthSpeed?: number
  imageUrl?: string
  dataSource?: 'official'|'report'|'rumor'|'game-estimate'
  sourceCheckedAt?: string
}

const roles = ['전체', 'TOP', 'JNG', 'MID', 'ADC', 'SUP']
const STORAGE_KEY = 'lck-manager-roster'

function calculateOverall(player: Player) {
  return Math.round(player.lane*.22 + player.mechanics*.22 + player.macro*.20 + player.teamfight*.20 + (player.consistency ?? 80)*.10 + (player.clutch ?? 80)*.06)
}

function loadRoster(teamShort: string): Player[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY + '-' + teamShort)

    if (saved) {
      const parsed = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        return parsed.map((player: Player) => ({
          ...player,
          champions: (player.champions || []).map(champion =>
            typeof champion === 'string'
              ? { name: champion, mastery: 0 }
              : champion
          ),
        }))
      }
    }
  } catch {
    console.warn('저장된 선수단 데이터를 불러오지 못했습니다.')
  }

  return readClubRoster(teamShort) as Player[]
}

export default function Roster({ teamName = 'T1', teamShort = 'T1', onOpenMarket, currentDate = '2026-11-14' }: { teamName?: string; teamShort?: string; onOpenMarket?: () => void; currentDate?: string }) {
  const [roster, setRoster] = useState<Player[]>(() => loadRoster(teamShort))
  const season=Number(localStorage.getItem('lck-manager-season-year')||2026)
  const [seasonStats,setSeasonStats] = useState<Record<string,SeasonStats>>(()=>{try{return JSON.parse(localStorage.getItem(`lck-player-season-stats-${season}`)||'{}')}catch{return {}}})
  const [matchHistory,setMatchHistory] = useState<MatchHistory[]>(()=>{try{return JSON.parse(localStorage.getItem(`lck-player-match-history-${season}`)||'[]')}catch{return []}})
  const [role, setRole] = useState('전체')
  const [selectedName, setSelectedName] = useState('Zeus')
const [renewYears,setRenewYears] = useState(1)
const [profileOpen,setProfileOpen]=useState(false)
const [profileTab,setProfileTab]=useState<'개요'|'능력치'|'경기 기록'|'계약'|'챔피언'>('개요')
const [sortBy,setSortBy]=useState<'이름'|'포지션'|'능력치'|'나이'|'잠재력'>('이름')
useEffect(() => {
  try {
    saveClubRoster(teamShort, roster as PlayerData[])
  } catch {
    console.warn('선수단 데이터를 저장하지 못했습니다.')
  }
}, [roster, teamShort])


useEffect(() => {
  const refreshStats=()=>{try{const season=Number(localStorage.getItem('lck-manager-season-year')||2026);setSeasonStats(JSON.parse(localStorage.getItem(`lck-player-season-stats-${season}`)||'{}'));setMatchHistory(JSON.parse(localStorage.getItem(`lck-player-match-history-${season}`)||'[]'))}catch{setSeasonStats({});setMatchHistory([])}}
  window.addEventListener('lck-player-stats-updated',refreshStats)
  window.addEventListener('storage',refreshStats)
  return ()=>{window.removeEventListener('lck-player-stats-updated',refreshStats);window.removeEventListener('storage',refreshStats)}
},[])

const roleOrder = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']

const sortedRoster = [...roster].sort((a,b)=>{
  if(sortBy==='포지션') return roleOrder.indexOf(a.role)-roleOrder.indexOf(b.role)||a.name.localeCompare(b.name,'ko')
  if(sortBy==='능력치') return calculateOverall(b)-calculateOverall(a)
  if(sortBy==='나이') return a.age-b.age||a.name.localeCompare(b.name,'ko')
  if(sortBy==='잠재력') return (b.potential??0)-(a.potential??0)||a.name.localeCompare(b.name,'ko')
  return a.name.localeCompare(b.name,'ko')
})

const starters = sortedRoster
  .filter(p => p.status === '주전')
  .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

const substitutes = sortedRoster
  .filter(p => p.status === '후보')
  .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))


  const filteredStarters = starters.filter(
    p => role === '전체' || p.role === role
  )
  const filteredSubstitutes = substitutes.filter(
    p => role === '전체' || p.role === role
  )

  const teamPower = Math.round(starters.reduce((sum, p) => sum + calculateOverall(p), 0) / 5 + (5-starters.length)*11)

  function releasePlayer() {
    if (!selected) return
    if (!window.confirm(`${selected.name} 선수를 방출할까요? 계약 기간이 남았다면 보상금이 발생합니다.`)) return
    const result = releasePlayerFromClub(teamShort, selected.id || selected.name)
    if (!result) return
    setRoster(result.roster as Player[])
    setSelectedName(result.roster[0]?.name || '')
    alert(`방출 완료 · 계약 보상금 ₩${result.compensation.toFixed(1)}억`)
  }

  function retirePlayer() {
    if (!selected) return
    if (!window.confirm(`${selected.name} 선수를 은퇴 처리할까요? 선수단에서 제거되고 구단 은퇴 기록에 보존됩니다.`)) return
    const result = retirePlayerFromClub(teamShort, selected.id || selected.name, currentDate)
    if (!result) return
    setRoster(result.roster as Player[])
    setSelectedName(result.roster[0]?.name || '')
    alert(result.hallOfFameAdded ? `${selected.name} 은퇴 처리 완료 · 명예의 전당에 헌액되었습니다.` : `${selected.name} 은퇴 처리 완료 · 구단 은퇴 기록에 보존되었습니다.`)
  }

  function renewContract() {
    if (!selected?.id) return
    const success = renewPlayerContract(teamShort, selected.id, renewYears)
    if (!success) {
      alert('계약 보너스를 지급할 예산이 부족합니다.')
      return
    }
    setRoster(readClubRoster(teamShort) as Player[])
    alert(`${selected.name} 선수와 ${renewYears}년 재계약했습니다.`)
  }
function changeStatus() {
  if (!selected) return

  if (selected.status === '주전') {
    const sameRoleStarters = roster.filter(
      p => p.status === '주전' && p.role === selected.role
    )

    if (sameRoleStarters.length === 1) {
      alert('해당 포지션에는 반드시 한 명의 주전이 있어야 합니다.')
      return
    }

    setRoster(prev =>
      prev.map(p =>
        p.name === selected.name
          ? { ...p, status: '후보' }
          : p
      )
    )
    return
  }

  const existingStarter = roster.find(
    p => p.status === '주전' && p.role === selected.role
  )

  if (existingStarter) {
    const confirmed = window.confirm(
      `${existingStarter.name} 선수를 후보로 변경하고 ${selected.name} 선수를 주전으로 등록할까요?`
    )

    if (!confirmed) return
  }

  setRoster(prev =>
    prev.map(p => {
      if (p.name === selected.name) {
        return { ...p, status: '주전' }
      }

      if (p.role === selected.role && p.status === '주전') {
        return { ...p, status: '후보' }
      }

      return p
    })
  )
}

const selected =
  roster.find(p => p.name === selectedName) || roster[0] || null
const recentMatches = selected ? matchHistory.filter(match => match.players?.some(player => (selected.id && player.id===selected.id) || player.name===selected.name)).slice(0,5) : []
  return (
    <div className="roster-page">
      <div className="roster-title">
        <div>
          <h1>{teamName} 선수단 관리</h1>
          <p>선수 영입부터 능력치와 팀 전력까지 관리하세요.</p>
        </div>
        <button onClick={onOpenMarket}>이적시장으로 이동 →</button>
      </div>

      <div className="roster-summary">
        <div><span>전체 선수</span><strong>{roster.length}명</strong></div>
        <div><span>주전 선수</span><strong>{starters.length}명</strong></div>
        <div><span>후보 선수</span><strong>{substitutes.length}명</strong></div>
        <div><span>팀 전력</span><strong>{teamPower}</strong></div>
      </div>

      <div className="role-filter">
        {roles.map(r => (
          <button
            key={r}
            className={role === r ? 'active' : ''}
            onClick={() => setRole(r)}
          >
            {r}
          </button>
        ))}
        <label className="roster-sort">
          정렬
          <select value={sortBy} onChange={event=>setSortBy(event.target.value as typeof sortBy)}>
            <option>이름</option>
            <option>포지션</option>
            <option>능력치</option>
            <option>나이</option>
            <option>잠재력</option>
          </select>
        </label>
      </div>

      <div className="roster-layout">
        <div className="roster-list">
          <h2>주전 선수</h2>
          {filteredStarters.map(p => (
            <button
              key={p.name}
              className={`player-card ${selected?.name === p.name ? 'selected' : ''}`}
              onClick={() => {
                setSelectedName(p.name);setProfileOpen(true)
              }}
            >
              {p.imageUrl?<img className="roster-player-image" src={p.imageUrl} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:<span className="roster-player-avatar">{p.name.slice(0,1)}</span>}
              <span className="player-role">{p.role}</span>
              <strong>{p.name}</strong>
              <span>OVR {calculateOverall(p)}</span>
            </button>
          ))}

          <h2>후보 선수</h2>
          {filteredSubstitutes.map(p => (
            <button
              key={p.name}
              className={`player-card ${selected?.name === p.name ? 'selected' : ''}`}
              onClick={() => {
                setSelectedName(p.name);setProfileOpen(true)
              }}
            >
              {p.imageUrl?<img className="roster-player-image" src={p.imageUrl} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:<span className="roster-player-avatar">{p.name.slice(0,1)}</span>}
              <span className="player-role">{p.role}</span>
              <strong>{p.name}</strong>
              <span>OVR {calculateOverall(p)}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className={profileOpen?'player-profile-overlay':'player-detail'}>
            {profileOpen&&<div className="player-profile-toolbar"><div><span>{selected.role} · {selected.team}</span><h2>{selected.name}</h2></div><button onClick={()=>setProfileOpen(false)}>닫기 ×</button></div>}
            {profileOpen&&<nav className="player-profile-tabs">{(['개요','능력치','경기 기록','계약','챔피언'] as const).map(tab=><button className={profileTab===tab?'active':''} key={tab} onClick={()=>setProfileTab(tab)}>{tab}</button>)}</nav>}
            <div className="detail-header">
              <div>
                <span>{selected.role} · {selected.status}</span>
                <h2>{selected.name}</h2>
                <p>{selected.team} · {selected.age}세</p>
              </div>
              <div className="detail-avatar-wrap">{selected.imageUrl?<img src={selected.imageUrl} alt={`${selected.name} 프로필`} onError={e=>{e.currentTarget.style.display='none'}}/>:<span>{selected.name.slice(0,1)}</span>}<strong className="overall-score">{calculateOverall(selected)}</strong></div>
            </div>

            <h3>선수 정보</h3>

            <p>{selected.team} / {selected.role} / {selected.age}세 · 계약 {selected.contractUntil ?? '미정'}년까지</p>
            <div className={`player-contract-status ${selected.contractStatus === '거피셜' ? 'rumored' : selected.contractStatus === '확정' ? 'confirmed' : ''}`}>{selected.contractStatus === '거피셜' ? '거피셜 · 보도 기반 합류 예상' : selected.contractStatus === '확정' ? '2026 로스터 확정' : selected.contractStatus === 'FA' ? '자유 계약 선수' : '계약 유지 또는 발표 대기'}</div>
            <div className="player-contract-strip"><span>연봉 <b>₩{(selected.salary ?? 0).toFixed(1)}억</b></span><span>시장 가치 <b>₩{(selected.value ?? 0).toFixed(1)}억</b></span><span>잠재력 <b>{selected.potential ?? '미평가'}</b></span><span>사기 <b>{selected.morale ?? 76}/100</b></span></div>

            <h3>2026 시즌 기록</h3>
            <div className="player-contract-strip"><span>출전 <b>{seasonStats[selected.name]?.matches??0}회</b></span><span>승리 <b>{seasonStats[selected.name]?.wins??0}회</b></span><span>CS <b>{seasonStats[selected.name]?.cs??0}</b></span><span>K / D / A <b>{seasonStats[selected.name]?.kills??0} / {seasonStats[selected.name]?.deaths??0} / {seasonStats[selected.name]?.assists??0}</b></span><span>MVP <b>{seasonStats[selected.name]?.mvp??0}회</b></span></div>

            <h3>최근 경기 기록</h3>
            <div className="player-recent-matches">
              {recentMatches.length ? recentMatches.map(match => {
                const performance=match.players.find(player => (selected.id && player.id===selected.id) || player.name===selected.name)
                if (!performance) return null
                const opponent=match.blue===selected.team ? match.red : match.blue
                return <div className="player-recent-match" key={match.gameKey}>
                  <div><span>{match.gameNumber}세트 · {opponent}전</span><b className={performance.won?'win':'loss'}>{performance.won?'승':'패'}</b></div>
                  <strong>{performance.championName || performance.championId || '챔피언 미상'}</strong>
                  <span>K/D/A <b>{performance.kills}/{performance.deaths}/{performance.assists}</b></span>
                  <span>CS <b>{performance.cs}</b></span>
                </div>
              }) : <p className="player-record-empty">아직 저장된 경기 기록이 없습니다. 경기를 완료하면 최근 기록이 여기에 표시됩니다.</p>}
            </div>

            <h3>선수 능력치</h3>

            {([
              ['lane', '라인전'],
              ['teamfight', '한타'],
              ['macro', '운영'],
              ['mechanics', '피지컬'],
              ['consistency', '일관성'],
              ['clutch', '중요 경기'],
            ] as const).map(([key, label]) => (
              <div className="stat-row" key={key}>
                <span>{label}</span>
                <strong>{selected[key] ?? 75}</strong>
                <div className="stat-bar">
                  <div style={{ width: `${selected[key] ?? 75}%` }} />
                </div>
              </div>
            ))}
            <div className="player-extra-stats">
              <div><span>피지컬</span><b>{selected.physical ?? 75}</b></div><div><span>시야</span><b>{selected.vision ?? 75}</b></div><div><span>오브젝트 판단</span><b>{selected.objectives ?? 75}</b></div><div><span>소통</span><b>{selected.communication ?? 75}</b></div><div><span>팀워크</span><b>{selected.teamwork ?? 75}</b></div><div><span>챔피언 폭</span><b>{selected.championPool ?? 84}</b></div>
            </div>
            <p className="player-source-note">데이터 출처: {selected.dataSource==='official'?'공식 발표':selected.dataSource==='report'?'보도 자료':selected.dataSource==='rumor'?'영입설':'게임용 추정 평가'} · 확인일 {selected.sourceCheckedAt||'2026-11-24'} · 능력치는 공개 커리어 기반 추정치입니다.</p>

            <div className="champion-list">
              <h3>주요 챔피언 및 숙련도</h3>
              <p className="champion-readonly-note">챔피언 숙련도는 선수별 경기 기록과 훈련 결과로만 관리됩니다.</p>
              {selected.champions.map(champion => {
                const name = typeof champion === 'string' ? champion : champion.name
                const mastery = typeof champion === 'string' ? 0 : Math.round(champion.mastery ?? 0)
                return (
                  <div key={name} className="stat-row">
                    <strong>{name}</strong>
                    <span className="champion-mastery-value">{mastery > 0 ? `${mastery}/100` : '기록 없음'}</span>
                    <span>{mastery > 0 ? '훈련으로 성장' : '훈련 필요'}</span>
                  </div>
                )
              })}
            </div>

            <div className="edit-actions">
              <button onClick={changeStatus}>{selected.status === '주전' ? '후보로 변경' : '주전으로 변경'}</button>
              <div className="contract-renew-control"><select value={renewYears} onChange={e=>setRenewYears(Number(e.target.value))}><option value={1}>1년</option><option value={2}>2년</option><option value={3}>3년</option></select><button onClick={renewContract}>계약 연장</button></div>
              <button className="release-btn" onClick={releasePlayer}>선수 방출</button>
              <button className="retire-player-btn" onClick={retirePlayer}>은퇴 처리</button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
