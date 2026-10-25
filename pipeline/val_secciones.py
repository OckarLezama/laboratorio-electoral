"""Validación de la estrategia por sección (fuera de muestra): las etiquetas se calculan con datos hasta 2021
y se comparan con lo que pasó en 2024, en los 32 estados. Resultado en pipeline/insumos/validacion_secciones.json
(lo toma modelo.py y la plataforma lo muestra junto a cada etiqueta).
uso: python pipeline/val_secciones.py   (corre también dentro de: python pipeline/lab.py proyeccion)"""
import sys,json,collections
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import proyeccion as P_
MAIN=['MORENA','PAN','PRI','MC','PVEM','PT']
def main():
    D=collections.defaultdict(lambda:[0,0.0,0]); SW=collections.defaultdict(lambda:[0,0]); CAT=collections.defaultdict(lambda:[0,0])
    for f in sorted(P_.PLANO.glob('*.json')):
        if f.stem=='claves': continue
        d,P,S,E=P_.carga(f.stem); ix={p:j for j,p in enumerate(P)}
        k21=[k for k,e in E.items() if 2018<=e['y']<=2021]; k24=[k for k,e in E.items() if e['y']==2024]
        if not k24: continue
        def win(ek,i):
            e=E[ek]; s=e['sh'].get(i)
            if s is None: return None
            bl=sorted(((sum(s[j] for j in b),n) for n,b in enumerate(e['bl']) if b),reverse=True)
            return bl[0][1] if bl else None
        def winparty(ek,i):
            w=win(ek,i)
            if w is None: return None
            b=E[ek]['bl'][w]; s=E[ek]['sh'][i]; return P[max(b,key=lambda j:s[j])]
        for i in range(len(S)):
            for p in MAIN:
                if p not in ix: continue
                j=ix[p]; v=[E[k]['sh'][i][j] for k in k21 if i in E[k]['sh']]; w=[E[k]['sh'][i][j] for k in k24 if i in E[k]['sh']]
                if len(v)<2 or not w or min(v)<.30: continue
                gw=[(win(k,i) is not None and j in E[k]['bl'][win(k,i)]) for k in k24 if i in E[k]['sh']]
                a=D[p]; a[0]+=1; a[1]+=sum(gw)/len(gw); a[2]+=min(w)>=.30
            def chg(x,y):
                n=c=0
                for t in ('DIPL','DIPF','AYU'):
                    A=f'{t}_{x}';B=f'{t}_{y}'
                    if A in E and B in E:
                        wa,wb=winparty(A,i),winparty(B,i)
                        if wa and wb: n+=1; c+=wa!=wb
                return n,c
            n1,c1=chg(2018,2021); n2,c2=chg(2021,2024)
            if n1>=2 and n2>=1:
                sw=c1>=2; SW[sw][0]+=c2>=1; SW[sw][1]+=1
        for ek,L,Ry in P_.objetivos(E):
            if E[ek]['y']!=2024 or E[ek]['t'] not in ('DIPL','DIPF'): continue
            R,Rks=P_.reciente(E,Ry); pr=P_.predice(E,L,R,Rks,.25,0); act=E[ek]; bl=[b for b in act['bl'] if b]
            if len(bl)<2: continue
            for i,s in pr.items():
                if i not in act['sh']: continue
                a=act['sh'][i]
                for b in bl:
                    ps=sum(s[j] for j in b)
                    if ps<.05: continue
                    m=100*(ps-max(sum(s[j] for j in o) for o in bl if o is not b))
                    cat='seg' if m>=10 else 'cui' if m>=0 else 'mov' if m>=-10 else 'dif'
                    CAT[cat][0]+=sum(a[j] for j in b)>=max(sum(a[j] for j in o) for o in bl); CAT[cat][1]+=1
    out={'metodo':'etiquetas calculadas con elecciones 2018-2021 y comparadas con 2024 (32 estados)',
         'duro':{p:{'n':a[0],'gano':round(100*a[1]/a[0]),'sostuvo':round(100*a[2]/a[0])} for p,a in D.items() if a[0]>=50},
         'sw':{'switcher':round(100*SW[True][0]/max(1,SW[True][1])),'resto':round(100*SW[False][0]/max(1,SW[False][1])),'n':SW[True][1]},
         'sit':{c:{'gano':round(100*v[0]/v[1]),'n':v[1]} for c,v in CAT.items()}}
    p=Path(__file__).resolve().parent/'insumos'/'validacion_secciones.json'; p.write_text(json.dumps(out,ensure_ascii=False,indent=1),encoding='utf-8'); print(json.dumps(out,ensure_ascii=False))
if __name__=='__main__':
    main()
