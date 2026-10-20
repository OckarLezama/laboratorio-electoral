"""Paso 2. Construye data/<clave>.json de un estado a partir de los insumos del paso 1.

uso: python pipeline/lab.py construir chis
Entradas: <temporal>/<clave>/ (resultados, PADRON.csv, conteos.json, bgd/), CONAPO,
          pipeline/insumos/catalogo_eleccion_2027.csv y pipeline/insumos/estados_mx.geojson.
Salida:   data/<clave>.json
"""
import csv, glob, json, math, os, re, sys, statistics as stt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import CFG, PIPE, REPO, ruta, estado, temporal
import geopandas as gpd
from shapely.geometry import mapping
import warnings; warnings.filterwarnings('ignore')
EST=estado(sys.argv[1]); ENT=EST['ent']; CAB=EST['clave']
U=str(temporal(EST))+'/'
_shp=glob.glob(U+'bgd/**/SECCION.shp',recursive=True)
if not _shp: raise SystemExit('Falta la cartografía: corre primero  python pipeline/lab.py preparar '+CAB)
BG=os.path.dirname(_shp[0])+'/'
MAIN=['MORENA','PAN','PRI','PRD','PVEM','PT','MC']; P8=MAIN+['OTROS']
NONVOTE=re.compile(r'^(DEMARCACION|NO_REG|CNR|NULOS|VOTOS_NULOS|CIRCUNSCRIPCION|ID_|NOMBRE_|CABECERA|MUNICIPIO|SECCION|CASILLAS|ACTA|NUM_VOTOS|TOTAL_VOTOS|LISTA_NOMINAL|TIPO|DISTRITO|EXT|OBSERV|RUTA)')
TY={'GOB':'Gubernatura','DIPL':'Diputaciones locales','AYU':'Ayuntamientos','PRE':'Presidencia','SEN':'Senado','DIPF':'Diputaciones federales'}
FMAP=[('LOC_GUBERNATURA_','GOB','local'),('LOC_DIPUTACIONES_LOC_MR_','DIPL','local'),('LOC_AYUNTAMIENTOS_','AYU','local'),('FED_PRE_','PRE','federal'),('FED_SEN_','SEN','federal'),('FED_DIP_','DIPF','federal')]
def num(x):
    try: return float(x)
    except: return 0.0
SMALL={'De','La','Las','Los','Del','Y','El'}
def tcase(s):
    w=str(s).strip().title().split(' ')
    return ' '.join(x.lower() if i and x in SMALL else x for i,x in enumerate(w))

# ---------- geometría ----------
S=gpd.read_file(BG+'SECCION.shp').to_crs(4326)
S=S[S.entidad==ENT].copy(); S['seccion']=S.seccion.astype(int); S=S.sort_values('seccion').reset_index(drop=True)
M=gpd.read_file(BG+'MUNICIPIO.shp').to_crs(4326); DLs=gpd.read_file(BG+'DISTRITO_LOCAL.shp').to_crs(4326); DFs=gpd.read_file(BG+'DISTRITO_FEDERAL.shp').to_crs(4326); EN=gpd.read_file(BG+'ENTIDAD.shp').to_crs(4326)
minx,miny,maxx,maxy=S.total_bounds
k=math.cos(math.radians((miny+maxy)/2)); Wd=1000; sc=Wd/((maxx-minx)*k); Hd=(maxy-miny)*sc
TOL=max(0.00035,(maxx-minx)/2600)
def pj(p): return (round((p[0]-minx)*k*sc,1), round((maxy-p[1])*sc,1))
def path(geom,tol=TOL,minpx=0):
    if geom is None or geom.is_empty: return ''
    g=geom.simplify(tol,preserve_topology=True)
    polys=[g] if g.geom_type=='Polygon' else list(getattr(g,'geoms',[]))
    out=[]
    for poly in polys:
        if poly.geom_type!='Polygon': continue
        for ring in [poly.exterior]+list(poly.interiors):
            pts=[pj(p) for p in ring.coords]
            q=[pts[0]]+[p for i,p in enumerate(pts[1:],1) if p!=pts[i-1]]
            if len(q)<3: continue
            if minpx:
                xs=[a for a,b in q]; ys=[b for a,b in q]
                if max(xs)-min(xs)<minpx and max(ys)-min(ys)<minpx: continue
            out.append('M'+' '.join(f'{x:g},{y:g}' for x,y in q)+'Z')
    return ''.join(out)
