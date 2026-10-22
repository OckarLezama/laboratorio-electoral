/* ===== Estrategia 2027 =====
   Solo para los cargos que se eligen en 2027 en el estado. Todo se calcula sobre una proyección 2027 por sección:
   lista nominal vigente × participación esperada × votación por partido (promedio ponderado de elecciones recientes).
   Las alianzas parten de las más recientes y sin los partidos que perdieron su registro. El resultado anterior
   del mismo cargo se muestra solo como referencia. */
const EREG=(M0.proy&&M0.proy.reg)||null,NOREG=EREG?EREG.sin:['PRD','PES','RSP','FXM'],ENEW=EREG?EREG.nuevos:['Somos México','PAZ'];
const ECAT={gan:['Ganaría con ventaja','ventaja de 5 puntos o más','#1C7F79'],dis:['En disputa','diferencia menor a 5 puntos','#F46883'],
  pue:['Se pueden ganar','perdería por entre 5 y 10 puntos','#F5A47C'],per:['Difíciles','perdería por más de 10 puntos','#9AA6A6'],
  com:['Competidas','diferencia menor a 5 puntos','#F46883'],med:['Ventaja media','el primero saca entre 5 y 15 puntos','#F5A47C'],amp:['Ventaja amplia','el primero saca más de 15 puntos','#1C7F79'],
  rt:['A ganar (meta mínima)','perdidas más cerradas que cubren los votos que faltan','#B8860B'],duro:['Voto duro','aun en su peor elección desde 2018 sacó 30% o más de los votos esperados','#2E3B3B'],sw:['Switcher','cambió de partido ganador en al menos 2 cargos entre las dos últimas elecciones','#4CC1BA']};
Object.assign(ECAT,{seg:['Asegurado','ganaría por 10 puntos o más','#1C7F79'],cui:['Cuidar','ganaría por menos de 10 puntos','#93D6D0'],
  mov:['Movilizar','perdería por menos de 10 y hoy vota mucha menos gente que en su mejor elección: sacar a votar a simpatizantes','#F5A47C'],
  con:['Convencer','perdería por menos de 10 y la participación es la de siempre: ganar votantes al rival','#F46883'],
  dif:['No invertir','perdería por más de 10 puntos','#D3DADA'],pri:['Prioritarias','movilizar y convencer','#F46883']});
const EACT=['mov','con','cui','seg','dif'];
const ESTL={gana:['Ganaría','up'],dis:['En disputa','mid'],alc:['Se puede ganar','mid'],amplia:['Brecha amplia','dn']};
const EOBJ=[['GOB','Gubernatura','est',CFG.gob2027],['DIPL','Congreso local','dl',CFG.cong2027],['AYU',M0.cab==='cdmx'?'Alcaldías':'Ayuntamientos','mun',CFG.ayu2027],['DIPF','Diputaciones federales','df',true]].filter(o=>o[3]&&lastOf(o[0]));
const ELV={est:'Estado',mun:'Municipio',dl:'Distrito local',df:'Distrito federal'};
const ALC=M0.cab==='cdmx',ENN={est:['estado','estados'],mun:ALC?['alcaldía','alcaldías']:['municipio','municipios'],dl:['distrito local','distritos locales'],df:['distrito federal','distritos federales']};
if(!st.es) st.es={obj:EOBJ[0][0],lv:null,u:null,seg:null,sc:'s2',ally:null,col:'seg',tab:'sec',q:'',sk:null,sd:1};
const ECACHE={},EPJ={};
let ERT=new Set();
const eRef=()=>lastOf(st.es.obj);
const eNat=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[2];
const eLv=()=>st.es.lv||eNat();
const eKey=(lv,i)=>lv==='mun'?S[i].m:lv==='dl'?S[i].dl:lv==='df'?S[i].df:0;
const eName=(lv,k)=>lv==='mun'?(ALC?'Alcaldía ':'Municipio de ')+MUN[k]:lv==='dl'?'Distrito local '+k+(CABDL[k]?' · '+CABDL[k]:''):lv==='df'?'Distrito federal '+k+(CABDF[k]?' · '+CABDF[k]:''):EST;
const eSide=A=>A.map(q=>NM[q]).join('-');
const bnm=ms=>ms.length>3?ms.slice(0,3).map(m=>NM[m]).join('-')+' y '+(ms.length-3)+' más':ms.map(m=>NM[m]).join('-');
const eGroups=lv=>{const g={}; ALL.forEach(i=>{const k=eKey(lv,i); (g[k]=g[k]||[]).push(i);}); return Object.entries(g).map(([k,ii])=>({k:+k,ii}));};
const eContests=()=>eNat()==='est'?[{k:0,ii:ALL}]:eGroups(eNat());
const eYear=()=>D.E[eRef()].year;
/* votos de un bloque: el partido más fuerte aporta todo y los aliados aportan la fracción r medida en elecciones del mismo día */
/* suma de una alianza: el partido más votado completo y los aliados con el rendimiento observado (PR.r).
   Excepción: en candidatura común el INE reparte el voto de la coalición entre sus partidos, así que esos votos
   ya son de la coalición y se suman completos. */
const sv=(pv,ms)=>{if(ms.length<2) return pv[ms[0]]||0; const used=new Set(),units=[];
  (typeof ESPL!=='undefined'?ESPL:[]).forEach(b=>{if(b.every(m=>ms.includes(m))){units.push(b.reduce((t,m)=>t+(pv[m]||0),0)); b.forEach(m=>used.add(m));}});
  ms.forEach(m=>{if(!used.has(m)) units.push(pv[m]||0);}); units.sort((x,y)=>y-x); return units[0]+(typeof PR!=='undefined'?PR.r:1)*units.slice(1).reduce((t,x)=>t+x,0);};
/* alianzas de partida para 2027: las de la elección más reciente (local si la hay), sin partidos sin registro */
const EBL=(()=>{const ym=Math.max(...Object.values(D.E).map(e=>+e.year)),ks=Object.keys(D.E).filter(k=>+D.E[k].year===ym),k=ks.find(k=>/^(DIPL|AYU|GOB)/.test(k))||ks[0];
  return {ek:k,year:ym,bl:D.E[k].blocs.map(b=>b.members.filter(m=>m!=='OTROS'&&!NOREG.includes(m))).filter(m=>m.length)};})();
const EPARTIES=[...new Set(EBL.bl.flat())].sort((a,b)=>(MAIN.indexOf(a)<0?99:MAIN.indexOf(a))-(MAIN.indexOf(b)<0?99:MAIN.indexOf(b)));
/* Ninguna alianza se da por hecha: cada partido parte solo; las alianzas son "posibles" y se comparan como escenarios. */
if(!st.es.rv) st.es.rv='sep';
/* candidaturas comunes: coaliciones cuyos partidos aparecen con votos casi idénticos (el INE repartió el voto común).
   Ahí no existe el voto "propio" de cada partido: se analizan solo como coalición. */
const ESPL=(()=>{const out=[],seen=new Set(),ix={}; D.P8.forEach((q,j)=>ix[q]=j);
  /* se revisa sección por sección: en candidatura común los partidos traen el mismo voto (±2) en casi todas las secciones */
  Object.keys(D.E).filter(ek=>+D.E[ek].year>=2021).forEach(ek=>{const E=D.E[ek]; E.blocs.forEach(b=>{const ms=b.members.filter(m=>m!=='OTROS'&&ix[m]!=null); if(ms.length<2) return; let k=0,n=0;
    E.r.forEach(r=>{if(!r) return; const v=ms.map(m=>r[ix[m]]),mx=Math.max(...v); if(mx<=5) return; n++; if(mx-Math.min(...v)<=2) k++;});
    if(n&&k/n>.5){const mm=ms.filter(m=>EPARTIES.includes(m)),key=mm.slice().sort().join('+'); if(mm.length>1&&!seen.has(key)){seen.add(key); out.push(mm);}}});}); return out;})();
const eSplitOf=p=>ESPL.find(b=>b.includes(p));
const eRv=()=>ESPL.length?'ali':st.es.rv;
const ESOLO=EPARTIES.map(q=>[q]);
const eGenBl=()=>eRv()==='ali'?EBL.bl:ESOLO;  /* bloques del panorama y de los rivales */
function eBlocOf(p){return eGenBl().find(b=>b.includes(p))||[p];}
function eRivBl(A){return eGenBl().map(ms=>ms.filter(m=>!A.includes(m))).filter(ms=>ms.length);}
/* socios posibles: partidos con los que fue en alianza en 2021 o después */
const EPOOL=p=>{const s=new Set(); Object.values(D.E).forEach(e=>{if(+e.year<2021) return; e.blocs.forEach(b=>{if(b.members.includes(p)) b.members.forEach(m=>{if(m!==p&&EPARTIES.includes(m)) s.add(m);});});}); return [...s].sort((a,b)=>EPARTIES.indexOf(a)-EPARTIES.indexOf(b));};
function eScen(p){const sp=eSplitOf(p); if(sp){const base=[p].concat(sp.filter(m=>m!==p)),pool=EPOOL(p).filter(m=>!sp.includes(m)),out=[base]; pool.forEach(m=>out.push(base.concat([m]))); if(pool.length>1) out.push(base.concat(pool)); return out.slice(0,6);}
  const pool=EPOOL(p),out=[[p]]; const k=pool.length; for(let m=1;m<(1<<k);m++){const sub=pool.filter((_,j)=>m&(1<<j)); if(sub.length<=2||sub.length===k) out.push([p].concat(sub));} out.sort((a,b)=>a.length-b.length); return out.slice(0,8);}
const eKeyA=A=>A.slice().sort().join('+');
function eAlly(){const p=st.party; if(!p) return null; const a=st.es.al,sp=eSplitOf(p),base=sp?[p].concat(sp.filter(m=>m!==p)):[p]; return a&&a[0]===p&&base.every(m=>a.includes(m))?a:base;}
/* Proyección 2027 por sección. Modelo calibrado en pipeline/proyeccion.py con pruebas contra 2021 y 2024 (meta.proy):
   votación = a × última elección del mismo cargo (con oscilación estatal si sw) + (1−a) × promedio de las elecciones del año más reciente;
   participación según la regla que menos se equivocó; alianzas con el rendimiento medido (r); encuesta opcional por oscilación proporcional. */
