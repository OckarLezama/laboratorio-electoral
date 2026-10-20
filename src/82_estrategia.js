/* ===== Estrategia 2027 =====
   Solo para los cargos que se eligen en 2027 en el estado. Todo se calcula sobre una proyección 2027 por sección:
   lista nominal vigente × participación esperada × votación por partido (promedio ponderado de elecciones recientes).
   Las alianzas parten de las más recientes y sin los partidos que perdieron su registro. El resultado anterior
   del mismo cargo se muestra solo como referencia. */
const NOREG=['PRD','PES','RSP','FXM'];
const ECAT={gan:['Ganaría con ventaja','ventaja de 5 puntos o más','#1C7F79'],dis:['En disputa','diferencia menor a 5 puntos','#F46883'],
  pue:['Se pueden ganar','perdería por entre 5 y 10 puntos','#F5A47C'],per:['Difíciles','perdería por más de 10 puntos','#9AA6A6'],
  com:['Competidas','diferencia menor a 5 puntos','#F46883'],med:['Ventaja media','el primero saca entre 5 y 15 puntos','#F5A47C'],amp:['Ventaja amplia','el primero saca más de 15 puntos','#1C7F79'],
  rt:['A ganar para la meta','perdidas más cerradas que cubren los votos que faltan','#B8860B'],duro:['Voto duro','tercio de secciones con más voto duro','#2E3B3B'],sw:['Switcher','cambiaron de ganador en las últimas 4 elecciones','#4CC1BA']};
const ESTL={gana:['Ganaría','up'],dis:['En disputa','mid'],alc:['Se puede ganar','mid'],amplia:['Brecha amplia','dn']};
const EOBJ=[['GOB','Gubernatura','est',CFG.gob2027],['DIPL','Congreso local','dl',CFG.cong2027],['AYU','Ayuntamientos','mun',CFG.ayu2027],['DIPF','Diputaciones federales','df',true]].filter(o=>o[3]&&lastOf(o[0]));
const ELV={est:'Estado',mun:'Municipio',dl:'Distrito local',df:'Distrito federal'};
const ENN={est:['estado','estados'],mun:['municipio','municipios'],dl:['distrito local','distritos locales'],df:['distrito federal','distritos federales']};
if(!st.es) st.es={obj:EOBJ[0][0],lv:null,u:null,seg:null,sc:'s2',ally:null,col:'seg',tab:'sec',q:'',sk:null,sd:1};
const ECACHE={},EPJ={};
let ERT=new Set();
const eRef=()=>lastOf(st.es.obj);
const eNat=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[2];
const eLv=()=>st.es.lv||eNat();
const eKey=(lv,i)=>lv==='mun'?S[i].m:lv==='dl'?S[i].dl:lv==='df'?S[i].df:0;
const eName=(lv,k)=>lv==='mun'?MUN[k]:lv==='dl'?'Distrito local '+k+(CABDL[k]?' · '+CABDL[k]:''):lv==='df'?'Distrito federal '+k+(CABDF[k]?' · '+CABDF[k]:''):EST;
const eSide=A=>A.map(q=>NM[q]).join('-');
const bnm=ms=>ms.length>3?ms.slice(0,3).map(m=>NM[m]).join('-')+' y '+(ms.length-3)+' más':ms.map(m=>NM[m]).join('-');
const eGroups=lv=>{const g={}; ALL.forEach(i=>{const k=eKey(lv,i); (g[k]=g[k]||[]).push(i);}); return Object.entries(g).map(([k,ii])=>({k:+k,ii}));};
const eContests=()=>eNat()==='est'?[{k:0,ii:ALL}]:eGroups(eNat());
const eYear=()=>D.E[eRef()].year;
const sv=(pv,ms)=>ms.reduce((t,m)=>t+(pv[m]||0),0);
/* alianzas de partida para 2027: las de la elección más reciente (local si la hay), sin partidos sin registro */
const EBL=(()=>{const ym=Math.max(...Object.values(D.E).map(e=>+e.year)),ks=Object.keys(D.E).filter(k=>+D.E[k].year===ym),k=ks.find(k=>/^(DIPL|AYU|GOB)/.test(k))||ks[0];
  return {ek:k,year:ym,bl:D.E[k].blocs.map(b=>b.members.filter(m=>m!=='OTROS'&&!NOREG.includes(m))).filter(m=>m.length)};})();
const EPARTIES=[...new Set(EBL.bl.flat())].sort((a,b)=>(MAIN.indexOf(a)<0?99:MAIN.indexOf(a))-(MAIN.indexOf(b)<0?99:MAIN.indexOf(b)));
function eBlocOf(p){return EBL.bl.find(b=>b.includes(p))||[p];}
function eAllyFor(sc){const p=st.party; if(!p) return null; if(sc==='s1') return [p]; if(sc==='s3') return [p].concat((st.es.ally||eBlocOf(p)).filter(q=>q!==p)); return eBlocOf(p);}
const eAlly=()=>eAllyFor(st.es.sc);
/* proyección 2027 por sección: 50% elecciones del año más reciente, 30% última del mismo cargo, 20% la anterior */
function eProjW(){const t=st.es.obj,same=YEARS.filter(y=>D.E[t+'_'+y]).map(y=>t+'_'+y).slice(-2),ym=Math.max(...Object.values(D.E).map(e=>+e.year)),rec=Object.keys(D.E).filter(k=>+D.E[k].year===ym),W={};
  rec.forEach(k=>W[k]=(W[k]||0)+.5/rec.length); if(same[1]){W[same[1]]=(W[same[1]]||0)+.3; W[same[0]]=(W[same[0]]||0)+.2;} else if(same[0]) W[same[0]]=(W[same[0]]||0)+.5; return {W,ym,same};}
