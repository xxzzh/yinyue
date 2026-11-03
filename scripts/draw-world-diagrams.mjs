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

const chinese = [
  {id:'gehu',name:'革胡',art:'gehu',shape:'琴弓、琴弦和低音共鸣体的代表外形。'},
  {id:'jingerhu',name:'京二胡',art:'jingerhu',shape:'琴杆、二弦与琴筒的简化外形。'},
  {id:'chuzhu',name:'柷',art:'chuzhu',shape:'木箱与击具的代表结构。'},
  {id:'yuscraper',name:'敔',art:'yuscraper',shape:'虎形木体、齿背与刮击具的代表外形。'},
];
const ledger = JSON.parse(readFileSync(new URL('credits.json',out),'utf8'));
for(const item of [...worldCatalog,...chinese]) {
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
console.log(`Drew ${worldCatalog.length+chinese.length} original instrument diagrams.`);
