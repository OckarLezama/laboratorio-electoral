/* ===== Proyección 2027 con resultados históricos =====
   Votación por sección: la misma de la Estrategia (pipeline/proyeccion.py), agregada por unidad con la votación esperada;
   incertidumbre validada en pipeline/modelo.py (data/modelo.json): probabilidad de ganar calibrada con los errores reales al estimar 2021 y 2024, y rango
   por simulación con un componente común a todo el estado y otro local. La proyección es del cargo consultado. */
const PJT={AYU:'mun',DIPL:'dl',DIPF:'df',GOB:'est'},PJN={AYU:M0.cab==='cdmx'?['alcaldía','alcaldías']:['ayuntamiento','ayuntamientos'],DIPL:['distrito local','distritos locales'],DIPF:['distrito federal','distritos federales'],GOB:['gubernatura','gubernatura']};
const pjCycle=y=>[2015,2021,2027].includes(+y)?'mid':[2018,2024].includes(+y)?'pres':'off';
const PJC={};
if(!st.pj) st.pj={s:0};
const pjOK=()=>typeof MODELO!=='undefined'&&MODELO&&MODELO.sigma&&typeof eP==='function';
function pjType(){if(!st.elec) return null; const t=st.elec.split('_')[0]; return pjOK()&&PJT[t]&&lastOf(t)&&MODELO.a[t]?t:null;}
/* proporción esperada por sección y partido para el cargo T en 2027: el MISMO cálculo de la Estrategia (eP, incluida la
   encuesta si se capturó), para que la tarjeta y la Estrategia nunca den números distintos */
