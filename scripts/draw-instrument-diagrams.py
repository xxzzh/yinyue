"""Render original SVG teaching diagrams for entries without a verified reusable photo.

These extend the site's native vector illustration system. They identify major
parts only, not exact dimensions, fingerings, string counts or playing posture.
Factual references are listed in docs/instrument-images.md and in each course.
"""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'instruments'
OUT.mkdir(parents=True, exist_ok=True)
WOOD = '#966345'
LIGHT = '#d4ae79'
DARK = '#4e4c38'
GOLD = '#b29351'

def path(d, fill=WOOD, stroke=DARK, width=2):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"/>'

def rect(x,y,w,h,fill=WOOD,rx=3):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{DARK}" stroke-width="1.5"/>'

def ellipse(x,y,rx,ry,fill=LIGHT):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{DARK}" stroke-width="1.5"/>'

def line(x,y,a,b,color=DARK,width=2):
    return path(f'M{x} {y}L{a} {b}', 'none', color, width)

def label(text,x,y,a,b):
    return line(x+6,y-5,a,b,'#84917b',1)+f'<text x="{x}" y="{y}" fill="#4f6349" font-size="14" font-family="sans-serif">{escape(text)}</text>'

def bow(x1,y1,x2,y2):
    return path(f'M{x1} {y1} Q{(x1+x2)/2+15} {(y1+y2)/2-20} {x2} {y2}', 'none', WOOD,5)+line(x1,y1+7,x2,y2+7,'#e1ca9a',2)

art={}
art['dongpipa']=(
    path('M283 50L302 50L300 180C299 218 340 223 349 264C362 320 324 339 290 339C246 339 222 314 232 273C240 238 279 213 281 180Z',LIGHT)
    +rect(279,48,25,147)+''.join(rect(268 if i%2 else 302,60+i*17,18,7,DARK) for i in range(4))
    +''.join(line(285+i*4,52,280+i*7,312,'#ede5cc',1.4) for i in range(4))+rect(269,308,46,6,DARK)
    +ellipse(291,255,12,12,DARK)+label('琴颈',387,111,299,130)+label('琴箱',392,266,337,281)+label('弦',147,201,287,211))
art['satar']=(
    path('M282 48L297 48L301 222C309 246 328 262 331 286C335 321 308 340 284 339C250 339 229 316 237 287C241 264 273 246 280 223Z',LIGHT)
    +rect(278,45,23,186)+''.join(rect(302,67+i*13,15,5,DARK) for i in range(9))
    +''.join(line(283+i*2,52,269+i*5,316,'#ece5c9',1) for i in range(7))+rect(267,307,43,5,DARK)
    +bow(157,269,418,238)+label('长琴颈',383,126,296,153)+label('共鸣弦（简化）',366,204,291,223)+label('弓',104,239,207,257))
art['niutuiqin']=(
    path('M275 45L294 45L292 152C308 178 329 216 330 263C332 297 311 334 278 334C251 334 243 303 250 275L263 219L272 154Z',LIGHT)
    +rect(262,59,48,7,DARK)+rect(260,83,47,7,DARK)+path('M275 169Q306 214 308 264Q309 303 279 312Q265 292 274 255Z','#bb8257')
    +line(280,48,277,315,'#f4edce',2)+line(285,48,284,315,'#f4edce',2)+bow(139,234,421,258)
    +label('一体琴身',380,300,307,283)+label('两根弦',373,148,283,174)+label('弓',113,211,198,239))
art['yazheng']=(
    path('M91 190L440 131L486 229L115 289Z',WOOD)+path('M91 180L440 121L486 215L115 275Z',LIGHT)
    +''.join(line(101+i*3,191+i*11,450+i*3,135+i*10,'#f4e8b7',1.5) for i in range(7))
    +''.join(path(f'M{180+i*32} {223-i*5}l8 -20l10 17Z',DARK) for i in range(7))
    +bow(244,72,305,306)+label('筝形琴箱',366,323,389,236)+label('擦具',110,86,259,122)+label('弦与琴码',354,84,344,176))
