// Stage-test questions and instrument stage plans. Kept out of curriculum.ts so the first screen does not
// ship them; only the path page imports this module.
import type { InstrumentStagePlan, LineId, Question, Skill, Stage, StageTest } from './curriculum.ts';
import { PASS_RATE } from './curriculum.ts';

export const instrumentPlans: Record<Exclude<LineId, 'core'>, Record<Stage, InstrumentStagePlan>> = {
  piano: {
    0: { technique: '键盘地图、坐姿与手型、指号 1–5', repertoire: '—' },
    1: {
      technique: 'C 五指位、双手交替、连奏与断奏、左手根音伴奏',
      repertoire: '《小星星》、《欢乐颂》主题、简单民歌',
    },
    2: {
      technique: '一个八度音阶与琶音、转指与穿指、大谱表双手、踏板入门',
      repertoire: '拜厄 Op.101、车尔尼 Op.599、布格缪勒 Op.100、《安娜·玛格达莱娜·巴赫笔记本》',
    },
    3: {
      technique: '全部大小调两个八度、切分踏板、伴奏型与弹唱',
      repertoire: '车尔尼 Op.849、巴赫二部创意曲、克莱门蒂 Op.36、舒曼《少年曲集》、柴可夫斯基《儿童曲集》',
    },
    4: {
      technique: '四个八度音阶琶音、三度六度双音、风格触键',
      repertoire: '车尔尼 Op.299、巴赫三部创意曲与《平均律》、海顿/莫扎特/贝多芬奏鸣曲、肖邦圆舞曲与夜曲',
    },
    5: {
      technique: '音乐会级技术与独奏会准备',
      repertoire: '肖邦练习曲、贝多芬中后期奏鸣曲、德彪西前奏曲、中国钢琴作品（需授权）',
    },
  },
  guitar: {
    0: { technique: '持琴、六根空弦、指弹与拨片', repertoire: '—' },
    1: {
      technique: '前五品音位、开放和弦 C/G/Am/D/Em、均匀下扫、六线谱',
      repertoire: '单音民歌旋律、两三个和弦的伴奏',
    },
    2: {
      technique: 'F 小横按、属七和弦、扫弦节奏型、分解和弦（p i m a）、大横按、第一把位五声音阶、弹唱',
      repertoire: '卡尔卡西 Op.59 初段、朱利亚尼右手练习',
    },
    3: {
      technique: '五声音阶 5 个把位、CAGED、变调夹与移调、12 小节布鲁斯、击弦勾弦滑音推弦',
      repertoire: '索尔练习曲、布鲁斯与流行伴奏',
    },
    4: {
      technique: '七和弦与扩展和弦按法、爵士进行、指弹编曲、调式即兴',
      repertoire: '泰雷加作品、爵士标准曲（需授权）',
    },
    5: { technique: '独奏曲目与个人编曲风格', repertoire: '独奏会曲目' },
  },
  voice: {
    0: { technique: '姿势、呼吸、自然发声、找到舒适音域、嗓音保健', repertoire: '童谣与五声小调' },
    1: {
      technique: '哼鸣与共鸣入门、五度内练声、中文咬字（声母、韵母、归韵）',
      repertoire: '中国民歌（如《茉莉花》）',
    },
    2: {
      technique: '气息支撑、真假声与换声区、音域扩展到一个八度以上',
      repertoire: '孔空练声曲 Op.9、意大利古典歌曲、中外民歌',
    },
    3: {
      technique: '混声、连音与跳音、力度控制、美声/民族/流行发声的差异',
      repertoire: '艺术歌曲入门、中国艺术歌曲（需授权）',
    },
    4: { technique: '颤音与花腔入门、意大利语咬字（国际音标）、风格演唱', repertoire: '咏叹调入门、流行演唱技巧' },
    5: { technique: '独唱音乐会、角色塑造', repertoire: '个人曲目单' },
  },
  guzheng: {
    0: { technique: '形制、二十一弦与 D 调定弦、坐姿、戴义甲', repertoire: '—' },
    1: { technique: '托、抹、勾、打，D 宫五声音阶，简单乐句', repertoire: '《茉莉花》等民歌改编' },
    2: { technique: '摇指入门、刮奏、花指、左手按滑揉颤、双手配合', repertoire: '《出水莲》、《汉宫秋月》等传统曲' },
    3: {
      technique: '快速指序、扫摇、移柱转调、流派特点（河南、山东、潮州、客家、浙江）',
      repertoire: '《寒鸦戏水》、《将军令》、各派《高山流水》',
    },
    4: { technique: '双手轮奏、泛音、现代技法', repertoire: '现代筝曲（需授权）' },
    5: { technique: '独奏会与流派风格研究', repertoire: '个人曲目单' },
  },
  koudi: {
    0: { technique: '形制、发声与起步、听赏；确认两孔或五孔形制、持笛与保养', repertoire: '—' },
    1: {
      technique: '口风与第一个稳定长音、腹式呼吸、管端开闭与基本音高、单吐、五声音阶短句',
      repertoire: '五声民歌短句、童谣',
    },
    2: {
      technique: '音区转换（超吹）、长音与音准、连音、颤音与打音、双吐入门',
      repertoire: '民歌改编、带简单装饰的五声旋律',
    },
    3: {
      technique: '双吐与三吐、花舌、滑音、叠音与赠音、鸟鸣类模仿音型、气震音',
      repertoire: '民间曲调改编、短小口笛独奏',
    },
    4: {
      technique: '快速吐音与跳音乐句、循环换气入门、高音区控制、风格演奏',
      repertoire: '代表性口笛独奏曲（如《苗岭的早晨》，需授权）',
    },
    5: { technique: '独奏会曲目、与乐队协奏、个人风格', repertoire: '个人曲目单' },
  },
};

