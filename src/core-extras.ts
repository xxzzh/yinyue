// Extra questions (and settings) for the eight original main-line lessons (theory-1–4, ear-1–4), which live
// with the catalog courses. Kept apart from core-lessons.ts so the catalog chunk does not load the main line.
import type { Lesson } from './data.ts';
import { q } from './lesson-kit.ts';

/** Extra questions (and settings) for the eight original main-line lessons. */
export const coreLessonExtras: Record<string, Partial<Lesson>> = {
  'theory-1': {
    more: [
      q('从 C 开始往上数，第五个音名是？', ['F', 'G', 'A', 'E'], 1, 'C D E F G，第五个是 G。'),
      q('B 之后的下一个音名是？', ['H', 'A', 'C', 'D'], 2, '音名按 C D E F G A B 循环，B 之后回到更高的 C。'),
    ],
  },
  'theory-2': {
    more: [
      q(
        '以四分音符为一拍，全音符持续几拍？',
        ['一拍', '两拍', '三拍', '四拍'],
        3,
        '全音符等于两个二分音符、四个四分音符，持续四拍。',
      ),
      q(
        '60 BPM 时，一个二分音符大约持续多久？',
        ['半秒', '一秒', '两秒', '四秒'],
        2,
        '60 BPM 每拍约一秒，二分音符两拍，约两秒。',
      ),
    ],
  },
  'theory-3': {
    more: [
      q(
        '大调音阶第三到第四个音之间是？',
        ['全音', '半音', '三个半音', '八度'],
        1,
        '“全全半全全全半”的第三个距离是半音，例如 E–F。',
      ),
      q('C 大调音阶用到几个黑键？', ['0 个', '1 个', '2 个', '5 个'], 0, 'C 大调由 C D E F G A B 构成，全部是白键。'),
    ],
  },
  'theory-4': {
    more: [
      q('G 大三和弦由哪三个音组成？', ['G B D', 'G B♭ D', 'G C E', 'G A B'], 0, '从 G 往上大三度到 B，再小三度到 D。'),
      q(
        '把 C 大三和弦的 E 降低半音，得到？',
        ['C 小三和弦', 'F 大三和弦', 'C 增三和弦', 'G 大三和弦'],
        0,
        'C E♭ G 是 C 小三和弦。',
      ),
    ],
  },
  'ear-1': {
    more: [
      q('听这两个音，第二个音比第一个？', ['更高', '更低', '一样高'], 1, '从 G 到 C，第二个音更低。', 'G4:1.5 C4:1.5'),
      q(
        '听这两个音，第二个音比第一个？',
        ['更高', '更低', '一样高'],
        0,
        '第二个音更轻，但音更高。音量和音高是两回事。',
        'f E4:1.5 p B4:1.5',
      ),
    ],
  },
  'ear-2': {
    intervals: ['2M', '3m', '3M', '4P', '5P', '8P'],
    more: [
      q('C 到 E♭ 是什么音程？', ['大二度', '小三度', '大三度', '纯四度'], 1, 'C 到 E♭ 相距 3 个半音，是小三度。'),
      q('纯四度相距几个半音？', ['3 个', '4 个', '5 个', '7 个'], 2, '例如 C 到 F，相距 5 个半音。'),
    ],
  },
  'ear-3': {
    more: [
      q(
        '关掉节拍器继续拍时，最容易出现什么问题？',
        ['音变高', '不知不觉加快或减慢', '拍号改变', '声音变响'],
        1,
        '没有参照时拍子容易漂移，所以要再打开节拍器检查。',
      ),
      q(
        '拍速检测里的“均匀程度”反映什么？',
        ['拍击的音量', '每次拍击的间隔是否一致', '音高是否准确', '拍了多少次'],
        1,
        '间隔越一致，均匀程度越高，说明拍子越稳。',
      ),
    ],
  },
  'ear-4': {
    more: [
      q('在 C 大调中，fa 对应哪个音名？', ['E', 'F', 'G', 'A'], 1, 'do re mi fa 对应 C D E F。'),
      q(
        '跟唱时音太高唱不上去，应该？',
        ['用力喊上去', '换到低一个八度唱', '跳过这个音', '停止练习'],
        1,
        '可以比示范低一个八度跟唱，音名和唱名不变。',
      ),
    ],
  },
};