function eP(){const o=st.es.obj; if(EPJ[o]) return EPJ[o]; const ws=Object.entries(eProjW().W),ek=eRef(),out=new Array(N).fill(null);
  ALL.forEach(i=>{let sw=0; const P={}; ws.forEach(([e,w])=>{const r=row(e,i); if(!r||!r.val) return; sw+=w; for(const q in r.v) P[q]=(P[q]||0)+w*r.v[q]/r.val;}); if(!sw) return;
    const rr=row(ek,i),vr=rr&&rr.t?rr.val/rr.t:.96,ln=S[i].ln||(rr?rr.ln:0),tp=EXPT[i]||50,V=ln*tp/100*vr,pv={}; for(const q in P) if(!NOREG.includes(q)) pv[q]=V*P[q]/sw; out[i]={V,pv,ln,tp};});
  return EPJ[o]=out;}
function eAgg(ii){const P=eP(),o={V:0,ln:0,em:0,pv:{}}; ii.forEach(i=>{const x=P[i]; if(!x) return; o.V+=x.V; o.ln+=x.ln; o.em+=x.ln*x.tp/100; for(const q in x.pv) o.pv[q]=(o.pv[q]||0)+x.pv[q];}); o.tp=o.ln?100*o.em/o.ln:0; return o;}
function eDuel27(ii,A){const g=eAgg(ii); if(!g.V) return null; const mine=sv(g.pv,A); if(!mine) return null; let riv=null;
  EBL.bl.forEach(ms=>{const rem=ms.filter(m=>!A.includes(m)); if(!rem.length) return; const v=sv(g.pv,rem); if(!riv||v>riv.votes) riv={votes:v,members:rem,name:bnm(rem)};});
  return {g,mine,riv,rvN:riv?riv.name:'—',gap:riv?Math.round(riv.votes-mine):-Math.round(mine),mg:100*(mine-(riv?riv.votes:0))/g.V,a:100*mine/g.V,b:riv?100*riv.votes/g.V:0};}
function eWin27(ii){const g=eAgg(ii); if(!g.V) return null; const bl=EBL.bl.map(ms=>({ms,v:sv(g.pv,ms),name:bnm(ms),lead:ms.slice().sort((a,b)=>(g.pv[b]||0)-(g.pv[a]||0))[0]})).sort((a,b)=>b.v-a.v);
  return {bl,lead:bl[0].lead,m:100*(bl[0].v-(bl[1]?bl[1].v:0))/g.V,mv:Math.round(bl[0].v-(bl[1]?bl[1].v:0)),a:100*bl[0].v/g.V,b:bl[1]?100*bl[1].v/g.V:0,g};}
/* resultado anterior del mismo cargo (solo referencia) */
function eHist(ii,A){const ek=eRef(),T=totals(ek,ii); if(!T.val) return null; if(!A){const w=winner(ek,ii); return w?`${esc(w.bl[0].name)} ganó por ${w.m.toFixed(1)} puntos`:null;}
  const mine=A.reduce((t,q)=>t+(T.tot[q]||0),0); let rv=0; D.E[ek].blocs.forEach(b=>{const rem=b.members.filter(m=>m!=='OTROS'&&!A.includes(m)); const v=rem.reduce((t,m)=>t+(T.tot[m]||0),0); if(v>rv) rv=v;});
  const m=100*(mine-rv)/T.val; return mine?`${esc(eSide(A))} ${m>=0?'ganó':'perdió'} por ${Math.abs(m).toFixed(1)} puntos`:`${esc(eSide(A))} no compitió`;}
