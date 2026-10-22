/* ===== presentación (diapositivas 16:9) de la selección actual =====
   Se arma con los mismos datos del panel: territorio y filtros vigentes, elección de referencia y partido elegido.
   Se proyecta en pantalla completa y se descarga en PDF. */
const SLW=1280,SLH=720,TYS={GOB:'Gub.',DIPL:'Dip. loc.',AYU:'Ayunt.',PRE:'Presid.',SEN:'Senado',DIPF:'Dip. fed.'};
const slTitle=()=>st.terr?MUN[st.terr]:(()=>{const s=scopeLabel(); return !s||/^todo|^estado/i.test(s)?EST:s;})();
function slData(){const ii=scope().length?scope():ALL,ref=st.elec||lastOf(BASE.split('_')[0])||Object.keys(D.E).pop(),T=totals(ref,ii);
  const P=st.party||(T.bl[0]?T.bl[0].lead:'MORENA'),blocOf=(ek,p)=>D.E[ek].blocs.find(b=>b.members.includes(p));
  const els=Object.keys(D.E).filter(ek=>totals(ek,ii).val).sort((a,b)=>D.E[a].year-D.E[b].year||a.localeCompare(b));
  return {ii,ref,T,P,blocOf,els};}
/* gráficas en SVG con colores literales (se proyectan y se exportan igual) */
function slBars(W,H,rows,{max,lab=v=>pct(v,0),gap=18}={}){const n=rows.length,bw=Math.min(90,(W-gap*(n+1))/n),mx=max||Math.max(...rows.map(r=>r.v),1),base=H-34;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rows.map((r,j)=>{const x=gap+j*((W-gap)/n)+((W-gap)/n-gap-bw)/2,h=Math.max(2,(base-26)*r.v/mx);
    return `${r.v2!=null?`<rect x="${x+bw*.55}" y="${base-(base-26)*r.v2/mx}" width="${bw*.45}" height="${(base-26)*r.v2/mx}" rx="4" fill="#B9C1C1"/>`:''}<rect x="${x}" y="${base-h}" width="${r.v2!=null?bw*.5:bw}" height="${h}" rx="5" fill="${r.c}"/><text x="${x+(r.v2!=null?bw*.25:bw/2)}" y="${base-h-8}" text-anchor="middle" font-family="Manrope,Arial" font-weight="800" font-size="15" fill="#1C2121">${lab(r.v)}</text><text x="${x+bw/2}" y="${base+20}" text-anchor="middle" font-family="Inter,Arial" font-size="12.5" fill="#4E5656">${esc(r.l)}</text>`;}).join('')}<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="#E6EAEA"/></svg>`;}
function slLines(W,H,xs,series,{fmtY=v=>pct(v,0),max}={}){const l=46,r=46,t=18,b=44,mx=max||Math.max(...series.flatMap(s=>s.v.filter(v=>v!=null)),1)*1.12,X=j=>l+(xs.length<2?.5:j/(xs.length-1))*(W-l-r),Y=v=>t+(H-t-b)*(1-v/mx);
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  [0,.25,.5,.75,1].forEach(q=>{s+=`<line x1="${l}" x2="${W-r}" y1="${Y(mx*q)}" y2="${Y(mx*q)}" stroke="#EEF2F2"/><text x="${l-8}" y="${Y(mx*q)+4}" text-anchor="end" font-family="Inter,Arial" font-size="11" fill="#8A9393">${fmtY(mx*q)}</text>`;});
  xs.forEach((x,j)=>{s+=`<text x="${X(j)}" y="${H-24}" text-anchor="middle" font-family="Inter,Arial" font-size="11" fill="#4E5656">${esc(x[0])}</text><text x="${X(j)}" y="${H-10}" text-anchor="middle" font-family="Inter,Arial" font-size="10.5" fill="#8A9393">${esc(x[1]||'')}</text>`;});
  series.forEach(sr=>{const pts=sr.v.map((v,j)=>v==null?null:[X(j),Y(v)]),seg=[]; let cur=[]; pts.forEach(p=>{if(p) cur.push(p); else if(cur.length){seg.push(cur); cur=[];}}); if(cur.length) seg.push(cur);
    seg.forEach(c=>{s+=`<polyline points="${c.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${sr.c}" stroke-width="${sr.w||3}" stroke-linejoin="round" stroke-linecap="round"/>`;});
    pts.forEach((p,j)=>{if(p) s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${sr.w?5:4}" fill="#fff" stroke="${sr.c}" stroke-width="2.5"/>`;});
    const lj=pts.map((p,j)=>p?j:-1).filter(j=>j>=0).pop(); if(lj!=null&&lj>=0) s+=`<text x="${pts[lj][0]+8}" y="${pts[lj][1]-8}" font-family="Manrope,Arial" font-weight="800" font-size="13" fill="${sr.c}">${fmtY(sr.v[lj])}</text>`;});
  return s+'</svg>';}
