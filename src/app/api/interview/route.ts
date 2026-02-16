import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// CV do Bruno Paulon
const DEFAULT_CV = `
BRUNO PAULON - Full Stack Developer
=====================================
Phone: +351 935559989 | Email: brunopaulon@outlook.com.br
LinkedIn: www.linkedin.com/in/bruno-paulon-react
Portfolio: bfrpaulon-portofolio.vercel.app/

PERFIL:
Full Stack Developer com mais de 5 anos de experiência construindo aplicações web escaláveis para clientes na Europa e América Latina. Expertise em React, Node.js e TypeScript, usando Next.js para desenvolver soluções front-end modernas. Proficiência avançada em React, Next.js e Node.js, com experiência em desenvolvimento de APIs REST e gerenciamento de bancos de dados SQL e NoSQL como MongoDB e PostgreSQL. Profissional comunicativo, adaptável e organizado, focado em entregar soluções eficientes e de alta qualidade com atenção especial à experiência do usuário, performance e acessibilidade.

EXPERIÊNCIA PROFISSIONAL:

1. Software Developer - Acidados SA, Cascais (Janeiro 2025 - Presente)
- Desenvolveu soluções avançadas integradas com PHC CS Enterprise, otimizando sistemas web e desktop
- Criou dashboards e relatórios analíticos usando SQL, aumentando eficiência em 30%
- Desenvolveu APIs REST, aplicações console e interfaces em JavaScript e Node.js
- Otimizou queries SQL e performance de banco de dados
Skills: PHC CS Enterprise, SQL, REST APIs, JavaScript, Node.js, Database Optimization, Dashboards, Business Intelligence

2. Full Stack Engineer - Workana, Portugal Remote (Junho 2020 - Dezembro 2024)
- Liderou a entrega de 20+ projetos full-stack, incluindo aplicações web, dashboards e plataformas SaaS
- 95% de taxa de satisfação com clientes internacionais
- Desenvolveu frontends com React, Next.js, Angular, TypeScript e Tailwind CSS
- Projetou e implementou APIs backend com Node.js, Fastify, MongoDB e PostgreSQL
- Colaborou remotamente com clientes no Brasil, Portugal, Espanha e EUA usando Scrum
- Aumento médio de 20% na eficiência operacional das plataformas entregues
Skills: React, Next.js, Angular, TypeScript, Tailwind CSS, Node.js, Fastify, MongoDB, PostgreSQL, Scrum, REST APIs, SaaS

3. Software Developer - MiosTech, Setúbal - Portugal (Agosto 2023 - Julho 2024)
- Desenvolveu app React Native para descoberta de restaurantes, publicado em iOS e Android, aumentando interação em 40%
- Modernizou sistema legado em Angular 8, migrando para TypeScript, melhorando segurança e performance em 25%
- Suportou backend Java/Spring Boot, integrando APIs REST, reduzindo bugs de integração em 50%
- Criou site gamificado para RED Canids eSports, aumentando engajamento dos fãs
Skills: React Native, iOS, Android, Angular, TypeScript, Java, Spring Boot, REST APIs, Agile, Node.js, Gamification

FORMAÇÃO:
CST - Análise e Desenvolvimento de Sistemas - Anhanguera Educacional (2020-2022)

CERTIFICAÇÕES:
- Github Certification Training
- Agile projects with SCRUM
- JavaScript Developer Training
- Angular Developer Training
- PHC CS Enterprise Certification

SKILLS TÉCNICAS:
Frontend: React (4+ anos), Next.js (2 anos), Angular, TypeScript (3 anos), Tailwind CSS, HTML5, CSS3
Backend: Node.js (4+ anos), Fastify, Java, Spring Boot, REST APIs
Bancos de Dados: MongoDB (3 anos), PostgreSQL, SQL Server (2 anos), otimização SQL
Ferramentas: Git, GitHub Actions (CI/CD), Scrum, Agile, Docker
Mobile: React Native

IDIOMAS:
- Português (Nativo/Bilíngue)
- Inglês (Nativo/Bilíngue)
- Espanhol (Intermediário)
`;

// Função para detectar idioma da pergunta
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Palavras comuns em português
  const ptWords = ['você', 'qual', 'como', 'quando', 'onde', 'porque', 'por que', 'fale', 'sobre', 'experiência', 
                   'trabalho', 'empresa', 'tempo', 'anos', 'projeto', 'porque', 'não', 'está', 'você', 'seu', 'sua',
                   'pode', 'fazer', 'ter', 'sido', 'feito', 'estou', 'foi', 'são', 'me', 'minha', 'meu'];
  
  // Palavras comuns em inglês
  const enWords = ['what', 'how', 'when', 'where', 'why', 'tell', 'about', 'experience', 'work', 'company',
                   'time', 'years', 'project', 'have', 'you', 'your', 'can', 'did', 'been', 'was', 'were',
                   'the', 'and', 'with', 'for', 'this', 'that', 'describe', 'explain', 'would', 'could'];
  
  let ptScore = 0;
  let enScore = 0;
  
  ptWords.forEach(word => {
    if (lowerText.includes(word)) ptScore++;
  });
  
  enWords.forEach(word => {
    if (lowerText.includes(word)) enScore++;
  });
  
  // Verificar caracteres específicos do português
  if (/[ãõçáéíóúâêîôû]/i.test(text)) {
    ptScore += 3;
  }
  
  // Se a pergunta contém "you" e verbos em inglês
  if (/\b(you|your|are|is|do|did|have|has|can|will|would|could|should)\b/i.test(text)) {
    enScore += 2;
  }
  
  if (ptScore > enScore) return 'pt';
  if (enScore > ptScore) return 'en';
  return 'auto';
}