const q67=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y); return a.length?a[Math.floor(2*a.length/3)]:Infinity;};
/* secciones: situación proyectada, voto duro, switcher y ruta (secciones a ganar en cada contienda) */
function eSecs(){const A=eAlly(),key=st.es.obj+'|'+(A?A.join('+'):'gen'); if(ECACHE[key]){ERT=ECACHE[key].rt; return ECACHE[key];}
  const P=eP(),sumDuro=(ms,i)=>{let s=0,ok=false; ms.forEach(m=>{if(V2.duro[m]&&V2.duro[m][i]!=null){s+=V2.duro[m][i]; ok=true;}}); return ok?s:null;};
  const CR={},CT={},rt=new Set(); if(A) eContests().forEach(c=>{const d=eDuel27(c.ii,A); if(d){c.ii.forEach(i=>CR[i]=d); CT[c.k]={k:c.k,ii:c.ii,d};}});
  const L=[]; ALL.forEach(i=>{const x=P[i]; if(!x||!x.V) return; const b={i,ln:x.ln,V:x.V,sw:!!SW[i]};
    if(A){const cd=CR[i]; if(!cd) return; const mine=sv(x.pv,A),rv=cd.riv?sv(x.pv,cd.riv.members):0; Object.assign(b,{mine,rv,rvN:cd.rvN,mg:100*(mine-rv)/x.V,dp:sumDuro(A,i)}); b.cat=b.mg>=5?'gan':b.mg>-5?'dis':b.mg>-10?'pue':'per';}
    else {const w=eWin27([i]); if(!w) return; const B=w.bl[0]; Object.assign(b,{mg:w.m,mv:w.mv,lead:w.lead,wn:B.name,sn:w.bl[1]?w.bl[1].name:'—',dp:sumDuro(B.ms,i)}); b.cat=b.mg<5?'com':b.mg<15?'med':'amp';}
    L.push(b);});
  const tP=q67(L.map(x=>x.dp)); L.forEach(x=>x.duro=x.dp!=null&&x.dp>=tP); const by={}; L.forEach(x=>by[x.i]=x);
  Object.values(CT).forEach(c=>{const d=c.d; let acc=0,n=0;
    if(d.gap>0) c.ii.map(i=>by[i]).filter(x=>x&&x.rv>x.mine).sort((a,b)=>b.mg-a.mg).forEach(x=>{if(acc>=d.gap) return; x.add=Math.round(x.rv-x.mine)+1; acc+=x.add; x.ord=++n; rt.add(x.i);});
    Object.assign(c,{n,acc,st:d.gap<=0?'gana':d.mg>-5?'dis':d.mg>-10?'alc':'amplia'});});
  ERT=rt; return ECACHE[key]={L,by,A,CT,rt};}
const eMatch=(x,f)=>!f||(f==='duro'?x.duro:f==='sw'?x.sw:f==='rt'?!!x.add:x.cat===f);
const eKeys=()=>st.party?['gan','dis','pue','per','rt','duro','sw']:['com','med','amp','duro','sw'];
const pjTxt=m=>m==null?'—':(m>=0?'+':'−')+Math.abs(m).toFixed(1)+' pts';
function eSelII(){const lv=eLv(); return st.es.u==null||lv==='est'?ALL:ALL.filter(i=>String(eKey(lv,i))===String(st.es.u));}
function eFocus(){const lv=eLv(),nat=eNat(),u=st.es.u; if(u!=null&&lv!=='est'&&lv!==nat) return {mode:'sub'}; if(nat==='est') return {mode:'con',k:0}; if(u!=null) return {mode:'con',k:+u}; return {mode:'multi'};}
/* ganador proyectado por unidad (colorear por ganador) */
const EWIN={};
function eUnitWin(i){const lv=eLv(),key=st.es.obj+'|'+lv; if(!EWIN[key]){EWIN[key]={}; (lv==='est'?[{k:0,ii:ALL}]:eGroups(lv)).forEach(u=>EWIN[key][u.k]=eWin27(u.ii));} return EWIN[key][eKey(lv,i)];}
METRICS.seg={party:1,est:1,n:'Estrategia',d:'',f:ii=>{const i=ii[0];
  if(st.es.col==='win'){const w=eUnitWin(i); return w?{c:C[w.lead],t:.4+.6*Math.min(1,w.m/20)}:null;}
  const x=eSecs().by[i]; if(!x) return null; return {c:ECAT[x.cat][2],t:st.es.seg&&!eMatch(x,st.es.seg)?.12:1};}};
const eObjN=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[1]+' 2027';
/* recuadros por situación: filtran el mapa y la tabla */
function eTiles(ii,cls){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(Boolean);
  return `<div class="es-kp ${cls||''}">${eKeys().map(k=>{const n=xs.filter(x=>eMatch(x,k)).length; return `<button data-eseg="${k}" aria-pressed="${st.es.seg===k}" class="${k==='rt'?'krt':''}"><i style="background:${ECAT[k][2]}"></i><b>${fmt(n)}</b><span>${ECAT[k][0]}</span><small>${ECAT[k][1]}</small></button>`;}).join('')}</div>`;}
function eLegendHTML(){const E=eSecs(),ii=eSelII(),xs=ii.map(i=>E.by[i]).filter(Boolean),lvs={est:'estado',mun:'municipio',dl:'DL',df:'DF'}[eLv()];
  const tg=`<div class="es-tg"><button data-ecol="seg" aria-pressed="${st.es.col!=='win'}">Situación</button><button data-ecol="win" aria-pressed="${st.es.col==='win'}">Ganador por ${lvs}</button></div>`;
  if(st.es.col==='win'){const ws={}; (eLv()==='est'?[{k:0,ii:ALL}]:eGroups(eLv())).forEach(u=>{const w=eWin27(u.ii); if(w) ws[w.lead]=(ws[w.lead]||0)+1;});
    return `<div class="mcard es-leg"><small>Proyección · ${esc(eObjN())}</small>${tg}${Object.entries(ws).sort((a,b)=>b[1]-a[1]).map(([q,n])=>`<div class="es-li"><i style="background:${C[q]}"></i>${esc(NM[q])}${eBlocOf(q).length>1?' y aliados':''}<b>${n}</b></div>`).join('')}<div class="es-n">${ENN[eLv()][1]} que ganaría cada fuerza · la alianza toma el color de quien la encabeza</div></div>`;}
  const n=st.es.seg?xs.filter(x=>eMatch(x,st.es.seg)).length:0;
  return `<div class="mcard es-leg"><small>${st.party?esc(eSide(eAlly()))+' · ':''}Proyección ${esc(eObjN())}</small>${tg}${eKeys().map(k=>`<button data-eseg="${k}" aria-pressed="${st.es.seg===k}" title="${esc(ECAT[k][1])}"><i style="background:${ECAT[k][2]}"></i>${ECAT[k][0]}<b>${fmt(xs.filter(x=>eMatch(x,k)).length)}</b></button>`).join('')}${st.es.seg?`<button class="es-open" data-eopen="1">Ver las ${fmt(n)} secciones en tabla</button>`:`<div class="es-n">Clic en una situación para resaltar sus secciones</div>`}</div>`;}
