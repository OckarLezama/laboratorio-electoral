/* ===== Estrategia territorial =====
   Sin partido: panorama competitivo (bastiones de cada fuerza, competidas, persuadibles, movilizables).
   Con partido: escenarios (solo, coalición de la elección de referencia, alianza a la medida), meta de votos
   por unidad en disputa, ruta para ganar y meta de votos por sección. */
const ESEG=[['bas','Bastión','voto duro alto y ganó la sección','#1C7F79'],
  ['com','Competida','se decidió por menos de 5 puntos','#F46883'],
  ['per','Persuadible','mucho voto que cambia de partido entre elecciones','#F5A47C'],
  ['mov','Movilizable','muchos votantes ocasionales que no salieron a votar','#4CC1BA'],
  ['res','Sin prioridad','margen amplio sin rasgos de oportunidad','#C9D3D3'],
  ['adv','Territorio adverso','el rival tiene voto duro alto y más de 15 puntos de ventaja','#595959']];
const ESC=Object.fromEntries(ESEG.map(g=>[g[0],g]));
const EOBJ=[['GOB','Gubernatura','est'],['DIPL','Congreso local','dl'],['AYU','Ayuntamientos','mun'],['DIPF','Diputación federal','df'],['SEN','Senado','est']].filter(o=>lastOf(o[0]));
const ELV={est:'Estado',mun:'Municipio',dl:'Distrito local',df:'Distrito federal'};
const ENN={est:['estado','estados'],mun:['municipio','municipios'],dl:['distrito local','distritos locales'],df:['distrito federal','distritos federales']};
if(!st.es) st.es={obj:(EOBJ.find(o=>o[0]===(CFG.gob2027?'GOB':'DIPL'))||EOBJ[0])[0],lv:null,u:null,a:20,b:15,seg:null,sc:'s2',ally:null,col:'seg',tab:'sec',q:'',sk:'ord',sd:1};
const ECACHE={};
const eRef=()=>lastOf(st.es.obj);
const eNat=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[2];
const eLv=()=>st.es.lv||eNat();
const eKey=(lv,i)=>lv==='mun'?S[i].m:lv==='dl'?S[i].dl:lv==='df'?S[i].df:0;
const eName=(lv,k)=>lv==='mun'?MUN[k]:lv==='dl'?'Distrito local '+k+(CABDL[k]?' · '+CABDL[k]:''):lv==='df'?'Distrito federal '+k+(CABDF[k]?' · '+CABDF[k]:''):EST;
const eSide=A=>A.map(q=>NM[q]).join('-');
/* escenarios del partido elegido */
function eBlocOf(ek,p){const b=D.E[ek].blocs.find(b=>b.members.includes(p)); return b?b.members.filter(m=>m!=='OTROS'):[p];}
function eAlly(){const p=st.party,ek=eRef(); if(!p) return null; const co=eBlocOf(ek,p);
  if(st.es.sc==='s1') return [p]; if(st.es.sc==='s3'){const a=(st.es.ally||co).filter(q=>q!==p); return [p].concat(a);} return co;}
/* duelo: votos de la alianza A contra la fuerza más votada que queda (los bloques se rearman sin los partidos de A) */
function eDuel(ek,ii,A){const T=totals(ek,ii); if(!T.val) return null; const mine=A.reduce((t,q)=>t+(T.tot[q]||0),0); if(!mine) return null;
  let riv=null; D.E[ek].blocs.forEach(b=>{const rem=b.members.filter(m=>m!=='OTROS'&&!A.includes(m)); if(!rem.length) return; const v=rem.reduce((t,m)=>t+(T.tot[m]||0),0); if(!riv||v>riv.votes){const lead=rem.slice().sort((x,y)=>(T.tot[y]||0)-(T.tot[x]||0))[0]; riv={votes:v,members:rem,lead,name:rem.length>3?rem.slice(0,3).map(m=>NM[m]).join('-')+' y '+(rem.length-3)+' más':rem.map(m=>NM[m]).join('-')};}});
  return {T,mine,riv,gap:riv?Math.round(riv.votes-mine):-Math.round(mine),mg:100*(mine-(riv?riv.votes:0))/T.val};}
