import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableTagger = env.VITE_ENABLE_COMPONENT_TAGGER === "true";

  return {
    // Base URL - use '/' para domínio raiz ou subdomínio
    // Se estiver em subpasta, mude para '/subpasta/'
    base: '/',
    
    server: {
      host: "::",
      port: 8080,
    },
    
    // Configurações de build para produção
    build: {
      // Gerar sourcemaps para debug em produção (remova se não precisar)
      sourcemap: false,
      // Otimizar chunks
      rollupOptions: {
        output: {
          manualChunks: {
            // Separa bibliotecas grandes em chunks próprios
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            'chart-vendor': ['recharts'],
          },
        },
      },
      // Aumentar limite de warning de tamanho de chunk
      chunkSizeWarningLimit: 1000,
    },
    
    plugins: [react(), enableTagger && componentTagger()].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    optimizeDeps: {
      include: ['cmdk'],
      force: true,
    },
  };
});
