export type SeasonEvent = {
  id:string
  name:string
  start:string
  end:string
  category:'LCK'|'INTERNATIONAL'|'CAREER'
  location:string
  description:string
}
export const seasonEvents:SeasonEvent[]=[
  {id:'preseason',name:'2026 프리시즌 · 선수단 구성',start:'2025-11-23',end:'2026-01-13',category:'CAREER',location:'구단 시설',description:'계약, 선수단 정리, 코칭스태프 구성, 훈련 계획을 준비합니다.'},
  {id:'split1',name:'LCK Split 1 · 그룹 배틀 및 플레이오프',start:'2026-01-14',end:'2026-03-15',category:'LCK',location:'대한민국',description:'2026 시즌 초반 그룹 배틀, 플레이-인, 플레이오프를 진행합니다.'},
  {id:'first-stand',name:'First Stand',start:'2026-03-16',end:'2026-03-22',category:'INTERNATIONAL',location:'상파울루, 브라질',description:'각 지역 Split 1 성적을 바탕으로 진출팀이 경쟁하는 첫 국제 대회입니다.'},
  {id:'rounds-1-2',name:'LCK 정규 라운드 1~2',start:'2026-04-01',end:'2026-05-31',category:'LCK',location:'대한민국',description:'10개 팀 더블 라운드 로빈 BO3. 상위 6개 팀은 Road to MSI에 진출합니다.'},
  {id:'road-to-msi',name:'LCK Road to MSI',start:'2026-06-06',end:'2026-06-14',category:'LCK',location:'대한민국',description:'R1~2 상위 6개 팀이 BO5로 MSI 1·2번 시드를 결정합니다.'},
  {id:'msi',name:'Mid-Season Invitational',start:'2026-06-28',end:'2026-07-12',category:'INTERNATIONAL',location:'대전, 대한민국',description:'전 세계 지역 상위 팀들이 참가하는 미드시즌 국제 대회입니다.'},
  {id:'rounds-3-4',name:'LCK 정규 라운드 3~4',start:'2026-07-29',end:'2026-08-23',category:'LCK',location:'대한민국',description:'LEGEND·RISE 두 그룹으로 나뉘어 더블 라운드 로빈 BO3를 치르고 기존 성적을 승계합니다.'},
  {id:'play-in',name:'LCK 플레이-인',start:'2026-08-26',end:'2026-08-28',category:'LCK',location:'대한민국',description:'LEGEND 5위와 RISE 1~3위가 2개 플레이오프 진출권을 놓고 경쟁합니다.'},
  {id:'playoffs',name:'LCK 플레이오프',start:'2026-08-29',end:'2026-09-13',category:'LCK',location:'대한민국',description:'6개 팀 더블 엘리미네이션 BO5로 시즌 우승팀을 결정합니다.'},
  {id:'worlds',name:'World Championship',start:'2026-10-15',end:'2026-11-14',category:'INTERNATIONAL',location:'미국',description:'플레이-인, 스위스 스테이지, 녹아웃 스테이지로 구성된 시즌 최종 국제 대회입니다.'},
]
export function getCurrentSeasonEvent(date:string):SeasonEvent|undefined {
  return seasonEvents.find(event=>date>=event.start&&date<=event.end)
}
export function getNextSeasonEvent(date:string):SeasonEvent|undefined {
  return seasonEvents.find(event=>event.start>date)
}
export function getSeasonPhase(date:string):string {
  if(date<'2026-01-14')return 'PRESEASON'
  if(date<='2026-03-15')return 'SPLIT_1'
  if(date<='2026-03-22')return 'FIRST_STAND'
  if(date<'2026-04-01')return 'BREAK'
  if(date<='2026-05-31')return 'REGULAR_R1_2'
  if(date<='2026-06-14')return 'ROAD_TO_MSI'
  if(date<'2026-06-28')return 'MSI_PREP'
  if(date<='2026-07-12')return 'MSI'
  if(date<'2026-07-29')return 'SUMMER_BREAK'
  if(date<='2026-08-23')return 'REGULAR_R3_4'
  if(date<='2026-08-28')return 'PLAY_IN'
  if(date<='2026-09-13')return 'PLAYOFFS'
  if(date<'2026-10-15')return 'OFFSEASON'
  if(date<='2026-11-14')return 'WORLDS'
  return 'OFFSEASON'
}
