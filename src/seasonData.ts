export type Role = 'TOP' | 'JNG' | 'MID' | 'ADC' | 'SUP'
export type PlayerData = {
  id: string
  name: string
  role: Role
  age: number
  overall: number
  potential: number
  lane: number
  mechanics: number
  macro: number
  teamfight: number
  consistency: number
  clutch: number
  champions: (string | {name:string;mastery?:number})[]
  salary: number
  value: number
  contractUntil: number
  contractStatus: '확정' | '계약 유지' | '미확정' | '거피셜' | 'FA'
  team: string
  status: '주전' | '후보'
  morale?: number
}
export type ClubData = {
  name: string
  short: string
  color: string
  budget: number
  reputation: number
  facilities: number
  coach: string
  players: PlayerData[]
}
const p = (id:string,name:string,role:Role,age:number,ovr:number,pot:number,lane:number,mech:number,macro:number,teamfight:number,consistency:number,clutch:number,salary:number,value:number,contractUntil:number,team:string,champions:string[],contractStatus:PlayerData['contractStatus']='계약 유지',status:PlayerData['status']='주전'):PlayerData => ({id,name,role,age,overall:ovr,potential:pot,lane,mechanics:mech,macro,teamfight,consistency,clutch,salary,value,contractUntil,team,champions,contractStatus,status,morale:76})
// 2026 LCK Round 3-4 main rosters. Overall/potential/financial values are game-balance estimates.
// 2026 LCK Round 3-4. Competitive ratings and finances are game-balance estimates.
export const seasonClubs: ClubData[] = [
{name:'T1',short:'T1',color:'#d92e46',budget:95,reputation:100,facilities:96,coach:'kkOma',players:[
p('2026-t1-doran','Doran','TOP',25,93,95,94,93,91,94,92,94,18,48,2026,'T1',['잭스','레넥톤','크산테','럼블']),
p('2026-t1-oner','Oner','JNG',23,96,97,94,98,97,97,95,97,20,58,2026,'T1',['리 신','바이','비에고','신 짜오']),
p('2026-t1-faker','Faker','MID',29,99,99,98,98,100,99,99,100,30,80,2026,'T1',['아지르','오리아나','갈리오','아리']),
p('2026-t1-peyz','Peyz','ADC',20,94,98,96,97,94,97,94,95,18,52,2026,'T1',['카이사','징크스','바루스','제리']),
p('2026-t1-keria','Keria','SUP',23,98,99,99,99,98,98,96,99,22,62,2026,'T1',['바드','파이크','라칸','노틸러스']),
]},
{name:'Gen.G',short:'GEN.G',color:'#c5a64b',budget:100,reputation:99,facilities:97,coach:'Ryu',players:[
p('2026-gen-kiin','Kiin','TOP',26,97,98,98,97,97,98,97,98,27,68,2026,'GEN.G',['크산테','잭스','럼블','레넥톤']),
p('2026-gen-canyon','Canyon','JNG',24,98,99,97,99,99,98,97,99,29,76,2026,'GEN.G',['니달리','리 신','비에고','세주아니']),
p('2026-gen-chovy','Chovy','MID',24,99,100,100,100,99,98,99,98,29,78,2026,'GEN.G',['요네','아리','아지르','오리아나']),
p('2026-gen-ruler','Ruler','ADC',27,98,99,99,99,98,100,99,100,27,70,2026,'GEN.G',['징크스','제리','바루스','카이사']),
p('2026-gen-duro','Duro','SUP',23,90,94,90,91,92,91,89,90,9,24,2026,'GEN.G',['렐','라칸','노틸러스','알리스타']),
]},
{name:'Hanwha Life Esports',short:'HLE',color:'#e65b25',budget:105,reputation:98,facilities:96,coach:'Homme',players:[
p('2026-hle-zeus','Zeus','TOP',21,97,99,99,99,95,97,95,98,28,76,2026,'HLE',['제이스','그웬','럼블','잭스']),
p('2026-hle-kanavi','Kanavi','JNG',25,97,98,96,98,98,97,96,98,28,70,2026,'HLE',['리 신','비에고','세주아니','신 짜오']),
p('2026-hle-zeka','Zeka','MID',23,95,97,95,97,93,97,94,98,20,52,2026,'HLE',['아칼리','사일러스','요네','아지르']),
p('2026-hle-gumayusi','Gumayusi','ADC',23,98,99,99,99,96,100,98,100,24,66,2026,'HLE',['진','바루스','징크스','애쉬']),
p('2026-hle-delight','Delight','SUP',25,95,97,95,95,97,97,95,96,17,42,2026,'HLE',['라칸','렐','노틸러스','알리스타']),
]},
{name:'Dplus KIA',short:'DK',color:'#9da9c8',budget:100,reputation:94,facilities:95,coach:'cvMax',players:[
p('2026-dk-siwoo','Siwoo','TOP',18,88,97,88,91,86,89,84,88,6,22,2026,'DK',['제이스','럼블','크산테','그웬']),
p('2026-dk-lucid','Lucid','JNG',22,91,97,89,94,93,92,89,92,12,34,2026,'DK',['비에고','바이','리 신','신 짜오']),
p('2026-dk-showmaker','ShowMaker','MID',25,95,97,94,97,99,97,95,98,20,54,2026,'DK',['아지르','신드라','아리','요네']),
p('2026-dk-smash','Smash','ADC',21,92,98,93,96,91,95,91,93,12,36,2026,'DK',['징크스','카이사','바루스','제리']),
p('2026-dk-career','Career','SUP',21,85,93,83,87,86,86,83,85,6,18,2026,'DK',['렐','라칸','노틸러스','레오나']),
]},
{name:'KT Rolster',short:'KT',color:'#e94a50',budget:82,reputation:91,facilities:90,coach:'Score',players:[
p('2026-kt-perfect','PerfecT','TOP',21,91,96,92,93,91,92,90,91,10,32,2026,'KT',['크산테','잭스','레넥톤','럼블']),
p('2026-kt-cuzz','Cuzz','JNG',26,93,94,91,94,96,93,94,95,15,38,2026,'KT',['리 신','비에고','세주아니','자르반 4세']),
p('2026-kt-bdd','Bdd','MID',26,95,96,97,96,97,95,96,97,19,48,2026,'KT',['아지르','오리아나','아리','신드라']),
p('2026-kt-jiwoo','Jiwoo','ADC',21,90,95,91,94,89,93,88,91,9,28,2026,'KT',['카이사','징크스','제리','이즈리얼']),
p('2026-kt-effort','Effort','SUP',25,87,90,86,88,91,89,87,88,7,20,2026,'KT',['노틸러스','렐','라칸','레오나']),
]},
{name:'KIWOOM DRX',short:'DRX',color:'#4778ce',budget:74,reputation:82,facilities:82,coach:'Joker',players:[
p('2026-drx-rich','Rich','TOP',27,87,88,88,87,88,89,86,87,8,20,2026,'DRX',['레넥톤','크산테','그웬','잭스']),
p('2026-drx-willer','Willer','JNG',24,88,92,86,91,89,89,85,88,8,24,2026,'DRX',['비에고','바이','리 신','세주아니']),
p('2026-drx-ucal','Ucal','MID',24,88,91,88,90,89,89,86,88,8,22,2026,'DRX',['아지르','아리','오리아나','요네']),
p('2026-drx-aiming','Aiming','ADC',26,92,94,94,94,91,94,91,92,14,36,2026,'DRX',['진','징크스','카이사','바루스']),
p('2026-drx-andil','Andil','SUP',22,85,92,84,87,87,88,83,85,6,18,2026,'DRX',['라칸','렐','노틸러스','알리스타']),
]},
{name:'BNK FEARX',short:'BNK FEARX',color:'#e4b64d',budget:78,reputation:84,facilities:83,coach:'Edo',players:[
p('2026-bfx-clear','Clear','TOP',23,86,92,87,88,86,87,84,85,7,21,2026,'BNK FEARX',['크산테','럼블','잭스','레넥톤']),
p('2026-bfx-raptor','Raptor','JNG',22,88,93,86,90,90,89,85,88,8,24,2026,'BNK FEARX',['바이','비에고','리 신','자르반 4세']),
p('2026-bfx-vicla','VicLa','MID',23,89,93,89,91,90,89,86,89,9,26,2026,'BNK FEARX',['아리','아지르','요네','오리아나']),
p('2026-bfx-taeyoon','Taeyoon','ADC',22,85,91,85,88,84,87,82,84,6,18,2026,'BNK FEARX',['징크스','카이사','바루스','제리']),
p('2026-bfx-kellin','Kellin','SUP',24,89,92,89,90,92,90,88,88,9,24,2026,'BNK FEARX',['노틸러스','렐','라칸','룰루']),
]},
{name:'Nongshim RedForce',short:'NS',color:'#d92d35',budget:84,reputation:88,facilities:87,coach:'DanDy',players:[
p('2026-ns-kingen','Kingen','TOP',25,91,93,92,91,92,93,90,92,11,30,2026,'NS',['레넥톤','크산테','럼블','잭스']),
p('2026-ns-sponge','Sponge','JNG',22,87,92,85,89,89,87,84,86,7,21,2026,'NS',['비에고','바이','리 신','신 짜오']),
p('2026-ns-scout','Scout','MID',28,95,96,96,96,97,95,96,97,19,48,2026,'NS',['아지르','오리아나','신드라','아리']),
p('2026-ns-diable','Diable','ADC',20,89,96,88,92,87,91,85,88,9,27,2026,'NS',['징크스','카이사','제리','바루스']),
p('2026-ns-lehends','Lehends','SUP',27,92,93,91,92,96,93,93,95,13,31,2026,'NS',['렐','노틸러스','라칸','알리스타']),
]},
{name:'HANJIN BRION',short:'BRO',color:'#66a36d',budget:66,reputation:77,facilities:78,coach:'Ssong',players:[
p('2026-bro-casting','Casting','TOP',21,81,91,82,82,81,82,79,80,4,13,2026,'BRO',['크산테','럼블','잭스']),
p('2026-bro-gideon','Gideon','JNG',24,83,88,82,85,84,83,81,82,5,15,2026,'BRO',['비에고','바이','리 신','자르반 4세']),
p('2026-bro-roamer','Roamer','MID',21,81,91,81,83,82,81,78,80,4,13,2026,'BRO',['아리','요네','오리아나','아지르']),
p('2026-bro-teddy','Teddy','ADC',27,91,93,93,93,92,95,96,95,11,27,2026,'BRO',['징크스','진','바루스','케이틀린']),
p('2026-bro-namgung','Namgung','SUP',21,79,88,79,80,81,80,78,78,3,11,2026,'BRO',['렐','노틸러스','라칸']),
]},
{name:'DN SOOPers',short:'DN',color:'#4c9c9a',budget:79,reputation:85,facilities:84,coach:'Ggoong',players:[
p('2026-dn-dudu','DuDu','TOP',24,89,93,91,90,89,91,89,90,10,26,2026,'DN',['레넥톤','럼블','크산테','잭스']),
p('2026-dn-pyosik','Pyosik','JNG',25,90,93,88,93,90,92,87,95,12,29,2026,'DN',['리 신','비에고','세주아니','신 짜오']),
p('2026-dn-clozer','Clozer','MID',22,89,94,90,92,88,89,85,89,9,26,2026,'DN',['아리','요네','아칼리','사일러스']),
p('2026-dn-deokdam','Deokdam','ADC',25,90,92,91,92,90,93,90,91,10,26,2026,'DN',['징크스','카이사','바루스','제리']),
p('2026-dn-peter','Peter','SUP',21,84,91,83,86,88,86,82,84,6,18,2026,'DN',['렐','노틸러스','라칸','룰루']),
]},
]
export const roleOrder: Role[] = ['TOP','JNG','MID','ADC','SUP']
export const marketPool: PlayerData[] = [
p('fa-1','Kiin','TOP',27,96,97,97,96,96,97,97,97,25,64,2027,'HLE',['크산테','잭스','럼블'],'거피셜'),
p('fa-2','Canyon','JNG',26,97,98,96,98,98,97,96,98,28,72,2026,'FA',['니달리','리 신','비에고','세주아니'],'FA'),
p('rumor-siwoo','Siwoo','TOP',19,86,97,86,88,85,87,82,84,5,20,2027,'GEN.G',['제이스','럼블','크산테'],'거피셜'),

p('fa-5','Clear','TOP',24,84,91,84,86,84,85,82,83,7,20,2026,'FA',['크산테','럼블'],'FA'),
p('fa-6','Taeyoon','ADC',23,83,89,83,85,82,84,81,82,6,17,2026,'FA',['징크스','카이사'],'FA'),
p('fa-7','Kellin','SUP',26,88,91,88,89,90,89,87,87,8,21,2026,'KT',['노틸러스','렐','라칸'],'계약 유지'),
p('fa-8','Jiwoo','ADC',22,87,93,87,90,86,89,85,87,8,22,2026,'FA',['카이사','징크스','제리'],'FA'),
p('fa-9','Willer','JNG',25,85,89,84,87,86,86,83,84,7,18,2026,'FA',['비에고','바이','신 짜오'],'FA'),
p('fa-10','Aiming','ADC',27,91,92,93,93,90,92,90,91,14,34,2026,'FA',['진','징크스','카이사'],'FA'),
p('fa-11','Rich','TOP',29,85,86,86,85,86,87,84,85,8,18,2026,'FA',['레넥톤','크산테'],'FA'),
p('fa-12','Sponge','JNG',23,86,91,85,88,88,86,84,85,7,20,2026,'FA',['비에고','바이','리 신'],'FA'),
p('fa-13','Scout','MID',28,94,94,95,95,96,94,95,96,18,42,2026,'FA',['아지르','오리아나','신드라'],'FA'),
p('fa-14','Diable','ADC',21,88,96,87,91,86,89,84,87,9,27,2026,'FA',['징크스','카이사','제리'],'FA'),
p('fa-15','Lehends','SUP',28,91,92,91,91,95,92,92,94,12,29,2026,'FA',['렐','노틸러스','라칸'],'FA'),
]
export const staffPool = [
{id:'staff-1',name:'Ssong',role:'감독',rating:88,salary:6,focus:'밴픽·운영'},
{id:'staff-2',name:'Mowgli',role:'감독',rating:87,salary:5,focus:'정글 동선·교전'},
{id:'staff-3',name:'cvMax',role:'감독',rating:91,salary:8,focus:'선수 육성·밴픽'},
{id:'staff-4',name:'Score',role:'감독',rating:90,salary:7,focus:'운영·팀워크'},
{id:'staff-5',name:'Ryu',role:'감독',rating:88,salary:6,focus:'전략·밴픽'},
{id:'staff-6',name:'Reapered',role:'전략 코치',rating:89,salary:5,focus:'밴픽 설계'},
{id:'staff-7',name:'Homme',role:'전략 코치',rating:92,salary:7,focus:'매크로·운영'},
{id:'staff-8',name:'Tom',role:'전략 코치',rating:89,salary:5,focus:'밴픽·라인전'},
{id:'staff-9',name:'Mata',role:'서포트 코치',rating:90,salary:5,focus:'시야·서포팅'},
{id:'staff-10',name:'Duke',role:'분석 코치',rating:83,salary:3,focus:'상대 분석'},
]

