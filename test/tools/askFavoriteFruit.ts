import { defineTool } from "@auipage/vue";
import AskFavoriteFruitRender from "./AskFavoriteFruitRender.vue";

// 实际项目里这里会是发请求获取的候选列表，此处写死
const FRUITS = ["苹果", "香蕉", "橙子", "葡萄", "西瓜"];

/**
 * 前端工具（有 render）：询问用户喜欢哪种水果
 * execute 返回候选水果列表，
 * render 组件据此渲染按钮，用户点击后 call 的值即工具最终结果。
 */
export default defineTool({
    name: "askFavoriteFruit",
    description:
        "当需要了解用户喜欢什么水果时使用，会弹窗询问用户并返回所选水果",
    parameters: {
        type: "object",
        properties: {},
        required: [],
    },
    execute() {
        console.log("askFavoriteFruit execute");
        // 这里写死，实际项目可改为发请求获取
        return FRUITS;
    },
    render: AskFavoriteFruitRender,
});
