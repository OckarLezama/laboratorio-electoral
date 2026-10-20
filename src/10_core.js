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
const S=D.S.map((a,i)=>({s:a[0],m:a[1],dl:a[2],df:a[3],t:a[4],ln:a[5],nw:!!a[6],d:D.paths[i]})),N=S.length,ALL=S.map((s,i)=>i);
const DM=D.DM,V2=D.V,GEO=D.geo;
const YEARS=M0.years,TY={GOB:'Gubernatura',DIPL:'Diputaciones locales',AYU:'Ayuntamientos',PRE:'Presidencia',SEN:'Senado',DIPF:'Diputaciones federales'};
const DLS=[...new Set(S.map(s=>s.dl))].sort((a,b)=>a-b),DFS=[...new Set(S.map(s=>s.df))].sort((a,b)=>a-b),NDL=DLS.length;
const CABDL=M0.cabDL||{},CABDF=M0.cabDF||{};
const MANY=Object.keys(MUN).length>40;
const AGEY=Object.keys(V2.age).sort().pop();

/* resultados por sección con caché */
const RC={};
function row(ek,i){const c=RC[ek]||(RC[ek]=[]); if(c[i]!==undefined) return c[i]; const r=D.E[ek].r[i]; if(!r) return c[i]=null; const v={}; let val=0; D.P8.forEach((p,j)=>{v[p]=r[j]; val+=r[j];}); return c[i]={v,val,t:r[NP],ln:r[NP+1]};}
function totals(ek,idx){const tot={}; let val=0,t=0,ln=0; idx.forEach(i=>{const r=row(ek,i); if(!r) return; t+=r.t; ln+=r.ln; val+=r.val; for(const p in r.v) tot[p]=(tot[p]||0)+r.v[p];});
  const bl=D.E[ek].blocs.filter(b=>b.lead!=='OTROS').map(b=>{const parts=b.members.filter(m=>m!=='OTROS').map(m=>({p:m,v:tot[m]||0})).sort((a,c)=>(c.p===b.lead)-(a.p===b.lead)||c.v-a.v); return {lead:b.lead,members:b.members,name:parts.length>3?parts.slice(0,3).map(x=>NM[x.p]).join('-')+' y '+(parts.length-3)+' más':parts.map(x=>NM[x.p]).join('-'),c:C[parts[0].p],votes:parts.reduce((a,x)=>a+x.v,0),parts};}).sort((a,b)=>b.votes-a.votes);
  bl.forEach(b=>b.pct=val?100*b.votes/val:0); return {bl,val,t,ln,tot,turn:ln?100*t/ln:null};}
const WC={};
const winner=(ek,idx)=>{if(idx.length===1){const c=WC[ek]||(WC[ek]=[]),i=idx[0]; if(c[i]!==undefined) return c[i]; const T=totals(ek,idx); return c[i]=T.val?{lead:T.bl[0].lead,m:T.bl[0].pct-(T.bl[1]?T.bl[1].pct:0),bl:T.bl,turn:T.turn}:null;}
  const T=totals(ek,idx); if(!T.val) return null; return {lead:T.bl[0].lead,m:T.bl[0].pct-(T.bl[1]?T.bl[1].pct:0),bl:T.bl,turn:T.turn};};
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
const SW=(()=>{const eks=YEARS.flatMap(y=>['GOB','DIPL','AYU'].map(t=>t+'_'+y)).filter(e=>D.E[e]).slice(-4); return ALL.map(i=>{const ws=eks.map(e=>winner(e,[i])).filter(Boolean).map(w=>w.lead); return new Set(ws).size>1;});})();
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
const st={elec:BASE,party:'',terr:null,metric:'mar',view:'map',fp:true,ft:'t',open:{yr:true},f:{tipo:[],mun:[],dl:[],df:[],sec:[],size:[],part:[],mg:[],cmp:[],age:[],win:[]},sel:null,sort:{k:'ln',d:-1},mq:'',cards:['gen','res','tend','sum','gob','cng','trt'],cat:false};
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
