import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
        strictPort: false,
    },
    optimizeDeps: {
        include: ['@aws-amplify/ui-react', 'aws-amplify', 'react', 'react-dom'],
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
