/* ===== Actores: personas que ganaron un cargo (meta.gan) =====
   Ventana aparte del análisis: buscar por nombre, filtrar por partido, cargo, quienes ganaron más de una vez
   o cambiaron de partido, y ver la trayectoria. No mueve el mapa ni cambia la selección. */
const ACT=(()=>{if(!GAN) return null; const out=[];
  GAN.p.forEach((nm,j)=>{const R=(ganBy[j]||[]).slice().sort((a,b)=>b[1]-a[1]); if(!R.length) return;
    const ps=[]; R.slice().reverse().forEach(r=>{const x=r[4]||(r[5]||'').split(/[_-]/)[0]; if(x&&ps[ps.length-1]!==x) ps.push(x);});
    const pt=new Set(R.map(r=>r[4]||(r[5]||'').split(/[_-]/)[0]).filter(Boolean));
    const W=R.filter(r=>!(r.length>9)); out.push({j,nm,k:GANK[j],R,W,ps,pt,cg:new Set(R.map(r=>actGrp(GAN.c[r[2]]))),y:R[0][1]||0});});
  /* primero los cargos de mayor peso (gubernatura y senado, diputaciones, presidencias), después lo más reciente */
  const RK={alto:0,df:1,dl:2,pm:3,ayu:4,jud:5}; out.forEach(a=>a.rk=Math.min(...[...a.cg].map(g=>RK[g]??6)));
  out.sort((a,b)=>a.rk-b.rk||b.y-a.y||b.R.length-a.R.length||a.nm.localeCompare(b.nm)); return out;})();
