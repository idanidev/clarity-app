import { AnimatePresence, motion } from "framer-motion";
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
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fadeInUp, getTransition } from "../../../config/framerMotion";
import { useTranslation } from "../../../contexts/LanguageContext";

// ============================================
// TYPES
// ============================================
interface Message {
  role: "user" | "assistant";
  content: string;
  action?: "expense_added";
  expenseData?: any;
  timestamp: number;
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
  expenses: any[];
  allExpenses: any[];
  categories: Category;
  budgets: { [key: string]: number };
  categoryTotals: any[];
  income: number | null;
  goals: any;
  recurringExpenses: any[];
  addExpense: (expense: ExpenseData) => Promise<void>;
  isActive: boolean;
  onClose?: () => void; // Callback para cerrar
}

// ============================================
// CUSTOM HOOKS
// ============================================
const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const heightDiff = window.innerHeight - viewport.height;
      setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
    };

    const viewport = window.visualViewport;
    if (!viewport) return;

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);

    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  return keyboardHeight;
};

const useVoiceRecognition = (
  onTranscript: (text: string) => void,
  onEnd: () => void
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Reconocimiento de voz no disponible");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "es-ES";
    recognition.maxAlternatives = 3;

    let finalTranscript = "";

    recognition.onstart = () => {
      console.log("🎤 Reconocimiento iniciado");
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

      onTranscript((finalTranscript + interimTranscript).trim());
    };

    recognition.onerror = (event: any) => {
      console.error("❌ Error en reconocimiento:", event.error);
      setIsListening(false);

      if (event.error === "not-allowed") {
        alert(
          "Permisos de micrófono denegados. Por favor, habilita el micrófono."
        );
      }
    };

    recognition.onend = () => {
      console.log("🛑 Reconocimiento finalizado");
      setIsListening(false);
      onEnd();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn("Error al limpiar reconocimiento:", e);
        }
      }
    };
  }, [onTranscript, onEnd]);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) {
      alert(
        "Tu navegador no soporta reconocimiento de voz. Prueba con Chrome, Edge o Safari."
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error al detener:", e);
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error al iniciar:", e);
      }
    }
  }, [isListening]);

  return { isListening, toggle };
};

