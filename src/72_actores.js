/* ===== Actores: personas que ganaron un cargo (meta.gan) =====
   Ventana aparte del análisis: buscar por nombre, filtrar por partido, cargo, quienes ganaron más de una vez
   o cambiaron de partido, y ver la trayectoria. No mueve el mapa ni cambia la selección. */
/* partidos que postularon a la persona en un cargo: solo los siete nacionales de hoy (los locales y satélites no se usan),
   con los nombres de coaliciones históricas traducidos a sus partidos y Convergencia como MC */
const PS7=new Set(['MORENA','PAN','PRI','PRD','PVEM','PT','MC']),PSX={CONVERGENCIA:['MC'],MOVIMIENTO:['MC'],PRIMERO:['PRI','PVEM'],APM:['PRI','PVEM'],APT:['PRI','PVEM'],AC:['PAN','PVEM'],PBT:['PRD','PT','MC'],PROGRE:['PRD','PT','MC'],AM:['PRD','PT','MC']};
function actPS(r){const t=(String(r[4]||'')+' '+String(r[5]||'')).toUpperCase().split(/[_\-\s]+/).filter(Boolean),o=new Set();
  t.forEach(x=>{if(PS7.has(x)) o.add(x); else if(PSX[x]) PSX[x].forEach(y=>o.add(y)); else if(x==='C'&&!t.includes('COMUN')) o.add('MC'); else if(/^IND\d*$/.test(x)||x==='INDEPENDIENTE') o.add('IND');});
  if(t.includes('COM')&&t.includes('MEXICO')){o.add('PRI'); o.add('PVEM');} return [...o];}
/* alianzas nacionales por año (respaldo para años sin resultados por sección en la plataforma) */
const ALNAC={2000:[['PAN','PVEM'],['PRD','PT','MC']],2003:[['PRI','PVEM']],2006:[['PRI','PVEM'],['PRD','PT','MC']],2009:[['PRI','PVEM']],2012:[['PRI','PVEM'],['PRD','PT','MC']],2015:[['PRI','PVEM']],2018:[['MORENA','PT'],['PAN','PRD','MC'],['PRI','PVEM']],2021:[['MORENA','PT','PVEM'],['PAN','PRI','PRD']],2024:[['MORENA','PT','PVEM'],['PAN','PRI','PRD']]};
const ALY={}; Object.values(D.E).forEach(e=>e.blocs.forEach(b=>{const m=b.members.filter(x=>PS7.has(x)); if(m.length>1)(ALY[e.year]=ALY[e.year]||[]).push(m);}));
const aliados=(a,b,ys)=>ys.some(y=>(ALY[y]||[]).concat(ALNAC[y]||[]).some(g=>a.some(x=>g.includes(x))&&b.some(x=>g.includes(x))));
const PSO=['MORENA','PAN','PRI','MC','PVEM','PT','PRD'];
const psN=x=>x==='IND'?'Independiente':NM[x]||x,psL=s=>s.length===1?psN(s[0]):psN(psC(s))+' y aliados';
const psC=s=>s.slice().sort((a,b)=>(PSO.indexOf(a)+1||9)-(PSO.indexOf(b)+1||9))[0];
const ACT=(()=>{if(!GAN) return null; const out=[];
  GAN.p.forEach((nm,j)=>{const R=(ganBy[j]||[]).slice().sort((a,b)=>b[1]-a[1]); if(!R.length) return;
    /* Cambio de partido: el INE registra a quien va en coalición con el partido que lo "sigla" por convenio, no con
       su militancia. Por eso cada cargo da los partidos posibles (todos los de su coalición, o el suyo si fue solo) y solo
       cuenta como cambio cuando un cargo no comparte ningún partido con los anteriores. */
    const ps=[],py=[]; let cur=null; R.slice().reverse().forEach(r=>{const s=actPS(r); if(!s.length) return; const i=cur?cur.filter(x=>s.includes(x)):[];
      if(i.length){cur=i; ps[ps.length-1]=i; py[py.length-1][1]=r[1];} else {cur=s; ps.push(s); py.push([r[1],r[1]]);}});
    /* bando: el cambio fue a un partido que no era aliado ni en la elección de antes ni en la de después */
    const bando=ps.slice(1).some((s,k)=>!aliados(ps[k],s,[py[k][1],py[k+1][0]]));
    const pt=new Set(R.flatMap(actPS));
    const W=R.filter(r=>!(r.length>9)); out.push({j,nm,k:GANK[j],R,W,ps,bando,pt,cg:new Set(R.map(r=>actGrp(GAN.c[r[2]]))),y:R[0][1]||0});});
  /* primero los cargos de mayor peso (gubernatura y senado, diputaciones, presidencias), después lo más reciente */
  const RK={alto:0,df:1,dl:2,pm:3,ayu:4,jud:5}; out.forEach(a=>a.rk=Math.min(...[...a.cg].map(g=>RK[g]??6)));
  out.sort((a,b)=>a.rk-b.rk||b.y-a.y||b.R.length-a.R.length||a.nm.localeCompare(b.nm)); return out;})();
