
import { useEffect, useState } from 'react'
import './Tactics.css'

type Role = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'
type RosterPlayer = {
  name: string
  role: Role
  status: string
  champions: {
    name: string
    mastery: number
  }[]
}

const ROSTER_STORAGE_KEY = 'lck-manager-roster'

function loadTacticsRoster(): RosterPlayer[] {
  try {
    const saved = localStorage.getItem(ROSTER_STORAGE_KEY)

    if (saved) {
      return JSON.parse(saved).map((player: any) => ({
        ...player,
        champions: (player.champions || []).map((champion: any) =>
          typeof champion === 'string'
            ? { name: champion, mastery: 70 }
            : champion
        ),
      }))
    }
  } catch {
    console.warn('선수단 데이터를 불러오지 못했습니다.')
  }

  return []
}
const roles: Role[] = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']

const allChampions = [
  '가렌', '갈리오', '갱플랭크', '그라가스', '그레이브즈',
  '그웬', '나르', '나미', '나서스', '노틸러스',
  '녹턴', '누누와 윌럼프', '니달리', '니코', '닐라',
  '다리우스', '다이애나', '드레이븐', '라이즈', '라칸',
  '람머스', '럭스', '럼블', '레나타 글라스크', '레넥톤',
  '레오나', '렉사이', '렐', '루시안', '룰루',
  '르블랑', '리 신', '리븐', '리산드라', '릴리아',
  '마스터 이', '마오카이', '말자하', '말파이트', '멜',
  '모데카이저', '모르가나', '문도 박사', '미스 포츈', '밀리오',
  '바드', '바루스', '바이', '베이가', '베인',
  '벡스', '벨베스', '브라움', '브랜드', '블라디미르',
  '블리츠크랭크', '비에고', '빅토르', '뽀삐', '사미라',
  '사이온', '사일러스', '샤코', '세나', '세라핀',
  '세주아니', '세트', '소나', '소라카', '쉔',
  '쉬바나', '스웨인', '스카너', '시비르', '신드라',
  '신지드', '쓰레쉬', '아리', '아무무', '아우렐리온 솔',
  '아이번', '아지르', '아칼리', '아크샨', '아트록스',
  '아펠리오스', '알리스타', '애니', '애니비아', '애쉬',
  '야스오', '에코', '엘리스', '오공', '오른',
  '오리아나', '올라프', '요네', '요릭', '우디르',
  '우르곳', '워윅', '유미', '이렐리아', '이블린',
  '이즈리얼', '일라오이', '자르반 4세', '자야', '자이라',
  '자크', '잔나', '잭스', '제드', '제라스',
  '제리', '제이스', '조이', '직스', '진',
  '질리언', '징크스', '초가스', '카르마', '카밀',
  '카사딘', '카서스', '카시오페아', '카이사', '카직스',
  '카타리나', '칼리스타', '케넨', '케이틀린', '케인',
  '케일', '코그모', '코르키', '퀸', '크산테',
  '클레드', '키아나', '킨드레드', '타릭', '탈론',
  '탈리야', '탐 켄치', '트런들', '트리스타나', '트린다미어',
  '트위스티드 페이트', '트위치', '티모', '파이크', '판테온',
  '피들스틱', '피오라', '피즈', '하이머딩거', '흐웨이',

  // 추가 챔피언
  '암베사', '오로라', '브라이어', '나피리', '헤카림', '렝가',
  '스몰더', '볼리베어', '벨코즈', '신 짜오',
  '유나라', '자헨', '로크'
].sort((a, b) => a.localeCompare(b, 'ko'))

const strategies = [
  '균형 잡힌 운영',
  '초반 공격 중심',
  '후반 성장 중심',
  '한타 중심',
  '스플릿 푸시 중심',
]

type DraftState = {
  ourPicks: Record<Role, string>
  enemyPicks: Record<Role, string>
  ourBans: string[]
  enemyBans: string[]
  strategy: string
}

const emptyPicks: Record<Role, string> = {
  TOP: '',
  JNG: '',
  MID: '',
  ADC: '',
  SUP: '',
}

