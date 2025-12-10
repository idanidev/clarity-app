// ============================================
// AIAssistant.tsx - Versión optimizada
// Performance: 60fps, Input lag <16ms, Scroll fluido
// ============================================
import {
  CheckCircle,
  Copy,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { List } from "react-window";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

// ============================================
// TYPES
// ============================================
interface Message {
  role: "user" | "assistant";
  content: string;
  action?: "expense_added";
  expenseData?: any;
  timestamp: number;
  id: string; // Añadido para virtualización
}

interface ExpenseData {
  name: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurringId: string | null;
}

interface Category {
  [key: string]: {
    subcategories?: string[];
    [key: string]: any;
  };
}

interface AIAssistantProps {
  darkMode: boolean;
  textClass: string;
  textSecondaryClass: string;
  categories: Category;
  addExpense: (expense: ExpenseData) => Promise<void>;
  isActive: boolean;
}

// ============================================
// PLATFORM DETECTION
// ============================================
const isNative = Capacitor.isNativePlatform();
const VirtualizedList = List as unknown as React.ComponentType<any>;

// ============================================
// HAPTIC FEEDBACK (solo nativo)
// ============================================
const vibrate = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (isNative) {
    try {
      await Haptics.impact({ style });
    } catch (error) {
      // Fallback silencioso si haptics no está disponible
    }
  }
};

// ============================================
// KEYBOARD HEIGHT HOOK (optimizado)
// ============================================
const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;
        const heightDiff = window.innerHeight - viewport.height;
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
      });
    };

    const viewport = window.visualViewport;
    if (!viewport) return;

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  return keyboardHeight;
};

// ============================================
// VOICE RECOGNITION HOOK (optimizado)
// ============================================
const useVoiceRecognition = (
  onTranscript: (text: string) => void,
  onEnd: () => void
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onEndRef.current = onEnd;
  }, [onTranscript, onEnd]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "es-ES";
    recognition.maxAlternatives = 3;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      finalTranscript = "";
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      if (onTranscriptRef.current) {
        onTranscriptRef.current((finalTranscript + interimTranscript).trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Error en reconocimiento:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onEndRef.current) {
        onEndRef.current();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignorar
        }
      }
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        setIsListening(false);
      }
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (permissionError) {
        console.error("Permiso denegado");
      }
    }
  }, [isListening]);

  return { isListening, toggle };
};

// ============================================
// UTILITIES (mantener igual)
// ============================================
const createCategoryMatcher = (categories: Category) => {
  const categoryNames = Object.keys(categories);
  const synonyms: { [key: string]: string[] } = {
    comida: ["comida", "alimentación", "supermercado", "mercado", "compras"],
    transporte: ["transporte", "gasolina", "taxi", "uber", "parking"],
    restaurante: ["restaurante", "comer", "bar", "café"],
    ocio: ["ocio", "cine", "teatro", "concierto"],
    salud: ["salud", "médico", "farmacia", "hospital"],
    ropa: ["ropa", "zapatos", "moda"],
    casa: ["casa", "hogar", "alquiler", "luz", "agua"],
    educación: ["educación", "curso", "universidad"],
    tecnología: ["tecnología", "ordenador", "móvil"],
    tabaco: ["tabaco", "cigarrillos"],
    deporte: ["deporte", "gimnasio"],
    mascotas: ["mascota", "perro", "gato"],
    viajes: ["viaje", "hotel", "avión"],
    suscripciones: ["suscripción", "spotify", "netflix"],
  };

  return (suggestedCategory?: string, description?: string): string | null => {
    if (categoryNames.length === 0) return null;
    const searchText = (suggestedCategory || description || "").toLowerCase().trim();
    if (!searchText) return categoryNames[0];

    let match = categoryNames.find((cat) => cat.toLowerCase() === searchText);
    if (match && categories[match]) return match;

    for (const [key, values] of Object.entries(synonyms)) {
      const foundSynonym = values.find((syn) => searchText.includes(syn) || syn.includes(searchText));
      if (foundSynonym) {
        match = categoryNames.find((cat) => {
          const catLower = cat.toLowerCase();
          return (
            (catLower.includes(key) || key.includes(catLower)) &&
            categories[cat]
          );
        });
        if (match) return match;
      }
    }

    return categoryNames.find((cat) => categories[cat]) || categoryNames[0];
  };
};

