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

发布打包时验证所有素材存在；Windows 启动器烟雾测试会逐张请求 84 幅图片，核对响应字节与图片 MIME 类型。
