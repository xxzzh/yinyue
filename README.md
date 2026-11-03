# 音序 · 音乐学习空间

**在线使用：[打开音序](https://xxzzh.github.io/yinyue/)，无需注册或登录。**

**下载使用：[GitHub Releases](https://github.com/xxzzh/yinyue/releases/latest)**。Windows 用户请选择名称含 `windows-x64.zip` 的免安装包，解压后双击 `start.bat`，无需安装 Node.js。

源码仓库：[xxzzh/yinyue](https://github.com/xxzzh/yinyue)。源码、版本发布和公开网页均托管在 GitHub；使用网站不需要 ChatGPT 账号。

中文音乐学习网站。包含乐理、视唱练耳、常见乐器及中国传统乐器专区，共 202 条学习路线、618 节原创基础与启蒙课。

常见乐器包括钢琴、吉他、尤克里里、电贝斯、小提琴、架子鼓、长笛与中音萨克斯。独立的 [中国传统乐器专区](https://xxzzh.github.io/yinyue/#/traditional) 收录 100 种代表乐器、302 节课程，涵盖常见民乐、地方与民族乐器及部分历史形制，可按类别、地域、中文名、拼音、别名与相关形制查找。详见 [收录范围与学习说明](docs/traditional-instruments.md)。

[世界乐器专区](https://xxzzh.github.io/yinyue/#/world) 收录 100 种乐器、308 节课程，覆盖管弦乐、键盘、打击乐及东亚、南亚、西亚、非洲、美洲等代表传统，支持类别、地域和中英文别名搜索。新增路线是认识与启蒙内容；已内置16种乐器的真实录音节选，其余提供音色说明和外部资料入口。详见 [世界乐器收录说明](docs/world-instruments.md)。

[选适合的乐器](https://xxzzh.github.io/yinyue/#/choose)：200种乐器逐件提供典型音色、发声原因、表现特色、入门难点与准备条件。支持按音色、声音条件、便携性、入门方式筛选，最多三件并排比较；16种乐器可播放CC0真实录音，随离线包提供。详见[音色与选学说明](docs/instrument-selection.md)。

## 本地运行（开发者）

需要 Node.js 22.18+ 或 Node.js 24。

```sh
git clone https://github.com/xxzzh/yinyue.git
cd yinyue
npm ci
npm run dev
```

打开终端显示的 `http://127.0.0.1:5173/`。

```powershell
npm test
npm run test:server
npm run build
npm run preview -- --port 4173
```

正式构建输出在 `dist/`，可部署到静态托管服务。所有路由使用 URL hash，深链接不要求服务器 rewrite。

## 使用 Release 压缩包

普通 Windows 用户下载 `yinxu-v版本号-windows-x64.zip`：

1. 将整个 ZIP 解压到普通文件夹。
2. 双击 `start.bat`，默认浏览器会自动打开网站。
3. 学习期间保持启动窗口打开；关闭窗口或按 Ctrl+C 即可停止。

免安装包适用于 Windows 10 / 11 的 Intel / AMD 64 位电脑，包含官方 Node.js 运行环境和全部网页资源，无需另装 Node.js、Python 或 npm，无需管理员权限，解压后可离线学习。

默认本地地址为 `http://127.0.0.1:4173/`。端口被占用时自动尝试下一个端口，以启动窗口显示的网址为准；若浏览器未自动打开，手动复制该网址。服务仅监听本机。

在线版与本地版、不同浏览器或不同端口的学习进度各自独立。切换前可在“学习记录”导出备份，再到目标版本导入。升级时先关闭旧版启动窗口，再解压运行新版，用同一浏览器和端口访问。

`yinxu-v版本号-web.zip` 是适合开发者和静态部署的轻量网页包，需要 Node.js 18+ 才能使用其中的本地启动器；macOS / Linux 可运行 `node serve.mjs`。源码 ZIP / TAR.GZ 用于二次开发。浏览器模块限制可能阻止直接双击 `index.html`，请使用启动器或在线地址。

运行环境来自 [Node.js 官方下载](https://nodejs.org/dist/v24.22.2/)，版本和 SHA-256 固定在 `scripts/windows-runtime.json`，打包前验证原始压缩包校验值。免安装包保留 Node.js 原始许可证 `runtime/LICENSE` 和来源 `runtime/runtime.json`。

## GitHub 自动发布

- 推送到 `main`：检查、构建并自动发布 GitHub Pages。
- 推送 `v*` 版本标签：在 Windows 上检查、构建、打包并验证启动器，随后创建 GitHub Release，附带 Windows 免安装 ZIP、轻量网页 ZIP 与 SHA-256 校验。
- GitHub 仓库 Settings → Pages 的发布源为 GitHub Actions。

项目使用相对资源路径，同一份构建支持 GitHub 仓库子路径与普通静态服务器根目录。

开发者可在构建后运行 `python scripts/package-release.py --windows-portable` 生成两个发布包（Python 3.11+）；在 Windows 上运行 `python scripts/smoke-windows-release.py --archive artifacts/release/yinxu-v版本号-windows-x64.zip` 验证打包产物。

## 已实现

- 学习概览、课程搜索与分类、课程目录、阅读与答题、下一课导航。
- 618 节原创中文基础与启蒙课，每课包含知识正文、互动工具或观察任务、小结与测验。
- 中国传统乐器专区：100 种代表乐器，98 条的三课认知路线；古筝、二胡各保留原有四课及参考音工具。新路线依次学习形制、发声与起步、听赏与练习计划。
- 传统乐器分类与地域导览、别名及拼音搜索、分页目录、八音分类说明；自主观察练习可计入学习记录。
- 钢琴：屏幕键盘、电脑键盘、找音练习、《小星星》开头的旋律跟弹、可选 Web MIDI 输入。
- 吉他：标准调弦前五品指板，C、G、Am、D、Em 和弦图和参考发声。
- 练耳：变化起始音的大二度、大三度、纯五度、纯八度听辨，答题反馈与下一题。
- 节拍器：40–180 BPM、4/4 强弱拍提示、拍击速度及均匀程度估算。
- 视唱入门：C 大调参考音、低八度选择、上行示范。
- MusicXML 五线谱显示。
- 尤克里里高 G 调弦与 C、Am、F、G7 和弦参考音；四弦贝斯前五品音位。
- 小提琴、长笛、中音萨克斯、古筝、二胡的音高参考与短句示范；萨克斯区分谱音与实音，古筝提供 D 调二十一弦参考音。
- 三声部八步鼓机：底鼓、军鼓、踩镲，40–140 BPM，编辑、循环播放、清空与基础四拍预设。
- 本地学习记录、每日目标、实际活跃学习时长、连续学习天数、JSON 备份导出与合并导入。
- 窄屏导航、原生模态窗口、键盘焦点与减少动态效果支持。

## 使用范围

传统乐器专区是广泛的认知与启蒙目录，并非所有地方变体的穷尽名录，也不是每件乐器的完整专业演奏课程。新课程未内置真实乐器录音或视频；文字、任务和测验随 Release 离线提供，外部资料及部分示范需要联网。分类中的扬琴、筑按乐队习惯放入“弹拨与击弦”，口弦单列，避免把演奏分组等同于发声材料分类。

这是可使用的独立学习端，采用 React + Vite、Tone.js、Tonal、OpenSheetMusicDisplay。**它没有声称已完成 Educandu 集成。** 本地保存使用 `localStorage`，当前不包含账号、云同步、教师后台、付费或麦克风演奏评分。屏幕键盘使用合成参考音色，不能替代实体乐器的触键、姿势与手型指导。

电脑键盘：A S D F G H J K 为 C4 D4 E4 F4 G4 A4 B4 C5；W E T Y U 为对应黑键。Web MIDI 需要浏览器支持和用户授予权限，实体设备连接未在本轮验收中验证。

学习时长只在课程窗口或已开始的练习中、页面可见且有焦点时累计，重叠互动工具不会重复计时。后台页和普通概览页不会自动累计。练习室中可点击“结束练习”停止计时。

## 选型与后续接入

见 [Educandu 评估](docs/educandu-evaluation.md) 与 [结构与扩展](docs/architecture.md)。上游 Educandu v4.1.1 源码已拉取到本机 `reference/educandu/`，仅用于评估，不包含在本站发布包中。

`.openai/hosting.json` 仅保留最初预览站的配置；GitHub Pages 与 Release 不依赖它，不包含 ChatGPT 登录流程。

## 验证

`npm test` 验证传统乐器目录与课程完整性、别名及复合筛选、同名形制区分、原有进度兼容，以及音阶、吉他与贝斯音位、调弦、尤克里里和弦组成音、萨克斯移调、古筝五声音阶、鼓机节拍、课程筛选与题目、旧记录兼容、完成记录去重、连续学习与备份数据校验。`npm run build` 执行 TypeScript 检查并生成静态产物。

本轮使用浏览器验收正式构建：课程阅读与答题、完成下一课、刷新恢复进度、乐谱渲染、吉他参考音入口、听音题、节拍器。测试记录属于测试浏览器本地数据，不作为默认学习记录随发布包交付。

## 内容与依赖

课程文字、测验、短句练习和 SVG 插画为本项目原创。《小星星》钢琴练习使用传统旋律的开头，不包含第三方录音。新增课程通过“延伸阅读”链接列出乐器厂商、教育机构和演奏者资料，页面不嵌入第三方录音或视频。参考音与鼓声为合成示范，不模拟真实乐器音色，也不评判实体演奏。依赖许可证和原版权信息见 `public/third-party-notices.txt`；该文件由 `scripts/collect-licenses.mjs` 从已安装的生产依赖收集。

## 乐器配图（v0.5.0）

100 种中国乐器与 92 种扩展世界乐器均已配图，共 64 张实物照片、2 幅历史图像、126 幅原创结构示意；原有 8 种常见乐器保留原生矢量插画。图鉴卡片、课程首页与课文均可看图，支持放大观察。所有图片随离线包分发。第三方图片分别遵循各自许可，代码的 MIT 许可证不替代图片许可。

查看[配图说明与维护方法](docs/instrument-images.md)及[完整图片署名](https://xxzzh.github.io/yinyue/image-credits.html)。