const q67=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y); return a.length?a[Math.floor(2*a.length/3)]:Infinity;};
/* datos por sección. Con partido: tipos respecto a la alianza. Sin partido: respecto al ganador de la sección */
function eSecs(){const ek=eRef(),A=eAlly(),key=ek+'|'+(A?A.join('+'):'gen'); if(ECACHE[key]) return ECACHE[key];
  const sumDuro=(ms,i)=>{let s=0,ok=false; ms.forEach(m=>{if(V2.duro[m]&&V2.duro[m][i]!=null){s+=V2.duro[m][i]; ok=true;}}); return ok?s:null;};
  const L=[]; ALL.forEach(i=>{const r=row(ek,i); if(!r||!r.val) return; const LN=S[i].ln||r.ln||0,oc=Math.max(0,(V2.maxT[i]||0)-(EXPT[i]||0))/100*LN;
    if(A){const du=eDuel(ek,[i],A); if(!du) return; L.push({i,mg:du.mg,mine:du.mine,rv:du.riv?du.riv.votes:0,rvL:du.riv?du.riv.lead:null,dp:sumDuro(A,i),dr:du.riv?sumDuro(du.riv.members,i):null,vol:V2.vol[i],oc,emit:r.t,ln:LN});}
    else {const w=winner(ek,[i]); if(!w) return; const b=w.bl[0]; L.push({i,mg:w.m,lead:w.lead,wn:b.name,dp:sumDuro(b.members.filter(m=>m!=='OTROS'),i),vol:V2.vol[i],oc,emit:r.t,ln:LN,mv:Math.round(b.votes-(w.bl[1]?w.bl[1].votes:0))});}});
  const tP=q67(L.map(x=>x.dp)),tR=q67(L.map(x=>x.dr)),tV=q67(L.map(x=>x.vol)),tO=q67(L.map(x=>x.ln?x.oc/x.ln:null));
  L.forEach(x=>{x.seg=A?(x.dp!=null&&x.dp>=tP&&x.mg>0?'bas':x.dr!=null&&x.dr>=tR&&x.mg<-15?'adv':Math.abs(x.mg)<5?'com':x.vol!=null&&x.vol>=tV?'per':x.ln&&x.oc/x.ln>=tO?'mov':'res')
    :(x.dp!=null&&x.dp>=tP&&x.mg>=15?'bas':x.mg<5?'com':x.vol!=null&&x.vol>=tV?'per':x.ln&&x.oc/x.ln>=tO?'mov':'res');});
  const by={}; L.forEach(x=>by[x.i]=x); return ECACHE[key]={L,by,A};}
const ePot=x=>x.oc*st.es.a/100+(x.vol||0)/100*x.emit*st.es.b/100;
/* ruta: bastiones, competidas, persuadibles y movilizables ordenadas por votos alcanzables por elector */
function eRoute(ii,gap){const E=eSecs(),c=ii.map(i=>E.by[i]).filter(x=>x&&x.seg!=='adv'&&x.seg!=='res'&&(!st.es.seg||x.seg===st.es.seg)).map(x=>({x,p:ePot(x)})).sort((a,b)=>b.p/(b.x.ln||1)-a.p/(a.x.ln||1));
  let acc=0,n=0,ln=0; const tot=c.reduce((t,y)=>t+y.p,0); c.forEach((y,j)=>{if(gap>0?acc<gap:j<12){acc+=y.p; ln+=y.x.ln; n++; y.ord=n; y.acc=acc;}});
  return {c,n,acc,ln,tot,ok:gap<=0||acc>=gap};}
const eGroups=lv=>{const g={}; ALL.forEach(i=>{const k=eKey(lv,i); (g[k]=g[k]||[]).push(i);}); return Object.entries(g).map(([k,ii])=>({k:+k,ii}));};
function eSelII(){const lv=eLv(); return st.es.u==null||lv==='est'?ALL:ALL.filter(i=>String(eKey(lv,i))===String(st.es.u));}
/* ganador por unidad del nivel elegido (para colorear el mapa por ganador) */
const EWIN={};
function eUnitWin(i){const ek=eRef(),lv=eLv(),key=ek+'|'+lv; if(!EWIN[key]){EWIN[key]={}; (lv==='est'?[{k:0,ii:ALL}]:eGroups(lv)).forEach(u=>EWIN[key][u.k]=winner(ek,u.ii));} return EWIN[key][eKey(lv,i)];}
METRICS.seg={party:1,est:1,n:'Estrategia',d:'',f:ii=>{const i=ii[0];
  if(st.es.col==='win'){const w=eUnitWin(i); return w?{c:C[w.lead],t:.4+.6*Math.min(1,w.m/20)}:null;}
  const x=eSecs().by[i]; if(!x) return null; const dim=st.es.seg&&x.seg!==st.es.seg,col=!st.party&&x.seg==='bas'?C[x.lead]:ESC[x.seg][3]; return {c:col,t:dim?.15:1};}};
