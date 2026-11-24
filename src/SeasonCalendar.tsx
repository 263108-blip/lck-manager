import { getCurrentSeasonEvent, getNextSeasonEvent, seasonEvents } from './seasonEvents'
import './SeasonCalendar.css'

export default function SeasonCalendar({currentDate}:{currentDate:string}){
 const active=getCurrentSeasonEvent(currentDate)
 const next=getNextSeasonEvent(currentDate)
 return <div className="season-calendar-page">
  <header className="season-calendar-header"><div><span>2026 COMPETITIVE ROADMAP</span><h1>시즌 캘린더</h1><p>국내 리그와 국제 대회, 프리시즌 일정을 한곳에서 관리합니다.</p></div><div><small>현재 커리어 날짜</small><strong>{currentDate}</strong><span>{active?.name??(next?'다음 대회 대기':'2026 시즌 일정 종료')}</span></div></header>
  <section className="season-calendar-focus">
   <div><small>{active?'CURRENT EVENT':'NEXT MILESTONE'}</small><h2>{active?.name??next?.name??'시즌 일정 종료'}</h2><p>{active?.description??next?.description??'현재 등록된 다음 일정이 없습니다.'}</p></div>
   <div className="season-calendar-dates"><strong>{active?active.start:next?.start??'—'}</strong><span>부터</span><strong>{active?active.end:next?.end??'—'}</strong><span>까지</span></div>
  </section>
  <div className="season-calendar-legend"><span><i className="now"/>현재 진행</span><span><i className="done"/>완료</span><span><i className="future"/>예정</span></div>
  <section className="season-calendar-list">
   {seasonEvents.map((event,index)=>{
    const status=currentDate<event.start?'UPCOMING':currentDate>event.end?'COMPLETED':'IN PROGRESS'
    return <article className={'season-calendar-event '+(status==='IN PROGRESS'?'current':status==='COMPLETED'?'completed':'upcoming')} key={event.id}>
     <div className="season-event-index">{String(index+1).padStart(2,'0')}</div>
     <div className="season-event-main"><div><span>{event.category==='LCK'?'LCK':event.category==='INTERNATIONAL'?'GLOBAL EVENT':'CAREER'}</span><h3>{event.name}</h3></div><p>{event.description}</p><small>{event.location}</small></div>
     <div className="season-event-dates"><strong>{event.start}</strong><span>—</span><strong>{event.end}</strong><em>{status==='IN PROGRESS'?'진행 중':status==='COMPLETED'?'완료':'예정'}</em></div>
    </article>
   })}
  </section>
  <p className="season-calendar-note">※ 공식 발표일이 확인되는 국제 대회와 2026 LCK 대회 구간을 기준으로 표시합니다. 게임 내 경기 결과는 플레이어 커리어에서 별도로 시뮬레이션됩니다.</p>
 </div>
}
