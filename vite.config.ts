import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente (local ou build)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    // IMPORTANTE: base './' garante que o site funcione em qualquer subpasta (ex: github.io/meu-repo)
    base: './', 
    plugins: [react()],
    define: {
      // Injeta as chaves de segurança durante o build
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || env.SUPABASE_URL),
      'process.env.SUPABASE_KEY': JSON.stringify(process.env.SUPABASE_KEY || env.SUPABASE_KEY),
    },
    server: {
      host: '0.0.0.0',
      port: 7860
    }
  };
});