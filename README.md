# dsh-mobile-shell

DeepSeek Harness Web 的移动端外壳插件。窄屏（< 1024px）下隐藏左侧 rail、目录变为侧滑抽屉、会话区独占全宽，并附带插件市场、会话状态面板、设置适配、自定义推理参数等移动端增强。纯 client 插件，宽屏下与未安装时完全一致。

[![Release v0.1.0](https://img.shields.io/badge/release-v0.1.1-5B4CF0?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-0B7285?style=flat-square)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-Web%20Profile-5B4CF0?style=flat-square)](cordis.patch.yml)

## 效果

| 会话主页（全宽） | 目录抽屉 | 设置面板 | 插件市场 |
| --- | --- | --- | --- |
| ![会话主页](assets/hero.png) | ![目录抽屉](assets/drawer.png) | ![设置面板](assets/settings.png) | ![插件市场](assets/market.png) |

## 特性

### 移动端布局

- **侧滑抽屉**：窄屏隐藏左侧 rail，目录变为 overlay 侧滑抽屉（约 280px），点击会话行切换并自动收起，行内按钮（三点菜单等）不触发收起
- **全宽会话**：会话区独占视口宽度，消息文字 16px → 15px，左右留白 32px → 20px，行宽更充分
- **避开摄像头**：打开目录的浮动按钮置于左缘 y≈72px（摄像头带下方），不遮挡内容
- **会话头部重排**：移动端按 [目录按钮] [会话名称] [模式徽标] 排列
- **状态栏适配**：viewport 加 `viewport-fit=cover`，各表面按 `env(safe-area-inset-top)` 下移；`theme-color` 跟随主题自动切换；`touch-action: manipulation` 禁用双击放大与 300ms 延迟（保留双指缩放）

### 设置面板

- **近全宽 Sheet**：官方 800px 双栏弹窗改为近全宽底部 sheet，导航标签两行全可见、条目保持横向、Appearance 一行三选一、高度自适应、淡入动画
- **白色卡片风格**：设置项以白色区块分隔，整体扁平清爽
- **插件市场入口**：设置面板导航新增「Plugin Market」条目，点击进入内置插件市场页

### 插件市场

- **分类下拉**：按分类筛选插件
- **排序**：更新时间 / Star 两种排序，切换即时刷新
- **HH:mm 时间徽标**：更新时间始终显示 HH:mm 格式
- **GitHub 风格 README 弹窗**：点击插件卡片查看详情，README 以 GitHub 风格渲染
- **一键安装即热加载**：安装按钮触发 `dsh plugin add`，安装完成后自动热加载（无需重启），并通过 toast 提示结果
- **EN→ZH 翻译**：README 支持中英语言切换，英文 README 自动翻译为中文（MyMemory 分块翻译 + LLM 兜底）

> ⚠️ 市场内一键安装**不保证稳定成功**（受网络 / 构建环境影响）。推荐复制仓库链接，直接用 `dsh` 命令安装（见下方[安装](#安装)）。

### 会话状态面板

- **Status 标签页**：在会话头部新增 Status 标签（与 Chat / Trajectory 并列），展示轮数 / 步数 / 耗时 / TTFT / 缓存命中 / token 用量
- **统计栏一行滚动**：所有指标收进一条固定高度（28px）的横向滚动条，底部不被撑高

### 自定义推理参数

- **Reasoning Effort 配置**：为自定义 provider 的模型添加 reasoning effort 选项（off / low / high / xhigh / max）
- **reasoningEfforts 自动回填**：模型未声明 `reasoningEfforts` 时自动补全默认值
- **协议切换安全**：`thinkingFormat` / `supportsReasoningEffort` 等 completions 专属开关不再自动写入模型配置，provider 在 openai-completions / openai-responses 之间任意切换都不会触发保存校验报错

### 其他增强

- **聊天字号调节**：底部字号滑轨，实时调整消息文字大小并持久化
- **Enter 换行**：输入框 Enter 换行、Shift+Enter 发送（移动端友好）
- **附件折叠**：`[附件]` 块折叠为原生 `<details>`，输入区不被撑高
- **会话行三点菜单**：长按或右键会话行弹出三点菜单（重命名 / Fork / 归档），菜单弹出时抽屉保持打开
- **更新通知**：插件版本更新后一次性 toast 提示「手机UI插件已更新 v0.1.0，本页已是新界面」
- **中英双语**：zh / en 两套 locale，UI 文案跟随系统语言

## 安装

```sh
dsh plugin --profile web add github:Yui-Little/dsh-mobile-shell
```

仓库自带构建产物，一条命令直接安装，安装后即热加载生效（无需重启）。

本地开发：

```sh
dsh plugin --profile web add link:/path/to/dsh-mobile-shell
```

## 构建

```sh
pnpm install
pnpm build
```

产物 `lib/` 与源码同步入库，改动源码后重新构建再提交。

## 验证

- `pnpm verify` 类型检查；`dsh --profile web --dump-config` 应出现插件层
- 移动端（390px）：rail 消失、抽屉开合/遮罩、设置 sheet 适配、插件市场加载、Status 标签页渲染
- 桌面端（≥ 1024px）：与未安装时一致

## 兼容性

- 需要 `:has()` 选择器（Chromium 105+）
- `prefers-reduced-motion: reduce` 下自动禁用动画

## 致谢

- 侧滑抽屉方案源自 [mexiaosqwq/dsh-web-mobile](https://github.com/mexiaosqwq/dsh-web-mobile)（MIT），本插件在其基础上重写扩展，仅保留移动端抽屉与适配部分

## License

[MIT](LICENSE)
