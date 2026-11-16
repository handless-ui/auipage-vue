/* Runtime loader — @auipage/vue 文档
 *
 * IIFE 包通过全局 Vue 使用 Vue。文档按访问方式决定依赖来源：
 *   · localhost / 127.0.0.1 → 项目自己的 node_modules 与 dist（跑真实产物）
 *   · 线上域名 → CDN（unpkg → jsdelivr → npmmirror 依次降级）
 *   · ?cdn=1 → 强制走 CDN（用于本地验证线上分支）
 */
(function () {
    "use strict";

    var script = document.currentScript;
    var base = (script && script.getAttribute("data-base")) || "";
    var demo = (script && script.getAttribute("data-demo")) || "assets/js/demos.js";

    var host = location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "";
    var forceCdn = /(\?|&)cdn=1/.test(location.search);
    var preferLocal = isLocal && !forceCdn;

    /* 从页面到项目根：docs/index.html → ../，docs/guide/x.html → ../../ */
    var root = base + "../";

    var LOCAL = {
        vue: root + "node_modules/vue/dist/vue.global.prod.js",
        lib: root + "dist/auipage-vue.iife.js"
    };

    var CDN = {
        vue: [
            "https://unpkg.com/vue@3.4.34/dist/vue.global.prod.js",
            "https://cdn.jsdelivr.net/npm/vue@3.4.34/dist/vue.global.prod.js",
            "https://registry.npmmirror.com/vue/3.4.34/files/dist/vue.global.prod.js"
        ],
        lib: [
            "https://unpkg.com/@auipage/vue@latest/dist/auipage-vue.iife.js",
            "https://cdn.jsdelivr.net/npm/@auipage/vue@latest/dist/auipage-vue.iife.js",
            "https://registry.npmmirror.com/@auipage/vue/latest/files/dist/auipage-vue.iife.js"
        ]
    };

    function banner(text) {
        var el = document.createElement("div");
        el.style.cssText = "border-left:3px solid #e2542c;background:#fdf1ec;color:#3d4249;padding:10px 16px;font-size:13px;margin:0;font-family:-apple-system,'PingFang SC',sans-serif";
        el.textContent = text;
        document.body.insertBefore(el, document.body.firstChild.nextSibling);
    }

    function loadScript(url, name) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            s.src = url;
            s.async = false;
            s.onload = function () { resolve(name); };
            s.onerror = function () { reject(new Error(name + " :: " + url)); };
            document.head.appendChild(s);
        });
    }

    function loadAny(urls, name) {
        var i = 0;
        function next() {
            if (i >= urls.length) return Promise.reject(new Error(name + " unavailable"));
            return loadScript(urls[i++], name).catch(next);
        }
        return next();
    }

    if (location.protocol === "file:") {
        banner("当前是 file:// 打开：组件需要 Vue 与 IIFE 产物，请在项目根起一个静态服务，例如 python3 -m http.server 8080 后访问 http://localhost:8080/docs/index.html。");
        return;
    }

    var vueUrl = preferLocal ? LOCAL.vue : null;
    var libUrl = preferLocal ? LOCAL.lib : null;

    var loadVue = vueUrl
        ? loadScript(vueUrl, "vue")
        : loadAny(CDN.vue, "vue");

    loadVue
        .then(function () {
            return libUrl
                ? loadScript(libUrl, "auipage-vue")
                : loadAny(CDN.lib, "auipage-vue");
        })
        .then(function () {
            return loadScript(new URL(base + demo, document.baseURI).href, "demos");
        })
        .catch(function (err) {
            console.error("[docs] failed:", err);
            banner("依赖没加载成功：" + err.message + "。本地请确认 node_modules 与 dist 存在；线上请检查网络是否可访问 CDN。");
        });
})();