function actGrp(c){return /^Presidencia municipal|^Alcaldía/.test(c)?'pm':/^Diputación local/.test(c)?'dl':/^Diputación federal/.test(c)?'df':/^Senaduría|^Gubernatura|^Presidencia de la/.test(c)?'alto':/^Cargo judicial/.test(c)?'jud':'ayu';}
const ACTG=[['pm',M0.cab==='cdmx'?'Alcaldías':'Presidencias municipales'],['dl','Diputaciones locales'],['df','Diputaciones federales'],['alto','Gubernatura y Senado'],['ayu','Regidurías y sindicaturas'],['jud','Cargos judiciales']];
const ACTP=['MORENA','PAN','PRI','PVEM','PT','MC','PRD'];
if(!st.act) st.act={q:'',p:null,g:null,multi:false,camb:false,re:false,sel:null};
const ACTRE=(GAN&&GAN.re)||{};
const actVt=(v,r)=>{if(!v) return ''; if(r&&r.length>9) return `<small class="vt pd">${v[0].toFixed(1)}% de los votos · quedó ${r[9]}.º, a ${Math.abs(v[1]).toFixed(1)} pts del ganador</small>`; return `<small class="vt${v[1]<5?' cl':''}">${v[0].toFixed(1)}% de los votos · ganó por ${v[1].toFixed(1)} pts${v[1]<5?' (cerrado)':''}</small>`;};
const actLost=r=>r.length>9;
/* "Ver en el mapa" solo donde el lugar es el mismo en el mapa de hoy (los distritos se comprueban sección por sección) */
const ACTWHY={redis:'Distrito de una distritación anterior: hoy es otro territorio',pre:Y0TXT()};
function Y0TXT(){return 'Sin resultados por sección en la plataforma (antes de '+Math.min(...Object.values(D.E).map(e=>+e.year))+')';}
const actMap=r=>r[7]?`<button class="vm" data-loc="${r[7][0]}|${r[7][1]}|${r[7][2]}">Ver en el mapa</button>`:r[8]&&ACTWHY[r[8]]?`<small class="nm">${ACTWHY[r[8]]}</small>`:'';
/* ir al lugar donde ganó, con los resultados de esa elección */
function actGo(v){const [lv,k,ek]=v.split('|'); actClose(); if(D.E[ek]&&st.elec!==ek) setElec(ek); if(lv==='m') setTerr(k); else if(lv==='e') setTerr(null); else applyScope(lv,+k);}
/* lista filtrada en Excel (CSV): una fila por cargo ganado */
function actCSV(){const L=actList(),q=x=>{x=x==null?'':String(x); return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;},rows=[['Nombre','Año','Resultado','Cargo','Lugar','Partido','Postulado por','% de votos','Ventaja o distancia (pts)','Cargos ganados','Recorrido de partidos','Puede reelegirse en 2027']];
  L.forEach(a=>a.R.forEach(r=>rows.push([a.nm,r[1],actLost(r)?'Compitió, quedó '+(r[9]||'—')+'.º':'Ganó',GAN.c[r[2]],r[3],NM[r[4]]||r[4],actN(r[5]),r[6]?r[6][0]:'',r[6]?r[6][1]:'',a.W.length,a.ps.map(x=>NM[x]||x).join(' → '),ACTRE[a.j]?'Sí':''])));
  const b=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),l=document.createElement('a');
  l.href=u; l.download=`actores_${M0.cab}_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000);}
function actBody(pid){const a=ACT&&ACT.find(x=>x.j===pid); if(!a) return '<p class="ac-e">Elige una persona de la lista.</p>'; const ys=a.R.map(r=>r[1]).filter(Boolean);
  return `<div class="ac-h"><small>Trayectoria</small><b>${esc(a.nm)}</b><span>${a.W.length?'Ganó '+(a.W.length===1?'1 cargo':a.W.length+' cargos'):'Sin cargos ganados en el registro'}${a.R.length>a.W.length?` · compitió ${a.R.length-a.W.length===1?'1 vez':(a.R.length-a.W.length)+' veces'} sin ganar`:''}${ys.length?` · ${Math.min(...ys)}${Math.max(...ys)!==Math.min(...ys)?'–'+Math.max(...ys):''}`:''}</span></div>
   ${ACTRE[a.j]?`<div class="pcb re" title="Regla general vigente hasta 2030 (alcaldías: una reelección; diputaciones locales: hasta cuatro periodos seguidos). Confirma la ley del estado.">Puede reelegirse en 2027 · ${esc(ACTRE[a.j])}</div>`:''}
   ${a.ps.length>1?`<div class="pcb">Cambió de partido: ${a.ps.map(x=>esc(NM[x]||x)).join(' → ')}</div>`:''}
   <div class="prl">${a.R.map(r=>`<div class="${actLost(r)?'lost':''}"><b>${r[1]||'—'}</b><span>${actLost(r)?'<i class="cmp">Compitió</i> ':''}${esc(GAN.c[r[2]])}${r[3]?' · '+esc(r[3]):''}</span>${parChip(r[4]||r[5])}${r[4]&&r[5]?`<small>postulado por ${esc(actN(r[5]))}</small>`:''}${r[6]||r[7]||r[8]?`<div class="vr">${actVt(r[6],r)}${actMap(r)}</div>`:''}</div>`).join('')}</div>
   <p class="ac-n">Cargos ganados de 2000 a 2025; candidaturas que no ganaron, solo las federales de mayoría de 2024. Se reconoce a la persona por su nombre escrito igual; dos personas con el mismo nombre en el estado aparecerían juntas.</p><p class="ac-n">Fuente: ${esc(GAN.fuente)}.</p>`;}
function actList(){const f=st.act,ws=norm(f.q.trim()).split(' ').filter(Boolean);
  return ACT.filter(a=>(!ws.length||ws.every(w=>a.k.includes(w)))&&(!f.p||a.pt.has(f.p))&&(!f.g||a.cg.has(f.g))&&(!f.multi||a.W.length>1)&&(!f.camb||a.ps.length>1)&&(!f.re||ACTRE[a.j]));}
function actRender(keepFocus){const W=$('actw'); if(!W) return; const f=st.act,L=actList(),N=120;
  if(f.sel==null&&L.length&&innerWidth>760) f.sel=L[0].j;
  $('actf').innerHTML=`<div class="ac-ch"><button data-ap="" aria-pressed="${!f.p}">Todos</button>${ACTP.filter(p=>ACT.some(a=>a.pt.has(p))).map(p=>`<button data-ap="${p}" aria-pressed="${f.p===p}"><i style="background:${C[p]}"></i>${esc(NM[p]||p)}</button>`).join('')}</div>
   <div class="ac-ch"><select id="actg" aria-label="Cargo"><option value="">Todos los cargos</option>${ACTG.filter(g=>ACT.some(a=>a.cg.has(g[0]))).map(g=>`<option value="${g[0]}" ${f.g===g[0]?'selected':''}>${g[1]}</option>`).join('')}</select>
   <button data-at="multi" aria-pressed="${f.multi}">Ganaron más de una vez</button><button data-at="camb" aria-pressed="${f.camb}">Cambiaron de partido</button>${Object.keys(ACTRE).length?`<button data-at="re" aria-pressed="${f.re}" title="Electos en 2024 en su primer periodo (alcaldías) o con menos de cuatro periodos seguidos (diputaciones locales). Regla general vigente hasta 2030; confirma la ley del estado.">Pueden reelegirse en 2027</button>`:''}</div>`;
  $('actc').textContent=`${fmt(L.length)} ${L.length===1?'persona':'personas'}`;
  $('actl').innerHTML=L.slice(0,N).map(a=>{const r=a.R[0]; return `<button data-aj="${a.j}" class="${a.j===f.sel?'on':''}"><b>${esc(a.nm)}</b><span>${esc(GAN.c[r[2]])}${r[3]?' · '+esc(r[3]):''} ${r[1]||''}</span><em>${a.ps.map(x=>`<i style="background:${C[x]||'#B9C1C1'}" title="${esc(NM[x]||x)}"></i>`).join('<u>→</u>')}${a.W.length>1?`<small>${a.W.length} cargos</small>`:''}</em></button>`;}).join('')+(L.length>N?`<p class="ac-m">y ${fmt(L.length-N)} más: escribe parte del nombre o usa los filtros.</p>`:'')+(L.length?'':'<p class="ac-m">Nadie coincide con la búsqueda y los filtros.</p>');
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