const initialDraft: DraftState = {
  ourPicks: { ...emptyPicks },
  enemyPicks: { ...emptyPicks },
  ourBans: ['', '', '', '', ''],
  enemyBans: ['', '', '', '', ''],
  strategy: '균형 잡힌 운영',
}

const STORAGE_KEY = 'lck-manager-tactics'

function loadDraft(): DraftState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...initialDraft, ...JSON.parse(saved) }
    }
  } catch {
    console.warn('밴픽 데이터를 불러오지 못했습니다.')
  }
  return initialDraft
}

export default function Tactics() {
  const [draft, setDraft] = useState<DraftState>(loadDraft)
const [roster, setRoster] = useState<RosterPlayer[]>(loadTacticsRoster)

useEffect(() => {
  const refreshRoster = () => {
    setRoster(loadTacticsRoster())
  }

  window.addEventListener('lck-roster-updated', refreshRoster)

  return () => {
    window.removeEventListener('lck-roster-updated', refreshRoster)
  }
}, [])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  function updatePick(
    side: 'ourPicks' | 'enemyPicks',
    role: Role,
    champion: string
  ) {
    setDraft(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [role]: champion,
      },
    }))
  }

  function updateBan(
    side: 'ourBans' | 'enemyBans',
    index: number,
    champion: string
  ) {
    setDraft(prev => ({
      ...prev,
      [side]: prev[side].map((item, i) =>
        i === index ? champion : item
      ),
    }))
  }
function getPlayerForRole(role: Role) {
  return (
    roster.find(p => p.role === role && p.status === '주전') ||
    roster.find(p => p.role === role) ||
    null
  )
}

