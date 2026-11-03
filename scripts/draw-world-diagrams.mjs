// Original native SVG illustrations. Shared geometry follows instrument families;
// individual silhouettes distinguish the structures discussed in each course.
import { readFileSync, writeFileSync } from 'node:fs';
import { worldCatalog } from '../src/world-catalog.ts';

const out = new URL('../public/instruments/', import.meta.url);
const wood = '#aa7853', pale = '#dfbd86', dark = '#48584c', metal = '#b8c8bd', gold = '#ccac61';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]);
const path = (d, fill = wood, stroke = dark, width = 2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const line = (x,y,a,b,color=dark,width=2) => path(`M${x} ${y}L${a} ${b}`,'none',color,width);
const rect = (x,y,w,h,fill=wood,rx=4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}" stroke="${dark}" stroke-width="1.5"/>`;
const ellipse = (x,y,rx,ry,fill=pale) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${dark}" stroke-width="1.5"/>`;
const circle = (x,y,r,fill=pale) => ellipse(x,y,r,r,fill);
const label = (text,x,y,a,b) => line(x,y-6,a,b,'#92a28e',1)+`<text x="${x}" y="${y}" font-family="sans-serif" font-size="13" fill="#52684d">${esc(text)}</text>`;
const repeat = (n, fn) => Array.from({length:n},(_,i)=>fn(i)).join('');
const strings = (n,x,y,len,gap=5) => repeat(n,i=>line(x+i*gap,y,x+i*gap,y+len,'#f9e9c9',1));
const keys = (x,y,w=210,h=65) => rect(x,y,w,h,'#f7f0df')+repeat(14,i=>line(x+i*w/14,y,x+i*w/14,y+h,'#a1a698',1))+[0,1,3,4,5,7,8,10,11,12].map(i=>rect(x+(i+.7)*w/14,y,w/24,h*.6,dark,1)).join('');
const shapes = {};

function fiddle(large=false,bass=false) {
  return path('M269 105C226 94 216 128 244 150C214 171 219 188 238 196C204 231 222 286 286 284C348 286 368 233 334 196C355 183 355 165 329 150C353 126 341 96 304 105Z',pale)
    +rect(278,49,20,174,dark)+circle(288,38,13,wood)+strings(4,280,51,201,4)
    +path('M252 183q-15 14-2 28m70-28q15 14 2 28','none',wood,3)+rect(271,232,33,7,pale)
    +line(372,68,372,288,wood,5)+line(378,68,378,288,'#e4d4ac',2)
    +(large ? line(288,285,288,323,dark,5) : '')
    +label(large?'尾柱':'琴箱',101,285,large?288:242,large?316:248)+label(bass?'大型琴体':'琴弓',412,169,large?333:377,large?240:170);
}
shapes.violin=fiddle();shapes.cello=fiddle(true);shapes.doublebass=fiddle(true,true);
shapes.harp=path('M181 290L238 75Q304 34 396 99L365 302Z',pale)+path('M191 290L244 92Q307 60 378 107L351 284Z','#f3f0e8')
  +repeat(16,i=>line(245+i*8,91+(i/15)**2*17,201+i*9,285,'#af9764',1.3))+label('琴柱',85,153,217,163)+label('弦列',418,189,322,174);
function lute(kind) {
  const tri=kind==='balalaika', square=kind==='shamisen', round=kind==='banjo';
  return (tri ? path('M284 170L183 291L393 291Z',pale) : square ? rect(224,190,132,103,pale,12) : round ? circle(290,241,66,'#efe7d7') : path('M269 177C220 189 198 269 243 292Q291 323 338 289C377 246 334 181 303 176Z',pale))
    +rect(278,48,24,178,dark)+rect(274,30,32,36,wood)+strings(square||tri?3:round?5:8,281,40,235,2.5)
    +(!square&&!tri&&!round ? circle(289,225,18,dark) : '')
    +rect(270,273,42,7,wood)+(!square ? repeat(8,i=>line(279,78+i*12,301,78+i*12,'#bdb897',1)) : '')
    +label(round?'蒙皮琴面':'共鸣箱',74,237,223,243)+label('琴颈',405,104,301,117);
}
for(const kind of ['mandolin','banjo','oud','shamisen','sitar','baglama','charango','balalaika']) shapes[kind]=lute(kind);
// Replace generic lute details where they would misrepresent the instrument.
shapes.oud=path('M247 155Q181 227 224 280Q293 328 356 275Q390 220 321 155Z',pale)+rect(270,104,34,82,wood)
  +path('M271 107L251 54L280 45L307 104Z',wood)+strings(10,272,110,161,3)+circle(286,218,22,dark)+rect(263,270,61,8,wood)
  +label('无品短颈',93,94,272,147)+label('梨形琴箱',411,256,355,248);
shapes.sitar=lute('sitar')+repeat(9,i=>circle(312,81+i*12,5,wood))+label('共鸣弦与弦轴',383,94,317,113);
shapes.kora=ellipse(289,248,86,66,wood)+ellipse(289,234,85,54,'#dbc99f')+rect(282,31,14,215,dark)
  +path('M288 205L256 249L315 249Z',pale)+repeat(10,i=>line(289,51+i*14,249,246,'#e5d8b4',1))+repeat(11,i=>line(289,52+i*13,325,246,'#e5d8b4',1))
  +line(232,266,223,157,wood,9)+line(345,266,354,157,wood,9)+label('葫芦共鸣体',78,298,218,270)+label('双侧弦列',405,102,316,153);
shapes.zither=path('M114 128Q298 105 478 128L462 255Q281 278 103 249Z',pale)
  +repeat(13,i=>line(118,132+i*8,465,133+i*8,'#f4e5c3',1.3))+repeat(13,i=>path(`M${229+i*3} ${131+i*8}l7-9 7 10Z`,wood))
  +label('弦列',87,76,173,154)+label('活动琴码',382,303,268,215);
shapes.berimbau=path('M204 50Q378 177 209 315','none',wood,10)+line(206,50,210,315,'#8c9186',2)+ellipse(228,232,45,40,pale)
  +line(371,108,348,258,wood,5)+label('单弦',92,133,207,152)+label('葫芦共鸣体',360,304,245,258);
shapes.accordion=rect(150,114,89,162,'#5b7867')+rect(238,120,111,151,'#b88b73')+rect(348,113,91,164,'#5b7867')
  +repeat(12,i=>line(241+i*9,122,241+i*9,269,'#edd9b7',3))+keys(365,127,57,131)+repeat(12,i=>circle(170+(i%3)*20,140+Math.floor(i/3)*31,4,'#ebdfc7'))
  +label('风箱',251,79,291,124)+label('右手键盘',421,309,403,249);
shapes.organ=repeat(11,i=>rect(149+i*27,52+Math.abs(5-i)*15,21,209-Math.abs(5-i)*15,metal,8))+rect(178,256,236,57,wood)+keys(192,267,206,34)
  +label('音管',97,91,151,160)+label('演奏台',420,314,383,281);
function keyboard(kind) {
  return rect(137,139,321,119,kind==='celesta'?wood:'#506d61')+keys(153,180,287,65)
    +(kind==='melodica'?path('M140 170Q85 160 104 97Q114 74 138 90','none',dark,12):'')
    +(kind==='synthesizer'?repeat(7,i=>circle(181+i*35,159,7,pale))+rect(371,148,63,22,'#b6c5ab'):'')
    +(kind==='celesta'?repeat(8,i=>rect(173+i*32,118,23,40,metal)):'')
    +label(kind==='melodica'?'吹管':kind==='celesta'?'金属音板':'音色控制',90,91,kind==='melodica'?102:260,kind==='melodica'?121:149)
    +label('键盘',423,302,382,218);
}
for(const kind of ['celesta','melodica','synthesizer']) shapes[kind]=keyboard(kind);
function tube(kind) {
  const wide=kind==='bassoon', reed=['clarinet','oboe','duduk','bassoon'].includes(kind), edge=['ney','shakuhachi'].includes(kind);
  let s=rect(277,wide?87:70,wide?49:25,wide?219:236,kind==='flute'?metal:wood,wide?10:4);
  s+=repeat(7,i=>circle(wide?299:289,112+i*24,kind==='flute'?7:4,kind==='flute'?pale:dark));
  if(reed) s+=kind==='bassoon'?path('M286 89Q262 71 275 51L260 42','none',metal,6)+path('M253 31L266 35L261 47L249 43Z',pale):path(kind==='clarinet'?'M277 70L281 36L299 36L301 70Z':'M279 70L277 34Q289 26 302 34L299 70Z',kind==='clarinet'?dark:pale);
  if(kind==='clarinet'||kind==='oboe') s+=path('M277 282L262 312Q288 324 314 312L302 282Z',wood);
  if(kind==='recorder') s+=path('M277 70L277 35L300 35L302 70Z',pale)+rect(281,68,16,10,dark);
  if(kind==='flute') s+=ellipse(289,86,9,5,dark)+repeat(6,i=>line(302,122+i*25,314,122+i*25,metal,4));
  if(edge) s+=path('M277 70L283 61L300 70Z',dark);
  return s+label(reed?'簧片与吹口':edge?'管端吹边':'吹口',88,66,281,53)+label('管体与音孔',388,219,300,204);
}
for(const kind of ['flute','recorder','clarinet','oboe','bassoon','shakuhachi','ney','duduk']) shapes[kind]=tube(kind);
shapes.trumpet=path('M142 158H349L398 113V229L349 185H166Q131 185 131 220Q131 244 169 244H337','none',gold,18)
  +repeat(3,i=>rect(232+i*30,134,15,66,gold))+repeat(3,i=>line(239+i*30,108,239+i*30,137,dark,4))
  +ellipse(400,171,17,59,'#b28b4b')+rect(105,147,32,20,metal)+label('阀键',177,73,266,113)+label('喇叭口',425,294,403,204);
shapes.trombone=path('M133 132H426Q477 131 477 176Q477 221 426 221H157','none',gold,14)+path('M160 170H329L375 125V248L329 200H160','none',gold,15)
  +label('伸缩滑管',364,297,437,219)+label('吹嘴',91,81,136,132);
shapes.horn=path('M283 103C159 72 167 263 296 264C398 264 420 139 344 109C277 82 215 129 229 198C240 248 319 245 332 197','none',gold,16)
  +path('M322 190L415 174L428 256L344 220Z',gold)+ellipse(424,215,17,44,'#a68041')+path('M281 103L304 66L332 59','none',gold,9)
  +repeat(3,i=>rect(268+i*19,137,10,47,gold))+label('盘曲管路',83,280,201,209)+label('喇叭口',414,102,421,188);
shapes.tuba=path('M227 116V255Q227 307 295 307Q367 307 367 254V144M267 145V251Q267 273 298 273Q327 273 327 246V142','none',gold,24)
  +path('M326 145L304 64Q353 104 406 64L373 149Z',gold)+ellipse(356,65,52,15,'#9d783a')+path('M230 162L193 115L163 115','none',gold,10)
  +repeat(3,i=>rect(262+i*24,151,15,62,gold))+label('吹嘴',85,94,166,115)+label('宽喇叭口',413,62,394,70);
shapes.harmonica=path('M125 147L431 129L459 206L143 229Z',metal)+path('M140 176L440 160L449 202L148 219Z',dark)
  +repeat(10,i=>rect(151+i*29,181-i*1.7,22,29,'#b9ad8a',1))+label('音孔',110,282,195,195)+label('簧片在机身内',373,90,351,151);
shapes.ocarina=path('M204 156Q242 100 331 130L373 86L402 108L370 161Q398 221 337 255Q237 288 190 238Q155 198 204 156Z',pale)
  +repeat(6,i=>circle(233+(i%3)*38,171+Math.floor(i/3)*40,8,dark))+label('导气道吹嘴',387,59,379,110)+label('指孔',107,281,233,212);
shapes.bagpipes=ellipse(279,218,89,62,'#657f6b')+line(259,164,202,62,wood,14)+line(281,162,297,44,wood,14)+line(307,167,356,70,wood,14)
  +line(227,242,174,304,wood,13)+repeat(5,i=>circle(217-i*8,255+i*10,3,pale))+path('M349 216L409 168','none',wood,12)
  +label('气囊',410,272,343,236)+label('持续音管',82,73,207,78)+label('旋律管',72,323,187,285);
shapes.panpipe=repeat(12,i=>rect(135+i*26,98,21,90+i*10,pale,7))+line(135,130,440,130,wood,9)+line(135,153,440,153,wood,7)
  +label('不同长度的管',114,61,286,103)+label('管口',409,69,430,100);
shapes.kalimba=rect(199,116,204,193,pale,18)+circle(301,234,35,dark)+rect(213,140,177,14,wood)
  +repeat(13,i=>rect(223+i*13,149,9,66+(6-Math.abs(6-i))*8,metal,2))+label('金属簧舌',83,97,239,190)+label('共鸣箱',417,277,387,274);
shapes.handpan=ellipse(299,217,154,83,'#a4b2a4')+ellipse(299,194,152,81,metal)+ellipse(298,186,32,22,'#859589')
  +repeat(8,i=>{const a=i*Math.PI/4;return ellipse(299+103*Math.cos(a),191+49*Math.sin(a),22,14,'#91a294');})
  +label('中央音区',87,85,285,175)+label('调音区域',417,302,391,211);
function bars(kind) {
  return repeat(12,i=>rect(120+i*29,135+i*3,26,113-i*5,kind==='vibraphone'?metal:pale))
    +repeat(12,i=>rect(128+i*29,249-i*2,11,58-i*3,kind==='vibraphone'?metal:gold,2))
    +line(137,300,126,327,dark,4)+line(441,278,451,327,dark,4)+line(143,88,245,141,wood,4)+circle(246,141,10,'#d5d0bc')
    +label(kind==='vibraphone'?'金属音条':'木质音条',81,72,166,165)+label('共鸣管',396,96,414,263);
}
for(const kind of ['marimba','xylophone','vibraphone']) shapes[kind]=bars(kind);
shapes.timpani=path('M181 150Q183 283 300 292Q412 281 418 150Z',gold)+ellipse(300,148,120,44,'#eee7d4')
  +line(244,282,226,324,dark,5)+line(355,282,376,324,dark,5)+rect(280,313,58,12,dark)+line(198,73,273,139,wood,5)+circle(276,140,12,'#efdfbb')
  +label('锅形共鸣腔',75,265,196,216)+label('鼓皮',421,89,350,139);
shapes.cajon=path('M224 105L347 85L407 126L407 296L281 318L224 271Z',wood)+path('M281 147L407 126V296L281 318Z',pale)
  +line(224,105,281,147,dark,2)+circle(252,216,19,dark)+label('击奏面板',410,81,354,208)+label('箱体',109,295,244,262);
function drum(kind) {
  if(kind==='tabla'||kind==='bongo') return [0,1].map(i=>path(`M${174+i*130} 148L${181+i*130} 277Q${223+i*130} 307 ${270+i*130} 277L${278+i*130} 148Z`,i?wood:pale)+ellipse(226+i*130,148,53,24,'#ede4cb')+(kind==='tabla'?ellipse(226+i*130,147,20,11,dark):'')).join('')+label('成对鼓体',93,84,208,170);
  if(kind==='taiko') return rect(188,133,218,123,wood,40)+ellipse(192,194,42,62,'#e4cfa5')+ellipse(405,194,28,61,pale)+line(200,258,184,316,dark,8)+line(390,252,410,316,dark,8)+label('鼓皮',74,119,187,165)+label('鼓体与支架',408,309,379,250);
  return path(kind==='djembe'?'M225 125Q216 182 266 215L237 293Q289 317 345 293L316 215Q365 182 357 125Z':'M228 124Q205 213 258 301Q288 315 325 301Q376 210 350 124Z',wood)
    +ellipse(291,124,66,27,'#e8dbbb')+repeat(8,i=>line(231+i*17,137,kind==='djembe'?264+i*7:258+i*8,290,pale,1.5))
    +label('鼓皮',109,74,253,117)+label(kind==='djembe'?'杯形鼓体':'桶形鼓体',406,277,335,231);
}
for(const kind of ['djembe','conga','bongo','tabla','taiko']) shapes[kind]=drum(kind);
shapes.steelpan=path('M151 176L165 256Q300 304 434 256L449 176Z',metal)+ellipse(300,170,149,74,'#97b0a1')+ellipse(300,174,124,55,'#c5d3c5')
  +repeat(8,i=>{const a=i*Math.PI/4;return ellipse(300+84*Math.cos(a),174+35*Math.sin(a),23,13,'#b2c3b3');})
  +line(201,267,186,323,dark,5)+line(399,267,412,323,dark,5)+label('金属调音区',87,86,234,152)+label('盘体',425,306,418,249);
shapes.angklung=rect(190,77,215,16,pale)+rect(195,75,15,236,pale)+rect(388,75,15,236,pale)+rect(184,297,229,16,pale)
  +rect(232,111,43,166,pale)+rect(315,167,43,110,pale)+path('M233 112L253 112L253 212L232 212Z','#f3f0e8')
  +path('M316 167L336 167L336 239L316 239Z','#f3f0e8')+line(255,92,255,111,wood,2)+line(337,92,337,167,wood,2)
  +label('悬挂竹管',77,148,247,232)+label('竹框',416,69,395,101);
shapes.gehu=path('M240 191Q284 165 348 190L362 277Q297 322 224 275Z',wood)+ellipse(239,233,38,45,pale)+rect(286,42,16,178,dark)
  +strings(4,287,48,220,3)+line(294,293,294,326,dark,4)+line(385,82,385,291,wood,5)+label('低音共鸣体',73,301,244,263)+label('琴弓',412,113,385,145);
shapes.jingerhu=rect(278,38,11,208,wood)+repeat(2,i=>line(280,57+i*27,322,57+i*27,wood,7))+path('M266 234L301 224L330 247L326 286L286 296L264 273Z',wood)
  +path('M265 236L284 246L285 291L264 273Z',pale)+strings(2,279,47,211,4)+line(201,262,385,262,wood,4)+label('琴筒',86,295,266,258)+label('琴杆与二弦',382,96,288,129);
shapes.chuzhu=path('M183 137L353 114L418 151L381 290L227 314Z',wood)+path('M183 137L353 114L418 151L248 183Z',pale)
  +path('M204 140L350 124L393 149L250 173Z',dark)+line(293,69,302,228,wood,11)+circle(302,228,15,pale)+label('中空木箱',84,294,226,244)+label('击具',384,69,297,111);
shapes.yuscraper=path('M174 220Q202 158 265 173L371 178Q411 150 440 182L460 227L416 245L395 271L229 271L210 244L170 246Z',pale)
  +repeat(15,i=>path(`M${242+i*9} 177l4-14 5 14Z`,wood))+circle(429,196,4,dark)+path('M438 211l17 8','none',wood,3)
  +line(224,271,224,290,wood,12)+line(387,270,387,289,wood,12)+line(201,100,334,158,wood,6)
  +label('虎形木体',78,305,232,233)+label('齿背',371,85,321,166);

// v0.5 expansion: individual silhouettes rather than treating regional relatives
// as interchangeable. The geometry is explanatory, not a construction plan.
function guitarBody(electric=false) {
  const body=electric ? path('M259 176C230 137 214 165 230 194C210 213 203 243 223 276Q274 314 336 286C364 266 351 223 323 202C321 177 347 145 329 138L305 180Z','#577564')
    : path('M268 168C241 150 215 172 232 200C208 211 195 247 217 276C245 316 327 314 350 275C373 242 353 214 330 201C350 174 325 149 302 169Z',pale);
  return body+rect(276,48,24,168,electric?'#a5845d':dark)+rect(272,25,32,36,wood)
    +(!electric ? circle(287,220,22,dark) : rect(266,218,43,10,'#d9decf')+rect(265,243,44,10,'#d9decf')+circle(332,260,6,gold)+circle(334,277,6,gold))
    +rect(262,277,50,8,wood)+strings(6,280,36,243,3)
    +repeat(9,i=>line(277,71+i*13,299,71+i*13,'#b8b9a3',1))
    +label(electric?'拾音器':'音孔',86,237,electric?272:270,221)+label('有品指板',394,98,300,135);
}
shapes.electricguitar=guitarBody(true);
shapes.classicalguitar=guitarBody();
shapes.harpsichord=path('M166 287L166 87L207 60Q255 75 294 136Q349 205 447 209L447 287Z',wood)
  +path('M181 260L181 94L207 78Q251 102 278 150Q333 220 431 222L431 260Z',pale)
  +repeat(14,i=>line(190+i*16,252,190+i*16,91+i*8,'#f7e5bd',1))+keys(176,265,259,48)
  +line(193,313,184,331,dark,5)+line(419,313,429,331,dark,5)
  +label('拨弦琴箱',70,117,190,156)+label('键盘',458,301,414,284);
shapes.clavichord=path('M129 147L438 130L468 171L154 193Z',pale)+path('M154 193L468 171V275L154 295Z',wood)
  +path('M129 147L154 193V295L129 257Z',wood)+repeat(10,i=>line(153,152+i*3.4,443,143+i*3.4,'#ad9267',1))
  +keys(168,217,282,61)+rect(229,183,45,8,metal,1)+line(252,191,252,217,metal,4)
  +label('弦列',76,92,227,163)+label('金属切线示意',365,95,253,185);

shapes.bassclarinet=path('M291 89V257Q292 292 331 278L340 247','none',dark,24)
  +path('M288 91Q264 70 279 49L302 49','none',metal,12)+path('M302 41L333 42L333 54L302 57Z',dark)
  +path('M327 255L320 230Q342 243 363 230L352 258Z',metal)+ellipse(341,230,22,8,metal)
  +repeat(8,i=>circle(287,105+i*20,6,metal))+line(313,290,313,321,dark,4)
  +label('单簧吹口',394,62,325,49)+label('上扬喇叭口',388,304,346,248)+label('长管与按键',86,176,283,167);
shapes.englishhorn=rect(278,89,25,182,wood)+path('M289 89Q264 73 276 54L288 43','none',metal,6)
  +path('M282 43L279 26Q288 22 297 26L294 44Z',pale)+repeat(8,i=>circle(291,104+i*21,5,metal))
  +path('M279 263C255 277 262 312 289 316C318 314 327 280 303 263Z',wood)
  +label('双簧与弯管',81,60,281,60)+label('梨形喇叭口',379,294,313,289);
shapes.contrabassoon=path('M240 84V268Q240 309 283 309Q319 309 319 268V94Q319 65 354 65Q389 65 389 99V274','none',wood,24)
  +path('M240 86L219 70Q205 57 221 44L236 34','none',metal,7)+path('M231 34L229 22L242 20L244 32Z',pale)
  +repeat(9,i=>circle(236,109+i*18,6,metal))+repeat(7,i=>line(320,117+i*22,339,117+i*22,metal,3))
  +line(283,313,283,330,dark,4)+label('多次折回的管路',63,174,239,182)+label('双簧与弯管',365,34,220,50);
shapes.euphonium=path('M229 110V247Q229 287 285 287Q341 287 341 242V133M265 142V239Q265 256 287 256Q311 256 311 238V145','none',gold,22)
  +path('M309 145L291 73Q329 104 371 73L344 146Z',gold)+ellipse(330,73,40,12,'#9d783a')
  +path('M233 156L210 126L176 126','none',gold,8)+repeat(3,i=>rect(264+i*20,144,12,61,gold))
  +label('向上喇叭口',385,53,357,85)+label('盘曲阀管',81,279,259,222);
shapes.cornet=path('M156 164H319L374 125V225L318 191H183Q151 191 151 225Q151 250 193 250H289Q330 250 330 215V187','none',gold,17)
  +repeat(3,i=>rect(228+i*27,137,13,66,gold))+repeat(3,i=>line(234+i*27,117,234+i*27,139,dark,4))
  +ellipse(376,175,14,51,'#aa8749')+rect(128,154,30,18,metal)+label('紧凑盘管',87,302,202,246)+label('三阀与喇叭口',375,77,305,162);
shapes.flugelhorn=path('M150 151H322L401 111V237L323 189H187Q143 189 143 236Q143 280 196 280H280Q328 280 328 229V184','none',gold,21)
  +repeat(3,i=>rect(226+i*27,133,14,73,gold))+repeat(3,i=>line(233+i*27,112,233+i*27,136,dark,4))
  +ellipse(403,174,16,64,'#b08b4c')+rect(118,140,31,21,metal)+label('较宽管路',87,307,178,268)+label('宽喇叭口',414,75,406,134);

shapes.glockenspiel=repeat(13,i=>rect(119+i*27,133+i*2,24,89-i*3,metal,2))
  +line(114,233,471,221,wood,8)+line(137,254,138,301,dark,4)+line(445,241,447,301,dark,4)
  +line(194,77,251,130,wood,4)+circle(253,132,8,dark)+line(345,72,302,127,wood,4)+circle(301,130,8,dark)
  +label('金属音条',81,74,168,163)+label('敲击槌',398,71,344,84);
shapes.snaredrum=rect(188,135,231,103,'#65806c',12)+ellipse(303,135,116,37,'#e6dfc9')+ellipse(303,237,116,30,metal)
  +repeat(8,i=>rect(199+i*29,151,6,70,metal,1))+repeat(7,i=>line(271+i*6,232,279+i*6,257,'#e5dfc7',1.5))
  +line(216,70,284,120,wood,5)+line(375,70,332,118,wood,5)+line(303,267,303,312,dark,4)
  +label('上鼓皮',82,100,228,123)+label('下皮与响弦',400,305,310,252);
shapes.bassdrum=circle(295,188,113,wood)+circle(295,188,104,'#ddcfac')+circle(295,188,93,'#efe7d3')
  +repeat(10,i=>{const a=i*Math.PI/5;return line(295+102*Math.cos(a),188+102*Math.sin(a),295+112*Math.cos(a),188+112*Math.sin(a),metal,5);})
  +path('M180 154L151 154V314H438V154H410','none',dark,8)+line(391,78,335,148,wood,6)+circle(333,150,15,'#ddd4ba')
  +label('大型鼓皮',75,70,227,142)+label('悬置鼓架',422,332,436,251);
shapes.cymbals=ellipse(237,183,96,75,gold)+ellipse(368,225,96,75,'#c19f58')+ellipse(237,183,29,23,'#e1c785')
  +ellipse(368,225,29,23,'#dfc285')+path('M218 177Q237 151 256 177M351 219Q368 194 387 219','none',wood,8)
  +label('成对金属盘',91,87,189,159)+label('持握皮带',406,100,368,216);
shapes.tambourine=ellipse(298,200,116,80,wood)+ellipse(298,188,116,74,pale)
  +repeat(8,i=>{const a=i*Math.PI/4;const x=298+104*Math.cos(a),y=194+66*Math.sin(a);return ellipse(x,y,13,9,metal)+ellipse(x,y+6,13,7,metal);})
  +ellipse(298,185,88,54,'#e9dfc4')+label('成对铃片',79,87,225,152)+label('框与鼓皮',402,310,345,229);
shapes.triangle=path('M281 87L171 282L421 282L324 114','none',metal,13)+line(280,85,270,48,wood,4)
  +line(356,171,423,130,metal,7)+label('悬吊处',121,51,276,71)+label('保留开口',399,79,326,117)+label('击棒',427,173,394,147);
shapes.castanets=path('M215 133C174 110 145 145 159 192C168 228 206 253 229 231C252 209 248 149 215 133Z',wood)
  +path('M236 145C209 119 188 145 198 183C206 215 233 236 252 218C270 198 263 158 236 145Z',pale)
  +path('M355 133C314 110 285 145 299 192C308 228 346 253 369 231C392 209 388 149 355 133Z',wood)
  +path('M376 145C349 119 328 145 338 183C346 215 373 236 392 218C410 198 403 158 376 145Z',pale)
  +path('M211 134Q221 72 239 142M351 134Q362 72 379 142','none',dark,3)
  +label('凹壳相击',80,292,207,210)+label('连接绳',408,71,365,112);
shapes.claves=line(195,111,362,279,wood,30)+line(381,110,232,275,pale,30)
  +line(199,112,366,276,'#d5b987',6)+line(381,111,235,273,'#ecd3a4',6)
  +label('成对响棒',79,77,220,138)+label('木体击点',403,275,285,209);
shapes.guiro=path('M231 102Q295 75 345 116L369 257Q349 302 283 298Q229 293 215 254Z',pale)
  +repeat(18,i=>path(`M${228+i*.5} ${129+i*7}Q286 ${113+i*7} ${349+i*.6} ${136+i*7}`,'none',wood,3))
  +line(404,103,369,234,wood,6)+label('刮奏沟槽',74,111,246,165)+label('刮棒',424,85,399,128);
shapes.cowbell=path('M249 107L327 105L390 277Q293 308 198 277Z',gold)+ellipse(294,275,96,26,dark)
  +ellipse(294,274,77,17,'#b28e4d')+rect(267,88,42,21,metal,4)+line(403,98,344,202,wood,9)
  +label('金属铃壳',79,110,239,177)+label('开口',412,313,364,282);
shapes.maracas=ellipse(226,149,54,70,pale)+ellipse(365,145,54,70,'#69836f')+rect(215,207,21,105,wood,10)+rect(354,204,21,109,wood,10)
  +path('M181 150Q225 181 271 150M319 145Q364 177 410 145','none',wood,3)
  +repeat(8,i=>circle(202+(i%3)*19,133+Math.floor(i/3)*22,3,wood))
  +label('空腔与内部颗粒',72,60,220,113)+label('握柄',418,301,366,272);
shapes.cabasa=rect(217,112,177,130,metal,28)+ellipse(217,177,29,65,wood)+ellipse(395,177,24,65,wood)
  +repeat(10,i=>repeat(9,j=>circle(236+j*16,123+i*11,4.5,'#d1d8ce')))
  +rect(292,239,24,83,wood,10)+label('环绕珠链',82,73,266,133)+label('握柄',396,316,305,284);
shapes.rainstick=path('M189 87L236 66L399 289L352 312Z',pale)+ellipse(211,77,25,12,wood)+ellipse(375,301,26,12,wood)
  +path('M231 111L247 137L280 143L292 173L327 185L342 216L371 229','none',wood,3)
  +repeat(16,i=>circle(238+(i%3)*17+i*6,114+i*9,2.5,wood))
  +label('长筒',82,69,212,122)+label('内部阻挡与颗粒示意',345,93,300,185);

shapes.sarod=path('M265 175Q211 192 214 254Q216 311 285 314Q353 309 358 258Q361 199 310 177Z',wood)
  +path('M272 181Q230 200 232 252Q233 295 285 298Q337 293 339 253Q340 207 303 183Z','#e8dac0')
  +rect(268,66,42,144,metal)+path('M268 66L262 34L315 34L311 66Z',wood)+strings(6,276,45,235,4)
  +repeat(8,i=>circle(322,84+i*15,5,wood))+rect(265,276,48,7,pale)
  +label('无品金属指板',70,84,279,132)+label('蒙皮共鸣箱',394,284,329,259);
shapes.sarangi=path('M248 75L322 75L326 176L348 224L341 305L225 305L221 223L246 176Z',wood)
  +path('M241 196L313 196L330 230L326 288L241 288L235 229Z','#e7d7b5')
  +rect(262,79,38,124,dark)+strings(3,270,86,190,7)+repeat(11,i=>line(307+i*1.3,112,310+i*1.3,272,'#e4cf9f',.8))
  +repeat(9,i=>circle(337,121+i*18,5,wood))+repeat(3,i=>rect(232,92+i*24,30,8,wood))
  +line(378,84,386,307,wood,5)+line(383,86,392,307,'#e4d1a7',2)
  +label('短颈与弦列',77,67,267,123)+label('共鸣弦轴',417,145,341,176)+label('蒙皮琴箱',77,288,244,252);
shapes.veena=ellipse(367,238,84,71,wood)+ellipse(367,220,79,57,pale)+ellipse(163,234,45,39,wood)
  +path('M139 160L379 154L383 196L143 201Z',wood)+path('M135 163L109 141L119 117L147 144Z',pale)
  +repeat(14,i=>line(154+i*14,163,154+i*14,194,gold,4))+repeat(5,i=>line(130,166+i*5,414,166+i*5,'#f5dfb7',1))
  +rect(393,211,43,8,pale)+label('有品长颈',81,76,222,165)+label('主共鸣体',427,322,397,264)+label('辅助共鸣体',66,302,143,250);
shapes.santoor=path('M167 141L402 141L473 284L98 284Z',wood)+path('M176 151L394 151L453 271L117 271Z',pale)
  +repeat(21,i=>line(171-i*2.3,157+i*5.3,397+i*2.3,157+i*5.3,'#f6e6bf',1))
  +repeat(9,i=>path(`M${215+i*4} ${163+i*12}l5-8 5 8Z`,wood))+repeat(9,i=>path(`M${335-i*3} ${163+i*12}l5-8 5 8Z`,wood))
  +path('M197 75L259 136L270 134M369 75L310 137L299 135','none',wood,5)
  +label('梯形弦箱与琴码',64,321,209,233)+label('一对轻槌',374,55,365,83);
shapes.mridangam=path('M158 166Q289 113 425 159L427 238Q287 294 154 237Z',wood)
  +ellipse(158,201,42,40,pale)+ellipse(425,199,43,42,'#e8ddc3')+ellipse(425,199,17,19,dark)
  +repeat(10,i=>line(157,169+i*6.5,424,163+i*7.5,pale,2))
  +label('横置桶形鼓体',81,94,265,151)+label('两端不同鼓皮',393,310,425,229);
shapes.ghatam=path('M266 106L263 138Q200 151 188 218Q179 281 232 307Q291 333 352 307Q406 278 393 216Q381 153 322 138L319 106Z','#b67e59')
  +ellipse(292,105,31,10,dark)+ellipse(292,104,37,14,'#d3a581')+ellipse(292,103,25,8,dark)
  +path('M212 238Q222 186 252 171','none','#dba67c',5)+label('敞口陶罐',78,70,277,105)+label('陶土器壁',405,284,365,258);
function transverseBamboo(membrane=false) {
  return path('M126 215L448 100L458 122L134 239Z',pale)+repeat(3,i=>line(166+i*97,200-i*35,173+i*97,225-i*35,wood,3))
    +ellipse(167,212,8,5,dark)+repeat(6,i=>ellipse(243+i*31,184-i*11,5.5,4,dark))
    +(membrane ? ellipse(209,197,11,6,'#d9ded0')+label('膜孔',98,117,208,193) : '')
    +label('横吹吹孔',83,278,167,214)+label('指孔与竹管',389,64,369,139);
}
shapes.bansuri=transverseBamboo();shapes.daegeum=transverseBamboo(true);
shapes.shehnai=path('M283 76L300 76L316 254L266 254Z',wood)+path('M269 250L246 309Q292 323 336 309L313 250Z',metal)
  +path('M284 76L280 43Q292 36 303 43L299 76Z',pale)+repeat(7,i=>circle(292,102+i*21,5,dark))
  +label('双簧',95,56,290,53)+label('喇叭口',397,290,322,289);
shapes.tar=path('M272 180C234 153 212 177 228 211C190 233 202 284 245 294Q292 313 334 293C376 279 384 231 347 211C363 178 338 154 310 180Z',wood)
  +path('M273 184C246 171 231 188 247 211C215 237 228 278 253 281Q290 294 324 279C350 270 363 239 329 211C345 188 328 174 309 184Z','#e1d0ae')
  +rect(277,46,28,154,wood)+rect(271,27,41,27,wood)+repeat(12,i=>line(277,67+i*10,304,67+i*10,gold,2))+strings(6,280,40,237,4)
  +label('双腔蒙皮琴箱',64,282,245,242)+label('有品长颈',393,78,302,125);
shapes.setar=path('M270 191Q225 218 231 265Q234 304 290 312Q343 301 348 263Q351 217 304 191Z',pale)
  +rect(280,42,18,165,wood)+path('M280 42L273 22L300 17L299 43Z',wood)+strings(4,282,32,250,3.5)
  +repeat(15,i=>line(280,56+i*9,298,56+i*9,dark,1.5))+rect(270,280,42,6,wood)
  +label('细长有品琴颈',73,83,281,129)+label('小型梨形琴箱',393,280,329,254);
shapes.kamancheh=circle(292,235,57,wood)+ellipse(292,225,49,46,'#e1d3b2')+rect(283,48,17,180,dark)
  +path('M283 48L274 25L308 25L301 48Z',wood)+repeat(4,i=>rect(i%2?300:262,51+i*16,22,7,wood))
  +strings(4,285,40,227,3)+line(292,291,292,326,dark,5)+line(184,183,409,262,wood,5)+line(185,189,408,267,'#e8d7b4',2)
  +label('蒙皮圆形共鸣体',56,298,247,253)+label('底部支撑',399,326,293,310);
shapes.biwa=path('M267 161Q227 182 215 238Q208 298 280 313Q350 313 364 258Q369 204 310 163Z',pale)
  +rect(275,56,29,142,wood)+path('M275 57L260 30L292 26L308 57Z',wood)
  +repeat(5,i=>rect(270,92+i*22,40,6,dark,1))+strings(4,279,44,241,5)+rect(260,281,63,7,wood)
  +path('M403 185L445 261L381 261Z',wood)+label('高品',95,89,278,138)+label('大拨子',416,310,412,242);
shapes.sho=ellipse(293,270,68,39,wood)+repeat(13,i=>{const a=(i-6)*.13;const x=239+i*8;const y=69+Math.abs(6-i)*10;return rect(x,y,10,197-y,pale,2)+line(x+5,197,x+5,259,wood,2);})
  +ellipse(293,256,69,20,pale)+path('M228 269L185 274L184 284L235 282Z',wood)
  +label('成束竹管',80,82,251,135)+label('气室与吹口',382,318,252,274);
shapes.hichiriki=rect(280,110,22,188,wood)+path('M278 110L274 58Q289 47 307 58L303 110Z',pale)
  +repeat(7,i=>circle(291,135+i*21,4.5,dark))+repeat(5,i=>line(279,125+i*34,303,125+i*34,dark,3))
  +label('宽双簧',98,71,286,72)+label('短管与指孔',385,247,300,223);
shapes.haegeum=rect(281,43,12,210,wood)+path('M281 43L272 28L296 22L299 42Z',wood)
  +repeat(2,i=>line(264,68+i*39,326,68+i*39,wood,9))+ellipse(294,267,47,36,wood)+ellipse(284,260,39,32,pale)
  +strings(2,283,48,224,5)+line(190,250,409,250,wood,4)+line(190,256,409,256,'#e3cfaa',2)
  +label('竖持琴杆与二弦',67,74,286,132)+label('小型圆筒共鸣箱',384,316,319,279);
shapes.didgeridoo=path('M185 72Q212 67 225 84L388 294Q379 315 345 322L178 101Z',wood)
  +ellipse(202,80,24,12,pale)+ellipse(201,79,14,7,dark)+ellipse(367,306,28,15,pale)+ellipse(366,305,18,9,dark)
  +path('M218 128l35-2 1 35 35-2 1 35 35-2 1 35 35-2','none',pale,4)
  +label('唇振吹口',69,48,199,81)+label('长管共鸣体',385,125,313,213);
shapes.theremin=path('M165 215L401 215L431 251L184 251Z','#6d8672')+rect(184,251,247,44,wood)
  +path('M388 218V67','none',metal,7)+path('M174 235Q87 252 105 192Q123 166 174 191','none',metal,7)
  +circle(386,67,5,metal)+rect(208,262,27,9,dark)+repeat(4,i=>circle(278+i*30,272,7,gold))
  +label('音高天线',411,80,390,119)+label('音量环形天线',55,113,118,192)+label('电子琴体',389,326,374,273);
shapes.musicalsaw=path('M241 76C329 126 207 214 300 291L324 272C241 210 358 125 261 64Z',metal)
  +path('M299 291L323 272L344 294L319 319Z',wood)+line(167,245,391,178,wood,5)+line(168,251,392,184,'#eadaba',2)
  +label('弯曲金属片',83,73,266,119)+label('专用手柄',385,319,328,297)+label('琴弓',79,283,210,237);

const chinese = [
  {id:'gehu',name:'革胡',art:'gehu',shape:'琴弓、琴弦和低音共鸣体的代表外形。'},
  {id:'jingerhu',name:'京二胡',art:'jingerhu',shape:'琴杆、二弦与琴筒的简化外形。'},
  {id:'chuzhu',name:'柷',art:'chuzhu',shape:'木箱与击具的代表结构。'},
  {id:'yuscraper',name:'敔',art:'yuscraper',shape:'虎形木体、齿背与刮击具的代表外形。'},
];
const ledger = JSON.parse(readFileSync(new URL('credits.json',out),'utf8'));
// Entries that now have a verified photo keep it; only draw what is still a diagram.
const pending=[...worldCatalog,...chinese].filter(item=>(ledger[item.id]?.kind??'diagram')==='diagram');
for(const item of pending) {
  if(!shapes[item.art]) throw new Error(`Missing drawing geometry: ${item.id} (${item.art})`);
  const body=shapes[item.art];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380"><title>${esc(item.name)} · 外形结构示意</title><rect width="600" height="380" fill="#f3f0e8"/>${body}<text x="300" y="353" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#52684d">${esc(item.name)} · 代表外形</text><text x="300" y="373" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#8b927a">原创示意 · 不作为尺寸、指法、精确弦数或制器依据</text></svg>`;
  writeFileSync(new URL(`${item.id}.svg`,out),svg);
  ledger[item.id]={file:`${item.id}.svg`,width:600,height:380,name:item.name,kind:'diagram',alt:`${item.name}原创外形示意。${item.shape}`,
    caption:`${item.name}的原创外形示意。${item.shape}具体结构因型号与地方形制而异。`,author:'音序项目原创',license:'MIT',
    licenseUrl:'https://github.com/xxzzh/yinyue/blob/main/LICENSE',source:'https://github.com/xxzzh/yinyue/blob/main/scripts/draw-world-diagrams.mjs',sourceTitle:'音序原创乐器外形示意',
    note:'用于认识代表结构，不作为尺寸、指法、精确弦数或制器依据。结构参考见课程延伸资料。'};
}
writeFileSync(new URL('credits.json',out),JSON.stringify(ledger,null,2)+'\n');
console.log(`Drew ${pending.length} original instrument diagrams.`);