const PR=Object.assign({a:.5,sw:0,tp:'prom',r:.84,r_q:[.3,1.27],est:null,tipos:{}},M0.proy||{});
if(!st.es.poll) st.es.poll={};
const EYM=Math.max(...Object.values(D.E).map(e=>+e.year));
function eProjW(){const t=st.es.obj,L=lastOf(t),rec=Object.keys(D.E).filter(k=>+D.E[k].year===EYM),c6=D.E[t+'_'+(EYM-3)]?[t+'_'+(EYM-3)]:Object.keys(D.E).filter(k=>+D.E[k].year===EYM-3);return {L,rec,c6,ym:EYM};}
const shOf=(ek,i)=>{const r=row(ek,i); if(!r||!r.val) return null; const o={}; for(const q in r.v) o[q]=r.v[q]/r.val; return o;};
function eP(){const o=st.es.obj,pk=o+'|'+JSON.stringify(st.es.poll[o]||null); if(EPJ[pk]) return EPJ[pk]; const {L,rec,c6}=eProjW(),out=new Array(N).fill(null);
  const stw=ks=>{const t={}; let V=0; ks.forEach(ek=>ALL.forEach(i=>{const r=row(ek,i); if(!r||!r.val) return; V+=r.val; for(const q in r.v) t[q]=(t[q]||0)+r.v[q];})); for(const q in t) t[q]/=V; return t;};
  let f=null; if(PR.sw){const sL=stw([L]),sR=stw(rec); f={}; for(const q in sL) f[q]=sL[q]>1e-4?Math.min(5,Math.max(.2,(sR[q]||0)/sL[q])):0;}
  const tpAv=(ks,i)=>{const v=ks.map(k=>row(k,i)).filter(r=>r&&r.ln).map(r=>r.t/r.ln); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  ALL.forEach(i=>{const rs=rec.map(k=>shOf(k,i)).filter(Boolean),R={}; rs.forEach(x=>{for(const q in x) R[q]=(R[q]||0)+x[q]/rs.length;}); let B=shOf(L,i)||(rs.length?R:null); if(!B) return; if(!rs.length) Object.assign(R,B);
    if(f){const b={}; let t=0; for(const q in B){b[q]=B[q]*(f[q]??1); t+=b[q];} for(const q in b) b[q]/=t||1; B=b;}
    const P={}; let t=0; new Set([...Object.keys(B),...Object.keys(R)]).forEach(q=>{if(NOREG.includes(q)) return; const v=PR.a*(B[q]||0)+(1-PR.a)*(R[q]||0); if(v>0){P[q]=v; t+=v;}}); for(const q in P) P[q]/=t||1;
    const a6=tpAv(c6,i),al=tpAv(rec,i),tp=100*(PR.tp==='ciclo'?(a6??al):PR.tp==='ultima'?(al??a6):(a6!=null&&al!=null?(a6+al)/2:(a6??al)))||EXPT[i]||50;
    const rr=row(L,i),vr=rr&&rr.t?rr.val/rr.t:.96,ln=S[i].ln||(rr?rr.ln:0),V=ln*tp/100*vr,pv={}; for(const q in P) pv[q]=V*P[q]; out[i]={V,pv,ln,tp};});
  const poll=st.es.poll[o]; if(poll&&poll.v){const T={}; let V=0; out.forEach(x=>{if(!x) return; V+=x.V; for(const q in x.pv) T[q]=(T[q]||0)+x.pv[q];}); const g={}; let rest=0,restP=0;
    for(const q in T){const sh=100*T[q]/V; if(poll.v[q]!=null&&poll.v[q]!==''){g[q]=sh>.05?+poll.v[q]/sh:0;} else {rest+=sh;}} const used=Object.values(poll.v).filter(v=>v!==''&&v!=null).reduce((a,b)=>a+ +b,0); restP=Math.max(0,100-used);
    for(const q in T) if(g[q]==null) g[q]=rest>0?restP/rest:1;
    out.forEach(x=>{if(!x) return; let t=0; for(const q in x.pv){x.pv[q]*=g[q]; t+=x.pv[q];} if(t>0) for(const q in x.pv) x.pv[q]*=x.V/t;});}
  return EPJ[pk]=out;}
/* errores medidos en la prueba contra el pasado (80% de los casos quedó dentro): rango de la diferencia entre 1.º y 2.º */
function eErr(niv){const t=st.es.obj,poll=st.es.poll[t]; if(niv==='est'||eNat()==='est') return poll&&poll.v?2*(+poll.moe||3):(PR.est&&PR.est.q80)||null; const T=PR.tipos[t]; return T?((poll&&poll.v?T.enc:T.hist)||{}).q80||null:null;}
const ULBL={GOB:'el estado',DIPL:'distrito local',AYU:'municipio',DIPF:'distrito federal'};
const EINFO={
 proy:()=>{const T=PR.tipos[st.es.obj]||{},H=T.hist,En=T.enc,E0=PR.est;return `<b>Qué es</b><p>Una estimación de cómo votaría cada sección en 2027 si nada cambiara: combina la última elección del mismo cargo (${Math.round(PR.a*100)}%)${PR.sw?', ajustada al cambio de cada partido en todo el estado,':''} con las elecciones de ${EYM} (${Math.round(100-PR.a*100)}%).</p><b>Por qué este método</b><p>Las secciones votan con un patrón muy estable: donde un partido es fuerte, suele seguir siéndolo. Lo que cambia de una elección a otra es el nivel general (el ánimo del momento). Por eso se usa la elección del mismo cargo, que dice cómo vota cada sección para ese puesto, mezclada con la más reciente, que trae el ánimo actual. Es lo mejor que se puede hacer solo con resultados oficiales. Los métodos más precisos (encuestas llevadas a cada sección) necesitan encuestas con respuestas individuales, que hoy no tenemos.</p><b>Qué tan confiable</b><p>Se probó "pronosticando" 2021 y 2024 con datos anteriores. ${E0?`El resultado estatal se desvió en promedio ${E0.mae} puntos.`:''} ${H?`Por ${ULBL[st.es.obj]}, ${H.mae} puntos; acertó al ganador en ${H.hit}% de los casos.`:''} ${En?`Con una encuesta estatal el acierto sube a ${En.hit}%.`:''}</p>`;},
 rango:()=>`<b>Qué es</b><p>El margen dentro del cual cayeron 8 de cada 10 resultados reales cuando este mismo método se probó con elecciones pasadas.</p><b>Por qué se muestra</b><p>Un solo número da una falsa seguridad. El rango dice cuánto puede fallar la estimación; si incluye ganar y perder, es empate técnico y conviene no tomar decisiones solo con ese dato.</p>`,
 part:()=>`<b>Qué es</b><p>El porcentaje de la lista nominal que se espera que vote en cada sección. Regla usada: ${({ciclo:'la misma elección de hace 6 años',ultima:'la elección más reciente',prom:'el promedio entre la elección intermedia de 2021 y la más reciente'})[PR.tp]}.</p><b>Por qué</b><p>2027 es una elección intermedia: sin elección presidencial vota menos gente que en 2024. Por eso no basta con la última elección; se probaron tres reglas y se usa la que menos se equivocó (±${PR.tp_err} puntos por sección).</p>`,
 alianza:()=>`<b>Qué es</b><p>La parte de los votos de los aliados que realmente llega a la alianza: el partido más fuerte aporta todo y los aliados el ${Math.round(PR.r*100)}%.</p><b>Por qué</b><p>Sumar los votos de los partidos supone que todos sus votantes los siguen en la alianza, y no pasa. Se midió en ${PR.r_n||'—'} casos de elecciones del mismo día donde los mismos partidos fueron juntos en una y separados en otra. La mitad de los casos quedó entre ${Math.round(PR.r_q[0]*100)}% y ${Math.round(PR.r_q[1]*100)}%: depende mucho de los candidatos.</p>`,
 esc:()=>`<b>Qué es</b><p>El resultado estimado del partido elegido yendo solo y en cada posible alianza con los partidos con los que se ha aliado desde 2021.</p><b>Por qué</b><p>Ninguna alianza para 2027 está decidida. Comparar escenarios muestra cuánto suma cada aliado y cuál alianza haría falta para ganar. Las alianzas se calculan con el rendimiento medido (${Math.round(PR.r*100)}%), no sumando votos completos.</p>`,
 rival:()=>`<b>Qué es</b><p>Cómo se supone que compiten los demás partidos: cada uno por separado, o en posible alianza como fueron en ${EBL.year}.</p><b>Por qué</b><p>Tampoco las alianzas de los rivales están decididas. Por separado es el punto de partida neutral. En posible alianza muestra el escenario más difícil si repiten.</p>`,
 enc:()=>{const En=(PR.tipos[st.es.obj]||{}).enc;return `<b>Qué es</b><p>Capturas el porcentaje estatal de cada partido según una encuesta publicada y su margen de error. Cada sección se ajusta en la misma proporción en que la encuesta difiere de la estimación.</p><b>Por qué</b><p>El historial dice dónde está el voto de cada partido, pero no anticipa cambios de ánimo como el de 2024. La encuesta aporta el nivel actual y este ajuste lo reparte respetando el patrón de cada sección. Es la forma estándar de llevar una encuesta estatal a territorios pequeños.${En?` En la prueba, conocer el resultado estatal llevó el acierto por ${ULBL[st.es.obj]} a ${En.hit}%.`:''}</p>`;},
 meta:()=>`<b>Qué es</b><p>Meta mínima: un voto más que el rival estimado. Meta segura: la votación necesaria para ganar aunque la estimación falle tanto como falló en la prueba con elecciones pasadas.</p><b>Por qué dos metas</b><p>La mínima es el piso: con ella se empata la estimación. La segura es la que conviene usar para planear, porque cubre el error del modelo.</p>`,
 ruta:()=>`<b>Qué es</b><p>Las secciones que hoy se perderían por menos votos, de la más cerrada a la menos cerrada, hasta sumar los votos que faltan para ganar (meta mínima). Para la meta segura se indica cuántos votos más faltan.</p><b>Por qué en ese orden</b><p>Son las que piden menos votos por sección: el esfuerzo más pequeño para cubrir la brecha. Supone votos nuevos (gente que hoy no vota o no vota por ustedes); si el voto se le quita al rival, cuenta doble.</p>`,
 sit:()=>{const m=PR.mov||{};return `<b>Qué es</b><p>Qué conviene hacer en cada sección según la estimación: asegurado (ganaría por 10 puntos o más), cuidar (ganaría por menos de 10), movilizar o convencer (perdería por menos de 10) y no invertir (perdería por más de 10). Voto duro: aun en su peor elección desde 2018, el partido sacó al menos 30% de los votos que se esperan; 85% de esas secciones las ganó en 2024. Switcher: cambió de partido ganador entre las dos últimas elecciones en al menos 2 cargos (diputación local, federal, ayuntamiento); estas secciones cambiaron de ganador en 2024 casi el doble que las demás.</p><b>Por qué movilizar o convencer</b><p>Se revisaron ${m.n?m.n.toLocaleString('es-MX'):'miles de'} casos reales (2018 a 2024) en que un partido perdió una sección por menos de 10 puntos y la ganó en la siguiente elección. En ${m.base||27}% la ganó sacando a votar a más gente y en el resto quitándole votos al rival. Donde la participación quedó al menos ${Math.round((m.th||.2)*100)} puntos por debajo del máximo histórico de la sección, ${m.prec||67}% se ganó movilizando. Por eso: <b>movilizar</b> si la participación esperada está ${Math.round((m.th||.2)*100)} puntos o más por debajo de su mejor elección; si no, <b>convencer</b>.</p>`;}};
const ei=k=>`<button class="ei" data-ei="${k}" aria-label="Cómo se calcula" title="Cómo se calcula">i</button>`;
function eiPop(b){let p=$('eipop'); if(!p){p=document.createElement('div'); p.id='eipop'; p.className='eipop'; document.body.appendChild(p); document.addEventListener('click',e=>{if(!e.target.closest('.eipop,.ei')) p.hidden=true;}); document.addEventListener('keydown',e=>{if(e.key==='Escape') p.hidden=true;});}
  p.innerHTML=EINFO[b.dataset.ei]()+'<p class="es-f">Detalle técnico: pipeline/proyeccion.py e INSTRUCTIVO.</p>'; p.hidden=false; const r=b.getBoundingClientRect(),w=Math.min(340,innerWidth-24); p.style.width=w+'px'; p.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+'px'; const h=p.offsetHeight; p.style.top=(r.bottom+h+8>innerHeight?Math.max(8,r.top-h-8):r.bottom+8)+'px';}
/* meta mínima: un voto más que el rival; meta segura: ganar aun si el resultado se mueve lo que se equivocó el modelo */
function eMetas(d,niv){const e=eErr(niv),R=d.riv?d.riv.votes:0,mn=Math.round(R)+1,sg=e?Math.round(R+e/100*d.g.V)+1:null;
  return `<div class="es-mt"><div><span>Meta mínima ${ei('meta')}</span><b>${fmt(mn)}</b><small>votos: uno más que ${esc(d.rvN)}</small></div>${sg?`<div><span>Meta segura</span><b>${fmt(sg)}</b><small>votos: gana aunque la estimación falle ±${e} pts</small></div>`:''}</div>`;}
function eRange(mg,niv){const e=eErr(niv),c=eConf(e); if(e==null) return ''; const lo=mg-e,hi=mg+e;
  return `<div class="es-rg"><span>Diferencia estimada <b>${pjTxt(mg)}</b>, rango ${pjTxt(lo)} a ${pjTxt(hi)} ${ei('rango')}</span><span>Confiabilidad <b class="es-stl ${c[1]}">${c[0]}</b> ${ei('proy')}</span>${lo<0&&hi>0?'<em>Empate técnico: el rango incluye ganar y perder.</em>':''}</div>`;}
const eConf=e=>e==null?['sin medir','mid']:e<=8?['alta','up']:e<=15?['media','mid']:['baja','dn'];
function eAgg(ii){const P=eP(),o={V:0,ln:0,em:0,pv:{}}; ii.forEach(i=>{const x=P[i]; if(!x) return; o.V+=x.V; o.ln+=x.ln; o.em+=x.ln*x.tp/100; for(const q in x.pv) o.pv[q]=(o.pv[q]||0)+x.pv[q];}); o.tp=o.ln?100*o.em/o.ln:0; return o;}
function eDuel27(ii,A){const g=eAgg(ii); if(!g.V) return null; const mine=sv(g.pv,A); if(!mine) return null; let riv=null;
  eRivBl(A).forEach(rem=>{const v=sv(g.pv,rem); if(!riv||v>riv.votes) riv={votes:v,members:rem,name:bnm(rem)};});
  return {g,mine,riv,rvN:riv?riv.name:'—',gap:riv?Math.round(riv.votes-mine):-Math.round(mine),mg:100*(mine-(riv?riv.votes:0))/g.V,a:100*mine/g.V,b:riv?100*riv.votes/g.V:0};}
function eWin27(ii){const g=eAgg(ii); if(!g.V) return null; const bl=eGenBl().map(ms=>({ms,v:sv(g.pv,ms),name:bnm(ms),lead:ms.slice().sort((a,b)=>(g.pv[b]||0)-(g.pv[a]||0))[0]})).sort((a,b)=>b.v-a.v);
  return {bl,lead:bl[0].lead,m:100*(bl[0].v-(bl[1]?bl[1].v:0))/g.V,mv:Math.round(bl[0].v-(bl[1]?bl[1].v:0)),a:100*bl[0].v/g.V,b:bl[1]?100*bl[1].v/g.V:0,g};}
/* resultado anterior del mismo cargo (solo referencia) */
function eHist(ii,A){const ek=eRef(),T=totals(ek,ii); if(!T.val) return null; if(!A){const w=winner(ek,ii); return w?`${esc(w.bl[0].name)} ganó por ${w.m.toFixed(1)} puntos`:null;}
  const mine=A.reduce((t,q)=>t+(T.tot[q]||0),0); let rv=0; D.E[ek].blocs.forEach(b=>{const rem=b.members.filter(m=>m!=='OTROS'&&!A.includes(m)); const v=rem.reduce((t,m)=>t+(T.tot[m]||0),0); if(v>rv) rv=v;});
  const m=100*(mine-rv)/T.val; return mine?`${A.length>1?'sumando sus votos, ':''}${esc(eSide(A))} ${m>=0?'habría ganado':'habría perdido'} por ${Math.abs(m).toFixed(1)} puntos`:`${esc(eSide(A))} no compitió`;}
const q67=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y); return a.length?a[Math.floor(2*a.length/3)]:Infinity;};
/* secciones: situación proyectada, voto duro, switcher y ruta (secciones a ganar en cada contienda) */
function eSecs(){const A=eAlly(),key=st.es.obj+'|'+(A?A.join('+'):'gen')+'|'+JSON.stringify(st.es.poll[st.es.obj]||null)+'|'+eRv(); if(ECACHE[key]){ERT=ECACHE[key].rt; return ECACHE[key];}
  const P=eP(),sumDuro=(ms,i)=>{let s=0,ok=false; ms.forEach(m=>{if(V2.duro[m]&&V2.duro[m][i]!=null){s+=V2.duro[m][i]; ok=true;}}); return ok?s:null;};
  const CR={},CT={},rt=new Set(); if(A) eContests().forEach(c=>{const d=eDuel27(c.ii,A); if(d){c.ii.forEach(i=>CR[i]=d); CT[c.k]={k:c.k,ii:c.ii,d};}});
  const L=[]; ALL.forEach(i=>{const x=P[i]; if(!x||!x.V) return; const b={i,ln:x.ln,V:x.V,sw:!!SW[i]};
    if(A){const cd=CR[i]; if(!cd) return; const mine=sv(x.pv,A),rv=cd.riv?sv(x.pv,cd.riv.members):0; Object.assign(b,{mine,rv,rvN:cd.rvN,mg:100*(mine-rv)/x.V,dp:sumDuro(A,i)}); b.cat=b.mg>=5?'gan':b.mg>-5?'dis':b.mg>-10?'pue':'per'; b.tp=x.tp; b.act=b.mg>=10?'seg':b.mg>=0?'cui':b.mg>-10?(((V2.maxT[i]||0)-x.tp)/100>=((PR.mov||{}).th||.2)?'mov':'con'):'dif';}
    else {const w=eWin27([i]); if(!w) return; const B=w.bl[0]; Object.assign(b,{mg:w.m,mv:w.mv,lead:w.lead,wn:B.name,sn:w.bl[1]?w.bl[1].name:'—',dp:sumDuro(B.ms,i)}); b.cat=b.mg<5?'com':b.mg<15?'med':'amp';}
    L.push(b);});
  L.forEach(x=>{const tp=P[x.i].tp; x.duro=x.dp!=null&&tp>0&&100*x.dp/tp>=30;}); const by={}; L.forEach(x=>by[x.i]=x);
  Object.values(CT).forEach(c=>{const d=c.d; let acc=0,n=0; const tg=d.gap;
    if(tg>0) c.ii.map(i=>by[i]).filter(x=>x&&x.rv>x.mine).sort((a,b)=>b.mg-a.mg).forEach(x=>{if(acc>=tg) return; x.add=Math.round(x.rv-x.mine)+1; acc+=x.add; x.ord=++n; rt.add(x.i);});
    Object.assign(c,{n,acc,st:d.gap<=0?'gana':d.mg>-5?'dis':d.mg>-10?'alc':'amplia'});});
  ERT=rt; return ECACHE[key]={L,by,A,CT,rt};}
