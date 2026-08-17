# dsh-mobile-shell

DeepSeek Harness Web UI 移动端外壳:窄屏(< 1024px)隐藏左侧 rail,目录变为 overlay 侧滑抽屉,会话区独占全宽。附带插件市场页(一键安装即热加载)、会话状态面板、设置适配等移动端增强。纯 client 插件,宽屏下与未安装时一致。

[![Release v0.1.0](https://img.shields.io/badge/release-v0.1.0-5B4CF0?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-0B7285?style=flat-square)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-Web%20Profile-5B4CF0?style=flat-square)](cordis.patch.yml)

## 效果

| 会话主页(全宽) | 目录抽屉 | 设置界面 |
| --- | --- | --- |
| ![移动端会话主页](assets/hero.png) | ![目录抽屉](assets/drawer.png) | ![移动端设置界面](assets/settings.png) |

## 特性

- **状态栏适配**:保留系统状态栏——viewport 加 `viewport-fit=cover`,页面各表面按 `env(safe-area-inset-top)` 下移,状态栏/刘海永不遮挡内容;`theme-color` 跟随主题背景(深/浅色自动切换),Android 状态栏与页面同色一体;`touch-action: manipulation` 禁用双击放大与 300ms 点击延迟(保留双指缩放);
- **会话全宽**:网格改为 `1fr 0 0`,目录抽屉 overlay 滑入,宽度贴合侧栏内容(约 280px),关闭后完全移出视口,左侧无阴影残留;
- **避开摄像头**:不做顶部预留空间,打开目录的浮动按钮放在左缘 y=72px(摄像头带下方);
- **会话头部重排**:移动端按 [目录按钮] [会话名称] [模式徽标] 排列;Session log 胶囊移到抽屉底部(Settings 旁),复用官方下载逻辑;
- **设置界面适配**:官方 800px 双栏弹窗改为近全宽 sheet——导航标签两行全可见、条目保持横向、Appearance 一行三选一、高度自适应、淡入动画;导出对话框保持官方居中卡片;
- **正文排版**:消息文字 16px → 15px,左右留白 32px → 20px,行宽更充分;抽屉列表与输入框文字不受影响;
- **输入框防重叠**:agent 权限胶囊(盾牌)与模型名不再重叠;
- **统计栏一行滚动**:轮数/步数/耗时/TTFT/缓存/token 全部收进一条固定高度(28px)的横向滚动条,底部不再被撑高;
- **会话行操作菜单**:长按或右键会话行,右侧出现三点按钮(重命名 / Fork / 归档),点击时抽屉保持打开,菜单不再随抽屉收回;
- **抽屉导航判定**:点会话行本体切换会话并收起抽屉;行内按钮(三点菜单等)不触发收起;
- **文件树 / 预览浮层**:dsh-web-ui 的 Explorer 与 Preview 在手机上变为圆角底部浮层(文件树底部与输入框对齐),每次打开带滑入动画;
- **一步打开文件**:会话头部右侧新增文件夹按钮,点击直接开/关文件树,无需先开侧栏抽屉。

## 兼容插件

- [dsh-web-ui 全家桶](https://www.npmjs.com/package/@linxin666/dsh-web-ui-all)(文件树 / 预览 / 任务看板 / SSH / 宠物 / 会话统计 / 远程配对 / 设置)——**0.1.14**
- [dshmarket](https://www.npmjs.com/package/dshmarket)(插件市场,搜索框换行全宽)——**1.2.2**
- [dsh-usage-stats](https://github.com/Ychris12138/dsh-usage-stats)(用量与余额)——**0.1.2**

## 安装

```sh
dsh plugin --profile web add github:Yui-Little/dsh-mobile-shell
```

仓库自带构建产物,一条命令直接安装,无 `allowBuilds` 拦截,安装后即热加载生效(无需重启)。

本地开发:`dsh plugin --profile web add link:/path/to/dsh-mobile-shell`

## 构建

```sh
pnpm install
pnpm build
```

产物 `lib/` 与源码同步入库,改动源码后重新构建再提交。

## 验证

- `pnpm verify` 类型检查;`dsh --profile web --dump-config` 应出现插件层;
- 移动端(390px):rail 消失、抽屉开合/遮罩/Escape、设置弹窗适配、会话行三点菜单弹出时抽屉保持;
- 桌面端(≥1024px):与未安装时一致。

## 兼容性

需要 `:has()`(Chromium 105+);`prefers-reduced-motion: reduce` 下自动禁用动画。

## 致谢

- 侧滑抽屉方案源自 [mexiaosqwq/dsh-web-mobile](https://github.com/mexiaosqwq/dsh-web-mobile)(MIT),本插件在其基础上重写扩展,仅保留移动端抽屉与适配部分。

## License

[MIT](LICENSE)