import unicodedata
nrm=lambda x: re.sub(r'[^A-Z ]','',unicodedata.normalize('NFKD',str(x)).encode('ascii','ignore').decode().upper()).strip()
CON={}
for r in csv.DictReader(open(ruta('conapo'),encoding='utf-8-sig')):
    if int(r['CVE_ENT'])==ENT: CON[nrm(r['NOM_MUN'])]=r
munn={}; MARG={}
for r in M[M.entidad==ENT].itertuples():
    MAN={'PLAYA DEL CARMEN':'SOLIDARIDAD','VILLACOMALTITLAN':'VILLA COMALTITLAN','HEROICO SAN MARTIN DE LOS CANSECOS':'SAN MARTIN DE LOS CANSECOS','HEROICA VILLA DE SAN BLAS ATEMPA':'SAN BLAS ATEMPA','VILLA HIDALGO YALALAG':'VILLA HIDALGO','H VILLA TEZOATLAN SEGURA Y LUNA CUNA IND OAX':'HEROICA VILLA TEZOATLAN DE SEGURA Y LUNA CUNA DE LA INDEPENDENCIA DE OAXACA'}
    import difflib
    k0=MAN.get(nrm(r.nombre),nrm(r.nombre)); c=CON.get(k0) or next((v for kk,v in CON.items() if kk.startswith(k0+' ')),None)
    if not c:
        cm=difflib.get_close_matches(k0,list(CON),1,.75); c=CON[cm[0]] if cm else None
    m=int(r.municipio)
    munn[m]=c['NOM_MUN'] if c else {'Dzitbalche':'Dzitbalché'}.get(tcase(r.nombre),tcase(r.nombre))
    if c: MARG[m]=[c['GM_2020'],round(float(c['IM_2020']),1),int(c['POB_TOT'])]
print('marginación emparejada',len(MARG),'de',len(munn),[munn[m] for m in munn if m not in MARG][:10])
geo={'mun':[{'id':int(r.municipio),'d':path(r.geometry,TOL*1.2,1.2)} for r in M[M.entidad==ENT].itertuples()],
     'dl':[{'id':int(r.distrito_l),'d':path(r.geometry,TOL*1.3,1.2)} for r in DLs[DLs.entidad==ENT].itertuples()],
     'df':[{'id':int(r.distrito_f),'d':path(r.geometry,TOL*1.3,1.2)} for r in DFs[DFs.entidad==ENT].itertuples()],
     'ent':path(EN.geometry.iloc[0],TOL*1.5,2)}
# contexto: estados vecinos
st_all=gpd.read_file(PIPE/'insumos'/'estados_mx.geojson').to_crs(4326)
from shapely.geometry import box
bb=box(minx-(maxx-minx)*.6,miny-(maxy-miny)*.6,maxx+(maxx-minx)*.6,maxy+(maxy-miny)*.6)
ctx=[];lab=[]
namecol=[c for c in st_all.columns if c.lower() in ('name','nombre','state_name','nom_ent')][0]
# todo México: detalle fino cerca del estado y trazo simple lejos, para que al alejar o mover el mapa el país se vea completo
for r in st_all.itertuples():
    G=r.geometry.buffer(0); nm=getattr(r,namecol)
    if tcase(nm).startswith(tcase(EN.nombre.iloc[0])[:6]): continue
    near=not G.intersection(bb).is_empty
    d=path(G,TOL*3 if near else max(TOL*3,0.02),3)
    if not d: continue
    ctx.append({'n':nm,'d':d})
    c=G.representative_point(); x,y=pj((c.x,c.y))
    if True: lab.append({'n':re.sub(r'(?i) de (Ignacio de la Llave|Zaragoza|Ocampo)$','',nm).replace('Distrito Federal','Ciudad de México'),'x':x,'y':y,'r':0})