function slDonut(R,parts){let a=-Math.PI/2,s=`<svg width="${2*R}" height="${2*R}" viewBox="0 0 ${2*R} ${2*R}">`; const tot=parts.reduce((x,p)=>x+p.v,0)||1;
  parts.forEach(p=>{const da=2*Math.PI*p.v/tot,a2=a+da,r=R-14,x1=R+r*Math.cos(a),y1=R+r*Math.sin(a),x2=R+r*Math.cos(a2-.001),y2=R+r*Math.sin(a2-.001); s+=`<path d="M${x1} ${y1}A${r} ${r} 0 ${da>Math.PI?1:0} 1 ${x2} ${y2}" fill="none" stroke="${p.c}" stroke-width="26"/>`; a=a2;});
  return s+'</svg>';}
const slHead=(n,t,sub)=>`<div class="sl-h"><span class="sl-n">${n}</span><div><h2>${t}</h2>${sub?`<p>${sub}</p>`:''}</div><span class="sl-tag">${esc(slTitle())}</span></div>`;
const slFoot=()=>`<div class="sl-f">Laboratorio Político · ${esc(EST)} · Fuente: ${esc(SRC.res||'INE')}; ${esc(SRC.pad||'DERFE')}. Voto duro, participación esperada y metas: estimación propia.</div>`;
const slK=(v,l,c)=>`<div class="sl-k"><b${c?` style="color:${c}"`:''}>${v}</b><span>${l}</span></div>`;
async function slBuild(){const {ii,ref,T,P,blocOf,els}=slData(),title=slTitle(),yr=D.E[ref].year,PN=NM[P]||P,PC=C[P]||'#1C7F79',out=[];
  const date=new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
  /* 1 · portada */
  out.push(`<section class="sl sl-cover"><div class="sl-cv"><i></i><i></i><i></i></div><div class="sl-ct"><small>${esc(EST)}${st.terr?'':' · '+esc(scopeLabel())}</small><h1>${esc(title)}</h1><p>Análisis político electoral</p><div class="sl-cm"><span>Elección de referencia: <b>${esc(eLabel(ref))}</b></span><span>Partido en foco: <b style="color:${PC}">${esc(PN)}</b></span></div><em>${date}</em></div></section>`);
  /* 2 · contexto: electorado */
  const dm=demo(ii),ln=lnOf(ii),agL=[0,0,0,0,0,0,0]; ii.forEach(i=>{const r=DM[i]; if(r) for(let j=0;j<7;j++) agL[j]+=(r[4+j]||0)+(r[11+j]||0);}); const agT=agL.reduce((a,b)=>a+b,0)||1;
  const AGN=['18–24','25–29','30–39','40–49','50–59','60–64','65+'],nm=new Set(ii.map(i=>S[i].m)).size,ndl=new Set(ii.map(i=>S[i].dl)).size,ndf=new Set(ii.map(i=>S[i].df)).size;
  let mapImg=''; try{const {s,H}=mapSVG(1400); mapImg=await rasterSVG(s,1400,H);}catch(e){}
  out.push(`<section class="sl">${slHead(1,'Contexto político','Quién compone el electorado · '+esc(CORTE))}<div class="sl-g2"><div class="sl-col">
    <div class="sl-ks">${slK(fmt(ln),'lista nominal')}${slK(fmt(dm.pe||ln),'padrón')}${slK(fmt(nSec(ii)),'secciones')}</div>
    <div class="sl-ks">${slK(fmt(nm),nm===1?'municipio':'municipios')}${slK(fmt(ndl),'distritos locales')}${slK(fmt(ndf),'distritos federales')}</div>
    <div class="sl-sex">${slDonut(70,[{v:dm.m,c:'#F46883'},{v:dm.h,c:'#4CC1BA'}])}<div><p><b style="color:#F46883">${pct(dm.mj,0)}</b> mujeres</p><p><b style="color:#2FA59D">${pct(100-dm.mj,0)}</b> hombres</p></div></div>
    <h3>Lista nominal por edad</h3>${slBars(560,200,agL.map((v,j)=>({v:100*v/agT,l:AGN[j],c:j<2?'#1C7F79':j>4?'#8A9393':'#4CC1BA'})),{gap:12})}</div>
    <div class="sl-map">${mapImg?`<img src="${mapImg}" alt="">`:''}<p>${esc(METRICS[st.metric]?METRICS[st.metric].n:'')} · ${esc(eLabel(st.elec||ref))}</p></div></div>${slFoot()}</section>`);
  /* 3 · votantes por edad y resultado */
  const at=a=>{const L=[0,0,0,0,0,0,0],V=[0,0,0,0,0,0,0]; a.forEach(i=>{const r=V2.age[AGEY][i]; if(!r) return; for(let j=0;j<7;j++){L[j]+=r[j]; V[j]+=r[7+j];}}); return L.map((l,j)=>l?100*V[j]/l:0);},A1=at(ii),A0=at(ALL);
  const pv=prevOf(ref),T0=pv?totals(pv,ii):null,top=T.bl.filter(b=>b.votes>0).slice(0,4),wonS=ek=>{const c={}; ii.forEach(i=>{const w=winner(ek,[i]); if(w) c[w.lead]=(c[w.lead]||0)+1;}); return c;},W1=wonS(ref),W0=pv?wonS(pv):{};
  const cmpRow=b=>{const o=T0&&T0.bl.find(x=>x.members.some(m=>b.members.includes(m)&&m===b.lead)); return {d:o?b.votes-o.votes:null,dp:o?b.pct-o.pct:null,ds:pv?(W1[b.lead]||0)-(W0[b.lead]||0):null};};
  out.push(`<section class="sl">${slHead(2,'Votantes y resultado',`Participación por edad en ${AGEY} (verde: ${esc(title)}; gris: ${esc(EST)}) · ${esc(eLabel(ref))}`)}<div class="sl-g2"><div class="sl-col">
    <div class="sl-ks">${slK(pct(T.turn,1),'participación '+yr)}${slK(fmt(T.t),'votos totales')}${slK(pct(A1[0],0),'votó de 18–24 años')}</div>
    <h3>¿Quién sale a votar?</h3>${slBars(560,300,A1.map((v,j)=>({v,v2:A0[j],l:AGN[j],c:'#2FA59D'})),{max:100,gap:12})}</div>
    <div class="sl-col"><h3>Resultado ${esc(eLabel(ref))}</h3><div class="sl-res">${top.map(b=>{const c=cmpRow(b),up=v=>v==null?'':`<em class="${v>=0?'up':'dn'}">${v>=0?'▲':'▼'} ${typeof v==='number'&&Math.abs(v)<100&&v%1?Math.abs(v).toFixed(1)+' pts':fmt(Math.abs(v))}</em>`;
      return `<div class="sl-rr"><i style="background:${b.c}"></i><span class="nm">${esc(b.name)}</span><b>${pct(b.pct,1)}</b><span class="vv">${fmt(b.votes)} votos</span><span class="ss">${fmt(W1[b.lead]||0)} secc.</span>${pv?`<span class="cm">vs ${D.E[pv].year}: ${up(c.dp)} ${c.ds!=null?`<em class="${c.ds>=0?'up':'dn'}">${c.ds>=0?'+':'−'}${Math.abs(c.ds)} secc.</em>`:''}</span>`:''}</div>`;}).join('')}</div>
    ${T.bl[1]?`<p class="sl-note"><b>${esc(T.bl[0].name)}</b> ganó por <b>${(T.bl[0].pct-T.bl[1].pct).toFixed(1)} puntos</b> (${fmt(T.bl[0].votes-T.bl[1].votes)} votos) sobre ${esc(T.bl[1].name)}.</p>`:''}</div></div>${slFoot()}</section>`);
  /* 4 · escenario: qué secciones conservar, cuidar, disputar */
  const CAT=[['con','Conservar','gana por 10 pts o más','#1C7F79'],['cui','Cuidar','gana por menos de 10 pts','#4CC1BA'],['dis','Disputar','pierde por menos de 10 pts','#F5A47C'],['dif','Difícil','pierde por 10 pts o más','#B9C1C1']];
  const G={}; CAT.forEach(c=>G[c[0]]={n:0,ln:0,mine:0,riv:0,L:[]}); const PB=blocOf(ref,P);
  ii.forEach(i=>{const r=row(ref,i); if(!r||!r.val) return; const mine=PB?PB.members.reduce((a,m)=>a+(r.v[m]||0),0):0; let rv=0; D.E[ref].blocs.forEach(b=>{if(b===PB) return; const v=b.members.reduce((a,m)=>a+(m==='OTROS'?0:(r.v[m]||0)),0); if(v>rv) rv=v;});
    const mg=100*(mine-rv)/r.val,k=mg>=10?'con':mg>=0?'cui':mg>-10?'dis':'dif',g=G[k]; g.n++; g.ln+=S[i].ln||0; g.mine+=mine; g.riv+=rv; if(k==='dis') g.L.push({i,f:Math.round(rv-mine)+1,tp:r.ln?100*r.t/r.ln:0});});
  const nT=ii.length||1,dis=G.dis.L.sort((a,b)=>a.f-b.f).slice(0,8);
  out.push(`<section class="sl">${slHead(3,'Escenario electoral',`${esc(PN)}${PB&&PB.members.length>1?' y su coalición':''} sección por sección · ${esc(eLabel(ref))}`)}<div class="sl-g2"><div class="sl-col">
    <div class="sl-cats">${CAT.map(c=>{const g=G[c[0]]; return `<div style="--c:${c[3]}"><b>${fmt(g.n)}</b><span class="t">${c[1]}</span><span>${c[2]}</span><span class="m">${pct(100*g.n/nT,0)} de las secciones · ${k(g.ln)} electores</span></div>`;}).join('')}</div>
    <div class="sl-stack">${CAT.map(c=>`<i style="width:${(100*G[c[0]].n/nT).toFixed(2)}%;background:${c[3]}"></i>`).join('')}</div>
    <p class="sl-note">Con su votación de ${yr}, ${esc(PN)} ganaría <b>${fmt(G.con.n+G.cui.n)}</b> de ${fmt(ii.length)} secciones. Las <b>${fmt(G.dis.n)}</b> por disputar suman <b>${k(G.dis.ln)}</b> electores: ahí se define la elección.</p></div>
    <div class="sl-col"><h3>Secciones por disputar más cercanas</h3>${dis.length?`<table class="sl-t"><thead><tr><th>Sección</th><th>Municipio</th><th>Le faltaron</th><th>Participación</th></tr></thead><tbody>${dis.map(x=>`<tr><td><b>${S[x.i].s}</b></td><td>${esc(MUN[S[x.i].m]||'')}</td><td>${fmt(x.f)} votos</td><td>${pct(x.tp,0)}</td></tr>`).join('')}</tbody></table>`:'<p class="sl-note">No hay secciones perdidas por menos de 10 puntos.</p>'}</div></div>${slFoot()}</section>`);
  /* 5 · votación esperada y meta */
  const expT=wavg(EXPT,ii)||0,expV=ln*expT/100,vr=T.t?T.val/T.t:.96,expVal=expV*vr,bal=balance(ii,P),shP=PB?PB.members.reduce((a,m)=>a+(T.tot[m]||0),0)/(T.val||1):0;
  let rvB=null; T.bl.forEach(b=>{if(PB&&b.lead===PB.lead) return; if(!rvB||b.votes>rvB.votes) rvB=b;}); const shR=rvB?rvB.votes/(T.val||1):0,eP2=shP*expVal,eR=shR*expVal,meta=Math.max(eR+1,expVal*.5*(shR>0?0:1));
  const sameT=els.filter(ek=>ek.split('_')[0]===ref.split('_')[0]),secW=sameT.map(ek=>{const c=wonS(ek),b=blocOf(ek,P); return b?c[b.lead]||0:0;}),secR=rvB?sameT.map(ek=>{const c=wonS(ek),b=blocOf(ek,rvB.lead); return b?c[b.lead]||0:0;}):null;
  out.push(`<section class="sl">${slHead(4,'Votación esperada y meta',`Próxima elección de ${esc(TY[ref.split('_')[0]]||'')} con la lista nominal vigente`)}<div class="sl-g2"><div class="sl-col">
    <div class="sl-ks">${slK(fmt(expV),'votos esperados')}${slK(pct(expT,1),'participación esperada')}${slK(fmt(ln-expV),'abstención esperada')}</div>
    <div class="sl-ks">${slK(fmt(eP2),'votos esperados de '+esc(PN),PC)}${rvB?slK(fmt(eR),'de '+esc(rvB.name),rvB.c):''}</div>
    <div class="sl-meta"><span>Meta de votación de ${esc(PN)}</span><b>${fmt(meta)}</b><small>${eP2>=eR?'Mantener la ventaja: ':'Le faltan '+fmt(meta-eP2)+' votos. '}uno más que lo esperado del rival principal si se repite ${yr}.</small></div>
    <div class="sl-ks">${slK(pct(bal.own,1),'voto duro de '+esc(PN),PC)}${slK(pct(bal.vol,1),'voto volátil')}${slK(pct(bal.est,1),'abstención estructural')}</div></div>
    <div class="sl-col"><h3>Secciones ganadas en ${esc(TY[ref.split('_')[0]]||'')}</h3>${slLines(560,330,sameT.map(ek=>[String(D.E[ek].year)]),[{v:secW,c:PC,w:4}].concat(secR?[{v:secR,c:rvB.c}]:[]),{fmtY:v=>fmt(v)})}
    <div class="sl-lg"><span><i style="background:${PC}"></i>${esc(PN)}${PB&&PB.members.length>1?' y aliados':''}</span>${rvB?`<span><i style="background:${rvB.c}"></i>${esc(rvB.name)}</span>`:''}</div></div></div>${slFoot()}</section>`);
  /* 6 · histórico */
  const EL=els.slice(-10),LB=(t,p)=>t.bl.find(b=>b.lead===p),inA=(t,p)=>t.bl.find(b=>b.lead!==p&&b.members.includes(p)),PS=MAIN.filter(p=>EL.some(ek=>LB(totals(ek,ii),p))).slice(0,6);
  out.push(`<section class="sl">${slHead(5,'Histórico electoral',`${esc(title)} · ${D.E[EL[0]].year}–${D.E[EL[EL.length-1]].year} · porcentaje de la votación válida del partido o de la coalición que encabeza`)}<div class="sl-hist">
    <table class="sl-t sl-th"><thead><tr><th>Elección</th>${PS.map(p=>`<th style="color:${C[p]}">${NM[p]}</th>`).join('')}<th>Particip.</th><th>Ganó</th><th>Ventaja</th></tr></thead><tbody>${EL.map(ek=>{const t=totals(ek,ii),w=t.bl[0];
      return `<tr><td><b>${TYS[ek.split('_')[0]]||ek}</b> ${D.E[ek].year}</td>${PS.map(p=>{const b=LB(t,p),a=inA(t,p); return `<td>${b?pct(b.pct,1):a?`<small>con ${esc(NM[a.lead]||a.lead)}</small>`:'—'}</td>`;}).join('')}<td>${pct(t.turn,1)}</td><td><i style="background:${w.c}"></i>${esc(NM[w.lead]||w.lead)}</td><td>${t.bl[1]?(w.pct-t.bl[1].pct).toFixed(1)+' pts':'—'}</td></tr>`;}).join('')}</tbody></table>
    ${slLines(1180,250,EL.map(ek=>[TYS[ek.split('_')[0]]||'',String(D.E[ek].year)]),PS.map(p=>({v:EL.map(ek=>{const b=LB(totals(ek,ii),p); return b?b.pct:null;}),c:C[p],w:p===P?4:null})))}</div>${slFoot()}</section>`);
  return out;}
