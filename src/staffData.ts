export type StaffProfile = {
  id: string
  name: string
  realName: string
  role: '감독' | '코치' | '전략 코치' | '분석 코치' | '팀 디렉터'
  birthDate?: string
  rating: number
  salary: number
  focus: string
  sourceNote?: string
}

export const staffByTeam: Record<string, StaffProfile[]> = {
  T1: [
    {id:'t1-staff-kkoma',name:'kkOma',realName:'김정균',role:'감독',birthDate:'1985-12-23',rating:95,salary:2.2,focus:'팀 운영 · 선수 관리'},
    {id:'t1-staff-tom',name:'Tom',realName:'임재현',role:'코치',birthDate:'1995-05-22',rating:91,salary:1.1,focus:'정글 · 밴픽'},
    {id:'t1-staff-mata',name:'Mata',realName:'조세형',role:'전략 코치',birthDate:'1994-02-27',rating:94,salary:1.3,focus:'서포팅 · 운영'},
    {id:'t1-staff-easyhoon',name:'Easyhoon',realName:'이지훈',role:'분석 코치',birthDate:'1992-11-23',rating:91,salary:1.0,focus:'미드 라인 · 상대 분석'},
  ],
  'GEN.G': [
    {id:'gen-staff-ryu',name:'Ryu',realName:'유상욱',role:'감독',birthDate:'1994-01-18',rating:94,salary:1.8,focus:'밴픽 · 경기 운영'},
    {id:'gen-staff-lyn',name:'Lyn',realName:'',role:'코치',rating:87,salary:.8,focus:'전략 · 선수 훈련'},
    {id:'gen-staff-nova',name:'Nova',realName:'',role:'분석 코치',rating:86,salary:.7,focus:'상대 분석'},
  ],
  HLE: [
    {id:'hle-staff-homme',name:'Homme',realName:'윤성영',role:'감독',birthDate:'1985-01-01',rating:96,salary:2.1,focus:'매크로 · 팀 운영'},
    {id:'hle-staff-mowgli',name:'Mowgli',realName:'이재하',role:'코치',birthDate:'1998-04-14',rating:90,salary:1.0,focus:'정글 · 성장 훈련'},
    {id:'hle-staff-sin',name:'Sin',realName:'',role:'분석 코치',rating:86,salary:.7,focus:'상대 분석'},
  ],
  DK: [
    {id:'dk-staff-cvmax',name:'cvMax',realName:'김대호',role:'감독',birthDate:'1990-07-07',rating:95,salary:2.0,focus:'선수 육성 · 밴픽'},
    {id:'dk-staff-poohmandu',name:'PoohManDu',realName:'',role:'코치',rating:90,salary:1.0,focus:'서포팅 · 팀 운영'},
    {id:'dk-staff-hachani',name:'Hachani',realName:'',role:'전략 코치',rating:87,salary:.8,focus:'라인전 · 운영'},
  ],
  KT: [
    {id:'kt-staff-score',name:'Score',realName:'고동빈',role:'감독',birthDate:'1992-07-08',rating:94,salary:1.8,focus:'정글 · 운영'},
    {id:'kt-staff-museong',name:'Museong',realName:'',role:'코치',rating:87,salary:.8,focus:'전략 · 선수 훈련'},
    {id:'kt-staff-sonstar',name:'Sonstar',realName:'',role:'분석 코치',rating:86,salary:.7,focus:'상대 분석'},
  ],
  DRX: [
    {id:'drx-staff-joker',name:'Joker',realName:'조재읍',role:'감독',birthDate:'1991-12-11',rating:90,salary:1.3,focus:'서포팅 · 팀워크'},
    {id:'drx-staff-naehyun',name:'Naehyun',realName:'',role:'코치',rating:86,salary:.7,focus:'미드 · 밴픽'},
    {id:'drx-staff-saroo',name:'Saroo',realName:'',role:'분석 코치',rating:84,salary:.6,focus:'상대 분석'},
  ],
  'BNK FEARX': [
    {id:'bfx-staff-edo',name:'Edo',realName:'박준석',role:'감독',birthDate:'1987-10-14',rating:89,salary:1.3,focus:'밴픽 · 선수 육성'},
    {id:'bfx-staff-lira',name:'Lira',realName:'남태유',role:'코치',birthDate:'1995-01-15',rating:88,salary:.9,focus:'정글 · 경기 분석'},
    {id:'bfx-staff-rather',name:'Rather',realName:'신형섭',role:'전략 코치',birthDate:'1996-11-26',rating:88,salary:.9,focus:'미드 · 전략'},
  ],
  NS: [
    {id:'ns-staff-dandy',name:'DanDy',realName:'최인규',role:'감독',birthDate:'1994-01-03',rating:91,salary:1.4,focus:'정글 · 팀 운영'},
    {id:'ns-staff-chelly',name:'Chelly',realName:'',role:'코치',rating:85,salary:.7,focus:'선수 훈련'},
    {id:'ns-staff-crazy',name:'Crazy',realName:'',role:'분석 코치',rating:85,salary:.7,focus:'상대 분석'},
  ],
  BRO: [
    {id:'bro-staff-ssong',name:'Ssong',realName:'김상수',role:'감독',birthDate:'1989-10-05',rating:91,salary:1.3,focus:'밴픽 · 팀 운영',sourceNote:'생년월일 표기가 자료마다 달라 교차 확인 필요'},
    {id:'bro-staff-duke',name:'Duke',realName:'이호성',role:'코치',birthDate:'1994-12-19',rating:90,salary:.9,focus:'탑 라인 · 경기 준비'},
  ],
  DN: [
    {id:'dn-staff-ggoong',name:'Ggoong',realName:'유병준',role:'감독',birthDate:'1993-06-26',rating:89,salary:1.2,focus:'미드 · 운영'},
    {id:'dn-staff-minit',name:'Minit',realName:'양현민',role:'코치',birthDate:'1998-02-03',rating:84,salary:.7,focus:'서포팅 · 선수 성장'},
  ],
}

export function ageAtDate(birthDate: string | undefined, date: string): number | null {
  if (!birthDate) return null
  const birth = new Date(`${birthDate}T00:00:00`)
  const at = new Date(`${date}T00:00:00`)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(at.getTime()) || birth > at) return null
  let age = at.getFullYear() - birth.getFullYear()
  const hadBirthday = at.getMonth() > birth.getMonth() || (at.getMonth() === birth.getMonth() && at.getDate() >= birth.getDate())
  if (!hadBirthday) age -= 1
  return age
}
