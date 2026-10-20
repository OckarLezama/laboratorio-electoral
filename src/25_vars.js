/* ===== bases adicionales (registro genérico) =====
   Cada variable registrada en pipeline/capas.json aparece sola como:
   color del mapa ("Otras capas"), filtro bajo/medio/alto, línea en la ficha del mapa,
   columna de la tabla y columna del CSV. Los valores se descargan solo al usarse. */
const XB=(typeof CAPAS!=='undefined'?CAPAS:[]).filter(b=>b.estados.includes(M0.cab));
const XV={}; XB.forEach(b=>b.variables.forEach(v=>{XV[v.id]={...v,base:b,key:'x_'+v.id};}));
const XD={},XL={},XFAIL={};   // valores por variable; promesas de carga por base
function xLoad(bid){if(XL[bid]) return XL[bid]; return XL[bid]=fetch('data/'+M0.cab+'/capas/'+bid+'.json').then(r=>{if(!r.ok) throw new Error(r.status); return r.json();}).then(j=>{for(const k in j.variables) if(XV[k]) xPrep(k,j.variables[k]);}).catch(e=>{XFAIL[bid]=1; console.error(e); toast&&toast('No se pudo cargar la base '+bid+'.');});}
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
