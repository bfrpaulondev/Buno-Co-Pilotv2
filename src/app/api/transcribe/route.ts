import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { audioBase64 } = await request.json();

    if (!audioBase64) {
      return NextResponse.json({ error: 'Áudio é obrigatório' }, { status: 400 });
    }

    // Converter base64 para Buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Criar FormData para enviar para OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Português, mas detecta automaticamente

    // Chamar OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Whisper error:', error);
      return NextResponse.json({ error: 'Erro na transcrição' }, { status: 500 });
    }

    const data = await response.json();
    const transcribedText = data.text || '';

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
    message: 'API de transcrição usando OpenAI Whisper',
    supportedFormats: ['webm', 'mp3', 'wav', 'm4a', 'ogg']
  });
}
