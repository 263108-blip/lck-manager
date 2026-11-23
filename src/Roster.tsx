
import { useEffect, useState } from 'react'
type ChampionMastery = {
  name: string
  mastery: number
}
type Player = {
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
}

const initialPlayers: Player[] = [
  { name: 'Zeus', role: 'TOP', team: 'T1', age: 22, overall: 96, lane: 98, teamfight: 96, macro: 94, mechanics: 98, champions: ['제이스', '그웬', '럼블'], status: '주전' },
  { name: 'Oner', role: 'JNG', team: 'T1', age: 23, overall: 95, lane: 93, teamfight: 96, macro: 96, mechanics: 95, champions: ['리 신', '바이', '자르반 4세'], status: '주전' },
  { name: 'Faker', role: 'MID', team: 'T1', age: 30, overall: 99, lane: 98, teamfight: 99, macro: 100, mechanics: 98, champions: ['아지르', '오리아나', '갈리오'], status: '주전' },
  { name: 'Gumayusi', role: 'ADC', team: 'T1', age: 24, overall: 96, lane: 97, teamfight: 98, macro: 94, mechanics: 97, champions: ['바루스', '진', '징크스'], status: '주전' },
  { name: 'Keria', role: 'SUP', team: 'T1', age: 24, overall: 98, lane: 99, teamfight: 98, macro: 97, mechanics: 99, champions: ['바드', '파이크', '라칸'], status: '주전' },
  { name: 'Canna', role: 'TOP', team: 'T1', age: 26, overall: 85, lane: 86, teamfight: 84, macro: 85, mechanics: 85, champions: ['레넥톤', '그웬'], status: '후보' },
  { name: 'Poby', role: 'MID', team: 'T1', age: 20, overall: 80, lane: 80, teamfight: 81, macro: 79, mechanics: 80, champions: ['아리', '아지르'], status: '후보' },
]

const roles = ['전체', 'TOP', 'JNG', 'MID', 'ADC', 'SUP']
const STORAGE_KEY = 'lck-manager-roster'

function calculateOverall(player: Player) {
  return Math.round(
    (player.lane + player.teamfight + player.macro + player.mechanics) / 4
  )
}

function loadRoster(): Player[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      const parsed = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        return parsed.map((player: Player) => ({
          ...player,
          champions: (player.champions || []).map(champion =>
            typeof champion === 'string'
              ? { name: champion, mastery: 70 }
              : champion
          ),
        }))
      }
    }
  } catch {
    console.warn('저장된 선수단 데이터를 불러오지 못했습니다.')
  }

  return initialPlayers
}

export default function Roster() {
  const [roster, setRoster] = useState<Player[]>(loadRoster)
  const [role, setRole] = useState('전체')
  const [selectedName, setSelectedName] = useState('Zeus')
  const [recruiting, setRecruiting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('TOP')
const [newChampion, setNewChampion] = useState('')
const [newMastery, setNewMastery] = useState(70)
useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roster))
    window.dispatchEvent(new Event('lck-roster-updated'))
  } catch {
    console.warn('선수단 데이터를 저장하지 못했습니다.')
  }
}, [roster])


const roleOrder = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']

const starters = roster
  .filter(p => p.status === '주전')
  .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

const substitutes = roster
  .filter(p => p.status === '후보')
  .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))


  const filteredStarters = starters.filter(
    p => role === '전체' || p.role === role
  )
  const filteredSubstitutes = substitutes.filter(
    p => role === '전체' || p.role === role
  )

  const teamPower = starters.length
    ? Math.round(
        starters.reduce((sum, p) => sum + calculateOverall(p), 0) /
        starters.length
      )
    : 0

  function updateSelected(key: keyof Player, value: string | number) {
    if (!selected) return

    const updated = { ...selected, [key]: value }
    if (['lane', 'teamfight', 'macro', 'mechanics'].includes(key)) {
      updated.overall = calculateOverall(updated)
    }

    setRoster(prev =>
      prev.map(p => p.name === selected.name ? updated : p)
    )
  }

  function recruitPlayer() {
    const name = newName.trim()

    if (!name) {
      alert('선수 이름을 입력해 주세요.')
      return
    }

    if (roster.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      alert('이미 등록된 선수입니다.')
      return
    }

    const player: Player = {
      name,
      role: newRole,
      team: 'T1',
      age: 20,
      overall: 70,
      lane: 70,
      teamfight: 70,
      macro: 70,
      mechanics: 70,
      champions: ['미등록'],
      status: '후보',
    }

    setRoster(prev => [...prev, player])
    setSelectedName(player.name)
    setNewName('')
    setRecruiting(false)
  }

  function releasePlayer() {
    if (!selected) return
    if (!window.confirm(`${selected.name} 선수를 방출할까요?`)) return

    const nextRoster = roster.filter(p => p.name !== selected.name)
    setRoster(nextRoster)
    setSelectedName(nextRoster[0]?.name || '')
    setEditing(false)
  }
function addChampion() {
  if (!selected || !newChampion.trim()) {
    alert('챔피언 이름을 입력해 주세요.')
    return
  }

  const name = newChampion.trim()

  if (
    selected.champions.some(c =>
      (typeof c === 'string' ? c : c.name) === name
    )
  ) {
    alert('이미 등록된 챔피언입니다.')
    return
  }

  setRoster(prev =>
    prev.map(p =>
      p.name === selected.name
        ? {
            ...p,
            champions: [
              ...p.champions,
              { name, mastery: newMastery },
            ],
          }
        : p
    )
  )

  setNewChampion('')
  setNewMastery(70)
}

