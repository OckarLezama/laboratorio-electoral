/* ===== Congreso local 2027: mayoría relativa + plurinominales, por escenario =====
   MR: distritos que ganaría cada bloque según la proyección (la misma de la Estrategia y la tarjeta); el escaño se
   atribuye al partido del bloque con más votos proyectados en ese distrito (supuesto: encabeza la candidatura).
   RP: votación estatal proyectada por partido y la regla del estado (meta.rpr, con artículo y fuente; si falta,
   regla general: umbral 3 %, tope de +8 puntos, cociente natural y resto mayor). Escenarios: el bloque del partido
   analizado gana o pierde puntos en todo el estado, igual que el control "¿Y si cambia el voto…?" de la tarjeta. */
const RPR=Object.assign({umbral:CFG.umbral||.03,directa:false,desc:false,max:null,capbase:'estatal'},M0.rpr||{});
const RPN=()=>({mr:RPR.mr||CFG.mr||DLS.length,rp:RPR.rp||CFG.rp||0});
/* reparto de plurinominales con la regla del estado: umbral, curul directa (y si se descuenta lo usado en ella),
   cociente y resto mayor, máximo por partido, tope de +8 puntos (sobre la votación de partidos con derecho o sobre
   la emitida, según el estado) y corrección de subrepresentación (−8 puntos). Probado contra las legislaturas 2024. */
function rpAsigna(V,MR){const {mr:NMR,rp:NRP}=RPN(),NT=NMR+NRP,ps=Object.keys(V).filter(p=>p!=='OTROS'&&p!=='IND'),tot=ps.reduce((a,p)=>a+V[p],0)||1;
  const q=ps.filter(p=>V[p]/tot>=RPR.umbral).sort((a,b)=>V[b]-V[a]),te=q.reduce((a,p)=>a+V[p],0)||1,sh=p=>V[p]/(RPR.capbase==='total'?tot:te),rp={},used={},dir={}; q.forEach(p=>{rp[p]=0; used[p]=0; dir[p]=0;});
  const cap=p=>Math.min(RPR.max||NT,Math.floor((sh(p)+.08)*NT)),room=p=>cap(p)-(MR[p]||0)-(rp[p]||0); let left=NRP;
  if(RPR.directa) q.forEach(p=>{if(left>0&&room(p)>0){rp[p]++; dir[p]=1; left--; if(RPR.desc) used[p]=RPR.umbral*tot;}});
  /* Chihuahua: rondas por porcentaje (una curul por cada escalón de votación) y después una a una por orden de votación */
  if(RPR.rondas){const vs=p=>V[p]/tot; RPR.rondas.forEach((t,j)=>{if(j===0&&RPR.directa) return; q.forEach(p=>{if(left>0&&vs(p)>t&&room(p)>0){rp[p]++; left--;}});}); let g2=0; while(left>0&&g2++<40){let any=false; q.forEach(p=>{if(left>0&&room(p)>0){rp[p]++; left--; any=true;}}); if(!any) break;}}
  let el=q.filter(p=>room(p)>0),g=0;
  while(left>0&&el.length&&g++<60){const vq=el.reduce((a,p)=>a+V[p]-used[p],0)||1,nb=left,rs=el.map(p=>{const e=nb*(V[p]-used[p])/vq,f=Math.floor(e); return [p,f,e-f];});
    rs.forEach(([p,f])=>{const n=Math.min(f,room(p)); rp[p]+=n; left-=n;});
    rs.sort((a,b)=>b[2]-a[2]).forEach(([p])=>{if(left>0&&room(p)>0){rp[p]++; left--;}});
    el=el.filter(p=>room(p)>0);}
  const seat=p=>(MR[p]||0)+(rp[p]||0);
  for(let k=0;k<20;k++){const bajo=q.filter(p=>seat(p)/NT<sh(p)-.08&&seat(p)<(RPR.max||NT)); if(!bajo.length) break; const u=bajo.sort((a,b)=>(seat(a)/NT-sh(a))-(seat(b)/NT-sh(b)))[0],don=q.filter(p=>p!==u&&rp[p]>(RPR.quitaDirecta?0:dir[p])&&(seat(p)-1)/NT>=sh(p)-.08); if(!don.length) break; const o=don.sort((a,b)=>(seat(b)/NT-sh(b))-(seat(a)/NT-sh(a)))[0]; rp[o]--; rp[u]++;}
  const out={}; new Set(Object.keys(MR).concat(Object.keys(rp))).forEach(p=>{const t=(MR[p]||0)+(rp[p]||0); if(t) out[p]={mr:MR[p]||0,rp:rp[p]||0,t,v:100*(V[p]||0)/tot};}); const caps={}; q.forEach(p=>caps[p]=cap(p)); return {out,NT,left,caps,q};}
