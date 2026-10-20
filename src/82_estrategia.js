/* ===== Estrategia territorial =====
   Para un partido y una elección objetivo: tipos de sección (bastión, competida, persuadible,
   movilizable, sin prioridad, adversa), meta de votos por unidad en disputa y ruta para ganar
   (secciones ordenadas por votos alcanzables por elector hasta cubrir la brecha). */
const ESEG=[['bas','Bastión propio','ganó y tiene voto duro alto: cuidar y movilizar','#1C7F79'],
  ['com','Competida','se decidió por menos de 5 puntos','#F46883'],
  ['per','Persuadible','mucho voto que cambia de partido entre elecciones','#F5A47C'],
  ['mov','Movilizable','muchos votantes ocasionales que no salieron a votar','#4CC1BA'],
  ['res','Sin prioridad','margen amplio sin rasgos de oportunidad','#C9D3D3'],
  ['adv','Territorio adverso','el rival tiene voto duro alto y más de 15 puntos de ventaja','#595959']];
const ESC=Object.fromEntries(ESEG.map(g=>[g[0],g]));
const EOBJ=[['GOB','Gubernatura','est'],['DIPL','Congreso local','dl'],['AYU','Ayuntamientos','mun'],['DIPF','Diputación federal','df'],['SEN','Senado','est']].filter(o=>lastOf(o[0]));
const ELV={est:'Estado',mun:'Municipio',dl:'Distrito local',df:'Distrito federal'};
if(!st.es) st.es={obj:(EOBJ.find(o=>o[0]===(CFG.gob2027?'GOB':'DIPL'))||EOBJ[0])[0],lv:null,u:null,a:20,b:15,seg:null};
const ECACHE={};
const eRef=()=>lastOf(st.es.obj);
const eNat=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[2];
const eLv=()=>st.es.lv||eNat();
const eKey=(lv,i)=>lv==='mun'?S[i].m:lv==='dl'?S[i].dl:lv==='df'?S[i].df:0;
const eName=(lv,k)=>lv==='mun'?MUN[k]:lv==='dl'?'Distrito local '+k+(CABDL[k]?' · '+CABDL[k]:''):lv==='df'?'Distrito federal '+k+(CABDF[k]?' · '+CABDF[k]:''):EST;
/* rival = la fuerza más votada distinta a la del partido, dentro de las secciones dadas */
function eDuel(ek,ii,p){const T=totals(ek,ii); if(!T.val) return null; const mine=T.bl.find(b=>b.members.includes(p)); if(!mine) return null; const riv=T.bl.find(b=>b!==mine); return {T,mine,riv,gap:riv?Math.round(riv.votes-mine.votes):-Math.round(mine.votes),mg:mine.pct-(riv?riv.pct:0)};}
/* datos por sección para (elección, partido): tipo, ocasionales, volátiles */
function eSecs(){const ek=eRef(),p=st.party,key=ek+'|'+p; if(ECACHE[key]) return ECACHE[key];
  const L=[]; ALL.forEach(i=>{const r=row(ek,i); if(!r||!r.val) return; const du=eDuel(ek,[i],p); if(!du) return;
    const oc=Math.max(0,(V2.maxT[i]||0)-(EXPT[i]||0))/100*(S[i].ln||0);
    L.push({i,mg:du.mg,riv:du.riv?du.riv.lead:null,dp:V2.duro[p]?V2.duro[p][i]:null,dr:du.riv&&V2.duro[du.riv.lead]?V2.duro[du.riv.lead][i]:null,vol:V2.vol[i],oc,emit:r.t,ln:S[i].ln||0});});
  const q=(a,f)=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y); return a.length?a[Math.floor(f*a.length)]:Infinity;};
  const tP=q(L.map(x=>x.dp),2/3),tR=q(L.map(x=>x.dr),2/3),tV=q(L.map(x=>x.vol),2/3),tO=q(L.map(x=>x.ln?x.oc/x.ln:null),2/3);
  L.forEach(x=>{x.seg=x.dp!=null&&x.dp>=tP&&x.mg>0?'bas':x.dr!=null&&x.dr>=tR&&x.mg<-15?'adv':Math.abs(x.mg)<5?'com':x.vol!=null&&x.vol>=tV?'per':x.ln&&x.oc/x.ln>=tO?'mov':'res';});
  const by={}; L.forEach(x=>by[x.i]=x); return ECACHE[key]={L,by};}
