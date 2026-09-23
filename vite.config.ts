import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ command }) => ({
    server: {
        port: 20000,
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: "http://localhost:30000",
                changeOrigin: true
            }
        }
    },
     resolve: {
        // 仅在 dev/test 时启用别名，避免影响 build 产物的外部依赖
          alias: command === 'serve'
            ? { "@auipage/vue": fileURLToPath(new URL('./src/index.ts', import.meta.url)) }
            : undefined
    },
    plugins: [
        vue(),
    ],
    build: {
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: {
                    vue: "Vue"
                }
            }
        },
        minify: false,
        sourcemap: true,
        cssCodeSplit: true,
        lib: {
            entry: "./src/index.ts",
            name: "AuipageVue",
            fileName: "auipage-vue",

            // 输出常用的三种模块类型
            formats: ["es", "umd", "iife"]
        }
    }
}));