/* ===== Proyección 2027 con resultados históricos =====
   Votación por sección: la misma de la Estrategia (pipeline/proyeccion.py), agregada por unidad con la votación esperada;
   incertidumbre validada en pipeline/modelo.py (data/modelo.json): probabilidad de ganar calibrada con los errores reales al predecir 2021 y 2024, y rango
   por simulación con un componente común a todo el estado y otro local. La proyección es del cargo consultado. */
const PJT={AYU:'mun',DIPL:'dl',DIPF:'df',GOB:'est'},PJN={AYU:M0.cab==='cdmx'?['alcaldía','alcaldías']:['ayuntamiento','ayuntamientos'],DIPL:['distrito local','distritos locales'],DIPF:['distrito federal','distritos federales'],GOB:['gubernatura','gubernatura']};
const pjCycle=y=>[2015,2021,2027].includes(+y)?'mid':[2018,2024].includes(+y)?'pres':'off';
const PJC={};
if(!st.pj) st.pj={s:0};
const pjOK=()=>typeof MODELO!=='undefined'&&MODELO&&MODELO.sigma&&typeof eP==='function';
function pjType(){if(!st.elec) return null; const t=st.elec.split('_')[0]; return pjOK()&&PJT[t]&&lastOf(t)&&MODELO.a[t]?t:null;}
/* proporción esperada por sección y partido para el cargo T en 2027: el MISMO cálculo de la Estrategia (eP, incluida la
   encuesta si se capturó), para que la tarjeta y la Estrategia nunca den números distintos */
function pjBase(T){const pk=T+'|'+JSON.stringify((st.es.poll||{})[T]||null); if(PJC[pk]) return PJC[pk]; const out=eP(T),P=D.P8,pr=new Array(N),w=new Float64Array(N),tp=new Float64Array(N);
  for(let i=0;i<N;i++){const x=out[i]; if(!x||!x.V){pr[i]=null; continue;} pr[i]=P.map(p=>(x.pv[p]||0)/x.V); w[i]=x.V; tp[i]=x.tp/100;}
  return PJC[pk]={pr,w,tp};}
const pjEnc=T=>{const p=(st.es.poll||{})[T]; return !!(p&&p.v&&Object.values(p.v).some(v=>v!==''&&v!=null));};
/* coaliciones de 2027: las de la elección más reciente del cargo, sin partidos que perdieron el registro */
/* alianzas: las mismas que la Estrategia (la que elegiste para el partido y los rivales por separado o en alianza);
   los aliados aportan el rendimiento medido (r), igual que en la Estrategia */
