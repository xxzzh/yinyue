"""Bundle a small, traceable CC0 real-instrument listening set from VSCO 2 CE.

Only mono/16-bit conversion and an end fade are applied; never repitch a sample.
The source library and its complete CC0 text are retained in the attribution.
"""
import concurrent.futures
import hashlib
from html import escape
import io
import json
from pathlib import Path
import struct
import sys
import urllib.parse
import urllib.request
import wave

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'audio'
OUT.mkdir(exist_ok=True)
REPO = 'sgossner/VSCO-2-CE'

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Yinxu-audio-attribution'}), timeout=60) as response:
        return response.read()

config_path = ROOT / 'scripts' / 'real-audio-sources.json'
if config_path.exists():
    config = json.loads(config_path.read_text(encoding='utf8'))
else:
    commit = json.loads(get(f'https://api.github.com/repos/{REPO}/commits/master'))['sha']
    tree = json.loads(get(f'https://api.github.com/repos/{REPO}/git/trees/{commit}?recursive=1'))
    files = [item for item in tree['tree'] if item['type'] == 'blob' and item['path'].lower().endswith('.wav')]
    wanted = [
        ('flute','Woodwinds/Flute/susNV','长笛独奏长音'),
        ('clarinet','Woodwinds/Clarinet/susLong','单簧管独奏长音'),
        ('oboe','Woodwinds/Oboe/Sus','双簧管独奏长音'),
        ('bassoon','Woodwinds/Bassoon/sus','大管独奏长音'),
        ('violin','Strings/Solo Violin/Arco Vib','小提琴独奏颤音长音'),
        ('viola','Strings/Viola Section/susvib','中提琴组颤音长音'),
        ('cello','Strings/Cello Section/susvib','大提琴组颤音长音'),
        ('doublebass','Strings/Solo Contrabass/SusNV','低音提琴独奏长音'),
        ('harp','Strings/Harp','竖琴拨弦单音'),
        ('frenchhorn','Brass/F Horn/sus','圆号独奏长音'),
        ('trumpet','Brass/Trumpet/sus','小号独奏长音'),
        ('trombone','Brass/Tenor Trombone/sus','次中音长号独奏长音'),
        ('tuba','Brass/Tuba/sus','大号独奏长音'),
        ('marimba','Percussion/Marimba','马林巴槌击单音'),
        ('glockenspiel','Percussion/Glock','钟琴槌击单音'),
        ('piccolo','Woodwinds/Piccolo/Sus','短笛独奏长音'),
    ]
    samples = []
    for track, folder, label in wanted:
        matches = [item for item in files if item['path'].rsplit('/',1)[0] == folder]
        # Prefer labelled, ordinary sustained or struck notes over special effects.
        def rank(item):
            p = item['path']
            return (0 if 'C3' in p or 'C4' in p else 1, 0 if '_v2_' in p or '_mf' in p else 1, item.get('size',0), p)
        chosen = sorted(matches,key=rank)[0]
        samples.append({'track':track,'path':chosen['path'],'blob':chosen['sha'],'label':label})
    config = {'repository':REPO,'commit':commit,'license':'CC0-1.0','samples':samples}
    config_path.write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

base = f'https://raw.githubusercontent.com/{REPO}/{config["commit"]}/'
cached = '--cached' in sys.argv
if not cached:
    (OUT/'LICENSE-VSCO-CC0.txt').write_bytes(get(base+'LICENSE'))