export const academyPool: PlayerData[] = [
p('academy-01','이도윤','TOP',17,72,94,72,73,70,71,68,69,.5,1,2028,'FA',['크산테','잭스'],'FA','후보'),
p('academy-02','김태성','TOP',18,75,92,76,76,74,75,72,73,.6,1.5,2028,'FA',['럼블','레넥톤'],'FA','후보'),
p('academy-03','박준서','JNG',17,71,95,69,74,73,72,67,70,.5,1,2028,'FA',['비에고','바이'],'FA','후보'),
p('academy-04','최민혁','JNG',19,76,91,75,78,77,76,74,75,.8,2,2028,'FA',['리 신','신 짜오'],'FA','후보'),
p('academy-05','정현우','MID',18,74,96,73,77,75,74,70,72,.7,1.8,2028,'FA',['아리','요네'],'FA','후보'),
p('academy-06','윤시우','MID',17,69,97,68,72,70,69,65,68,.5,1,2028,'FA',['아지르','오리아나'],'FA','후보'),
p('academy-07','한지훈','ADC',18,75,94,76,78,72,76,72,74,.7,1.8,2028,'FA',['징크스','카이사'],'FA','후보'),
p('academy-08','서준혁','ADC',19,77,91,78,80,76,78,75,76,.9,2.2,2028,'FA',['제리','바루스'],'FA','후보'),
p('academy-09','오민재','SUP',18,70,95,70,73,74,72,68,69,.5,1,2028,'FA',['렐','라칸'],'FA','후보'),
p('academy-10','강우진','SUP',19,76,92,77,77,79,78,75,76,.8,2,2028,'FA',['노틸러스','알리스타'],'FA','후보'),
]
