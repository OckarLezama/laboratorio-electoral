/* Vista nacional de Análisis: se muestra cuando no hay estado en la dirección (index.html o index.html#mx).
   Usa solo data/estados.json y el contorno de los estados (data/inicio/mx32.json); elegir un estado carga su base por sección. */
async function NACION(){
  const $=id=>document.getElementById(id),esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const PC={MORENA:'#A9455E',PAN:'#3F72B5',PRI:'#2F8F64',MC:'#E9813F',PVEM:'#7FB24E',PT:'#CF4B42',PRD:'#E5B533'},pc=p=>PC[p]||'#8A9393';
  const PN={MORENA:'Morena',PVEM:'PVEM'},pn=p=>PN[p]||p,fmt=n=>n>=1e6?(n/1e6).toFixed(n>=1e7?1:2)+' M':n.toLocaleString('es-MX');
  document.body.classList.add('natmode'); const rm=$('rMx'),re=$('rEd'); if(rm) rm.setAttribute('aria-pressed','true'); if(re) re.setAttribute('aria-pressed','false');
  if(rm) rm.onclick=()=>$('nq')&&$('nq').focus();
  const A=AVAIL.filter(x=>x.ent),byE={}; A.forEach(x=>byE[x.ent]=x);
  const T={ln:A.reduce((s,x)=>s+(x.ln||0),0),sec:A.reduce((s,x)=>s+(x.sec||0),0),mun:A.reduce((s,x)=>s+(x.mun||0),0),g:A.filter(x=>x.c27&&x.c27.g).length,c:A.filter(x=>x.c27&&x.c27.c).length,a:A.filter(x=>x.c27&&x.c27.a).length};
  const gobN={}; A.forEach(x=>{if(x.gob) gobN[x.gob.l]=(gobN[x.gob.l]||0)+1;});
  const n=document.createElement('div'); n.id='nat'; n.className='nat';
  n.innerHTML=`<header class="top"><div class="ttl"><small><span>México</span></small><h1>República Mexicana</h1><div class="nsub">Elige un estado para analizarlo sección por sección</div></div>
    <div class="ctl"><div class="ac"><svg class="mg" viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.6"/><path d="M8 8l3 3"/></svg><div class="box"><input id="nq" autocomplete="off" placeholder="Buscar estado" aria-label="Buscar estado"><kbd>/</kbd></div></div></div></header>
  <div class="nbody">
    <section class="ncard nmap"><div class="nk">
      <div><b>${fmt(T.ln)}</b><span>Lista nominal</span></div><div><b>${A.length}</b><span>Estados</span></div><div><b>${T.mun.toLocaleString('es-MX')}</b><span>Municipios</span></div><div><b>${T.sec.toLocaleString('es-MX')}</b><span>Secciones</span></div>
      <div class="k27"><b>${T.g}</b><span>Gubernaturas en 2027</span></div></div>
      <div class="nseg" role="group" aria-label="Colorear mapa por"><button data-m="ln" aria-pressed="true">Lista nominal</button><button data-m="gob" aria-pressed="false">Quién gobierna</button><button data-m="g27" aria-pressed="false">Elección 2027</button></div>
      <div class="nsvg"><svg id="nmap" aria-label="Mapa de México por estado"></svg><div class="ntip" id="ntip"></div></div>
      <div class="nleg" id="nleg"></div></section>
    <section class="ncard nlist"><div class="nlh"><h2>Estados</h2><span id="ncount">${A.length}</span></div><div class="nl" id="nl"></div></section>
  </div>`;
  document.querySelector('.main').appendChild(n);
  let MX; try{MX=await (await fetch('data/inicio/mx32.json')).json();}catch(e){MX=null;}
  const svg=$('nmap'),max=Math.max(...A.map(x=>x.ln||0));
  const tq=t=>{const a=[228,245,243],b=[28,127,121],k=Math.pow(t,.6);return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*k)).join(',')})`;};
  let mode='ln',hot=null,q='';
  const fill=x=>{if(!x) return '#E4ECEB'; if(mode==='ln') return tq((x.ln||0)/max); if(mode==='gob') return x.gob?pc(x.gob.l):'#D9E2E1'; return x.c27&&x.c27.g?'#2FA59D':x.c27&&x.c27.c?'#9FD9D4':'#E4ECEB';};
  if(MX){svg.setAttribute('viewBox',`0 0 ${MX.w} ${MX.h}`); svg.innerHTML=MX.st.map(s=>`<path data-e="${s.ent}" d="${s.d}"/>`).join('');}
  const paths=[...svg.querySelectorAll('path')];
  const legend=()=>{const L=$('nleg'); if(mode==='ln') L.innerHTML=`<span>menos electores</span><i class="ramp"></i><span>más electores</span>`;
    else if(mode==='gob') L.innerHTML=Object.keys(gobN).sort((a,b)=>gobN[b]-gobN[a]).map(p=>`<span><i style="background:${pc(p)}"></i>${pn(p)} <b>${gobN[p]}</b></span>`).join('');
    else L.innerHTML=`<span><i style="background:#2FA59D"></i>Gubernatura y congreso <b>${A.filter(x=>x.c27&&x.c27.g).length}</b></span><span><i style="background:#9FD9D4"></i>Solo congreso o ayuntamientos <b>${A.filter(x=>x.c27&&!x.c27.g&&(x.c27.c||x.c27.a)).length}</b></span>`;};
  const paint=()=>{paths.forEach(p=>{const x=byE[+p.dataset.e],m=!q||(x&&x.estado.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').includes(q)); p.style.fill=fill(x); p.classList.toggle('dim',!m);}); legend();};
  const c27=x=>x.c27?[x.c27.g&&'Gubernatura',x.c27.c&&'Congreso',x.c27.a&&'Ayuntamientos'].filter(Boolean):[];
  const c27s=x=>x.c27?[x.c27.g&&'gubernatura',x.c27.c&&'congreso',x.c27.a&&'ayuntamientos'].filter(Boolean):[];
  const list=()=>{const L=A.filter(x=>!q||x.estado.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').includes(q)).sort((a,b)=>(b.ln||0)-(a.ln||0)); $('ncount').textContent=L.length;
    $('nl').innerHTML=L.map(x=>`<a class="nr" href="#${x.cab}" data-e="${x.ent}"><span class="nn"><b>${esc(x.estado)}</b><small>${x.gob?`<i style="background:${pc(x.gob.l)}"></i>Gobierna ${pn(x.gob.l)}`:''}</small>${c27s(x).length?`<small class="n27">2027: ${c27s(x).join(', ')}</small>`:''}</span><span class="nv"><b>${fmt(x.ln||0)}</b><i><u style="width:${(100*(x.ln||0)/max).toFixed(1)}%"></u></i></span></a>`).join('')||`<p class="nempty">Ningún estado coincide con “${esc($('nq').value)}”.</p>`;};
  const tip=(x,ev)=>{const t=$('ntip'); if(!x){t.classList.remove('on'); return;} const r=svg.parentNode.getBoundingClientRect();
    t.innerHTML=`<b>${esc(x.estado)}</b><span>${fmt(x.ln||0)} electores · ${(x.sec||0).toLocaleString('es-MX')} secciones</span>${x.gob?`<span><i style="background:${pc(x.gob.l)}"></i>Gobierna ${pn(x.gob.l)} desde ${x.gob.y}</span>`:''}${c27(x).length?`<span>En 2027: ${c27(x).join(', ')}</span>`:''}<em>Clic para analizar</em>`;
    t.classList.add('on'); const w=t.offsetWidth,h=t.offsetHeight; let lx=ev.clientX-r.left+14,ly=ev.clientY-r.top+14; if(lx+w>r.width-8) lx=ev.clientX-r.left-w-14; if(ly+h>r.height-8) ly=ev.clientY-r.top-h-14; t.style.transform=`translate(${lx}px,${ly}px)`;};
  const setHot=e=>{if(hot===e) return; hot=e; paths.forEach(p=>p.classList.toggle('hot',+p.dataset.e===e)); document.querySelectorAll('#nl .nr').forEach(a=>a.classList.toggle('hot',+a.dataset.e===e));};
  const go=x=>{if(!x) return; n.classList.add('leave'); location.hash=x.cab;};
  svg.addEventListener('pointermove',ev=>{const p=ev.target.closest('path'),x=p&&byE[+p.dataset.e]; setHot(x?x.ent:null); tip(x,ev);});
  svg.addEventListener('pointerleave',()=>{setHot(null); tip(null);});
  svg.addEventListener('click',ev=>{const p=ev.target.closest('path'); if(p) go(byE[+p.dataset.e]);});
  $('nl').addEventListener('pointerover',ev=>{const a=ev.target.closest('.nr'); setHot(a?+a.dataset.e:null);});
  $('nl').addEventListener('pointerleave',()=>setHot(null));
  $('nl').addEventListener('click',ev=>{const a=ev.target.closest('.nr'); if(a){ev.preventDefault(); go(byE[+a.dataset.e]);}});
  n.querySelectorAll('.nseg button').forEach(b=>b.onclick=()=>{mode=b.dataset.m; n.querySelectorAll('.nseg button').forEach(x=>x.setAttribute('aria-pressed',x===b)); paint();});
  $('nq').addEventListener('input',e=>{q=e.target.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); paint(); list();});
  $('nq').addEventListener('keydown',e=>{if(e.key==='Enter'){const f=$('nl').querySelector('.nr'); if(f) go(byE[+f.dataset.e]);}});
  addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==$('nq')){e.preventDefault(); $('nq').focus();}});
  addEventListener('hashchange',()=>location.reload());
  paint(); list();
}