// ============================================
// UTILITIES
// ============================================
const createCategoryMatcher = (categories: Category) => {
  const categoryNames = Object.keys(categories);

  const synonyms: { [key: string]: string[] } = {
    comida: [
      "comida",
      "alimentación",
      "alimentos",
      "supermercado",
      "mercado",
      "compras",
      "grocery",
      "mercadona",
      "lidl",
      "carrefour",
      "dia",
    ],
    alimentación: [
      "comida",
      "alimentación",
      "alimentos",
      "supermercado",
      "mercado",
      "compras",
      "grocery",
      "mercadona",
      "lidl",
      "carrefour",
      "dia",
    ],
    transporte: [
      "transporte",
      "gasolina",
      "gasoil",
      "diesel",
      "metro",
      "autobús",
      "autobus",
      "bus",
      "taxi",
      "uber",
      "cabify",
      "bolt",
      "tren",
      "renfe",
      "coche",
      "parking",
    ],
    restaurante: [
      "restaurante",
      "comer",
      "cenar",
      "bar",
      "café",
      "cafetería",
      "tapas",
      "comida rápida",
      "fast food",
      "mcdonald",
      "burger",
      "pizza",
    ],
    ocio: [
      "ocio",
      "entretenimiento",
      "cine",
      "teatro",
      "concierto",
      "fiesta",
      "discoteca",
      "museo",
      "spotify",
      "netflix",
      "hbo",
    ],
    salud: [
      "salud",
      "médico",
      "medico",
      "farmacia",
      "hospital",
      "dentista",
      "seguro médico",
      "seguro",
      "consulta",
    ],
    ropa: [
      "ropa",
      "vestimenta",
      "moda",
      "zapatos",
      "calzado",
      "zapatillas",
      "zara",
      "pull",
      "h&m",
    ],
    casa: [
      "casa",
      "hogar",
      "vivienda",
      "alquiler",
      "hipoteca",
      "luz",
      "agua",
      "gas",
      "electricidad",
      "internet",
      "wifi",
    ],
    hogar: [
      "casa",
      "hogar",
      "vivienda",
      "alquiler",
      "luz",
      "agua",
      "gas",
      "internet",
      "muebles",
      "ikea",
      "leroy",
    ],
    educación: [
      "educación",
      "educacion",
      "curso",
      "universidad",
      "colegio",
      "libros",
      "matrícula",
      "academia",
    ],
    tecnología: [
      "tecnología",
      "tech",
      "ordenador",
      "móvil",
      "movil",
      "teléfono",
      "telefono",
      "apple",
      "samsung",
      "xiaomi",
    ],
    tabaco: ["tabaco", "cigarrillos", "cigarrillo", "puros", "vaper"],
    deporte: [
      "deporte",
      "gimnasio",
      "gym",
      "fitness",
      "running",
      "fútbol",
      "futbol",
      "padel",
    ],
    mascotas: ["mascota", "mascotas", "perro", "gato", "veterinario", "pienso"],
    viajes: [
      "viaje",
      "viajes",
      "vacaciones",
      "hotel",
      "avión",
      "vuelo",
      "booking",
      "airbnb",
    ],
    suscripciones: [
      "suscripción",
      "suscripcion",
      "spotify",
      "netflix",
      "hbo",
      "amazon prime",
      "disney",
    ],
  };

  return (suggestedCategory?: string, description?: string): string | null => {
    if (categoryNames.length === 0) return null;

    const searchText = (suggestedCategory || description || "")
      .toLowerCase()
      .trim();
    if (!searchText) return categoryNames[0];

    let match = categoryNames.find((cat) => cat.toLowerCase() === searchText);
    if (match && categories[match]) return match;

    match = categoryNames.find((cat) => {
      const catLower = cat.toLowerCase();
      return (
        (catLower.includes(searchText) || searchText.includes(catLower)) &&
        categories[cat]
      );
    });
    if (match) return match;

    for (const [key, values] of Object.entries(synonyms)) {
      const foundSynonym = values.find(
        (syn) => searchText.includes(syn) || syn.includes(searchText)
      );

      if (foundSynonym) {
        match = categoryNames.find((cat) => {
          const catLower = cat.toLowerCase();
          return (
            (catLower.includes(key) ||
              key.includes(catLower) ||
              catLower.includes(foundSynonym) ||
              foundSynonym.includes(catLower)) &&
            categories[cat]
          );
        });
        if (match) return match;
      }
    }

    const fuzzyMatch = categoryNames.find((cat) => {
      const catLower = cat.toLowerCase();
      let matches = 0;
      const minLength = Math.min(catLower.length, searchText.length);
      for (let i = 0; i < minLength; i++) {
        if (catLower[i] === searchText[i]) matches++;
      }
      const similarity = matches / Math.max(catLower.length, searchText.length);
      return similarity > 0.7 && categories[cat];
    });

    if (fuzzyMatch) return fuzzyMatch;

    return categoryNames.find((cat) => categories[cat]) || categoryNames[0];
  };
};

const detectExpenseFromText = (text: string) => {
  let expenseDate = new Date().toISOString().slice(0, 10);

  const datePatterns = [
    {
      pattern: /(?:mes\s+pasado|mes\s+anterior|último\s+mes)/i,
      offset: (d: Date) => {
        d.setMonth(d.getMonth() - 1);
        return d;
      },
    },
    {
      pattern: /ayer/i,
      offset: (d: Date) => {
        d.setDate(d.getDate() - 1);
        return d;
      },
    },
    {
      pattern: /hace\s+(\d+)\s+días?/i,
      offset: (d: Date, match: RegExpMatchArray) => {
        d.setDate(d.getDate() - parseInt(match[1]));
        return d;
      },
    },
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
    /(?:pagu[ée]|pagado|he\s+pagado)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
    /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(",", "."));
      const description = match[2]
        .trim()
        .replace(/\s*(?:del|de\s+el)\s+mes\s+(?:pasado|anterior)/i, "")
        .replace(/\s*el\s+mes\s+(?:pasado|anterior)/i, "")
        .trim();

      if (amount > 0 && description) {
        return { amount, description, date: expenseDate };
      }
    }
  }

  return null;
};