const detectExpenseFromText = (text: string) => {
  let expenseDate = new Date().toISOString().slice(0, 10);
  const datePatterns = [
    { pattern: /ayer/i, offset: (d: Date) => { d.setDate(d.getDate() - 1); return d; } },
    { pattern: /hace\s+(\d+)\s+días?/i, offset: (d: Date, match: RegExpMatchArray) => { d.setDate(d.getDate() - parseInt(match[1])); return d; } },
  ];

  for (const { pattern, offset } of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const d = new Date();
      expenseDate = offset(d, match).toISOString().slice(0, 10);
      break;
    }
  }

  const patterns = [
    /(?:gast[ée]|gastado|he\s+gastado)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
    /(?:añade?|añadir|pon|poner)\s+(?:gasto\s+)?(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
    /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(",", "."));
      const description = match[2].trim();
      if (amount > 0 && description) {
        return { amount, description, date: expenseDate };
      }
    }
  }

  return null;
};

// ============================================
// MESSAGE BUBBLE (memoizado agresivamente)
// ============================================
const MessageBubble = memo(
  ({
    message,
    darkMode,
    onCopy,
    copied,
  }: {
    message: Message;
    darkMode: boolean;
    onCopy: () => void;
    copied: boolean;
  }) => {
    const isUser = message.role === "user";

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} group mb-3`}>
        <div
          className={`max-w-[85%] md:max-w-[80%] rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 relative ${
            isUser
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : darkMode
              ? "bg-gray-700 text-gray-100"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          <p className="text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
          {message.action === "expense_added" && (
            <div className="mt-2 flex items-center gap-2 text-green-500 text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Gasto añadido correctamente</span>
            </div>
          )}
          {!isUser && (
            <button
              onClick={onCopy}
              className={`absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${
                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
              }`}
              title={copied ? "Copiado!" : "Copiar mensaje"}
            >
              <Copy className={`w-4 h-4 ${copied ? "text-green-500" : ""}`} />
            </button>
          )}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.darkMode === next.darkMode &&
    prev.copied === next.copied
);

MessageBubble.displayName = "MessageBubble";

// ============================================
// WELCOME SCREEN (memoizado)
// ============================================
const WelcomeScreen = memo(
  ({
    textClass,
    textSecondaryClass,
    darkMode,
    onExampleClick,
  }: {
    textClass: string;
    textSecondaryClass: string;
    darkMode: boolean;
    onExampleClick: (question: string) => void;
  }) => {
    const examples = [
      "¿Cuánto he gastado este mes?",
      "¿En qué categoría gasto más?",
      "Añade 25€ en supermercado",
      "¿Estoy dentro del presupuesto?",
    ];

    return (
      <div className="flex flex-col items-center text-center px-4 pt-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-7 h-7 text-purple-500" />
          <h3 className={`text-xl md:text-2xl font-bold ${textClass}`}>
            ¡Hola! Soy tu asistente financiero
          </h3>
        </div>
        <p className={`text-sm md:text-base ${textSecondaryClass} max-w-md mx-auto mb-6`}>
          Puedo analizar tus gastos, darte consejos y añadir gastos por ti
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
          {[
            { icon: TrendingUp, text: "Analizar gastos" },
            { icon: Plus, text: "Añadir por voz" },
            { icon: Target, text: "Ver presupuestos" },
            { icon: Lightbulb, text: "Dar consejos" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-3 rounded-xl ${
                darkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5 text-purple-500" />
              <span className={`text-sm ${textClass}`}>{item.text}</span>
            </div>
          ))}
        </div>
        <div className="w-full max-w-md">
          <p className={`text-sm ${textSecondaryClass} mb-3 font-medium`}>
            Prueba preguntando:
          </p>
          <div className="space-y-2">
            {examples.map((question, idx) => (
              <button
                key={idx}
                onClick={() => onExampleClick(question)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all min-h-[44px] ${
                  darkMode
                    ? "bg-gray-700/70 hover:bg-gray-700 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

WelcomeScreen.displayName = "WelcomeScreen";

// ============================================
// MAIN COMPONENT - OPTIMIZADO
// ============================================
const AIAssistant: React.FC<AIAssistantProps> = memo(
  ({
    darkMode,
    textClass,
    textSecondaryClass,
    categories,
    addExpense,
    isActive,
  }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const keyboardHeight = useKeyboardHeight();

    // Memoizar category matcher
    const findBestCategory = useMemo(
      () => createCategoryMatcher(categories),
      [categories]
    );

    // Input handler sin lag (update inmediato)
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInput(value);
    }, []);

    // Voice handlers
    const handleVoiceTranscript = useCallback((text: string) => {
      setInput(text);
    }, []);

    const handleVoiceEnd = useCallback(() => {
      // Auto-enviar si se detecta un gasto después de dictar
      setTimeout(() => {
        const currentInput = inputRef.current?.value || "";
        const detected = detectExpenseFromText(currentInput);
        if (detected && currentInput.trim()) {
          sendMessage();
        }
      }, 300);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { isListening, toggle: toggleListening } = useVoiceRecognition(
      handleVoiceTranscript,
      handleVoiceEnd
    );

    // Scroll automático optimizado
    const scrollToBottom = useCallback(() => {
      if (messagesEndRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    }, []);

    useEffect(() => {
      if (messages.length > 0) {
        scrollToBottom();
      }
    }, [messages.length, scrollToBottom]);

    useEffect(() => {
      if (!isActive) return;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }, [isActive]);

    const handleCopyMessage = useCallback(async (index: number, content: string) => {
      await navigator.clipboard.writeText(content);
      await vibrate(ImpactStyle.Light);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }, []);

    const handleClearChat = useCallback(async () => {
      if (window.confirm("¿Borrar toda la conversación?")) {
        await vibrate(ImpactStyle.Medium);
        setMessages([]);
      }
    }, []);

    const sendMessage = useCallback(async () => {
      if (!input.trim() || isLoading) return;

      await vibrate(ImpactStyle.Light);

      const userMessage = input.trim();
      const timestamp = Date.now();
      const messageId = `msg-${timestamp}`;

      const directExpense = detectExpenseFromText(userMessage);
      if (directExpense && addExpense) {
        const matchedCategory = findBestCategory(undefined, directExpense.description);

        if (matchedCategory && categories[matchedCategory]) {
          const expenseData: ExpenseData = {
            name: directExpense.description,
            amount: directExpense.amount,
            category: matchedCategory,
            subcategory: "",
            date: directExpense.date,
            paymentMethod: "Tarjeta",
            isRecurring: false,
            recurringId: null,
          };

          try {
            await addExpense(expenseData);
            setInput("");
            const userMsg: Message = { role: "user", content: userMessage, timestamp, id: messageId };
            const aiMsg: Message = {
              role: "assistant",
              content: `✅ ¡Gasto añadido! ${directExpense.amount}€ en ${matchedCategory}`,
              action: "expense_added",
              expenseData,
              timestamp: Date.now(),
              id: `msg-${Date.now()}`,
            };
            startTransition(() => {
              setMessages((prev) => [...prev, userMsg, aiMsg]);
            });
            return;
          } catch (error) {
            console.error("Error añadiendo gasto:", error);
          }
        }
      }

      setInput("");
      const userMsg: Message = { role: "user", content: userMessage, timestamp, id: messageId };
      
      startTransition(() => {
        setMessages((prev) => [...prev, userMsg]);
      });

      setIsLoading(true);

      try {
        // Simular API call (reemplazar con tu API real)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const aiMessage: Message = {
          role: "assistant",
          content: "Esta es una respuesta de ejemplo. La integración con IA está pendiente.",
          timestamp: Date.now(),
          id: `msg-${Date.now()}`,
        };

        startTransition(() => {
          setMessages((prev) => [...prev, aiMessage]);
        });
      } catch (error) {
        console.error("Error:", error);
        const errorMessage: Message = {
          role: "assistant",
          content: "❌ Error al procesar tu solicitud. Intenta de nuevo.",
          timestamp: Date.now(),
          id: `msg-${Date.now()}`,
        };
        startTransition(() => {
          setMessages((prev) => [...prev, errorMessage]);
        });
      } finally {
        setIsLoading(false);
      }
    }, [input, isLoading, addExpense, categories, findBestCategory]);

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      },
      [sendMessage]
    );

    const handleExampleClick = useCallback((question: string) => {
      setInput(question);
      inputRef.current?.focus();
    }, []);

    // Calcular altura del contenedor de mensajes (número para react-window)
    const listHeight = useMemo(() => {
      if (typeof window === "undefined") return 400;
      const base = window.innerHeight;
      const reserved = 220 + keyboardHeight;
      return Math.max(320, base - reserved);
    }, [keyboardHeight]);

    const ITEM_HEIGHT = 110;

    const renderRow = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const message = messages[index];
        if (!message) return null;
        return (
          <div style={style}>
            <MessageBubble
              message={message}
              darkMode={darkMode}
              onCopy={() => handleCopyMessage(index, message.content)}
              copied={copiedIndex === index}
            />
          </div>
        );
      },
      [messages, darkMode, handleCopyMessage, copiedIndex]
    );


    return (
      <div 
        className="flex flex-col w-full" 
        style={{ 
          minHeight: "400px",
          height: "100%",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className={`text-sm font-semibold ${textClass}`}>
              Asistente IA
            </h3>
            {messages.length > 0 && (
              <span className={`text-xs ${textSecondaryClass}`}>
                {messages.length} mensaje{messages.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
              title="Limpiar chat"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>

        {/* Contenedor de mensajes virtualizado */}
        <div
          className={`flex-1 rounded-xl border mb-4 ${
            darkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          } overflow-hidden flex flex-col`}
          style={{
            height: listHeight,
            maxHeight: listHeight,
            minHeight: "400px",
          }}
        >
          <div
            className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 space-y-3"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {messages.length === 0 ? (
              <WelcomeScreen
                textClass={textClass}
                textSecondaryClass={textSecondaryClass}
                darkMode={darkMode}
                onExampleClick={handleExampleClick}
              />
            ) : (
              <>
                <VirtualizedList
                  height={listHeight}
                  itemCount={messages.length}
                  itemSize={ITEM_HEIGHT}
                  width="100%"
                  overscanCount={5}
                  className="w-full"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    overscrollBehavior: "contain",
                  }}
                >
                  {renderRow as any}
                </VirtualizedList>
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {isLoading && (
            <div className="px-3 md:px-4 py-3">
              <div className="flex justify-start">
                <div
                  className={`rounded-xl px-4 py-3 ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="pb-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Pregúntame sobre tus gastos..."
              disabled={isLoading || isPending}
              className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base min-h-[44px] ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              } disabled:opacity-50`}
            />

            <button
              onClick={toggleListening}
              disabled={isLoading || isPending}
              className={`px-4 py-3 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/50"
                  : darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } disabled:opacity-50`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isPending}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px] flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // Memoización agresiva: solo re-renderizar si props críticas cambian
    return (
      prev.darkMode === next.darkMode &&
      prev.isActive === next.isActive &&
      prev.categories === next.categories
    );
  }
);

AIAssistant.displayName = "AIAssistant";

export default AIAssistant;
