# Educandu 选型评估（2026-11-02）

## 已确认的事实

- 上游仓库：<https://github.com/educandu/educandu>，代码 MIT 许可。
- 核对版本：v4.1.1，commit `3f1f1eb3433b2dca6ea45785289b5cc020a7b68f`。
- 实际应用：<https://openmusic.academy/>，站点源码 <https://github.com/open-music-academy/oma-web>。
- 技术形态：Node.js、React、Express、MongoDB、S3 兼容对象存储、SMTP；上游 package.json 的 Node 要求为 `^20.0.0`。
- 支持自定义页面模板、首页模板、标志、主题及内容插件；源码 `PageResolver.getPageComponentInfo` 通过 customResolvers 选择模板，`PluginRegistry.setPlugins` 组合内置与自定义插件。
- OMA 已配置 ear-training、abc-notation、music-xml-viewer、multitrack-media、interactive-media、piano 等音乐教学插件。

## 本机运行验证的限制

Docker CLI 已安装，但 Docker Linux engine 当前未运行。尝试启动 Docker Desktop 的命令被执行策略以 `blocked by policy` 拒绝；没有重试规避该限制。已成功克隆上游源码、建立 CodeGraph 索引并核对配置与扩展入口，**未完成 Educandu 后端的安装或试跑**。

本机 Node.js 为 24，与上游声明的 Node.js 20 范围不同。后续应在隔离的 Node.js 20 环境中验证；是否需要升级到仍受维护的 Node 版本，应在兼容性测试后决定。

当前 Sites 运行环境是 Cloudflare Workers／静态托管，不能直接承载 Educandu 的完整 Express + MongoDB TCP 后端，因此不能把本次静态发布描述成 Educandu 部署成功。

## 当前实施决定

第一版先交付可以独立运行的中文学习端，复用成熟的开源音乐组件，并采用可替换的课程数据和进度模型。课程与 SVG 插画为原创，没有搬运 OMA 的教学材料或音频。

Educandu 保留为后续的内容创作、资源库与教师协作候选。若近期必须上线班级、作业、教师管理，再对照 Frappe Learning 评估管理成本；本次没有同时部署第二套后台。

## 下一阶段的验收条件

1. 在独立容器环境准备适配版本的 Node、MongoDB、S3 兼容存储及开发邮件服务。
2. 启动上游 v4.1.1 测试应用，验证创建用户、编辑与发布文档、上传媒体、听音与乐谱插件。
3. 验证中文资源包、品牌与首页模板，核对国际化是否覆盖编辑器和错误信息。
4. 明确课程章节、学习进度、用户身份与权限如何与本站连接；不能把 OER 文档系统直接等同于完整 LMS。
5. 接入一条真实课程，验收“教师修改—发布—学生查看—记录进度”的完整流程。

只有这些验证通过后，才建议正式把 Educandu 定为生产后台。