const eMatch=(x,f)=>!f||(f==='duro'?x.duro:f==='sw'?x.sw:f==='rt'?!!x.add:f==='pri'?(x.act==='mov'||x.act==='con'):EACT.includes(f)?x.act===f:x.cat===f);
const eKeys=()=>st.party?EACT.concat(['rt','duro','sw']):['com','med','amp','duro','sw'];
const pjTxt=m=>m==null?'—':(m>=0?'+':'−')+Math.abs(m).toFixed(1)+' pts';
function eSelII(){const lv=eLv(); return st.es.u==null||lv==='est'?ALL:ALL.filter(i=>String(eKey(lv,i))===String(st.es.u));}
function eFocus(){const lv=eLv(),nat=eNat(),u=st.es.u; if(u!=null&&lv!=='est'&&lv!==nat) return {mode:'sub'}; if(nat==='est') return {mode:'con',k:0}; if(u!=null) return {mode:'con',k:+u}; return {mode:'multi'};}
/* ganador proyectado por unidad (colorear por ganador) */
const EWIN={};
function eUnitWin(i){const lv=eLv(),key=st.es.obj+'|'+lv+'|'+JSON.stringify(st.es.poll[st.es.obj]||null)+'|'+eRv(); if(!EWIN[key]){EWIN[key]={}; (lv==='est'?[{k:0,ii:ALL}]:eGroups(lv)).forEach(u=>EWIN[key][u.k]=eWin27(u.ii));} return EWIN[key][eKey(lv,i)];}
METRICS.seg={party:1,est:1,n:'Estrategia',d:'',f:ii=>{const i=ii[0];
  if(st.es.col==='win'){const w=eUnitWin(i); return w?{c:C[w.lead],t:.4+.6*Math.min(1,w.m/20)}:null;}
  const x=eSecs().by[i]; if(!x) return null; return {c:ECAT[st.party?x.act:x.cat][2],t:st.es.seg&&!eMatch(x,st.es.seg)?.12:1};}};
