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
  const q=ps.filter(p=>V[p]/tot>=RPR.umbral),te=q.reduce((a,p)=>a+V[p],0)||1,sh=p=>V[p]/(RPR.capbase==='total'?tot:te),rp={},used={}; q.forEach(p=>{rp[p]=0; used[p]=0;});
  const cap=p=>Math.min(RPR.max||NT,Math.floor((sh(p)+.08)*NT)),room=p=>cap(p)-(MR[p]||0)-(rp[p]||0); let left=NRP;
  if(RPR.directa) q.forEach(p=>{if(left>0&&room(p)>0){rp[p]++; left--; if(RPR.desc) used[p]=RPR.umbral*tot;}});
  let el=q.filter(p=>room(p)>0),g=0;
  while(left>0&&el.length&&g++<60){const vq=el.reduce((a,p)=>a+V[p]-used[p],0)||1,nb=left,rs=el.map(p=>{const e=nb*(V[p]-used[p])/vq,f=Math.floor(e); return [p,f,e-f];});
    rs.forEach(([p,f])=>{const n=Math.min(f,room(p)); rp[p]+=n; left-=n;});
    rs.sort((a,b)=>b[2]-a[2]).forEach(([p])=>{if(left>0&&room(p)>0){rp[p]++; left--;}});
    el=el.filter(p=>room(p)>0);}
  const seat=p=>(MR[p]||0)+(rp[p]||0);
  for(let k=0;k<20;k++){const bajo=q.filter(p=>seat(p)/NT<sh(p)-.08); if(!bajo.length) break; const u=bajo.sort((a,b)=>(seat(a)/NT-sh(a))-(seat(b)/NT-sh(b)))[0],don=q.filter(p=>p!==u&&rp[p]>0&&(seat(p)-1)/NT>=sh(p)-.08); if(!don.length) break; const o=don.sort((a,b)=>(seat(b)/NT-sh(b))-(seat(a)/NT-sh(a)))[0]; rp[o]--; rp[u]++;}
  const out={}; new Set(Object.keys(MR).concat(Object.keys(rp))).forEach(p=>{const t=(MR[p]||0)+(rp[p]||0); if(t) out[p]={mr:MR[p]||0,rp:rp[p]||0,t,v:100*(V[p]||0)/tot};}); return {out,NT,left};}
let CSIG=null;
function congSig(){if(CSIG) return CSIG; CSIG={}; if(typeof GAN==='undefined'||!GAN) return CSIG; let y=0; GAN.r.forEach(r=>{if(GAN.c[r[2]]==='Diputación local'&&r[7]&&r[7][0]==='dl'&&!(r.length>9)&&r[1]>y) y=r[1];});
  GAN.r.forEach(r=>{if(GAN.c[r[2]]==='Diputación local'&&r[7]&&r[7][0]==='dl'&&r[1]===y&&r[4]) CSIG[r[7][1]]=r[4];}); return CSIG;}
/* un escenario: cambio de s puntos para el bloque del partido p (o del primero si no hay partido) */
function cong27(p,s){const T='DIPL'; if(!D.E[lastOf(T)]) return null; const R=pjRun(T,ALL,p,s,400); if(!R||R.none) return null;
  const P=eP(T),dv={},tot={}; ALL.forEach(i=>{const x=P[i]; if(!x) return; const d=S[i].dl,o=dv[d]||(dv[d]={}); for(const q in x.pv){o[q]=(o[q]||0)+x.pv[q]; tot[q]=(tot[q]||0)+x.pv[q];}});
  /* a qué partido se cuenta el distrito: al que lo tuvo en la última elección (siglado del registro de ganadores) si va
     en la alianza ganadora; si no, al partido de la alianza con más votos proyectados en ese distrito */
  const SIG=congSig(),MR={}; R.U.forEach(u=>{const j=u.e.indexOf(Math.max(...u.e)),ms=R.BL[j],o=dv[u.k]||{},sg=SIG[u.k],w=sg&&ms.includes(sg)?sg:ms.slice().sort((a,b)=>(o[b]||0)-(o[a]||0))[0]; if(w) MR[w]=(MR[w]||0)+1;});
  /* votación estatal por partido con el mismo cambio: el bloque sube s puntos repartidos entre sus partidos; los demás bajan en proporción */
  const all=Object.values(tot).reduce((a,b)=>a+b,0)||1,blk=R.BL[R.fi],bv=blk.reduce((a,q)=>a+(tot[q]||0),0),ov=all-bv,V={};
  for(const q in tot){V[q]=blk.includes(q)?tot[q]*(1+(bv?s/100*all/bv:0)):tot[q]*(1-(ov?s/100*all/ov:0)); if(V[q]<0) V[q]=0;}
  return Object.assign(rpAsigna(V,MR),{blk,s});}
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
  const N=600,res=[]; let half=0,q23=0;
  for(let r=0;r<N;r++){const cb=R.BL.map(()=>gs()*sc),MR={};
    R.U.forEach(u=>{let best=-1e9,bj=0; for(let j=0;j<nb;j++){const v=u.e[j]+cb[j]+gs()*sl; if(v>best){best=v; bj=j;}} const ms=R.BL[bj],o=dv[u.k]||{},sg=SIG[u.k],w=sg&&ms.includes(sg)?sg:ms.slice().sort((a,b)=>(o[b]||0)-(o[a]||0))[0]; if(w) MR[w]=(MR[w]||0)+1;});
    /* votación estatal con el mismo cambio común de cada bloque (puntos), repartido dentro del bloque en proporción */
    const nsh=bsh.map((x,j)=>Math.max(.001,x+cb[j]/100)),ns=nsh.reduce((a,b)=>a+b,0),V={};
    R.BL.forEach((ms,j)=>{const bv=ms.reduce((a,q)=>a+(tot[q]||0),0)||1; ms.forEach(q=>V[q]=(tot[q]||0)/bv*nsh[j]/ns*all);});
    for(const q in tot) if(V[q]==null) V[q]=tot[q];
    const x=rpAsigna(V,MR),t=blk.reduce((a,m)=>a+((x.out[m]||{}).t||0),0); res.push(t); half=x.NT; }
  const NT=half,h=Math.floor(NT/2)+1,c=Math.ceil(NT*2/3); res.sort((a,b)=>a-b);
  return CPROB[key]={pM:res.filter(t=>t>=h).length/N,pQ:res.filter(t=>t>=c).length/N,lo:res[Math.floor(.1*N)],hi:res[Math.floor(.9*N)],med:res[Math.floor(N/2)],blk};}