let CSIG=null;
function congSig(){if(CSIG) return CSIG; CSIG={}; if(typeof GAN==='undefined'||!GAN) return CSIG; let y=0; GAN.r.forEach(r=>{if(GAN.c[r[2]]==='Diputación local'&&r[7]&&r[7][0]==='dl'&&!(r.length>9)&&r[1]>y) y=r[1];});
  GAN.r.forEach(r=>{if(GAN.c[r[2]]==='Diputación local'&&r[7]&&r[7][0]==='dl'&&r[1]===y&&r[4]) CSIG[r[7][1]]=r[4];}); return CSIG;}
/* un escenario: cambio de s puntos para el bloque del partido p (o del primero si no hay partido) */
function cong27(p,s){const T='DIPL'; if(!D.E[lastOf(T)]) return null; const R=pjRun(T,ALL,p,s,400); if(!R||R.none) return null;
  const P=eP(T),dv={},tot={}; ALL.forEach(i=>{const x=P[i]; if(!x) return; const d=S[i].dl,o=dv[d]||(dv[d]={}); for(const q in x.pv){o[q]=(o[q]||0)+x.pv[q]; tot[q]=(tot[q]||0)+x.pv[q];}});
  /* a qué partido se cuenta el distrito: al que lo tuvo en la última elección (siglado del registro de ganadores) si va
     en la alianza ganadora; si no, al partido de la alianza con más votos proyectados en ese distrito */
  const SIG=congSig(),MR={},won=[]; R.U.forEach(u=>{const j=u.e.indexOf(Math.max(...u.e)),ms=R.BL[j]; if(j===R.fi) won.push(u.k); const o=dv[u.k]||{},sg=SIG[u.k],w=sg&&ms.includes(sg)?sg:ms.slice().sort((a,b)=>(o[b]||0)-(o[a]||0))[0]; if(w) MR[w]=(MR[w]||0)+1;});
  /* votación estatal por partido con el mismo cambio: el bloque sube s puntos repartidos entre sus partidos; los demás bajan en proporción */
  const all=Object.values(tot).reduce((a,b)=>a+b,0)||1,blk=R.BL[R.fi],bv=blk.reduce((a,q)=>a+(tot[q]||0),0),ov=all-bv,V={};
  for(const q in tot){V[q]=blk.includes(q)?tot[q]*(1+(bv?s/100*all/bv:0)):tot[q]*(1-(ov?s/100*all/ov:0)); if(V[q]<0) V[q]=0;}
  return Object.assign(rpAsigna(V,MR),{blk,s,V,MR,all,won,U:R.U,fi:R.fi,bv,tvx:all-(tot.OTROS||0)-(tot.IND||0)});}
/* plurinominales de un partido y qué le faltaría para una más. Se le suman votos (quitándolos a los demás en proporción)
   de 0.1 en 0.1 puntos, con los mismos distritos de mayoría, y se vuelve a aplicar la regla del estado. Si el partido ya
   está en su límite (tope de sobrerrepresentación o máximo por partido), se dice cuál y qué lo movería. */
function congNext(q,x){if(!x||!x.V||x.V[q]==null) return null; const all=x.all||Object.values(x.V).reduce((a,b)=>a+b,0)||1,o=x.out[q]||{mr:0,rp:0,t:0},ps=Object.keys(x.V).filter(k=>k!=='OTROS'&&k!=='IND'),tv=ps.reduce((a,k)=>a+x.V[k],0)||1,sh=x.V[q]/tv;
  const cap=x.caps?x.caps[q]:null,lim=cap!=null&&o.t>=cap?(RPR.max&&cap>=RPR.max?'max':'tope'):null;
  const add=d=>{const V={},rest=all-x.V[q],ad=d/100*all; for(const k in x.V) V[k]=k===q?x.V[q]+ad:x.V[k]*Math.max(0,(rest-ad)/rest); return rpAsigna(V,x.MR);};
  let d1=null; for(let d=.1;d<=12.001;d+=.1){const r=add(d); if(((r.out[q]||{}).t||0)>o.t){d1=d; break;}}
  return {o,sh,cap,lim,umb:sh<RPR.umbral,d:d1,votos:d1!=null?d1/100*all:null};}
