'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Mic, 
  MicOff, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  User, 
  Bot, 
  Settings,
  Star,
  Target,
  Briefcase,
  Globe,
  Zap,
  Languages
} from 'lucide-react';
import { toast } from 'sonner';

// CV do Bruno Paulon
const DEFAULT_CV = `BRUNO PAULON - Full Stack Developer
=====================================
Phone: +351 935559989 | Email: brunopaulon@outlook.com.br
LinkedIn: www.linkedin.com/in/bruno-paulon-react
Portfolio: bfrpaulon-portofolio.vercel.app/

PERFIL:
Full Stack Developer com mais de 5 anos de experiência construindo aplicações web escaláveis para clientes na Europa e América Latina. Expertise em React, Node.js e TypeScript, usando Next.js para desenvolver soluções front-end modernas.

EXPERIÊNCIA PROFISSIONAL:
1. Software Developer - Acidados SA, Cascais (Jan 2025 - Presente)
- Criou dashboards e relatórios analíticos usando SQL, aumentando eficiência em 30%
- Desenvolveu APIs REST, aplicações console e interfaces em JavaScript e Node.js

2. Full Stack Engineer - Workana, Portugal Remote (Jun 2020 - Dez 2024)
- Liderou a entrega de 20+ projetos full-stack com 95% de satisfação
- Desenvolveu frontends com React, Next.js, Angular, TypeScript e Tailwind CSS
- Aumento médio de 20% na eficiência operacional das plataformas entregues

3. Software Developer - MiosTech, Portugal (Ago 2023 - Jul 2024)
- Desenvolveu app React Native, publicado em iOS e Android, aumentando interação em 40%
- Modernizou sistema legado em Angular 8, melhorando performance em 25%
- Reduziu bugs de integração em 50%

SKILLS: React (4+ anos), Next.js, Node.js, TypeScript, PostgreSQL, MongoDB, Tailwind CSS
IDIOMAS: Português (Nativo), Inglês (Fluente), Espanhol (Intermediário)`;