function actGrp(c){return /^Presidencia municipal|^Alcaldía/.test(c)?'pm':/^Diputación local/.test(c)?'dl':/^Diputación federal/.test(c)?'df':/^Senaduría|^Gubernatura|^Presidencia de la/.test(c)?'alto':/^Cargo judicial/.test(c)?'jud':'ayu';}
const ACTG=[['pm',M0.cab==='cdmx'?'Alcaldías':'Presidencias municipales'],['dl','Diputaciones locales'],['df','Diputaciones federales'],['alto','Gubernatura y Senado'],['ayu','Regidurías y sindicaturas'],['jud','Cargos judiciales']];
const ACTP=['MORENA','PAN','PRI','PVEM','PT','MC','PRD'];
if(!st.act) st.act={q:'',p:null,g:null,multi:false,camb:false,re:false,sel:null};
const ACTRE=(GAN&&GAN.re)||{};
/* % del partido por sí solo en esa elección (votos de coalición repartidos en partes iguales, como en la gráfica de evolución) */
const actOwn=r=>{try{if(!r||!r[4]||!r[7]||!r[7][2]||!D.E[r[7][2]]) return null; const ii=actII(r); if(!ii.length) return null; const T=totals(r[7][2],ii); return T.val?100*(T.tot[r[4]]||0)/T.val:null;}catch(e){return null;}};
/* voto propio: diputación federal 2024 (coaliciones verificadas con las candidaturas del INE), gubernatura, senado,
   ayuntamientos y diputaciones locales. Se compara con las demás boletas de ese año en el mismo territorio donde iba
   exactamente la misma alianza, y nunca en lugares donde no se sabe si la coalición fue (E.sd). Validación: en quienes se
   reeligieron, el voto propio de sus dos periodos se parece (correlación 0.41, 304 casos) mucho más que el de dos
   personas distintas en el mismo lugar (0.12, 1,167 casos): mide algo de la persona, no solo del lugar. */
const SDS={},sdOf=ek=>SDS[ek]||(SDS[ek]=new Set(D.E[ek].sd||[]));
const actII=r=>{const lv=r[7][0],k=String(r[7][1]); return ALL.filter(i=>String(lv==='m'||lv==='mun'?S[i].m:lv==='dl'?S[i].dl:lv==='df'?S[i].df:'0')===(lv==='e'?'0':k));};
const BOL={PRE:'presidencia',SEN:'senado',GOB:'gubernatura',DIPL:'diputación local',AYU:'ayuntamiento',DIPF:'diputación federal'};
const actArr=r=>{try{if(!r||!r[6]||r[8]==='dif'||!r[7]||!r[7][2]||!D.E[r[7][2]]||!/^(DIPF_2024|GOB_|SEN_|AYU_|DIPL_)/.test(r[7][2])) return null; const ek=r[7][2],y=+D.E[ek].year,ii=actII(r); if(!ii.length) return null;
  const loc=/^(AYU|DIPL)_/.test(ek),sd=x=>ii.some(i=>sdOf(x).has(i)); if(loc&&sd(ek)) return null;
  /* solo boletas donde iba exactamente la misma alianza (o el partido solo): así la diferencia no viene de cambiar de aliados */
  const tok=[...new Set(String(r[5]||r[4]||'').split(/[_-]/).filter(x=>PS7.has(x)))],same=b=>{const m=b.members.filter(x=>PS7.has(x)); return tok.length&&m.length===tok.length&&tok.every(t=>m.includes(t));};
  const ks=Object.keys(D.E).filter(x=>x!==ek&&+D.E[x].year===y&&(loc?!sd(x):/^(PRE|SEN|GOB)_/.test(x))),hit=[],vs=[];
  ks.forEach(x=>{const T=totals(x,ii),b=(T.bl||[]).find(same); if(b){vs.push(b.pct); hit.push(BOL[x.split('_')[0]]);}}); if(!vs.length) return null;
  const n=[...new Set(hit)]; return {d:r[6][0]-vs.reduce((a,b)=>a+b,0)/vs.length,n:vs.length,k:n.length>1?`las otras ${n.length} boletas`:'la boleta de '+n[0],t:n.length>1?n.slice(0,-1).join(', ')+' y '+n[n.length-1]:''};}catch(e){return null;}};