const eObjN=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[1]+' 2027';
/* recuadros por situación: filtran el mapa y la tabla */
function eTiles(ii,cls){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(Boolean);
  return `<div class="es-kp ${cls||''}">${eKeys().map(k=>{const n=xs.filter(x=>eMatch(x,k)).length; return `<button data-eseg="${k}" aria-pressed="${st.es.seg===k}" class="${k==='rt'?'krt':''}"><i style="background:${ECAT[k][2]}"></i><b>${fmt(n)}</b><span>${ECAT[k][0]}</span><small>${ECAT[k][1]}</small></button>`;}).join('')}</div>`;}
function eLegendHTML(){const E=eSecs(),ii=eSelII(),xs=ii.map(i=>E.by[i]).filter(Boolean),lvs={est:'estado',mun:'municipio',dl:'DL',df:'DF'}[eLv()];
  const tg=`<div class="es-tg"><button data-ecol="seg" aria-pressed="${st.es.col!=='win'}">${st.party?'Qué hacer':'Situación'}</button><button data-ecol="win" aria-pressed="${st.es.col==='win'}">Ganador por ${lvs}</button></div>`;
  if(st.es.col==='win'){const ws={}; (eLv()==='est'?[{k:0,ii:ALL}]:eGroups(eLv())).forEach(u=>{const w=eWin27(u.ii); if(w) ws[w.lead]=(ws[w.lead]||0)+1;});
    return `<div class="mcard es-leg"><small>Proyección · ${esc(eObjN())}</small>${tg}${Object.entries(ws).sort((a,b)=>b[1]-a[1]).map(([q,n])=>`<div class="es-li"><i style="background:${C[q]}"></i>${esc(NM[q])}${eBlocOf(q).length>1?' y aliados':''}<b>${n}</b></div>`).join('')}<div class="es-n">${ENN[eLv()][1]} que ganaría cada fuerza · la alianza toma el color de quien la encabeza</div></div>`;}
  const n=st.es.seg?xs.filter(x=>eMatch(x,st.es.seg)).length:0;
  return `<div class="mcard es-leg"><small>${st.party?esc(eSide(eAlly()))+' · ':''}Proyección ${esc(eObjN())}</small>${tg}${eKeys().map(k=>`<button data-eseg="${k}" aria-pressed="${st.es.seg===k}" title="${esc(ECAT[k][1])}"><i style="background:${ECAT[k][2]}"></i>${ECAT[k][0]}<b>${fmt(xs.filter(x=>eMatch(x,k)).length)}</b></button>`).join('')}${st.es.seg?`<button class="es-open" data-eopen="1">Ver las ${fmt(n)} secciones en tabla</button>`:`<div class="es-n">Clic en una situación para resaltar sus secciones</div>`}</div>`;}
/* datos por unidad de un nivel (lista del panel y tabla) */
function eUnits(L){const A=eAlly(),E=eSecs(),nat=eNat(),sel=new Set(eSelII());
  return eGroups(L).filter(u=>u.ii.some(i=>sel.has(i))).map(u=>{const ii=u.ii.filter(i=>sel.has(i)),xs=ii.map(i=>E.by[i]).filter(Boolean),o={k:u.k,name:eName(L,u.k),sec:xs.length};
    if(A&&L===nat){const c=E.CT[u.k]; if(!c) return null; return Object.assign(o,{con:1,me:c.d.mine,rvN:c.d.rvN,rv:c.d.riv?c.d.riv.votes:0,meta:Math.round(c.d.riv?c.d.riv.votes:0)+1,gap:c.d.gap,mg:c.d.mg,n:c.n,st:c.st,h:eHist(c.ii,A)});}
    if(A){const cnt=k=>xs.filter(x=>x.act===k).length,rx=xs.filter(x=>x.add); return Object.assign(o,{seg:cnt('seg'),cui:cnt('cui'),mov:cnt('mov'),cnv:cnt('con'),dif:cnt('dif'),n:rx.length,add:rx.reduce((t,x)=>t+x.add,0),me:xs.reduce((t,x)=>t+x.mine,0),meta:Math.round(xs.reduce((t,x)=>t+x.mine,0))+rx.reduce((t,x)=>t+x.add,0)});}
    const w=eWin27(ii); if(!w) return null; return Object.assign(o,{wn:w.bl[0].name,lead:w.lead,sn:w.bl[1]?w.bl[1].name:'—',m:w.m,mv:w.mv,com:xs.filter(x=>x.cat==='com').length,h:eHist(ii,null)});}).filter(Boolean);}
function eUnitSort(U){const A=eAlly(); if(!A) return U.sort((a,b)=>a.m-b.m); if(U[0]&&U[0].con){const o={dis:0,alc:1,amplia:2,gana:3}; return U.sort((a,b)=>o[a.st]-o[b.st]||(a.st==='gana'?b.gap-a.gap:a.gap-b.gap));} return U.sort((a,b)=>b.n-a.n||(b.mov+b.cnv)-(a.mov+a.cnv));}
function ePjBar(a,b,an,bn){const tot=Math.max(100,a+b); return `<div class="es-pjb"><i style="width:${(100*a/tot).toFixed(1)}%"></i><u style="width:${(100*b/tot).toFixed(1)}%"></u></div><div class="es-pjl"><span>${esc(an)} <b>${a.toFixed(1)}%</b></span><span>${esc(bn)} <b>${b.toFixed(1)}%</b></span></div>`;}
/* la alianza más pequeña (hasta 3 aliados, sin el bloque rival) que ganaría la contienda en la proyección */
function eBestAlly(ii){const p=st.party,d0=eDuel27(ii,[p]); if(!d0) return null; const rl=d0.riv?d0.riv.members[0]:null,ex=new Set((EBL.bl.find(b=>b.includes(rl))||[rl]).concat(d0.riv?d0.riv.members:[])),pool=EPARTIES.filter(q=>q!==p&&!ex.has(q)); let best=null;
  const test=A=>{const d=eDuel27(ii,A); if(d&&(!best||(d.mg>=0&&best.d.mg<0)||((d.mg>=0)===(best.d.mg>=0)&&(d.mg>=0?A.length<best.A.length||(A.length===best.A.length&&d.mg>best.d.mg):d.mg>best.d.mg)))) best={A,d};};
  test([p]); pool.forEach((a,i)=>{test([p,a]); pool.slice(i+1).forEach((b,j)=>{test([p,a,b]); pool.slice(i+j+2).forEach(c=>test([p,a,b,c]));});}); return best;}
function eCompare(){const p=st.party,F=eFocus(),nat=eNat(); if(!p) return '';
  const A0=eAlly(),list=eScen(p),cur=eKeyA(A0); if(!list.some(A=>eKeyA(A)===cur)) list.push(A0);
  const multi=F.mode!=='con',cs=eContests(),c0=F.mode==='con'?(cs.find(c=>c.k===F.k)||{ii:ALL}):null,e=eErr(multi?nat:(nat==='est'?'est':nat));
  const card=A=>{const k=eKeyA(A),on=k===cur,lead=C[A[0]];
    if(multi){let w=0,al=0,emp=0; cs.forEach(c=>{const d=eDuel27(c.ii,A); if(!d) return; if(d.gap<=0) w++; else if(d.mg>-10) al++; if(e&&Math.abs(d.mg)<e) emp++;});
      return `<button class="es-sc${on?' on':''}" data-esa="${A.join('+')}"><small>${A.length>1?'Posible alianza':'Solo'}</small><b>${esc(eSide(A))}</b><div class="es-scn"><span class="num">${w}</span> de ${cs.length} ${ENN[nat][1]}</div><div class="es-scb">${cs.map(c=>{const d=eDuel27(c.ii,A); return `<i style="background:${d&&d.gap<=0?lead:d&&d.mg>-10?'var(--peach)':'var(--line)'}"></i>`;}).join('')}</div><em>${al?`+${al} perdería por menos de 10 pts`:'—'}${emp?` · ${emp} en empate técnico`:''}</em></button>`;}
    const d=eDuel27(c0.ii,A); if(!d) return ''; const emp=e&&Math.abs(d.mg)<e;
    return `<button class="es-sc${on?' on':''}" data-esa="${A.join('+')}"><small>${A.length>1?'Posible alianza':'Solo'}</small><b>${esc(eSide(A))}</b><div class="es-scv"><span style="width:${Math.min(100,d.a).toFixed(1)}%;background:${lead}"></span><u style="width:${Math.min(100,d.b).toFixed(1)}%"></u></div><div class="es-scl"><span>${d.a.toFixed(1)}%</span><span>${esc(d.rvN)} ${d.b.toFixed(1)}%</span></div><em class="${emp?'mid':d.mg>=0?'up':'dn'}">${emp?'Empate técnico':d.mg>=0?'Ganaría por '+d.mg.toFixed(1)+' pts':'Perdería por '+(-d.mg).toFixed(1)+' pts'}</em></button>`;};
  return `<div class="es-h es-h2">Escenarios 2027 ${ei('esc')}</div><div class="es-scs">${list.map(card).join('')}</div>${multi?`<div class="es-sk"><span><i style="background:${C[p]}"></i>ganaría</span><span><i style="background:var(--peach)"></i>perdería por menos de 10 pts</span><span><i style="background:var(--line)"></i>difícil</span></div>`:''}`;}
