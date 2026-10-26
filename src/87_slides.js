/* ===== presentación (diapositivas 16:9) e informe PDF de la selección actual =====
   Usa el territorio y filtros vigentes, la elección de referencia y el combo "Analizar como":
   - con partido elegido, toda la presentación es de ese partido (y su coalición en cada elección);
   - en "Vista general", es una lectura de la competencia entre todas las fuerzas.
   El botón Informe PDF descarga exactamente estas mismas diapositivas. */
const SLW=1280,SLH=720,TYS={GOB:'Gubernatura',DIPL:'Dip. locales',AYU:'Ayuntamiento',PRE:'Presidencia',SEN:'Senado',DIPF:'Dip. federales'};
const SLF='Manrope,Inter,Arial,sans-serif',SLI2='Inter,Arial,sans-serif',SLG='#8A9393',SLK='#1C2121',SLL='#E9EEEE';
const slTitle=()=>st.terr?MUN[st.terr]:(()=>{const s=scopeLabel(); return !s||/^todo|^estado/i.test(s)?EST:s;})();
const slPN=p=>NM[p]||p,slSgn=(v,d=1,u=' pts')=>(v>=0?'+':'−')+Math.abs(v).toFixed(d)+u;
/* ---------- gráficas (SVG con colores literales: se ven igual en pantalla y en PDF) ---------- */
function gHBar(W,rows,{max,fv=v=>pct(v,1),lw=170,rh=34}={}){const mx=max||Math.max(...rows.map(r=>r.v),1),bw=W-lw-80,H=rows.length*rh;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rows.map((r,j)=>{const y=j*rh,w=Math.max(3,bw*r.v/mx),op=r.dim?.35:1;
    return `<text x="0" y="${y+rh/2+5}" font-family="${SLI2}" font-size="14" font-weight="${r.hl?700:500}" fill="${r.hl?SLK:'#4E5656'}">${esc(fitT(r.l,22))}</text><rect x="${lw}" y="${y+7}" width="${bw}" height="${rh-14}" rx="${(rh-14)/2}" fill="#F2F5F5"/><rect x="${lw}" y="${y+7}" width="${w}" height="${rh-14}" rx="${(rh-14)/2}" fill="${r.c}" opacity="${op}"/><text x="${lw+bw+12}" y="${y+rh/2+6}" font-family="${SLF}" font-size="16" font-weight="800" fill="${r.hl?SLK:'#4E5656'}">${fv(r.v)}</text>`;}).join('')}</svg>`;}
function gCols(W,H,rows,{max,fv=v=>pct(v,0),leg}={}){const n=rows.length,slot=W/n,bw=Math.min(52,slot*.55),mx=max||Math.max(...rows.flatMap(r=>[r.v,r.v2||0]),1),base=H-30,hh=base-26;
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="${SLL}"/>`;
  rows.forEach((r,j)=>{const x=j*slot+(slot-bw)/2,h=Math.max(2,hh*r.v/mx); s+=`<rect x="${x}" y="${base-h}" width="${bw}" height="${h}" rx="6" fill="${r.c}"/>`;
    if(r.v2!=null){const y2=base-hh*r.v2/mx; s+=`<line x1="${x-6}" x2="${x+bw+6}" y1="${y2}" y2="${y2}" stroke="${SLK}" stroke-width="2.5" stroke-linecap="round"/>`;}
    s+=`<text x="${x+bw/2}" y="${base-h-9}" text-anchor="middle" font-family="${SLF}" font-weight="800" font-size="15" fill="${SLK}">${fv(r.v)}</text><text x="${x+bw/2}" y="${base+20}" text-anchor="middle" font-family="${SLI2}" font-size="12.5" fill="#4E5656">${esc(r.l)}</text>`;});
  return s+'</svg>';}
/* línea de tendencia para diapositivas: área suave bajo la serie principal, rejilla por año, etiquetas al final
   y, si hay proyección (serie.pj={v,lo,hi}), columna 2027 con tramo punteado y banda de rango */
function gLine(W,H,xs,series,{fv=v=>pct(v,0),max,min=0,pjLabel}={}){const hasPJ=series.some(s=>s.pj),xx=hasPJ?xs.concat([[pjLabel||'Proyección','2027']]):xs,n=xx.length,l=48,r=160,t=22,b=50,
  vals=series.flatMap(s=>s.v.filter(v=>v!=null).concat(s.pj?[s.pj.hi]:[])),mx=max||Math.ceil(Math.max(...vals,1)*1.12/10)*10,X=j=>l+(n<2?.5:j/(n-1))*(W-l-r),Y=v=>t+(H-t-b)*(1-(v-min)/(mx-min)),cw=(W-l-r)/Math.max(1,n-1);
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${series.filter(x=>x.hl).map((x,k)=>`<linearGradient id="ga${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${x.c}" stop-opacity=".22"/><stop offset="1" stop-color="${x.c}" stop-opacity="0"/></linearGradient>`).join('')}</defs>`;
  if(hasPJ) s+=`<rect x="${(X(n-1)-cw/2).toFixed(1)}" y="${t-14}" width="${(cw/2+r-20).toFixed(1)}" height="${H-b-t+14}" rx="10" fill="#F4F7F7"/>`;
  [0,.25,.5,.75,1].forEach(q=>{const v=min+(mx-min)*q; s+=`<line x1="${l}" x2="${W-r+24}" y1="${Y(v)}" y2="${Y(v)}" stroke="${q?'#EEF2F2':'#DCE3E3'}"/><text x="${l-10}" y="${Y(v)+4}" text-anchor="end" font-family="${SLI2}" font-size="11" fill="${SLG}">${fv(v)}</text>`;});
  xx.forEach((x,j)=>{const pj=hasPJ&&j===n-1; s+=`<line x1="${X(j)}" x2="${X(j)}" y1="${t}" y2="${H-b}" stroke="#F0F3F3"/><text x="${X(j)}" y="${H-28}" text-anchor="middle" font-family="${SLI2}" font-size="12" font-weight="${pj?800:600}" fill="${pj?SLK:'#4E5656'}">${esc(x[0])}</text><text x="${X(j)}" y="${H-12}" text-anchor="middle" font-family="${SLI2}" font-size="11" fill="${SLG}">${esc(x[1]||'')}</text>`;});
  const ends=[]; let gk=0; series.slice().sort((a,b)=>(a.hl?1:0)-(b.hl?1:0)).forEach(sr=>{const pts=sr.v.map((v,j)=>v==null?null:[X(j),Y(v)]),op=sr.dim?.3:1,sw=sr.hl?4.5:2.4; let cur=[]; const seg=[]; pts.forEach(p=>{if(p) cur.push(p); else if(cur.length){seg.push(cur); cur=[];}}); if(cur.length) seg.push(cur);
    if(sr.hl&&seg.length){const c=seg[seg.length-1]; if(c.length>1) s+=`<path d="M${c[0][0]},${Y(min)} ${c.map(p=>'L'+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')} L${c[c.length-1][0]},${Y(min)}Z" fill="url(#ga${gk++})"/>`;}
    seg.forEach(c=>{s+=`<polyline points="${c.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${sr.c}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"/>`;});
    const lj=pts.map((p,j)=>p?j:-1).filter(j=>j>=0).pop();
    if(sr.pj&&lj!=null&&lj>=0){const x2=X(n-1),y2=Y(sr.pj.v); s+=`<line x1="${x2}" x2="${x2}" y1="${Y(sr.pj.hi)}" y2="${Y(sr.pj.lo)}" stroke="${sr.c}" stroke-width="${sr.hl?18:10}" stroke-linecap="round" opacity="${sr.hl?.22:.12}"/><line x1="${pts[lj][0]}" y1="${pts[lj][1]}" x2="${x2}" y2="${y2}" stroke="${sr.c}" stroke-width="${sw*.8}" stroke-dasharray="6 5" stroke-linecap="round" opacity="${op}"/><circle cx="${x2}" cy="${y2}" r="${sr.hl?6.5:4.5}" fill="#fff" stroke="${sr.c}" stroke-width="2.5" stroke-dasharray="3 2" opacity="${op}"/>`;
      ends.push({y:y2,t:`${sr.l} ${fv(sr.pj.v)}`,sub:sr.hl?`rango ${fv(sr.pj.lo)}–${fv(sr.pj.hi)}`:'',c:sr.c,op,hl:sr.hl});}
    else if(lj!=null&&lj>=0) ends.push({y:pts[lj][1],t:`${sr.l} ${fv(sr.v[lj])}`,c:sr.c,op,hl:sr.hl});
    if(sr.hl) pts.forEach((p,j)=>{if(p) s+=`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#fff" stroke="${sr.c}" stroke-width="2.6"/><text x="${p[0]}" y="${p[1]-12}" text-anchor="middle" font-family="${SLF}" font-weight="800" font-size="13" fill="${sr.c}" paint-order="stroke" stroke="#fff" stroke-width="4">${fv(sr.v[j])}</text>`;});});
  ends.sort((a,b)=>a.y-b.y); for(let k=1;k<ends.length;k++){const g=ends[k-1].sub?30:17; if(ends[k].y-ends[k-1].y<g) ends[k].y=ends[k-1].y+g;}
  ends.forEach(e=>{const x=W-r+(hasPJ?34:30); s+=`<text x="${x}" y="${e.y+4}" font-family="${SLI2}" font-size="${e.hl?13.5:12}" font-weight="${e.hl?800:600}" fill="${e.c}" opacity="${e.op<1?.65:1}">${esc(e.t)}</text>${e.sub?`<text x="${x}" y="${e.y+19}" font-family="${SLI2}" font-size="11" fill="${SLG}">${esc(e.sub)}</text>`:''}`;});
  return s+'</svg>';}