/* visor */
let SLI=0;
async function openSlides(btn){const o=btn&&btn.innerHTML; if(btn){btn.disabled=true; btn.textContent='Preparando…';} await new Promise(r=>setTimeout(r,40));
  let S6; try{S6=await slBuild();}catch(e){console.error(e); toast('No se pudo armar la presentación.'); if(btn){btn.disabled=false; btn.innerHTML=o;} return;}
  if(btn){btn.disabled=false; btn.innerHTML=o;}
  const d=document.createElement('div'); d.id='deck'; d.className='deck'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Presentación');
  d.innerHTML=`<div class="dk-bar"><b>${esc(slTitle())}</b><span id="dkn"></span><div class="dk-sp"></div><button id="dkfs">Pantalla completa</button><button id="dkpdf">Descargar PDF</button><button id="dkx" aria-label="Cerrar">✕</button></div>
    <div class="dk-stage" id="dks"><div class="dk-track" id="dkt">${S6.join('')}</div><button class="dk-nav p" id="dkp" aria-label="Anterior">‹</button><button class="dk-nav n" id="dkn2" aria-label="Siguiente">›</button></div>
    <div class="dk-dots" id="dkd">${S6.map((_,j)=>`<button data-j="${j}" aria-label="Diapositiva ${j+1}"></button>`).join('')}</div>`;
  document.body.appendChild(d); SLI=0;
  const fit=()=>{const s=$('dks'),r=s.getBoundingClientRect(),z=Math.min(r.width/SLW,r.height/SLH); $('dkt').style.transform=`translate(${(r.width-SLW*z)/2}px,${(r.height-SLH*z)/2}px) scale(${z})`;};
  const show=j=>{SLI=Math.max(0,Math.min(S6.length-1,j)); d.querySelectorAll('.dk-track>.sl').forEach((s,k)=>s.classList.toggle('on',k===SLI)); d.querySelectorAll('#dkd button').forEach((b,k)=>b.setAttribute('aria-pressed',k===SLI)); $('dkn').textContent=`${SLI+1} de ${S6.length}`;};
  const close=()=>{removeEventListener('keydown',key); removeEventListener('resize',fit); if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); d.remove();};
  const key=e=>{if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault(); show(SLI+1);} else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault(); show(SLI-1);} else if(e.key==='Escape'&&!document.fullscreenElement) close(); else if(e.key==='f') $('dkfs').click();};
  addEventListener('keydown',key); addEventListener('resize',fit); document.addEventListener('fullscreenchange',()=>setTimeout(fit,60));
  $('dkx').onclick=close; $('dkp').onclick=()=>show(SLI-1); $('dkn2').onclick=()=>show(SLI+1); d.querySelectorAll('#dkd button').forEach(b=>b.onclick=()=>show(+b.dataset.j));
  $('dks').addEventListener('click',e=>{if(e.target.closest('button')) return; const r=$('dks').getBoundingClientRect(); show(SLI+(e.clientX>r.left+r.width/2?1:-1));});
  $('dkfs').onclick=()=>{document.fullscreenElement?document.exitFullscreen():d.requestFullscreen&&d.requestFullscreen().catch(()=>{});};
  $('dkpdf').onclick=()=>slPDF($('dkpdf'),S6);
  fit(); show(0);}