geo['ctx']=ctx

# ---------- resultados ----------
idx={int(s):i for i,s in enumerate(S.seccion)}; N=len(S)
E={}; OWN={}; CABDL={}; CABDF={}; MUNSEE={}
files=sorted(glob.glob(U+'*.csv'))
LDY=max(int(re.search(r'(\d{4})',os.path.basename(z)).group(1)) for z in files if os.path.basename(z).startswith('LOC_DIPUTACIONES_LOC_MR_'))
ALIAS={'ES':'PES','FXMO':'FXM','FXMV':'FXM','FXMQROO':'FXM','NAO':'NA','NAY':'NA','PNA':'NA','PANAL':'NA','CXQROO':'CQROO','PCU':'PCHU','MVC':'PMCH','ESQROO':'PES','FXMQROO':'FXM'}
def toks(c):
    if c.startswith('PLANILLA'): return ['OTROS']
    c=re.sub(r'^C_(COMUN_)?','',c.replace('NVA_ALIANZA','NA'))
    return [ALIAS.get(p,p) for p in c.split('_') if p and not p.isdigit()]
RAW={}
for f in files:
    b=os.path.basename(f)
    for pre,t,kind in FMAP:
        if b.startswith(pre):
            y=int(re.search(r'(\d{4})',b).group(1)); ek=f'{t}_{y}'
            rows=[{(k.strip() if k else k):v for k,v in r.items()} for r in csv.DictReader(open(f,encoding='utf-8-sig',errors='ignore'))]
            cols=[c for c in rows[0].keys() if c and not NONVOTE.match(c.strip())]
            ind=[c for c in cols if c.startswith('CAND_IND')]
            combos=[c for c in cols if '_' in c and c not in ind]
            used=[toks(c) for c in combos if sum(num(r[c]) for r in rows)>0]
            sec={}; own={}
            for r in rows:
                try: s=int(float(r['SECCION']))
                except: continue
                if s<=0 or s not in idx: continue
                x=sec.setdefault(s,[{},0.0,0.0]); v=x[0]
                for c in cols:
                    if c in ind: continue
                    n=num(r[c])
                    if not n: continue
                    ps=toks(c) if c in combos else [ALIAS.get(c,c)]
                    for p in ps: v[p]=v.get(p,0)+n/len(ps)
                iv=sorted((num(r[c]) for c in ind),reverse=True)
                if iv and iv[0]: v['IND']=v.get('IND',0)+iv[0]; v['OTROS']=v.get('OTROS',0)+sum(iv[1:])
                x[1]+=num(r.get('TOTAL_VOTOS')); x[2]+=num(r.get('LISTA_NOMINAL'))
                o=own.setdefault(s,[0.0]*7)
                for j,p in enumerate(MAIN): o[j]+=num(r.get(p))
                if t=='DIPL' and y==LDY:
                    dl=int(num(r.get('ID_DISTRITO_LOCAL') or r.get('ID_DISTRITO') or 0)); cb=r.get('CABECERA_DISTRITAL_LOCAL') or r.get('CABECERA_DISTRITAL')
                    if dl and cb: CABDL.setdefault(dl,{}); CABDL[dl][cb]=CABDL[dl].get(cb,0)+1
                if t=='DIPF' and y==2024:
                    df=int(num(r.get('ID_DISTRITO_FEDERAL') or 0)); cb=r.get('CABECERA_DISTRITAL_FEDERAL')
                    if df and cb: CABDF.setdefault(df,{}); CABDF[df][cb]=CABDF[df].get(cb,0)+1
                if r.get('MUNICIPIO') and r.get('ID_MUNICIPIO'):
                    MUNSEE.setdefault(int(num(r['ID_MUNICIPIO'])),r['MUNICIPIO'])
            RAW[ek]=(t,y,kind,sec,used)
            if kind=='local': OWN[ek]=own