/* ===== panel en tres niveles: 1 la respuesta, 2 dónde trabajar, 3 detalle ===== */
const eNames=(L,all)=>{if(all&&L.length>1&&L.length===all) return 'cualquiera de sus posibles alianzas';const n=L.map(A=>A.slice(1).map(q=>NM[q]).join(' y ')); return n.length<2?n.join(''):n.slice(0,-1).join(', con ')+' o con '+n[n.length-1];};
function eSegOf(d,e){return d.riv?d.riv.votes+(e||0)/100*d.g.V:0;}
function eGen(ii){const g=eAgg(ii); if(!g.V) return ''; return `<div class="es-gen"><div><b>${fmt(Math.round(g.ln))}</b><span>lista nominal vigente</span></div><div><b>${g.tp.toFixed(0)}%</b><span>participación esperada ${ei('part')}</span></div><div><b>${fmt(Math.round(g.V))}</b><span>votos válidos esperados</span></div></div>`;}
/* veredicto: etiqueta + dato grande + línea de apoyo */
const eV=(v,cls,big,lbl,sub)=>({v,cls,big,lbl,sub});
function eAnswer(){const p=st.party,A=eAlly(),E=eSecs(),F=eFocus(),lv=eLv(),nat=eNat(),NN=ENN[nat],ii=eSelII(),where=st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST;
  const sg=m=>(m>=0?'+':'−')+Math.abs(m).toFixed(1);
  if(!p){if(F.mode==='multi'){const U=eUnits(nat),ws={}; U.forEach(u=>{ws[u.lead]=(ws[u.lead]||0)+1;}); const o=Object.entries(ws).sort((a,b)=>b[1]-a[1]),half=Math.floor(U.length/2)+1;
      return eV(o[0]&&o[0][1]>=half?'Una fuerza tendría mayoría':'Nadie tendría mayoría',o[0]&&o[0][1]>=half?'up':'mid',`${o[0]?o[0][1]:0} de ${U.length}`,`${NN[1]} para ${o[0]?esc(NM[o[0][0]]):'—'}`,`${o.slice(1).map(([q,n])=>`${esc(NM[q])} ${n}`).join(' · ')}${o.length>1?' · ':''}${U.filter(u=>u.m<5).length} se deciden por menos de 5 puntos.`);}
    const w=eWin27(ii); if(!w) return eV('Sin datos','mid','—','',''); const e=eErr(F.mode==='con'?(nat==='est'?'est':nat):'est'),emp=e&&w.m<e;
    return eV(emp?'Va adelante · empate técnico':'Va adelante con ventaja',emp?'mid':'up',`${esc(NM[w.lead])} ${sg(w.m)} pts`,`sobre ${esc(w.bl[1]?w.bl[1].name:'—')}`,`${emp?`La estimación puede fallar ±${e} puntos, así que aún no hay ganador claro. `:''}Elige un partido para ver sus escenarios y su meta.`);}
  const me=esc(eSide(A)),cs=eContests(),list=eScen(p).filter(x=>eKeyA(x)!==eKeyA(A));
  if(F.mode==='multi'){const cnt=X=>cs.filter(c=>{const d=eDuel27(c.ii,X); return d&&d.gap<=0;}).length,w=cnt(A),best=list.map(X=>[X,cnt(X)]).sort((a,b)=>b[1]-a[1])[0],half=Math.floor(cs.length/2)+1;
    const e0=eErr(nat),dz=e0?cs.filter(c=>{const d=eDuel27(c.ii,A); return d&&Math.abs(d.mg)<e0;}).length:0,firm=cs.length-dz,inc=e0&&dz>=Math.ceil(cs.length/3);
    return eV(inc?'Resultado abierto':w>=half?'Ganaría la mayoría':'No alcanzaría la mayoría',inc?'mid':w>=half?'up':'dn',`${w} de ${cs.length}`,`${NN[1]} que ganaría ${me}`,(inc?`<b>${dz}</b> de ${cs.length} se deciden dentro del margen de error (±${e0} pts): ahí la cifra puede cambiar de lado. `:'')+(best&&best[1]>w?`Con ${eNames([best[0]])} llegaría a ${best[1]}.`:'Ninguna de sus posibles alianzas gana más.'));}
  if(F.mode==='sub'){const xs=ii.map(i=>E.by[i]).filter(Boolean),rx=xs.filter(x=>x.add); return eV(`${esc(eObjN())} se decide ${nat==='est'?'en todo el estado':'por '+NN[0]}`,'mid',`${xs.filter(x=>x.mg>0).length} de ${xs.length}`,`secciones que ganaría en ${esc(where)}`,rx.length?`Para ganar tendría que ganar ${rx.length} secciones más aquí.`:'Aquí no necesita ganar secciones adicionales.');}
  const c=E.CT[F.k]; if(!c) return eV('Sin datos','mid','—','',`Sin datos de ${esc(NM[p])} en este territorio.`);
  const d=c.d,rv=esc(d.rvN),e=eErr(nat==='est'?'est':nat),ok=X=>{const x=eDuel27(c.ii,X); return x&&x.mine>=eSegOf(x,e);},win=X=>{const x=eDuel27(c.ii,X); return x&&x.mg>0;},seguro=d.mine>=eSegOf(d,e),emp=e&&Math.abs(d.mg)<e;
  const v=seguro?'Ganaría con margen seguro':d.mg>0?(emp?'Va adelante · empate técnico':'Ganaría, sin margen seguro'):(emp?'Va atrás · empate técnico':'Perdería'),cls=seguro?'up':d.mg>0?'mid':emp?'mid':'dn';
  let t=''; if(!seguro){const L1=list.filter(ok),L2=list.filter(win); if(L1.length) t=`Con ${eNames(L1,list.length)} alcanzaría la meta segura.`; else if(d.mg<=0&&L2.length) t=`Con ${eNames(L2,list.length)} ganaría, aunque sin margen seguro.`; else if(d.mg<=0){const ba=eBestAlly(c.ii); t=ba&&ba.d.mg>0?`Ninguna de sus alianzas recientes gana; la que ganaría es ${esc(eSide(ba.A))}.`:'Ninguna alianza de hasta 3 partidos gana con las tendencias actuales.';} else t='Ninguna de sus posibles alianzas llega a la meta segura.';}
  return Object.assign(eV(v,cls,`${sg(d.mg)} pts`,`${d.mg>=0?'sobre':'detrás de'} ${rv}`,t),{c,d,e});}
/* bloque oscuro: rival, conclusión, dato grande, metas, barra, rango y confiabilidad */
function eDark(an,ii){const p=st.party,F=eFocus(),nat=eNat(),niv=F.mode==='con'?(nat==='est'?'est':nat):(p?nat:'est'),g=eAgg(ii),{L}=eProjW();
  const part=g.V?`<p class="es-part">Supone participación de ${g.tp.toFixed(0)}% sobre la lista nominal vigente (${fmt(Math.round(g.ln))} electores, ${esc(CORTE)}): unos ${fmt(Math.round(g.V))} votos válidos ${ei('part')}</p>`:'';
  let tag,p1,big,sub=an.sub||'',body='';
  if(an.d){const d=an.d,e=an.e,c=an.c,cx=c.ii.map(i=>eSecs().by[i]).filter(Boolean),R=d.riv?d.riv.votes:0,mn=Math.round(R)+1,sg=Math.round(eSegOf(d,e))+1,es=Math.round(d.mine),seguro=es>=sg,emp=e&&Math.abs(d.mg)<e;
    tag='Compite contra '+esc(d.rvN); p1=`Con las tendencias actuales, ${esc(eSide(eAlly()))} ${d.mg>=0?'ganaría':'perdería'} ${esc(st.es.u!=null&&eLv()!=='est'?eName(eLv(),st.es.u):EST)} ${d.mg>=0?'a':'frente a'} ${esc(d.rvN)} por unos ${fmt(Math.abs(d.gap))} votos.`;
    big=seguro?'Retener':emp?'Empate técnico':d.mg>0?'Asegurar':'Faltan '+fmt(mn-es);
    sub=`Ganaría ${fmt(cx.filter(x=>x.mg>0).length)} de ${fmt(cx.length)} secciones. ${an.sub||''}`;
    body=`<div class="es-mt"><div><span>Meta mínima ${ei('meta')}</span><b>${fmt(mn)}</b><small>votos: uno más que ${esc(d.rvN)} · ${es>=mn?'<i class="ok">✓ ya los tendría</i>':'<i class="no">faltan '+fmt(mn-es)+'</i>'}</small></div><div><span>Meta segura</span><b>${fmt(sg)}</b><small>gana aunque la estimación falle ±${e} pts · ${seguro?'<i class="ok">✓ ya los tendría</i>':'<i class="no">faltan '+fmt(sg-es)+'</i>'}</small></div></div>
     <div class="es-pj">${ePjBar(d.a,d.b,eSide(eAlly()),d.rvN)}${eRange(d.mg,niv)}${part}</div><div class="es-ref">Referencia ${esc(eLabel(L))}: ${eHist(c.ii,eAlly())||'—'}.</div>`;}
  else if(!p&&F.mode!=='multi'){const w=eWin27(ii); tag='Proyección 2027'; p1=w?`${esc(w.bl[0].name)} va adelante en ${esc(st.es.u!=null&&eLv()!=='est'?eName(eLv(),st.es.u):EST)} por ${w.m.toFixed(1)} puntos sobre ${esc(w.bl[1]?w.bl[1].name:'—')}.`:'Sin datos.'; big=an.v.includes('empate')?'Empate técnico':'Ventaja clara';
    body=w?`<div class="es-pj">${ePjBar(w.a,w.b,w.bl[0].name,w.bl[1]?w.bl[1].name:'—')}${eRange(w.m,niv)}${part}</div><div class="es-ref">Referencia ${esc(eLabel(L))}: ${eHist(ii,null)||'—'}.</div>`:'';}
  else {tag=p?'Compite contra la fuerza más fuerte de cada '+ENN[nat][0]:'Proyección 2027'; p1=`${an.v}.`; big=an.big; sub=`${an.lbl}. ${an.sub||''}`; const e=eErr(nat); body=e?`<div class="es-rg"><span>Error típico por ${ENN[nat][0]}: ±${e} pts ${ei('rango')}</span><span>Confiabilidad <b class="es-stl ${eConf(e)[1]}">${eConf(e)[0]}</b> ${ei('proy')}</span></div>${part}`:part;}
  return `<div class="es-meta"><span class="es-tag">${tag}</span><p>${p1}</p><div class="es-big${String(big).length>9?' sm':''}"><b>${big}</b></div>${sub?`<p class="es-sub">${sub}</p>`:''}${body}</div>`;}
function ePanoCards(ii){const w=eWin27(ii); if(!w) return ''; const top=w.bl.slice(0,4);
  return `<div class="es-h es-h2">Estimación por fuerza política</div><div class="es-scs">${top.map((b,j)=>`<button class="es-sc" data-epar="${b.lead}"><small>${j===0?'Va adelante':(j+1)+'.º lugar'}</small><b>${esc(b.name)}</b><div class="es-scv"><span style="width:${(100*b.v/w.g.V).toFixed(1)}%;background:${C[b.lead]}"></span></div><div class="es-scl"><span>${(100*b.v/w.g.V).toFixed(1)}% de los votos</span></div><em class="mid">Ver sus escenarios →</em></button>`).join('')}</div>`;}