function pjBlocs(T){if(typeof eGenBl==='function'){const A=st.party&&typeof eAlly==='function'?eAlly():null; return A?[A].concat(eRivBl(A)):eGenBl();} return pjBlocs0(T);}
function pjBlocs0(T){const e=D.E[lastOf(T)],nr=typeof NOREG!=='undefined'?NOREG:[]; return e.blocs.filter(b=>b.lead!=='OTROS').map(b=>b.members.filter(m=>m!=='OTROS'&&!nr.includes(m))).filter(ms=>ms.length);}
const pjSh=(sh,ms)=>{if(typeof sv!=='function') return ms.reduce((a,m)=>a+(sh[D.P8.indexOf(m)]||0),0); const o={}; ms.forEach(m=>o[m]=sh[D.P8.indexOf(m)]||0); return sv(o,ms);};
const pjSig=T=>{const a=MODELO.a[T],tot=1.702/a,sc=Math.min((MODELO.sigma[T]||{}).comun||tot*.5,tot*.95); return {a,tot,sc,sl:Math.sqrt(Math.max(1,tot*tot-sc*sc))};};
function pjKey(T,i){const lv=PJT[T]; return lv==='est'?0:lv==='mun'?S[i].m:lv==='dl'?S[i].dl:S[i].df;}
function pjName(T,k){return T==='GOB'?EST:T==='AYU'?(M0.cab==='cdmx'?'Alcaldía ':'')+MUN[k]:T==='DIPL'?'Distrito local '+k+(CABDL[k]?' · '+CABDL[k]:''):'Distrito federal '+k+(CABDF[k]?' · '+CABDF[k]:'');}
/* proyección completa del cargo T en el territorio ii */
function pjRun(T,ii,party,shift,NS){const B=pjBase(T),BL=pjBlocs(T),G={},sig=pjSig(T),LE=lastOf(T);
  /* solo unidades que eligen por partidos (p. ej. en Oaxaca los municipios por sistemas normativos no tienen resultados) */
  ii.forEach(i=>{const x=B.pr[i]; if(!x||!row(LE,i)) return; const k=pjKey(T,i),g=G[k]||(G[k]={k,w:0,s:BL.map(()=>0)}); g.w+=B.w[i]; BL.forEach((ms,j)=>g.s[j]+=B.w[i]*pjSh(x,ms));
    /* referencia simple: lo que pasó en la última elección del cargo, con las mismas alianzas */ const rr=row(LE,i); if(rr&&rr.val){const sh=D.P8.map(p=>(rr.v[p]||0)/rr.val); g.av=(g.av||0)+rr.val; g.a=g.a||BL.map(()=>0); BL.forEach((ms,j)=>g.a[j]+=rr.val*pjSh(sh,ms));}});
  const U=Object.values(G).filter(g=>g.w>0).map(g=>({k:g.k,V:g.w,s:g.s.map(v=>v/g.w),ea:g.av?g.a.map(v=>v/g.av):null}));
  if(!U.length) return null;
  const tot=BL.map((_,j)=>U.reduce((a,u)=>a+u.s[j]*u.V,0)/U.reduce((a,u)=>a+u.V,0));
  const fi=party?BL.findIndex(ms=>ms.includes(party)):tot.indexOf(Math.max(...tot)); if(fi<0) return {none:true,BL};
  const sh=shift||0;
  /* simulación por bloque: cada coalición recibe un cambio común en todo el estado y uno local por unidad
     (desviaciones medidas al predecir 2021 y 2024); gana la unidad quien queda arriba. Así una fuerza en tercer lugar
     necesita superar a las dos primeras, no solo a una. */
  const sc=((MODELO.sigma[T]||{}).comun||10)/Math.SQRT2,sl=((MODELO.sigma[T]||{}).local||15)/Math.SQRT2,nb=BL.length;
  U.forEach(u=>{const s100=u.s.map(x=>100*x),oth=s100.reduce((a,x,j)=>a+(j===fi?0:x),0)||1; u.e=s100.map((x,j)=>j===fi?x+sh:x-sh*x/oth); const riv=Math.max(...u.e.filter((_,j)=>j!==fi)); u.m=u.e[fi]-riv; u.w=0;});
  const R=NS||2000,wins=new Int16Array(R); let seed=7; const rn=()=>{seed=(seed*16807)%2147483647; return seed/2147483647;},gs=()=>{let a=0,b=0; while(!a) a=rn(); while(!b) b=rn(); return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b);};
  const cb=new Float64Array(nb);
  for(let r=0;r<R;r++){for(let j=0;j<nb;j++) cb[j]=gs()*sc; let n=0;
    U.forEach(u=>{let best=-1e9,bj=-1; for(let j=0;j<nb;j++){const v=u.e[j]+cb[j]+gs()*sl; if(v>best){best=v; bj=j;}} if(bj===fi){u.w++; n++;}}); wins[r]=n;}
  /* calibración: lo que la simulación dice contra lo que pasó en 2021 y 2024 (tabla de data/modelo.json) */
  const CS=(MODELO.cal_sim||[]).slice().sort((a,b)=>a[0]-b[0]); for(let k=1;k<CS.length;k++) if(CS[k][1]<CS[k-1][1]) CS[k][1]=CS[k-1][1];
  const cal=x=>{if(!CS.length) return x; if(x<=CS[0][0]) return Math.max(0,CS[0][1]*x/CS[0][0]); if(x>=CS[CS.length-1][0]) return CS[CS.length-1][1]+(1-CS[CS.length-1][1])*(x-CS[CS.length-1][0])/(1-CS[CS.length-1][0]); for(let k=1;k<CS.length;k++) if(x<=CS[k][0]){const a=CS[k-1],b=CS[k],t=(x-a[0])/(b[0]-a[0]); return a[1]+t*(b[1]-a[1]);} return x;};
  U.forEach(u=>{u.p=cal(u.w/R); u.lead=u.m>=0?fi:u.e.indexOf(Math.max(...u.e.filter((_,j)=>j!==fi)));});
  const expC=U.reduce((a,u)=>a+u.p,0),expR=Array.from(wins).reduce((a,b)=>a+b,0)/R,dl=expC-expR,sw=Array.from(wins).map(x=>Math.max(0,Math.min(U.length,x+dl))).sort((a,b)=>a-b),q=f=>Math.round(sw[Math.min(R-1,Math.floor(f*R))]),half=Math.floor(U.length/2)+1;
  const all=ii.length===ALL.length,sdS=(all?sc:Math.hypot(sc,sl/Math.sqrt(U.length)))*1.28;
  const UL=U.filter(u=>u.ea),last={y:D.E[LE].year,n:UL.filter(u=>u.ea.indexOf(Math.max(...u.ea))===fi).length,of:UL.length,v:UL.length===1?100*UL[0].ea[fi]:null,m:UL.length===1?100*(UL[0].ea[fi]-Math.max(...UL[0].ea.filter((_,j)=>j!==fi))):null};
  return {T,BL,fi,U,tot,sh,sig,n:U.length,last,exp:expC,lo:q(.1),hi:q(.9),half,pMaj:U.length===1?U[0].p:sw.filter(x=>x>=half).length/R,share:tot[fi]*100+sh,band:sdS,
    cat:{seg:U.filter(u=>u.p>=.85).length,pro:U.filter(u=>u.p>=.65&&u.p<.85).length,com:U.filter(u=>u.p>.35&&u.p<.65).length,con:U.filter(u=>u.p<=.35).length}};}