function getChampionMastery(role: Role, champion: string) {
  const player = getPlayerForRole(role)

  if (!player || !champion) return null

  return player.champions.find(c => c.name === champion)?.mastery ?? null
}
  const ourPickCount = Object.values(draft.ourPicks).filter(Boolean).length
  const enemyPickCount = Object.values(draft.enemyPicks).filter(Boolean).length
  const totalBans = [...draft.ourBans, ...draft.enemyBans].filter(Boolean).length

  const engageChampions = [
    '말파이트', '럼블', '자르반 4세', '세주아니',
    '갈리오', '라칸', '노틸러스', '레오나', '렐',
  ]

  const scalingChampions = [
    '그웬', '잭스', '아지르', '오리아나',
    '징크스', '카이사', '자야',
  ]

  const ourSelected = Object.values(draft.ourPicks).filter(Boolean)

  const engageCount = ourSelected.filter(champion =>
    engageChampions.includes(champion)
  ).length

  const scalingCount = ourSelected.filter(champion =>
    scalingChampions.includes(champion)
  ).length

  const compositionScore = Math.min(
    100,
    ourPickCount * 12 + engageCount * 4 + scalingCount * 4
  )

  function resetDraft() {
    if (!window.confirm('현재 밴픽과 전술 설정을 모두 초기화할까요?')) return
    setDraft(initialDraft)
  }

  return (
    <div className="tactics-page">
      <div className="tactics-heading">
        <div>
          <span>TACTICS & DRAFT</span>
          <h1>전술 및 밴픽</h1>
          <p>우리 팀의 챔피언을 선택하고 승리를 위한 전략을 준비하세요.</p>
        </div>
        <button className="tactics-reset" onClick={resetDraft}>
          밴픽 초기화
        </button>
      </div>

      <div className="tactics-overview">
        <div>
          <span>우리 팀 픽</span>
          <strong>{ourPickCount}/5</strong>
        </div>
        <div>
          <span>상대 팀 픽</span>
          <strong>{enemyPickCount}/5</strong>
        </div>
        <div>
          <span>전체 밴</span>
          <strong>{totalBans}/10</strong>
        </div>
        <div>
          <span>우리 팀 조합 점수</span>
          <strong>{compositionScore}</strong>
        </div>
      </div>

      <section className="tactics-panel">
        <div className="tactics-panel-title">
          <div>
            <span>CHAMPION SELECT</span>
            <h2>챔피언 선택</h2>
          </div>
          <span className="tactics-status">
            {ourPickCount === 5 && enemyPickCount === 5
              ? 'PICK COMPLETE'
              : 'IN PROGRESS'}
          </span>
        </div>

        <div className="draft-columns">
          <div className="draft-team">
            <h3><span className="team-dot our-dot" />우리 팀 · T1</h3>

            {roles.map(role => (
              <div className="draft-slot" key={role}>
                <span>{role}</span>
                <select
                  value={draft.ourPicks[role]}
                  onChange={e =>
                    updatePick('ourPicks', role, e.target.value)
                  }
                >
                  <option value="">챔피언 선택</option>
                  {allChampions.map(champion => (
                    <option key={champion} value={champion}>
                      {champion}
                    </option>
                  ))}
                </select>
                {draft.ourPicks[role] && (
  <small>
    {getPlayerForRole(role)?.name || '선수 미등록'} · 숙련도{' '}
    {getChampionMastery(role, draft.ourPicks[role]) !== null
      ? `${getChampionMastery(role, draft.ourPicks[role])}/100`
      : '미등록'}
  </small>
)}
              </div>
            ))}
          </div>

          <div className="draft-vs">VS</div>

          <div className="draft-team enemy-team">
            <h3><span className="team-dot enemy-dot" />상대 팀</h3>

            {roles.map(role => (
              <div className="draft-slot" key={role}>
                <span>{role}</span>
                <select
                  value={draft.enemyPicks[role]}
                  onChange={e =>
                    updatePick('enemyPicks', role, e.target.value)
                  }
                >
                  <option value="">챔피언 선택</option>
                  {allChampions.map(champion => (
                    <option key={champion} value={champion}>
                      {champion}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tactics-panel">
        <div className="tactics-panel-title">
          <div>
            <span>BAN PHASE</span>
            <h2>챔피언 금지</h2>
          </div>
          <p>각 팀이 금지할 챔피언을 선택하세요.</p>
        </div>

        <div className="ban-columns">
          <div className="ban-team">
            <h3>우리 팀 밴</h3>
            {draft.ourBans.map((champion, index) => (
              <select
                key={index}
                value={champion}
                onChange={e =>
                  updateBan('ourBans', index, e.target.value)
                }
              >
                <option value="">밴 {index + 1} 선택</option>
                {allChampions.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            ))}
          </div>

          <div className="ban-team">
            <h3>상대 팀 밴</h3>
            {draft.enemyBans.map((champion, index) => (
              <select
                key={index}
                value={champion}
                onChange={e =>
                  updateBan('enemyBans', index, e.target.value)
                }
              >
                <option value="">밴 {index + 1} 선택</option>
                {allChampions.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
      </section>

      <section className="tactics-bottom-grid">
        <div className="tactics-panel">
          <span className="tactics-small-title">TEAM STRATEGY</span>
          <h2>팀 전술 설정</h2>
          <p>이번 경기에서 사용할 팀의 기본 전략을 선택하세요.</p>

          <select
            className="strategy-select"
            value={draft.strategy}
            onChange={e =>
              setDraft(prev => ({ ...prev, strategy: e.target.value }))
            }
          >
            {strategies.map(strategy => (
              <option key={strategy} value={strategy}>{strategy}</option>
            ))}
          </select>
        </div>

        <div className="tactics-panel composition-panel">
          <span className="tactics-small-title">COMPOSITION ANALYSIS</span>
          <h2>우리 팀 조합 분석</h2>

          <div className="composition-stat">
            <span>챔피언 선택</span>
            <strong>{ourPickCount}/5</strong>
          </div>
          <div className="composition-stat">
            <span>진입 및 이니시에이팅 챔피언</span>
            <strong>{engageCount}명</strong>
          </div>
          <div className="composition-stat">
            <span>후반 성장형 챔피언</span>
            <strong>{scalingCount}명</strong>
          </div>
          <div className="composition-score">
            <span>조합 점수</span>
            <strong>{compositionScore}<small> / 100</small></strong>
          </div>
          <p className="tactics-disclaimer">
            ※ 조합 점수는 현재 선택된 챔피언을 기준으로 한 초기 평가입니다.
          </p>
        </div>
      </section>
    </div>
  )
}
