import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { audioBase64 } = await request.json();

    if (!audioBase64) {
      return NextResponse.json({ error: 'Áudio é obrigatório' }, { status: 400 });
    }

    // Usar z-ai-web-dev-sdk para transcrever áudio
    const zai = await ZAI.create();

    const result = await zai.audio.asr.create({ 
      file_base64: audioBase64 
    });

    const transcribedText = result.text || '';

    if (!transcribedText) {
      return NextResponse.json({ error: 'Não foi possível transcrever o áudio' }, { status: 400 });
    }

    // Detectar idioma do texto transcrito
    const lowerText = transcribedText.toLowerCase();
    const ptWords = ['você', 'qual', 'como', 'quando', 'onde', 'porque', 'por que', 'fale', 'sobre', 'experiência', 
                     'trabalho', 'empresa', 'tempo', 'anos', 'projeto', 'não', 'está', 'seu', 'sua'];
    const enWords = ['what', 'how', 'when', 'where', 'why', 'tell', 'about', 'experience', 'work', 'company',
                     'time', 'years', 'project', 'have', 'you', 'your', 'can', 'did', 'been'];
    
    let ptScore = 0;
    let enScore = 0;
    
    ptWords.forEach(word => { if (lowerText.includes(word)) ptScore++; });
    enWords.forEach(word => { if (lowerText.includes(word)) enScore++; });
    
    if (/[ãõçáéíóúâêîôû]/i.test(transcribedText)) ptScore += 3;
    
    const detectedLanguage = ptScore > enScore ? 'pt' : enScore > ptScore ? 'en' : 'auto';

    return NextResponse.json({ 
      success: true, 
      text: transcribedText,
      detectedLanguage 
    });

  } catch (error: unknown) {
    console.error('Erro na transcrição:', error);
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
    message: 'API de transcrição de áudio funcionando!',
    supportedFormats: ['wav', 'mp3', 'ogg', 'webm', 'm4a']
  });
}