/* ruta a la mayoría: cuántos puntos estatales tendría que ganar (o puede perder) el bloque del partido para llegar
   (o quedarse) con la mayoría, contando distritos y plurinominales con la regla del estado */
const CRUTA={};
function congRuta(p){const k=(p||'')+'|'+JSON.stringify((st.es.poll||{}).DIPL||null)+'|'+(typeof eAlly==='function'&&p?eAlly().join('+'):'')+'|'+(typeof eRv==='function'?eRv():''); if(CRUTA[k]!==undefined) return CRUTA[k];
  const x0=cong27(p,0); if(!x0) return CRUTA[k]=null; const half=Math.floor(x0.NT/2)+1,tb=x=>x.blk.reduce((a,m)=>a+((x.out[m]||{}).t||0),0),t0=tb(x0); let r=null;
  if(t0>=half){for(let s=-.5;s>=-15;s-=.5){const x=cong27(p,s); if(x&&tb(x)<half){r={keep:true,s:-s-.5,t0,half,votos:(-s-.5)/100*x0.all}; break;}} if(!r) r={keep:true,s:15,t0,half,votos:.15*x0.all};}
  else {for(let s=.5;s<=15;s+=.5){const x=cong27(p,s); if(x&&tb(x)>=half){const mr=x.blk.reduce((a,m)=>a+((x.out[m]||{}).mr||0),0),nw=x.won.filter(k=>!x0.won.includes(k)),donde=x0.U.filter(u=>nw.includes(u.k)).map(u=>({k:u.k,gap:Math.max(0,(Math.max(...u.e.filter((_,j)=>j!==x0.fi))-u.e[x0.fi])/100*u.V)})).sort((a,b)=>a.gap-b.gap); r={keep:false,s,t0,half,votos:s/100*x0.all,mr,rp:tb(x)-mr,donde,de:100*x0.bv/x0.tvx,a:100*(x0.bv+s/100*x0.all)/x0.tvx}; break;}} if(!r) r={keep:false,s:null,t0,half};}
  if(r&&!r.keep&&r.s!=null&&r.donde){const q=p&&x0.blk.includes(p)?p:x0.blk[0],MR2=Object.assign({},x0.MR); MR2[q]=(MR2[q]||0)+r.donde.length;
    const bt=o=>x0.blk.reduce((a,m)=>a+((o.out[m]||{}).t||0),0),rest=x0.all-x0.V[q],give=d=>{const V={},ad=d/100*x0.all; for(const m in x0.V) V[m]=m===q?x0.V[q]+ad:x0.V[m]*Math.max(0,(rest-ad)/rest); return rpAsigna(V,MR2);};
    let d=null; for(let t=0;t<=r.s+3.001;t+=.05){if(bt(give(t))>=half){d=+t.toFixed(2); break;}}
    const tv=x0.tvx; r.plan=d==null?null:{d,votos:d/100*x0.all,de:100*x0.V[q]/tv,a:100*(x0.V[q]+d/100*x0.all)/tv,q,cap:(give(0).caps||{})[q]};}
  return CRUTA[k]=r;}
/* congreso: tarjeta corta en el panel (número, barra, probabilidad y qué le falta) y pestaña "Congreso" de la ventana */
/* El congreso se muestra con el escenario central de la simulación (no ganando todos los distritos donde va adelante,
   que exagera cuando hay muchos cerrados). La ruta (qué le falta) sigue saliendo del cálculo por distrito. */
function congBase(){const p=st.party,x0=cong27(p,0); if(!x0) return null; const pr=congProb(p),x=pr&&pr.medOut?Object.assign({},x0,{out:pr.medOut}):x0;
  const NT=x.NT,half=Math.floor(NT/2)+1,blk=x.blk,bn=blk.map(m=>NM[m]||m).join('-'),tb=blk.reduce((a,m)=>a+((x.out[m]||{}).t||0),0),t0=blk.reduce((a,m)=>a+((x0.out[m]||{}).t||0),0);
  const ord=Object.keys(x.out).sort((a,b)=>(blk.includes(b)-blk.includes(a))||x.out[b].t-x.out[a].t); return {p,x,x0,t0,NT,half,blk,bn,tb,ord,pr,rt:congRuta(p)};}
