# Implementação do Campo de Preço de Consulta por Médico

## 📋 Resumo da Implementação

Foi implementado um sistema para que cada médico possa ter seu próprio preço de consulta configurado no sistema.

## 🗄️ Alterações no Banco de Dados

### Migration Criada
- **Arquivo:** `migrations/43º_Migration_add_consultation_price_to_profiles.sql`
- **Descrição:** Adiciona o campo `consultation_price` na tabela `profiles`
- **Campo:** `consultation_price DECIMAL(10, 2)` - Armazena o preço da consulta em reais com 2 casas decimais
- **Valor Padrão:** 0.00

## 🎨 Interface do Usuário

### Onde o Campo Aparece

O campo de preço de consulta aparece na página **"Informações da Clínica"**, acessível apenas por usuários com perfil **Owner (Dono)**.

#### Caminho de Navegação:
```
Dashboard → Menu Lateral → Informações da Clínica
```

#### Localização na Página:
1. **Seção:** "Equipe Médica e Preços" (último card da página)
2. **Para cada médico cadastrado**, é exibido um card com:
   - Nome do médico
   - Especialização
   - E-mail
   - Checkbox para selecionar o médico na equipe
   - **Campo de entrada "Preço da Consulta (R$)"** ← NOVO CAMPO

#### Como Usar:
1. Acesse "Informações da Clínica"
2. Role até a seção "Equipe Médica e Preços"
3. Para cada médico, digite o valor da consulta no campo formatado "R$ _____"
   - O campo já exibe "R$" automaticamente
   - Digite valores como: 150, 150.00 ou 150,00
   - O sistema formata automaticamente para o padrão brasileiro (ex: 50,00)
4. Clique no botão **"Salvar preços"** no canto superior direito da seção

#### Botões Disponíveis:
- **"Salvar preços"** - Salva os preços de consulta de todos os médicos
- **"Salvar equipe médica"** - Mantém a funcionalidade original de selecionar quais médicos fazem parte da equipe

## 📊 Estrutura de Dados

### Tabela: `profiles`
```sql
consultation_price DECIMAL(10, 2) DEFAULT 0.00
```

### Tipo TypeScript
```typescript
interface DoctorProfile {
  id: string;
  name: string | null;
  email: string | null;
  specialization: string | null;
  consultation_price: number | null; // Novo campo
}
```

## 🔒 Permissões

- **Visualização:** Todos os usuários autenticados podem visualizar os médicos
- **Edição:** Apenas usuários com perfil **Owner** podem editar os preços de consulta

## 🎯 Funcionalidades Implementadas

1. ✅ Campo de preço na tabela `profiles`
2. ✅ Interface para editar preços na página "Informações da Clínica"
3. ✅ Validação de entrada (apenas números, mínimo 0)
4. ✅ **Formatação automática no padrão brasileiro (R$ 50,00)**
5. ✅ **Prefixo "R$" integrado no campo de entrada**
6. ✅ Aceita tanto vírgula quanto ponto como separador decimal
7. ✅ Limite automático de 2 casas decimais
8. ✅ Salvamento individual dos preços de cada médico
9. ✅ Feedback visual (toast) ao salvar com sucesso
10. ✅ Tratamento de erros

## 📝 Notas Técnicas

- O campo aceita valores decimais com até 2 casas decimais (ex: 150, 150.00, 150,00)
- Formatação automática no padrão brasileiro com vírgula (ex: 50,00)
- Prefixo "R$" exibido automaticamente dentro do campo
- Aceita tanto vírgula (150,50) quanto ponto (150.50) como separador
- Valores negativos não são permitidos
- Se o campo estiver vazio, o valor padrão será 0,00
- Os preços são salvos diretamente na tabela `profiles`, mantendo a normalização dos dados
- A interface foi centralizada na página "Informações da Clínica" para facilitar o gerenciamento

## 🚀 Como Aplicar no Supabase

Execute a migration no SQL Editor do Supabase:

```sql
-- migrations/43º_Migration_add_consultation_price_to_profiles.sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS consultation_price DECIMAL(10, 2) DEFAULT 0.00;

COMMENT ON COLUMN public.profiles.consultation_price IS 'Preço da consulta do médico (em reais)';

CREATE INDEX IF NOT EXISTS idx_profiles_consultation_price 
ON public.profiles(consultation_price) WHERE role = 'doctor';
```

## ✨ Benefícios

1. **Centralização:** Todos os preços são gerenciados em um único local
2. **Flexibilidade:** Cada médico pode ter seu próprio preço
3. **Simplicidade:** Interface intuitiva e fácil de usar
4. **Escalabilidade:** Pronto para futuras integrações (sistemas de pagamento, relatórios, etc.)

---

**Data de Implementação:** 20/10/2025
**Autor:** Sistema MedX - Cursor AI

