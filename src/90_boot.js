/* ===== arranque ===== */
$('elec').innerHTML=YEARS.map(y=>`<optgroup label="${y}">${Object.keys(TY).filter(t=>D.E[t+'_'+y]).map(t=>`<option value="${t}_${y}">${TY[t]} ${y}</option>`).join('')}</optgroup>`).join(''); $('elec').value=st.elec;
$('elec').onchange=()=>setElec($('elec').value);
$('party').innerHTML='<option value="">Vista general</option>'+['MORENA','MC','PRI','PAN','PT','PVEM','PRD'].map(p=>`<option value="${p}">${NM[p]}</option>`).join('');
$('party').onchange=()=>{st.party=$('party').value; $('rPa').setAttribute('aria-pressed',!!st.party); if(st.party) st.metric=st.elec?'pv':'duro'; else if(METRICS[st.metric].needP) st.metric='mar'; render(true); if(st.view==='tbl') renderTbl(scope());};
$('map').setAttribute('aria-label','Mapa de '+EST+' por sección');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(st.view==='tbl') setView2('map'); else if(st.sel!=null){st.sel=null; paint();} else if(st.terr) setTerr(null);}});
if(innerWidth<=860) st.fp=false; layout(); render(true); setView([...VB]); requestAnimationFrame(()=>fit(ALL,false));
let rt; addEventListener('resize',()=>{clearTimeout(rt); rt=setTimeout(()=>{render(); fit(ALL.filter(munScope),false);},150);});
window.LAB={st,render,renderTbl,setView2,scope,closeRes,closeBig,applyScope,setTerr,paint,setElec,fit};