/* votos para llegar a 70 %: margen necesario según la dispersión local del modelo (dos fuerzas punteras) */
const pjMeta=(u,a,T)=>{const sl=((MODELO.sigma[T]||{}).local||15),sc=((MODELO.sigma[T]||{}).comun||10),need=.5244*Math.hypot(sl,sc); if(u.m>=need) return null; const v=(need-u.m)/100*u.V; return {nuevos:Math.round(v),quitados:Math.round(v/2)};};
const pjBN=ms=>ms.map(m=>NM[m]||m).join('-');
const pjCol=ms=>C[ms[0]]||'#1C7F79';
/* proyección por partido para las gráficas de tendencia (territorio idx) */
function pjParties(T,idx){if(!pjOK()||!MODELO.a[T]||!lastOf(T)) return null; const B=pjBase(T),P=D.P8,acc=new Float64Array(P.length); let W=0;
  idx.forEach(i=>{const x=B.pr[i]; if(!x) return; W+=B.w[i]; P.forEach((p,j)=>acc[j]+=B.w[i]*x[j]);}); if(!W) return null;
  const sig=pjSig(T),all=idx.length===ALL.length,sd=(all?sig.sc:Math.hypot(sig.sc,sig.sl/3))/2*1.28,o={};
  P.forEach((p,j)=>{const v=100*acc[j]/W; o[p]={v,lo:Math.max(0,v-sd*Math.sqrt(Math.max(.05,v/50))),hi:v+sd*Math.sqrt(Math.max(.05,v/50))};}); return o;}
