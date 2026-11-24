import type { Role } from './seasonData'

export type AcademyPlayer = {
  id: string
  name: string
  role: Role
  overall: number
  potential: number
  status: '주전' | '후보'
  champions: string[]
}
export type AcademyTeam = {
  id: string
  short: string
  firstTeam: string
  name: string
  coach: string
  assistantCoaches: string[]
  players: AcademyPlayer[]
}

const player=(id:string,name:string,role:Role,overall:number,potential:number,champions:string[],status:'주전'|'후보'='주전'):AcademyPlayer=>({id,name,role,overall,potential,champions,status})

export const academyTeams:AcademyTeam[]=[
  {id:'t1-ea',short:'T1',firstTeam:'T1',name:'T1 Esports Academy',coach:'DooTi',assistantCoaches:['Nagne'],players:[
    player('t1ea-haetae','Haetae','TOP',78,92,['크산테','럼블','레넥톤']),
    player('t1ea-painter','Painter','JNG',79,93,['비에고','바이','리 신']),
    player('t1ea-guti','Guti','MID',77,92,['아리','아지르','요네']),
    player('t1ea-cypher','Cypher','ADC',78,93,['징크스','카이사','제리']),
    player('t1ea-cloud','Cloud','SUP',77,92,['렐','라칸','노틸러스']),
    player('t1ea-guardian','Guardian','TOP',75,90,['잭스','레넥톤'], '후보'),
    player('t1ea-carim','Carim','JNG',74,89,['바이','비에고'], '후보'),
    player('t1ea-jinbeom','Jinbeom','ADC',73,88,['진','바루스'], '후보'),
    player('t1ea-eclipse','Eclipse','ADC',75,91,['징크스','카이사'], '후보'),
  ]},
  {id:'dk-c',short:'DK',firstTeam:'DK',name:'Dplus Challengers',coach:'Woong',assistantCoaches:['Sungmin'],players:[
    player('dkc-jaehyuk','Jaehyuk','TOP',76,91,['럼블','크산테','잭스']),
    player('dkc-solid','Solid','JNG',78,93,['바이','비에고','리 신']),
    player('dkc-garden','Garden','MID',79,94,['아지르','오리아나','아리']),
    player('dkc-wayne','Wayne','ADC',80,94,['징크스','카이사','제리']),
    player('dkc-loopy','Loopy','SUP',77,91,['렐','라칸','노틸러스']),
    player('dkc-nevid','Nevid','TOP',75,92,['제이스','잭스'], '후보'),
    player('dkc-sharvel','Sharvel','JNG',77,91,['비에고','리 신'], '후보'),
  ]},
  {id:'drx-c',short:'DRX',firstTeam:'DRX',name:'DRX Challengers',coach:'Frozen',assistantCoaches:['Catch'],players:[
    player('drxc-frog','Frog','TOP',78,92,['크산테','그웬','럼블']),
    player('drxc-winner','Winner','JNG',77,92,['바이','비에고','세주아니']),
    player('drxc-akaje','AKaJe','MID',78,93,['아리','요네','오리아나']),
    player('drxc-jiwoo','Jiwoo','ADC',82,95,['징크스','카이사','제리']),
    player('drxc-minous','Minous','SUP',76,91,['렐','노틸러스','라칸']),
    player('drxc-lazyfeel','LazyFeel','ADC',80,94,['이즈리얼','진','바루스'], '후보'),
  ]},
  {id:'bfx-y',short:'BNK FEARX',firstTeam:'BNK FEARX',name:'FEARX Youth',coach:'Dopil',assistantCoaches:['Key'],players:[
    player('bfxy-kangin','Kangin','TOP',75,91,['럼블','크산테','잭스']),
    player('bfxy-zephyr','Zephyr','JNG',77,93,['비에고','바이','리 신']),
    player('bfxy-mg','MG','MID',76,92,['아리','아지르','요네']),
    player('bfxy-slayer','Slayer','ADC',77,92,['징크스','진','카이사']),
    player('bfxy-luon','Luon','SUP',75,91,['렐','라칸','룰루']),
    player('bfxy-grizzly','Grizzly','JNG',76,92,['비에고','리 신'], '후보'),
    player('bfxy-fiesta','FIESTA','MID',77,92,['아지르','오리아나'], '후보'),
  ]},
  {id:'dn-c',short:'DN',firstTeam:'DN',name:'SOOPers Challengers',coach:'RapidStar',assistantCoaches:['Cube'],players:[
    player('dnc-lancer','Lancer','TOP',77,92,['크산테','잭스','레넥톤']),
    player('dnc-ddoiv','DDoiV','JNG',78,93,['바이','비에고','신 짜오']),
    player('dnc-flip','Flip','MID',77,92,['아리','요네','아지르']),
    player('dnc-enosh','Enosh','ADC',78,93,['징크스','카이사','바루스']),
    player('dnc-quantum','Quantum','SUP',76,91,['렐','라칸','노틸러스']),
  ]},
  {id:'gen-ga',short:'GEN.G',firstTeam:'GEN.G',name:'Gen.G Global Academy',coach:'Jerry',assistantCoaches:[],players:[
    player('genga-ripple','Ripple','TOP',75,91,['럼블','크산테','잭스']),
    player('genga-courage','Courage','JNG',76,92,['바이','비에고','리 신']),
    player('genga-kemish','Kemish','MID',77,93,['아리','아지르','오리아나']),
    player('genga-mudai','MUDAI','ADC',76,92,['징크스','카이사','제리']),
    player('genga-siriuss','SIRIUSS','SUP',75,91,['렐','라칸','노틸러스']),
    player('genga-lumos','Lumos','SUP',74,89,['룰루','나미'], '후보'),
  ]},
  {id:'hle-c',short:'HLE',firstTeam:'HLE',name:'Hanwha Life Challengers',coach:'Sensation',assistantCoaches:[],players:[
    player('hlec-panther','Panther','TOP',77,92,['크산테','잭스','럼블']),
    player('hlec-jackal','Jackal','JNG',76,92,['비에고','바이','리 신']),
    player('hlec-cracker','Cracker','MID',77,93,['아리','요네','아지르']),
    player('hlec-pyeonsik','Pyeonsik','ADC',78,93,['징크스','카이사','바루스']),
    player('hlec-bluffing','Bluffing','SUP',76,92,['렐','라칸','노틸러스']),
    player('hlec-valiant','Valiant','MID',74,90,['오리아나','아리'], '후보'),
  ]},
  {id:'kt-c',short:'KT',firstTeam:'KT',name:'KT Rolster Challengers',coach:'Spark',assistantCoaches:['Lilac'],players:[
    player('ktc-sero','Sero','TOP',77,92,['크산테','잭스','럼블']),
    player('ktc-sylvie','Sylvie','JNG',78,93,['비에고','바이','신 짜오']),
    player('ktc-hwichan','HwiChan','MID',77,92,['아리','요네','아지르']),
    player('ktc-fenrir','FenRir','ADC',78,93,['징크스','카이사','제리']),
    player('ktc-pollu','Pollu','SUP',77,92,['렐','라칸','노틸러스']),
    player('ktc-jiwoo','Jiwoo','ADC',80,94,['징크스','카이사'], '후보'),
    player('ktc-ghost','Ghost','ADC',76,90,['진','바루스'], '후보'),
  ]},
  {id:'ns-c',short:'NS',firstTeam:'NS',name:'Nongshim RedForce Challengers',coach:'bonO',assistantCoaches:[],players:[
    player('nsc-janus','Janus','TOP',75,91,['크산테','레넥톤','잭스']),
    player('nsc-mihawk','Mihawk','JNG',76,92,['비에고','바이','리 신']),
    player('nsc-setab','SeTab','MID',78,93,['아지르','오리아나','아리']),
    player('nsc-lucy','Lucy','ADC',76,91,['징크스','카이사','바루스']),
    player('nsc-pleata','Pleata','SUP',77,92,['렐','라칸','노틸러스']),
  ]},
  {id:'bro-c',short:'BRO',firstTeam:'BRO',name:'BRION Challengers',coach:'Cheoni',assistantCoaches:[],players:[
    player('broc-ddahyuk','DDahyuk','TOP',75,90,['크산테','럼블','레넥톤']),
    player('broc-dinai','Dinai','JNG',74,90,['바이','비에고','세주아니']),
    player('broc-tempester','Tempester','MID',76,92,['아리','아지르','요네']),
    player('broc-oddeye','OddEye','ADC',75,91,['징크스','진','카이사']),
    player('broc-planb','PlanB','SUP',74,90,['렐','라칸','노틸러스']),
  ]},
]

export const academyRosterNotes = '2026 LCK CL 공개 로스터 기준. 선수 순위 능력치와 잠재력은 공식 발표 수치가 아닌 게임 밸런스용 추정치입니다.'
