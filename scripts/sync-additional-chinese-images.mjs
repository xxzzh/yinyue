import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { additionalChineseCatalog } from '../src/additional-chinese-catalog.ts';
const root=new URL('../public/instruments/',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('credits.json',root),'utf8'));
for(const item of additionalChineseCatalog){
  if((ledger[item.id]?.kind??'diagram')!=='diagram')continue; // keep verified photos
  const file=`${item.id}.svg`;
  if(!existsSync(new URL(file,root)))throw new Error(`Missing Chinese instrument diagram: ${file}`);
  ledger[item.id]={file,width:600,height:380,name:item.name,kind:'diagram',alt:`${item.name}原创外形示意。${item.shape}`,
    caption:`${item.name}的代表外形示意。${item.shape}部件数量与比例为教学概括，具体结构须结合实物。`,
    author:'音序项目原创',license:'MIT',licenseUrl:'https://github.com/xxzzh/yinyue/blob/main/LICENSE',
    source:'https://github.com/xxzzh/yinyue/blob/main/scripts/draw-additional-chinese.mjs',sourceTitle:'音序原创中国地方乐器示意',
    note:'认识代表结构，不作为尺寸、指法或制器依据；形制和参考来源见课程资料。'};
}
writeFileSync(new URL('credits.json',root),JSON.stringify(ledger,null,2)+'\n');
console.log(`Merged ${additionalChineseCatalog.length} Chinese diagrams; ${Object.keys(ledger).length} image entries.`);