const ePot=x=>x.oc*st.es.a/100+(x.vol||0)/100*x.emit*st.es.b/100;
/* ruta: secciones (no adversas) ordenadas por votos alcanzables por elector hasta cubrir la brecha */
function eRoute(ii,gap){const E=eSecs(),c=ii.map(i=>E.by[i]).filter(x=>x&&x.seg!=='adv'&&x.seg!=='res'&&(!st.es.seg||x.seg===st.es.seg)).map(x=>({x,p:ePot(x)})).sort((a,b)=>b.p/(b.x.ln||1)-a.p/(a.x.ln||1));
  let acc=0,n=0,ln=0; const tot=c.reduce((t,y)=>t+y.p,0); for(const y of c){if(gap>0&&acc>=gap) break; if(gap<=0&&n>=12) break; acc+=y.p; ln+=y.x.ln; n++; y.acc=acc;}
  return {c,n,acc,ln,tot,ok:gap<=0||acc>=gap};}
/* unidades en disputa (o agrupación elegida) con su meta */
function eUnits(){const lv=eLv(),ek=eRef(),p=st.party; if(lv==='est') return [{k:0,ii:ALL}];
  const g={}; ALL.forEach(i=>{const k=eKey(lv,i); (g[k]=g[k]||[]).push(i);});
  return Object.entries(g).map(([k,ii])=>({k:+k,ii})).filter(u=>eDuel(ek,u.ii,p));}
function eSelII(){const lv=eLv(); return st.es.u==null||lv==='est'?ALL:ALL.filter(i=>String(eKey(lv,i))===String(st.es.u));}
function eLegendHTML(){const E=st.party?eSecs():null,ii=eSelII(),cnt={}; if(E) ii.forEach(i=>{const x=E.by[i]; if(x) cnt[x.seg]=(cnt[x.seg]||0)+1;});
  return `<div class="mcard es-leg"><small>Tipos de sección${st.party?' · '+esc(NM[st.party]):''}</small>${ESEG.map(g=>`<button data-eseg="${g[0]}" aria-pressed="${st.es.seg===g[0]}" title="${esc(g[2])}"><i style="background:${g[3]}"></i>${g[1]}<b>${cnt[g[0]]||0}</b></button>`).join('')}<div class="es-n">${esc(eLabel(eRef()))} · contorno oscuro: secciones de la ruta</div></div>`;}
