export type Track = 'theory' | 'ear' | 'piano' | 'guitar';
export type Widget = 'score' | 'scale' | 'interval' | 'rhythm' | 'piano' | 'guitar' | 'chord' | 'sing';
export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  intro: string;
  sections: { title: string; body: string }[];
  takeaway: string;
  widget: Widget;
  quiz: { question: string; options: string[]; answer: number; explanation: string };
}
export interface Course {
  id: Track;
  title: string;
  english: string;
  description: string;
  tag: string;
  color: string;
  lessons: Lesson[];
}

export const courses: Course[] = [
  {
    id: 'theory', title: '读懂音乐的语言', english: 'MUSIC THEORY',
    description: '音符、节奏与和弦，把听到的美好变成看得懂的语言。', tag: '乐理基础', color: 'sage',
    lessons: [
      {
        id: 'theory-1', title: '从七个音名开始', minutes: 6,
        intro: '旋律看似千变万化，却可以从 C、D、E、F、G、A、B 这七个音名开始理解。',
        sections: [
          { title: '音名，是音符的名字', body: '按从低到高的顺序，七个基本音名是 C D E F G A B，之后再次回到 C。后一组的 C 更高，它们相隔一个八度。音名使用字母，是为了让不同乐器之间也能准确交流。' },
          { title: '先在键盘上找到 C', body: '观察黑键：它们以两个一组、三个一组交替出现。两个黑键左边紧挨着的白键就是 C。中央 C 通常标记为 C4；字母后的数字用来区分八度。点击下方键盘，听一听 C4 到 C5。' },
        ], takeaway: '先记住“两个黑键左边是 C”，再从 C 向右数七个音名。', widget: 'piano',
        quiz: { question: '键盘上，两个黑键左边紧挨着的白键是什么音？', options: ['C', 'D', 'F', 'A'], answer: 0, explanation: '两个黑键组成一组，其左侧白键是 C；三个黑键左侧的白键是 F。' },
      },
      {
        id: 'theory-2', title: '让音符有长有短', minutes: 7,
        intro: '节奏不仅告诉你弹什么，还告诉你何时开始、持续多久。',
        sections: [
          { title: '用稳定的拍子作参照', body: '在以四分音符为一拍的练习中，四分音符持续一拍，二分音符持续两拍，全音符持续四拍；两个八分音符平分一拍。这里的“一拍”取决于拍号，并不是固定一秒。' },
          { title: '先数拍，再拍手', body: '把节拍器设为 60 BPM，每分钟会响 60 拍。跟着它数“1、2、3、4”，先每拍拍一次手，再尝试一拍内均匀拍两次。4/4 拍表示每小节四拍，以四分音符为一拍。' },
        ], takeaway: 'BPM 决定拍子的速度；音符时值表示音符与拍子的关系。', widget: 'rhythm',
        quiz: { question: '在四分音符为一拍时，一个二分音符持续几拍？', options: ['半拍', '一拍', '两拍', '四拍'], answer: 2, explanation: '二分音符等于两个四分音符，所以在这个参照下持续两拍。' },
      },
      {
        id: 'theory-3', title: '听见 C 大调的阶梯', minutes: 8,
        intro: '从 C 出发，依次弹到下一个 C，你就走过了一条 C 大调音阶。',
        sections: [
          { title: '音阶有自己的步幅', body: 'C 大调由 C D E F G A B 构成。相邻两音的距离依次是：全、全、半、全、全、全、半。一个全音等于两个半音；在钢琴上，相邻的两个键（包含黑键）之间是一个半音。' },
          { title: '为什么 E 到 F 特别近', body: 'E 和 F 之间、B 和 C 之间没有黑键，所以它们之间是半音。C 到 D 中间隔着一个黑键，因此是全音。大调音阶的这种距离排列也能从其他音开始构建。' },
        ], takeaway: '大调音阶的距离排列是“全全半全全全半”。', widget: 'scale',
        quiz: { question: '下面哪一对音之间是半音？', options: ['C–D', 'D–E', 'E–F', 'F–G'], answer: 2, explanation: 'E 与 F 在键盘上紧挨着，中间没有其他键，因此相距半音。' },
      },
      {
        id: 'theory-4', title: '把三个音叠成和弦', minutes: 8,
        intro: '当音符同时响起，音乐就有了新的色彩。先认识最常用的 C 大三和弦。',
        sections: [
          { title: '从根音向上叠三度', body: 'C 大三和弦由 C、E、G 三个音组成。在 C 大调音阶里，它们分别是第 1、3、5 级。根音 C 到 E 是大三度，E 到 G 是小三度。把三个音同时按下，听听它和单音的不同。' },
          { title: '大与小，差一个半音', body: '把 C 大三和弦里的 E 降低半音，得到 C、E♭、G，就是 C 小三和弦。大小三和弦最关键的差别是三音：根音到三音是大三度还是小三度。' },
        ], takeaway: 'C 大三和弦 = C E G；C 小三和弦 = C E♭ G。', widget: 'chord',
        quiz: { question: 'C 大三和弦由哪三个音构成？', options: ['C D E', 'C E G', 'C F A', 'D F A'], answer: 1, explanation: 'C、E、G 是以 C 为根音叠置三度得到的大三和弦。' },
      },
    ],
  },
  {
    id: 'ear', title: '让耳朵先学会', english: 'EAR & RHYTHM',
    description: '听辨音程、感受节拍，让耳朵成为可靠的音乐伙伴。', tag: '视唱练耳', color: 'peach',
    lessons: [
      {
        id: 'ear-1', title: '听见音高的方向', minutes: 5, intro: '先不急着说出音名。听清第二个音比第一个高还是低，就是很好的开始。',
        sections: [
          { title: '高低与响轻不同', body: '音高描述声音的高低，音量描述声音的强弱。一个很轻的音也可以很高。练习时保持音量大致相同，把注意力放在两音的方向。' },
          { title: '用声音画一条线', body: '听 C4 再听 G4，想象线条向上；反过来则向下。也可以用“呜”轻轻模仿两个音，不必用力或追求很大的音域。不舒服时暂停，选择适合自己的八度。' },
        ], takeaway: '先听方向，再学习两音之间有多远。', widget: 'interval',
        quiz: { question: '先听 C4，再听 G4，音高的方向是什么？', options: ['向上', '向下', '不变', '音量变大'], answer: 0, explanation: 'G4 高于 C4，因此是上行；音名与八度告诉我们音高，不能据此判断音量。' },
      },
      {
        id: 'ear-2', title: '认识音程的距离', minutes: 8, intro: '两音之间的音高距离叫音程。试着分辨大二度、大三度、纯五度与纯八度。',
        sections: [
          { title: '从四种常见距离开始', body: 'C 到 D 是大二度（2 个半音）；C 到 E 是大三度（4 个半音）；C 到 G 是纯五度（7 个半音）；C 到高一个八度的 C 是纯八度（12 个半音）。' },
          { title: '听完再选择，允许多听几次', body: '先播放题目，在脑中保留第一个音，再听第二个音的距离。听音练习会变化起始音，帮助你学习距离，而不是只记住某两个固定音。答错后对照解释，再听一次。' },
        ], takeaway: '从少量音程开始，听熟之后再增加种类。', widget: 'interval',
        quiz: { question: 'C 到 G 是什么音程？', options: ['大二度', '大三度', '纯五度', '纯八度'], answer: 2, explanation: '从 C 向上到 G 跨五个音名字母，并相距 7 个半音，是纯五度。' },
      },
      {
        id: 'ear-3', title: '把节拍放在心里', minutes: 6, intro: '稳定比速度更重要。从一个舒服的速度开始，把每一次拍击放在同一条时间线上。',
        sections: [
          { title: '跟随，再独立', body: '打开 60 BPM 的节拍器，每响一次就轻拍一次桌面。熟悉后关闭节拍器，继续拍击，再重新打开，检查自己是否加速或减速。' },
          { title: '试试拍速检测', body: '在练习室连续点击“跟着拍”至少五次，系统会根据拍击间隔估算你的速度，并与目标速度比较。这只是节奏稳定性的辅助观察，不是完整的演奏评分。' },
        ], takeaway: '练习速度保持舒适，先稳定，再慢慢加快。', widget: 'rhythm',
        quiz: { question: '60 BPM 表示什么？', options: ['每分钟 60 拍', '每小节 60 拍', '每秒 60 拍', '每首曲子 60 拍'], answer: 0, explanation: 'BPM 是每分钟的拍数，60 BPM 对应平均每秒一拍。' },
      },
      {
        id: 'ear-4', title: '跟唱你的第一条音阶', minutes: 7, intro: '先听，再轻轻跟唱。让音名、唱名与听觉慢慢建立联系。',
        sections: [
          { title: '在 C 大调里唱 do re mi', body: '这节练习使用 C 大调，C D E F G A B 对应 do re mi fa sol la si。先播放一个音并轻唱，再尝试连续唱三个音：do、re、mi。' },
          { title: '用舒服的音域学习', body: '你可以比示范高或低一个八度跟唱。听觉练习不要求模仿音色或音量；声音感到紧张时停止。下方提供参考音与音阶示范，本版不录音，也不会自动评判你的歌声。' },
        ], takeaway: '听一个、唱一个；熟悉之后，再连成一句。', widget: 'sing',
        quiz: { question: '在本节的 C 大调练习中，mi 对应哪个音名？', options: ['C', 'D', 'E', 'F'], answer: 2, explanation: '本节使用 C 大调：do=C，re=D，mi=E。' },
      },
    ],
  },
  {
    id: 'piano', title: '指尖的第一段旋律', english: 'PIANO ESSENTIALS',
    description: '认识键盘、读谱与简单旋律，让指尖与声音相遇。', tag: '钢琴入门', color: 'lavender',
    lessons: [
      {
        id: 'piano-1', title: '找到键盘上的中央 C', minutes: 6, intro: '不需要先拥有钢琴。用屏幕键盘，你也能开始认识键盘的规律。',
        sections: [
          { title: '黑键给你方向', body: '两个黑键左边是 C，三个黑键左边是 F。在标准 88 键钢琴上，中央 C 位于键盘中部偏左，记为 C4。屏幕键盘从 C4 开始，先把 C、D、E 依次弹一遍。' },
          { title: '试试电脑键盘', body: 'A S D F G H J K 对应 C4 D4 E4 F4 G4 A4 B4 C5；W E T Y U 对应其中的黑键。也可以直接点击或触摸琴键。若有 MIDI 键盘，可在练习室尝试连接。' },
        ], takeaway: '先熟悉位置，再追求速度。', widget: 'piano',
        quiz: { question: '音名 C4 中的数字 4 用来表示什么？', options: ['第四根手指', '第四小节', '所在八度', '四拍时值'], answer: 2, explanation: '音名后的数字用于区分八度，C4 表示中央 C。' },
      },
      {
        id: 'piano-2', title: '用白键走过 C 大调', minutes: 8, intro: '一条音阶，可以帮你把零散的音符连起来。',
        sections: [
          { title: '慢慢走过八个音', body: '依次弹 C4 D4 E4 F4 G4 A4 B4 C5，再反向弹回来。刚开始可以用一根手指找音，熟悉之后再在实体钢琴上学习规范指法。' },
          { title: '实体钢琴上的右手指法', body: '常见的右手 C 大调上行指法是 1、2、3、1、2、3、4、5，数字 1 表示拇指。E 后由拇指转到 F；动作保持放松，避免把手腕扭成夸张角度。屏幕点击只帮助认音，不能替代实体手型指导。' },
        ], takeaway: '音名、声音、键位一起记；手型和触键还需要在实体乐器上练习。', widget: 'scale',
        quiz: { question: 'C 大调音阶需要使用哪些黑键？', options: ['C♯ 和 F♯', '所有黑键', '只用 F♯', '不需要黑键'], answer: 3, explanation: 'C 大调音阶由 C D E F G A B 构成，都位于白键。' },
      },
      {
        id: 'piano-3', title: '从五线谱读出声音', minutes: 8, intro: '五线谱用音符的上下位置表示音高。先看一段你已经听熟的音阶。',
        sections: [
          { title: '线与间都能放音符', body: '五线谱有五条线和四个间。高音谱号下，从下往上五条线的音分别是 E4、G4、B4、D5、F5。中央 C 位于下加一线上。读谱时先找到一个熟悉的参照音。' },
          { title: '边看边听', body: '下方谱例是 C 大调上行音阶。注意音符如何逐级上升，播放时用眼睛跟随谱面。这里的每个四分音符持续一拍，每小节有四拍。' },
        ], takeaway: '音符越高，声音通常也越高；先建立位置与声音的对应。', widget: 'score',
        quiz: { question: '在高音谱号中，中央 C 位于哪里？', options: ['第三线上', '下加一线上', '第五线上', '第二间'], answer: 1, explanation: '高音谱号下，中央 C（C4）位于五线谱下方的第一条加线上。' },
      },
      {
        id: 'piano-4', title: '弹出《小星星》的开头', minutes: 8, intro: '从七个熟悉的音开始，把练习变成一段真正的旋律。',
        sections: [
          { title: '先记住这句旋律', body: '《小星星》的开头可以用 C C G G A A G 来演奏。先听示范，再把每个音对应到键盘。最后一个 G 可以比前面的音保持更久。' },
          { title: '先认准，再连贯', body: '在练习室切换到“旋律跟弹”，按照提示依次弹奏。系统只核对音高，不评分节奏。等位置熟悉以后，再配合慢速节拍器，把音符连接起来。' },
        ], takeaway: '完整、放松地弹完一句，比匆忙弹得很快更有意义。', widget: 'piano',
        quiz: { question: '本节旋律 C C G G A A G 的最后一个音是什么？', options: ['C', 'E', 'G', 'A'], answer: 2, explanation: '这句旋律的最后一个音是 G。' },
      },
    ],
  },
  {
    id: 'guitar', title: '六根弦，无限可能', english: 'GUITAR FOUNDATIONS',
    description: '从空弦到第一个和弦，慢慢找到属于自己的声音。', tag: '吉他入门', color: 'sand',
    lessons: [
      {
        id: 'guitar-1', title: '认识六根空弦', minutes: 6, intro: '吉他的音高从六根弦开始。我们使用最常见的标准调弦。',
        sections: [
          { title: '从粗到细：E A D G B E', body: '标准调弦从最粗的第 6 弦到最细的第 1 弦，空弦音依次是 E2、A2、D3、G3、B3、E4。两根 E 弦的音名相同，但相隔两个八度。' },
          { title: '先听参考音', body: '点击指板最左侧的空弦位置，分别听六根弦的参考音。屏幕发声是合成的参考音色。本版不使用麦克风自动调音；实体吉他可配合独立调音器调整。' },
        ], takeaway: '记住从第 6 弦到第 1 弦：E A D G B E。', widget: 'guitar',
        quiz: { question: '标准调弦中，最粗的第 6 弦空弦音是什么？', options: ['E2', 'A2', 'B3', 'E4'], answer: 0, explanation: '第 6 弦是最粗、音最低的弦，标准调弦空弦音为 E2。' },
      },
      {
        id: 'guitar-2', title: '在指板上找到音符', minutes: 8, intro: '每向琴桥方向移动一品，音高就升高一个半音。',
        sections: [
          { title: '一品，就是一个半音', body: '第 6 弦空弦是 E2，第 1 品是 F2，第 2 品是 F♯2，第 3 品是 G2。每一根弦都遵循相同的半音递进规律。' },
          { title: '同一个音可以有多个位置', body: '第 6 弦第 5 品是 A2，与第 5 弦空弦同音。试着点击这两个位置并比较。在实体吉他上，按弦手指应靠近品丝但不压在品丝上，以清晰发声为目标。' },
        ], takeaway: '用空弦音作起点，每前进一品就升高一个半音。', widget: 'guitar',
        quiz: { question: '第 6 弦空弦是 E，第 1 品是什么音？', options: ['E♭', 'F', 'F♯', 'G'], answer: 1, explanation: 'E 到 F 是半音，所以 E 弦第 1 品是 F。' },
      },
      {
        id: 'guitar-3', title: '按下第一个开放和弦', minutes: 9, intro: '从 Am 开始，认识和弦图，再试试 C、G、D 与 Em。',
        sections: [
          { title: '怎样看和弦图', body: '竖线表示六根弦，从左到右由粗到细；横线表示品丝。圆点表示要按的位置，○ 表示空弦可弹，× 表示不要弹这根弦。图中数字标记品位。' },
          { title: 'Am 的常用按法', body: '第 2 弦第 1 品、第 4 弦第 2 品、第 3 弦第 2 品按住；第 5 弦与第 1 弦弹空弦，第 6 弦不弹。先逐根检查声音，再轻轻扫过可弹的五根弦。' },
        ], takeaway: '看懂 ○ 与 ×，比一开始就追求和弦转换速度更重要。', widget: 'guitar',
        quiz: { question: '和弦图上方的 × 表示什么？', options: ['弹空弦', '用力弹', '这根弦不要弹', '升高半音'], answer: 2, explanation: '× 表示这根弦不参与当前和弦；○ 表示使用空弦。' },
      },
      {
        id: 'guitar-4', title: '让和弦跟上节拍', minutes: 8, intro: '两个和弦，也能组成一段音乐。先试试 Am 与 C。',
        sections: [
          { title: '先转换，再扫弦', body: '先在没有节拍器时慢慢转换 Am 与 C。比较这两个和弦中保持不动的手指，减少不必要的动作。每个和弦先逐弦检查，再整体扫弦。' },
          { title: '从每拍一次下扫开始', body: '打开 60 BPM 节拍器，每拍下扫一次，一个和弦保持四拍，再转换到下一个。若来不及转换，继续降低速度。这里先学习均匀的下扫，复杂的切分节奏留到之后。' },
        ], takeaway: '先让和弦清晰、拍子稳定，再增加扫弦花样。', widget: 'rhythm',
        quiz: { question: '初学和弦转换来不及跟上节拍时，优先怎么做？', options: ['继续加速', '降低速度，保证动作与发声', '每次都跳过一拍', '只用更大力度'], answer: 1, explanation: '降低速度能留出检查动作和发声的时间，先建立稳定、清晰的转换。' },
      },
    ],
  },
];

export const allLessons = courses.flatMap(course => course.lessons);
export const findCourse = (id: string) => courses.find(course => course.id === id);
export const findLesson = (id: string) => allLessons.find(lesson => lesson.id === id);
export const lessonCourse = (id: string) => courses.find(course => course.lessons.some(lesson => lesson.id === id));
