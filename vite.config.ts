import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableTagger = env.VITE_ENABLE_COMPONENT_TAGGER === "true";

  return {
    server: {
      host: "::",
      port: 8080,
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