async function slPDF(btn,S6){if(!window.jspdf||!window.html2canvas){toast('No se pudo cargar el generador de PDF. Recarga la página.'); return;} const o=btn.textContent; btn.disabled=true; btn.textContent='Generando…';
  const host=document.createElement('div'); host.className='dk-print'; host.innerHTML=S6.join(''); document.body.appendChild(host);
  try{await (document.fonts?document.fonts.ready:Promise.resolve()); const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'px',format:[SLW,SLH],hotfixes:['px_scaling']}); const sl=[...host.children];
    for(let j=0;j<sl.length;j++){btn.textContent=`Generando ${j+1}/${sl.length}…`; const cv=await html2canvas(sl[j],{scale:1.6,width:SLW,height:SLH,backgroundColor:'#ffffff',logging:false}); if(j) doc.addPage([SLW,SLH],'landscape'); doc.addImage(cv.toDataURL('image/jpeg',.9),'JPEG',0,0,SLW,SLH);}
    await saveFile(('Presentacion_'+norm(slTitle())+'_'+(st.elec||'')+(st.party?'_'+st.party:'')).replace(/[^\w]+/g,'_')+'.pdf',doc.output('blob'));}
  catch(e){console.error(e); toast('No se pudo generar el PDF de la presentación.');}
  finally{host.remove(); btn.disabled=false; btn.textContent=o;}}
if($('presb')) $('presb').onclick=()=>openSlides($('presb'));