/* tarjeta del panel */
function pjCard(ctx,ii0,inner){const T=pjType(); if(!T) return ''; const ii=ii0||(ctx?ctx.idx:scope()),p=st.party,R=pjRun(T,ii,p,st.pj.s); if(!R||R.none) return '';
  const NN=PJN[T],fb=R.BL[R.fi],col=pjCol(fb),vm=(MODELO.estados[M0.cab]||{})[T],multi=R.n>1,pct=x=>Math.round(x*100)+' %';
  const pos=x=>(100*x/Math.max(1,R.n)).toFixed(1)+'%';
  const comp=R.U.slice().sort((a,b)=>Math.abs(a.p-.5)-Math.abs(b.p-.5)).slice(0,multi?5:1);
  const sc=[-5,-3,0,3,5].map(s=>{if(s===R.sh) return {s,e:R.exp,pm:R.pMaj,lo:R.lo,hi:R.hi}; const x=pjRun(T,ii,p,s,600); return {s,e:x.exp,pm:x.pMaj,lo:x.lo,hi:x.hi};});
  const hd2=ctx?ctx.hd('proy',`Proyección ${TY[T]} 2027`,`${esc(pjBN(fb))}`):`<h4 class="pjh">Proyección ${TY[T]} 2027 <small>${esc(pjBN(fb))}</small></h4>`;
  return `<div class="${inner?'pjc pjin':'cd pjc'}" style="--pc:${col}">${hd2}<span class="pjtag">${pjEnc(T)?((st.es.poll[T]||{}).of?'ajustada con '+((st.es.poll[T].of.n>1)?'el promedio de '+st.es.poll[T].of.n+' encuestas':'1 encuesta'):'ajustada con tu encuesta'):'solo resultados históricos · sin encuesta'}</span>
   ${multi?`<div class="pjbig"><b>${Math.round(R.exp)}</b><span>de ${R.n} ${NN[1]}</span></div>
   <div class="pjrg"><i class="tr"></i><i class="bd" style="left:${pos(R.lo)};width:calc(${pos(R.hi)} - ${pos(R.lo)})"></i><i class="mj" style="left:${pos(R.half-.5)}"><span>mayoría ${R.half}</span></i><i class="pt" style="left:${pos(R.exp)}"></i><span class="ax" style="left:0">0</span><span class="ax" style="left:${pos(R.lo)}">${R.lo}</span><span class="ax" style="left:${pos(R.hi)}">${R.hi}</span><span class="ax" style="left:100%">${R.n}</span></div>
   <div class="pjs">Va adelante en <b>${R.U.filter(u=>u.m>=0).length}</b>. Contando el error, lo esperable es <b>${Math.round(R.exp)}</b>, con rango de <b>${R.lo} a ${R.hi}</b> (8 de cada 10 escenarios)</div><div class="pjs pjref">Si se repitiera ${R.last.y}: ${R.last.n} de ${R.last.of}</div>
   <div class="pjpm"><span>Probabilidad de ganar la mayoría de ${NN[1]}</span><b>${pct(R.pMaj)}</b></div>
   <div class="pjcat"><div style="--c:${col}"><b>${R.cat.seg}</b><span>Seguros</span></div><div style="--c:${mix(col,.5)}"><b>${R.cat.pro}</b><span>Probables</span></div><div style="--c:#F5A47C"><b>${R.cat.com}</b><span>Competidos</span></div><div style="--c:#B9C1C1"><b>${R.cat.con}</b><span>En contra</span></div></div>`
   :`<div class="pjbig"><b>${pct(R.U[0].p)}</b><span>probabilidad de ganar</span></div><div class="pjs">Votación esperada: <b>${R.share.toFixed(1)} %</b> (rango ${Math.max(0,R.share-R.band).toFixed(0)}–${(R.share+R.band).toFixed(0)} %) · margen ${R.U[0].m>=0?'+':'−'}${Math.abs(R.U[0].m).toFixed(1)} pts</div>${R.last.v!=null?`<div class="pjs pjref">Si se repitiera ${R.last.y}: ${R.last.v.toFixed(1)} % · ${R.last.m>=0?'ganaría por':'perdería por'} ${Math.abs(R.last.m).toFixed(1)} pts</div>`:''}`}
   <div class="pjsc"><div class="l"><span>¿Y si cambia el voto en todo el estado?</span><b id="pjsv">${R.sh>0?'+':''}${R.sh} pts</b></div><input type="range" id="pjsl" min="-5" max="5" step="1" value="${R.sh}" aria-label="Cambio estatal en puntos">
    <div class="pjst">${sc.map(x=>`<div class="${x.s===R.sh?'on':''}"><b>${multi?Math.round(x.e):pct(x.pm)}</b><span>${x.s>0?'+':''}${x.s} pts</span>${multi?`<em>${pct(x.pm)}</em>`:''}</div>`).join('')}</div></div>
   ${multi?`<h5>${NN[1][0].toUpperCase()+NN[1].slice(1)} más competidos</h5><div class="pjl">${comp.map(u=>{const mt=pjMeta(u,R.sig.a,T); return `<div title="${mt?`Para 70 % de probabilidad: ${fmt(mt.nuevos)} votos nuevos o ${fmt(mt.quitados)} votos ganados al rival`:'Ya supera 70 % de probabilidad'}"><b>${esc(pjName(T,u.k).replace(/^Distrito (local|federal) /,'D'+(T==='DIPL'?'L':'F')+' ').split(' · ')[0])}</b><i style="--p:${(u.p*100).toFixed(0)}%;--c:${col}"></i><span>${pct(u.p)}</span></div>`;}).join('')}</div>`:''}
   ${(()=>{const u=comp[0],mt=u&&pjMeta(u,R.sig.a,T); return mt?`<p class="pjn">Para ganar ${esc(multi?pjName(T,u.k).split(' · ')[0]:'')} con 70 % de probabilidad: <b>${fmt(mt.nuevos)} votos nuevos</b> o <b>${fmt(mt.quitados)}</b> ganados al rival.</p>`:'';})()}
   ${vm&&vm.n>=10?`<p class="pjn">En ${esc(EST)} este modelo acertó al ganador en <b>${vm.acierto} %</b> de ${vm.n} casos al predecir 2021 y 2024${vm.repetir!=null?` (repetir la última elección: ${vm.repetir} %)`:''}. Con una encuesta el rango se cierra.</p>`:''}
   ${ctx?ctx.ft('INE 2015–2024; proyección propia validada con 2021 y 2024'):''}</div>`;}
function pjBind(root){const sl=root&&root.querySelector('#pjsl'); if(!sl) return; sl.oninput=()=>{$('pjsv').textContent=(+sl.value>0?'+':'')+sl.value+' pts';}; sl.onchange=()=>{st.pj.s=+sl.value; render();};}
tarjeta({id:'proy',titulo:'Proyección 2027',resumen:'votos, rango y probabilidad del cargo consultado',icono:'<path d="M3 15 9 9l4 3 7-8" fill="none" stroke="#1C7F79" stroke-width="2.2"/><path d="M20 4v5h-5" fill="none" stroke="#4CC1BA" stroke-width="2.2" stroke-dasharray="2 2"/>',html:ctx=>pjCard(ctx)});
