/**
 * gear-grid-model — Host half.
 *
 * 本包是**纯浏览器端 UI 插件**：全部行为在 ./client.js 里，由 dsh-client-modules
 * 扫描本 Loader 行的 `dsh.client` 声明后打包成 /plugins 下的 bundle 交给浏览器。
 *
 * Host 侧之所以需要一个（空）入口，是因为两者是一体的：
 *   ① Loader 行 {id: gear-grid-model, name: 'dsh-gear-grid-model'} 通过
 *      `import(包名)` 解析到 package.json 的 `exports["."]`，没有它整个行
 *      "failed to import"，而 dsh-client-modules 只扫描**启用的 Loader 行**——
 *      Host 行挂了，客户端 bundle 根本不会进 boot graph（2026-10-27 实测症状：
 *      插件装了、配置也 dump 得到，但浏览器里毫无反应，journal 只有一行
 *      `gear-grid-model (dsh-gear-grid-model): failed to import`）；
 *   ② 这也是随附同类插件的既有形态：dsh-client-ui-model-selection 与
 *      dsh-client-ui-schedule 的 Host 半都是同样的空 apply。
 *
 * 本包不注册任何 Host 服务、路由或配置命名空间，故无 inject、无 config。
 *
 * @module .dsh-bundles/gear-grid-model/index.js
 */

export const name = 'gear-grid-model';
export const version = '1.0.0';
export const inject = [];

/** Host plugin body — 本插件没有任何 Host 侧行为，全部逻辑在浏览器入口。 */
export function apply() {}
