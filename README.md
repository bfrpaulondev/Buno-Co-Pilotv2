# 🎯 Interview Assistant AI - Bruno Co-Pilot v2

Uma **PWA (Progressive Web App)** moderna para auxiliar durante entrevistas de emprego, com transcrição de voz em tempo real e respostas personalizadas geradas por IA.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?style=flat-square&logo=openai)

## ✨ Funcionalidades

- 🎤 **Transcrição de Voz em Tempo Real** - Captura perguntas usando Web Speech API
- 🤖 **Respostas com IA** - GPT-4o gera respostas personalizadas baseadas no seu CV
- 📱 **PWA Instalável** - Funciona como app nativo no celular ou desktop
- 🌍 **Multilíngue** - Suporte a Português e Inglês
- ⭐ **Método STAR** - Respostas estruturadas automaticamente
- 🎯 **Dicas Estratégicas** - Primeira pergunta chave para moldar a entrevista

## 🚀 Tecnologias

- **Next.js 15** - App Router com React 19
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilos modernos
- **shadcn/ui** - Componentes UI
- **OpenAI GPT-4o** - IA para respostas
- **Web Speech API** - Transcrição de voz
- **PWA** - Manifest, Service Worker, ícones

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/bfrpaulondev/Buno-Co-Pilotv2.git

# Entre na pasta
cd Buno-Co-Pilotv2

# Instale as dependências
bun install

# Execute em desenvolvimento
bun run dev
```

Acesse: http://localhost:3000

## 💡 Como Usar

1. **Abra a aplicação** no navegador
2. **Clique em "Ouvir"** para ativar o microfone
3. **Permita o acesso** ao microfone quando solicitado
4. **A pergunta do recrutador** será transcrita automaticamente
5. **Clique "Enviar"** para gerar a resposta
6. **Leia e adapte** a resposta sugerida antes de falar

## 🎯 Primeira Pergunta Estratégica

> **"Por que a vaga está aberta? É uma nova posição ou substituição? Quais são os principais desafios que a equipe está enfrentando?"**

Faça essa pergunta no início da entrevista. A resposta vai te ajudar a moldar suas experiências de forma alinhada às necessidades da empresa.

## ⭐ Método STAR

As respostas são geradas usando o método STAR:

| Letra | Significado | Descrição |
|-------|-------------|-----------|
| **S** | Situação | Contexto onde aconteceu |
| **T** | Tarefa | Seu objetivo/responsabilidade |
| **A** | Ação | O que você FEZ especificamente |
| **R** | Resultado | Resultado concreto com números |

## 🏆 Seus Pontos Fortes

O assistente destaca automaticamente:

- ✅ 5+ anos de experiência com React e Node.js
- ✅ 20+ projetos entregues com 95% de satisfação
- ✅ Clientes internacionais (Brasil, Portugal, Espanha, EUA)
- ✅ Inglês fluente + Português nativo
- ✅ Experiência com Scrum e trabalho remoto

## 📱 Instalar como App

1. Abra a aplicação no Chrome/Brave
2. Clique no botão **"Instalar App"** no canto inferior direito
3. Ou use o menu do navegador: "Instalar aplicativo"

## 🔧 Configuração

### Editar CV

1. Clique no ícone de **Configurações** (engrenagem)
2. Edite o texto do seu currículo
3. As respostas serão baseadas nas suas informações

### Idioma

Selecione o idioma das respostas:
- **Português** - Respostas em PT-BR
- **English** - Respostas em inglês
- **Auto** - Detecta o idioma da pergunta

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   └── interview/
│   │       └── route.ts      # API OpenAI
│   ├── layout.tsx            # Layout PWA
│   ├── page.tsx              # Interface principal
│   └── globals.css           # Estilos globais
├── components/
│   └── ui/                   # Componentes shadcn/ui
└── hooks/                    # Hooks customizados

public/
├── manifest.json             # Configuração PWA
├── sw.js                     # Service Worker
├── icon-192.png              # Ícone 192x192
└── icon-512.png              # Ícone 512x512
```

## ⚠️ Importante

- As respostas são baseadas **apenas no seu CV real**
- **NUNCA inventa** experiências ou habilidades
- **Sempre leia e adapte** a resposta antes de falar
- A IA conhece seu CV, mas não o contexto completo

## 📄 Licença

MIT License - Desenvolvido para Bruno Paulon

---

**Boa sorte na entrevista! 🚀**
