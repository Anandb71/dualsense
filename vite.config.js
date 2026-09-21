import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{rollupOptions:{input:{main:resolve(import.meta.dirname,'index.html'),progress:resolve(import.meta.dirname,'progress/index.html'),credits:resolve(import.meta.dirname,'credits/index.html')}}}});
