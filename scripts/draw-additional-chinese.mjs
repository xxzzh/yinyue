// Original explanatory vectors, not traced photographs or fabrication plans.
// Sources and representative traditions: src/additional-chinese-catalog.ts.
// This script writes only its twelve SVG files, never the shared image ledger.
import { readFileSync, writeFileSync } from 'node:fs';

const out = new URL('../public/instruments/', import.meta.url);
const wood = '#aa7853', pale = '#dfbd86', dark = '#48584c', metal = '#b8c8bd';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]);
const path = (d, fill=wood, stroke=dark, width=2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const line = (x,y,a,b,color=dark,width=2) => path(`M${x} ${y}L${a} ${b}`,'none',color,width);
const ellipse = (x,y,rx,ry,fill=pale) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${dark}" stroke-width="1.5"/>`;
const rect = (x,y,w,h,fill=wood,rx=4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}" stroke="${dark}" stroke-width="1.5"/>`;
const repeat = (n, fn) => Array.from({length:n},(_,i)=>fn(i)).join('');
const text = (content,x,y,size=13,anchor='start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="sans-serif" font-size="${size}" fill="#52684d">${esc(content)}</text>`;
const label = (content,x,y,a,b) => line(x,y-6,a,b,'#92a28e',1)+text(content,x,y);
const bow = (x,y,a,b) => path(`M${x} ${y}Q${(x+a)/2} ${(y+b)/2-13} ${a} ${b}`,'none',wood,4)+line(x,y+6,a,b+6,'#ddd2b3',2);

function huqin({body='round',large=false,bone=false}) {
  const cx=286,cy=253,rx=large?56:36,ry=large?43:28;
  const barrel = body==='round'
    ? path(`M${cx-rx} ${cy-ry}L${cx+rx-8} ${cy-ry-11}Q${cx+rx+25} ${cy} ${cx+rx-8} ${cy+ry-6}L${cx-rx} ${cy+ry}Z`,bone?'#e7d7ac':wood)
      +ellipse(cx-rx,cy,13,ry,bone?'#f0e5c8':pale)
    : path(`M${cx-rx} ${cy-ry}L${cx+rx-4} ${cy-ry-7}L${cx+rx+14} ${cy+ry-2}L${cx-rx} ${cy+ry}Z`,wood)
      +path(`M${cx-rx} ${cy-ry}Q${cx-rx-16} ${cy} ${cx-rx} ${cy+ry}L${cx-rx+17} ${cy+ry-3}L${cx-rx+17} ${cy-ry+3}Z`,pale);
  return barrel+line(279,43,285,253,wood,9)+line(278,63,327,63,wood,8)+line(280,91,330,91,wood,8)
    +line(280,43,284,256,'#f5e9c9',1)+line(285,43,289,256,'#f5e9c9',1)
    +rect(278,247,20,5,pale,1)+bow(168,260,415,267)
    +label(bone?'骨质琴筒':body==='wood'?'木面板与琴筒':'较大的琴筒',65,310,cx-rx,cy)
    +label('二弦与琴杆',390,96,286,142)+label('琴弓',402,310,366,269);
}

const drawings = {
  maguhu: {name:'马骨胡',note:'二弦与骨质琴筒的代表外形',body:huqin({bone:true})},
  daguangxian: {name:'大广弦',note:'闽南木面板胡琴代表外形，材料与轴向依实物',body:huqin({body:'wood',large:true})},
  datong: {name:'大筒',note:'湖南花鼓戏大筒代表外形，不标定弦与尺寸',body:huqin({large:true})},
  bixiao: {name:'黎族鼻箫',note:'单竹管近两端开孔的代表形制',body:
    rect(282,53,27,259,pale,6)+ellipse(295,53,13,5,dark)
    +ellipse(296,96,4,5,dark)+ellipse(296,271,4,5,dark)
    +line(286,59,286,307,'#f0dcb1',2)
    +label('鼻吹端',101,64,288,54)+label('近两端的按音孔',371,168,300,96)
    +line(371,162,300,271,'#92a28e',1)+label('细竹音管',92,289,286,234)},
  zhuoba: {name:'灼吧',note:'只示意侧置细吹管连接，不标绘实际孔位',body:
    path('M261 72L308 72L298 312L274 312Z',pale)+ellipse(284,73,23,7,dark)
    +path('M307 116L394 78Q411 72 421 78','none',pale,12)
    +path('M307 116L394 78Q411 72 421 78','none',dark,1.5)
    +ellipse(421,78,5,7,pale)+label('侧置细吹管',389,42,389,85)
    +label('主音管',100,240,273,224)+label('连接位置',383,166,309,117)},
  koudi: {name:'口笛',note:'以两端管口控制音高的短管代表形制',body:
    path('M142 169L438 169L438 218L142 218Z',pale)
    +ellipse(142,193,13,24,dark)+ellipse(438,193,13,24,dark)
    +ellipse(288,181,13,7,dark)+line(149,174,427,174,'#efd8a4',3)
    +label('中央吹孔',262,107,287,176)+label('左端管口',87,279,142,200)
    +label('右端管口',410,279,439,199)},
  tuliang: {name:'吐良',note:'中部吹孔、双手控制两端的代表结构',body:
    path('M97 161L485 161L485 211L97 211Z',pale)
    +ellipse(97,186,13,25,dark)+ellipse(485,186,13,25,dark)
    +ellipse(291,172,12,7,dark)+line(108,167,473,167,'#f0dcb1',3)
    +label('中间吹孔',255,100,289,167)+label('左端开闭',65,282,96,195)
    +label('右端开闭',420,282,486,193)},
  zimeixiao: {name:'姊妹箫',note:'双管并列代表外形，发声口与孔数依具体形制',body:
    rect(251,66,29,245,pale,6)+rect(293,66,29,245,pale,6)
    +repeat(6,i=>ellipse(266,133+i*26,4,5,dark)+ellipse(308,133+i*26,4,5,dark))
    +rect(246,98,82,9,wood,2)+rect(246,294,82,9,wood,2)
    +ellipse(266,66,14,5,dark)+ellipse(308,66,14,5,dark)
    +label('双管发声口',94,52,266,65)+line(94,46,308,65,'#92a28e',1)
    +label('并列音管',395,147,318,171)+label('对应音孔',98,267,265,236)
    +label('固定连接',386,306,323,299)},
  lilie: {name:'唎咧',note:'套接竹管与簧口的代表外形，不规定管节与孔数',body:
    repeat(7,i=>path(`M${287-3*i} ${80+i*31}L${303+3*i} ${80+i*31}L${306+3*i} ${113+i*31}L${284-3*i} ${113+i*31}Z`,pale))
    +path('M287 80L286 54L302 54L303 80Z',wood)
    +repeat(6,i=>ellipse(295,118+i*30,4.5,5,dark))
    +label('簧口位置',97,51,292,63)+label('套接竹管',389,144,316,159)
    +label('按音孔',99,267,292,236)},
  shabayi: {name:'沙巴依',note:'木棒、铁环与接触片的代表结构，环数作简化',body:
    line(265,122,243,302,wood,15)+line(308,122,287,302,wood,15)
    +path('M264 135C217 146 209 67 261 62C314 54 317 125 279 132','none',metal,10)
    +path('M308 137C270 123 286 57 333 63C386 70 382 141 334 143','none',metal,10)
    +repeat(7,i=>ellipse(225+i*13,84-Math.sin(i/6*Math.PI)*22,6,13,'none'))
    +repeat(7,i=>ellipse(297+i*12,91-Math.sin(i/6*Math.PI)*24,6,13,'none'))
    +rect(255,128,22,23,metal,1)+rect(298,128,22,23,metal,1)
    +label('大小铁环',88,62,237,88)+label('并置木棒',381,278,290,266)
    +label('铁片接触处',389,173,318,145)},
  fangxiang: {name:'方响',note:'金属片上下两排的历史代表结构，数量仅作简化',body:
    line(124,69,474,69,wood,12)+line(142,71,142,316,wood,11)+line(457,71,457,316,wood,11)
    +line(145,188,455,188,wood,9)
    +repeat(8,i=>line(175+i*34,70,175+i*34,91,'#89947e',1.3)+rect(164+i*34,91,22,70,metal,5))
    +repeat(8,i=>line(175+i*34,189,175+i*34,210,'#89947e',1.3)+rect(164+i*34,210,22,70,metal,5))
    +line(483,254,519,189,wood,5)+ellipse(521,187,10,8,pale)
    +label('金属音片',72,42,205,123)+label('悬挂木架',393,43,452,69)
    +label('小击槌',460,321,502,223)},
  taipinggu: {name:'京西太平鼓',note:'以北京带柄框鼓和垂挂铁环为对象',body:
    path('M215 152Q219 72 300 67Q387 69 390 153Q386 224 307 239L305 279L280 279L280 237Q211 224 215 152Z',wood)
    +path('M225 152Q228 83 300 79Q375 83 379 153Q375 215 300 225Q224 216 225 152Z','#e8ddbd')
    +path('M288 280C266 292 278 321 294 310C310 324 328 292 301 280','none',metal,7)
    +repeat(5,i=>ellipse(277+i*9,304+(i%2)*7,5,10,'none'))
    +path('M416 97L369 219','none',wood,5)+path('M416 97L410 92L363 214','none',pale,3)
    +label('鼓面',91,78,245,119)+label('鼓柄',98,279,286,258)
    +label('垂挂铁环',394,320,311,304)+label('击具',426,118,398,141)},
};

const ledger = JSON.parse(readFileSync(new URL('credits.json', out), 'utf8'));
for (const [id,{name,note,body}] of Object.entries(drawings)) {
  if ((ledger[id]?.kind ?? 'diagram') !== 'diagram') continue; // keep verified photos
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380"><title>${esc(name)} · 原创外形结构示意</title><desc>${esc(note)}</desc><rect width="600" height="380" fill="#f3f0e8"/>${body}${text(`${name} · 代表外形`,300,340,14,'middle')}${text(note,300,358,10,'middle')}${text('原创示意 · 不作为尺寸、指法或制器依据',300,375,10,'middle')}</svg>`;
  writeFileSync(new URL(`${id}.svg`,out),svg);
}
console.log(`Rendered ${Object.keys(drawings).filter(id => (ledger[id]?.kind ?? 'diagram') === 'diagram').length} additional Chinese instrument diagrams.`);