/* datos por unidad de un nivel (lista del panel y tabla) */
function eUnits(L){const A=eAlly(),E=eSecs(),nat=eNat(),sel=new Set(eSelII());
  return eGroups(L).filter(u=>u.ii.some(i=>sel.has(i))).map(u=>{const ii=u.ii.filter(i=>sel.has(i)),xs=ii.map(i=>E.by[i]).filter(Boolean),o={k:u.k,name:eName(L,u.k),sec:xs.length};
    if(A&&L===nat){const c=E.CT[u.k]; if(!c) return null; return Object.assign(o,{con:1,me:c.d.mine,rvN:c.d.rvN,rv:c.d.riv?c.d.riv.votes:0,meta:Math.round(c.d.riv?c.d.riv.votes:0)+1,gap:c.d.gap,mg:c.d.mg,n:c.n,st:c.st,h:eHist(c.ii,A)});}
    if(A){const cnt=k=>xs.filter(x=>x.cat===k).length,rx=xs.filter(x=>x.add); return Object.assign(o,{gan:cnt('gan'),dis:cnt('dis'),pue:cnt('pue'),per:cnt('per'),n:rx.length,add:rx.reduce((t,x)=>t+x.add,0),me:xs.reduce((t,x)=>t+x.mine,0),meta:Math.round(xs.reduce((t,x)=>t+x.mine,0))+rx.reduce((t,x)=>t+x.add,0)});}
    const w=eWin27(ii); if(!w) return null; return Object.assign(o,{wn:w.bl[0].name,lead:w.lead,sn:w.bl[1]?w.bl[1].name:'—',m:w.m,mv:w.mv,com:xs.filter(x=>x.cat==='com').length,h:eHist(ii,null)});}).filter(Boolean);}
