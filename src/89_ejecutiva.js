/* ===== Vista ejecutiva: el estado de un partido en una sola pantalla, y el mismo resumen en PDF para WhatsApp =====
   Usa los mismos cálculos que la Estrategia, la tarjeta de proyección y el congreso (pjRun, congBase, eSecs):
   nada se calcula distinto aquí, solo se resume. Cargos: los que se eligen en 2027 en el estado (EOBJ).
   "Hoy": quién ganó la última elección de cada cargo (congreso: mayoría relativa ganada + plurinominales con la regla del estado).
   Alianzas: el partido solo, con el aliado que más le suma y con todos sus aliados posibles (los de 2021 en adelante). */
const EXN={GOB:'Gubernatura',DIPL:'Congreso local',AYU:M0.cab==='cdmx'?'Alcaldías':'Ayuntamientos',DIPF:'Diputaciones federales'};
const EXC={GOB:'Gubernatura',DIPL:'Distritos locales',AYU:M0.cab==='cdmx'?'Alcaldías':'Ayuntamientos',DIPF:'Dip. federales'};
const EXDAY=Date.UTC(2027,5,6),exDias=()=>Math.max(0,Math.ceil((EXDAY-Date.now())/864e5));
const exPN=p=>NM[p]||p,exBN=ms=>ms.map(exPN).join('-');
const exDots=(k,cls='')=>`<span class="ex-dots ${cls}">${Array.from({length:10},(_,j)=>`<i${j<k?' class="on"':''}></i>`).join('')}</span>`;
const exK=p=>Math.max(0,Math.min(10,Math.round(10*p)));
const exPill=p=>p>=.65?['Favorable','fav']:p>.35?['En juego','jue']:['Difícil','dif'];
/* corre fn con el cargo y la alianza indicados, como si se eligieran en la Estrategia, y deja todo como estaba */
function exWith(T,al,fn){const o=st.es.obj,a=st.es.al; st.es.obj=T; st.es.al=al; try{return fn();} finally{st.es.obj=o; st.es.al=a;}}
const exUnits=T=>{const lv=PJT[T],G={}; if(lv==='est') return {0:ALL}; ALL.forEach(i=>{const k=pjKey(T,i); (G[k]||(G[k]=[])).push(i);}); return G;};
/* hoy: lo que ganó el partido (con su alianza de entonces) en la última elección del cargo */
function exHoy(T,p){const L=lastOf(T); if(!L) return null; const yr=D.E[L].year;
  if(T==='DIPL'){const U=exUnits(T),MR={}; let n=0,of=0; Object.values(U).forEach(ii=>{const t=totals(L,ii); if(!t.val||!t.bl[0]) return; of++; const w=t.bl[0],top=w.members.filter(m=>m!=='OTROS').sort((a,b)=>(t.tot[b]||0)-(t.tot[a]||0))[0]; if(top) MR[top]=(MR[top]||0)+1; if(w.members.includes(p)) n++;});
    const SG=typeof congSig==='function'?congSig():{}; if(Object.keys(SG).length){Object.keys(MR).forEach(k=>delete MR[k]); Object.values(SG).forEach(q=>{const m=String(q).split(/[_-]/)[0]; MR[m]=(MR[m]||0)+1;});}
    const tt=totals(L,ALL),blk=(tt.bl.find(b=>b.members.includes(p))||{members:[p]}).members.filter(m=>m!=='OTROS');
    let seats=null,NT=null; try{const r=rpAsigna(tt.tot,MR); NT=r.NT; seats=blk.reduce((a,m)=>a+((r.out[m]||{}).t||0),0);}catch(e){}
    return {yr,n,of,seats,NT,ally:blk.length>1,blk};}
  if(T==='GOB'){const t=totals(L,ALL),w=t.bl[0]; return {yr,gov:!!(w&&w.members.includes(p)),who:w?exBN(w.members.filter(m=>m!=='OTROS')):'—',n:w&&w.members.includes(p)?1:0,of:1};}
  const U=exUnits(T);
  /* ayuntamientos: si hay registro de quién gobierna cada municipio (meta.gan), manda sobre el resultado por sección */
  if(T==='AYU'&&typeof GAN!=='undefined'&&GAN&&GAN.pm){let n=0,of=0; Object.keys(U).forEach(k=>{const L_=GAN.pm[String(k)]; if(!L_||!L_.length) return; const r=L_.slice().sort((a,b)=>b[0]-a[0])[0]; of++; if(String(r[3]||r[2]||'').split(/[_-]/).includes(p)) n++;}); if(of>=Object.keys(U).length*.8) return {yr,n,of};}
  let n=0,of=0; Object.values(U).forEach(ii=>{const t=totals(L,ii); if(!t.val||!t.bl[0]) return; of++; if(t.bl[0].members.includes(p)) n++;}); return {yr,n,of};}
/* voto propio del partido en la última elección del cargo (puntos) */
const exOwn=(T,p)=>{const L=lastOf(T); if(!L) return null; const t=totals(L,ALL); return t.val?{v:100*(t.tot[p]||0)/t.val,yr:D.E[L].year}:null;};
/* un cargo con una alianza: lo que muestran la tarjeta de proyección y el congreso */
function exCargo(T,p,al,ns){return exWith(T,al,()=>{const R=pjRun(T,ALL,p,0,ns); if(!R||R.none) return null;
  const riv=R.pano.filter(x=>x.j!==R.fi).sort((a,b)=>b.share-a.share)[0],o={T,R,n:R.n,lead:R.lead,half:R.half,share:R.share,riv:riv?exBN(riv.ms):'—',rivSh:riv?riv.share:0,m:R.n===1?R.U[0].m:null};
  if(T==='GOB'){o.p=R.U[0].p;}
  else if(T==='DIPL'&&typeof congBase==='function'&&!ns){const B=congBase(); if(B&&B.pr){o.p=B.pr.pM; o.seats=B.tb; o.NT=B.NT; o.hm=B.half; o.need=congNeed(B); o.B=B;} else o.p=R.pMaj;}
  else o.p=R.pMaj;
  return o;});}
