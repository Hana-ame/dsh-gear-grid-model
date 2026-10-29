/* 静态自检：locale key 覆盖、CSS 令牌存在性、CSS 结构配平、常用模型契约。
   用法: node verify.cjs（在包目录内，ROOT 即脚本所在目录） */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = fs.readFileSync(path.join(ROOT, 'client.js'), 'utf8');
const THEME = fs.readFileSync(
  '/home/lumin/.nvm/versions/node/v22.23.1/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js',
  'utf8');

let fail = 0, warn = 0;
const bad = (m) => { fail++; console.log('  ✗ ' + m); };
const okk = (m) => console.log('  ✓ ' + m);
const wrn = (m) => { warn++; console.log('  ! ' + m); };

/* ── 1. 抽取 CSS 数组字面量 ─────────────────────────────────────── */
const m = SRC.match(/const CSS = \[\n([\s\S]*?)\n    \]\.join\('\'\)/);
if (!m) { console.log('FATAL: CSS block not found'); process.exit(1); }
const rules = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]);
console.log('CSS rules: ' + rules.length);

/* ── 2. CSS 结构：逐条规则配平 ─────────────────────────────────── */
let css = rules.join('\n');
{
  let depth = 0, minDepth = 0, badRule = null;
  const scan = /([^{}@]+\{|\})/g;
  for (const tok of css.matchAll(scan)) {
    if (tok[1].endsWith('{')) depth++; else { depth--; if (depth < 0) { badRule = tok.index; break; } }
    minDepth = Math.min(minDepth, depth);
  }
  if (depth === 0 && minDepth >= 0) okk('CSS 大括号配平（depth 0，最低 ' + minDepth + '）');
  else bad('CSS 大括号不配平：final depth ' + depth + '，min ' + minDepth + (badRule !== null ? ' @ ' + badRule : ''));

  /* 每条规则内的引号闭合 */
  let q = 0;
  for (let i = 0; i < css.length; i++) if (css[i] === '"') q++;
  if (q % 2 === 0) okk('CSS 双引号成对（' + q + ' 个）');
  else bad('CSS 双引号未闭合（' + q + ' 个）');

  /* content:"" 与 @keyframes/@media 块 */
  const kf = (css.match(/@keyframes [a-z-]+/g) || []).length;
  const md = (css.match(/@media/g) || []).length;
  console.log('    @keyframes: ' + kf + '  @media: ' + md);
}

