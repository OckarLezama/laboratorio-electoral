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