/* escenarios de alianza: solo, con el aliado que más suma y con todos los posibles */
function exAli(p,TS){if(typeof eScen!=='function') return null; const sc=eScen(p),base=sc[0],pool=EPOOL(p).filter(m=>!base.includes(m)); if(!pool.length) return {cols:[base],res:{}};
  const val=al=>TS.reduce((a,T)=>{const c=exCargo(T,p,al,400); return a+(c?(T==='GOB'?c.m/10:c.lead/c.n):0);},0);
  const ones=pool.map(m=>({m,al:base.concat([m])})); ones.forEach(x=>x.v=val(x.al)); ones.sort((a,b)=>b.v-a.v);
  const cols=[base,ones[0].al]; if(pool.length>1) cols.push(base.concat(pool));
  const res={}; TS.forEach(T=>res[T]=cols.map(al=>exCargo(T,p,al,600))); return {cols,res};}
/* lugares en casi empate entre todos los cargos: donde se decide */
function exNear(C){const L=[]; C.forEach(c=>{if(!c) return; c.R.U.forEach(u=>{if(Math.abs(u.m)<3) L.push({T:c.T,k:u.k,m:u.m,nm:c.T==='GOB'?'la gubernatura':c.T==='AYU'?MUN[u.k]:c.T==='DIPL'?'el distrito local '+u.k:'el distrito federal '+u.k});});});
  return L.sort((a,b)=>Math.abs(a.m)-Math.abs(b.m)).slice(0,3);}
/* secciones por acción y ruta de votos (Estrategia) para el cargo de referencia */
function exSecs(T,p){return exWith(T,[p],()=>{const E=eSecs(); if(!E||!E.L) return null; const c={dis:0,cui:0,seg:0,dif:0}; E.L.forEach(x=>{const a=eAct4(x.act); if(a in c) c[a]++;});
  let votos=0,secR=0; Object.values(E.CT||{}).forEach(k=>{if(k.d&&k.d.gap>0){votos+=k.acc||0; secR+=k.n||0;}}); return {c,n:E.L.length,votos,secR};});}
/* municipios con más votos: cómo le iría ahí */
function exVoto(T,p){return exWith(T,[p],()=>{const G={}; ALL.forEach(i=>{(G[S[i].m]||(G[S[i].m]=[])).push(i);}); const P=eP(),tot=ALL.reduce((a,i)=>a+(P[i]?P[i].V:0),0)||1;
  return Object.entries(G).map(([m,ii])=>({m,V:ii.reduce((a,i)=>a+(P[i]?P[i].V:0),0),ii})).sort((a,b)=>b.V-a.V).slice(0,2).map(x=>{const d=eDuel27(x.ii,[p]); return {nm:MUN[x.m],sh:100*x.V/tot,mg:d?d.mg:null,rv:d?d.rvN:'—'};});});}
function exParty(){if(st.party) return st.party; const g=lastOf('GOB'),t=g?totals(g,ALL):null; const w=t&&t.bl[0]?t.bl[0].lead:null; return w&&EPARTIES.includes(w)?w:EPARTIES[0];}
/* todo lo que muestra la vista (y el PDF) */
function exData(){const p=exParty(),TS=EOBJ.map(o=>o[0]);
  const CG=TS.map(T=>{const sl=eScen(p)[0],c=exCargo(T,p,sl); if(!c) return null; c.hoy=exHoy(T,p); c.own=exOwn(T,p); return c;}).filter(Boolean);
  const A=exAli(p,CG.map(c=>c.T)),ref=CG.find(c=>c.T==='DIPL')||CG[0],SE=ref?exSecs(ref.T,p):null,VO=ref?exVoto(ref.T,p):null,CL=exNear(CG);
  const hoyMay=c=>c.T==='GOB'?c.hoy&&c.hoy.gov:c.T==='DIPL'&&c.hoy&&c.hoy.seats!=null?c.hoy.seats>=Math.floor(c.hoy.NT/2)+1:c.hoy&&c.hoy.n>=Math.floor(c.hoy.of/2)+1;
  CG.forEach(c=>c.gob=!!hoyMay(c));
  const gov=CG.filter(c=>c.gob).length,sure=CG.filter(c=>c.p>=.85),N=CG.length;
  const h1=(gov===N?`${exPN(p)} gobierna hoy todo lo que se elige en ${EST}`:gov===0?`${exPN(p)} hoy no tiene la mayoría en ninguno de los cargos que se eligen en ${EST}`:`${exPN(p)} tiene hoy la mayoría en ${gov} de los ${N} cargos que se eligen en ${EST}`)
    +'; '+(sure.length===0?(gov?'sola, no tendría ninguno asegurado.':'sola, no ganaría ninguno con seguridad.'):sure.length===N?'sola, los tendría todos con ventaja amplia.':`sola, solo tendría con ventaja amplia ${sure.map(c=>EXN[c.T].toLowerCase()).join(' y ')}.`);
  return {p,C:CG,A,ref,SE,VO,CL,h1,date:new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),enc:CG.some(c=>pjEnc(c.T))};}