METRICS.seg={party:1,est:1,n:'Tipo de sección',d:'',f:ii=>{if(!st.party) return null; const x=eSecs().by[ii[0]]; if(!x) return null; const dim=st.es.seg&&x.seg!==st.es.seg; return {c:ESC[x.seg][3],t:dim?.18:1};}};
let ERT=new Set();
function estPanel(){const C2=$('col'),p=st.party,ek=eRef(),lv=eLv(),nat=eNat(),o=EOBJ.find(x=>x[0]===st.es.obj)||EOBJ[0];
  const chips=(L,cur,attr)=>L.map(x=>`<button data-${attr}="${x[0]}" aria-pressed="${cur===x[0]}">${x[1]}</button>`).join('');
  let h=`<div class="colh"><b>Estrategia</b></div><div class="cd es">`;
  h+=`<div class="es-row"><span>Elección objetivo</span><div class="es-ch">${chips(EOBJ.map(x=>[x[0],x[1]]),st.es.obj,'eobj')}</div></div>`;
  h+=`<div class="es-row"><span>Analizar por</span><div class="es-ch">${chips(Object.entries(ELV).filter(([k])=>k==='est'?nat==='est':true),lv,'elv')}</div></div>`;
  if(!p){h+=`<p class="es-p">Elige el partido para el que quieres armar la estrategia:</p><div class="es-ch">${MAIN.map(q=>`<button data-epar="${q}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`; ERT=new Set(); return h;}
  const units=eUnits(),ii=eSelII(),du=eDuel(ek,ii,p);
  if(!du){h+=`<p class="es-p">${esc(NM[p])} no compitió en ${esc(eLabel(ek).toLowerCase())} en este territorio.</p></div>`; ERT=new Set(); return h;}
  const R=eRoute(ii,du.gap),where=st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST,rv=du.riv?du.riv.name:'',me=du.mine.name;
  ERT=new Set(R.c.slice(0,R.n).map(y=>y.x.i));
  let head,big,sub;
  if(nat!=='est'&&lv===nat&&st.es.u==null){const st2=units.map(u=>{const d=eDuel(ek,u.ii,p),r=eRoute(u.ii,d.gap); return {u,d,r};}),won=st2.filter(z=>z.d.gap<=0).length,can=st2.filter(z=>z.d.gap>0&&z.r.ok),secs=can.reduce((t,z)=>t+z.r.n,0);
    head=`${esc(me)} gana ${won} de ${units.length} ${{mun:'municipios',dl:'distritos locales',df:'distritos federales'}[lv]} con los resultados de ${D.E[ek].year}.`;
    const NN={mun:['municipio','municipios'],dl:['distrito local','distritos locales'],df:['distrito federal','distritos federales']}[lv];
    if(won===units.length){big='Defender'; sub=`Gana todos. Elige uno abajo para ver dónde ampliar su ventaja.`;}
    else if(!can.length){big='+0'; sub=`Con los supuestos actuales ningún ${NN[0]} perdido se alcanza. Sube los supuestos o revisa cada uno abajo.`;}
    else {big=`+${can.length}`; sub=`${can.length===1?NN[0]+' más se puede':NN[1]+' más se pueden'} ganar con la ruta, trabajando ${fmt(secs)} ${secs===1?'sección':'secciones'}. Elige uno abajo para ver su ruta.`;}}
  else if(du.gap>0){head=lv===nat||lv==='est'?`${esc(me)} necesita ${fmt(du.gap)} votos más que ${esc(rv)} para ganar ${esc(where)}.`:`En ${esc(where)}, ${esc(me)} está ${fmt(du.gap)} votos detrás de ${esc(rv)}.`; big=R.ok?fmt(R.n):'No alcanza'; sub=R.ok?`${R.n===1?'sección cubre':'secciones cubren'} la brecha: ${(()=>{const v=100*R.ln/lnOf(ii); return v<1?'menos de 1%':Math.round(v)+'%';})()} de la lista nominal de ${esc(where)}.`:`Aun sumando todas las secciones con oportunidad se llega a ${fmt(R.tot)} votos. Sube los supuestos o revisa la meta.`;}
  else {head=`${esc(me)} ya gana ${esc(where)} por ${fmt(-du.gap)} votos sobre ${esc(rv)}.`; big='Defender'; sub='La lista muestra dónde se pueden sumar más votos por elector para ampliar la ventaja.';}
  const prog=du.gap>0?Math.min(100,100*Math.min(R.acc,du.gap)/Math.max(du.gap,R.tot)):100,pot=du.gap>0?Math.max(0,100*(R.tot-Math.min(R.acc,du.gap))/Math.max(du.gap,R.tot)):0;
  h+=`<div class="es-meta"><p>${head}</p><div class="es-big"><b>${big}</b></div><p class="es-sub">${sub}</p>${du.gap>0&&!(nat!=='est'&&lv===nat&&st.es.u==null)?`<div class="es-bar"><i style="width:${prog.toFixed(1)}%"></i><u style="width:${pot.toFixed(1)}%"></u></div><div class="es-bl"><span>meta ${fmt(du.gap)}</span><span>potencial ${fmt(R.tot)}</span></div>`:''}</div>`;
  h+=`<label class="es-sl">Ocasionales que logras movilizar <b>${st.es.a}%</b><input type="range" min="5" max="50" step="5" value="${st.es.a}" data-esl="a"></label><label class="es-sl">Volátiles que logras convencer <b>${st.es.b}%</b><input type="range" min="5" max="40" step="5" value="${st.es.b}" data-esl="b"></label>`;
  if(lv!=='est'){const rows=units.map(u=>{const d=eDuel(ek,u.ii,p),r=eRoute(u.ii,d.gap); return {u,d,r};}).sort((a,b)=>(a.d.gap>0?0:1)-(b.d.gap>0?0:1)||Math.abs(a.d.gap)-Math.abs(b.d.gap));
    h+=`<div class="es-h">${lv===nat?'Dónde está en juego':'Contribución por '+ELV[lv].toLowerCase()}${st.es.u!=null?` <button class="es-x" data-eu="">Ver todo</button>`:''}</div><div class="es-ul">${rows.map(z=>`<button data-eu="${z.u.k}" aria-pressed="${String(st.es.u)===String(z.u.k)}"><span>${esc(eName(lv,z.u.k))}</span><em class="${z.d.gap>0?'dn':'up'}">${z.d.gap>0?'faltan '+fmt(z.d.gap):'gana +'+fmt(-z.d.gap)}</em><small>${z.d.gap>0?(z.r.ok?z.r.n+(z.r.n===1?' sección':' secciones'):'no alcanza con los supuestos actuales'):''}</small></button>`).join('')}</div>`;}
  const list=R.c.slice(0,du.gap>0?Math.min(R.n,15):12);
  h+=`<div class="es-h">Secciones de la ruta${R.n>15?` · primeras 15 de ${R.n}`:''}<button class="es-x" id="ecsv">Descargar CSV</button></div><div class="es-sec">${list.map(y=>`<button data-esec="${y.x.i}"><b>${S[y.x.i].s}</b><span>${esc(MUN[S[y.x.i].m])}<small><i style="background:${ESC[y.x.seg][3]}"></i>${ESC[y.x.seg][1]}</small></span><em>+${fmt(y.p)}</em><u>${du.gap>0?Math.min(100,Math.round(100*(y.acc||0)/du.gap))+'%':''}</u></button>`).join('')||'<p class="es-p">Sin secciones con este filtro.</p>'}</div>`;
  h+=`<p class="es-f">Fuente: INE, SEE ${D.E[ek].year}; ${esc(SRC.pad||'')}. Votos alcanzables = ocasionales × ${st.es.a}% + voto volátil × ${st.es.b}%. La ruta usa bastiones, competidas, persuadibles y movilizables. Estimación propia: indica dónde conviene trabajar, no garantiza votos.</p></div>`;
  return h;}
function estRender(){const C2=$('col'); C2.innerHTML=estPanel();
  const re=()=>{const lv=eLv(); if(st.es.u!=null&&lv!=='est') applyScope(lv,st.es.u); else applyScope('all',0);};
  C2.querySelectorAll('[data-eobj]').forEach(b=>b.onclick=()=>{st.es.obj=b.dataset.eobj; st.es.lv=null; st.es.u=null; st.elec=eRef(); $('elec').value=st.elec; applyScope('all',0);});
  C2.querySelectorAll('[data-elv]').forEach(b=>b.onclick=()=>{st.es.lv=b.dataset.elv; st.es.u=null; applyScope('all',0);});
  C2.querySelectorAll('[data-epar]').forEach(b=>b.onclick=()=>{st.party=b.dataset.epar; $('party').value=st.party; render(true);});
  C2.querySelectorAll('[data-eu]').forEach(b=>b.onclick=()=>{const v=b.dataset.eu; st.es.u=v===''?null:+v; if(st.es.u==null) applyScope('all',0); else re();});
  C2.querySelectorAll('[data-esl]').forEach(r=>r.oninput=()=>{st.es[r.dataset.esl]=+r.value; const t=r.previousElementSibling; if(t) t.textContent=r.value+'%';});
  C2.querySelectorAll('[data-esl]').forEach(r=>r.onchange=()=>{st.es[r.dataset.esl]=+r.value; render();});
  C2.querySelectorAll('[data-esec]').forEach(b=>b.onclick=()=>{const i=+b.dataset.esec; st.sel=i; paint(); fit([i]);});
  if($('ecsv')) $('ecsv').onclick=()=>{const ii=eSelII(),du=eDuel(eRef(),ii,st.party); if(!du) return; const R=eRoute(ii,du.gap),q=x=>'"'+String(x).replace(/"/g,'""')+'"';
    const lines=[['Orden','Sección','Municipio','Distrito local','Distrito federal','Tipo','Lista nominal','Votantes ocasionales','Voto volátil (%)','Votos alcanzables','Acumulado de la meta (%)'].map(q).join(',')].concat(R.c.slice(0,du.gap>0?R.n:R.c.length).map((y,j)=>[j+1,S[y.x.i].s,q(MUN[S[y.x.i].m]),S[y.x.i].dl,S[y.x.i].df,q(ESC[y.x.seg][1]),y.x.ln,Math.round(y.x.oc),(y.x.vol||0).toFixed(1),Math.round(y.p),du.gap>0?Math.min(100,100*(y.acc||0)/du.gap).toFixed(1):''].join(',')));
    saveFile(('Ruta_'+norm(EST)+'_'+st.es.obj+'_'+st.party+(st.es.u!=null?'_'+eLv()+st.es.u:'')).replace(/[^\w]+/g,'_')+'.csv','﻿'+lines.join('\n'),$('ecsv'));};}