const question = (
  id: string,
  skill: Skill,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): Question => ({ id, skill, prompt, options, answer, explanation });

export const stageTests: StageTest[] = [
  {
    id: 'core-l0',
    line: 'core',
    stage: 0,
    title: 'L0 启蒙 · 阶段测验',
    questions: [
      question(
        'core-l0-q1',
        'rh',
        '节拍器设为 60 BPM 时，大约每秒响几下？',
        ['一下', '两下', '半下', '六十下'],
        0,
        'BPM 是每分钟的拍数。60 拍平均分在 60 秒里，大约每秒一拍。',
      ),
      question(
        'core-l0-q2',
        'rh',
        '跟着节拍器拍手，发现自己总是越拍越快，先怎么做？',
        ['把速度调慢，先求稳定', '继续加快，跟上自己的感觉', '关掉节拍器，凭感觉拍', '只练最快的部分'],
        0,
        '稳定比速度更重要。降低速度，能留出时间检查每一拍是否落在同一条时间线上。',
      ),
      question(
        'core-l0-q3',
        'rh',
        '三拍子音乐的强弱规律通常是？',
        ['强、弱、弱', '强、弱', '强、强、弱', '弱、弱、强'],
        0,
        '三拍子每小节三拍，第一拍是强拍，后两拍是弱拍，所以常数成“强、弱、弱”。',
      ),
      question(
        'core-l0-q4',
        'ea',
        '先听 G4，再听 C4，音高的方向是？',
        ['向下', '向上', '不变', '音量变小'],
        0,
        'C4 低于 G4，所以从 G4 到 C4 是向下。音高方向和音量大小是两回事。',
      ),
      question(
        'core-l0-q5',
        'ea',
        '一个音弹得很轻，它的音高一定很低吗？',
        ['不一定，音高和音量是两回事', '一定很低', '一定很高', '很轻的音没有音高'],
        0,
        '音高描述声音的高低，音量描述声音的强弱。一个很轻的音也可以很高。',
      ),
      question(
        'core-l0-q6',
        'ea',
        '在 C 大调里，sol 对应哪个音名？',
        ['G', 'F', 'A', 'E'],
        0,
        'C 大调中 C D E F G A B 对应 do re mi fa sol la si，sol 是第五个音 G。',
      ),
      question(
        'core-l0-q7',
        'nt',
        '键盘上，三个黑键一组时，它左边紧挨着的白键是什么音？',
        ['F', 'C', 'E', 'G'],
        0,
        '两个黑键左边是 C，三个黑键左边是 F。',
      ),
      question(
        'core-l0-q8',
        'nt',
        'C4 和 C5 之间相隔多远？',
        ['一个八度', '一个半音', '一个全音', '五度'],
        0,
        '音名相同、数字相差 1，就是相隔一个八度。C5 比 C4 高一个八度。',
      ),
      question(
        'core-l0-q9',
        'ls',
        '同一个音分别由钢琴和长笛演奏，听起来不一样，这主要是因为什么不同？',
        ['音色', '音高', '时值', '速度'],
        0,
        '音高相同时，不同乐器的声音特质仍然不同，这就是音色。',
      ),
      question(
        'core-l0-q10',
        'pf',
        '刚开始学，哪种练习安排更合适？',
        ['每天 10–15 分钟，持续进行', '一周只练一次，每次三小时', '等有空时一次练很久', '只看不练，等全部学完再动手'],
        0,
        '短时、规律、每天都练，比偶尔一次练很久更容易形成稳定的进步。',
      ),
    ],
  },
  {
    id: 'core-l1',
    line: 'core',
    stage: 1,
    title: 'L1 入门 · 阶段测验',
    questions: [
      question(
        'core-l1-q1',
        'rh',
        '以四分音符为一拍时，一个全音符持续几拍？',
        ['四拍', '两拍', '一拍', '半拍'],
        0,
        '全音符等于两个二分音符，也等于四个四分音符，所以持续四拍。',
      ),
      question(
        'core-l1-q2',
        'rh',
        '3/4 拍表示什么？',
        ['以四分音符为一拍，每小节三拍', '以三分音符为一拍，每小节四拍', '每小节四拍，第三拍最强', '每分钟 34 拍'],
        0,
        '拍号下方的数字表示以几分音符为一拍，上方的数字表示每小节几拍。',
      ),
      question(
        'core-l1-q3',
        'nt',
        '简谱中，数字下方加一个点表示什么？',
        ['降低一个八度', '升高一个八度', '延长一拍', '休止一拍'],
        0,
        '简谱用数字上方的点表示高八度，下方的点表示低八度。',
      ),
      question(
        'core-l1-q4',
        'nt',
        '以四分音符为一拍时，简谱“5 -”（5 后面跟一条短横线）持续几拍？',
        ['两拍', '一拍', '半拍', '三拍'],
        0,
        '数字后面的短横线是增时线，每条延长一拍。5 本身一拍，加一条增时线共两拍。',
      ),
      question(
        'core-l1-q5',
        'nt',
        '高音谱表中，从下往上数的第二线是什么音？',
        ['G4', 'E4', 'B4', 'F4'],
        0,
        '高音谱表五条线从下往上是 E4、G4、B4、D5、F5。高音谱号也叫 G 谱号，它的螺旋正绕在第二线 G4 上。',
      ),
      question(
        'core-l1-q6',
        'th',
        '大调音阶相邻两音的距离依次是？',
        ['全全半全全全半', '全半全全半全全', '半全全全半全全', '全全全半全全半'],
        0,
        '以 C 大调为例：C–D 全、D–E 全、E–F 半、F–G 全、G–A 全、A–B 全、B–C 半。',
      ),
      question(
        'core-l1-q7',
        'th',
        'G 大调的调号是哪一个升号？',
        ['F♯', 'C♯', 'G♯', 'B♯'],
        0,
        '从 G 按“全全半全全全半”排列，第七个音必须升高为 F♯，所以 G 大调有一个升号 F♯。',
      ),
      question(
        'core-l1-q8',
        'th',
        'F 大调的调号是哪一个降号？',
        ['B♭', 'E♭', 'F♭', 'A♭'],
        0,
        '从 F 开始，第三音 A 到第四音必须是半音，所以第四音是 B♭。',
      ),
      question(
        'core-l1-q9',
        'th',
        '从 C 向上到 F 是几度？',
        ['四度', '三度', '五度', '六度'],
        0,
        '度数按音名字母数：C、D、E、F 共四个字母，所以是四度。',
      ),
      question(
        'core-l1-q10',
        'th',
        'A 小三和弦由哪三个音组成？',
        ['A C E', 'A C♯ E', 'A D E', 'A C F'],
        0,
        '小三和弦根音到三音是小三度。A 到 C 是小三度，C 到 E 是大三度，组成 A C E。A C♯ E 是 A 大三和弦。',
      ),
      question(
        'core-l1-q11',
        'th',
        '在 C 大调中，属和弦（V）由哪三个音组成？',
        ['G B D', 'F A C', 'C E G', 'D F A'],
        0,
        'C 大调第五级是 G，从 G 向上叠三度得到 G B D。F A C 是下属和弦（IV），C E G 是主和弦（I）。',
      ),
      question(
        'core-l1-q12',
        'ea',
        '用首调唱名时，1=G 表示什么？',
        ['G 唱作 do', 'G 唱作 sol', 'do 永远是 C', '每个音都升高一个八度'],
        0,
        '首调唱名让 do 跟着调的主音移动。1=G 时，G 唱 do，A 唱 re，B 唱 mi。固定调唱名则始终把 C 唱作 do。',
      ),
    ],
  },
];
export const findStageTest = (id: string) => stageTests.find(test => test.id === id);
export const passMark = (test: StageTest) => Math.ceil(test.questions.length * PASS_RATE);