const congVotos=v=>fmt(Math.round(v/100)*100);
function congNeed(B,short){const rt=B.rt; if(!rt) return '';
  /* va adelante en suficientes distritos, pero en el escenario central no le alcanza: muchos son cerrados */
  if(rt.keep&&B.tb<B.half){const U=B.x0.U||[],fi=B.x0.fi,cl=U.filter(u=>u.e.indexOf(Math.max(...u.e))===fi).map(u=>({k:u.k,m:u.e[fi]-Math.max(...u.e.filter((_,j)=>j!==fi))})).sort((a,b)=>a.m-b.m).slice(0,2).map(d=>esc(pjShort('DIPL',d.k)));
    return `Va adelante en los distritos suficientes, pero varios son cerrados: lograría la mayoría en ${Math.round(100*(B.pr?B.pr.pM:0))} de cada 100 escenarios. Lo decisivo: retener ${cl.join(' y ')}.`;}
  if(!rt.keep&&B.tb>=B.half) return `En el escenario central alcanzaría la mayoría, pero justa: la lograría en ${Math.round(100*(B.pr?B.pr.pM:0))} de cada 100 escenarios.`;
  if(rt.keep) return rt.s>=15?'Mantiene la mayoría aun perdiendo 15 puntos.':`Mantiene la mayoría mientras no pierda más de <b>${rt.s.toFixed(1)} puntos</b> (unos ${congVotos(rt.votos)} votos).`;
  if(rt.s==null) return 'Ni con 15 puntos más llegaría a la mayoría.'; const nd=(rt.donde||[]).length,dd=(rt.donde||[]).slice(0,2).map(d=>esc(pjShort('DIPL',d.k))),pl=rt.plan;
  const ps=pl&&pl.d>0?`sumar unos <b>${congVotos(pl.votos)} votos</b> en todo el estado`:'',rc=B.t0>B.tb?'retener sus distritos cerrados, ':''; return nd?`Para la mayoría: ${rc}ganar ${nd===1?'el '+dd[0]:nd+' distritos más ('+dd.join(', ')+(nd>2?'…':'')+')'}${ps?' y '+ps:''}.`:`Para la mayoría: ${rc}${ps||'subir su votación en el estado'}.`;}
function congHTML(){if(st.es.obj!=='DIPL'||!RPN().rp) return ''; const B=congBase(); if(!B) return ''; const {NT,half,blk,bn,tb,ord,x,pr}=B,col=C[blk[0]]||'#1C7F79';
  const who=tb>=half?`${esc(bn)} · tendría mayoría`:`${esc(bn)} · le ${half-tb===1?'faltaría 1':'faltarían '+(half-tb)} para la mayoría`;
  return `<div class="cg2"><p class="k">Congreso de ${esc(EST)} 2027</p>
   <div class="row"><div><div class="n">${tb} <small>de ${NT}</small></div><div class="who" style="color:${col}">${who}</div></div>${pr?`<div class="pr"><b>${Math.round(100*pr.pM)} %</b><span>probabilidad<br>de mayoría</span></div>`:''}</div>
   <div class="bar">${ord.map(q=>`<i style="flex:${x.out[q].t};background:${blk.includes(q)?(C[q]||col):'#D5DCDC'}" data-tip="${esc(`<b>${NM[q]||q}</b>${x.out[q].t} diputaciones`)}"></i>`).join('')}<s class="mk" style="left:${(100*(half-.5)/NT).toFixed(2)}%"><b>Mayoría · ${half}</b></s></div>
   <div class="bl"><span>${esc(bn)} ${tb}</span><span>otros ${NT-tb}</span></div>
   ${B.p?`<p class="need">${congNeed(B)}</p>`:''}<button class="pjdet" data-pjdet="cg">Abrir congreso y qué le falta ›</button></div>`;}
