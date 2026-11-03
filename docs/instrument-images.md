# 中国传统乐器配图

v0.3.1 为 84 个传统乐器条目补充配图：64 张实物照片、2 幅历史图像、18 幅原创 SVG 结构示意。图鉴、课程首页及课文共用同一套素材；课程中的图片支持放大查看。图片和完整署名页随网页及 Windows 免安装包分发，无需联网加载。

## 素材与授权

- 权威清单：[`public/instruments/credits.json`](../public/instruments/credits.json)。逐项记录作者、原始文件名、来源页面、授权名称和链接、图片种类、说明、尺寸及下载地址。
- 面向用户的完整署名页：[`public/image-credits.html`](../public/image-credits.html)。在线与离线都可查看，图源链接需联网打开。
- 第三方图片取自 Wikimedia Commons 中明确标注 CC0、公共领域、CC BY 或 CC BY-SA 的条目；包含博物馆藏品照、演奏现场及实物照片。使用来源提供的预览版本，不改动图片主体；页面使用 `object-fit: contain` 等比展示。
- 第三方图片沿用各自授权。项目代码的 MIT 许可证不替代图片许可证。再次分发时应保留图片清单和署名页。
- 未确认可复用照片或形制对应关系的条目使用项目原创矢量图，并清楚标注“外形示意”。示意图不是实物照片，不提供准确比例、指孔、弦数、尺寸或演奏姿势依据。

## 形制与说明

篪、竽使用《古今图书集成》的历史图像。现代箜篌、改良艾捷克、火不思、唐代排箫复原品及出土筑等均在图注中区分现代形制、复原品与文物现状。独弦琴采用越南馆藏 Đàn bầu 相关形制，图注说明地域关系，避免把照片来源误写为中国京族馆藏。每幅照片仅代表一种形制。

18 幅原创结构示意：侗族琵琶、萨塔尔、侗族牛腿琴、轧筝、葫芦笙、芒筒、羌笛、侗笛、巴拉曼、锣、钹、排鼓、达卜、渔鼓、碰铃、纳格拉、拨浪鼓、木鼓。

结构说明参照各条目已有课程资料，主要包括：

- [香港康文署音乐事务处：侗族音乐](https://www.lcsd.gov.hk/tc/mo/activities/communityprogrammes/roving_exhibition_kam.html)
- [上海音乐学院：丝绸之路上的复合簧管乐器](https://zgysyyw.shcmusic.edu.cn/ysyyen/2018/1229/c1283a17923/pagem.htm)
- [上海音乐学院：弓弦齐特类乐器的形制研究](https://zgysyyw.shcmusic.edu.cn/2026/0219/c2930a60423/page.htm)
- [中国非物质文化遗产网：羌笛溯源](https://www.ihchina.cn/project_details/11390/)
- [喀什地区政府：维吾尔族乐器](https://www.kashi.gov.cn/ksdqxzgs/c106706/202101/e139eacaa03143d48eae5847e0e1e839.shtml)
- [云南非遗：木鼓](https://www.ynich.cn/item/137.html)

## 维护

1. 将经核对的素材放入 `public/instruments/`，更新 `credits.json`；不要把图源不明、外形存疑或仅允许站内浏览的照片当作可再分发素材。
2. 修改原创矢量图时运行 `python scripts/draw-instrument-diagrams.py`。
3. 运行 `node scripts/sync-instrument-images.mjs`，同步前端数据和离线署名页。
4. 运行 `npm test`、`npm run build`，并检查桌面、手机及图片放大。图片完整性测试会检查所有课程的本地文件、署名和生成数据是否一致。

发布打包时验证所有素材存在；Windows 启动器烟雾测试会逐张请求署名账本中的全部图片，核对响应字节与图片 MIME 类型。

## v0.4.0 世界乐器扩展

新增 54 幅原创 SVG 外形示意：50 种世界乐器和革胡、京二胡、柷、敔。与原有配图合计 138 幅：64 张实物照片、2 幅历史图像、72 幅结构示意。新增图不冒充实物照片，部件为代表外形，不能作为精确弦数、尺寸、持奏和指法依据。原有常见乐器保留页面内矢量插画。

生成器：`node --experimental-strip-types scripts/draw-world-diagrams.mjs`；再执行 `node scripts/sync-instrument-images.mjs` 同步显示信息与署名页。生成器与原图均以项目 MIT 许可提供；不影响第三方照片原有许可。

## v0.5.0 选学扩展

再增42幅世界乐器及12幅中国地方乐器原创SVG，合计192幅外部素材（64照片、2历史图、126原创示意），另8种原有常见乐器使用页面内矢量插画。世界扩展图由 draw-world-diagrams.mjs 生成，新增中国图由 draw-additional-chinese.mjs 生成；后者的账本合并用 sync-additional-chinese-images.mjs，最终运行 sync-instrument-images.mjs。

## 真实照片替换（v0.5.1 之后）

原有126幅原创SVG示意图和8种常见乐器的页面插画，改为 Wikimedia Commons 上授权明确的真实照片：共118种，其中111张实物照片、7幅历史图像（老照片、砖雕等）。现在200个配图条目为177张实物照片、7幅历史图像、16幅原创示意。

- 候选图来自对应维基百科条目的首图，或 Commons 关键词与分类检索；只接受 CC0、公共领域、CC BY、CC BY-SA 授权的位图，并逐张人工目视核对确为该乐器。
- 统一缩放到最长边960像素、JPEG 质量82；`credits.json` 记录作者、原始文件、授权与下载地址。
- 5种图片是同类但不同形制的乐器（葫芦笙、轧筝、巴拉曼、纳格拉、达卜），图注写明“同类乐器实物，并非同一形制”及照片的实际来源。
- 仍为示意图的16种：牛腿琴、芒筒、侗笛、渔鼓、马骨胡、大广弦、大筒、姊妹箫、唎咧、京西太平鼓、吐良、灼吧、黎族鼻箫、佤族木鼓、排鼓、革胡。Commons 上找不到可再分发且能确认形制的照片；有合适授权照片时，按上文“维护”步骤替换即可。
- 三个示意图生成脚本只处理 `kind` 仍为 `diagram` 的条目，重新运行不会覆盖已替换的照片。
- `src/instrument-images.ts` 由 `sync-instrument-images.mjs` 生成，为减小页面脚本体积省略了下载地址并合并重复说明；完整信息以 `credits.json` 为准。