let ERT=new Set();
function eLegendHTML(){const E=eSecs(),ii=eSelII(),cnt={}; ii.forEach(i=>{const x=E.by[i]; if(x){const k=!st.party&&x.seg==='bas'?'bas:'+x.lead:x.seg; cnt[k]=(cnt[k]||0)+1;}});
  const tg=`<div class="es-tg"><button data-ecol="seg" aria-pressed="${st.es.col!=='win'}">Tipo de sección</button><button data-ecol="win" aria-pressed="${st.es.col==='win'}">Ganador por ${ELV[eLv()].toLowerCase()}</button></div>`;
  if(st.es.col==='win'){const ws={}; (eLv()==='est'?[{k:0,ii:ALL}]:eGroups(eLv())).forEach(u=>{const w=winner(eRef(),u.ii); if(w) ws[w.lead]=(ws[w.lead]||0)+1;});
    return `<div class="mcard es-leg"><small>${esc(eLabel(eRef()))}</small>${tg}${Object.entries(ws).sort((a,b)=>b[1]-a[1]).map(([q,n])=>`<div class="es-li"><i style="background:${C[q]}"></i>${esc(NM[q])}${(D.E[eRef()].blocs.find(b=>b.lead===q)||{members:[]}).members.filter(m=>m!=='OTROS').length>1?' y aliados':''}<b>${n}</b></div>`).join('')}<div class="es-n">${ENN[eLv()][1]} ganados · la coalición toma el color de quien la encabeza</div></div>`;}
  const rows=[]; if(!st.party){Object.keys(cnt).filter(k=>k.startsWith('bas:')).sort((a,b)=>cnt[b]-cnt[a]).forEach(k=>{const q=k.slice(4); rows.push([k,'Bastión de '+NM[q],C[q],'voto duro alto de '+NM[q]+' y más de 15 puntos de ventaja']);});}
  ESEG.forEach(g=>{if(g[0]==='bas'&&!st.party) return; if(g[0]==='adv'&&!st.party) return; rows.push([g[0],g[0]==='bas'?'Bastión propio':g[1],g[3],g[2]]);});
  return `<div class="mcard es-leg"><small>${st.party?'Tipos de sección · '+esc(eSide(eAlly())):'Panorama competitivo'}</small>${tg}${rows.map(r=>{const k=r[0].split(':')[0]; return `<button data-eseg="${k}" aria-pressed="${st.es.seg===k}" title="${esc(r[3])}"><i style="background:${r[2]}"></i>${esc(r[1])}<b>${cnt[r[0]]||0}</b></button>`;}).join('')}<div class="es-n">${esc(eLabel(eRef()))}${st.party?' · contorno oscuro: secciones de la ruta':''}</div></div>`;}
function eUnitRows(){const lv=eLv(),ek=eRef(),A=eAlly(); if(lv==='est') return [];
  return eGroups(lv).map(u=>{if(A){const d=eDuel(ek,u.ii,A); if(!d) return null; const r=eRoute(u.ii,d.gap); return {u,d,r};} const w=winner(ek,u.ii); return w?{u,w}:null;}).filter(Boolean)
    .sort(A?(a,b)=>(a.d.gap>0?0:1)-(b.d.gap>0?0:1)||Math.abs(a.d.gap)-Math.abs(b.d.gap):(a,b)=>a.w.m-b.w.m);}