const STRATEGIC_QUESTION = "Por que a vaga está aberta? É uma nova posição ou substituição? Quais são os principais desafios que a equipe está enfrentando atualmente?";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: string;
}

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [cvData, setCvData] = useState(DEFAULT_CV);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      toast.error('Reconhecimento de voz não suportado neste navegador');
    }
  }, []);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Usar português como base, mas detectar automaticamente
    recognition.lang = 'pt-BR';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(prev => prev + ' ' + interimTranscript);
      }
      if (finalTranscript) {
        setTranscript(prev => prev + ' ' + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Permita o acesso ao microfone');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    return recognition;
  }, [isListening]);

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      toast.info('Microfone desativado');
    } else {
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
        toast.success('Ouvindo... Fale sua pergunta');
      }
    }
  }, [isListening, initSpeechRecognition]);

  // Send question to API
  const sendQuestion = async (question: string) => {
    if (!question.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setTranscript('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.type !== 'system')
        .map(m => ({
          question: m.type === 'user' ? m.content : '',
          answer: m.type === 'assistant' ? m.content : ''
        }))
        .filter(m => m.question || m.answer);

      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          cvData,
          language,
          conversationHistory
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          language: data.detectedLanguage
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Mostrar idioma detectado
        if (data.detectedLanguage) {
          const langLabel = data.detectedLanguage === 'pt' ? 'Português' : 
                           data.detectedLanguage === 'en' ? 'English' : 'Auto';
          toast.success(`Resposta gerada em ${langLabel}`);
        }
      } else {
        toast.error(data.error || 'Erro ao gerar resposta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao conectar com a API');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setTranscript('');
    toast.info('Conversa limpa');
  };

  // Add strategic question tip
  const addStrategicTip = () => {
    const tipMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: `💡 **PERGUNTA ESTRATÉGICA**\n\n"${STRATEGIC_QUESTION}"\n\nFaça essa pergunta no início da entrevista. A resposta vai te ajudar a moldar suas experiências de forma alinhada às necessidades da empresa.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tipMessage]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Interview Assistant AI</h1>
                <p className="text-xs text-white/60">Configurado para Bruno Paulon</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                  <Languages className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🚀 Auto</SelectItem>
                  <SelectItem value="pt">🇧🇷 PT</SelectItem>
                  <SelectItem value="en">🇺🇸 EN</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Language Mode Banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-green-500/20 py-2">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-white/80">
            <Languages className="w-4 h-4 inline mr-2" />
            <strong>Modo Auto:</strong> A IA detecta automaticamente se a pergunta é em português ou inglês e responde no mesmo idioma!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Settings */}
          {showSettings && (
            <Card className="lg:col-span-1 bg-black/20 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações
                </CardTitle>
                <CardDescription className="text-white/60">
                  Personalize seu assistente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Seu Currículo</Label>
                  <Textarea
                    value={cvData}
                    onChange={(e) => setCvData(e.target.value)}
                    placeholder="Cole seu CV aqui..."
                    className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                
                <Separator className="bg-white/10" />
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Método STAR
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline" className="justify-start border-purple-500/30 text-purple-300">
                      <strong>S</strong>ituação
                    </Badge>
                    <Badge variant="outline" className="justify-start border-blue-500/30 text-blue-300">
                      <strong>T</strong>arefa
                    </Badge>
                    <Badge variant="outline" className="justify-start border-green-500/30 text-green-300">
                      <strong>A</strong>ção
                    </Badge>
                    <Badge variant="outline" className="justify-start border-orange-500/30 text-orange-300">
                      <strong>R</strong>esultado
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                  <p className="text-xs text-white/80">
                    <strong className="text-white flex items-center gap-1">
                      <Languages className="w-3 h-3" /> Detecção Automática de Idioma
                    </strong>
                    <span className="mt-1 block">A entrevista pode começar em português e mudar para inglês a qualquer momento. A IA detecta automaticamente!</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Chat Area */}
          <Card className={`${showSettings ? 'lg:col-span-2' : 'lg:col-span-3'} bg-black/20 border-white/10 backdrop-blur-xl flex flex-col`}>
            {/* Status Bar */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-sm text-white/60">
                  {isListening ? '🎧 Ouvindo (PT/EN)...' : 'Pronto para ouvir'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addStrategicTip}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Dica Estratégica
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6 h-[450px]">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30" />
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-full">
                      <Briefcase className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Pronto para sua entrevista!</h2>
                    <p className="text-white/60 max-w-md">
                      Clique no microfone e faça uma pergunta. A IA detecta automaticamente o idioma (PT/EN) e responde no mesmo idioma!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 max-w-lg">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <User className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                      <p className="text-xs text-white/60">5+ anos experiência</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                      <p className="text-xs text-white/60">20+ projetos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <Languages className="w-6 h-6 mx-auto mb-2 text-green-400" />
                      <p className="text-xs text-white/60">PT + EN</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type !== 'user' && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          message.type === 'system' 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}>
                          {message.type === 'system' ? (
                            <Lightbulb className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : message.type === 'system'
                          ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-100'
                          : 'bg-white/10 border border-white/10 text-white'
                      }`}>
                        {/* Language Badge */}
                        {message.type === 'assistant' && message.language && (
                          <div className="mb-2">
                            <Badge variant="outline" className={`text-xs ${
                              message.language === 'pt' 
                                ? 'border-green-500/30 text-green-300' 
                                : 'border-blue-500/30 text-blue-300'
                            }`}>
                              {message.language === 'pt' ? '🇧🇷 Português' : '🇺🇸 English'}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                          <span className="text-xs opacity-60">
                            {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {message.type === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="h-6 px-2 text-white/60 hover:text-white hover:bg-white/10"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                          <span className="text-white/60 text-sm">Detectando idioma e gerando resposta...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 space-y-3">
              {/* Transcript preview */}
              {transcript && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-white/80">{transcript}</p>
                </div>
              )}
              
              {/* Input controls */}
              <div className="flex gap-2">
                <Button
                  onClick={toggleListening}
                  disabled={!isSupported}
                  className={`${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  } text-white`}
                  size="lg"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Parar
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Ouvir (PT/EN)
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => sendQuestion(transcript)}
                  disabled={!transcript.trim() || isLoading}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  size="lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Enviar
                </Button>
              </div>
              
              <p className="text-xs text-center text-white/40">
                🎤 O microfone captura português e inglês automaticamente • A resposta será no idioma da pergunta
              </p>
            </div>
          </Card>
        </div>

        {/* Tips Section */}
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Primeira Pergunta</h3>
                  <p className="text-xs text-white/60 mt-1">
                    "Por que a vaga está aberta?"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Star className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Método STAR</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Situação, Tarefa, Ação, Resultado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Languages className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Auto-Detecção</h3>
                  <p className="text-xs text-white/60 mt-1">
                    PT → EN → PT automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Sem Mentiras</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Apenas seu CV real
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Install PWA Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => {
            // @ts-expect-error - PWA API
            if (window.deferredPrompt) {
              // @ts-expect-error - PWA API
              window.deferredPrompt.prompt();
            } else {
              toast.info('Para instalar, use o menu do navegador: "Instalar app"');
            }
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Instalar App
        </Button>
      </div>
    </main>
  );
}

// Lightbulb icon component
function Lightbulb({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

// Add TypeScript declaration for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    deferredPrompt?: { prompt: () => void };
  }
}