/* textos por cargo */
function exTx(c){const h=c.hoy||{},pn=exPN(EXD.p);
  const hoy=c.T==='GOB'?(h.gov?`Hoy gobierna ${h.who===pn?pn:h.who}`:`Hoy gobierna ${h.who}`):c.T==='DIPL'?(h.seats!=null?`Hoy ${h.seats} de ${h.NT}${h.ally?' con aliados':''}`:`Hoy ganó ${h.n} de ${h.of} distritos`):`Hoy ${h.n} de ${h.of}`;
  const sola=c.T==='GOB'?(c.m>=0?`iría adelante por ${c.m.toFixed(0)} pts`:`iría atrás por ${Math.abs(c.m).toFixed(0)} pts`):c.T==='DIPL'&&c.seats!=null?`unas ${c.seats} de ${c.NT} (${(()=>{const B=c.B,o=B?B.x.out:{},bl=B?B.blk:[],mr=bl.reduce((t,m)=>t+((o[m]||{}).mr||0),0),rp=bl.reduce((t,m)=>t+((o[m]||{}).rp||0),0); return `${mr} distritos y ${rp} ${rp===1?'plurinominal':'plurinominales'}`;})()}); mayoría con ${c.hm}`:`adelante en ${c.lead} de ${c.n}; mayoría con ${c.half}`;
  const what=c.T==='GOB'?'gana':c.T==='DIPL'?'tiene mayoría':'gana la mayoría';
  const tr=c.own?(()=>{const d=c.share-c.own.v; return Math.abs(d)<1?`igual que ${c.own.yr}`:`${d>0?'▲':'▼'} ${Math.abs(d).toFixed(0)} ${Math.abs(d).toFixed(0)==='1'?'pt':'pts'} vs ${c.own.yr}`;})():'';
  const [pl,pk]=exPill(c.p);
  return {hoy,sola,what,tr,pl:(c.gob?'Retener':'Conquistar')+' · '+pl.toLowerCase(),pk};}
let EXD=null;
function exAliTxt(A){if(!A||A.cols.length<2) return ''; const fmtC=(c,T)=>!c?'—':T==='GOB'?(c.m>=0?'+':'−')+Math.abs(c.m).toFixed(1)+' pts':T==='DIPL'?String(c.lead):String(c.lead);
  const names=A.cols.map((al,j)=>j===0?'Sola':'Con '+al.slice(1).map(exPN).join(' y '));
  const rows=Object.entries(A.res).map(([T,v])=>`<span class="ex-at">${EXC[T]}</span>${v.map((c,j)=>`<span${j&&c&&v[0]&&(T==='GOB'?c.m>v[0].m+.5:c.lead>v[0].lead)?' class="up"':''}>${fmtC(c,T)}${j===0&&c&&T!=='GOB'?` de ${c.n}`:''}</span>`).join('')}`).join('');
  return {names,html:`<div class="ex-al" style="grid-template-columns:minmax(120px,1.3fr) repeat(${A.cols.length},minmax(0,1fr))"><span></span>${names.map(n=>`<b>${esc(n)}</b>`).join('')}${rows}</div>`};}
function exClave(D){const d=D.C.find(c=>c.T==='DIPL'); if(d&&d.need) return d.need.replace(/<[^>]+>/g,'');
  const g=D.C.find(c=>c.T==='GOB'); if(g){const mt=pjMeta(g.R.U[0]); return mt?`Para tener 7 de cada 10 escenarios a favor en la gubernatura le harían falta unos ${fmt(mt.nuevos)} votos más.`:'En la gubernatura ya tendría 7 o más de cada 10 escenarios a favor: lo decisivo es no perder votos.';}
  return '';}
function exHTML(D){const pn=exPN(D.p),c0=C[D.p]||'#1C7F79',A=exAliTxt(D.A),SE=D.SE,cl=exClave(D);
  const tiles=D.C.map((c,j)=>{const t=exTx(c),k=exK(c.p); return `<article class="ex-t" style="animation-delay:${j*70}ms"><header><b>${EXN[c.T]}</b><em class="ex-p ${t.pk}">${t.pl}</em></header>
    <div class="ex-big"><b>${k}</b><span>de cada 10 escenarios<br>${t.what}</span></div>${exDots(k)}
    <p><strong>${esc(t.hoy)}.</strong> Sola: ${esc(t.sola)}.</p><footer><span>Rival: ${esc(c.riv)}</span>${t.tr?`<span>${t.tr}</span>`:''}</footer></article>`;}).join('');
  const AV=AVAIL.filter(x=>typeof LAB_PUEDE!=='function'||LAB_PUEDE(x.cab));
  const strip=AV.length>1?`<nav class="ex-st" aria-label="Tus estados">${AV.map(x=>`<button data-excab="${x.cab}" aria-pressed="${x.cab===M0.cab}">${esc(x.estado)}</button>`).join('')}</nav>`:'';
  const parts=EPARTIES.filter(q=>MAIN.includes(q)).map(q=>`<button data-exp="${q}" aria-pressed="${q===D.p}"><i style="background:${C[q]||'#999'}"></i>${esc(exPN(q))}</button>`).join('');
  const qh=SE?`<section class="ex-c"><h3>Qué hacer en las ${fmt(SE.n)} secciones <small>${EXN[D.ref.T].toLowerCase()}</small></h3><div class="ex-bar">${[['dis','#F46883'],['cui','#93D6D0'],['seg','#1C7F79'],['dif','#D3DADA']].map(([k,col])=>`<i style="flex:${SE.c[k]||0};background:${col}"></i>`).join('')}</div>
    <div class="ex-q"><div><b>${fmt(SE.c.dis)}</b><span>por disputar: perdería por menos de 10 pts</span></div><div><b>${fmt(SE.c.cui)}</b><span>por defender: ganaría por menos de 10 pts</span></div><div><b>${fmt(SE.c.seg)}</b><span>por conservar: ventaja de 10 pts o más</span></div><div><b>${fmt(SE.c.dif)}</b><span>difíciles: perdería por más de 10</span></div></div></section>`:'';
  const vo=D.VO&&D.VO.length?`<section class="ex-c"><h3>Dónde está el voto</h3>${D.VO.map(v=>`<p><b>${esc(v.nm)}</b>, ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`<span class="up">ganaría por ${v.mg.toFixed(0)} pts</span>`:`<span class="dn">perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts</span>`}.</p>`).join('')}</section>`:'';
  const cls=D.CL.length?`<div class="ex-dec"><span>Se decide en</span>${D.CL.map(x=>`<b>${esc(x.nm)}</b>`).join('')}<em>casi empate</em></div>`:'';
  return `<div class="ex-in">${strip}<div class="ex-top"><span class="ex-tag">Proyección 2027 · ${D.enc?'con encuesta':'sin encuesta'} · faltan ${exDias()} días</span><div class="ex-ps" role="group" aria-label="Partido">${parts}</div>
    <div class="ex-act"><button class="presb" id="expdf"><svg viewBox="0 0 12 12"><path d="M6 1v6.5M3.3 5 6 7.7 8.7 5M1.5 10.5h9"/></svg>PDF para WhatsApp</button><button class="presb" id="exx">Análisis completo</button></div></div>
    <h1 class="ex-h1" style="--pc:${c0}">${esc(D.h1)}</h1>
    <div class="ex-ts">${tiles}</div>
    <div class="ex-row"><section class="ex-c"><h3>Resultados posibles si va en alianza <small>${D.C.some(c=>c.T==='GOB')?'adelante en · gubernatura: diferencia':'adelante en'}</small></h3>${A?A.html:'<p>No ha ido en alianza desde 2021: no hay socios que comparar.</p>'}</section><div class="ex-col">${qh}${vo}</div></div>
    <section class="ex-k"><div><span>La clave</span><p>${esc(cl)}</p>${cls}</div><div class="ex-kb"><button id="exgo">Ver dónde y qué hacer ›</button></div></section>
    <p class="ex-ft">Estimación con resultados oficiales por sección${D.enc?' y la encuesta capturada':', sin encuesta ni candidatos'}: muestra hacia dónde van las tendencias, no el resultado de 2027. ${esc(D.date)}.</p></div>`;}
