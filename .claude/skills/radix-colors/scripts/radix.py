#!/usr/bin/env python3
"""Radix Colors helper: list/show scales, emit CSS variables, check contrast, map a hex to the nearest Radix step.
Usage: python3 radix.py <command> [args]   (stdlib only; data in ../data/colors.json)"""
import json,os,sys,math
D=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','colors.json')))
STEP=['App background','Subtle background','UI element background','Hovered UI element background','Active / selected UI element background','Subtle borders and separators','UI element border and focus rings','Hovered UI element border','Solid background','Hovered solid background','Low-contrast text','High-contrast text']
GROUPS={'Grays':['gray','mauve','slate','sage','olive','sand'],'Colors':['tomato','red','ruby','crimson','pink','plum','purple','violet','iris','indigo','blue','cyan','teal','jade','green','grass','bronze','gold','brown','orange'],'Bright (use dark text on step 9)':['sky','mint','lime','yellow','amber']}
def fam(n): return n in D and (n+'Dark') in D
def rgb(h):
    h=h.lstrip('#');h=h[:6];return tuple(int(h[i:i+2],16) for i in (0,2,4))
def lin(c):
    c/=255;return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def lum(h): r,g,b=map(lin,rgb(h));return .2126*r+.7152*g+.0722*b
def ratio(a,b):
    la,lb=lum(a),lum(b);hi,lo=max(la,lb),min(la,lb);return (hi+.05)/(lo+.05)
def lab(h):
    r,g,b=map(lin,rgb(h));x=(.4124*r+.3576*g+.1805*b)/.95047;y=.2126*r+.7152*g+.0722*b;z=(.0193*r+.1192*g+.9505*b)/1.08883
    f=lambda t:t**(1/3) if t>.008856 else 7.787*t+16/116
    fx,fy,fz=f(x),f(y),f(z);return (116*fy-16,500*(fx-fy),200*(fy-fz))
def dist(a,b): return math.dist(lab(a),lab(b))
def verdict(r): return 'AAA' if r>=7 else 'AA' if r>=4.5 else 'AA large only' if r>=3 else 'fail'
def cmd_list():
    for g,ns in GROUPS.items(): print(g+': '+', '.join(ns))
    print('Also: blackA, whiteA (12 alpha steps). Suffixes: <name>Dark, <name>A (alpha), <name>P3 (display-p3).')
def cmd_show(n,dark=False):
    k=n+('Dark' if dark else '')
    if k not in D: sys.exit('unknown scale: '+k+'  (try: list)')
    print(('dark' if dark else 'light'),n)
    for i,h in enumerate(D[k],1): print(f'{n}-{i:<2} {h}  {STEP[i-1]}')
def css(names,mode):
    def block(dark):
        return '\n'.join(f'  --{n}-{i}: {D[n+("Dark" if dark else "")][i-1]};' for n in names for i in range(1,13))
    for n in names:
        if not fam(n): sys.exit('unknown family: '+n)
    if mode=='simple':
        print(':root, .light {\n'+block(False)+'\n}\n.dark {\n'+block(True)+'\n}')
    else:  # matches the Artifact theme contract: system + explicit data-theme
        print(':root {\n'+block(False)+'\n}\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n'+block(True).replace('\n  ','\n    ').replace('  --','    --',1)+'\n    color-scheme: dark;\n  }\n}\n:root[data-theme="dark"] {\n'+block(True)+'\n  color-scheme: dark;\n}')
def cmd_contrast(a,b):
    r=ratio(a,b);print(f'{a} on {b}: {r:.2f}:1  -> {verdict(r)} (normal text needs 4.5, large text and UI parts 3)')
def cmd_nearest(h,top=5):
    res=sorted(((dist(h,v),k,i+1,v) for k,vs in D.items() if not k.endswith(('A','P3','P3A')) and k not in('blackA','whiteA') for i,v in enumerate(vs)))
    print('nearest Radix steps to '+h+' (lower dE = closer)')
    for d,k,i,v in res[:top]: print(f'  {k}-{i}  {v}  dE={d:.1f}  {STEP[i-1]}')
def cmd_audit(n):
    if not fam(n): sys.exit('unknown family: '+n)
    for dark in (False,True):
        s=D[n+('Dark' if dark else '')];print('dark' if dark else 'light',n)
        rows=[('step 12 text on step 1',s[11],s[0]),('step 12 text on step 3',s[11],s[2]),('step 11 text on step 1',s[10],s[0]),('step 11 text on step 3',s[10],s[2]),('white on step 9',"#ffffff",s[8]),('step 12 on step 9 (bright scales)',s[11],s[8]),('step 9 solid on step 1 (UI part)',s[8],s[0])]
        for t,f,b in rows:
            r=ratio(f,b);print(f'  {t:<36}{r:5.2f}  {verdict(r)}')
if __name__=='__main__':
    a=sys.argv[1:]
    if not a: print(__doc__);sys.exit()
    c=a[0]
    if c=='list': cmd_list()
    elif c=='show': cmd_show(a[1],'--dark' in a)
    elif c=='css': cmd_css=css([x for x in a[1:] if not x.startswith('--')],'simple' if '--simple' in a else 'app')
    elif c=='contrast': cmd_contrast(a[1],a[2])
    elif c=='nearest': cmd_nearest(a[1])
    elif c=='audit': cmd_audit(a[1])
    else: print(__doc__)