art['hulusheng']=(
    path('M246 261C209 250 215 217 234 206C251 196 246 184 251 173C260 151 289 153 297 177C302 191 294 202 312 214C344 235 321 276 286 279Z',LIGHT)
    +path('M254 173Q216 161 195 138Q184 129 181 140Q201 177 245 193Z',WOOD)
    +''.join(rect(249+i*13,67+abs(2-i)*18,11,165-abs(2-i)*18,'#a7a36d') for i in range(5))
    +''.join(ellipse(254+i*13,67+abs(2-i)*18,5,2,DARK) for i in range(5))
    +label('簧管',386,104,298,131)+label('葫芦气箱',374,275,306,251)+label('吹口',107,125,184,142))
art['mangtong']=(
    rect(267,67,67,262,'#aca26a',5)+ellipse(300,67,33,12,DARK)
    +''.join(path(f'M269 {y}Q299 {y+6} 332 {y}', 'none','#7d8058',3) for y in [123,193,264])
    +path('M270 173L241 158L241 112', 'none',LIGHT,12)+ellipse(240,110,6,3,DARK)
    +label('粗竹共鸣筒',385,229,327,220)+label('细簧管',121,111,239,143)+label('地面支撑',381,325,331,326))
art['qiangdi']=(
    ''.join(rect(x,70,18,255,LIGHT,6)+rect(x+4,48,10,27,'#bfa676',2)+''.join(ellipse(x+9,y,3,4,DARK) for y in [167,190,212,244,267,290]) for x in [266,288])
    +''.join(rect(263,y,46,7,'#7c6151',1) for y in [111,306])
    +label('并列双管',367,243,296,225)+label('簧哨',359,73,299,61)+label('指孔示意',114,258,274,249))
art['dongdi']=(
    rect(276,65,28,262,LIGHT,8)+rect(275,81,30,22,'#ab825d',3)
    +path('M280 105L299 105L299 118L285 123Z',DARK)
    +''.join(ellipse(291,y,4,5,DARK) for y in [172,196,220,247,271,296])
    +line(278,156,302,156,'#886f43',3)+line(278,313,302,313,'#886f43',3)
    +label('吹口结构示意',357,101,299,109)+label('竹管',374,266,303,244)+label('指孔示意',112,207,288,220))
art['balaman']=(
    rect(276,100,29,225,LIGHT,4)+path('M281 104L277 69Q290 55 304 69L300 104Z','#c8ad6f')
    +rect(273,102,35,8,'#8d6651',2)+''.join(ellipse(290,y,4,5,DARK) for y in [140,165,190,215,240,265,290])
    +label('芦制哨片',365,76,302,78)+label('管体',365,290,302,282)+label('指孔示意',103,205,290,214))
art['luo']=(
    ellipse(274,190,122,122,GOLD)+ellipse(274,190,108,108,'#c5a563')+ellipse(274,190,36,36,'#a88b4b')
    +path('M247 76Q274 37 302 76','none',WOOD,4)+line(393,289,453,160,WOOD,8)+ellipse(457,150,19,20,'#897552')
    +label('锣面',92,274,200,231)+label('锣槌',390,329,414,247))
art['bo']=(
    ellipse(218,195,100,90,GOLD)+ellipse(395,211,92,84,'#c0a56c')+ellipse(218,195,32,30,'#af8c42')+ellipse(395,211,30,29,'#af8c42')
    +path('M212 190C176 134 240 135 225 193','none','#ae5844',7)+path('M390 204C353 147 421 147 403 208','none','#ae5844',7)
    +label('中心隆起',66,80,197,168)+label('系带',404,93,403,176)+label('两面相击',255,333,301,229))
