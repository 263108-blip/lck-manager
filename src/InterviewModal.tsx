import { useMemo, useState } from 'react'
import { addInboxMessage } from './Inbox'

export type InterviewKind = 'pre' | 'post' | 'general'

type Props = {
  kind: InterviewKind
  opponent?: string
  result?: '승리' | '패배' | '접전'
  onClose: () => void
}

const preQuestions=['오늘 상대를 어떻게 평가하십니까?','가장 중요한 전략은 무엇입니까?','이번 경기의 목표는 무엇입니까?','상대 핵심 선수는 누구라고 보십니까?']
const postQuestions=['오늘 경기 승패의 가장 큰 원인은 무엇입니까?','특정 선수의 활약을 어떻게 평가하십니까?','다음 경기에서 개선할 점은 무엇입니까?','오늘 밴픽을 어떻게 평가하십니까?']
const generalQuestions=['이번 시즌 목표는 무엇입니까?','최근 팀 분위기를 어떻게 평가하십니까?','신인 선수의 성장 가능성은 어떻습니까?','라이벌 구단과의 경쟁에 대해 말씀해 주세요.']

export default function InterviewModal({kind,opponent='',result='접전',onClose}:Props){
  const questions=kind==='pre'?preQuestions:kind==='post'?postQuestions:generalQuestions
  const [index]=useState(()=>Math.floor(Math.random()*questions.length))
  const [selected,setSelected]=useState<number|null>(null)
  const answers=useMemo(()=>[
    '현재 수준을 존중하되 준비된 전술로 맞서겠다.',
    '선수단의 강점을 중심으로 공격적인 자세로 임하겠다.',
    '한 경기를 넘어 시즌 목표를 흔들림 없이 달성하는 데 집중한다.',
  ],[])

  function submit(){
    if(selected===null)return
    const season=Number(localStorage.getItem('lck-manager-season-year')||2026)
    const careerKey=`lck-career-${season}-`+(JSON.parse(localStorage.getItem('lck-manager-selected-club')||'{}').short||'T1')
    let career:any={morale:76,mediaReputation:50}
    try{career=JSON.parse(localStorage.getItem(careerKey)||JSON.stringify(career))}catch{}
    const moraleDelta=selected===0?2:selected===1?4:-1
    const mediaDelta=selected===0?1:selected===1?3:2
    localStorage.setItem(careerKey,JSON.stringify({...career,morale:Math.max(0,Math.min(100,(career.morale??76)+moraleDelta)),mediaReputation:Math.max(0,Math.min(100,(career.mediaReputation??50)+mediaDelta))}))
    addInboxMessage({title:kind==='pre'?`${opponent||'다음 상대'}전 인터뷰 완료`:kind==='post'?`${result} 경기 인터뷰 완료`:'일반 기자회견 완료',sender:'현장 기자단',date:new Date().toISOString().slice(0,10),category:'구단',priority:'보통',body:`답변에 따라 팀 사기 ${moraleDelta>=0?'상승':'소폭 하락'}, 언론 평판 ${mediaDelta>=0?'상승':'변동 없음'}이 반영됐습니다.`,actionLabel:'구단 기록 보기',actionPage:'구단 기록'})
    onClose()
  }

  return <div className="interview-backdrop" role="dialog" aria-modal="true">
    <section className="interview-modal">
      <span className="interview-eyebrow">{kind==='pre'?'PRE-MATCH INTERVIEW':kind==='post'?'POST-MATCH INTERVIEW':'MEDIA INTERVIEW'} · PRESS ROOM</span>
      <h2>{kind==='post'?`${result} 경기 소감`:kind==='pre'?`${opponent||'다음 상대'}전 기자회견`:'구단 기자회견'}</h2>
      <p className="interview-question">{questions[index]}</p>
      <div className="interview-answers">{answers.map((answer,answerIndex)=><button className={selected===answerIndex?'selected':''} key={answer} onClick={()=>setSelected(answerIndex)}><b>{String.fromCharCode(65+answerIndex)}</b><span>{answer}</span></button>)}</div>
      <div className="interview-actions"><button onClick={onClose}>나중에 답변</button><button className="submit" disabled={selected===null} onClick={submit}>인터뷰 제출</button></div>
    </section>
  </div>
}