/* ---------- PDF A4 vertical: portada que se entiende sola en la vista previa de WhatsApp + página de resumen ---------- */
function exPDFPages(D){const pn=exPN(D.p),A=exAliTxt(D.A),SE=D.SE,cl=exClave(D);
  const rows=D.C.map(c=>{const t=exTx(c),k=exK(c.p); return `<div class="xp-r"><b>${EXN[c.T]}</b><span class="xp-n">${esc(t.hoy.replace(/^Hoy (gobierna )?/,'').replace(/^./,s=>s.toUpperCase()))}</span><span>${esc(t.sola)}<br><small>contra ${esc(c.riv)}</small></span><span>${exDots(k,'d')}<small>${k} de cada 10 escenarios</small></span></div>`;}).join('');
  const ali=D.A&&D.A.cols.length>1?(()=>{const j=D.A.cols.length-1,al=D.A.cols[j]; const bits=Object.entries(D.A.res).map(([T,v])=>{const c=v[j]; return !c?null:T==='GOB'?`${c.m>=0?'adelante':'atrás'} por ${Math.abs(c.m).toFixed(0)} pts en gubernatura`:`adelante en ${c.lead} de ${c.n} ${T==='DIPL'?'distritos':T==='AYU'?(M0.cab==='cdmx'?'alcaldías':'ayuntamientos'):'federales'}`;}).filter(Boolean); return `<div class="xp-al"><b>En alianza con ${esc(al.slice(1).map(exPN).join(' y '))}</b> iría ${bits.join(', ')}.</div>`;})():'';
  const cover=`<section class="xp xp-cv"><div class="xp-hd"><span><i class="xp-lg"></i>Laboratorio Político</span><span>${esc(D.date)}</span></div>
    <div class="xp-ti"><span class="xp-tag">Proyección 2027 · faltan ${exDias()} días</span><h1>${esc(EST)} <em><i style="background:${C[D.p]||'#999'}"></i>${esc(pn)}</em></h1><p>${esc(D.h1.replace(new RegExp('^'+pn+' '),'').replace(/^./,s=>s.toUpperCase()))}</p></div>
    <div class="xp-tb"><div class="xp-r xp-rh"><span></span><span>Hoy</span><span>Sola en 2027</span><span>A favor</span></div>${rows}</div>${ali}
    <div class="xp-cl"><small>Dónde se decide</small><p>${esc(cl)}</p>${D.CL.length?`<span class="xp-dc">En casi empate: ${D.CL.map(x=>esc(x.nm)).join(', ')}.</span>`:''}</div>${D.VO&&D.VO.length?`<div class="xp-vo"><small>Dónde está el voto</small><p>${D.VO.map(v=>`<b>${esc(v.nm)}</b>, ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`ganaría por ${v.mg.toFixed(0)} pts`:`perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts`}`).join('. ')}.</p></div>`:''}
    <p class="xp-ft"><b>${D.enc?'Con encuesta capturada, sin candidatos:':'Sin encuesta ni candidatos:'}</b> muestra hacia dónde van las tendencias con los resultados oficiales, no el resultado de 2027. Detalle en la página 2.</p></section>`;
  const p2=`<section class="xp xp-p2"><div class="xp-hd2"><span>${esc(EST)} · ${esc(pn)} · Proyección 2027</span><span>2 / 2</span></div><h2>${esc(D.h1)}</h2>
    <div class="xp-g">${D.C.map(c=>{const t=exTx(c),k=exK(c.p); return `<div class="xp-c"><header><b>${EXN[c.T]}</b><em class="ex-p ${t.pk}">${t.pl}</em></header><div class="xp-big"><b>${k}</b><span>de cada 10 escenarios ${t.what}</span></div>${exDots(k)}<p><strong>${esc(t.hoy)}.</strong> Sola: ${esc(t.sola)}.</p><footer>Rival: ${esc(c.riv)}${t.tr?' · '+t.tr:''}</footer></div>`;}).join('')}</div>
    ${A?`<div class="xp-c"><b>Resultados posibles si va en alianza</b>${A.html}</div>`:''}
    ${SE?`<div class="xp-c"><b>Qué hacer en las ${fmt(SE.n)} secciones (${EXN[D.ref.T].toLowerCase()})</b><div class="xp-q"><div><b>${fmt(SE.c.dis)}</b><span>por disputar: perdería por menos de 10 pts</span></div><div><b>${fmt(SE.c.cui)}</b><span>por defender: ganaría por menos de 10 pts</span></div><div><b>${fmt(SE.c.seg)}</b><span>por conservar: ventaja de 10 pts o más</span></div></div></div>`:''}
    ${D.VO&&D.VO.length?`<div class="xp-c"><b>Dónde está el voto</b><p>${D.VO.map(v=>`${esc(v.nm)}, ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`<span class="up">ganaría por ${v.mg.toFixed(0)} pts</span>`:`<span class="dn">perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts</span>`}`).join('. ')}.</p></div>`:''}
    <div class="xp-k"><small>La clave</small><p>${esc(cl)}</p></div>
    <p class="xp-ft2">Estimación con resultados oficiales por sección${D.enc?' y la encuesta capturada':', sin encuesta'}. Las cifras son aproximadas: lo que podría pasar si se mantienen las tendencias, no un pronóstico cerrado.</p></section>`;
  return [cover,p2];}
