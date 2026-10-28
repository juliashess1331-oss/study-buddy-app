"use strict";
// Saving progress. Main copy: localStorage. Mirror copy: IndexedDB. Both stay on this device only.
const STORE=(()=>{
const LS="studybuddy_v1"; // key name never changes, so older saves are always found
const SCHEMA=2;
// Stable part IDs. The order here is the order parts appear in a day.
const REQ={reading:["words","sameopp","builders","story","quickread"],math:["facts","regroup","groups","puzzles","place","measure","story"]};
const LEGACY_ORDER=(subj,extra)=>subj==="reading"?["words","sameopp","builders","story",...Array.from({length:extra},(_,e)=>"bonus"+(e+1)),"quickread"]:[...REQ.math,...Array.from({length:extra},(_,e)=>"bonus"+(e+1))];
const pid=(d,s,id)=>d+"-"+s+"-"+id;
// ---- schema migration (pure; tested) ----
function migrate(raw){let S=raw&&typeof raw==="object"?raw:{};
  S.min=S.min&&S.min.reading?S.min:{reading:20,math:20};
  if(!S.v||S.v<2){ // v1 -> v2: index lists "1-math":[0,2] become stable IDs; "unlocked" becomes parent override
    S.comp=S.comp||{};
    for(const k in (S.done||{})){const m=k.match(/^(\d+)-(reading|math)$/);if(!m)continue;const ord=LEGACY_ORDER(m[2],Math.max(0,Math.floor((S.min[m[2]]-20)/5)));
      for(const i of S.done[k]||[]){const id=ord[i];if(id&&!S.comp[pid(+m[1],m[2],id)])S.comp[pid(+m[1],m[2],id)]={t:0,m:1}}}
    delete S.done;S.v=2}
  // older test tools or backups may still write the v1 fields onto a v2 save; fold them in too
  if(S.done){S.v=1;return migrate(S)}
  if("unlocked" in S){S.ovr=Math.max(S.ovr||1,+S.unlocked||1);delete S.unlocked}
  S.comp=S.comp||{};S.ovr=Math.max(1,S.ovr||1);S.stars=S.stars||0;S.badges=S.badges||[];S.sk=S.sk||{};S.ts=S.ts||0;S.v=SCHEMA;
  return S}
// ---- IndexedDB mirror ----
function idb(){return new Promise((res,rej)=>{if(typeof indexedDB==="undefined")return rej("no idb");const r=indexedDB.open("studybuddy",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
let mirrorP=null;const mirror=()=>mirrorP||(mirrorP=idbGet());
async function idbPut(v){try{await mirror();const db=await idb();await new Promise((res,rej)=>{const tx=db.transaction("kv","readwrite");tx.objectStore("kv").put(v,"state");tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close();return true}catch(e){return false}}
async function idbGet(){try{const db=await idb();const v=await new Promise((res,rej)=>{const g=db.transaction("kv").objectStore("kv").get("state");g.onsuccess=()=>res(g.result);g.onerror=()=>rej(g.error)});db.close();return v||null}catch(e){return null}}
// ---- main copy ----
let lastOk=true;
function readLS(){try{const t=localStorage.getItem(LS);return t?JSON.parse(t):null}catch(e){return null}}
let startEmpty=false;
function load(){const r=readLS();startEmpty=!r;return migrate(r||{})}
function save(S){S.ts=Date.now();const txt=JSON.stringify(S);let ok=true;
  try{localStorage.setItem(LS,txt);ok=localStorage.getItem(LS)===txt}catch(e){ok=false}
  lastOk=ok;idbPut(txt);return ok}
// If the main copy is gone or older than the mirror, bring the mirror back. Returns the restored state or null.
async function recover(S){const t=await mirror();if(!t)return null;let M;try{M=migrate(JSON.parse(t))}catch(e){return null}
  if(startEmpty||(M.ts||0)>(S.ts||0)){if(!M.hash&&S.hash){M.hash=S.hash;M.salt=S.salt}return M}return null}
async function persist(){try{if(navigator.storage&&navigator.storage.persist){if(await navigator.storage.persisted())return true;return await navigator.storage.persist()}}catch(e){}return false}
// ---- backup code (for the grown-up) ----
const KEEP=["v","min","stars","badges","comp","ovr","sk","hc"];
function sum(s){let h=5381;for(let i=0;i<s.length;i++)h=(Math.imul(h,33)^s.charCodeAt(i))>>>0;return h.toString(36)}
function b64e(s){return btoa(unescape(encodeURIComponent(s)))}
function b64d(s){return decodeURIComponent(escape(atob(s)))}
function exportCode(S){const o={};KEEP.forEach(k=>{if(S[k]!==undefined)o[k]=S[k]});const body=b64e(JSON.stringify(o));return "SB2-"+body+"-"+sum(body)}
function importCode(code,S){const c=String(code||"").replace(/\s+/g,"");const m=c.match(/^SB2-([A-Za-z0-9+/=]+)-([a-z0-9]+)$/);if(!m||sum(m[1])!==m[2])return null;
  let o;try{o=JSON.parse(b64d(m[1]))}catch(e){return null}if(!o||typeof o!=="object")return null;
  const N=migrate(o);N.hash=S.hash;N.salt=S.salt;N.hc=S.hc;N.note=S.note;return N}
return{LS,SCHEMA,REQ,pid,migrate,load,save,recover,persist,exportCode,importCode,idbGet,get ok(){return lastOk}}})();