function eUnitSort(U){const A=eAlly(); if(!A) return U.sort((a,b)=>a.m-b.m); if(U[0]&&U[0].con){const o={dis:0,alc:1,amplia:2,gana:3}; return U.sort((a,b)=>o[a.st]-o[b.st]||(a.st==='gana'?b.gap-a.gap:a.gap-b.gap));} return U.sort((a,b)=>b.n-a.n||b.dis-a.dis);}
function ePjBar(a,b,an,bn){const tot=Math.max(100,a+b); return `<div class="es-pjb"><i style="width:${(100*a/tot).toFixed(1)}%"></i><u style="width:${(100*b/tot).toFixed(1)}%"></u></div><div class="es-pjl"><span>${esc(an)} <b>${a.toFixed(1)}%</b></span><span>${esc(bn)} <b>${b.toFixed(1)}%</b></span></div>`;}
function eHero(){const p=st.party,A=eAlly(),E=eSecs(),F=eFocus(),lv=eLv(),nat=eNat(),NN=ENN[nat],yr=eYear(),ii=eSelII(),xs=ii.map(i=>E.by[i]).filter(Boolean),where=st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST;
  const h=(tag,p1,big,bl,sub,extra)=>`<div class="es-meta">${tag?`<span class="es-tag">${tag}</span>`:''}<p>${p1}</p><div class="es-big"><b>${big}</b><span>${bl}</span></div>${sub?`<p class="es-sub">${sub}</p>`:''}${extra||''}</div>`;
  const ref=t=>t?`<div class="es-ref">Referencia ${esc(eLabel(eRef()))}: ${t}.</div>`:'';
  if(!p){if(F.mode==='multi'){const U=eUnits(nat),ws={}; U.forEach(u=>{ws[u.lead]=(ws[u.lead]||0)+1;}); const lst=Object.entries(ws).sort((a,b)=>b[1]-a[1]).map(([q,n])=>`${esc(NM[q])}${eBlocOf(q).length>1?' y aliados':''} ${n}`).join(' · ');
      return h('Proyección 2027',`${NN[1][0].toUpperCase()+NN[1].slice(1)} que ganaría cada fuerza: ${lst}.`,fmt(U.filter(u=>u.m<5).length),`${NN[1]} en disputa`,'diferencia proyectada menor a 5 puntos. Elige un partido arriba para ver su meta.');}
    const w=eWin27(ii); if(!w) return h('','Sin datos en esta selección.','—','','');
    return h('Proyección 2027',`${esc(w.bl[0].name)} va adelante en ${esc(where)} por ${w.m.toFixed(1)} puntos sobre ${esc(w.bl[1]?w.bl[1].name:'—')}.`,fmt(xs.filter(x=>x.cat==='com').length),'secciones competidas',`de ${fmt(xs.length)}: diferencia proyectada menor a 5 puntos. Elige un partido arriba para ver su meta.`,`<div class="es-pj">${ePjBar(w.a,w.b,w.bl[0].name,w.bl[1]?w.bl[1].name:'—')}</div>`+ref(eHist(ii,null)));}
  const me=esc(eSide(A));
  if(F.mode==='multi'){const cs=Object.values(E.CT),w=cs.filter(c=>c.st==='gana').length,al=cs.filter(c=>c.st==='dis'||c.st==='alc'),am=cs.filter(c=>c.st==='amplia').length,secs=al.reduce((t,c)=>t+c.n,0);
    return h('Proyección 2027 · compite contra la fuerza más fuerte de cada '+NN[0],`Con las tendencias actuales, ${me} ganaría ${w} de ${cs.length} ${NN[1]}.`,fmt(al.length),`${NN[1]} más al alcance`,al.length?`Perdería por menos de 10 puntos. Para ganarlos hay que ganar ${fmt(secs)} secciones: las perdidas más cerradas de cada ${NN[0]}.${am?` Otros ${am} tienen brecha amplia.`:''}`:`Los ${NN[1]} restantes tienen brecha amplia (más de 10 puntos).`);}
  if(F.mode==='sub'){const rx=xs.filter(x=>x.add),v=rx.reduce((t,x)=>t+x.add,0);
    return h('Proyección 2027',`${esc(eObjN())} se decide ${nat==='est'?'en todo el estado':'por '+NN[0]}. En ${esc(where)}, ${me} ganaría ${xs.filter(x=>x.mg>0).length} de ${xs.length} secciones.`,fmt(rx.length),'secciones que ganar aquí',rx.length?`Son parte de la ruta para la meta${nat==='est'?' estatal':' de cada '+NN[0]}; sumarían ${fmt(v)} votos.`:'Aquí no hace falta ganar secciones adicionales para la meta.');}
  const c=E.CT[F.k]; if(!c) return `<p class="es-p">Sin datos de ${esc(NM[p])} en este territorio.</p>`;
  const d=c.d,rv=esc(d.rvN),cx=c.ii.map(i=>E.by[i]).filter(Boolean),cw=cx.filter(x=>x.mg>0).length,tag='Compite contra '+rv;
  const pj=`<div class="es-pj">${ePjBar(d.a,d.b,eSide(A),d.rvN)}<p class="es-part">Supone participación de ${d.g.tp.toFixed(0)}% sobre la lista nominal vigente (${fmt(Math.round(d.g.ln))} electores, ${esc(CORTE)}).</p></div>`+ref(eHist(c.ii,A));
  if(d.gap<=0) return h(tag,`Con las tendencias actuales, ${me} ganaría ${esc(where)} a ${rv} por unos ${fmt(-d.gap)} votos.`,'Retener','',`Ganaría ${fmt(cw)} de ${fmt(cx.length)} secciones. Las ${fmt(cx.filter(x=>x.cat==='dis').length)} en disputa son las que hay que cuidar.`,pj);
  const sw=Math.floor(d.gap/2)+1,stl=`${ESTL[c.st][0]}: perdería por ${(-d.mg).toFixed(1)} puntos frente a ${rv}.`,ba=eBestAlly(c.ii);
  const alT=ba?`<div class="es-ally"><small>¿Qué alianza ganaría?</small>${ba.A.length===A.length&&ba.A.every(q=>A.includes(q))?'':`<p><b>${esc(eSide(ba.A))}</b>: ${ba.d.mg>=0?'ganaría por '+ba.d.mg.toFixed(1)+' puntos':'quedaría a '+(-ba.d.mg).toFixed(1)+' puntos (ninguna combinación de hasta 3 aliados gana)'} frente a ${esc(ba.d.rvN)}.</p>`}</div>`:'';
  if(c.st==='amplia') return h(tag,`Meta 2027 estimada: ${fmt(Math.round(d.riv.votes)+1)} votos para ganar ${esc(where)}. Con las tendencias actuales ${me} obtendría unos ${fmt(Math.round(d.mine))}.`,fmt(d.gap),'votos que faltan',`<b class="es-stl dn">${stl}</b><br>Ganar secciones cerradas no alcanza: tendría que ganar ${fmt(c.n)} de ${fmt(cx.length)} secciones. Hace falta una alianza o un cambio fuerte de tendencia.`,alT+pj);
  return h(tag,`Meta 2027 estimada: ${fmt(Math.round(d.riv.votes)+1)} votos para ganar ${esc(where)}. Con las tendencias actuales ${me} obtendría unos ${fmt(Math.round(d.mine))}; le faltarían ${fmt(d.gap)}.`,fmt(c.n),'secciones más que ganar',`Ganaría ${fmt(cw)} de ${fmt(cx.length)} secciones. Ganando además las ${fmt(c.n)} perdidas más cerradas se cubren los votos que faltan.<br><b class="es-stl ${ESTL[c.st][1]}">${stl}</b><br>Otra vía: que ${fmt(sw)} votantes de ${rv} voten por ${me}.`,alT+pj);}