/* el PDF se arma en cuanto se abre la vista, para que al tocar el botón se comparta al instante: el celular solo deja
   abrir el menú de compartir (WhatsApp) justo después del toque, no varios segundos después */
let EXPDF=null;
const exCanShare=()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File([new Blob(['x'],{type:'application/pdf'})],'x.pdf',{type:'application/pdf'})]}));}catch(e){return false;}};
async function exPDFBlob(D){if(!window.jspdf||!window.html2canvas) throw new Error('sin librerías');
  const host=document.createElement('div'); host.className='xp-host'; host.innerHTML=exPDFPages(D).join(''); document.body.appendChild(host);
  try{await (document.fonts?document.fonts.ready:Promise.resolve()); const {jsPDF}=window.jspdf,W=794,H=1123,doc=new jsPDF({orientation:'portrait',unit:'px',format:[W,H],hotfixes:['px_scaling'],compress:true}); const pg=[...host.children];
    for(let j=0;j<pg.length;j++){const cv=await html2canvas(pg[j],{scale:2,width:W,height:H,backgroundColor:j?'#F4F6F6':'#1E2A2A',logging:false}); if(j) doc.addPage([W,H],'portrait'); doc.addImage(cv.toDataURL('image/jpeg',.88),'JPEG',0,0,W,H);}
    return {blob:doc.output('blob'),name:('Resumen_'+norm(EST)+'_'+D.p+'_2027').replace(/[^\w]+/g,'_')+'.pdf'};}
  finally{host.remove();}}
function exPrep(){const D=EXD,key=M0.cab+'|'+D.p; if(EXPDF&&EXPDF.key===key) return EXPDF.pr; const pr=exPDFBlob(D).catch(e=>{console.error(e); return null;}); EXPDF={key,pr}; return pr;}
async function exPDF(btn){if(!EXD) return; const o=btn.innerHTML; const ready=EXPDF&&EXPDF.key===M0.cab+'|'+EXD.p&&EXPDF.done;
  if(!ready){btn.disabled=true; btn.textContent='Preparando…';}
  try{const r=await exPrep(); if(!r){toast('No se pudo generar el PDF. Recarga la página.'); return;}
    const f=new File([r.blob],r.name,{type:'application/pdf'});
    if(exCanShare()){try{await navigator.share({files:[f],title:'Proyección 2027 · '+EST,text:EST+' · '+exPN(EXD.p)+': '+EXD.h1});}
      catch(e){if(e&&e.name==='NotAllowedError'){btn.disabled=false; btn.innerHTML='Tocar para compartir'; return;} if(!(e&&e.name==='AbortError')) await saveFile(r.name,r.blob);}}
    else await saveFile(r.name,r.blob);}
  finally{btn.disabled=false; if(btn.textContent==='Preparando…') btn.innerHTML=o;}}
/* ---------- abrir / cerrar ---------- */
function exRender(){const w=$('exe'); if(!w) return; w.innerHTML='<div class="ex-wait">Calculando…</div>';
  setTimeout(()=>{try{EXD=exData(); w.innerHTML=exHTML(EXD);}catch(e){console.error(e); w.innerHTML='<div class="ex-wait">No se pudo armar la vista ejecutiva de este estado.</div>'; return;}
    w.querySelectorAll('[data-exp]').forEach(b=>b.onclick=()=>{st.party=b.dataset.exp; $('party').value=st.party; st.es.al=null; st.es.seg=null; if($('rPa')) $('rPa').setAttribute('aria-pressed',true); exRender(); render(true);});
    w.querySelectorAll('[data-excab]').forEach(b=>b.onclick=()=>{if(b.dataset.excab===M0.cab) return; try{sessionStorage.setItem('lab_exe','1'); if(st.party) sessionStorage.setItem('lab_exe_p',st.party);}catch(e){} location.hash=b.dataset.excab; location.reload();});
    $('exx').onclick=exClose; $('expdf').onclick=()=>exPDF($('expdf')); if(exCanShare()) $('expdf').lastChild.textContent='Compartir por WhatsApp'; setTimeout(()=>{const pr=exPrep(); pr.then(()=>{if(EXPDF) EXPDF.done=true;});},400);
    $('exgo').onclick=()=>{const T=EXD.ref?EXD.ref.T:null; if(!st.party){st.party=EXD.p; $('party').value=st.party;} exClose(); if(T) st.es.obj=T; setView2('est');};},30);}
