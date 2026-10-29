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
         · 触发器：28px 药丸，provider 色点 + 模型名 + 下拉箭头，无图标无辉光
         · 弹窗：全屏星野遮罩 + 居中卡片（blur 遮罩 + 当前 provider 的星云染色）
           **卡片高度固定**（不随 provider tab 过滤结果伸缩），切换 provider 时
           provider 选择栏与窗口位置/大小都不动，内容超出走内部滚动。
         · 内容：**按 provider 分块分区**——每个 provider 一个独立块
           （色点 + 名字 + 数量做块头，模型以自动换行的 chip 排列，名字不截断）
         · 默认「全部」：所有 provider 的块一次平铺（一级菜单直出），
           顶部的 provider tab 保留为筛选器（不改动选择机制本身）
         · 无推理等级，不留推理纵轴；无图标、无额外辉光效果
       数据层：
         · 只贡献 conversation.input.right（list slot，零占用者），
           复用 ctx.modelDirectories —— 与 /model 命令、原生 seat 同源，
           提交走 directory.select({provider, model})。
         · 原生 conversation.input.model 是 single slot，不能重注册，
           因此折叠显示而不是卸载：原生模块照常提供 ModelDirectoryResolver
           与 /model 命令，本包只把它的触发器 display:none。
       规范对齐：
         · 尺寸/字阶沿用 composer 工具行（28px / 13px / 20px 行高、radius-sm），
           卡片用 radius-panel + elevation-prominent + mask-1 + menu-backdrop-filter，
           焦点环用 focus-ring-width/color，动效用 ds-ease-in-out，
           标题用 --dsw-font-family-brand（Montserrat，随主题包已加载）。
         · provider 色相经 color-mix 叠加在别名令牌之上，明暗自跟随；
           不写死明暗双份，不引入任何图标资产。
         · 键盘模型对齐 dsh 菜单：方向键移动可见焦点环（DOM 焦点 + .gg-focus 双重落点），Enter/Tab 提交并回到触发器，
           Esc 关闭。Tab 在内容区才截获，网格外（tab/关闭按钮）走原生焦点流。
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
      'tab.aria': '筛选模型目录',
      'tab.all': '全部',
      'grid.provider': '{provider}，{n} 个模型',
      'grid.cell': '选择 {model}',
      'grid.empty': '没有可用的模型。',
      'grid.loading': '正在刷新模型列表…',
      'grid.error': '模型操作失败：{message}',
      'grid.retry': '重新加载',
      'footer.hint': '←→↑↓ 移动 · Enter 选择 · Esc 关闭',
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
      'tab.aria': 'Filter model catalog',
      'tab.all': 'All',
      'grid.provider': '{provider}, {n} models',
      'grid.cell': 'Select {model}',
      'grid.empty': 'No models available.',
      'grid.loading': 'Refreshing model list…',
      'grid.error': 'Model action failed: {message}',
      'grid.retry': 'Reload',
      'footer.hint': '←→↑↓ move · Enter select · Esc close',
      'status.pending': 'Applying…'
    };

    /* ── provider 色相：FNV-1a 稳定映射到四个品牌色令牌，明暗自跟随 ── */
    const HUES = [
      'var(--dsw-alias-link)',
      'var(--dsw-alias-state-success-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--gg-hue-astra)'
    ];
    function hash(s) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      return h;
    }
    /** provider → 色相：稳定，不随目录内模型列表变动。 */
    const hueForProvider = (providerId) => HUES[hash('prov/' + providerId) % HUES.length];

    /* ── 样式（单文件，data-plugin-css 注入） ─────────────────────── */
    const CSS = [
      /* 自定义色相在自身作用域内定义，不外泄；默认值保证未派生时不炸 */
      '.gg-seat,.gg-veil{--gg-hue:var(--dsw-alias-label-caption);--gg-hue-astra:#b78bfa}',
      '.gg-seat{min-width:0;position:relative}',
      '.gg-fab{box-sizing:border-box;appearance:none;border-radius:var(--dsw-radius-sm);min-width:0;max-width:min(280px,40cqw);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:1px solid var(--dsw-alias-border-l2);outline:none;align-items:center;gap:6px;padding:0 5px 0 7px;font-size:13px;font-weight:400;line-height:20px;display:flex;transition:background-color var(--ds-transition-duration) var(--ds-ease-in-out),border-color var(--ds-transition-duration) var(--ds-ease-in-out),box-shadow var(--ds-transition-duration) var(--ds-ease-in-out)}',
      '.gg-fab:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-fab:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-fab[aria-expanded="true"]{border-color:var(--dsw-alias-border-l3)}',
      '.gg-fab:disabled{cursor:default;border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-dimmed)}',
      '.gg-provDot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--gg-hue);border:1px solid color-mix(in srgb,var(--gg-hue) 55%,var(--dsw-alias-border-l3))}',
      '.gg-name{color:inherit;text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}',
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
      '.gg-tab{box-sizing:border-box;padding:4px 9px;border-radius:999px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:1px solid var(--dsw-alias-border-l2);outline:none;transition:background-color var(--ds-transition-duration) var(--ds-ease-in-out),color var(--ds-transition-duration) var(--ds-ease-in-out),border-color var(--ds-transition-duration) var(--ds-ease-in-out)}',
      '.gg-tab:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.gg-tab:focus-visible{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',
      '.gg-tab.on{color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb,var(--gg-hue) 48%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--gg-hue) 14%,transparent)}',

      /* 分块分区：每个 provider 一块，块内模型 chip 自动换行，名字不截断 */
      '.gg-body{flex:1 1 auto;min-height:0;padding:6px 16px 0;flex-direction:column;display:flex}',
      '.gg-scroll{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);overflow:auto;flex:1 1 auto;min-height:0}',
      '.gg-blk{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);padding:8px 9px;margin:0 0 8px}',
      '.gg-blk:last-child{margin-bottom:0}',
      '.gg-blkH{gap:7px;align-items:center;margin:0 0 7px;display:flex}',
      '.gg-blkName{font-family:var(--ds-font-family-code);font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-primary);white-space:normal;overflow-wrap:anywhere;min-width:0;flex:0 1 auto}',
      '.gg-blkCount{flex:none;font-family:var(--ds-font-family-code);font-size:10px;line-height:15px;color:var(--dsw-alias-label-tertiary)}',
      '.gg-blkM{gap:6px;flex-wrap:wrap;display:flex}',
      '.gg-chip{box-sizing:border-box;max-width:100%;border-radius:var(--dsw-radius-md);cursor:pointer;touch-action:manipulation;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);outline:none;padding:5px 10px;font-size:12px;line-height:16px;font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);white-space:normal;overflow-wrap:anywhere;text-align:left;transition:border-color .1s var(--ds-ease-in-out),background-color .1s var(--ds-ease-in-out)}',
      '.gg-chip:hover{border-color:color-mix(in srgb,var(--gg-hue) 34%,var(--dsw-alias-border-l2))}',
      '.gg-chip.on{background:linear-gradient(155deg,color-mix(in srgb,var(--gg-hue) 18%,transparent),transparent 72%),var(--dsw-alias-bg-layer-3);border-color:color-mix(in srgb,var(--gg-hue) 55%,var(--dsw-alias-border-l2));color:color-mix(in srgb,var(--gg-hue) 72%,var(--dsw-alias-label-primary));font-weight:500}',
      '.gg-chip:focus-visible,.gg-chip.gg-focus{box-shadow:0 0 0 var(--dsw-focus-ring-width,2px) var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}',

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
      '@media (prefers-reduced-motion:reduce){.gg-fab,.gg-chev,.gg-chip,.gg-tab,.gg-star,.gg-mask:after,.gg-card,.gg-spin{animation:none;transition:none}}'
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

    /* ── 图标（仅触发器与关闭按钮的描边箭头；模型本身无图标） ─────── */
    const sv = (w, d, sw) => j('svg', { width: w, height: w, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: sw ?? 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, j('path', { d: d }));
    const chevron = () => sv(12, 'M4 6.5 8 10.5 12 6.5');
    const closeX = () => sv(14, 'M3.75 3.75 12.25 12.25M12.25 3.75 3.75 12.25');

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
      /* 可见块 = 全部（tab=null）或单个 provider；空目录组剔除。 */
      const rows = (props.tab === null ? groups : groups.filter((g) => g.id === props.tab)).filter((g) => (g.models || EMPTY).length > 0);
      const current = props.current;

      const [focus, setFocus] = react.useState(() => {
        const p = current ? rows.findIndex((g) => g.id === current.provider) : -1;
        const g = p >= 0 ? rows[p] : rows[0];
        const c = g ? g.models.findIndex((m) => m.id === (current ? current.model : '')) : -1;
        return { p: p >= 0 ? p : 0, c: c >= 0 ? c : 0 };
      });
      const sweeping = react.useRef(false);
      const veilRef = react.useRef(null);

      const nP = rows.length;
      const fr = nP ? Math.min(Math.max(0, focus.p), nP - 1) : 0;
      const block = rows[fr] || null;
      const nC = block ? block.models.length : 0;
      const fc = nC ? Math.min(Math.max(0, focus.c), nC - 1) : 0;

      function commit(p, c) {
        const g = rows[p];
        if (!g || !g.models[c]) return;
        props.onSelect({ provider: g.id, model: g.models[c].id });
      }
      const settle = (p, c) => { commit(p, c); props.onClose(); };
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
        /* Tab 只在内容区"提交并返回"；内容区外（tab/关闭按钮）走原生焦点流。 */
        if (k === 'Enter' || (k === 'Tab' && !!(e.target && e.target.closest && e.target.closest('.gg-scroll')))) {
          e.preventDefault();
          e.stopPropagation();
          settle(fr, fc);
          return;
        }
        if (k === 'ArrowRight') { e.preventDefault(); focusCell(fr, Math.min(nC - 1, fc + 1)); return; }
        if (k === 'ArrowLeft') { e.preventDefault(); focusCell(fr, Math.max(0, fc - 1)); return; }
        if (k === 'ArrowDown') { e.preventDefault(); focusCell(Math.min(nP - 1, fr + 1), fc); return; }
        if (k === 'ArrowUp') { e.preventDefault(); focusCell(Math.max(0, fr - 1), fc); return; }
        if (k === 'Home') { e.preventDefault(); focusCell(fr, 0); return; }
        if (k === 'End') { e.preventDefault(); focusCell(fr, nC - 1); }
      }

      const curGroup = current ? groups.find((g) => g.id === current.provider) || null : null;
      const curModel = curGroup ? curGroup.models.find((m) => m.id === current.model) || null : null;

      const stars = STAR_FIELDS[0].map((s) => j('span', {
        key: s.key,
        className: 'gg-star',
        style: { left: s.left + '%', top: s.top + '%', width: s.size + 'px', height: s.size + 'px', '--twmin': s.min.toFixed(2), '--twmax': s.max.toFixed(2), '--twd': s.dur.toFixed(2) + 's', '--twdl': s.delay.toFixed(2) + 's' }
      }));

      return j('div', {
        id: 'gg-veil',
        ref: veilRef,
        className: 'gg-veil',
        role: 'dialog',
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
          /* provider 筛选 tab（机制不动；"全部"为默认一级视图） */
          groups.length > 1 ? j('div', { key: 'tabs', className: 'gg-tabs', role: 'tablist', 'aria-label': t('tab.aria') }, [
            j('button', {
              key: 'all',
              type: 'button',
              role: 'tab',
              className: 'gg-tab' + (props.tab === null ? ' on' : ''),
              'aria-selected': props.tab === null,
              onClick: () => props.onTab(null)
            }, t('tab.all')),
            ...groups.map((g) => j('button', {
              key: g.id,
              type: 'button',
              role: 'tab',
              className: 'gg-tab' + (props.tab === g.id ? ' on' : ''),
              'aria-selected': props.tab === g.id,
              style: { '--gg-hue': hueForProvider(g.id) },
              onClick: () => props.onTab(g.id)
            }, g.name))
          ]) : null,
          /* 分块分区：每个 provider 一块 */
          rows.length
            ? j('div', { key: 'body', className: 'gg-body' }, [
                j('div', { key: 'scroll', className: 'gg-scroll' }, rows.map((g, p) => [
                  j('section', {
                    key: 'blk' + g.id,
                    className: 'gg-blk',
                    style: { '--gg-hue': hueForProvider(g.id) },
                    role: 'group',
                    'aria-label': t('grid.provider', { provider: g.name, n: g.models.length })
                  }, [
                    j('div', { key: 'hd', className: 'gg-blkH' }, [
                      j('span', { key: 'd', className: 'gg-provDot', 'aria-hidden': true }),
                      j('span', { key: 'n', className: 'gg-blkName' }, g.name),
                      j('span', { key: 'c', className: 'gg-blkCount' }, String(g.models.length))
                    ]),
                    j('div', { key: 'md', className: 'gg-blkM' }, g.models.map((m, c) => {
                      const sel = !!current && current.provider === g.id && current.model === m.id;
                      return j('button', {
                        key: m.id,
                        type: 'button',
                        className: 'gg-chip' + (sel ? ' on' : '') + (p === fr && c === fc ? ' gg-focus' : ''),
                        style: { '--gg-hue': hueForProvider(g.id) },
                        'aria-label': t('grid.cell', { model: m.name }),
                        'aria-pressed': sel,
                        'data-gg-p': p,
                        'data-gg-c': c,
                        tabIndex: p === fr && c === fc ? 0 : -1,
                        onPointerDown: (e) => cellDown(e, p, c),
                        onPointerEnter: () => cellEnter(p, c),
                        onClick: () => settle(p, c)
                      }, m.name);
                    }))
                  ])
                ]))
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
      const curModel = curGroup ? curGroup.models.find((m) => m.id === current.model) || null : null;
      const label = curModel ? curModel.name : (state.status === 'loading' ? t('seat.loading') : t('seat.fallback'));
      const aria = curModel ? t('seat.aria', { model: curModel.name }) : t('seat.fallback');

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