function updateChampionMastery(name: string, mastery: number) {
  if (!selected) return

  setRoster(prev =>
    prev.map(p =>
      p.name === selected.name
        ? {
            ...p,
            champions: p.champions.map(c => ({
              name: typeof c === 'string' ? c : c.name,
              mastery:
                (typeof c === 'string' ? c : c.name) === name
                  ? mastery
                  : typeof c === 'string' ? 70 : c.mastery,
            })),
          }
        : p
    )
  )
}

function removeChampion(name: string) {
  if (!selected) return

  setRoster(prev =>
    prev.map(p =>
      p.name === selected.name
        ? {
            ...p,
            champions: p.champions.filter(c =>
              (typeof c === 'string' ? c : c.name) !== name
            ),
          }
        : p
    )
  )
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
  return (
    <div className="roster-page">
      <div className="roster-title">
        <div>
          <h1>선수단 관리</h1>
          <p>선수 영입부터 능력치와 팀 전력까지 관리하세요.</p>
        </div>
        <button onClick={() => setRecruiting(!recruiting)}>
          {recruiting ? '영입 취소' : '+ 선수 영입'}
        </button>
      </div>

      {recruiting && (
        <div className="recruit-form">
          <h3>신규 선수 영입</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="선수 이름"
          />
          <select value={newRole} onChange={e => setNewRole(e.target.value)}>
            {roles.slice(1).map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={recruitPlayer}>영입하기</button>
        </div>
      )}

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
      </div>

      <div className="roster-layout">
        <div className="roster-list">
          <h2>주전 선수</h2>
          {filteredStarters.map(p => (
            <button
              key={p.name}
              className={`player-card ${selected?.name === p.name ? 'selected' : ''}`}
              onClick={() => {
                setSelectedName(p.name)
                setEditing(false)
              }}
            >
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
                setSelectedName(p.name)
                setEditing(false)
              }}
            >
              <span className="player-role">{p.role}</span>
              <strong>{p.name}</strong>
              <span>OVR {calculateOverall(p)}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="player-detail">
            <div className="detail-header">
              <div>
                <span>{selected.role} · {selected.status}</span>
                <h2>{selected.name}</h2>
                <p>{selected.team} · {selected.age}세</p>
              </div>
              <strong className="overall-score">{calculateOverall(selected)}</strong>
            </div>

            <h3>선수 정보</h3>

            {editing ? (
              <div className="player-edit-info">
                <label>포지션</label>
                <select
                  value={selected.role}
                  onChange={e => updateSelected('role', e.target.value)}
                >
                  {roles.slice(1).map(r => <option key={r}>{r}</option>)}
                </select>

                <label>나이</label>
                <input
                  type="number"
                  min="16"
                  max="50"
                  value={selected.age}
                  onChange={e => updateSelected('age', Math.max(16, Number(e.target.value)))}
                />

                <label>소속팀</label>
                <input
                  value={selected.team}
                  onChange={e => updateSelected('team', e.target.value)}
                />
              </div>
            ) : (
              <p>{selected.team} / {selected.role} / {selected.age}세</p>
            )}

            <h3>선수 능력치</h3>

            {([
              ['lane', '라인전'],
              ['teamfight', '한타'],
              ['macro', '운영'],
              ['mechanics', '피지컬'],
            ] as const).map(([key, label]) => (
              <div className="stat-row" key={key}>
                <span>{label}</span>
                {editing ? (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={selected[key]}
                    onChange={e =>
                      updateSelected(
                        key,
                        Math.min(100, Math.max(1, Number(e.target.value)))
                      )
                    }
                  />
                ) : (
                  <strong>{selected[key]}</strong>
                )}
                <div className="stat-bar">
                  <div style={{ width: `${selected[key]}%` }} />
                </div>
              </div>
            ))}

            <div className="champion-list">
  <h3>주요 챔피언 및 숙련도</h3>

  {selected.champions.map(champion => {
    const name =
      typeof champion === 'string' ? champion : champion.name

    const mastery =
      typeof champion === 'string' ? 70 : champion.mastery

    return (
      <div key={name} className="stat-row">
        <strong>{name}</strong>

        <input
          type="number"
          min="1"
          max="100"
          value={mastery}
          onChange={e =>
            updateChampionMastery(
              name,
              Math.min(100, Math.max(1, Number(e.target.value)))
            )
          }
          style={{ width: '65px' }}
        />

        <span>/ 100</span>

        <button onClick={() => removeChampion(name)}>
          삭제
        </button>
      </div>
    )
  })}

  <div className="champion-add">
    <input
      value={newChampion}
      onChange={e => setNewChampion(e.target.value)}
      placeholder="챔피언 이름"
    />

    <input
      type="number"
      min="1"
      max="100"
      value={newMastery}
      onChange={e =>
        setNewMastery(
          Math.min(100, Math.max(1, Number(e.target.value)))
        )
      }
    />

    <button onClick={addChampion}>챔피언 추가</button>
  </div>
</div>

            <div className="edit-actions">
              {editing ? (
                <button onClick={() => setEditing(false)}>수정 완료</button>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}>정보 및 능력치 수정</button>
                  <button onClick={changeStatus}>
                    {selected.status === '주전' ? '후보로 변경' : '주전으로 변경'}
                  </button>
                  <button className="release-btn" onClick={releasePlayer}>
                    선수 방출
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