function congTab(){const B=congBase(); if(!B) return ['','']; const {p,NT,half,blk,bn,tb,ord,x,rt}=B,mx=Math.max(half,...ord.map(q=>x.out[q].t)),cw=Math.max(6,Math.min(15,Math.floor(400/(mx+1))-3)),cwm=Math.max(4,Math.min(15,Math.floor(240/(mx+1))-3));
  const rows=ord.map(q=>{const o=x.out[q],c=C[q]||'#9AA3A3'; return `<div class="r ${blk.includes(q)?'on':''}"><span>${esc(NM[q]||q)}</span><div class="cells">${Array.from({length:o.mr},(_,i)=>`<i style="background:${c};--i:${i}" data-tip="<b>${esc(NM[q]||q)}</b>distrito de mayoría"></i>`).join('')}${Array.from({length:o.rp},(_,i)=>`<i class="o" style="--c:${c};--i:${o.mr+i}" data-tip="<b>${esc(NM[q]||q)}</b>plurinominal"></i>`).join('')}</div><b>${o.t}</b></div>`;}).join('');
  const L=`<h4>Cómo quedaría el congreso (${NT})</h4><div class="cgp" style="--cw:${cw}px;--cwm:${cwm}px"><s class="mk" style="left:calc(var(--nc) + 10px + ${half-1} * (var(--k) + 3px) - 1px)"><b>Mayoría · ${half}</b></s>${rows}</div>
   <div class="cgk"><span><i></i>ganó el distrito</span><span data-tip="<b>Plurinominal</b>Diputación que se reparte según el porcentaje de votos de cada partido, no por ganar un distrito." class="cgi"><i class="o"></i>plurinominal ⓘ</span></div>
   <table class="cgtb cgsum"><thead><tr><th>Partido</th><th>Distritos</th><th>Plurinominales</th><th>Total</th></tr></thead><tbody>${ord.map(q=>{const o=x.out[q]; return `<tr class="${blk.includes(q)?'on':''}"><td><i style="background:${C[q]||'#9AA3A3'}"></i>${esc(NM[q]||q)}</td><td>${o.mr}</td><td>${o.rp}</td><td><b>${o.t}</b></td></tr>`;}).join('')}</tbody></table>`;
  let goal='';
  if(rt&&!rt.keep&&rt.s!=null){const nd=rt.donde.length,pl=rt.plan,qn=esc(NM[pl?pl.q:blk[0]]||bn);
    const E=typeof eSecs==='function'?eSecs():null,secN=i=>String(S[i].s),munN=i=>MUN[S[i].m]||'';
    const ruta=k=>{const c=E&&E.CT&&E.CT[k]; if(!c) return []; return c.ii.map(i=>E.by[i]).filter(x=>x&&x.add).sort((a,b)=>a.ord-b.ord);};
    const s1=!nd?'':`<div class="cgs"><i>1</i><div class="cgb"><b>Ganar ${nd===1?'el '+esc(pjShort('DIPL',rt.donde[0].k)):nd+' distritos más'}</b>
      ${rt.donde.slice(0,nd===1?1:2).map(d=>{const rr=ruta(d.k),tot=rr.reduce((a,x)=>a+x.add,0); return `<div class="cgdl"><div class="h"><span>${esc(pjShort('DIPL',d.k))}</span><em>${d.gap<100?'lo perdería por menos de 100 votos':`lo perdería por aprox. ${fmt(Math.round(d.gap/10)*10)} votos`}</em></div>
        ${rr.length?`${pjTbl(['Sección','Municipio','Votos que le faltarían'],rr.map(x=>[secN(x.i),esc(munN(x.i)),fmt(x.add)]),5)}
        <p class="cgq">${rr.length>5?`Para ganar el distrito tendría que ganar ${rr.length} secciones donde perdería por poco (${fmt(tot)} votos en total). Arriba, las más fáciles.`:`Ganando ${rr.length===1?'esa sección':`esas ${rr.length} secciones`} (${fmt(tot)} votos en total) ganaría el distrito.`}</p>`:''}</div>`;}).join('')}${nd>2?`<small>y ${nd-2} distritos más; todos están en la pestaña Distritos.</small>`:''}</div></div>`;
    let s2='';
    if(pl&&pl.d>0){const need=pl.votos,sd=((MODELO.sigma||{}).DIPL||{}).comun/Math.SQRT2||8,r=(pl.a-pl.de)/sd,
        fz=r<=.5?['ok','Alcanzable','es menos de lo que suele moverse la votación de una elección a otra']:r<=1?['mid','Posible, pero exigente','pide crecer más de lo habitual']:r<=1.8?['dn','Difícil','en elecciones pasadas la votación pocas veces se movió tanto']:['dn','Muy difícil','según las elecciones pasadas, sería un cambio poco común'];
      const RU=typeof pjRuta==='function'&&typeof eAlly==='function'&&eAlly()?pjRuta(ALL,eAlly(),need):null,tp=RU?RU.rows.slice(0,Math.max(1,RU.holg?RU.nr:RU.alcanza?RU.n:RU.rows.length)):[]; /* mismo cálculo que "¿Dónde conseguirlos?" */
      s2=`<div class="cgs"><i>${nd?2:1}</i><div class="cgb"><b>Sumar unos ${congVotos(need)} votos en todo el estado</b><span class="cgf ${fz[0]}">${fz[1]}</span>
        <p>Pasaría de ${pl.de.toFixed(1)} % a ${pl.a.toFixed(1)} % de la votación (+${(pl.a-pl.de).toFixed(1)} puntos): ${fz[2]}.</p><details class="cgwhy"><summary>¿Por qué votos en todo el estado?</summary><p>La ley no le da a un partido más diputaciones que su porcentaje de votos más 8 puntos. Con ${pl.de.toFixed(1)} % su tope sería ${pl.cap!=null?pl.cap:tb}: aunque ganara otro distrito, no podría pasar de ahí sin subir su votación en el estado.</p></details>
        ${tp.length?`<p class="cgq">¿Dónde buscarlos? Secciones donde ${qn} ya sacó más votos que los que tendría hoy, de más a menos:</p>
        ${pjTbl(['Sección','Municipio','Qué hacer','Votos posibles','Acumulado'],tp.map(x=>[secN(x.i),esc(munN(x.i)),x.tipo==='mov'?'Movilizar':'Recuperar',fmt(Math.round(x.pot)),fmt(Math.round(x.acc))]),5)}
        <p class="cgq">${RU.holg?`Aun recuperando solo 1 de cada 3 de estos votos, como suele pasar, los juntaría en ${RU.nr===1?'una sección':RU.nr+' secciones'}.`:RU.alcanza?`Le alcanzaría solo recuperando casi todo en ${RU.n===1?'una sección':RU.n+' secciones'}; normalmente se recupera 1 de cada 3: es difícil.`:`Recuperando todo juntaría unos ${congVotos(RU.tot)}; el resto tendría que venir de convencer a votantes de otros partidos.`}</p>`:''}</div></div>`;}
    goal=`<div class="cgplan">${s1}${s2}<div class="cgr"><span>Resultado</span><b>${rt.mr} distritos + ${rt.rp} plurinominales = ${half}</b></div></div>`;}
  else if(rt&&rt.keep) goal=`<div class="cgg"><b>${tb} de ${NT}</b><p>${esc(bn)}${tb>=half?' tendría mayoría':`: le ${half-tb===1?'faltaría 1':'faltarían '+(half-tb)} para la mayoría`}</p><p class="s">${congNeed(B)}</p></div>`;
  else if(rt) goal=`<div class="cgg"><p>Ni con 15 puntos más en todo el estado llegaría a ${half}.</p></div>`;
  let extra=''; if(p){const n=congNext(p,x),nm=esc(NM[p]||p); if(n){
    if(n.umb) extra=`${nm} no llega al ${Math.round(100*RPR.umbral)} % para tener plurinominales${n.d!=null?`: le faltan unos ${congVotos(n.votos)} votos`:''}.`;
    else if(n.lim==='max') extra=`${nm} ya tiene el máximo de ${RPR.max} diputaciones que permite la ley.`;
    else if(n.lim==='tope'&&n.o.mr>=n.cap) extra=`${nm} gana más distritos de los que su votación permitiría (${n.cap}); por eso no recibiría más plurinominales.`;
    else if(n.lim==='tope') extra=`Con ${(100*n.sh).toFixed(1)} % de los votos, la ley le permite a ${nm} máximo ${n.cap} diputaciones: más distritos sin más votos no le suman.`;
    else if(n.d!=null) extra=`Una plurinominal más para ${nm}: unos ${congVotos(n.votos)} votos.`;}}
  const ley=M0.rpr&&M0.rpr.fuente?`<div class="cgl" data-tip="${esc(`<b>Regla de ${EST}</b>${M0.rpr.resumen||''}<br><br>${M0.rpr.fuente}`)}"><span class="lt">Ley</span>${esc((M0.rpr.fuente||'').split(';')[0])} · ${esc(/^Reproduce/.test(M0.rpr.validacion||'')?'reproduce el reparto real':/^Difiere/.test(M0.rpr.validacion||'')?(M0.rpr.validacion.match(/en \d+ curul(es)?/)||['difiere'])[0].replace('en','difiere en')+' del reparto real':'sin comprobar contra el reparto real')}</div>`
    :`<div class="cgl">Regla general (umbral 3 %, tope de 8 puntos, art. 116 de la Constitución federal); falta verificar la ley de ${esc(EST)}.</div>`;
  const showX=extra&&!(rt&&rt.plan&&rt.plan.d>0&&/tope|permite/.test(extra));
  return [L,`<h4>${rt&&rt.keep&&tb>=half?'La mayoría':`Qué necesita ${esc(bn)} para la mayoría (${half})`}</h4>${goal}${showX?`<p class="cgx">${extra}</p>`:''}${ley}`];}
