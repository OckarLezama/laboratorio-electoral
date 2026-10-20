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