function buildSystemPrompt(cvData: string, detectedLanguage: string): string {
  return `Você é Bruno Paulon, um Full Stack Developer com 5+ anos de experiência. Você está em uma entrevista de emprego e deve responder como se fosse você mesmo.

## SEU CURRÍCULO:
${cvData}

## 🚨 REGRA CRÍTICA DE IDIOMA:
A pergunta foi feita em: **${detectedLanguage === 'pt' ? 'PORTUGUÊS' : detectedLanguage === 'en' ? 'INGLÊS' : 'AUTO-DETECTADO'}**

⚠️ VOCÊ DEVE RESPONDER NO EXATO IDIOMA DA PERGUNTA:
- Se a pergunta está em PORTUGUÊS → Responda em PORTUGUÊS BRASILEIRO
- Se a pergunta está em INGLÊS → Responda em INGLÊS
- A entrevista pode alternar entre idiomas a qualquer momento - SIGA O IDIOMA DA PERGUNTA ATUAL

## INSTRUÇÕES CRÍTICAS:

### 1. IDENTIDADE
- Você É o Bruno Paulon. Responda sempre na primeira pessoa ("eu", "meu", "minha" / "I", "my")
- NUNCA diga "como assistente" ou "baseado no currículo"
- Fale naturalmente, como se estivesse numa conversa real

### 2. ESTRUTURA DE RESPOSTAS (MÉTODO STAR)
Para perguntas comportamentais, use SEMPRE:
- **Situação/Situation**: Contexto breve onde isso aconteceu
- **Tarefa/Task**: Qual era seu objetivo/responsabilidade  
- **Ação/Action**: O que você FEZ especificamente (use verbos de ação)
- **Resultado/Result**: Resultado concreto, preferencialmente com NÚMEROS/PERCENTUAIS

### 3. FÓRMULA PARA DESCREVER EXPERIÊNCIA
Sempre que descrever experiência, use: PERCENTUAL + COMO FEZ + TECNOLOGIAS

Exemplos:
- "Aumentei a eficiência em 30% criando dashboards com SQL" / "Increased efficiency by 30% creating SQL dashboards"
- "Reduzi bugs em 50% com testes automatizados" / "Reduced bugs by 50% with automated tests"

### 4. PROIBIÇÕES ABSOLUTAS
- NUNCA invente experiências que NÃO estão no seu CV
- NUNCA dê números ou percentuais não documentados
- Se não tiver experiência, seja honesto e relate com algo próximo

### 5. PONTOS FORTES PARA DESTACAR
- 5+ anos de experiência com React e Node.js
- Clientes internacionais (Brasil, Portugal, Espanha, EUA)
- 20+ projetos entregues com 95% de satisfação
- Inglês fluente/nativo + Português nativo
- Experiência com Scrum e trabalho remoto

### 6. FORMATO DA RESPOSTA
- Respostas concisas (2-4 parágrafos para curtas, 4-6 para longas)
- Fale naturalmente, como numa conversa
- Use exemplos ESPECÍFICOS do seu CV
- Sempre mencione RESULTADOS CONCRETOS

LEMBRE-SE: Você é o Bruno. Responda como você falaria na entrevista, no idioma da pergunta.`;
}

export async function POST(request: NextRequest) {
  try {
    const { question, cvData, language, conversationHistory } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Pergunta é obrigatória' }, { status: 400 });
    }

    const cv = cvData || DEFAULT_CV;
    
    // Detectar idioma automaticamente se for "auto" ou não especificado
    let detectedLanguage = language;
    if (!language || language === 'auto') {
      detectedLanguage = detectLanguage(question);
    }
    
    const systemPrompt = buildSystemPrompt(cv, detectedLanguage);

    // Usar z-ai-web-dev-sdk
    const zai = await ZAI.create();

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico da conversa
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((item: { question: string; answer: string }) => {
        messages.push({ role: 'user', content: item.question });
        messages.push({ role: 'assistant', content: item.answer });
      });
    }

    // Adicionar pergunta atual com instrução de idioma
    messages.push({ role: 'user', content: question });

    const completion = await zai.chat.completions.create({
      messages,
      model: 'gpt-4o',
      max_tokens: 800,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';

    return NextResponse.json({ 
      success: true, 
      answer,
      detectedLanguage 
    });

  } catch (error: unknown) {
    console.error('Erro na API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Interview Assistant API está funcionando!',
    features: [
      'Detecção automática de idioma (PT/EN)',
      'Respostas no idioma da pergunta',
      'Método STAR automático',
      'CV do Bruno Paulon integrado'
    ]
  });
}