function eGoal(d,e,me){const R=d.riv?d.riv.votes:0,mn=Math.round(R)+1,sg=Math.round(eSegOf(d,e))+1,es=Math.round(d.mine),top=Math.max(sg,es)*1.04;
  const row=(lbl,v,sub)=>{const ok=es>=v; return `<div class="gr"><div><span>${lbl}</span><small>${sub}</small></div><div class="gv"><b>${fmt(v)}</b><em class="${ok?'ok':'no'}">${ok?'✓ ya los tendría':'faltan '+fmt(v-es)}</em></div></div>`;};
  return `<div class="es-goal"><div class="gh">Votos que necesita ${esc(me)} ${ei('meta')}</div>
   <div class="pb"><i style="width:${(100*es/top).toFixed(1)}%"></i><s style="left:${(100*mn/top).toFixed(1)}%"><u>ganar</u></s><s style="left:${(100*sg/top).toFixed(1)}%"><u style="transform:translateX(-85%)">ganar seguro</u></s></div>
   <div class="gn">Votos que hoy tendría según la estimación: <b>${fmt(es)}</b></div>
   ${row('Para ganar',mn,'un voto más que '+esc(d.rvN))}${row('Para ganar con seguridad',sg,'cubre lo que puede fallar la estimación (±'+e+' pts)')}</div>`;}
function eSummary(ii,an){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(Boolean),N=xs.length,c=k=>xs.filter(x=>x.act===k).length,G=c('seg')+c('cui'),D=xs.filter(x=>x.mg>=0&&x.duro).length,L=c('mov')+c('con'),F=c('dif'),R=xs.filter(x=>x.add).length;
  return `<div class="es-sum"><div class="es-sbar">${EACT.slice().reverse().filter(k=>k!=='dif').concat(['dif']).map(k=>{const n=c(k); return n?`<i style="flex:${n};background:${ECAT[k][2]}" title="${ECAT[k][0]}: ${n}"></i>`:''}).join('')}</div>
   <p>De <b>${fmt(N)}</b> secciones: ganaría <b>${fmt(G)}</b> (<b>${fmt(D)}</b> con voto duro), perdería por menos de 10 puntos en <b>${fmt(L)}</b> y <b>${fmt(F)}</b> son difíciles.${R?` Para ganar (meta mínima) tendría que ganar <b>${fmt(R)}</b> de las secciones que hoy perdería.`:''}${an&&an.d?(()=>{const f=Math.round(eSegOf(an.d,an.e))+1-Math.round(an.d.mine); return f>0?` Para la meta segura le faltan <b>${fmt(f)}</b> votos: las secciones a convencer y movilizar son donde conviene buscarlos.`:' Ya supera la meta segura: lo prioritario es cuidar lo que ganaría.';})():''}</p></div>`;}
function eActs(ii){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(Boolean);
  const t=k=>`<button class="es-ac${st.es.seg===k?' on':''}" data-eseg="${k}" title="${esc(ECAT[k][1])}"><i style="background:${ECAT[k][2]}"></i><b>${fmt(xs.filter(x=>eMatch(x,k)).length)}</b><span>${ECAT[k][0]}</span><small>${({mov:'vota mucha menos gente que en su mejor elección',con:'participación normal: ganar votantes al rival',cui:'ganaría por menos de 10 puntos',seg:'ganaría por 10 puntos o más',dif:'perdería por más de 10 puntos'})[k]}</small></button>`;
  const nm=xs.filter(x=>x.act==='mov').length,nc=xs.filter(x=>x.act==='con').length,note=nm+nc>=10&&nm<.1*(nm+nc)?`<p class="es-hint">Casi todas las secciones cerradas se ganan convenciendo: solo ${nm} tiene${nm===1?'':'n'} mucha gente que dejó de votar ${ei('sit')}</p>`:nc+nm>=10&&nc<.1*(nm+nc)?`<p class="es-hint">Casi todas las secciones cerradas se ganan movilizando ${ei('sit')}</p>`:'';
  return `<div class="es-acs">${EACT.map(t).join('')}</div>${note}<div class="es-also"><span>También:</span>${['rt','duro','sw'].filter(k=>k!=='rt'||xs.some(x=>x.add)).map(k=>`<button data-eseg="${k}" aria-pressed="${st.es.seg===k}">${ECAT[k][0]} <b>${fmt(xs.filter(x=>eMatch(x,k)).length)}</b></button>`).join('')}</div>`;}
function ePri(ii){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(x=>x&&(x.act==='mov'||x.act==='con')).sort((a,b)=>(a.rv-a.mine)-(b.rv-b.mine));
  if(!xs.length) return '<p class="es-hint">No hay secciones prioritarias: en ninguna perdería por menos de 10 puntos.</p>';
  return `<div class="es-pri">${xs.slice(0,3).map(x=>{const f=Math.round(x.rv-x.mine)+1; return `<button data-esec="${x.i}"><b>${S[x.i].s}</b><span>${esc(MUN[S[x.i].m])}<small>${f<=1?'empate':'faltan '+fmt(f)+' votos'} · participación esperada ${x.tp.toFixed(0)}%</small></span><em class="tg ${x.act}">${ECAT[x.act][0]}</em></button>`;}).join('')}</div><button class="es-tb" id="epri">Ver las ${fmt(xs.length)} secciones prioritarias</button>`;}
function eDetail(A0){const p=st.party,F=eFocus(),nat=eNat(),ii=eSelII(),{L}=eProjW(),poll=st.es.poll[st.es.obj];let rg='';
  if(p&&F.mode==='con'){const c=eSecs().CT[F.k]; if(c) rg=eRange(c.d.mg,nat==='est'?'est':nat)+`<div class="es-dr"><span>Referencia ${esc(eLabel(L))}</span><small>${eHist(c.ii,A0)||'—'}</small></div>`;}
  else if(!p){const w=eWin27(ii); if(w) rg=eRange(w.m,F.mode==='con'?(nat==='est'?'est':nat):'est')+`<div class="es-dr"><span>Referencia ${esc(eLabel(L))}</span><small>${eHist(ii,null)||'—'}</small></div>`;}
  else {const e=eErr(nat); rg=`<div class="es-dr"><span>Error típico por ${ENN[nat][0]}</span><small>±${e??'—'} pts · confiabilidad ${eConf(e)[0]} ${ei('proy')}</small></div>`;}
  return `<details class="es-lv3" ${st.es.detOpen?'open':''}><summary>Cómo se calculó</summary>
   <div class="es-dr"><span>Alianzas</span><small>los aliados aportan el ${Math.round(PR.r*100)}% de sus votos ${ei('alianza')}</small></div><div class="es-dr"><span>Rivales</span><small>${eRv()==='ali'?'en posible alianza':'cada partido por separado'} ${ei('rival')}</small></div><div class="es-dr"><span>Cómo se calcula la proyección</span><small>${ei('proy')}</small></div>
   ${ePollHTML()}
   <p class="es-f">Estimación propia (no es una encuesta). INE, resultados por sección de ${esc(eLabel(L))} y de ${EYM}; ${esc(SRC.pad||'lista nominal')}. Sin ${NOREG.map(q=>NM[q]||q).join(', ')} (sin registro en 2027; sus votos se reparten en proporción). Sin historial, no se estiman: ${ENEW.join(', ')}.${poll&&poll.v?' Ajustada con la encuesta capturada.':''}</p></details>`;}
function estPanel(){const p=st.party,lv=eLv(),nat=eNat(),ii=eSelII(),F=eFocus();
  const chips=(L,cur,attr)=>L.map(x=>`<button data-${attr}="${x[0]}" aria-pressed="${cur===x[0]}">${x[1]}</button>`).join('');
  const A0=eAlly(),sumTxt=`${esc(eObjN())} · ${p?esc(eSide(A0))+(A0.length>1?' (posible alianza)':''):'Panorama sin partido'} · rivales ${eRv()==='ali'?'en posible alianza':'por separado'}`;
  let h=`<div class="colh"><button class="es-back" id="eback">← Volver al mapa</button><b style="margin-left:8px">Estrategia 2027</b></div><div class="cd es">`;
  h+=`<details class="es-cfg" ${st.es.cfgOpen===true?'open':''}><summary><span>Cambiar elección, rivales o territorio</span><b>${sumTxt} · ${esc(st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST)}</b></summary>`;
  h+=`<div class="es-row"><span>¿Qué se elige en 2027 en ${esc(EST)}?</span><div class="es-ch">${chips(EOBJ.map(x=>[x[0],x[1]]),st.es.obj,'eobj')}</div></div>`;
  h+=`<div class="es-row"><span>Supuesto sobre los rivales ${ei('rival')}</span><div class="es-ch"><button data-erv="sep" aria-pressed="${eRv()!=='ali'}" ${ESPL.length?'disabled':''}>Cada partido por separado</button><button data-erv="ali" aria-pressed="${eRv()==='ali'}">En posible alianza (como en ${EBL.year})</button></div></div>${ESPL.length?`<p class="es-hint">${ESPL.map(b=>b.map(m=>NM[m]).join('-')).join(' y ')} ${ESPL.length>1?'compitieron':'compitió'} en candidatura común desde 2021: el INE reparte ese voto entre los partidos, así que no existe el voto propio de cada uno y se analiza${ESPL.length>1?'n':''} como coalición.</p>`:''}`;
  if(p) h+=`<div class="es-row"><span>Armar otra alianza para ${esc(NM[p])}</span><div class="es-ch">${EPARTIES.filter(q=>q!==p).map(q=>`<button data-eal="${q}" aria-pressed="${A0.includes(q)}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`;
  const lvs=Object.keys(ELV).filter(k=>k==='est'?nat==='est':true),G=lv==='est'?[]:eGroups(lv).sort((a,b)=>lv==='mun'?String(MUN[a.k]).localeCompare(MUN[b.k]):a.k-b.k);
  h+=`<div class="es-row es-terr"><span>Territorio</span><div class="es-ch">${chips(lvs.map(k=>[k,k==='est'?EST:ELV[k]]),lv,'elv')}</div>${lv!=='est'?`<select class="es-sel" data-eunit="1"><option value="">${lv===nat?'Todos los '+ENN[lv][1]:'Todo '+EST+' (por '+ENN[lv][0]+')'}</option>${G.map(u=>`<option value="${u.k}" ${String(st.es.u)===String(u.k)?'selected':''}>${esc(eName(lv,u.k))}</option>`).join('')}</select>`:''}</div></details>`;
  h+=`<div class="es-row es-pick"><span>¿Qué partido analizamos?</span><div class="es-ch"><button data-epar="" aria-pressed="${!p}">Todos (panorama)</button>${EPARTIES.map(q=>`<button data-epar="${q}" aria-pressed="${p===q}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`;
  /* nivel 1 */
  const an=eAnswer(),aRel=st.es.obj==='AYU'&&p;
  h+=`${aRel?'<span class="es-badge">Mapa de fuerza · no es un pronóstico</span>':''}${p?eCompare():ePanoCards(ii)}${eDark(an,ii)}`;
  /* nivel 2 */
  h+=`<section class="es-lv2"><div class="es-h">${p?'Dónde trabajar':'Dónde se decide'} ${ei('sit')}${p?ei('ruta'):''}</div>`;
  if(p) h+=eSummary(ii,an)+eActs(ii)+ePri(ii); else h+=eTiles(ii)+`<button class="es-tb" id="etab">Ver tabla de secciones</button>`;
  if(lv!=='est'&&st.es.u==null){const U=eUnitSort(eUnits(lv)); h+=`<div class="es-h">Por ${ENN[lv][0]}</div><div class="es-ul">${U.map(z=>eUnitBtn(z)).join('')}</div>`;}
  if(p) h+=`<button class="es-x es-all" id="etab">Ver todas las secciones y metas</button>`;
  h+=`</section>`;
  /* nivel 3 */
  h+=eDetail(A0)+`</div>`;
  return h;}
