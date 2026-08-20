/** `mobileNav` namespace dictionaries: drawer controls. */
export declare const NS = "mobileNav";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly open: "打开目录";
    readonly close: "收起目录";
    readonly backdrop: "点击关闭目录";
    readonly sessionLog: "导出会话日志";
    readonly files: "文件浏览";
    readonly 'view.status': "状态";
    readonly 'market.title': "插件市场";
    readonly 'status.running': "运行中";
    readonly 'status.idle': "空闲";
    readonly 'status.turns': "轮数";
    readonly 'status.steps': "步数";
    readonly 'status.llmTime': "模型耗时";
    readonly 'status.toolTime': "工具耗时";
    readonly 'status.ttft': "首字延迟";
    readonly 'status.decode': "解码耗时";
    readonly 'status.tokens': "输出 tokens";
    readonly 'status.throughput': "解码速率";
    readonly 'status.cacheHit': "缓存命中";
    readonly 'status.inputTokens': "输入 tokens";
    readonly 'status.outputTokens': "输出 tokens";
    readonly 'status.tools': "运行中工具";
    readonly 'status.session': "会话";
    readonly 'status.phase': "阶段";
    readonly 'status.error': "最近错误";
    readonly 'status.none': "无";
    readonly 'status.blank': "空白会话";
    readonly 'status.removed': "已移除";
    readonly 'status.subagent': "子代理";
    readonly 'status.loadingOlder': "加载历史…";
    readonly 'status.exportLog': "导出会话日志";
    readonly 'delete.menu': "删除对话";
    readonly 'delete.title': "删除对话";
    readonly 'delete.desc': "将永久删除会话“{name}”及其全部消息，此操作不可恢复。";
    readonly 'delete.confirm': "删除";
    readonly 'delete.cancel': "取消";
    readonly 'delete.close': "关闭";
    readonly 'delete.pending': "正在删除…";
    readonly 'delete.failed': "删除失败，请稍后重试。";
    readonly 'delete.running': "该会话正在运行，无法删除。";
    readonly 'delete.resolveError': "无法定位该会话，请重试。";
    readonly 'font.smaller': "缩小对话字号";
    readonly 'font.larger': "放大对话字号";
    readonly 'attach.label': "添加附件";
    readonly 'attach.aria': "选择图片或文件附加到消息";
    readonly 'attach.sendFiles': "发送附件";
    readonly 'attach.remove': "移除 {name}";
    readonly 'attach.tooManyImages': "一次最多添加 {count} 张图片";
    readonly 'attach.tooManyFiles': "一次最多添加 {count} 个文件";
    readonly 'attach.unsupported': "不支持的文件类型：{name}";
    readonly 'attach.imageFailed': "图片 {name} 添加失败";
    readonly 'attach.readFailed': "文件 {name} 读取失败";
    readonly 'attach.truncated': "（内容过长，仅保留前 100000 字符）";
    readonly 'attach.unreadable': "（该文件内容无法解析，仅提示文件名）";
    readonly 'attach.filePrefix': "[附件] {name}";
    readonly 'attach.fold': "附件内容 · 共 {chars} 字 · 点击展开";
    readonly 'attach.imagePath': "图片文件：{path}";
    readonly 'attach.imageHint': "（当前模型不支持直接查看图片，可调用 vision 工具读取该文件）";
    readonly 'attach.fallbackFailed': "图片降级失败：{error}";
    readonly 'jobs.title': "后台任务";
    readonly 'jobs.countLive': "{count} 运行中";
    readonly 'jobs.count': "{count} 个";
    readonly 'jobs.status.running': "运行中";
    readonly 'jobs.status.stopping': "正在停止";
    readonly 'jobs.status.completed': "已完成";
    readonly 'jobs.status.killed': "已取消";
    readonly 'jobs.status.failed': "已失败";
    readonly 'jobs.duration.seconds': "{seconds}秒";
    readonly 'jobs.duration.minutes': "{minutes}分{seconds}秒";
    readonly 'jobs.duration.hours': "{hours}小时{minutes}分";
    readonly 'ctx.other': "其他（缓存读写等）~{tokens}";
    readonly 'github.title': "GitHub Token";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<MobileNavKey, string>;
/** Key domain of the `mobileNav` namespace (zh is the source of truth). */
export type MobileNavKey = keyof typeof zh;
/**
 * Chinese descriptions for host-registered slash commands shown in the
 * composer command menu. The host catalog carries English-only descriptions
 * (no host-side i18n), so the mobile shell translates them client-side,
 * keyed by command name (stable across versions), gated on the active
 * locale being Chinese. Unknown commands keep their original description.
 */
export declare const commandDescriptionsZh: Record<string, string>;
//# sourceMappingURL=locales.d.ts.map