# partidos no nacionales relevantes: >=2.5% estatal en alguna elección o 1er lugar individual en >=5 secciones
SCR={}
for ek,(t,y,kind,sec,used) in RAW.items():
    tot={}; 
    for s,(v,_,_) in sec.items():
        for p,n in v.items(): tot[p]=tot.get(p,0)+n
        top=max(v,key=v.get) if v else None
        if top and top not in MAIN and top!='OTROS': SCR.setdefault(top,[0,0]); SCR[top][1]+=1
    val=sum(tot.values()) or 1
    for p,n in tot.items():
        if p in MAIN or p=='OTROS': continue
        SCR.setdefault(p,[0,0]); SCR[p][0]=max(SCR[p][0],n/val)
EXTRA=sorted([p for p,(sh,w) in SCR.items() if sh>=.025 or w>=5],key=lambda p:-SCR[p][0])[:8]
P8=MAIN+EXTRA+['OTROS']; NP=len(P8)
print('extras',[(p,round(100*SCR[p][0],1),SCR[p][1]) for p in EXTRA])
for ek,(t,y,kind,sec,used) in RAW.items():
    par={}
    def fnd(a):
        par.setdefault(a,a)
        while par[a]!=a: a=par[a]
        return a
    for ps in used:
        m=[p for p in ps if p in MAIN]
        for p in m[1:]: par[fnd(p)]=fnd(m[0])
    for x in EXTRA:
        roots={fnd(p) for ps in used if x in ps for p in ps if p in MAIN}
        if len(roots)==1: par[fnd(x)]=roots.pop()
    rr=[None]*N; tot=[0.0]*NP
    for s,(v,tv,ln) in sec.items():
        a=[v.get(p,0) for p in P8[:-1]]; a.append(sum(n for p,n in v.items() if p not in P8[:-1]))
        for j in range(NP): tot[j]+=a[j]
        rr[idx[s]]=[round(q) for q in a]+[round(tv),round(ln)]
    T={p:tot[j] for j,p in enumerate(P8)}
    blocs={}
    for p in P8: blocs.setdefault(fnd(p) if p in par else p,[]).append(p)
    bl=[{'lead':max(m,key=lambda p:T[p]),'members':sorted(m,key=lambda p:-T[p])} for m in blocs.values()]
    E[ek]={'label':TY[t]+' '+str(y),'type':t,'year':y,'kind':kind,'blocs':bl,'r':rr}
    print(ek,len(sec),[b['members'] for b in bl if len(b['members'])>1])
YEARS=sorted({e['year'] for e in E.values()})

# ---------- secciones y padrón ----------
pad={}
for r in csv.DictReader(open(U+'PADRON.csv',encoding='utf-8')):
    try: s=int(float(r['SECCION']))
    except: continue
    if s<=0: continue
    g=lambda c: int(float(r.get(c) or 0))
    grp=[['18','19','20_24'],['25_29'],['30_34','35_39'],['40_44','45_49'],['50_54','55_59'],['60_64'],['65_Y_MAS']]
    hm=[sum(g(f'LISTA_{a}_HOMBRES') for a in G) for G in grp]; mm=[sum(g(f'LISTA_{a}_MUJERES') for a in G) for G in grp]
    pad[s]=[g('PADRON ELECTORAL'),g('LISTA NOMINAL'),g('LISTA HOMBRES'),g('LISTA MUJERES')]+hm+mm
SEC=[]; PATHS=[]
lastDL=max((e for e in E if e.startswith('DIPL_')),key=lambda e:E[e]['year'])
for i,r in S.iterrows():
    s=int(r.seccion); p=pad.get(s,[0]*18)
    SEC.append([s,int(r.municipio),int(r.distrito_l),int(r.distrito_f),int(r.tipo),p[1],1 if E[lastDL]['r'][i] is None else 0])
    PATHS.append(path(r.geometry))