/* participación por sección observada en un año (promedio de sus elecciones) */
const PJTY={}; function pjTpY(y){if(PJTY[y]) return PJTY[y]; const ks=Object.keys(D.E).filter(k=>+D.E[k].year===y),o=new Float64Array(N); for(let i=0;i<N;i++){let t=0,l=0; ks.forEach(k=>{const r=row(k,i); if(r&&r.ln){t+=r.t; l+=r.ln;}}); o[i]=l?t/l:NaN;} return PJTY[y]=o;}
function pjBase(T){const tpy=st.pjTp||0,pk=T+'|'+JSON.stringify((st.es.poll||{})[T]||null)+'|'+tpy; if(PJC[pk]) return PJC[pk]; const out=eP(T),P=D.P8,pr=new Array(N),w=new Float64Array(N),tp=new Float64Array(N),TY_=tpy?pjTpY(tpy):null;
  for(let i=0;i<N;i++){const x=out[i]; if(!x||!x.V){pr[i]=null; continue;} pr[i]=P.map(p=>(x.pv[p]||0)/x.V); const f=TY_&&!isNaN(TY_[i])&&x.tp>0?TY_[i]*100/x.tp:1; w[i]=x.V*f; tp[i]=x.tp/100*f;}
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
     (desviaciones medidas al estimar 2021 y 2024); gana la unidad quien queda arriba. Así una fuerza en tercer lugar
     necesita superar a las dos primeras, no solo a una. */
  const sc=((MODELO.sigma[T]||{}).comun||10)/Math.SQRT2,sl=((MODELO.sigma[T]||{}).local||15)/Math.SQRT2,nb=BL.length;
  U.forEach(u=>{const s100=u.s.map(x=>100*x),oth=s100.reduce((a,x,j)=>a+(j===fi?0:x),0)||1; u.e=s100.map((x,j)=>j===fi?x+sh:x-sh*x/oth); const riv=Math.max(...u.e.filter((_,j)=>j!==fi)); u.m=u.e[fi]-riv; u.w=0;});
  /* el error medido es el del margen entre los dos primeros: a los partidos menores se les aplica en proporción a su tamaño */
  U.forEach(u=>{const sd=u.e.slice().sort((a,b)=>b-a)[1]||1; u.g=u.e.map(x=>Math.max(0,Math.min(1,x/sd)));});
  const R=NS||2000,wins=new Int16Array(R); let seed=7; const rn=()=>{seed=(seed*16807)%2147483647; return seed/2147483647;},gs=()=>{let a=0,b=0; while(!a) a=rn(); while(!b) b=rn(); return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b);};
  const cb=new Float64Array(nb),WB=Array.from({length:nb},()=>new Int16Array(R)); U.forEach(u=>u.wb=new Int32Array(nb));
  for(let r=0;r<R;r++){for(let j=0;j<nb;j++) cb[j]=gs()*sc; let n=0;
    U.forEach(u=>{let best=-1e9,bj=-1; for(let j=0;j<nb;j++){const v=u.e[j]+u.g[j]*(cb[j]+gs()*sl); if(v>best){best=v; bj=j;}} u.wb[bj]++; WB[bj][r]++; if(bj===fi){u.w++; n++;}}); wins[r]=n;}
  /* calibración: lo que la simulación dice contra lo que pasó en 2021 y 2024 (tabla de data/modelo.json) */
  const CT=(MODELO.cal_sim_t||{})[T],CS=(CT&&CT.length>=4?CT:(T!=='AYU'&&MODELO.cal_sim_m&&MODELO.cal_sim_m.length>=4?MODELO.cal_sim_m:(MODELO.cal_sim||[]))).map(x=>x.slice()).sort((a,b)=>a[0]-b[0]); /* tabla del mismo cargo si hay suficientes casos */ for(let k=1;k<CS.length;k++) if(CS[k][1]<CS[k-1][1]) CS[k][1]=CS[k-1][1];
  const cal=x=>{if(!CS.length) return x; if(x<=CS[0][0]) return Math.max(0,CS[0][1]*x/CS[0][0]); if(x>=CS[CS.length-1][0]) return CS[CS.length-1][1]+(1-CS[CS.length-1][1])*(x-CS[CS.length-1][0])/(1-CS[CS.length-1][0]); for(let k=1;k<CS.length;k++) if(x<=CS[k][0]){const a=CS[k-1],b=CS[k],t=(x-a[0])/(b[0]-a[0]); return a[1]+t*(b[1]-a[1]);} return x;};
  U.forEach(u=>{const c=Array.from(u.wb,w=>cal(w/R)),t=c.reduce((a,b)=>a+b,0)||1; u.pn=c.map(x=>x/t);}); /* calibrada y normalizada: en cada lugar las probabilidades suman 1, así los totales suman el número de lugares */
  U.forEach(u=>{u.p=u.pn[fi]; u.lead=u.m>=0?fi:u.e.indexOf(Math.max(...u.e.filter((_,j)=>j!==fi)));});
  const expC=U.reduce((a,u)=>a+u.p,0),expR=Array.from(wins).reduce((a,b)=>a+b,0)/R,dl=expC-expR,sw=Array.from(wins).map(x=>Math.max(0,Math.min(U.length,x+dl))).sort((a,b)=>a-b),q=f=>Math.round(sw[Math.min(R-1,Math.floor(f*R))]),half=Math.floor(U.length/2)+1;
  const all=ii.length===ALL.length,sdS=(all?sc:Math.hypot(sc,sl/Math.sqrt(U.length)))*1.28;
  const UL=U.filter(u=>u.ea),last={y:D.E[LE].year,n:UL.filter(u=>u.ea.indexOf(Math.max(...u.ea))===fi).length,of:UL.length,v:UL.length===1?100*UL[0].ea[fi]:null,m:UL.length===1?100*(UL[0].ea[fi]-Math.max(...UL[0].ea.filter((_,j)=>j!==fi))):null};
  /* panorama de todas las fuerzas (sin partido elegido): lo más probable, rango y probabilidad de mayoría de cada una */
  const pano=BL.map((ms,j)=>{const lk=U.filter(u=>u.e.indexOf(Math.max(...u.e))===j).length,ex=U.reduce((a,u)=>a+u.pn[j],0),raw=Array.from(WB[j]).reduce((a,b)=>a+b,0)/R,d=ex-raw,w=Array.from(WB[j]).map(x=>Math.max(0,Math.min(U.length,x+d))).sort((a,b)=>a-b),qq=f=>Math.round(w[Math.min(R-1,Math.floor(f*R))]);
    return {ms,j,lk,exp:ex,lo:qq(.1),hi:qq(.9),pM:U.length===1?null:w.filter(x=>Math.round(x)>=half).length/R,lead:U.filter(u=>u.e.indexOf(Math.max(...u.e))===j).length,p1:U.length===1?U[0].pn[j]:null,share:100*tot[j]};}).sort((a,b)=>b.exp-a.exp||b.share-a.share);
  return {T,BL,fi,U,tot,sh,sig,n:U.length,last,pano,likely:(()=>{const lead=U.filter(u=>u.e.indexOf(Math.max(...u.e))===fi).length,lo=q(.1),hi=q(.9); return lead>=lo&&lead<=hi?lead:Math.round(expC);})(),lead:U.filter(u=>u.e.indexOf(Math.max(...u.e))===fi).length,exp:expC,lo:q(.1),hi:q(.9),half,pMaj:U.length===1?U[0].p:sw.filter(x=>Math.round(x)>=half).length/R,share:tot[fi]*100+sh,band:sdS,
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
/* tarjeta del panel: resumen corto; el detalle se abre en una ventana ("Ver detalle") */
const pjTag=T=>pjEnc(T)?((st.es.poll[T]||{}).mid?'escenario: intermedia como 2021':(st.es.poll[T]||{}).of?'ajustada con '+((st.es.poll[T].of.n>1)?'el promedio de '+st.es.poll[T].of.n+' encuestas':'1 encuesta'):'ajustada con tu encuesta'):'solo resultados históricos · sin encuesta';
const pjPct=x=>Math.round(x*100)+' %';
function pjBar(R){const pos=x=>(100*x/Math.max(1,R.n)).toFixed(1)+'%'; return `<div class="pjrg"><i class="tr"></i><i class="bd" style="left:${pos(R.lo)};width:calc(${pos(R.hi)} - ${pos(R.lo)})"></i><i class="mj" style="left:${pos(R.half-.5)}"><span>mayoría ${R.half}</span></i><i class="pt" style="left:${pos(R.exp)}"></i><span class="ax" style="left:0">0</span><span class="ax" style="left:${pos(R.lo)}">${R.lo}</span><span class="ax" style="left:${pos(R.hi)}">${R.hi}</span><span class="ax" style="left:100%">${R.n}</span></div>`;}
function pjPanoRows(R,n){const NN=PJN[R.T],multi=R.n>1; return `<div class="pjpan">${R.pano.slice(0,n).filter(x=>multi?x.lk>0||x.exp>=1:x.p1>=.005).map(x=>`<div><span><i style="background:${pjCol(x.ms)}"></i>${esc(pjBN(x.ms))}</span>${multi?`<b>${x.lk>=x.lo&&x.lk<=x.hi?x.lk:Math.round(x.exp)}</b><em>entre ${x.lo} y ${x.hi}${x.lk>=x.lo&&x.lk<=x.hi?'':` · adelante en ${x.lk}`}</em><small>${x.pM!=null?'mayoría '+pjPct(x.pM):''}</small>`:`<b>${pjPct(x.p1)}</b><em>${x.share.toFixed(1)} % de los votos</em><small></small>`}</div>`).join('')}</div>`;}
function pjCard(ctx,ii0,inner){const T=pjType(); if(!T) return ''; const ii=ii0||(ctx?ctx.idx:scope()),p=st.party,R=pjRun(T,ii,p,0); if(!R||R.none) return '';
  const NN=PJN[T],fb=R.BL[R.fi],col=p?pjCol(fb):'#1C7F79',multi=R.n>1;
  const tit=`Proyección ${TY[T]} 2027`,sub=p?pjBN(fb):'todas las fuerzas';
  const hd2=ctx?ctx.hd('proy',tit,esc(sub)):`<h4 class="pjh">${tit} <small>${esc(sub)}</small></h4>`;
  let body;
  if(!p) body=`${pjPanoRows(R,4)}<p class="pjs pjref">${multi?`Cuántos ${NN[1]} ganaría cada fuerza según la proyección, y su rango probable.`:'Probabilidad de ganar de cada fuerza.'} Elige un partido para ver su detalle.</p>`;
  else if(multi) body=`<div class="pjbig"><b>${R.likely}</b><span>de ${R.n} ${NN[1]} · ${R.likely===R.lead?'según la proyección':'lo esperable'}</span></div>${pjBar(R)}
   <div class="pjs">Lo más probable: <b>${R.likely}</b>, en un rango de <b>${R.lo} a ${R.hi}</b>.</div>
   <div class="pjpm"><span>Probabilidad de ganar la mayoría de ${NN[1]}</span><b>${pjPct(R.pMaj)}</b></div>`;
  else body=`<div class="pjbig"><b>${pjPct(R.U[0].p)}</b><span>probabilidad de ganar</span></div><div class="pjs">Votación más probable: <b>${R.share.toFixed(1)} %</b> (entre ${Math.max(0,R.share-R.band).toFixed(0)} y ${(R.share+R.band).toFixed(0)} %) · diferencia ${R.U[0].m>=0?'+':'−'}${Math.abs(R.U[0].m).toFixed(1)} pts</div>`;
  return `<div class="${inner?'pjc pjin':'cd pjc'}" style="--pc:${col}">${hd2}<span class="pjtag">${pjTag(T)}</span>${body}
   <button class="pjdet" data-pjdet="${inner?'in':'card'}">Abrir proyección completa ›</button>${ctx?ctx.ft('INE 2015–2024; proyección propia probada contra 2021 y 2024'):''}</div>`;}
/* tabla con las primeras k filas y un botón para ver todas */
/* ¿Dónde conseguir los votos que faltan? Votos recuperables por sección = su mejor votación en esa sección desde 2018 en
   cualquier elección (votos del partido, o de sus aliados juntos en la misma elección, entre la lista nominal de entonces,
   aplicado a la lista de hoy y sin pasar de la participación más alta) menos lo que tendría en 2027. Se ordenan de más a menos y se suman hasta cubrir lo que falta.
   Movilizar: la mayor parte viene de que hoy vota menos gente que en su mejor elección; recuperar: de electores que ya
   votaron por el partido y hoy irían con otro. Si ni recuperando todo alcanza, el resto tendría que quitárselo al rival. */
const PJTE=Object.keys(D.E).filter(k=>+D.E[k].year>=2018);
function pjTecho(i,A){let best=-1; PJTE.forEach(ek=>{const r=row(ek,i); if(!r||!r.ln) return; let v=0; A.forEach(m=>v+=r.v[m]||0); if(v/r.ln>best) best=v/r.ln;}); return best;}
/* Cuánto de esos votos se recupera de verdad: probado con los 32 estados, calculando lo recuperable con datos hasta 2021
   y viendo lo que cada partido ganó en 2024 (diputaciones locales, ayuntamientos y federales): se recuperó 1 de cada 3. */
const PJREC=1/3;
/* ¿Dónde quitarle votos al rival? Por sección, los votos que el rival tendría en 2027 por encima de su voto duro (lo mínimo
   que ha sacado ahí desde 2018, como proporción de la lista nominal): son votantes que no siempre votan por él. Se ordenan
   de más a menos y se suman hasta cubrir los votantes que habría que convencer. "Ha cambiado de ganador": la sección
   cambió de partido ganador en al menos 2 cargos entre las dos últimas elecciones; ahí la gente sí cambia su voto.
   Probado con los 32 estados: de los votos no duros que cada partido tuvo en 2021, en 2024 se fue 3 de cada 10. */
function pjSoft(i,RV){const x=eP()[i]; if(!x||!x.V) return null; const ln=x.ln||S[i].ln||0,DU=V2.duro||{}; if(!ln) return null; const rv=sv(x.pv,RV); let du=0,ok=false; RV.forEach(m=>{const t=DU[m]&&DU[m][i]; if(t!=null){du+=t/100*ln; ok=true;}}); return ok?Math.max(0,rv-Math.min(du,rv)):null;}
function pjQuita(ii,RV,need){const P=eP(),DU=V2.duro||{},out=[]; let tot=0;
  ii.forEach(i=>{const x=P[i]; if(!x||!x.V) return; const ln=x.ln||S[i].ln||0; if(!ln) return; const rv=sv(x.pv,RV); let du=0,ok=false;
    RV.forEach(m=>{const t=DU[m]&&DU[m][i]; if(t!=null){du+=t/100*ln; ok=true;}}); if(!ok) return; const soft=rv-Math.min(du,rv); if(soft<1) return;
    out.push({i,soft,sw:!!SW[i]}); tot+=soft;});
  out.sort((a,b)=>b.soft-a.soft); let acc=0,n=0,n1=0; out.forEach(r=>{acc+=r.soft; r.acc=acc; if((acc-r.soft)*PJREC<need) n++; if(acc-r.soft<need) n1++;});
  /* n: secciones para juntarlos convenciendo a 1 de cada 3 (lo que suele moverse: en 2024 cambió de partido 3 de cada 10 de estos votos) */
  return {rows:out,tot,n:tot*PJREC>=need?n:n1,alcanza:tot*PJREC>=need,posible:tot>=need};}
function pjVer(RU,G,me,rv,p){const n=RU.n,sec=n===1?'una sección':n+' secciones',pp=p!=null?` Hoy tendría ${pjPct(p)} de probabilidad de ganar.`:'';
  if(!RU.rows.length) return `<b>No tiene votos propios que recuperar:</b> en todas las secciones ya tendría al menos su mejor votación. Los <b>${fmt(G)}</b> votos que le faltan tendrían que salir de votantes de ${rv} que cambien a ${me} (unos ${fmt(Math.round(G/2))}: cada uno le quita un voto a ${rv} y le suma uno a ${me}) o de una alianza.${pp}`;
  if(RU.holg){const m=RU.nr===1?'una sección':RU.nr+' secciones'; return `<b>Le alcanzaría.</b> Aun recuperando solo 1 de cada 3 de estos votos, como suele pasar, juntaría los <b>${fmt(G)}</b> que le faltan en ${m}.${pp}`;}
  const real=Math.round(RU.tot*PJREC),fal=G-real;
  if(RU.alcanza) return `<b>Le alcanzaría solo si recupera casi todo.</b> Con ${sec} juntaría los <b>${fmt(G)}</b> votos que le faltan, pero normalmente se recupera 1 de cada 3 de estos votos (unos ${fmt(real)}). El resto, unos <b>${fmt(fal)}</b>, tendría que quitárselos a ${rv}: abajo, dónde.${pp}`;
  return `<b>No le alcanzaría con sus votos de antes.</b> Recuperando todo en las ${RU.rows.length} secciones juntaría como máximo <b>${fmt(Math.round(RU.tot))}</b> de los <b>${fmt(G)}</b> que le faltan, y normalmente se recupera 1 de cada 3 (unos ${fmt(real)}). El resto, unos <b>${fmt(fal)}</b>, tendría que salir de convencer a unos <b>${fmt(Math.ceil(fal/2))}</b> votantes de ${rv} (cada uno le quita un voto a ${rv} y le suma uno a ${me}) o de una alianza: abajo, dónde.${p!=null&&p<.15?` <b>Con los datos de hoy, es muy poco probable que lo logre</b> (${pjPct(p)} de probabilidad de ganar).`:pp}`;}
function pjRuta(ii,A,G){const P=eP(),out=[]; let tot=0;
  ii.forEach(i=>{const x=P[i]; if(!x||!x.V) return; const ln=x.ln||S[i].ln||0; if(!ln) return; const mine=sv(x.pv,A),mx=(V2.maxT[i]||x.tp)/100*ln;
    const tb=pjTecho(i,A); if(tb<0) return; const te=Math.min(tb*ln,mx);
    const pot=te-mine; if(pot<1) return; const mov=Math.max(0,((V2.maxT[i]||0)-x.tp)/100*ln)*Math.min(1,mine/(x.V||1));
    out.push({i,pot,tipo:mov>=pot*.5?'mov':'rec'}); tot+=pot;});
  out.sort((a,b)=>b.pot-a.pot); let acc=0,n=0,nr=0; out.forEach(r=>{acc+=r.pot; r.acc=acc; if(G>0&&acc-r.pot<G) n++; if(G>0&&(acc-r.pot)*PJREC<G) nr++;});
  /* n: secciones si recupera todo; nr: si recupera 1 de cada 3, como suele pasar */
  const holg=G>0&&tot*PJREC>=G; return {rows:out,tot,n:G>0?n:0,nr:holg?nr:0,holg,alcanza:G<=0||tot>=G};}
function pjTbl(h,rows,k,lbl){k=k||5; const tr=(r,i)=>`<tr${i>=k?' class="x"':''}>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`; return `<div class="pjtw"><table class="cgtb"><thead><tr>${h.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(tr).join('')}</tbody></table>${rows.length>k?`<button class="pjmore" data-more="1" data-n="${rows.length}" data-l="${lbl||'secciones'}">Ver las ${rows.length} ${lbl||'secciones'}</button>`:''}</div>`;}
/* ventana de detalle de la proyección: responde ¿cuántos gana?, ¿dónde se decide? y ¿qué necesita? */
const pjShort=(T,k)=>pjName(T,k).split(' · ')[0].replace(/^Distrito local /,'DL ').replace(/^Distrito federal /,'DF ');
function pjStrip(R,col,party){const NN=PJN[R.T],U=R.U.slice();
  const cc=u=>{if(!party){const j=u.pn.indexOf(Math.max(...u.pn)),q=u.pn[j]; return {c:pjCol(R.BL[j]),o:q>=.85?1:q>=.65?.7:.45,t:`${pjBN(R.BL[j])} · ${pjPct(q)}`};}
    const q=u.p; return {c:q>=.85?col:q>=.65?mix(col,.5):q>.35?'#F5A47C':'#D5DDDD',o:1,t:`${pjPct(q)} de ganar`};};
  if(party) U.sort((a,b)=>b.p-a.p); else U.sort((a,b)=>{const ja=a.pn.indexOf(Math.max(...a.pn)),jb=b.pn.indexOf(Math.max(...b.pn)); return R.pano.findIndex(x=>x.j===ja)-R.pano.findIndex(x=>x.j===jb)||Math.max(...b.pn)-Math.max(...a.pn);});
  const big=U.length>60;
  return `<div class="pjst${big?' sm':''}">${U.map((u,n)=>{const x=cc(u); return `${party&&n===R.half?'<s class="mk"><b>Mayoría · '+R.half+'</b></s>':''}<i style="background:${x.c};opacity:${x.o}" data-tip="${esc(`<b>${pjName(R.T,u.k)}</b>${x.t}`)}"></i>`;}).join('')}</div>`;}
function pjDetalle(ii,tab){const T=pjType(); if(!T) return; const p=st.party,R=pjRun(T,ii,p,0); if(!R||R.none) return; const NN=PJN[T],fb=R.BL[R.fi],col=p?pjCol(fb):'#1C7F79',multi=R.n>1;
  const hasCg=T==='DIPL'&&ii.length===ALL.length&&typeof congTab==='function'&&typeof RPN==='function'&&RPN().rp>0;
  st.pjTab=hasCg&&(tab||st.pjTab)==='cg'?'cg':'d';
  let L='',Rt='';
  if(st.pjTab==='cg'){const c=congTab(); L=c[0]; Rt=c[1];}
  else if(!p&&multi){L=`<h4>¿Cuántos ganaría cada fuerza?</h4>${pjPanoRows(R,8)}`;
    Rt=`<h4>¿Quién ganaría dónde?</h4>${pjStrip(R,col,false)}<div class="pjlg"><span>Cada cuadro es un ${NN[0]}, con el color de quien lo ganaría; más claro, menos seguro.</span></div>`;}
  else if(multi){const jj=R.U.filter(u=>u.p>.2&&u.p<.7&&pjMeta(u,R.sig.a,T)).sort((a,b)=>Math.abs(a.p-.5)-Math.abs(b.p-.5)).slice(0,8),pos=x=>(100*x/R.n).toFixed(1)+'%';
    L=`<h4>¿Cuántos ${NN[1]} ganaría?</h4><div class="pjbig"><b>${R.likely}</b><span>de ${R.n} · ${R.likely===R.lead?'según la proyección':'lo esperable'}</span></div>${R.likely!==R.lead?`<p class="pjsub" style="margin-top:6px">Va adelante en ${R.lead}, pero muchos por poco; con lo que suele acertar la proyección en ${NN[1]}, lo esperable es ${R.likely}.</p>`:''}
     <div class="pjr3"><i class="t"></i><i class="b" style="left:${pos(R.lo)};width:calc(${pos(R.hi)} - ${pos(R.lo)})"></i><i class="m mk" style="left:${pos(R.half-.5)}"><b>Mayoría · ${R.half}</b></i><i class="p" style="left:${pos(R.likely)}"></i></div>
     <div class="pjax"><span>0</span><span>${R.n}</span></div>
     <div class="pj3"><div><span>Rango probable</span><b>${R.lo} a ${R.hi}</b></div>${hasCg?'':`<div><span>Probabilidad de mayoría</span><b>${pjPct(R.pMaj)}</b></div>`}</div>
     ${(()=>{const yrs=[...new Set(Object.values(D.E).map(e=>+e.year))].filter(y=>y>=2021).sort(),opt=[[0,'La esperada']].concat(yrs.map(y=>[y,`Como en ${y}${[2015,2021,2027].includes(y)?' (intermedia)':[2018,2024].includes(y)?' (presidencial)':''}`])),tw=R.U.reduce((a,u)=>a+u.V,0); return `<div class="pjtp"><span>Si vota tanta gente como…</span><div class="pj-tabs">${opt.map(([y,l])=>`<button data-pjtp="${y}" class="${(st.pjTp||0)===y?'on':''}">${l}</button>`).join('')}</div></div>`;})()}
     <h4>¿Dónde se decide?</h4>${pjStrip(R,col,true)}
     <div class="pjlg"><span><i style="background:${col}"></i>${R.cat.seg} seguros</span><span><i style="background:${mix(col,.5)}"></i>${R.cat.pro} probables</span><span><i style="background:#F5A47C"></i>${R.cat.com} en juego</span><span><i style="background:#D5DDDD"></i>${R.cat.con} en contra</span></div>`;
    const cl=R.U.map(u=>({u,v:u.m/100*u.V})).sort((a,b)=>Math.abs(a.v)-Math.abs(b.v));
    Rt=`<h4>Los ${NN[1]} más cerrados</h4><p class="pjsub">Donde pocos votos cambiarían el resultado. Toca uno para ir a su estrategia, con sus secciones.</p>
     <div class="pjtw"><div class="pjcl">${cl.map(({u,v},ix)=>`<button class="${ix>=8?'x':''}" data-dl="${u.k}" data-lv="${T==='DIPL'?'dl':T==='DIPF'?'df':T==='AYU'?'mun':''}" ${T==='GOB'?'disabled':''}><b>${esc(pjShort(T,u.k))}</b><span class="${v>=0?'w':'l'}">${Math.abs(v)<100?(v>=0?'ganaría por menos de 100 votos':'perdería por menos de 100 votos'):(v>=0?'ganaría':'perdería')+' por aprox. '+fmt(Math.round(Math.abs(v)/10)*10)+' votos'}</span><em data-tip="Probabilidad de ganarlo: ${pjPct(u.p)}">${u.p>=.4&&u.p<=.6?'casi empate':u.p>.6?'probable':u.p>=.25?'posible':'difícil'}</em></button>`).join('')}</div>${cl.length>8?`<button class="pjmore" data-more="1" data-n="${cl.length}" data-l="${NN[1]}">Ver los ${cl.length} ${NN[1]}</button>`:''}</div>`;}
  else {const pn=R.pano,u=R.U[0]; let mt=p?pjMeta(u,R.sig.a,T):null; if(p&&typeof eDuel27==='function'&&typeof eSegOf==='function'){const d=eDuel27(ii,eAlly()); if(d){const f=Math.round(eSegOf(d))+1-Math.round(d.mine); mt=f>0?{nuevos:f,quitados:Math.round(f/2)}:null;}}
    L=`<h4>${p?'¿Ganaría?':'¿Quién ganaría?'}</h4>${p?`<div class="pjbig"><b>${pjPct(u.p)}</b><span>probabilidad de ganar</span></div>`:''}
     <div class="pjvs">${pn.filter(x=>x.share>=1).slice(0,6).map(x=>{const lo=Math.max(0,x.share-R.band),hi=x.share+R.band,mx=Math.min(100,Math.max(...pn.map(y=>y.share))+R.band+5); return `<div><span><i style="background:${pjCol(x.ms)}"></i>${esc(pjBN(x.ms))}</span><div class="vb"><u style="left:${(100*lo/mx).toFixed(1)}%;width:${(100*(hi-lo)/mx).toFixed(1)}%;background:${pjCol(x.ms)}"></u><s style="left:${(100*x.share/mx).toFixed(1)}%;background:${pjCol(x.ms)}"></s></div><b>${x.share.toFixed(1)} %</b><em>${pjPct(x.p1)}</em></div>`;}).join('')}</div>
     <div class="pjlg"><span>Votación más probable · la franja es su rango · a la derecha, probabilidad de ganar</span></div>`;
    if(p){const E=typeof eSecs==='function'?eSecs():null,A=typeof eAlly==='function'?eAlly():null,d=A&&typeof eDuel27==='function'?eDuel27(ii,A):null,me=A?esc(eSide(A)):'';
      let mt='';
      if(d){const mn=Math.round(d.riv?d.riv.votes:0)+1,sg=Math.round(eSegOf(d))+1,es=Math.round(d.mine),row=(t,v,sb)=>`<div class="pjgo"><div><b>${t}</b><small>${sb}</small></div><div><b>${fmt(v)}</b><em class="${es>=v?'ok':'no'}">${es>=v?'ya los tendría':'le faltarían '+fmt(v-es)}</em></div></div>`;
        mt=`<div class="pjnow">Hoy tendría unos <b>${fmt(Math.round(es/100)*100)}</b> votos; ${esc(d.rvN)}, unos <b>${fmt(Math.round((d.riv?d.riv.votes:0)/100)*100)}</b>.</div>${row('Para ganar',mn,'un voto más que '+esc(d.rvN))}${row('Para 70 % de probabilidad',sg,'una ventaja más segura')}`;}
      const oneM=new Set(ii.map(i=>S[i].m)).size===1,T5=(h,rows,k)=>oneM?pjTbl(h.filter((_,j)=>j!==1),rows.map(r=>r.filter((_,j)=>j!==1)),k):pjTbl(h,rows,k); /* un solo municipio: la columna Municipio sobra */
      const secN=i=>String(S[i].s),munN=i=>MUN[S[i].m]||'',G=d?Math.round(d.riv?d.riv.votes:0)+1-Math.round(d.mine):0,RU=A&&d?pjRuta(ii,A,G):null;
      let dn='';
      if(RU&&G>0){const rows=RU.rows.slice(0,Math.max(RU.holg?RU.nr:RU.alcanza?RU.n:RU.rows.length,1)),rv=esc(d.rvN);
        dn=`<h4>¿Dónde conseguirlos?</h4><div class="pjver">${pjVer(RU,G,me,rv,u.p)}</div>${RU.rows.length?`
        <p class="pjsub">Secciones donde ${me} ya sacó más votos que los que tendría hoy, de más a menos. <b>Movilizar</b>: que vuelvan a votar quienes ya votaron por ${me}; hoy votaría menos gente que antes. <b>Recuperar</b>: convencer otra vez a quienes votaron por ${me} y hoy votarían por otro.</p>
        ${T5(['Sección','Municipio','Qué hacer','Votos posibles','Acumulado'],rows.map(x=>[secN(x.i),esc(munN(x.i)),x.tipo==='mov'?'Movilizar':'Recuperar',fmt(Math.round(x.pot)),fmt(Math.round(x.acc))]),6)}`:''}`;
        const rest=Math.round(G-(RU.rows.length?RU.tot*PJREC:0)); if(rest>0&&d.riv){ /* lo que faltaría si recupera 1 de cada 3 de sus votos de antes */const need=Math.ceil(rest/2),Q=pjQuita(ii,d.riv.members,need);
          if(Q.rows.length){const qr=Q.rows.slice(0,Math.max(Q.alcanza||Q.posible?Q.n:Q.rows.length,1));
            dn+=`<h4 style="margin-top:16px">¿Dónde quitarle votos a ${rv}?</h4><div class="pjver">${Q.alcanza?`<b>Sería posible.</b> En ${Q.n===1?'una sección':`estas ${Q.n} secciones`} ${rv} tendría unos <b>${fmt(Math.round(Q.rows[Q.n-1].acc))}</b> votos de gente que no siempre vota por ${rv}. Si ${me} convence a 1 de cada 3, como suele moverse este voto, juntaría los <b>${fmt(need)}</b> votantes que necesita.`:Q.posible?`<b>Solo convenciendo a casi todos.</b> ${rv} tendría unos <b>${fmt(Math.round(Q.tot))}</b> votos de gente que no siempre vota por ${rv} y ${me} necesitaría <b>${fmt(need)}</b>; normalmente se mueve 1 de cada 3. Es muy difícil sin alianza.`:`<b>No hay suficientes.</b> Aun sumando todas las secciones, ${rv} tendría unos <b>${fmt(Math.round(Q.tot))}</b> votos de gente que no siempre vota por ${rv}, y ${me} necesitaría convencer a <b>${fmt(need)}</b>. Sin alianza no le alcanzaría.`}</div>
            <p class="pjsub">Secciones donde ${rv} tendría más votos por encima de su voto duro (lo mínimo que ha sacado ahí), de más a menos. <b>Cambia de ganador</b>: la sección ha cambiado de partido ganador entre elecciones; ahí la gente sí cambia su voto.</p>
            ${T5(['Sección','Municipio','Cambia de ganador','Votos que no son duros','Acumulado'],qr.map(x=>[secN(x.i),esc(munN(x.i)),x.sw?'Sí':'',fmt(Math.round(x.soft)),fmt(Math.round(x.acc))]),6)}`;}
          else dn+=`<h4 style="margin-top:16px">¿Dónde quitarle votos a ${rv}?</h4><div class="pjver"><b>No hay de dónde.</b> En todas las secciones ${rv} tendría solo su voto duro, el que siempre tiene. Sin alianza no le alcanzaría.</div>`;}}
      else if(G<=0){const pot=E?ii.map(i=>E.by[i]).filter(x=>x&&x.mine>x.rv&&x.mg<10).sort((a,b)=>a.mg-b.mg):[];
        dn=pot.length?`<h4>¿Dónde cuidarlos?</h4><p class="pjsub">Ya tendría los votos para ganar. Secciones donde ganaría por menos de 10 puntos: que no se volteen.</p>${T5(['Sección','Municipio','Ventaja'],pot.map(x=>[secN(x.i),esc(munN(x.i)),fmt(Math.round(x.mine-x.rv))+' votos']),6)}`:'';}
      Rt=`<h4>¿Qué le falta?</h4>${mt}${dn}`;}
    else Rt=`<h4>Para ver metas</h4><p class="pjn">Elige un partido en la Estrategia para ver cuántos votos le faltan y dónde conseguirlos.</p>`;}
  let W=$('pjw'); if(!W){W=document.createElement('div'); W.id='pjw'; W.className='actw pjw'; W.setAttribute('role','dialog'); document.body.appendChild(W);
    W.addEventListener('click',e=>{const tpb=e.target.closest('[data-pjtp]'); if(tpb){st.pjTp=+tpb.dataset.pjtp||0; pjDetalle(W._ii,'d'); return;} if(e.target.closest('[data-secdl]')){secCSV(); return;} const mo=e.target.closest('[data-more]'); if(mo){const w=mo.closest('.pjtw'),on=w.classList.toggle('all'); mo.textContent=on?'Ver menos':`Ver ${mo.dataset.l==='distritos locales'||mo.dataset.l==='distritos federales'||mo.dataset.l==='ayuntamientos'||mo.dataset.l==='municipios'?'los':'las'} ${mo.dataset.n} ${mo.dataset.l}`; return;} const dl=e.target.closest('[data-dl]'); if(dl&&dl.dataset.dl&&!dl.disabled){pjGoDL(dl.dataset.dl,dl.dataset.lv); return;} const tb=e.target.closest('[data-pjtab]'); if(tb){pjDetalle(W._ii,tb.dataset.pjtab); return;} if(e.target===W||e.target.closest('#pjx')){W.classList.remove('on'); document.body.classList.remove('actm');}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&W.classList.contains('on')){W.classList.remove('on'); document.body.classList.remove('actm');}});}
  W._ii=ii; const where=ii.length<ALL.length&&st.es.u!=null&&typeof eName==='function'?eName(eLv(),st.es.u):EST;
  W.innerHTML=`<div class="ac-bx pj-bx" style="--pc:${col}"><div class="pj-top"><div><b>${TY[T]} 2027 · ${esc(p?pjBN(fb):'todas las fuerzas')}</b><span>${esc(where)}</span></div><div class="pj-tr">${hasCg?`<div class="pj-tabs"><button data-pjtab="d" class="${st.pjTab==='d'?'on':''}"><span class="lg">Quién ganaría cada distrito</span><span class="sm">Distritos</span></button><button data-pjtab="cg" class="${st.pjTab==='cg'?'on':''}"><span class="lg">Cómo quedaría el congreso</span><span class="sm">Congreso</span></button></div>`:''}<button class="ac-x" id="pjx" aria-label="Cerrar">✕</button></div></div>
   <div class="pj-g"><div class="pj-c">${L}</div><div class="pj-c">${Rt}</div></div><div class="pj-f"><span>${pjTag(T)} · INE, resultados por sección 2015–2024 · proyección propia</span><span class="pj-fa">${p?'<button data-secdl="1">⤓ Descargar secciones</button>':''}<a href="#" data-met="1">¿Cómo se calcula?</a></span></div></div>`;
  W.classList.add('on'); document.body.classList.add('actm');
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) W.querySelectorAll('.pjbig b,.cgr b').forEach(el=>{const m=el.textContent.match(/^(\d+)/); if(!m) return; const to=+m[1],rest=el.textContent.slice(m[1].length),t0=performance.now(); const f=t=>{const k=Math.min(1,(t-t0)/600),e=1-Math.pow(1-k,3); el.textContent=Math.round(to*e)+rest; if(k<1) requestAnimationFrame(f);}; requestAnimationFrame(f);});}
function pjGoDL(k,lv){lv=lv||'dl'; const W=$('pjw'); if(W){W.classList.remove('on'); document.body.classList.remove('actm');} st.es.lv=lv; st.es.u=+k; applyScope(lv,st.es.u);}
function pjBind(root){if(!root) return; root.querySelectorAll('[data-pjdet]').forEach(b=>b.onclick=()=>{const v=b.dataset.pjdet; pjDetalle(v==='card'?scope():v==='cg'?ALL:eSelII(),v==='cg'?'cg':'d');});}
tarjeta({id:'proy',titulo:'Proyección 2027',resumen:'votos, rango y probabilidad del cargo consultado',icono:'<path d="M3 15 9 9l4 3 7-8" fill="none" stroke="#1C7F79" stroke-width="2.2"/><path d="M20 4v5h-5" fill="none" stroke="#4CC1BA" stroke-width="2.2" stroke-dasharray="2 2"/>',html:ctx=>pjCard(ctx)});