const actVt=(v,r)=>{if(!v) return ''; const ar=actArr(r),ob=ar?'en '+(ar.k||'las boletas de presidencia y senado')+' de ese año en el mismo territorio':'',arT=!ar?'':Math.abs(ar.d)<2?`<br><span class="arr" title="${esc(ar.t)}">Voto propio: sacó casi lo mismo que su partido o alianza ${ob}</span>`:`<br><span class="arr ${ar.d>0?'up':'dn'}" title="${esc(ar.t)}">Voto propio: sacó ${Math.abs(ar.d).toFixed(1)} pts ${ar.d>0?'más':'menos'} que su partido o alianza ${ob}</span>`; const co=r&&r[5]&&String(r[5]).split(/[_-]/).filter(Boolean).length>1,own=co?actOwn(r):null,who=co?`la coalición ${esc(actN(r[5]))}`:''; if(r&&r[8]==='dif') return `<small class="vt pd">${co?who+': ':''}${v[0].toFixed(1)} % de los votos sumando las secciones, ${Math.abs(v[1]).toFixed(1)} pts debajo del primer lugar. El resultado oficial le dio el triunfo: puede deberse a recuentos, casillas anuladas o una resolución del tribunal.</small>`; if(r&&r.length>9) return `<small class="vt pd">${co?who+': ':''}${v[0].toFixed(1)} % de los votos · quedó ${r[9]}.º, a ${Math.abs(v[1]).toFixed(1)} pts del ganador${arT}</small>`; return `<small class="vt${v[1]<5?' cl':''}">${co?`${who}: ${v[0].toFixed(1)} % de los votos`:`${v[0].toFixed(1)} % de los votos`} · ganó por ${v[1].toFixed(1)} pts${v[1]<5?' (cerrado)':''}${own!=null?`<br>${esc(NM[r[4]]||r[4])} por sí solo: ${own.toFixed(1)} %`:''}${arT}</small>`;};
const actLost=r=>r.length>9;
/* "Ver en el mapa" solo donde el lugar es el mismo en el mapa de hoy (los distritos se comprueban sección por sección) */
const ACTWHY={redis:'Distrito de una distritación anterior: hoy es otro territorio',pre:Y0TXT()};
function Y0TXT(){return 'Sin resultados por sección en la plataforma (antes de '+Math.min(...Object.values(D.E).map(e=>+e.year))+')';}
const actMap=r=>r[7]?`<button class="vm" data-loc="${r[7][0]}|${r[7][1]}|${r[7][2]}">Ver en el mapa</button>`:r[8]&&ACTWHY[r[8]]?`<small class="nm">${ACTWHY[r[8]]}</small>`:'';
/* ir al lugar donde ganó, con los resultados de esa elección */
function actGo(v){const [lv,k,ek]=v.split('|'); actClose(); if(D.E[ek]&&st.elec!==ek) setElec(ek); if(lv==='m') setTerr(k); else if(lv==='e') setTerr(null); else applyScope(lv,+k);}
/* lista filtrada en Excel (CSV): una fila por cargo ganado */
function actCSV(){const L=actList(),q=x=>{x=x==null?'':String(x); return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;},rows=[['Nombre','Año','Resultado','Cargo','Lugar','Partido','Postulado por','% de votos','Ventaja o distancia (pts)','Cargos ganados','Partidos que lo postularon','Puede reelegirse en 2027']];
  L.forEach(a=>a.R.forEach(r=>rows.push([a.nm,r[1],actLost(r)?'Compitió, quedó '+(r[9]||'—')+'.º':'Ganó',GAN.c[r[2]],r[3],NM[r[4]]||r[4],actN(r[5]),r[6]?r[6][0]:'',r[6]?r[6][1]:'',a.W.length,a.ps.length>1?(a.bando?'Cambió de partido: ':'Misma alianza: ')+a.ps.map(psL).join(' → '):'',ACTRE[a.j]?'Sí':''])));
  const b=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),l=document.createElement('a');
  l.href=u; l.download=`actores_${M0.cab}_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000);}
function actBody(pid){const a=ACT&&ACT.find(x=>x.j===pid); if(!a) return '<p class="ac-e">Elige una persona de la lista.</p>'; const ys=a.R.map(r=>r[1]).filter(Boolean);
  return `<div class="ac-h"><small>Trayectoria</small><b>${esc(a.nm)}</b><span>${a.W.length?'Ganó '+(a.W.length===1?'1 cargo':a.W.length+' cargos'):'Sin cargos ganados en el registro'}${a.R.length>a.W.length?` · compitió ${a.R.length-a.W.length===1?'1 vez':(a.R.length-a.W.length)+' veces'} sin ganar`:''}${ys.length?` · ${Math.min(...ys)}${Math.max(...ys)!==Math.min(...ys)?'–'+Math.max(...ys):''}`:''}</span></div>
   ${ACTRE[a.j]?`<div class="pcb re" title="Regla general vigente hasta 2030 (alcaldías: una reelección; diputaciones locales: hasta cuatro periodos seguidos). Confirma la ley del estado.">Puede reelegirse en 2027 · ${esc(ACTRE[a.j])}</div>`:''}
   ${a.ps.length>1?`<div class="pcb${a.bando?'':' al'}">${a.bando?'Cambió de partido':'Lo postuló otro partido de su misma alianza'}: ${a.ps.map(x=>esc(psL(x))).join(' → ')}</div>`:''}
   <div class="prl">${a.R.map(r=>`<div class="${actLost(r)?'lost':''}"><b>${r[1]||'—'}</b><span>${actLost(r)?'<i class="cmp">Compitió</i> ':''}${esc(GAN.c[r[2]])}${r[3]?' · '+esc(r[3]):''}</span>${parChip(r[4]||r[5])}${r[4]&&r[5]?`<small>postulado por ${esc(actN(r[5]))}</small>`:''}${r[6]||r[7]||r[8]?`<div class="vr">${actVt(r[6],r)}${actMap(r)}</div>`:''}</div>`).join('')}</div>
   <p class="ac-n">Cargos ganados de 2000 a 2025; candidaturas que no ganaron, solo las federales de mayoría de 2024. Se reconoce a la persona por su nombre escrito igual; dos personas con el mismo nombre en el estado aparecerían juntas.</p><p class="ac-n">Fuente: ${esc(GAN.fuente)}.</p>`;}
function actList(){const f=st.act,ws=norm(f.q.trim()).split(' ').filter(Boolean);
  return ACT.filter(a=>(!ws.length||ws.every(w=>a.k.includes(w)))&&(!f.p||a.pt.has(f.p))&&(!f.g||a.cg.has(f.g))&&(!f.multi||a.W.length>1)&&(!f.camb||a.ps.length>1)&&(!f.re||ACTRE[a.j]));}
function actRender(keepFocus){const W=$('actw'); if(!W) return; const f=st.act,L=actList(),N=120;
  if(f.sel==null&&L.length&&innerWidth>760) f.sel=L[0].j;
  $('actf').innerHTML=`<div class="ac-ch"><button data-ap="" aria-pressed="${!f.p}">Todos</button>${ACTP.filter(p=>ACT.some(a=>a.pt.has(p))).map(p=>`<button data-ap="${p}" aria-pressed="${f.p===p}"><i style="background:${C[p]}"></i>${esc(NM[p]||p)}</button>`).join('')}</div>
   <div class="ac-ch"><select id="actg" aria-label="Cargo"><option value="">Todos los cargos</option>${ACTG.filter(g=>ACT.some(a=>a.cg.has(g[0]))).map(g=>`<option value="${g[0]}" ${f.g===g[0]?'selected':''}>${g[1]}</option>`).join('')}</select>
   <button data-at="multi" aria-pressed="${f.multi}">Ganaron más de una vez</button><button data-at="camb" aria-pressed="${f.camb}">Los postuló otro partido</button>${Object.keys(ACTRE).length?`<button data-at="re" aria-pressed="${f.re}" title="Electos en 2024 en su primer periodo (alcaldías) o con menos de cuatro periodos seguidos (diputaciones locales). Regla general vigente hasta 2030; confirma la ley del estado.">Pueden reelegirse en 2027</button>`:''}</div>`;
  $('actc').textContent=`${fmt(L.length)} ${L.length===1?'persona':'personas'}`;
  let sm=''; if(f.camb&&L.length){const nb=L.filter(a=>a.bando).length,cn={}; L.filter(a=>a.bando).forEach(a=>{const k=psL(a.ps[a.ps.length-2])+' → '+psL(a.ps[a.ps.length-1]); cn[k]=(cn[k]||0)+1;}); const top=Object.entries(cn).sort((a,b)=>b[1]-a[1]).slice(0,3);
    sm=`<div class="ac-sm"><b>${fmt(nb)}</b> cambiaron de partido (a uno que no era su aliado) y <b>${fmt(L.length-nb)}</b> se movieron dentro de su alianza.${top.length?` Lo más común: ${top.map(([k,n])=>`${esc(k)} (${n})`).join(', ')}.`:''}</div>`;}
  $('actl').innerHTML=sm+L.slice(0,N).map(a=>{const r=a.R[0]; return `<button data-aj="${a.j}" class="${a.j===f.sel?'on':''}"><b>${esc(a.nm)}</b><span>${esc(GAN.c[r[2]])}${r[3]?' · '+esc(r[3]):''} ${r[1]||''}</span><em>${a.ps.map(x=>`<i style="background:${C[psC(x)]||'#B9C1C1'}" title="${esc(psL(x))}"></i>`).join('<u>→</u>')}${a.W.length>1?`<small>${a.W.length} cargos</small>`:''}</em></button>`;}).join('')+(L.length>N?`<p class="ac-m">y ${fmt(L.length-N)} más: escribe parte del nombre o usa los filtros.</p>`:'')+(L.length?'':'<p class="ac-m">Nadie coincide con la búsqueda y los filtros.</p>');
  $('actd').innerHTML=actBody(f.sel); W.classList.toggle('det',f.sel!=null);
  if(!keepFocus) $('actl').scrollTop=0;}
function actOpen(pid){if(!ACT) return; let W=$('actw');
  if(!W){W=document.createElement('div'); W.id='actw'; W.className='actw'; W.setAttribute('role','dialog'); W.setAttribute('aria-label','Actores políticos');
    W.innerHTML=`<div class="ac-bx"><div class="ac-top"><div><b>Actores políticos</b><span>Quién ha ganado o competido por un cargo en ${esc(EST)}, 2000–2025</span></div><button class="ac-x" id="actx" aria-label="Cerrar">✕</button></div>
     <div class="ac-q"><svg viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.6"/><path d="M8 8l3 3"/></svg><input id="actq" autocomplete="off" placeholder="Buscar por nombre"><span id="actc"></span><button class="ac-dl" id="actdl" title="Descarga la lista filtrada (una fila por cargo ganado); se abre en Excel">Descargar</button></div>
     <div id="actf" class="ac-f"></div><div class="ac-g"><div id="actl" class="ac-l"></div><div class="ac-d"><button class="ac-bk" id="actbk">← Lista</button><div id="actd"></div></div></div></div>`;
    document.body.appendChild(W);
    W.addEventListener('click',e=>{if(e.target===W||e.target.closest('#actx')) return actClose(); if(e.target.closest('#actdl')) return actCSV(); const lo=e.target.closest('[data-loc]'); if(lo) return actGo(lo.dataset.loc); if(e.target.closest('#actbk')){st.act.sel=null; return actRender(true);}
      const b=e.target.closest('[data-aj]'); if(b){st.act.sel=+b.dataset.aj; $('actl').querySelectorAll('[data-aj]').forEach(x=>x.classList.toggle('on',x===b)); $('actd').innerHTML=actBody(st.act.sel); W.classList.add('det'); return;}
      const p=e.target.closest('[data-ap]'); if(p){st.act.p=p.dataset.ap||null; st.act.sel=null; return actRender();}
      const t=e.target.closest('[data-at]'); if(t){st.act[t.dataset.at]=!st.act[t.dataset.at]; st.act.sel=null; return actRender();}});
    W.addEventListener('change',e=>{if(e.target.id==='actg'){st.act.g=e.target.value||null; st.act.sel=null; actRender();}});
    $('actq').addEventListener('input',e=>{st.act.q=e.target.value; st.act.sel=null; actRender();});}
  if(pid!=null){st.act.sel=pid;}
  $('actq').value=st.act.q; actRender(pid!=null); W.classList.add('on'); document.body.classList.add('actm');
  if(pid!=null){const b=$('actl').querySelector(`[data-aj="${pid}"]`); if(b) b.scrollIntoView({block:'center'});} else setTimeout(()=>$('actq').focus(),50);}
function actClose(){const W=$('actw'); if(W) W.classList.remove('on'); document.body.classList.remove('actm');}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('actw')&&$('actw').classList.contains('on')) actClose();});
if($('actb')){if(!ACT) $('actb').style.display='none'; else $('actb').onclick=()=>actOpen();}
