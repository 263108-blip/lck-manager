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
  champions: string[]
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
export const seasonClubs: ClubData[] = [
{name:'T1',short:'T1',color:'#d92e46',budget:95,reputation:100,facilities:96,coach:'미정',players:[
p('t1-rumor-zeus','Zeus','TOP',23,97,99,99,99,95,97,95,98,28,76,2027,'T1',['제이스','그웬','럼블','잭스'],'거피셜'),
p('t1-1','Oner','JNG',24,95,96,93,97,96,96,94,96,18,52,2028,'T1',['리 신','바이','비에고','신 짜오']),
p('t1-2','Faker','MID',31,97,98,96,94,100,99,99,100,30,75,2029,'T1',['아지르','오리아나','갈리오','아리']),
p('t1-3','Peyz','ADC',21,94,98,96,97,93,96,93,95,16,48,2028,'T1',['카이사','징크스','바루스','제리']),
p('t1-4','Keria','SUP',25,98,99,99,99,98,98,96,98,20,58,2029,'T1',['바드','파이크','라칸','노틸러스']),
]},
{name:'Gen.G',short:'GEN.G',color:'#c5a64b',budget:100,reputation:99,facilities:97,coach:'Ryu',players:[
p('gen-rumor-siwoo','Siwoo','TOP',19,86,97,86,88,85,87,82,84,5,20,2027,'GEN.G',['제이스','럼블','크산테'],'거피셜'),
p('gen-1','Chovy','MID',26,98,99,99,99,98,97,98,96,27,70,2027,'GEN.G',['요네','아리','아지르','오리아나']),
p('gen-2','Ruler','ADC',29,97,97,98,98,97,99,99,99,25,62,2027,'GEN.G',['징크스','제리','바루스','카이사']),
p('gen-3','Duro','SUP',23,89,94,89,89,91,90,88,88,8,20,2027,'GEN.G',['렐','라칸','노틸러스']),
]},
{name:'한화생명e스포츠',short:'HLE',color:'#e65b25',budget:105,reputation:98,facilities:96,coach:'Mowgli',players:[
p('hle-rumor-kiin','Kiin','TOP',27,96,97,97,96,96,97,97,97,25,64,2027,'HLE',['크산테','잭스','럼블'],'거피셜'),
p('hle-3','Zeka','MID',24,94,96,94,96,91,95,92,96,18,45,2027,'HLE',['아칼리','사일러스','요네','아지르']),
p('hle-4','Gumayusi','ADC',25,97,98,98,98,95,99,97,99,22,58,2027,'HLE',['진','바루스','징크스','애쉬']),
p('hle-5','Delight','SUP',25,94,96,94,94,95,96,94,95,15,38,2027,'HLE',['라칸','렐','노틸러스','알리스타']),
]},
{name:'Dplus KIA',short:'DK',color:'#9da9c8',budget:100,reputation:94,facilities:95,coach:'cvMax',players:[
p('dk-1','Doran','TOP',26,93,94,93,92,94,95,91,95,17,42,2027,'DK',['잭스','레넥톤','럼블','크산테'],'확정'),
p('dk-2','Kanavi','JNG',26,96,97,95,97,97,96,95,96,23,58,2027,'DK',['리 신','비에고','세주아니','신 짜오'],'확정'),
p('dk-3','ShowMaker','MID',27,94,95,93,96,97,96,94,97,19,48,2027,'DK',['아지르','신드라','아리','요네'],'확정'),
p('dk-4','Smash','ADC',21,91,97,92,95,90,93,89,91,10,32,2027,'DK',['징크스','카이사','바루스','제리'],'확정'),
p('dk-5','Career','SUP',22,84,92,82,86,85,84,82,83,5,15,2027,'DK',['렐','라칸','노틸러스'],'계약 유지'),
p('dk-6','Lucid','JNG',22,89,96,88,92,91,90,87,89,10,29,2027,'DK',['비에고','바이','리 신'],'계약 유지','후보'),
]},
{name:'KT 롤스터',short:'KT',color:'#e94a50',budget:82,reputation:91,facilities:90,coach:'Score',players:[
p('kt-1','PerfecT','TOP',22,90,96,90,92,90,91,89,89,9,28,2028,'KT',['크산테','잭스','레넥톤']),
p('kt-2','Raptor','JNG',23,87,92,86,89,88,88,86,87,8,22,2027,'KT',['바이','비에고','자르반 4세'],'확정'),
p('kt-3','Bdd','MID',28,94,95,96,95,96,94,95,96,18,43,2028,'KT',['아지르','오리아나','아리','신드라']),
p('kt-4','Kellin','SUP',25,88,91,88,89,90,89,87,87,8,21,2028,'KT',['노틸러스','렐','라칸'],'확정'),
]},
{name:'Kiwoom DRX',short:'DRX',color:'#4778ce',budget:74,reputation:82,facilities:82,coach:'미정',players:[]},
{name:'BNK FEARX',short:'BNK FEARX',color:'#e4b64d',budget:78,reputation:84,facilities:83,coach:'Rather',players:[
p('bfx-1','Vincenzo','JNG',21,82,93,80,84,83,82,78,80,5,18,2028,'BNK FEARX',['바이','비에고','리 신'],'확정'),
p('bfx-2','VicLa','MID',24,87,91,87,89,88,86,84,87,8,23,2027,'BNK FEARX',['아리','아지르','요네'],'확정'),
p('bfx-3','Noah','ADC',25,88,91,89,91,87,90,87,88,9,24,2027,'BNK FEARX',['징크스','카이사','제리'],'확정'),
]},
{name:'농심 레드포스',short:'NS',color:'#d92d35',budget:84,reputation:88,facilities:87,coach:'DanDy',players:[
p('ns-1','Kingen','TOP',27,90,91,91,90,91,92,90,91,10,26,2028,'NS',['레넥톤','크산테','럼블']),
p('ns-2','Pyosik','JNG',27,89,91,87,92,89,91,86,94,11,27,2027,'NS',['리 신','비에고','세주아니'],'확정'),
p('ns-3','Calix','MID',21,84,93,83,87,85,84,81,82,6,19,2028,'NS',['아리','오리아나','아지르']),
p('ns-4','Deft','ADC',30,91,92,94,92,94,95,97,98,12,25,2027,'NS',['진','케이틀린','징크스','바루스'],'확정'),
p('ns-5','Andil','SUP',23,85,91,84,87,86,87,83,84,6,18,2027,'NS',['라칸','렐','노틸러스'],'확정'),
]},
{name:'한진 브리온',short:'BRO',color:'#66a36d',budget:66,reputation:77,facilities:78,coach:'Ssong',players:[
p('bro-1','Casting','TOP',22,80,90,81,81,80,81,78,79,4,12,2027,'BRO',['크산테','럼블'],'확정'),
p('bro-2','GIDEON','JNG',25,82,87,81,84,83,82,80,81,5,14,2027,'BRO',['비에고','바이','리 신'],'확정'),
p('bro-3','Roamer','MID',22,79,89,79,81,80,78,77,78,4,12,2027,'BRO',['아리','요네','오리아나'],'확정'),
p('bro-4','Teddy','ADC',29,90,91,92,92,91,94,95,94,10,24,2027,'BRO',['징크스','진','바루스','케이틀린'],'확정'),
p('bro-5','Namgung','SUP',22,78,87,78,79,80,79,77,77,3,10,2027,'BRO',['렐','노틸러스'],'확정'),
p('bro-6','SeTab','MID',22,77,88,77,80,78,77,76,77,3,9,2027,'BRO',['아지르','오리아나'],'확정','후보'),
]},
{name:'DN SOOPers',short:'DN',color:'#4c9c9a',budget:79,reputation:85,facilities:84,coach:'Ggoong',players:[
p('dn-1','DuDu','TOP',25,88,92,90,89,88,90,88,89,9,24,2028,'DN',['레넥톤','럼블','크산테'],'확정'),
p('dn-2','Cuzz','JNG',27,91,92,91,91,94,92,93,93,12,30,2027,'DN',['리 신','비에고','세주아니'],'확정'),
p('dn-3','Ucal','MID',25,87,90,87,89,88,88,85,87,8,21,2027,'DN',['아지르','아리','오리아나'],'확정'),
p('dn-4','deokdam','ADC',25,89,92,90,91,90,92,89,90,10,25,2027,'DN',['징크스','카이사','바루스'],'계약 유지'),
p('dn-5','Bluffing','SUP',18,78,93,76,81,78,78,74,75,3,11,2028,'DN',['렐','노틸러스'],'확정'),
]},
]
export const roleOrder: Role[] = ['TOP','JNG','MID','ADC','SUP']
export const marketPool: PlayerData[] = [
p('fa-1','Kiin','TOP',27,96,97,97,96,96,97,97,97,25,64,2027,'HLE',['크산테','잭스','럼블'],'거피셜'),
p('fa-2','Canyon','JNG',26,97,98,96,98,98,97,96,98,28,72,2026,'FA',['니달리','리 신','비에고','세주아니'],'FA'),
p('fa-3','Zeus','TOP',23,97,99,99,99,95,97,95,98,28,76,2026,'FA',['제이스','그웬','럼블','잭스'],'FA'),

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
