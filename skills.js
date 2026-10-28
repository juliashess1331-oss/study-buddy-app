"use strict";
// Skill tracking: mastery over 2 sessions, spaced review, extra practice picks.
const SKILL=(()=>{
const NAMES={"math:facts":"Math facts","math:regroup":"Carry and borrow","math:groups":"Equal groups","math:puzzles":"Word puzzles","math:place":"Place value","math:measure":"Measuring and time","math:story":"Math stories",
  "reading:words":"New words","reading:sameopp":"Same and opposite","reading:builders":"Word parts","reading:story":"Story questions"};
const GAPS=[1,3,7],NEED=.8,MINQ=4;
// Day number in local time. Tests can set SKILL.offset to move days.
const api={offset:0};
api.today=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*6e4)/864e5)+api.offset};
api.NAMES=NAMES;api.GAPS=GAPS;
api.name=k=>NAMES[k]||k;
api.key=(s,id)=>NAMES[s+":"+id]?s+":"+id:null;
function rec(S,k){S.sk=S.sk||{};return S.sk[k]=S.sk[k]||{h:[],st:0,due:null,m:0}}
// One first-try answer. A session is one calendar day.
api.record=(S,k,ok)=>{if(!k)return;const R=rec(S,k),t=api.today();let last=R.h[R.h.length-1];
  if(!last||last.d!==t){last={d:t,r:0,n:0};R.h.push(last);if(R.h.length>30)R.h.shift()}
  last.n++;if(ok)last.r++;api.update(S,k)};
// Mastery: the last 2 sessions together are at least 80% right.
api.score=(S,k)=>{const R=S.sk&&S.sk[k];if(!R)return null;const L=R.h.slice(-2),r=L.reduce((a,x)=>a+x.r,0),n=L.reduce((a,x)=>a+x.n,0);return{r,n,sessions:L.length,pct:n?r/n:0}};
api.update=(S,k)=>{const R=S.sk[k],sc=api.score(S,k);const was=R.m;
  R.m=sc.sessions>=2&&sc.n>=MINQ&&sc.pct>=NEED&&R.h.slice(-2).every(x=>x.n>=2)?1:0;
  if(R.m&&!was&&R.due===null){R.st=0;R.due=api.today()+GAPS[0]}return R.m};
api.mastered=(S,k)=>!!(S.sk&&S.sk[k]&&S.sk[k].m);
api.dueList=S=>Object.keys(S.sk||{}).filter(k=>NAMES[k]&&S.sk[k].due!==null&&S.sk[k].due<=api.today()).sort((a,b)=>S.sk[a].due-S.sk[b].due);
// After a review: pass moves to the next gap, a miss comes back tomorrow.
api.reviewed=(S,k,r,n)=>{const R=rec(S,k),t=api.today();if(n&&r/n>=NEED){R.st++;R.due=R.st<GAPS.length?t+GAPS[R.st]:null;if(R.st>=GAPS.length)R.done=1}else{R.due=t+1}return R.due};
// Weakest skill for extra practice: lowest recent score, not yet mastered first.
api.weakest=(S,keys)=>{const sc=k=>{const s=api.score(S,k);return s&&s.n?s.pct+(api.mastered(S,k)?1:0):.5};return keys.slice().sort((a,b)=>sc(a)-sc(b))[0]};
api.accuracy=(S,k)=>{const R=S.sk&&S.sk[k];if(!R)return null;const r=R.h.reduce((a,x)=>a+x.r,0),n=R.h.reduce((a,x)=>a+x.n,0);return{r,n,pct:n?r/n:0,sessions:R.h.length}};
return api})();
