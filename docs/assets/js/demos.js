/* Workbench demo — @auipage/vue 文档
 *
 * 用真实 dist/auipage-vue.iife.js + 内存适配器渲染，消息走 AsyncGenerator 逐字流式。
 */
(function () {
    "use strict";

    if (!window.AuipageVue || !window.Vue) return;

    var Vue = window.Vue;
    var h = Vue.h;
    var AuipageVue = window.AuipageVue;

    var container = document.querySelector('[data-demo="workbench"]');
    if (!container) return;

    /* ---------------------------------------------------- 内存数据 */

    var THREADS = [
        { threadId: "t1", title: "怎么接入自己的后端？", status: "regular" },
        { threadId: "t2", title: "前端工具能弹窗吗", status: "regular" },
        { threadId: "t3", title: "多会话是怎么隔离的", status: "archived" }
    ];

    var HISTORY = {
        t1: [
            {
                messages: [
                    { role: "user", content: [{ type: "text", text: "适配器和组件是怎么分工的？" }] },
                    {
                        role: "assistant",
                        content: [{
                            type: "text",
                            text: "适配器只做数据搬运：把后端的 SSE 变成 AsyncGenerator、把消息写进你的库、把会话列表读出来。组件只认 store，负责把 parts 渲染成 DOM。"
                        }]
                    }
                ]
            },
            {
                messages: [
                    { role: "user", content: [{ type: "text", text: "怎么接入自己的后端？" }] },
                    {
                        role: "assistant",
                        content: [{
                            type: "text",
                            text: "写三套适配器：ChatTransport 负责流式对话，MessageHistory 负责历史读写，ThreadList 负责会话管理。它们都从 @auipage/vue 顶层导出，装配成一个对象交给 AuiRuntimeProvider。"
                        }]
                    }
                ]
            }
        ],
        t2: [{ messages: [{ role: "user", content: [{ type: "text", text: "前端工具能弹窗吗？" }] }] }],
        t3: []
    };

    /* ---------------------------------------------------- 适配器 */

    function sleep(ms) {
        return new Promise(function (r) { setTimeout(r, ms); });
    }

    function createAdapter() {
        return {
            ChatTransport: new AuipageVue.ChatTransportAdapter({
                async *run(params) {
                    var last = params.messages[params.messages.length - 1];
                    var text = last && last.content && last.content[0] && last.content[0].text || "";
                    var reply = "收到「" + text + "」。@auipage/vue 只提供状态与交互，样式和视觉全归你：把 AuiRuntimeProvider 挂上三套适配器，" +
                        "再用 ChatContent、ThreadList 把节点搭出来即可。";

                    yield { type: "thinking", text: "先确认用户想问什么，再给一段可执行的说明。" };
                    await sleep(160);

                    for (var i = 0; i < reply.length; i += 2) {
                        yield { type: "text", text: reply.slice(i, i + 2) };
                        await sleep(18);
                    }
                },
                response() { return null; }
            }),
            MessageHistory: new AuipageVue.MessageHistoryAdapter({
                async load(threadId) { return HISTORY[threadId] || []; },
                async append(threadId, group) {
                    if (!HISTORY[threadId]) HISTORY[threadId] = [];
                    HISTORY[threadId].push(group);
                }
            }),
            ThreadList: new AuipageVue.ThreadListAdapter({
                async list() { return THREADS.slice(); },
                async new(firstGroup) {
                    var first = firstGroup && firstGroup.messages[0];
                    var text = first && first.content && first.content[0] && first.content[0].text || "新会话";
                    var thread = { threadId: "t" + Date.now(), title: text.slice(0, 18), status: "regular" };
                    THREADS.unshift(thread);
                    return thread;
                },
                async archive(id) {
                    var t = THREADS.find(function (x) { return x.threadId === id; });
                    if (t) t.status = "archived";
                },
                async unarchive(id) {
                    var t = THREADS.find(function (x) { return x.threadId === id; });
                    if (t) t.status = "regular";
                },
                async delete(id) {
                    var i = THREADS.findIndex(function (x) { return x.threadId === id; });
                    if (i > -1) THREADS.splice(i, 1);
                }
            })
        };
    }

    /* ---------------------------------------------------- 视图 */

    var adapter = createAdapter();

    var ListView = h(AuipageVue.ThreadList.Root, null, {
        default: function () {
            return [
                h(AuipageVue.ThreadList.New, null, { default: function () { return "+ 新建会话"; } }),
                h(AuipageVue.ThreadList.Items, null, {
                    default: function (scope) {
                        return h(AuipageVue.ThreadList.Item.Root, null, {
                            default: function () {
                                return [
                                    h(AuipageVue.ThreadList.Item.Trigger, null, {
                                        default: function () { return h(AuipageVue.ThreadList.Item.Title); }
                                    }),
                                    h(AuipageVue.ThreadList.Item.Archive, null, { default: function () { return "归档"; } }),
                                    h(AuipageVue.ThreadList.Item.UnArchive, null, { default: function () { return "恢复"; } }),
                                    h(AuipageVue.ThreadList.Item.Delete, null, { default: function () { return "删除"; } })
                                ];
                            }
                        });
                    }
                })
            ];
        }
    });

    var ChatView = h(AuipageVue.ChatContent.Root, null, {
        default: function () {
            return [
                h(AuipageVue.ChatContent.Viewport, null, {
                    default: function () {
                        return h(AuipageVue.ChatContent.Messages, null, {
                            default: function (scope) {
                                return h(AuipageVue.ChatContent.Parts);
                            }
                        });
                    }
                }),
                h(AuipageVue.ChatContent.Composer.Root, null, {
                    default: function () {
                        return [
                            h(AuipageVue.ChatContent.Composer.Input, {
                                placeholder: "问点什么，比如：怎么接入后端？"
                            }),
                            h(AuipageVue.ChatContent.Composer.Send, null, { default: function () { return "发送"; } })
                        ];
                    }
                })
            ];
        }
    });

    var app = Vue.createApp({
        render: function () {
            return h(AuipageVue.AuiRuntimeProvider, { adapter: adapter, tools: [] }, {
                default: function () {
                    return [
                        h("div", { class: "aui-side" }, [ListView]),
                        h("div", { class: "aui-main" }, [ChatView])
                    ];
                }
            });
        }
    });

    var mount = document.createElement("div");
    mount.className = "aui-workbench";
    container.appendChild(mount);
    app.mount(mount);

    /* 首屏自动激活第一个会话，让截图与访问者一眼看到内容 */
    setTimeout(function () {
        var first = container.querySelector(".aui-item-trigger");
        if (first) first.click();
    }, 700);
})();