function gSlope(W,H,a,b,rows,fv=v=>pct(v,1)){const l=110,r=190,t=34,bt=16,vals=rows.flatMap(x=>[x.a,x.b].filter(v=>v!=null)),mx=Math.max(...vals,1)*1.08,Y=v=>t+(H-t-bt)*(1-v/mx);
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><text x="${l}" y="16" text-anchor="middle" font-family="${SLI2}" font-size="13" font-weight="700" fill="${SLG}">${esc(a)}</text><text x="${W-r}" y="16" text-anchor="middle" font-family="${SLI2}" font-size="13" font-weight="700" fill="${SLG}">${esc(b)}</text><line x1="${l}" x2="${l}" y1="${t-6}" y2="${H-bt}" stroke="${SLL}"/><line x1="${W-r}" x2="${W-r}" y1="${t-6}" y2="${H-bt}" stroke="${SLL}"/>`;
  const sep=k=>{const L=rows.filter(x=>x[k]!=null).map(x=>({x,y:Y(x[k])})).sort((a,b)=>a.y-b.y); for(let j=1;j<L.length;j++) if(L[j].y-L[j-1].y<17) L[j].y=L[j-1].y+17; L.forEach(o=>o.x['_'+k]=o.y);}; sep('a'); sep('b');
  rows.forEach(x=>{const op=x.dim?.35:1,sw=x.hl?4:2.4; if(x.a!=null&&x.b!=null) s+=`<line x1="${l}" x2="${W-r}" y1="${Y(x.a)}" y2="${Y(x.b)}" stroke="${x.c}" stroke-width="${sw}" opacity="${op}"/>`;
    if(x.a!=null) s+=`<circle cx="${l}" cy="${Y(x.a)}" r="5" fill="${x.c}" opacity="${op}"/><text x="${l-12}" y="${x._a+5}" text-anchor="end" font-family="${SLF}" font-size="14" font-weight="800" fill="${x.c}" opacity="${op}">${fv(x.a)}</text>`;
    if(x.b!=null) s+=`<circle cx="${W-r}" cy="${Y(x.b)}" r="5" fill="${x.c}" opacity="${op}"/><text x="${W-r+12}" y="${x._b+5}" font-family="${SLF}" font-size="14" font-weight="800" fill="${x.c}" opacity="${op}">${fv(x.b)} <tspan font-family="${SLI2}" font-weight="600" font-size="12">${esc(fitT(x.l,18))}</tspan></text>`;});
  return s+'</svg>';}
function gBullet(W,{mine,riv,meta,lbl,rl,c,rc}){const mx=Math.max(mine,riv,meta)*1.12||1,X=v=>W*v/mx;
  return `<svg width="${W}" height="96" viewBox="0 0 ${W} 96"><rect x="0" y="34" width="${W}" height="26" rx="13" fill="#F2F5F5"/><rect x="0" y="34" width="${X(mine)}" height="26" rx="13" fill="${c}"/>
    <line x1="${X(riv)}" x2="${X(riv)}" y1="26" y2="68" stroke="${rc}" stroke-width="3"/><text x="${X(riv)}" y="84" text-anchor="${X(riv)>W*.7?'end':X(riv)<W*.3?'start':'middle'}" font-family="${SLI2}" font-size="12" font-weight="600" fill="${rc}">${esc(rl)} ${fmt(riv)}</text>
    <line x1="${X(meta)}" x2="${X(meta)}" y1="22" y2="72" stroke="${SLK}" stroke-width="2" stroke-dasharray="4 3"/><text x="${X(meta)}" y="16" text-anchor="${X(meta)>W*.7?'end':'middle'}" font-family="${SLI2}" font-size="12" font-weight="700" fill="${SLK}">Meta ${fmt(meta)}</text>
    <text x="10" y="52" font-family="${SLF}" font-size="13" font-weight="800" fill="#fff">${esc(lbl)} ${fmt(mine)}</text></svg>`;}
const gStack=(parts)=>`<div class="sl-stk">${parts.filter(p=>p.v>0).map(p=>`<i style="flex:${p.v};background:${p.c}" title="${esc(p.l)}"></i>`).join('')}</div><div class="sl-stl">${parts.map(p=>`<span><i style="background:${p.c}"></i>${esc(p.l)} <b>${fmt(p.v)}</b></span>`).join('')}</div>`;
/* ---------- datos ---------- */
function slData(){const ii=scope().length?scope():ALL,ref=st.elec||lastOf(BASE.split('_')[0])||Object.keys(D.E).pop(),T=totals(ref,ii),P=st.party||null;
  const blocOf=(ek,p)=>totals(ek,ii).bl.find(b=>b.members.includes(p)),els=Object.keys(D.E).filter(ek=>totals(ek,ii).val).sort((a,b)=>D.E[a].year-D.E[b].year||a.localeCompare(b));
  const won=ek=>{const c={}; ii.forEach(i=>{const w=winner(ek,[i]); if(w) c[w.lead]=(c[w.lead]||0)+1;}); return c;};
  return {ii,ref,T,P,blocOf,els,won,pv:prevOf(ref)};}
/* margen por sección del partido (o de su coalición) contra la mejor fuerza rival */
function slMargins(ref,ii,PB){const out=[]; ii.forEach(i=>{const r=row(ref,i); if(!r||!r.val) return;
  /* bloques de esa sección: donde la coalición no fue, cada partido cuenta aparte */
  const sb=totals(ref,[i]).bl,my=sb.find(b=>b.members.includes(PB.lead))||sb.find(b=>b.members.some(m=>PB.members.includes(m)));
  const sum=b=>b.members.reduce((a,m)=>a+(m==='OTROS'?0:(r.v[m]||0)),0),mine=my?sum(my):0; let rv=0;
  sb.forEach(b=>{if(b===my) return; const v=sum(b); if(v>rv) rv=v;}); out.push({i,mine,rv,mg:100*(mine-rv)/r.val,tp:r.ln?100*r.t/r.ln:0,ln:S[i].ln||0});}); return out;}
/* serie de proyección 2027 (cargo consultado) para un partido o su coalición */
function slPJ(T27,ii,p,coal){if(!T27||typeof pjParties!=='function') return null; const pp=pjParties(T27,ii); if(!pp) return null;
  const b=pjBlocs(T27).find(ms=>ms.includes(p)); if(!b) return null; if(!coal&&b[0]!==p) return null;
  const ms=coal?b:[p],v=ms.reduce((a,m)=>a+(pp[m]?pp[m].v:0),0),d=pp[p]?(pp[p].hi-pp[p].v):5; return {v,lo:Math.max(0,v-d),hi:v+d};}
/* ---------- armado ---------- */
async function slBuild(){const {ii,ref,T,P,blocOf,els,won,pv}=slData(),title=slTitle(),yr=D.E[ref].year,TYP=ref.split('_')[0],CARGO=TY[TYP]||'';
  const T27=typeof PJT!=='undefined'&&PJT[TYP]&&typeof pjType==='function'&&pjOK()?TYP:null;
  const PB=P?blocOf(ref,P):null,PBT=PB?T.bl.find(b=>b.lead===PB.lead):null,AC=P?(C[P]||'#1C7F79'):'#1C7F79',party=!!(P&&PBT),W0=T.bl[0],W1=T.bl[1];
  const pName=party?(PBT.members.filter(m=>m!=='OTROS').length>1?`${slPN(P)} y aliados`:slPN(P)):'',N=[];
  const date=new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),tot=8;
  const head=(t,sub)=>`<header class="sl-h"><div><h2>${t}</h2>${sub?`<p>${sub}</p>`:''}</div><span class="sl-pg">${esc(title)}<b>${N.length+1}</b></span></header>`;
  const foot=`<footer class="sl-f"><span>Laboratorio Político</span><span>Fuente: ${esc(SRC.res||'INE')}; ${esc(SRC.pad||'DERFE')}. Voto duro, participación esperada y metas: estimación propia.</span></footer>`;
  const K=(v,l,c,sub)=>`<div class="sl-k"><b${c?` style="color:${c}"`:''}>${v}</b><span>${l}</span>${sub?`<em>${sub}</em>`:''}</div>`;
  const slide=(h,body,cls='')=>{N.push(`<section class="sl ${cls}" style="--ac:${AC}">${h}<div class="sl-b">${body}</div>${foot}</section>`);};
  const ln=lnOf(ii),dm=demo(ii),nm=new Set(ii.map(i=>S[i].m)).size,ndl=new Set(ii.map(i=>S[i].dl)).size,ndf=new Set(ii.map(i=>S[i].df)).size,W=won(ref),Wp=pv?won(pv):{},T0=pv?totals(pv,ii):null;
  const nSecR=Object.values(W).reduce((a,b)=>a+b,0)||1;
  /* 1 · portada */
  N.push(`<section class="sl sl-cover" style="--ac:${AC}"><div class="sl-cv"><span class="sl-dot"></span><small>${esc(EST)}${(()=>{const l=scopeLabel(); return st.terr||!l||l===EST||/^todo/i.test(l)||l===title?'':' · '+esc(l);})()}</small><h1>${esc(title)}</h1>
    <p>${party?`Análisis político electoral de <b style="color:${AC}">${esc(slPN(P))}</b>`:'Análisis político electoral · panorama de la competencia'}</p>
    <dl><div><dt>Elección de referencia</dt><dd>${esc(eLabel(ref))}</dd></div><div><dt>Lista nominal</dt><dd>${fmt(ln)}</dd></div><div><dt>Fecha</dt><dd>${date}</dd></div></dl></div><footer class="sl-f"><span>Laboratorio Político</span><span>${esc(CORTE)}</span></footer></section>`);
  /* 2 · resumen ejecutivo */
  const M=party?slMargins(ref,ii,PB):null,mp=M?{con:M.filter(x=>x.mg>=10),cui:M.filter(x=>x.mg>=0&&x.mg<10),dis:M.filter(x=>x.mg<0&&x.mg>-10),dif:M.filter(x=>x.mg<=-10)}:null;
  const rank=party?T.bl.indexOf(PBT)+1:1,rivB=party?(rank===1?W1:W0):W1,gapP=party&&rivB?PBT.pct-rivB.pct:0;
  const P0=party&&T0?T0.bl.find(b=>b.members.includes(P)):null,dP=P0?PBT.pct-P0.pct:null,secP=party?(W[PBT.lead]||0):0,secP0=party&&pv&&P0?(Wp[P0.lead]||0):null;
  const bal=balance(ii,party?P:null),expT=wavg(EXPT,ii)||0,expV=ln*expT/100,vr=T.t?T.val/T.t:.96,expVal=expV*vr;
  const own=party?(T.tot[P]||0):0;
  let pts=[],kp='';
  if(party){kp=K(pct(PBT.pct,1),`${esc(pName)} · ${CARGO} ${yr}`,AC,`${fmt(PBT.votes)} votos`)+K(`${rank}º`,'lugar',null,rivB?`${slSgn(gapP)} vs ${esc(fitT(rivB.name,22))}`:'')+K(`${fmt(secP)}`,`secciones ganadas de ${fmt(nSecR)}`,null,secP0!=null?`${slSgn(secP-secP0,0,'')} vs ${D.E[pv].year}`:'')+(bal.own>=1?K(pct(bal.own,1),`voto duro de ${esc(slPN(P))}`,AC,'estimación por sección'):K(pct(100*own/(T.val||1),1),`votos propios de ${esc(slPN(P))}`,AC,`${fmt(own)} votos, sin aliados`));
    pts.push(`<b>${esc(pName)}</b> obtuvo <b>${pct(PBT.pct,1)}</b> en ${esc(eLabel(ref))} y quedó en <b>${rank}º lugar</b>${rivB?`, ${gapP>=0?'con':'a'} <b>${Math.abs(gapP).toFixed(1)} puntos</b> ${gapP>=0?'de ventaja sobre':'de'} ${esc(rivB.name)}`:''}.`);
    if(dP!=null) pts.push(`Frente a ${D.E[pv].year} ${dP>=0?'creció':'cayó'} <b>${Math.abs(dP).toFixed(1)} puntos</b>${secP0!=null?` y ${secP-secP0>=0?'sumó':'perdió'} <b>${fmt(Math.abs(secP-secP0))} secciones</b>`:''}.`);
    if(own&&PBT.members.length>1&&!(D.E[ref].cc||[]).some(g=>g.includes(P))) pts.push(`De los votos de la coalición, <b>${pct(100*own/PBT.votes,0)}</b> fueron de ${esc(slPN(P))} por sí solo.`);
    pts.push(`Hay <b>${fmt(mp.dis.length)} secciones por disputar</b> (perdería por menos de 10 puntos) con <b>${k(mp.dis.reduce((a,x)=>a+x.ln,0))}</b> electores: ahí está el crecimiento más rápido.`);}
  else{const cl=ii.map(i=>winner(ref,[i])).filter(Boolean),c5=cl.filter(w=>w.m<5).length;
    kp=K(pct(W0.pct,1),`${esc(fitT(W0.name,26))}`,W0.c,`${fmt(W0.votes)} votos`)+K(W1?(W0.pct-W1.pct).toFixed(1)+' pts':'—','margen sobre el 2º lugar',null,W1?esc(fitT(W1.name,26)):'')+K(pct(T.turn,1),`participación ${yr}`,null,`${fmt(T.t)} votos`)+K(fmt(c5),'secciones con menos de 5 pts',null,`de ${fmt(cl.length)} con resultado`);
    pts.push(`<b>${esc(W0.name)}</b> ganó ${esc(eLabel(ref))} con <b>${pct(W0.pct,1)}</b>${W1?`, <b>${(W0.pct-W1.pct).toFixed(1)} puntos</b> arriba de ${esc(W1.name)}`:''}.`);
    if(T0&&T0.bl[0]) pts.push(`En ${D.E[pv].year} ganó ${esc(T0.bl[0].name)} con ${pct(T0.bl[0].pct,1)}${T0.bl[0].lead===W0.lead?': la misma fuerza repite':': hubo alternancia'}.`);
    pts.push(`Encabezó <b>${fmt(W[W0.lead]||0)}</b> de ${fmt(nSecR)} secciones; <b>${fmt(c5)}</b> se definieron por menos de 5 puntos.`);
    pts.push(`Participación de <b>${pct(T.turn,1)}</b>; la esperada para la próxima elección es <b>${pct(expT,0)}</b>.`);}
  const sameR=els.filter(ek=>ek.split('_')[0]===TYP).slice(-5),FOC=party?[P]:[W0.lead].concat(W1?[W1.lead]:[]),rS=FOC.map((p,k)=>({l:party&&PBT.members.length>1&&k===0?slPN(p)+'+':slPN(p),c:C[p]||'#1C7F79',hl:k===0,v:sameR.map(ek=>{const t=totals(ek,ii),b=t.bl.find(b=>b.members.includes(p)); return b?b.pct:null;}),pj:slPJ(T27,ii,p,true)}));
  slide(head('Resumen ejecutivo',esc(eLabel(ref))+' · '+esc(title)),`<div class="sl-kr">${kp}</div><div class="sl-rs"><ul class="sl-pts">${pts.map(p=>`<li>${p}</li>`).join('')}</ul><div class="sl-rc"><h3>${esc(CARGO)}: trayectoria${T27?' y proyección 2027':''}</h3>${gLine(560,250,sameR.map(ek=>[String(D.E[ek].year)]),rS)}</div></div>`);
  /* 3 · electorado */
  const agL=[0,0,0,0,0,0,0]; ii.forEach(i=>{const r=DM[i]; if(r) for(let j=0;j<7;j++) agL[j]+=(r[4+j]||0)+(r[11+j]||0);}); const agT=agL.reduce((a,b)=>a+b,0)||1,AGN=['18–24','25–29','30–39','40–49','50–59','60–64','65+'];
  const at=a=>{const L=[0,0,0,0,0,0,0],V=[0,0,0,0,0,0,0]; a.forEach(i=>{const r=V2.age[AGEY]&&V2.age[AGEY][i]; if(!r) return; for(let j=0;j<7;j++){L[j]+=r[j]; V[j]+=r[7+j];}}); return L.map((l,j)=>l?100*V[j]/l:0);},A1=at(ii),A0=at(ALL);
  let mapImg=''; try{const {s,H}=mapSVG(1400); mapImg=await rasterSVG(s,1400,H);}catch(e){}
  slide(head('Quién vota',`Lista nominal ${esc(CORTE)} · participación por edad en ${AGEY}`),`<div class="sl-g2"><div>
    <div class="sl-kr k3">${K(fmt(ln),'lista nominal')}${K(fmt(nSec(ii)),'secciones')}${K(nm>1?fmt(nm):fmt(ndl),nm>1?'municipios':'distritos locales')}</div>
    <div class="sl-sx"><div style="flex:${dm.m};background:#F46883"><b>${pct(dm.mj,0)}</b> mujeres</div><div style="flex:${dm.h};background:#2FA59D"><b>${pct(100-dm.mj,0)}</b> hombres</div></div>
    <h3>Peso de cada edad en la lista nominal</h3>${gCols(560,130,agL.map((v,j)=>({v:100*v/agT,l:AGN[j],c:j<2?AC:'#C9D6D5'})))}
    <h3>Cuánto vota cada edad <small>barra: ${esc(fitT(title,24))} · línea: ${esc(EST)}</small></h3>${gCols(560,130,A1.map((v,j)=>({v,v2:A0[j],l:AGN[j],c:v>=A0[j]?'#2FA59D':'#9FD9D4'})),{max:100})}</div>
    <figure class="sl-map">${mapImg?`<img src="${mapImg}" alt="">`:''}<figcaption>${esc(METRICS[st.metric]?METRICS[st.metric].n:'')} · ${esc(eLabel(st.elec||ref))}</figcaption></figure></div>`);
  /* 4 · resultado */
  const bars=T.bl.filter(b=>b.votes>0).slice(0,6).map(b=>({l:b.name,v:b.pct,c:b.c,hl:party?b===PBT:b===W0,dim:party&&b!==PBT}));
  const slR=T0?T.bl.filter(b=>b.votes>0).slice(0,4).map(b=>{const o=T0.bl.find(x=>x.lead===b.lead); return {l:b.name,a:o?o.pct:null,b:b.pct,c:b.c,hl:party?b===PBT:false,dim:party&&b!==PBT};}):[];
  slide(head(`Resultado ${esc(eLabel(ref))}`,party?`${esc(pName)} frente a las demás fuerzas`:'Porcentaje de la votación válida por coalición'),`<div class="sl-g2"><div><h3>Votación por coalición</h3>${gHBar(560,bars,{lw:190,rh:Math.min(54,Math.max(40,270/Math.max(1,bars.length)))})}
    <div class="sl-kr k3 sm">${K(pct(T.turn,1),'participación')}${K(fmt(T.t),'votos totales')}${K(fmt(nSecR),'secciones con resultado')}</div><h3>Secciones ganadas</h3>${gHBar(560,T.bl.filter(b=>W[b.lead]).slice(0,4).map(b=>({l:b.name,v:W[b.lead],c:b.c,hl:party?b===PBT:b===W0,dim:party&&b!==PBT})),{fv:v=>fmt(v),lw:190,rh:34})}</div>
    <div>${T0?`<h3>Cambio frente a ${esc(eLabel(pv))}</h3>${gSlope(560,420,String(D.E[pv].year),String(yr),slR)}`:`<h3>Secciones ganadas</h3>${gHBar(560,T.bl.filter(b=>W[b.lead]).map(b=>({l:b.name,v:W[b.lead],c:b.c,hl:party&&b===PBT,dim:party&&b!==PBT})),{fv:v=>fmt(v),lw:190})}`}</div></div>`);
  /* 5 · territorio */
  const UK=nm>1?'m':ndl>1?'dl':ndf>1?'df':null;
  const secTop=()=>{const L=ii.slice().sort((a,b)=>(S[b].ln||0)-(S[a].ln||0)).slice(0,9-Math.max(2,0)).map(i=>{const t=totals(ref,[i]),w=t.bl[0],pb=party?t.bl.find(b=>b.members.includes(P)):null; return {i,w,m:w&&t.bl[1]?w.pct-t.bl[1].pct:0,pp:pb?pb.pct:null,pm:pb?pb.pct-(t.bl.find(b=>b!==pb)||{pct:0}).pct:null};}).filter(x=>x.w);
    return `<h3>Secciones con más electores</h3><table class="sl-t"><thead><tr><th>Sección</th><th>${nm>1?'Municipio':'Distrito local'}</th><th class="r">Electores</th><th>Ganó</th><th class="r">Margen</th>${party?`<th class="r">${esc(slPN(P))}</th><th class="r">Ventaja</th>`:''}</tr></thead><tbody>${L.slice(0,7).map(x=>`<tr><td><b>${S[x.i].s}</b></td><td>${esc(nm>1?MUN[S[x.i].m]||'':'DL '+S[x.i].dl)}</td><td class="r">${fmt(S[x.i].ln)}</td><td><i class="sl-d" style="background:${x.w.c}"></i>${esc(fitT(x.w.name,20))}</td><td class="r">${x.m.toFixed(1)} pts</td>${party?`<td class="r"><b style="color:${AC}">${x.pp!=null?pct(x.pp,1):'—'}</b></td><td class="r ${x.pm>=0?'up':'dn'}">${x.pm!=null?slSgn(x.pm):'—'}</td>`:''}</tr>`).join('')}</tbody></table>`;};
  if(UK){const UN=v=>UK==='m'?MUN[v]:(UK==='dl'?'Distrito local ':'Distrito federal ')+v,G={}; ii.forEach(i=>(G[S[i][UK]]=G[S[i][UK]]||[]).push(i));
    const U=Object.keys(G).map(u=>{const t=totals(ref,G[u]),w=t.bl[0],pb=party?t.bl.find(b=>b.members.includes(P)):null;
      return {n:UN(u),ln:lnOf(G[u]),w,m:w&&t.bl[1]?w.pct-t.bl[1].pct:0,pp:pb?pb.pct:null,pm:pb?pb.pct-(t.bl.find(b=>b!==pb)||{pct:0}).pct:null,sw:0};}).sort((a,b)=>b.ln-a.ln).slice(0,9);
    const lnT=ln||1;
    slide(head('Dónde está el voto',`${UK==='m'?'Municipios':'Distritos'} con más electores · ${esc(eLabel(ref))}`),`<table class="sl-t sl-tb"><thead><tr><th>${UK==='m'?'Municipio':'Distrito'}</th><th class="r">Electores</th><th>Peso</th><th>Ganó</th><th class="r">Margen</th>${party?`<th class="r">${esc(slPN(P))}</th><th class="r">Ventaja</th>`:''}</tr></thead><tbody>${U.map(u=>`<tr><td><b>${esc(u.n)}</b></td><td class="r">${fmt(u.ln)}</td><td><i class="sl-mb"><u style="width:${(100*u.ln/lnT).toFixed(1)}%;background:${AC}"></u></i>${pct(100*u.ln/lnT,0)}</td><td><i class="sl-d" style="background:${u.w?u.w.c:'#ccc'}"></i>${esc(u.w?fitT(u.w.name,20):'—')}</td><td class="r">${u.m.toFixed(1)} pts</td>${party?`<td class="r"><b style="color:${AC}">${u.pp!=null?pct(u.pp,1):'—'}</b></td><td class="r ${u.pm>=0?'up':'dn'}">${u.pm!=null?slSgn(u.pm):'—'}</td>`:''}</tr>`).join('')}</tbody></table>${U.length<5?secTop():''}`);}
  /* 6 · escenario por sección */
  if(party){const CAT=[['con','Conservar','ganaría por 10 puntos o más',AC],['cui','Defender','ganaría por menos de 10',mix(AC,.45)],['dis','Disputar','perdería por menos de 10','#F46883'],['dif','Contener','perdería por 10 o más','#C9D1D1']],nT=M.length||1;
    const top=mp.dis.slice().sort((a,b)=>(a.rv-a.mine)-(b.rv-b.mine)).slice(0,8);
    slide(head('Escenario sección por sección',`${esc(pName)} con su votación de ${yr} contra la fuerza más votada de cada sección`),`<div class="sl-g2"><div>
      <div class="sl-cats sl-cbig">${CAT.map(c=>{const g=mp[c[0]]; return `<div style="--c:${c[3]}"><b>${fmt(g.length)}</b><span class="t">${c[1]}</span><span>${c[2]}</span><em>${k(g.reduce((a,x)=>a+x.ln,0))} electores · ${pct(100*g.length/nT,0)}</em></div>`;}).join('')}</div>
      ${gStack(CAT.map(c=>({l:c[1],v:mp[c[0]].length,c:c[3]})))}</div>
      <div><h3>Secciones por disputar más cercanas</h3>${top.length?`<table class="sl-t sl-tb"><thead><tr><th>Sección</th><th>${nm>1?'Municipio':'Distrito local'}</th><th class="r">Le faltaron</th><th class="r">Participación</th></tr></thead><tbody>${top.map(x=>`<tr><td><b>${S[x.i].s}</b></td><td>${esc(nm>1?MUN[S[x.i].m]||'':'DL '+S[x.i].dl)}</td><td class="r">${fmt(Math.round(x.rv-x.mine)+1)} votos</td><td class="r">${pct(x.tp,0)}</td></tr>`).join('')}</tbody></table>`:'<p class="sl-note">No hay secciones perdidas por menos de 10 puntos.</p>'}</div></div>`);}
  else{const cl=ii.map(i=>winner(ref,[i])).filter(Boolean),bands=[['Menos de 5 pts','#1C7F79',cl.filter(w=>w.m<5).length],['5 a 15 pts','#4CC1BA',cl.filter(w=>w.m>=5&&w.m<15).length],['Más de 15 pts','#C9D1D1',cl.filter(w=>w.m>=15).length]];
    slide(head('Secciones: quién gana y por cuánto',esc(eLabel(ref))),`<div class="sl-g2"><div><h3>Secciones ganadas por coalición</h3>${gHBar(560,T.bl.filter(b=>W[b.lead]).map(b=>({l:b.name,v:W[b.lead],c:b.c,hl:b===W0})),{fv:v=>fmt(v),lw:190})}</div>
      <div><h3>Qué tan competidas fueron</h3>${gStack(bands.map(b=>({l:b[0],v:b[2],c:b[1]})))}<p class="sl-note">Las secciones definidas por menos de 5 puntos son las que pueden cambiar de manos con poco movimiento.</p></div></div>`);}
  /* 7 · próxima elección: votación esperada y meta (partido) o fuerza estructural (general) */
  let rvB=null; if(party) T.bl.forEach(b=>{if(b===PBT) return; if(!rvB||b.votes>rvB.votes) rvB=b;});
  if(party&&rvB){const eP2=PBT.votes/(T.val||1)*expVal,eR=rvB.votes/(T.val||1)*expVal,meta=Math.round(eR)+1,gap=meta-eP2;
    const sameT=els.filter(ek=>ek.split('_')[0]===TYP),sw=sameT.map(ek=>{const c=won(ek),b=blocOf(ek,P); return b?(c[b.lead]||0):null;}),sr=sameT.map(ek=>{const c=won(ek),b=blocOf(ek,rvB.lead); return b?(c[b.lead]||0):null;});
    slide(head('Próxima elección: cuántos votos se necesitan',`${esc(CARGO)} con la lista nominal vigente y la participación esperada`),`<div class="sl-g2"><div>
      <div class="sl-kr k3">${K(fmt(expV),'votos esperados')}${K(pct(expT,0),'participación esperada')}${K(pct(bal.vol,0),'voto volátil')}</div>
      <h3>Votación esperada si se repite ${yr}</h3>${gBullet(560,{mine:eP2,riv:eR,meta,lbl:fitT(pName,20),rl:fitT(rvB.name,18),c:AC,rc:rvB.c})}
      <div class="sl-meta"><b>${fmt(meta)}</b><span>${gap>0?`votos para ganar: le faltan <b>${fmt(gap)}</b> sobre lo esperado`:`votos para ganar: hoy los supera por <b>${fmt(-gap)}</b>; la tarea es retenerlos`}</span></div></div>
      <div><h3>Secciones ganadas en ${esc(CARGO)}</h3>${gLine(560,330,sameT.map(ek=>[String(D.E[ek].year)]),[{l:slPN(P),v:sw,c:AC,hl:1},{l:fitT(rvB.name,14),v:sr,c:rvB.c}],{fv:v=>fmt(v)})}</div></div>`);}
  else if(!party){const rows=MAIN.map(q=>({l:slPN(q),v:wavg(V2.duro[q]||[],ii)||0,c:C[q]})).filter(r=>r.v>.5).sort((a,b)=>b.v-a.v);
    slide(head('Fuerza estructural',`Voto duro estimado por partido y electorado en juego · ${esc(title)}`),`<div class="sl-g2"><div><h3>Voto duro: vota por el partido en todas las elecciones</h3>${gHBar(560,rows,{lw:120})}</div>
      <div><div class="sl-kr k3">${K(pct(bal.vol,0),'voto volátil','#2FA59D','cambia de partido')}${K(pct(bal.mov,0),'movilizable','#F5A47C','vota a veces')}${K(pct(bal.est,0),'abstención','#8A9393','casi nunca vota')}</div>
      <p class="sl-note">La elección se decide en el voto volátil y en quienes votan solo a veces: ahí la campaña sí mueve resultados.</p>${(()=>{const bad=MAIN.filter(q=>(T.tot[q]||0)/(T.val||1)>.15&&(wavg(V2.duro[q]||[],ii)||0)<1); return bad.length?`<p class="sl-note sm">No se muestra el voto duro de ${bad.map(slPN).join(' y ')}: en esta entidad sus votos se registran repartidos en candidatura común y la estimación no es confiable.</p>`:'';})()}</div></div>`);}
  /* 8 · proyección 2027 del cargo consultado */
  const R27=T27?pjRun(T27,ii,party?P:null,0):null;
  if(R27&&!R27.none){const NN=PJN[T27],fb=R27.BL[R27.fi],fc=pjCol(fb),pc=x=>Math.round(x*100)+' %',pos=x=>(100*x/Math.max(1,R27.n)).toFixed(1)+'%',multi=R27.n>1;
        const CT=[['seg','Seguros',fc],['pro','Probables',mix(fc,.5)],['com','En juego','#F5A47C'],['con','En contra','#B9C1C1']],cOf=u=>u.p>=.85?CT[0][2]:u.p>=.65?CT[1][2]:u.p>.35?CT[2][2]:CT[3][2];
    const short=k=>T27==='DIPL'?'DL '+k:T27==='DIPF'?'DF '+k:fitT(MUN[k]||String(k),22),UU=R27.U.slice().sort((a,b)=>b.p-a.p);
    const comp=R27.U.slice().sort((a,b)=>Math.abs(a.p-.5)-Math.abs(b.p-.5)).slice(0,multi?5:1).map(u=>({u,mt:pjMeta(u,R27.sig.a,T27)}));
    const left=multi?`<div class="sl-kr k3">${K(R27.likely,`${NN[1]} de ${R27.n} que ganaría`,fc,`rango probable ${R27.lo} a ${R27.hi}`)}${(T27==='DIPL'&&typeof congProb==='function'&&RPN().rp&&ii.length===ALL.length&&congProb(party?P:null)?K(pc(congProb(party?P:null).pM),'probabilidad de mayoría en el congreso',null,'contando plurinominales'):K(pc(R27.pMaj),'probabilidad de mayoría',null,`mayoría: ${R27.half}`))}${K(R27.share.toFixed(0)+' %','votación probable',null,`rango ${Math.max(0,R27.share-R27.band).toFixed(0)} % a ${(R27.share+R27.band).toFixed(0)} %`)}</div>
      <div class="sl-rgb"><i class="tr"></i><i class="bd" style="left:${pos(R27.lo)};width:calc(${pos(R27.hi)} - ${pos(R27.lo)});background:${fc}4d"></i><i class="mj" style="left:${pos(R27.half-.5)}"><span>mayoría ${R27.half}</span></i><i class="pt" style="left:${pos(R27.likely)};background:${fc}"></i><span class="ax" style="left:0">0</span><span class="ax" style="left:${pos(R27.lo)}">${R27.lo}</span><span class="ax" style="left:${pos(R27.hi)}">${R27.hi}</span><span class="ax" style="left:100%">${R27.n}</span></div>
      <h3>${NN[1][0].toUpperCase()+NN[1].slice(1)} por probabilidad de ganar</h3>${R27.n<=66?`<div class="sl-ut" style="--cols:${Math.min(11,R27.n)}">${UU.map(u=>`<i style="background:${cOf(u)}" title="${esc(pjName(T27,u.k))}">${esc(short(u.k))}</i>`).join('')}</div><div class="sl-stl">${CT.map(c=>`<span><i style="background:${c[2]}"></i>${c[1]} <b>${R27.cat[c[0]]}</b></span>`).join('')}</div>`:gStack(CT.map(c=>({l:c[1],v:R27.cat[c[0]],c:c[2]})))}`
      :`<div class="sl-kr k3">${K(pc(R27.U[0].p),'probabilidad de ganar',fc)}${K(R27.share.toFixed(1)+' %','votación probable',null,`rango ${Math.max(0,R27.share-R27.band).toFixed(0)} % a ${(R27.share+R27.band).toFixed(0)} %`)}${K((R27.U[0].m>=0?'+':'−')+Math.abs(R27.U[0].m).toFixed(1),'puntos de diferencia probable')}</div>
      <div class="sl-gauge"><div style="width:${(R27.U[0].p*100).toFixed(1)}%;background:${fc}"></div><span style="left:50%">50 %</span></div>`;
    slide(head(`Proyección 2027 · ${esc(TY[T27])}`,`${esc(pjBN(fb))} · solo con resultados históricos, sin encuesta`),`<div class="sl-g2"><div>${left}</div><div>
      ${(()=>{const cl=R27.U.map(u=>({u,v:u.m/100*u.V})).sort((a,b)=>Math.abs(a.v)-Math.abs(b.v)).slice(0,multi?7:1),vt=v=>Math.abs(v)<100?(v>=0?'ganaría por menos de 100 votos':'perdería por menos de 100 votos'):(v>=0?'ganaría':'perdería')+' por aprox. '+fmt(Math.round(Math.abs(v)/10)*10)+' votos',lv=p=>p>=.4&&p<=.6?'casi empate':p>.6?'probable':p>=.25?'posible':'difícil';
        if(!multi){const mt=comp[0]&&comp[0].mt; return `<h3>¿Qué le falta?</h3><p class="sl-note">${party?(R27.U[0].m>=0?`Ganaría por ${R27.U[0].m.toFixed(1)} puntos. `:`Perdería por ${(-R27.U[0].m).toFixed(1)} puntos. `)+(mt?`Para llegar a 70 % de probabilidad le faltarían <b>unos ${fmt(mt.nuevos)} votos</b> nuevos (o ${fmt(mt.quitados)} quitados al rival).`:'Ya tendría 70 % o más de probabilidad: la tarea es defender su votación.'):'Elige un partido para ver qué le falta.'}</p>`;}
        return `<h3>Los ${NN[1]} más cerrados</h3><table class="sl-t sl-vt"><thead><tr><th>${esc(NN[0][0].toUpperCase()+NN[0].slice(1))}</th><th>Hoy</th><th class="r">Probabilidad</th></tr></thead><tbody>${cl.map(({u,v})=>`<tr><td><b>${esc(short(u.k))}</b></td><td style="color:${v>=0?'#1C7F79':'#C2410C'}">${vt(v)}</td><td class="r">${lv(u.p)}</td></tr>`).join('')}</tbody></table>
          <p class="sl-note">Lo que decide son <b>${R27.cat.com} ${R27.cat.com===1?NN[0]:NN[1]} en juego</b>: ahí pocos votos cambian el resultado.</p>`;})()}</div></div>`,'sl-pjs');
    /* 8b · congreso con plurinominales (diputaciones locales) */
    if(T27==='DIPL'&&typeof congBase==='function'&&typeof RPN==='function'&&RPN().rp&&ii.length===ALL.length){const B=congBase(); if(B){const {NT,half,blk,bn,tb,ord,x,pr,rt}=B,mx=Math.max(half,...ord.map(q=>x.out[q].t)),cw=Math.max(6,Math.min(22,Math.floor(430/(mx+1))-4));
      const rows=ord.map(q=>{const o=x.out[q],c=C[q]||'#9AA3A3'; return `<div class="sl-cr${blk.includes(q)?' on':''}"><span>${esc(NM[q]||q)}</span><div>${`<i style="background:${c}"></i>`.repeat(o.mr)}${`<i class="o" style="border-color:${c}"></i>`.repeat(o.rp)}</div><b>${o.t}</b></div>`;}).join('');
      const steps=[]; if(rt&&!rt.keep&&rt.s!=null){if(rt.donde&&rt.donde.length) steps.push(`Ganar ${rt.donde.length===1?'el '+esc(pjShort('DIPL',rt.donde[0].k)):rt.donde.length+' distritos más'}${rt.donde.length>1&&rt.donde.length<=3?` (${rt.donde.map(d=>esc(pjShort('DIPL',d.k))).join(', ')})`:''}.`); if(rt.plan&&rt.plan.d>0) steps.push(`Sumar unos <b>${congVotos(rt.plan.votos)} votos</b> en todo el estado: pasar de ${rt.plan.de.toFixed(1)} % a ${rt.plan.a.toFixed(1)} %.`); steps.push(`Resultado: ${rt.mr} distritos + ${rt.rp} plurinominales = ${half}.`);}
        else if(rt&&rt.keep) steps.push(`Tendría mayoría (${tb} de ${NT}). ${congNeed(B)}`); else if(rt) steps.push(`Ni con 15 puntos más en todo el estado llegaría a ${half}.`);
      slide(head(`Congreso de ${esc(EST)} 2027`,`${NT} diputaciones: ${RPN().mr} de mayoría y ${RPN().rp} plurinominales · mayoría con ${half}`),`<div class="sl-g2"><div>
        <div class="sl-kr k3">${K(`${tb} de ${NT}`,`diputaciones de ${esc(bn)}`,C[blk[0]])}${pr?K(Math.round(100*pr.pM)+' %','probabilidad de mayoría',null,`rango ${pr.lo} a ${pr.hi}`):''}${K(half,'para la mayoría')}</div>
        <div class="sl-cg" style="--cw:${cw}px"><s style="left:calc(110px + ${half-1} * (var(--cw) + 4px) - 1px)"><b>Mayoría · ${half}</b></s>${rows}</div>
        <div class="sl-stl"><span><i style="background:#6B7676"></i>ganó el distrito</span><span><i style="background:#fff;border:2px solid #6B7676"></i>plurinominal</span></div></div>
        <div><h3>${rt&&rt.keep?'La mayoría':`Qué necesitaría ${esc(bn)} para la mayoría`}</h3><ol class="sl-ol">${steps.map(t=>`<li>${t}</li>`).join('')}</ol>
        <p class="sl-note sm">${M0.rpr&&M0.rpr.fuente?`Regla de ${esc(EST)}: ${esc(M0.rpr.resumen||'')} ${esc(M0.rpr.fuente)}.`:'Regla general: umbral 3 % y tope de 8 puntos (art. 116 constitucional).'}</p></div></div>`);}}
    /* 9 · qué tan bien estima */
    const ve=(MODELO.estados||{})[M0.cab]||{},CB=MODELO.calibracion||{},TT=['DIPL','DIPF','AYU','GOB'].filter(t=>ve[t]);
    slide(head('¿Qué tan precisa es la estimación?','Prueba: estimar 2021 con datos hasta 2018 y 2024 con datos hasta 2021'),`<div class="sl-g2"><div>
      <div class="sl-kr k3">${K((ve.todo?ve.todo.acierto:'—')+' %',`ganadores acertados en ${esc(EST)}`,'#1C7F79',ve.todo?`${ve.todo.n} distritos, municipios y gubernatura`:'')}${K((ve.todo&&ve.todo.repetir!=null?ve.todo.repetir:'—')+' %','si solo se repite la última elección')}${K(ve.todo?ve.todo.mae.toFixed(1):'—','puntos de error promedio',null,'por fuerza política')}</div>
      <h3>Por cargo en ${esc(EST)}</h3><table class="sl-t sl-vt"><thead><tr><th>Cargo</th><th class="r">Casos</th><th class="r">Modelo</th><th class="r">Repetir la última</th></tr></thead><tbody>${TT.map(t=>`<tr class="${t===T27?'on':''}"><td>${esc(TY[t])}</td><td class="r">${ve[t].n}</td><td class="r"><b>${ve[t].acierto} %</b></td><td class="r">${ve[t].repetir!=null?ve[t].repetir+' %':'—'}</td></tr>`).join('')}</tbody></table></div>
      <div><h3>¿Las probabilidades son honestas?</h3><div class="sl-cal">${['60-70','70-80','80-90','90-101'].map(k=>{const v=(CB[k]||{})['gano_el_favorito_%']; return `<div><span>${v!=null?Math.round(v)+' %':'—'}</span><i style="height:${v||0}%"></i><em>${k==='90-101'?'90 % o más':k.replace('-','–')+' %'}</em></div>`;}).join('')}</div>
      <p class="sl-note">Cuando el sistema dice "70–80 %", el favorito ganó <b>${Math.round((CB['70-80']||{})['gano_el_favorito_%']||0)} de cada 100</b> veces (32 estados). Con una encuesta estatal, en diputaciones locales se acierta ${MODELO.nacional.DIPL?MODELO.nacional.DIPL.encuesta:'—'} % contra ${MODELO.nacional.DIPL?MODELO.nacional.DIPL.solo:'—'} % solo con resultados.</p></div></div>`);}
  /* 10 · tendencia */
  const EL=els.slice(-10),LB=(t,p)=>t.bl.find(b=>b.members.includes(p)),LS=MAIN.filter(p=>EL.some(ek=>{const t=totals(ek,ii),b=t.bl.find(b=>b.lead===p); return b;})).slice(0,6);
  const ser=(party?[P].concat(LS.filter(p=>p!==P)):LS).slice(0,5).map((p,k)=>({l:slPN(p)+(party&&p===P&&PBT.members.length>1?'+':''),v:EL.map(ek=>{const t=totals(ek,ii),b=p===P&&party?LB(t,p):t.bl.find(b=>b.lead===p); return b?b.pct:null;}),c:C[p],hl:party?p===P:k===0,dim:party&&p!==P,pj:slPJ(T27,ii,p,party&&p===P)}));
  slide(head(party?`Trayectoria de ${esc(slPN(P))}`:'Trayectoria de las fuerzas',`${D.E[EL[0]].year}–${D.E[EL[EL.length-1]].year} · % de la votación válida${party?' (con su coalición en cada elección)':' por coalición que encabeza cada partido'}`),
    `${gLine(1168,360,EL.map(ek=>[TYS[ek.split('_')[0]]||ek,String(D.E[ek].year)]),ser,{pjLabel:T27?TYS[T27]:''})}
    <table class="sl-t sl-tc"><thead><tr><th></th>${EL.map(ek=>`<th class="r">${TYS[ek.split('_')[0]]||''}<br>${D.E[ek].year}</th>`).join('')}</tr></thead><tbody>
      <tr><td>Ganó</td>${EL.map(ek=>{const w=totals(ek,ii).bl[0]; return `<td class="r"><i class="sl-d" style="background:${w.c}"></i>${esc(slPN(w.lead))}</td>`;}).join('')}</tr>
      <tr><td>Participación</td>${EL.map(ek=>`<td class="r">${pct(totals(ek,ii).turn,0)}</td>`).join('')}</tr></tbody></table>`);
  return N;}
/* ---------- visor ---------- */
let SLI=0;
async function slMake(btn,busy){const o=btn&&btn.innerHTML; if(btn){btn.disabled=true; btn.textContent=busy;} await new Promise(r=>setTimeout(r,40));
  try{return await slBuild();}catch(e){console.error(e); toast('No se pudo armar la presentación.'); return null;} finally{if(btn){btn.disabled=false; btn.innerHTML=o;}}}
async function openSlides(btn){const SS=await slMake(btn,'Preparando…'); if(!SS) return;
  const d=document.createElement('div'); d.id='deck'; d.className='deck'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Presentación');
  const names=SS.map(h=>{const m=h.match(/<h2>(.*?)<\/h2>/); return m?m[1].replace(/<[^>]+>/g,''):'Portada';});
  d.innerHTML=`<div class="dk-bar"><b>${esc(slTitle())}</b><span id="dkn"></span><div class="dk-sp"></div><button id="dkfs"><svg viewBox="0 0 12 12"><path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8"/></svg>Proyectar</button><button id="dkpdf"><svg viewBox="0 0 12 12"><path d="M6 1v6.5M3.3 5 6 7.7 8.7 5M1.5 10.5h9"/></svg>PDF</button><button id="dkx" aria-label="Cerrar">✕</button></div>
    <div class="dk-stage" id="dks"><div class="dk-track" id="dkt">${SS.join('')}</div><button class="dk-nav p" id="dkp" aria-label="Anterior"><svg viewBox="0 0 12 12"><path d="M7.5 2 3.5 6l4 4"/></svg></button><button class="dk-nav n" id="dkn2" aria-label="Siguiente"><svg viewBox="0 0 12 12"><path d="M4.5 2l4 4-4 4"/></svg></button></div>
    <nav class="dk-th" id="dkd">${names.map((t,j)=>`<button data-j="${j}"><i>${j+1}</i>${esc(t)}</button>`).join('')}</nav><div class="dk-pr"><i id="dkpr"></i></div>`;
  document.body.appendChild(d); SLI=0;
  const fit=()=>{const s=$('dks'),r=s.getBoundingClientRect(),z=Math.min(r.width/SLW,r.height/SLH); $('dkt').style.transform=`translate(${(r.width-SLW*z)/2}px,${(r.height-SLH*z)/2}px) scale(${z})`;};
  const show=j=>{const prev=SLI; SLI=Math.max(0,Math.min(SS.length-1,j)); d.querySelectorAll('.dk-track>.sl').forEach((s,k)=>{s.classList.toggle('on',k===SLI); s.classList.toggle('back',k<SLI);}); d.querySelectorAll('#dkd button').forEach((b,k)=>b.setAttribute('aria-pressed',k===SLI)); const cur=d.querySelector('#dkd button[aria-pressed="true"]'); if(cur) cur.scrollIntoView({block:'nearest',inline:'center',behavior:prev===SLI?'auto':'smooth'}); $('dkn').textContent=`${SLI+1} / ${SS.length}`; $('dkpr').style.width=(100*(SLI+1)/SS.length)+'%';};
  const close=()=>{removeEventListener('keydown',key); removeEventListener('resize',fit); document.removeEventListener('fullscreenchange',fsc); if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); d.remove();};
  const key=e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault(); show(SLI+1);} else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault(); show(SLI-1);} else if(e.key==='Home') show(0); else if(e.key==='End') show(SS.length-1); else if(e.key==='Escape'&&!document.fullscreenElement) close(); else if(e.key==='f') $('dkfs').click();};
  const fsc=()=>setTimeout(fit,80); addEventListener('keydown',key); addEventListener('resize',fit); document.addEventListener('fullscreenchange',fsc);
  $('dkx').onclick=close; $('dkp').onclick=()=>show(SLI-1); $('dkn2').onclick=()=>show(SLI+1); d.querySelectorAll('#dkd button').forEach(b=>b.onclick=()=>show(+b.dataset.j));
  let tx=null; $('dks').addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true}); $('dks').addEventListener('touchend',e=>{if(tx==null) return; const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>40) show(SLI+(dx<0?1:-1)); tx=null;});
  $('dkfs').onclick=()=>{document.fullscreenElement?document.exitFullscreen():d.requestFullscreen&&d.requestFullscreen().catch(()=>{});};
  $('dkpdf').onclick=()=>slPDF($('dkpdf'),SS);
  fit(); show(0);}
async function slPDF(btn,SS){if(!window.jspdf||!window.html2canvas){toast('No se pudo cargar el generador de PDF. Recarga la página.'); return;} const o=btn.innerHTML; btn.disabled=true; btn.textContent='Generando…';
  const host=document.createElement('div'); host.className='dk-print'; host.innerHTML=SS.join(''); document.body.appendChild(host);
  try{await (document.fonts?document.fonts.ready:Promise.resolve()); const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'px',format:[SLW,SLH],hotfixes:['px_scaling']}); const sl=[...host.children];
    for(let j=0;j<sl.length;j++){btn.textContent=`Generando ${j+1}/${sl.length}…`; const cv=await html2canvas(sl[j],{scale:1.6,width:SLW,height:SLH,backgroundColor:'#ffffff',logging:false}); if(j) doc.addPage([SLW,SLH],'landscape'); doc.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,SLW,SLH);}
    await saveFile(('Analisis_'+norm(slTitle())+'_'+(st.elec||'')+(st.party?'_'+st.party:'_general')).replace(/[^\w]+/g,'_')+'.pdf',doc.output('blob'));}
  catch(e){console.error(e); toast('No se pudo generar el PDF.');}
  finally{host.remove(); btn.disabled=false; btn.innerHTML=o;}}
/* Informe PDF del panel = las mismas diapositivas */
async function slDownload(btn){const SS=await slMake(btn,'Preparando…'); if(SS) await slPDF(btn,SS);}
if($('presb')) $('presb').onclick=()=>openSlides($('presb'));
