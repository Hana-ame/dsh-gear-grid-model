window.__ModuleLoader__.load({
  id: 'dsh-gear-grid-model',
  factory(require) {
    const react = require('react');
    const { jsx, jsxs } = require('react/jsx-runtime');
    require('@deepseek-ai/cordis');

    /* ────────────────────────────────────────────────────────────────
       Gear Grid · 模型选择器（composer 的 model seat 换装）
       ────────────────────────────────────────────────────────────────
       形态（对齐 Hana-ame/gear-grid 的 Cosmic Shifter，按用户意见收敛）：
         · 触发器：28px 药丸，provider 色点 + 模型名 + 思考强度 + 下拉箭头，
           无图标无辉光（与原生 seat 同形：模型与档位写在同一颗 pill 里）
         · 弹窗：全屏星野遮罩 + 居中卡片（blur 遮罩 + 当前 provider 的星云染色）
           **卡片高度固定**（不随 provider tab 过滤结果伸缩），切换 provider 时
           provider 选择栏与窗口位置/大小都不动，内容超出走内部滚动。
         · 内容：**按 provider 分块分区**——每个 provider 一个独立块
           （色点 + 名字 + 数量做块头，模型以自动换行的 pill 排列，名字不截断）
         · 每颗模型 pill = 名字 + **思考强度分列** + ☆：模型声明了
           reasoning.efforts 时，同一颗 pill 里逐档的可点分段（点哪档就提交
           模型+该档，不另开二级菜单）；未声明 efforts 的模型 pill 与原来一致。
         · search bar 在 provider tab **上面**；搜索是全局的：不缩在当前视图里，
           一次搜所有 provider，命中结果按 provider 分块占满内容区（同名模型靠
           块头区分）；整块命中 provider 名时显示该块全部。`/` 聚焦搜索，
           搜索框内按键全交还原生输入（↓ 进第一条结果，Enter 选它）。
         · 键盘选 provider：网格最上面按 ↑ 回到 tab 区，tab 上 ←/→ 直接切换
           provider（点 tab 也会退出搜索）；tab 上 ↓ 回到网格。
         · 选择高亮只给**真正选中的模型**（.gg-cell.on）；键盘焦点环只在用键盘
           导航时出现（.gg-kb 作用域），鼠标打开/点 tab 时不会给任何模型画边框，
           避免"默认选中"的误读。
         · provider 颜色默认 = FNV-1a 哈希到 4 档主题色；**也支持手动指定，且可
           自由设置**：点块头 8px 色点 → **一行 9 个预设色块**（4 主题色 + 5 个
           作用域字面色）+ 原生取色器（任意 #rrggbb）+「自动」（删除覆盖回落哈希）；
           存 localStorage，触发点/块头/tab 激活色/选中高亮/遮罩染色同步。
         · 顶部 tab 是「☆ 常用」+ 各 provider（原「全部」已改名「常用」）。
           「☆ 常用」不再平铺所有模型，只显示**手动打了 star 的常用模型**，
           并按 provider 分组（块头写出 provider 名，同名模型靠块头区分），
           常用视图顶部不再重复一行「☆ 常用」小标题；pill 右侧 ☆ / 键盘 F
           收/取消，localStorage 持久化，不按使用频率自动推断。
         · 点具体 provider tab 后，才平铺**该 provider 的全部可用模型**。
           整窗仍只有一套入口：原 tab；不另加 provider 索引或第二个「常用」tab。
       数据层：
         · 只贡献 conversation.input.right（list slot，零占用者），
           复用 ctx.modelDirectories —— 与 /model 命令、原生 seat 同源，
           提交走 directory.select({provider, model, reasoningEffort?})。
         · 原生 conversation.input.model 是 single slot，不能重注册，
           因此折叠显示而不是卸载：原生模块照常提供 ModelDirectoryResolver
           与 /model 命令，本包只把它的触发器 display:none。
        常用数据：
         · 只存浏览器 localStorage（键 dsh-gear-grid-model/favorites/v1），
           不写服务端、不改目录；手动指定，不按使用频率自动学习。
           目录里已消失的旧条目读取时静默忽略（保留在存储里，provider 回来即恢复）。
       规范对齐：
         · 尺寸/字阶沿用 composer 工具行（28px / 13px / 20px 行高、radius-sm），
           卡片用 radius-panel + elevation-prominent + mask-1 + menu-backdrop-filter，
           焦点环用 focus-ring-width/color，动效用 ds-ease-in-out，
           标题用 --dsw-font-family-brand（Montserrat，随主题包已加载）。
         · provider 色相经 color-mix 叠加在别名令牌之上，明暗自跟随；
           不写死明暗双份，不引入任何图标资产。
         · 键盘模型对齐 dsh 菜单：方向键移动可见焦点环（DOM 焦点 + .gg-focus 双重落点），Enter/Tab 提交并回到触发器，
           Esc 关闭；`/` 聚焦搜索框，搜索框内按键归还原生输入（Enter=选第一个可见模型）。
           思考强度分段是鼠标入口（键盘走原生 seat 的 /model 菜单，二者同源）。
       ──────────────────────────────────────────────────────────────── */

    /** jsx/jsxs 收敛器。**关键**：React 自动运行时的 `jsx(type, props, key)` 第三实参是
        **key**，不是 children —— children 必须放进 `props.children`。写错过一次：
        `jsx('div', props, kidsArray)` 会把数组当成 key 而 children 为空，整棵树渲染成空壳。
        这里统一把 key 提出来走位置参数，children 并进 props，并按子节点数选 jsx/jsxs。 */
    const j = (type, props, ...kids) => {
      const base = props || {};
      const k = base.key;
      const rest = {};
      for (const name in base) if (name !== 'key' && Object.prototype.hasOwnProperty.call(base, name)) rest[name] = base[name];
      if (kids.length > 0) rest.children = kids.length === 1 ? kids[0] : kids;
      const args = k === undefined ? [type, rest] : [type, rest, k];
      return kids.length > 1 ? jsxs(...args) : jsx(...args);
    };

    const NS = 'gearGrid';
    const PKG = 'dsh-gear-grid-model';
    const STYLE_ID = PKG + '/GearGrid.module.css';
    const SLOT = 'conversation.input.right';
    const ENTRY = 'gearGrid';
    /** 需要的浏览器服务面：locale、session 归属判定、slot 注册表。 */
    const INJECT = ['locale', 'sessions', 'slots'];
    const EMPTY = [];

    /* ── 词典（措辞沿用 dsh 原生 model 命名空间的既有说法） ────────── */
    const zh = {
      'seat.aria': '选择模型，当前 {model}',
      'seat.fallback': '选择模型',
      'seat.loading': '正在加载模型…',
      'dialog.aria': 'Gear Grid，模型选择器',
      'dialog.eyebrow': 'GEAR GRID',
      'dialog.title': '选择模型',
      'dialog.close': '关闭',
      'tab.aria': '筛选模型目录：常用只列打了 star 的模型，或选单个 provider 看全量',
      'tab.all': '常用',
      'search.placeholder': '搜索模型…',
      'search.clear': '清除搜索',
      'search.empty': '没有匹配「{q}」的模型。',
      'effort.providerDefault': '默认',
      'hue.blue': '蓝',
      'hue.green': '绿',
      'hue.amber': '橙',
      'hue.purple': '紫',
      'hue.cyan': '青',
      'hue.teal': '蓝绿',
      'hue.lime': '黄绿',
      'hue.red': '红',
      'hue.pink': '粉',
      'hue.pick': '选择颜色：{provider}',
      'hue.auto': '自动',
      'hue.custom': '自定义颜色…',
      'effort.cell': '思考强度：{effort}',
      'seat.ariaEffort': '选择模型，当前 {model}，思考强度 {effort}',
      'fav.add': '加入常用：{model}',
      'fav.remove': '移出常用：{model}',
      'fav.empty': '还没有常用模型。',
      'fav.emptyHint': '点具体 provider 查看全部模型，把鼠标移到模型上点 ☆（或按 F）收录常用。',
      'grid.provider': '{provider}，{n} 个模型',
      'grid.favProvider': '{provider}（常用），{n} 个模型',
      'grid.cell': '选择 {model}',
      'grid.empty': '没有可用的模型。',
      'grid.loading': '正在刷新模型列表…',
      'grid.error': '模型操作失败：{message}',
      'grid.retry': '重新加载',
      'footer.hint': '←→↑↓ 移动 · Enter 选择 · F 常用 · Esc 关闭',
      'status.pending': '正在应用…'
    };
    const en = {
      'seat.aria': 'Select model, current {model}',
      'seat.fallback': 'Select model',
      'seat.loading': 'Loading models…',
      'dialog.aria': 'Gear Grid, model selector',
      'dialog.eyebrow': 'GEAR GRID',
      'dialog.title': 'Select model',
      'dialog.close': 'Close',
      'tab.aria': 'Filter the catalog: Favorites lists starred models only; a provider shows its full list',
      'tab.all': 'Favorites',
      'search.placeholder': 'Search models…',
      'search.clear': 'Clear search',
      'search.empty': 'No models match "{q}".',
      'effort.providerDefault': 'Default',
      'hue.blue': 'Blue',
      'hue.green': 'Green',
      'hue.amber': 'Amber',
      'hue.purple': 'Purple',
      'hue.cyan': 'Cyan',
      'hue.teal': 'Teal',
      'hue.lime': 'Lime',
      'hue.red': 'Red',
      'hue.pink': 'Pink',
      'hue.pick': 'Pick a color for {provider}',
      'hue.auto': 'Auto',
      'hue.custom': 'Custom color…',
      'effort.cell': 'Reasoning effort: {effort}',
      'seat.ariaEffort': 'Select model, current {model}, reasoning effort {effort}',
      'fav.add': 'Add to favorites: {model}',
      'fav.remove': 'Remove from favorites: {model}',
      'fav.empty': 'No favorite models yet.',
      'fav.emptyHint': 'Open a provider to see its full list, then hover a model and click ☆ (or press F) to pin it.',
      'grid.provider': '{provider}, {n} models',
      'grid.favProvider': '{provider} (favorites), {n} models',
      'grid.cell': 'Select {model}',
      'grid.empty': 'No models available.',
      'grid.loading': 'Refreshing model list…',
      'grid.error': 'Model action failed: {message}',
      'grid.retry': 'Reload',
      'footer.hint': '←→↑↓ move · Enter select · F favorite · Esc close',
      'status.pending': 'Applying…'
    };

    /* ── provider 色相：FNV-1a 稳定映射到四个品牌色令牌，明暗自跟随 ── */
    /* 预设色（append-only：已存 localStorage 的 slot 数字必须保持同一颜色）：
       0 蓝 1 绿 2 橙 3 紫 为历史四档，4+ 为后加的预设。 */
    const HUES = [
      'var(--dsw-alias-link)',
      'var(--dsw-alias-state-success-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--gg-hue-astra)',
      'var(--gg-hue-cyan)',
      'var(--gg-hue-teal)',
      'var(--gg-hue-lime)',
      'var(--dsw-alias-state-error-primary)',
      'var(--gg-hue-pink)'
    ];
    function hash(s) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      return h;
    }
    /* ── provider 颜色：默认哈希，可手动指定（预设 4 档或任意自定义色）──
       需求（2026-10-30）：颜色要能自己选 →「要能自由设置」→「多点预设，一行里」。
       默认是 FNV-1a 哈希到 HUES[0..3] 四个主题色；手动覆盖存 localStorage（键
       dsh-gear-grid-model/provider-hues/v1，形状 {providerId: slot | '#rrggbb'}）：
       数字 = 预设档位（HUES 下标，append-only 保证旧值不变色），
       字符串 = 自定义颜色（任意 #rrggbb）。同一 provider 全局
       生效：触发器色点、块头色点、provider tab 激活色、选中 pill/强度分段高亮、
       遮罩星云染色都跟着走。选「自动」= 删除该 provider 覆盖项，回落到哈希。 */
    const HUE_KEY = PKG + '/provider-hues/v1';
    const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
    let hueCache = null;
    const hueSubs = new Set();

    function readHueMap() {
      if (hueCache) return hueCache;
      let map = {};
      try {
        const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(HUE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          for (const key of Object.keys(parsed)) {
            const value = parsed[key];
            if (typeof value === 'number' && value >= 0 && value < HUES.length && Math.floor(value) === value) map[key] = value;
            else if (typeof value === 'string' && HEX_COLOR.test(value)) map[key] = value.toLowerCase();
          }
        }
      } catch (e) { map = {}; }
      hueCache = map;
      return hueCache;
    }
    function writeHueMap(next) {
      hueCache = next;
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(HUE_KEY, JSON.stringify(next)); } catch (e) { /* 静默降级 */ }
      for (const fn of [...hueSubs]) { try { fn(); } catch (e) { /* 单个订阅者失败不拖垮其余 */ } }
    }
    function useHueMap() {
      return react.useSyncExternalStore(
        (fn) => { hueSubs.add(fn); return () => { hueSubs.delete(fn); }; },
        readHueMap
      );
    }
    /** value 省略/null = 恢复自动；number = 四档预设；'#rrggbb' = 任意自定义色。 */
    function setProviderHue(providerId, value) {
      const map = { ...readHueMap() };
      if (value === undefined || value === null) delete map[providerId];
      else map[providerId] = value;
      writeHueMap(map);
    }
    /* 默认哈希只落在前 4 个主题色上：新增预设色不能改变任何 provider 的旧默认色
       （HUES 扩容曾让 DeepSeek 从绿变紫——就是取模长度变了）。 */
    const HASH_SLOTS = 4;
    /** provider → 色相：手动覆盖优先（预设或任意色），否则稳定哈希。 */
    const hueForProvider = (providerId) => {
      const manual = readHueMap()[providerId];
      if (typeof manual === 'number') return HUES[manual];
      if (typeof manual === 'string') return manual;
      return HUES[hash('prov/' + providerId) % HASH_SLOTS];
    };

    /* ── 常用模型：手动收录 + localStorage 持久化 ──────────────────
       需求（2026-10-29）：首页只显示手动指定的常用模型，点具体 provider
       才显示该 provider 的全部可用模型。常用列表**不按使用频率自动推断**，
       唯一写入口是用户在 chip 右侧点 ☆（或键盘 F）——这就是"手动指定"。
       存储键带 /v1，形状 [{provider, model}]，保持用户添加顺序。 */
    const FAV_KEY = PKG + '/favorites/v1';
    const favK = (provider, model) => provider + '\u0000' + model;
    let favCache = null;
    const favSubs = new Set();

    function readFavs() {
      if (favCache) return favCache;
      let list = EMPTY;
      try {
        const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(FAV_KEY);
        const parsed = raw ? JSON.parse(raw) : EMPTY;
        if (Array.isArray(parsed)) {
          const seen = new Set();
          list = parsed.filter((x) => x && typeof x.provider === 'string' && typeof x.model === 'string').filter((x) => {
            const k = favK(x.provider, x.model);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          }).map((x) => ({ provider: x.provider, model: x.model }));
        }
      } catch (e) {
        /* 存储损坏/隐私模式：降级为无常用，不影响模型选择本身。 */
        list = EMPTY;
      }
      favCache = list;
      return favCache;
    }

    function writeFavs(next) {
      favCache = next;
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch (e) { /* 配额/隐私模式：本轮内存生效，持久化失败静默 */ }
      for (const fn of [...favSubs]) { try { fn(); } catch (e) { /* 单个订阅者失败不拖垮其余 */ } }
    }

    /** useSyncExternalStore 订阅常用列表；getSnapshot 返回稳定引用（只在写时换新）。 */
    function useFavs() {
      return react.useSyncExternalStore(
        (fn) => { favSubs.add(fn); return () => { favSubs.delete(fn); }; },
        readFavs
      );
    }

    function isFav(list, provider, model) {
      const k = favK(provider, model);
      return list.some((x) => favK(x.provider, x.model) === k);
    }

    function toggleFav(provider, model) {
      const k = favK(provider, model);
      const list = readFavs();
      const i = list.findIndex((x) => favK(x.provider, x.model) === k);
      if (i >= 0) writeFavs(list.filter((_, n) => n !== i));
      else writeFavs([...list, { provider, model }]);
    }

    /* ── 样式（单文件，data-plugin-css 注入） ─────────────────────── */
    const CSS = [
      /* 自定义色相在自身作用域内定义，不外泄；默认值保证未派生时不炸 */
      '.gg-seat,.gg-veil{--gg-hue:var(--dsw-alias-label-caption);--gg-hue-astra:#b78bfa;--gg-hue-cyan:#38bdf8;--gg-hue-teal:#2dd4bf;--gg-hue-lime:#a3e635;--gg-hue-pink:#f472b6}',
      '.gg-seat{min-width:0;position:relative}',
      '.gg-fab{box-sizing:border-box;appearance:none;border-radius:var(--dsw-radius-sm);min-width:0;max-width:min(280px,40cqw);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:1px solid var(--dsw-alias-border-l2);outline:none;align-items:center;gap:6px;padding:0 5px 0 7px;font-size:13px;font-weight:400;line-height:20px;display:flex;transition:background-color var(--ds-transition-duration) var(--ds-ease-in-out),border-color var(--ds-transition-duration) var(--ds-ease-in-out),box-shadow var(--ds-transition-duration) var(--ds-ease-in-out)}',
      '.gg-fab:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-fab:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-fab[aria-expanded="true"]{border-color:var(--dsw-alias-border-l3)}',
      '.gg-fab:disabled{cursor:default;border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-dimmed)}',
      '.gg-provDot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--gg-hue);border:1px solid color-mix(in srgb,var(--gg-hue) 55%,var(--dsw-alias-border-l3))}',
      /* 块头色点 = 颜色选择器入口；点开在块头下方出四色 + 自动 */
      '.gg-provDotBtn{box-sizing:border-box;appearance:none;border:0;background:0 0;margin:0;padding:2px;width:16px;height:16px;border-radius:var(--dsw-radius-sm);cursor:pointer;outline:none;display:grid;place-items:center;flex:none}',
      '.gg-provDotBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-provDotBtn:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-hueRow{align-items:center;gap:6px;margin:0 0 8px;display:flex;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}',
      '.gg-hueSwatch{box-sizing:border-box;appearance:none;width:16px;height:16px;border-radius:50%;border:1px solid color-mix(in srgb,var(--gg-sw) 55%,var(--dsw-alias-border-l3));background:var(--gg-sw);cursor:pointer;padding:0;outline:none}',
      '.gg-hueSwatch.on{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-2),0 0 0 4px color-mix(in srgb,var(--gg-sw) 70%,transparent)}',
      '.gg-hueSwatch:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-hueAuto{box-sizing:border-box;appearance:none;border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-tertiary);border-radius:999px;padding:1px 8px;font-size:10px;line-height:14px;font-family:var(--ds-font-family-code);cursor:pointer;outline:none}',
      '.gg-hueAuto:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-hueAuto.on{color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb,var(--gg-hue) 48%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--gg-hue) 14%,transparent)}',
      '.gg-hueAuto:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      /* 任意自定义色：原生取色器做成第 5 颗圆色块 */
      '.gg-hueCustom{box-sizing:border-box;appearance:none;width:18px;height:18px;padding:0;border:1px solid var(--dsw-alias-border-l3);border-radius:50%;background:0 0;cursor:pointer;outline:none;overflow:hidden;flex:none}',
      '.gg-hueCustom::-webkit-color-swatch-wrapper{padding:0}',
      '.gg-hueCustom::-webkit-color-swatch{border:0;border-radius:50%}',
      '.gg-hueCustom::-moz-color-swatch{border:0;border-radius:50%}',
      '.gg-hueCustom.on{box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-2),0 0 0 4px color-mix(in srgb,var(--gg-hue) 70%,transparent)}',
      '.gg-hueCustom:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-name{color:inherit;text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}',
      '.gg-fbEff{flex:none;color:var(--dsw-alias-label-caption);font-family:var(--ds-font-family-code);font-size:11px;line-height:20px}',
      '.gg-chev{flex:none;transition:transform .12s var(--ds-ease-in-out);color:var(--dsw-alias-label-caption)}',
      '.gg-chev svg,.gg-close svg{display:block}',
      '.gg-chev.open{transform:rotate(180deg)}',
      '.gg-spin{width:12px;height:12px;flex:none;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--gg-hue) 30%,transparent);border-top-color:var(--gg-hue);animation:gg-spin .7s linear infinite}',

      /* 弹窗：全屏遮罩 + 星野 + 居中卡片 */
      '.gg-veil{position:fixed;inset:0;z-index:1200;outline:none;align-items:center;justify-content:center;padding:max(24px,var(--dsh-frame-overlay-top,24px)) 24px;display:flex}',
      '.gg-mask{position:absolute;inset:var(--dsh-frame-chrome-top,0px) 0 0;backdrop-filter:var(--dsw-menu-backdrop-filter);pointer-events:none}',
      '.gg-mask:before{content:"";position:absolute;inset:0;background:radial-gradient(62% 55% at 50% 40%,color-mix(in srgb,var(--gg-hue) 16%,transparent),transparent 72%)}',
      '.gg-mask:after{content:"";position:absolute;inset:0;background:var(--dsw-alias-bg-mask-1);animation:gg-fade var(--ds-transition-duration) var(--ds-ease-in-out)}',
      '.gg-stars{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
      '.gg-star{position:absolute;border-radius:50%;background:var(--dsw-alias-label-tertiary);opacity:var(--twmin,.15);animation:gg-twinkle var(--twd,3.4s) ease-in-out var(--twdl,0s) infinite}',
      /* 卡片尺寸恒定：高度只由视口决定（min(640, 100dvh-96)），不随 provider tab
         过滤后的块数增减而变化——否则切换 provider 时卡片重新居中、provider
         选择栏（.gg-tabs）会上下跳。内容超出由内部 .gg-scroll 滚动；内容不足
         留白，换取窗口位置/大小稳定。 */
      '.gg-card{position:relative;z-index:1;box-sizing:border-box;width:min(640px,100%);height:min(640px,calc(100dvh - 96px));max-height:min(640px,calc(100dvh - 96px));border:0;border-radius:var(--dsw-radius-panel);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-prominent);--dsw-elevation-stroke-color:var(--dsw-alias-border-l2);animation:gg-pop .3s cubic-bezier(.34,1.3,.5,1);overflow:hidden;flex-direction:column;display:flex}',

      '.gg-head{justify-content:space-between;align-items:flex-start;gap:8px;padding:20px 16px 12px 24px;display:flex}',
      '.gg-titleWrap{min-width:0}',
      '.gg-eyebrow{font-family:var(--ds-font-family-code);font-size:10px;line-height:15px;letter-spacing:.18em;text-transform:uppercase;color:color-mix(in srgb,var(--gg-hue) 72%,var(--dsw-alias-label-caption))}',
      '.gg-title{font-family:var(--dsw-font-family-brand);font-size:19px;line-height:26px;letter-spacing:.14em;font-weight:500;color:var(--dsw-alias-label-primary)}',
      '.gg-headR{flex:none;align-items:center;gap:10px;display:flex}',
      '.gg-prov{font-family:var(--ds-font-family-code);font-size:11px;line-height:28px;color:var(--dsw-alias-label-tertiary);text-align:right;text-overflow:ellipsis;white-space:nowrap;max-width:180px;overflow:hidden}',
      '.gg-close{width:28px;height:28px;border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;outline:none;flex:none;place-items:center;display:grid}',
      '.gg-close:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-close:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-tabs{gap:6px;padding:0 24px 6px;flex-wrap:wrap;display:flex}',
      '.gg-tab{box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:1px solid var(--dsw-alias-border-l2);outline:none;transition:background-color var(--ds-transition-duration) var(--ds-ease-in-out),color var(--ds-transition-duration) var(--ds-ease-in-out),border-color var(--ds-transition-duration) var(--ds-ease-in-out)}',
      '.gg-tabStar{display:grid;place-items:center;flex:none}',
      '.gg-tab:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-tab:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-tab.on{color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb,var(--gg-hue) 48%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--gg-hue) 14%,transparent)}',

      /* 搜索栏：过滤当前视图（全部=常用 / 单个 provider）的模型名 */
      '.gg-searchRow{position:relative;padding:0 24px 8px;display:flex}',
      '.gg-search{box-sizing:border-box;width:100%;height:30px;border-radius:var(--dsw-radius-sm);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code);font-size:12px;line-height:18px;padding:0 30px 0 9px;outline:none}',
      '.gg-search::placeholder{color:var(--dsw-alias-label-caption)}',
      '.gg-search:focus{border-color:color-mix(in srgb,var(--gg-hue) 44%,var(--dsw-alias-border-l2));box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-searchClear{position:absolute;right:28px;top:50%;transform:translateY(-50%);width:20px;height:20px;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-caption);cursor:pointer;display:grid;place-items:center;padding:0}',
      '.gg-searchClear:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}',
      '.gg-searchClear:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',

      /* 分块分区：每个 provider 一块，块内模型 chip 自动换行，名字不截断 */
      '.gg-body{flex:1 1 auto;min-height:0;padding:6px 16px 0;flex-direction:column;display:flex}',
      '.gg-scroll{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);overflow:auto;flex:1 1 auto;min-height:0}',
      '.gg-blk{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);padding:8px 9px;margin:0 0 8px}',
      '.gg-blk:last-child{margin-bottom:0}',
      '.gg-blkH{gap:7px;align-items:center;margin:0 0 7px;display:flex}',
      '.gg-blkName{font-family:var(--ds-font-family-code);font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-primary);white-space:normal;overflow-wrap:anywhere;min-width:0;flex:0 1 auto}',
      '.gg-blkCount{flex:none;font-family:var(--ds-font-family-code);font-size:10px;line-height:15px;color:var(--dsw-alias-label-tertiary)}',
      '.gg-blkM{gap:6px;flex-wrap:wrap;display:flex;align-items:flex-start}',
      /* 每个模型 = 一颗完整药丸：名字 chip + 思考强度分列 + ☆（兄弟 button，不嵌套） */
      '.gg-cell{box-sizing:border-box;position:relative;display:inline-flex;align-items:stretch;max-width:100%;border-radius:var(--dsw-radius-md);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);transition:border-color .1s var(--ds-ease-in-out),background-color .1s var(--ds-ease-in-out)}',
      '.gg-cell:hover{border-color:color-mix(in srgb,var(--gg-hue) 34%,var(--dsw-alias-border-l2))}',
      '.gg-cell.on{background:linear-gradient(155deg,color-mix(in srgb,var(--gg-hue) 18%,transparent),transparent 72%),var(--dsw-alias-bg-layer-3);border-color:color-mix(in srgb,var(--gg-hue) 55%,var(--dsw-alias-border-l2))}',
      '.gg-kb .gg-cell:focus-within{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-chip{box-sizing:border-box;appearance:none;border:0;background:0 0;max-width:100%;min-width:0;align-items:center;cursor:pointer;touch-action:manipulation;outline:none;padding:5px 8px 5px 9px;font-size:12px;line-height:16px;font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);white-space:normal;overflow-wrap:anywhere;text-align:left;display:inline-flex;gap:6px}',
      '.gg-cell.on .gg-chip{color:color-mix(in srgb,var(--gg-hue) 72%,var(--dsw-alias-label-primary));font-weight:500}',
      '.gg-chipName{min-width:0;overflow-wrap:anywhere}',
      /* 思考强度分列：同一颗药丸内每档一枚可点分段（只有适配器声明 efforts 的模型才有） */
      '.gg-eff{box-sizing:border-box;appearance:none;border:0;border-left:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;outline:none;padding:0 7px;font-size:11px;line-height:16px;font-family:var(--ds-font-family-code);white-space:nowrap;transition:background-color .1s var(--ds-ease-in-out),color .1s var(--ds-ease-in-out)}',
      '.gg-eff:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.gg-eff.on{background:color-mix(in srgb,var(--gg-hue) 14%,transparent);color:color-mix(in srgb,var(--gg-hue) 76%,var(--dsw-alias-label-primary));font-weight:500}',
      /* ☆ 收藏钮：药丸最右一段；未收藏时 hover/focus 才显形 */
      '.gg-pin{box-sizing:border-box;appearance:none;border:0;border-left:1px solid var(--dsw-alias-border-l2);border-radius:0 var(--dsw-radius-md) var(--dsw-radius-md) 0;background:0 0;color:var(--dsw-alias-label-caption);cursor:pointer;display:grid;place-items:center;width:20px;padding:0;opacity:0;align-self:stretch;transition:opacity .1s var(--ds-ease-in-out),color .1s var(--ds-ease-in-out),background-color .1s var(--ds-ease-in-out)}',
      '.gg-cell:hover .gg-pin,.gg-cell:focus-within .gg-pin{opacity:1}',
      '.gg-pin.on{opacity:1;color:color-mix(in srgb,var(--gg-hue) 82%,var(--dsw-alias-label-primary))}',
      '.gg-pin:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-pin:focus-visible{box-shadow:inset 0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-favNote{color:var(--dsw-alias-label-tertiary);padding:2px 2px 8px;font-size:12px;line-height:18px}',
      '.gg-noteSub{color:var(--dsw-alias-label-caption);margin-top:4px;font-size:11px;line-height:16px}',

      '.gg-foot{justify-content:space-between;align-items:center;gap:10px;margin:10px 0 0;padding:9px 24px 14px;border-top:.5px solid var(--dsw-alias-border-l2);display:flex}',
      '.gg-cur{font-family:var(--ds-font-family-code);font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}',
      '.gg-cur b{font-weight:500;color:color-mix(in srgb,var(--gg-hue) 74%,var(--dsw-alias-label-primary))}',
      '.gg-hint{flex:none;font-family:var(--ds-font-family-code);font-size:10px;line-height:15px;letter-spacing:.04em;color:var(--dsw-alias-label-caption)}',
      '.gg-note{color:var(--dsw-alias-label-tertiary);padding:8px 24px 18px;font-size:12px;line-height:18px}',
      '.gg-err{justify-content:space-between;align-items:flex-start;gap:6px;margin:8px 24px 0;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);padding:6px 8px;font-size:11px;line-height:16px;display:flex}',
      '.gg-retry{display:inline-block;color:inherit;font:inherit;cursor:pointer;background:0 0;border:none;outline:none;flex:none;padding:0;font-weight:600}',
      '.gg-retry:focus-visible{border-radius:var(--dsw-radius-sm);box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',

      '@keyframes gg-spin{to{transform:rotate(360deg)}}',
      '@keyframes gg-fade{from{opacity:0}to{opacity:1}}',
      '@keyframes gg-pop{from{opacity:0;transform:translateY(12px) scale(.95)}to{opacity:1;transform:none}}',
      '@keyframes gg-twinkle{0%,100%{opacity:var(--twmin,.15)}50%{opacity:var(--twmax,.6)}}',
      '@media (max-width:560px){.gg-card{width:min(420px,100%)}.gg-title{font-size:16px}.gg-hint{display:none}}',
      '@media (prefers-reduced-motion:reduce){.gg-fab,.gg-chev,.gg-chip,.gg-cell,.gg-eff,.gg-tab,.gg-pin,.gg-star,.gg-mask:after,.gg-card,.gg-spin{animation:none;transition:none}}'
    ].join('');

    let stylesReady = false;
    function ensureStyles() {
      if (stylesReady || typeof document === 'undefined') return;
      if (document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]')) { stylesReady = true; return; }
      const tag = document.createElement('style');
      tag.dataset.plugin = PKG;
      tag.dataset.pluginCss = STYLE_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
      stylesReady = true;
    }

    /* ── 图标（仅功能性的触发器箭头、关闭 ×、常用 ☆；模型本身无图标） ─ */
    const sv = (w, d, sw) => j('svg', { width: w, height: w, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: sw ?? 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, j('path', { d: d }));
    const chevron = () => sv(12, 'M4 6.5 8 10.5 12 6.5');
    const closeX = () => sv(14, 'M3.75 3.75 12.25 12.25M12.25 3.75 3.75 12.25');
    /** 常用 ☆：filled=true 为已收录（实心），否则描边；唯一新增图标，功能按钮。 */
    const starIcon = (filled, size) => {
      const w = size || 12;
      return j('svg', { width: w, height: w, viewBox: '0 0 16 16', fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: filled ? 0 : 1.4, strokeLinejoin: 'round', 'aria-hidden': true }, j('path', { d: 'M8 1.9l1.85 3.78 4.15.6-3 2.95.7 4.17L8 11.42l-3.7 1.98.7-4.17-3-2.95 4.15-.6z' }));
    };

    /** 星野：固定种子的伪随机分布，一次生成不重排。 */
    function makeStars(n) {
      let s = 20240901;
      const rand = () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s / 0x7fffffff; };
      const out = [];
      for (let i = 0; i < n; i++) {
        const big = rand() < 0.2;
        out.push({ key: i, left: rand() * 100, top: rand() * 100, size: big ? 2 : 1, min: 0.05 + rand() * 0.1, max: 0.26 + rand() * 0.48, dur: 2.6 + rand() * 3.8, delay: rand() * 4 });
      }
      return out;
    }
    const STAR_FIELDS = [makeStars(44)];

    /* ── 弹窗 ─────────────────────────────────────────────────────── */
    function GearDialog(props) {
      const t = props.t;
      const state = props.state;
      const groups = state.groups || EMPTY;
      const favs = useFavs();
      useHueMap();
      const current = props.current;
      /* 四档色相的可读名（给颜色选择器做 aria/title；字面 t() 便于静态自检）。 */
      const hueLabels = [t('hue.blue'), t('hue.green'), t('hue.amber'), t('hue.purple'), t('hue.cyan'), t('hue.teal'), t('hue.lime'), t('hue.red'), t('hue.pink')];
      const [query, setQuery] = react.useState('');
      const [hueOpen, setHueOpen] = react.useState(null);
      const searchRef = react.useRef(null);
      const q = query.trim().toLowerCase();
      const matchName = (name) => !q || String(name).toLowerCase().includes(q);
      const matchModel = (m) => matchName(m.name) || matchName(m.id);
      const matchGroup = (g) => matchName(g.name);
      const curGroup = current ? groups.find((g) => g.id === current.provider) || null : null;
      const curModel = curGroup ? (curGroup.models || EMPTY).find((m) => m.id === current.model) || null : null;
      const curReasoning = curModel && curModel.reasoning;
      const curEffortId = current ? (current.reasoningEffort !== undefined ? current.reasoningEffort : (curReasoning && curReasoning.defaultEffort)) : undefined;
      const curEffortName = !curReasoning ? null : curEffortId === undefined ? t('effort.providerDefault') : ((curReasoning.efforts.find((e) => e.id === curEffortId) || {}).name || curEffortId);
      /* 「全部」= 只显示手动 star 的常用模型，且**按 provider 分组**：每个有常用
         模型的 provider 一块，块头写出 provider 名（同名模型靠块头区分）。
         「具体 provider」= 该 provider 的全部可用模型块。空 provider 一律剔除。
         搜索词对两种视图都生效：匹配模型名/id，或整块匹配 provider 名。 */
      const searchMode = q !== '';
      let rows = EMPTY;
      if (searchMode) {
        /* 搜索是**全局**的，不缩在当前视图里：所有 provider 一起搜，
           结果仍按 provider 分块（同名模型靠块头区分），占据整个内容区。 */
        const out = [];
        for (const g of groups) {
          const groupHit = matchGroup(g);
          const models = (g.models || EMPTY).filter((m) => groupHit || matchModel(m));
          if (models.length) out.push({ id: g.id, name: g.name, models });
        }
        rows = out;
      } else if (props.tab !== null) {
        rows = groups.filter((g) => g.id === props.tab && (g.models || EMPTY).length > 0);
      } else if (favs.length) {
        const out = [];
        for (const g of groups) {
          const models = (g.models || EMPTY).filter((m) => isFav(favs, g.id, m.id));
          if (models.length) out.push({ id: g.id, name: g.name, fav: true, models });
        }
        rows = out;
      }

      const [focus, setFocus] = react.useState(() => {
        const p = current ? rows.findIndex((g) => g.id === current.provider) : -1;
        const g = p >= 0 ? rows[p] : rows[0];
        const c = g ? g.models.findIndex((m) => m.id === (current ? current.model : '') && (!m.provider || m.provider === current.provider)) : -1;
        return { p: p >= 0 ? p : 0, c: c >= 0 ? c : 0 };
      });
      const sweeping = react.useRef(false);
      const veilRef = react.useRef(null);
      const [kbFocus, setKbFocus] = react.useState(false);
      /* 顶部 tab 的 id 序列（null = 全部）。方向键在 tab 区直接切换 provider。 */
      const tabIds = [null, ...groups.map((g) => g.id)];
      const focusTabButton = (id) => {
        const sel = id === null ? '[data-gg-tab="__all__"]' : '[data-gg-tab="' + id + '"]';
        const el = veilRef.current && veilRef.current.querySelector(sel);
        if (el) el.focus();
      };
      /* 点/选 tab 时退出全局搜索，回到该视图。 */
      const activateTab = (id) => { if (query !== '') setQuery(''); props.onTab(id); };
      const stepTab = (delta) => {
        const at = Math.max(0, tabIds.indexOf(props.tab));
        const next = tabIds[Math.min(Math.max(0, at + delta), tabIds.length - 1)];
        activateTab(next);
        requestAnimationFrame(() => focusTabButton(next));
      };

      const nP = rows.length;
      const fr = nP ? Math.min(Math.max(0, focus.p), nP - 1) : 0;
      const block = rows[fr] || null;
      const nC = block ? block.models.length : 0;
      const fc = nC ? Math.min(Math.max(0, focus.c), nC - 1) : 0;

      /** 提交一次选择；effort 省略时用该模型声明的默认档。 */
      function commit(p, c, effort) {
        const g = rows[p];
        const m = g && g.models[c];
        if (!m) return;
        const selection = { provider: m.provider || g.id, model: m.id };
        const chosen = effort !== undefined ? effort : (m.reasoning && m.reasoning.defaultEffort);
        if (chosen !== undefined) selection.reasoningEffort = chosen;
        props.onSelect(selection);
      }
      const settle = (p, c) => { commit(p, c); props.onClose(); };
      /* 思考强度分段：点哪档就带哪档提交（同一个 pill 内直接完成模型+强度）。 */
      const settleEffort = (p, c, effort) => { commit(p, c, effort); props.onClose(); };
      /* 方向键移动"真焦点"：状态只改 tabIndex 不搬 DOM 焦点，键盘环不会动，
         所以这里同时把 DOM 焦点移到目标 chip（并让 .gg-focus 画环）。 */
      const focusCell = (p, c) => {
        const np = Math.min(Math.max(0, p), Math.max(0, nP - 1));
        const g = rows[np];
        if (!g || !g.models.length) return;
        const nc = Math.min(Math.max(0, c), g.models.length - 1);
        setFocus({ p: np, c: nc });
        const el = veilRef.current && veilRef.current.querySelector('[data-gg-p="' + np + '"][data-gg-c="' + nc + '"]');
        if (el) el.focus();
      };

      react.useLayoutEffect(() => { if (veilRef.current) veilRef.current.focus(); }, []);
      /* 取消最后一个常用后 chip 全部卸载，焦点会掉到 body——收回弹窗，
         这样 Esc/方向键仍可用（点击遮罩关闭本来就不依赖焦点）。 */
      react.useEffect(() => { if (!rows.length && veilRef.current) veilRef.current.focus(); }, [rows.length]);
      /* 搜索词变化 → 键盘焦点回到第一条可见结果，Enter 直接选它。 */
      react.useEffect(() => { setFocus({ p: 0, c: 0 }); }, [query]);

      /**
       * 鼠标拖拽扫选：pointerdown 即提交并跟随，释放时收手（关闭）。
       * 监听器在 pointerdown 内同步挂上，不依赖渲染往返；{once} 保证只触发一次。
       * touch 不走这里（touch 由 onClick 处理），避免 touch-action 抢占滚动。
       */
      const cellDown = (e, p, c) => {
        if (e.pointerType !== 'mouse' || !rows[p] || !rows[p].models[c]) return;
        e.preventDefault();
        sweeping.current = true;
        setFocus({ p, c });
        commit(p, c);
        const end = () => {
          sweeping.current = false;
          window.removeEventListener('pointerup', end);
          window.removeEventListener('pointercancel', end);
          props.onClose();
        };
        window.addEventListener('pointerup', end, { once: true });
        window.addEventListener('pointercancel', end, { once: true });
      };
      const cellEnter = (p, c) => { if (sweeping.current && rows[p] && rows[p].models[c]) { setFocus({ p, c }); commit(p, c); } };

      function onKey(e) {
        const k = e.key;
        if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); props.onClose(); return; }
        const target = e.target;
        /* 搜索框里打字时把按键还给原生输入（Enter=选第一个可见模型）；
           '/' 是聚焦搜索框的快捷键（焦点在按钮/网格时）。 */
        const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable === true);
        if (inField) {
          if (k === 'Enter') {
            const g0 = rows[fr];
            const m0 = g0 && g0.models[fc];
            if (m0) { e.preventDefault(); settle(fr, fc); }
          } else if (k === 'ArrowDown') {
            e.preventDefault();
            setKbFocus(true);
            focusCell(0, 0);
          }
          return;
        }
        if (k === '/') { e.preventDefault(); setKbFocus(true); if (searchRef.current) searchRef.current.focus(); return; }
        if (/^Arrow|^Home$|^End$|^Tab$|^Enter$/.test(k)) setKbFocus(true);
        /* tab 区：左右方向键直接切换 provider（不另开子菜单/不跳焦点）。 */
        const onTabBtn = !!(target && target.closest && target.closest('.gg-tab'));
        if (onTabBtn) {
          if (k === 'ArrowLeft') { e.preventDefault(); stepTab(-1); return; }
          if (k === 'ArrowRight') { e.preventDefault(); stepTab(1); return; }
          if (k === 'Home') { e.preventDefault(); stepTab(-tabIds.length); return; }
          if (k === 'End') { e.preventDefault(); stepTab(tabIds.length); return; }
          if (k === 'ArrowDown') { e.preventDefault(); focusCell(fr, fc); return; }
          return;
        }
        const chipEl = target && target.closest && target.closest('.gg-chip');
        const onChip = !!chipEl;
        const onButton = !!(target && target.closest && target.closest('button'));
        /* 事件目标若是 chip，用该 chip 的 data-gg-p/c（鼠标点过/聚焦的格子）；
           否则回落到键盘焦点状态。避免"焦点在 B 却提交了 A"的错位。 */
        const p0 = chipEl ? Number(chipEl.getAttribute('data-gg-p')) : NaN;
        const c0 = chipEl ? Number(chipEl.getAttribute('data-gg-c')) : NaN;
        const cp = Number.isInteger(p0) ? p0 : fr;
        const cc = Number.isInteger(c0) ? c0 : fc;
        /* Enter/Tab 只在 chip 上"提交并归还焦点"；tab 与关闭按钮是原生
           button，走浏览器默认激活，不在这里截获。 */
        if (k === 'Enter') {
          if (onChip || !onButton) { e.preventDefault(); e.stopPropagation(); settle(cp, cc); }
          return;
        }
        if (k === 'Tab') {
          if (onChip) { e.preventDefault(); e.stopPropagation(); settle(cp, cc); }
          return;
        }
        /* F = 收录/移出当前聚焦模型的常用（与 chip 右侧 ☆ 等价，键盘可达入口）。 */
        if (k === 'f' || k === 'F') {
          const g = rows[cp];
          const m = g && g.models[cc];
          if (m) { e.preventDefault(); toggleFav(m.provider || g.id, m.id); }
          return;
        }
        if (k === 'ArrowRight') { e.preventDefault(); focusCell(fr, Math.min(nC - 1, fc + 1)); return; }
        if (k === 'ArrowLeft') { e.preventDefault(); focusCell(fr, Math.max(0, fc - 1)); return; }
        if (k === 'ArrowDown') { e.preventDefault(); focusCell(Math.min(nP - 1, fr + 1), fc); return; }
        /* 网格最上面再按 ↑ 回到 provider tab 区（再按 ←/→ 就是切 provider）。 */
        if (k === 'ArrowUp') { e.preventDefault(); if (fr === 0) focusTabButton(props.tab); else focusCell(fr - 1, fc); return; }
        if (k === 'Home') { e.preventDefault(); focusCell(fr, 0); return; }
        if (k === 'End') { e.preventDefault(); focusCell(fr, nC - 1); }
      }

      const stars = STAR_FIELDS[0].map((s) => j('span', {
        key: s.key,
        className: 'gg-star',
        style: { left: s.left + '%', top: s.top + '%', width: s.size + 'px', height: s.size + 'px', '--twmin': s.min.toFixed(2), '--twmax': s.max.toFixed(2), '--twd': s.dur.toFixed(2) + 's', '--twdl': s.delay.toFixed(2) + 's' }
      }));

      /** 一个 provider 块。常用视图复用同一渲染：只放打了 star 的模型，
          块头照样写出 provider 名，同名模型靠块头区分。 */
      const renderBlock = (g, p) => j('section', {
        key: 'blk' + g.id,
        className: 'gg-blk',
        style: { '--gg-hue': hueForProvider(g.id) },
        role: 'group',
        'aria-label': g.fav ? t('grid.favProvider', { provider: g.name, n: g.models.length }) : t('grid.provider', { provider: g.name, n: g.models.length })
      }, [
        j('div', { key: 'hd', className: 'gg-blkH' }, [
          j('button', {
            key: 'd',
            type: 'button',
            className: 'gg-provDotBtn',
            title: t('hue.pick', { provider: g.name }),
            'aria-label': t('hue.pick', { provider: g.name }),
            'aria-expanded': hueOpen === g.id,
            onPointerDown: (e) => { e.stopPropagation(); },
            onClick: (e) => { e.preventDefault(); e.stopPropagation(); setHueOpen(hueOpen === g.id ? null : g.id); }
          }, j('span', { key: 'dot', className: 'gg-provDot', 'aria-hidden': true })),
          j('span', { key: 'n', className: 'gg-blkName' }, g.name),
          j('span', { key: 'c', className: 'gg-blkCount' }, String(g.models.length))
        ]),
        /* 颜色选择：四档 + 自动（自动 = 删覆盖项，回落哈希） */
        hueOpen === g.id
          ? j('div', { key: 'hue', className: 'gg-hueRow', role: 'group', 'aria-label': t('hue.pick', { provider: g.name }) }, [
              ...HUES.map((color, slot) => j('button', {
                key: 'hue' + slot,
                type: 'button',
                className: 'gg-hueSwatch' + (readHueMap()[g.id] === slot ? ' on' : ''),
                style: { '--gg-sw': color },
                title: hueLabels[slot],
                'aria-label': hueLabels[slot],
                'aria-pressed': readHueMap()[g.id] === slot,
                onClick: (e) => { e.preventDefault(); e.stopPropagation(); setProviderHue(g.id, slot); setHueOpen(null); }
              })),
              /* 自定义：原生取色器，任意 #rrggbb；改动时保持面板开着方便继续调 */
              j('input', {
                key: 'custom',
                type: 'color',
                className: 'gg-hueCustom' + (typeof readHueMap()[g.id] === 'string' ? ' on' : ''),
                value: typeof readHueMap()[g.id] === 'string' ? readHueMap()[g.id] : '#b78bfa',
                title: t('hue.custom'),
                'aria-label': t('hue.custom'),
                onChange: (e) => setProviderHue(g.id, e.target.value)
              }),
              j('button', {
                key: 'auto',
                type: 'button',
                className: 'gg-hueAuto' + (readHueMap()[g.id] === undefined ? ' on' : ''),
                onClick: (e) => { e.preventDefault(); e.stopPropagation(); setProviderHue(g.id, undefined); setHueOpen(null); }
              }, t('hue.auto'))
            ])
          : null,
        j('div', { key: 'md', className: 'gg-blkM' }, g.models.map((m, c) => {
          const prov = m.provider || g.id;
          const sel = !!current && current.provider === prov && current.model === m.id;
          const fav = isFav(favs, prov, m.id);
          const reasoning = m.reasoning;
          const efforts = reasoning && Array.isArray(reasoning.efforts) ? reasoning.efforts : EMPTY;
          /* 当前生效档 = 显式选择 > 模型默认档；只有当前模型的那一档高亮。 */
          const effSel = sel ? (current.reasoningEffort !== undefined ? current.reasoningEffort : (reasoning && reasoning.defaultEffort)) : undefined;
          return j('div', {
            key: prov + '/' + m.id,
            className: 'gg-cell' + (sel ? ' on' : ''),
            style: { '--gg-hue': hueForProvider(prov) }
          }, [
            j('button', {
              key: 'chip',
              type: 'button',
              className: 'gg-chip',
              'aria-label': t('grid.cell', { model: m.name }),
              'aria-pressed': sel,
              'data-gg-p': p,
              'data-gg-c': c,
              tabIndex: p === fr && c === fc ? 0 : -1,
              onPointerDown: (e) => cellDown(e, p, c),
              onPointerEnter: () => cellEnter(p, c),
              /* 鼠标/程序聚焦任何 chip 时同步键盘焦点状态：之后的 F/方向键
                 从当前真实聚焦格子继续，而不是从初始 (0,0) 继续。 */
              onFocus: () => { if (fr !== p || fc !== c) setFocus({ p, c }); },
              onClick: () => settle(p, c)
            }, j('span', { key: 'nm', className: 'gg-chipName' }, m.name)),
            /* 思考强度分列：同一颗 pill 内每档一枚可点分段，点它直接提交模型+档位。
               未声明 efforts 的模型（本机大多数）没有这一段，pill 外观与原来一致。 */
            ...efforts.map((eff) => j('button', {
              key: 'eff:' + eff.id,
              type: 'button',
              className: 'gg-eff' + (effSel === eff.id ? ' on' : ''),
              'aria-label': t('effort.cell', { effort: eff.name }),
              'aria-pressed': effSel === eff.id,
              tabIndex: -1,
              onPointerDown: (e) => { e.stopPropagation(); },
              onClick: (e) => { e.preventDefault(); e.stopPropagation(); settleEffort(p, c, eff.id); }
            }, eff.name)),
            /* ☆ 与 chip 是兄弟 button（不能嵌套 button）。tabIndex=-1：键盘用 F 收录/移出。 */
            j('button', {
              key: 'pin',
              type: 'button',
              className: 'gg-pin' + (fav ? ' on' : ''),
              tabIndex: -1,
              'aria-label': fav ? t('fav.remove', { model: m.name }) : t('fav.add', { model: m.name }),
              'aria-pressed': fav,
              onPointerDown: (e) => { e.stopPropagation(); },
              onClick: (e) => { e.preventDefault(); e.stopPropagation(); toggleFav(prov, m.id); }
            }, starIcon(fav, 11))
          ]);
        }))
      ]);

      return j('div', {
        id: 'gg-veil',
        ref: veilRef,
        className: 'gg-veil' + (kbFocus ? ' gg-kb' : ''),
        role: 'dialog',
        onPointerDown: () => { if (kbFocus) setKbFocus(false); },
        'aria-modal': true,
        'aria-label': t('dialog.aria'),
        tabIndex: -1,
        style: curGroup ? { '--gg-hue': hueForProvider(curGroup.id) } : null,
        /* 点在卡片外即关闭（mask 已 pointer-events:none，点击落到此处）。 */
        onClick: (e) => { if (e.target === e.currentTarget) props.onClose(); },
        onKeyDown: onKey
      }, [
        j('div', { key: 'mask', className: 'gg-mask', 'aria-hidden': true }),
        j('div', { key: 'stars', className: 'gg-stars', 'aria-hidden': true }, stars),
        j('div', { key: 'card', className: 'gg-card' }, [
          /* 头部 */
          j('div', { key: 'head', className: 'gg-head' }, [
            j('div', { key: 'tw', className: 'gg-titleWrap' }, [
              j('div', { key: 'eb', className: 'gg-eyebrow' }, t('dialog.eyebrow')),
              j('div', { key: 'tt', className: 'gg-title' }, t('dialog.title'))
            ]),
            j('div', { key: 'hr', className: 'gg-headR' }, [
              curGroup ? j('div', { key: 'pv', className: 'gg-prov' }, curGroup.name + ' · ' + curGroup.models.length) : null,
              j('button', { key: 'cl', type: 'button', className: 'gg-close', 'aria-label': t('dialog.close'), onClick: () => props.onClose() }, closeX())
            ])
          ]),
          /* 搜索框放在 provider 选项上面；搜索是**全局**的，不缩在当前视图里。 */
          j('div', { key: 'searchRow', className: 'gg-searchRow' }, [
            j('input', {
              key: 'q',
              ref: searchRef,
              className: 'gg-search',
              type: 'search',
              value: query,
              placeholder: t('search.placeholder'),
              'aria-label': t('search.placeholder'),
              onChange: (e) => setQuery(e.target.value)
            }),
            query
              ? j('button', { key: 'x', type: 'button', className: 'gg-searchClear', 'aria-label': t('search.clear'), onClick: () => { setQuery(''); if (searchRef.current) searchRef.current.focus(); } }, closeX())
              : null
          ]),
          /* 顶部 tab：全部 / 各 provider。搜索时不高亮任何 tab（结果跨 provider）；
             点 tab 或方向键选 provider 都会退出搜索、回到该视图。 */
          j('div', { key: 'tabs', className: 'gg-tabs', role: 'tablist', 'aria-label': t('tab.aria') }, [
            j('button', {
              key: 'all',
              type: 'button',
              role: 'tab',
              'data-gg-tab': '__all__',
              className: 'gg-tab' + (!searchMode && props.tab === null ? ' on' : ''),
              'aria-selected': !searchMode && props.tab === null,
              onClick: () => activateTab(null)
            }, [
              j('span', { key: 'i', className: 'gg-tabStar', 'aria-hidden': true }, starIcon(true, 10)),
              j('span', { key: 't' }, t('tab.all'))
            ]),
            ...groups.map((g) => j('button', {
              key: g.id,
              type: 'button',
              role: 'tab',
              'data-gg-tab': g.id,
              className: 'gg-tab' + (!searchMode && props.tab === g.id ? ' on' : ''),
              'aria-selected': !searchMode && props.tab === g.id,
              style: { '--gg-hue': hueForProvider(g.id) },
              onClick: () => activateTab(g.id)
            }, g.name))
          ]),
          /* 搜索中：全局结果按 provider 分块占满内容区；否则 全部=常用 / provider=全量。 */
          searchMode
            ? j('div', { key: 'body', className: 'gg-body' }, [
                j('div', { key: 'scroll', className: 'gg-scroll' }, rows.length
                  ? rows.map((g, p) => renderBlock(g, p))
                  : j('div', { key: 'sempty', className: 'gg-note' }, [
                      j('div', { key: 'txt' }, state.status === 'loading' ? t('grid.loading') : t('search.empty', { q: query.trim() })),
                      state.status === 'error' ? j('button', { key: 'ry', type: 'button', className: 'gg-retry', style: { marginTop: 6 }, onClick: () => props.onReload() }, t('grid.retry')) : null
                    ]))
              ])
            : props.tab === null
              ? j('div', { key: 'body', className: 'gg-body' }, [
                  j('div', { key: 'scroll', className: 'gg-scroll' }, rows.length
                    ? rows.map((g, p) => renderBlock(g, p))
                    : j('div', { key: 'favempty', className: 'gg-favNote' }, [
                        j('div', { key: 't1' }, state.status === 'loading' ? t('grid.loading') : t('fav.empty')),
                        state.status === 'loading' ? null : j('div', { key: 't2', className: 'gg-noteSub' }, t('fav.emptyHint'))
                      ]))
                ])
              : rows.length
                ? j('div', { key: 'body', className: 'gg-body' }, [
                    j('div', { key: 'scroll', className: 'gg-scroll' }, rows.map((g, p) => renderBlock(g, p)))
                  ])
                : j('div', { key: 'empty', className: 'gg-note' }, [
                    j('div', { key: 'txt' }, state.status === 'loading' ? t('grid.loading') : t('grid.empty')),
                    state.status === 'error' ? j('button', { key: 'ry', type: 'button', className: 'gg-retry', style: { marginTop: 6 }, onClick: () => props.onReload() }, t('grid.retry')) : null
                  ]),
          /* 错误条 */
          state.error ? j('div', { key: 'err', className: 'gg-err' }, [
            j('span', { key: 'm' }, t('grid.error', { message: state.error })),
            j('button', { key: 'ry', type: 'button', className: 'gg-retry', onClick: () => props.onReload() }, t('grid.retry'))
          ]) : null,
          /* 底部：当前接入 + 键盘提示 */
          j('div', { key: 'foot', className: 'gg-foot' }, [
            j('div', { key: 'cur', className: 'gg-cur', style: curGroup ? { '--gg-hue': hueForProvider(curGroup.id) } : null }, curModel ? [
              j('b', { key: 'm' }, curModel.name),
              j('span', { key: 's' }, ' · ' + curGroup.name),
              curEffortName ? j('span', { key: 'e' }, ' · ' + curEffortName) : null,
              state.pending ? j('span', { key: 'p' }, ' · ' + t('status.pending')) : null
            ] : t('seat.fallback')),
            j('div', { key: 'hint', className: 'gg-hint' }, t('footer.hint'))
          ])
        ])
      ]);
    }

    /* ── seat：药丸触发器 ─────────────────────────────────────────── */
    function GearGridSeat(props) {
      const t = props.t;
      useHueMap();
      const state = react.useSyncExternalStore(
        (fn) => props.directory.subscribe(fn),
        () => props.directory.getSnapshot()
      );
      const [open, setOpen] = react.useState(false);
      const [tab, setTab] = react.useState(null);
      const rootRef = react.useRef(null);
      const fabRef = react.useRef(null);

      react.useEffect(() => { ensureStyles(); }, []);
      react.useEffect(() => { if (props.available) props.load(); }, [props.available, props.load]);
      /* 原生 model seat 是 single slot，不能替换，只能折叠显示。
         无 deps = 每次渲染后都跑（幂等）：本组件与原生 seat 订阅同一个 directory store，
         目录加载完成时同一次提交里两边一起重渲染，那时才查得到它的 aria-haspopup 触发器。
         再补一串 rAF 重试，覆盖「原生 seat 先渲染占位、后渲染触发器」的跨提交情况。 */
      react.useEffect(() => {
        let alive = true;
        let frames = 0;
        const tick = () => {
          if (!alive) return;
          hideStockSeat(rootRef.current);
          if (++frames < 20) requestAnimationFrame(tick);
        };
        tick();
        return () => { alive = false; };
      });

      const groups = state.groups || EMPTY;
      const current = state.current || null;
      const curGroup = current ? groups.find((g) => g.id === current.provider) || null : null;
      const curModel = curGroup ? (curGroup.models || EMPTY).find((m) => m.id === current.model) || null : null;
      /* 触发器药丸里同时写模型与思考强度（与原生 seat 同形）：只有模型声明了
         reasoning efforts 才显示；未显式选档时显示默认档名。 */
      const curReasoning = curModel && curModel.reasoning;
      const curEffortId = current ? (current.reasoningEffort !== undefined ? current.reasoningEffort : (curReasoning && curReasoning.defaultEffort)) : undefined;
      const effortName = !curReasoning ? null : curEffortId === undefined ? t('effort.providerDefault') : ((curReasoning.efforts.find((e) => e.id === curEffortId) || {}).name || curEffortId);
      const label = curModel ? curModel.name : (state.status === 'loading' ? t('seat.loading') : t('seat.fallback'));
      const aria = curModel ? (effortName === null ? t('seat.aria', { model: curModel.name }) : t('seat.ariaEffort', { model: curModel.name, effort: effortName })) : t('seat.fallback');

      const close = () => {
        setOpen(false);
        const fab = fabRef.current;
        if (fab) requestAnimationFrame(() => fab.focus());
      };

      const kids = [
        j('button', {
          ref: fabRef,
          key: 'fab',
          type: 'button',
          className: 'gg-fab',
          style: curGroup ? { '--gg-hue': hueForProvider(curGroup.id) } : null,
          'aria-label': aria,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          'aria-controls': open ? 'gg-veil' : null,
          disabled: !props.available,
          onClick: () => { if (!open) { setTab(null); setOpen(true); } }
        }, [
          j('span', { key: 'd', className: 'gg-provDot', 'aria-hidden': true }),
          j('span', { key: 'n', className: 'gg-name' }, label),
          effortName === null ? null : j('span', { key: 'e', className: 'gg-fbEff' }, effortName),
          state.pending
            ? j('span', { key: 's', className: 'gg-spin', 'aria-hidden': true })
            : j('span', { key: 'c', className: 'gg-chev' + (open ? ' open' : ''), 'aria-hidden': true }, chevron())
        ])
      ];
      if (open && props.available) kids.push(j(GearDialog, {
        key: 'veil',
        t,
        state,
        tab,
        onTab: setTab,
        current,
        onClose: close,
        onReload: () => props.load(),
        onSelect: (sel) => { const p = props.select(sel); if (p && p.catch) p.catch(() => {}); }
      }));
      return j('div', { ref: rootRef, className: 'gg-seat', 'data-gg': '1' }, kids);
    }

    /**
     * 折叠原生 model seat：向上找**最近的、包含 model slot 的祖先**，把该 slot 的包装层
     * 置 `display:none`。只动显示，不卸载 —— 原生模块继续提供 ModelDirectoryResolver
     * 与 /model 命令，本包的数据与提交都走它。
     *
     * 为什么不能只看 parentElement：slot 条目会被包一层
     * `<div data-slot="conversation.input.right" style="display:contents">`，
     * 所以本组件的 parentElement 是**自己的 slot 包装层**，不是 composer 工具行；
     * 原生 seat 在另一个包装层 `<div data-slot="conversation.input.model">` 里，
     * 两者是兄弟关系。按 data-slot 定位比按 aria-haspopup 扫兄弟稳：
     * 不依赖原生触发器何时渲染、也不会误伤工作区选择等其他菜单按钮。
     *
     * 幂等（data-gg-hidden 标记），可反复调用；原生 seat 尚未挂载时静默返回。
     */
    function hideStockSeat(root) {
      if (!root || !root.isConnected) return;
      for (let node = root.parentElement, depth = 0; node && depth < 6; node = node.parentElement, depth++) {
        const seat = node.querySelector('[data-slot="conversation.input.model"]');
        if (!seat || seat === root || seat.contains(root)) continue;
        if (seat.hasAttribute('data-gg-hidden')) return;
        seat.style.setProperty('display', 'none');
        seat.setAttribute('data-gg-hidden', '1');
        return;
      }
    }

    /* ── 注册 ─────────────────────────────────────────────────────── */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'gear-grid-model: dictionaries');
      const t = ctx.locale.bind(NS);
      ctx.inject(['slots', 'modelDirectories'], (scope) => {
        const models = scope.modelDirectories;
        const sessions = scope.sessions;
        scope.slots.inject(SLOT, () => scope.slots.register({
          name: SLOT,
          id: ENTRY,
          order: 0,
          locale: NS,
          label: () => t('seat.fallback'),
          inject: (sessionId) => {
            const directory = models.directoryFor(sessionId);
            const available = sessions.subagentAddress(sessionId) === void 0;
            return {
              available,
              directory: directory.store,
              load: () => { if (available) directory.load().catch(() => {}); },
              select: (selection) => available ? directory.select(selection) : Promise.resolve(void 0)
            };
          }
        }, GearGridSeat));
      });
    }

    return { inject: INJECT, apply };
  }
});
