import { NextRequest } from 'next/server';

// CV do Bruno Paulon
const DEFAULT_CV = `
BRUNO PAULON - Full Stack Developer
=====================================
Phone: +351 935559989 | Email: brunopaulon@outlook.com.br
LinkedIn: www.linkedin.com/in/bruno-paulon-react
Portfolio: bfrpaulon-portofolio.vercel.app/

PERFIL:
Full Stack Developer com mais de 5 anos de experiência construindo aplicações web escaláveis para clientes na Europa e América Latina. Expertise em React, Node.js e TypeScript, usando Next.js para desenvolver soluções front-end modernas.

EXPERIÊNCIA PROFISSIONAL:

1. Software Developer - Acidados SA, Cascais (Janeiro 2025 - Presente)
- Criou dashboards e relatórios analíticos usando SQL, aumentando eficiência em 30%
- Desenvolveu APIs REST, aplicações console e interfaces em JavaScript e Node.js

2. Full Stack Engineer - Workana, Portugal Remote (Junho 2020 - Dezembro 2024)
- Liderou a entrega de 20+ projetos full-stack com 95% de satisfação
- Desenvolveu frontends com React, Next.js, Angular, TypeScript e Tailwind CSS
- Aumento médio de 20% na eficiência operacional das plataformas entregues

3. Software Developer - MiosTech, Setúbal - Portugal (Agosto 2023 - Julho 2024)
- Desenvolveu app React Native, publicado em iOS e Android, aumentando interação em 40%
- Modernizou sistema legado em Angular 8, melhorando performance em 25%
- Reduziu bugs de integração em 50%

IDIOMAS:
- Português (Nativo/Bilíngue)
- Inglês (Nativo/Bilíngue)
- Espanhol (Intermediário)
`;

// Função para detectar idioma da pergunta
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  const ptWords = ['você', 'qual', 'como', 'quando', 'onde', 'porque', 'por que', 'fale', 'sobre', 'experiência', 
                   'trabalho', 'empresa', 'tempo', 'anos', 'projeto', 'não', 'está', 'seu', 'sua'];
  const enWords = ['what', 'how', 'when', 'where', 'why', 'tell', 'about', 'experience', 'work', 'company',
                   'time', 'years', 'project', 'have', 'you', 'your', 'can', 'did', 'been'];
  
  let ptScore = 0;
  let enScore = 0;
  
  ptWords.forEach(word => { if (lowerText.includes(word)) ptScore++; });
  enWords.forEach(word => { if (lowerText.includes(word)) enScore++; });
  
  if (/[ãõçáéíóúâêîôû]/i.test(text)) ptScore += 3;
  
  return ptScore > enScore ? 'pt' : enScore > ptScore ? 'en' : 'auto';
}

function buildSystemPrompt(cvData: string, detectedLanguage: string): string {
  return `Você é Bruno Paulon, um Full Stack Developer com 5+ anos de experiência. Responda como se fosse você mesmo em uma entrevista.

## SEU CURRÍCULO:
${cvData}

## IDIOMA DA RESPOSTA: ${detectedLanguage === 'pt' ? 'PORTUGUÊS BRASILEIRO' : detectedLanguage === 'en' ? 'INGLÊS' : 'AUTO'}

REGRAS:
- Responda na primeira pessoa ("eu", "meu")
- Use o método STAR para perguntas comportamentais
- Mencione números e resultados concretos do CV
- Respostas concisas (2-4 parágrafos)
- NUNCA invente experiências que não estão no CV
- Fale naturalmente, como em uma conversa real`;
}

export async function POST(request: NextRequest) {
  try {
    const { question, cvData, language, conversationHistory } = await request.json();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Pergunta é obrigatória' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cv = cvData || DEFAULT_CV;
    let detectedLanguage = language;
    if (!language || language === 'auto') {
      detectedLanguage = detectLanguage(question);
    }
    
    const systemPrompt = buildSystemPrompt(cv, detectedLanguage);

    // Construir mensagens para OpenAI
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((item: { question: string; answer: string }) => {
        messages.push({ role: 'user', content: item.question });
        messages.push({ role: 'assistant', content: item.answer });
      });
    }

    messages.push({ role: 'user', content: question });

    // Chamar OpenAI API com streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 600,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      return new Response(JSON.stringify({ error: 'Erro na API OpenAI' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Criar ReadableStream para enviar dados em tempo real
    const encoder = new TextEncoder();
    const reader = response.body?.getReader();
    
    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response body' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        // Primeiro, enviar o idioma detectado
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'language', language: detectedLanguage })}\n\n`));
        
        try {
          const decoder = new TextDecoder();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content })}\n\n`));
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }
          
          // Sinalizar fim
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('Erro na API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'Interview Assistant API com streaming (OpenAI direto)',
    features: [
      'Streaming em tempo real',
      'Detecção automática de idioma (PT/EN)',
      'Respostas no idioma da pergunta',
      'Método STAR automático',
    ]
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