// ============================================
// SUB-COMPONENTS
// ============================================
const MessageBubble = memo(
  ({
    message,
    darkMode,
    onCopy,
  }: {
    message: Message;
    darkMode: boolean;
    onCopy: () => void;
  }) => {
    const isUser = message.role === "user";

    return (
      <motion.div
        {...fadeInUp}
        transition={getTransition("fast")}
        className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
      >
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center gap-2 text-green-500 text-xs font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Gasto añadido correctamente</span>
            </motion.div>
          )}

          {!isUser && (
            <button
              onClick={onCopy}
              className={`absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg ${
                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
              }`}
              title="Copiar mensaje"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

const VoiceIndicator = memo(
  ({ input, darkMode }: { input: string; darkMode: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`mb-3 p-3 rounded-lg border-2 ${
        darkMode
          ? "bg-red-500/10 border-red-500/50"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1">
          {[16, 24, 20, 28].map((height, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full animate-pulse"
              style={{
                height: `${height}px`,
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
        <span
          className={`text-sm font-medium ${
            darkMode ? "text-red-400" : "text-red-600"
          }`}
        >
          Escuchando...
        </span>
      </div>

      {input && (
        <p
          className={`text-sm mb-2 ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          &quot;{input}&quot;
        </p>
      )}

      <div
        className={`pt-2 border-t ${
          darkMode ? "border-red-500/20" : "border-red-200"
        }`}
      >
        <p
          className={`text-xs mb-1 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          💡 Prueba a decir:
        </p>
        <div className="space-y-1">
          {[
            "Gasté 25 euros en supermercado",
            "Añade 15 euros en transporte",
            "Pagué 50 euros en restaurante",
          ].map((example, i) => (
            <p
              key={i}
              className={`text-xs ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              • &quot;{example}&quot;
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  )
);

VoiceIndicator.displayName = "VoiceIndicator";

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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <Sparkles className="w-7 h-7 text-purple-500" />
          <h3 className={`text-xl md:text-2xl font-bold ${textClass}`}>
            ¡Hola! Soy tu asistente financiero
          </h3>
        </motion.div>

        <p
          className={`text-sm md:text-base ${textSecondaryClass} max-w-md mx-auto mb-6`}
        >
          Puedo analizar tus gastos, darte consejos y añadir gastos por ti
        </p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
          {[
            { icon: TrendingUp, text: "Analizar gastos" },
            { icon: Plus, text: "Añadir por voz" },
            { icon: Target, text: "Ver presupuestos" },
            { icon: Lightbulb, text: "Dar consejos" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-2 p-3 rounded-xl ${
                darkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5 text-purple-500" />
              <span className={`text-sm ${textClass}`}>{item.text}</span>
            </motion.div>
          ))}
        </div>

        <div className="w-full max-w-md">
          <p className={`text-sm ${textSecondaryClass} mb-3 font-medium`}>
            Prueba preguntando:
          </p>
          <div className="space-y-2">
            {examples.map((question, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onExampleClick(question)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                  darkMode
                    ? "bg-gray-700/70 hover:bg-gray-700 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {question}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

WelcomeScreen.displayName = "WelcomeScreen";

// ============================================
// MAIN COMPONENT - OVERLAY COMPLETO
// ============================================
const AIAssistant: React.FC<AIAssistantProps> = memo(
  ({
    darkMode,
    textClass,
    textSecondaryClass,
    categories,
    addExpense,
    isActive,
    onClose,
  }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const keyboardHeight = useKeyboardHeight();

    const findBestCategory = useMemo(
      () => createCategoryMatcher(categories),
      [categories]
    );

    const handleVoiceTranscript = useCallback((text: string) => {
      setInput(text);
    }, []);

    const handleVoiceEnd = useCallback(() => {
      const detected = detectExpenseFromText(input);
      if (detected) {
        setTimeout(() => {
          sendMessage();
        }, 500);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input]);

    const { isListening, toggle: toggleListening } = useVoiceRecognition(
      handleVoiceTranscript,
      handleVoiceEnd
    );

    useEffect(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const scrollAction =
        messages.length === 0
          ? () => {
              container.scrollTop = 0;
            }
          : () => {
              container.scrollTop = container.scrollHeight;
            };

      requestAnimationFrame(() => {
        scrollAction();
        setTimeout(scrollAction, 100);
      });
    }, [messages.length, isLoading]);

    useEffect(() => {
      if (!isActive) return;

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);

      return () => clearTimeout(timer);
    }, [isActive]);

    const handleCopyMessage = useCallback((index: number, content: string) => {
      navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }, []);

    const handleClearChat = useCallback(() => {
      if (window.confirm("¿Borrar toda la conversación?")) {
        setMessages([]);
      }
    }, []);

    const sendMessage = useCallback(async () => {
      if (!input.trim() || isLoading) return;

      const userMessage = input.trim();
      const timestamp = Date.now();

      const directExpense = detectExpenseFromText(userMessage);
      if (directExpense && addExpense) {
        const matchedCategory = findBestCategory(
          undefined,
          directExpense.description
        );

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
            setMessages((prev) => [
              ...prev,
              { role: "user", content: userMessage, timestamp },
              {
                role: "assistant",
                content: `✅ ¡Gasto añadido! ${directExpense.amount}€ en ${matchedCategory}`,
                action: "expense_added",
                expenseData,
                timestamp: Date.now(),
              },
            ]);
            return;
          } catch (error) {
            console.error("Error añadiendo gasto:", error);
          }
        }
      }

      setInput("");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, timestamp },
      ]);
      setIsLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Esta es una respuesta de ejemplo. La integración con IA está pendiente.",
            timestamp: Date.now(),
          },
        ]);
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Error al procesar tu solicitud. Intenta de nuevo.",
            timestamp: Date.now(),
          },
        ]);
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

    if (!isActive) return null;

    // Calcular altura del contenedor de mensajes
    const inputHeight = 80; // Altura aproximada del input area
    const headerHeight = 64; // Altura del header
    const messagesHeight =
      keyboardHeight > 0
        ? `calc(100vh - ${keyboardHeight}px - ${headerHeight}px - ${inputHeight}px)`
        : `calc(100vh - ${headerHeight}px - ${inputHeight}px)`;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-[100] ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Header fijo */}
        <div
          className={`sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between ${
            darkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className={`text-lg font-bold ${textClass}`}>Asistente IA</h2>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <span className={`text-sm ${textSecondaryClass}`}>
                  {messages.length}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearChat}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  }`}
                  title="Limpiar chat"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </motion.button>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Contenedor de mensajes */}
        <div
          ref={messagesContainerRef}
          className="overflow-y-auto px-4 py-4"
          style={{
            height: messagesHeight,
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
            <div className="space-y-3 max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.map((message, idx) => (
                  <MessageBubble
                    key={`${message.timestamp}-${idx}`}
                    message={message}
                    darkMode={darkMode}
                    onCopy={() => handleCopyMessage(idx, message.content)}
                  />
                ))}

                {isLoading && (
                  <motion.div
                    key="loading"
                    {...fadeInUp}
                    className="flex justify-start"
                  >
                    <div
                      className={`rounded-xl px-4 py-3 ${
                        darkMode ? "bg-gray-800" : "bg-gray-100"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area fija abajo */}
        <div
          className={`fixed bottom-0 left-0 right-0 border-t p-4 ${
            darkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-200"
          }`}
          style={{
            paddingBottom:
              keyboardHeight > 0
                ? "1rem"
                : "calc(1rem + env(safe-area-inset-bottom))",
          }}
        >
          <div className="max-w-4xl mx-auto">
            <AnimatePresence>
              {isListening && (
                <VoiceIndicator input={input} darkMode={darkMode} />
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame sobre tus gastos..."
                disabled={isLoading}
                className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } disabled:opacity-50`}
                style={{ fontSize: "16px" }}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                disabled={isLoading}
                className={`px-4 py-3 rounded-xl transition-all ${
                  isListening
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/50"
                    : darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } disabled:opacity-50`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

AIAssistant.displayName = "AIAssistant";

export default AIAssistant;
