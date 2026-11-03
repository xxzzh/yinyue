# 音色、特性与选学说明

v0.5.0为全站200种乐器提供逐件资料，分为典型音色、发声成因、表现特色、起步难点和准备条件。音色是代表形制的编辑性听赏描述，不是艺术价值或学习能力排名。原声钢琴与可戴耳机的数码钢琴区分；没有把弱奏的原声乐器描述成完全静音。古代复原条目明确形制和资料限制。

“选适合的乐器”支持声音条件、空间、便携性、起步方式、类别、图鉴与音色标签交集筛选；每次最多比较三件。基础发声较直接不代表容易精通；乐器获取描述为一般参考，未提供实时价格或库存。

## 真实录音

16条实录来自[Versilian Studios VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE)，原仓库明确[CC0 1.0](https://github.com/sgossner/VSCO-2-CE/blob/master/LICENSE)。保留原始文件路径与固定版本，最多取5秒，转为单声道并淡出末尾，再用 ffmpeg 编码为128kbps MP3（体积约为PCM的五分之一），未变调。小提琴等为独奏，中提琴和大提琴采用声部合奏采样，均在播放器标签中明确。音高、人数、力度和录音位置不一致，不能单凭响度或单一片段判断乐器本质。

文件与来源在public/audio/credits.json，完整授权在public/audio/LICENSE-VSCO-CC0.txt；离线署名页audio-credits.html。scripts/sync-real-audio.py从固定来源重建（需要 PATH 中有 ffmpeg），--cached只校验与同步已有文件。构建打包、完整性测试与免安装启动检查均核对实际音频字节与MIME。

未收录实录的条目显示明确提示和课程来源入口，不用现有合成参考音替代。中国乐器提供[CTIS官方介绍与部分示范](https://ccmusic-database.github.io/database/ctis.html)入口。CTIS官方数据卡标明[CC BY-NC-ND 4.0](https://huggingface.co/datasets/ccmusic-database/CTIS)，未将其下载、剪裁或混入MIT发布包。Philharmonia采样许可禁止原样作为采样分发，亦未打包。

## 资料与维护

原有国乐的结构及来源位于traditional-catalog.ts；新增地方条目及专门来源位于additional-chinese-catalog.ts。世界条目位于world-catalog.ts和additional-world-catalog.ts。音色文字与实际条件分别位于chinese-selection-profiles.ts、world-selection-profiles.ts及两份扩展数据中；合并后必须与所有非乐理课程一一对应，不能出现缺失乐器的通用兜底介绍。

主要资料包括雅马哈乐器构造指南、Philharmonia演奏家介绍、大都会及亚洲艺术博物馆、UNESCO、香港康文署、海南热带海洋学院博物馆及地方非遗资料。声学综述强调振动源、泛音/噪声、起音衰减与共鸣，而非仅用材料或大小推断音色。具体资料链接随课程保留。

## 使用说明与演奏指南

每件乐器的特色区块下方有“使用说明与演奏指南”，按以下顺序最多列出四条外部资料：

1. 厂商或教学机构的演奏指南：Fender 贝斯使用手册、尤克里里调弦，Yamaha 乐器指南（钢琴、吉他、管乐、定音鼓等20种）的演奏方法页。
2. 课程原有的、针对该乐器的机构资料（博物馆、非遗名录、乐团介绍等）；大都会艺术博物馆的“世界乐器馆藏”总页等泛泛入口不再重复列出。
3. 维基百科条目（优先中文，没有中文条目时使用英文），用于了解构造与演奏方法。

数据在 `src/instrument-guides.ts`。条目标题经 MediaWiki API 解析，排除消歧义页；所有链接在加入时逐一确认可访问。8种没有可靠条目的地方乐器只显示课程原有的机构资料。维基百科在部分网络环境下可能无法打开，页面已提示。