function ePollHTML(){const o=st.es.obj,P=st.es.poll[o]||{},v=P.v||{},on=!!P.v;
  return `<details class="es-poll" ${st.es.pollOpen||on?'open':''}><summary>${on?'Ajustada con encuesta':'Ajustar con una encuesta'} ${ei('enc')}</summary><p class="es-hint">Porcentaje estatal de cada partido según la encuesta (voto efectivo). Deja en blanco los que no reporte.</p><div class="es-pf">${EPARTIES.map(q=>`<label><i style="background:${C[q]}"></i>${NM[q]}<input type="number" min="0" max="100" step="0.1" id="ep_${q}" data-epq="${q}" value="${v[q]??''}"></label>`).join('')}<label>Margen de error ±<input type="number" min="0.5" max="10" step="0.1" id="ep_moe" value="${P.moe??3}"></label></div><div class="es-pb"><button class="es-x" id="epapply">Aplicar encuesta</button>${on?'<button class="es-x" id="epclear">Quitar</button>':''}</div></details>`;}
function eUnitBtn(z){const A=eAlly(); let r,s;
  if(!A){r=`<em>${z.m.toFixed(1)} pts</em>`; s=`${esc(z.wn)} sobre ${esc(z.sn)}${z.h?' · antes: '+z.h:''}`; return `<button data-eu="${z.k}"><span><i class="es-d" style="background:${C[z.lead]}"></i>${esc(z.name)}</span>${r}<small>${s}</small></button>`;}
  if(z.con){const e=eErr(eNat()); r=`<em class="${ESTL[z.st][1]}">${z.gap>0?'faltan '+fmt(z.gap):'gana +'+fmt(-z.gap)}</em>`; s=`contra ${esc(z.rvN)} · meta ${fmt(z.meta)} votos${z.gap>0?' · ganar '+fmt(z.n)+' secciones · '+ESTL[z.st][0].toLowerCase():''}${e&&Math.abs(z.mg)<e?' · empate técnico':''}`;}
  else {r=`<em>${fmt(z.n)} a ganar</em>`; s=`${z.sec} secciones · ${z.seg+z.cui} ganaría · ${z.mov} movilizar · ${z.cnv} convencer`;}
  return `<button data-eu="${z.k}"><span>${esc(z.name)}</span>${r}<small>${s}</small></button>`;}
/* tabla: secciones o unidades, con recuadros que filtran, orden, búsqueda y CSV */
function eCols(tab){const A=eAlly(),me=A?esc(eSide(A)):'',dot=x=>{const k=A?x.act:x.cat; return `<i class="es-d" style="background:${ECAT[k][2]}"></i>${ECAT[k][0]}`;},si=x=>x?'Sí':'',R=Math.round;
  if(tab==='sec'){const b=[['s','Sección',r=>S[r.i].s,r=>S[r.i].s,1],['mun','Municipio',r=>esc(MUN[S[r.i].m]),r=>MUN[S[r.i].m]],['dl','DL',r=>S[r.i].dl,r=>S[r.i].dl,1],['df','DF',r=>S[r.i].df,r=>S[r.i].df,1],['cat',A?'Qué hacer':'Situación 2027',dot,r=>A?EACT.indexOf(r.act):r.cat]];
    if(A) return [['ord','Prioridad',r=>r.ord||'—',r=>r.ord||1e9,1]].concat(b,[['duro','Voto duro',r=>si(r.duro),r=>r.duro?0:1],['sw','Switcher',r=>si(r.sw),r=>r.sw?0:1],['ln','Lista nominal',r=>fmt(r.ln),r=>r.ln,1],['mine','Votos proyectados '+me,r=>fmt(R(r.mine)),r=>r.mine,1],['rvN','Rival',r=>esc(r.rvN),r=>r.rvN],['rv','Votos proyectados del rival',r=>fmt(R(r.rv)),r=>r.rv,1],['dif','Diferencia',r=>{const d=R(r.mine-r.rv); return `<span class="${d>=0?'up':'dn'}">${d>=0?'+':''}${fmt(d)}</span>`;},r=>r.mine-r.rv,1],['tp','Participación esperada',r=>r.tp.toFixed(0)+'%',r=>r.tp,1],['meta','Meta 2027 (votos)',r=>`<b>${fmt(r.mg>0?R(r.mine):R(r.rv)+1)}</b>`,r=>r.mg>0?r.mine:r.rv+1,1]]);
    return b.concat([['wn','Adelante',r=>esc(r.wn),r=>r.wn],['sn','Segundo',r=>esc(r.sn),r=>r.sn],['mg','Ventaja (pts)',r=>r.mg.toFixed(1),r=>r.mg,1],['mv','Ventaja (votos)',r=>fmt(r.mv),r=>r.mv,1],['duro','Voto duro del primero',r=>si(r.duro),r=>r.duro?0:1],['sw','Switcher',r=>si(r.sw),r=>r.sw?0:1],['ln','Lista nominal',r=>fmt(r.ln),r=>r.ln,1]]);}
  const nm=[['name',ELV[tab],r=>esc(r.name),r=>tab==='mun'?r.name:r.k]];
  if(!A) return nm.concat([['wn','Adelante en 2027',r=>`<i class="es-d" style="background:${C[r.lead]}"></i>${esc(r.wn)}`,r=>r.wn],['sn','Segundo',r=>esc(r.sn),r=>r.sn],['m','Ventaja (pts)',r=>r.m.toFixed(1),r=>r.m,1],['mv','Ventaja (votos)',r=>fmt(r.mv),r=>r.mv,1],['com','Secciones competidas',r=>fmt(r.com),r=>r.com,1],['h','Resultado '+eYear(),r=>r.h||'—',r=>r.h||'']]);
  if(tab===eNat()) return nm.concat([['me','Votos proyectados '+me,r=>fmt(R(r.me)),r=>r.me,1],['rvN','Compite contra',r=>esc(r.rvN),r=>r.rvN],['rv','Votos proyectados del rival',r=>fmt(R(r.rv)),r=>r.rv,1],['meta','Meta 2027 (votos)',r=>`<b>${fmt(r.meta)}</b>`,r=>r.meta,1],['gap','Faltan / ventaja',r=>`<span class="${r.gap>0?'dn':'up'}">${r.gap>0?fmt(r.gap):'gana +'+fmt(-r.gap)}</span>`,r=>r.gap,1],['n','Secciones a ganar',r=>r.gap>0?fmt(r.n):'—',r=>r.n,1],['st','Situación',r=>`<b class="es-stl ${ESTL[r.st][1]}">${ESTL[r.st][0]}</b>`,r=>r.st],['rg','Rango de la diferencia (pts)',r=>{const e=eErr(eNat()); return e?`${pjTxt(r.mg-e)} a ${pjTxt(r.mg+e)}${Math.abs(r.mg)<e?' · empate técnico':''}`:'—';},r=>r.mg],['h','Resultado '+eYear(),r=>r.h||'—',r=>r.h||'']]);
  return nm.concat([['sec','Secciones',r=>fmt(r.sec),r=>r.sec,1],['seg','Asegurado',r=>fmt(r.seg),r=>r.seg,1],['cui','Cuidar',r=>fmt(r.cui),r=>r.cui,1],['mov','Movilizar',r=>fmt(r.mov),r=>r.mov,1],['cnv','Convencer',r=>fmt(r.cnv),r=>r.cnv,1],['dif','No invertir',r=>fmt(r.dif),r=>r.dif,1],['n','Secciones a ganar para la meta',r=>`<b>${fmt(r.n)}</b>`,r=>r.n,1],['add','Votos a sumar',r=>fmt(r.add),r=>r.add,1],['meta','Meta 2027 (votos)',r=>fmt(r.meta),r=>r.meta,1]]);}