/* ── 3. CSS 引用的 dsh 令牌必须真实存在 ─────────────────────────── */
const used = [...new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((x) => x[1]))];
const themeDefs = new Set([...THEME.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((x) => x[1]));
/* 主题里作为 *值* 引用的令牌也算存在（如 --dsw-elevation-stroke） */
const themeRef = new Set([...THEME.matchAll(/var\((--[a-z0-9-]+)/g)].map((x) => x[1]));
console.log('\ndsh 令牌引用 ' + used.length + ' 个：');
for (const tk of used.sort()) {
  if (tk.startsWith('--gg-') || tk.startsWith('--tw')) continue;   // 自有令牌（色相/星野）
  if (tk.startsWith('--dsh-')) continue;                    // 应用壳提供（frame overlay / scrollbar）
  if (themeDefs.has(tk) || themeRef.has(tk)) okk(tk);
  else bad('令牌未在主题中定义：' + tk);
}

/* ── 4. locale key：使用的 key 必须在中英词典都有 ───────────────── */
const zhM = SRC.match(/const zh = \{([\s\S]*?)\n    \};/);
const enM = SRC.match(/const en = \{([\s\S]*?)\n    \};/);
if (!zhM || !enM) { bad('找不到 zh/en 词典'); }
else {
  const keys = (blk) => new Set([...blk.matchAll(/'([^']+)':\s*'/g)].map((x) => x[1]));
  const zh = keys(zhM[1]), en = keys(enM[1]);
  const usedKeys = new Set([...SRC.matchAll(/\bt\('([^']+)'/g)].map((x) => x[1]));
  console.log('\nzh keys ' + zh.size + ' / en keys ' + en.size + ' / 使用 ' + usedKeys.size);
  for (const k of [...usedKeys].sort()) if (!zh.has(k) && !en.has(k)) bad('使用的 locale key 未定义：' + k);
  for (const k of zh) if (!en.has(k)) bad('en 缺少 key：' + k);
  for (const k of en) if (!zh.has(k)) bad('zh 缺少 key：' + k);
  const unused = [...zh].filter((k) => !usedKeys.has(k));
  if (unused.length) wrn('zh 中未使用的 key：' + unused.join(', '));
  if (!fail) okk('locale key 中英一致，使用全覆盖');
}

/* ── 5. 模板占位符必须匹配 ──────────────────────────────────────── */
const zhDict = {};
const enDict = {};
if (zhM) for (const x of zhM[1].matchAll(/'([^']+)':\s*'([^']*)'/g)) zhDict[x[1]] = x[2];
if (enM) for (const x of enM[1].matchAll(/'([^']+)':\s*'([^']*)'/g)) enDict[x[1]] = x[2];
for (const k of Object.keys(zhDict)) {
  const a = [...new Set([...zhDict[k].matchAll(/\{(\w+)\}/g)].map((x) => x[1]))].sort().join(',');
  const b = [...new Set([...(enDict[k] || '').matchAll(/\{(\w+)\}/g)].map((x) => x[1]))].sort().join(',');
  if (a !== b) bad('占位符不一致 ' + k + '：zh {' + a + '} vs en {' + b + '}');
}
if (!fail) okk('zh/en 模板占位符一致');

/* ── 6. 结构检查：注册参数、slot 契约 ───────────────────────────── */
const checks = [
  [/scope\.slots\.inject\(SLOT, \(\) => scope\.slots\.register\(\{/, 'slot 注册经 scope.slots.inject 包裹'],
  [/name: SLOT/, 'register name 与 SLOT 一致'],
  [/id: ENTRY/, 'list slot 提供 id'],
  [/locale: NS/, 'register 声明 locale 以拿到 t prop'],
  [/order: 0/, 'register 提供 order'],
  [/\{ inject: INJECT, apply \}/, 'factory 返回 {inject, apply}'],
  [/ctx\.locale\.register\(NS, \{ zh, en \}\)/, 'ctx.effect 内注册词典'],
  [/ctx\.effect\(/, '词典注册在 ctx.effect 内'],
  [/data-plugin-css=\u0022' \+ STYLE_ID/, '样式按 data-plugin-css 去重'],
  [/tag\.dataset\.plugin = PKG/, '样式打 dataset.plugin 标记'],
  [/tag\.dataset\.pluginCss = STYLE_ID/, '样式打 dataset.pluginCss 标记'],
  [/prefers-reduced-motion:reduce/, '动效尊重 prefers-reduced-motion'],
  [/--dsw-radius-sm/, '触发器沿用 composer 的 radius-sm'],
  [/height:28px/, '触发器沿用 composer 工具行 28px'],
  [/\.gg-card\{[^']*height:min\(640px,calc\(100dvh - 96px\)\)/, '卡片高度固定（切换 provider 不改窗口尺寸）'],
  [/\.gg-kb \.gg-cell:focus-within/, '键盘焦点环只在键盘导航（.gg-kb）时出现'],
  [/focusCell\(fr, Math\.min\(nC - 1, fc \+ 1\)\)/, '方向键经 focusCell 搬 DOM 焦点（右）'],
  [/data-gg-p': p,/, 'chip 带 data-gg-p 定位属性'],
  [/data-gg-c': c,/, 'chip 带 data-gg-c 定位属性'],
  [/--dsw-radius-panel/, '卡片沿用 Modal 的 radius-panel'],
  [/--dsw-elevation-prominent/, '卡片沿用 Menu 的 elevation-prominent'],
  [/--dsw-alias-bg-mask-1/, '遮罩沿用 Modal mask-1'],
  [/--dsw-menu-backdrop-filter/, '遮罩沿用 Menu backdrop-filter'],
  [/--dsw-focus-ring-width,2px/, '焦点环沿用全局 focus-ring-width'],
  [/aria-haspopup/, '触发器声明 aria-haspopup'],
  [/role: 'dialog'/, '弹窗声明 role=dialog'],
  [/'aria-modal': true/, '弹窗声明 aria-modal'],
  [/onKeyDown: onKey/, '弹窗接管 Esc/方向键'],
  [/sessions\.subagentAddress\(sessionId\) === void 0/, '沿用 dsh 的 available 判定'],
  [/directory\.select\(selection\)/, '提交走 directory.select'],
  [/data-gg-hidden/, '折叠原生 seat 为幂等标记'],
  [/prefers-reduced-motion/, 'reduced-motion 已处理'],
  /* ── 常用模型（2026-10-29）────────────────────────────────────── */
  [/const FAV_KEY = PKG \+ '\/favorites\/v1'/, '常用列表存储键（带 v1）'],
  [/localStorage\.getItem\(FAV_KEY\)/, '常用列表从 localStorage 读'],
  [/localStorage\.setItem\(FAV_KEY, JSON\.stringify\(next\)\)/, '常用列表写 localStorage'],
  [/if \(models\.length\) out\.push\(\{ id: g\.id, name: g\.name, fav: true, models \}\)/, '「全部」按 provider 分组（同名模型靠块头区分）'],
  [/className: 'gg-tabStar'/, '首家 tab 是星标 + 常用'],
  [/t\('grid\.favProvider'/, '常用块 aria 写出 provider 名'],
  [/m\.provider \|\| g\.id/, '常用块模型自带 provider（提交不张冠李戴）'],
  [/toggleFav\(prov, m\.id\)/, 'chip ☆ 按钮切换常用'],
  /* ── 搜索栏 + 思考强度分列（2026-10-30）────────────────────────── */
  [/className: 'gg-search'/, '弹窗顶部 search bar'],
  [/searchRow[\s\S]*?tabs/, 'search bar 在 provider tab 上面'],
  [/const searchMode = q !== '';/, '搜索单独成模式'],
  [/className: 'gg-searchClear'/, '搜索框有清除按钮'],
  [/matchModel = \(m\) => matchName\(m\.name\) \|\| matchName\(m\.id\)/, '搜索匹配模型名/id'],
  [/matchGroup = \(g\) => matchName\(g\.name\)/, '整块命中 provider 名'],
  [/if \(searchMode\) \{[\s\S]*?for \(const g of groups\)/, '搜索全局遍历所有 provider（不缩在当前视图）'],
  [/rows\.map\(\(g, p\) => renderBlock\(g, p\)\)\s*\n\s*: j\('div', \{ key: 'sempty'/, '搜索结果占据内容区（provider 分块）'],
  [/t\('search\.empty'/, '搜索无结果空态'],
  [/isContentEditable === true/, '搜索框内按键归还原生输入'],
  [/k === '\/'/, '/ 聚焦搜索框'],
  [/const stepTab = \(delta\)/, 'tab 区方向键切换 provider'],
  [/'data-gg-tab': g\.id/, 'provider tab 带 data-gg-tab 供方向键定位'],
  [/if \(fr === 0\) focusTabButton\(props\.tab\)/, '网格顶端 ↑ 回到 provider tab'],
  [/className: 'gg-eff'/, '思考强度在模型 pill 内分列'],
  [/settleEffort\(p, c, eff\.id\)/, '点强度分段提交模型+档位'],
  [/reasoningEffort/, '提交带 reasoningEffort'],
  [/className: 'gg-fbEff'/, '触发器 pill 内显示当前思考强度'],
  /* ── provider 颜色可手动指定（2026-10-30）────────────────────── */
  [/const HUE_KEY = PKG \+ '\/provider-hues\/v1'/, '颜色覆盖存储键'],
  [/function setProviderHue\(providerId, value\)/, '手动指定/恢复自动的写入口'],
  [/const manual = readHueMap\(\)\[providerId\]/, '手动覆盖优先于哈希'],
  [/const HEX_COLOR = \/\^#\[0-9a-fA-F\]\{6\}\$\//, '自定义色接受任意 #rrggbb'],
  [/type: 'color'/, '原生取色器（自由设置任意颜色）'],
  [/className: 'gg-hueCustom'/, '自定义色块入口'],
  [/t\('hue\.custom'\)/, '自定义色 aria'],
  [/--gg-hue-cyan/, '预设色扩容：作用域字面色（青/蓝绿/黄绿/粉）'],
  [/const HASH_SLOTS = 4;/, '扩容预设不改变旧默认色（哈希仍取前 4 档）'],
  [/t\('hue\.lime'\), t\('hue\.red'\), t\('hue\.pink'\)/, '预设色 9 档（一行排开）'],
  [/flex-wrap:nowrap/, '预设色排成一行'],
  [/className: 'gg-hueSwatch'/, '块头颜色选择器：四档色块'],
  [/className: 'gg-hueAuto'/, '颜色选择器：自动（回落哈希）'],
  [/className: 'gg-provDotBtn'/, '块头色点即颜色选择器入口'],
  [/t\('effort\.cell'/, '强度分段 aria 含档位名'],
  [/'f' \|\| k === 'F'/, '键盘 F 切换常用'],
  [/props\.tab === null/, '全部视图只渲染常用块；provider tab 才渲染全量'],
  [/t\('tab\.all'\)/, '首个 tab 为「☆ 常用」（不加第二个入口）'],
];
console.log('\n契约/规范检查：');
for (const [re, label] of checks) {
  if (re.test(SRC)) okk(label); else bad('缺失：' + label);
}
/* 负向：不新增第二个 provider 入口（用户 2026-10-30 明确只要原 tab 一套入口）。 */
if (/gg-pick/.test(SRC)) bad('不应新增 provider 索引行（.gg-pick）'); else okk('未新增第二个 provider 入口');
/* 负向：常用视图顶部不再重复一行「☆ 常用」小标题（已并入 tab）。 */
if (/gg-favHead/.test(SRC)) bad('常用视图顶部不应再有「☆ 常用」小标题行'); else okk('常用视图顶部没有重复的「☆ 常用」小标题');

console.log('\n' + (fail ? '✗ ' + fail + ' 个失败' : '✓ 全部通过') + (warn ? '，' + warn + ' 个提示' : ''));
process.exit(fail ? 1 : 0);