function estPanel(){const p=st.party,ek=eRef(),lv=eLv(),nat=eNat(),A=eAlly(),ii=eSelII(),where=st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST;
  const chips=(L,cur,attr)=>L.map(x=>`<button data-${attr}="${x[0]}" aria-pressed="${cur===x[0]}">${x[1]}</button>`).join('');
  let h=`<div class="colh"><button class="es-back" id="eback">← Volver al mapa</button><b style="margin-left:8px">Estrategia</b></div><div class="cd es">`;
  h+=`<div class="es-row"><span>Elección objetivo</span><div class="es-ch">${chips(EOBJ.map(x=>[x[0],x[1]]),st.es.obj,'eobj')}</div></div>`;
  h+=`<div class="es-row"><span>Analizar por</span><div class="es-ch">${chips(Object.entries(ELV).filter(([k])=>k==='est'?nat==='est':true),lv,'elv')}</div></div>`;
  h+=`<div class="es-row"><span>Partido</span><div class="es-ch"><button data-epar="" aria-pressed="${!p}">Ninguno · panorama</button>${MAIN.filter(q=>D.E[ek].blocs.some(b=>b.members.includes(q))).map(q=>`<button data-epar="${q}" aria-pressed="${p===q}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`;
  ERT=new Set();
  if(!p){const w=winner(ek,ii),U=eUnitRows(),close=U.filter(z=>z.w.m<5).length;
    h+=`<div class="es-meta"><p>${w?`En ${esc(where)}, ${esc(w.bl[0].name)} ganó ${esc(eLabel(ek).toLowerCase())} por ${w.m.toFixed(1)} puntos (${fmt(Math.round(w.bl[0].votes-(w.bl[1]?w.bl[1].votes:0)))} votos).`:'Sin resultados en esta selección.'}</p>${U.length?`<div class="es-big"><b>${close}</b></div><p class="es-sub">de ${U.length} ${ENN[lv][1]} se definieron por menos de 5 puntos. Elige un partido arriba para ver su meta y su ruta.</p>`:`<p class="es-sub">Elige un partido arriba para ver su meta de votos y su ruta para ganar.</p>`}</div>`;
    if(U.length) h+=`<div class="es-h">${ENN[lv][1][0].toUpperCase()+ENN[lv][1].slice(1)}, de más a menos competidos${st.es.u!=null?` <button class="es-x" data-eu="">Ver todo</button>`:''}</div><div class="es-ul">${U.map(z=>`<button data-eu="${z.u.k}" aria-pressed="${String(st.es.u)===String(z.u.k)}"><span><i class="es-d" style="background:${C[z.w.lead]}"></i>${esc(eName(lv,z.u.k))}</span><em class="${z.w.m<5?'dn':''}">${z.w.m.toFixed(1)} pts</em><small>${esc(z.w.bl[0].name)} sobre ${esc(z.w.bl[1]?z.w.bl[1].name:'—')}</small></button>`).join('')}</div>`;
    h+=`<button class="es-tb" id="etab">Ver tabla de secciones</button><p class="es-f">Fuente: INE, SEE ${D.E[ek].year}. Tipos de sección según el ganador de cada sección; estimación propia.</p></div>`;
    return h;}
  const co=eBlocOf(ek,p),scs=[['s1','Solo '+NM[p]]].concat(co.length>1?[['s2','Coalición '+D.E[ek].year+': '+eSide(co)]]:[]).concat([['s3','Alianza a la medida']]);
  if(co.length<2&&st.es.sc==='s2') st.es.sc='s1';
  const A2=eAlly();
  h+=`<div class="es-row"><span>Escenario</span><div class="es-ch">${chips(scs,st.es.sc,'esc')}</div>${st.es.sc==='s3'?`<div class="es-ch es-al">${D.P8.filter(q=>q!=='OTROS'&&q!==p&&D.E[ek].blocs.some(b=>b.members.includes(q))&&totals(ek,ALL).tot[q]>0).map(q=>`<button data-eal="${q}" aria-pressed="${A2.includes(q)}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div>`:''}</div>`;
  const du=eDuel(ek,ii,A2);
  if(!du){h+=`<p class="es-p">${esc(NM[p])} no compitió en ${esc(eLabel(ek).toLowerCase())} en este territorio.</p></div>`; return h;}
  const R=eRoute(ii,du.gap),me=eSide(A2),rv=du.riv?du.riv.name:'';
  ERT=new Set(R.c.slice(0,R.n).map(y=>y.x.i));
  let head,big,sub;
  const multi=nat!=='est'&&lv===nat&&st.es.u==null;
  if(multi){const U=eUnitRows(),won=U.filter(z=>z.d.gap<=0).length,can=U.filter(z=>z.d.gap>0&&z.r.ok),secs=can.reduce((t,z)=>t+z.r.n,0),NN=ENN[lv];
    head=`${esc(me)} gana ${won} de ${U.length} ${NN[1]} con los resultados de ${D.E[ek].year}.`;
    if(won===U.length){big='Defender'; sub='Gana todos. Elige uno abajo para ver dónde ampliar su ventaja.';}
    else if(!can.length){big='+0'; sub=`Con los supuestos actuales ningún ${NN[0]} perdido se alcanza. Sube los supuestos, prueba otro escenario o revisa cada uno abajo.`;}
    else {big=`+${can.length}`; sub=`${can.length===1?NN[0]+' más se puede':NN[1]+' más se pueden'} ganar con la ruta, trabajando ${fmt(secs)} ${secs===1?'sección':'secciones'}. Elige uno abajo para ver su meta.`;}}
  else if(du.gap>0){const sw=Math.ceil(du.gap/2)+1;
    head=lv===nat||lv==='est'?`Meta: ${fmt(Math.round(du.riv.votes)+1)} votos para ganar ${esc(where)}. ${esc(me)} tuvo ${fmt(Math.round(du.mine))}; le faltan ${fmt(du.gap)} frente a ${esc(rv)}.`:`En ${esc(where)}, ${esc(me)} está ${fmt(du.gap)} votos detrás de ${esc(rv)}.`;
    big=R.ok?fmt(R.n):'No alcanza'; sub=(R.ok?`${R.n===1?'sección cubre':'secciones cubren'} la brecha: ${(()=>{const v=100*R.ln/lnOf(ii); return v<1?'menos de 1%':Math.round(v)+'%';})()} de la lista nominal.`:`Aun sumando todas las secciones con oportunidad se llega a ${fmt(R.tot)} votos.`)+` Otra vía: que ${fmt(sw)} votantes de ${esc(rv)} (${(100*sw/du.riv.votes).toFixed(1)}% de sus votos) cambien a ${esc(me)}.`;}
  else {head=`${esc(me)} ya gana ${esc(where)} por ${fmt(-du.gap)} votos sobre ${esc(rv)}.`; big='Defender'; sub='La ruta muestra dónde se pueden sumar más votos por elector para ampliar la ventaja.';}
  const prog=du.gap>0?Math.min(100,100*Math.min(R.acc,du.gap)/Math.max(du.gap,R.tot)):100,pot=du.gap>0?Math.max(0,100*(R.tot-Math.min(R.acc,du.gap))/Math.max(du.gap,R.tot)):0;
  const cmp=scs.map(s=>{const sv=st.es.sc; st.es.sc=s[0]; const a=eAlly(); st.es.sc=sv; if(s[0]==='s3'&&a.length<2&&st.es.sc!=='s3') return ''; const d=eDuel(ek,ii,a); if(!d) return '';
    let txt; if(multi){const won=eGroups(lv).filter(u=>{const x=eDuel(ek,u.ii,a); return x&&x.gap<=0;}).length; txt=`gana ${won} de ${eGroups(lv).length}`;} else txt=d.gap>0?'faltan '+fmt(d.gap):'gana +'+fmt(-d.gap);
    return `<div class="es-cmp${s[0]===st.es.sc?' on':''}"><span>${esc(s[0]==='s3'?'Alianza: '+eSide(a):s[1].replace(/^Coalición \d+: /,'Coalición: '))}</span><b class="${multi?'':d.gap>0?'dn':'up'}">${txt}</b></div>`;}).join('');
  h+=`<div class="es-meta"><p>${head}</p><div class="es-big"><b>${big}</b></div><p class="es-sub">${sub}</p>${du.gap>0&&!multi?`<div class="es-bar"><i style="width:${prog.toFixed(1)}%"></i><u style="width:${pot.toFixed(1)}%"></u></div><div class="es-bl"><span>brecha ${fmt(du.gap)}</span><span>alcanzable ${fmt(R.tot)}</span></div>`:''}<div class="es-cmpw"><small>Comparación de escenarios</small>${cmp}</div></div>`;
  h+=`<label class="es-sl">Ocasionales que logras movilizar <b>${st.es.a}%</b><input type="range" min="5" max="50" step="5" value="${st.es.a}" data-esl="a"></label><label class="es-sl">Volátiles que logras convencer <b>${st.es.b}%</b><input type="range" min="5" max="40" step="5" value="${st.es.b}" data-esl="b"></label>`;
  if(lv!=='est'){const U=eUnitRows(); h+=`<div class="es-h">${lv===nat?'Dónde está en juego':'Por '+ENN[lv][0]}${st.es.u!=null?` <button class="es-x" data-eu="">Ver todo</button>`:''}</div><div class="es-ul">${U.map(z=>`<button data-eu="${z.u.k}" aria-pressed="${String(st.es.u)===String(z.u.k)}"><span>${esc(eName(lv,z.u.k))}</span><em class="${z.d.gap>0?'dn':'up'}">${z.d.gap>0?'faltan '+fmt(z.d.gap):'gana +'+fmt(-z.d.gap)}</em><small>meta ${fmt(Math.round(z.d.riv?z.d.riv.votes:0)+1)} votos${z.d.gap>0?' · '+(z.r.ok?z.r.n+(z.r.n===1?' sección':' secciones'):'no alcanza con los supuestos'):''}</small></button>`).join('')}</div>`;}
  const list=R.c.slice(0,Math.min(R.n,10));
  h+=`<div class="es-h">Ruta: primeras ${list.length} de ${R.n} secciones</div><div class="es-sec">${list.map(y=>`<button data-esec="${y.x.i}"><b>${S[y.x.i].s}</b><span>${esc(MUN[S[y.x.i].m])}<small><i style="background:${ESC[y.x.seg][3]}"></i>${y.x.seg==='bas'?'Bastión propio':ESC[y.x.seg][1]}</small></span><em>meta ${fmt(Math.round(y.x.mine+y.p))}</em><u>+${fmt(y.p)}</u></button>`).join('')||'<p class="es-p">Sin secciones con este filtro.</p>'}</div>`;
  h+=`<button class="es-tb" id="etab">Ver tabla de secciones y metas</button><p class="es-f">Fuente: INE, SEE ${D.E[ek].year}; ${esc(SRC.pad||'')}. Meta de la sección = votos que obtuvo + votos alcanzables (ocasionales × ${st.es.a}% + voto volátil × ${st.es.b}%). La ruta usa bastiones, competidas, persuadibles y movilizables. En los escenarios sin coalición, los votos de coalición se reparten en partes iguales. Estimación propia: indica dónde trabajar, no garantiza votos.</p></div>`;
  return h;}
/* tabla completa de secciones y metas */
function eTableRows(){const ek=eRef(),A=eAlly(),ii=eSelII(),E=eSecs(); let R=null,du=null; if(A){du=eDuel(ek,ii,A); if(du) R=eRoute(ii,du.gap);}
  const inR={}; if(R) R.c.forEach(y=>{if(y.ord) inR[y.x.i]=y;});
  return ii.map(i=>E.by[i]).filter(Boolean).map(x=>{const y=inR[x.i],pot=A?ePot(x):0; return {x,ord:y?y.ord:null,pot,meta:A?Math.round(x.mine+(y?y.p:0)):null,acc:y&&du&&du.gap>0?Math.min(100,100*y.acc/du.gap):null};});}
const ENUM=['s','dl','df','ln','mine','rv','dif','pot','meta','acc','mg','mv','oc','vol','ord'];
function eTable(){let m=$('estm'); if(!m){m=document.createElement('div'); m.id='estm'; m.className='estm'; document.body.appendChild(m);}
  const A=eAlly(),lv=eLv(),rows0=eTableRows(),q=norm(st.es.q||''),rows=rows0.filter(r=>!q||String(S[r.x.i].s).startsWith(q)||norm(MUN[S[r.x.i].m]).includes(q));
  const segN=x=>!st.party&&x.seg==='bas'?'Bastión de '+NM[x.lead]:x.seg==='bas'?'Bastión propio':ESC[x.seg][1];
  const cols=A?[['ord','Orden en la ruta',r=>r.ord||'—',r=>r.ord||1e9],['s','Sección',r=>S[r.x.i].s,r=>S[r.x.i].s],['mun','Municipio',r=>esc(MUN[S[r.x.i].m]),r=>MUN[S[r.x.i].m]],['dl','DL',r=>S[r.x.i].dl,r=>S[r.x.i].dl],['df','DF',r=>S[r.x.i].df,r=>S[r.x.i].df],['seg','Tipo',r=>`<i class="es-d" style="background:${ESC[r.x.seg][3]}"></i>${segN(r.x)}`,r=>r.x.seg],['ln','Lista nominal',r=>fmt(r.x.ln),r=>r.x.ln],['mine','Votos '+esc(eSide(A)),r=>fmt(Math.round(r.x.mine)),r=>r.x.mine],['rv','Votos del rival',r=>fmt(Math.round(r.x.rv)),r=>r.x.rv],['dif','Diferencia',r=>{const d=Math.round(r.x.mine-r.x.rv); return `<span class="${d>=0?'up':'dn'}">${d>=0?'+':''}${fmt(d)}</span>`;},r=>r.x.mine-r.x.rv],['pot','Votos alcanzables',r=>fmt(Math.round(r.pot)),r=>r.pot],['meta','Meta de votos',r=>`<b>${fmt(r.meta)}</b>`,r=>r.meta],['acc','Avance acumulado de la brecha',r=>r.acc==null?'—':r.acc.toFixed(0)+'%',r=>r.acc==null?-1:r.acc]]
    :[['s','Sección',r=>S[r.x.i].s,r=>S[r.x.i].s],['mun','Municipio',r=>esc(MUN[S[r.x.i].m]),r=>MUN[S[r.x.i].m]],['dl','DL',r=>S[r.x.i].dl,r=>S[r.x.i].dl],['df','DF',r=>S[r.x.i].df,r=>S[r.x.i].df],['seg','Tipo',r=>`<i class="es-d" style="background:${r.x.seg==='bas'?C[r.x.lead]:ESC[r.x.seg][3]}"></i>${segN(r.x)}`,r=>r.x.seg],['wn','Ganador',r=>esc(r.x.wn),r=>r.x.wn],['mg','Margen (pts)',r=>r.x.mg.toFixed(1),r=>r.x.mg],['mv','Diferencia (votos)',r=>fmt(r.x.mv),r=>r.x.mv],['ln','Lista nominal',r=>fmt(r.x.ln),r=>r.x.ln],['oc','Ocasionales',r=>fmt(Math.round(r.x.oc)),r=>r.x.oc],['vol','Voto volátil',r=>r.x.vol==null?'—':pct(r.x.vol,1),r=>r.x.vol||0]];
  const sk=cols.find(c=>c[0]===st.es.sk)?st.es.sk:(A?'ord':'mg'),sc=cols.find(c=>c[0]===sk),srt=(a,b)=>{const u=sc[3](a),v=sc[3](b); return (u>v?1:u<v?-1:0)*st.es.sd;}; rows.sort(srt);
  const U=eUnitRows(),ut=lv!=='est'&&U.length,lim=st.es.lim||300,cl=k=>ENUM.includes(k)?'r':'';
  const uniT=()=>`<table><thead><tr><th>${ELV[lv]}</th>${A?'<th class="r">Votos '+esc(eSide(A))+'</th><th>Rival</th><th class="r">Votos del rival</th><th class="r">Meta para ganar</th><th class="r">Faltan</th><th class="r">Secciones de la ruta</th>':'<th>Ganador</th><th class="r">Margen (pts)</th><th class="r">Diferencia (votos)</th>'}</tr></thead><tbody>${U.map(z=>A?`<tr data-eu="${z.u.k}"><td>${esc(eName(lv,z.u.k))}</td><td class="r">${fmt(Math.round(z.d.mine))}</td><td>${esc(z.d.riv?z.d.riv.name:'—')}</td><td class="r">${fmt(Math.round(z.d.riv?z.d.riv.votes:0))}</td><td class="r"><b>${fmt(Math.round(z.d.riv?z.d.riv.votes:0)+1)}</b></td><td class="r"><span class="${z.d.gap>0?'dn':'up'}">${z.d.gap>0?fmt(z.d.gap):'gana +'+fmt(-z.d.gap)}</span></td><td class="r">${z.d.gap>0?(z.r.ok?z.r.n:'no alcanza'):'—'}</td></tr>`:`<tr data-eu="${z.u.k}"><td>${esc(eName(lv,z.u.k))}</td><td><i class="es-d" style="background:${C[z.w.lead]}"></i>${esc(z.w.bl[0].name)}</td><td class="r">${z.w.m.toFixed(1)}</td><td class="r">${fmt(Math.round(z.w.bl[0].votes-(z.w.bl[1]?z.w.bl[1].votes:0)))}</td></tr>`).join('')}</tbody></table>`;
  const secT=()=>`<table><thead><tr>${cols.map(c=>`<th data-esk="${c[0]}" class="${cl(c[0])}">${c[1]}${c[0]===sk?(st.es.sd>0?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,lim).map(r=>`<tr class="${r.ord?'inr':''}" data-esec="${r.x.i}">${cols.map(c=>`<td class="${cl(c[0])}">${c[2](r)}</td>`).join('')}</tr>`).join('')}</tbody></table>${rows.length>lim?`<button class="es-x" id="estmore" style="margin:10px auto;display:block">Ver ${Math.min(300,rows.length-lim)} más de ${fmt(rows.length)}</button>`:''}`;
  const isU=st.es.tab==='uni'&&ut;
  m.innerHTML=`<div class="estm-b" role="dialog" aria-modal="true" aria-label="Tabla de estrategia"><div class="estm-h"><div><h3>${A?'Secciones y metas · '+esc(eSide(A)):'Secciones · panorama competitivo'}</h3><p>${esc(eLabel(eRef()))} · ${esc(st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST)} · ${fmt(rows0.length)} secciones</p></div><button class="x" id="estx" aria-label="Cerrar">✕</button></div>
   <div class="estm-t">${ut?`<div class="es-ch"><button data-etab="sec" aria-pressed="${!isU}">Secciones</button><button data-etab="uni" aria-pressed="${!!isU}">${ENN[lv][1][0].toUpperCase()+ENN[lv][1].slice(1)}</button></div>`:''}${isU?'':`<input id="estq" placeholder="Buscar sección o municipio" value="${esc(st.es.q||'')}">`}<button class="es-x" id="estcsv">Descargar CSV</button></div>
   <div class="estm-w">${isU?uniT():secT()}</div>
   <p class="es-f">${A?'Meta de votos de la sección = votos que obtuvo la alianza + votos alcanzables si la sección está en la ruta. Las filas resaltadas forman la ruta. ':''}Fuente: INE, SEE ${D.E[eRef()].year}; estimación propia.</p></div>`;
  m.classList.add('on');
  const close=()=>m.classList.remove('on'); $('estx').onclick=close; m.onclick=e=>{if(e.target===m) close();};
  m.querySelectorAll('[data-etab]').forEach(b=>b.onclick=()=>{st.es.tab=b.dataset.etab; eTable();});
  m.querySelectorAll('[data-esk]').forEach(t=>t.onclick=()=>{const k=t.dataset.esk; st.es.sd=st.es.sk===k?-st.es.sd:1; st.es.sk=k; eTable();});
  const qi=$('estq'); if(qi) qi.oninput=()=>{st.es.q=qi.value; st.es.lim=300; eTable(); const n=$('estq'); n.focus(); n.setSelectionRange(n.value.length,n.value.length);};
  if($('estmore')) $('estmore').onclick=()=>{st.es.lim=lim+300; eTable();};
  m.querySelectorAll('tr[data-esec]').forEach(r=>r.onclick=()=>{const i=+r.dataset.esec; close(); st.sel=i; paint(); fit([i]);});
  m.querySelectorAll('tr[data-eu]').forEach(r=>r.onclick=()=>{close(); st.es.u=+r.dataset.eu; st.es.tab='sec'; applyScope(lv,st.es.u);});
  $('estcsv').onclick=()=>{const qq=x=>'"'+String(x).replace(/"/g,'""')+'"',strip=h=>String(h).replace(/<[^>]+>/g,''),tmp=document.createElement('div');
    let lines; if(isU){tmp.innerHTML=uniT(); lines=[...tmp.querySelectorAll('tr')].map(tr=>[...tr.children].map(c=>qq(c.textContent)).join(','));}
    else lines=[cols.map(c=>qq(strip(c[1]))).join(',')].concat(rows0.slice().sort(srt).map(r=>cols.map(c=>qq(strip(c[2](r)))).join(',')));
    saveFile(('Estrategia_'+norm(EST)+'_'+st.es.obj+'_'+(A?A.join('-'):'panorama')+(st.es.u!=null?'_'+lv+st.es.u:'')+(isU?'_'+lv:'')).replace(/[^\w]+/g,'_')+'.csv','﻿'+lines.join('\n'),$('estcsv'));};}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('estm')&&$('estm').classList.contains('on')){$('estm').classList.remove('on'); e.stopImmediatePropagation();}},true);
/* al entrar: tomar la selección actual (partido, elección, territorio) */
function estEnter(){const t=st.elec?st.elec.split('_')[0]:null; if(t&&EOBJ.find(o=>o[0]===t)) st.es.obj=t;
  st.es.lv=null; st.es.u=null; st.es.seg=null; const f=st.f;
  if(st.terr){st.es.lv='mun'; st.es.u=+st.terr;} else if(f.dl.length===1){st.es.lv='dl'; st.es.u=f.dl[0];} else if(f.df.length===1){st.es.lv='df'; st.es.u=f.df[0];} else if(f.mun.length===1){st.es.lv='mun'; st.es.u=f.mun[0];}
  if(st.es.lv==='mun'&&eNat()==='mun') st.es.lv=null; if(st.es.lv==='dl'&&eNat()==='dl') st.es.lv=null; if(st.es.lv==='df'&&eNat()==='df') st.es.lv=null;
  st.elec=eRef(); $('elec').value=st.elec;}
function estRender(){const C2=$('col'); C2.innerHTML=estPanel();
  const go=()=>{const lv=eLv(); if(st.es.u!=null&&lv!=='est') applyScope(lv,st.es.u); else applyScope('all',0);};
  if($('eback')) $('eback').onclick=()=>setView2('map');
  C2.querySelectorAll('[data-eobj]').forEach(b=>b.onclick=()=>{st.es.obj=b.dataset.eobj; st.es.lv=null; st.es.u=null; st.elec=eRef(); $('elec').value=st.elec; go();});
  C2.querySelectorAll('[data-elv]').forEach(b=>b.onclick=()=>{st.es.lv=b.dataset.elv; st.es.u=null; go();});
  C2.querySelectorAll('[data-epar]').forEach(b=>b.onclick=()=>{st.party=b.dataset.epar; $('party').value=st.party; st.es.ally=null; st.es.seg=null; st.es.sk=st.party?'ord':'mg'; $('rPa').setAttribute('aria-pressed',!!st.party); render(true);});
  C2.querySelectorAll('[data-esc]').forEach(b=>b.onclick=()=>{st.es.sc=b.dataset.esc; if(st.es.sc==='s3'&&!st.es.ally) st.es.ally=eBlocOf(eRef(),st.party); render();});
  C2.querySelectorAll('[data-eal]').forEach(b=>b.onclick=()=>{const q=b.dataset.eal,a=(st.es.ally||[st.party]).slice(),j=a.indexOf(q); j>=0?a.splice(j,1):a.push(q); st.es.ally=a; render();});
  C2.querySelectorAll('[data-eu]').forEach(b=>b.onclick=()=>{const v=b.dataset.eu; st.es.u=v===''?null:+v; go();});
  C2.querySelectorAll('[data-esl]').forEach(r=>{r.oninput=()=>{const t=r.previousElementSibling; if(t) t.textContent=r.value+'%';}; r.onchange=()=>{st.es[r.dataset.esl]=+r.value; render();};});
  C2.querySelectorAll('.es-sec [data-esec]').forEach(b=>b.onclick=()=>{const i=+b.dataset.esec; st.sel=i; paint(); fit([i]);});
  if($('etab')) $('etab').onclick=()=>{st.es.q=''; st.es.lim=300; st.es.tab='sec'; eTable();};
  if($('estm')&&$('estm').classList.contains('on')) eTable();}