DM=[pad.get(int(s),[0]*18) for s in S.seccion]
# etiquetas de municipios (los de más electores, rango 1)
lnm={}
for x in SEC: lnm[x[1]]=lnm.get(x[1],0)+x[5]
top=sorted(lnm,key=lambda m:-lnm[m]); nTop=max(4,min(10,len(top)//12))
for r in M[M.entidad==ENT].itertuples():
    c=r.geometry.representative_point(); x,y=pj((c.x,c.y)); m=int(r.municipio)
    lab.append({'n':munn[m],'x':x,'y':y,'r':1 if m in top[:nTop] else 2,'m':m})
geo['lab']=lab
MN={nrm(v):v for v in munn.values()}
mode=lambda d:{k:(lambda c:MN.get(nrm(c)) or next((v for kk,v in MN.items() if kk.startswith(nrm(c))),None) or tcase(c))(max(v,key=v.get)) for k,v in d.items()}

# ---------- métricas ----------
LOC=sorted([e for e in OWN],key=lambda e:E[e]['year'])
CONS={'MORENA':2018}
lnS=[x[5] for x in SEC]; munS=[x[1] for x in SEC]
V={'duro':{},'techo':{}}
for p in MAIN:
    j=MAIN.index(p); els=[e for e in LOC if E[e]['year']>=CONS.get(p,0)]
    raw=[]; te=[]
    for i,s in enumerate(S.seccion):
        vs=[]; ts=[]
        for e in els:
            o=OWN[e].get(int(s)); r=E[e]['r'][i]
            if o and r and r[NP+1]: vs.append(o[j]/r[NP+1]); ts.append(r[j]/r[NP+1])
        vs.sort(); raw.append(vs[0] if vs else None); te.append(max(ts) if ts else None)
    mm={}
    for m in set(munS):
        vals=[(raw[i],lnS[i]) for i in range(N) if munS[i]==m and raw[i] is not None]
        mm[m]=sum(a*b for a,b in vals)/max(1,sum(b for a,b in vals))
    K=400
    V['duro'][p]=[None if x is None else round(100*((lnS[i]/(lnS[i]+K))*x+(1-lnS[i]/(lnS[i]+K))*mm[munS[i]]),2) for i,x in enumerate(raw)]
    V['techo'][p]=[None if x is None else round(100*x,2) for x in te]
def shares(ek,i):
    r=E[ek]['r'][i]
    if not r: return None
    val=sum(r[:NP]); return [x/val for x in r[:NP]] if val else None
DIPLs=sorted([e for e in E if e.startswith('DIPL_')],key=lambda e:E[e]['year'])
pairs=list(zip(DIPLs,DIPLs[1:]))
vol=[]
for i in range(N):
    vs=[]
    for a,b in pairs:
        A,B=shares(a,i),shares(b,i)
        if A and B: vs.append(50*sum(abs(x-y) for x,y in zip(A,B)))
    vol.append(round(sum(vs)/len(vs),1) if vs else None)
V['vol']=vol
EKT=[e for e in E if E[e]['year']>=2018]
V['maxT']=[(lambda ts: round(100*min(1,max(ts)),1) if ts else None)([E[e]['r'][i][NP]/E[e]['r'][i][NP+1] for e in EKT if E[e]['r'][i] and E[e]['r'][i][NP+1]]) for i in range(N)]
CC=json.load(open(U+'conteos.json',encoding='utf-8'))
V['age']={y:[CC[y].get(str(int(s))) for s in S.seccion] for y in CC}
def st_share(ek,p):
    a=b=0
    for r in E[ek]['r']:
        if r: a+=r[P8.index(p)]; b+=sum(r[:NP])
    return 100*a/b if b else 0
GOBs=sorted([e for e in E if e.startswith('GOB_')],key=lambda e:E[e]['year'])
chg=[st_share(b,p)-st_share(a,p) for a,b in pairs+list(zip(GOBs,GOBs[1:])) for p in MAIN]
cal={'rms':round(math.sqrt(sum(c*c for c in chg)/len(chg)),2) if chg else None,'max':round(max(abs(c) for c in chg),1) if chg else None}
V['calib']=cal

# ---------- configuración por estado ----------
cfg={}
for r in csv.DictReader(open(PIPE/'insumos'/'catalogo_eleccion_2027.csv',encoding='utf-8-sig')):
    if int(r['ID_ESTADO'])==ENT:
        um=re.search(r'([\d.]+)\s*%',r['UMBRAL_RP'] or '')
        cfg={'gob2027':r['GUBERNATURA_2027']=='SI','cong2027':r['CONGRESO_2027']=='SI','ayu2027':r['AYUNTAMIENTOS_2027']=='SI','mr':int(r['DIP_MR']),'rp':int(r['DIP_RP']),'umbral':float(um.group(1))/100 if um else .03,'metodo':r['METODO_RP_CONGRESO'],'certeza':r['CERTEZA']}
last=lambda t: max((e for e in E if e.startswith(t+'_')),key=lambda e:E[e]['year'],default=None)
base=last('GOB') if cfg.get('gob2027') else last('DIPL') if cfg.get('cong2027') else last('AYU') or last('DIPL')
AYUS=[e for e in E if e.startswith('AYU_')]
hasA={}
for i,x in enumerate(SEC):
    if any(E[e]['r'][i] for e in AYUS): hasA[x[1]]=1
uyc=sorted({x[1] for x in SEC}-set(hasA)) if AYUS else []
ACC={'Cancun':'Cancún','Kantunilkin':'Kantunilkín','Heroica Cardenas':'Heroica Cárdenas','Merida':'Mérida','Tizimin':'Tizimín','Ticul':'Ticul','Chetumal':'Chetumal','Jose Maria Morelos':'José María Morelos','Felipe Carrillo Puerto':'Felipe Carrillo Puerto','Cozumel':'Cozumel','Tuxtla Gutierrez':'Tuxtla Gutiérrez','Tapachula':'Tapachula','Comitan de Dominguez':'Comitán de Domínguez','Oaxaca de Juarez':'Oaxaca de Juárez'}
fixa=lambda d:{k:ACC.get(v,v) for k,v in d.items()}
EAC={'Yucatan':'Yucatán','Michoacan':'Michoacán','Nuevo Leon':'Nuevo León','Queretaro':'Querétaro','San Luis Potosi':'San Luis Potosí','Mexico':'México'}
meta={'uyc':uyc,'estado':EST['nombre'],'ent':ENT,'cab':CAB,'municipios':munn,'cabDL':fixa(mode(CABDL)),'cabDF':fixa(mode(CABDF)),'cfg':cfg,'base':base,'marg':MARG,'years':YEARS,
      'fuentes':{'res':'INE, Sistema de Consulta de la Estadística Electoral (SEE)','pad':'INE, DERFE, Padrón y Lista Nominal, corte '+CFG['cortes']['padron'],'carto':'INE, DERFE, Base Geográfica Digital, corte '+CFG['cortes']['cartografia'],'cc':'INE, DECEyEC, Conteos Censales de Participación 2018, 2021 y 2024','cfg':'Compendio legal 2027 (catálogo por estado)','marg':'CONAPO, Índice de marginación por municipio 2020'}}
out={'meta':meta,'vb':[0,0,Wd,round(Hd)],'P8':P8,'S':SEC,'paths':PATHS,'geo':geo,'E':E,'DM':DM,'V':V}
os.makedirs(REPO/'data',exist_ok=True)
fn=str(REPO/'data'/f'{CAB}.json'); json.dump(out,open(fn,'w',encoding='utf-8'),separators=(',',':'),ensure_ascii=False)
print('MB',round(os.path.getsize(fn)/1e6,2),'secciones',N,'nuevas',sum(x[6] for x in SEC),'base',base,'cfg',cfg,'calib',cal)
print('uyc',len(uyc));print('cabDL',list(meta['cabDL'].items())[:5],'cabDF',list(meta['cabDF'].items())[:5])