function eTable(){let m=$('estm'); if(!m){m=document.createElement('div'); m.id='estm'; m.className='estm'; document.body.appendChild(m);}
  const A=eAlly(),E=eSecs(),lv=eLv(),ii=eSelII(),tabs=[['sec','Secciones']].concat(['mun','dl','df'].map(k=>[k,ENN[k][1][0].toUpperCase()+ENN[k][1].slice(1)])),tab=tabs.find(t=>t[0]===st.es.tab)?st.es.tab:'sec',cols=eCols(tab),q=norm(st.es.q||'');
  let rows=tab==='sec'?ii.map(i=>E.by[i]).filter(x=>x&&eMatch(x,st.es.seg)):eUnits(tab);
  if(q) rows=rows.filter(r=>tab==='sec'?String(S[r.i].s).startsWith(q)||norm(MUN[S[r.i].m]).includes(q):norm(r.name).includes(q));
  const sk=cols.find(c=>c[0]===st.es.sk)?st.es.sk:(tab==='sec'?(A?'ord':'mg'):null),sc=cols.find(c=>c[0]===sk); if(sc) rows.sort((a,b)=>{const u=sc[3](a),v=sc[3](b); return (u>v?1:u<v?-1:0)*st.es.sd;}); else eUnitSort(rows);
  const lim=st.es.lim||300,where=st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST;
  m.innerHTML=`<div class="estm-b" role="dialog" aria-modal="true" aria-label="Tabla de estrategia"><div class="estm-h"><div><h3>${A?esc(eSide(A))+': secciones y metas 2027':'Panorama 2027'}</h3><p>${esc(eObjN())} · ${esc(where)} · proyección con lista nominal ${esc(CORTE)}</p></div><button class="x" id="estx" aria-label="Cerrar">✕</button></div>
   ${eTiles(ii,'row')}
   <div class="estm-t"><div class="es-ch">${tabs.map(t=>`<button data-etab="${t[0]}" aria-pressed="${t[0]===tab}">${t[1]}</button>`).join('')}</div><input id="estq" placeholder="${tab==='sec'?'Buscar sección o municipio':'Buscar'}" value="${esc(st.es.q||'')}"><button class="es-x" id="estcsv">Descargar CSV</button></div>
   ${tab==='sec'&&st.es.seg?`<div class="es-fl">Mostrando: <b>${ECAT[st.es.seg][0]}</b> (${fmt(rows.length)}) <button class="es-x" data-eseg="${st.es.seg}">Quitar filtro</button></div>`:''}
   <div class="estm-w"><table><thead><tr>${cols.map(c=>`<th data-esk="${c[0]}" class="${c[4]?'r':''}">${c[1]}${c[0]===sk?(st.es.sd>0?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,lim).map(r=>`<tr class="${tab==='sec'&&r.add?'inr':''}" ${tab==='sec'?`data-esec="${r.i}"`:`data-eunit2="${r.k}"`}>${cols.map(c=>`<td class="${c[4]?'r':''}">${c[2](r)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}">Sin secciones con este filtro.</td></tr>`}</tbody></table>${rows.length>lim?`<button class="es-x" id="estmore" style="margin:10px auto;display:block">Ver ${Math.min(300,rows.length-lim)} más de ${fmt(rows.length)}</button>`:''}</div>
   <p class="es-f">${A?'Meta 2027: votos estimados para ganar la sección o el territorio (o retener lo que ganaría). Filas resaltadas: secciones a ganar para cubrir los votos que faltan. ':''}Clic en una fila para verla en el mapa. Estimación propia con datos del INE; no es una encuesta.</p></div>`;
  m.classList.add('on');
  const close=()=>m.classList.remove('on'); $('estx').onclick=close; m.onclick=e=>{if(e.target===m) close();};
  m.querySelectorAll('[data-etab]').forEach(b=>b.onclick=()=>{st.es.tab=b.dataset.etab; st.es.sk=null; st.es.sd=1; st.es.q=''; st.es.lim=300; eTable();});
  m.querySelectorAll('[data-eseg]').forEach(b=>b.onclick=()=>{const k=b.dataset.eseg; st.es.seg=st.es.seg===k?null:k; st.es.tab='sec'; render();});
  m.querySelectorAll('[data-esk]').forEach(t=>t.onclick=()=>{const k=t.dataset.esk; st.es.sd=st.es.sk===k?-st.es.sd:1; st.es.sk=k; eTable();});
  const qi=$('estq'); qi.oninput=()=>{st.es.q=qi.value; st.es.lim=300; eTable(); const n=$('estq'); n.focus(); n.setSelectionRange(n.value.length,n.value.length);};
  if($('estmore')) $('estmore').onclick=()=>{st.es.lim=lim+300; eTable();};
  m.querySelectorAll('tr[data-esec]').forEach(r=>r.onclick=()=>{const i=+r.dataset.esec; close(); st.sel=i; paint(); fit([i]);});
  m.querySelectorAll('tr[data-eunit2]').forEach(r=>r.onclick=()=>{close(); st.es.lv=tab; st.es.u=+r.dataset.eunit2; st.es.tab='sec'; applyScope(tab,st.es.u);});
  $('estcsv').onclick=()=>{const qq=x=>'"'+String(x).replace(/"/g,'""')+'"',strip=h=>String(h).replace(/<[^>]+>/g,'');
    const lines=[cols.map(c=>qq(strip(c[1]))).join(',')].concat(rows.map(r=>cols.map(c=>qq(strip(c[2](r)))).join(',')));
    saveFile(('Estrategia2027_'+norm(EST)+'_'+st.es.obj+'_'+(A?A.join('-'):'panorama')+'_'+tab+(st.es.seg?'_'+st.es.seg:'')+(st.es.u!=null?'_'+lv+st.es.u:'')).replace(/[^\w]+/g,'_')+'.csv','﻿'+lines.join('\n'),$('estcsv'));};}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('estm')&&$('estm').classList.contains('on')){$('estm').classList.remove('on'); e.stopImmediatePropagation();}},true);
/* al entrar: tomar el partido y el territorio seleccionados; el cargo es uno de los que se eligen en 2027 */
function estEnter(){const t=st.elec?st.elec.split('_')[0]:null; if(t&&EOBJ.find(o=>o[0]===t)) st.es.obj=t; if(st.party&&!EPARTIES.includes(st.party)){st.party=''; $('party').value='';}
  st.es.lv=null; st.es.u=null; st.es.seg=null; const f=st.f;
  if(st.terr){st.es.lv='mun'; st.es.u=+st.terr;} else if(f.dl.length===1){st.es.lv='dl'; st.es.u=f.dl[0];} else if(f.df.length===1){st.es.lv='df'; st.es.u=f.df[0];} else if(f.mun.length===1){st.es.lv='mun'; st.es.u=f.mun[0];}
  st.elec=eRef(); $('elec').value=st.elec;}
/* cambio suave al cambiar de escenario, rival o nivel: conserva el desplazamiento y anima cifras y barras en lugar de redibujar */
function morphPanel(C2,html){const again=C2.dataset.v==='est',sc=C2.scrollTop,RM2=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const numSel='.num,.es-big,b',isN=t=>/^[\s]*[\d,]+(\.\d+)?\s*%?[\s]*$/.test(t),oN=again?[...C2.querySelectorAll(numSel)].map(e=>e.children.length?null:e.textContent):[],oW=again?[...C2.querySelectorAll('[style*="width"]')].map(e=>e.style.width):[];
  C2.innerHTML=html; C2.dataset.v='est';
  if(!again) return;
  C2.classList.remove('anim'); C2.scrollTop=sc;
  if(RM2) return;
  [...C2.querySelectorAll('[style*="width"]')].forEach((e,j)=>{const w0=oW[j],w1=e.style.width; if(w0&&w1&&w0!==w1&&/%|px/.test(w0)){e.style.transition='none'; e.style.width=w0; void e.offsetWidth; e.style.transition='width .6s cubic-bezier(.2,.8,.2,1)'; e.style.width=w1;}});
  [...C2.querySelectorAll(numSel)].forEach((e,j)=>{if(e.children.length) return; const t1=e.textContent,t0=oN[j]; if(!t0||t0===t1||!isN(t0)||!isN(t1)) return; const a=parseFloat(t0.replace(/,/g,'')),b2=parseFloat(t1.replace(/,/g,'')),dec=((t1.match(/\.(\d+)/)||[,''])[1]).length,pc2=/%/.test(t1),cm=/,/.test(t1)||b2>=1000,st0=performance.now();
    const f=v=>(cm?v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}):v.toFixed(dec))+(pc2?'%':''),step=n=>{const u=Math.min(1,(n-st0)/550),k=1-Math.pow(1-u,3); e.textContent=f(a+(b2-a)*k); if(u<1) requestAnimationFrame(step); else e.textContent=t1;}; requestAnimationFrame(step);});}
function estRender(){const C2=$('col'); morphPanel(C2,estPanel());
  const go=()=>{const lv=eLv(); if(st.es.u!=null&&lv!=='est') applyScope(lv,st.es.u); else applyScope('all',0);};
  $('eback').onclick=()=>setView2('map');
  C2.querySelectorAll('[data-eobj]').forEach(b=>b.onclick=()=>{st.es.obj=b.dataset.eobj; st.es.lv=null; st.es.u=null; st.es.seg=null; st.elec=eRef(); $('elec').value=st.elec; go();});
  C2.querySelectorAll('[data-elv]').forEach(b=>b.onclick=()=>{st.es.lv=b.dataset.elv; st.es.u=null; go();});
  const us=C2.querySelector('[data-eunit]'); if(us) us.onchange=()=>{st.es.u=us.value===''?null:+us.value; go();};
  const cf=C2.querySelector('.es-cfg'); if(cf) cf.querySelector('summary').onclick=()=>{st.es.cfgOpen=!cf.open;};
  C2.querySelectorAll('[data-esa]').forEach(b=>b.onclick=()=>{st.es.al=b.dataset.esa.split('+'); st.es.seg=null; render();});
  C2.querySelectorAll('[data-erv]').forEach(b=>b.onclick=()=>{st.es.rv=b.dataset.erv; st.es.seg=null; render();});
  C2.querySelectorAll('[data-epar]').forEach(b=>b.onclick=()=>{st.party=b.dataset.epar; $('party').value=st.party; st.es.al=null; st.es.seg=null; st.es.sk=null; $('rPa').setAttribute('aria-pressed',!!st.party); render(true);});
  C2.querySelectorAll('[data-eal]').forEach(b=>b.onclick=()=>{const q=b.dataset.eal,a=eAlly().slice(),j=a.indexOf(q); j>=0?a.splice(j,1):a.push(q); st.es.al=a; render();});
  C2.querySelectorAll('[data-eu]').forEach(b=>b.onclick=()=>{st.es.u=+b.dataset.eu; go();});
  C2.querySelectorAll('[data-eseg]').forEach(b=>b.onclick=()=>{const k=b.dataset.eseg; st.es.seg=st.es.seg===k?null:k; render();});
  C2.querySelectorAll('.ei').forEach(b=>b.onclick=e=>{e.preventDefault(); e.stopPropagation(); eiPop(b);});
  const dd=C2.querySelector('.es-lv3'); if(dd) dd.querySelector('summary').onclick=()=>{st.es.detOpen=!dd.open;};
  if($('epri')) $('epri').onclick=()=>{st.es.seg='pri'; st.es.q=''; st.es.lim=300; st.es.tab='sec'; st.es.sk=null; eTable(); render();};
  C2.querySelectorAll('.es-pri [data-esec]').forEach(b=>b.onclick=()=>{const i=+b.dataset.esec; st.sel=i; paint(); fit([i]);});
  const pd=C2.querySelector('.es-poll'); if(pd) pd.querySelector('summary').onclick=()=>{st.es.pollOpen=!pd.open;};
  if($('epapply')) $('epapply').onclick=()=>{const v={}; C2.querySelectorAll('[data-epq]').forEach(x=>{if(x.value!=='') v[x.dataset.epq]=+x.value;}); if(!Object.keys(v).length) return; st.es.poll[st.es.obj]={v,moe:+$('ep_moe').value||3}; st.es.pollOpen=true; render();};
  if($('epclear')) $('epclear').onclick=()=>{delete st.es.poll[st.es.obj]; render();};
  $('etab').onclick=()=>{st.es.q=''; st.es.lim=300; st.es.tab='sec'; st.es.sk=null; eTable();};
  if($('estm')&&$('estm').classList.contains('on')) eTable();}