/* probabilidad de mayoría: se simulan 600 elecciones con el error medido del modelo (un cambio común en todo el estado
   para cada bloque y uno local por distrito, igual que la tarjeta de proyección); en cada una se reparten mayoría y
   plurinominales con la regla del estado */
const CPROB={};
function congProb(p){const key=(p||'')+'|'+JSON.stringify((st.es.poll||{}).DIPL||null)+'|'+(typeof eAlly==='function'&&p?eAlly().join('+'):'')+'|'+(typeof eRv==='function'?eRv():'');
  if(CPROB[key]) return CPROB[key]; const T='DIPL',R=pjRun(T,ALL,p,0,50); if(!R||R.none||typeof MODELO==='undefined'||!MODELO.sigma||!MODELO.sigma[T]) return null;
  const P=eP(T),dv={},tot={}; ALL.forEach(i=>{const x=P[i]; if(!x) return; const d=S[i].dl,o=dv[d]||(dv[d]={}); for(const q in x.pv){o[q]=(o[q]||0)+x.pv[q]; tot[q]=(tot[q]||0)+x.pv[q];}});
  const SIG=congSig(),sc=(MODELO.sigma[T].comun||10)/Math.SQRT2,sl=(MODELO.sigma[T].local||15)/Math.SQRT2,nb=R.BL.length,all=Object.values(tot).reduce((a,b)=>a+b,0)||1,blk=R.BL[R.fi];
  const bsh=R.BL.map(ms=>ms.reduce((a,q)=>a+(tot[q]||0),0)/all);
  let seed=11; const rn=()=>{seed=(seed*16807)%2147483647; return seed/2147483647;},gs=()=>{let a=0,b=0; while(!a) a=rn(); while(!b) b=rn(); return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b);};
  const N=600,res=[],scn=[]; let half=0,q23=0;
  for(let r=0;r<N;r++){const cb=R.BL.map(()=>gs()*sc),MR={};
    R.U.forEach(u=>{let best=-1e9,bj=0; for(let j=0;j<nb;j++){const v=u.e[j]+(u.g?u.g[j]:1)*(cb[j]+gs()*sl); if(v>best){best=v; bj=j;}} const ms=R.BL[bj],o=dv[u.k]||{},sg=SIG[u.k],w=sg&&ms.includes(sg)?sg:ms.slice().sort((a,b)=>(o[b]||0)-(o[a]||0))[0]; if(w) MR[w]=(MR[w]||0)+1;});
    /* votación estatal con el mismo cambio común de cada bloque (puntos), repartido dentro del bloque en proporción */
    const nsh=bsh.map((x,j)=>Math.max(.001,x+cb[j]/100)),ns=nsh.reduce((a,b)=>a+b,0),V={};
    R.BL.forEach((ms,j)=>{const bv=ms.reduce((a,q)=>a+(tot[q]||0),0)||1; ms.forEach(q=>V[q]=(tot[q]||0)/bv*nsh[j]/ns*all);});
    for(const q in tot) if(V[q]==null) V[q]=tot[q];
    const x=rpAsigna(V,MR),t=blk.reduce((a,m)=>a+((x.out[m]||{}).t||0),0); res.push(t); scn.push([t,x.out]); half=x.NT; }
  const NT=half,h=Math.floor(NT/2)+1,c=Math.ceil(NT*2/3); res.sort((a,b)=>a-b);
  /* escenario central: uno de los simulados con el total mediano (así cifra, barra y probabilidad dicen lo mismo) */
  const med=res[Math.floor(N/2)],mc=scn.find(z=>z[0]===med);
  return CPROB[key]={pM:res.filter(t=>t>=h).length/N,pQ:res.filter(t=>t>=c).length/N,lo:res[Math.floor(.1*N)],hi:res[Math.floor(.9*N)],med,medOut:mc?mc[1]:null,NT,blk};}