function congHTML(){if(st.es.obj!=='DIPL'||!RPN().rp) return ''; const p=st.party,sc=[-3,0,3].map(s=>cong27(p,s)).filter(Boolean); if(!sc.length) return '';
  const NT=sc[0].NT,half=Math.floor(NT/2)+1,q23=Math.ceil(NT*2/3),blk=sc[1]?sc[1].blk:sc[0].blk,bn=blk.map(m=>NM[m]||m).join('-');
  const parties=[...new Set(sc.flatMap(x=>Object.keys(x.out)))].sort((a,b)=>((sc[1]||sc[0]).out[b]||{t:0}).t-((sc[1]||sc[0]).out[a]||{t:0}).t);
  const tb=x=>blk.reduce((a,m)=>a+((x.out[m]||{}).t||0),0),lab=s=>s===0?'Proyección':s>0?`${bn} +${s} pts`:`${bn} −${Math.abs(s)} pts`;
  const verdict=t=>t>=q23?'<i class="cg-ok">mayoría calificada</i>':t>=half?'<i class="cg-ok">mayoría</i>':'<i class="cg-no">sin mayoría</i>';
  const reg=M0.rpr&&M0.rpr.fuente?`Regla de ${esc(EST)}: ${esc(M0.rpr.resumen||'')} ${esc(M0.rpr.validacion||'')} Fuente: ${esc(M0.rpr.fuente)}.`:`Regla general (umbral ${Math.round(100*RPR.umbral)} %, tope de +8 puntos, cociente y resto mayor): falta verificar la ley de ${esc(EST)}.`;
  const pr=congProb(p),pc=x=>Math.round(100*x)+' %';
  return `<div class="cg"><div class="cg-h"><b>Congreso 2027: cómo quedaría</b><span>${NT} diputaciones (${RPN().mr} de mayoría y ${RPN().rp} plurinominales) · mayoría ${half} · calificada ${q23}</span></div>
   ${pr?`<div class="cg-p"><div><small>Probabilidad de mayoría · ${esc(bn)}</small><b>${pc(pr.pM)}</b></div><div><small>De mayoría calificada</small><b>${pc(pr.pQ)}</b></div><div><small>Diputaciones, 8 de cada 10 escenarios</small><b>${pr.lo}–${pr.hi}</b></div></div>`:''}
   <div class="cg-g">${sc.map(x=>{const t=tb(x); return `<div class="${x.s===0?'on':''}"><small>${lab(x.s)}</small><b>${t}</b><em>${esc(bn)} · ${verdict(t)}</em>
     <div class="cg-bar">${parties.map(q=>{const o=x.out[q]; return o?`<i style="flex-grow:${o.t};background:${C[q]||'#B9C1C1'}" data-tip="${esc(`<b>${NM[q]||q}</b>${o.t} diputaciones: ${o.mr} de mayoría y ${o.rp} plurinominales · ${o.v.toFixed(1)} % de los votos`)}"></i>`:'';}).join('')}<s style="left:${(100*half/NT).toFixed(1)}%"></s></div></div>`;}).join('')}</div>
   <table class="cg-t"><thead><tr><th>Partido</th>${sc.map(x=>`<th>${x.s===0?'Proyección':(x.s>0?'+':'−')+Math.abs(x.s)+' pts'}</th>`).join('')}</tr></thead><tbody>${parties.map(q=>`<tr><td><i style="background:${C[q]||'#B9C1C1'}"></i>${esc(NM[q]||q)}</td>${sc.map(x=>{const o=x.out[q]; return `<td>${o?`<b>${o.t}</b> <small>${o.mr}+${o.rp}</small>`:'—'}</td>`;}).join('')}</tr>`).join('')}</tbody></table>
   <p class="cg-n">Probabilidades: 600 elecciones simuladas con el error medido del modelo. Mayoría + plurinominales (MR+RP). Los distritos que gana una alianza se cuentan para el partido que lo tuvo en la última elección si va en la alianza (siglado); si no, para el de más votos. ${reg}</p></div>`;}
