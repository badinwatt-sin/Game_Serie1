#!/usr/bin/env python3
"""Lucide helper: search icons, print SVG, build an inline sprite. Stdlib only; data in ../data/icons.json
Commands:
  search <words...> [-n 15]        ranked by name, tags, category (aliases resolve to current names)
  show <name> [--size 24] [--stroke 2] [--color currentColor] [--class foo]   full <svg>
  paths <name>                     only the inner elements (to paste inside your own <svg viewBox="0 0 24 24">)
  sprite <name...> [--stroke 2]    <svg> with <symbol id="i-name"> per icon; use <svg><use href="#i-name"/></svg>
  categories | category <name>"""
import json,os,sys,re
D=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','icons.json')))
I,AL=D['icons'],D['aliases']
def res(n):
    n=n.lower().strip()
    if n in I: return n
    if n in AL: return AL[n]
    sys.exit(f'no icon "{n}". Try: search {n}')
def opt(a,k,d):
    return a[a.index(k)+1] if k in a else d
def svg(n,size='24',stroke='2',color='currentColor',cls=''):
    c=f' class="{cls}"' if cls else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round"{c}>{I[n]["i"]}</svg>'
def search(words,n):
    ws=[w.lower() for w in words];out=[]
    rev={}
    for a,t in AL.items(): rev.setdefault(t,[]).append(a)
    for k,v in I.items():
        sc=0
        for w in ws:
            if k==w: sc+=100
            elif k.startswith(w) or k.endswith('-'+w) or ('-'+w+'-') in ('-'+k+'-'): sc+=40
            elif w in k: sc+=20
            if w in [t.lower() for t in v['t']]: sc+=30
            elif any(w in t.lower() for t in v['t']): sc+=10
            if any(w in c for c in v['c']): sc+=8
            if any(w in a for a in rev.get(k,[])): sc+=15
        if sc: out.append((-sc,k))
    out.sort()
    for s,k in out[:n]: print(f'{k:<32} [{", ".join(I[k]["c"][:3])}]  {", ".join(I[k]["t"][:6])}')
    if not out: print('no match')
if __name__=='__main__':
    a=sys.argv[1:]
    if not a: print(__doc__);sys.exit()
    c=a[0]
    if c=='search':
        n=int(opt(a,'-n',15));w=[x for i,x in enumerate(a[1:],1) if x!='-n' and a[i-1]!='-n'];search(w,n)
    elif c=='show': n=res(a[1]);print(svg(n,opt(a,'--size','24'),opt(a,'--stroke','2'),opt(a,'--color','currentColor'),opt(a,'--class','')))
    elif c=='paths': print(I[res(a[1])]['i'])
    elif c=='sprite':
        names=[res(x) for x in a[1:] if not x.startswith('--') and a[a.index(x)-1]!='--stroke']
        st=opt(a,'--stroke','2')
        print('<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">'+''.join(f'<symbol id="i-{n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{st}" stroke-linecap="round" stroke-linejoin="round">{I[n]["i"]}</symbol>' for n in names)+'</svg>')
    elif c=='categories':
        cs={}
        for v in I.values():
            for x in v['c']: cs[x]=cs.get(x,0)+1
        print(', '.join(f'{k} ({n})' for k,n in sorted(cs.items())))
    elif c=='category': print('\n'.join(k for k,v in I.items() if a[1] in v['c']))
    else: print(__doc__)
