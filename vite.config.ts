import {defineConfig} from "vite"
import {resolve} from "path"

export default defineConfig({
    base: "./",
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src")
        }
    },
    build: {
        target: "esnext",
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                keyboard: resolve(__dirname, "keyboard.html")
            }
        }
    },
    worker: {
        format: "es"
    },
    esbuild: {
        target: "esnext"
    },
    clearScreen: false,
    server: {
        port: 8080,
        host: "localhost"
    }
})
