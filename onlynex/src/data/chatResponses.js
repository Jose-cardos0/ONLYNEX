// Sistema de respostas da LLM para o chat
const responses = {
  // Saudações
  greetings: {
    keywords: ["oi", "olá", "ola", "hey", "eae", "e aí", "e ai", "oie", "oii"],
    responses: [
      "Oi amor! 💕 Que bom te ver por aqui!",
      "Oii! Tudo bem com você? 😘",
      "Hey! Estava esperando você aparecer 💖",
      "Oi lindinho! Como posso te ajudar hoje? 😊",
    ],
  },
  goodMorning: {
    keywords: ["bom dia", "bomdia"],
    responses: [
      "Bom dia, amor! ☀️ Acordou pensando em mim?",
      "Bom diaa! 🌅 Espero que seu dia seja incrível!",
      "Bom dia, lindo! 💕 Já tomou café?",
      "Bom dia! ☕ Que bom começar o dia falando com você!",
    ],
  },
  goodAfternoon: {
    keywords: ["boa tarde", "boatarde"],
    responses: [
      "Boa tarde, amor! 🌤️ Como está sendo seu dia?",
      "Boa tardee! 💕 Que prazer te ver por aqui!",
      "Boa tarde, lindo! O que você aprontou hoje? 😏",
    ],
  },
  goodNight: {
    keywords: ["boa noite", "boanoite"],
    responses: [
      "Boa noite, amor! 🌙 Pronto pra relaxar?",
      "Boa noitee! 💕 Estava com saudades!",
      "Boa noite! ✨ Vim fazer sua noite mais especial!",
    ],
  },

  // Estado
  howAreYou: {
    keywords: ["tudo bem", "como vai", "como você está", "como voce esta", "td bem", "tdb"],
    responses: [
      "Tô ótima, ainda mais agora falando com você! 😊",
      "Super bem! E você, amor? 💕",
      "Maravilhosa! Pronta pra te entreter 😘",
      "Estou muito bem! Adoro quando você aparece! 💖",
    ],
  },

  // Elogios
  compliments: {
    keywords: ["linda", "gostosa", "maravilhosa", "perfeita", "bonita", "tesão", "gata"],
    responses: [
      "Aww, que fofo você! 🥰 Obrigada, amor!",
      "Você me deixa sem graça! 😳💕",
      "Obrigada, lindo! Você também é demais! 💖",
      "Awn, assim você me conquista! 😘",
      "Que amor! Fico feliz que você gosta! 🥰",
    ],
  },

  // Conteúdo
  content: {
    keywords: ["foto", "video", "vídeo", "conteudo", "conteúdo", "ver mais", "mais fotos"],
    responses: [
      "Tenho muito conteúdo exclusivo pra você! 📸 Dá uma olhada na minha galeria!",
      "Quer ver mais? 😏 Tenho várias surpresas te esperando!",
      "Vou postar mais conteúdo exclusivo em breve, fica de olho! 💕",
      "Minha galeria está cheia de novidades! Confere lá! 📸✨",
    ],
  },

  // Chat privado
  privateChat: {
    keywords: ["camera", "câmera", "privado", "live", "ao vivo", "chamada"],
    responses: [
      "Podemos marcar uma chamada privada! 📹 Me chama inbox!",
      "Adoro fazer lives exclusivas! 💕 Fica de olho nos meus horários!",
      "Câmera privada? 😏 Isso é muito especial pra mim!",
      "Vamos agendar algo especial só pra nós dois? 💖",
    ],
  },

  // Amor/Romance
  love: {
    keywords: ["te amo", "amor", "paixão", "apaixonado", "apaixonada", "coração"],
    responses: [
      "Aww, você é muito fofo! 💕",
      "Amor! Você me faz sorrir! 🥰",
      "Que lindo! Adoro nossos momentos juntos! 💖",
      "Você é muito especial pra mim! 😘",
    ],
  },

  // Perguntas sobre a modelo
  aboutMe: {
    keywords: ["quantos anos", "idade", "onde mora", "onde você mora", "de onde", "cidade"],
    responses: [
      "Tenho 24 anos, amor! 💕",
      "Sou do Brasil, e você? 🇧🇷",
      "Adoro manter um pouco de mistério... 😏💕",
      "Algumas coisas são segredo! Mas posso te contar mais no privado 😘",
    ],
  },

  // Despedidas
  goodbye: {
    keywords: ["tchau", "bye", "até", "ate", "fui", "vou indo", "tenho que ir"],
    responses: [
      "Tchau, amor! 💕 Volta logo!",
      "Até mais, lindo! Vou sentir saudades! 😘",
      "Bye! 💖 Não demore pra voltar, tá?",
      "Até breve! Foi ótimo falar com você! 🥰",
    ],
  },

  // Agradecimentos
  thanks: {
    keywords: ["obrigado", "obrigada", "valeu", "thanks", "vlw"],
    responses: [
      "De nada, amor! 💕",
      "Imagina! Sempre que precisar! 😘",
      "Por nada, lindo! É um prazer! 💖",
      "Disponha! 🥰",
    ],
  },

  // Perguntas picantes (respostas leves e flertando)
  flirty: {
    keywords: ["solteira", "namorando", "namora", "casada", "ficante"],
    responses: [
      "Estou aqui só pra você, amor! 😏💕",
      "Meu coração está disponível... 💖",
      "Depende... você está interessado? 😘",
      "Sou toda sua quando estamos aqui! 🥰",
    ],
  },

  // Default
  default: {
    responses: [
      "Hmm, interessante! Me conta mais, amor! 💕",
      "Adorei falar com você! 😘",
      "Você é muito legal! Continue me contando coisas! 💖",
      "Que papo bom! Adoro conversar com você! 🥰",
      "Me manda uma foto sua! Quero te conhecer melhor! 😊",
      "Você está muito quieto... conta algo sobre você! 💕",
    ],
  },
};

export const getResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();

  // Procura por correspondência em cada categoria
  for (const category of Object.values(responses)) {
    if (category.keywords) {
      for (const keyword of category.keywords) {
        if (lowerMessage.includes(keyword)) {
          const randomIndex = Math.floor(Math.random() * category.responses.length);
          return category.responses[randomIndex];
        }
      }
    }
  }

  // Retorna resposta padrão se não encontrar correspondência
  const randomIndex = Math.floor(Math.random() * responses.default.responses.length);
  return responses.default.responses[randomIndex];
};

export default responses;