art['paigu']=''
for i,(x,y,r) in enumerate([(118,198,38),(213,181,44),(323,161,49),(443,143,56)]):
    art['paigu']+=line(x,y+70,x,319,'#6b6c61',5)+line(x,y+95,x-22,331,'#6b6c61',3)+line(x,y+95,x+22,331,'#6b6c61',3)
    art['paigu']+=path(f'M{x-r} {y}L{x-r+5} {y+66}Q{x} {y+86} {x+r-5} {y+66}L{x+r} {y}Z','#a55b42')+ellipse(x,y,r,20,'#e5d5a7')
art['paigu']+=label('不同大小的鼓（组合示意）',110,68,326,143)
art['dap']=(
    ellipse(224,192,108,111,WOOD)+ellipse(220,187,95,99,'#e2ce9e')+ellipse(415,208,77,88,WOOD)+ellipse(415,206,64,75,'#e6d4b1')
    +''.join(ellipse(365+(i%2)*100,169+(i//2)*29,8,10,'none') for i in range(6))
    +label('鼓皮 · 正面',99,58,195,100)+label('内框金属环',355,78,369,170))
art['pengling']=(
    path('M175 166Q188 101 218 165L246 247Q200 271 154 247Z',GOLD)+ellipse(200,248,46,15,'#695e3f')
    +path('M359 166Q372 101 402 165L430 247Q384 271 338 247Z',GOLD)+ellipse(384,248,46,15,'#695e3f')
    +path('M196 139C207 50 372 53 382 138','none','#ac624d',4)+label('绳',284,42,291,80)+label('成对小铃',246,324,341,235))
art['nagra']=(
    path('M121 166Q120 300 215 300Q300 299 301 166Z','#a68c61')+ellipse(211,167,90,31,'#e8d8b3')
    +path('M345 197Q344 294 408 294Q469 295 472 197Z','#b49a6b')+ellipse(408,197,64,25,'#e8d8b3')
    +''.join(line(x,194,x+8,260,'#6c6148',2) for x in [140,168,200,237,270])
    +line(203,65,330,155,WOOD,6)+line(423,71,368,161,WOOD,6)+label('蒙皮鼓面',72,91,181,167)+label('金属鼓腔',258,335,272,265))
art['bolanggu']=(
    rect(279,223,20,110,LIGHT,6)+ellipse(289,167,74,78,WOOD)+ellipse(286,164,66,69,'#e6ca9b')
    +path('M213 166Q183 228 143 194','none','#a75b41',3)+ellipse(135,190,11,11,WOOD)
    +path('M363 166Q404 101 445 133','none','#a75b41',3)+ellipse(452,137,11,11,WOOD)
    +ellipse(286,164,30,32,'#b7674a')+label('两侧小槌',385,74,449,132)+label('鼓柄',366,320,300,296)+label('鼓面',108,93,248,145))
art['yugu']=(
    path('M265 78L312 78L312 320Q288 330 265 320Z',LIGHT)+ellipse(289,78,24,10,'#dbcba1')
    +''.join(line(267,y,310,y,'#89734d',3) for y in [133,215,296])
    +label('一端蒙皮',368,85,308,78)+label('长竹筒',366,247,310,233))
art['mugu']=(
    path('M119 174Q267 138 456 140L468 229Q292 275 135 267Z',WOOD)+ellipse(128,219,40,49,LIGHT)+ellipse(464,183,23,43,'#bc8d5b')
    +path('M178 172Q301 145 413 148L417 163Q308 174 185 191Z',DARK)
    +path('M175 207Q295 176 428 181M187 234Q321 206 434 210','none','#b58b5f',2)
    +line(263,71,333,164,WOOD,8)+label('槽口',108,72,221,177)+label('中空木体',374,322,370,233))

for name, body in art.items():
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380"><title>{escape(name)} · 外形结构示意</title><rect width="600" height="380" fill="#f3f0e8"/>{body}<text x="300" y="366" text-anchor="middle" fill="#8b927a" font-family="sans-serif" font-size="11">结构示意 · 不作为尺寸、指法或制器依据</text></svg>'
    (OUT/f'{name}.svg').write_text(svg,encoding='utf8')
print(f'Rendered {len(art)} original SVG diagrams.')
