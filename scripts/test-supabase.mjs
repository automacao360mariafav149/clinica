#!/usr/bin/env node
/**
 * Script de Teste de Conexão com Supabase
 * 
 * Uso: node scripts/test-supabase.mjs
 * 
 * Este script verifica:
 * - Se o arquivo .env.local existe
 * - Se as credenciais estão configuradas
 * - Se a conexão com o Supabase está funcionando
 * - Se as tabelas do banco existem
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║   Teste de Conexão - MedX + Supabase         ║');
console.log('╚════════════════════════════════════════════════╝\n');

// Verificar se o arquivo .env.local existe
const envPath = resolve(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ ERRO: Arquivo .env.local não encontrado!');
  console.log('\n💡 Solução:');
  console.log('   1. Copie TEMPLATE_ENV_LOCAL.txt para .env.local');
  console.log('   2. Configure suas credenciais do Supabase');
  console.log('   3. Execute este script novamente\n');
  process.exit(1);
}

console.log('✅ Arquivo .env.local encontrado');

// Ler e parsear variáveis do .env.local
const envContent = readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseAnonKey = '';

envLines.forEach(line => {
  const cleanLine = line.replace(/\r/g, '').trim();
  if (cleanLine.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = cleanLine.split('=')[1].trim();
  }
  if (cleanLine.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = cleanLine.split('=')[1].trim();
  }
});

console.log('✅ Variáveis de ambiente lidas\n');

// Validar URL
if (!supabaseUrl || supabaseUrl === 'https://seu-projeto.supabase.co') {
  console.error('❌ ERRO: VITE_SUPABASE_URL não configurada corretamente!');
  console.log('\n💡 Solução:');
  console.log('   1. Acesse: https://app.supabase.com/');
  console.log('   2. Vá em Settings → API');
  console.log('   3. Copie a "Project URL"');
  console.log('   4. Cole no arquivo .env.local\n');
  process.exit(1);
}

console.log(`📌 URL do projeto: ${supabaseUrl}`);

// Validar Key
if (!supabaseAnonKey || supabaseAnonKey === 'sua-chave-anonima-aqui') {
  console.error('\n❌ ERRO: VITE_SUPABASE_ANON_KEY não configurada corretamente!');
  console.log('\n💡 Solução:');
  console.log('   1. Acesse: https://app.supabase.com/');
  console.log('   2. Vá em Settings → API');
  console.log('   3. Copie a "anon/public key"');
  console.log('   4. Cole no arquivo .env.local\n');
  process.exit(1);
}

// Remover 's' extra no início se existir (erro comum de copy/paste)
if (supabaseAnonKey.startsWith('seyJ')) {
  supabaseAnonKey = supabaseAnonKey.substring(1);
}

console.log(`📌 Chave API: ${supabaseAnonKey.substring(0, 25)}...`);
console.log('\n─────────────────────────────────────────────────\n');

// Criar cliente Supabase
console.log('🔄 Criando cliente Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Cliente criado com sucesso\n');

// Testar conexão
console.log('🔄 Testando conexão com o banco de dados...\n');

try {
  // Tentar acessar a tabela profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (error) {
    // Verificar tipo de erro
    if (error.message.toLowerCase().includes('relation') || 
        error.message.toLowerCase().includes('table') ||
        error.message.toLowerCase().includes('schema cache')) {
      
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║         ✅ CONEXÃO FUNCIONANDO! 🎉            ║');
      console.log('╚════════════════════════════════════════════════╝\n');
      
      console.log('⚠️  AVISO: As tabelas ainda não existem no banco.');
      console.log('   Isso é normal se você ainda não aplicou as migrations.\n');
      
      console.log('📚 Próximos passos:\n');
      console.log('   1. Aplicar migrations:');
      console.log('      supabase db push\n');
      console.log('   2. Ou manualmente via SQL Editor:');
      console.log('      https://supabase.com/dashboard\n');
      console.log('   3. Ver guia completo:');
      console.log('      GUIA_REPLICACAO_COMPLETA.md - Parte 3\n');
      
      process.exit(0);
      
    } else if (error.message.toLowerCase().includes('jwt') || 
               error.message.toLowerCase().includes('invalid')) {
      
      console.error('╔════════════════════════════════════════════════╗');
      console.error('║           ❌ ERRO DE AUTENTICAÇÃO             ║');
      console.error('╚════════════════════════════════════════════════╝\n');
      
      console.error(`Mensagem: ${error.message}\n`);
      
      console.log('💡 Possíveis causas:\n');
      console.log('   1. A chave anon está incorreta');
      console.log('   2. Você usou a service_role key (não use!)');
      console.log('   3. Há espaços extras na chave');
      console.log('   4. A chave foi copiada incompleta\n');
      
      console.log('🔧 Solução:\n');
      console.log('   1. Acesse o dashboard do Supabase');
      console.log('   2. Vá em Settings → API');
      console.log('   3. Copie TODA a "anon/public key"');
      console.log('   4. Cole no .env.local (sem espaços extras)\n');
      
      process.exit(1);
      
    } else {
      console.error('╔════════════════════════════════════════════════╗');
      console.error('║            ❌ ERRO NA CONEXÃO                 ║');
      console.error('╚════════════════════════════════════════════════╝\n');
      
      console.error(`Mensagem: ${error.message}\n`);
      
      console.log('💡 Possíveis causas:\n');
      console.log('   1. O projeto Supabase não está ativo');
      console.log('   2. Problemas de rede/firewall');
      console.log('   3. Credenciais incorretas\n');
      
      console.log('🔧 Verificações:\n');
      console.log('   1. Acesse: https://status.supabase.com/');
      console.log('   2. Confirme que seu projeto está ativo');
      console.log('   3. Teste a URL no navegador\n');
      
      process.exit(1);
    }
  } else {
    // Sucesso total - banco existe e tem dados
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║      ✅ TUDO FUNCIONANDO PERFEITAMENTE! 🎉    ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('✅ Conexão estabelecida');
    console.log('✅ Tabelas existem no banco');
    console.log('✅ Sistema pronto para uso!\n');
    
    console.log('🚀 Próximo passo:\n');
    console.log('   npm run dev\n');
    console.log('   Acesse: http://localhost:5173\n');
    
    process.exit(0);
  }
  
} catch (err) {
  console.error('╔════════════════════════════════════════════════╗');
  console.error('║         ❌ ERRO INESPERADO                    ║');
  console.error('╚════════════════════════════════════════════════╝\n');
  
  console.error(`Erro: ${err.message}\n`);
  
  console.log('💡 O que fazer:\n');
  console.log('   1. Verifique sua conexão com a internet');
  console.log('   2. Confirme que o Supabase está acessível');
  console.log('   3. Revise suas credenciais no .env.local');
  console.log('   4. Consulte: GUIA_CONEXAO_SUPABASE.md\n');
  
  process.exit(1);
}

