/* Laboratorio Político · generado por pipeline/sitio.py desde src/. No editar aquí. */
let AVAIL=[],CAPAS=[],MODELO=null;
function APP(DATA){
/* ===== núcleo: utilidades, adaptador de datos, cálculos y estado ===== */
const D=DATA,M0=D.meta,CFG=M0.cfg||{},EST=M0.estado;
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n||0).toLocaleString('es-MX');
const k=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?Math.round(n/1e3)+'k':fmt(n);
const pct=(n,d=1)=>(n==null||isNaN(n))?'—':n.toFixed(d)+'%';
const sg=(n,d=0)=>{const a=Math.abs(n).toFixed(d),z=+a===0; return (z?'':n>0?'+':'−')+a;};
const fitT=(s,n)=>s.length>n?s.slice(0,Math.max(3,n-1)).trim()+'…':s;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const C={MORENA:'#A9455E',PAN:'#3F72B5',PRI:'#2F8F64',PRD:'#D9A928',PVEM:'#7FB24E',PT:'#CF4B42',MC:'#E9813F',OTROS:'#A0A7A6'};
const NM={MORENA:'Morena',PAN:'PAN',PRI:'PRI',PRD:'PRD',PVEM:'PVEM',PT:'PT',MC:'MC',OTROS:'Otros'};
const MAIN=['MORENA','PAN','PRI','PRD','PVEM','PT','MC'];
/* registro de tarjetas: cada módulo (archivo 7x_*.js) llama tarjeta({id,titulo,resumen,icono,html(ctx)}) y aparece en "Gráficas" */
const TARJ=[]; const tarjeta=def=>TARJ.push(def);
const NMX={PES:'PES',RSP:'RSP',FXM:'FxM',NA:'Nueva Alianza',IND:'Independientes',PH:'Humanista',PCHU:'Chiapas Unido',PMCH:'Mover a Chiapas',PPCH:'Popular Chiapaneco',PUP:'PUP',PSD:'PSD',PRS:'PRS',MUJER:'PMR',PMR:'PMR',MAS:'MAS',CQROO:'Confianza por QRoo',AVE:'Alternativa Veracruzana',PC:'Cardenista',TXVER:'Todos por Veracruz',PODEMOS:'Podemos',UC:'Unidad Ciudadana',PLC:'PLC',PESC:'PESC'};
const XPAL=['#8C6BB1','#4E9BB9','#B07A8C','#6D8A96','#B98B4F','#7C9A6D','#9A8C5B','#5E6B8C'];
D.P8.filter(p=>!MAIN.includes(p)&&p!=='OTROS').forEach((p,j)=>{NM[p]=NMX[p]||p; C[p]=p==='IND'?'#7E8A89':XPAL[j%XPAL.length];});
const NP=D.P8.length;
const MUN={}; for(const x in M0.municipios) MUN[x]=M0.municipios[x];
const UYC=new Set((M0.uyc||[]).map(Number));
const TIPO={1:'Urbana',2:'Urbana',3:'Mixta',4:'Rural'};
function hexrgb(h){h=h.replace('#',''); return [0,2,4].map(i=>parseInt(h.substr(i,2),16));}
const mix=(hex,t,b=[238,245,244])=>{const a=hexrgb(hex); return 'rgb('+a.map((v,i)=>Math.round(b[i]+(v-b[i])*t)).join(',')+')';};
const TEAL=t=>mix('#16716C',.1+.9*Math.max(0,Math.min(1,t)));

/* adaptador: el paquete por estado trae arreglos compactos */
const S=D.S.map((a,i)=>({s:a[0],m:a[1],dl:a[2],df:a[3],t:a[4],ln:a[5],nw:!!a[6],np:a[7]==null?1:a[7],d:D.paths[i]})),nSec=idx=>idx.reduce((t,i)=>t+S[i].np,0),N=S.length,ALL=S.map((s,i)=>i);
const DM=D.DM,V2=D.V,GEO=D.geo;
const YEARS=M0.years,TY={GOB:'Gubernatura',DIPL:'Diputaciones locales',AYU:'Ayuntamientos',PRE:'Presidencia',SEN:'Senado',DIPF:'Diputaciones federales'};
const DLS=[...new Set(S.map(s=>s.dl))].sort((a,b)=>a-b),DFS=[...new Set(S.map(s=>s.df))].sort((a,b)=>a-b),NDL=DLS.length;
const CABDL=M0.cabDL||{},CABDF=M0.cabDF||{};
const MANY=Object.keys(MUN).length>40;
const AGEY=Object.keys(V2.age).sort().pop();

/* resultados por sección con caché */
const RC={};
function row(ek,i){const c=RC[ek]||(RC[ek]=[]); if(c[i]!==undefined) return c[i]; const r=D.E[ek].r[i]; if(!r) return c[i]=null; const v={}; let val=0; D.P8.forEach((p,j)=>{v[p]=r[j]; val+=r[j];}); return c[i]={v,val,t:r[NP],ln:r[NP+1]};}
/* partidos que en cada sección compitieron fuera de la coalición estatal: E.sx (detectado con las combinaciones de
   votos, pipeline/coaliciones.py) y E.so (diputaciones federales 2024, con las candidaturas del INE) */
const SXC={};
function SXI(ek){if(ek in SXC) return SXC[ek]; const e=D.E[ek]; if(!e.sx&&!e.so) return SXC[ek]=null; const a=[];
  (e.sx||[]).forEach(([gs,ii])=>ii.forEach(i=>{a[i]=(a[i]||[]).concat(gs.map(g=>g.join('+')));}));
  if(e.so) ALL.forEach(i=>{const x=e.so[S[i].df]; if(x) a[i]=[...new Set((a[i]||[]).concat(x))];});
  return SXC[ek]=a;}
function totals(ek,idx){const tot={}; let val=0,t=0,ln=0; idx.forEach(i=>{const r=row(ek,i); if(!r) return; t+=r.t; ln+=r.ln; val+=r.val; for(const p in r.v) tot[p]=(tot[p]||0)+r.v[p];});
  /* distritos donde un partido de la coalición fue con candidatura propia (E.so): si todo el territorio consultado
     cae en esos distritos, ese partido cuenta aparte de sus aliados */
  let BL=D.E[ek].blocs; const sxi=SXI(ek); if(sxi&&idx.length){let sp=null; for(const i of idx){const x=sxi[i]||[]; sp=sp?sp.filter(p=>x.includes(p)):x.slice(); if(!sp.length) break;}
    if(sp&&sp.length){const G=sp.map(k=>k.split('+')),lead=ms=>ms.slice().sort((a,c)=>(tot[c]||0)-(tot[a]||0))[0]; BL=[];
      D.E[ek].blocs.forEach(b=>{let keep=b.members.slice(); G.forEach(g=>{const o=keep.filter(m=>g.includes(m)); if(o.length&&o.length<keep.length){keep=keep.filter(m=>!o.includes(m)); BL.push({lead:lead(o),members:o});}});
        BL.push({lead:keep.includes(b.lead)?b.lead:lead(keep),members:keep});});}}
  const bl=BL.filter(b=>b.lead!=='OTROS').map(b=>{const parts=b.members.filter(m=>m!=='OTROS').map(m=>({p:m,v:tot[m]||0})).sort((a,c)=>(c.p===b.lead)-(a.p===b.lead)||c.v-a.v); return {lead:b.lead,members:b.members,name:parts.length>3?parts.slice(0,3).map(x=>NM[x.p]).join('-')+' y '+(parts.length-3)+' más':parts.map(x=>NM[x.p]).join('-'),c:C[parts[0].p],votes:parts.reduce((a,x)=>a+x.v,0),parts};}).sort((a,b)=>b.votes-a.votes);
  bl.forEach(b=>b.pct=val?100*b.votes/val:0); return {bl,val,t,ln,tot,turn:ln?100*t/ln:null};}
const WC={};
const winner=(ek,idx)=>{if(idx.length===1){const c=WC[ek]||(WC[ek]=[]),i=idx[0]; if(c[i]!==undefined) return c[i]; const T=totals(ek,idx); return c[i]=T.val?{lead:T.bl[0].lead,m:T.bl[0].pct-(T.bl[1]?T.bl[1].pct:0),bl:T.bl,turn:T.turn}:null;}
  const T=totals(ek,idx); if(!T.val) return null; return {lead:T.bl[0].lead,m:T.bl[0].pct-(T.bl[1]?T.bl[1].pct:0),bl:T.bl,turn:T.turn};};
/* socio de una candidatura común en esa elección: su voto está sumado en el partido que la encabeza */
const ccOff=(ek,p)=>!!(D.E[ek]&&D.E[ek].cc&&D.E[ek].cc.some(g=>g.indexOf(p)>0)),ccLead=(ek,p)=>{const g=D.E[ek]&&D.E[ek].cc&&D.E[ek].cc.find(g=>g.indexOf(p)>0); return g?g[0]:null;};
const lnOf=idx=>idx.reduce((a,i)=>a+(S[i].ln||0),0);
const wavg=(arr,idx)=>{let a=0,b=0; idx.forEach(i=>{if(arr[i]!=null){a+=arr[i]*(S[i].ln||1); b+=S[i].ln||1;}}); return b?a/b:null;};
function demo(idx){const a={pe:0,ln:0,h:0,m:0,y:0,o:0}; idx.forEach(i=>{const r=DM[i]; if(!r) return; a.pe+=r[0]; a.ln+=r[1]; a.h+=r[2]; a.m+=r[3]; a.y+=r[4]+r[11]+r[5]+r[12]; a.o+=r[10]+r[17];}); const t=a.h+a.m||1; a.mj=100*a.m/t; a.jv=100*a.y/t; a.ma=100*a.o/t; return a;}
function ageTurn(idx){let l=0,s=0,ly=0,sy=0; idx.forEach(i=>{const a=V2.age[AGEY][i]; if(!a) return; for(let j=0;j<7;j++){l+=a[j]; s+=a[7+j];} ly+=a[0]; sy+=a[7];}); return {all:l?100*s/l:null,young:ly?100*sy/ly:null};}
const eLabel=ek=>ek?TY[ek.split('_')[0]]+' '+D.E[ek].year:'Sin elección';
const prevOf=ek=>{if(!ek) return null; const [t,y]=ek.split('_'); const ys=YEARS.filter(x=>x<+y&&D.E[t+'_'+x]); return ys.length?t+'_'+ys[ys.length-1]:null;};
const lastOf=t=>{const ys=YEARS.filter(y=>D.E[t+'_'+y]); return ys.length?t+'_'+ys[ys.length-1]:null;};
const BASE=M0.base;
/* participación esperada: promedio de las dos últimas elecciones del cargo base, con respaldo municipal */
const EXPT=(()=>{const t=BASE.split('_')[0],eks=YEARS.filter(y=>D.E[t+'_'+y]).slice(-2).map(y=>t+'_'+y),a=ALL.map(i=>{const ts=eks.map(e=>row(e,i)).filter(r=>r&&r.ln).map(r=>100*r.t/r.ln); return ts.length?ts.reduce((x,y)=>x+y,0)/ts.length:null;}),mm={};
  ALL.forEach(i=>{if(a[i]!=null){(mm[S[i].m]=mm[S[i].m]||[]).push(a[i]);}}); return a.map((v,i)=>v!=null?v:(mm[S[i].m]?mm[S[i].m].reduce((x,y)=>x+y,0)/mm[S[i].m].length:60));})();
/* alternancia: cambió el ganador en las últimas elecciones locales */
/* switcher: cambió de partido ganador entre las dos últimas elecciones del mismo cargo en al menos 2 cargos (calibrado con 2018-2021 → 2024) */
const SW=(()=>{const pr=['DIPL','DIPF','AYU','GOB'].map(t=>YEARS.filter(y=>D.E[t+'_'+y]).slice(-2).map(y=>t+'_'+y)).filter(x=>x.length===2); return ALL.map(i=>{let n=0,c=0; pr.forEach(([a,b])=>{const A=winner(a,[i]),B=winner(b,[i]); if(A&&B){n++; if(A.lead!==B.lead) c++;}}); return n>=2&&c>=2;});})();
function balance(idx,p){const d={}; MAIN.forEach(q=>d[q]=wavg(V2.duro[q],idx)||0); const expT=wavg(EXPT,idx)||0,maxT=Math.max(expT,wavg(V2.maxT,idx)||expT),own=p?d[p]:0,riv=MAIN.filter(q=>q!==p).reduce((a,q)=>a+d[q],0),dur=p?own+riv:riv;
  return {d,own,riv,vol:Math.max(0,expT-dur),mov:Math.max(0,maxT-expT),est:Math.max(0,100-maxT)};}
const DST={d:demo(ALL),t:ageTurn(ALL),vol:wavg(V2.vol,ALL),ab:0}; DST.ab=100-(wavg(V2.maxT,ALL)||0);
/* congreso: MR por distrito local actual + RP estimada con umbral y número de escaños del estado */
function congress(y){const ek='DIPL_'+y,mr={}; DLS.forEach(d=>{const w=winner(ek,ALL.filter(i=>S[i].dl===d)); if(w) mr[w.lead]=(mr[w.lead]||0)+1;});
  const NRP=CFG.rp||0,NT=(CFG.mr||DLS.length)+NRP,U=CFG.umbral||.03,T=totals(ek,ALL),RP=D.P8.filter(p=>p!=='OTROS'&&p!=='IND'),vv={}; let tv=0; RP.forEach(p=>{vv[p]=T.tot[p]||0; tv+=vv[p];});
  const q=RP.filter(p=>tv&&vv[p]/tv>=U),cap=p=>Math.floor((vv[p]/tv+.08)*NT),rp={}; q.forEach(p=>rp[p]=0);
  // reparto por resto mayor con tope de sobrerrepresentación (+8 pts sobre su votación)
  let elig=q.filter(p=>(mr[p]||0)<cap(p)),left=NRP,guard=0;
  while(left>0&&elig.length&&guard++<50){const qt=elig.reduce((a,p)=>a+vv[p],0),nb=left; const rem=elig.map(p=>{const e=nb*vv[p]/qt,f=Math.floor(e); return [p,f,e-f];});
    rem.forEach(([p,f])=>{const room=cap(p)-(mr[p]||0)-rp[p],g=Math.min(f,room); rp[p]+=g; left-=g;});
    rem.sort((a,b)=>b[2]-a[2]).forEach(([p])=>{if(left>0&&cap(p)-(mr[p]||0)-rp[p]>0){rp[p]++; left--;}});
    elig=elig.filter(p=>cap(p)-(mr[p]||0)-rp[p]>0);}
  const coal=new Set(D.E[ek].blocs.filter(b=>b.members.filter(m=>m!=='OTROS').length>1).map(b=>b.lead));
  return [...new Set(Object.keys(mr).concat(Object.keys(rp)))].map(p=>({p,co:coal.has(p)&&(mr[p]||0)>0,t:(mr[p]||0)+(rp[p]||0),mr:mr[p]||0,rp:rp[p]||0})).filter(r=>r.t>0).sort((a,b)=>b.t-a.t);}

/* votos para ganar: brecha entre el bloque del partido y el primer lugar, y votantes recuperables */
function gapOf(ek,idx,p){const T=totals(ek,idx); if(!T.val||!p) return null; const mine=T.bl.find(b=>b.members.includes(p)); if(!mine) return null; const first=T.bl[0],second=T.bl[1];
  const lead=mine===first,ref=lead?second:first,gap=lead?(second?mine.votes-second.votes:mine.votes):first.votes-mine.votes,rec=Math.max(0,(wavg(V2.maxT,idx)||0)-(wavg(EXPT,idx)||0))/100*lnOf(idx);
  return {lead,gap:Math.round(gap),rec:Math.round(rec),bloc:mine,ref,ptsGap:lead?mine.pct-(second?second.pct:0):first.pct-mine.pct};}

/* estado de la interfaz */
const st={elec:null,party:'',terr:null,metric:'mar',view:'map',fp:true,ft:'t',open:{yr:true},f:{tipo:[],mun:[],dl:[],df:[],sec:[],size:[],part:[],mg:[],cmp:[],age:[],win:[]},sel:null,sort:{k:'ln',d:-1},mq:'',cards:['gen','res','proy','tend','sum','trt'],wl:'sec',cat:false};
const FL={tipo:{2:'Urbana',3:'Mixta',4:'Rural'},size:{s:'Menos de 600 electores',m:'600 a 1,500',l:'Más de 1,500'},part:{b:'Participación baja',m:'Participación media',a:'Participación alta'},mg:{c:'Alta competencia (margen menor a 5 pts)',p:'Competencia media (5 a 15 pts)',h:'Baja competencia (más de 15 pts)'},cmp:{sw:'Alternancia recurrente',chg:'Cambió vs. elección anterior',vol:'Voto volátil alto',abs:'Abstención alta'},age:{jv:'Más jóvenes',ma:'Más adultos mayores',mj:'Mayoría de mujeres'}};
const munScope=i=>!st.terr||S[i].m===+st.terr;
const T3=(()=>{const a=ALL.map(i=>V2.age[AGEY][i]).map(x=>{if(!x) return null; let l=0,s=0; for(let j=0;j<7;j++){l+=x[j]; s+=x[7+j];} return l?100*s/l:null;}),v=a.filter(x=>x!=null).sort((x,y)=>x-y); return {a,lo:v[Math.floor(v.length/3)],hi:v[Math.floor(2*v.length/3)]};})();
const tipoN=t=>t===1?2:t;
function passF(i){const f=st.f; if(f.tipo.length&&!f.tipo.includes(tipoN(S[i].t))) return false; if(f.mun.length&&!f.mun.includes(S[i].m)) return false; if(f.dl.length&&!f.dl.includes(S[i].dl)) return false; if(f.df.length&&!f.df.includes(S[i].df)) return false; if(f.sec.length&&!f.sec.includes(S[i].s)) return false;
  if(f.size.length){const l=S[i].ln||0,c=l<600?'s':l<=1500?'m':'l'; if(!f.size.includes(c)) return false;}
  if(f.part.length){const v=T3.a[i]; if(v==null) return false; const c=v<T3.lo?'b':v<T3.hi?'m':'a'; if(!f.part.includes(c)) return false;}
  if(f.mg.length&&st.elec){const w=winner(st.elec,[i]); if(!w) return false; const c=w.m<5?'c':w.m<15?'p':'h'; if(!f.mg.includes(c)) return false;}
  if(f.win.length&&st.elec){const w=winner(st.elec,[i]); if(!w||!f.win.includes(w.lead)) return false;}
  if(f.cmp.length){const w=st.elec?winner(st.elec,[i]):null; const ok=f.cmp.some(c=>c==='cer'?w&&w.m<5:c==='sw'?SW[i]:c==='chg'?(()=>{const pk=prevOf(st.elec),a=winner(st.elec,[i]),b=pk&&winner(pk,[i]); return a&&b&&a.lead!==b.lead;})():c==='vol'?(V2.vol[i]||0)>DST.vol:c==='abs'?(100-(V2.maxT[i]||100))>DST.ab:false); if(!ok) return false;}
  if(f.age.length){const d=demo([i]); const ok=f.age.some(c=>c==='jv'?d.jv>DST.d.jv*1.1:c==='ma'?d.ma>DST.d.ma*1.1:c==='mj'?d.mj>52:false); if(!ok) return false;}
  if(!xPass(i)) return false;
  return true;}
const scope=()=>ALL.filter(i=>munScope(i)&&passF(i));
const nf=()=>Object.values(st.f).reduce((a,x)=>a+x.length,0);
const SRC=M0.fuentes||{},CORTE=((SRC.pad||'').match(/corte .*/)||['corte'])[0];

/* mapa */
const svg=$('map'),NS='http://www.w3.org/2000/svg',VB=D.vb; let view=[...VB];
const mk=(tag,at,par)=>{const e=document.createElementNS(NS,tag); for(const a in at) e.setAttribute(a,at[a]); if(par) par.appendChild(e); return e;};
const noIsl=d=>d.split(/(?=M)/).filter(p=>{const n=(p.match(/-?[\d.]+/g)||[]).map(Number),xs=n.filter((v,j)=>!(j%2)),ys=n.filter((v,j)=>j%2); return xs.length&&(Math.max(...xs)-Math.min(...xs)>25||Math.max(...ys)-Math.min(...ys)>25);}).join('');
GEO.ctx.forEach(x=>mk('path',{d:x.d},$('gctx')));
$('gent').setAttribute('d',GEO.ent); GEO.mun.forEach(b=>mk('path',{d:b.d},$('gmun')));
const paths=S.map((s,i)=>{const p=mk('path',{d:s.d},$('gsec')); p.dataset.i=i; return p;});
const CEN=paths.map(p=>{const b=p.getBBox(); return [b.x+b.width/2,b.y+b.height/2];});
const labs=GEO.lab.filter(l=>l.r===1||l.r===0).map(l=>{const t=mk('text',{x:l.x,y:l.y,'text-anchor':'middle'},$('glab')); t.textContent=l.n; if(!l.r) t.classList.add('c'); t._r=l.r; return t;});
const BKEY=MANY?'df':'m',BUBS=(MANY?DFS.map(String):Object.keys(MUN)).map(m=>{const ii=ALL.filter(i=>S[i][BKEY]===+m); let x=0,y=0,w=0; ii.forEach(i=>{const q=S[i].ln||1; x+=CEN[i][0]*q; y+=CEN[i][1]*q; w+=q;}); const g=mk('g',{},$('gbub')); g.dataset.m=m; const c=mk('circle',{cx:0,cy:0},g),t=mk('text',{'text-anchor':'middle',x:0,y:0},g); return {m,g,c,t,x0:x/w,y0:y/w,ln:lnOf(ii)};});
const BMX=Math.max(...BUBS.map(b=>b.ln));
/* Durante un gesto (arrastrar, rueda, animación) el mapa se mueve como imagen con una transformación CSS, que la
   tarjeta gráfica resuelve sin volver a dibujar las secciones; al terminar se fija el viewBox y se redibuja una vez. */
let G0=null,G0R=null,GCT=0;
/* modo ligero (pantallas táctiles o estados muy grandes): sin transición de color sección por sección, que obliga a recalcular miles de figuras en cada cuadro */
document.body.classList.toggle('lite',matchMedia('(pointer:coarse)').matches||N>4500);
const baseRect=()=>G0R||svg.getBoundingClientRect();
function preview(v){if(!G0){G0=[...view]; G0R=svg.getBoundingClientRect(); svg.style.transformOrigin='0 0'; svg.style.willChange='transform';}
  view=v; const k0=G0R.width/G0[2],sc=G0[2]/v[2]; svg.style.transform=`translate(${((G0[0]-v[0])*k0*sc).toFixed(1)}px,${((G0[1]-v[1])*k0*sc).toFixed(1)}px) scale(${sc.toFixed(5)})`;}
function commit(){clearTimeout(GCT); setView(view);}
function setView(v){if(G0){svg.style.transform=''; svg.style.willChange=''; G0=null; G0R=null;} view=v; svg.setAttribute('viewBox',v.map(x=>x.toFixed(2)).join(' ')); const px=Math.max(v[2]/Math.max(1,svg.clientWidth),v[3]/Math.max(1,svg.clientHeight)),bOn=st.view!=='est'&&!st.terr&&v[2]>350&&VB[2]/px>220&&!(st.L&&(st.L.dl||st.L.df));
  /* tamaño de etiquetas: una sola variable CSS por cuadro (antes se reescribía cada texto en cada cuadro de la animación) */
  svg.style.setProperty('--px',px.toFixed(4));
  labs.forEach(t=>{const d=(t._r===0?v[2]>700:st.view==='est'?(!!st.terr||v[2]<450):!bOn)?'':'none'; if(t.style.display!==d) t.style.display=d; if(!t._k){t._k=1; if(t._r) t.classList.add('r1');}});
  if(!bOn&&$('gbub').style.display!=='none') $('tip').classList.remove('on');
  $('gbub').style.display=bOn?'':'none'; if(!bOn) return; const sc=scope(),cnt={}; sc.forEach(i=>cnt[S[i][BKEY]]=(cnt[S[i][BKEY]]||0)+1);
  BUBS.forEach(b=>{b.n=cnt[b.m]||0; b.r=(MANY?7+11*Math.sqrt(b.ln/BMX):9+Math.sqrt(b.ln)/30)*px; b.x=b.x0; b.y=b.y0;});
  BUBS.forEach(b=>{b.g.style.display=b.n?'':'none'; b.c.setAttribute('r',b.r); b.t.setAttribute('dy',(4*px).toFixed(2)); b.t.setAttribute('font-size',(11.5*px).toFixed(2)); b.t.textContent=b.n; if(b.px==null){b.px=b.x0; b.py=b.y0; b.g.setAttribute('transform',`translate(${b.x0},${b.y0})`);}});
  clearTimeout(BLAY); BLAY=setTimeout(()=>layBubs(px),MOVING?220:0);}
let BLAY=0,MOVING=0;
function layBubs(px){const VB2=BUBS.filter(b=>b.n); BUBS.forEach(b=>{b.x=b.x0; b.y=b.y0;}); for(let it=0;it<300;it++){let mv=0; for(let a=0;a<VB2.length;a++) for(let c=a+1;c<VB2.length;c++){const A=VB2[a],B=VB2[c],dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy)||.01,need=A.r+B.r+10*px; if(d<need-.01){const p=(need-d)/2*1.02,ux=dx/d,uy=dy/d; A.x-=ux*p; A.y-=uy*p; B.x+=ux*p; B.y+=uy*p; mv=1;}} if(!mv) break;}
  BUBS.forEach(b=>{if(!b.n) return; const x0=b.px,y0=b.py,x1=b.x,y1=b.y; b.px=x1; b.py=y1; if(Math.abs(x1-x0)+Math.abs(y1-y0)<1e-3) return; const t0=performance.now(),st2=n=>{const u=Math.min(1,(n-t0)/350),k=1-Math.pow(1-u,3); b.g.setAttribute('transform',`translate(${x0+(x1-x0)*k},${y0+(y1-y0)*k})`); if(u<1) requestAnimationFrame(st2);}; requestAnimationFrame(st2);});}
let anim=null,WHT=0;
function animateTo(t){cancelAnimationFrame(anim); const f=[...view],t0=performance.now(),dur=matchMedia('(prefers-reduced-motion: reduce)').matches?0:750; MOVING=1; const step=now=>{const q=dur?Math.min(1,(now-t0)/dur):1,e=q<.5?4*q*q*q:1-Math.pow(-2*q+2,3)/2; const v=f.map((x,j)=>x+(t[j]-x)*e); if(q>=1){MOVING=0; setView(v);} else {preview(v); anim=requestAnimationFrame(step);}}; anim=requestAnimationFrame(step);}
function free(){const W=svg.clientWidth,H=svg.clientHeight; if(innerWidth<=860) return {l:10,t:50,r:W-10,b:H-70}; const mb=svg.getBoundingClientRect(),cl=$('col').getBoundingClientRect(); const mc=$('metric'),mr=mc&&mc.offsetParent?mc.getBoundingClientRect():null,mt=mr?mr.bottom-mb.top+14:90,pb=document.querySelector('.mbar'),pr=pb&&pb.offsetParent?pb.getBoundingClientRect():null,bt=pr&&pr.top>mb.top+H*.5?pr.top-mb.top-12:H-30; if(st.view==='est'&&mr) return {l:mr.right-mb.left+24,t:60,r:cl.left-mb.left-30,b:Math.max(bt,H*.6)}; return {l:st.fp?$('fp').getBoundingClientRect().right-mb.left+30:70,t:Math.max(60,Math.min(mt,H*.38)),r:cl.left-mb.left-30,b:Math.max(bt,H*.6)};}
let LASTFIT=null,FITT=null;
function fit(idx,a=true){LASTFIT=idx&&idx.length?idx.slice():null; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; (idx.length?idx:ALL).forEach(i=>{const b=paths[i].getBBox(); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height);}); const mw=120; if(x1-x0<mw){const c=(x0+x1)/2; x0=c-mw/2; x1=c+mw/2;} if(y1-y0<mw){const c=(y0+y1)/2; y0=c-mw/2; y1=c+mw/2;}
  const F=free(),W=svg.clientWidth,H=svg.clientHeight,u=Math.max((x1-x0)/Math.max(100,F.r-F.l),(y1-y0)/Math.max(100,F.b-F.t))*(MANY?1.1:1.04),cx=(x0+x1)/2,cy=(y0+y1)/2,v=[cx-((F.l+F.r)/2)*u,cy-((F.t+F.b)/2)*u,W*u,H*u]; a?animateTo(v):setView(v);}
const fitSet=()=>{const sc=(typeof scope==='function'?scope():[]); return st.terr||!sc.length||sc.length===ALL.length?ALL.filter(munScope):sc;};
const refit=()=>fit(st.sel!=null&&LASTFIT&&LASTFIT.length===1?LASTFIT:fitSet());
/* el mapa se vuelve a centrar cuando termina de moverse un panel o cambia el tamaño de la ventana */
const refitSoon=()=>{clearTimeout(FITT); FITT=setTimeout(refit,90);};
['fp','col','metric'].forEach(id=>{const el=$(id); if(el) el.addEventListener('transitionend',e=>{if(e.target===el&&/left|right|width|transform/.test(e.propertyName)) refitSoon();});});
const ctryView=()=>{let b; try{b=$('gctx').getBBox();}catch(e){} if(!b||!b.width) return [VB[0]-VB[2]*2.5,VB[1]-VB[3]*2.5,VB[2]*6,VB[3]*6]; const F=free(),W=svg.clientWidth,H=svg.clientHeight,u=Math.max(b.width/Math.max(100,F.r-F.l),b.height/Math.max(100,F.b-F.t))*1.04,cx=b.x+b.width/2,cy=b.y+b.height/2; return [cx-((F.l+F.r)/2)*u,cy-((F.t+F.b)/2)*u,W*u,H*u];};
const maxW=()=>ctryView()[2];
/* al alejar, el centro se desliza hacia el del país: en el máximo se ve la república completa */
function zoomView(f,cx,cy){const [x,y,w,h]=view,C=ctryView(),nw=Math.max(8,Math.min(C[2],w*f)),nh=nw*h/w,v=[cx-(cx-x)*nw/w,cy-(cy-y)*nh/h,nw,nh]; if(f>1){const s0=Math.min(VB[2],C[2]*.5),k=Math.max(0,Math.min(1,(nw-s0)/Math.max(1,C[2]-s0))),e=k*k; v[0]+= (C[0]-v[0])*e; v[1]+=(C[1]-v[1])*e;} return v;}
function zoomAt(f,cx,cy){animateTo(zoomView(f,cx,cy));}
$('zi').onclick=()=>zoomAt(1/1.5,view[0]+view[2]/2,view[1]+view[3]/2); $('zo').onclick=()=>zoomAt(1.5,view[0]+view[2]/2,view[1]+view[3]/2); $('zf').onclick=refit;
svg.addEventListener('wheel',e=>{e.preventDefault(); cancelAnimationFrame(anim); const r=baseRect(),cx=view[0]+(e.clientX-r.left)/r.width*view[2],cy=view[1]+(e.clientY-r.top)/r.height*view[3],f=e.deltaY>0?1.15:1/1.15; MOVING=1; clearTimeout(WHT); WHT=setTimeout(()=>{MOVING=0;},200); preview(zoomView(f,cx,cy)); clearTimeout(GCT); GCT=setTimeout(commit,180);},{passive:false});
let drag=null,moved=false;
svg.addEventListener('pointerdown',e=>{cancelAnimationFrame(anim); svg.setPointerCapture(e.pointerId); drag={x:e.clientX,y:e.clientY,v:[...view],t:e.target}; moved=false;});
svg.addEventListener('pointermove',e=>{if(!drag){hover(e); return;} const r=baseRect(); if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>4) moved=true; if(moved){hideTip(); preview([drag.v[0]-(e.clientX-drag.x)/r.width*drag.v[2],drag.v[1]-(e.clientY-drag.y)/r.height*drag.v[3],drag.v[2],drag.v[3]]);}});
svg.addEventListener('pointerup',()=>{if(drag&&(moved||G0)) commit(); if(drag&&!moved){const b=drag.t.closest&&drag.t.closest('#gbub g'); if(b){if(MANY) applyScope('df',b.dataset.m); else setTerr(b.dataset.m);} else if(drag.t.dataset&&drag.t.dataset.i!=null){const i=+drag.t.dataset.i; if(!st.terr) setTerr(String(S[i].m)); else {st.sel=st.sel===i?null:i; paint();}}} drag=null;});
svg.addEventListener('pointerleave',()=>{hideTip(); hotL([]);});


/* capas */
st.L={sec:1,mun:1,dl:0,df:0,ent:1};
[[GEO.dl,'gldl','DL '],[GEO.df,'gldf','DF ']].forEach(([L,g,pre])=>L.forEach(b=>{mk('path',{d:b.d},$(g));}));
function layLabels(){[[GEO.dl,'gldl','DL '],[GEO.df,'gldf','DF ']].forEach(([L,g,pre])=>{const el=$(g); if(el.querySelector('text')) return; el.querySelectorAll('path').forEach((p,j)=>{const b=p.getBBox(),t=mk('text',{x:b.x+b.width/2,y:b.y+b.height/2},el); t.textContent=pre+L[j].id;});});}
function applyLayers(){const L=st.L; $('gsec').classList.toggle('nob',!L.sec); $('gmun').style.display=L.mun?'':'none'; $('gldl').style.display=L.dl?'':'none'; $('gldf').style.display=L.df?'':'none'; $('gent').style.display=L.ent?'':'none'; if(L.dl||L.df) layLabels();
  const p=$('lyp'); if(p&&!p.hidden) drawLyp();}
function drawLyp(){const L=st.L,p=$('lyp'); p.innerHTML=`<small>Capas del mapa</small>${[['ent','Estado','solid','#1C7F79'],['mun','Municipios','solid','#fff'],['df','Distritos federales','solid','#595959'],['dl','Distritos locales','dash','#1C2121'],['sec','Secciones','thin','#9FB0AF']].map(x=>`<button data-ly="${x[0]}" aria-pressed="${!!L[x[0]]}"><i class="ls ${x[2]}" style="--lc:${x[3]}"></i>${x[1]}<span class="sw"></span></button>`).join('')}`;
  p.querySelectorAll('[data-ly]').forEach(b=>b.onclick=()=>{L[b.dataset.ly]=L[b.dataset.ly]?0:1; applyLayers(); setView(view);});}
$('zl').onclick=()=>{const p=$('lyp'); p.hidden=!p.hidden; $('zl').setAttribute('aria-pressed',!p.hidden); if(!p.hidden) drawLyp();};

/* métricas del mapa */
const METRICS={
  mar:{needE:1,n:'Competitividad',d:'Margen entre el 1º y el 2º lugar',lo:'alta competencia',hi:'baja competencia',f:ii=>{const w=winner(st.elec,ii); return w?1-Math.min(1,w.m/30):null;},inv:1},
  win:{needE:1,n:'Partido ganador',d:'Color del partido o coalición ganadora (la coalición toma el color del partido que la encabeza)',f:ii=>{const w=st.wl&&st.wl!=='sec'&&ii.length===1?unitWinner(ii[0]):winner(st.elec,ii); return w?{c:C[w.lead],t:.35+.65*Math.min(1,w.m/20)}:null;},party:1},
  par:{n:'Participación',d:'Votó en '+AGEY+' (conteo censal) · medida general de todo el electorado',lo:'40%',hi:'75%',f:ii=>{const a=ageTurn(ii).all; return a==null?null:(a-40)/35;}},
  vol:{n:'Voto volátil',d:'Cambia de partido entre elecciones',lo:'10%',hi:'50%',f:ii=>{const v=wavg(V2.vol,ii); return v==null?null:(v-10)/40;}},
  abs:{n:'Abstención',d:'No ha votado desde 2018',lo:'15%',hi:'50%',f:ii=>{const v=wavg(V2.maxT,ii); return v==null?null:(100-v-15)/35;}},
  pv:{needE:1,n:'Votación',d:'votos propios del partido, % de la votación válida',lo:'0%',f:ii=>{if(!st.party||ccOff(st.elec,st.party)) return null; const r=row(st.elec,ii[0]); if(!r||!r.val) return null; return 100*(r.v[st.party]||0)/r.val/PVMX();},needP:1},
  pen:{needE:1,lab:1,n:'por cada 100 electores',d:'votos que obtuvo el partido por cada 100 personas de la lista nominal: combina cuántos lo prefieren y cuántos salieron a votar',lo:'0',f:ii=>{if(!st.party) return null; const r=row(st.elec,ii[0]); if(!r||!r.ln) return null; return 100*(r.v[st.party]||0)/r.ln/PNMX();},needP:1},
  nul:{needE:1,n:'Votos nulos',d:'votos nulos y por candidaturas no registradas, % del total emitido',lo:'0%',f:ii=>{const r=row(st.elec,ii[0]); if(!r||!r.t) return null; return 100*(r.t-r.val)/r.t/NUMX();}},
  duro:{n:'Voto duro',d:'del partido elegido, % de la lista',lo:'0%',hi:'25%',f:ii=>{if(!st.party) return null; const v=wavg(V2.duro[st.party],ii); return v==null?null:v/25;},needP:1}};
const WUC={},wlKey=(wl,j)=>wl==='mun'?S[j].m:wl==='dl'?S[j].dl:wl==='df'?S[j].df:0;
function unitWinner(i){const wl=st.wl,key=st.elec+'|'+wl; let c=WUC[key]; if(!c){c=WUC[key]={}; const g={}; ALL.forEach(j=>{const k=wlKey(wl,j); (g[k]=g[k]||[]).push(j);}); for(const k in g) c[k]=winner(st.elec,g[k]);} return c[wlKey(wl,i)];}
const NUC={}; function NUMX(){if(NUC[st.elec]) return NUC[st.elec]; const a=ALL.map(i=>{const r=row(st.elec,i); return r&&r.t?100*(r.t-r.val)/r.t:null;}).filter(v=>v!=null).sort((x,y)=>x-y); return NUC[st.elec]=Math.max(2,Math.ceil(a[Math.floor(a.length*.95)]||5));}
const PNC={}; function PNMX(){const key=st.elec+'|'+st.party; if(PNC[key]) return PNC[key]; const a=ALL.map(i=>{const r=row(st.elec,i); return r&&r.ln?100*(r.v[st.party]||0)/r.ln:null;}).filter(v=>v!=null).sort((x,y)=>x-y); return PNC[key]=Math.max(5,Math.ceil((a[Math.floor(a.length*.95)]||10)/5)*5);}
const PVC={}; function PVMX(){const key=st.elec+'|'+st.party; if(PVC[key]) return PVC[key]; const a=ALL.map(i=>{const r=row(st.elec,i); return r&&r.val?100*(r.v[st.party]||0)/r.val:null;}).filter(v=>v!=null).sort((x,y)=>x-y); return PVC[key]=Math.max(5,Math.ceil((a[Math.floor(a.length*.95)]||10)/5)*5);}
function drawDiv(){const g=$('gdiv'),f=st.f,ms=f.mun.concat(st.terr?[+st.terr]:[]); let h='',lb=[];
  const lay=(L,sel,pre)=>{if(!sel.length) return; L.forEach(b=>{if(!sel.includes(+b.id)) h+=`<path class="ot" d="${b.d}"/>`;}); L.forEach(b=>{if(sel.includes(+b.id)){h+=`<path class="hal" d="${b.d}"/><path class="on" data-l="${pre} ${b.id}" d="${b.d}"/>`;}});};
  lay(GEO.df,f.df,'DF'); lay(GEO.dl,f.dl,'DL'); if(ms.length) GEO.mun.forEach(b=>{if(ms.includes(+b.id)) h+=`<path class="hal" d="${b.d}"/><path class="on m" d="${b.d}"/>`;});
  if(f.sec.length) ALL.forEach(i=>{if(f.sec.includes(S[i].s)) h+=`<path class="hal" d="${S[i].d}"/><path class="on s" d="${S[i].d}"/>`;});
  g.innerHTML=h; g.querySelectorAll('path[data-l]').forEach(p=>{const b=p.getBBox(),t=mk('text',{x:b.x+b.width/2,y:b.y+b.height/2},g); t.textContent=p.dataset.l;});}
const RAW={mar:[ii=>{const w=winner(st.elec,ii); return w?w.m:null;},v=>v.toFixed(1)+' pts',1,'menor ventaja primero'],par:[ii=>ageTurn(ii).all,v=>pct(v,1)],vol:[ii=>wavg(V2.vol,ii),v=>pct(v,1)],abs:[ii=>{const v=wavg(V2.maxT,ii); return v==null?null:100-v;},v=>pct(v,1)],duro:[ii=>st.party?wavg(V2.duro[st.party],ii):null,v=>pct(v,1)],
  pv:[ii=>{if(ccOff(st.elec,st.party)) return null; const t=totals(st.elec,ii); return t.val?100*(t.tot[st.party]||0)/t.val:null;},v=>pct(v,1)],pen:[ii=>{const t=totals(st.elec,ii); return t.ln?100*(t.tot[st.party]||0)/t.ln:null;},v=>v.toFixed(1)],nul:[ii=>{const t=totals(st.elec,ii); return t.t?100*(t.t-t.val)/t.t:null;},v=>pct(v,1)]};
function rankHTML(){const Rw=RAW[st.metric]; if(!Rw) return ''; const bySec=!!st.terr||new Set(ALL.filter(i=>munScope(i)&&passF(i)).map(i=>S[i].m)).size<=1,units=bySec?ALL.filter(i=>munScope(i)&&passF(i)).map(i=>({k:'Sección '+S[i].s,ii:[i],i})):Object.keys(MUN).map(m=>({k:MUN[m],m,ii:ALL.filter(i=>S[i].m===+m&&passF(i))})).filter(u=>u.ii.length);
  units.forEach(u=>u.v=Rw[0](u.ii)); const L=units.filter(u=>u.v!=null),asc=Rw[2]?!st.rkr:!!st.rkr; L.sort((a,b)=>asc?a.v-b.v:b.v-a.v); const mx=Math.max(...L.map(u=>u.v),1e-9),lim=st.rkall?L.length:5,RP=METRICS[st.metric].needP&&st.party?C[st.party]:'#2FA59D';
  return `<div class="rk"><div class="rkh"><span>${L.length} ${bySec?'secciones':'municipios'} · ${asc?'de menor a mayor':'de mayor a menor'}</span><button id="rkr" title="Invertir orden">⇅</button></div><div class="rkl ${st.rkall?'all':''}">${L.slice(0,lim).map((u,j)=>`<div data-rk="${bySec?'s'+u.i:u.m}"><em>${j+1}</em><span>${esc(u.k)}</span><u><i style="width:${(100*u.v/mx).toFixed(1)}%;background:${RP}"></i></u><b class="num">${Rw[1](u.v)}</b></div>`).join('')}</div>${L.length>5?`<button class="sm" id="rkall">${st.rkall?'Ver sólo 5':'Ver los '+L.length}</button>`:''}</div>`;}
function bindRank(){const box=$('metric'); if($('rkb')) $('rkb').onclick=()=>{st.rk=!st.rk; paint();}; if($('rkr')) $('rkr').onclick=()=>{st.rkr=!st.rkr; paint();}; if($('rkall')) $('rkall').onclick=()=>{st.rkall=!st.rkall; paint();};
  box.querySelectorAll('[data-rk]').forEach(r=>{const v=r.dataset.rk,ii=v[0]==='s'?[+v.slice(1)]:ALL.filter(i=>S[i].m===+v&&passF(i)); r.onmouseenter=()=>hotL(ii); r.onmouseleave=()=>hotL([]); r.onclick=()=>{if(v[0]==='s'){st.sel=+v.slice(1); paint(); fit([st.sel]);} else setTerr(v);};});}
function paint(){if(st.view==='est') st.metric='seg'; else if(st.metric==='seg') st.metric='mar'; if(METRICS[st.metric].needE&&!st.elec) st.metric=st.party?'duro':'par'; const M=METRICS[st.metric],sc=new Set(scope()),useP=M.party,RP=TEAL;   /* todas las escalas en turquesa; el color del partido queda para 'Partido ganador' */
  paths.forEach((p,i)=>{const inT=munScope(i); let v=M.f([i]); if(useP) p.style.fill=v?mix(v.c,v.t):'var(--land)'; else p.style.fill=v==null?'#E4ECEB':RP(v); if(v==null&&st.elec&&st.elec.startsWith('AYU_')&&UYC.has(S[i].m)) p.style.fill='var(--peachxl)'; p.classList.toggle('off',!sc.has(i)||!inT); p.classList.toggle('sel',st.sel===i); p.classList.toggle('rt',st.view==='est'&&ERT.has(i)); p.style.display=inT||!st.terr?'':'';});
  applyLayers(); if(st.metric==='win'&&st.wl&&st.wl!=='sec'&&st.wl!=='est'){const g={mun:'gmun',dl:'gldl',df:'gldf'}[st.wl]; if(g) $(g).style.display='';} drawDiv(); setView(view);
  const ms=Object.entries(METRICS).filter(([key,x])=>!x.ext&&!x.est&&(!x.needP||st.party)&&(!x.needE||st.elec)).map(([key,x])=>`<button data-m="${key}" aria-pressed="${st.metric===key}">${x.lab?NM[st.party]+' '+x.n:x.n+(x.needP?' '+NM[st.party]:'')}</button>`).join('')+(XB.length?`<button data-mx="1" class="mxb" aria-expanded="${!!st.mx}" aria-pressed="${!!xCur()}">${xCur()?esc(XV[xCur()].nombre):'Otras capas · '+Object.keys(XV).length} ▾</button>`:'')+(XB.length&&st.mx?`<div class="mxp">${XB.map(b=>`<div class="mxg"><small>${esc(b.nombre)}</small><div class="ms">${b.variables.map(v=>`<button data-m="x_${v.id}" aria-pressed="${st.metric==='x_'+v.id}">${esc(v.nombre)}</button>`).join('')}</div></div>`).join('')}</div>`:'');
  const leg=useP?`<div class="ramp">${(()=>{const T2=totals(st.elec,[...sc]),cn={}; sc.forEach(i=>{const w=winner(st.elec,[i]); if(w) cn[w.lead]=(cn[w.lead]||0)+1;}); return T2.bl.filter(b=>cn[b.lead]).sort((x,y)=>cn[y.lead]-cn[x.lead]).slice(0,8).map(b=>({...b,name:NM[b.lead]+(b.members.filter(m=>m!=='OTROS').length>1?'+':'')}));})().map(b=>`<span style="width:auto;height:auto;gap:5px;align-items:center;display:inline-flex;overflow:visible"><i style="width:9px;height:9px;border-radius:50%;background:${b.c};flex:none"></i>${esc(b.name)}</span>`).join('')}</div>`:`<div class="ramp">${M.inv?M.hi:M.lo}<span>${[0,.2,.4,.6,.8,1].map(t=>`<i style="background:${RP(t)}"></i>`).join('')}</span>${st.metric==='pv'?PVMX()+'% o más':st.metric==='pen'?PNMX()+' votos o más':st.metric==='nul'?NUMX()+'% o más':M.inv?M.lo:M.hi}</div>`;
  const cl=xCur()?XV[xCur()].nombre:(M.lab?NM[st.party]+' '+M.n:M.n+(M.needP&&st.party?' '+NM[st.party]:''));
  $('metric').innerHTML=`<div class="mcard${st.mo?' open':''}"><button class="mtg" id="mtg" aria-expanded="${!!st.mo}"><span>Colorear por</span><b>${esc(cl)}</b><svg viewBox="0 0 10 10"><path d="M2.5 4l2.5 2.5L7.5 4"/></svg></button><div class="mbd"><div class="mbh"><small>Colorear el mapa por</small><button class="mcl" id="mcl" aria-label="Cerrar">×</button></div><div class="ms">${ms}</div>${st.metric==='win'?`<div class="wlr"><span>Por</span>${[['sec','Sección'],['mun','Municipio'],['dl','Distrito local'],['df','Distrito federal'],['est','Estado']].map(x=>`<button data-wl="${x[0]}" aria-pressed="${(st.wl||'sec')===x[0]}">${x[1]}</button>`).join('')}</div>`:''}<div style="font-size:10.5px;color:var(--muted);margin-top:4px">${esc(M.d)}${st.metric==='mar'||st.metric==='win'||st.metric==='pv'||st.metric==='pen'||st.metric==='nul'?' · '+esc(eLabel(st.elec)):''}${(st.metric==='pv'||st.metric==='pen')&&st.party&&ccOff(st.elec,st.party)?`<br><b style="color:var(--strong)">${esc(NM[st.party])} fue en candidatura común con ${esc(NM[ccLead(st.elec,st.party)])}: su voto está sumado al de ${esc(NM[ccLead(st.elec,st.party)])} y no se puede separar.</b>`:''}</div>${RAW[st.metric]?`<button class="rkb" id="rkb" aria-expanded="${!!st.rk}">${st.rk?'Ocultar ranking':'Ver ranking de mayor a menor'}</button>${st.rk?rankHTML():''}`:''}${st.party&&st.elec&&st.metric==='par'?`<div class="mnote">La participación no se puede separar por partido: el voto es secreto. Para ver dónde ${NM[st.party]} moviliza más votos, usa <button data-m="pen">${NM[st.party]} por cada 100 electores</button></div>`:''}</div>${leg}</div>`;
  if(st.view==='est'){$('metric').innerHTML=eLegendHTML(); $('metric').querySelectorAll('[data-eseg]').forEach(b=>b.onclick=()=>{st.es.seg=st.es.seg===b.dataset.eseg?null:b.dataset.eseg; render();}); $('metric').querySelectorAll('[data-eopen]').forEach(b=>b.onclick=()=>{st.es.tab='sec'; st.es.q=''; st.es.lim=300; st.es.sk=null; eTable();}); $('metric').querySelectorAll('[data-ecol]').forEach(b=>b.onclick=()=>{st.es.col=b.dataset.ecol; render();}); return;}
  $('metric').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{st.metric=b.dataset.m; st.mo=false; xEnsure(st.metric,paint);}); $('mtg').onclick=()=>{st.mo=!st.mo; paint();}; if($('mcl')) $('mcl').onclick=()=>{st.mo=false; paint();}; const mx=$('metric').querySelector('[data-mx]'); if(mx) mx.onclick=()=>{st.mx=!st.mx; paint();}; $('metric').querySelectorAll('.mxp [data-m]').forEach(b=>b.addEventListener('click',()=>{st.mx=false;})); $('metric').querySelectorAll('[data-wl]').forEach(b=>b.onclick=()=>{st.wl=b.dataset.wl; paint();}); bindRank();}

/* ficha flotante */
let hot=[]; const hotL=l=>{hot.forEach(i=>paths[i].classList.remove('hot')); hot=l; l.forEach(i=>paths[i].classList.add('hot'));};
const hideTip=()=>$('tip').classList.remove('on');
function hover(e){const b=e.target.closest&&e.target.closest('#gbub g'); let ii,title,sub;
  if(b){ii=ALL.filter(i=>S[i][BKEY]===+b.dataset.m&&passF(i)&&munScope(i)); title=MANY?'Distrito federal '+b.dataset.m:MUN[b.dataset.m]; sub=(MANY?'Cabecera '+(CABDF[b.dataset.m]||'')+' · ':'Municipio · ')+ii.length+(ii.length===1?' sección':' secciones');}
  else if(e.target.dataset&&e.target.dataset.i!=null){const i=+e.target.dataset.i; if(!st.terr){ii=ALL.filter(x=>S[x].m===S[i].m&&passF(x)); title=MUN[S[i].m]; sub='Municipio · '+ii.length+(ii.length===1?' sección':' secciones');} else {ii=[i]; title='Sección '+S[i].s; sub=(TIPO[S[i].t]||'')+' · distrito local '+S[i].dl;}}
  else {hideTip(); hotL([]); return;}
  hotL(ii); if(!ii.length){hideTip(); return;} const w=st.elec?winner(st.elec,ii):null,d=demo(ii),at=ageTurn(ii),vol=wavg(V2.vol,ii),t=$('tip'),box=$('mapw').getBoundingClientRect(),mx=w?w.bl[0].pct:1;
  const ix=(v,r)=>Math.round(100*v/r);
  t.innerHTML=`<div class="h"><div><b>${esc(title)}</b><span>${esc(sub)}</span></div>${w?`<i style="width:10px;height:10px;border-radius:50%;background:${C[w.lead]};margin-top:5px;flex:none"></i>`:''}</div><div class="g"><div><b class="num">${fmt(d.ln||lnOf(ii))}</b><span>electores</span></div>${w?`<div><b class="num">${pct(w.turn,1)}</b><span>participación ${D.E[st.elec].year}</span></div><div class="bx"><b class="num">${(()=>{const t2=totals(st.elec,ii); return pct(t2.t?100*(t2.t-t2.val)/t2.t:null,1);})()}</b><span>nulos y no reg.</span></div>`:`<div><b class="num">${pct(at.all,0)}</b><span>votó en ${AGEY}</span></div><div class="bx"><b class="num">${pct(d.jv,0)}</b><span>jóvenes 18–29</span></div>`}<div class="bx"><b class="num">${pct(vol,0)}</b><span>voto volátil</span></div></div>${w?`<div class="l">${w.bl.slice(0,4).map(x=>`<div class="r"><i style="background:${x.c}"></i><span>${esc(x.name)}</span><em>${x.pct.toFixed(1)}%</em><u style="width:${Math.max(3,64*x.pct/mx)}px;background:${x.c}"></u></div>`).join('')}</div>`:''}${!w&&st.elec&&st.elec.startsWith('AYU_')&&ii.some(i=>UYC.has(S[i].m))?`<div class="ft" style="color:var(--strong)">Elige autoridades por sistemas normativos indígenas (usos y costumbres): sin votación por partido.</div>`:''}${xCur()?`<div class="ft" style="color:var(--strong)">${esc(XV[xCur()].nombre)}: <b>${xFmt(xCur(),xVal(xCur(),ii))}</b></div>`:''}<div class="ft">${w?esc(eLabel(st.elec))+' · ventaja '+w.m.toFixed(1)+' pts · ':''}índice 100 = promedio estatal</div>`;
  let X=e.clientX-box.left+18,Y=e.clientY-box.top+18; if(X>box.width-290) X-=306; if(Y>box.height-270) Y=Math.max(10,Y-280); t.style.left=X+'px'; t.style.top=Y+'px'; t.classList.add('on');}


/* ===== bases adicionales (registro genérico) =====
   Cada variable registrada en pipeline/capas.json aparece sola como:
   color del mapa ("Otras capas"), filtro bajo/medio/alto, línea en la ficha del mapa,
   columna de la tabla y columna del CSV. Los valores se descargan solo al usarse. */
const XB=(typeof CAPAS!=='undefined'?CAPAS:[]).filter(b=>b.estados.includes(M0.cab));
const XV={}; XB.forEach(b=>b.variables.forEach(v=>{XV[v.id]={...v,base:b,key:'x_'+v.id};}));
const XD={},XL={},XFAIL={};   // valores por variable; promesas de carga por base
function xLoad(bid){if(XL[bid]) return XL[bid]; return XL[bid]=fetch('data/'+M0.cab+'/capas/'+bid+'.json').then(r=>{if(!r.ok) throw new Error(r.status); return r.json();}).then(j=>{for(const k in j.variables) if(XV[k]) xPrep(k,window.SUBIDX?window.SUBIDX.map(i=>j.variables[k][i]):j.variables[k]);}).catch(e=>{XFAIL[bid]=1; console.error(e); toast&&toast('No se pudo cargar la base '+bid+'.');});}
const xLoadAll=()=>Promise.all(XB.map(b=>xLoad(b.id)));
function xPrep(id,a){const v=XV[id],s=a.filter(x=>x!=null).sort((x,y)=>x-y),q=f=>s.length?s[Math.min(s.length-1,Math.floor(f*s.length))]:null;
  XD[id]=a; v.lo=q(.05); v.hi=q(.95); v.t1=q(1/3); v.t2=q(2/3); if(v.hi===v.lo) v.hi=v.lo+1;}
const xFmt=(id,x)=>{const v=XV[id]; if(x==null||isNaN(x)) return '—'; const t=x.toFixed(v.decimales!=null?v.decimales:1); return v.unidad==='pct'?t+'%':v.unidad==='n'?fmt(Math.round(x)):t;};
/* valor de un conjunto de secciones: suma si es conteo; si no, promedio ponderado por electores */
function xVal(id,ii){const a=XD[id]; if(!a) return null; let s=0,w=0; ii.forEach(i=>{const x=a[i]; if(x==null) return; const q=XV[id].unidad==='n'?1:(S[i].ln||1); s+=x*q; w+=q;}); return w?(XV[id].unidad==='n'?s:s/w):null;}
Object.values(XV).forEach(v=>{st.f[v.key]=[]; FL[v.key]={b:v.nombre+': bajo',m:v.nombre+': medio',a:v.nombre+': alto'};
  METRICS[v.key]={ext:1,n:v.nombre,d:(v.descripcion||'')+' · '+v.base.fuente+(v.base.nivel==='municipio'?' · dato municipal: todas las secciones de un municipio comparten valor':''),
    get lo(){return xFmt(v.id,v.lo);},get hi(){return xFmt(v.id,v.hi);},
    f:ii=>{const x=xVal(v.id,ii); return x==null?null:(x-v.lo)/(v.hi-v.lo);}};
  RAW[v.key]=[ii=>xVal(v.id,ii),x=>xFmt(v.id,x),0];});
const xCur=()=>st.metric&&st.metric.startsWith('x_')?st.metric.slice(2):null;
/* filtro bajo / medio / alto por terciles del estado */
function xPass(i){for(const id in XV){const f=st.f[XV[id].key]; if(!f||!f.length) continue; const x=XD[id]&&XD[id][i]; if(x==null) return false; const c=x<XV[id].t1?'b':x<XV[id].t2?'m':'a'; if(!f.includes(c)) return false;} return true;}
/* al elegir una capa que no se ha cargado, se descarga y se vuelve a pintar */
function xEnsure(key,then){const id=key.slice(2),v=XV[id]; if(!v||XD[id]) return then(); xLoad(v.base.id).then(then);}

/* filtros */
const IC={sec:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z"/><path d="M13 13h7v7h-7z" fill="currentColor" fill-opacity=".3"/>',yr:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',ter:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',tipo:'<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',dl:'<path d="M4 4h16v16H4z"/><path d="M4 12h16M12 4v16"/>',age:'<circle cx="9" cy="7" r="3"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 5.5M21 19c0-2.6-1.6-4.8-4-5.6"/>',win:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 6h3a3 3 0 0 1-3 3M7 6H4a3 3 0 0 0 3 3"/>',cmp:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'};
function acc(id,icon,title,inner,cnt,alert){const o=st.open[id]; return `<div class="acc ${o?'open':''} ${alert?'alert':''}"><button class="acch" data-acc="${id}"><svg viewBox="0 0 24 24">${IC[icon]}</svg>${title}${cnt?`<span class="bd">${cnt}</span>`:''}<span class="cv"></span></button><div class="accb"><div><div class="in">${inner}</div></div></div></div>`;}
const opt=(grp,v,label,dot)=>`<button class="opt" data-f="${grp}" data-v="${v}" aria-pressed="${st.f[grp].includes(v)}" title="${esc(label)}">${dot?`<span class="pd" style="background:${dot}"></span>`:'<i></i>'}<span class="ol">${esc(label)}</span></button>`;
const DLMUN={}; for(const d of DLS){const c={}; ALL.filter(i=>S[i].dl===d).forEach(i=>c[S[i].m]=(c[S[i].m]||0)+(S[i].ln||0)); DLMUN[d]=MUN[Object.keys(c).sort((a,b)=>c[b]-c[a])[0]];}
function dlOpts(){const q=norm(st.dq||''),L=DLS.filter(d=>!q||String(d)===q.replace(/\D/g,'')||norm(DLMUN[d]+' '+(CABDL[d]||'')).includes(q)),sel=L.filter(d=>st.f.dl.includes(d)),show=q||st.dall?L:sel;
  return show.map(d=>opt('dl',d,'DL '+d+' · '+(CABDL[d]||DLMUN[d]))).join('')+(!q?`<button class="sm all" data-all="dall">${st.dall?'Ocultar lista':'Ver los '+NDL+' distritos locales'}</button>`:'')+(q&&!L.length?'<span class="more">Sin coincidencias</span>':'');}
function munOpts(){const q=norm(st.mq),L=Object.keys(MUN).filter(m=>!q||norm(MUN[m]).includes(q)).sort((a,b)=>MUN[a].localeCompare(MUN[b])),sel=L.filter(m=>st.f.mun.includes(+m)),show=q||st.mall?L:sel;
  return show.map(m=>opt('mun',+m,MUN[m])).join('')+(!q?`<button class="sm all" data-all="mall">${st.mall?'Ocultar lista':'Ver los '+Object.keys(MUN).length+' municipios'}</button>`:'')+(q&&!L.length?'<span class="more">Sin coincidencias</span>':'');}
function secOpts(){return st.f.sec.map(v=>opt('sec',v,'Sección '+v)).join('')+(st.secErr?`<span class="more" style="color:var(--coral)">${esc(st.secErr)}</span>`:'');}
function renderFP(){const B=$('fpb'),pk=prevOf(st.elec);
  if(st.ft==='t'){const ey=st.elec?D.E[st.elec].year:null; if(!st.yo) st.yo={}; const ys=YEARS.slice().reverse().map(y=>{const o=st.yo[y]!=null?st.yo[y]:y===ey,ks=Object.keys(TY).filter(t=>D.E[t+'_'+y]); return `<div class="yg ${o?'open':''}"><button class="yh" data-yr="${y}"><b>${y}</b><span>${ey===y?esc(TY[st.elec.split('_')[0]]):ks.length+(ks.length===1?' elección':' elecciones')}</span><i class="cv"></i></button><div class="yb"><div><div class="yl">${ks.map(t=>`<button class="opt" data-el="${t}_${y}" aria-pressed="${st.elec===t+'_'+y}" title="${TY[t]} ${y}"><i></i><span class="ol">${TY[t].replace('Diputaciones','Dip.')}</span></button>`).join('')}</div></div></div></div>`;}).join('');
    B.innerHTML=acc('yr','yr','Elección',`<div class="ycol">${ys}<p class="fnote">Clic en la elección marcada para quitarla.</p></div>`,st.elec?1:0)
     +acc('ter','ter','Municipios',`<input class="ms2" id="ms2" placeholder="Buscar entre ${Object.keys(MUN).length} municipios" value="${esc(st.mq)}"><div class="mlst" id="mlst">${munOpts()}</div>`,st.f.mun.length)
     +acc('dl','dl','Distritos',`<div style="width:100%;font-size:10.5px;color:var(--muted)">Federales</div>${DFS.map(j=>opt('df',j,'DF '+j+' · '+(CABDF[j]||''))).join('')}<div style="width:100%;font-size:10.5px;color:var(--muted);margin-top:6px">Locales (${NDL})</div><input class="ms2" id="ds2" placeholder="Buscar distrito por número o municipio" value="${esc(st.dq||'')}"><div class="mlst" id="dlst">${dlOpts()}</div>`,st.f.dl.length+st.f.df.length)
     +acc('sec','sec','Sección',`<input class="ms2" id="ss2" inputmode="numeric" placeholder="Número de sección y Enter (ej. 120 o 130-140)"><div class="mlst" id="slst">${secOpts()}</div>`,st.f.sec.length)
     +acc('tipo','tipo','Tipo y tamaño de sección',Object.entries(FL.tipo).map(x=>opt('tipo',+x[0],x[1])).join('')+'<div style="width:100%"></div>'+Object.entries(FL.size).map(x=>opt('size',x[0],x[1])).join(''),st.f.tipo.length+st.f.size.length)
     +acc('age','age','Perfil del electorado',Object.entries(FL.age).map(x=>opt('age',x[0],x[1])).join('')+'<div style="width:100%"></div>'+Object.entries(FL.part).map(x=>opt('part',x[0],x[1])).join(''),st.f.age.length+st.f.part.length)
     +(XB.length?acc('xv','cmp','Otras bases',`<p class="fnote" style="margin:0 0 4px">Tercios del estado: bajo, medio y alto.</p>`+XB.map(b=>`<div class="xbg"><small>${esc(b.nombre)}</small>${b.variables.map(v=>`<div class="xvr"><span>${esc(v.nombre)}</span>${['b','m','a'].map(c=>opt(XV[v.id].key,c,{b:'Bajo',m:'Medio',a:'Alto'}[c])).join('')}</div>`).join('')}</div>`).join(''),Object.values(XV).reduce((a,v)=>a+st.f[v.key].length,0)):'');}
  else {const ws=st.elec?totals(st.elec,ALL).bl.slice(0,5):[]; B.innerHTML=(st.elec?'':'<p class="fnote">Sin elección seleccionada. Los filtros de ganador y competitividad necesitan una elección: elígela en <b>Territorio y votantes › Elección</b>.</p>')+(st.elec?acc('win','win','Partido ganador · '+esc(eLabel(st.elec)),ws.map(b=>opt('win',b.lead,b.name,b.c)).join(''),st.f.win.length)
     +acc('mg','cmp','Competitividad',Object.entries(FL.mg).map(x=>opt('mg',x[0],x[1])).join(''),st.f.mg.length,true):'')
     +acc('cmp','cmp','Comportamiento del voto',Object.entries(FL.cmp).filter(x=>x[0]!=='chg'||pk).map(x=>opt('cmp',x[0],x[0]==='chg'?'Cambió de ganador vs. '+D.E[pk].year:x[1])).join(''),st.f.cmp.length,true);}
  B.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>{st.open[b.dataset.acc]=!st.open[b.dataset.acc]; b.parentElement.classList.toggle('open');});
  const bindOpt=root=>root.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const g=b.dataset.f,v=isNaN(+b.dataset.v)?b.dataset.v:+b.dataset.v,a=st.f[g],j=a.indexOf(v); j>=0?a.splice(j,1):a.push(v); const go=()=>{render(true); setTimeout(()=>fit(scope().length?scope():ALL.filter(munScope)),40);}; g.startsWith('x_')?xEnsure(g,go):go();});
  bindOpt(B); const bindAll=root=>root.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>{st[b.dataset.all]=!st[b.dataset.all]; const l=b.parentElement; l.innerHTML=l.id==='mlst'?munOpts():dlOpts(); bindOpt(l); bindAll(l);}); bindAll(B);
  if($('ss2')) $('ss2').onkeydown=e=>{if(e.key!=='Enter') return; const SN=new Set(ALL.map(i=>S[i].s)),add=[],bad=[]; e.target.value.split(/[,\s]+/).filter(Boolean).forEach(t=>{const m=t.match(/^(\d+)(?:-(\d+))?$/); if(!m){bad.push(t); return;} const a=Math.min(+m[1],+(m[2]||m[1])),b=Math.max(+m[1],+(m[2]||m[1])); for(let v=a;v<=b&&v-a<400;v++){if(SN.has(v)) add.push(v); else if(!m[2]) bad.push(v);}}); add.forEach(v=>{if(!st.f.sec.includes(v)) st.f.sec.push(v);}); st.secErr=bad.length?'No existe en '+EST+': '+bad.join(', '):''; st.open.sec=true; render(true); setTimeout(()=>fit(scope().length?scope():ALL.filter(munScope)),40);};
  if($('ds2')) $('ds2').oninput=e=>{st.dq=e.target.value; $('dlst').innerHTML=dlOpts(); bindOpt($('dlst')); bindAll($('dlst'));};
  if($('ms2')) $('ms2').oninput=e=>{st.mq=e.target.value; $('mlst').innerHTML=munOpts(); bindOpt($('mlst')); bindAll($('mlst'));};
  B.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>setElec(st.elec===b.dataset.el?null:b.dataset.el));
  B.querySelectorAll('[data-yr]').forEach(b=>b.onclick=()=>{const y=+b.dataset.yr,g=b.parentElement,o=!g.classList.contains('open'); st.yo[y]=o; g.classList.toggle('open',o);});
  $('ftabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.ft===st.ft));}
const DEFE=BASE; function setElec(k){const p=$('epop'); if(p) p.remove(); st.elec=k; $('elec').value=k||''; render(true);}
function ePop(an){let p=$('epop'); if(p){p.classList.add('out'); setTimeout(()=>p.remove(),180); return;} p=document.createElement('div'); p.id='epop'; p.className='epop';
  p.innerHTML=`<small>Elige la elección a consultar</small>`+YEARS.slice().reverse().map(y=>{const ks=Object.keys(TY).filter(t=>D.E[t+'_'+y]); return ks.length?`<div class="er"><h6>${y}</h6><div>${ks.map(t=>`<button data-el="${t}_${y}" aria-pressed="${st.elec===t+'_'+y}">${TY[t]}</button>`).join('')}</div></div>`:'';}).join('')+(st.elec!==DEFE?`<button class="rst" data-el="${DEFE}">↺ Volver a la elección base (${esc(eLabel(DEFE))})</button>`:'');
  document.body.appendChild(p); const r=(an||$('cxE')).getBoundingClientRect(); p.style.left=Math.max(8,Math.min(r.left,innerWidth-p.offsetWidth-8))+'px'; p.style.top=(r.bottom+8)+'px';
  p.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>setElec(b.dataset.el));
  setTimeout(()=>document.addEventListener('pointerdown',function h(ev){if(!ev.target.closest('#epop,#cxE,.epa')){const q=$('epop'); if(q) q.remove(); document.removeEventListener('pointerdown',h);} else if(!$('epop')) document.removeEventListener('pointerdown',h);}),0);}
function ctxBar(){const B=$('ctxbar'),lab=(g,v)=>g==='sec'?'Sección '+v:g==='mun'?MUN[v]:g==='dl'?'Distrito local '+v:g==='df'?'Distrito federal '+v:g==='win'?'Ganador: '+NM[v]:FL[g]?(g==='cmp'&&v==='chg'?'Cambió de ganador':FL[g][v]):v; let h=st.elec?`<span class="cx e" id="cxE"><svg viewBox="0 0 12 12"><rect x="1.5" y="2" width="9" height="8.5" rx="1.5"/><path d="M1.5 5h9M4 1v2M8 1v2"/></svg>${esc(eLabel(st.elec))}<button data-x="elec" aria-label="Quitar elección" title="Quitar la elección y ver el panorama del territorio">✕</button></span>`:`<span class="cx ne" id="cxE" title="Elige una elección en Explorar">Sin elección · panorama del territorio</span>`;
  if(st.terr) h+=`<span class="cx t">${esc(MUN[st.terr])}<button data-x="terr" aria-label="Quitar municipio">✕</button></span>`;
  for(const g in st.f){if(g==='sec'&&st.f.sec.length>3){h+=`<span class="cx f">${st.f.sec.length} secciones (${Math.min(...st.f.sec)}–${Math.max(...st.f.sec)})<button data-x="secall" aria-label="Quitar secciones">✕</button></span>`; continue;} st.f[g].forEach(v=>h+=`<span class="cx ${['mg','cmp','win'].includes(g)?'a':'f'}">${esc(lab(g,v))}<button data-x="${g}|${v}" aria-label="Quitar filtro">✕</button></span>`);}
  if(st.terr||nf()) h+=`<button class="cx clr" data-x="all">Quitar todo</button>`;
  B.innerHTML=h; if(!st.elec) $('cxE').onclick=()=>{st.fp=true; st.ft='t'; st.open.yr=true; layout(); renderFP();};
  B.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{const x=b.dataset.x; if(x==='terr'){setTerr(null); return;} if(x==='all'){for(const g in st.f) st.f[g]=[]; setTerr(null); return;} if(x==='elec'){setElec(null); return;} if(x==='secall'){st.f.sec=[]; render(true); setTimeout(()=>fit(scope().length?scope():ALL.filter(munScope)),40); return;} const [g,v]=x.split('|'),val=isNaN(+v)?v:+v; st.f[g]=st.f[g].filter(z=>z!==val); render(true); setTimeout(()=>fit(scope().length?scope():ALL.filter(munScope)),40);});}
function chipsHTML(){const out=[]; const lab=(g,v)=>g==='sec'?'Sección '+v:g==='mun'?MUN[v]:g==='dl'?'DL '+v:g==='df'?'DF '+v:g==='win'?'Ganador: '+NM[v]:FL[g]?(g==='cmp'&&v==='chg'?'Cambió de ganador':FL[g][v]):v;
  for(const g in st.f) st.f[g].forEach(v=>out.push(`<span class="${['mg','cmp'].includes(g)?'a':''}">${esc(lab(g,v))}<button data-rf="${g}|${v}" aria-label="Quitar">✕</button></span>`)); return out.join('');}
$('ftabs').onclick=e=>{const b=e.target.closest('button'); if(b){st.ft=b.dataset.ft; renderFP();}};
$('clr').onclick=()=>{for(const g in st.f) st.f[g]=[]; render(true);};
$('tog').onclick=()=>{st.fp=!st.fp; layout(); setTimeout(refit,120);};

/* registro de personas que ganaron (meta.gan), para el buscador y la tarjeta de trayectoria */
const GAN=M0.gan||null;
const ganBy=GAN?(()=>{const o={}; GAN.r.forEach(r=>{(o[r[0]]=o[r[0]]||[]).push(r);}); return o;})():{};
const AC=[].concat(Object.keys(MUN).map(m=>({t:'Municipios',ic:'M',n:MUN[m],s:ALL.filter(i=>S[i].m===+m).length+' secciones',go:()=>setTerr(m)})),DLS.map(d=>({t:'Distritos locales',ic:'DL',n:'Distrito local '+d,s:'Cabecera: '+(CABDL[d]||DLMUN[d]),go:()=>applyScope('dl',d)})),DFS.map(j=>({t:'Distritos federales',ic:'DF',n:'Distrito federal '+j,s:'Cabecera: '+(CABDF[j]||''),go:()=>applyScope('df',j)})));
AC.forEach(o=>o.k=norm(o.n+' '+o.s));
const GANK=GAN?GAN.p.map(x=>norm(x)):[];
let ACL=[],ACI=0;
const hl=(t,q)=>{if(!q) return esc(t); const n=norm(t),i=n.indexOf(q); return i<0?esc(t):esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length));};
function acOpen(){const q=norm($('ac').value.trim()),grp={}; AC.forEach(o=>{if(!q||o.k.includes(q)) (grp[o.t]=grp[o.t]||[]).push(o);});
  const qs=q.replace(/^(secc?(ion)?|sec\.?|s)\s*/,''); if(/^\d+$/.test(qs)){const m=ALL.filter(i=>String(S[i].s).startsWith(qs)).slice(0,8); if(m.length) grp['Secciones']=m.map(i=>({t:'Secciones',ic:'S',n:'Sección '+S[i].s,s:MUN[S[i].m]+' · '+(TIPO[S[i].t]||''),go:()=>{st.terr=String(S[i].m); st.sel=i; render(true); setTimeout(()=>fit([i]),40);}}));}
  let h=''; ACL=[]; const order=['Secciones','Municipios','Distritos locales','Distritos federales']; order.forEach(g=>{const L=grp[g]; if(!L) return; const n=g==='Municipios'?(L.length<=20?L.length:q?12:8):q?6:3; h+=`<h5>${g}<span>${L.length}</span></h5>`; L.slice(0,n).forEach(o=>{h+=`<button data-i="${ACL.length}" role="option"><i>${o.ic}</i><span>${hl(o.n,q)}</span><small>${esc(o.s)}</small></button>`; ACL.push(o);});});
  $('acl').innerHTML=h||`<div class="empty">Sin resultados para “${esc($('ac').value)}”. Prueba con un municipio, “distrito 5” o un número de sección. Para buscar personas usa Actores.</div>`; $('acl').classList.add('on'); $('ac').setAttribute('aria-expanded','true'); ACI=0; acMark();}
const acMark=()=>$('acl').querySelectorAll('button').forEach((b,j)=>b.classList.toggle('cur',j===ACI));
const acClose=()=>{$('acl').classList.remove('on'); $('ac').setAttribute('aria-expanded','false');};
function acPick(o){acClose(); $('ac').value=''; $('ac').blur(); o.go();}
$('ac').addEventListener('focus',acOpen); $('ac').addEventListener('input',acOpen); $('ac').addEventListener('blur',()=>setTimeout(acClose,150));
$('ac').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){ACI=Math.min(ACL.length-1,ACI+1); acMark(); e.preventDefault();} else if(e.key==='ArrowUp'){ACI=Math.max(0,ACI-1); acMark(); e.preventDefault();} else if(e.key==='Enter'&&ACL[ACI]) acPick(ACL[ACI]); else if(e.key==='Escape'){acClose(); $('ac').value=''; $('ac').blur();}});
$('acl').addEventListener('pointerdown',e=>{const b=e.target.closest('button'); if(b){e.preventDefault(); acPick(ACL[+b.dataset.i]);}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement.tagName!=='INPUT'){e.preventDefault(); $('ac').focus();}});
function layout(){$('fp').classList.toggle('closed',!st.fp); $('tog').classList.toggle('closed',!st.fp); ['metric','zoom','tbl'].forEach(id=>$(id).classList.toggle('wide',!st.fp));}


/* tarjetas */
function ring(v,c){const r=52,cc=2*Math.PI*r,o=cc*(1-Math.max(0,Math.min(1,v/100))); return `<svg viewBox="0 0 130 130" width="130" height="130" role="img" aria-label="Participación"><circle cx="65" cy="65" r="${r}" fill="none" stroke="var(--hair)" stroke-width="7"/><circle class="rg" style="--c:${cc.toFixed(1)}" cx="65" cy="65" r="${r}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${cc.toFixed(1)}" stroke-dashoffset="${o.toFixed(1)}" transform="rotate(-90 65 65)"/><circle cx="65" cy="65" r="${r-14}" fill="var(--tealxl)" opacity=".6"/></svg>`;}
function bubbles(W,bl,prev){const top=bl.filter((b,j)=>j<2||b.pct>=1).slice(0,5),H=150,mx=Math.max(...top.map(b=>b.votes)),R=v=>8+Math.sqrt(v/mx)*44; let x=0; const pos=top.map((b,j)=>{const r=R(b.votes); x+=j?r*0.72+R(top[j-1].votes)*0.72:r; return {b,r,x};}); const tw=pos[pos.length-1].x+pos[pos.length-1].r,off=(W-tw)/2; const LX=pos.map(q=>off+q.x); for(let j=1;j<LX.length;j++) LX[j]=Math.max(LX[j],LX[j-1]+60); const sh=(LX.reduce((a,v)=>a+v,0)-pos.reduce((a,q)=>a+off+q.x,0))/LX.length; for(let j=0;j<LX.length;j++) LX[j]=Math.min(W-30,Math.max(30,LX[j]-sh));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fuerzas políticas">${pos.slice().reverse().map(({b,r,x},jj)=>{const j=pos.length-1-jj,cx=off+x,cy=62; return `<g class="pp hv" data-g="${j}" data-tip="${esc(`<b>${b.name}</b>${b.pct.toFixed(1)}% · ${fmt(b.votes)} votos`)}" style="--d:${j*110}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${b.c}" fill-opacity="${j?.85:1}" stroke="#fff" stroke-width="2.5"/>${r>24?`<text x="${cx}" y="${cy+5}" text-anchor="middle" style="font:800 ${r>40?15:12}px var(--d);fill:#fff">${b.pct.toFixed(0)}%</text>`:''}</g>`;}).join('')}${pos.map(({b,r,x},j)=>{const cx=LX[j],pb=prev&&prev.find(z=>z.lead===b.lead); return `<text x="${cx}" y="${H-22}" text-anchor="middle" style="font:700 10.5px var(--f);fill:var(--strong)">${esc(fitT(NM[b.lead],9))}${b.members.filter(m=>m!=='OTROS').length>1?'+':''}</text><text x="${cx}" y="${H-8}" text-anchor="middle" style="font:600 10px var(--f);fill:${pb?(b.pct>=pb.pct?'var(--teal3)':'var(--coral)'):'var(--muted)'}">${r<=24?b.pct.toFixed(1)+'%':''}${pb?' '+sg(b.pct-pb.pct,1):''}</text>`;}).join('')}</svg>`;}
function ageT(idx){const l=Array(7).fill(0),s=Array(7).fill(0); idx.forEach(i=>{const a=V2.age[AGEY][i]; if(a) for(let j=0;j<7;j++){l[j]+=a[j]; s[j]+=a[7+j];}}); return l.map((x,j)=>x?100*s[j]/x:null);}
const share=(ek,p,idx)=>{let a=0,b=0; idx.forEach(i=>{const r=row(ek,i); if(r){a+=r.v[p]; b+=r.val;}}); return b?100*a/b:null;};
let RCID=0;
function cols(W,bl,prev){const top=bl.filter((b,j)=>j<2||b.pct>=.5).slice(0,5),H=222,pt=40,pb=50,mx=Math.max(...top.map(b=>Math.max(b.pct,(prev&&(prev.find(z=>z.lead===b.lead)||{}).pct)||0)))*1.06,gw=W/top.length,bw=Math.min(42,gw*.5),Y=v=>H-pb-v/mx*(H-pt-pb),base=H-pb,id='rc'+(++RCID);
  const grid=[.25,.5,.75,1].map(t=>`<line x1="0" x2="${W}" y1="${Y(mx*t/1.06).toFixed(1)}" y2="${Y(mx*t/1.06).toFixed(1)}" stroke="#EEF2F2"/>`).join('');
  return `<svg class="chart rc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Resultados por partido">${grid}${top.map((b,j)=>{const x=j*gw+gw/2,pb2=prev&&prev.find(z=>z.lead===b.lead),tot=b.parts.reduce((a,q)=>a+q.v,0)||1,yt=Y(b.pct),hh=base-yt; let yy=base;
    const segs=b.parts.filter(q=>q.v>0).map(q=>{const h=hh*q.v/tot; yy-=h; return `<rect x="${(x-bw/2).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" fill="${C[q.p]}" stroke="#fff" stroke-width="1.2"/>`;}).join('');
    const d=pb2?b.pct-pb2.pct:null,dt=d==null?'':sg(d,1),dw=dt.length*6+12;
    const tip=`<b>${b.name}</b>${b.pct.toFixed(1)}% · ${fmt(b.votes)} votos${b.parts.filter(q=>q.v>0).length>1?'<br>'+b.parts.filter(q=>q.v>0).map(q=>NM[q.p]+' '+(b.pct*q.v/(b.votes||1)).toFixed(1)+'%').join(' · '):''}${pb2?`<br>Elección anterior: ${pb2.pct.toFixed(1)}% (${sg(d,1)} pts)`:''}`;
    return `<g class="hv" data-g="${j}" data-tip="${esc(tip)}">${j===0?`<rect x="${(j*gw+3).toFixed(1)}" y="${pt-34}" width="${(gw-6).toFixed(1)}" height="${H-pt+30}" rx="12" fill="${mix(b.c,.08,[255,255,255])}"/><text x="${x}" y="${pt-20}" text-anchor="middle" style="font:800 9.5px var(--f);fill:${b.c};letter-spacing:.08em">1er LUGAR</text>`:''}
     <clipPath id="${id}_${j}"><rect x="${(x-bw/2).toFixed(1)}" y="${yt.toFixed(1)}" width="${bw.toFixed(1)}" height="${(hh+8).toFixed(1)}" rx="8"/></clipPath><g class="gyb" style="--d:${j*90}" clip-path="url(#${id}_${j})">${segs}</g>
     ${pb2?`<line x1="${(x-bw/2-7).toFixed(1)}" x2="${(x+bw/2+7).toFixed(1)}" y1="${Y(pb2.pct).toFixed(1)}" y2="${Y(pb2.pct).toFixed(1)}" stroke="#1C2121" stroke-width="1.6" stroke-dasharray="3 2" class="fadein"/>`:''}
     <text x="${x}" y="${(yt-8).toFixed(1)}" text-anchor="middle" style="font:800 ${j?12.5:14}px var(--d);fill:var(--strong)">${b.pct.toFixed(1)}%</text>
     <text x="${x}" y="${base+16}" text-anchor="middle" style="font:700 10.5px var(--f);fill:var(--strong)">${esc(fitT(NM[b.lead],Math.max(4,Math.floor(gw/7.5)-1)))}${b.members.filter(m=>m!=='OTROS').length>1?'+':''}</text>
     ${d!=null?`<rect x="${(x-dw/2).toFixed(1)}" y="${base+23}" width="${dw}" height="16" rx="8" fill="${d>=0?'#E4F5F3':'#FDE8EC'}"/><text x="${x}" y="${base+34.5}" text-anchor="middle" style="font:700 9.5px var(--f);fill:${d>=0?'#1C7F79':'#C2405C'}">${dt}</text>`:''}</g>`;}).join('')}<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--line)"/></svg>`;}
const TT={DIPL:'Diputaciones locales',AYU:'Ayuntamientos',GOB:'Gubernatura',DIPF:'Diputaciones federales',PRE:'Presidencia'};
function tdata(idx,type,mode,proj,coal){const ys=YEARS.filter(y=>D.E[type+'_'+y]),ps=['MORENA','PRI','PAN','MC','PT','PVEM','PRD'];
  const ser=ps.map(p=>({p,v:ys.map(y=>{if(ccOff(type+'_'+y,p)) return null; const T=totals(type+'_'+y,idx); if(coal){const b=(T.bl||[]).find(b=>b.members.includes(p)); if(!b||b.lead!==p) return null; return mode==='abs'?b.votes:b.pct;} return mode==='abs'?(T.tot[p]||0):(T.val?100*(T.tot[p]||0)/T.val:0);})}));
  const win=ys.map(y=>{const w=winner(type+'_'+y,idx); return w?w.lead:null;}),turn=ys.map(y=>totals(type+'_'+y,idx).turn);
  /* proyección 2027 del mismo cargo (punto punteado con su rango) */
  if(proj&&mode!=='abs'&&typeof pjParties==='function'){const pp=pjParties(type,idx); if(pp){const L=ys.length-1; ys.push(2027); const pj={};
    ser.forEach(s=>{const ok=s.v[L]!=null&&pp[s.p]; s.v.push(ok?pp[s.p].v:null); if(ok) pj[s.p]=[pp[s.p].lo,pp[s.p].hi];});
    const lead=ser.filter(s=>s.v[L+1]!=null).sort((a,b)=>b.v[L+1]-a.v[L+1])[0]; win.push(lead?lead.p:null); turn.push(null); return {ys,ser,win,turn,pj};}}
  return {ys,ser,win,turn};}
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches,TP=['MORENA','PRI','PAN','MC','PT','PVEM','PRD'];
const hx=(a,b,t)=>{const A=hexrgb(a),B=hexrgb(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const niceMx=(m,mode)=>{if(mode==='abs'){const p=Math.pow(10,Math.floor(Math.log10(Math.max(1,m)))); return Math.ceil(m/p)*p;} return Math.max(16,Math.ceil(m/8)*8);};
function tmodel(idx,o){const mode=o.mode||'pct',td=tdata(idx,o.type||'DIPL',mode,o.proj!==false&&!o.coal,o.coal),show=o.show||['MORENA','PRI','PAN','MC'],vis=td.ser.filter(s=>show.includes(s.p)),nY=td.ys.length,hl=o.hl||(vis.length?vis.slice().sort((a,b)=>b.v[nY-1]-a.v[nY-1])[0].p:null);
  const tlOn=false; return {type:o.type||'DIPL',pj:td.pj||null,ys:td.ys,win:td.win,turn:td.turn,mode,hl,ta:tlOn?1:0,mx:niceMx(Math.max(1,...vis.flatMap(s=>s.v),...(td.pj?vis.map(s=>td.pj[s.p]?td.pj[s.p][1]:0):[]),...(tlOn?td.turn.filter(x=>x!=null):[])),mode),upto:o.upto==null?td.ys.length-1:o.upto,ser:td.ser.map(s=>({p:s.p,v:s.v,a:show.includes(s.p)?1:0,f:hl===s.p?1:0,d:hl&&hl!==s.p?1:0}))};}
function lerpM(A,B,e){const L=(a,b)=>a+(b-a)*e; return {...B,ta:L(A.ta||0,B.ta||0),mx:L(A.mx,B.mx),upto:L(A.upto,B.upto),turn:B.turn.map((t,j)=>t==null||A.turn[j]==null?t:L(A.turn[j],t)),ser:B.ser.map(s=>{const o=A.ser.find(z=>z.p===s.p)||s; return {p:s.p,v:s.v.map((v,j)=>v==null?null:L(o.v[j]==null?v:o.v[j],v)),a:L(o.a,s.a),f:L(o.f,s.f),d:L(o.d,s.d)};})};}
function mpath(P){const n=P.length; if(n<2) return n?`M${P[0][0]},${P[0][1]}`:''; const dx=[],m=[],t=[]; for(let i=0;i<n-1;i++){dx[i]=P[i+1][0]-P[i][0]; m[i]=(P[i+1][1]-P[i][1])/dx[i];}
  t[0]=m[0]; t[n-1]=m[n-2]; for(let i=1;i<n-1;i++) t[i]=m[i-1]*m[i]<=0?0:(m[i-1]+m[i])/2;
  for(let i=0;i<n-1;i++){if(m[i]===0){t[i]=0; t[i+1]=0; continue;} const a=t[i]/m[i],b=t[i+1]/m[i],h=a*a+b*b; if(h>9){const q=3/Math.sqrt(h); t[i]=q*a*m[i]; t[i+1]=q*b*m[i];}}
  let d=`M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`; for(let i=0;i<n-1;i++){const h=dx[i]/3; d+=`C${(P[i][0]+h).toFixed(1)},${(P[i][1]+t[i]*h).toFixed(1)} ${(P[i+1][0]-h).toFixed(1)},${(P[i+1][1]-t[i+1]*h).toFixed(1)} ${P[i+1][0].toFixed(1)},${P[i+1][1].toFixed(1)}`;} return d;}
let TCID=0;
function trendSVG(W,H,m,draw){const big=W>600,n=m.ys.length,pl=big?62:34,pr=big?150:84,pt=big?50:12,pb=big?36:28,ip=big?42:16,X=j=>pl+ip+(n===1?.5:j/(n-1))*(W-pl-pr-2*ip),Y=v=>H-pb-v/m.mx*(H-pt-pb),fv=v=>m.mode==='abs'?k(v):Math.round(v)+'%',u=m.upto,ui=Math.min(n-1,Math.floor(u+1e-6)),uf=u-ui,cw=(W-pl-pr-2*ip)/Math.max(1,n-1),bw=Math.min(big?70:30,cw*.6),id='tc'+(++TCID);
  const vis=m.ser.filter(s=>s.a>.01),ff=a=>{let l=null; return a.map(v=>v==null?l:(l=v));},vAt=s=>{const v=ff(s.v); const a=v[ui]==null?0:v[ui],b=ui>=n-1?a:(v[ui+1]==null?a:v[ui+1]); return ui>=n-1?a:a+(b-a)*uf;},ex=X(u);
  const grid=[0,.25,.5,.75,1].map(t=>`<line x1="${pl}" x2="${W-pr+(big?8:4)}" y1="${Y(m.mx*t).toFixed(1)}" y2="${Y(m.mx*t).toFixed(1)}" stroke="${t?'#E8EDED':'var(--line)'}"${t?' stroke-dasharray="2 5"':''}/><text x="${pl-10}" y="${(Y(m.mx*t)+4).toFixed(1)}" text-anchor="end">${fv(m.mx*t)}</text>`).join('');
  const cols=m.ys.map((y,j)=>{const x=X(j),past=j<=u+.02,w=m.win[j],tn=m.turn[j],ty=H-pb+(big?30:22),th=big?7:5;
    return `<g opacity="${past?1:.25}">`+(w&&big?`<rect x="${(x-bw/2).toFixed(1)}" y="${pt-(big?34:22)}" width="${bw.toFixed(1)}" height="${big?18:11}" rx="${big?9:5.5}" fill="${C[w]}"/>${big?`<text x="${x}" y="${pt-21}" text-anchor="middle" style="font:700 10px var(--f);fill:#fff;letter-spacing:.04em">${NM[w].toUpperCase()}</text>`:''}`:'')
     +`<line x1="${x}" x2="${x}" y1="${pt-(big?10:7)}" y2="${H-pb}" stroke="#DCE3E3" stroke-dasharray="1 3"/><text x="${x}" y="${H-pb+(big?20:15)}" text-anchor="middle" style="font:800 ${big?13:10.5}px var(--d);fill:var(--strong)">${y}</text>`
     +(false&&tn!=null?`<g opacity="${(1-.8*(m.ta||0)).toFixed(2)}"><rect x="${(x-bw/2).toFixed(1)}" y="${ty}" width="${bw.toFixed(1)}" height="${th}" rx="${th/2}" fill="#EEF2F2"/><rect x="${(x-bw/2).toFixed(1)}" y="${ty}" width="${(bw*Math.min(100,tn)/100).toFixed(1)}" height="${th}" rx="${th/2}" fill="#9FB0AF"/>${big?`<text x="${x}" y="${ty+21}" text-anchor="middle" style="font:600 10.5px var(--f)">${Math.round(tn)}%</text>`:''}</g>`:'')+`</g>`;}).join('');
  const rowl=big?`<text x="${pl-10}" y="${pt-21}" text-anchor="end" style="font:600 10px var(--f)">Ganador</text>`:'';
  const PJ=!!m.pj,lastR=PJ?n-2:n-1,pjBg=PJ?`<rect x="${(X(n-1)-cw/2).toFixed(1)}" y="${pt-(big?38:24)}" width="${(W-pr+(big?8:4)-X(n-1)+cw/2).toFixed(1)}" height="${(H-pb-pt+(big?38:24)).toFixed(1)}" rx="10" fill="#F3F6F6"/>${big?`<text x="${X(n-1)}" y="${H-pb+(big?34:24)}" text-anchor="middle" style="font:700 10px var(--f);fill:var(--muted);letter-spacing:.04em">PROYECCIÓN</text>`:''}`:'',
    bands=PJ?vis.map(s=>{const b=m.pj[s.p]; if(!b||s.v[n-1]==null) return ''; return `<line x1="${X(n-1).toFixed(1)}" x2="${X(n-1).toFixed(1)}" y1="${Y(b[1]).toFixed(1)}" y2="${Y(b[0]).toFixed(1)}" stroke="${C[s.p]}" stroke-opacity="${(s.a*(.12+.16*s.f)).toFixed(3)}" stroke-width="${big?16:9}" stroke-linecap="round"/>`;}).join(''):'';
  const lines=vis.slice().sort((a,b)=>a.f-b.f).map(s=>{const col=hx(C[s.p],'#CDD5D4',s.d*.55),P=s.v.map((v,j)=>v==null||j>lastR?null:[X(j),Y(v)]).filter(Boolean),d=mpath(P),dz=PJ&&s.v[n-1]!=null&&s.v[n-2]!=null?`M${X(n-2).toFixed(1)},${Y(s.v[n-2]).toFixed(1)}L${X(n-1).toFixed(1)},${Y(s.v[n-1]).toFixed(1)}`:'',sw=(big?2.6:2)+s.f*(big?2.6:1.6);
    return `<g opacity="${s.a.toFixed(3)}">`+(s.f>.01?`<path d="${d}L${X(n-1).toFixed(1)},${Y(0).toFixed(1)}L${X(0).toFixed(1)},${Y(0).toFixed(1)}Z" fill="${C[s.p]}" fill-opacity="${(.08*s.f).toFixed(3)}"/><path d="${d}" fill="none" stroke="${C[s.p]}" stroke-opacity="${(.15*s.f).toFixed(3)}" stroke-width="${(sw+(big?10:6)).toFixed(1)}" stroke-linecap="round"/>`:'')
     +`<path ${draw?'class="dlb" pathLength="1" ':''}d="${d}" fill="none" stroke="${col}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`+(dz?`<path d="${dz}" fill="none" stroke="${col}" stroke-width="${(sw*.85).toFixed(2)}" stroke-dasharray="${big?'6 5':'4 4'}" stroke-linecap="round"/>`:'')
     +s.v.map((v,j)=>v==null?'':PJ&&j===n-1?`<circle cx="${X(j).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${((big?3.6:2.4)+s.f*(big?2.6:1.5)).toFixed(2)}" fill="#fff" stroke="${col}" stroke-width="${big?2.2:1.6}" stroke-dasharray="2.5 2"/>`:`<circle ${draw?`class="pp" style="--d:${250+j*150}" `:''}cx="${X(j).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${((big?3.4:2.3)+s.f*(big?2.6:1.5)).toFixed(2)}" fill="#fff" stroke="${col}" stroke-width="${big?2.2:1.6}"/>`).join('')
     +(big&&s.f>.3?s.v.map((v,j)=>j<n-1&&v!=null?`<text x="${X(j).toFixed(1)}" y="${(Y(v)-15).toFixed(1)}" text-anchor="middle" opacity="${s.f.toFixed(2)}" style="font:800 12.5px var(--d);fill:${C[s.p]};paint-order:stroke;stroke:#fff;stroke-width:4px">${fv(v)}</text>`:'').join(''):'')+`</g>`;}).join('');
  const tl=(m.ta||0)>.01&&m.turn.every(x=>x!=null)?(()=>{const P=m.turn.map((v,j)=>[X(j),Y(v)]),d=mpath(P); return `<g opacity="${m.ta.toFixed(3)}"><path d="${d}" fill="none" stroke="#595959" stroke-width="${big?2.2:1.5}" stroke-dasharray="7 6" stroke-linecap="round"/>${P.map(q=>`<rect x="${(q[0]-4).toFixed(1)}" y="${(q[1]-4).toFixed(1)}" width="8" height="8" rx="2" transform="rotate(45 ${q[0].toFixed(1)} ${q[1].toFixed(1)})" fill="#fff" stroke="#595959" stroke-width="1.8"/>`).join('')}</g>`;})():'';
  const ends=vis.map(s=>({s,v:vAt(s),y:Y(vAt(s))})).concat(tl?[{s:{p:'_T',a:m.ta,d:0},v:vAt({v:m.turn}),y:Y(vAt({v:m.turn}))}]:[]).sort((a,b)=>a.y-b.y),gap=big?24:16; for(let j=1;j<ends.length;j++) if(ends[j].y-ends[j-1].y<gap) ends[j].y=ends[j-1].y+gap;
  const pills=ends.map(e=>{const s=e.s,isT=s.p==='_T',txt=(isT?'Particip.':NM[s.p])+' '+(isT?Math.round(e.v)+'%':fv(e.v)),on=s.d<.5,c=isT?'#595959':hx(C[s.p],'#CDD5D4',s.d*.85),w=txt.length*(big?7.3:5.8)+(big?18:11),h=big?21:15,off=big?14:8;
    return `<g opacity="${s.a.toFixed(3)}"><circle cx="${ex.toFixed(1)}" cy="${Y(e.v).toFixed(1)}" r="${big?5.5:3.6}" fill="${c}" stroke="#fff" stroke-width="2"/><path d="M${(ex+5).toFixed(1)},${Y(e.v).toFixed(1)}L${(ex+off).toFixed(1)},${e.y.toFixed(1)}" stroke="${c}" stroke-opacity=".5"/><g transform="translate(${(ex+off).toFixed(1)},${e.y.toFixed(1)})"><rect y="${-h/2}" width="${w.toFixed(1)}" height="${h}" rx="${h/2}" fill="${on?c:'#fff'}" stroke="${c}"/><text x="${(w/2).toFixed(1)}" y="${big?4:3.3}" text-anchor="middle" style="font:800 ${big?11.5:9.2}px var(--d);fill:${on?'#fff':c}">${txt}</text></g></g>`;}).join('');
  const wm=m.play?`<text x="${pl+18}" y="${pt+78}" style="font:800 96px var(--d);fill:var(--strong);opacity:.07;letter-spacing:-.03em">${m.ys[Math.min(n-1,Math.round(u))]}</text>`:'';
  const data=JSON.stringify({W,H,pl:pl+ip,pr:pr+ip,pt,pb,n,ys:m.ys,mode:m.mode,mx:m.mx,ser:vis.filter(s=>s.a>.5).map(s=>({p:s.p,v:s.v})),win:m.win,turn:m.turn,k:m.type||'',pj:m.pj||null}).replace(/'/g,'&#39;');
  return `<div class="tlw"><svg class="chart tl" data-t='${data}' viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del voto"><defs><clipPath id="${id}"><rect x="0" y="0" width="${(ex+(big?7:4)).toFixed(1)}" height="${H}"/></clipPath></defs>${pjBg}${wm}${grid}${rowl}${cols}<g clip-path="url(#${id})">${bands}${tl}${lines}</g>${pills}<g class="xh"></g><rect x="${pl}" y="${pt}" width="${W-pl-pr}" height="${H-pt-pb}" fill="transparent"/></svg><div class="xt"></div></div>`;}
const TCS={};
function tgo(key,host,W,H,tg,mode){const c=TCS[key]=TCS[key]||{m:null,raf:0}; cancelAnimationFrame(c.raf); Object.assign(c,{host,W,H});
  if(!c.m||c.m.ys.join()!==tg.ys.join()||mode==='draw'||RM){c.m=tg; host.innerHTML=trendSVG(W,H,tg,mode==='draw'&&!RM); return;}
  const A=c.m,t0=performance.now(),dur=700,step=now=>{const q=Math.min(1,(now-t0)/dur),e=q<.5?4*q*q*q:1-Math.pow(-2*q+2,3)/2; c.m=q<1?lerpM(A,tg,e):tg; c.host.innerHTML=trendSVG(c.W,c.H,c.m,false); if(q<1) c.raf=requestAnimationFrame(step);}; c.raf=requestAnimationFrame(step);}
document.addEventListener('pointermove',e=>{const sv=e.target.closest&&e.target.closest('svg.tl'); document.querySelectorAll('svg.tl').forEach(x=>{if(x!==sv){x.querySelector('.xh').innerHTML=''; x.nextElementSibling.classList.remove('on');}}); if(!sv) return;
  const o=JSON.parse(sv.dataset.t),r=sv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*o.W,j=Math.max(0,Math.min(o.n-1,Math.round((x-o.pl)/((o.W-o.pl-o.pr)/Math.max(1,o.n-1))))),X=o.pl+(o.n===1?.5:j/(o.n-1))*(o.W-o.pl-o.pr),mx=o.mx,Y=v=>o.H-o.pb-v/mx*(o.H-o.pt-o.pb);
  sv.querySelector('.xh').innerHTML=`<rect x="${X-(o.W-o.pl-o.pr)/Math.max(1,o.n-1)/2}" y="${o.pt-6}" width="${(o.W-o.pl-o.pr)/Math.max(1,o.n-1)}" height="${o.H-o.pt-o.pb+12}" rx="12" fill="#1C2121" fill-opacity=".045"/><line x1="${X}" x2="${X}" y1="${o.pt}" y2="${o.H-o.pb}" stroke="var(--strong)" stroke-opacity=".35" stroke-dasharray="3 3"/>${o.ser.filter(s=>s.v[j]!=null).map(s=>`<circle cx="${X}" cy="${Y(s.v[j])}" r="7" fill="#fff" fill-opacity=".6" stroke="${C[s.p]}" stroke-width="2.4"/>`).join('')}`;
  const tt=sv.nextElementSibling,fv=v=>o.mode==='abs'?fmt(v):v.toFixed(1)+'%'; const isPJ=o.pj&&j===o.n-1; tt.innerHTML=`<b>${o.ys[j]}${isPJ?' · proyección (rango probable)':o.win[j]?' · ganador: '+NM[o.win[j]]:''}</b>${o.ser.slice().sort((a,b)=>(b.v[j]??-1)-(a.v[j]??-1)).map(s=>{if(s.v[j]==null){const ld=ccLead(o.k+'_'+o.ys[j],s.p); return `<div><i style="background:${C[s.p]}"></i><span>${NM[s.p]}</span><em style="font-weight:500;font-size:10.5px">${ld?'en candidatura común con '+NM[ld]:'—'}</em><small></small></div>`;} const d=j&&s.v[j-1]!=null?s.v[j]-s.v[j-1]:null; return `<div><i style="background:${C[s.p]}"></i><span>${NM[s.p]}</span><em>${fv(s.v[j])}${isPJ&&o.pj[s.p]?` <span style="font-weight:500;opacity:.7">${Math.round(o.pj[s.p][0])}–${Math.round(o.pj[s.p][1])}</span>`:''}</em><small style="color:${d==null?'#9AA':d>=0?'#7FD6D0':'#F7A3B4'}">${d==null?'':(o.mode==='abs'?sg(d/1000,1)+'k':sg(d,1))}</small></div>`;}).join('')}${o.turn[j]!=null?`<div style="opacity:.75;margin-top:4px"><span></span><span>Participación</span><em>${pct(o.turn[j],0)}</em><small></small></div>`:''}`;
  const pr=r.width/o.W,left=X*pr; tt.style.left=(left>r.width/2?left-tt.offsetWidth-14:left+14)+'px'; tt.style.top=(o.pt*pr)+'px'; tt.classList.add('on');});

function openBig(){st.big=st.big||{type:'DIPL',mode:'pct',show:['MORENA','PRI','PAN','MC'],hl:st.party||null,upto:null,tl:true}; if(st.party&&!st.big.show.includes(st.party)) st.big.show.push(st.party); if($('big')) return; const el=document.createElement('div'); el.id='big'; el.className='big'; document.body.appendChild(el); el.addEventListener('click',e=>{if(e.target===el) closeBig();}); buildBig();}
function closeBig(){const el=$('big'); if(!el) return; stopPlay(); el.classList.add('out'); setTimeout(()=>el.remove(),260); delete TCS.big;}
const bigDims=()=>({W:Math.min(1180,innerWidth-40)-52,H:Math.max(320,Math.min(430,innerHeight-440))});
function buildBig(){const b=st.big,el=$('big');
  el.innerHTML=`<div class="bigb anim" role="dialog" aria-label="Evolución del voto"><div class="bigh"><div><h2 id="bh2"></h2><p id="bsub"></p></div>${scpBtn('bsc')}<button class="playb" id="bpl"><i>▶</i><span>Reproducir elección por elección</span></button><button class="cls" id="bx" aria-label="Cerrar">✕</button></div>
  <div class="bigt"><div class="grp seg"><span class="ind"></span>${Object.keys(TT).map(t=>`<button data-bt="${t}">${TT[t]}</button>`).join('')}</div><div class="grp seg"><span class="ind"></span>${[['pct','% de votación'],['abs','Votos']].map(x=>`<button data-bm="${x[0]}">${x[1]}</button>`).join('')}</div><div class="grp seg"><span class="ind"></span><button data-bc="0">Por partido</button><button data-bc="1">Por coalición</button></div><div class="ptg">${TP.map(p=>`<button data-bp="${p}" style="--pc:${C[p]}" title="Clic: mostrar u ocultar · doble clic: destacar"><i></i>${NM[p]}<s>destacado</s></button>`).join('')}</div></div>
  <div class="ktiles kt5" id="bigi"></div><div class="tlhost" id="bigc"></div>
  <p class="src" style="padding:12px 0 0">Pasa el cursor para ver el detalle de cada elección · doble clic en un partido para destacarlo · franja superior: partido ganador · la participación (% de la lista nominal) va aparte, en el último recuadro, porque se mide sobre otra base. Fuente: INE, Sistema de Consulta de la Estadística Electoral; votos de coalición repartidos en partes iguales.</p></div>`;
  $('bx').onclick=closeBig; $('bsc').onclick=()=>scopePop($('bsc'));
  el.querySelectorAll('[data-bt]').forEach(x=>x.onclick=()=>{if(b.type===x.dataset.bt) return; stopPlay(); b.type=x.dataset.bt; updBig('cross');});
  el.querySelectorAll('[data-bc]').forEach(x=>x.onclick=()=>{const v=x.dataset.bc==='1'; if(!!b.coal===v) return; stopPlay(); b.coal=v; updBig();});
  el.querySelectorAll('[data-bm]').forEach(x=>x.onclick=()=>{if(b.mode===x.dataset.bm) return; stopPlay(); b.mode=x.dataset.bm; updBig();});
  el.querySelectorAll('[data-bp]').forEach(x=>{let tm=null; x.onclick=()=>{clearTimeout(tm); tm=setTimeout(()=>{stopPlay(); const p=x.dataset.bp,j=b.show.indexOf(p); if(j>=0&&b.show.length>1){b.show.splice(j,1); if(b.hl===p) b.hl=null;} else if(j<0) b.show.push(p); updBig();},230);}; x.ondblclick=()=>{clearTimeout(tm); stopPlay(); const p=x.dataset.bp; b.hl=b.hl===p?null:p; if(b.hl&&!b.show.includes(p)) b.show.push(p); updBig();};});
  el.querySelectorAll('[data-btl]').forEach(x=>x.onclick=()=>{stopPlay(); b.tl=!b.tl; updBig();});
  $('bpl').onclick=()=>st.bigPlay?stopPlay(true):startPlay();
  updBig('draw'); requestAnimationFrame(()=>el.querySelectorAll('.seg').forEach(g=>g.classList.add('ready')));}
function segInd(){document.querySelectorAll('#big .seg').forEach(g=>{const on=g.querySelector('[aria-pressed="true"]'),ind=g.querySelector('.ind'); if(on&&ind){ind.style.left=on.offsetLeft+'px'; ind.style.width=on.offsetWidth+'px';}});}
function updBig(mode){const b=st.big,el=$('big'); if(!el) return; const idx=scope(),{W,H}=bigDims(),tg=tmodel(idx,b),td=tdata(idx,b.type,'pct',false,b.coal);
  $('bh2').textContent='Evolución del voto'; $('bsc').querySelector('span').textContent=scopeLabel();
  $('bsub').textContent=TT[b.type]+', '+td.ys[0]+'–'+td.ys[td.ys.length-1]+' · '+(b.mode==='pct'?'porcentaje de la votación válida':'votos')+(b.coal?' · votos de cada coalición, con el color del partido que la encabeza':' · votación propia de cada partido (votos de coalición repartidos en partes iguales)');
  el.querySelectorAll('[data-bc]').forEach(x=>x.setAttribute('aria-pressed',(x.dataset.bc==='1')===!!b.coal));
  el.querySelectorAll('[data-bt]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.bt===b.type)); el.querySelectorAll('[data-bm]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.bm===b.mode));
  el.querySelectorAll('[data-bp]').forEach(x=>{x.setAttribute('aria-pressed',b.show.includes(x.dataset.bp)); x.classList.toggle('hl',b.hl===x.dataset.bp);}); el.querySelectorAll('[data-btl]').forEach(x=>{x.setAttribute('aria-pressed',!!b.tl&&b.mode==='pct'); x.disabled=b.mode!=='pct'; x.title=b.mode!=='pct'?'Disponible sólo en porcentaje':'Porcentaje de la lista nominal que votó';}); segInd();
  const host=$('bigc'); if(mode==='cross'&&!RM){host.classList.add('swap'); setTimeout(()=>{delete TCS.big; tgo('big',host,W,H,tg,'draw'); host.classList.remove('swap');},240);} else tgo('big',host,W,H,tg,mode||'tween');
  insights(td,b);}
function spark(v,col,W=120,H=30,hl=-1){v=v.filter(x=>x!=null); if(!v.length) v=[0]; const n=v.length,mx=Math.max(...v),mn=Math.min(...v),X=j=>4+j/(Math.max(1,n-1))*(W-8),Y=x=>H-4-(mx===mn?.5:(x-mn)/(mx-mn))*(H-8); return `<svg class="spk" viewBox="0 0 ${W} ${H}"><polyline points="${v.map((x,j)=>X(j).toFixed(1)+','+Y(x).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${v.map((x,j)=>`<circle cx="${X(j).toFixed(1)}" cy="${Y(x).toFixed(1)}" r="${j===hl||j===n-1?3.2:1.8}" fill="${j===hl?'#1C2121':col}"/>`).join('')}</svg>`;}
function insights(td,b){const box=$('bigi'),n=td.ys.length,vis=td.ser.filter(s=>b.show.includes(s.p)),hp=b.hl||vis.slice().sort((x,y)=>y.v[n-1]-x.v[n-1])[0].p,sv=td.ser.find(s=>s.p===hp).v.filter(v=>v!=null),peak=Math.max(...sv),pj=sv.indexOf(peak),first=sv[0]||0,last=sv[sv.length-1]||0,srt=td.ser.slice().sort((x,y)=>y.v[n-1]-x.v[n-1]),BL=(totals(b.type+'_'+td.ys[n-1],scope()).bl||[]).slice().sort((x,y)=>y.pct-x.pct),bn=x=>x.members.length>1?NM[x.lead]+' y aliados':NM[x.lead],gap=BL.length>1?BL[0].pct-BL[1].pct:srt[0].v[n-1]-srt[1].v[n-1],chg=td.win.filter((w,j)=>j&&w&&td.win[j-1]&&w!==td.win[j-1]).length,tv=td.turn.map(t=>t==null?0:t),dT=n>1&&td.turn[n-1]!=null&&td.turn[n-2]!=null?td.turn[n-1]-td.turn[n-2]:null;
  const html=`<div><small>${NM[hp]}: variación ${td.ys[0]}–${td.ys[n-1]}</small><b style="color:${last>=first?'#1C7F79':'#C2405C'}">${sg(last-first,1)} pts</b><em>de ${first.toFixed(1)}% a ${last.toFixed(1)}%</em>${spark(sv,C[hp])}</div>
   <div><small>Mejor resultado de ${NM[hp]}</small><b>${peak.toFixed(1)}%</b><em>${td.ys[pj]}${pj===n-1?' · es el más reciente':' · hoy '+(peak-last).toFixed(1)+' pts abajo'}</em>${spark(sv,C[hp],120,30,pj)}</div>
   <div><small>Ventaja en ${td.ys[n-1]}</small><b>${gap.toFixed(1)} pts</b><em>${BL.length>1?`${esc(bn(BL[0]))} sobre ${esc(bn(BL[1]))}`:`${NM[srt[0].p]} sobre ${NM[srt[1].p]}`}</em><span class="vsb">${BL.length>1?`<i style="flex-grow:${BL[0].pct};background:${C[BL[0].lead]}"></i><i style="flex-grow:${BL[1].pct};background:${C[BL[1].lead]}"></i>`:`<i style="flex-grow:${srt[0].v[n-1]};background:${C[srt[0].p]}"></i><i style="flex-grow:${srt[1].v[n-1]};background:${C[srt[1].p]}"></i>`}</span></div>
   <div><small>Participación (lista nominal)</small><b>${td.turn[n-1]==null?'—':pct(td.turn[n-1],0)}</b><em>${dT==null?td.ys[n-1]:sg(dT,1)+' pts vs '+td.ys[n-2]}</em>${spark(tv,'#595959')}</div>
   <div><small>Ganador por elección</small><b>${chg} cambio${chg===1?'':'s'}</b><em>${chg?'hubo alternancia':'continuidad'}</em><span class="wseq">${td.win.map((w,j)=>w?`<i data-tip="${esc(`<b>${td.ys[j]}</b>ganó ${NM[w]}`)}" style="background:${C[w]}"></i>`:'<i></i>').join('')}</span></div>`;
  if(box.innerHTML&&!RM){box.classList.add('fd'); setTimeout(()=>{box.innerHTML=html; box.classList.remove('fd');},200);} else box.innerHTML=html;}
function setPlayBtn(){const x=$('bpl'); if(!x) return; x.querySelector('i').textContent=st.bigPlay?'■':'▶'; x.querySelector('span').textContent=st.bigPlay?'Detener':'Reproducir elección por elección'; x.classList.toggle('on',!!st.bigPlay);}
function startPlay(){const c=TCS.big; if(!c||!c.m) return; cancelAnimationFrame(c.raf); const n=c.m.ys.length,seg=1200,t0=performance.now()+250; st.bigPlay=1; setPlayBtn(); c.m={...c.m,upto:0,play:1}; c.host.innerHTML=trendSVG(c.W,c.H,c.m,false);
  const step=now=>{if(!st.bigPlay) return; const u=Math.max(0,(now-t0)/seg),ui=Math.floor(u),f=u-ui,e=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2,uu=Math.min(n-1,ui+e); c.m={...c.m,upto:uu}; c.host.innerHTML=trendSVG(c.W,c.H,c.m,false); if(uu<n-1) c.raf=requestAnimationFrame(step); else {st.bigPlay=null; setPlayBtn(); setTimeout(()=>{if(TCS.big===c&&!st.bigPlay){c.m={...c.m,play:0}; c.host.innerHTML=trendSVG(c.W,c.H,c.m,false);}},1100);}};
  c.raf=requestAnimationFrame(step);}
function stopPlay(fin){if(!st.bigPlay) return; st.bigPlay=null; const c=TCS.big; if(c){cancelAnimationFrame(c.raf); c.m={...c.m,play:0}; if(fin) tgo('big',c.host,c.W,c.H,{...c.m,upto:c.m.ys.length-1},'tween');} setPlayBtn();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('big')){closeBig(); e.stopImmediatePropagation();}},true);


/* resultados ampliados */

/* territorio en ventanas */
const DLM={},DFM={}; ALL.forEach(i=>{const a=S[i]; (DLM[a.dl]=DLM[a.dl]||{})[a.m]=((DLM[a.dl]||{})[a.m]||0)+(a.ln||0); (DFM[a.df]=DFM[a.df]||{})[a.m]=((DFM[a.df]||{})[a.m]||0)+(a.ln||0);});
const munsOf=(M,k)=>Object.keys(M[k]||{}).sort((a,b)=>M[k][b]-M[k][a]).map(m=>MUN[m]);
const DFCAB=CABDF;
function scopeLabel(){const f=st.f; if(st.terr) return 'Municipio de '+MUN[st.terr]; if(f.dl.length===1&&!f.df.length&&!f.mun.length) return 'Distrito local '+f.dl[0]; if(f.df.length===1&&!f.dl.length&&!f.mun.length) return 'Distrito federal '+f.df[0]; if(f.sec.length) return f.sec.length===1?'Sección '+f.sec[0]:f.sec.length+' secciones'; if(f.mun.length===1) return MUN[f.mun[0]]; if(f.dl.length||f.df.length||f.mun.length) return 'Selección combinada'; return 'Todo '+EST;}
const natUnit=ek=>{const t=(ek||'').split('_')[0]; return t==='DIPL'?'dl':t==='DIPF'||t==='PRE'||t==='SEN'?'df':'mun';};
function applyScope(t,v){const f=st.f; st.terr=null; f.mun=[]; f.dl=[]; f.df=[]; f.sec=[]; if(t==='mun') st.terr=String(v); else if(t==='dl') f.dl=[+v]; else if(t==='df') f.df=[+v]; else if(t==='sec') f.sec=[+v]; const p=$('spop'); if(p) p.remove(); render(true); setTimeout(()=>fit(scope().length?scope():ALL),40);}
function scopePop(an){let p=$('spop'); if(p){p.remove(); return;} st.sct=st.sct||natUnit(st.elec); p=document.createElement('div'); p.id='spop'; p.className='epop spop'; document.body.appendChild(p);
  const draw=()=>{const t=st.sct,q=norm(st.scq||''); let list='';
    if(t==='mun') list=Object.keys(MUN).filter(m=>!q||norm(MUN[m]).includes(q)).sort((a,b)=>MUN[a].localeCompare(MUN[b])).map(m=>`<button data-sp="mun|${m}" aria-pressed="${st.terr===m}"><b>${esc(MUN[m])}</b><small>${fmt(lnOf(ALL.filter(i=>S[i].m===+m)))} electores</small></button>`).join('');
    else if(t==='dl') list=Object.keys(DLM).map(Number).sort((a,b)=>a-b).filter(d=>!q||String(d)===q.replace(/\D/g,'')||munsOf(DLM,d).some(n=>norm(n).includes(q))).map(d=>`<button data-sp="dl|${d}" aria-pressed="${st.f.dl.length===1&&st.f.dl[0]===d}"><b>Distrito local ${d}</b><small>${esc(munsOf(DLM,d).join(', '))}</small></button>`).join('');
    else if(t==='df') list=Object.keys(DFM).map(Number).sort((a,b)=>a-b).map(d=>`<button data-sp="df|${d}" aria-pressed="${st.f.df.length===1&&st.f.df[0]===d}"><b>Distrito federal ${d} · ${DFCAB[d]||''}</b><small>${esc(munsOf(DFM,d).join(', '))}</small></button>`).join('');
    else list=`<input class="ms2" id="spsec" inputmode="numeric" placeholder="Número de sección y Enter"><small class="hint">También puedes elegir varias en Explorar › Sección.</small>`;
    p.innerHTML=`<div class="sph"><small>Territorio a consultar</small><button class="rst" data-sp="all|0">Todo ${esc(EST)}</button></div><div class="spt">${[['mun','Municipio'],['dl','Distrito local'],['df','Distrito federal'],['sec','Sección']].map(x=>`<button data-st="${x[0]}" aria-pressed="${t===x[0]}">${x[1]}</button>`).join('')}</div>${t==='mun'||t==='dl'?`<input class="ms2" id="spq" placeholder="Buscar…" value="${esc(st.scq||'')}">`:''}<div class="spl">${list||'<small class="hint">Sin coincidencias</small>'}</div>`;
    p.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{st.sct=b.dataset.st; st.scq=''; draw();});
    p.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{const [a,v]=b.dataset.sp.split('|'); applyScope(a,v);});
    const sq=$('spq'); if(sq){sq.oninput=()=>{st.scq=sq.value; const pos=sq.selectionStart; draw(); const n2=$('spq'); n2.focus(); n2.setSelectionRange(pos,pos);};}
    const ss=$('spsec'); if(ss){ss.focus(); ss.onkeydown=e=>{if(e.key==='Enter'){const v=+ss.value.trim(); if(ALL.some(i=>S[i].s===v)) applyScope('sec',v); else ss.classList.add('err');}};}};
  draw(); const r=an.getBoundingClientRect(); p.style.left=Math.max(8,Math.min(r.left,innerWidth-p.offsetWidth-8))+'px'; p.style.top=(r.bottom+8)+'px';
  setTimeout(()=>document.addEventListener('pointerdown',function h(ev){if(!ev.target.closest('#spop,.scp')){const q=$('spop'); if(q) q.remove(); document.removeEventListener('pointerdown',h);} else if(!$('spop')) document.removeEventListener('pointerdown',h);}),0);}
const scpBtn=id=>`<button class="scp" id="${id}"><svg viewBox="0 0 12 12"><path d="M6 11s-4-3.5-4-6.5a4 4 0 0 1 8 0C10 7.5 6 11 6 11z"/><circle cx="6" cy="4.6" r="1.4"/></svg><span></span><svg class="cv2" viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg></button>`;
function openRes(){st.rag=st.rag||'bloc'; st.rms=st.rms||'mg'; if($('res')) return; const el=document.createElement('div'); el.id='res'; el.className='big'; document.body.appendChild(el); el.addEventListener('click',e=>{if(e.target===el) closeRes();});
  el.innerHTML=`<div class="bigb anim rb" role="dialog" aria-label="Resultados por partido"><div class="bigh"><div><h2 id="rh2"></h2><p id="rsub"></p></div>${scpBtn('rsc')}<button class="cx e epa" id="rel"><svg viewBox="0 0 12 12"><rect x="1.5" y="2" width="9" height="8.5" rx="1.5"/><path d="M1.5 5h9M4 1v2M8 1v2"/></svg><span></span><svg class="cv2" viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg></button><button class="cls" id="rx" aria-label="Cerrar">✕</button></div>
  <div class="ktiles" id="rkp"></div>
  <div class="rgrid2"><div class="rmain"><div class="rtb"><div class="grp seg"><span class="ind"></span><button data-ra="bloc">Por coalición</button><button data-ra="party">Por partido</button></div><div class="lgd" id="rlg"></div></div><div id="rch"></div></div><div class="rside" id="rside"></div></div>
  <div id="rmun"></div>
  <p class="src" style="padding:14px 0 0">Cada color dentro de una columna es el aporte de un partido a su coalición. Raya punteada: la misma elección en el periodo anterior. "Por partido" reparte los votos de coalición en partes iguales. Fuente: INE, Sistema de Consulta de la Estadística Electoral.</p></div>`;
  $('rx').onclick=closeRes; $('rel').onclick=()=>ePop($('rel')); $('rsc').onclick=()=>scopePop($('rsc'));
  el.querySelectorAll('[data-ra]').forEach(x=>x.onclick=()=>{if(st.rag===x.dataset.ra) return; st.rag=x.dataset.ra; updRes();});
  updRes(); requestAnimationFrame(()=>el.querySelectorAll('.seg').forEach(g=>g.classList.add('ready')));}
function segSync(root){root.querySelectorAll('.seg').forEach(g=>{const on=g.querySelector('[aria-pressed="true"]'),ind=g.querySelector('.ind'); if(on&&ind){ind.style.left=on.offsetLeft+'px'; ind.style.width=on.offsetWidth+'px';}});}
function bigCols(W,rows){const n=rows.length,H=320,pl=36,pt=34,pb=74,gw=(W-pl)/n,bw=Math.min(66,gw*.52),mx=Math.max(...rows.map(r=>Math.max(r.pct,r.pp||0)))*1.08,Y=v=>H-pb-v/mx*(H-pt-pb),base=H-pb,id='bc'+(++RCID),stp=mx>60?20:mx>30?10:5;
  let g=''; for(let v=0;v<=mx;v+=stp) g+=`<line x1="${pl}" x2="${W}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="${v?'#EEF2F2':'var(--line)'}"/><text x="${pl-8}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end">${v}%</text>`;
  return `<svg class="chart bcol" viewBox="0 0 ${W} ${H}" role="img" aria-label="Resultados por fuerza política">${g}${rows.map((r,j)=>{const x=pl+j*gw+gw/2,ps=r.parts.filter(q=>q.v>0),tot=ps.reduce((a,q)=>a+q.v,0)||1,yt=Y(r.pct),hh=base-yt,d=r.pp==null?null:r.pct-r.pp; let yy=base;
    const segs=ps.map(q=>{const h=hh*q.v/tot; yy-=h; return `<rect x="${(x-bw/2).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" fill="${C[q.p]}" stroke="#fff" stroke-width="1.5"/>`;}).join('');
    const tip=`<b>${esc(r.nm)}</b>${r.pct.toFixed(1)}% · ${fmt(r.v)} votos${ps.length>1?'<br>'+ps.map(q=>NM[q.p]+' '+(r.pct*q.v/(r.v||1)).toFixed(1)+'%').join(' · '):''}${r.pp!=null?`<br>Periodo anterior: ${r.pp.toFixed(1)}% (${sg(d,1)} pts)`:''}`,dt=d==null?(gw<110?'—':'sin comparativo'):sg(d,1)+' pts',dw=dt.length*6+14;
    return `<g class="hv" data-g="${j}" data-tip="${esc(tip)}">${j===0?`<rect x="${(pl+j*gw+4).toFixed(1)}" y="${pt-28}" width="${(gw-8).toFixed(1)}" height="${H-pt+24}" rx="14" fill="${mix(r.c,.07,[255,255,255])}"/>`:''}
      <clipPath id="${id}_${j}"><rect x="${(x-bw/2).toFixed(1)}" y="${yt.toFixed(1)}" width="${bw.toFixed(1)}" height="${(hh+10).toFixed(1)}" rx="10"/></clipPath><g class="gyb" style="--d:${j*80}" clip-path="url(#${id}_${j})">${segs}</g>
      ${r.pp!=null?`<line x1="${(x-bw/2-8).toFixed(1)}" x2="${(x+bw/2+8).toFixed(1)}" y1="${Y(r.pp).toFixed(1)}" y2="${Y(r.pp).toFixed(1)}" stroke="#1C2121" stroke-width="1.8" stroke-dasharray="3 2" class="fadein"/>`:''}
      <text x="${x}" y="${(yt-10).toFixed(1)}" text-anchor="middle" style="font:800 ${j?15:18}px var(--d);fill:var(--strong)">${r.pct.toFixed(1)}%</text>
      <text x="${x}" y="${base+19}" text-anchor="middle" style="font:800 12px var(--d);fill:${j?'var(--strong)':r.c}">${esc(r.sh2&&r.short.length*7.6>gw?r.sh2:fitT(r.short,Math.floor(gw/7.6)))}</text><text x="${x}" y="${base+34}" text-anchor="middle" style="font:500 10px var(--f)">${fmt(r.v)} votos</text>
      <rect x="${(x-dw/2).toFixed(1)}" y="${base+43}" width="${dw}" height="18" rx="9" fill="${d==null?'#F0F3F3':d>=0?'#E4F5F3':'#FDE8EC'}"/><text x="${x}" y="${base+55.5}" text-anchor="middle" style="font:700 10px var(--f);fill:${d==null?'#8A9393':d>=0?'#1C7F79':'#C2405C'}">${dt}</text></g>`;}).join('')}</svg>`;}
function closeRes(){const el=$('res'); if(!el) return; el.classList.add('out'); setTimeout(()=>el.remove(),260);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('res')&&!$('epop')){closeRes(); e.stopImmediatePropagation();}},true);
function countTo(el,to,f){const from=+(el.dataset.v||0),t0=performance.now(); el.dataset.v=to; if(RM){el.textContent=f(to); return;} const st2=now=>{const q=Math.min(1,(now-t0)/850),e=1-Math.pow(1-q,3); el.textContent=f(from+(to-from)*e); if(q<1) requestAnimationFrame(st2);}; requestAnimationFrame(st2);}
function updRes(){const el=$('res'); if(!el) return; if(!st.elec){closeRes(); return;} const idx=scope(),ek=st.elec,pk=prevOf(ek),T=totals(ek,idx),PT=pk?totals(pk,idx):null,TE=totals(ek,ALL),yP=pk?D.E[pk].year:null,sub=idx.length<ALL.length;
  $('rh2').textContent='Resultados por partido'; $('rsub').textContent=fmt(idx.length)+' secciones · '+fmt(T.t)+' votos emitidos';
  $('rel').querySelector('span').textContent=eLabel(ek); $('rsc').querySelector('span').textContent=scopeLabel();
  el.querySelectorAll('[data-ra]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.ra===st.rag)); segSync(el);
  const rows=st.rag==='bloc'?T.bl.map(b=>{const pb=PT&&PT.bl.find(z=>z.lead===b.lead); return {parts:b.parts,nm:b.name,short:NM[b.lead]+(b.members.filter(m=>m!=='OTROS').length>1?' y aliados':''),sh2:NM[b.lead]+(b.members.filter(m=>m!=='OTROS').length>1?'+':''),c:b.c,pct:b.pct,v:b.votes,pp:pb?pb.pct:null};})
    :D.P8.filter(q=>q!=='OTROS').map(q=>({parts:[{p:q,v:T.tot[q]||0}],nm:NM[q],short:NM[q],c:C[q],v:T.tot[q]||0,pct:T.val?100*(T.tot[q]||0)/T.val:0,pp:PT&&PT.val&&PT.tot[q]?100*PT.tot[q]/PT.val:null})).filter(r=>r.v>0).sort((a,b)=>b.v-a.v);
  const rowsC=rows.filter((r,j)=>j<2||r.pct>=.5).slice(0,8);
  const r0=rows[0],r1=rows[1],mg=r1?r0.pct-r1.pct:0,lvl=mg<5?['alta','#C2405C','#FDE8EC']:mg<15?['media','#B5652F','#FDEEE5']:['baja','#1C7F79','#E4F5F3'],nul=T.t?100*(T.t-T.val)/T.t:null,nulE=TE.t?100*(TE.t-TE.val)/TE.t:null;
  $('rkp').innerHTML=`<div style="--ac:${r0.c}"><small>Primer lugar</small><b style="color:${r0.c}">${esc(r0.nm)}</b><em>${r0.pct.toFixed(1)}% de la votación válida · ${fmt(r0.v)} votos</em></div>
   ${r1?`<div style="--ac:${lvl[1]}"><small>Ventaja sobre el 2º lugar</small><b class="num">${mg.toFixed(1)} puntos</b><em>${fmt(r0.v-r1.v)} votos más que ${esc(r1.nm)} <span class="chip" style="background:${lvl[2]};color:${lvl[1]}">competencia ${lvl[0]}</span></em></div>`:''}
   <div style="--ac:var(--teal)"><small>Participación</small><b class="num">${pct(T.turn,1)}</b><em>de la lista nominal${PT&&PT.turn!=null?` · ${sg(T.turn-PT.turn,1)} pts vs ${yP}`:''}${sub?` · estado ${pct(TE.turn,1)}`:''}</em></div>
   <div style="--ac:#8A9393"><small>Votos nulos y no registrados</small><b class="num">${pct(nul,1)}</b><em>${fmt(T.t-T.val)} votos del total emitido${sub&&nulE!=null?` · estado ${pct(nulE,1)}`:''}</em></div>`;
  $('rlg').innerHTML=`<span><i class="tk"></i>${pk?yP+' (periodo anterior)':'sin periodo anterior comparable'}</span>`;
  $('rch').innerHTML=bigCols(Math.max(420,$('rch').clientWidth||640),rowsC);
  const secW={},cc={a:0,m:0,b:0}; idx.forEach(i=>{const x=winner(ek,[i]); if(x){secW[x.lead]=(secW[x.lead]||0)+1; cc[x.m<5?'a':x.m<15?'m':'b']++;}}); const sw=Object.entries(secW).sort((a,b)=>b[1]-a[1]),n=cc.a+cc.m+cc.b||1,sinR=idx.length-(cc.a+cc.m+cc.b),P=v=>Math.round(100*v/n);
  const hbl=rs=>`<div class="hbl">${rs.map(r=>`<div data-tip="${esc(`<b>${r[0]}</b>${fmt(r[2])} secciones · ${P(r[2])}% del total`)}"><span>${r[0]}${r[1]?`<small>${r[1]}</small>`:''}</span><u><i style="width:${P(r[2])}%;background:${r[3]}"></i></u><b class="num">${fmt(r[2])}</b><em>${P(r[2])}%</em></div>`).join('')}</div>`,top=[['alta',cc.a],['media',cc.m],['baja',cc.b]].sort((a,b)=>b[1]-a[1])[0][0];
  $('rside').innerHTML=`<div class="bx"><h4>Competencia en las secciones</h4><p class="rs">Margen entre 1º y 2º lugar en las <b>${fmt(n)}</b> secciones con resultado${sinR?` (${sinR} sin resultado en esta elección${ek.startsWith('AYU_')&&idx.some(i=>UYC.has(S[i].m))?', sobre todo municipios de usos y costumbres':''})`:''}. Predomina la competencia <b>${top}</b>.</p>${hbl([['Alta','menos de 5 pts',cc.a,'var(--coral)'],['Media','de 5 a 15 pts',cc.m,'var(--peach)'],['Baja','más de 15 pts',cc.b,'var(--teal)']])}</div>
   <div class="bx"><h4>Secciones ganadas por fuerza</h4>${hbl(sw.slice(0,6).map(([q,c])=>[NM[q]+((T.bl.find(b=>b.lead===q)||{members:[]}).members.filter(m=>m!=='OTROS').length>1?' y aliados':''),'',c,C[q]]).concat(sw.length>6?[['Otras '+(sw.length-6)+' fuerzas','',sw.slice(6).reduce((a,x)=>a+x[1],0),'#A0A7A6']]:[]))}</div>`;
  const un=st.rbu||natUnit(ek),UL={mun:['municipio','municipios'],dl:['distrito local','distritos locales'],df:['distrito federal','distritos federales'],sec:['sección','secciones']},key=i=>un==='mun'?S[i].m:un==='dl'?S[i].dl:un==='df'?S[i].df:S[i].s,grp={};
  idx.forEach(i=>{const kk=key(i); (grp[kk]=grp[kk]||[]).push(i);});
  const gs=Object.entries(grp).map(([kk,ii])=>{const t=totals(ek,ii),ms=[...new Set(ii.map(i=>S[i].m))].map(m=>MUN[m]); return {sc:un+'|'+kk,k:un==='mun'?MUN[kk]:un==='dl'?'Distrito local '+kk:un==='df'?'Distrito federal '+kk:'Sección '+kk,sub:un==='mun'?'':un==='sec'?ms[0]:ms.join(', '),ii,bl:t.bl,ln:lnOf(ii)};}).filter(g=>g.bl.length&&g.bl[0].votes>0).map(g=>({...g,w:g.bl[0],mg:g.bl[0].pct-(g.bl[1]?g.bl[1].pct:0),mv:Math.round(g.bl[0].votes-(g.bl[1]?g.bl[1].votes:0)),gp:st.party?gapOf(ek,g.ii,st.party):null}));
  st._gs=gs; st._ul=UL[un];
  $('rmun').innerHTML=`<div class="rmun"><div class="rmh"><h4>Desglose por</h4><div class="grp seg ready" id="rbu"><span class="ind"></span>${Object.keys(UL).map(u=>`<button data-bu="${u}" aria-pressed="${u===un}">${UL[u][0][0].toUpperCase()+UL[u][0].slice(1)}${u===natUnit(ek)?' ·':''}</button>`).join('')}</div><span class="hint">· = unidad natural de esta elección</span></div>${gs.length>1?`<div class="rmh rmh2"><div class="grp seg ready" id="rms"><span class="ind"></span><button data-ms="mg">Más competidos</button><button data-ms="ln">Mayor peso electoral</button><button data-ms="az">A–Z</button></div><input id="rmq" class="ms2" placeholder="Buscar en ${gs.length} ${UL[un][1]}…" value="${esc(st.rmq||'')}"></div><div class="mhd"><span>${UL[un][0]}</span><span>Reparto del voto</span><span>Ganador</span><span>Ventaja</span><span>Electores</span></div><div class="mlist" id="mlist"></div><div class="mft" id="mft"></div>`:`<p class="hint" style="padding:8px 2px">La selección actual es un solo ${UL[un][0]}. Elige otra unidad de desglose o amplía el territorio.</p>`}</div>`;
  $('rmun').querySelectorAll('[data-bu]').forEach(x=>x.onclick=()=>{st.rbu=x.dataset.bu; st.rmall=false; st.rmq=''; updRes();}); segSync($('rmun'));
  if(gs.length>1){$('rmun').querySelectorAll('[data-ms]').forEach(x=>x.onclick=()=>{st.rms=x.dataset.ms; mList();}); $('rmq').oninput=e=>{st.rmq=e.target.value; mList();}; mList();}}
function mList(){const gs=st._gs||[],q=norm(st.rmq||''),srt={mg:(a,b)=>a.mg-b.mg,ln:(a,b)=>b.ln-a.ln,az:(a,b)=>a.k.localeCompare(b.k,'es',{numeric:true})}[st.rms||'mg'],L=gs.filter(g=>!q||norm(g.k+' '+g.sub).includes(q)).sort(srt),lim=st.rmall||q?L.length:10,show=L.slice(0,lim),mxL=Math.max(...gs.map(g=>g.ln));
  $('rmun').querySelectorAll('[data-ms]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.ms===(st.rms||'mg'))); segSync($('rmun'));
  $('mlist').classList.toggle('all',!!st.rmall&&L.length>10);
  $('mlist').innerHTML=show.map((g,j)=>{const lv=g.mg<5?'a':g.mg<15?'m':'b',rest=Math.max(0,100-g.bl.slice(0,4).reduce((x,y)=>x+y.pct,0)); return `<div class="mr" data-sc="${g.sc}"><span class="mn"><em>${j+1}</em><span>${esc(g.k)}${g.sub?`<small>${esc(g.sub)}</small>`:''}</span></span><span class="mb">${g.bl.slice(0,4).map(x=>`<b data-tip="${esc(`<b>${esc(g.k)}</b>${x.name}: ${x.pct.toFixed(1)}%`)}" style="flex-grow:${x.pct};background:${x.c}"></b>`).join('')}<b style="flex-grow:${rest};background:#E4ECEB"></b></span><span class="mw"><i style="background:${g.w.c}"></i><span>${esc(NM[g.w.lead])}${g.w.members.filter(m=>m!=='OTROS').length>1?'+':''}${g.gp?`<small class="${g.gp.lead?'up':'dn'}">${NM[st.party]}: ${g.gp.lead?'+'+fmt(g.gp.gap):'faltan '+fmt(g.gp.gap+1)}</small>`:''}</span></span><span class="mg ${lv}">${g.mg.toFixed(1)} pts<small>${fmt(g.mv)} votos</small></span><span class="ml2"><u style="width:${(100*g.ln/mxL).toFixed(1)}%"></u>${k(g.ln)}</span></div>`;}).join('')||'<div class="more" style="padding:10px">Sin coincidencias</div>';
  $('mft').innerHTML=!q&&L.length>10?`<button class="sm" id="mall">${st.rmall?'Mostrar sólo los primeros 10':'Ver los '+L.length+' '+st._ul[1]}</button>`:'';
  if($('mall')) $('mall').onclick=()=>{st.rmall=!st.rmall; mList();};
  $('mlist').querySelectorAll('[data-sc]').forEach(x=>x.onclick=()=>{const [a,v]=x.dataset.sc.split('|'); applyScope(a,v);});}

const ctip=document.createElement('div'); ctip.className='ctip'; document.body.appendChild(ctip);
const dimScope=t=>t.closest('.cd,.bigb,.rside')||t.parentElement;
document.addEventListener('pointerover',e=>{const t=e.target.closest&&e.target.closest('[data-tip]'); if(!t) return; ctip.innerHTML=t.dataset.tip; ctip.classList.add('on'); const g=t.dataset.g; if(g!=null){const sc=dimScope(t),grp=t.parentElement.closest('[data-g]')?null:t.parentElement; sc.querySelectorAll('[data-g]').forEach(x=>{if(x.parentElement===t.parentElement||x.closest('.wl,.waf,.cgl,.hemi')) x.classList.toggle('dim',x.dataset.g!==g);});}});
document.addEventListener('pointermove',e=>{if(ctip.classList.contains('on')){const w=ctip.offsetWidth,h=ctip.offsetHeight; ctip.style.left=Math.min(innerWidth-w-8,e.clientX+14)+'px'; ctip.style.top=Math.min(innerHeight-h-8,e.clientY+16)+'px';}});
document.addEventListener('pointerout',e=>{const t=e.target.closest&&e.target.closest('[data-tip]'); if(!t||(e.relatedTarget&&t.contains(e.relatedTarget))) return; ctip.classList.remove('on'); dimScope(t).querySelectorAll('.dim').forEach(x=>x.classList.remove('dim'));});

function hemi(W,cg,N){const H=Math.round(W*.5)+26,cx=W/2,cy=H-6,R=Math.min(W/2-26,H-40),th=Math.max(22,R*.24),r=R-th/2,maj=Math.floor(N/2)+1,cal=Math.ceil(N*2/3),ld=cg[0],P=(a,rr)=>[cx+rr*Math.cos(a),cy-rr*Math.sin(a)],tip=x=>esc(`<b>${(NM[x.p]+(x.co?"+":""))}</b>${x.t} escaños: ${x.mr} de mayoría relativa · ${x.rp} plurinominales`),st2=ld.t>=cal?'mayoría calificada':ld.t>=maj?'mayoría absoluta':'sin mayoría',lt=mix('#1C2121',.0,[255,255,255]);
  let a=Math.PI,k=0,arcs=''; const arc=(a0,a1,col,j,x,dly)=>{const [x0,y0]=P(a0,r),[x1,y1]=P(a1,r); return `<path class="dlb" pathLength="1" style="animation-delay:${dly}ms" data-g="${j}" data-tip="${tip(x)}" d="M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${th.toFixed(1)}"/>`;};
  cg.forEach((x,j)=>{[[x.mr,C[x.p]],[x.rp,mix(C[x.p],.45,[255,255,255])]].forEach(([n,col])=>{if(!n) return; const a1=a-Math.PI*n/N; arcs+=arc(a-(k?.006:0),a1,col,j,x,200+k*110); a=a1; k++;});});
  let ticks=''; for(let q=1;q<N;q++){const an=Math.PI*(1-q/N),[x0,y0]=P(an,R-th),[x1,y1]=P(an,R); ticks+=`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#fff" stroke-width="1.4"/>`;}
  const mk2=(seats,lab,dash)=>{const an=Math.PI*(1-seats/N),[a0x,a0y]=P(an,R-th-5),[a1x,a1y]=P(an,R+6),[lx,ly]=P(an,R+15); return `<line x1="${a0x.toFixed(1)}" y1="${a0y.toFixed(1)}" x2="${a1x.toFixed(1)}" y2="${a1y.toFixed(1)}" stroke="#1C2121" stroke-width="1.5" ${dash?'stroke-dasharray="2.5 2"':''}/><text x="${lx.toFixed(1)}" y="${(ly+3).toFixed(1)}" text-anchor="${an>Math.PI/2+.05?'end':an<Math.PI/2-.05?'start':'middle'}" style="font:700 9.5px var(--f);fill:var(--strong)">${lab}</text>`;};
  const svg=`<svg class="chart hemi" viewBox="0 0 ${W} ${H}" role="img" aria-label="Integración del Congreso"><path d="M${(cx-R).toFixed(1)},${cy}A${R},${R} 0 0 1 ${(cx+R).toFixed(1)},${cy}" fill="none" stroke="#F1F5F5" stroke-width="1"/>${arcs}<g class="fadein">${ticks}</g>${mk2(N/2,'mitad · '+maj+' para mayoría',0)}${mk2(cal,'calificada · '+cal,1)}
    <text x="${cx}" y="${cy-34}" text-anchor="middle" style="font:800 36px var(--d);fill:${C[ld.p]};letter-spacing:-.02em">${ld.t}<tspan style="font:600 13px var(--f);fill:var(--muted)"> de ${N}</tspan></text><text x="${cx}" y="${cy-14}" text-anchor="middle" style="font:700 11.5px var(--f);fill:var(--strong)">${(NM[ld.p]+(ld.co?" y aliados":""))}</text><text x="${cx}" y="${cy}" text-anchor="middle" style="font:600 10px var(--f);fill:${ld.t>=maj?'#1C7F79':'#C2405C'}">${st2}</text></svg>`;
  const tMR=cg.reduce((a,x)=>a+x.mr,0),tRP=cg.reduce((a,x)=>a+x.rp,0); return svg+`<div class="cgk"><div><b class="num">${tMR}</b><span>mayoría relativa (MR)<small>un escaño por cada distrito local, para quien lo gana</small></span></div><div><b class="num">${tRP}</b><span>representación proporcional (RP)<small>plurinominales, por listas según el % de votos</small></span></div></div><div class="cgs"><div class="h"><span>Partido</span><span>Escaños</span><span>MR · RP</span><span>Total</span></div>${cg.map((x,j)=>`<div data-g="${j}" data-tip="${tip(x)}" style="--c:${C[x.p]};--cl:${mix(C[x.p],.45,[255,255,255])}"><span class="pn"><i></i>${(NM[x.p]+(x.co?"+":""))}</span><span class="sq">${'<i class="m"></i>'.repeat(x.mr)}${'<i class="r"></i>'.repeat(x.rp)}</span><span class="mrp"><b>${x.mr}</b> MR · <b>${x.rp}</b> RP</span><b class="num">${x.t}</b></div>`).join('')}</div><div class="lgd" style="margin-top:8px"><span><i style="background:#595959"></i>mayoría relativa (ganó el distrito)</span><span><i style="background:#C8CCCC"></i>plurinominal</span></div>`;}
function agebars(W,a,ref){const L=['18–24','25–29','30–39','40–49','50–59','60–64','65+'],H=140,pt=18,pb=20,gw=W/7,bw=Math.min(16,gw*.32),Y=v=>H-pb-(v||0)/100*(H-pt-pb);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Participación por edad"><line x1="0" x2="${W}" y1="${H-pb}" y2="${H-pb}" stroke="var(--line)"/>${L.map((l,j)=>{const x=j*gw+gw/2; return `<g class="hv" data-g="${j}" data-tip="${esc(`<b>${l} años</b>Votó ${a[j]==null?'—':Math.round(a[j])+'%'} · estado ${ref[j]==null?'—':Math.round(ref[j])+'%'}`)}"><rect x="${x-bw-1}" y="${Y(ref[j])}" width="${bw}" height="${H-pb-Y(ref[j])}" rx="3" fill="var(--hair)" stroke="var(--line)"/><rect class="gyb" style="--d:${j*60}" x="${x+1}" y="${Y(a[j])}" width="${bw}" height="${H-pb-Y(a[j])}" rx="3" fill="var(--teal)"/><text x="${x+1+bw/2}" y="${Y(a[j])-5}" text-anchor="middle" style="font:700 10px var(--d);fill:var(--strong)">${a[j]==null?'':Math.round(a[j])}</text><text x="${x}" y="${H-6}" text-anchor="middle">${l}</text></g>`;}).join('')}</svg>`;}
/* ===== registro de personas que ganaron (meta.gan): trayectoria por nombre ===== */
const actN=a=>a?a.split(/[_-]/).filter(Boolean).map(x=>NM[x]||x).join('-'):'';
const parChip=p=>{if(!p) return '<em>—</em>'; const one=!/[_-]/.test(p); return `<em><i style="background:${one&&C[p]||'#B9C1C1'}"></i>${esc(one?(NM[p]||p):actN(p))}</em>`;};
/* quién ha gobernado el municipio (presidencias municipales con nombre) */
function pmHTML(mid){const L=GAN&&GAN.pm&&GAN.pm[String(mid)]; if(!L||!L.length) return ''; const R=L.slice().sort((a,b)=>b[0]-a[0]);
  return `<h5>Quién ha gobernado ${M0.cab==='cdmx'?'la alcaldía':'el municipio'}</h5><div class="pml">${R.map(r=>`<button data-per="${r[1]}"><b>${r[0]}</b><span>${esc(GAN.p[r[1]])}</span>${parChip(r[2])}</button>`).join('')}</div>`;}
let REFLN=0;
/* referencias no electorales: revocación 2022 y consulta 2021 (por municipio; el INE las reporta por sección sede),
   afiliados por partido (solo totales por estado: los padrones no traen municipio) */
function refHTML(MS,all){const R=M0.ref||{},lnEst=REFLN||(REFLN=ALL.reduce((a,i)=>a+(S[i].ln||0),0)); let h='';
  const cons=(k,nm,fav)=>{const c=R[k]; if(!c) return ''; let v=[0,0,0],sin=0; if(all) v=c.est; else MS.forEach(m=>{const x=c.m[String(m)]; if(x){v[0]+=x[0];v[1]+=x[1];v[2]+=x[2];} else sin++;});
    if(!v[1]) return `<div class="rf"><span>${nm}</span><b>—</b><em>sin casilla propia en este territorio</em></div>`;
    return `<div class="rf" data-tip="<b>${nm}</b>Votaron ${fmt(v[0])} de ${fmt(v[1])} en lista nominal.${sin?`<br>${sin} municipio(s) sin casilla propia: sus electores votaron en la casilla de otro municipio.`:''}"><span>${nm}</span><b>${pct(100*v[0]/v[1],1)}</b><em>${pct(100*v[2]/(v[0]||1),0)} votó ${fav}</em></div>`;};
  const c1=cons('rm22','Revocación 2022','que siga'),c2=cons('cp21','Consulta 2021','sí');
  const J=R.pj25; let c3=''; if(J){let v=[0,0]; if(all) v=J.est; else MS.forEach(m=>{const x=J.m[String(m)]; if(x){v[0]+=x[0]; v[1]+=x[1];}});
    if(v[1]) c3=`<div class="rf" data-tip="<b>Elección judicial 2025</b>Votaron ${fmt(v[0])} de ${fmt(v[1])} en lista nominal. Sin partidos en la boleta: mide la capacidad de movilización. Por sección en el mapa: Colorear por → Elección judicial 2025."><span>Judicial 2025</span><b>${pct(100*v[0]/v[1],1)}</b><em>sin partidos</em></div>`;}
  if(c1||c2||c3) h+=`<h5>Participación sin partidos en la boleta</h5><div class="rfg rfg3">${c3}${c1}${c2}</div>`;
  const A=R.af; if(A&&A.p){const ps=Object.entries(A.p).sort((a,b)=>b[1]-a[1]),mx=ps[0][1];
    h+=`<h5>Afiliados por partido <small>todo el estado · % de la lista nominal</small></h5><div class="afl">${ps.map(([p,n])=>`<div data-tip="<b>${esc(NM[p]||p)}</b>${fmt(n)} afiliados: ${(100*n/(lnEst||1)).toFixed(1)} por cada 100 electores del estado.<br>Padrón de afiliados del INE; puede incluir registros duplicados o desactualizados."><span><i style="background:${C[p]||'#8A9393'}"></i>${esc(NM[p]||p)}</span><s><u style="width:${(100*n/mx).toFixed(1)}%;background:${C[p]||'#8A9393'}"></u></s><b>${fmt(n)}</b><em>${(100*n/(lnEst||1)).toFixed(1)}%</em></div>`).join('')}</div>`;}
  return h;}
const CAT=[['gen','Datos generales','secciones, padrón, distritos',`<rect x="2" y="3" width="10" height="6" rx="1.5" fill="#4CC1BA"/><rect x="14" y="3" width="10" height="6" rx="1.5" fill="#B9C1C1"/><rect x="2" y="11" width="22" height="3" rx="1.5" fill="#B9C1C1"/>`],['res','Resultados electorales','1º, 2º, 3º lugar y variación',`<rect x="3" y="6" width="5" height="12" rx="1" fill="#A9455E"/><rect x="10" y="9" width="5" height="9" rx="1" fill="#E9813F"/><rect x="17" y="11" width="5" height="7" rx="1" fill="#2F8F64"/>`],['bub','Peso de cada fuerza','proporcional a los votos',`<circle cx="8" cy="10" r="6" fill="#A9455E"/><circle cx="16" cy="11" r="5" fill="#E9813F" fill-opacity=".85"/>`],['tend','Evolución del voto','por partido, '+YEARS[0]+'–'+YEARS[YEARS.length-1],`<polyline points="2,16 8,10 14,12 22,4" fill="none" stroke="#A9455E" stroke-width="2"/><polyline points="2,8 8,12 14,14 22,17" fill="none" stroke="#B9C1C1" stroke-width="2"/>`],['sum','Perfil del electorado','participación e índices',`<circle cx="11" cy="10" r="7" fill="none" stroke="#4CC1BA" stroke-width="3" stroke-dasharray="30 44"/>`],['edad','Participación por edad','por grupo de edad, '+AGEY,`<rect x="2" y="10" width="3" height="8" fill="#4CC1BA"/><rect x="7" y="8" width="3" height="10" fill="#4CC1BA"/><rect x="12" y="5" width="3" height="13" fill="#4CC1BA"/><rect x="17" y="3" width="3" height="15" fill="#4CC1BA"/>`],['gob','Gobiernos municipales','partido en cada ayuntamiento',`<rect x="2" y="2" width="10" height="16" rx="1.5" fill="#E9813F" fill-opacity=".4"/><rect x="13" y="2" width="9" height="8" rx="1.5" fill="#A9455E" fill-opacity=".4"/><rect x="13" y="11" width="9" height="7" rx="1.5" fill="#2F8F64" fill-opacity=".4"/>`],['cng','Congreso del estado','mayoría y plurinominales',`<path d="M3 18a10 10 0 0 1 20 0" fill="none" stroke="#A9455E" stroke-width="3.4" stroke-dasharray="2.2 1.6"/><path d="M8 18a5 5 0 0 1 10 0" fill="none" stroke="#E9813F" stroke-width="3.4" stroke-dasharray="2.2 1.6"/>`],['trt','Rasgos distintivos','índices vs. promedio estatal',`<rect x="2" y="4" width="16" height="3" rx="1.5" fill="#4CC1BA"/><rect x="2" y="10" width="10" height="3" rx="1.5" fill="#F46883"/><rect x="2" y="16" width="13" height="3" rx="1.5" fill="#4CC1BA"/>`],['w100','Composición del electorado','duro, volátil, abstención',Array.from({length:12},(_,j)=>`<circle cx="${3+(j%6)*4}" cy="${5+Math.floor(j/6)*6}" r="1.6" fill="${j<3?'#A9455E':j<8?'#4CC1BA':'#DDE3E3'}"/>`).join('')]];
function render(fresh){TARJ.forEach(c=>{if(!CAT.find(x=>x[0]===c.id)) CAT.push([c.id,c.titulo,c.resumen,c.icono||''])}); const idx=scope(),ek=st.elec,pk=prevOf(ek),T=ek?totals(ek,idx):null,PT=pk?totals(pk,idx):null,d=demo(idx),at=ageTurn(idx),vol=wavg(V2.vol,idx),y=ek?D.E[ek].year:YEARS[YEARS.length-1],p=st.party;
  const tName=st.terr?MUN[st.terr]:EST; $('ttl').textContent=tName; $('crumb').innerHTML=st.terr?`<button id="toE">${esc(EST)}</button> › ${esc(MUN[st.terr])}`:EST; if($('toE')) $('toE').onclick=()=>setTerr(null);
  $('pin').hidden=true; $('fcount').textContent=idx.length+' de '+ALL.filter(munScope).length;
  $('pdot').style.background=p?C[p]:'var(--teal)';
  const W=Math.max(280,($('col').clientWidth||360)-36);
  if(!idx.length){$('col').innerHTML='<div class="cd"><p class="lead">Ninguna sección cumple los filtros. Quita alguno en el panel de la izquierda.</p></div>'; renderFP(); paint(); return;}
  const w=T?T.bl:null,m=w&&w[1]?w[0].pct-w[1].pct:0,ix=(v,r)=>r?Math.round(100*v/r):100;
  const yAY=YEARS.filter(x=>x<=y&&D.E['AYU_'+x]).pop()||YEARS.find(x=>D.E['AYU_'+x]),yDL=YEARS.filter(x=>x<=y&&D.E['DIPL_'+x]).pop()||YEARS.find(x=>D.E['DIPL_'+x]),cg=congress(yDL),cgT=cg.reduce((a,r)=>a+r.t,0);
  const bal=balance(idx,p),bi=[...(p?[{n:'Duro '+NM[p],v:bal.own,c:C[p],d:'vota por '+NM[p]+' en todas las elecciones comparables'},{n:'Duro de otros partidos',v:bal.riv,c:'#7B8787',d:'vota siempre por otro partido'}]:MAIN.filter(q=>bal.d[q]>=1.5).sort((a,b)=>bal.d[b]-bal.d[a]).map(q=>({n:'Duro '+NM[q],v:bal.d[q],c:C[q]}))),{n:'Volátil',v:bal.vol,c:'#4CC1BA',d:'vota, pero cambia de partido entre elecciones'},{n:'Abstención ocasional',v:bal.mov,c:'#F5A47C',d:'ha votado al menos una vez desde 2018, pero no siempre: es votante recuperable'},{n:'Abstención permanente',v:bal.est,c:'#DDE3E3',d:'no ha votado en ninguna elección desde 2018'}];
  const tot=bi.reduce((a,b)=>a+b.v,0); let cells=[],acc=0; bi.forEach(b=>{const n=Math.round((acc+b.v)/tot*100)-Math.round(acc/tot*100); for(let j=0;j<n;j++) cells.push([b.c,bi.indexOf(b)]); acc+=b.v;});
  const traits=[['Jóvenes 18–29',d.jv,DST.d.jv],['Adultos 65+',d.ma,DST.d.ma],['Mujeres',d.mj,DST.d.mj],['Participación '+AGEY,at.all,DST.t.all],['Voto volátil',vol,DST.vol],['Participación jóvenes 18–24',at.young,DST.t.young]].map(r=>({n:r[0],v:r[1],r:r[2],i:ix(r[1],r[2])})).sort((a,b)=>Math.abs(b.i-100)-Math.abs(a.i-100));
  const lead=!w?'':`<b>${esc(w[0].name)}</b> ganó ${esc(eLabel(ek).toLowerCase())}${nf()||st.terr?' en esta selección':''} por <b>${m.toFixed(1)} pts</b> sobre ${esc(w[1].name)}${PT&&PT.turn!=null?`; votó ${pct(T.turn,0)}, ${Math.abs(T.turn-PT.turn).toFixed(1)} pts ${T.turn>=PT.turn?'más':'menos'} que en ${D.E[pk].year}`:''}.`;
  const DF=[...new Set(idx.map(i=>S[i].df))],DLs=[...new Set(idx.map(i=>S[i].dl))],MS=[...new Set(idx.map(i=>S[i].m))],tc={2:0,3:0,4:0}; idx.forEach(i=>{const t=tipoN(S[i].t); tc[t]=(tc[t]||0)+1;});
  const at7=ageT(idx),at7E=ageT(ALL),yg=at7[0],old7=at7[5];
  const ICO=Object.fromEntries(CAT.map(c=>[c[0],c[3]])),hd=(id,t,sub,ex='')=>`<div class="cdh"><span class="ci"><svg viewBox="0 0 26 20">${ICO[id]||'<rect x="3" y="4" width="20" height="2.4" rx="1.2" fill="#1C7F79"/><rect x="3" y="9" width="15" height="2.4" rx="1.2" fill="#4CC1BA"/><rect x="3" y="14" width="18" height="2.4" rx="1.2" fill="#B9C1C1"/>'}</svg></span><div class="ct"><b>${t}</b><em>${sub}</em></div><div class="ca">${ex}<button class="x" data-rm="${id}" title="Quitar tarjeta" aria-label="Quitar tarjeta">✕</button></div></div>`,ft=t=>`<div class="cf">Fuente: ${t}</div>`,acc2=p?C[p]:'var(--teal)';
  const scopeN=esc(st.terr?MUN[st.terr]:EST)+(nf()?' · selección filtrada':''),yP=pk?D.E[pk].year:null;
  const tmS=[...new Set(['MORENA','PRI','PAN','MC'].concat(p&&TP.includes(p)?[p]:[]))],tm=st.cards.includes('tend')?tmodel(idx,{type:'DIPL',mode:'pct',show:tmS,hl:p||null}):null;
  let tHero=''; if(tm){const n=tm.ys.length-(tm.pj?1:0),hp=p&&TP.includes(p)?p:tm.ser.filter(s=>s.a).sort((a,b)=>b.v[n-1]-a.v[n-1])[0].p,sv=tm.ser.find(s=>s.p===hp).v,ld=sv[n-1]==null?ccLead(tm.type+'_'+tm.ys[n-1],hp):null,dv=n>1&&sv[n-1]!=null&&sv[n-2]!=null?sv[n-1]-sv[n-2]:null; tHero=sv[n-1]==null?`<div class="hero"><i style="background:${C[hp]}"></i><span>${NM[hp]} fue en candidatura común con ${NM[ld]||'su coalición'} en ${tm.ys[n-1]}: su voto está sumado al de ${NM[ld]||'la coalición'}.</span></div>`:`<div class="hero"><i style="background:${C[hp]}"></i><b class="num" style="color:${C[hp]}">${sv[n-1].toFixed(1)}%</b><span>${NM[hp]} en ${tm.ys[n-1]}</span>${dv!=null?`<u class="${dv>=0?'up':'dn'}">${sg(dv,1)} pts vs ${tm.ys[n-2]}</u>`:''}</div>`;}
  const flab=(g,v)=>g==='sec'?'sección '+v:g==='mun'?MUN[v]:g==='dl'?'distrito local '+v:g==='df'?'distrito federal '+v:g==='win'?'ganador '+NM[v]:FL[g]?(g==='cmp'&&v==='chg'?'cambió de ganador':FL[g][v]):v,fl=[]; for(const g in st.f){if(g==='sec'&&st.f.sec.length>3){fl.push(st.f.sec.length+' secciones'); continue;} st.f[g].forEach(v=>fl.push(flab(g,v)));}
  let lecH=''; if(st.lec!==false&&ek){const comp=m<5?'alta':m<15?'media':'baja',TE=totals(ek,ALL),secW={}; let close=0; idx.forEach(i=>{const x=winner(ek,[i]); if(x){secW[x.lead]=(secW[x.lead]||0)+1; if(x.m<5) close++;}});
    const pw=PT?PT.bl.find(z=>z.lead===w[0].lead&&z.members.join()===w[0].members.join()):null,pw2=PT?PT.bl.find(z=>z.lead===w[0].lead):null,pwin=PT?PT.bl[0]:null,alt=pwin&&pwin.lead!==w[0].lead,whole=!st.terr&&!fl.length,where=(st.terr?'el municipio de '+esc(MUN[st.terr]):esc(EST))+(fl.length?`, en <b>${idx.length}</b> secciones (${esc(fl.join(' · ').toLowerCase())})`:''),L=[];
    L.push(`En ${where}, <b>${esc(w[0].name)}</b> ganó ${esc(eLabel(ek).toLowerCase())} con <b>${w[0].pct.toFixed(1)}%</b> y una ventaja de <b>${m.toFixed(1)} pts</b> sobre ${esc(w[1].name)}.`);
    if(PT) L.push(alt?`Hubo alternancia: en ${yP} había ganado ${esc(pwin.name)}.`:pw?`Frente a ${yP}, ${esc(w[0].name)} ${w[0].pct>=pw.pct?'creció':'cayó'} <b>${sg(w[0].pct-pw.pct,1)} pts</b>.`:pw2?`Frente a ${yP}, cuando compitió con otra integración de coalición, ${esc(NM[w[0].lead])} y aliados ${w[0].pct>=pw2.pct?'creció':'cayó'} <b>${sg(w[0].pct-pw2.pct,1)} pts</b>.`:`En ${yP} ${esc(NM[w[0].lead])} no encabezó ninguna coalición comparable.`);
    const nR=idx.filter(i=>row(ek,i)).length,uy=ek.startsWith('AYU_')?new Set(idx.filter(i=>UYC.has(S[i].m)).map(i=>S[i].m)).size:0;
    L.push(`Encabezó <b>${secW[w[0].lead]||0} de ${nR}</b> secciones con resultados; <b>${close}</b> se definieron por menos de 5 pts${close?' y concentran la disputa':''}.`);
    if(uy) L.push(`<b>${uy}</b> municipio${uy>1?'s':''} de esta consulta elige${uy>1?'n':''} a sus autoridades por sistemas normativos indígenas (usos y costumbres): no hay votación por partido y se muestra${uy>1?'n':''} en tono arena.`);
    if(T.turn!=null) L.push(whole?(PT&&PT.turn!=null?`Votó <b>${pct(T.turn,1)}</b> de la lista nominal, ${Math.abs(T.turn-PT.turn).toFixed(1)} pts ${T.turn>=PT.turn?'más':'menos'} que en ${yP}.`:`Votó <b>${pct(T.turn,1)}</b> de la lista nominal.`):`Votó <b>${pct(T.turn,1)}</b> de la lista nominal, ${T.turn>=TE.turn?'por encima':'por debajo'} del promedio estatal (${pct(TE.turn,1)}).`);
    if(p){const sh=T.val?100*(T.tot[p]||0)/T.val:0,rk=MAIN.slice().sort((a,b)=>(T.tot[b]||0)-(T.tot[a]||0)).indexOf(p)+1,ps=PT&&PT.val&&PT.tot[p]!=null?100*PT.tot[p]/PT.val:null,du=wavg(V2.duro[p],idx),pen=T.ln?100*(T.tot[p]||0)/T.ln:null;
      let best=''; if(!st.terr&&MS.length>1){const ms=MS.map(x=>{const t2=totals(ek,idx.filter(i=>S[i].m===x)); return [x,t2.val?100*(t2.tot[p]||0)/t2.val:0,t2.val,t2.tot[p]||0];}).filter(x=>x[2]>0),thr=ms.map(x=>x[2]).sort((a,b)=>b-a)[Math.floor(ms.length/2)]||0,bm=ms.filter(x=>x[2]>=thr).sort((a,b)=>b[1]-a[1])[0],bv=ms.slice().sort((a,b)=>b[3]-a[3])[0]; if(bm) best=ms.length>3?` Entre los municipios más grandes, su mejor resultado es <b>${esc(MUN[bm[0]])}</b> (${bm[1].toFixed(1)}%)${bv&&bv[0]!==bm[0]?`; donde más votos suma es <b>${esc(MUN[bv[0]])}</b> (${fmt(bv[3])})`:''}.`:` Su mejor municipio es <b>${esc(MUN[bm[0]])}</b> (${bm[1].toFixed(1)}%).`;}
      L.push(`<span class="pz" style="--c:${C[p]}">${NM[p]}</span> obtuvo <b>${sh.toFixed(1)}%</b> de la votación válida (${rk}º lugar)${ps!=null?`, ${sg(sh-ps,1)} pts frente a ${yP}`:''}; por cada 100 electores consiguió <b>${pen==null?'—':pen.toFixed(1)}</b> votos y su voto duro estimado es <b>${du==null?'—':du.toFixed(1)}%</b> de la lista nominal.${best}`);}
    if(p){const gq=gapOf(ek,idx,p); if(gq) L.push(gq.lead?`${NM[p]} y aliados encabezan con <b>${fmt(gq.gap)} votos</b> de ventaja sobre ${esc(gq.ref?gq.ref.name:'el segundo lugar')}.`:`Para empatar a ${esc(gq.ref.name)}, a ${NM[p]} y aliados les faltan <b>${fmt(gq.gap)} votos</b>; en la zona hay <b>${fmt(gq.rec)}</b> votantes ocasionales (votaron alguna vez desde 2018, pero no suelen votar en este tipo de elección)${gq.rec>=gq.gap?', más que la brecha':''}.`);}
    const tr=traits[0]; if(tr&&Math.abs(tr.i-100)>=10) L.push(`Rasgo distintivo: ${esc(tr.n.toLowerCase())} ${tr.i>100?'por encima':'por debajo'} del promedio estatal (índice ${tr.i}).`);
    const tags=[`<span class="${comp==='alta'?'a':''}">Competencia ${comp}</span>`,PT?`<span>${alt?'Alternancia':'Continuidad'}</span>`:'',T.turn!=null&&!whole?`<span>Participación ${T.turn>=TE.turn?'mayor':'menor'} al estado</span>`:''].join('');
    lecH=`<div class="cd lecc" hidden>${hd('lec','Lectura de la consulta',esc(eLabel(ek))+' · se actualiza con cada filtro')}<div class="ltags">${tags}</div><ul class="lec">${L.map(x=>`<li>${x}</li>`).join('')}</ul>${ft('INE, SEE '+y+(pk?' y '+yP:'')+'; Conteos Censales '+AGEY+'; voto duro: estimación propia')}</div>`;}
  if(st.lec!==false&&!ek){const wins=YEARS.filter(yy=>D.E['DIPL_'+yy]).map(yy=>{const x=winner('DIPL_'+yy,idx); return x?[yy,x.lead]:null;}).filter(Boolean),tl=YEARS.filter(yy=>D.E['DIPL_'+yy]).map(yy=>[yy,totals('DIPL_'+yy,idx).turn]).filter(x=>x[1]!=null),whole=!st.terr&&!fl.length,L=[],where=(st.terr?'El municipio de '+esc(MUN[st.terr]):esc(EST))+(fl.length?` (selección: ${esc(fl.join(' · ').toLowerCase())})`:''),chg=wins.filter((x,j)=>j&&x[1]!==wins[j-1][1]).length;
    L.push(`${where} tiene <b>${fmt(d.ln)}</b> personas en la lista nominal, en <b>${fmt(nSec(idx))}</b> secciones${MS.length>1?` de ${MS.length} municipios`:''}.`);
    if(wins.length) L.push(`En diputaciones locales ganó ${wins.map(x=>`<b>${NM[x[1]]}</b> (${x[0]})`).join(' → ')}: ${chg?chg+' cambio'+(chg>1?'s':'')+' de partido ganador':'el mismo partido en todas'}.`);
    if(tl.length) L.push(`Participación en esas elecciones: ${tl.map(x=>`${Math.round(x[1])}% en ${x[0]}`).join(', ')}.`);
    if(vol!=null) L.push(`Voto volátil: <b>${pct(vol,0)}</b> de la lista nominal${whole?'':` (índice ${ix(vol,DST.vol)} frente al estado)`}.`);
    if(p){const du=wavg(V2.duro[p],idx),tp=tdata(idx,'DIPL','pct'),sr=(tp.ser.find(z=>z.p===p)||{v:[]}).v,jj=sr.map((v,j)=>v==null?-1:j).filter(j=>j>=0),sv=jj.map(j=>sr[j]); L.push(`<span class="pz" style="--c:${C[p]}">${NM[p]}</span> tiene un voto duro estimado de <b>${du==null?'—':du.toFixed(1)}%</b> de la lista nominal${sv.length>1?`; en diputaciones locales pasó de ${sv[0].toFixed(1)}% (${tp.ys[jj[0]]}) a ${sv[sv.length-1].toFixed(1)}% (${tp.ys[jj[jj.length-1]]})`:''}${jj.length<sr.length?` (en ${tp.ys.filter((y,j)=>sr[j]==null).join(', ')} fue en candidatura común y su voto está sumado al de su coalición)`:''}.`);}
    const tr=traits[0]; if(tr&&Math.abs(tr.i-100)>=10) L.push(`Rasgo distintivo: ${esc(tr.n.toLowerCase())} ${tr.i>100?'por encima':'por debajo'} del promedio estatal (índice ${tr.i}).`);
    lecH=`<div class="cd lecc" hidden>${hd('lec','Lectura del territorio','sin elección seleccionada · panorama histórico')}<ul class="lec">${L.map(x=>`<li>${x}</li>`).join('')}</ul><p class="lnote">Para leer los resultados de una elección, elígela en Explorar.</p>${ft('INE, SEE '+YEARS[0]+'–'+YEARS[YEARS.length-1]+'; DERFE, '+CORTE+'; voto duro y volátil: estimación propia')}</div>`;}
  const noE=()=>`<div class="cd">${hd('res','Resultados electorales','sin elección seleccionada')}<p class="lead" style="margin:0 0 10px;font-size:12.5px">Estás viendo el panorama del territorio. Para ver resultados, elige una elección:</p><div class="qe">${[BASE,lastOf('DIPL'),lastOf('AYU'),lastOf('PRE'),lastOf('GOB')].filter((x,j,a)=>x&&a.indexOf(x)===j).filter(k2=>D.E[k2]).map(k2=>`<button data-qe="${k2}">${esc(eLabel(k2))}</button>`).join('')}</div></div>`;
  const ay={},ayL={}; let ayT=0; Object.keys(MUN).forEach(mm=>{const ii2=ALL.filter(i=>S[i].m===+mm),ww=winner('AYU_'+yAY,ii2),l2=lnOf(ii2); if(ww){ay[ww.lead]=(ay[ww.lead]||0)+1; ayL[ww.lead]=(ayL[ww.lead]||0)+l2; ayT+=l2;}}); const ayE=Object.entries(ay).sort((a,b)=>b[1]-a[1]),nMun=Object.keys(MUN).length;
  const K={
   gen:`<div class="cd">${hd('gen','Datos generales',scopeN)}<div class="gg"><div><b class="num">${fmt(nSec(idx))}</b><span>secciones</span></div><div><b class="num">${d.ln>=1e6?k(d.ln):fmt(d.ln)}</b><span>lista nominal</span></div><div><b class="num">${d.pe>=1e6?k(d.pe):fmt(d.pe)}</b><span>padrón</span></div><div><b class="num">${MS.length}</b><span>municipios</span></div><div><b class="num">${DLs.length}</b><span>distritos locales</span></div><div><b class="num">${DF.length}</b><span>distritos federales</span></div></div><h5>Tipo de sección</h5><div class="stk"><b data-g="0" data-tip="<b>Urbanas</b>${tc[2]} secciones" style="flex-grow:${tc[2]};background:var(--teal3)"></b><b data-g="1" data-tip="<b>Mixtas</b>${tc[3]} secciones" style="flex-grow:${tc[3]};background:var(--teal)"></b><b data-g="2" data-tip="<b>Rurales</b>${tc[4]} secciones" style="flex-grow:${tc[4]};background:#BFE6E2"></b></div><div class="stl"><span><i style="background:var(--teal3)"></i>Urbanas <b>${tc[2]}</b></span><span><i style="background:var(--teal)"></i>Mixtas <b>${tc[3]}</b></span><span><i style="background:#BFE6E2"></i>Rurales <b>${tc[4]}</b></span></div><h5>Lista nominal por sexo y edad</h5><div class="stk"><b data-tip="<b>Mujeres</b>${fmt(d.m)} en lista nominal" style="flex-grow:${d.m};background:var(--coral)"></b><b data-tip="<b>Hombres</b>${fmt(d.h)} en lista nominal" style="flex-grow:${d.h};background:var(--teal)"></b></div><div class="stl"><span><i style="background:var(--coral)"></i>Mujeres <b>${pct(d.mj,1)}</b></span><span><i style="background:var(--teal)"></i>Hombres <b>${pct(100-d.mj,1)}</b></span><span>18–29 años <b>${pct(d.jv,0)}</b></span><span>65 y más <b>${pct(d.ma,0)}</b></span></div>${MS.length===1?pmHTML(MS[0]):''}${refHTML(MS,idx.length===ALL.length)}<div class="cab">${DF.length<=3?DF.sort((a,b)=>a-b).map(x=>`DF <b>${x}</b> · cabecera ${esc(CABDF[x]||'')}`).join('<br>'):`<b>${DF.length}</b> distritos federales; cabeceras de ${DF.sort((a,b)=>a-b).slice(0,3).map(x=>esc(CABDF[x]||'')).join(', ')} y ${DF.length-3} más`}<br>Credencial vigente: <b>${pct(100*d.ln/(d.pe||1),1)}</b> del padrón está en lista nominal</div>${ft(SRC.pad+'; '+SRC.carto+(M0.ref&&M0.ref.rm22?'; INE, elección judicial 2025 (SCJN, por casilla), revocación de mandato 2022 y consulta popular 2021 (por sección sede); padrones de afiliados del INE 2026':''))}</div>`,
   res:!ek?noE():`<div class="cd">${hd('res','Resultados electorales',esc(eLabel(ek))+' · '+scopeN,'<button class="exp" data-res="1"><svg viewBox="0 0 12 12"><path d="M7 1.5h3.5V5M5 10.5H1.5V7M10.5 1.5L7 5M1.5 10.5L5 7"/></svg>Ampliar</button>')}<div class="hero"><i style="background:${w[0].c}"></i><b class="num" style="color:${w[0].c}">${w[0].pct.toFixed(1)}%</b><span>${esc(w[0].name)}</span><u class="mg" title="Diferencia en puntos porcentuales entre el 1º y el 2º lugar">${m.toFixed(1)} pts de ventaja sobre ${esc(NM[w[1].lead])}${w[1].members.filter(q=>q!=='OTROS').length>1?'+':''}</u></div>${cols(W,w,PT&&PT.bl)}<div class="lgd"><span><i style="background:repeating-linear-gradient(0deg,#A9455E 0 4px,#E9813F 4px 8px)"></i>colores: aporte de cada partido</span>${pk?`<span><i class="tk"></i>raya: ${yP}</span>`:''}</div><div class="note">Votos nulos y no registrados: <b>${pct(T.t?100*(T.t-T.val)/T.t:null,1)}</b> del total emitido</div><p class="lead" style="margin:8px 0 0;font-size:12px">${lead}</p>${ft('INE, SEE '+y+(pk?' y '+yP:'')+'; votos de coalición repartidos en partes iguales')}</div>`,
   bub:!ek?'':`<div class="cd">${hd('bub','Peso de cada fuerza',esc(eLabel(ek)))}${bubbles(W,w,PT&&PT.bl)}${ft('INE, SEE '+y)}</div>`,
   tend:`<div class="cd">${hd('tend','Evolución del voto','Dip. locales '+(tm?tm.ys[0]+'–'+tm.ys[tm.ys.length-1]:''),'<button class="exp" data-big="1"><svg viewBox="0 0 12 12"><path d="M7 1.5h3.5V5M5 10.5H1.5V7M10.5 1.5L7 5M1.5 10.5L5 7"/></svg>Ampliar</button>')}${tHero}<div class="tlhost" id="tcard"></div>${ft('INE, SEE '+(tm?tm.ys[0]+'–'+tm.ys[tm.ys.length-1]:'')+'; votación propia de cada partido')}</div>`,
   edad:`<div class="cd">${hd('edad','Participación por edad',AGEY+' · en gris, el promedio estatal')}${agebars(W,at7,at7E)}<p class="lead" style="margin:4px 0 0;font-size:12px">${yg!=null&&old7!=null?`De 18 a 24 años votó <b>${pct(yg,0)}</b>; de 60 a 64, <b>${pct(old7,0)}</b>.`:''}</p>${ft('INE, DECEyEC, Conteos Censales de Participación 2024')}</div>`,
   sum:`<div class="cd">${hd('sum','Perfil del electorado',fmt(idx.length)+' secciones')}<div class="sum"><div style="position:relative">${ring(at.all||0,'#2FA59D')}<div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center"><b class="num" style="font-size:22px;color:var(--teal3);line-height:1">${pct(at.all,0)}</b><span style="font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:3px">particip. ${AGEY}</span></div></div><div class="kv"><div><b class="num">${k(d.ln)}</b><span>electores${d.ln<DST.d.ln?' · '+pct(100*d.ln/DST.d.ln,0)+' del estado':''}</span></div><div><b class="num">${pct(d.mj,0)}</b><span>mujeres</span></div><div class="ix"><b class="num">${ix(d.jv,DST.d.jv)}${ix(d.jv,DST.d.jv)!==100?`<sup class="${d.jv<DST.d.jv?'n':''}">${sg(ix(d.jv,DST.d.jv)-100)}</sup>`:''}</b><span>índice de jóvenes</span></div><div class="ix"><b class="num">${ix(vol,DST.vol)}${ix(vol,DST.vol)!==100?`<sup class="${vol<DST.vol?'n':''}">${sg(ix(vol,DST.vol)-100)}</sup>`:''}</b><span>índice de volatilidad</span></div></div></div><div class="note">Índice 100 = promedio estatal</div>${ft('INE, Conteos Censales '+AGEY+'; DERFE, '+CORTE+'; índices: estimación propia')}</div>`,
   gob:`<div class="cd">${hd('gob','Gobiernos municipales','ayuntamientos electos en '+yAY+' · todo el estado')}<div class="gb2"><small>Municipios que gobierna cada partido</small><span>${ayE.map(([q,c])=>`<b data-tip="${esc(`<b>${NM[q]}</b>${c} de ${nMun-UYC.size} municipios con elección por partidos`)}" style="flex-grow:${c};background:${C[q]}"></b>`).join('')}</span><small>Electores que gobierna cada partido</small><span>${ayE.map(([q])=>`<b data-tip="${esc(`<b>${NM[q]}</b>gobierna a ${pct(100*ayL[q]/ayT,0)} de los electores`)}" style="flex-grow:${ayL[q]};background:${C[q]}"></b>`).join('')}</span></div><div class="cgl gtab"><div class="h"><span>Partido</span><span>Municipios</span><span>Electores</span></div>${ayE.map(([q,c],j)=>`<div data-g="${j}"><span><i style="background:${C[q]}"></i>${NM[q]}</span><b class="num">${c}</b><span class="num">${pct(100*ayL[q]/ayT,0)}</span></div>`).join('')}</div>${UYC.size?`<p class="lnote">Además, ${UYC.size} municipios eligen a sus autoridades por usos y costumbres, sin partidos.</p>`:''}${ft('INE, SEE '+yAY+' · ayuntamientos; si ganó una coalición, se cuenta para el partido que la encabeza')}</div>`,
   cng:`<div class="cd">${hd('cng','Congreso del estado','legislatura electa en '+yDL+' · '+cgT+' escaños · todo el estado')}${hemi(W,cg,cgT)}${ft('INE, SEE '+yDL+'; mayoría relativa por distrito local (si ganó una coalición, se asigna a quien la encabeza, marcado con +); plurinominales estimadas con umbral de '+Math.round(100*(CFG.umbral||.03))+'% y tope de sobrerrepresentación de 8 pts')}</div>`,
   trt:`<div class="cd">${hd('trt','Rasgos distintivos','comparados con el promedio estatal')}${traits.slice(0,5).map((r,j)=>`<div class="trt hv" data-g="${j}" data-tip="${esc(`<b>${r.n}</b>Aquí ${pct(r.v,1)} · estado ${pct(r.r,1)}<br>Índice ${r.i} (100 = igual al estado)`)}"><span>${esc(r.n)} · ${pct(r.v,0)}</span><em style="color:${r.i>=100?'var(--teal3)':'var(--coral)'}">${r.i}</em><span class="bar"><b style="width:${Math.min(100,r.v)}%;background:${r.i>=100?'var(--teal)':'var(--coral)'}"></b><u style="left:${Math.min(100,r.r)}%"></u></span></div>`).join('')}<div class="note">Raya: promedio estatal · índice 100 = igual al estado</div>${ft('DERFE, '+CORTE+'; Conteos Censales '+AGEY+'; estimación propia')}</div>`,
   w100:`<div class="cd">${hd('w100','Composición del electorado',p?'desde la perspectiva de '+NM[p]:'de cada 100 electores')}<div class="waf">${cells.map((c,j)=>`<i data-g="${c[1]}" data-tip="${esc(`<b>${bi[c[1]].n}</b>${Math.round(bi[c[1]].v/tot*100)} de cada 100 electores${bi[c[1]].d?'<br>'+bi[c[1]].d:''}`)}" style="--d:${j};background:${c[0]}"></i>`).join('')}</div><div class="wl">${bi.filter(b=>b.v>.5).map(b=>`<span data-g="${bi.indexOf(b)}" data-tip="${esc(`<b>${b.n}</b>${Math.round(b.v/tot*100)} de cada 100 electores${b.d?'<br>'+b.d:''}`)}"><i style="background:${b.c}"></i>${esc(b.n)}<b>${Math.round(b.v/tot*100)}</b></span>`).join('')}</div>${ft('estimación propia con INE, SEE 2018–'+YEARS[YEARS.length-1]+' y Conteos Censales')}</div>`
  };
  TARJ.forEach(c=>{try{K[c.id]=c.html({idx,ek,pk,T,PT,d,at,y,p,hd,ft,scopeN});}catch(e){console.error('tarjeta '+c.id,e); K[c.id]='';}});
  const cards=[`<div class="colh"><b>Panel</b>${st.lec===false?'<button class="sm" id="lecb" style="margin:0 8px 0 auto">Mostrar lectura</button>':''}<button class="addb ghost" id="pdfb" title="Descarga un PDF con la lectura, el mapa y las tarjetas de esta vista"><svg viewBox="0 0 10 10"><path d="M5 1v5.5M2.6 4.2 5 6.6l2.4-2.4M1.5 8.8h7"/></svg>Informe PDF</button><button class="addb" id="addb" aria-expanded="${st.cat}"><svg viewBox="0 0 10 10"><path d="M5 1v8M1 5h8"/></svg>Gráficas</button></div>`+(st.cat?`<div class="cat" id="cat">${CAT.map(c=>`<button data-cat="${c[0]}" aria-pressed="${st.cards.includes(c[0])}"><svg viewBox="0 0 26 20">${c[3]}</svg><span><b>${c[1]}</b><small>${c[2]}</small></span></button>`).join('')}</div>`:'')].concat(lecH?[lecH]:[],st.cards.map(c=>K[c]).filter(Boolean),[`<p class="src">Fuente: ${esc(SRC.res)}, ${YEARS[0]}–${YEARS[YEARS.length-1]}; ${esc(SRC.pad)}; ${esc(SRC.cc)}; ${esc(SRC.carto)}; ${esc(SRC.marg||'')}. Voto duro, volátil y abstención: estimación propia. Congreso: plurinominales estimadas con ${CFG.mr||'—'} de mayoría y ${CFG.rp||'—'} de representación proporcional (${esc(SRC.cfg||'')}).</p>`]);
  const C2=$('col'),sc=C2.scrollTop; C2.style.setProperty('--acc',acc2); if(st.view!=='est'){C2.innerHTML=cards.join(''); C2.dataset.v='';} if(tm&&$('tcard')) tgo('card',$('tcard'),W,230,tm,TCS.card?'tween':'draw'); C2.scrollTop=sc; if(fresh){C2.classList.remove('anim'); void C2.offsetWidth; C2.classList.add('anim');}
  C2.querySelectorAll('[data-terr]').forEach(g=>g.onclick=()=>setTerr(g.dataset.terr));
  C2.querySelectorAll('[data-big]').forEach(b=>b.onclick=openBig);
  C2.querySelectorAll('[data-per]').forEach(b=>b.onclick=()=>actOpen(+b.dataset.per));
  if($('pdfb')) $('pdfb').onclick=()=>slDownload($('pdfb')); if(typeof pjBind==='function') pjBind(C2); if($('addb')) $('addb').onclick=()=>{st.cat=!st.cat; render();};
  C2.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{const c=b.dataset.cat,j=st.cards.indexOf(c); j>=0?st.cards.splice(j,1):st.cards.splice(1,0,c); render(true); if(j<0) C2.scrollTo({top:0,behavior:'smooth'});});
  C2.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{if(b.dataset.rm==='lec') st.lec=false; else st.cards=st.cards.filter(c=>c!==b.dataset.rm); render();});
  if($('lecb')) $('lecb').onclick=()=>{st.lec=true; render(true);};
  C2.querySelectorAll('[data-res]').forEach(b=>b.onclick=openRes); C2.querySelectorAll('[data-qe]').forEach(b=>b.onclick=()=>setElec(b.dataset.qe));
  ctxBar();
  if(fresh) C2.querySelectorAll('.gg b,.kv b').forEach(el=>{const t=el.firstChild; if(!t||t.nodeType!==3) return; const m=t.nodeValue.match(/^([\d,]+(?:\.\d+)?)(.*)$/); if(!m) return; const to=parseFloat(m[1].replace(/,/g,'')),dec=(m[1].split('.')[1]||'').length,suf=m[2],t0=performance.now(); const f=x=>x.toLocaleString('es-MX',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf; const step=now=>{const q2=Math.min(1,(now-t0)/900),e=1-Math.pow(1-q2,3); t.nodeValue=f(to*e); if(q2<1) requestAnimationFrame(step);}; requestAnimationFrame(step);});
  if(st.view==='est') estRender();
  renderFP(); paint(); if(st.view==='tbl') renderTbl(idx); if($('res')) updRes(); if($('big')) updBig();}
/* primero el mapa (respuesta inmediata) y en el siguiente cuadro el panel */
let RSP=0; function renderSoon(fresh){paint(); cancelAnimationFrame(RSP); RSP=requestAnimationFrame(()=>setTimeout(()=>render(fresh),0));}
function setTerr(m){st.terr=m; st.sel=null; if(st.view==='est'&&st.es){st.es.u=m==null?null:+m; st.es.lv=m==null?null:'mun'; st.es.seg=null;} if(st.view==='est') render(true); else renderSoon(true); setTimeout(()=>fit(ALL.filter(munScope)),30);}


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
  L.forEach(a=>a.R.forEach(r=>rows.push([a.nm,r[1],actLost(r)?'Compitió, quedó '+(r[9]||'—')+'.º':'Ganó',GAN.c[r[2]],r[3],NM[r[4]]||r[4],actN(r[5]),r[6]?r[6][0]:'',r[6]?r[6][1]:'',a.W.length,a.ps.length>1?(a.bando?'Cambió de bando: ':'Misma alianza: ')+a.ps.map(psL).join(' → '):'',ACTRE[a.j]?'Sí':''])));
  const b=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),l=document.createElement('a');
  l.href=u; l.download=`actores_${M0.cab}_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000);}
function actBody(pid){const a=ACT&&ACT.find(x=>x.j===pid); if(!a) return '<p class="ac-e">Elige una persona de la lista.</p>'; const ys=a.R.map(r=>r[1]).filter(Boolean);
  return `<div class="ac-h"><small>Trayectoria</small><b>${esc(a.nm)}</b><span>${a.W.length?'Ganó '+(a.W.length===1?'1 cargo':a.W.length+' cargos'):'Sin cargos ganados en el registro'}${a.R.length>a.W.length?` · compitió ${a.R.length-a.W.length===1?'1 vez':(a.R.length-a.W.length)+' veces'} sin ganar`:''}${ys.length?` · ${Math.min(...ys)}${Math.max(...ys)!==Math.min(...ys)?'–'+Math.max(...ys):''}`:''}</span></div>
   ${ACTRE[a.j]?`<div class="pcb re" title="Regla general vigente hasta 2030 (alcaldías: una reelección; diputaciones locales: hasta cuatro periodos seguidos). Confirma la ley del estado.">Puede reelegirse en 2027 · ${esc(ACTRE[a.j])}</div>`:''}
   ${a.ps.length>1?`<div class="pcb${a.bando?'':' al'}">${a.bando?'Cambió de bando':'Lo postuló otro partido de su misma alianza'}: ${a.ps.map(x=>esc(psL(x))).join(' → ')}</div>`:''}
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
    sm=`<div class="ac-sm"><b>${fmt(nb)}</b> cambiaron de bando y <b>${fmt(L.length-nb)}</b> se movieron dentro de su alianza.${top.length?` Lo más común: ${top.map(([k,n])=>`${esc(k)} (${n})`).join(', ')}.`:''}</div>`;}
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

/* ===== módulo: Contexto socioeconómico =====
   Ejemplo de tarjeta como módulo independiente. Usa cualquier base registrada en
   pipeline/capas.json: si se agrega INEGI, sus variables aparecen aquí sin cambiar este archivo. */
if(XB.length) tarjeta({id:'xsoc',titulo:'Contexto socioeconómico',resumen:'bases adicionales comparadas con el estado',
  icono:'<rect x="3" y="4" width="20" height="2.4" rx="1.2" fill="#F5A47C"/><rect x="3" y="9" width="13" height="2.4" rx="1.2" fill="#4CC1BA"/><rect x="3" y="14" width="17" height="2.4" rx="1.2" fill="#B9C1C1"/>',
  html:({idx,hd,ft,scopeN})=>{const vs=Object.values(XV);
    if(vs.some(v=>!XD[v.id]&&!XFAIL[v.base.id])){xLoadAll().then(()=>render()); return `<div class="cd">${hd('xsoc','Contexto socioeconómico',scopeN)}<p class="note" style="margin:6px 0 10px">Cargando bases…</p></div>`;}
    const rows=vs.map(v=>{const a=xVal(v.id,idx),r=xVal(v.id,ALL); if(a==null||r==null) return ''; const worse=v.sentido==='mayor_peor'?a>r:v.sentido==='mayor_mejor'?a<r:null,mx=Math.max(a,r,v.hi||0)||1;
      return `<div class="trt hv" data-tip="${esc(`<b>${v.nombre}</b>Aquí ${xFmt(v.id,a)} · estado ${xFmt(v.id,r)}<br>${v.descripcion||''}`)}"><span>${esc(v.nombre)} · ${xFmt(v.id,a)}</span><em style="color:${worse==null?'var(--muted)':worse?'var(--coral)':'var(--teal3)'}">${worse==null?'':worse?'peor':'mejor'}</em><span class="bar"><b style="width:${Math.min(100,100*a/mx)}%;background:${worse?'var(--coral)':'var(--teal)'}"></b><u style="left:${Math.min(100,100*r/mx)}%"></u></span></div>`;}).join('');
    const munNote=XB.some(b=>b.nivel==='municipio')?' · los datos municipales se asignan a todas sus secciones':'';
    return `<div class="cd">${hd('xsoc','Contexto socioeconómico',scopeN)}${rows||'<p class="note">Sin datos para esta selección.</p>'}<div class="note">Raya: valor del estado · peor o mejor que el estado · ponderado por electores${munNote}</div>${ft(XB.map(b=>b.fuente).join('; '))}</div>`;}});

/* ===== tabla de decisiones ===== */
const TV={all:['Todas',''],def:['Defender','gana por menos de 5 pts'],dis:['Disputar','pierde por menos de 5 pts'],rec:['Recuperar abstención','pierde, pero le faltan menos votos que los votantes ocasionales de la zona'],bas:['Bastiones','gana por 15 pts o más']};
const TG={sec:['Sección','secciones'],mun:['Municipio','municipios'],dl:['Distrito local','distritos locales'],df:['Distrito federal','distritos federales']};
const SNb=b=>b?NM[b.lead]+(b.members.filter(m=>m!=='OTROS').length>1?'+':''):'';
function tUnits(idx,ek,g,p){const grp={};
  if(g==='sec') idx.forEach(i=>grp[i]=[i]); else idx.forEach(i=>{const kk=g==='mun'?S[i].m:S[i][g]; (grp[kk]=grp[kk]||[]).push(i);});
  return Object.entries(grp).map(([kk,ii])=>{const T=totals(ek,ii); if(!T.val) return null; const a=T.bl[0],b=T.bl[1],u={g,kk,ii,T,ln:lnOf(ii),a,b,m:a.pct-(b?b.pct:0),mv:Math.round(a.votes-(b?b.votes:0)),turn:T.turn};
    u.label=g==='sec'?'Sección '+S[ii[0]].s:g==='mun'?MUN[kk]:g==='dl'?'DL '+kk+' · '+(CABDL[kk]||''):'DF '+kk+' · '+(CABDF[kk]||'');
    u.sub=g==='sec'?MUN[S[ii[0]].m]+' · '+(TIPO[S[ii[0]].t]||''):g==='mun'?ii.length+' secciones':[...new Set(ii.map(i=>S[i].m))].length+' municipios';
    if(p){u.gp=gapOf(ek,ii,p); if(u.gp){u.sgap=u.gp.lead?u.gp.gap:-u.gp.gap;}}
    return u;}).filter(Boolean);}
function tViewOk(u,v){if(v==='all') return true; const x=u.gp; if(!x) return false; return v==='def'?x.lead&&x.ptsGap<5:v==='dis'?!x.lead&&x.ptsGap<5:v==='rec'?!x.lead&&x.gap>0&&x.rec>=x.gap:v==='bas'?x.lead&&x.ptsGap>=15:true;}
function tTrend(u,ek,p){const t=ek.split('_')[0],ys=YEARS.filter(y=>D.E[t+'_'+y]),q=p||u.a.lead; return {ys,v:ys.map(y=>{if(ccOff(t+'_'+y,q)) return null; const T=totals(t+'_'+y,u.ii); return T.val?100*(T.tot[q]||0)/T.val:null;}),q};}
function sparkT(tr){const v=tr.v.map(x=>x==null?0:x),n=v.length,W=74,H=22,mx=Math.max(...v,1),mn=Math.min(...v),X=j=>3+j/Math.max(1,n-1)*(W-6),Y=x=>H-3-(mx===mn?.5:(x-mn)/(mx-mn))*(H-6);
  return `<svg class="tspk" viewBox="0 0 ${W} ${H}" data-tip="${esc(`<b>${NM[tr.q]} · votación propia</b>`+tr.ys.map((y,j)=>y+': '+(tr.v[j]==null?'—':tr.v[j].toFixed(1)+'%')).join('<br>'))}"><polyline points="${v.map((x,j)=>X(j).toFixed(1)+','+Y(x).toFixed(1)).join(' ')}" fill="none" stroke="${C[tr.q]}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${X(n-1).toFixed(1)}" cy="${Y(v[n-1]).toFixed(1)}" r="2.6" fill="${C[tr.q]}"/></svg>`;}
/* sin elección elegida: panorama por municipio (quién gobierna, con cuánto ganó, si puede reelegirse, participación) */
let TPP=null;
function tPartAvg(){if(TPP) return TPP; const o={}; Object.keys(D.E).forEach(ek=>ALL.forEach(i=>{const r=row(ek,i); if(!r||!r.ln) return; const m=S[i].m,a=o[m]||(o[m]={}); (a[ek]=a[ek]||[0,0]); a[ek][0]+=r.t; a[ek][1]+=r.ln;}));
  const out={}; for(const m in o){const v=Object.values(o[m]).filter(x=>x[1]).map(x=>x[0]/x[1]); out[m]=v.length?100*v.reduce((a,b)=>a+b,0)/v.length:null;} return TPP=out;}
function tPano(idx){const B=$('tbl'),ms=[...new Set(idx.map(i=>S[i].m))],PA=tPartAvg(),R=M0.ref||{},MG=M0.marg||{},RE=(GAN&&GAN.re)||{},AL=M0.cab==='cdmx';
  const U=ms.map(m=>{const ii=idx.filter(i=>S[i].m===m),pm=GAN&&GAN.pm&&GAN.pm[String(m)],last=pm?pm.slice().sort((a,b)=>b[0]-a[0])[0]:null,rr=last&&ganBy[last[1]]?ganBy[last[1]].find(r=>r[1]===last[0]&&r[7]&&r[7][0]==='m'&&+r[7][1]===+m):null,pj=R.pj25&&R.pj25.m[String(m)];
    return {m,n:MUN[m],ln:ii.reduce((a,i)=>a+(S[i].ln||0),0),sec:ii.length,pa:PA[m],last,mg:rr&&rr[6]?rr[6][1]:null,re:last&&RE[last[1]]?1:0,pj:pj&&pj[1]?100*pj[0]/pj[1]:null,marg:MG[String(m)]?MG[String(m)][0]:''};});
  const so=st.tps||{k:'ln',d:-1},F={n:u=>u.n,ln:u=>u.ln,sec:u=>u.sec,pa:u=>u.pa??-1,gob:u=>u.last?u.last[2]:'',mg:u=>u.mg??999,re:u=>u.re,pj:u=>u.pj??-1,marg:u=>['Muy bajo','Bajo','Medio','Alto','Muy alto'].indexOf(u.marg)}[so.k]||(u=>u.ln);
  U.sort((a,b)=>{const x=F(a),y=F(b); return ((x>y)-(x<y))*so.d;});
  const gw={}; U.forEach(u=>{if(u.last){const q=(u.last[2]||'').split(/[_-]/)[0]; gw[q]=(gw[q]||0)+1;}}); const gws=Object.entries(gw).sort((a,b)=>b[1]-a[1]),nre=U.filter(u=>u.re).length,ncl=U.filter(u=>u.mg!=null&&u.mg<5).length;
  const qe=[lastOf('AYU'),lastOf('DIPL'),lastOf('DIPF'),lastOf('GOB'),lastOf('PRE')].filter((x,j,a)=>x&&a.indexOf(x)===j&&D.E[x]);
  const th=(k2,t,r)=>`<th data-tps="${k2}" class="${r?'r':''}">${t}${so.k===k2?(so.d<0?' ▾':' ▴'):''}</th>`;
  B.innerHTML=`<div class="tbar tpq"><span class="cnt" style="margin:0">Sin elección elegida: panorama por ${AL?'alcaldía':'municipio'}. Para comparar resultados elige una elección:</span><span class="qe">${qe.map(k2=>`<button data-qe="${k2}">${esc(eLabel(k2))}</button>`).join('')}</span></div>
   <div class="tkpi"><div><small>${AL?'Alcaldías':'Municipios'}</small><b class="num">${fmt(U.length)}</b><em>en la vista</em></div><div><small>Electores</small><b class="num">${k(U.reduce((a,u)=>a+u.ln,0))}</b><em>lista nominal</em></div>
    <div class="w"><small>Quién gobierna hoy</small><span class="mst">${gws.map(([q,c])=>`<i data-tip="${esc(`<b>${NM[q]||q}</b>${c} de ${U.length}`)}" style="flex-grow:${c};background:${C[q]||'#B9C1C1'}"></i>`).join('')}</span><em>${gws[0]?(NM[gws[0][0]]||gws[0][0])+' '+gws[0][1]+' de '+U.length:'—'}</em></div>
    <div><small>Ganaron por menos de 5 pts</small><b class="num" style="color:var(--coral)">${fmt(ncl)}</b><em>en su última elección</em></div>${Object.keys(RE).length?`<div><small>${AL?'Alcaldías':'Presidencias'} que pueden reelegirse</small><b class="num" style="color:var(--teal3)">${fmt(nre)}</b><em>en 2027</em></div>`:''}</div>
   <table><thead><tr>${th('n',AL?'Alcaldía':'Municipio')}${th('ln','Electores',1)}${th('sec','Secciones',1)}${th('gob','Gobierna hoy')}${th('mg','Ganó por',1)}${Object.keys(RE).length?th('re','Puede reelegirse'):''}${th('pa','Participación promedio',1)}${R.pj25?th('pj','Judicial 2025',1):''}${Object.keys(MG).length?th('marg','Marginación'):''}</tr></thead><tbody>
   ${U.map(u=>`<tr data-terr="${u.m}"><td><span class="tu"><b>${esc(u.n)}</b></span></td><td class="r">${fmt(u.ln)}</td><td class="r">${fmt(u.sec)}</td><td>${u.last?`<span class="pc"><i style="background:${C[(u.last[2]||'').split(/[_-]/)[0]]||'#B9C1C1'}"></i>${esc(NM[u.last[2]]||actN(u.last[2]))} <small>${u.last[0]}</small></span><small class="tpn"><button class="tper" data-per="${u.last[1]}">${esc(GAN.p[u.last[1]])}</button></small>`:'<small>sin dato</small>'}</td><td class="r">${u.mg!=null?`<span class="${u.mg<5?'dn':''}">${u.mg.toFixed(1)} pts</span>`:'—'}</td>${Object.keys(RE).length?`<td>${u.re?'Sí':''}</td>`:''}<td class="r">${u.pa!=null?u.pa.toFixed(1)+'%':'—'}</td>${R.pj25?`<td class="r">${u.pj!=null?u.pj.toFixed(1)+'%':'—'}</td>`:''}${Object.keys(MG).length?`<td>${esc(u.marg)}</td>`:''}</tr>`).join('')}</tbody></table>
   <p class="src" style="padding:10px 14px">Gobierna hoy: última elección de ${AL?'alcaldías':'ayuntamientos'} (INE, integración de cargos). Participación promedio de las elecciones 2015–2024. Clic en una fila para ir al ${AL?'alcaldía':'municipio'}; clic en un nombre para ver su trayectoria.</p>`;
  B.querySelectorAll('[data-tps]').forEach(h=>h.onclick=()=>{const k2=h.dataset.tps; st.tps={k:k2,d:so.k===k2?-so.d:(k2==='n'||k2==='mg'?1:-1)}; tPano(idx);});
  B.querySelectorAll('[data-qe]').forEach(b2=>b2.onclick=()=>setElec(b2.dataset.qe));
  B.querySelectorAll('[data-per]').forEach(b2=>b2.onclick=e=>{e.stopPropagation(); actOpen(+b2.dataset.per);});
  B.querySelectorAll('tr[data-terr]').forEach(t=>t.onclick=()=>setTerr(t.dataset.terr));}
function renderTbl(idx){const B=$('tbl'); if(!st.elec){tPano(idx); return;}
  const ek=st.elec,p=st.party,g=st.tg||'sec',v=p?(st.tv||'all'):'all',q=norm(st.tq||''),wf=st.tw||'';
  let U=tUnits(idx,ek,g,p); const nAll=U.length;
  U=U.filter(u=>tViewOk(u,v)&&(!q||norm(u.label+' '+u.sub).includes(q))&&(!wf||u.a.lead===wf));
  const xc=xCur(),SK={xv:u=>{const x=xc?xVal(xc,u.ii):null; return x==null?-1e12:x;},ln:u=>u.ln,lab:u=>u.label,a:u=>u.a.pct,mg:u=>u.m,gap:u=>u.sgap==null?-1e12:u.sgap,rec:u=>u.gp?u.gp.rec:0,ratio:u=>u.gp&&u.gp.rec?u.gp.gap/u.gp.rec:1e9,turn:u=>u.turn||0};
  const defS={all:{k:'ln',d:-1},def:{k:'mg',d:1},dis:{k:'gap',d:-1},rec:{k:'ratio',d:1},bas:{k:'mg',d:-1}}[v],so=(st.sortT&&st.sortT.v===v+g)?st.sortT:{...defS,v:v+g},fk=SK[so.k]||SK.ln;
  U.sort((x,y)=>{const a=fk(x),b=fk(y); return ((a>b)-(a<b))*so.d;});
  const lim=st.tlim||100,show=U.slice(0,lim),ii=U.flatMap(u=>u.ii),TR=totals(ek,ii),ln=lnOf(ii),wc={}; let cl=0; const mgs=[];
  U.forEach(u=>{wc[u.a.lead]=(wc[u.a.lead]||0)+1; mgs.push(u.m); if(u.m<5) cl++;}); mgs.sort((a,b)=>a-b);
  const wcs=Object.entries(wc).sort((a,b)=>b[1]-a[1]),med=mgs.length?mgs[Math.floor(mgs.length/2)]:null,nR=U.length||1,UL=TG[g][1];
  const needT=p&&(v==='dis'||v==='rec')?U.reduce((a,u)=>a+(u.gp&&!u.gp.lead?u.gp.gap:0),0):null,recT=p?U.reduce((a,u)=>a+(u.gp?u.gp.rec:0),0):null;
  const kpi=`<div class="tkpi"><div><small>${esc(TG[g][1])}</small><b class="num">${fmt(U.length)}</b><em>${U.length<nAll?'de '+fmt(nAll)+' en la vista':'toda la vista'}</em></div><div><small>Electores</small><b class="num">${k(ln)}</b><em>${pct(100*ln/(lnOf(idx)||1),0)} de la vista</em></div><div><small>Participación</small><b class="num">${pct(TR.turn,1)}</b><em>${esc(eLabel(ek))}</em></div><div class="w"><small>${esc(UL[0].toUpperCase()+UL.slice(1))} ganados</small><span class="mst">${wcs.map(([qq,c])=>`<i data-tip="${esc(`<b>${NM[qq]}</b>${c} ${UL} (${Math.round(100*c/nR)}%)`)}" style="flex-grow:${c};background:${C[qq]}"></i>`).join('')}</span><em>${wcs[0]?NM[wcs[0][0]]+' '+Math.round(100*wcs[0][1]/nR)+'%':''}</em></div>`+
    (p&&needT!=null?`<div><small>Votos que faltan a ${NM[p]}</small><b class="num" style="color:var(--coral)">${fmt(needT)}</b><em>para ganar todos los de esta vista</em></div><div><small>Votantes ocasionales</small><b class="num" style="color:var(--teal3)">${fmt(recT)}</b><em>votan a veces, no siempre</em></div>`:`<div><small>Alta competencia</small><b class="num" style="color:var(--coral)">${fmt(cl)}</b><em>margen menor a 5 pts</em></div><div><small>Ventaja mediana</small><b class="num">${med==null?'—':med.toFixed(1)+' pts'}</b><em>la mitad, por debajo</em></div>`)+`</div>`;
  const cols=[['lab',TG[g][0],u=>`<span class="tu"><b>${esc(u.label)}</b><small>${esc(u.sub)}</small></span>`],['ln','Electores',u=>fmt(u.ln),1],['a','1º y 2º lugar',u=>`<span class="pc"><i style="background:${u.a.c}"></i>${esc(SNb(u.a))} <b>${u.a.pct.toFixed(1)}</b></span>${u.b?`<span class="pc s2"><i style="background:${u.b.c}"></i>${esc(SNb(u.b))} ${u.b.pct.toFixed(1)}</span>`:''}`],
    ['mg','Ventaja',u=>`<span class="cb"><u style="width:${Math.min(32,u.m*1.1)}px;background:${u.m<5?'var(--coral)':u.m<15?'var(--peach)':'var(--teal)'}"></u>${u.m.toFixed(1)} pts</span><small class="tv2">${fmt(u.mv)} ${u.mv===1?'voto':'votos'}</small>`,1]]
    .concat(p?[['gap',NM[p]+': votos',u=>!u.gp?'—':u.gp.lead?`<span class="gp up">+${fmt(u.gp.gap)}</span><small class="tv2">de ventaja</small>`:`<span class="gp dn">faltan ${fmt(u.gp.gap+1)}</span><small class="tv2">para ganar</small>`,1],['rec','Ocasionales',u=>!u.gp?'—':`<span class="${!u.gp.lead&&u.gp.rec>=u.gp.gap?'rk2 ok':'rk2'}">${fmt(u.gp.rec)}</span>${!u.gp.lead&&u.gp.rec>=u.gp.gap?'<small class="tv2">alcanza</small>':''}`,1]]:[])
    .concat([['tr','Tendencia',u=>sparkT(tTrend(u,ek,p)),0,1],['turn','Participación',u=>pct(u.turn,1),1]]).concat(xc?[['xv',XV[xc].nombre,u=>xFmt(xc,xVal(xc,u.ii)),1]]:[]);
  const prevQ=document.activeElement&&document.activeElement.id==='tq';
  const hint=!p?`Elige un partido en <b>Analizar como</b> para ver las vistas de decisión: defender, disputar, recuperar abstención y bastiones.`:v==='all'?`${/^(municipios|distritos)/.test(UL)?'Todos los':'Todas las'} ${UL} con su ventaja y lo que le falta a ${NM[p]} para ganar cada una.`:`<b>${TV[v][0]}:</b> ${UL} donde ${NM[p]} ${TV[v][1]}. Votantes ocasionales = han votado al menos una vez desde 2018, pero no suelen votar en este tipo de elección.`;
  B.innerHTML=kpi+`<div class="tbar"><div class="grp seg ready tvs">${Object.entries(TV).map(([kk,x])=>`<button data-tvv="${kk}" aria-pressed="${v===kk}" ${!p&&kk!=='all'?'disabled':''}>${x[0]}</button>`).join('')}</div><div class="grp seg ready tgs"><span class="hint">Agrupar por</span>${Object.entries(TG).map(([kk,x])=>`<button data-tgg="${kk}" aria-pressed="${g===kk}">${x[0]}</button>`).join('')}</div>
    <input id="tq" placeholder="Buscar ${esc(UL)}" value="${esc(st.tq||'')}"><div class="pt">${[['','Todas']].concat(totals(ek,idx).bl.slice(0,4).map(b=>[b.lead,'Ganó '+NM[b.lead]])).map(x=>`<button data-tw="${x[0]}" aria-pressed="${wf===x[0]}">${x[0]?`<i style="background:${C[x[0]]}"></i>`:''}${x[1]}</button>`).join('')}</div><button class="dl" id="tcsv">Descargar CSV</button><p class="thint">${hint}</p></div>
    <table><thead><tr>${cols.map(x=>`<th class="${x[3]?'r':''}" ${x[4]?'':`data-k="${x[0]}"`}>${esc(x[1])}${x[0]===so.k?(so.d>0?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>${show.map((u,j)=>`<tr data-u="${j}">${cols.map(x=>`<td class="${x[3]?'r':''}">${x[2](u)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}" class="empty">Ninguna ${esc(TG[g][0].toLowerCase())} cumple esta vista con los filtros actuales.</td></tr>`}</tbody>
    <tfoot><tr><td>Total de la vista</td><td class="r">${fmt(ln)}</td><td>${TR.bl[0]?`<span class="pc"><i style="background:${TR.bl[0].c}"></i>${esc(SNb(TR.bl[0]))} ${TR.bl[0].pct.toFixed(1)} · ${esc(TR.bl[1]?SNb(TR.bl[1]):'')} ${TR.bl[1]?TR.bl[1].pct.toFixed(1):''}</span>`:''}</td><td class="r">${TR.bl[1]?(TR.bl[0].pct-TR.bl[1].pct).toFixed(1)+' pts':''}</td>${p?'<td></td><td></td>':''}<td></td><td class="r">${pct(TR.turn,1)}</td></tr></tfoot></table>${U.length>lim?`<div style="padding:12px;text-align:center"><button class="dl" id="tmore">Mostrar ${Math.min(100,U.length-lim)} más (${U.length-lim} restantes)</button></div>`:''}`;
  B.style.setProperty('--th',B.querySelector('.tbar').offsetHeight+'px');
  const tq=$('tq'); tq.oninput=()=>{st.tq=tq.value; st.tlim=100; renderTbl(scope());}; if(prevQ){tq.focus(); tq.setSelectionRange(tq.value.length,tq.value.length);}
  B.querySelectorAll('[data-tw]').forEach(b=>b.onclick=()=>{st.tw=b.dataset.tw; renderTbl(scope());});
  B.querySelectorAll('[data-tvv]').forEach(b=>b.onclick=()=>{st.tv=b.dataset.tvv; st.tlim=100; renderTbl(scope());});
  B.querySelectorAll('[data-tgg]').forEach(b=>b.onclick=()=>{st.tg=b.dataset.tgg; st.tlim=100; st.tq=''; renderTbl(scope());});
  if($('tmore')) $('tmore').onclick=()=>{st.tlim=lim+100; renderTbl(scope());};
  $('tcsv').onclick=()=>{const head=[TG[g][0],'Detalle','Electores','1er lugar','% 1er lugar','2º lugar','% 2º lugar','Ventaja (pts)','Ventaja (votos)'].concat(p?[NM[p]+' votos (+ventaja / -faltan)','Votantes ocasionales']:[]).concat(['Participación (%)']).concat(Object.keys(XV).filter(id=>XD[id]).map(id=>XV[id].nombre+' ('+XV[id].base.fuente+')'));
    const q2=x=>'"'+String(x).replace(/"/g,'""')+'"',lines=[head.map(q2).join(',')].concat(U.map(u=>[q2(u.label),q2(u.sub),u.ln,q2(u.a.name),u.a.pct.toFixed(2),q2(u.b?u.b.name:''),u.b?u.b.pct.toFixed(2):'',u.m.toFixed(2),u.mv].concat(p?[u.sgap==null?'':u.sgap,u.gp?u.gp.rec:'']:[]).concat([u.turn==null?'':u.turn.toFixed(2)]).concat(Object.keys(XV).filter(id=>XD[id]).map(id=>{const x=xVal(id,u.ii); return x==null?'':x.toFixed(3);})).join(',')));
    saveFile(norm(EST).replace(/\s+/g,'_')+'_'+TG[g][1].replace(/\s+/g,'_')+'_'+ek+(p?'_'+p:'')+(v!=='all'?'_'+v:'')+'.csv','﻿'+lines.join('\n'),$('tcsv'));};
  B.querySelectorAll('th[data-k]').forEach(h=>h.onclick=()=>{st.sortT={k:h.dataset.k,d:so.k===h.dataset.k?-so.d:-1,v:v+g}; renderTbl(scope());});
  B.querySelectorAll('tr[data-u]').forEach(r=>r.onclick=e=>{if(e.target.closest('.tspk')) return; const u=show[+r.dataset.u]; if(u.g==='sec'){const i=u.ii[0]; setView2('map'); if(!st.terr) st.terr=String(S[i].m); st.sel=i; render(); setTimeout(()=>fit([i]),40);} else {st.tg='sec'; applyScope(u.g,u.kk);}});}
/* descarga con permiso del visor */
let DLNS; async function saveFile(name,data,btn){const o=btn?btn.textContent:''; try{if(DLNS===undefined) DLNS=window.claude&&window.claude.use?await window.claude.use('downloads'):null; if(!DLNS){const b=data instanceof Blob?data:new Blob([data],{type:/\.csv$/i.test(name)?'text/csv;charset=utf-8':'application/octet-stream'}),u=URL.createObjectURL(b),a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); toast('Archivo descargado: '+name); return;} if(btn) btn.textContent='Preparando…'; await DLNS.save({filename:name,data}); toast('Archivo listo: '+name);}catch(e){toast(e&&e.code==='declined'?'Descarga cancelada.':'No se pudo descargar ('+((e&&e.code)||'error')+').');} finally{if(btn) btn.textContent=o;}}
function toast(t){let el=$('toast'); if(!el){el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el);} el.textContent=t; el.classList.add('on'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('on'),3200);}
function setView2(v){if(v==='est'&&st.view!=='est'){estEnter(); } if(v!=='est'&&st.view==='est'){st.es.seg=null;} const wide=x=>x==='tbl'||x==='est'; if(wide(v)&&!wide(st.view)){st.fpWas=st.fp; st.fp=false; layout(); setTimeout(refit,600);} else if(!wide(v)&&wide(st.view)&&st.fpWas!=null){st.fp=st.fpWas; st.fpWas=null; layout(); setTimeout(refit,600);} st.view=v; $('vM').setAttribute('aria-pressed',v==='map'); if($('vE')) $('vE').setAttribute('aria-pressed',v==='est'); document.body.classList.toggle('eview',v==='est'); $('vT').setAttribute('aria-pressed',v==='tbl'); $('rTb').setAttribute('aria-pressed',v==='tbl'); $('tbl').classList.toggle('hide',v!=='tbl'); document.body.classList.toggle('tview',v==='tbl'); $('metric').style.display=v==='tbl'?'none':''; if(v==='tbl') renderTbl(scope()); else render(true);}
$('vM').onclick=()=>setView2('map'); $('vT').onclick=()=>setView2('tbl'); if($('vE')) $('vE').onclick=()=>setView2('est'); $('rTb').onclick=()=>setView2(st.view==='tbl'?'map':'tbl');
function statePop(an){let p=$('stp'); if(p){p.remove(); return;} p=document.createElement('div'); p.id='stp'; p.className='epop stp'; p.innerHTML=`<input class="stq" id="stq" placeholder="Buscar estado" autocomplete="off" aria-label="Buscar estado"><div class="stl">${AVAIL.filter(x=>typeof LAB_PUEDE!=='function'||LAB_PUEDE(x.cab)).map(x=>`<button data-cab="${x.cab}" data-n="${esc(x.estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''))}" aria-pressed="${x.cab===M0.cab}"><b>${esc(x.estado)}</b><span>${x.info}</span></button>`).join('')}</div><button class="stall" id="stall">Volver a la lista de estados</button>`; document.body.appendChild(p);
  const qi=$('stq'); qi.oninput=()=>{const q=qi.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); p.querySelectorAll('[data-cab]').forEach(b=>b.hidden=!!q&&!b.dataset.n.includes(q));}; qi.onkeydown=e=>{if(e.key==='Enter'){const b=[...p.querySelectorAll('[data-cab]')].find(x=>!x.hidden); if(b) b.click();}}; setTimeout(()=>qi.focus(),30); $('stall').onclick=()=>{location.hash='';};
  const r=an.getBoundingClientRect(),below=an.id==='toMx'; p.style.left=Math.max(8,Math.min(below?r.left:r.right+8,innerWidth-p.offsetWidth-8))+'px'; p.style.top=Math.max(8,below?r.bottom+8:r.top)+'px';
  p.querySelectorAll('[data-cab]').forEach(b=>b.onclick=()=>{if(b.dataset.cab===M0.cab){p.remove(); return;} location.hash=b.dataset.cab; location.reload();});
  setTimeout(()=>document.addEventListener('pointerdown',function h(ev){if(!ev.target.closest('#stp,#rMx,#toMx')){const q=$('stp'); if(q) q.remove(); document.removeEventListener('pointerdown',h);} else if(!$('stp')) document.removeEventListener('pointerdown',h);}),0);}
$('rMx').onclick=()=>statePop($('rMx')); $('toMx').onclick=()=>statePop($('toMx')); $('toNat').onclick=()=>{location.hash='';};
$('rPa').onclick=()=>{$('party').focus();};


/* en celular la tabla cubre la pantalla: botón para volver al mapa */
{const _rT=renderTbl; renderTbl=function(i){_rT(i); const B=$('tbl'); if(!B.querySelector('.tback')){const b=document.createElement('button'); b.className='tback'; b.textContent='← Volver al mapa'; b.onclick=()=>setView2('map'); B.prepend(b);}};}

/* ===== Estrategia 2027 =====
   Solo para los cargos que se eligen en 2027 en el estado. Todo se calcula sobre una proyección 2027 por sección:
   lista nominal vigente × participación esperada × votación por partido (promedio ponderado de elecciones recientes).
   Las alianzas parten de las más recientes y sin los partidos que perdieron su registro. El resultado anterior
   del mismo cargo se muestra solo como referencia. */
const EREG=(M0.proy&&M0.proy.reg)||null,NOREG=EREG?EREG.sin:['PRD','PES','RSP','FXM'],ENEW=EREG?EREG.nuevos:['Somos México','PAZ'];
const ECAT={gan:['Ganaría con ventaja','ventaja de 5 puntos o más','#1C7F79'],dis:['En disputa','diferencia menor a 5 puntos','#F46883'],
  pue:['Se pueden ganar','perdería por entre 5 y 10 puntos','#F5A47C'],per:['Difíciles','perdería por más de 10 puntos','#9AA6A6'],
  com:['Competidas','diferencia menor a 5 puntos','#F46883'],med:['Ventaja media','el primero saca entre 5 y 15 puntos','#F5A47C'],amp:['Ventaja amplia','el primero saca más de 15 puntos','#1C7F79'],
  rt:['Ruta a la meta','las secciones que perdería por menos, hasta juntar los votos que le faltan','#B8860B'],duro:['Voto duro','aun en su peor elección desde 2018 sacó 30% o más de los votos esperados','#2E3B3B'],sw:['Cambian de partido','cambiaron de partido ganador en al menos 2 cargos entre las dos últimas elecciones','#4CC1BA']};
Object.assign(ECAT,{seg:['Conservar','ganaría por 10 puntos o más: mantener la estructura','#1C7F79'],cui:['Defender','ganaría por menos de 10 puntos: cuidar que no se voltee','#93D6D0'],
  dis:['Disputar','perdería por menos de 10 puntos: aquí se gana o se pierde','#F46883'],
  mov:['Disputar · movilizar','perdería por menos de 10 y votó mucha menos gente que en su mejor elección: sacar a votar a los suyos','#F46883'],
  con:['Disputar · convencer','perdería por menos de 10 y la participación es la de siempre: ganar votantes de otros partidos','#F46883'],
  dif:['Contener','perdería por más de 10 puntos: que el rival no crezca','#D3DADA'],pri:['Disputar','perdería por menos de 10 puntos','#F46883']});
const EACT=['dis','cui','seg','dif'],eAct4=a=>a==='mov'||a==='con'?'dis':a;
const ESTL={gana:['Ganaría','up'],dis:['En disputa','mid'],alc:['Se puede ganar','mid'],amplia:['Brecha amplia','dn']};
const EOBJ=[['GOB','Gubernatura','est',CFG.gob2027],['DIPL','Congreso local','dl',CFG.cong2027],['AYU',M0.cab==='cdmx'?'Alcaldías':'Ayuntamientos','mun',CFG.ayu2027],['DIPF','Diputaciones federales','df',true]].filter(o=>o[3]&&lastOf(o[0]));
const ELV={est:'Estado',mun:'Municipio',dl:'Distrito local',df:'Distrito federal'};
const ALC=M0.cab==='cdmx',ENN={est:['estado','estados'],mun:ALC?['alcaldía','alcaldías']:['municipio','municipios'],dl:['distrito local','distritos locales'],df:['distrito federal','distritos federales']};
if(!st.es) st.es={obj:EOBJ[0][0],lv:null,u:null,seg:null,sc:'s2',ally:null,col:'seg',tab:'sec',q:'',sk:null,sd:1};
const ECACHE={},EPJ={};
let ERT=new Set();
const eRef=()=>lastOf(st.es.obj);
const eNat=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[2];
const eLv=()=>st.es.lv||eNat();
const eKey=(lv,i)=>lv==='mun'?S[i].m:lv==='dl'?S[i].dl:lv==='df'?S[i].df:0;
const eName=(lv,k)=>lv==='mun'?(ALC?'Alcaldía ':'Municipio de ')+MUN[k]:lv==='dl'?'Distrito local '+k+(CABDL[k]?' · '+CABDL[k]:''):lv==='df'?'Distrito federal '+k+(CABDF[k]?' · '+CABDF[k]:''):EST;
const eSide=A=>A.map(q=>NM[q]).join('-');
const bnm=ms=>ms.length>3?ms.slice(0,3).map(m=>NM[m]).join('-')+' y '+(ms.length-3)+' más':ms.map(m=>NM[m]).join('-');
const eGroups=lv=>{const g={}; ALL.forEach(i=>{const k=eKey(lv,i); (g[k]=g[k]||[]).push(i);}); return Object.entries(g).map(([k,ii])=>({k:+k,ii}));};
const eContests=()=>eNat()==='est'?[{k:0,ii:ALL}]:eGroups(eNat());
const eYear=()=>D.E[eRef()].year;
/* votos de un bloque: el partido más fuerte aporta todo y los aliados aportan la fracción r medida en elecciones del mismo día */
/* suma de una alianza: los votos de todos sus partidos completos. En la boleta mexicana cada partido de una alianza
   conserva su logo y sus votos se suman para el candidato común; es la misma regla con la que se validó el modelo
   (las alianzas reales de 2015–2024 se suman completas). No se usa un "rendimiento" medido entre elecciones distintas:
   esa medición mezcla el arrastre de otra elección (p. ej. la presidencial) y daba valores sin sentido (más de 100 %). */
/* votos de una alianza: el partido que más aporta, completo, y sus aliados al 70 %. Se probó en los 32 estados
   estimando 2021 y 2024 con 30 % a 100 %: con 70 % se acierta más al ganador en los dos años (61.1 % y 69.0 %
   contra 60.7 % y 68.1 % sumando completo) y el error del margen baja (19.9 y 22.7 puntos contra 20.0 y 23.5). */
const ETR=.7,sv=(pv,ms)=>{if(ms.length<2) return ms.reduce((t,m)=>t+(pv[m]||0),0); const v=ms.map(m=>pv[m]||0).sort((a,b)=>b-a); return v[0]+ETR*v.slice(1).reduce((a,b)=>a+b,0);};
const eRk=()=>1;
/* alianzas de partida para 2027: las de la elección más reciente (local si la hay), sin partidos sin registro */
const EBL=(()=>{const ym=Math.max(...Object.values(D.E).map(e=>+e.year)),ks=Object.keys(D.E).filter(k=>+D.E[k].year===ym),k=ks.find(k=>/^(DIPL|AYU|GOB)/.test(k))||ks[0];
  return {ek:k,year:ym,bl:D.E[k].blocs.map(b=>b.members.filter(m=>m!=='OTROS'&&!NOREG.includes(m))).filter(m=>m.length)};})();
const EPARTIES=[...new Set(EBL.bl.flat())].sort((a,b)=>(MAIN.indexOf(a)<0?99:MAIN.indexOf(a))-(MAIN.indexOf(b)<0?99:MAIN.indexOf(b)));
/* Ninguna alianza se da por hecha: cada partido parte solo; las alianzas son "posibles" y se comparan como escenarios. */
if(!st.es.rv) st.es.rv='sep';
/* candidaturas comunes: coaliciones cuyos partidos aparecen con votos casi idénticos (el INE repartió el voto común).
   Ahí no existe el voto "propio" de cada partido: se analizan solo como coalición. */
const ESPL=(()=>{const out=[],seen=new Set();
  /* candidaturas comunes desde 2021, marcadas en el proceso de datos (construir.py → E[elección].cc) */
  Object.keys(D.E).filter(ek=>+D.E[ek].year>=2021).forEach(ek=>(D.E[ek].cc||[]).forEach(g=>{const mm=g.filter(m=>EPARTIES.includes(m)),key=mm.slice().sort().join('+'); if(mm.length>1&&!seen.has(key)){seen.add(key); out.push(mm);}})); return out;})();
const eSplitOf=p=>ESPL.find(b=>b.includes(p));
const eRv=()=>ESPL.length?'ali':st.es.rv;
const ESOLO=EPARTIES.map(q=>[q]);
/* alianzas 2027 registradas por el equipo (Excel de escenarios → meta.esc): mandan sobre los supuestos */
const ESC=M0.esc||{al:{},enc:{}};
const eOfi=()=>{const L=(ESC.al||{})[st.es.obj]; if(!L||!L.length) return null; const used=new Set(),bl=L.map(a=>a.p.filter(m=>EPARTIES.includes(m))).filter(b=>b.length); bl.forEach(b=>b.forEach(m=>used.add(m))); return bl.concat(EPARTIES.filter(m=>!used.has(m)).map(m=>[m]));};
const eOfBl=p=>{const o=eOfi(); return o&&o.find(b=>b.includes(p)&&b.length>1);};
const eGenBl=()=>eOfi()||(eRv()==='ali'?EBL.bl:ESOLO);  /* bloques del panorama y de los rivales */
function eBlocOf(p){return eGenBl().find(b=>b.includes(p))||[p];}
function eRivBl(A){return eGenBl().map(ms=>ms.filter(m=>!A.includes(m))).filter(ms=>ms.length);}
/* socios posibles: partidos con los que fue en alianza en 2021 o después */
const EPOOL=p=>{const s=new Set(); Object.values(D.E).forEach(e=>{if(+e.year<2021) return; e.blocs.forEach(b=>{if(b.members.includes(p)) b.members.forEach(m=>{if(m!==p&&EPARTIES.includes(m)) s.add(m);});});}); return [...s].sort((a,b)=>EPARTIES.indexOf(a)-EPARTIES.indexOf(b));};
function eScen(p){const sp=eSplitOf(p); if(sp){const base=[p].concat(sp.filter(m=>m!==p)),pool=EPOOL(p).filter(m=>!sp.includes(m)),out=[base]; pool.forEach(m=>out.push(base.concat([m]))); if(pool.length>1) out.push(base.concat(pool)); return out.slice(0,6);}
  const pool=EPOOL(p),out=[[p]]; const k=pool.length; for(let m=1;m<(1<<k);m++){const sub=pool.filter((_,j)=>m&(1<<j)); if(sub.length<=2||sub.length===k) out.push([p].concat(sub));} out.sort((a,b)=>a.length-b.length); return out.slice(0,8);}
const eKeyA=A=>A.slice().sort().join('+');
function eAlly(){const p=st.party; if(!p) return null; const a=st.es.al,sp=eSplitOf(p),of=eOfBl(p),base=of?[p].concat(of.filter(m=>m!==p)):sp?[p].concat(sp.filter(m=>m!==p)):[p]; return a&&a[0]===p&&base.every(m=>a.includes(m))?a:base;}
/* Proyección 2027 por sección. Modelo calibrado en pipeline/proyeccion.py con pruebas contra 2021 y 2024 (meta.proy):
   votación = a × última elección del mismo cargo (con oscilación estatal si sw) + (1−a) × promedio de las elecciones del año más reciente;
   participación según la regla que menos se equivocó; alianzas con el rendimiento medido (r); encuesta opcional por oscilación proporcional. */
/* aliados de cada partido sin registro: su alianza en la elección más reciente donde tuvo votos en este estado */
const ENRA=(()=>{const o={}; const ks=Object.keys(D.E).sort((a,b)=>+D.E[b].year-+D.E[a].year); NOREG.forEach(q=>{for(const k of ks){const e=D.E[k],j=D.P8.indexOf(q); if(j<0||!e.r.some(r=>r&&r[j]>0)) continue; const b=e.blocs.find(b=>b.members.includes(q)&&b.members.length>1); o[q]=b?b.members.filter(m=>m!==q&&m!=='OTROS'&&!NOREG.includes(m)):[]; break;}}); return o;})();
const PR=Object.assign({a:.5,sw:0,tp:'prom',r:.84,r_q:[.3,1.27],est:null,tipos:{}},M0.proy||{});
if(!st.es.poll) st.es.poll={};
Object.entries((M0.esc||{}).enc||{}).forEach(([t,x])=>{if(!(t in st.es.poll)) st.es.poll[t]={v:Object.assign({},x.v),moe:x.moe,of:x};});
const EYM=Math.max(...Object.values(D.E).map(e=>+e.year));
function eProjW(t0){const t=t0||st.es.obj,L=lastOf(t),rec=Object.keys(D.E).filter(k=>+D.E[k].year===EYM),c6=D.E[t+'_'+(EYM-3)]?[t+'_'+(EYM-3)]:Object.keys(D.E).filter(k=>+D.E[k].year===EYM-3);return {L,rec,c6,ym:EYM};}
const shOf=(ek,i)=>{const r=row(ek,i); if(!r||!r.val) return null; const o={}; for(const q in r.v) o[q]=r.v[q]/r.val; return o;};
function eP(t0){const o=t0||st.es.obj,pk=o+'|'+JSON.stringify(st.es.poll[o]||null); if(EPJ[pk]) return EPJ[pk]; const {L,rec,c6}=eProjW(o),out=new Array(N).fill(null);
  const stw=ks=>{const t={}; let V=0; ks.forEach(ek=>ALL.forEach(i=>{const r=row(ek,i); if(!r||!r.val) return; V+=r.val; for(const q in r.v) t[q]=(t[q]||0)+r.v[q];})); for(const q in t) t[q]/=V; return t;};
  let f=null; if(PR.sw){const sL=stw([L]),sR=stw(rec); f={}; for(const q in sL) f[q]=sL[q]>1e-4?Math.min(5,Math.max(.2,(sR[q]||0)/sL[q])):0;}
  const tpAv=(ks,i)=>{const v=ks.map(k=>row(k,i)).filter(r=>r&&r.ln).map(r=>r.t/r.ln); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  ALL.forEach(i=>{const rs=rec.map(k=>shOf(k,i)).filter(Boolean),R={}; rs.forEach(x=>{for(const q in x) R[q]=(R[q]||0)+x[q]/rs.length;}); let B=shOf(L,i)||(rs.length?R:null); if(!B) return; if(!rs.length) Object.assign(R,B);
    if(f){const b={}; let t=0; for(const q in B){b[q]=B[q]*(f[q]??1); t+=b[q];} for(const q in b) b[q]/=t||1; B=b;}
    const P={},G={}; let t=0; new Set([...Object.keys(B),...Object.keys(R)]).forEach(q=>{const v=PR.a*(B[q]||0)+(1-PR.a)*(R[q]||0); if(v<=0) return; if(NOREG.includes(q)){G[q]=v; return;} P[q]=v; t+=v;});
    /* votos de partidos sin registro en 2027: van a los partidos con los que fueron en alianza en su última elección
       (p. ej. PRD → PAN y PRI); si fueron solos, se reparten entre todos en proporción. Probado contra 2021 y 2024:
       igual o ligeramente mejor que repartir en proporción. */
    for(const q in G){const al=(ENRA[q]||[]).filter(m=>P[m]); const ta=al.reduce((a,m)=>a+P[m],0); if(ta>0){al.forEach(m=>{const add=G[q]*P[m]/ta; P[m]+=add; t+=add;});}} for(const q in P) P[q]/=t||1;
    const a6=tpAv(c6,i),al=tpAv(rec,i),tp=100*(PR.tp==='ciclo'?(a6??al):PR.tp==='ultima'?(al??a6):(a6!=null&&al!=null?(a6+al)/2:(a6??al)))||EXPT[i]||50;
    const rr=row(L,i),vr=rr&&rr.t?rr.val/rr.t:.96,ln=S[i].ln||(rr?rr.ln:0),V=ln*tp/100*vr,pv={}; for(const q in P) pv[q]=V*P[q]; out[i]={V,pv,ln,tp};});
  const poll=st.es.poll[o]; if(poll&&poll.v){const T={}; let V=0; out.forEach(x=>{if(!x) return; V+=x.V; for(const q in x.pv) T[q]=(T[q]||0)+x.pv[q];}); const g={}; let rest=0,restP=0;
    for(const q in T){const sh=100*T[q]/V; if(poll.v[q]!=null&&poll.v[q]!==''){g[q]=sh>.05?+poll.v[q]/sh:0;} else {rest+=sh;}} const used=Object.values(poll.v).filter(v=>v!==''&&v!=null).reduce((a,b)=>a+ +b,0); restP=Math.max(0,100-used);
    for(const q in T) if(g[q]==null) g[q]=rest>0?restP/rest:1;
    out.forEach(x=>{if(!x) return; let t=0; for(const q in x.pv){x.pv[q]*=g[q]; t+=x.pv[q];} if(t>0) for(const q in x.pv) x.pv[q]*=x.V/t;});}
  return EPJ[pk]=out;}
/* errores medidos en la prueba contra el pasado (80% de los casos quedó dentro): rango de la diferencia entre 1.º y 2.º */
function eErr(niv){const t=st.es.obj,poll=st.es.poll[t]; if(niv==='est'||eNat()==='est') return poll&&poll.v?2*(+poll.moe||3):(PR.est&&PR.est.q80)||null; const T=PR.tipos[t]; if(poll&&poll.v) return T&&T.enc?T.enc.q80||null:null; /* sin encuesta: el mismo error que usa la tarjeta de proyección (validación cruzada en pipeline/modelo.py) */ const mv=typeof MODELO!=='undefined'&&MODELO&&MODELO.estados&&(MODELO.estados[M0.cab]||{})[t]; return mv&&mv.q80?mv.q80:T&&T.hist?T.hist.q80||null:null;}
const ULBL={GOB:'el estado',DIPL:'distrito local',AYU:'municipio',DIPF:'distrito federal'};
const EINFO={
 proy:()=>{const T=PR.tipos[st.es.obj]||{},H=T.hist,En=T.enc,E0=PR.est;return `<b>Qué es</b><p>Una estimación de cómo votaría cada sección en 2027 si nada cambiara: combina la última elección del mismo cargo (${Math.round(PR.a*100)}%)${PR.sw?', ajustada al cambio de cada partido en todo el estado,':''} con las elecciones de ${EYM} (${Math.round(100-PR.a*100)}%).</p><b>Por qué este método</b><p>Las secciones votan con un patrón muy estable: donde un partido es fuerte, suele seguir siéndolo. Lo que cambia de una elección a otra es el nivel general (el ánimo del momento). Por eso se usa la elección del mismo cargo, que dice cómo vota cada sección para ese puesto, mezclada con la más reciente, que trae el ánimo actual. Es lo mejor que se puede hacer solo con resultados oficiales. Los métodos más precisos (encuestas llevadas a cada sección) necesitan encuestas con respuestas individuales, que hoy no tenemos.</p><b>Qué tan confiable</b><p>Se probó "pronosticando" 2021 y 2024 con datos anteriores. ${E0?`El resultado estatal se desvió en promedio ${E0.mae} puntos.`:''} ${H?`Por ${ULBL[st.es.obj]}, ${H.mae} puntos; acertó al ganador en ${H.hit}% de los casos.`:''} ${En?`Con una encuesta estatal el acierto sube a ${En.hit}%.`:''}</p>`;},
 rango:()=>`<b>Qué es</b><p>El margen dentro del cual cayeron 8 de cada 10 resultados reales cuando este mismo método se probó con elecciones pasadas.</p><b>Por qué se muestra</b><p>Un solo número da una falsa seguridad. El rango dice entre qué valores es probable que quede el resultado; si incluye ganar y perder, es empate técnico y conviene no tomar decisiones solo con ese dato.</p>`,
 part:()=>`<b>Qué es</b><p>El porcentaje de la lista nominal que se espera que vote en cada sección. Regla usada: ${({ciclo:'la misma elección de hace 6 años',ultima:'la elección más reciente',prom:'el promedio entre la elección intermedia de 2021 y la más reciente'})[PR.tp]}.</p><b>Por qué</b><p>2027 es una elección intermedia: sin elección presidencial vota menos gente que en 2024. Por eso no basta con la última elección; se probaron tres reglas y se usa la más precisa (diferencia típica de ${PR.tp_err} puntos por sección).</p>`,
 alianza:()=>`<b>Qué es</b><p>Cómo se suman los votos de una alianza: el partido que más aporta cuenta completo y sus aliados al 70 %, porque no todos los votantes de un aliado siguen al candidato común. El 70 % se midió en los 32 estados: estimando 2021 y 2024, con ese porcentaje se acierta más al ganador que sumando completo.</p><b>Lo que no sabe</b><p>Si los votantes de un aliado dejan de votar por su partido porque no les gusta el candidato común. Eso no se puede medir bien con resultados oficiales; los escenarios de −3 y +3 puntos sirven para ver qué pasa si la alianza rinde menos o más.</p>`,
 esc:()=>`<b>Qué es</b><p>El resultado estimado del partido elegido yendo solo y en cada posible alianza con los partidos con los que se ha aliado desde 2021.</p><b>Por qué</b><p>Ninguna alianza para 2027 está decidida. Comparar escenarios muestra cuánto suma cada aliado y cuál alianza haría falta para ganar. En cada alianza el partido que más aporta cuenta completo y sus aliados al 70 %, lo que mejor acertó al estimar 2021 y 2024.</p>`,
 rival:()=>`<b>Qué es</b><p>Cómo se supone que compiten los demás partidos: cada uno por separado, o en posible alianza como fueron en ${EBL.year}.</p><b>Por qué</b><p>Tampoco las alianzas de los rivales están decididas. Por separado es el punto de partida neutral. En posible alianza muestra el escenario más difícil si repiten.</p>`,
 enc:()=>{const En=(PR.tipos[st.es.obj]||{}).enc;return `<b>Qué es</b><p>Capturas el porcentaje estatal de cada partido según una encuesta publicada y su margen de error. Cada sección se ajusta en la misma proporción en que la encuesta difiere de la estimación.</p><b>Por qué</b><p>El historial dice dónde está el voto de cada partido, pero no anticipa cambios de ánimo como el de 2024. La encuesta aporta el nivel actual y este ajuste lo reparte respetando el patrón de cada sección. Es la forma estándar de llevar una encuesta estatal a territorios pequeños.${En?` En la prueba, conocer el resultado estatal llevó el acierto por ${ULBL[st.es.obj]} a ${En.hit}%.`:''}</p>`;},
 tps:()=>`<b>Qué es</b><p>La meta mínima cambia con la participación: si vota menos gente, el rival también saca menos votos y la meta baja. Se calcula con las mismas preferencias de la estimación y tres niveles de participación: la de la elección intermedia más reciente, la estimada y la de la elección presidencial más reciente, en este mismo territorio.</p><b>Para qué sirve</b><p>2027 es elección intermedia: históricamente vota menos gente que en una presidencial. La columna baja es la referencia más prudente para planear la movilización.</p>`,
 meta:()=>`<b>Qué es</b><p>Meta mínima: un voto más que el rival estimado; con ella la probabilidad de ganar es cercana a 50 %. Meta 70 %: los votos con los que la probabilidad de ganar llega a 70 %, según cuánto se movieron los resultados de una elección a otra (2021 y 2024).</p><b>Por qué dos metas</b><p>La mínima es el piso. La de 70 % es la que conviene usar para planear; es la misma que usa la proyección.</p>`,
 ruta:()=>`<b>Qué es</b><p>Las secciones que hoy se perderían por menos votos, de la más cerrada a la menos cerrada, hasta sumar los votos que faltan para ganar (meta mínima). Para la meta de 70 % se indica cuántos votos más faltan.</p><b>Por qué en ese orden</b><p>Son las que piden menos votos por sección: el esfuerzo más pequeño para cubrir la brecha. Supone votos nuevos (gente que hoy no vota o no vota por ustedes); si el voto se le quita al rival, cuenta doble.</p>`,
 sit:()=>{const m=PR.mov||{};return `<b>Qué es</b><p>Qué conviene hacer en cada sección según la estimación: conservar (ganaría por 10 puntos o más), defender (ganaría por menos de 10), disputar (perdería por menos de 10; según el caso conviene movilizar a los suyos o convencer a votantes de otros) y contener (perdería por más de 10: que el rival no crezca). Voto duro: aun en su peor elección desde 2018, el partido sacó al menos 30% de los votos que se esperan. Cambian de partido: cambiaron de partido ganador entre las dos últimas elecciones en al menos 2 cargos (diputación local, federal, ayuntamiento).</p>${eValTxt()}<b>Por qué movilizar o convencer</b><p>Se revisaron ${m.n?m.n.toLocaleString('es-MX'):'miles de'} casos reales (2018 a 2024) en que un partido perdió una sección por menos de 10 puntos y la ganó en la siguiente elección. En ${m.base||27}% la ganó sacando a votar a más gente y en el resto quitándole votos al rival. Donde la participación quedó al menos ${Math.round((m.th||.2)*100)} puntos por debajo del máximo histórico de la sección, ${m.prec||67}% se ganó movilizando. Por eso: <b>movilizar</b> si la participación esperada está ${Math.round((m.th||.2)*100)} puntos o más por debajo de su mejor elección; si no, <b>convencer</b>.</p>`;}};
const ei=k=>`<button class="ei" data-ei="${k}" aria-label="Cómo se calcula" title="Cómo se calcula">i</button>`;
function eiPop(b){let p=$('eipop'); if(!p){p=document.createElement('div'); p.id='eipop'; p.className='eipop'; document.body.appendChild(p); document.addEventListener('click',e=>{if(!e.target.closest('.eipop,.ei')) p.hidden=true;}); document.addEventListener('keydown',e=>{if(e.key==='Escape') p.hidden=true;});}
  p.innerHTML=EINFO[b.dataset.ei]()+'<p class="es-f">Detalle técnico: pipeline/proyeccion.py e INSTRUCTIVO.</p>'; p.hidden=false; const r=b.getBoundingClientRect(),w=Math.min(340,innerWidth-24); p.style.width=w+'px'; p.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+'px'; const h=p.offsetHeight; p.style.top=(r.bottom+h+8>innerHeight?Math.max(8,r.top-h-8):r.bottom+8)+'px';}
/* meta mínima: un voto más que el rival; meta 70 %: la diferencia con la que la probabilidad de ganar llega a 70 %
   (z=0.5244 por la desviación de la diferencia entre dos fuerzas, la misma que usa la simulación de la proyección) */
const eM70=()=>{const s=(typeof MODELO!=='undefined'&&MODELO&&MODELO.sigma&&MODELO.sigma[st.es.obj])||{}; return +(.5244*Math.hypot(s.local||15,s.comun||10)).toFixed(1);};
function eMetas(d,niv){const e=eErr(niv),R=d.riv?d.riv.votes:0,mn=Math.round(R)+1,sg=Math.round(eSegOf(d))+1;
  return `<div class="es-mt"><div><span>Meta mínima ${ei('meta')}</span><b>${fmt(mn)}</b><small>votos: uno más que ${esc(d.rvN)}</small></div><div><span>Meta 70 %</span><b>${fmt(sg)}</b><small>votos: 70 % de probabilidad de ganar</small></div></div>`;}
function eRange(mg,niv){const e=eErr(niv),c=eConf(e); if(e==null) return ''; const lo=mg-e,hi=mg+e;
  return `<div class="es-rg"><span>Diferencia estimada <b>${pjTxt(mg)}</b>, rango ${pjTxt(lo)} a ${pjTxt(hi)} ${ei('rango')}</span><span>Confiabilidad <b class="es-stl ${c[1]}">${c[0]}</b> ${ei('proy')}</span>${lo<0&&hi>0?'<em>Empate técnico: el rango incluye ganar y perder.</em>':''}</div>`;}
const eConf=e=>e==null?['sin medir','mid']:e<=8?['alta','up']:e<=15?['media','mid']:['baja','dn'];
function eAgg(ii){const P=eP(),o={V:0,ln:0,em:0,pv:{}}; ii.forEach(i=>{const x=P[i]; if(!x) return; o.V+=x.V; o.ln+=x.ln; o.em+=x.ln*x.tp/100; for(const q in x.pv) o.pv[q]=(o.pv[q]||0)+x.pv[q];}); o.tp=o.ln?100*o.em/o.ln:0; return o;}
function eDuel27(ii,A){const g=eAgg(ii); if(!g.V) return null; const mine=sv(g.pv,A); if(!mine) return null; let riv=null;
  eRivBl(A).forEach(rem=>{const v=sv(g.pv,rem); if(!riv||v>riv.votes) riv={votes:v,members:rem,name:bnm(rem)};});
  return {g,mine,riv,rvN:riv?riv.name:'—',gap:riv?Math.round(riv.votes-mine):-Math.round(mine),mg:100*(mine-(riv?riv.votes:0))/g.V,a:100*mine/g.V,b:riv?100*riv.votes/g.V:0};}
function eWin27(ii){const g=eAgg(ii); if(!g.V) return null; const bl=eGenBl().map(ms=>({ms,v:sv(g.pv,ms),name:bnm(ms),lead:ms.slice().sort((a,b)=>(g.pv[b]||0)-(g.pv[a]||0))[0]})).sort((a,b)=>b.v-a.v);
  return {bl,lead:bl[0].lead,m:100*(bl[0].v-(bl[1]?bl[1].v:0))/g.V,mv:Math.round(bl[0].v-(bl[1]?bl[1].v:0)),a:100*bl[0].v/g.V,b:bl[1]?100*bl[1].v/g.V:0,g};}
/* resultado anterior del mismo cargo (solo referencia) */
function eHist(ii,A){const ek=eRef(),T=totals(ek,ii); if(!T.val) return null; if(!A){const w=winner(ek,ii); return w?`${esc(w.bl[0].name)} ganó por ${w.m.toFixed(1)} puntos`:null;}
  const mine=A.reduce((t,q)=>t+(T.tot[q]||0),0); let rv=0; T.bl.forEach(b=>{const rem=b.members.filter(m=>m!=='OTROS'&&!A.includes(m)); const v=rem.reduce((t,m)=>t+(T.tot[m]||0),0); if(v>rv) rv=v;});
  const m=100*(mine-rv)/T.val; return mine?`${A.length>1?'sumando sus votos, ':''}${esc(eSide(A))} ${m>=0?'habría ganado':'habría perdido'} por ${Math.abs(m).toFixed(1)} puntos`:`${esc(eSide(A))} no compitió`;}
const q67=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y); return a.length?a[Math.floor(2*a.length/3)]:Infinity;};
/* qué tanto acertaron las etiquetas por sección: calculadas con 2018–2021 y comparadas con 2024 (pipeline/val_secciones.py) */
function eValTxt(){const V=typeof MODELO!=='undefined'&&MODELO&&MODELO.sec; if(!V) return ''; const s=V.sit||{},d=V.duro||{},p=st.party,dp=p&&d[p];
  return `<b>¿Qué tanto aciertan?</b><p>Se probaron estimando 2024 solo con datos hasta 2021, en los 32 estados. Ganaron en 2024: ${s.seg?s.seg.gano+'% de las secciones "aseguradas"':''}${s.cui?', '+s.cui.gano+'% de las de "cuidar"':''}${s.mov?', '+s.mov.gano+'% de las de "movilizar o convencer"':''}${s.dif?' y '+s.dif.gano+'% de las "difíciles"':''}. Switcher: ${V.sw?V.sw.switcher+'% cambió de ganador en 2024, contra '+V.sw.resto+'% del resto':''}. Voto duro: ${Object.entries(d).filter(([q])=>['MORENA','PAN','PRI'].includes(q)||q===p).map(([q,x])=>`${NM[q]||q} lo sostuvo en ${x.sostuvo}% de sus secciones`).join(', ')}${dp&&dp.sostuvo<60?`. <b>Ojo:</b> el voto duro de ${NM[p]} se ha ido perdiendo; tómalo como piso histórico, no como seguro`:''}.</p>`;}
/* secciones: situación proyectada, voto duro, switcher y ruta (secciones a ganar en cada contienda) */
function eSecs(){const A=eAlly(),key=st.es.obj+'|'+(A?A.join('+'):'gen')+'|'+JSON.stringify(st.es.poll[st.es.obj]||null)+'|'+eRv(); if(ECACHE[key]){ERT=ECACHE[key].rt; return ECACHE[key];}
  const P=eP(),sumDuro=(ms,i)=>{let s=0,ok=false; ms.forEach(m=>{if(V2.duro[m]&&V2.duro[m][i]!=null){s+=V2.duro[m][i]; ok=true;}}); return ok?s:null;};
  const CR={},CT={},rt=new Set(); if(A) eContests().forEach(c=>{const d=eDuel27(c.ii,A); if(d){c.ii.forEach(i=>CR[i]=d); CT[c.k]={k:c.k,ii:c.ii,d};}});
  const L=[]; ALL.forEach(i=>{const x=P[i]; if(!x||!x.V) return; const b={i,ln:x.ln,V:x.V,sw:!!SW[i]};
    if(A){const cd=CR[i]; if(!cd) return; const mine=sv(x.pv,A),rv=cd.riv?sv(x.pv,cd.riv.members):0; Object.assign(b,{mine,rv,rvN:cd.rvN,mg:100*(mine-rv)/x.V,dp:sumDuro(A,i)}); b.cat=b.mg>=5?'gan':b.mg>-5?'dis':b.mg>-10?'pue':'per'; b.tp=x.tp; b.act=b.mg>=10?'seg':b.mg>=0?'cui':b.mg>-10?(((V2.maxT[i]||0)-x.tp)/100>=((PR.mov||{}).th||.2)?'mov':'con'):'dif';}
    else {const w=eWin27([i]); if(!w) return; const B=w.bl[0]; Object.assign(b,{mg:w.m,mv:w.mv,lead:w.lead,wn:B.name,sn:w.bl[1]?w.bl[1].name:'—',dp:sumDuro(B.ms,i)}); b.cat=b.mg<5?'com':b.mg<15?'med':'amp';}
    L.push(b);});
  L.forEach(x=>{const tp=P[x.i].tp; x.duro=x.dp!=null&&tp>0&&100*x.dp/tp>=30;}); const by={}; L.forEach(x=>by[x.i]=x);
  Object.values(CT).forEach(c=>{const d=c.d; let acc=0,n=0; const tg=d.gap;
    if(tg>0) c.ii.map(i=>by[i]).filter(x=>x&&x.rv>x.mine).sort((a,b)=>b.mg-a.mg).forEach(x=>{if(acc>=tg) return; x.add=Math.round(x.rv-x.mine)+1; acc+=x.add; x.ord=++n; rt.add(x.i);});
    Object.assign(c,{n,acc,st:d.gap<=0?'gana':d.mg>-5?'dis':d.mg>-10?'alc':'amplia'});});
  ERT=rt; return ECACHE[key]={L,by,A,CT,rt};}
const eMatch=(x,f)=>!f||(f==='duro'?x.duro:f==='sw'?x.sw:f==='rt'?!!x.add:(f==='pri'||f==='dis')?(x.act==='mov'||x.act==='con'):['mov','con','cui','seg','dif'].includes(f)?x.act===f:x.cat===f);
const eKeys=()=>st.party?EACT.concat(['rt','duro','sw']):['com','med','amp','duro','sw'];
const pjTxt=m=>m==null?'—':(m>=0?'+':'−')+Math.abs(m).toFixed(1)+' pts';
function eSelII(){const lv=eLv(); return st.es.u==null||lv==='est'?ALL:ALL.filter(i=>String(eKey(lv,i))===String(st.es.u));}
function eFocus(){const lv=eLv(),nat=eNat(),u=st.es.u; if(u!=null&&lv!=='est'&&lv!==nat) return {mode:'sub'}; if(nat==='est') return {mode:'con',k:0}; if(u!=null) return {mode:'con',k:+u}; return {mode:'multi'};}
/* ganador proyectado por unidad (colorear por ganador) */
const EWIN={};
/* cambio por sección: votación estimada 2027 de la alianza menos la que tuvo en la última elección del cargo (puntos) */
const EKC=[[5,'up2','#1C7F79','Crecería más de 5 pts'],[2,'up1','#7CC7BF','Crecería de 2 a 5'],[-2,'eq','#E3E8E8','Estable (±2)'],[-5,'dn1','#F5A47C','Bajaría de 2 a 5'],[-1e9,'dn2','#E4572E','Bajaría más de 5']];
function eChg(i){const A=eAlly(); if(!A) return null; const x=eP()[i],r=row(eRef(),i); if(!x||!x.V||!r||!r.val) return null; const a=100*sv(x.pv,A)/x.V,b=100*A.reduce((t,m)=>t+(r.v[m]||0),0)/r.val; return a-b;}
function eUnitWin(i){const lv=eLv(),key=st.es.obj+'|'+lv+'|'+JSON.stringify(st.es.poll[st.es.obj]||null)+'|'+eRv(); if(!EWIN[key]){EWIN[key]={}; (lv==='est'?[{k:0,ii:ALL}]:eGroups(lv)).forEach(u=>EWIN[key][u.k]=eWin27(u.ii));} return EWIN[key][eKey(lv,i)];}
METRICS.seg={party:1,est:1,n:'Estrategia',d:'',f:ii=>{const i=ii[0];
  if(st.es.col==='win'){const w=eUnitWin(i); return w?{c:C[w.lead],t:.4+.6*Math.min(1,w.m/20)}:null;}
  if(st.es.col==='chg'&&st.party){const c=eChg(i); return c==null?null:{c:EKC.find(z=>c>=z[0])[2],t:1};}
  const x=eSecs().by[i]; if(!x) return null; return {c:ECAT[st.party?eAct4(x.act):x.cat][2],t:st.es.seg&&!eMatch(x,st.es.seg)?.12:1};}};
const eObjN=()=>(EOBJ.find(o=>o[0]===st.es.obj)||EOBJ[0])[1]+' 2027';
/* recuadros por situación: filtran el mapa y la tabla */
function eTiles(ii,cls){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(Boolean);
  return `<div class="es-kp ${cls||''}">${eKeys().map(k=>{const n=xs.filter(x=>eMatch(x,k)).length; return `<button data-eseg="${k}" aria-pressed="${st.es.seg===k}" class="${k==='rt'?'krt':''}"><i style="background:${ECAT[k][2]}"></i><b>${fmt(n)}</b><span>${ECAT[k][0]}</span><small>${ECAT[k][1]}</small></button>`;}).join('')}</div>`;}
function eLegendHTML(){const E=eSecs(),ii=eSelII(),xs=ii.map(i=>E.by[i]).filter(Boolean),lvs={est:'estado',mun:'municipio',dl:'DL',df:'DF'}[eLv()];
  const tg=`<div class="es-tg"><button data-ecol="seg" aria-pressed="${st.es.col!=='win'}">${st.party?'Qué hacer':'Situación'}</button><button data-ecol="win" aria-pressed="${st.es.col==='win'}">Ganador por ${lvs}</button>${st.party?`<button data-ecol="chg" aria-pressed="${st.es.col==='chg'}">Cambio vs ${D.E[eRef()]?D.E[eRef()].year:''}</button>`:''}</div>`;
  if(st.es.col==='chg'&&st.party){const A=eAlly(),cnt={}; ii.forEach(i=>{const c=eChg(i); if(c!=null){const k=EKC.find(z=>c>=z[0])[1]; cnt[k]=(cnt[k]||0)+1;}});
    return `<div class="mcard es-leg"><small>${esc(eSide(A))} · ${esc(eObjN())} contra ${D.E[eRef()].year}</small>${tg}${EKC.map(z=>`<div class="es-li"><i style="background:${z[2]}"></i>${z[3]}<b>${fmt(cnt[z[1]]||0)}</b></div>`).join('')}<div class="es-n">Diferencia entre la votación estimada para 2027 y la que tuvo en ${D.E[eRef()].year}, en puntos</div></div>`;}
  if(st.es.col==='win'){const ws={}; (eLv()==='est'?[{k:0,ii:ALL}]:eGroups(eLv())).forEach(u=>{const w=eWin27(u.ii); if(w) ws[w.lead]=(ws[w.lead]||0)+1;});
    return `<div class="mcard es-leg"><small>Proyección · ${esc(eObjN())}</small>${tg}${Object.entries(ws).sort((a,b)=>b[1]-a[1]).map(([q,n])=>`<div class="es-li"><i style="background:${C[q]}"></i>${esc(NM[q])}${eBlocOf(q).length>1?' y aliados':''}<b>${n}</b></div>`).join('')}<div class="es-n">${ENN[eLv()][1]} que ganaría cada fuerza · la alianza toma el color de quien la encabeza</div></div>`;}
  const n=st.es.seg?xs.filter(x=>eMatch(x,st.es.seg)).length:0;
  return `<div class="mcard es-leg"><small>${st.party?esc(eSide(eAlly()))+' · ':''}Proyección ${esc(eObjN())}</small>${tg}${(()=>{const ks=eKeys(),main=ks.filter(k=>!['rt','duro','sw'].includes(k)),ex=ks.filter(k=>['rt','duro','sw'].includes(k)&&(k!=='rt'||xs.some(x=>x.add))),bt=k=>`<button data-eseg="${k}" aria-pressed="${st.es.seg===k}" title="${esc(ECAT[k][1])}"><i style="background:${ECAT[k][2]}"></i>${ECAT[k][0]}<b>${fmt(xs.filter(x=>eMatch(x,k)).length)}</b></button>`; return main.map(bt).join('')+(ex.length?`<div class="es-rs">Resaltar</div>`+ex.map(bt).join(''):'');})()}${st.es.seg?`<button class="es-open" data-eopen="1">Ver las ${fmt(n)} secciones en tabla</button>`:`<div class="es-n">Clic en una situación para resaltar sus secciones</div>`}</div>`;}
/* datos por unidad de un nivel (lista del panel y tabla) */
function eUnits(L){const A=eAlly(),E=eSecs(),nat=eNat(),sel=new Set(eSelII());
  return eGroups(L).filter(u=>u.ii.some(i=>sel.has(i))).map(u=>{const ii=u.ii.filter(i=>sel.has(i)),xs=ii.map(i=>E.by[i]).filter(Boolean),o={k:u.k,name:eName(L,u.k),sec:xs.length};
    if(A&&L===nat){const c=E.CT[u.k]; if(!c) return null; return Object.assign(o,{con:1,me:c.d.mine,rvN:c.d.rvN,rv:c.d.riv?c.d.riv.votes:0,meta:Math.round(c.d.riv?c.d.riv.votes:0)+1,gap:c.d.gap,mg:c.d.mg,n:c.n,st:c.st,h:eHist(c.ii,A)});}
    if(A){const cnt=k=>xs.filter(x=>x.act===k).length,rx=xs.filter(x=>x.add); return Object.assign(o,{seg:cnt('seg'),cui:cnt('cui'),mov:cnt('mov'),cnv:cnt('con'),dif:cnt('dif'),n:rx.length,add:rx.reduce((t,x)=>t+x.add,0),me:xs.reduce((t,x)=>t+x.mine,0),meta:Math.round(xs.reduce((t,x)=>t+x.mine,0))+rx.reduce((t,x)=>t+x.add,0)});}
    const w=eWin27(ii); if(!w) return null; return Object.assign(o,{wn:w.bl[0].name,lead:w.lead,sn:w.bl[1]?w.bl[1].name:'—',m:w.m,mv:w.mv,com:xs.filter(x=>x.cat==='com').length,h:eHist(ii,null)});}).filter(Boolean);}
function eUnitSort(U){const A=eAlly(); if(!A) return U.sort((a,b)=>a.m-b.m); if(U[0]&&U[0].con){const o={dis:0,alc:1,amplia:2,gana:3}; return U.sort((a,b)=>o[a.st]-o[b.st]||(a.st==='gana'?b.gap-a.gap:a.gap-b.gap));} return U.sort((a,b)=>b.n-a.n||(b.mov+b.cnv)-(a.mov+a.cnv));}
function ePjBar(a,b,an,bn){const tot=Math.max(100,a+b); return `<div class="es-pjb"><i style="width:${(100*a/tot).toFixed(1)}%"></i><u style="width:${(100*b/tot).toFixed(1)}%"></u></div><div class="es-pjl"><span>${esc(an)} <b>${a.toFixed(1)}%</b></span><span>${esc(bn)} <b>${b.toFixed(1)}%</b></span></div>`;}
/* la alianza más pequeña (hasta 3 aliados, sin el bloque rival) que ganaría la contienda en la proyección */
function eBestAlly(ii){const p=st.party,d0=eDuel27(ii,[p]); if(!d0) return null; const rl=d0.riv?d0.riv.members[0]:null,ex=new Set((EBL.bl.find(b=>b.includes(rl))||[rl]).concat(d0.riv?d0.riv.members:[])),pool=EPARTIES.filter(q=>q!==p&&!ex.has(q)); let best=null;
  const test=A=>{const d=eDuel27(ii,A); if(d&&(!best||(d.mg>=0&&best.d.mg<0)||((d.mg>=0)===(best.d.mg>=0)&&(d.mg>=0?A.length<best.A.length||(A.length===best.A.length&&d.mg>best.d.mg):d.mg>best.d.mg)))) best={A,d};};
  test([p]); pool.forEach((a,i)=>{test([p,a]); pool.slice(i+1).forEach((b,j)=>{test([p,a,b]); pool.slice(i+j+2).forEach(c=>test([p,a,b,c]));});}); return best;}
function eCompare(){const p=st.party,F=eFocus(),nat=eNat(); if(!p) return '';
  const A0=eAlly(),list=eScen(p),cur=eKeyA(A0); if(!list.some(A=>eKeyA(A)===cur)) list.push(A0);
  const multi=F.mode!=='con',cs=eContests(),c0=F.mode==='con'?(cs.find(c=>c.k===F.k)||{ii:ALL}):null,e=eErr(multi?nat:(nat==='est'?'est':nat));
  const card=A=>{const k=eKeyA(A),on=k===cur,lead=C[A[0]];
    if(multi){let w=0,al=0,emp=0; cs.forEach(c=>{const d=eDuel27(c.ii,A); if(!d) return; if(d.gap<=0) w++; else if(d.mg>-10) al++; if(e&&Math.abs(d.mg)<e) emp++;});
      return `<button class="es-sc${on?' on':''}" data-esa="${A.join('+')}"><small>${A.length>1?'Posible alianza':'Solo'}</small><b>${esc(eSide(A))}</b><div class="es-scn"><small>adelante en</small> <span class="num">${w}</span> de ${cs.length}</div><div class="es-scb">${cs.map(c=>{const d=eDuel27(c.ii,A); return `<i style="background:${d&&d.gap<=0?lead:d&&d.mg>-10?'var(--peach)':'var(--line)'}"></i>`;}).join('')}</div><em>${al?`+${al} a disputar`:'—'}</em></button>`;}
    const d=eDuel27(c0.ii,A); if(!d) return ''; const emp=e&&Math.abs(d.mg)<e;
    return `<button class="es-sc${on?' on':''}" data-esa="${A.join('+')}"><small>${A.length>1?'Posible alianza':'Solo'}</small><b>${esc(eSide(A))}</b><div class="es-scv"><span style="width:${Math.min(100,d.a).toFixed(1)}%;background:${lead}"></span><u style="width:${Math.min(100,d.b).toFixed(1)}%"></u></div><div class="es-scl"><span>${d.a.toFixed(1)}%</span><span>${esc(d.rvN)} ${d.b.toFixed(1)}%</span></div><em class="${d.mg>=0?'up':'dn'}">${d.mg>=0?'Ganaría por '+d.mg.toFixed(1)+' puntos':'Perdería por '+(-d.mg).toFixed(1)+' puntos'}</em></button>`;};
  return `<div class="es-h es-h2">Escenarios 2027 ${ei('esc')}</div><div class="es-scs">${list.map(card).join('')}</div>${multi?`<div class="es-sk"><span><i style="background:${C[p]}"></i>ganaría</span><span><i style="background:var(--peach)"></i>a disputar (perdería por menos de 10)</span><span><i style="background:var(--line)"></i>a contener</span></div>`:''}`;}
/* ===== panel en tres niveles: 1 la respuesta, 2 dónde trabajar, 3 detalle ===== */
const eNames=(L,all)=>{if(all&&L.length>1&&L.length===all) return 'cualquiera de sus posibles alianzas';const n=L.map(A=>A.slice(1).map(q=>NM[q]).join(' y ')); return n.length<2?n.join(''):n.slice(0,-1).join(', con ')+' o con '+n[n.length-1];};
function eSegOf(d){return d.riv?d.riv.votes+eM70()/100*d.g.V:0;}
function eGen(ii){const g=eAgg(ii); if(!g.V) return ''; return `<div class="es-gen"><div><b>${fmt(Math.round(g.ln))}</b><span>lista nominal vigente</span></div><div><b>${g.tp.toFixed(0)}%</b><span>participación esperada ${ei('part')}</span></div><div><b>${fmt(Math.round(g.V))}</b><span>votos válidos esperados</span></div></div>`;}
/* veredicto: etiqueta + dato grande + línea de apoyo */
const eV=(v,cls,big,lbl,sub)=>({v,cls,big,lbl,sub});
function eAnswer(){const p=st.party,A=eAlly(),E=eSecs(),F=eFocus(),lv=eLv(),nat=eNat(),NN=ENN[nat],ii=eSelII(),where=st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST;
  const sg=m=>(m>=0?'+':'−')+Math.abs(m).toFixed(1);
  if(!p){if(F.mode==='multi'){const U=eUnits(nat),ws={}; U.forEach(u=>{ws[u.lead]=(ws[u.lead]||0)+1;}); const o=Object.entries(ws).sort((a,b)=>b[1]-a[1]),half=Math.floor(U.length/2)+1;
      return eV(o[0]&&o[0][1]>=half?`${esc(NM[o[0][0]])} va adelante en la mayoría`:'Nadie va adelante en la mayoría',o[0]&&o[0][1]>=half?'up':'mid',`${o[0]?o[0][1]:0} de ${U.length}`,`${NN[1]} donde ${o[0]?esc(NM[o[0][0]]):'—'} va adelante hoy`,`${o.slice(1).map(([q,n])=>`${esc(NM[q])} ${n}`).join(' · ')}${o.length>1?' · ':''}${U.filter(u=>u.m<5).length} se deciden por menos de 5 puntos.`);}
    const w=eWin27(ii); if(!w) return eV('Sin datos','mid','—','',''); const e=eErr(F.mode==='con'?(nat==='est'?'est':nat):'est'),emp=e&&w.m<e;
    return eV(emp?'Va adelante · empate técnico':'Va adelante con ventaja',emp?'mid':'up',`${esc(NM[w.lead])} ${sg(w.m)} pts`,`sobre ${esc(w.bl[1]?w.bl[1].name:'—')}`,`${emp?`La diferencia es menor a ${e} puntos, lo que suele moverse de una elección a otra: empate técnico. `:''}Elige un partido para ver sus escenarios y su meta.`);}
  const me=esc(eSide(A)),cs=eContests(),list=eScen(p).filter(x=>eKeyA(x)!==eKeyA(A));
  if(F.mode==='multi'){const cnt=X=>cs.filter(c=>{const d=eDuel27(c.ii,X); return d&&d.gap<=0;}).length,w=cnt(A),best=list.map(X=>[X,cnt(X)]).sort((a,b)=>b[1]-a[1])[0],half=Math.floor(cs.length/2)+1;
    const e0=eErr(nat),dz=e0?cs.filter(c=>{const d=eDuel27(c.ii,A); return d&&Math.abs(d.mg)<e0;}).length:0,firm=cs.length-dz,inc=e0&&dz>=Math.ceil(cs.length/3);
    return eV(inc?'Resultado abierto':w>=half?'Ganaría la mayoría':'No alcanzaría la mayoría',inc?'mid':w>=half?'up':'dn',`${w} de ${cs.length}`,`${NN[1]} donde ${me} va adelante hoy`,(inc?`<b>${dz}</b> de ${cs.length} podrían cambiar de lado: su diferencia es menor a ${e0} puntos, lo que suele moverse un ${ENN[nat][0]} de una elección a otra. `:'')+(best&&best[1]>w?`Con ${eNames([best[0]])} llegaría a ${best[1]}.`:'Ninguna de sus posibles alianzas gana más.'));}
  if(F.mode==='sub'){const xs=ii.map(i=>E.by[i]).filter(Boolean),rx=xs.filter(x=>x.add); return eV(`${esc(eObjN())} se decide ${nat==='est'?'en todo el estado':'por '+NN[0]}`,'mid',`${xs.filter(x=>x.mg>0).length} de ${xs.length}`,`secciones que ganaría en ${esc(where)}`,rx.length?`Para ganar tendría que ganar ${rx.length} secciones más aquí.`:'Aquí no necesita ganar secciones adicionales.');}
  const c=E.CT[F.k]; if(!c) return eV('Sin datos','mid','—','',`Sin datos de ${esc(NM[p])} en este territorio.`);
  const d=c.d,rv=esc(d.rvN),e=eErr(nat==='est'?'est':nat),ok=X=>{const x=eDuel27(c.ii,X); return x&&x.mine>=eSegOf(x);},win=X=>{const x=eDuel27(c.ii,X); return x&&x.mg>0;},seguro=d.mine>=eSegOf(d),emp=e&&Math.abs(d.mg)<e;
  const v=seguro?'Ganaría con 70 % o más de probabilidad':d.mg>0?(emp?'Va adelante · empate técnico':'Ganaría, sin llegar a 70 %'):(emp?'Va atrás · empate técnico':'Perdería'),cls=seguro?'up':d.mg>0?'mid':emp?'mid':'dn';
  let t=''; if(!seguro){const L1=list.filter(ok),L2=list.filter(win); if(L1.length) t=`Con ${eNames(L1,list.length)} llegaría a 70 % de probabilidad.`; else if(d.mg<=0&&L2.length) t=`Con ${eNames(L2,list.length)} ganaría, aunque sin llegar a 70 %.`; else if(d.mg<=0){const ba=eBestAlly(c.ii); t=ba&&ba.d.mg>0?`Ninguna de sus alianzas recientes gana; la que ganaría es ${esc(eSide(ba.A))}.`:'Ninguna alianza de hasta 3 partidos gana con las tendencias actuales.';} else t='Ninguna de sus posibles alianzas llega a 70 % de probabilidad.';}
  return Object.assign(eV(v,cls,`${sg(d.mg)} pts`,`${d.mg>=0?'sobre':'detrás de'} ${rv}`,t),{c,d,e});}
/* participación observada en un año (mismo cargo si lo hubo; si no, promedio de las elecciones de ese año) en el territorio ii */
function eTpY(ii,y){const t=st.es.obj,ks=D.E[t+'_'+y]?[t+'_'+y]:Object.keys(D.E).filter(k=>+D.E[k].year===y); let T=0,L=0; ks.forEach(k=>ii.forEach(i=>{const r=row(k,i); if(r&&r.ln){T+=r.t; L+=r.ln;}})); return L?100*T/L:null;}
/* meta mínima con tres niveles de participación: mismas preferencias, distinta cantidad de votantes */
function eTpScen(ii,g,R){const ym=EYM,y0=ym-3,lo=eTpY(ii,y0),hi=eTpY(ii,ym); if(lo==null||hi==null||!g.tp) return '';
  const sc=[[`Como en ${y0}`,lo],['Estimada',g.tp],[`Como en ${ym}`,hi]].sort((a,b)=>a[1]-b[1]).map(([l,tp])=>({l,tp,m:Math.round(R*tp/g.tp)+1}));
  return `<div class="es-tps"><div class="h">Meta mínima según cuánta gente vote ${ei('tps')}</div><div class="r">${sc.map((x,j)=>`<div class="${x.l==='Estimada'?'on':''}"><span>${x.l}</span><b>${x.tp.toFixed(0)}%</b><em>${fmt(x.m)} votos</em></div>`).join('')}</div></div>`;}
/* bloque oscuro: rival, conclusión, dato grande, metas, barra, rango y confiabilidad */
function eDark(an,ii){const p=st.party,F=eFocus(),nat=eNat(),niv=F.mode==='con'?(nat==='est'?'est':nat):(p?nat:'est'),g=eAgg(ii),{L}=eProjW();
  let part=g.V?`<p class="es-part">Supone participación de ${g.tp.toFixed(0)}% sobre la lista nominal vigente (${fmt(Math.round(g.ln))} electores, ${esc(CORTE)}): unos ${fmt(Math.round(g.V))} votos válidos ${ei('part')}</p>`:'';
  let tag,p1,big,sub=an.sub||'',body='';
  if(an.d){const d=an.d,e=an.e,c=an.c,cx=c.ii.map(i=>eSecs().by[i]).filter(Boolean),R=d.riv?d.riv.votes:0,mn=Math.round(R)+1,sg=Math.round(eSegOf(d))+1,es=Math.round(d.mine),seguro=es>=sg,emp=e&&Math.abs(d.mg)<e;
    tag=(st.es.u!=null&&eLv()!=='est'?esc(eName(eLv(),st.es.u).split(' · ')[0])+' · ':'')+'compite contra '+esc(d.rvN); p1=`Con las tendencias actuales, ${esc(eSide(eAlly()))} ${d.mg>=0?'ganaría':'perdería'} ${esc(st.es.u!=null&&eLv()!=='est'?eName(eLv(),st.es.u):EST)} ${d.mg>=0?'a':'frente a'} ${esc(d.rvN)} por unos ${fmt(Math.abs(d.gap))} votos.`;
    big=''; sub=an.sub||'';
    body='';}
  else if(!p&&F.mode!=='multi'){const w=eWin27(ii); tag='Proyección 2027'; p1=w?`${esc(w.bl[0].name)} va adelante en ${esc(st.es.u!=null&&eLv()!=='est'?eName(eLv(),st.es.u):EST)} por ${w.m.toFixed(1)} puntos sobre ${esc(w.bl[1]?w.bl[1].name:'—')}.`:'Sin datos.'; big=an.v.includes('empate')?'Empate técnico':'Ventaja clara';
    body=w?`<div class="es-pj">${ePjBar(w.a,w.b,w.bl[0].name,w.bl[1]?w.bl[1].name:'—')}${eRange(w.m,niv)}${part}</div><div class="es-ref">Referencia ${esc(eLabel(L))}: ${eHist(ii,null)||'—'}.</div>`:'';}
  else {tag=p?'Compite contra la fuerza más fuerte de cada '+ENN[nat][0]:'Proyección 2027'; p1=`${an.v}.`; big=an.big; sub=`${an.lbl}. ${an.sub||''}`; const e=eErr(nat);
    if(p&&typeof pjRun==='function'){const R=pjRun(st.es.obj,ii,p,0); if(R&&!R.none&&R.n>1){big=''; sub=''; part='';}}
    body=!p?(e&&eConf(e)[1]==='dn'?`<p class="es-part">El rango es amplio porque en ${ENN[nat][1]} los resultados se mueven mucho de una elección a otra; con encuestas se cierra. ${ei('proy')}</p>`:'')+part:'';}
  return `<div class="es-meta"><span class="es-tag">${tag}</span>${p?eCorto(true):`<p>${p1}</p>`}${big?`<div class="es-big${String(big).length>9?' sm':''}"><b>${big}</b></div>`:''}${sub?`<p class="es-sub">${sub}</p>`:''}${p?'<button class="es-pjdet" data-pjdet="in">Abrir proyección completa ›</button>':''}${body}</div>`;}
function ePanoCards(ii){const w=eWin27(ii); if(!w) return ''; const top=w.bl.slice(0,4);
  return `<div class="es-h es-h2">Estimación por fuerza política</div><div class="es-scs">${top.map((b,j)=>`<button class="es-sc" data-epar="${b.lead}"><small>${j===0?'Va adelante':(j+1)+'.º lugar'}</small><b>${esc(b.name)}</b><div class="es-scv"><span style="width:${(100*b.v/w.g.V).toFixed(1)}%;background:${C[b.lead]}"></span></div><div class="es-scl"><span>${(100*b.v/w.g.V).toFixed(1)}% de los votos</span></div><em class="mid">Ver sus escenarios →</em></button>`).join('')}</div>`;}
function eGoal(d,e,me){const R=d.riv?d.riv.votes:0,mn=Math.round(R)+1,sg=Math.round(eSegOf(d))+1,es=Math.round(d.mine),top=Math.max(sg,es)*1.04;
  const row=(lbl,v,sub)=>{const ok=es>=v; return `<div class="gr"><div><span>${lbl}</span><small>${sub}</small></div><div class="gv"><b>${fmt(v)}</b><em class="${ok?'ok':'no'}">${ok?'✓ ya los tendría':'faltan '+fmt(v-es)}</em></div></div>`;};
  return `<div class="es-goal"><div class="gh">Votos que necesita ${esc(me)} ${ei('meta')}</div>
   <div class="pb"><i style="width:${(100*es/top).toFixed(1)}%"></i><s style="left:${(100*mn/top).toFixed(1)}%"><u>ganar</u></s><s style="left:${(100*sg/top).toFixed(1)}%"><u style="transform:translateX(-85%)">70 %</u></s></div>
   <div class="gn">Votos que hoy tendría según la estimación: <b>${fmt(es)}</b></div>
   ${row('Para ganar',mn,'un voto más que '+esc(d.rvN))}${row('Para 70 % de probabilidad',sg,'ventaja de '+eM70()+' puntos sobre '+esc(d.rvN))}</div>`;}
function eSummary(ii,an){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(Boolean),N=xs.length,c=k=>xs.filter(x=>x.act===k).length,G=c('seg')+c('cui'),D=xs.filter(x=>x.mg>=0&&x.duro).length,L=c('mov')+c('con'),F=c('dif'),R=xs.filter(x=>x.add).length;
  return `<div class="es-sum"><div class="es-sbar">${EACT.slice().reverse().filter(k=>k!=='dif').concat(['dif']).map(k=>{const n=k==='dis'?L:c(k); return n?`<i style="flex:${n};background:${ECAT[k][2]}" title="${ECAT[k][0]}: ${n}"></i>`:''}).join('')}</div>
   <p>De <b>${fmt(N)}</b> secciones: ganaría <b>${fmt(G)}</b> (<b>${fmt(D)}</b> con voto duro${(()=>{const x=typeof MODELO!=='undefined'&&MODELO&&MODELO.sec&&MODELO.sec.duro&&MODELO.sec.duro[st.party]; return x?`, que entre 2021 y 2024 se sostuvo en ${x.sostuvo}% de los casos`:'';})()}), perdería por menos de 10 puntos en <b>${fmt(L)}</b> y <b>${fmt(F)}</b> las perdería por más (contener).${R?` Para ganar (meta mínima) tendría que ganar <b>${fmt(R)}</b> de las secciones que hoy perdería.`:''}${an&&an.d?(()=>{const f=Math.round(eSegOf(an.d,an.e))+1-Math.round(an.d.mine); return f>0?` Para llegar a 70 % de probabilidad le faltarían unos <b>${fmt(f)}</b> votos: las secciones a disputar son donde conviene buscarlos.`:' Ya tendría 70 % o más de probabilidad: lo prioritario es defender lo que ganaría.';})():''}</p></div>`;}
function eActs(ii){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(Boolean);
  const t=k=>`<button class="es-ac${st.es.seg===k?' on':''}" data-eseg="${k}" title="${esc(ECAT[k][1])}"><i style="background:${ECAT[k][2]}"></i><b>${fmt(xs.filter(x=>eMatch(x,k)).length)}</b><span>${ECAT[k][0]}</span><small>${({dis:(()=>{const m=xs.filter(x=>x.act==='mov').length,n=xs.filter(x=>x.act==='con').length; return `perdería por menos de 10 · ${fmt(m)} movilizar, ${fmt(n)} convencer`;})(),cui:'ganaría por menos de 10 puntos',seg:'ganaría por 10 puntos o más',dif:'perdería por más de 10 puntos'})[k]}</small></button>`;
  const nm=xs.filter(x=>x.act==='mov').length,nc=xs.filter(x=>x.act==='con').length,note=nm+nc>=10&&nm<.1*(nm+nc)?`<p class="es-hint">Casi todas las secciones cerradas se ganan convenciendo: solo ${nm} tiene${nm===1?'':'n'} mucha gente que dejó de votar ${ei('sit')}</p>`:nc+nm>=10&&nc<.1*(nm+nc)?`<p class="es-hint">Casi todas las secciones cerradas se ganan movilizando ${ei('sit')}</p>`:'';
  return `<div class="es-acs">${EACT.map(t).join('')}</div>${note}<div class="es-also"><span>Resaltar:</span>${['rt','duro','sw'].filter(k=>k!=='rt'||xs.some(x=>x.add)).map(k=>`<button data-eseg="${k}" aria-pressed="${st.es.seg===k}">${ECAT[k][0]} <b>${fmt(xs.filter(x=>eMatch(x,k)).length)}</b></button>`).join('')}</div>`;}
function ePri(ii){const E=eSecs(),xs=ii.map(i=>E.by[i]).filter(x=>x&&(x.act==='mov'||x.act==='con')).sort((a,b)=>(a.rv-a.mine)-(b.rv-b.mine));
  if(!xs.length) return '<p class="es-hint">No hay secciones prioritarias: en ninguna perdería por menos de 10 puntos.</p>';
  return `<div class="es-pri">${xs.slice(0,3).map(x=>{const f=Math.round(x.rv-x.mine)+1; return `<button data-esec="${x.i}"><b>${S[x.i].s}</b><span>${esc(MUN[S[x.i].m])}<small>${f<=1?'empate':'faltan '+fmt(f)+' votos'} · participación esperada ${x.tp.toFixed(0)}%</small></span><em class="tg ${x.act}">${ECAT[x.act][0]}</em></button>`;}).join('')}</div><button class="es-tb" id="epri">Ver las ${fmt(xs.length)} secciones prioritarias</button>`;}
function eDetail(A0){const p=st.party,F=eFocus(),nat=eNat(),ii=eSelII(),{L}=eProjW(),poll=st.es.poll[st.es.obj];let rg='';
  if(p&&F.mode==='con'){const c=eSecs().CT[F.k]; if(c) rg=eRange(c.d.mg,nat==='est'?'est':nat)+`<div class="es-dr"><span>Referencia ${esc(eLabel(L))}</span><small>${eHist(c.ii,A0)||'—'}</small></div>`;}
  else if(!p){const w=eWin27(ii); if(w) rg=eRange(w.m,F.mode==='con'?(nat==='est'?'est':nat):'est')+`<div class="es-dr"><span>Referencia ${esc(eLabel(L))}</span><small>${eHist(ii,null)||'—'}</small></div>`;}
  else {const e=eErr(nat); rg=`<div class="es-dr"><span>Rango probable por ${ENN[nat][0]}</span><small>${e??'—'} puntos · confiabilidad ${eConf(e)[0]} ${ei('proy')}</small></div>`;}
  return `<details class="es-lv3" ${st.es.detOpen?'open':''}><summary>Cómo se calculó</summary>
   <div class="es-dr"><span>Alianzas</span><small>el partido que más aporta completo y sus aliados al 70 % ${ei('alianza')}</small></div><div class="es-dr"><span>Rivales</span><small>${eOfi()?'alianzas registradas 2027':eRv()==='ali'?'en posible alianza':'cada partido por separado'} ${ei('rival')}</small></div><div class="es-dr"><span>Cómo se calcula la proyección</span><small>${ei('proy')}</small></div>
   ${ePollHTML()}
   <p class="es-f">Estimación propia (no es una encuesta). INE, resultados por sección de ${esc(eLabel(L))} y de ${EYM}; ${esc(SRC.pad||'lista nominal')}. Sin ${NOREG.map(q=>NM[q]||q).join(', ')} (sin registro en 2027; sus votos van a los partidos con los que fueron en alianza en su última elección, o en proporción si fueron solos). Sin historial, no se estiman: ${ENEW.join(', ')}.${poll&&poll.v?' Ajustada con la encuesta capturada.':''}</p></details>`;}
function estPanel(){const p=st.party,lv=eLv(),nat=eNat(),ii=eSelII(),F=eFocus();
  const chips=(L,cur,attr)=>L.map(x=>`<button data-${attr}="${x[0]}" aria-pressed="${cur===x[0]}">${x[1]}</button>`).join('');
  const A0=eAlly(),sumTxt=`${esc(eObjN())} · ${p?esc(eSide(A0))+(A0.length>1?(eOfBl(p)&&eKeyA(eOfBl(p))===eKeyA(A0)?' (alianza registrada)':' (posible alianza)'):''):'Panorama sin partido'} · ${eOfi()?'alianzas registradas 2027':'rivales '+(eRv()==='ali'?'en posible alianza':'por separado')}`;
  let h=`<div class="colh"><button class="es-back" id="eback">← Volver al mapa</button><b style="margin-left:8px">Estrategia 2027</b></div><div class="cd es">`;
  h+=`<details class="es-cfg" ${st.es.cfgOpen===true?'open':''}><summary><span>Cambiar elección, rivales o territorio</span><b>${sumTxt} · ${esc(st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST)}</b></summary>`;
  h+=`<div class="es-row"><span>¿Qué se elige en 2027 en ${esc(EST)}?</span><div class="es-ch">${chips(EOBJ.map(x=>[x[0],x[1]]),st.es.obj,'eobj')}</div></div>`;
  h+=`<div class="es-row"><span>Supuesto sobre los rivales ${ei('rival')}</span><div class="es-ch"><button data-erv="sep" aria-pressed="${!eOfi()&&eRv()!=='ali'}" ${ESPL.length||eOfi()?'disabled':''}>Cada partido por separado</button><button data-erv="ali" aria-pressed="${!eOfi()&&eRv()==='ali'}" ${eOfi()?'disabled':''}>En posible alianza (como en ${EBL.year})</button></div></div>${eOfi()?`<p class="es-hint">Para ${esc(eObjN())} hay alianzas registradas por el equipo: ${eOfi().filter(b=>b.length>1).map(b=>b.map(m=>NM[m]||m).join('-')).join(' y ')}. Mandan sobre este supuesto.</p>`:''}${ESPL.length?`<p class="es-hint">${ESPL.map(b=>b.map(m=>NM[m]).join('-')).join(' y ')} ${ESPL.length>1?'compitieron':'compitió'} en candidatura común desde 2021: el voto del candidato común no se puede separar por partido, así que se analiza${ESPL.length>1?'n':''} como coalición.</p>`:''}`;
  if(p) h+=`<div class="es-row"><span>Armar otra alianza para ${esc(NM[p])}</span><div class="es-ch">${EPARTIES.filter(q=>q!==p).map(q=>`<button data-eal="${q}" aria-pressed="${A0.includes(q)}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`;
  const lvs=Object.keys(ELV).filter(k=>k==='est'?nat==='est':true),G=lv==='est'?[]:eGroups(lv).sort((a,b)=>lv==='mun'?String(MUN[a.k]).localeCompare(MUN[b.k]):a.k-b.k);
  h+=`<div class="es-row es-terr"><span>Territorio</span><div class="es-ch">${chips(lvs.map(k=>[k,k==='est'?EST:ELV[k]]),lv,'elv')}</div>${lv!=='est'?`<select class="es-sel" data-eunit="1"><option value="">${lv===nat?'Todos los '+ENN[lv][1]:'Todo '+EST+' (por '+ENN[lv][0]+')'}</option>${G.map(u=>`<option value="${u.k}" ${String(st.es.u)===String(u.k)?'selected':''}>${esc(eName(lv,u.k))}</option>`).join('')}</select>`:''}</div></details>`;
  h+=`<div class="es-row es-pick"><span>¿Qué partido analizamos?</span><div class="es-ch"><button data-epar="" aria-pressed="${!p}">Todos (panorama)</button>${EPARTIES.map(q=>`<button data-epar="${q}" aria-pressed="${p===q}"><i style="background:${C[q]}"></i>${NM[q]}</button>`).join('')}</div></div>`;
  /* nivel 1: lectura para quien decide ("en corto" dentro del bloque oscuro), proyección resumida y congreso */
  const an=eAnswer(),aRel=st.es.obj==='AYU'&&p;
  h+=`${aRel?'<span class="es-badge">Mapa de fuerza · no es un pronóstico</span>':''}${eDark(an,ii)}`;
  if(!p&&typeof pjCard==='function') h+=pjCard(null,ii,true);
  if(typeof congHTML==='function'&&(st.es.u==null||eLv()==='est')) h+=congHTML();
  h+=p?eCompare():ePanoCards(ii);
  /* nivel 2 */
  h+=`<section class="es-lv2"><div class="es-h">${p?'Dónde trabajar':'Dónde se decide'} ${ei('sit')}${p?ei('ruta'):''}</div>`;
  if(p) h+=eSummary(ii,an)+eActs(ii)+ePri(ii); else h+=eTiles(ii)+`<button class="es-tb" id="etab">Ver tabla de secciones</button>`;
  if(lv!=='est'&&st.es.u==null){const U=eUnitSort(eUnits(lv)); h+=`<div class="es-h">Por ${ENN[lv][0]}</div><div class="es-ul">${U.map(z=>eUnitBtn(z)).join('')}</div>`;}
  if(p) h+=`<button class="es-x es-all" id="etab">Ver todas las secciones y metas</button><div class="es-dl" id="esdl"><button data-secdl="1">⤓ Descargar secciones (Excel)</button><button data-ficha="1">🖨 Ficha para imprimir</button></div>`;
  else h+=`<div class="es-dl" id="esdl"><button data-secdl="1">⤓ Descargar secciones (Excel)</button></div>`;
  h+=`</section>`;
  /* nivel 3 */
  h+=eDetail(A0)+`</div>`;
  return h;}
/* escenario "intermedia como 2021": en la intermedia de 2021 la coalición del gobierno federal (Morena, PT y PVEM) bajó
   de 47.5 % a 44.3 % en diputaciones federales de todo el país respecto a 2018 (perdió 6.7 % de su votación). El
   escenario aplica esa misma pérdida a su estimación 2027 en este estado y la reparte entre los demás en proporción.
   Se usa el cambio nacional, no el de cada estado, porque el estatal mezcla fenómenos locales (p. ej. el ascenso de MC
   en Campeche). Es un escenario con lógica histórica, no un pronóstico. */
const EMID={f:.933,gov:['MORENA','PT','PVEM']};
function eMid21(){const o=st.es.obj,sv0=st.es.poll[o]; delete st.es.poll[o]; const P=eP(o); if(sv0) st.es.poll[o]=sv0;
  const T={}; let V=0; P.forEach(x=>{if(!x) return; V+=x.V; for(const q in x.pv) T[q]=(T[q]||0)+x.pv[q];}); if(!V) return null;
  const g=EMID.gov.reduce((a,q)=>a+(T[q]||0),0)/V,lost=g*(1-EMID.f),oth=1-g,v={};
  for(const q in T){const sh=T[q]/V; v[q]=Math.round(1000*(EMID.gov.includes(q)?sh*EMID.f:sh*(oth?1+lost/oth:1)))/10;} return v;}
/* "En corto": tres líneas para quien decide (situación, riesgo, qué hacer), con los mismos cálculos de abajo */
function eCorto(){/* se muestra dentro del bloque oscuro */const p=st.party; if(!p) return ''; const A=eAlly(),E=eSecs(),nat=eNat(),ii=eSelII(),e=eErr(nat),me=eSide(A),NN=ENN[nat],all=ii===ALL||ii.length===ALL.length;
  const L1=[],xs=ii.map(i=>E.by[i]).filter(Boolean);
  if(all&&nat!=='est'){const cs=eContests().map(c=>({c,d:eDuel27(c.ii,A)})).filter(x=>x.d),w=cs.filter(x=>x.d.gap<=0).length,cl=cs.filter(x=>e&&Math.abs(x.d.mg)<e).sort((a,b)=>Math.abs(a.d.mg)-Math.abs(b.d.mg)),half=Math.floor(cs.length/2)+1;
    const pr=st.es.obj==='DIPL'&&typeof congProb==='function'?congProb(p):null,R=typeof pjRun==='function'?pjRun(st.es.obj,ii,p,0):null,ok=R&&!R.none;
    L1.push(['Situación',ok?`${R.likely===R.lead?`Según la proyección, ${esc(me)} ganaría <b>${R.likely} de ${R.n}</b> ${NN[1]}`:`${esc(me)} va adelante en ${R.lead} de ${R.n} ${NN[1]}, pero en muchos por poco: lo esperable es que gane unos <b>${R.likely}</b>`} (rango probable: ${R.lo} a ${R.hi})${pr?'':`; probabilidad de ganar la mayoría: <b>${Math.round(100*R.pMaj)} %</b>`}.`:`${esc(me)} va adelante hoy en <b>${w} de ${cs.length}</b> ${NN[1]}.`]);
    if(ok){const jj=R.U.filter(u=>u.p>.35&&u.p<.65).sort((a,b)=>Math.abs(a.p-.5)-Math.abs(b.p-.5)),nm=u=>esc(pjName(st.es.obj,u.k).split(' · ')[0].replace(/^Distrito (local|federal) /,'distrito '));
      L1.push(['Riesgo',jj.length||R.cat.pro?`${jj.length?`<b>${jj.length}</b> ${jj.length===1?NN[0]+' está':NN[1]+' están'} en juego (entre 35 y 65 % de probabilidad)${jj.length?': '+jj.slice(0,3).map(nm).join(', '):''}`:''}${jj.length&&R.cat.pro?'; ':''}${R.cat.pro?`<b>${R.cat.pro}</b> son probables pero aún podría perderlos`:''}.`:`Ningún ${NN[0]} está en juego.`]);}}
  else if(nat!=='est'&&st.es.u!=null&&eLv()!==nat){/* un municipio o distrito de otro nivel dentro de una elección por distritos o municipios: decir en cuáles cae y cómo iría en cada uno */
    const ks=[...new Set(ii.map(i=>eKey(nat,i)))].filter(k=>E.CT[k]),vt=d=>`${d.gap<=0?'ganaría a':'perdería frente a'} ${esc(d.rvN)} por aprox. ${fmt(Math.round(Math.abs(d.gap)/100)*100)} votos`;
    L1.push(['Situación',`${esc(eName(eLv(),st.es.u).split(' · ')[0])} está en ${ks.length===1?'el':'los'} ${ks.length===1?NN[0]:ks.length+' '+NN[1]}: ${ks.slice(0,4).map(k=>`<b>${esc(eName(nat,k).split(' · ')[0])}</b>, donde ${esc(me)} ${vt(E.CT[k].d)}`).join('; ')}${ks.length>4?'; y otros '+(ks.length-4):''}.`]);
    L1.push(['Riesgo',`Aquí no se elige un cargo propio: lo que cuenta es el resultado de ${ks.length===1?'ese '+NN[0]:'esos '+NN[1]}. Las secciones de abajo son las de este territorio.`]);}
  else {const c=E.CT[st.es.u!=null&&eLv()===nat?st.es.u:0]||Object.values(E.CT)[0],d=c&&c.d; if(d){const emp=e&&Math.abs(d.mg)<e;
    const R1=typeof pjRun==='function'?pjRun(st.es.obj,c.ii,p,0,800):null,pw=R1&&!R1.none&&R1.n===1?R1.U[0].p:null,pl=pw==null?'':pw>=.85?'muy probable':pw>=.6?'probable':pw>=.4?'casi empate':pw>=.15?'difícil':'muy difícil';
    const wh=st.es.u!=null&&eLv()===nat&&nat!=='est'?eName(nat,st.es.u):(nat==='est'?EST:null); L1.push(['Situación',`Según la proyección, ${wh?`en <b>${esc(wh)}</b> `:''}${esc(me)} ${d.gap<=0?'ganaría a':'perdería frente a'} ${esc(d.rvN)} por aprox. <b>${fmt(Math.round(Math.abs(d.gap)/100)*100)}</b> votos (${d.a.toFixed(1)} % contra ${d.b.toFixed(1)} %).`]);
    if(pw!=null) L1.push(['Riesgo',`Probabilidad de ganar: <b>${Math.round(100*pw)} %</b>, ${pl}. ${pw>=.4&&pw<.6?'La ventaja puede voltearse con poco.':pw>=.6?'Hay ventaja, pero no está asegurada.':'Necesitaría crecer más de lo habitual.'}`]);}}
  const D=typeof MODELO!=='undefined'&&MODELO&&MODELO.sec&&MODELO.sec.duro&&MODELO.sec.duro[p]; if(D&&D.sostuvo<60) L1[1]&&(L1[1][1]+=` El voto duro de ${esc(NM[p])} solo se sostuvo en ${D.sostuvo}% de las secciones entre 2021 y 2024.`);
  const mov=xs.filter(x=>x.act==='mov'),con=xs.filter(x=>x.act==='con'),cui=xs.filter(x=>x.act==='cui'),need=x=>Math.max(0,Math.round(x.rv-x.mine)+1);
  const vm=mov.reduce((a,x)=>a+need(x),0),vc=con.reduce((a,x)=>a+need(x),0);
  const qh=[]; if(mov.length+con.length) qh.push(`disputar <b>${fmt(mov.length+con.length)}</b> ${mov.length+con.length===1?'sección':'secciones'} que perdería por poco (${fmt(vm+vc)} votos): en ${fmt(mov.length)} movilizar y en ${fmt(con.length)} convencer`); if(cui.length) qh.push(`defender <b>${fmt(cui.length)}</b> que ganaría por menos de 10 puntos`);
  const qt=qh.length?qh.join('; ').replace(/^./,c=>c.toUpperCase())+'. Las secciones están abajo, en "Dónde trabajar".':'No hay secciones cerradas: aquí gana o pierde por más de 10 puntos en todas. Mantener la estructura y vigilar la participación.';
  L1.push(['Qué hacer',qt]);
  return `<div class="es-cor">${L1.map(([t,x])=>`<div><span>${t}</span><p>${x}</p></div>`).join('')}</div>`;}
function ePollHTML(){const o=st.es.obj,P=st.es.poll[o]||{},v=P.v||{},on=!!P.v;
  return `<details class="es-poll" ${st.es.pollOpen||on?'open':''}><summary>${P.mid?'Escenario: intermedia como 2021':P.of?`Ajustada con ${P.of.n===1?'1 encuesta':'el promedio de '+P.of.n+' encuestas'}`:on?'Ajustada con tu encuesta':'Ajustar con una encuesta'} ${ei('enc')}</summary>${P.of?`<p class="es-hint">Registradas por el equipo: ${P.of.lista.map(x=>esc(x.casa)+' ('+x.fecha+', '+fmt(x.n)+' entrevistas)').join('; ')}. Pesan más las recientes y las de muestra más grande. Si cambias un valor, el cambio solo se ve en tu pantalla.</p>`:`<p class="es-hint">Porcentaje estatal de cada partido según la encuesta (voto efectivo). Deja en blanco los que no reporte.${on?' Este ajuste solo se ve en tu pantalla.':''}</p>`}<div class="es-pf">${EPARTIES.map(q=>`<label><i style="background:${C[q]}"></i>${NM[q]}<input type="number" min="0" max="100" step="0.1" id="ep_${q}" data-epq="${q}" value="${v[q]??''}"></label>`).join('')}<label>Margen de error ±<input type="number" min="0.5" max="10" step="0.1" id="ep_moe" value="${P.moe??3}"></label></div><div class="es-pb"><button class="es-x" id="epapply">Aplicar encuesta</button>${on?'<button class="es-x" id="epclear">Quitar</button>':''}${`<button class="es-x" id="epmid" title="Morena, PT y PVEM pierden lo mismo que perdieron en la intermedia de 2021 frente a 2018 en todo el país (6.7 % de su votación). Es un escenario, no un pronóstico.">Escenario: intermedia como 2021</button>`}</div>${P.mid?'<p class="es-hint">Escenario "intermedia como 2021": Morena, PT y PVEM pierden el 6.7 % de su votación, lo mismo que perdieron en todo el país de 2018 a 2021, y eso se reparte entre los demás. Sirve para ver qué pasaría si se repite el desgaste de media elección; no es un pronóstico.</p>':''}</details>`;}
function eUnitBtn(z){const A=eAlly(); let r,s;
  if(!A){r=`<em>${z.m.toFixed(1)} pts</em>`; s=`${esc(z.wn)} sobre ${esc(z.sn)}${z.h?' · antes: '+z.h:''}`; return `<button data-eu="${z.k}"><span><i class="es-d" style="background:${C[z.lead]}"></i>${esc(z.name)}</span>${r}<small>${s}</small></button>`;}
  if(z.con){const e=eErr(eNat()); r=`<em class="${ESTL[z.st][1]}">${z.gap>0?'faltan '+fmt(z.gap):'gana +'+fmt(-z.gap)}</em>`; s=`contra ${esc(z.rvN)} · meta ${fmt(z.meta)} votos${z.gap>0?' · ganar '+fmt(z.n)+' secciones · '+ESTL[z.st][0].toLowerCase():''}${e&&Math.abs(z.mg)<e?' · empate técnico':''}`;}
  else {r=`<em>${fmt(z.n)} a ganar</em>`; s=`${z.sec} secciones · ${z.seg+z.cui} ganaría · ${z.mov+z.cnv} a disputar`;}
  return `<button data-eu="${z.k}"><span>${esc(z.name)}</span>${r}<small>${s}</small></button>`;}
/* tabla: secciones o unidades, con recuadros que filtran, orden, búsqueda y CSV */
function eCols(tab){const A=eAlly(),me=A?esc(eSide(A)):'',dot=x=>{const k=A?x.act:x.cat; return `<i class="es-d" style="background:${ECAT[k][2]}"></i>${ECAT[k][0]}`;},si=x=>x?'Sí':'',R=Math.round;
  if(tab==='sec'){const b=[['s','Sección',r=>S[r.i].s,r=>S[r.i].s,1],['mun','Municipio',r=>esc(MUN[S[r.i].m]),r=>MUN[S[r.i].m]],['dl','DL',r=>S[r.i].dl,r=>S[r.i].dl,1],['df','DF',r=>S[r.i].df,r=>S[r.i].df,1],['cat',A?'Qué hacer':'Situación 2027',dot,r=>A?EACT.indexOf(r.act):r.cat]];
    if(A) return [['ord','Prioridad',r=>r.ord||'—',r=>r.ord||1e9,1]].concat(b,[['duro','Voto duro',r=>si(r.duro),r=>r.duro?0:1],['sw','Switcher',r=>si(r.sw),r=>r.sw?0:1],['ln','Lista nominal',r=>fmt(r.ln),r=>r.ln,1],['mine','Votos proyectados '+me,r=>fmt(R(r.mine)),r=>r.mine,1],['rvN','Rival',r=>esc(r.rvN),r=>r.rvN],['rv','Votos proyectados del rival',r=>fmt(R(r.rv)),r=>r.rv,1],['dif','Diferencia',r=>{const d=R(r.mine-r.rv); return `<span class="${d>=0?'up':'dn'}">${d>=0?'+':''}${fmt(d)}</span>`;},r=>r.mine-r.rv,1],['tp','Participación esperada',r=>r.tp.toFixed(0)+'%',r=>r.tp,1],['meta','Meta 2027 (votos)',r=>`<b>${fmt(r.mg>0?R(r.mine):R(r.rv)+1)}</b>`,r=>r.mg>0?r.mine:r.rv+1,1]]);
    return b.concat([['wn','Adelante',r=>esc(r.wn),r=>r.wn],['sn','Segundo',r=>esc(r.sn),r=>r.sn],['mg','Ventaja (pts)',r=>r.mg.toFixed(1),r=>r.mg,1],['mv','Ventaja (votos)',r=>fmt(r.mv),r=>r.mv,1],['duro','Voto duro del primero',r=>si(r.duro),r=>r.duro?0:1],['sw','Switcher',r=>si(r.sw),r=>r.sw?0:1],['ln','Lista nominal',r=>fmt(r.ln),r=>r.ln,1]]);}
  const nm=[['name',ELV[tab],r=>esc(r.name),r=>tab==='mun'?r.name:r.k]];
  if(!A) return nm.concat([['wn','Adelante en 2027',r=>`<i class="es-d" style="background:${C[r.lead]}"></i>${esc(r.wn)}`,r=>r.wn],['sn','Segundo',r=>esc(r.sn),r=>r.sn],['m','Ventaja (pts)',r=>r.m.toFixed(1),r=>r.m,1],['mv','Ventaja (votos)',r=>fmt(r.mv),r=>r.mv,1],['com','Secciones competidas',r=>fmt(r.com),r=>r.com,1],['h','Resultado '+eYear(),r=>r.h||'—',r=>r.h||'']]);
  if(tab===eNat()) return nm.concat([['me','Votos proyectados '+me,r=>fmt(R(r.me)),r=>r.me,1],['rvN','Compite contra',r=>esc(r.rvN),r=>r.rvN],['rv','Votos proyectados del rival',r=>fmt(R(r.rv)),r=>r.rv,1],['meta','Meta 2027 (votos)',r=>`<b>${fmt(r.meta)}</b>`,r=>r.meta,1],['gap','Faltan / ventaja',r=>`<span class="${r.gap>0?'dn':'up'}">${r.gap>0?fmt(r.gap):'gana +'+fmt(-r.gap)}</span>`,r=>r.gap,1],['n','Secciones a ganar',r=>r.gap>0?fmt(r.n):'—',r=>r.n,1],['st','Situación',r=>`<b class="es-stl ${ESTL[r.st][1]}">${ESTL[r.st][0]}</b>`,r=>r.st],['rg','Rango de la diferencia (pts)',r=>{const e=eErr(eNat()); return e?`${pjTxt(r.mg-e)} a ${pjTxt(r.mg+e)}${Math.abs(r.mg)<e?' · empate técnico':''}`:'—';},r=>r.mg],['h','Resultado '+eYear(),r=>r.h||'—',r=>r.h||'']]);
  return nm.concat([['sec','Secciones',r=>fmt(r.sec),r=>r.sec,1],['seg','Conservar',r=>fmt(r.seg),r=>r.seg,1],['cui','Defender',r=>fmt(r.cui),r=>r.cui,1],['mov','Disputar · movilizar',r=>fmt(r.mov),r=>r.mov,1],['cnv','Disputar · convencer',r=>fmt(r.cnv),r=>r.cnv,1],['dif','Contener',r=>fmt(r.dif),r=>r.dif,1],['n','Secciones a ganar para la meta',r=>`<b>${fmt(r.n)}</b>`,r=>r.n,1],['add','Votos a sumar',r=>fmt(r.add),r=>r.add,1],['meta','Meta 2027 (votos)',r=>fmt(r.meta),r=>r.meta,1]]);}
function eTable(){let m=$('estm'); if(!m){m=document.createElement('div'); m.id='estm'; m.className='estm'; document.body.appendChild(m);}
  const A=eAlly(),E=eSecs(),lv=eLv(),ii=eSelII(),tabs=[['sec','Secciones']].concat(['mun','dl','df'].map(k=>[k,ENN[k][1][0].toUpperCase()+ENN[k][1].slice(1)])),tab=tabs.find(t=>t[0]===st.es.tab)?st.es.tab:'sec',cols=eCols(tab),q=norm(st.es.q||'');
  let rows=tab==='sec'?ii.map(i=>E.by[i]).filter(x=>x&&eMatch(x,st.es.seg)):eUnits(tab);
  if(q) rows=rows.filter(r=>tab==='sec'?String(S[r.i].s).startsWith(q)||norm(MUN[S[r.i].m]).includes(q):norm(r.name).includes(q));
  const sk=cols.find(c=>c[0]===st.es.sk)?st.es.sk:(tab==='sec'?(A?'ord':'mg'):null),sc=cols.find(c=>c[0]===sk); if(sc) rows.sort((a,b)=>{const u=sc[3](a),v=sc[3](b); return (u>v?1:u<v?-1:0)*st.es.sd;}); else eUnitSort(rows);
  const lim=st.es.lim||300,where=st.es.u!=null&&lv!=='est'?eName(lv,st.es.u):EST;
  m.innerHTML=`<div class="estm-b" role="dialog" aria-modal="true" aria-label="Tabla de estrategia"><div class="estm-h"><div><h3>${A?esc(eSide(A))+': secciones y metas 2027':'Panorama 2027'}</h3><p>${esc(eObjN())} · ${esc(where)} · proyección con lista nominal ${esc(CORTE)}</p></div><button class="x" id="estx" aria-label="Cerrar">✕</button></div>
   ${eTiles(ii,'row')}
   <div class="estm-t"><div class="es-ch">${tabs.map(t=>`<button data-etab="${t[0]}" aria-pressed="${t[0]===tab}">${t[1]}</button>`).join('')}</div><input id="estq" placeholder="${tab==='sec'?'Buscar sección o municipio':'Buscar'}" value="${esc(st.es.q||'')}"><button class="es-x" id="estcsv">Descargar CSV</button></div>
   ${tab==='sec'&&st.es.seg?`<div class="es-fl">Mostrando: <b>${ECAT[st.es.seg][0]}</b> (${fmt(rows.length)}) <button class="es-x" data-eseg="${st.es.seg}">Quitar filtro</button></div>`:''}
   <div class="estm-w"><table><thead><tr>${cols.map(c=>`<th data-esk="${c[0]}" class="${c[4]?'r':''}">${c[1]}${c[0]===sk?(st.es.sd>0?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,lim).map(r=>`<tr class="${tab==='sec'&&r.add?'inr':''}" ${tab==='sec'?`data-esec="${r.i}"`:`data-eunit2="${r.k}"`}>${cols.map(c=>`<td class="${c[4]?'r':''}">${c[2](r)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}">Sin secciones con este filtro.</td></tr>`}</tbody></table>${rows.length>lim?`<button class="es-x" id="estmore" style="margin:10px auto;display:block">Ver ${Math.min(300,rows.length-lim)} más de ${fmt(rows.length)}</button>`:''}</div>
   <p class="es-f">${A?'Meta 2027: votos estimados para ganar la sección o el territorio (o retener lo que ganaría). Filas resaltadas: secciones a ganar para cubrir los votos que faltan. ':''}Clic en una fila para verla en el mapa. Estimación propia con datos del INE; no es una encuesta.</p></div>`;
  m.classList.add('on');
  const close=()=>m.classList.remove('on'); $('estx').onclick=close; m.onclick=e=>{if(e.target===m) close();};
  m.querySelectorAll('[data-etab]').forEach(b=>b.onclick=()=>{st.es.tab=b.dataset.etab; st.es.sk=null; st.es.sd=1; st.es.q=''; st.es.lim=300; eTable();});
  m.querySelectorAll('[data-eseg]').forEach(b=>b.onclick=()=>{const k=b.dataset.eseg; st.es.seg=st.es.seg===k?null:k; st.es.tab='sec'; render();});
  m.querySelectorAll('[data-esk]').forEach(t=>t.onclick=()=>{const k=t.dataset.esk; st.es.sd=st.es.sk===k?-st.es.sd:1; st.es.sk=k; eTable();});
  const qi=$('estq'); qi.oninput=()=>{st.es.q=qi.value; st.es.lim=300; eTable(); const n=$('estq'); n.focus(); n.setSelectionRange(n.value.length,n.value.length);};
  if($('estmore')) $('estmore').onclick=()=>{st.es.lim=lim+300; eTable();};
  m.querySelectorAll('tr[data-esec]').forEach(r=>r.onclick=()=>{const i=+r.dataset.esec; close(); st.sel=i; paint(); fit([i]);});
  m.querySelectorAll('tr[data-eunit2]').forEach(r=>r.onclick=()=>{close(); st.es.lv=tab; st.es.u=+r.dataset.eunit2; st.es.tab='sec'; applyScope(tab,st.es.u);});
  $('estcsv').onclick=()=>{const qq=x=>'"'+String(x).replace(/"/g,'""')+'"',strip=h=>String(h).replace(/<[^>]+>/g,'');
    const lines=[cols.map(c=>qq(strip(c[1]))).join(',')].concat(rows.map(r=>cols.map(c=>qq(strip(c[2](r)))).join(',')));
    saveFile(('Estrategia2027_'+norm(EST)+'_'+st.es.obj+'_'+(A?A.join('-'):'panorama')+'_'+tab+(st.es.seg?'_'+st.es.seg:'')+(st.es.u!=null?'_'+lv+st.es.u:'')).replace(/[^\w]+/g,'_')+'.csv','﻿'+lines.join('\n'),$('estcsv'));};}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('estm')&&$('estm').classList.contains('on')){$('estm').classList.remove('on'); e.stopImmediatePropagation();}},true);
/* al entrar: tomar el partido y el territorio seleccionados; el cargo es uno de los que se eligen en 2027 */
function estEnter(){const t=st.elec?st.elec.split('_')[0]:null; if(t&&EOBJ.find(o=>o[0]===t)) st.es.obj=t; if(st.party&&!EPARTIES.includes(st.party)){st.party=''; $('party').value='';}
  st.es.lv=null; st.es.u=null; st.es.seg=null; const f=st.f;
  if(st.terr){st.es.lv='mun'; st.es.u=+st.terr;} else if(f.dl.length===1){st.es.lv='dl'; st.es.u=f.dl[0];} else if(f.df.length===1){st.es.lv='df'; st.es.u=f.df[0];} else if(f.mun.length===1){st.es.lv='mun'; st.es.u=f.mun[0];}
  st.elec=eRef(); $('elec').value=st.elec;}
/* cambio suave al cambiar de escenario, rival o nivel: conserva el desplazamiento y anima cifras y barras en lugar de redibujar */
function morphPanel(C2,html){const again=C2.dataset.v==='est',sc=C2.scrollTop,RM2=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const numSel='.num,.es-big,b',isN=t=>/^[\s]*[\d,]+(\.\d+)?\s*%?[\s]*$/.test(t),oN=again?[...C2.querySelectorAll(numSel)].map(e=>e.children.length?null:e.textContent):[],oW=again?[...C2.querySelectorAll('[style*="width"]')].map(e=>e.style.width):[];
  C2.innerHTML=html; C2.dataset.v='est';
  if(!again) return;
  C2.classList.remove('anim'); C2.scrollTop=sc;
  if(RM2) return;
  [...C2.querySelectorAll('[style*="width"]')].forEach((e,j)=>{const w0=oW[j],w1=e.style.width; if(w0&&w1&&w0!==w1&&/%|px/.test(w0)){e.style.transition='none'; e.style.width=w0; void e.offsetWidth; e.style.transition='width .6s cubic-bezier(.2,.8,.2,1)'; e.style.width=w1;}});
  [...C2.querySelectorAll(numSel)].forEach((e,j)=>{if(e.children.length) return; const t1=e.textContent,t0=oN[j]; if(!t0||t0===t1||!isN(t0)||!isN(t1)) return; const a=parseFloat(t0.replace(/,/g,'')),b2=parseFloat(t1.replace(/,/g,'')),dec=((t1.match(/\.(\d+)/)||[,''])[1]).length,pc2=/%/.test(t1),cm=/,/.test(t1)||b2>=1000,st0=performance.now();
    const f=v=>(cm?v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}):v.toFixed(dec))+(pc2?'%':''),step=n=>{const u=Math.min(1,(n-st0)/550),k=1-Math.pow(1-u,3); e.textContent=f(a+(b2-a)*k); if(u<1) requestAnimationFrame(step); else e.textContent=t1;}; requestAnimationFrame(step);});}
function estRender(){const C2=$('col'); morphPanel(C2,estPanel()); if(typeof pjBind==='function') pjBind(C2);
  C2.querySelectorAll('[data-secdl]').forEach(b=>b.onclick=()=>secCSV()); C2.querySelectorAll('[data-ficha]').forEach(b=>b.onclick=()=>fichaOpen()); if(st.party&&typeof guiaStart==='function') setTimeout(()=>guiaStart(false),1200);
  const go=()=>{const lv=eLv(); if(st.es.u!=null&&lv!=='est') applyScope(lv,st.es.u); else applyScope('all',0);};
  $('eback').onclick=()=>setView2('map');
  C2.querySelectorAll('[data-eobj]').forEach(b=>b.onclick=()=>{st.es.obj=b.dataset.eobj; st.es.lv=null; st.es.u=null; st.es.seg=null; st.elec=eRef(); $('elec').value=st.elec; go();});
  C2.querySelectorAll('[data-elv]').forEach(b=>b.onclick=()=>{st.es.lv=b.dataset.elv; st.es.u=null; go();});
  const us=C2.querySelector('[data-eunit]'); if(us) us.onchange=()=>{st.es.u=us.value===''?null:+us.value; go();};
  const cf=C2.querySelector('.es-cfg'); if(cf) cf.querySelector('summary').onclick=()=>{st.es.cfgOpen=!cf.open;};
  C2.querySelectorAll('[data-esa]').forEach(b=>b.onclick=()=>{st.es.al=b.dataset.esa.split('+'); st.es.seg=null; render();});
  C2.querySelectorAll('[data-erv]').forEach(b=>b.onclick=()=>{st.es.rv=b.dataset.erv; st.es.seg=null; render();});
  C2.querySelectorAll('[data-epar]').forEach(b=>b.onclick=()=>{st.party=b.dataset.epar; $('party').value=st.party; st.es.al=null; st.es.seg=null; st.es.sk=null; $('rPa').setAttribute('aria-pressed',!!st.party); render(true);});
  C2.querySelectorAll('[data-eal]').forEach(b=>b.onclick=()=>{const q=b.dataset.eal,a=eAlly().slice(),j=a.indexOf(q); j>=0?a.splice(j,1):a.push(q); st.es.al=a; render();});
  C2.querySelectorAll('[data-eu]').forEach(b=>b.onclick=()=>{st.es.u=+b.dataset.eu; go();});
  C2.querySelectorAll('[data-eseg]').forEach(b=>b.onclick=()=>{const k=b.dataset.eseg; st.es.seg=st.es.seg===k?null:k; render();});
  C2.querySelectorAll('.ei').forEach(b=>b.onclick=e=>{e.preventDefault(); e.stopPropagation(); eiPop(b);});
  const dd=C2.querySelector('.es-lv3'); if(dd) dd.querySelector('summary').onclick=()=>{st.es.detOpen=!dd.open;};
  if($('epri')) $('epri').onclick=()=>{st.es.seg='pri'; st.es.q=''; st.es.lim=300; st.es.tab='sec'; st.es.sk=null; eTable(); render();};
  C2.querySelectorAll('.es-pri [data-esec]').forEach(b=>b.onclick=()=>{const i=+b.dataset.esec; st.sel=i; paint(); fit([i]);});
  const pd=C2.querySelector('.es-poll'); if(pd) pd.querySelector('summary').onclick=()=>{st.es.pollOpen=!pd.open;};
  if($('epapply')) $('epapply').onclick=()=>{const v={}; C2.querySelectorAll('[data-epq]').forEach(x=>{if(x.value!=='') v[x.dataset.epq]=+x.value;}); if(!Object.keys(v).length) return; st.es.poll[st.es.obj]={v,moe:+$('ep_moe').value||3}; st.es.pollOpen=true; render();};
  if($('epclear')) $('epclear').onclick=()=>{delete st.es.poll[st.es.obj]; render();};
  if($('epmid')) $('epmid').onclick=()=>{const v=eMid21(); if(!v) return; st.es.poll[st.es.obj]={v,moe:3,mid:1}; st.es.pollOpen=true; render();};
  $('etab').onclick=()=>{st.es.q=''; st.es.lim=300; st.es.tab='sec'; st.es.sk=null; eTable();};
  if($('estm')&&$('estm').classList.contains('on')) eTable();}

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
      const xs=E?ii.map(i=>E.by[i]).filter(x=>x&&x.rv>x.mine&&x.mg>-10).sort((a,b)=>(a.rv-a.mine)-(b.rv-b.mine)):[],secN=i=>String(S[i].s),munN=i=>MUN[S[i].m]||'';
      const pot=E?ii.map(i=>E.by[i]).filter(x=>x&&x.mine>x.rv&&(V2.maxT[x.i]||0)>x.tp).map(x=>({i:x.i,v:((V2.maxT[x.i]||0)-x.tp)/100*x.ln*(x.mine/x.V)})).filter(x=>x.v>=1).sort((a,b)=>b.v-a.v):[];
      Rt=`<h4>¿Qué le falta?</h4>${mt}
       ${xs.length?`<h4>¿Dónde conseguirlos?</h4><p class="pjsub">Secciones que perdería por poco: las más fáciles de voltear.</p>${pjTbl(['Sección','Municipio','Votos que le faltarían'],xs.map(x=>[secN(x.i),esc(munN(x.i)),fmt(Math.round(x.rv-x.mine)+1)]),6)}`:''}
       ${pot.length?`<p class="pjsub" style="margin-top:14px">Y donde ${me} ganaría pero votó menos gente que en su mejor elección:</p>${pjTbl(['Sección','Municipio','Votos al alcance'],pot.map(x=>[secN(x.i),esc(munN(x.i)),'hasta '+fmt(Math.round(x.v))]),5)}`:''}`;}
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

/* ===== informe PDF de la vista actual ===== */
function cssVars(){const cs=getComputedStyle(document.documentElement),o={}; ['--teal','--teal2','--teal3','--tealxl','--coral','--coralxl','--peach','--peachxl','--gray','--ink','--strong','--muted','--faint','--line','--hair','--card','--land','--landl','--sea','--bg','--acc'].forEach(v=>o[v]=cs.getPropertyValue(v).trim()); o['--acc']=o['--acc']||o['--teal']; o['--f']='Inter, Arial, sans-serif'; o['--d']='Manrope, Inter, Arial, sans-serif'; return o;}
function pdfBox(){const ii=scope().length?scope():ALL; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; ii.forEach(i=>{const b=paths[i].getBBox(); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height);}); const pw=(x1-x0)*.06+4,ph=(y1-y0)*.06+4; return [x0-pw,y0-ph,x1-x0+2*pw,y1-y0+2*ph];}
const resolveV=(s,V)=>s.replace(/var\((--[\w-]+)(?:,[^)]*)?\)/g,(m,n)=>V[n]||'#8A9393');
function rasterSVG(str,w,h){return new Promise((res,rej)=>{const img=new Image(); img.onload=()=>{const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(img,0,0,w,h); res(c.toDataURL('image/jpeg',.92));}; img.onerror=rej; img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(str);});}
function mapSVG(W){const V=cssVars(),[x,y,w,h]=pdfBox(),H=Math.round(W*h/w),u=w/W,col=c=>resolveV(c||V['--land'],V);
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${W}" height="${H}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${V['--sea']}"/>`;
  s+=[...$('gctx').children].map(p=>`<path d="${p.getAttribute('d')}" fill="${V['--land']}" stroke="${V['--landl']}" stroke-width="${u}"/>`).join('');
  paths.forEach(p=>{if(p.style.display==='none') return; s+=`<path d="${p.getAttribute('d')}" fill="${col(p.style.fill)}" fill-opacity="${p.classList.contains('off')?.18:1}" stroke="#fff" stroke-opacity=".45" stroke-width="${(u*.35).toFixed(3)}"/>`;});
  if(st.L.mun) s+=GEO.mun.map(b=>`<path d="${b.d}" fill="none" stroke="#fff" stroke-width="${(u*1.6).toFixed(3)}"/>`).join('');
  if(st.L.df) s+=GEO.df.map(b=>`<path d="${b.d}" fill="none" stroke="#fff" stroke-width="${(u*3).toFixed(3)}"/>`).join('');
  if(st.L.dl) s+=GEO.dl.map(b=>`<path d="${b.d}" fill="none" stroke="#fff" stroke-width="${(u*2).toFixed(3)}" stroke-dasharray="${u*7} ${u*4}"/>`).join('');
  [...$('gdiv').querySelectorAll('path')].forEach(p=>{const hal=p.classList.contains('hal'); s+=`<path d="${p.getAttribute('d')}" fill="none" stroke="${hal?'#1C2121':'#fff'}" stroke-opacity="${hal?.45:1}" stroke-width="${(u*(hal?6.5:3.2)).toFixed(3)}"/>`;});
  s+=`<path d="${GEO.ent}" fill="none" stroke="${V['--teal3']}" stroke-opacity=".5" stroke-width="${(u*1.4).toFixed(3)}"/>`;
  labs.forEach(t=>{if(t._r!==1) return; const fs=w/90; s+=`<text x="${t.getAttribute('x')}" y="${t.getAttribute('y')}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${fs}" fill="#1C2121" stroke="#fff" stroke-width="${fs*.25}" paint-order="stroke">${esc(t.textContent)}</text>`;});
  return {s:s+'</svg>',H};}
const pdfTxt=t=>String(t).replace(/→/g,'>').replace(/[−–]/g,'-').replace(/\s+/g,' ').trim();
async function exportPDF(btn){if(!window.jspdf||!window.html2canvas){toast('No se pudo cargar el generador de PDF. Recarga la página.'); return;}
  const o=btn.innerHTML; btn.disabled=true; btn.textContent='Preparando informe…';
  await new Promise(r=>setTimeout(r,950));
  try{const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),PW=297,PH=210,V=cssVars(),teal=[28,127,121],dark=[28,33,33],grey=[138,147,147];
    const head=(t,sub)=>{doc.setFillColor(...teal); doc.rect(0,0,PW,3,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...dark); doc.text(pdfTxt(t),12,15); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...grey); doc.text(pdfTxt(sub),12,21);};
    const foot=n=>{doc.setFontSize(7); doc.setTextColor(...grey); doc.text(pdfTxt(`Fuente: ${SRC.res}; ${SRC.pad}; ${SRC.cc}; ${SRC.carto}. Voto duro, volátil y abstención: estimación propia.`),12,PH-6,{maxWidth:250}); doc.text('Página '+n,PW-12,PH-6,{align:'right'});};
    const today=new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),terr=scopeLabel(),fl=[]; for(const g in st.f) st.f[g].forEach(v=>fl.push(g==='sec'?'sección '+v:g==='mun'?MUN[v]:g==='dl'?'DL '+v:g==='df'?'DF '+v:g==='win'?'ganador '+NM[v]:FL[g]?FL[g][v]:v));
    head(`Laboratorio Político · ${EST}`,`${eLabel(st.elec)} · ${terr}${st.party?' · análisis de '+NM[st.party]:''} · generado el ${today}`);
    let y=30; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...dark); doc.text('Lectura de la consulta',12,y); y+=6;
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...dark);
    const lis=[...document.querySelectorAll('#col .lec li')].map(li=>pdfTxt(li.textContent));
    if(fl.length) lis.unshift('Filtros aplicados: '+pdfTxt(fl.join(', '))+'.');
    lis.forEach(t=>{const L=doc.splitTextToSize(t,118); if(y+L.length*4.4>PH-14) return; doc.setFillColor(...teal); doc.circle(13.5,y-1.2,.8,'F'); doc.text(L,17,y); y+=L.length*4.4+2.2;});
    const mw=150,mh=170,{s,H}=mapSVG(1600),ratio=H/1600,iw=ratio>mh/mw?mh/ratio:mw,ih=iw*ratio,img=await rasterSVG(s,1600,H);
    doc.addImage(img,'JPEG',PW-12-iw,28,iw,ih); doc.setFontSize(8); doc.setTextColor(...grey); doc.text(pdfTxt('Mapa: '+(METRICS[st.metric]?METRICS[st.metric].n:'')+(METRICS[st.metric]&&METRICS[st.metric].needP&&st.party?' '+NM[st.party]:'')+' · '+eLabel(st.elec)),PW-12-iw,28+ih+4);
    foot(1);
    const cards=[...document.querySelectorAll('#col .cd')].filter(c=>!c.classList.contains('lecc'));
    let page=1,ys=[PH,PH]; const CW=(PW-24-8)/2,top=26,maxH=PH-12-top;
    const newPage=()=>{doc.addPage(); page++; head(`Laboratorio Político · ${EST}`,`${eLabel(st.elec)} · ${terr} · tarjetas del panel`); foot(page); ys=[top,top];};
    for(const c of cards){const cv=await html2canvas(c,{scale:2,backgroundColor:'#ffffff',logging:false,onclone:d=>{const stl=d.createElement('style'); stl.textContent='*{animation:none!important;transition:none!important}.ca,.exp,.x{display:none!important}'; d.head.appendChild(stl); d.querySelectorAll('svg, svg *').forEach(e=>{const sa=e.getAttribute('style'); if(sa) e.setAttribute('style',resolveV(sa,V)); ['fill','stroke'].forEach(a=>{const v=e.getAttribute(a); if(v&&v.includes('var(')) e.setAttribute(a,resolveV(v,V));});});}});
      let h=CW*cv.height/cv.width,w=CW; if(h>maxH){w=CW*maxH/h; h=maxH;} let ci=ys[0]<=ys[1]?0:1; if(ys[ci]+h>PH-12){newPage(); ci=0;}
      doc.addImage(cv.toDataURL('image/jpeg',.9),'JPEG',12+ci*(CW+8),ys[ci],w,h); ys[ci]+=h+5;}
    const name=('Informe_'+norm(EST)+'_'+(st.elec||'panorama')+(st.terr?'_'+norm(MUN[st.terr]):'')+(st.party?'_'+st.party:'')).replace(/[^\w]+/g,'_')+'.pdf';
    await saveFile(name,doc.output('blob'));}
  catch(e){console.error(e); toast('No se pudo generar el informe.');}
  finally{btn.disabled=false; btn.innerHTML=o;}}

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
   <div class="cgk"><span><i></i>ganó el distrito</span><span data-tip="<b>Plurinominal</b>Diputación que se reparte según el porcentaje de votos de cada partido, no por ganar un distrito." class="cgi"><i class="o"></i>plurinominal ⓘ</span></div>`;
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
      const pot=E?E.L.filter(x=>x.mine>x.rv&&(V2.maxT[x.i]||0)>x.tp).map(x=>({i:x.i,v:((V2.maxT[x.i]||0)-x.tp)/100*x.ln*(x.mine/x.V)})).filter(x=>x.v>=1).sort((a,b)=>b.v-a.v):[];
      let acc=0,ns=0; for(const x of pot){if(acc>=need) break; acc+=x.v; ns++;} const tp=pot;
      s2=`<div class="cgs"><i>${nd?2:1}</i><div class="cgb"><b>Sumar unos ${congVotos(need)} votos en todo el estado</b><span class="cgf ${fz[0]}">${fz[1]}</span>
        <p>Pasaría de ${pl.de.toFixed(1)} % a ${pl.a.toFixed(1)} % de la votación (+${(pl.a-pl.de).toFixed(1)} puntos): ${fz[2]}.</p><details class="cgwhy"><summary>¿Por qué votos en todo el estado?</summary><p>La ley no le da a un partido más diputaciones que su porcentaje de votos más 8 puntos. Con ${pl.de.toFixed(1)} % su tope sería ${pl.cap!=null?pl.cap:tb}: aunque ganara otro distrito, no podría pasar de ahí sin subir su votación en el estado.</p></details>
        ${tp.length?`<p class="cgq">¿Dónde buscarlos? En secciones donde ${qn} iría adelante pero votó menos gente que en su mejor elección:</p>
        ${pjTbl(['Sección','Municipio','Votos al alcance'],tp.map(x=>[secN(x.i),esc(munN(x.i)),'hasta '+fmt(Math.round(x.v))]),5)}
        <p class="cgq">Es el máximo: supone que vuelve a votar tanta gente como en su mejor elección. ${acc>=need?`En el mejor caso, ${ns===1?'con la primera':'con las primeras '+ns} alcanzaría.`:`Todas juntas darían unos ${congVotos(acc)}; el resto tendría que venir de convencer a votantes de otros partidos.`}</p>`:''}</div></div>`;}
    goal=`<div class="cgplan">${s1}${s2}<div class="cgr"><span>Resultado</span><b>${rt.mr} distritos + ${rt.rp} plurinominales = ${half}</b></div></div>`;}
  else if(rt&&rt.keep) goal=`<div class="cgg"><b>${tb} de ${NT}</b><p>${esc(bn)} tendría mayoría</p><p class="s">${congNeed(B)}</p></div>`;
  else if(rt) goal=`<div class="cgg"><p>Ni con 15 puntos más en todo el estado llegaría a ${half}.</p></div>`;
  let extra=''; if(p){const n=congNext(p,x),nm=esc(NM[p]||p); if(n){
    if(n.umb) extra=`${nm} no llega al ${Math.round(100*RPR.umbral)} % para tener plurinominales${n.d!=null?`: le faltan unos ${congVotos(n.votos)} votos`:''}.`;
    else if(n.lim==='max') extra=`${nm} ya tiene el máximo de ${RPR.max} diputaciones que permite la ley.`;
    else if(n.lim==='tope'&&n.o.mr>=n.cap) extra=`${nm} gana más distritos de los que su votación permitiría (${n.cap}); por eso no recibe plurinominales.`;
    else if(n.lim==='tope') extra=`Con ${(100*n.sh).toFixed(1)} % de los votos, la ley le permite a ${nm} máximo ${n.cap} diputaciones: más distritos sin más votos no le suman.`;
    else if(n.d!=null) extra=`Una plurinominal más para ${nm}: unos ${congVotos(n.votos)} votos.`;}}
  const ley=M0.rpr&&M0.rpr.fuente?`<div class="cgl" data-tip="${esc(`<b>Regla de ${EST}</b>${M0.rpr.resumen||''}<br><br>${M0.rpr.fuente}`)}"><span class="lt">Ley</span>${esc((M0.rpr.fuente||'').split(';')[0])} · ${esc(/^Reproduce/.test(M0.rpr.validacion||'')?'reproduce el reparto real':/^Difiere/.test(M0.rpr.validacion||'')?(M0.rpr.validacion.match(/en \d+ curul(es)?/)||['difiere'])[0].replace('en','difiere en')+' del reparto real':'sin comprobar contra el reparto real')}</div>`
    :`<div class="cgl">Regla general (umbral 3 %, tope de 8 puntos, art. 116 de la Constitución federal); falta verificar la ley de ${esc(EST)}.</div>`;
  const showX=extra&&!(rt&&rt.plan&&rt.plan.d>0&&/tope|permite/.test(extra));
  return [L,`<h4>${rt&&rt.keep?'La mayoría':`Qué necesita ${esc(bn)} para la mayoría (${half})`}</h4>${goal}${showX?`<p class="cgx">${extra}</p>`:''}${ley}`];}
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
  try{return await (st.view==='est'&&st.party&&typeof esDeck==='function'?esDeck():slBuild());}catch(e){console.error(e); toast('No se pudo armar la presentación.'); return null;} finally{if(btn){btn.disabled=false; btn.innerHTML=o;}}}
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

/* ===== metodología, descarga de secciones, ficha imprimible y guía de primera vez ===== */
const gWin=(id,html,cls)=>{let W=$(id); if(!W){W=document.createElement('div'); W.id=id; W.className='actw '+(cls||''); W.setAttribute('role','dialog'); document.body.appendChild(W);
    W.addEventListener('click',e=>{if(e.target===W||e.target.closest('[data-gx]')){W.classList.remove('on'); document.body.classList.remove('actm');}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&W.classList.contains('on')){W.classList.remove('on'); document.body.classList.remove('actm');}});}
  W.innerHTML=html; W.classList.add('on'); document.body.classList.add('actm'); return W;};
/* --- metodología --- */
function metOpen(){const M=typeof MODELO!=='undefined'&&MODELO?MODELO:{},N=M.nacional||{},E=(M.estados||{})[M0.cab]||{},CB=M.calibracion||{},SX=(M.sec||{}).sit||{},TT=['GOB','DIPL','AYU','DIPF'].filter(t=>N[t]);
  const R=M0.rpr,rpTxt=R&&R.fuente?`<p><b>${esc(EST)}:</b> ${esc(R.resumen||'')}</p><p class="mt-s">${esc(R.fuente)}. ${esc(R.validacion||'')}</p>`:`<p>${esc(EST)} usa la regla general de la Constitución (umbral 3 %, nadie con más de 8 puntos sobre su votación). Su ley local no está verificada todavía.</p>`;
  const ic={q:'<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01"/>',c:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',t:'<path d="M20 6 9 17l-5-5"/>',s:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',a:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',p:'<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',x:'<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',f:'<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/>',v:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"/>'};
  const sec=(k,t,b,kw)=>`<section class="mt-c" data-kw="${esc((t+' '+(kw||'')+' '+b.replace(/<[^>]+>/g,' ')).toLowerCase())}"><div class="mt-hd"><i><svg viewBox="0 0 24 24">${ic[k]}</svg></i><h4>${t}</h4></div>${b}</section>`;
  const GL=[['Proyección','Estimación de cómo podría votar cada sección en 2027 con las tendencias de 2015–2024. No es una encuesta.'],['Probabilidad de ganar','En cuántas de cada 100 elecciones simuladas gana. 54 % es casi un empate; 85 % o más es seguro.'],['Rango probable','Entre qué valores queda el resultado en 8 de cada 10 elecciones simuladas.'],['Lo esperable','Cuando un partido va adelante en muchos lugares por poco, no los gana todos: la cifra esperable descuenta los que se le irían.'],['Plurinominal','Diputación que se reparte según el porcentaje de votos de cada partido, no por ganar un distrito.'],['Tope de 8 puntos','Ningún partido puede tener un porcentaje de diputaciones mayor a su porcentaje de votos más 8 puntos.'],['Meta 70 %','Los votos con los que la probabilidad de ganar llega a 70 %.'],['Disputar','Sección que perdería por menos de 10 puntos: ahí se gana o se pierde.'],['Movilizar','En la sección votó mucha menos gente que en su mejor elección: hay que sacar a votar a los propios.'],['Convencer','La participación es la de siempre: hay que ganar votantes de otros partidos.'],['Defender','Sección que ganaría por menos de 10 puntos.'],['Conservar','Sección que ganaría por más de 10 puntos.'],['Contener','Sección que perdería por más de 10 puntos: que el rival no crezca.'],['Voto duro','Secciones donde aun en su peor elección desde 2018 sacó al menos 30 % de lo esperado.'],['Cambian de partido','Secciones que cambiaron de partido ganador en al menos 2 cargos entre las dos últimas elecciones.'],['Voto propio','Cuántos puntos más (o menos) sacó una persona que su misma alianza en las demás boletas del mismo año y territorio. Se ve en la ficha de cada actor.'],['Cambió de bando','Lo postuló un partido que no compartía ni era aliado del que lo postuló antes (por ejemplo PRI → MC). Entre aliados, como Morena → PT, se marca aparte.'],['Votos de la boleta','El INE no cuenta votos por persona: el porcentaje de un actor es el de su partido o alianza en su elección.'],['Votos al alcance','Máximo de votos si en la sección vuelve a votar tanta gente como en su mejor elección.']];
  const rp17=R&&/^Reproduce/.test(R.validacion||'');
  gWin('metw',`<div class="ac-bx mt-bx"><div class="pj-top"><div><b>Cómo se calcula</b><span>${esc(EST)}</span></div><button class="ac-x" data-gx="1" aria-label="Cerrar">✕</button></div>
   <div class="mt-sc"><div class="mt-hero"><div><b>${E.todo?E.todo.acierto+' %':'—'}</b><span>de ganadores acertados en ${esc(EST)} al estimar 2021 y 2024</span></div><div><b>32</b><span>estados usados para probar el método</span></div><div><b>${(CB['70-80']||{})['gano_el_favorito_%']?Math.round(CB['70-80']['gano_el_favorito_%']):'—'} de 100</b><span>veces ganó el favorito cuando el sistema dio 70–80 %</span></div><div><b>${rp17?'Sí':'—'}</b><span>${rp17?'reproduce el reparto real de plurinominales':'reparto de plurinominales sin comprobar exacto'}</span></div></div>
   <label class="mt-q"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="mtq" placeholder="Buscar un término: plurinominal, rango, disputar…" autocomplete="off"></label>
   <div class="mt-g">
   ${sec('q','Qué es la proyección',`<p>Una estimación de cómo podría votar cada sección en 2027 si se mantienen las tendencias de las elecciones pasadas. No es una encuesta: usa solo resultados oficiales del INE por sección (2015–2024) y la lista nominal vigente.</p>`)}
   ${sec('c','Cómo se calcula',`<ol><li><b>Votación de cada sección.</b> Se combina la última elección del mismo cargo con el promedio de todas las elecciones del año más reciente.</li><li><b>Participación.</b> Se estima con la regla que menos se equivocó al probarla con elecciones pasadas.</li><li><b>Incertidumbre.</b> Se simulan 2,000 elecciones: en cada una la votación se mueve en todo el estado y en cada lugar tanto como se movió de 2018 a 2021 y de 2021 a 2024. Así salen la probabilidad de ganar y el rango probable.</li><li><b>Alianzas.</b> El partido que más aporta cuenta completo y sus aliados al 70 %, porque no todos sus votantes siguen al candidato común; ese 70 % es el que más acertó al estimar 2021 y 2024. Los partidos que perdieron el registro pasan a quienes fueron sus aliados.</li><li><b>Coaliciones que no fueron en todo el estado.</b> Donde una coalición no se registró, sus partidos cuentan por separado. Se detecta porque ahí las combinaciones de logos no reciben votos; en las diputaciones federales 2024 coincidió en los 40 distritos con las candidaturas del INE. Con pocos votos una coalición real puede quedar en cero por azar: se usa una prueba de Poisson (si la probabilidad de ver cero votos en combinaciones con esos votos es menor a 5 %, se separa; si no, se deja como coalición) y se respeta lo que diga el registro oficial del ganador.</li><li><b>Secciones que el INE dividió.</b> Los votos de elecciones pasadas en secciones que ya no existen en el mapa vigente se reparten entre las secciones nuevas de su mismo municipio, según su lista nominal. Así los totales por municipio y distrito coinciden con el cómputo.</li></ol><div class="mt-f"><span>Modelo: promedio histórico con oscilación proporcional y simulación Monte Carlo con error en dos niveles (estado y lugar)</span><code>p̂ = a · p<sub>última del cargo</sub> + (1 − a) · p̄<sub>año más reciente</sub></code><code>V<sub>alianza</sub> = V<sub>mayor</sub> + 0.7 · Σ V<sub>aliados</sub></code><code>margen<sub>simulado</sub> = margen̂ + ε<sub>estado</sub> + ε<sub>lugar</sub>,  ε ~ Normal(0, σ²)</code><code>P(ganar) = elecciones ganadas ÷ 2,000</code><code>ventaja necesaria para 70 % = 0.52 · √(σ²<sub>lugar</sub> + σ²<sub>estado</sub>)</code></div>`,'simulación modelo fórmula monte carlo participación alianzas')}
   ${sec('t','Qué tan bien acierta',`<p>Se probó estimando 2021 y 2024 sin ver el resultado, en los 32 estados. Lugares donde acertó al ganador:</p><div class="mt-bars">${TT.map(t=>`<div><span>${esc(TY[t])}</span><div class="b"><i style="width:${N[t].solo}%"></i><u style="left:${N[t].encuesta}%"></u></div><b>${N[t].solo} %</b><em>${N[t].encuesta} % con encuesta</em></div>`).join('')}</div>${E.todo?`<p class="mt-s">En ${esc(EST)}: ${E.todo.acierto} % de ${E.todo.n} casos; repetir la elección anterior habría acertado ${E.todo.repetir} %.</p>`:''}<div class="mt-f"><span>Método: validación cruzada fuera de muestra</span><code>se ajusta con 2021 y se mide con 2024, y al revés</code><code>acierto = lugares con ganador correcto ÷ lugares</code></div>`,'acierto validación')}
   ${sec('s','¿Las probabilidades son honestas?',`<div class="mt-cal">${['60-70','70-80','80-90','90-101'].map(k=>{const v=(CB[k]||{})['gano_el_favorito_%']; return `<div><b>${v!=null?Math.round(v)+' %':'—'}</b><i style="height:${v||0}%"></i><span>${k==='90-101'?'90 % o más':k.replace('-','–')+' %'}</span></div>`;}).join('')}</div><p class="mt-s">Arriba, cuántas veces ganó el favorito; abajo, la probabilidad que dio el sistema. Si coinciden, las probabilidades son confiables.</p><div class="mt-f"><span>Método: diagrama de confiabilidad (calibración)</span><code>por grupo de probabilidad: veces que ganó el favorito ÷ casos</code></div>`,'calibración')}
   ${sec('a','Las cuatro acciones',`<div class="mt-ac">${[['Conservar','ganaría por más de 10 puntos','seg','#1C7F79'],['Defender','ganaría por menos de 10','cui','#93D6D0'],['Disputar','perdería por menos de 10','mov','#F46883'],['Contener','perdería por más de 10','dif','#D3DADA']].map(([n,d,k,c])=>`<div style="--c:${c}"><b>${n}</b><span>${d}</span><em>en 2024 se ganó ${SX[k]?SX[k].gano:'—'} %</em></div>`).join('')}</div><p class="mt-s">Etiquetas calculadas con 2018–2021 y comparadas con lo que pasó en 2024, en los 32 estados.</p>`,'conservar defender disputar contener movilizar convencer')}
   ${sec('p','Plurinominales',`<p>El congreso se arma con los distritos que ganaría cada partido y las plurinominales que le tocarían con la ley de cada estado. Se comprobó repitiendo el reparto real de la última elección en los 32 estados: 17 lo reproducen exacto, 10 difieren en una curul y en 5 (Ciudad de México, Estado de México, Nayarit, Sonora y Tlaxcala) difiere más por reglas que no se pueden reconstruir con los datos por sección.</p>${rpTxt}<div class="mt-f"><span>Método: cociente natural y resto mayor (Hare), con las reglas de cada ley</span><code>curules<sub>partido</sub> = votos<sub>partido</sub> ÷ cociente, y las sobrantes al resto mayor</code><code>% curules ≤ % votos + 8 puntos (art. 116 constitucional)</code></div>`,'congreso representación proporcional ley')}
   ${sec('v','Votos de cada persona',`<p>El INE no cuenta votos por persona: cuenta votos por partido en cada sección. Por eso, en la ficha de un actor:</p><ol><li><b>Su porcentaje</b> es el de su partido o alianza en su elección y su territorio. Si fue en coalición, también se muestra cuánto sacó su partido solo.</li><li><b>Su ventaja</b> es la diferencia con el segundo lugar (o con el ganador, si perdió).</li><li><b>Su voto propio</b> compara su porcentaje con lo que sacó exactamente la misma alianza en las demás boletas de ese año en el mismo territorio (en diputaciones federales, senado y gubernatura: contra presidencia, senado o gubernatura). Si sacó más, una parte del voto fue por la persona. No se calcula donde no se sabe si la coalición fue.</li></ol><p>El voto propio es una medida descriptiva (conocida como diferencial de boleta): no separa el efecto del candidato del de su rival ni de la campaña, y en un solo caso puede variar varios puntos. Prueba de que mide algo de la persona: en quienes se reeligieron, el voto propio de sus dos periodos se parece (correlación 0.41, 304 casos), mucho más que el de dos personas distintas en el mismo lugar (0.12, 1,167 casos). Se reconoce a cada persona por su nombre escrito igual en los registros del INE.</p><p><b>Lo postuló otro partido</b> se marca solo cuando un cargo no comparte ningún partido con el anterior. El INE registra a quien va en coalición con el partido que lo propone en el convenio, no con su militancia: ganar con Morena-PT y luego con Morena no es un cambio. Si el partido nuevo era aliado del anterior en esa elección (por ejemplo Morena y PT), se marca como movimiento dentro de su alianza; si no, como <b>cambio de bando</b> (por ejemplo PRI → MC). Solo cuentan los siete partidos nacionales.</p><div class="mt-f"><span>Método: diferencial de boleta (voto personal; Cain, Ferejohn y Fiorina, 1987)</span><code>voto propio = % persona − promedio del % de la misma alianza en las demás boletas del mismo año y lugar</code></div>`,'actores postuló cambio partido')}
   ${sec('x','Lo que la estimación no puede anticipar',`<ul><li>Quién será candidato ni cuánto voto propio tendrá.</li><li>Escándalos, conflictos o acuerdos de último momento.</li><li>Alianzas que todavía no se registran (se pueden probar en "Cambiar elección, rivales o territorio").</li></ul><p>Por eso los rangos son amplios. Con encuestas cargadas, el rango se cierra.</p>`,'límites')}
   ${sec('f','Fuentes',`<p>${esc(SRC.res||'INE, resultados electorales por sección')}; ${esc(SRC.pad||'INE, lista nominal')}; constituciones, leyes electorales y acuerdos de los institutos electorales de cada estado.</p><button class="pjmore" data-guia="1">Ver otra vez la guía de botones</button>`,'ine datos')}
   <section class="mt-c mt-gl" data-kw="glosario"><div class="mt-hd"><i><svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg></i><h4>Glosario</h4></div><dl>${GL.map(([t,d])=>`<div data-kw="${esc((t+' '+d).toLowerCase())}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl></section>
   <p class="mt-none" hidden>No hay resultados. Prueba con otra palabra.</p></div></div></div>`,'metw');
  const q=$('mtq'),W=$('metw'); if(q) q.oninput=()=>{const v=q.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); let n=0; const nz=x=>x.normalize('NFD').replace(/[̀-ͯ]/g,'');
    W.querySelectorAll('.mt-gl dl>div').forEach(d=>{const ok=!v||nz(d.dataset.kw).includes(v); d.hidden=!ok; if(ok&&v) n++;});
    W.querySelectorAll('.mt-c:not(.mt-gl)').forEach(c=>{const ok=!v||nz(c.dataset.kw).includes(v); c.hidden=!ok; if(ok) n++;});
    const gl=W.querySelector('.mt-gl'); gl.hidden=!!v&&![...gl.querySelectorAll('dl>div')].some(d=>!d.hidden); W.querySelector('.mt-hero').hidden=!!v; W.querySelector('.mt-none').hidden=!v||n>0||!gl.hidden;};
  const b=$('metw').querySelector('[data-guia]'); if(b) b.onclick=()=>{$('metw').classList.remove('on'); document.body.classList.remove('actm'); guiaStart(true);};}
if($('rMe')) $('rMe').onclick=metOpen;
document.addEventListener('click',e=>{if(e.target.closest('[data-met]')){e.preventDefault(); metOpen();}});
/* --- descarga de secciones (se abre en Excel) --- */
function secCSV(){if(typeof eSecs!=='function') return; const E=eSecs(),ii=eSelII(),A=eAlly(),acc={seg:'Conservar',cui:'Defender',mov:'Disputar · movilizar',con:'Disputar · convencer',dif:'Contener'};
  const q=x=>{x=x==null?'':String(x); return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;},rows=[A?['Sección','Municipio','Distrito local','Distrito federal','Acción','Diferencia proyectada (puntos)','Votos que le faltarían','Votos al alcance (máximo)','Voto duro','Cambia de partido']:['Sección','Municipio','Distrito local','Distrito federal','Situación','Va adelante','Diferencia (puntos)']];
  ii.map(i=>E.by[i]).filter(Boolean).sort((a,b)=>A?((a.act==='mov'||a.act==='con'?0:1)-(b.act==='mov'||b.act==='con'?0:1))||(a.rv-a.mine)-(b.rv-b.mine):a.mg-b.mg).forEach(x=>{const s=S[x.i];
    if(A){const fal=x.rv>x.mine?Math.round(x.rv-x.mine)+1:'',al=x.mine>x.rv&&(V2.maxT[x.i]||0)>x.tp?Math.round(((V2.maxT[x.i]||0)-x.tp)/100*x.ln*(x.mine/x.V)):''; rows.push([s.s,MUN[s.m],s.dl,s.df,acc[x.act]||'',x.mg.toFixed(1),fal,al,x.duro?'Sí':'',x.sw?'Sí':'']);}
    else rows.push([s.s,MUN[s.m],s.dl,s.df,(ECAT[x.cat]||[''])[0],NM[x.lead]||x.lead,x.mg.toFixed(1)]);});
  const where=st.es.u!=null&&eLv()!=='est'?eName(eLv(),st.es.u).replace(/[^\wÁÉÍÓÚÑáéíóúñ]+/g,'_'):EST,b=new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),l=document.createElement('a');
  l.href=u; l.download=`secciones_${(eObjN()||'').replace(/\s+/g,'_')}_${where}${A?'_'+eSide(A).replace(/\W+/g,''):''}.csv`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000);}
/* --- ficha imprimible del territorio elegido --- */
function fichaOpen(){if(typeof eSecs!=='function'||!st.party) return; const E=eSecs(),ii=eSelII(),A=eAlly(),me=eSide(A),where=st.es.u!=null&&eLv()!=='est'?eName(eLv(),st.es.u):EST,xs=ii.map(i=>E.by[i]).filter(Boolean);
  const lines=[...document.querySelectorAll('.es-cor > div')].map(d=>[d.querySelector('span').textContent,d.querySelector('p').innerHTML.replace(/\s*Las secciones están abajo, en "Dónde trabajar"\./,'')]);
  const dis=xs.filter(x=>x.act==='mov'||x.act==='con').sort((a,b)=>(a.rv-a.mine)-(b.rv-b.mine)),def=xs.filter(x=>x.act==='cui').sort((a,b)=>(a.mine-a.rv)-(b.mine-b.rv));
  const c=k=>xs.filter(x=>(k==='dis'?(x.act==='mov'||x.act==='con'):x.act===k)).length,col=C[A[0]]||'#1C7F79';
  const tb=(h,r)=>`<table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${r.map(x=>`<tr>${x.map(y=>`<td>${y}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ficha · ${esc(where)} · ${esc(me)}</title><style>
   @page{size:letter;margin:14mm}body{font:12px/1.45 Inter,Arial,sans-serif;color:#1C2121;margin:0}h1{font:800 22px Manrope,Arial,sans-serif;margin:0}h2{font:700 14px Manrope,Arial,sans-serif;margin:18px 0 6px;border-bottom:2px solid ${col};padding-bottom:3px}
   .sub{color:#6B7676;margin:2px 0 14px}.k{display:flex;gap:10px;margin:10px 0}.k div{flex:1;border:1px solid #E3E8E8;border-radius:8px;padding:8px 10px}.k b{display:block;font:800 20px Manrope,Arial,sans-serif}.k span{color:#6B7676;font-size:11px}
   .l div{display:grid;grid-template-columns:90px 1fr;gap:8px;padding:5px 0;border-bottom:1px solid #EEF2F2}.l span{font-weight:700;color:#6B7676;font-size:10.5px;text-transform:uppercase}
   table{width:100%;border-collapse:collapse;font-size:11.5px}th{text-align:left;color:#6B7676;font-weight:600;padding:4px;border-bottom:1px solid #E3E8E8}td{padding:4px;border-bottom:1px solid #EEF2F2}td:last-child,th:last-child{text-align:right}
   .f{margin-top:18px;color:#8A9393;font-size:10px}.bar{height:6px;background:${col};border-radius:3px;margin-bottom:12px}@media print{.np{display:none}}
   .np{position:fixed;top:12px;right:12px;padding:8px 14px;border:0;border-radius:8px;background:#1C7F79;color:#fff;font-weight:700;cursor:pointer}</style></head><body>
   <button class="np" onclick="print()">Imprimir o guardar PDF</button><div class="bar"></div><h1>${esc(where)}</h1><p class="sub">${esc(eObjN())} · ${esc(me)} · ${new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'})}</p>
   <div class="l">${lines.map(([t,p])=>`<div><span>${esc(t)}</span><p style="margin:0">${p}</p></div>`).join('')}</div>
   <div class="k"><div><b>${c('dis')}</b><span>secciones a disputar</span></div><div><b>${c('cui')}</b><span>a defender</span></div><div><b>${c('seg')}</b><span>a conservar</span></div><div><b>${c('dif')}</b><span>a contener</span></div></div>
   ${dis.length?`<h2>Secciones a disputar (las ${Math.min(20,dis.length)} más cercanas de ${dis.length})</h2>${tb(['Sección','Municipio','Distrito local','Qué hacer','Votos que le faltarían'],dis.slice(0,20).map(x=>[S[x.i].s,esc(MUN[S[x.i].m]),S[x.i].dl,x.act==='mov'?'Movilizar':'Convencer',fmt(Math.round(x.rv-x.mine)+1)]))}`:''}
   ${def.length?`<h2>Secciones a defender (las ${Math.min(12,def.length)} más cerradas de ${def.length})</h2>${tb(['Sección','Municipio','Distrito local','Ventaja en votos'],def.slice(0,12).map(x=>[S[x.i].s,esc(MUN[S[x.i].m]),S[x.i].dl,fmt(Math.round(x.mine-x.rv))]))}`:''}
   <p class="f">Laboratorio Político · Proyección propia con resultados del INE por sección 2015–2024 y lista nominal vigente; no es una encuesta. La lista completa se descarga en la plataforma.</p></body></html>`;
  const w=window.open('','_blank'); if(!w){toast('Permite ventanas emergentes para abrir la ficha.'); return;} w.document.open(); w.document.write(html); w.document.close();}
/* --- guía de primera vez --- */
const GKEY='lab_guia_v1'; let GRUN=false,GTRY=false;
function guiaStart(force){if(GRUN) return; if(!force){if(GTRY) return; GTRY=true; try{if(localStorage.getItem(GKEY)) return;}catch(e){}}
  const steps=[['.es-meta [data-pjdet]','Proyección completa','Aquí abres cuántos ganaría, dónde se decide y qué le falta.'],
    ['.cg2 [data-pjdet]','Congreso','Cómo quedaría el congreso con plurinominales y qué necesitaría para la mayoría.'],
    ['.es-leg','Qué hacer en cada sección','Toca una acción (disputar, defender…) para iluminar esas secciones en el mapa.'],
    ['#esdl','Llevarlo a campo','Descarga las secciones en Excel o abre una ficha para imprimir.'],
    ['#rMe','Cómo se calcula','Si alguien pregunta de dónde sale una cifra, aquí está la explicación.']];
  if(!document.querySelector('.es-meta')) {GTRY=false; return;} GRUN=true; let k=0; const tip=document.createElement('div'); tip.className='gtip'; document.body.appendChild(tip); const ring=document.createElement('div'); ring.className='gring'; document.body.appendChild(ring);
  const end=()=>{GRUN=false; tip.remove(); ring.remove(); try{localStorage.setItem(GKEY,'1');}catch(e){}};
  const show=()=>{const [sel,t,d]=steps[k],el=document.querySelector(sel); if(!el){k++; return k<steps.length?show():end();} el.scrollIntoView({block:'center'});
    setTimeout(()=>{const el2=document.querySelector(sel); if(!el2){k++; return k<steps.length?show():end();} el2.scrollIntoView({block:'center'}); const r=el2.getBoundingClientRect(); ring.style.cssText=`left:${r.left-6}px;top:${r.top-6}px;width:${r.width+12}px;height:${r.height+12}px`;
      tip.innerHTML=`<small>${k+1} de ${steps.length}</small><b>${t}</b><p>${d}</p><div><button data-g="x">Saltar</button><button data-g="n" class="on">${k===steps.length-1?'Entendido':'Siguiente'}</button></div>`;
      const tw=Math.min(280,innerWidth-24),left=Math.max(12,Math.min(innerWidth-tw-12,r.left+r.width/2-tw/2)),below=r.bottom+170<innerHeight; tip.style.cssText=`width:${tw}px;left:${left}px;top:${below?r.bottom+14:Math.max(12,r.top-14-150)}px`;
      tip.querySelector('[data-g="x"]').onclick=end; tip.querySelector('[data-g="n"]').onclick=()=>{k++; k<steps.length?show():end();};},450);};
  show();}

/* ===== Vista ejecutiva: el estado de un partido en una sola pantalla, y el mismo resumen en PDF para WhatsApp =====
   Usa los mismos cálculos que la Estrategia, la tarjeta de proyección y el congreso (pjRun, congBase, eSecs):
   nada se calcula distinto aquí, solo se resume. Cargos: los que se eligen en 2027 en el estado (EOBJ).
   "Hoy": quién ganó la última elección de cada cargo (congreso: mayoría relativa ganada + plurinominales con la regla del estado).
   Alianzas: el partido solo, con el aliado que más le suma y con todos sus aliados posibles (los de 2021 en adelante). */
const EXN={GOB:'Gubernatura',DIPL:'Congreso local',AYU:M0.cab==='cdmx'?'Alcaldías':'Ayuntamientos',DIPF:'Diputaciones federales'};
const EXC={GOB:'Gubernatura',DIPL:'Distritos locales',AYU:M0.cab==='cdmx'?'Alcaldías':'Ayuntamientos',DIPF:'Dip. federales'};
const EXDAY=Date.UTC(2027,5,6),exDias=()=>Math.max(0,Math.ceil((EXDAY-Date.now())/864e5));
const exPN=p=>NM[p]||p,exBN=ms=>ms.map(exPN).join('-');
const exDots=(k,cls='')=>`<span class="ex-dots ${cls}">${Array.from({length:10},(_,j)=>`<i${j<k?' class="on"':''}></i>`).join('')}</span>`;
const exK=p=>Math.max(0,Math.min(10,Math.round(10*p)));
const exPill=p=>p>=.65?['Favorable','fav']:p>.35?['En juego','jue']:['Difícil','dif'];
/* corre fn con el cargo y la alianza indicados, como si se eligieran en la Estrategia, y deja todo como estaba */
function exWith(T,al,fn){const o=st.es.obj,a=st.es.al; st.es.obj=T; st.es.al=al; try{return fn();} finally{st.es.obj=o; st.es.al=a;}}
const exUnits=T=>{const lv=PJT[T],G={}; if(lv==='est') return {0:ALL}; ALL.forEach(i=>{const k=pjKey(T,i); (G[k]||(G[k]=[])).push(i);}); return G;};
/* hoy: lo que ganó el partido (con su alianza de entonces) en la última elección del cargo */
function exHoy(T,p){const L=lastOf(T); if(!L) return null; const yr=D.E[L].year;
  if(T==='DIPL'){const U=exUnits(T),MR={}; let n=0,of=0; Object.values(U).forEach(ii=>{const t=totals(L,ii); if(!t.val||!t.bl[0]) return; of++; const w=t.bl[0],top=w.members.filter(m=>m!=='OTROS').sort((a,b)=>(t.tot[b]||0)-(t.tot[a]||0))[0]; if(top) MR[top]=(MR[top]||0)+1; if(w.members.includes(p)) n++;});
    const SG=typeof congSig==='function'?congSig():{}; if(Object.keys(SG).length){Object.keys(MR).forEach(k=>delete MR[k]); Object.values(SG).forEach(q=>{const m=String(q).split(/[_-]/)[0]; MR[m]=(MR[m]||0)+1;});}
    const tt=totals(L,ALL),blk=(tt.bl.find(b=>b.members.includes(p))||{members:[p]}).members.filter(m=>m!=='OTROS');
    let seats=null,NT=null; try{const r=rpAsigna(tt.tot,MR); NT=r.NT; seats=blk.reduce((a,m)=>a+((r.out[m]||{}).t||0),0);}catch(e){}
    return {yr,n,of,seats,NT,ally:blk.length>1,blk};}
  if(T==='GOB'){const t=totals(L,ALL),w=t.bl[0]; return {yr,gov:!!(w&&w.members.includes(p)),who:w?exBN(w.members.filter(m=>m!=='OTROS')):'—',n:w&&w.members.includes(p)?1:0,of:1};}
  const U=exUnits(T);
  /* ayuntamientos: si hay registro de quién gobierna cada municipio (meta.gan), manda sobre el resultado por sección */
  if(T==='AYU'&&typeof GAN!=='undefined'&&GAN&&GAN.pm){let n=0,of=0; Object.keys(U).forEach(k=>{const L_=GAN.pm[String(k)]; if(!L_||!L_.length) return; const r=L_.slice().sort((a,b)=>b[0]-a[0])[0]; of++; if(String(r[3]||r[2]||'').split(/[_-]/).includes(p)) n++;}); if(of>=Object.keys(U).length*.8) return {yr,n,of};}
  let n=0,of=0; Object.values(U).forEach(ii=>{const t=totals(L,ii); if(!t.val||!t.bl[0]) return; of++; if(t.bl[0].members.includes(p)) n++;}); return {yr,n,of};}
/* voto propio del partido en la última elección del cargo (puntos) */
const exOwn=(T,p)=>{const L=lastOf(T); if(!L) return null; const t=totals(L,ALL); return t.val?{v:100*(t.tot[p]||0)/t.val,yr:D.E[L].year}:null;};
/* un cargo con una alianza: lo que muestran la tarjeta de proyección y el congreso */
function exCargo(T,p,al,ns){return exWith(T,al,()=>{const R=pjRun(T,ALL,p,0,ns); if(!R||R.none) return null;
  const riv=R.pano.filter(x=>x.j!==R.fi).sort((a,b)=>b.share-a.share)[0],o={T,R,n:R.n,lead:R.lead,half:R.half,share:R.share,riv:riv?exBN(riv.ms):'—',rivSh:riv?riv.share:0,m:R.n===1?R.U[0].m:null};
  if(T==='GOB'){o.p=R.U[0].p;}
  else if(T==='DIPL'&&typeof congBase==='function'&&!ns){const B=congBase(); if(B&&B.pr){o.p=B.pr.pM; o.seats=B.tb; o.NT=B.NT; o.hm=B.half; o.need=congNeed(B); o.B=B;} else o.p=R.pMaj;}
  else o.p=R.pMaj;
  return o;});}
/* escenarios de alianza: solo, con el aliado que más suma y con todos los posibles */
function exAli(p,TS){if(typeof eScen!=='function') return null; const sc=eScen(p),base=sc[0],pool=EPOOL(p).filter(m=>!base.includes(m)); if(!pool.length) return {cols:[base],res:{}};
  const val=al=>TS.reduce((a,T)=>{const c=exCargo(T,p,al,400); return a+(c?(T==='GOB'?c.m/10:c.lead/c.n):0);},0);
  const ones=pool.map(m=>({m,al:base.concat([m])})); ones.forEach(x=>x.v=val(x.al)); ones.sort((a,b)=>b.v-a.v);
  const cols=[base,ones[0].al]; if(pool.length>1) cols.push(base.concat(pool));
  const res={}; TS.forEach(T=>res[T]=cols.map(al=>exCargo(T,p,al,600))); return {cols,res};}
/* lugares en casi empate entre todos los cargos: donde se decide */
function exNear(C){const L=[]; C.forEach(c=>{if(!c) return; c.R.U.forEach(u=>{if(Math.abs(u.m)<3) L.push({T:c.T,k:u.k,m:u.m,nm:c.T==='GOB'?'la gubernatura':c.T==='AYU'?MUN[u.k]:c.T==='DIPL'?'el distrito local '+u.k:'el distrito federal '+u.k});});});
  return L.sort((a,b)=>Math.abs(a.m)-Math.abs(b.m)).slice(0,3);}
/* secciones por acción y ruta de votos (Estrategia) para el cargo de referencia */
function exSecs(T,p){return exWith(T,[p],()=>{const E=eSecs(); if(!E||!E.L) return null; const c={dis:0,cui:0,seg:0,dif:0}; E.L.forEach(x=>{const a=eAct4(x.act); if(a in c) c[a]++;});
  let votos=0,secR=0; Object.values(E.CT||{}).forEach(k=>{if(k.d&&k.d.gap>0){votos+=k.acc||0; secR+=k.n||0;}}); return {c,n:E.L.length,votos,secR};});}
/* municipios con más votos: cómo le iría ahí */
function exVoto(T,p){return exWith(T,[p],()=>{const G={}; ALL.forEach(i=>{(G[S[i].m]||(G[S[i].m]=[])).push(i);}); const P=eP(),tot=ALL.reduce((a,i)=>a+(P[i]?P[i].V:0),0)||1;
  return Object.entries(G).map(([m,ii])=>({m,V:ii.reduce((a,i)=>a+(P[i]?P[i].V:0),0),ii})).sort((a,b)=>b.V-a.V).slice(0,2).map(x=>{const d=eDuel27(x.ii,[p]); return {nm:MUN[x.m],sh:100*x.V/tot,mg:d?d.mg:null,rv:d?d.rvN:'—'};});});}
function exParty(){if(st.party) return st.party; const g=lastOf('GOB'),t=g?totals(g,ALL):null; const w=t&&t.bl[0]?t.bl[0].lead:null; return w&&EPARTIES.includes(w)?w:EPARTIES[0];}
/* todo lo que muestra la vista (y el PDF) */
function exData(){const p=exParty(),TS=EOBJ.map(o=>o[0]);
  const CG=TS.map(T=>{const sl=eScen(p)[0],c=exCargo(T,p,sl); if(!c) return null; c.hoy=exHoy(T,p); c.own=exOwn(T,p); return c;}).filter(Boolean);
  const A=exAli(p,CG.map(c=>c.T)),ref=CG.find(c=>c.T==='DIPL')||CG[0],SE=ref?exSecs(ref.T,p):null,VO=ref?exVoto(ref.T,p):null,CL=exNear(CG);
  const hoyMay=c=>c.T==='GOB'?c.hoy&&c.hoy.gov:c.T==='DIPL'&&c.hoy&&c.hoy.seats!=null?c.hoy.seats>=Math.floor(c.hoy.NT/2)+1:c.hoy&&c.hoy.n>=Math.floor(c.hoy.of/2)+1;
  CG.forEach(c=>c.gob=!!hoyMay(c));
  const gov=CG.filter(c=>c.gob).length,sure=CG.filter(c=>c.p>=.85),N=CG.length;
  const h1=(gov===N?`${exPN(p)} gobierna hoy todo lo que se elige en ${EST}`:gov===0?`${exPN(p)} hoy no tiene la mayoría en ninguno de los cargos que se eligen en ${EST}`:`${exPN(p)} tiene hoy la mayoría en ${gov} de los ${N} cargos que se eligen en ${EST}`)
    +'; '+(sure.length===0?(gov?'sola, no tendría ninguno asegurado.':'sola, no ganaría ninguno con seguridad.'):sure.length===N?'sola, los tendría todos con ventaja amplia.':`sola, solo tendría con ventaja amplia ${sure.map(c=>EXN[c.T].toLowerCase()).join(' y ')}.`);
  return {p,C:CG,A,ref,SE,VO,CL,h1,date:new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),enc:CG.some(c=>pjEnc(c.T))};}
/* textos por cargo */
function exTx(c){const h=c.hoy||{},pn=exPN(EXD.p);
  const hoy=c.T==='GOB'?(h.gov?`Hoy gobierna ${h.who===pn?pn:h.who}`:`Hoy gobierna ${h.who}`):c.T==='DIPL'?(h.seats!=null?`Hoy ${h.seats} de ${h.NT}${h.ally?' con aliados':''}`:`Hoy ganó ${h.n} de ${h.of} distritos`):`Hoy ${h.n} de ${h.of}`;
  const sola=c.T==='GOB'?(c.m>=0?`iría adelante por ${c.m.toFixed(0)} pts`:`iría atrás por ${Math.abs(c.m).toFixed(0)} pts`):c.T==='DIPL'&&c.seats!=null?`unas ${c.seats} de ${c.NT}; mayoría con ${c.hm}`:`adelante en ${c.lead} de ${c.n}; mayoría con ${c.half}`;
  const what=c.T==='GOB'?'gana':c.T==='DIPL'?'tiene mayoría':'gana la mayoría';
  const tr=c.own?(()=>{const d=c.share-c.own.v; return Math.abs(d)<1?`igual que ${c.own.yr}`:`${d>0?'▲':'▼'} ${Math.abs(d).toFixed(0)} ${Math.abs(d).toFixed(0)==='1'?'pt':'pts'} vs ${c.own.yr}`;})():'';
  const [pl,pk]=exPill(c.p);
  return {hoy,sola,what,tr,pl:(c.gob?'Retener':'Conquistar')+' · '+pl.toLowerCase(),pk};}
let EXD=null;
function exAliTxt(A){if(!A||A.cols.length<2) return ''; const fmtC=(c,T)=>!c?'—':T==='GOB'?(c.m>=0?'+':'−')+Math.abs(c.m).toFixed(1)+' pts':T==='DIPL'?String(c.lead):String(c.lead);
  const names=A.cols.map((al,j)=>j===0?'Sola':'Con '+al.slice(1).map(exPN).join(' y '));
  const rows=Object.entries(A.res).map(([T,v])=>`<span class="ex-at">${EXC[T]}</span>${v.map((c,j)=>`<span${j&&c&&v[0]&&(T==='GOB'?c.m>v[0].m+.5:c.lead>v[0].lead)?' class="up"':''}>${fmtC(c,T)}${j===0&&c&&T!=='GOB'?` de ${c.n}`:''}</span>`).join('')}`).join('');
  return {names,html:`<div class="ex-al" style="grid-template-columns:minmax(120px,1.3fr) repeat(${A.cols.length},minmax(0,1fr))"><span></span>${names.map(n=>`<b>${esc(n)}</b>`).join('')}${rows}</div>`};}
function exClave(D){const d=D.C.find(c=>c.T==='DIPL'); if(d&&d.need) return d.need.replace(/<[^>]+>/g,'');
  const g=D.C.find(c=>c.T==='GOB'); if(g){const mt=pjMeta(g.R.U[0]); return mt?`Para tener 7 de cada 10 escenarios a favor en la gubernatura le harían falta unos ${fmt(mt.nuevos)} votos más.`:'En la gubernatura ya tendría 7 o más de cada 10 escenarios a favor: lo decisivo es no perder votos.';}
  return '';}
function exHTML(D){const pn=exPN(D.p),c0=C[D.p]||'#1C7F79',A=exAliTxt(D.A),SE=D.SE,cl=exClave(D);
  const tiles=D.C.map((c,j)=>{const t=exTx(c),k=exK(c.p); return `<article class="ex-t" style="animation-delay:${j*70}ms"><header><b>${EXN[c.T]}</b><em class="ex-p ${t.pk}">${t.pl}</em></header>
    <div class="ex-big"><b>${k}</b><span>de cada 10 escenarios<br>${t.what}</span></div>${exDots(k)}
    <p><strong>${esc(t.hoy)}.</strong> Sola: ${esc(t.sola)}.</p><footer><span>Rival: ${esc(c.riv)}</span>${t.tr?`<span>${t.tr}</span>`:''}</footer></article>`;}).join('');
  const AV=AVAIL.filter(x=>typeof LAB_PUEDE!=='function'||LAB_PUEDE(x.cab));
  const strip=AV.length>1?`<nav class="ex-st" aria-label="Tus estados">${AV.map(x=>`<button data-excab="${x.cab}" aria-pressed="${x.cab===M0.cab}">${esc(x.estado)}</button>`).join('')}</nav>`:'';
  const parts=EPARTIES.filter(q=>MAIN.includes(q)).map(q=>`<button data-exp="${q}" aria-pressed="${q===D.p}"><i style="background:${C[q]||'#999'}"></i>${esc(exPN(q))}</button>`).join('');
  const qh=SE?`<section class="ex-c"><h3>Qué hacer en las ${fmt(SE.n)} secciones <small>${EXN[D.ref.T].toLowerCase()}</small></h3><div class="ex-bar">${[['dis','#F46883'],['cui','#93D6D0'],['seg','#1C7F79'],['dif','#D3DADA']].map(([k,col])=>`<i style="flex:${SE.c[k]||0};background:${col}"></i>`).join('')}</div>
    <div class="ex-q"><div><b>${fmt(SE.c.dis)}</b><span>por disputar: perdería por menos de 10 pts</span></div><div><b>${fmt(SE.c.cui)}</b><span>por defender: ganaría por menos de 10 pts</span></div><div><b>${fmt(SE.c.seg)}</b><span>por conservar: ventaja de 10 pts o más</span></div><div><b>${fmt(SE.c.dif)}</b><span>difíciles: perdería por más de 10</span></div></div></section>`:'';
  const vo=D.VO&&D.VO.length?`<section class="ex-c"><h3>Dónde está el voto</h3>${D.VO.map(v=>`<p><b>${esc(v.nm)}</b>, ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`<span class="up">ganaría por ${v.mg.toFixed(0)} pts</span>`:`<span class="dn">perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts</span>`}.</p>`).join('')}</section>`:'';
  const cls=D.CL.length?`<div class="ex-dec"><span>Se decide en</span>${D.CL.map(x=>`<b>${esc(x.nm)}</b>`).join('')}<em>casi empate</em></div>`:'';
  return `<div class="ex-in">${strip}<div class="ex-top"><span class="ex-tag">Proyección 2027 · ${D.enc?'con encuesta':'sin encuesta'} · faltan ${exDias()} días</span><div class="ex-ps" role="group" aria-label="Partido">${parts}</div>
    <div class="ex-act"><button class="presb" id="expdf"><svg viewBox="0 0 12 12"><path d="M6 1v6.5M3.3 5 6 7.7 8.7 5M1.5 10.5h9"/></svg>PDF para WhatsApp</button><button class="presb" id="exx">Análisis completo</button></div></div>
    <h1 class="ex-h1" style="--pc:${c0}">${esc(D.h1)}</h1>
    <div class="ex-ts">${tiles}</div>
    <div class="ex-row"><section class="ex-c"><h3>Resultados posibles si va en alianza <small>${D.C.some(c=>c.T==='GOB')?'adelante en · gubernatura: diferencia':'adelante en'}</small></h3>${A?A.html:'<p>No ha ido en alianza desde 2021: no hay socios que comparar.</p>'}</section><div class="ex-col">${qh}${vo}</div></div>
    <section class="ex-k"><div><span>La clave</span><p>${esc(cl)}</p>${cls}</div><div class="ex-kb"><button id="exgo">Ver dónde y qué hacer ›</button></div></section>
    <p class="ex-ft">Estimación con resultados oficiales por sección${D.enc?' y la encuesta capturada':', sin encuesta ni candidatos'}: muestra hacia dónde van las tendencias, no el resultado de 2027. ${esc(D.date)}.</p></div>`;}
/* ---------- PDF A4 vertical: portada que se entiende sola en la vista previa de WhatsApp + página de resumen ---------- */
function exPDFPages(D){const pn=exPN(D.p),A=exAliTxt(D.A),SE=D.SE,cl=exClave(D);
  const rows=D.C.map(c=>{const t=exTx(c),k=exK(c.p); return `<div class="xp-r"><b>${EXN[c.T]}</b><span class="xp-n">${esc(t.hoy.replace(/^Hoy (gobierna )?/,'').replace(/^./,s=>s.toUpperCase()))}</span><span>${esc(t.sola)}<br><small>contra ${esc(c.riv)}</small></span><span>${exDots(k,'d')}<small>${k} de cada 10 escenarios</small></span></div>`;}).join('');
  const ali=D.A&&D.A.cols.length>1?(()=>{const j=D.A.cols.length-1,al=D.A.cols[j]; const bits=Object.entries(D.A.res).map(([T,v])=>{const c=v[j]; return !c?null:T==='GOB'?`${c.m>=0?'adelante':'atrás'} por ${Math.abs(c.m).toFixed(0)} pts en gubernatura`:`adelante en ${c.lead} de ${c.n} ${T==='DIPL'?'distritos':T==='AYU'?(M0.cab==='cdmx'?'alcaldías':'ayuntamientos'):'federales'}`;}).filter(Boolean); return `<div class="xp-al"><b>En alianza con ${esc(al.slice(1).map(exPN).join(' y '))}</b> iría ${bits.join(', ')}.</div>`;})():'';
  const cover=`<section class="xp xp-cv"><div class="xp-hd"><span><i class="xp-lg"></i>Laboratorio Político</span><span>${esc(D.date)}</span></div>
    <div class="xp-ti"><span class="xp-tag">Proyección 2027 · faltan ${exDias()} días</span><h1>${esc(EST)} <em><i style="background:${C[D.p]||'#999'}"></i>${esc(pn)}</em></h1><p>${esc(D.h1.replace(new RegExp('^'+pn+' '),'').replace(/^./,s=>s.toUpperCase()))}</p></div>
    <div class="xp-tb"><div class="xp-r xp-rh"><span></span><span>Hoy</span><span>Sola en 2027</span><span>A favor</span></div>${rows}</div>${ali}
    <div class="xp-cl"><small>Dónde se decide</small><p>${esc(cl)}</p>${D.CL.length?`<span class="xp-dc">En casi empate: ${D.CL.map(x=>esc(x.nm)).join(', ')}.</span>`:''}</div>${D.VO&&D.VO.length?`<div class="xp-vo"><small>Dónde está el voto</small><p>${D.VO.map(v=>`<b>${esc(v.nm)}</b>, ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`ganaría por ${v.mg.toFixed(0)} pts`:`perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts`}`).join('. ')}.</p></div>`:''}
    <p class="xp-ft"><b>${D.enc?'Con encuesta capturada, sin candidatos:':'Sin encuesta ni candidatos:'}</b> muestra hacia dónde van las tendencias con los resultados oficiales, no el resultado de 2027. Detalle en la página 2.</p></section>`;
  const p2=`<section class="xp xp-p2"><div class="xp-hd2"><span>${esc(EST)} · ${esc(pn)} · Proyección 2027</span><span>2 / 2</span></div><h2>${esc(D.h1)}</h2>
    <div class="xp-g">${D.C.map(c=>{const t=exTx(c),k=exK(c.p); return `<div class="xp-c"><header><b>${EXN[c.T]}</b><em class="ex-p ${t.pk}">${t.pl}</em></header><div class="xp-big"><b>${k}</b><span>de cada 10 escenarios ${t.what}</span></div>${exDots(k)}<p><strong>${esc(t.hoy)}.</strong> Sola: ${esc(t.sola)}.</p><footer>Rival: ${esc(c.riv)}${t.tr?' · '+t.tr:''}</footer></div>`;}).join('')}</div>
    ${A?`<div class="xp-c"><b>Resultados posibles si va en alianza</b>${A.html}</div>`:''}
    ${SE?`<div class="xp-c"><b>Qué hacer en las ${fmt(SE.n)} secciones (${EXN[D.ref.T].toLowerCase()})</b><div class="xp-q"><div><b>${fmt(SE.c.dis)}</b><span>por disputar: perdería por menos de 10 pts</span></div><div><b>${fmt(SE.c.cui)}</b><span>por defender: ganaría por menos de 10 pts</span></div><div><b>${fmt(SE.c.seg)}</b><span>por conservar: ventaja de 10 pts o más</span></div></div></div>`:''}
    ${D.VO&&D.VO.length?`<div class="xp-c"><b>Dónde está el voto</b><p>${D.VO.map(v=>`${esc(v.nm)}, ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`<span class="up">ganaría por ${v.mg.toFixed(0)} pts</span>`:`<span class="dn">perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts</span>`}`).join('. ')}.</p></div>`:''}
    <div class="xp-k"><small>La clave</small><p>${esc(cl)}</p></div>
    <p class="xp-ft2">Estimación con resultados oficiales por sección${D.enc?' y la encuesta capturada':', sin encuesta'}. Las cifras son aproximadas: lo que podría pasar si se mantienen las tendencias, no un pronóstico cerrado.</p></section>`;
  return [cover,p2];}
/* el PDF se arma en cuanto se abre la vista, para que al tocar el botón se comparta al instante: el celular solo deja
   abrir el menú de compartir (WhatsApp) justo después del toque, no varios segundos después */
let EXPDF=null;
const exCanShare=()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File([new Blob(['x'],{type:'application/pdf'})],'x.pdf',{type:'application/pdf'})]}));}catch(e){return false;}};
async function exPDFBlob(D){if(!window.jspdf||!window.html2canvas) throw new Error('sin librerías');
  const host=document.createElement('div'); host.className='xp-host'; host.innerHTML=exPDFPages(D).join(''); document.body.appendChild(host);
  try{await (document.fonts?document.fonts.ready:Promise.resolve()); const {jsPDF}=window.jspdf,W=794,H=1123,doc=new jsPDF({orientation:'portrait',unit:'px',format:[W,H],hotfixes:['px_scaling'],compress:true}); const pg=[...host.children];
    for(let j=0;j<pg.length;j++){const cv=await html2canvas(pg[j],{scale:2,width:W,height:H,backgroundColor:j?'#F4F6F6':'#1E2A2A',logging:false}); if(j) doc.addPage([W,H],'portrait'); doc.addImage(cv.toDataURL('image/jpeg',.88),'JPEG',0,0,W,H);}
    return {blob:doc.output('blob'),name:('Resumen_'+norm(EST)+'_'+D.p+'_2027').replace(/[^\w]+/g,'_')+'.pdf'};}
  finally{host.remove();}}
function exPrep(){const D=EXD,key=M0.cab+'|'+D.p; if(EXPDF&&EXPDF.key===key) return EXPDF.pr; const pr=exPDFBlob(D).catch(e=>{console.error(e); return null;}); EXPDF={key,pr}; return pr;}
async function exPDF(btn){if(!EXD) return; const o=btn.innerHTML; const ready=EXPDF&&EXPDF.key===M0.cab+'|'+EXD.p&&EXPDF.done;
  if(!ready){btn.disabled=true; btn.textContent='Preparando…';}
  try{const r=await exPrep(); if(!r){toast('No se pudo generar el PDF. Recarga la página.'); return;}
    const f=new File([r.blob],r.name,{type:'application/pdf'});
    if(exCanShare()){try{await navigator.share({files:[f],title:'Proyección 2027 · '+EST,text:EST+' · '+exPN(EXD.p)+': '+EXD.h1});}
      catch(e){if(e&&e.name==='NotAllowedError'){btn.disabled=false; btn.innerHTML='Tocar para compartir'; return;} if(!(e&&e.name==='AbortError')) await saveFile(r.name,r.blob);}}
    else await saveFile(r.name,r.blob);}
  finally{btn.disabled=false; if(btn.textContent==='Preparando…') btn.innerHTML=o;}}
/* ---------- abrir / cerrar ---------- */
function exRender(){const w=$('exe'); if(!w) return; w.innerHTML='<div class="ex-wait">Calculando…</div>';
  setTimeout(()=>{try{EXD=exData(); w.innerHTML=exHTML(EXD);}catch(e){console.error(e); w.innerHTML='<div class="ex-wait">No se pudo armar la vista ejecutiva de este estado.</div>'; return;}
    w.querySelectorAll('[data-exp]').forEach(b=>b.onclick=()=>{st.party=b.dataset.exp; $('party').value=st.party; st.es.al=null; st.es.seg=null; if($('rPa')) $('rPa').setAttribute('aria-pressed',true); exRender(); render(true);});
    w.querySelectorAll('[data-excab]').forEach(b=>b.onclick=()=>{if(b.dataset.excab===M0.cab) return; try{sessionStorage.setItem('lab_exe','1'); if(st.party) sessionStorage.setItem('lab_exe_p',st.party);}catch(e){} location.hash=b.dataset.excab; location.reload();});
    $('exx').onclick=exClose; $('expdf').onclick=()=>exPDF($('expdf')); if(exCanShare()) $('expdf').lastChild.textContent='Compartir por WhatsApp'; setTimeout(()=>{const pr=exPrep(); pr.then(()=>{if(EXPDF) EXPDF.done=true;});},400);
    $('exgo').onclick=()=>{const T=EXD.ref?EXD.ref.T:null; if(!st.party){st.party=EXD.p; $('party').value=st.party;} exClose(); if(T) st.es.obj=T; setView2('est');};},30);}
function exOpen(){let w=$('exe'); if(!w){w=document.createElement('div'); w.id='exe'; w.className='exe'; w.setAttribute('role','region'); w.setAttribute('aria-label','Vista ejecutiva'); document.querySelector('.main').appendChild(w);}
  if(!st.party){const p=exParty(); if(p){st.party=p; $('party').value=p;}} document.body.classList.add('exview'); if($('rEx')) $('rEx').setAttribute('aria-pressed',true); try{sessionStorage.setItem('lab_exe','1');}catch(e){} exRender();}
function exClose(){const w=$('exe'); if(w) w.remove(); document.body.classList.remove('exview'); if($('rEx')) $('rEx').setAttribute('aria-pressed',false); try{sessionStorage.removeItem('lab_exe');}catch(e){} render(true);}
(()=>{const r=document.querySelector('.rail #rIn'); if(r&&!$('rEx')){const b=document.createElement('button'); b.className='ri'; b.id='rEx'; b.setAttribute('aria-pressed','false'); b.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/></svg><b>Vista ejecutiva</b>'; r.after(b); b.onclick=()=>$('exe')?exClose():exOpen();}
  const c=$('presb'); if(c&&!$('exb')){const b=document.createElement('button'); b.className='presb'; b.id='exb'; b.title='El estado del partido en una sola pantalla, con PDF para WhatsApp'; b.innerHTML='<svg viewBox="0 0 16 16"><rect x="1.5" y="2" width="5.5" height="5" rx="1"/><rect x="9" y="2" width="5.5" height="5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5" rx="1"/><rect x="9" y="9" width="5.5" height="5" rx="1"/></svg>Vista ejecutiva'; c.before(b); b.onclick=exOpen;}
  let pv=null; try{pv=sessionStorage.getItem('lab_exe_p'); sessionStorage.removeItem('lab_exe_p');}catch(e){} if(pv&&EPARTIES.includes(pv)){st.party=pv; if($('party')) $('party').value=pv;}
  let on=false; try{on=sessionStorage.getItem('lab_exe')==='1';}catch(e){} if(on) setTimeout(exOpen,60);})();
/* ---------- presentación de la Estrategia: el botón "Presentación" la arma cuando estás en la Estrategia con un partido elegido ----------
   Material para una reunión de trabajo: lo mismo que la vista ejecutiva más el detalle territorial (dónde se gana o se pierde y cuántos votos). */
async function esDeck(){const D=exData(); EXD=D; const pn=exPN(D.p),AC=C[D.p]||'#1C7F79',N=[],TOT=6+D.C.length,date=D.date;
  const tag=`<span style="margin-left:14px;font:700 12px Inter,Arial;color:#8A4A12;background:#FDEEE5;border-radius:999px;padding:5px 11px;white-space:nowrap">Estimación 2027 · ${D.enc?'con encuesta':'sin encuesta'}</span>`;
  const head=(t,sub)=>`<header class="sl-h"><div><h2>${t}</h2>${sub?`<p>${sub}</p>`:''}</div><span class="sl-pg">${esc(EST)} · ${esc(pn)}${tag}<b>${N.length+1}</b></span></header>`;
  const foot=`<footer class="sl-f"><span>Laboratorio Político</span><span>Estimación con resultados oficiales por sección 2015–2024${D.enc?' y la encuesta capturada':', sin encuesta ni candidatos'}: muestra hacia dónde van las tendencias, no el resultado de 2027.</span></footer>`;
  const slide=(h,body)=>N.push(`<section class="sl" style="--ac:${AC}">${h}<div class="sl-b">${body}</div>${foot}</section>`);
  const K=(v,l,sub)=>`<div class="sl-k"><b>${v}</b><span>${l}</span>${sub?`<em>${sub}</em>`:''}</div>`;
  const dots=k=>`<span style="display:inline-flex;gap:3px;vertical-align:middle">${Array.from({length:10},(_,j)=>`<i style="width:10px;height:10px;border-radius:50%;background:${j<k?'#1C7F79':'#E3E8E8'}"></i>`).join('')}</span>`;
  /* 1 · portada */
  N.push(`<section class="sl sl-cover" style="--ac:${AC}"><div class="sl-cv"><span class="sl-dot"></span><small>${esc(EST)} · Estrategia 2027</small><h1>${esc(pn)}</h1><p>${esc(D.h1)}</p>
    <dl><div><dt>Elección</dt><dd>6 de junio de 2027 · faltan ${exDias()} días</dd></div><div><dt>Base</dt><dd>${D.enc?'Resultados oficiales y encuesta':'Resultados oficiales, sin encuesta'}</dd></div><div><dt>Fecha</dt><dd>${esc(date)}</dd></div></dl></div><footer class="sl-f"><span>Laboratorio Político</span><span>Las cifras son estimaciones: lo que podría pasar si se mantienen las tendencias.</span></footer></section>`);
  /* 2 · cómo llegaría y qué lo decide (sin repetir el detalle de cada cargo, que va en las siguientes) */
  slide(head('Cómo llegaría a 2027 y qué lo decide',esc(D.h1)),`<div class="sl-kr" style="grid-template-columns:repeat(${D.C.length},minmax(0,1fr))">${D.C.map(c=>{const t=exTx(c),k=exK(c.p); return K(`${k}<small style="font-size:18px;color:#8A9393"> de 10</small>`,`${EXN[c.T]}: escenarios en que ${t.what}`,`${esc(t.hoy)} · ${t.pl}`);}).join('')}</div>
    <ul class="sl-pts" style="grid-template-columns:1fr"><li><b>${esc(exClave(D))}</b></li>${D.CL.length?`<li>Se decide en ${D.CL.map(x=>`<b>${esc(x.nm)}</b>`).join(', ')}: ${D.CL.length>1?(D.CL.length===3?'los tres':'los dos'):'está'} en casi empate.</li>`:''}
    ${D.VO&&D.VO.length?`<li>${D.VO.map(v=>`<b>${esc(v.nm)}</b> tiene el ${pct(v.sh,0)} del voto: ${v.mg==null?'—':v.mg>=0?`ganaría por ${v.mg.toFixed(0)} pts`:`perdería frente a ${esc(v.rv)} por ${Math.abs(v.mg).toFixed(0)} pts`}`).join('; ')}.</li>`:''}</ul>`);
  /* 3 · un cargo por diapositiva: lugares más cerrados */
  D.C.forEach(c=>{const t=exTx(c),k=exK(c.p),U=c.R.U.slice();
    if(c.T==='GOB'){const VO=exWith('GOB',[D.p],()=>{const G={}; ALL.forEach(i=>{(G[S[i].m]||(G[S[i].m]=[])).push(i);}); const P=eP(),tot=ALL.reduce((a,i)=>a+(P[i]?P[i].V:0),0)||1; return Object.entries(G).map(([m,ii])=>{const d=eDuel27(ii,[D.p]),V=ii.reduce((a,i)=>a+(P[i]?P[i].V:0),0); return {nm:MUN[m],sh:100*V/tot,mg:d?d.mg:null,rv:d?d.rvN:'—',gap:d?d.gap:0};}).sort((a,b)=>b.sh-a.sh).slice(0,10);});
      slide(head('Gubernatura',`${esc(t.hoy)} · sola: ${esc(t.sola)} · ${k} de cada 10 escenarios gana`),`<div class="sl-g2"><div><h3>Dónde está el voto <small>los 10 municipios con más votos esperados</small></h3><table class="sl-t"><thead><tr><th>Municipio</th><th class="r">% del voto</th><th class="r">Diferencia</th><th class="r">Votos</th></tr></thead><tbody>${VO.map(v=>`<tr><td>${esc(v.nm)}</td><td class="r">${pct(v.sh,0)}</td><td class="r ${v.mg>=0?'up':'dn'}">${v.mg==null?'—':Math.abs(v.mg)<.05?'empate':(v.mg>=0?'+':'−')+Math.abs(v.mg).toFixed(1)+' pts'}</td><td class="r">${v.mg==null?'—':v.gap>0?'le faltarían '+fmt(v.gap):'ventaja de '+fmt(-v.gap)}</td></tr>`).join('')}</tbody></table></div>
        <div><h3>Lectura</h3><p class="sl-note">${c.m>=0?`Iría adelante por <b>${c.m.toFixed(1)} puntos</b> contra ${esc(c.riv)}.`:`Iría atrás por <b>${Math.abs(c.m).toFixed(1)} puntos</b> contra ${esc(c.riv)}.`} En <b>${k} de cada 10</b> escenarios simulados ganaría. ${(()=>{const mt=pjMeta(c.R.U[0]); return mt?`Para llegar a 7 de cada 10 le harían falta unos <b>${fmt(mt.nuevos)} votos</b> más (o quitarle ${fmt(mt.quitados)} al rival).`:'Ya tendría 7 o más de cada 10 escenarios a favor: lo decisivo es no perder votos.';})()}</p>
        ${D.A&&D.A.res.GOB?`<p class="sl-note">${D.A.cols.map((al,j)=>{const x=D.A.res.GOB[j]; return x?`${j?'Con '+al.slice(1).map(exPN).join(' y '):'Sola'}: <b>${(x.m>=0?'+':'−')+Math.abs(x.m).toFixed(1)} pts</b>`:'';}).filter(Boolean).join(' · ')}.</p>`:''}</div></div>`);
      return;}
    const lv=c.T==='AYU'?'Municipio':c.T==='DIPL'?'Distrito local':'Distrito federal',close=U.filter(u=>Math.abs(u.m)<10).sort((a,b)=>Math.abs(a.m)-Math.abs(b.m)).slice(0,c.T==='DIPL'?8:12);
    const row=u=>{const v=Math.round(Math.abs(u.m)/100*u.V); return `<tr><td>${esc(pjName(c.T,u.k))}</td><td class="r ${u.m>=0?'up':'dn'}">${Math.abs(u.m)<.05?'empate':(u.m>=0?'+':'−')+Math.abs(u.m).toFixed(1)+' pts'}</td><td class="r">${u.m>=0?'ventaja de '+fmt(v):'le faltarían '+fmt(v)}</td><td class="r">${dots(exK(u.p))}</td></tr>`;};
    slide(head(EXN[c.T],`${esc(t.hoy)} · sola: ${esc(t.sola)} · ${k} de cada 10 escenarios ${t.what}`),`<div class="sl-kr k3">${K(c.lead+' de '+c.n,'iría adelante','mayoría con '+c.half)}${K(c.R.cat.seg+c.R.cat.pro,'probables o seguros','7 o más de cada 10 escenarios')}${K(c.R.cat.com,'en disputa','entre 4 y 6 de cada 10')}</div>
      ${c.T==='DIPL'&&c.seats!=null?`<p class="sl-note" style="margin:10px 0 0">${(()=>{const B=c.B,bl=B?B.blk:[],o=B?B.x.out:{},mr=bl.reduce((t,m)=>t+((o[m]||{}).mr||0),0),rp=bl.reduce((t,m)=>t+((o[m]||{}).rp||0),0),cl=U.filter(u=>u.m>=0&&u.p<.65).length;
  return `Iría adelante en <b>${c.lead} de ${c.n} distritos</b>${cl?`, pero en ${cl} de ellos tendría 6 o menos de cada 10 escenarios a favor`:''}. En el escenario central ganaría <b>${mr} distritos y ${rp} ${rp===1?'plurinominal':'plurinominales'}: ${c.seats} de ${c.NT}</b>${c.seats<c.hm?`, le faltarían ${c.hm-c.seats} para la mayoría`:''}.${rp===0&&mr>0&&B&&B.NT?' La ley limita a cada partido a 8 puntos por encima de su votación, por eso no le tocarían plurinominales.':''}`;})()}</p>`:''}<h3>Los más cerrados <small>diferencia estimada contra el rival más fuerte · votos que separan</small></h3>${close.length?`<table class="sl-t"><thead><tr><th>${lv}</th><th class="r">Diferencia</th><th class="r">Votos</th><th class="r">Escenarios a favor</th></tr></thead><tbody>${close.map(row).join('')}</tbody></table>`:'<p class="sl-note">Ningún lugar está a menos de 10 puntos: los resultados se ven definidos.</p>'}`);});
  /* 4 · alianzas */
  if(D.A&&D.A.cols.length>1){const names=D.A.cols.map((al,j)=>j?'Con '+al.slice(1).map(exPN).join(' y '):'Sola');
    slide(head('Resultados posibles si va en alianza','Lugares donde iría adelante (gubernatura: diferencia en puntos). Los aliados aportan el rendimiento que mostraron cuando fueron juntos.'),`<table class="sl-t" style="font-size:17px"><thead><tr><th></th>${names.map(n=>`<th class="r">${esc(n)}</th>`).join('')}</tr></thead><tbody>${Object.entries(D.A.res).map(([T,v])=>`<tr><td>${EXC[T]}</td>${v.map((x,j)=>{const b=v[0]; const s=!x?'—':T==='GOB'?(x.m>=0?'+':'−')+Math.abs(x.m).toFixed(1)+' pts':x.lead+' de '+x.n; const up=j&&x&&b&&(T==='GOB'?x.m>b.m+.5:x.lead>b.lead); return `<td class="r${up?' up':''}">${s}</td>`;}).join('')}</tr>`).join('')}</tbody></table>
      <p class="sl-note">${(()=>{const j=D.A.cols.length-1,g=Object.entries(D.A.res).map(([T,v])=>T==='GOB'?null:(v[j]&&v[0]?v[j].lead-v[0].lead:0)).filter(x=>x!=null).reduce((a,b)=>a+b,0); return g>0?`Con todos sus aliados sumaría <b>${g} lugares más</b> donde iría adelante.`:'Las alianzas casi no cambian el resultado.';})()}</p>`);}
  /* 5 · secciones */
  const ref=D.ref,E=ref?exWith(ref.T,[D.p],()=>eSecs()):null;
  if(E&&E.L){const SE=D.SE,cat=[['dis','Disputar','perdería por menos de 10 pts: aquí se gana o se pierde','#F46883'],['cui','Defender','ganaría por menos de 10 pts: que no se voltee','#93D6D0'],['seg','Conservar','ganaría por 10 pts o más','#1C7F79'],['dif','Contener','perdería por más de 10 pts','#D3DADA']];
    const R=E.L.filter(x=>x.add).sort((a,b)=>(a.ord||0)-(b.ord||0)||b.mg-a.mg).slice(0,10);
    slide(head(`Qué hacer en las ${fmt(SE.n)} secciones`,`${EXN[ref.T]} · cada sección contra el rival más fuerte de su ${ref.T==='DIPL'?'distrito':ref.T==='AYU'?'municipio':'territorio'}`),`<div class="sl-g2"><div><div class="sl-cats">${cat.map(([k,t,s,c])=>`<div style="--c:${c}"><b>${fmt(SE.c[k]||0)}</b><span class="t">${t}</span><span>${s}</span></div>`).join('')}</div>
      <div class="sl-stk">${cat.map(([k,,,c])=>`<i style="flex:${SE.c[k]||0};background:${c}"></i>`).join('')}</div></div>
      <div><h3>Ruta: secciones más fáciles de voltear <small>las que perdería por menos, en los lugares donde va atrás</small></h3>${R.length?`<table class="sl-t"><thead><tr><th>Sección</th><th>Municipio</th><th>Qué hacer</th><th class="r">Votos para voltearla</th></tr></thead><tbody>${R.map(x=>`<tr><td>${S[x.i].s}</td><td>${esc(MUN[S[x.i].m]||'')}</td><td>${x.act==='mov'?'Movilizar: votó menos que en su mejor elección':x.act==='con'?'Convencer: ganar votantes de otros':'Convencer: perdería por más de 10 pts'}</td><td class="r">${fmt(x.add)}</td></tr>`).join('')}</tbody></table>`:'<p class="sl-note">Va adelante en todos los lugares: no hay ruta de votos que juntar, lo importante es defender.</p>'}</div></div>`);}
  return N;}

/* ===== arranque ===== */
$('elec').innerHTML=YEARS.map(y=>`<optgroup label="${y}">${Object.keys(TY).filter(t=>D.E[t+'_'+y]).map(t=>`<option value="${t}_${y}">${TY[t]} ${y}</option>`).join('')}</optgroup>`).join(''); $('elec').value=st.elec;
$('elec').onchange=()=>setElec($('elec').value);
$('party').innerHTML='<option value="">Vista general</option>'+['MORENA','MC','PRI','PAN','PT','PVEM','PRD'].map(p=>`<option value="${p}">${NM[p]}</option>`).join('');
$('party').onchange=()=>{st.party=$('party').value; $('rPa').setAttribute('aria-pressed',!!st.party); if(st.party&&!xCur()) st.metric=st.elec?'pv':'duro'; else if(METRICS[st.metric].needP) st.metric='mar'; if(st.view==='map'){renderSoon(true); return;} render(true); if(st.view==='tbl') renderTbl(scope());};
$('map').setAttribute('aria-label','Mapa de '+EST+' por sección');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(st.view==='tbl') setView2('map'); else if(st.sel!=null){st.sel=null; paint();} else if(st.terr) setTerr(null);}});
if(innerWidth<=860) st.fp=false; layout(); render(true); setView([...VB]); requestAnimationFrame(()=>fit(ALL,false));
let rt; addEventListener('resize',()=>{clearTimeout(rt); rt=setTimeout(()=>{render(); fit(LASTFIT&&LASTFIT.length?LASTFIT:ALL.filter(munScope),false);},150);});
window.LAB={st,setView2,setTerr,paint,render}; /* la usa el cargador (sitio.py) para abrir el municipio elegido en la entrada */

}
const ENT_CSS="\n:host{--teal:#4CC1BA;--teal2:#2FA59D;--teal3:#1C7F79;--tealxl:#E4F5F3;--coral:#F46883;--bg:#F4F6F6;--card:#fff;--ink:#4E5656;--strong:#1C2121;--muted:#8A9393;--faint:#B9C1C1;--line:#E6EAEA;--hair:#F0F3F3;--f:'Inter',system-ui,sans-serif;--d:'Manrope','Inter',system-ui,sans-serif}\n*{box-sizing:border-box;margin:0}\n:host{display:block;position:fixed;inset:0;z-index:60;overflow:hidden;background:var(--bg);font:14px/1.45 var(--f);color:var(--ink);-webkit-font-smoothing:antialiased}\n.ent{height:100%}\nbutton{font:inherit;cursor:pointer}\n.wrap{display:grid;grid-template-columns:360px 1fr;gap:20px;padding:24px 28px;height:100vh}\n.side{background:var(--card);border-radius:18px;display:flex;flex-direction:column;overflow:hidden}\n.side h1{font:700 22px var(--d);color:var(--strong);padding:24px 24px 4px}\n.side p.s{color:var(--muted);padding:0 24px 14px;font-size:13px}\n.q{margin:0 24px 12px;display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:12px;padding:0 12px;color:var(--muted);background:#fff}.q:focus-within{border-color:var(--teal2);box-shadow:0 0 0 3px var(--tealxl)}.q input{flex:1;border:0;outline:0;font:inherit;font-size:14px;color:var(--strong);padding:11px 0;background:none;min-width:0}.q kbd{font:11px var(--f);color:var(--faint);border:1px solid var(--line);border-radius:5px;padding:0 5px}\n.q svg{width:14px;height:14px;stroke:var(--muted);fill:none;stroke-width:1.6}\n.last{margin:0 24px 10px;display:flex;align-items:center;justify-content:space-between;background:var(--tealxl);border-radius:12px;padding:10px 12px;font-size:13px;color:var(--teal3)}\n.last b{font-weight:600}\n.list{overflow:auto;padding:4px 12px 16px;flex:1}\n.r{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:10px 12px;border-radius:12px;cursor:pointer;transition:background .15s}\n.r:hover{background:var(--hair)}\n.r.on{background:var(--strong)}.r.on .n,.r.on .v{color:#fff}.r.on .g{color:#B9C1C1}\n.n{font-weight:600;color:var(--strong)}\n.v{font:600 13px var(--f);color:var(--ink);text-align:right;font-variant-numeric:tabular-nums}\n.g{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px}\n.g i,.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none}\n.main{background:var(--card);border-radius:18px;padding:28px 36px 22px;display:flex;flex-direction:column;overflow:hidden}\n.hd{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:32px;align-items:start}\n.eyebrow{font-size:13px;color:var(--muted)}\n.hd h2{font:800 42px/1.05 var(--d);color:var(--strong);letter-spacing:-.02em;margin:6px 0 10px}\n.gobl{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--ink)}\n.gobl i{width:10px;height:10px;border-radius:50%}\n.qgh{font:700 13px var(--d);color:var(--strong);margin-top:16px}\n.qg{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:8px}\n.qg small{display:block;font-size:12px;color:var(--muted);margin-bottom:5px}\n.qg u{display:flex;height:6px;border-radius:3px;overflow:hidden;gap:1px;text-decoration:none;transition:height .15s}\n.qg div:hover u{height:9px}\n.qg em{display:flex;flex-wrap:wrap;gap:2px 8px;font-style:normal;font-size:12.5px;margin-top:6px}\n.qg em i{font-style:normal;display:inline-flex;align-items:center;gap:4px;color:var(--strong);font-weight:600;white-space:nowrap}\n.qg em i.x{color:var(--muted);font-weight:400}\n.loc>svg{width:100%;height:auto;overflow:visible}.btn svg{flex:none}\n.loc path{fill:#E4ECEB;stroke:#fff;stroke-width:.6;cursor:pointer;transition:fill .2s}\n.loc path:hover{fill:#BFE6E2}\n.loc path.on{fill:var(--teal3);stroke:var(--strong);stroke-width:1.4;stroke-dasharray:4 3;animation:ants 1.2s linear infinite}\n@keyframes ants{to{stroke-dashoffset:-14}}\n.pulse circle{pointer-events:none}\n.pulse .c0{fill:var(--teal3);stroke:#fff;stroke-width:2}\n.pulse .c1,.pulse .c2{fill:none;stroke:var(--teal3);stroke-width:2.5;transform-box:fill-box;transform-origin:center;animation:pl 2s ease-out infinite}\n.pulse .c2{animation-delay:1s}\n@keyframes pl{0%{transform:scale(.3);opacity:1}100%{transform:scale(1.8);opacity:0}}\n.body{margin-top:24px;flex:1;display:flex;flex-direction:column;min-height:0}.body .kp{flex:1;max-height:204px}\n.kp{display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:1fr;border-top:1px solid var(--line)}\n.kp>div.ed{grid-column:span 2;display:flex;flex-direction:column;justify-content:center}\n.ed>span{font-size:13px;color:var(--muted)}\n.eb{display:flex;height:12px;border-radius:6px;overflow:hidden;gap:2px;margin:8px 0 6px}\n.eb i{display:block;transition:filter .15s}.eb i:hover{filter:brightness(.88)}\n\n.el{display:flex;gap:2px;font-size:10px;color:var(--muted);letter-spacing:-.01em}.el div{min-width:0;white-space:nowrap;text-align:center}\n.kp .el b{display:block;font:700 12.5px/1.2 var(--d);color:var(--strong)}\n.kp>div{display:flex;flex-direction:column;justify-content:center;padding:16px 0 14px 20px;border-bottom:1px solid var(--line);border-left:1px solid var(--line)}\n.kp>div:nth-child(5n+1){border-left:0;padding-left:0}\n.kp b{display:block;font:800 30px/1.15 var(--d);color:var(--strong);font-variant-numeric:tabular-nums}\n.kp b small{font-size:15px;font-weight:600;color:var(--ink)}\n.kp span{display:block;font:400 10.5px var(--f);color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:3px}\n.kp em{display:block;font-style:normal;font-size:11.5px;color:var(--ink);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.kp .bar{display:flex;height:5px;border-radius:3px;overflow:hidden;margin-top:7px;gap:2px;max-width:150px}\n.kp .bar.one{background:var(--hair)}\n.py{display:flex;flex-direction:column;min-height:0}.pyb{flex:1;display:flex;flex-direction:column;gap:3px;min-height:150px}.py h3{font:700 15px var(--d);color:var(--strong);display:flex;justify-content:space-between;align-items:baseline}\n.py h3 small{font:400 12px var(--f);color:var(--muted)}\n.pyl{display:grid;grid-template-columns:1fr 54px 1fr;font-size:12px;margin:6px 0 4px}\n.pyl span:first-child{text-align:right;color:var(--coral);font-weight:600}.pyl span:last-child{color:var(--teal2);font-weight:600}\n.pr{display:grid;grid-template-columns:1fr 54px 1fr;align-items:center;gap:0;cursor:default;border-radius:4px;transition:background .15s}\n.pr:hover{background:var(--hair)}\n.pr .l,.pr .rr{display:flex;align-items:center;height:100%;gap:6px;font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}\n.pr .l{justify-content:flex-end}\n.pr .l i,.pr .rr i{display:block;height:100%;transition:filter .15s}\n.pr .l i{background:var(--coral);border-radius:3px 0 0 3px}.pr .rr i{background:var(--teal);border-radius:0 3px 3px 0}\n.pr:hover i{filter:brightness(.9)}\n.pr b{text-align:center;font-size:11.5px;font-weight:600;color:var(--strong)}\n.pyn{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.35}\n.hint{font-size:14px;color:var(--muted)}.bigmap{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:20px 0}.bigmap svg{width:100%;height:100%;max-height:560px}.bigmap path{fill:#DCEBEA;stroke:#fff;stroke-width:1;cursor:pointer;transition:fill .15s}.bigmap path:hover{fill:var(--teal)}\n.sb{display:flex;height:6px;border-radius:3px;overflow:hidden;gap:2px;margin-top:8px;max-width:150px;margin-right:12px}.kp>div.ed{padding-right:10px}.sb i{display:block}\n.tn{background:#EAF5F3}\n.kp>div.tn{padding-left:20px}.kp>div:nth-child(6){border-left:0}\n.eh{display:flex;align-items:center;gap:12px}.eh>div span,.eh>div em{display:block}.ew .eb{margin:8px 0 4px}\n.ew>span{font-size:12px;color:var(--muted)}\n.kp>div[data-tip]{position:relative;cursor:pointer}\n.kp>div[data-tip]::after{content:'i';position:absolute;top:10px;right:10px;width:16px;height:16px;border-radius:50%;border:1px solid var(--faint);color:var(--muted);font:600 10px/14px var(--f);text-align:center}\n.qg>div{cursor:pointer;padding:6px 0;margin:-6px 0}\n.tnote{display:block;margin-top:6px;opacity:.75;font-size:11px}\n#tip .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#fff;font-size:16px;line-height:1;opacity:.8;display:none}\n#tip.pin{pointer-events:auto;padding-right:28px}#tip.pin .x{display:block}\n#scrim{position:fixed;inset:0;background:rgba(28,33,33,.3);z-index:19;display:none}\n@media (max-width:700px){#tip.pin{left:0!important;right:0;top:auto!important;bottom:0;max-width:none;border-radius:16px 16px 0 0;padding:20px 20px 28px;font-size:14px}#tip.pin b{font-size:16px;margin-bottom:4px}#tip.pin .x{top:12px;right:14px;font-size:22px}#scrim.on{display:block}}\n.go{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:50%;border:0;background:var(--teal3);color:#fff;vertical-align:middle;margin-left:14px;position:relative;top:-4px;transition:background .15s}\n.go:hover{background:#176B66}.go:active{transform:scale(.96)}\n.go::after{content:attr(data-lbl);position:absolute;left:52px;top:50%;transform:translateY(-50%);white-space:nowrap;font:500 12.5px var(--f);color:var(--ink);opacity:0;transition:opacity .15s;pointer-events:none;letter-spacing:0}\n.go:hover::after,.go:focus-visible::after{opacity:1}\n.bot{margin-top:auto;padding-top:24px}.foot{border-top:1px solid var(--line);margin-top:18px;padding-top:16px}\n.fh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}\n.fh h3{font:700 15px var(--d);color:var(--strong)}\n.fh .cd{font-size:13px;color:var(--ink)}.fh .cd b{font:800 18px var(--d);color:var(--teal3)}\n.tlw{display:block}.loc{display:flex;flex-direction:column;align-items:flex-end;gap:10px}.loc .btn{padding:8px 14px;font-size:13px;border-radius:10px;gap:7px}.loc .btn svg{width:13px;height:13px}.src{font-size:11px;color:var(--faint);margin-top:6px}\n.tr{position:relative;height:74px}\n.tr .base{position:absolute;left:0;right:0;top:22px;height:8px;border-radius:4px;background:var(--hair)}\n.tr .done{position:absolute;left:0;top:22px;height:8px;border-radius:4px 0 0 4px;background:linear-gradient(90deg,#CFE3E1,#9FD9D4);width:0;animation:fill 1.4s cubic-bezier(.2,.7,.2,1) forwards}\n@keyframes fill{to{width:var(--w)}}\n.tr .ph{position:absolute;top:22px;height:8px;background:var(--teal);opacity:.55}\n.tr .ph.c{opacity:.9}\n.tr .pl{position:absolute;top:0;font-size:11px;color:var(--muted);white-space:nowrap;transform:translateX(-50%)}\n.tr .pl b{color:var(--strong);font-weight:600}\n.tr .tk{position:absolute;top:56px;font-size:10.5px;color:var(--faint);transform:translateX(-50%)}\n.tr .jd{position:absolute;top:16px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:var(--teal3);border:4px solid #fff;box-shadow:0 0 0 1px var(--teal3)}\n.tr .jl{position:absolute;top:38px;font-size:11px;font-weight:700;color:var(--teal3);transform:translateX(-50%);white-space:nowrap}\n.tr .hoy{position:absolute;top:14px;width:0;left:0;animation:mv 1.4s cubic-bezier(.2,.7,.2,1) forwards}\n@keyframes mv{to{left:var(--w)}}\n.tr .hoy i{position:absolute;left:-7px;top:6px;width:14px;height:14px;border-radius:50%;background:var(--strong);border:3px solid #fff;box-shadow:0 0 0 1px var(--strong)}\n.tr .hoy i:after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--strong);animation:pl 2s ease-out infinite}\n.tr .hoy span{position:absolute;top:24px;left:0;transform:translateX(-50%);font-size:11px;font-weight:700;color:var(--strong);white-space:nowrap}\n.e27{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-bottom:4px}\n.e27 h3{font:600 13px var(--f);color:var(--muted);margin:0 4px 0 0}\n.e27 ul{list-style:none;padding:0;display:flex;gap:8px;flex-wrap:wrap}\n.e27 li{background:var(--hair);border-radius:10px;padding:6px 12px;display:flex;align-items:baseline;gap:6px;font-size:13px;color:var(--ink)}\n.e27 li b{font:700 15px var(--d);color:var(--strong)}\n.e27 li.no{background:none;color:var(--faint)}.e27 li.no b{display:none}\n.btn{display:inline-flex;align-items:center;gap:9px;background:var(--teal3);color:#fff;border:0;border-radius:12px;padding:14px 26px;font:600 15px var(--f);white-space:nowrap;transition:transform .15s,box-shadow .15s}\n.btn:hover{background:#176B66}\n#tip{position:fixed;z-index:20;pointer-events:none;background:var(--strong);color:#fff;border-radius:9px;padding:6px 10px;font-size:12px;opacity:0;transition:opacity .12s;max-width:260px}\n#tip b{display:block}#tip.on{opacity:1}\n@media (prefers-reduced-motion:reduce){*{animation-duration:0s!important}}\n@media (max-width:1000px){:host{overflow:auto}.wrap{grid-template-columns:1fr;height:auto;padding:16px}.side{background:none}.side h1,.side .s,.side .last,.list,.ses{display:none}.side.qon .list{display:block;background:#fff;border-radius:14px;margin-top:8px;max-height:55vh;box-shadow:0 12px 30px rgba(28,33,33,.15)}.side .q{margin:0;background:#fff}\n .main{padding:24px}.hd{grid-template-columns:minmax(0,1fr) 180px;gap:16px}.qg{grid-template-columns:repeat(2,1fr)}\n .body{grid-template-columns:1fr}.kp b{font-size:24px}.kp>div{padding:14px 0 12px 12px}.pyb{min-height:220px}\n .tlw{grid-template-columns:1fr}}\n@media (max-width:600px){\n .wrap{padding:12px 12px 88px}.main{padding:18px}.loc{display:none}.hd{grid-template-columns:1fr}\n .hd h2{font-size:30px}.qg{grid-template-columns:1fr 1fr;gap:14px}\n .kp{grid-template-columns:1fr 1fr!important}.kp>div{padding:12px 10px 10px!important;border-left:0!important}.kp>div:nth-child(5),.kp>div:nth-child(10){grid-column:span 2}.kp>div:not(.tn){padding-left:0!important}\n .kp b{font-size:24px}.body .kp{max-height:none}\n .e27{gap:6px}.e27 h3{width:100%}\n .tr,.tlw .tr{display:none}.fh{flex-direction:column;align-items:flex-start;gap:2px;margin-bottom:0}.nx{display:block!important;font-size:13px;color:var(--ink);margin-top:4px}\n .btnm{display:flex!important;position:fixed;left:12px;right:12px;bottom:12px;justify-content:center;z-index:5;box-shadow:0 8px 24px rgba(28,33,33,.2)}\n}\n@media (min-width:1001px) and (max-width:1300px){.wrap{grid-template-columns:270px 1fr;gap:14px;padding:16px}.main{padding:22px 26px 18px}.hd{grid-template-columns:minmax(0,1fr) 190px;gap:20px}.hd h2{font-size:36px}\n .qg{gap:12px}.qg em{font-size:11.5px;gap:2px 6px}.qg small{font-size:11px}.kp b{font-size:24px}.kp>div{padding-left:14px}.kp span{font-size:9.5px}.kp em{font-size:11px}}\n\n/* búsqueda */\n.r.mu .n{font-weight:500}.r.mu .g{gap:4px}.nores{padding:14px;color:var(--muted);font-size:13px}\n.lh{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;padding:10px 10px 4px}\n/* sesión */\n.ses{margin:0 24px 10px;display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--ink);background:var(--hair);border-radius:10px;padding:8px 12px}\n.ses b{color:var(--strong)}.ses button{border:0;background:none;color:var(--teal3);font:600 12.5px var(--f);cursor:pointer;padding:0}\n.pan{color:var(--teal3);text-decoration:none;font-weight:600}\n/* acceso */\n.mo{position:fixed;inset:0;background:rgba(28,33,33,.38);display:none;align-items:center;justify-content:center;z-index:30;padding:16px}\n.mo.on{display:flex}\n.acc{width:min(380px,100%);background:#fff;border-radius:18px;padding:26px;box-shadow:0 24px 60px rgba(28,33,33,.25);position:relative}\n.acc h4{font:700 20px var(--d);color:var(--strong)}.acc p{color:var(--muted);font-size:13px;margin:4px 0 18px}\n.acc label{display:block;font-size:12px;color:var(--ink);font-weight:600;margin:0 0 6px}\n.acc input[type=text],.acc input[type=password]{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 12px;margin-bottom:14px;font:inherit;font-size:15px;color:var(--strong);outline:0}\n.acc input:focus{border-color:var(--teal2);box-shadow:0 0 0 3px var(--tealxl)}\n.acc .ck{display:flex;align-items:center;gap:8px;font-size:13px;margin:2px 0 18px;cursor:pointer}\n.acc .ck input{width:16px;height:16px;accent-color:var(--teal3)}\n.acc .btn{width:100%;justify-content:center}.acc .btn[disabled]{opacity:.6;cursor:wait}\n.acc .err{color:#B3261E;font-size:13px;min-height:18px;margin:-6px 0 10px}\n.acc .hl{margin-top:12px;text-align:center;font-size:12px;color:var(--muted)}\n.acc .cl{position:absolute;top:12px;right:14px;border:0;background:none;font-size:22px;color:var(--muted);cursor:pointer;line-height:1}\n.go:focus-visible,.btn:focus-visible,.r:focus-visible{outline:2px solid var(--teal2);outline-offset:2px}\n.ses[hidden]{display:none!important}\n\n/* ficha del municipio buscado */\n.mf{display:grid;grid-template-rows:1fr;margin-top:18px;animation:mfin .38s cubic-bezier(.2,.7,.2,1)}\n.mfin{overflow:hidden;background:var(--bg);border-left:3px solid var(--teal3);padding:14px 18px;animation:mfo .38s ease}\n.mf.out{grid-template-rows:0fr;margin-top:0;opacity:0;transition:grid-template-rows .3s ease,margin-top .3s ease,opacity .2s ease}\n.mf.out .mfin{padding-top:0;padding-bottom:0;transition:padding .3s ease}\n@keyframes mfin{from{grid-template-rows:0fr;margin-top:0}to{grid-template-rows:1fr;margin-top:18px}}\n@keyframes mfo{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}\n.mfk [data-tip]{cursor:help}\n@media (prefers-reduced-motion:reduce){.mf,.mfin{animation:none}.mf.out,.mf.out .mfin{transition:none}}\n.mfh{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}\n.mfh small{display:block;font-size:11px;color:var(--teal3);text-transform:uppercase;letter-spacing:.05em;font-weight:600}\n.mfh b{font:800 24px/1.15 var(--d);color:var(--strong)}\n.mx{border:0;background:#fff;border-radius:999px;padding:6px 12px;font:600 12px var(--f);color:var(--teal3);cursor:pointer;white-space:nowrap}\n.mfk{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:10px}\n.mfk b{display:flex;align-items:center;gap:6px;font:800 19px/1.2 var(--d);color:var(--strong);white-space:nowrap}\n.mfk span{display:block;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}\n.mfk em{display:block;font-style:normal;font-size:11px;color:var(--ink)}\n@media (max-width:700px){.mfk{grid-template-columns:1fr 1fr}.mfh b{font-size:20px}}\n";
/* Entrada del Laboratorio Político: lista de estados, ficha pública de cada estado y acceso con usuario y clave.
   Se muestra cuando no hay estado en la dirección (index.html) o cuando falta la clave del estado pedido.
   La ficha solo usa data/estados.json (totales públicos). Los datos por sección están cifrados en data/seguro/
   y se abren con la clave de cada usuario (ver pipeline/acceso.py). */

/* ---------- sesión y cifrado (también los usa el cargador del análisis) ---------- */
const LAB_SK = 'lab_sesion';
function LAB_SES() {
  for (const st of [sessionStorage, localStorage]) {
    try { const s = JSON.parse(st.getItem(LAB_SK) || 'null'), t = Date.now();
      if (s && s.la && (!s.exp || s.exp > t) && !(s.ia && t - s.la > s.ia * 6e4)) return s; /* sesiones sin registro de uso (versión anterior) piden entrar de nuevo */ if (s) st.removeItem(LAB_SK); } catch (e) {}
  }
  return null;
}
/* cierre automático: cada uso de la plataforma renueva la sesión; sin uso por ia minutos (o al pasar exp) se cierra,
   se borran las llaves y la página se recarga para soltar los datos de la memoria */
function LAB_VIGILA() {
  const st = () => { for (const x of [sessionStorage, localStorage]) { try { if (x.getItem(LAB_SK)) return x; } catch (e) {} } return null; };
  let ult = 0;
  const uso = () => { const t = Date.now(); if (t - ult < 2e4) return; ult = t; const x = st(); if (!x) return; try { const s = JSON.parse(x.getItem(LAB_SK)); if (s && LAB_SES()) { s.la = t; x.setItem(LAB_SK, JSON.stringify(s)); } } catch (e) {} };
  const fin = () => { LAB_SALIR(); const d = document.createElement('div'); d.className = 'lab-fin';
    d.innerHTML = '<div><b>Tu sesión se cerró</b><p>Por seguridad, se cierra sola después de un tiempo sin usar la plataforma.</p><button>Entrar de nuevo</button></div>';
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(20,32,31,.55);backdrop-filter:blur(6px);font-size:15px;line-height:1.5';
    d.firstChild.style.cssText = 'background:#fff;border-radius:16px;padding:26px 28px;max-width:360px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25)';
    d.querySelector('button').style.cssText = 'margin-top:12px;border:0;border-radius:10px;background:#1C7F79;color:#fff;font-weight:600;font-size:14px;font-family:inherit;padding:10px 18px;cursor:pointer';
    d.querySelector('button').onclick = () => { location.hash = ''; location.reload(); };
    document.body.innerHTML = ''; document.body.appendChild(d); clearInterval(iv); };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, uso, { passive: true }));
  const iv = setInterval(() => { if (!LAB_SES()) fin(); }, 3e4);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !LAB_SES()) fin(); });
}
function LAB_PUEDE(cab) { const s = LAB_SES(); return !!(s && s.k && s.k[cab]); }
function LAB_SALIR() { for (const st of [sessionStorage, localStorage]) { try { st.removeItem(LAB_SK); } catch (e) {} } }
const _b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const _hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
let _ACC = null;
async function _acceso() { if (_ACC) return _ACC; const r = await fetch('data/acceso.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('sin acceso.json'); return _ACC = await r.json(); }
async function LAB_ENTRAR(usuario, clave, recordar) {
  const A = await _acceso(), te = new TextEncoder();
  const u = usuario.trim().toLowerCase(), h = _hex(await crypto.subtle.digest('SHA-256', te.encode(A.sal + '|' + u)));
  const e = A.u[h]; if (!e) return { error: 'Usuario o clave incorrectos.' };
  if (e.vig && new Date(e.vig + 'T23:59:59') < new Date()) return { error: 'Tu acceso venció. Pide a tu administrador que lo renueve.' };
  const base = await crypto.subtle.importKey('raw', te.encode(clave), 'PBKDF2', false, ['deriveKey']);
  const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: _b64(e.s), iterations: A.it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const k = {};
  try {
    for (const cab in e.k) { const b = _b64(e.k[cab]); k[cab] = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, kek, b.slice(12))))); }
  } catch (err) { return { error: 'Usuario o clave incorrectos.' }; }
  const C = A.ses || { inact: 30, max_h: 12, rec_d: 7 }, t = Date.now();
  const s = { u: usuario.trim(), n: e.n, a: e.a || [], k, exp: t + (recordar ? C.rec_d * 864e5 : C.max_h * 36e5), ia: e.ia || C.inact, la: t };
  try { (recordar ? localStorage : sessionStorage).setItem(LAB_SK, JSON.stringify(s)); } catch (err) {}
  return { ok: s };
}
/* descarga, descifra y descomprime los datos de un estado */
async function LAB_DATOS(cab, avance) {
  const s = LAB_SES(); if (!s || !s.k[cab]) throw new Error('sin clave');
  const r = await fetch('data/seguro/' + cab + '.bin', { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status);
  const tot = +r.headers.get('content-length') || 0; let u;
  if (r.body && r.body.getReader) { const rd = r.body.getReader(), ch = []; let got = 0; for (;;) { const x = await rd.read(); if (x.done) break; ch.push(x.value); got += x.value.length; avance && avance(got, tot); } u = new Uint8Array(got); let o = 0; ch.forEach(c => { u.set(c, o); o += c.length; }); }
  else u = new Uint8Array(await r.arrayBuffer());
  const key = await crypto.subtle.importKey('raw', _b64(s.k[cab]), 'AES-GCM', false, ['decrypt']);
  const gz = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(4, 16) }, key, u.slice(16));
  const txt = await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(txt);
}
/* niveles 3, 4 y 5: se recortan los datos a su distrito o municipio antes de abrir el análisis */
function LAB_RECORTE(D, s) {
  const col = { 3: 3, 4: 2, 5: 1 }[s.n]; if (!col || !s.a || !s.a.length) return D;
  const ok = new Set(s.a.map(Number)), S = D.S, N = S.length, I = [];
  for (let i = 0; i < N; i++) if (ok.has(+S[i][col])) I.push(i);
  if (!I.length) throw new Error('ámbito vacío');
  const f = o => { if (Array.isArray(o)) return o.length === N ? I.map(i => o[i]) : o; if (o && typeof o === 'object') { for (const k in o) o[k] = f(o[k]); } return o; };
  ['S', 'paths', 'DM'].forEach(k => D[k] = I.map(i => D[k][i])); for (const ek in D.E) D.E[ek].r = I.map(i => D.E[ek].r[i]); f(D.V);
  const keep = c => new Set(D.S.map(r => +r[c]));
  [['mun', 1], ['dl', 2], ['df', 3]].forEach(([g, c]) => { if (Array.isArray(D.geo[g])) { const k = keep(c); D.geo[g] = D.geo[g].filter(x => k.has(+x.id)); } });
  const km = keep(1); for (const m in D.meta.municipios) if (!km.has(+m)) delete D.meta.municipios[m];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  D.paths.forEach(p => { const n = (p || '').match(/-?\d+(\.\d+)?/g) || []; for (let j = 0; j + 1 < n.length; j += 2) { const x = +n[j], y = +n[j + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } });
  if (x1 > x0) { const p = Math.max(x1 - x0, y1 - y0) * .04; D.vb = [x0 - p, y0 - p, x1 - x0 + 2 * p, y1 - y0 + 2 * p]; }
  const nom = { 3: 'Distrito federal', 4: 'Distrito local', 5: 'Municipio' }[s.n];
  const et = s.n === 5 ? s.a.map(m => (D.meta.municipios[m] || m)).join(', ') : (s.a.length > 1 ? { 3: 'Distritos federales', 4: 'Distritos locales' }[s.n] : nom) + ' ' + s.a.join(', ');
  D.meta.estado = D.meta.estado + ' · ' + et; D.meta.recorte = { n: s.n, a: s.a };
  window.SUBIDX = I; return D;
}

/* ---------- pantalla de entrada ---------- */
async function ENTRADA(pedido) {
  document.body.classList.add('entmode');
  const host = document.createElement('div'); host.id = 'ent'; document.body.appendChild(host);
  const R = host.attachShadow({ mode: 'open' });
  R.innerHTML = `<style>${ENT_CSS}</style><div class="ent"><div class="wrap">
 <aside class="side" id="SD"><h1>Elige un estado</h1><p class="s">32 estados · resultados por sección 2015–2024</p>
  <div class="ses" id="SES" hidden></div>
  <label class="q"><svg viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.6"/><path d="M8 8l3 3"/></svg><input id="QI" placeholder="Buscar estado o municipio" autocomplete="off" aria-label="Buscar estado o municipio"><kbd>/</kbd></label>
  <div class="list" id="L" role="listbox"></div></aside>
 <main class="main" id="M"></main>
</div></div><div id="scrim"></div><div id="tip" role="tooltip"></div>
<div class="mo" id="MO" role="dialog" aria-modal="true" aria-labelledby="MT"><form class="acc" id="AF" autocomplete="on"><button type="button" class="cl" id="MC" aria-label="Cerrar">×</button>
 <h4 id="MT">Acceder al análisis</h4><p id="MS"></p>
 <label for="AU">Usuario</label><input type="text" id="AU" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required>
 <label for="AP">Clave</label><input type="password" id="AP" name="password" autocomplete="current-password" required>
 <label class="ck"><input type="checkbox" id="AR">Recordar en este dispositivo</label>
 <div class="err" id="AE" aria-live="polite"></div>
 <button class="btn" id="AB" type="submit">Entrar</button><div class="hl">¿No tienes clave? Pídela a tu administrador.</div></form></div>`;
  const $ = id => R.getElementById(id);
  const EST = AVAIL.filter(x => x.ent), byC = {}, byE = {}; EST.forEach(x => { byC[x.cab] = x; byE[x.ent] = x; });
  let MX = { w: 1000, h: 624, st: [] }; try { MX = await (await fetch('data/inicio/mx32.json')).json(); } catch (e) {}
  const PC = { MORENA: '#A9455E', PAN: '#3F72B5', PRI: '#2F8F64', MC: '#E9813F', PVEM: '#7FB24E', PT: '#CF4B42', PRD: '#E5B533' }, pc = p => PC[p] || '#9AA5A5', pn = p => ({ MORENA: 'Morena', PVEM: 'Verde' }[p] || p);
  const fmt = n => n == null ? '—' : n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : Math.round(n).toLocaleString('es-MX');
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nz = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let cur = pedido && byC[pedido] ? pedido : null; if (!cur) { try { cur = localStorage.getItem('lab_ultimo'); } catch (e) {} } if (!byC[cur]) cur = null;
  let q = '', curMun = null, MUNS = null, munsCargando = false;
  const cargaMuns = () => { if (MUNS || munsCargando) return; munsCargando = true; fetch('data/municipios.json').then(r => r.json()).then(j => { MUNS = j; if (q) lista(); }).catch(() => {}); };
  const HOY = new Date(), tip = $('tip'), scrim = $('scrim');
  const showTip = (h, e) => { tip.innerHTML = h; tip.classList.add('on'); const w = tip.offsetWidth; let x = e.clientX + 14; if (x + w > innerWidth - 8) x = e.clientX - w - 14; tip.style.left = Math.max(8, x) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; };
  function qg(lbl, o, extra) {
    const e = Object.entries(o || {}).sort((a, b) => b[1] - a[1]), t = e.reduce((s, x) => s + x[1], 0);
    if (!t) return `<div><small>${lbl}</small><em><i class="x">sin dato</i></em></div>`;
    const top = e.slice(0, 2), rest = e.slice(2);
    return `<div data-tip="${encodeURIComponent(`<b>${lbl}: ${t}</b>` + e.map(([p, v]) => `${pn(p)}: ${v}`).join('<br>') + (extra || '') + '<span class="tnote">Si ganó una coalición, se cuenta al partido que la encabeza.</span>')}"><small>${lbl} · ${t}</small><u>${e.map(([p, v]) => `<b style="flex:${v};background:${pc(p)}"></b>`).join('')}</u><em>${top.map(([p, v]) => `<i><span class="dot" style="background:${pc(p)}"></span>${pn(p)} ${v}</i>`).join('')}${rest.map(([p, v]) => `<i class="x">${pn(p)} ${v}</i>`).join('')}</em></div>`;
  }
  function cal() {
    const S = +new Date('2026-09-10'), E = +new Date('2027-08-31'), x = d => Math.max(0, Math.min(100, (+new Date(d) - S) / (E - S) * 100)).toFixed(2) + '%', w = (a, b) => ((+new Date(b) - +new Date(a)) / (E - S) * 100).toFixed(2) + '%';
    const J = new Date('2027-06-06T12:00'); if (HOY > new Date('2027-06-07T00:00')) return `<p class="src">Fuente: INE. Lista nominal al 8 de octubre de 2026; resultados electorales por sección 2015–2024.</p>`;
    const hoyP = x(HOY), fal = Math.ceil((J - HOY) / 864e5), hs = HOY.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const M = ['sep', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago'];
    const F = [['2027-01-04', 'Precampañas, desde enero'], ['2027-02-12', 'Precampañas, hasta el 12 de febrero'], ['2027-04-03', 'Campañas, desde el 3 de abril'], ['2027-06-02', 'Campañas, hasta el 2 de junio'], ['2027-06-06', 'Jornada electoral, 6 de junio']], nx = F.find(f => new Date(f[0]) > HOY);
    return `<div class="foot"><div class="fh"><h3>Rumbo a la elección del 6 de junio de 2027</h3><span class="cd">Faltan <b>${fal}</b> días</span></div><div class="nx" style="display:none">${nx ? 'Siguiente etapa: ' + nx[1] : ''}</div>
 <div class="tlw"><div class="tr" style="--w:${hoyP}"><div class="base"></div><div class="done"></div>
  <div class="ph" style="left:${x('2027-01-04')};width:${w('2027-01-04', '2027-02-12')}"></div><div class="ph c" style="left:${x('2027-04-03')};width:${w('2027-04-03', '2027-06-02')}"></div>
  <div class="pl" style="left:0;transform:none"><b>Inicio</b> 10 sep</div><div class="pl" style="left:${x('2027-01-23')}"><b>Precampañas</b> ene – 12 feb</div><div class="pl" style="left:${x('2027-05-03')}"><b>Campañas</b> 3 abr – 2 jun</div><div class="pl" style="left:${x('2027-08-15')};transform:translateX(-80%)"><b>Plurinominales</b> ago</div>
  ${M.map((m, i) => { const p = (i + .5) / 12 * 100; return Math.abs(p - parseFloat(hoyP)) < 5 ? '' : `<div class="tk" style="left:${p.toFixed(1)}%">${m}</div>`; }).join('')}
  <div class="jd" style="left:${x('2027-06-06')}"></div><div class="jl" style="left:${x('2027-06-06')}">Jornada · 6 jun</div>
  <div class="hoy"><i></i><span>Hoy · ${hs}</span></div></div></div>
<p class="src">Fuente: INE. Lista nominal al 8 de octubre de 2026; resultados electorales por sección 2015–2024.</p></div>`;
  }
  function lista() {
    const qq = nz(q); let h = '';
    const est = EST.filter(x => !qq || nz(x.estado).includes(qq)).sort((a, b) => a.estado.localeCompare(b.estado, 'es'));
    h += est.map(x => `<div class="r${x.cab === cur ? ' on' : ''}" data-cab="${x.cab}" role="option" tabindex="0"><span class="n">${esc(x.estado)}</span><span class="v">${fmt(x.ln)}</span><span class="g">${x.gob ? `<i style="background:${pc(x.gob.l)}"></i>Gobierna ${pn(x.gob.l)}` : ''}${x.c27 && x.c27.g ? ' · gubernatura 2027' : ''}</span></div>`).join('');
    if (qq.length >= 3) {
      cargaMuns();
      const mu = [];
      if (MUNS) EST.forEach(x => Object.entries(MUNS[x.cab] || {}).forEach(([id, m]) => { if (nz(m.n).includes(qq)) mu.push([id, m, x]); }));
      mu.sort((a, b) => b[1].ln - a[1].ln);
      if (mu.length) h += `<div class="lh">Municipios</div>` + mu.slice(0, 12).map(([id, m, x]) => `<div class="r mu" data-cab="${x.cab}" data-mid="${id}" role="option" tabindex="0"><span class="n">${esc(m.n)}</span><span class="v">${fmt(m.ln)}</span><span class="g">${esc(x.estado)}</span></div>`).join('');
      else if (!MUNS) h += `<p class="nores">Buscando municipios…</p>`;
    }
    $('L').innerHTML = h || `<p class="nores">Ningún estado ni municipio coincide con “${esc(q)}”.</p>`;
    $('SD').classList.toggle('qon', !!q);
  }
  function sesion() {
    const s = LAB_SES(), b = $('SES');
    if (!s) { b.hidden = true; return; }
    const n = Object.keys(s.k).length; b.hidden = false;
    b.innerHTML = `<span>Sesión: <b>${esc(s.u)}</b>${s.n === 1 ? ' · todos los estados' : n === 1 ? ' · ' + esc((byC[Object.keys(s.k)[0]] || {}).estado || '') : ''}</span><button id="SX">Salir</button>`;
    $('SX').onclick = () => { LAB_SALIR(); sesion(); };
  }
  function munFicha(s, al) {
    if (!curMun || curMun.cab !== s.cab || !MUNS || !MUNS[s.cab] || !MUNS[s.cab][curMun.m]) return '';
    const m = MUNS[s.cab][curMun.m], w = m.w;
    return `<div class="mf"><div class="mfin"><div class="mfh"><div><small>${al ? 'Alcaldía' : 'Municipio'} de ${esc(s.estado)}</small><b>${esc(m.n)}</b></div><button class="mx" aria-label="Quitar ${esc(m.n)}">Ver todo el estado ×</button></div>
  <div class="mfk"><div><b>${w ? `<i class="dot" style="background:${pc(w[0])}"></i>${pn(w[0])}` : '—'}</b><span>Gobierna</span><em>${w ? `ganó en ${w[1]}${w[2] != null ? ' por ' + w[2] + ' pts' : ''}` : 'sin votación por partidos'}</em></div>
  <div><b>${fmt(m.ln)}</b><span>Lista nominal</span><em>${(100 * m.ln / s.ln).toFixed(1)}% del estado</em></div>
  <div><b>${m.p != null ? m.p.toFixed(1) + '%' : '—'}</b><span>Participación</span><em>promedio 2015–2024</em></div>
  <div data-tip="${encodeURIComponent(`<b>Dónde está el voto</b>${m.s70} de ${m.sec} secciones reúnen el 70% de la lista nominal de ${esc(m.n)}.`)}"><b>${m.sec.toLocaleString('es-MX')}</b><span>Secciones</span><em>${m.s70} (${Math.round(100 * m.s70 / m.sec)}%) concentran el 70%</em></div>
  <div><b>${m.dl.join(', ')}</b><span>Distritos locales</span><em>federales ${m.df.join(', ')}</em></div></div></div></div>`;
  }
  function vacia() {
    $('M').innerHTML = `<div class="hd"><div><div class="eyebrow">Ficha del estado</div><h2>Elige un estado</h2><span class="hint">Toca un estado en el mapa o en la lista para ver su ficha y entrar al análisis.</span></div></div>
 <div class="bigmap"><svg viewBox="0 0 ${MX.w} ${MX.h}" role="img" aria-label="Mapa de México">${MX.st.map(p => byE[p.ent] ? `<path data-cab="${byE[p.ent].cab}" d="${p.d}"/>` : '').join('')}</svg></div>${cal()}`;
  }
  function ficha() {
    lista(); sesion();
    if (!cur) { vacia(); return; }
    const s = byC[cur], al = s.cab === 'cdmx', c27 = s.c27 || {}, Q = s.q || {}, D = s.dem || { h: 1, m: 0, g: [0, 0, 0, 0, 0, 0, 0] }, mj = 100 * D.m / (D.h + D.m), [n70, nt] = s.v70 || [0, 0];
    const q2 = MX.st.find(p => p.ent === s.ent) || { x: 0, y: 0 }, T = D.h + D.m, L = ['18–24', '25–29', '30–39', '40–49', '50–59', '60–64', '65+'];
    const ay = Q.ayu ? qg(al ? 'Alcaldías' : 'Municipios', Q.ayu[1], Q.ayu[2] ? `<br><span class="tnote">${Q.ayu[2]} sin votación por partidos en ${Q.ayu[0]} (usos y costumbres o elección anulada).</span>` : '') : qg(al ? 'Alcaldías' : 'Municipios', null);
    const go = `<button class="go" aria-label="Acceder al análisis de ${esc(s.estado)}" data-lbl="Acceder al análisis"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h11"/><path d="M11 5.5 15.5 10 11 14.5"/></svg></button>`;
    $('M').innerHTML = `
 <div class="hd"><div><div class="eyebrow">Ficha del estado</div><h2>${esc(s.estado)}${go}</h2>
  <span class="gobl">${s.gob ? `<i style="background:${pc(s.gob.l)}"></i>Gobierna ${pn(s.gob.l)} desde ${s.gob.y}${s.gob.p ? `, ganó con ${s.gob.p}%` : ''}` : ''}</span>
  <div class="qgh">Quién gobierna hoy</div><div class="qg">${ay}${qg('Dip. locales', Q.dl && Q.dl[1])}${qg('Dip. federales', Q.df && Q.df[1])}${qg('Senado', Q.sen && Q.sen[1])}</div></div>
  <div class="loc"><svg viewBox="0 0 ${MX.w} ${MX.h}" role="img" aria-label="Ubicación de ${esc(s.estado)}">${MX.st.map(p => byE[p.ent] ? `<path data-cab="${byE[p.ent].cab}" class="${p.ent === s.ent ? 'on' : ''}" d="${p.d}"/>` : '').join('')}<g class="pulse"><circle class="c1" cx="${q2.x}" cy="${q2.y}" r="44"/><circle class="c2" cx="${q2.x}" cy="${q2.y}" r="44"/><circle class="c0" cx="${q2.x}" cy="${q2.y}" r="6"/></g></svg></div></div>
 ${munFicha(s, al)}
 <div class="body"><div class="kp">
  <div><b>${fmt(s.ln)}</b><span>Lista nominal</span></div>
  <div><b>${(s.sec || 0).toLocaleString('es-MX')}</b><span>Secciones</span></div>
  <div><b>${s.mun}</b><span>${al ? 'Alcaldías' : 'Municipios'}</span></div>
  <div><b>${s.ndl}</b><span>Distritos locales</span></div>
  <div><b>${s.ndf}</b><span>Distritos federales</span></div>
  <div class="tn" data-tip="${encodeURIComponent(`<b>Participación promedio</b>Promedio de las ${s.nel} elecciones del estado entre 2015 y 2024 (presidencia, senado, diputaciones, gubernatura y ayuntamientos).`)}"><b>${s.pavg != null ? s.pavg.toFixed(1) + '%' : '—'}</b><span>Participación</span><em>promedio 2015–2024</em></div>
  <div class="tn" data-tip="${encodeURIComponent(`<b>Dónde está el voto</b>${n70} de ${nt} ${al ? 'alcaldías' : 'municipios'} reúnen el 70% de la lista nominal. Concentrar el trabajo ahí cubre a 7 de cada 10 electores.`)}"><b>${n70} <small>de ${nt}</small></b><span>Dónde está el voto</span><em>${al ? 'alcaldías' : 'municipios'} reúnen el 70%</em></div>
  <div class="tn" data-tip="${encodeURIComponent(`<b>Lista nominal por sexo</b>Mujeres: ${fmt(D.m)}<br>Hombres: ${fmt(D.h)}`)}"><b>${mj.toFixed(1)}%</b><span>Mujeres</span><em>hombres ${(100 - mj).toFixed(1)}%</em></div>
  <div class="tn" data-tip="${encodeURIComponent('<b>Lista nominal por edad</b>' + D.g.map((v, i) => `${L[i]}: ${fmt(v)} (${(100 * v / T).toFixed(1)}%)`).join('<br>'))}"><b>${(100 * (D.g[0] + D.g[1]) / T).toFixed(1)}%</b><span>Jóvenes de 18 a 29</span><em>65 y más ${(100 * D.g[6] / T).toFixed(1)}%</em></div>
  <div class="tn" data-tip="${encodeURIComponent('<b>Nuevos electores desde 2024</b>Personas de 18 y 19 años en la lista nominal: tenían 16 o 17 años en la elección de 2024.')}"><b>${fmt(s.nv)}</b><span>Nuevos electores</span><em>18 y 19 años, ya en jóvenes</em></div>
 </div></div>
 <div class="bot">${(() => { const it = [[1, s.ndf, 'Diputaciones federales'], [c27.c, s.ndl, 'Diputaciones locales de mayoría'], [c27.a, c27.na || s.mun, al ? 'Alcaldías' : 'Ayuntamientos'], [c27.g, 1, 'Gubernatura']];
      return `<div class="e27"><h3>Qué se elige en 2027</h3><ul>${it.map(([on, n, t]) => `<li class="${on ? '' : 'no'}"><b>${n}</b><span>${on ? t.toLowerCase() : 'sin ' + t.toLowerCase()}</span></li>`).join('')}</ul></div>`; })()}
 ${cal()}</div><button class="btn btnm go2" style="display:none"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>Acceder al análisis</button>`;
  }
  /* acceso */
  let destino = null;
  const ir = cab => { try { localStorage.setItem('lab_ultimo_ok', cab); } catch (e) {} if (location.hash === '#' + cab) location.reload(); else location.hash = cab; };
  function abrirAcceso(cab) {
    destino = cab; const x = byC[cab];
    $('MS').textContent = 'Entra con tu usuario y clave.'; $('AE').textContent = ''; $('MO').classList.add('on');
    setTimeout(() => ($('AU').value ? $('AP') : $('AU')).focus(), 30);
  }
  function cerrarAcceso() { $('MO').classList.remove('on'); }
  /* estado al que entra el usuario: el elegido si lo tiene; si no, el último que consultó de los suyos o el primero */
  const destinoDe = (ses, cab) => { if (ses.k[cab]) return cab; const mio = Object.keys(ses.k).sort(); let u = null; try { u = localStorage.getItem('lab_ultimo_ok'); } catch (e) {} return mio.includes(u) ? u : mio[0]; };
  function acceder(cab) {
    try { if (curMun && curMun.cab === cab) sessionStorage.setItem('lab_mun', JSON.stringify(curMun)); else sessionStorage.removeItem('lab_mun'); } catch (e) {}
    const s = LAB_SES();
    if (s) { ir(destinoDe(s, cab)); return; }
    abrirAcceso(cab);
  }
  $('MC').onclick = cerrarAcceso; $('MO').addEventListener('click', e => { if (e.target === $('MO')) cerrarAcceso(); });
  $('AF').addEventListener('submit', async e => {
    e.preventDefault(); const b = $('AB'); b.disabled = true; b.textContent = 'Verificando…'; $('AE').textContent = '';
    try {
      const r = await LAB_ENTRAR($('AU').value, $('AP').value, $('AR').checked);
      if (r.error) { $('AE').textContent = r.error; $('AP').value = ''; $('AP').focus(); }
      else ir(destinoDe(r.ok, destino));
    } catch (err) { console.error(err); $('AE').textContent = 'No se pudo verificar. Revisa tu conexión e intenta de nuevo.'; }
    b.disabled = false; b.textContent = 'Entrar';
  });
  /* tocar y pasar el cursor */
  let pinned = false;
  const closeTip = () => { pinned = false; tip.classList.remove('on', 'pin'); scrim.classList.remove('on'); };
  scrim.addEventListener('click', closeTip);
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTip(); cerrarAcceso(); }
    if (e.key === '/' && !$('MO').classList.contains('on') && R.activeElement !== $('QI')) { e.preventDefault(); $('QI').focus(); }
  });
  const elegir = (cab, mid) => { if (!mid && cab === cur && !curMun) { cur = null; try { localStorage.removeItem('lab_ultimo'); } catch (e) {} closeTip(); ficha(); return; } curMun = mid ? { cab, m: mid } : null; cur = cab; try { localStorage.setItem('lab_ultimo', cur); } catch (e) {} closeTip(); q = ''; $('QI').value = ''; ficha(); };
  R.addEventListener('click', e => {
    if (e.target.closest('#tip .x')) { closeTip(); return; }
    if (e.target.closest('.go,.go2')) { acceder(cur); return; }
    const d = e.target.closest('[data-tip]');
    if (d) { showTip(decodeURIComponent(d.dataset.tip) + '<button class="x" aria-label="Cerrar">×</button>', e); tip.classList.add('pin'); pinned = true; if (innerWidth <= 700) scrim.classList.add('on'); return; }
    if (pinned && !e.target.closest('#tip')) closeTip();
    if (e.target.closest('.mx')) { curMun = null; const f = R.querySelector('.mf'); if (f) { f.classList.add('out'); setTimeout(() => f.remove(), 320); } return; }
    const t = e.target.closest('[data-cab]'); if (t) elegir(t.dataset.cab, t.dataset.mid);
  });
  R.addEventListener('keydown', e => { if (e.key === 'Enter') { const t = e.target.closest && e.target.closest('.r[data-cab]'); if (t) elegir(t.dataset.cab); } });
  R.addEventListener('mousemove', e => {
    if (pinned) return; const t = e.target.closest('[data-tip],.loc path,.bigmap path'); if (!t) { tip.classList.remove('on'); return; }
    if (t.dataset.tip) showTip(decodeURIComponent(t.dataset.tip), e); else showTip(`<b>${esc(byC[t.dataset.cab].estado)}</b>Clic para ver su ficha`, e);
  });
  $('QI').addEventListener('input', e => { q = e.target.value.trim(); lista(); });
  $('QI').addEventListener('keydown', e => { if (e.key === 'Enter') { const f = $('L').querySelector('.r[data-cab]'); if (f) elegir(f.dataset.cab); } });
  ficha();
  if (pedido && byC[pedido]) acceder(pedido);
}

(async()=>{const msg=t=>{const b=document.getElementById('bootm'); if(b) b.textContent=t;};
  try{const r0=await fetch('data/estados.json',{cache:'no-cache'}); AVAIL=await r0.json(); try{const r1=await fetch('data/capas.json',{cache:'no-cache'}); if(r1.ok) CAPAS=await r1.json();}catch(e){} try{const r2=await fetch('data/modelo.json',{cache:'no-cache'}); if(r2.ok) MODELO=await r2.json();}catch(e){}}catch(e){msg('No se pudo cargar la lista de estados.'); console.error(e); return;}
  addEventListener('hashchange',()=>location.reload());
  const cab=(location.hash||'').slice(1),a=AVAIL.find(x=>x.cab===cab);
  const boot=()=>{const b=document.getElementById('boot'); if(b) b.remove();};
  if(!a){boot(); ENTRADA(); return;}
  if(!LAB_PUEDE(a.cab)){boot(); ENTRADA(a.cab); return;}
  try{msg('Cargando '+a.estado+'…'); let DATA=await LAB_DATOS(a.cab,(got,tot)=>msg('Cargando '+a.estado+'… '+(got/1e6).toFixed(1)+' MB'+(tot&&tot>=got?' de '+(tot/1e6).toFixed(1)+' MB':'')));
    const ses=LAB_SES(); DATA=LAB_RECORTE(DATA,ses); APP(DATA); boot(); LAB_VIGILA();
    try{const mm=JSON.parse(sessionStorage.getItem('lab_mun')||'null'); sessionStorage.removeItem('lab_mun'); if(mm&&mm.cab===a.cab&&DATA.meta.municipios[mm.m]&&window.LAB) setTimeout(()=>LAB.setTerr(String(mm.m)),300);}catch(e){} try{localStorage.setItem('lab_ultimo_ok',a.cab);}catch(e){}
    const av=document.querySelector('.rail .av'); if(av){av.textContent=(ses.u||'?').slice(0,1).toUpperCase(); av.title='Sesión: '+ses.u; av.setAttribute('role','button'); av.tabIndex=0; av.style.cursor='pointer';
      av.onclick=()=>{let p=document.getElementById('sesp'); if(p){p.remove(); return;} p=document.createElement('div'); p.id='sesp'; p.className='epop sesp'; p.innerHTML='<div class="sesu">Sesión: <b></b></div><button id="sesx">Salir</button>'; p.querySelector('b').textContent=ses.u; document.body.appendChild(p); const r=av.getBoundingClientRect(); p.style.left=(r.right+10)+'px'; p.style.top=Math.max(8,r.bottom-p.offsetHeight)+'px'; document.getElementById('sesx').onclick=()=>{LAB_SALIR(); location.hash='';};};}
    const out=document.getElementById('rOut'); if(out){out.querySelector('b').textContent='Cerrar sesión ('+ses.u+')'; out.onclick=()=>{LAB_SALIR(); location.hash='';};}}
  catch(e){console.error(e); if(e&&e.name==='OperationError'){LAB_SALIR(); boot(); ENTRADA(a.cab); return;} msg('No se pudieron cargar los datos de '+a.estado+'. Revisa tu conexión y recarga la página.');}})();