function exOpen(){let w=$('exe'); if(!w){w=document.createElement('div'); w.id='exe'; w.className='exe'; w.setAttribute('role','region'); w.setAttribute('aria-label','Vista ejecutiva'); document.querySelector('.main').appendChild(w);}
  if(!st.party){const p=exParty(); if(p){st.party=p; $('party').value=p;}} document.body.classList.add('exview'); if($('rEx')) $('rEx').setAttribute('aria-pressed',true); try{sessionStorage.setItem('lab_exe','1');}catch(e){} exRender();}
function exClose(){const w=$('exe'); if(w) w.remove(); document.body.classList.remove('exview'); if($('rEx')) $('rEx').setAttribute('aria-pressed',false); try{sessionStorage.removeItem('lab_exe');}catch(e){} render(true);}
(()=>{const r=document.querySelector('.rail #rIn'); if(r&&!$('rEx')){const b=document.createElement('button'); b.className='ri'; b.id='rEx'; b.setAttribute('aria-pressed','false'); b.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/></svg><b>Vista ejecutiva</b>'; r.after(b); b.onclick=()=>$('exe')?exClose():exOpen();}
  const c=$('presb'); if(c&&!$('exb')){const b=document.createElement('button'); b.className='presb'; b.id='exb'; b.title='El estado del partido en una sola pantalla, con PDF para WhatsApp'; b.innerHTML='<svg viewBox="0 0 16 16"><rect x="1.5" y="2" width="5.5" height="5" rx="1"/><rect x="9" y="2" width="5.5" height="5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5" rx="1"/><rect x="9" y="9" width="5.5" height="5" rx="1"/></svg>Vista ejecutiva'; c.before(b); b.onclick=exOpen;}
  let pv=null; try{pv=sessionStorage.getItem('lab_exe_p'); sessionStorage.removeItem('lab_exe_p');}catch(e){} if(pv&&EPARTIES.includes(pv)){st.party=pv; if($('party')) $('party').value=pv;}
  let on=false; try{on=sessionStorage.getItem('lab_exe')==='1';}catch(e){} if(on) setTimeout(exOpen,60);})();
/* ---------- presentación de la Estrategia: el botón "Presentación" la arma cuando estás en la Estrategia con un partido elegido ----------
   Material para una reunión de trabajo: lo mismo que la vista ejecutiva más el detalle territorial (dónde se gana o se pierde y cuántos votos). */
async function esDeck(){const D=exData(); EXD=D; const pn=exPN(D.p),AC=C[D.p]||'#1C7F79',N=[],TOT=6+D.C.length,date=D.date;
  const tag=`<span style="margin-left:14px;font:700 12px Inter,Arial;color:#8A4A12;background:#FDEEE5;border-radius:999px;padding:5px 11px;white-space:nowrap">Estimación 2027 · ${D.enc?'con encuesta':'sin encuesta'}</span>`;
  const head=(t,sub)=>`<header class="sl-h"><div><h2>${t}</h2>${sub?`<p>${sub}</p>`:''}</div><span class="sl-pg">${esc(EST)} · ${esc(pn)}${tag}<b>${N.length+1}</b></span></header>`;
  const foot=`<footer class="sl-f"><span>Laboratorio Político</span><span>Estimación con resultados oficiales por sección 2015–2024${D.enc?' y la encuesta capturada':', sin encuesta ni candidatos'}: muestra hacia dónde van las tendencias, no el resultado de 2027.</span></footer>`;
  const slide=(h,body)=>N.push(`<section class="sl" style="--ac:${AC}">${h}<div class="sl-b">${body}</div>${foot}</section>`);
  const K=(v,l,sub)=>`<div class="sl-k"><b>${v}</b><span>${l}</span>${sub?`<em>${sub}</em>`:''}</div>`;
  const dots=k=>`<span style="display:inline-flex;gap:3px;vertical-align:middle">${Array.from({length:10},(_,j)=>`<i style="width:10px;height:10px;border-radius:50%;background:${j<k?'#1C7F79':'#E3E8E8'}"></i>`).join('')}</span>`;
  /* 1 · portada */
  N.push(`<section class="sl sl-cover" style="--ac:${AC}"><div class="sl-cv"><span class="sl-dot"></span><small>${esc(EST)} · Estrategia 2027</small><h1>${esc(pn)}</h1><p>${esc(D.h1)}</p>
    <dl><div><dt>Elección</dt><dd>6 de junio de 2027 · faltan ${exDias()} días</dd></div><div><dt>Base</dt><dd>${D.enc?'Resultados oficiales y encuesta':'Resultados oficiales, sin encuesta'}</dd></div><div><dt>Fecha</dt><dd>${esc(date)}</dd></div></dl></div><footer class="sl-f"><span>Laboratorio Político</span><span>Las cifras son estimaciones: lo que podría pasar si se mantienen las tendencias.</span></footer></section>`);
  /* 2 · cómo llegaría y qué lo decide (sin repetir el detalle de cada cargo, que va en las siguientes) */
  slide(head('Cómo llegaría a 2027 y qué lo decide',esc(D.h1)),`<div class="sl-kr" style="grid-template-columns:repeat(${D.C.length},minmax(0,1fr))">${D.C.map(c=>{const t=exTx(c),k=exK(c.p); return K(`${k}<small style="font-size:18px;color:#8A9393"> de 10</small>`,`${EXN[c.T]}: escenarios en que ${t.what}`,`${esc(t.hoy)} · ${t.pl}`);}).join('')}</div>
    <ul class="sl-pts" style="grid-template-columns:1fr"><li><b>${esc(exClave(D))}</b></li>${D.CL.length?`<li>Se decide en ${D.CL.map(x=>`<b>${esc(x.nm)}</b>`).join(', ')}: ${D.CL.length>1?(D.CL.length===3?'los tres':'los dos'):'está'} en casi empate.</li>`:''}
    ${D.VO&&D.VO.length?`<li>${D.VO.map(v=>`<b>${esc(v.nm)}</b> tiene el ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`ganaría por ${v.mg.toFixed(0)} pts`:`perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts`}`).join('; ')}.</li>`:''}</ul>`);
  /* 3 · un cargo por diapositiva: lugares más cerrados */
  D.C.forEach(c=>{const t=exTx(c),k=exK(c.p),U=c.R.U.slice();
    if(c.T==='GOB'){const VO=exWith('GOB',[D.p],()=>{const G={}; ALL.forEach(i=>{(G[S[i].m]||(G[S[i].m]=[])).push(i);}); const P=eP(),tot=ALL.reduce((a,i)=>a+(P[i]?P[i].V:0),0)||1; return Object.entries(G).map(([m,ii])=>{const d=eDuel27(ii,[D.p]),V=ii.reduce((a,i)=>a+(P[i]?P[i].V:0),0); return {nm:MUN[m],sh:100*V/tot,mg:d?d.mg:null,rv:d?d.rvN:'—',gap:d?d.gap:0};}).sort((a,b)=>b.sh-a.sh).slice(0,10);});
      slide(head('Gubernatura',`${esc(t.hoy)} · sola: ${esc(t.sola)} · ${k} de cada 10 escenarios gana`),`<div class="sl-g2"><div><h3>Dónde está el voto <small>los 10 municipios con más votos esperados</small></h3><table class="sl-t"><thead><tr><th>Municipio</th><th class="r">% del voto</th><th class="r">Diferencia</th><th class="r">Votos</th></tr></thead><tbody>${VO.map(v=>`<tr><td>${esc(v.nm)}</td><td class="r">${pct(v.sh,0)}</td><td class="r ${v.mg>=0?'up':'dn'}">${v.mg==null?'—':Math.abs(v.mg)<.05?'empate':(v.mg>=0?'+':'−')+Math.abs(v.mg).toFixed(1)+' pts'}</td><td class="r">${v.mg==null?'—':v.gap>0?'le faltarían '+fmt(v.gap):'ventaja de '+fmt(-v.gap)}</td></tr>`).join('')}</tbody></table></div>
        <div><h3>Lectura</h3><p class="sl-note">${c.m>=0?`Iría adelante por <b>${c.m.toFixed(1)} puntos</b> contra ${esc(c.riv)}.`:`Iría atrás por <b>${Math.abs(c.m).toFixed(1)} puntos</b> contra ${esc(c.riv)}.`} En <b>${k} de cada 10</b> escenarios simulados ganaría. ${(()=>{const mt=pjMeta(c.R.U[0]); return mt?`Para llegar a 7 de cada 10 le harían falta unos <b>${fmt(mt.nuevos)} votos</b> más (o ganarle ${fmt(mt.quitados)} votantes al rival).`:'Ya tendría 7 o más de cada 10 escenarios a favor: lo decisivo es no perder votos.';})()}</p>
        ${D.A&&D.A.res.GOB?`<p class="sl-note">${D.A.cols.map((al,j)=>{const x=D.A.res.GOB[j]; return x?`${j?'Con '+al.slice(1).map(exPN).join(' y '):'Sola'}: <b>${(x.m>=0?'+':'−')+Math.abs(x.m).toFixed(1)} pts</b>`:'';}).filter(Boolean).join(' · ')}.</p>`:''}</div></div>`);
      return;}
    const lv=c.T==='AYU'?'Municipio':c.T==='DIPL'?'Distrito local':'Distrito federal',close=U.filter(u=>Math.abs(u.m)<10).sort((a,b)=>Math.abs(a.m)-Math.abs(b.m)).slice(0,c.T==='DIPL'?8:12);
    const row=u=>{const v=Math.round(Math.abs(u.m)/100*u.V); return `<tr><td>${esc(pjName(c.T,u.k))}</td><td class="r ${u.m>=0?'up':'dn'}">${Math.abs(u.m)<.05?'empate':(u.m>=0?'+':'−')+Math.abs(u.m).toFixed(1)+' pts'}</td><td class="r">${u.m>=0?'ventaja de '+fmt(v):'le faltarían '+fmt(v)}</td><td class="r">${dots(exK(u.p))}</td></tr>`;};
    slide(head(EXN[c.T],`${esc(t.hoy)} · sola: ${esc(t.sola)} · ${k} de cada 10 escenarios ${t.what}`),`<div class="sl-kr k3">${K(c.lead+' de '+c.n,'iría adelante','mayoría con '+c.half)}${K(c.R.cat.seg+c.R.cat.pro,'probables o seguros','7 o más de cada 10 escenarios')}${K(c.R.cat.com,'en disputa','entre 4 y 6 de cada 10')}</div>
      ${c.T==='DIPL'&&c.seats!=null?`<p class="sl-note" style="margin:10px 0 0">${(()=>{const B=c.B,bl=B?B.blk:[],o=B?B.x.out:{},mr=bl.reduce((t,m)=>t+((o[m]||{}).mr||0),0),rp=bl.reduce((t,m)=>t+((o[m]||{}).rp||0),0),cl=U.filter(u=>u.m>=0&&u.p<.65).length;
  return `Iría adelante en <b>${c.lead} de ${c.n} distritos</b>${cl?`, pero en ${cl} de ellos tendría 6 o menos de cada 10 escenarios a favor`:''}. En el escenario central ganaría <b>${mr} distritos y ${rp} ${rp===1?'plurinominal':'plurinominales'}: ${c.seats} de ${c.NT}</b>${c.seats<c.hm?`, le faltarían ${c.hm-c.seats} para la mayoría`:''}.${rp===0&&mr>0&&B&&B.NT?' La ley limita a cada partido a 8 puntos por encima de su votación, por eso no le tocarían plurinominales.':''}`;})()}</p>`:''}<h3>Los más cerrados <small>diferencia estimada contra el rival más fuerte · votos que separan</small></h3>${close.length?`<table class="sl-t"><thead><tr><th>${lv}</th><th class="r">Diferencia</th><th class="r">Votos</th><th class="r">Escenarios a favor</th></tr></thead><tbody>${close.map(row).join('')}</tbody></table>`:'<p class="sl-note">Ningún lugar está a menos de 10 puntos: los resultados se ven definidos.</p>'}`);});
  /* 4 · alianzas */
  if(D.A&&D.A.cols.length>1){const names=D.A.cols.map((al,j)=>j?'Con '+al.slice(1).map(exPN).join(' y '):'Sola');
    slide(head('Resultados posibles si va en alianza','Lugares donde iría adelante (gubernatura: diferencia en puntos). Los aliados aportan el rendimiento que mostraron cuando fueron juntos.'),`<table class="sl-t" style="font-size:17px"><thead><tr><th></th>${names.map(n=>`<th class="r">${esc(n)}</th>`).join('')}</tr></thead><tbody>${Object.entries(D.A.res).map(([T,v])=>`<tr><td>${EXC[T]}</td>${v.map((x,j)=>{const b=v[0]; const s=!x?'—':T==='GOB'?(x.m>=0?'+':'−')+Math.abs(x.m).toFixed(1)+' pts':x.lead+' de '+x.n; const up=j&&x&&b&&(T==='GOB'?x.m>b.m+.5:x.lead>b.lead); return `<td class="r${up?' up':''}">${s}</td>`;}).join('')}</tr>`).join('')}</tbody></table>
      <p class="sl-note">${(()=>{const j=D.A.cols.length-1,g=Object.entries(D.A.res).map(([T,v])=>T==='GOB'?null:(v[j]&&v[0]?v[j].lead-v[0].lead:0)).filter(x=>x!=null).reduce((a,b)=>a+b,0); return g>0?`Con todos sus aliados sumaría <b>${g} lugares más</b> donde iría adelante.`:'Las alianzas casi no cambian el resultado.';})()}</p>`);}
  /* 5 · secciones */
  const ref=D.ref,E=ref?exWith(ref.T,[D.p],()=>eSecs()):null;
  if(E&&E.L){const SE=D.SE,cat=[['dis','Disputar','perdería por menos de 10 pts: aquí se gana o se pierde','#F46883'],['cui','Defender','ganaría por menos de 10 pts: que no se voltee','#93D6D0'],['seg','Conservar','ganaría por 10 pts o más','#1C7F79'],['dif','Contener','perdería por más de 10 pts','#D3DADA']];
    const lvn=ref.T==='AYU'?'':ref.T==='DIPL'?'Distrito local ':'Distrito federal ',CTb=Object.values(E.CT||{}).filter(c=>c.d&&c.d.gap>0).sort((a,b)=>a.d.gap-b.d.gap).slice(0,2);
    const RR=exWith(ref.T,[D.p],()=>CTb.map(c=>({c,R:pjRuta(c.ii,[D.p],c.d.gap)})));
    slide(head(`Qué hacer en las ${fmt(SE.n)} secciones`,`${EXN[ref.T]} · cada sección contra el rival más fuerte de su ${ref.T==='DIPL'?'distrito':ref.T==='AYU'?'municipio':'territorio'}`),`<div class="sl-g2"><div><div class="sl-cats">${cat.map(([k,t,s,c])=>`<div style="--c:${c}"><b>${fmt(SE.c[k]||0)}</b><span class="t">${t}</span><span>${s}</span></div>`).join('')}</div>
      <div class="sl-stk">${cat.map(([k,,,c])=>`<i style="flex:${SE.c[k]||0};background:${c}"></i>`).join('')}</div></div>
      <div><h3>Dónde conseguir los votos que faltan <small>los ${CTb.length===1?'lugar':'lugares'} donde iría atrás por menos · votos que ya tuvo ahí y hoy no tendría</small></h3>${RR.length?RR.map(({c,R})=>{const nm=ref.T==='AYU'?(MUN[c.k]||c.k):lvn+c.k,rows=R.rows.slice(0,Math.min(CTb.length>1?3:8,Math.max(1,R.holg?R.nr:R.alcanza?R.n:R.rows.length)));
        return `<p class="sl-note" style="margin:8px 0 4px"><b>${esc(nm)}</b>: le faltarían ${fmt(c.d.gap)} votos. ${!R.rows.length?'No tiene votos propios que recuperar: tendrían que salir de votantes del rival o de una alianza.':R.holg?`Le alcanzaría aun recuperando 1 de cada 3 votos, en ${R.nr} ${R.nr===1?'sección':'secciones'}${R.nr>rows.length?` (aquí las ${rows.length} primeras)`:''}.`:R.alcanza?`Le alcanzaría con ${R.n} ${R.n===1?'sección':'secciones'} solo si recupera casi todo: es difícil${R.n>rows.length?` (aquí las ${rows.length} primeras)`:''}.`:`No le alcanzaría: como máximo juntaría ${fmt(Math.round(R.tot))}; el resto tendría que salir de votantes del rival o de una alianza.`}</p>${rows.length?`<table class="sl-t"><thead><tr><th>Sección</th><th>Municipio</th><th>Qué hacer</th><th class="r">Votos posibles</th><th class="r">Acumulado</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${S[x.i].s}</td><td>${esc(MUN[S[x.i].m]||'')}</td><td>${x.tipo==='mov'?'Movilizar':'Recuperar'}</td><td class="r">${fmt(Math.round(x.pot))}</td><td class="r">${fmt(Math.round(x.acc))}</td></tr>`).join('')}</tbody></table>`:''}`;}).join(''):'<p class="sl-note">Va adelante en todos los lugares: no hay votos que juntar, lo importante es defender.</p>'}</div></div>`);}
  return N;}