def convert(item):
    source = base + urllib.parse.quote(item['path'],safe='/')
    data = get(source)
    with wave.open(io.BytesIO(data),'rb') as src:
        channels, width, rate = src.getnchannels(), src.getsampwidth(), src.getframerate()
        frames = src.readframes(min(src.getnframes(),int(rate*5)))
    if width not in (2,3,4):
        raise ValueError(f'Unexpected PCM width for {item["track"]}: {width}')
    frame_size = width*channels
    values=[]
    for n in range(0,len(frames),frame_size):
        values.append(sum(int.from_bytes(frames[n+c*width:n+(c+1)*width],'little',signed=True) >> ((width-2)*8) for c in range(channels))//channels)
    # Avoid a cutoff click; the original attack and pitch remain untouched.
    fade=min(int(rate*.04),len(values))
    for i in range(fade): values[len(values)-fade+i]=int(values[len(values)-fade+i]*(fade-i)/fade)
    path=OUT/f'{item["track"]}.wav'
    with wave.open(str(path),'wb') as dst:
        dst.setnchannels(1);dst.setsampwidth(2);dst.setframerate(rate)
        dst.writeframes(struct.pack('<'+'h'*len(values),*values))
    return {**item,'file':path.name,'seconds':round(len(values)/rate,3),'sampleRate':rate,'channels':1,'source':f'https://github.com/{REPO}/blob/{config["commit"]}/'+urllib.parse.quote(item['path'],safe='/'),
        'license':'CC0-1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/',
        'author':'Versilian Studios / VSCO 2 Community Edition contributors',
        'modification':'原录音节选至最多5秒，转换为单声道16位PCM，末尾淡出；未变调、未替换音色。',
        'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

if cached:
    records=list(json.loads((OUT/'credits.json').read_text(encoding='utf8')).values())
    for item in records:
        if hashlib.sha256((OUT/item['file']).read_bytes()).hexdigest()!=item['sha256']:
            raise ValueError(f'Changed audio file: {item["track"]}')
else:
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records=list(pool.map(convert,config['samples']))
ledger={item['track']:item for item in records}
(OUT/'credits.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'src'/'audio-samples.ts').write_text('''// Generated by scripts/sync-real-audio.py. Source, processing and licensing are in public/audio/credits.json.
export interface AudioSample { track: string; file: string; label: string; seconds: number; sampleRate: number; channels: number; source: string; license: string; licenseUrl: string; author: string; modification: string; sha256: string; path: string; blob: string; }
export const audioSamples: Record<string, AudioSample> = '''+json.dumps(ledger,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
entries=''.join(f'<article><h2>{escape(item["label"])}</h2><audio controls preload="none" src="./audio/{escape(item["file"])}"></audio><p>作者 / 提供者：{escape(item["author"])}<br>来源文件：<a href="{escape(item["source"])}">{escape(item["path"])}</a><br>授权：<a href="{escape(item["licenseUrl"])}">{escape(item["license"])}</a></p><p>{escape(item["modification"])} 时长 {item["seconds"]} 秒。SHA-256：<code>{item["sha256"]}</code></p></article>' for item in records)
(ROOT/'public'/'audio-credits.html').write_text('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>真实录音来源与授权 · 音序</title><style>body{margin:0;background:#f7f6f0;color:#4e6246;font:14px/1.9 system-ui,sans-serif}main{max-width:900px;margin:auto;padding:30px 22px}a{color:#446e3f;overflow-wrap:anywhere}h1{font-weight:500;font-size:26px}h2{font-size:18px;font-weight:500}article{border-top:1px solid #dbe2d2;padding:20px 0}audio{max-width:100%}code{font-size:11px;overflow-wrap:anywhere}</style><main><a href="./#/choose">← 返回选乐器</a><h1>真实录音来源与授权</h1><p>以下真实乐器录音来自 Versilian Studios 的 VSCO 2 Community Edition，按 CC0 1.0 使用。原始库中有独奏与声部合奏，均在播放标签中说明。音高、力度和人数不统一，不宜只凭响度判断乐器。</p><p>本项目只节选、转换声道和位深、淡出尾端，不变调；不是用同一个合成音替代不同乐器。<a href="./audio/LICENSE-VSCO-CC0.txt">完整 CC0 声明</a> · <a href="https://github.com/sgossner/VSCO-2-CE">原始音源项目</a>。中国乐器等外部资料入口需联网，未将未获再分发许可的录音混入包内。</p>'''+entries+'</main></html>\n',encoding='utf8')
print(f'Bundled {len(records)} documented CC0 real-instrument excerpts; no pitch shifting.',flush=True)
