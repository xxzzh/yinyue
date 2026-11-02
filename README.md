# 音序 · 音乐学习空间

网站访问：[打开音序](https://yinxu-music-academy.spiffychasm.chatgpt.site/)（私有站点，使用所属 ChatGPT 账号登录）。

源码仓库：[xxzzh/yinyue](https://github.com/xxzzh/yinyue)。GitHub 用于源码管理，当前网站访问地址保持不变。

中文音乐学习网站第一版。包含乐理、视唱练耳、钢琴、吉他四条学习路线，共 16 节原创入门课。

## 本地运行

需要 Node.js 22.18+ 或 Node.js 24。

```powershell
cd D:\yy\music-academy
npm ci
npm run dev
```

打开终端显示的 `http://127.0.0.1:5173/`。

```powershell
npm test
npm run build
npm run preview -- --port 4173
```

正式构建输出在 `dist/`，可部署到静态托管服务。所有路由使用 URL hash，深链接不要求服务器 rewrite。

## 已实现

- 学习概览、课程搜索与分类、课程目录、阅读与答题、下一课导航。
- 16 节原创中文入门课，每课包含两个知识段落、互动工具、知识小结与一道选择题。
- 钢琴：屏幕键盘、电脑键盘、找音练习、《小星星》开头的旋律跟弹、可选 Web MIDI 输入。
- 吉他：标准调弦前五品指板，C、G、Am、D、Em 和弦图和参考发声。
- 练耳：变化起始音的大二度、大三度、纯五度、纯八度听辨，答题反馈与下一题。
- 节拍器：40–180 BPM、4/4 强弱拍提示、拍击速度及均匀程度估算。
- 视唱入门：C 大调参考音、低八度选择、上行示范。
- MusicXML 五线谱显示。
- 本地学习记录、每日目标、实际活跃学习时长、连续学习天数、JSON 备份导出与合并导入。
- 窄屏导航、原生模态窗口、键盘焦点与减少动态效果支持。

## 使用范围

这是可使用的独立学习端，采用 React + Vite、Tone.js、Tonal、OpenSheetMusicDisplay。**它没有声称已完成 Educandu 集成。** 本地保存使用 `localStorage`，当前不包含账号、云同步、教师后台、付费或麦克风演奏评分。屏幕键盘使用合成参考音色，不能替代实体乐器的触键、姿势与手型指导。

电脑键盘：A S D F G H J K 为 C4 D4 E4 F4 G4 A4 B4 C5；W E T Y U 为对应黑键。Web MIDI 需要浏览器支持和用户授予权限，实体设备连接未在本轮验收中验证。

学习时长只在课程窗口或已开始的练习中、页面可见且有焦点时累计，重叠互动工具不会重复计时。后台页和普通概览页不会自动累计。练习室中可点击“结束练习”停止计时。

## 选型与后续接入

见 [Educandu 评估](docs/educandu-evaluation.md) 与 [结构与扩展](docs/architecture.md)。上游 Educandu v4.1.1 源码已拉取到本机 `reference/educandu/`，仅用于评估，不包含在本站发布包中。

Sites 托管配置在 `.openai/hosting.json`。本站以私有站点发布，沿用工具返回的项目标识，不创建第二个同名项目。

## 验证

`npm test` 验证音阶、吉他音位、音程生成、拍速估算、课程题目、完成记录去重、连续学习与备份数据校验。`npm run build` 执行 TypeScript 检查并生成静态产物。

本轮使用浏览器验收正式构建：课程阅读与答题、完成下一课、刷新恢复进度、乐谱渲染、吉他参考音入口、听音题、节拍器。测试记录属于测试浏览器本地数据，不作为默认学习记录随发布包交付。

## 内容与依赖

课程文字、测验和 SVG 插画为本项目原创。《小星星》练习使用传统旋律的开头，不包含第三方录音。依赖许可证和原版权信息见 `public/third-party-notices.txt`；该文件由 `scripts/collect-licenses.mjs` 从已安装的生产依赖收集。