/* la alianza más pequeña (hasta 3 aliados, sin el bloque rival) que ganaría la contienda en la proyección */
function eBestAlly(ii){const p=st.party,d0=eDuel27(ii,[p]); if(!d0) return null; const ex=new Set(d0.riv?d0.riv.members:[]),pool=EPARTIES.filter(q=>q!==p&&!ex.has(q)); let best=null;
  const test=A=>{const d=eDuel27(ii,A); if(d&&(!best||(d.mg>=0&&best.d.mg<0)||((d.mg>=0)===(best.d.mg>=0)&&(d.mg>=0?A.length<best.A.length||(A.length===best.A.length&&d.mg>best.d.mg):d.mg>best.d.mg)))) best={A,d};};
  test([p]); pool.forEach((a,i)=>{test([p,a]); pool.slice(i+1).forEach((b,j)=>{test([p,a,b]); pool.slice(i+j+2).forEach(c=>test([p,a,b,c]));});}); return best;}
function eCompare(){const p=st.party,F=eFocus(),nat=eNat(); if(!p||F.mode==='sub') return '';
  const co=eBlocOf(p),scs=[['s1']].concat(co.length>1?[['s2']]:[]).concat(st.es.sc==='s3'?[['s3']]:[]);
  return `<div class="es-cmpw"><div class="es-cmph"><span>Escenario 2027</span><span>${F.mode==='multi'?'Ganaría':'Votos'}</span><span>Puntos</span></div>${scs.map(s=>{const A=eAllyFor(s[0]);
    if(F.mode==='multi'){const cs=eContests(); let w=0,al=0; cs.forEach(c=>{const d=eDuel27(c.ii,A); if(d&&d.gap<=0) w++; else if(d&&d.mg>-10) al++;}); return `<div class="es-cmp${s[0]===st.es.sc?' on':''}"><span>${esc(eSide(A))}</span><b>${w} de ${cs.length}</b><b>+${al} al alcance</b></div>`;}
    const c=eContests().find(c=>c.k===F.k)||{ii:ALL},d=eDuel27(c.ii,A); if(!d) return '';
    return `<div class="es-cmp${s[0]===st.es.sc?' on':''}"><span>${esc(eSide(A))}</span><b class="${d.gap>0?'dn':'up'}">${d.gap>0?'faltan '+fmt(d.gap):'gana +'+fmt(-d.gap)}</b><b class="${d.mg>=0?'up':'dn'}">${pjTxt(d.mg)}</b></div>`;}).join('')}</div>`;}
function estPanel(){const p=st.party,lv=eLv(),nat=eNat(),ii=eSelII(),E=eSecs();
  const chips=(L,cur,attr)=>L.map(x=>`<button data-${attr}="${x[0]}" aria-pressed="${cur===x[0]}">${x[1]}</button>`).join('');
  let h=`<div class="colh"><button class="es-back" id="eback">← Volver al mapa</button><b style="margin-left:8px">Estrategia 2027</b></div><div class="cd es">`;
  h+=`<div class="es-row"><span>1 · ¿Qué se elige en 2027 en ${esc(EST)}?</span><div class="es-ch">${chips(EOBJ.map(x=>[x[0],x[1]]),st.es.obj,'eobj')}</div></div>`;
  h+=`<div class="es-row"><span>2 · Partido</span><div class="es-ch"><button data-epar="" aria-pressed="${!p}">Ninguno (panorama)</button>${EPARTIES.map(q=>`<button data-epar="${q}" aria-pressed="${p===q}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`;
  if(p){const co=eBlocOf(p); if(co.length<2&&st.es.sc==='s2') st.es.sc='s1'; const A=eAlly(),scs=[['s1','Solo '+NM[p]]].concat(co.length>1?[['s2','Con su alianza más reciente ('+eSide(co)+')']]:[]).concat([['s3','Alianza a la medida']]);
    h+=`<div class="es-row"><span>3 · Escenario</span><div class="es-ch">${chips(scs,st.es.sc,'esc')}</div>${st.es.sc==='s3'?`<div class="es-al"><small>Elige con quién iría ${esc(NM[p])}:</small><div class="es-ch">${EPARTIES.filter(q=>q!==p).map(q=>`<button data-eal="${q}" aria-pressed="${A.includes(q)}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`:''}</div>`;}
  const lvs=Object.keys(ELV).filter(k=>k==='est'?nat==='est':true),G=lv==='est'?[]:eGroups(lv).sort((a,b)=>lv==='mun'?String(MUN[a.k]).localeCompare(MUN[b.k]):a.k-b.k);
  h+=`<div class="es-row"><span>${p?4:3} · Territorio</span><div class="es-ch">${chips(lvs.map(k=>[k,k==='est'?EST:ELV[k]]),lv,'elv')}</div>${lv!=='est'?`<select class="es-sel" data-eunit="1"><option value="">${lv===nat?'Todos los '+ENN[lv][1]:'Todo '+EST+' (por '+ENN[lv][0]+')'}</option>${G.map(u=>`<option value="${u.k}" ${String(st.es.u)===String(u.k)?'selected':''}>${esc(eName(lv,u.k))}</option>`).join('')}</select>`:''}</div>`;
  h+=eHero()+eCompare();
  h+=`<div class="es-h">Secciones de ${esc(st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST)}</div>${eTiles(ii)}<p class="es-hint">Clic en un recuadro para resaltar esas secciones en el mapa.</p>`;
  const n=st.es.seg?ii.map(i=>E.by[i]).filter(x=>x&&eMatch(x,st.es.seg)).length:ii.length;
  h+=`<button class="es-tb" id="etab">${st.es.seg?`Ver las ${fmt(n)} secciones: ${ECAT[st.es.seg][0].toLowerCase()}`:'Ver tabla de secciones y metas'}</button>`;
  if(lv!=='est'&&st.es.u==null){const U=eUnitSort(eUnits(lv)); h+=`<div class="es-h">Por ${ENN[lv][0]}</div><div class="es-ul">${U.map(z=>eUnitBtn(z)).join('')}</div>`;}
  const {ym,same}=eProjW();
  h+=`<p class="es-f">Estimación propia con datos del INE (resultados por sección ${[...new Set(same.map(e=>D.E[e].year).concat([ym]))].sort().join(', ')}; ${esc(SRC.pad||'lista nominal')}). Proyección 2027 por sección: lista nominal vigente × participación esperada × votación por partido (50% elecciones de ${ym}${same.length===2?', 30% '+eLabel(same[1])+' y 20% '+eLabel(same[0]):same[0]?', 50% '+eLabel(same[0]):''}). Alianzas de partida: las de ${EBL.year}. No incluye a ${NOREG.map(q=>NM[q]||q).join(', ')} (sin registro) ni a partidos nuevos sin historial (Somos México, PAZ). Meta de una sección: votos para ganarla o retenerla. Secciones a ganar: las perdidas más cerradas hasta sumar los votos que faltan.</p></div>`;
  return h;}
function eUnitBtn(z){const A=eAlly(); let r,s;
  if(!A){r=`<em>${z.m.toFixed(1)} pts</em>`; s=`${esc(z.wn)} sobre ${esc(z.sn)}${z.h?' · antes: '+z.h:''}`; return `<button data-eu="${z.k}"><span><i class="es-d" style="background:${C[z.lead]}"></i>${esc(z.name)}</span>${r}<small>${s}</small></button>`;}
  if(z.con){r=`<em class="${ESTL[z.st][1]}">${z.gap>0?'faltan '+fmt(z.gap):'gana +'+fmt(-z.gap)}</em>`; s=`contra ${esc(z.rvN)} · meta ${fmt(z.meta)} votos${z.gap>0?' · ganar '+fmt(z.n)+' secciones · '+ESTL[z.st][0].toLowerCase():''}`;}
  else {r=`<em>${fmt(z.n)} a ganar</em>`; s=`${z.sec} secciones · ${z.gan} con ventaja · ${z.dis} en disputa · ${z.pue} se pueden ganar`;}
  return `<button data-eu="${z.k}"><span>${esc(z.name)}</span>${r}<small>${s}</small></button>`;}
/* tabla: secciones o unidades, con recuadros que filtran, orden, búsqueda y CSV */
function eCols(tab){const A=eAlly(),me=A?esc(eSide(A)):'',dot=x=>`<i class="es-d" style="background:${ECAT[x.cat][2]}"></i>${ECAT[x.cat][0]}`,si=x=>x?'Sí':'',R=Math.round;
  if(tab==='sec'){const b=[['s','Sección',r=>S[r.i].s,r=>S[r.i].s,1],['mun','Municipio',r=>esc(MUN[S[r.i].m]),r=>MUN[S[r.i].m]],['dl','DL',r=>S[r.i].dl,r=>S[r.i].dl,1],['df','DF',r=>S[r.i].df,r=>S[r.i].df,1],['cat','Situación 2027',dot,r=>r.cat]];
    if(A) return [['ord','Prioridad',r=>r.ord||'—',r=>r.ord||1e9,1]].concat(b,[['duro','Voto duro',r=>si(r.duro),r=>r.duro?0:1],['sw','Switcher',r=>si(r.sw),r=>r.sw?0:1],['ln','Lista nominal',r=>fmt(r.ln),r=>r.ln,1],['mine','Votos proyectados '+me,r=>fmt(R(r.mine)),r=>r.mine,1],['rvN','Rival',r=>esc(r.rvN),r=>r.rvN],['rv','Votos proyectados del rival',r=>fmt(R(r.rv)),r=>r.rv,1],['dif','Diferencia',r=>{const d=R(r.mine-r.rv); return `<span class="${d>=0?'up':'dn'}">${d>=0?'+':''}${fmt(d)}</span>`;},r=>r.mine-r.rv,1],['meta','Meta 2027 (votos)',r=>`<b>${fmt(r.mg>0?R(r.mine):R(r.rv)+1)}</b>`,r=>r.mg>0?r.mine:r.rv+1,1]]);
    return b.concat([['wn','Adelante',r=>esc(r.wn),r=>r.wn],['sn','Segundo',r=>esc(r.sn),r=>r.sn],['mg','Ventaja (pts)',r=>r.mg.toFixed(1),r=>r.mg,1],['mv','Ventaja (votos)',r=>fmt(r.mv),r=>r.mv,1],['duro','Voto duro del primero',r=>si(r.duro),r=>r.duro?0:1],['sw','Switcher',r=>si(r.sw),r=>r.sw?0:1],['ln','Lista nominal',r=>fmt(r.ln),r=>r.ln,1]]);}
  const nm=[['name',ELV[tab],r=>esc(r.name),r=>tab==='mun'?r.name:r.k]];
  if(!A) return nm.concat([['wn','Adelante en 2027',r=>`<i class="es-d" style="background:${C[r.lead]}"></i>${esc(r.wn)}`,r=>r.wn],['sn','Segundo',r=>esc(r.sn),r=>r.sn],['m','Ventaja (pts)',r=>r.m.toFixed(1),r=>r.m,1],['mv','Ventaja (votos)',r=>fmt(r.mv),r=>r.mv,1],['com','Secciones competidas',r=>fmt(r.com),r=>r.com,1],['h','Resultado '+eYear(),r=>r.h||'—',r=>r.h||'']]);
  if(tab===eNat()) return nm.concat([['me','Votos proyectados '+me,r=>fmt(R(r.me)),r=>r.me,1],['rvN','Compite contra',r=>esc(r.rvN),r=>r.rvN],['rv','Votos proyectados del rival',r=>fmt(R(r.rv)),r=>r.rv,1],['meta','Meta 2027 (votos)',r=>`<b>${fmt(r.meta)}</b>`,r=>r.meta,1],['gap','Faltan / ventaja',r=>`<span class="${r.gap>0?'dn':'up'}">${r.gap>0?fmt(r.gap):'gana +'+fmt(-r.gap)}</span>`,r=>r.gap,1],['n','Secciones a ganar',r=>r.gap>0?fmt(r.n):'—',r=>r.n,1],['st','Situación',r=>`<b class="es-stl ${ESTL[r.st][1]}">${ESTL[r.st][0]}</b>`,r=>r.st],['h','Resultado '+eYear(),r=>r.h||'—',r=>r.h||'']]);
  return nm.concat([['sec','Secciones',r=>fmt(r.sec),r=>r.sec,1],['gan','Ganaría con ventaja',r=>fmt(r.gan),r=>r.gan,1],['dis','En disputa',r=>fmt(r.dis),r=>r.dis,1],['pue','Se pueden ganar',r=>fmt(r.pue),r=>r.pue,1],['per','Difíciles',r=>fmt(r.per),r=>r.per,1],['n','Secciones a ganar para la meta',r=>`<b>${fmt(r.n)}</b>`,r=>r.n,1],['add','Votos a sumar',r=>fmt(r.add),r=>r.add,1],['meta','Meta 2027 (votos)',r=>fmt(r.meta),r=>r.meta,1]]);}
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
function estRender(){const C2=$('col'); C2.innerHTML=estPanel();
  const go=()=>{const lv=eLv(); if(st.es.u!=null&&lv!=='est') applyScope(lv,st.es.u); else applyScope('all',0);};
  $('eback').onclick=()=>setView2('map');
  C2.querySelectorAll('[data-eobj]').forEach(b=>b.onclick=()=>{st.es.obj=b.dataset.eobj; st.es.lv=null; st.es.u=null; st.es.seg=null; st.elec=eRef(); $('elec').value=st.elec; go();});
  C2.querySelectorAll('[data-elv]').forEach(b=>b.onclick=()=>{st.es.lv=b.dataset.elv; st.es.u=null; go();});
  const us=C2.querySelector('[data-eunit]'); if(us) us.onchange=()=>{st.es.u=us.value===''?null:+us.value; go();};
  C2.querySelectorAll('[data-epar]').forEach(b=>b.onclick=()=>{st.party=b.dataset.epar; $('party').value=st.party; st.es.ally=null; st.es.seg=null; st.es.sk=null; $('rPa').setAttribute('aria-pressed',!!st.party); render(true);});
  C2.querySelectorAll('[data-esc]').forEach(b=>b.onclick=()=>{st.es.sc=b.dataset.esc; if(st.es.sc==='s3'&&!st.es.ally) st.es.ally=eBlocOf(st.party); st.es.seg=null; render();});
  C2.querySelectorAll('[data-eal]').forEach(b=>b.onclick=()=>{const q=b.dataset.eal,a=(st.es.ally||[st.party]).slice(),j=a.indexOf(q); j>=0?a.splice(j,1):a.push(q); st.es.ally=a; render();});
  C2.querySelectorAll('[data-eu]').forEach(b=>b.onclick=()=>{st.es.u=+b.dataset.eu; go();});
  C2.querySelectorAll('[data-eseg]').forEach(b=>b.onclick=()=>{const k=b.dataset.eseg; st.es.seg=st.es.seg===k?null:k; render();});
  $('etab').onclick=()=>{st.es.q=''; st.es.lim=300; st.es.tab='sec'; st.es.sk=null; eTable();};
  if($('estm')&&$('estm').classList.contains('on')) eTable();}
