// ============================================
// AIAssistant.tsx - VERSIÓN ULTRA OPTIMIZADA v3.0
// - Análisis inteligente con caché
// - Detección de intenciones mejorada
// - Performance: 60fps garantizado
// - Insights contextuales dinámicos
// ============================================
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Copy,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Zap,
  Infinity,
} from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { FixedSizeList, FixedSizeList as List } from "react-window";
// ============================================
// TYPES
// ============================================
interface Message {
  role: "user" | "assistant";
  content: string;
  action?:
  | "expense_added"
  | "insight"
  | "prediction"
  | "recommendation"
  | "warning";
  expenseData?: any;
  timestamp: number;
  id: string;
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
  allExpenses?: any[];
  income?: number;
  budgets?: { [key: string]: number };
  goals?: any;
  categoryTotals?: any[];
  // Indica si los datos (gastos) todavía se están cargando desde Firestore
  isLoading?: boolean;
}

interface Analysis {
  totalThisMonth: number;
  income: number;
  currentSavings: number;
  projectedMonthTotal: number;
  avgDailySpend: number;
  savingsGoal: number;
  goalProgress: number;
  categoryAnalysis: any[];
  maxSpendDay: { name: string; amount: number } | null;
  hasOverBudget: boolean;
  hasWarning: boolean;
  daysLeft: number;
  monthProgress: number;
  weeklyAverage: number;
  trendDirection: "up" | "down" | "stable";
  smallExpenses: number;
  largeExpenses: number;
}

interface AIQuotas {
  remaining: number;
  total: number;
  unlimited: boolean;
  resetDate: string;
  plan?: string;
}

// ============================================
// CONSTANTS
// ============================================
const ITEM_HEIGHT = 110;
const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const isNative = Capacitor.isNativePlatform();

// ============================================
// HAPTIC FEEDBACK
// ============================================
const vibrate = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (isNative) {
    try {
      await Haptics.impact({ style });
    } catch { }
  }
};

// ============================================
// KEYBOARD HEIGHT HOOK (OPTIMIZADO)
// ============================================
const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;
        const heightDiff = window.innerHeight - viewport.height;
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
      });
    };

    const viewport = window.visualViewport;
    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  return keyboardHeight;
};

// ============================================
// VOICE RECOGNITION HOOK (OPTIMIZADO)
// ============================================
const useVoiceRecognition = (
  onTranscript: (text: string) => void,
  onEnd: () => void
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onEndRef = useRef(onEnd);
  const timeoutRef = useRef<NodeJS.Timeout>();

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

      const fullText = (finalTranscript + interimTranscript).trim();
      if (onTranscriptRef.current) {
        onTranscriptRef.current(fullText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Error en reconocimiento:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (onEndRef.current) onEndRef.current();
      }, 100);
    };

    recognitionRef.current = recognition;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { }
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
        await vibrate(ImpactStyle.Light);
      } catch (permissionError) {
        console.error("Permiso denegado");
      }
    }
  }, [isListening]);

  return { isListening, toggle };
};

// ============================================
// CATEGORY MATCHER (OPTIMIZADO)
// ============================================
const createCategoryMatcher = (categories: Category) => {
  const categoryNames = Object.keys(categories);

  const synonyms: { [key: string]: string[] } = {
    comida: [
      "comida",
      "alimentación",
      "supermercado",
      "mercado",
      "compras",
      "super",
      "mercadona",
      "carrefour",
    ],
    transporte: [
      "transporte",
      "gasolina",
      "taxi",
      "uber",
      "cabify",
      "parking",
      "combustible",
      "diesel",
    ],
    restaurante: [
      "restaurante",
      "comer",
      "bar",
      "café",
      "comida",
      "cena",
      "desayuno",
      "almuerzo",
    ],
    ocio: [
      "ocio",
      "cine",
      "teatro",
      "concierto",
      "fiesta",
      "diversión",
      "entretenimiento",
    ],
    salud: ["salud", "médico", "farmacia", "hospital", "medicina", "doctor"],
    ropa: ["ropa", "zapatos", "moda", "vestir", "zapatillas", "pantalones"],
    casa: [
      "casa",
      "hogar",
      "alquiler",
      "luz",
      "agua",
      "gas",
      "internet",
      "wifi",
    ],
    educación: [
      "educación",
      "curso",
      "universidad",
      "academia",
      "libro",
      "estudios",
    ],
    tecnología: [
      "tecnología",
      "ordenador",
      "móvil",
      "tablet",
      "electrónica",
      "gadget",
    ],
    tabaco: ["tabaco", "cigarrillos", "cigarros", "fumar"],
    deporte: ["deporte", "gimnasio", "gym", "fitness", "running"],
    mascotas: ["mascota", "perro", "gato", "veterinario", "pienso"],
    viajes: ["viaje", "hotel", "avión", "vacaciones", "turismo"],
    suscripciones: ["suscripción", "spotify", "netflix", "prime", "disney"],
  };

  return (suggestedCategory?: string, description?: string): string | null => {
    if (categoryNames.length === 0) return null;

    const searchText = (suggestedCategory || description || "")
      .toLowerCase()
      .trim();
    if (!searchText) return categoryNames[0];

    // Coincidencia exacta
    const exactMatch = categoryNames.find(
      (cat) => cat.toLowerCase() === searchText
    );
    if (exactMatch && categories[exactMatch]) return exactMatch;

    // Búsqueda por sinónimos
    for (const [key, values] of Object.entries(synonyms)) {
      const foundSynonym = values.find(
        (syn) => searchText.includes(syn) || syn.includes(searchText)
      );

      if (foundSynonym) {
        const match = categoryNames.find((cat) => {
          const catLower = cat.toLowerCase();
          return (
            (catLower.includes(key) || key.includes(catLower)) &&
            categories[cat]
          );
        });
        if (match) return match;
      }
    }

    // Fallback
    return categoryNames.find((cat) => categories[cat]) || categoryNames[0];
  };
};

// ============================================
// EXPENSE DETECTOR (MEJORADO)
// ============================================
const detectExpenseFromText = (text: string) => {
  let expenseDate = new Date().toISOString().slice(0, 10);

  // Detectar fechas relativas
  const datePatterns = [
    {
      pattern: /ayer/i,
      offset: (d: Date) => {
        d.setDate(d.getDate() - 1);
        return d;
      },
    },
    {
      pattern: /anteayer/i,
      offset: (d: Date) => {
        d.setDate(d.getDate() - 2);
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
    {
      pattern: /la\s+semana\s+pasada/i,
      offset: (d: Date) => {
        d.setDate(d.getDate() - 7);
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

  // Patrones mejorados para detectar gastos
  const patterns = [
    // "gasté/gastado 25 en supermercado"
    /(?:gast[ée]|gastado|he\s+gastado)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
    // "añade 25 en supermercado"
    /(?:añade?|añadir|pon|poner|registra|apunta)\s+(?:gasto\s+(?:de\s+)?)?(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
    // "25€ en supermercado" o "25 en supermercado"
    /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s*(?:en|de|por|del|para)\s+(.+?)(?:\s|$|\.|,)/i,
    // "supermercado 25€"
    /(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount: number;
      let description: string;

      // Último patrón tiene orden invertido
      if (pattern.source.includes("(.+?)\\s+(\\d+")) {
        description = match[1].trim();
        amount = parseFloat(match[2].replace(",", "."));
      } else {
        amount = parseFloat(match[1].replace(",", "."));
        description = match[2].trim();
      }

      if (amount > 0 && description && description.length > 1) {
        return { amount, description, date: expenseDate };
      }
    }
  }

  return null;
};

// ============================================
// ANÁLISIS INTELIGENTE CON CACHÉ
// ============================================
const analyzeUserData = (
  allExpenses: any[] = [],
  income: number = 0,
  budgets: { [key: string]: number } = {},
  goals: any = null,
  categoryTotals: any[] = []
): Analysis => {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);

  // Gastos del mes actual
  const thisMonthExpenses = allExpenses.filter((exp) =>
    exp.date?.startsWith(currentMonth)
  );

  const totalThisMonth = thisMonthExpenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0
  );

  // Análisis semanal
  const lastWeekExpenses = allExpenses.filter((exp) => {
    const expDate = new Date(exp.date);
    const daysDiff = Math.floor(
      (today.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 7;
  });
  const weeklyTotal = lastWeekExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const weeklyAverage = weeklyTotal / 7;

  // Tendencia (comparar última semana vs semana anterior)
  const prevWeekExpenses = allExpenses.filter((exp) => {
    const expDate = new Date(exp.date);
    const daysDiff = Math.floor(
      (today.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff > 7 && daysDiff <= 14;
  });
  const prevWeekTotal = prevWeekExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const trendDirection: "up" | "down" | "stable" =
    weeklyTotal > prevWeekTotal * 1.1
      ? "up"
      : weeklyTotal < prevWeekTotal * 0.9
        ? "down"
        : "stable";

  // Análisis de categorías
  const categoryAnalysis = categoryTotals
    .map((ct) => {
      const budget = budgets[ct.category] || 0;
      const usage = budget > 0 ? (ct.total / budget) * 100 : 0;
      return {
        category: ct.category,
        total: ct.total,
        budget,
        usage,
        isOverBudget: usage > 100,
        isWarning: usage > 80 && usage <= 100,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Detectar patrones de gasto por día
  const expensesByDay = thisMonthExpenses.reduce((acc: any, exp) => {
    const day = new Date(exp.date).getDay();
    acc[day] = (acc[day] || []).concat(exp.amount);
    return acc;
  }, {});

  const dayAverages = Object.entries(expensesByDay).map(
    ([day, amounts]: any) => ({
      day: parseInt(day),
      avg: amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length,
      total: amounts.reduce((a: number, b: number) => a + b, 0),
    })
  );

  const maxSpendDay =
    dayAverages.length > 0
      ? dayAverages.reduce((max, curr) => (curr.total > max.total ? curr : max))
      : null;

  // Proyección del mes
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const avgDailySpend = totalThisMonth / dayOfMonth;
  const projectedMonthTotal = avgDailySpend * daysInMonth;

  // Estado de objetivos
  const savingsGoal = goals?.totalSavingsGoal || goals?.monthlySavingsGoal || 0;
  const currentSavings = income - totalThisMonth;
  const goalProgress =
    savingsGoal > 0 ? (currentSavings / savingsGoal) * 100 : 0;

  // Gastos pequeños vs grandes
  const smallExpenses = thisMonthExpenses
    .filter((exp) => exp.amount < 10)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const largeExpenses = thisMonthExpenses
    .filter((exp) => exp.amount >= 100)
    .reduce((sum, exp) => sum + exp.amount, 0);

  return {
    totalThisMonth,
    income,
    currentSavings,
    projectedMonthTotal,
    avgDailySpend,
    savingsGoal,
    goalProgress,
    categoryAnalysis,
    maxSpendDay: maxSpendDay
      ? {
        name: DAY_NAMES[maxSpendDay.day],
        amount: maxSpendDay.total,
      }
      : null,
    hasOverBudget: categoryAnalysis.some((c) => c.isOverBudget),
    hasWarning: categoryAnalysis.some((c) => c.isWarning),
    daysLeft: daysInMonth - dayOfMonth,
    monthProgress: (dayOfMonth / daysInMonth) * 100,
    weeklyAverage,
    trendDirection,
    smallExpenses,
    largeExpenses,
  };
};

// ============================================
// GENERADOR DE INSIGHTS (MEJORADO)
// ============================================
const generateSmartInsights = (analysis: Analysis): string[] => {
  const insights: string[] = [];

  // Alerta urgente si va a pasarse del presupuesto
  if (analysis.projectedMonthTotal > analysis.income && analysis.income > 0) {
    const excess = analysis.projectedMonthTotal - analysis.income;
    insights.push(
      `🚨 ¡ALERTA! A este ritmo te pasarás €${excess.toFixed(
        0
      )} de tu presupuesto`
    );
  }

  // Tendencia de gasto
  if (analysis.trendDirection === "up") {
    insights.push(
      `📈 Tus gastos están aumentando (€${analysis.weeklyAverage.toFixed(
        2
      )}/día esta semana)`
    );
  } else if (analysis.trendDirection === "down") {
    insights.push(
      `📉 ¡Bien! Tus gastos están bajando (€${analysis.weeklyAverage.toFixed(
        2
      )}/día esta semana)`
    );
  }

  // Alertas de presupuesto
  if (analysis.hasOverBudget) {
    const overCategories = analysis.categoryAnalysis
      .filter((c) => c.isOverBudget)
      .map((c) => c.category)
      .slice(0, 2);
    insights.push(`⚠️ Presupuesto superado en: ${overCategories.join(", ")}`);
  } else if (analysis.hasWarning) {
    const warningCategories = analysis.categoryAnalysis
      .filter((c) => c.isWarning)
      .map((c) => `${c.category} (${c.usage.toFixed(0)}%)`);
    insights.push(`⚡ Cerca del límite: ${warningCategories[0]}`);
  }

  // Proyección realista
  if (analysis.projectedMonthTotal > 0 && analysis.daysLeft > 0) {
    const dailyBudget =
      (analysis.income - analysis.totalThisMonth) / analysis.daysLeft;
    if (dailyBudget > 0) {
      insights.push(
        `💰 Presupuesto diario restante: €${dailyBudget.toFixed(2)} (${analysis.daysLeft
        } días)`
      );
    }
  }

  // Estado de ahorro
  if (analysis.savingsGoal > 0) {
    if (analysis.goalProgress >= 100) {
      insights.push(
        `🎉 ¡Objetivo alcanzado! Has ahorrado €${analysis.currentSavings.toFixed(
          0
        )}`
      );
    } else if (analysis.goalProgress > 50) {
      const remaining = analysis.savingsGoal - analysis.currentSavings;
      insights.push(
        `🎯 Ya casi: Te faltan €${remaining.toFixed(0)} para tu objetivo`
      );
    }
  }

  // Gastos hormiga
  if (analysis.smallExpenses > 50) {
    const percentage = (analysis.smallExpenses / analysis.totalThisMonth) * 100;
    insights.push(
      `🐜 Gastos pequeños: €${analysis.smallExpenses.toFixed(
        0
      )} (${percentage.toFixed(0)}% del total)`
    );
  }

  // Patrón de gasto
  if (
    analysis.maxSpendDay &&
    analysis.maxSpendDay.amount > analysis.avgDailySpend * 1.5
  ) {
    insights.push(
      `📅 Los ${analysis.maxSpendDay.name}s gastas un ${Math.round(
        (analysis.maxSpendDay.amount / (analysis.avgDailySpend * 4)) * 100
      )}% más que otros días`
    );
  }

  return insights.slice(0, 5); // Máximo 5 insights
};

// ============================================
// PROMPTS INTELIGENTES (CONTEXTUALES)
// ============================================
const getSmartPrompts = (analysis: Analysis) => {
  const prompts = [
    {
      category: "🔮 Predicciones",
      icon: TrendingUp,
      color: "blue" as const,
      examples: [
        analysis.savingsGoal > 0
          ? "¿Cuándo alcanzaré mi objetivo de ahorro?"
          : "¿Cuánto podría ahorrar si reduzco un 20%?",
        "Proyecta mi gasto del mes completo",
        analysis.daysLeft > 0
          ? `¿Cuánto debo gastar al día estos ${analysis.daysLeft} días?`
          : "¿Cómo será mi próximo mes?",
      ],
    },
    {
      category: "🔍 Patrones",
      icon: Search,
      color: "purple" as const,
      examples: [
        "¿Qué días de la semana gasto más?",
        analysis.smallExpenses > 50
          ? "Analiza mis gastos hormiga"
          : "¿Tengo gastos recurrentes ocultos?",
        analysis.categoryAnalysis.length > 0
          ? `¿Por qué gasto tanto en ${analysis.categoryAnalysis[0]?.category}?`
          : "¿Cuál es mi patrón de gasto?",
      ],
    },
    {
      category: "💡 Insights",
      icon: Lightbulb,
      color: "yellow" as const,
      examples: [
        "Analiza todos mis gastos",
        analysis.hasOverBudget || analysis.hasWarning
          ? "¿Cómo puedo equilibrar mis presupuestos?"
          : "¿Voy bien con mis finanzas?",
        "¿Cuál es mi categoría más problemática?",
      ],
    },
    {
      category: "⚡ Optimización",
      icon: Zap,
      color: "green" as const,
      examples: [
        analysis.trendDirection === "up"
          ? "¿Cómo freno el aumento de gastos?"
          : "Dame consejos para ahorrar más",
        "Sugiere recortes sin afectar mi vida",
        `¿Dónde puedo ahorrar €${Math.min(
          200,
          analysis.totalThisMonth * 0.2
        ).toFixed(0)}?`,
      ],
    },
  ];

  return prompts;
};

// ============================================
// MESSAGE BUBBLE (ULTRA OPTIMIZADO)
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

    const getActionIcon = useCallback(() => {
      switch (message.action) {
        case "expense_added":
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case "insight":
          return <Lightbulb className="w-4 h-4 text-yellow-500" />;
        case "prediction":
          return <TrendingUp className="w-4 h-4 text-blue-500" />;
        case "recommendation":
          return <Target className="w-4 h-4 text-purple-500" />;
        case "warning":
          return <AlertCircle className="w-4 h-4 text-orange-500" />;
        default:
          return null;
      }
    }, [message.action]);

    const getActionLabel = useCallback(() => {
      switch (message.action) {
        case "expense_added":
          return "Gasto añadido";
        case "insight":
          return "Análisis";
        case "prediction":
          return "Predicción";
        case "recommendation":
          return "Recomendación";
        case "warning":
          return "Alerta";
        default:
          return "";
      }
    }, [message.action]);

    return (
      <div
        className={`flex ${isUser ? "justify-end" : "justify-start"
          } group mb-3`}
      >
        <div
          className={`max-w-[85%] md:max-w-[80%] rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 relative transition-all ${isUser
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
            : darkMode
              ? "bg-gray-700 text-gray-100"
              : "bg-gray-100 text-gray-900"
            }`}
        >
          <p className="text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>

          {message.action && (
            <div
              className={`mt-2 flex items-center gap-2 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"
                }`}
            >
              {getActionIcon()}
              <span>{getActionLabel()}</span>
            </div>
          )}

          {!isUser && (
            <button
              onClick={onCopy}
              className={`absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                }`}
              title={copied ? "¡Copiado!" : "Copiar"}
              aria-label={copied ? "Mensaje copiado" : "Copiar mensaje"}
            >
              <Copy
                className={`w-4 h-4 transition-colors ${copied ? "text-green-500" : ""
                  }`}
              />
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
// WELCOME SCREEN (ULTRA OPTIMIZADO)
// ============================================
const WelcomeScreen = memo(
  ({
    textClass,
    textSecondaryClass,
    darkMode,
    onExampleClick,
    smartPrompts,
    insights,
  }: {
    textClass: string;
    textSecondaryClass: string;
    darkMode: boolean;
    onExampleClick: (question: string) => void;
    smartPrompts: any[];
    insights: string[];
  }) => {
    const colorClasses = {
      blue: darkMode
        ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
        : "bg-blue-100 text-blue-600 border-blue-200",
      purple: darkMode
        ? "bg-purple-600/20 text-purple-400 border-purple-500/30"
        : "bg-purple-100 text-purple-600 border-purple-200",
      yellow: darkMode
        ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30"
        : "bg-yellow-100 text-yellow-600 border-yellow-200",
      green: darkMode
        ? "bg-green-600/20 text-green-400 border-green-500/30"
        : "bg-green-100 text-green-600 border-green-200",
    };

    return (
      <div className="flex flex-col px-3 pt-4 space-y-4 md:px-4 md:pt-6 md:space-y-6">
        {/* Header con animación */}
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
            <h3 className={`text-xl md:text-2xl font-bold ${textClass}`}>
              Asistente Financiero IA
            </h3>
          </div>
          <p className={`text-sm ${textSecondaryClass} max-w-md mx-auto`}>
            Análisis inteligente, predicciones en tiempo real y optimización
            personalizada
          </p>
        </div>

        {/* Insights Destacados */}
        {insights.length > 0 && (
          <div
            className={`rounded-xl border p-4 transition-all ${darkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200 shadow-sm"
              }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <h4 className={`text-sm font-semibold ${textClass}`}>
                Tu situación ahora
              </h4>
            </div>
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight, idx) => (
                <p
                  key={idx}
                  className={`text-xs ${textSecondaryClass} leading-relaxed flex items-start gap-2`}
                >
                  <span className="mt-0.5">•</span>
                  <span>{insight}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: TrendingUp, text: "Analizar patrones", color: "purple" },
            { icon: Target, text: "Proyectar gastos", color: "blue" },
            { icon: Lightbulb, text: "Dar consejos smart", color: "yellow" },
            { icon: Zap, text: "Optimizar ahorro", color: "green" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-3 rounded-xl transition-all ${darkMode
                ? "bg-gray-700/50 hover:bg-gray-700/70"
                : "bg-gray-50 hover:bg-gray-100"
                }`}
            >
              <item.icon
                className={`w-4 h-4 ${item.color === "purple"
                  ? "text-purple-500"
                  : item.color === "blue"
                    ? "text-blue-500"
                    : item.color === "yellow"
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`}
              />
              <span className={`text-xs font-medium ${textClass}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Smart Prompts Categorizados */}
        <div className="space-y-4">
          {smartPrompts.map((section, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`p-1.5 rounded-lg border ${colorClasses[section.color as keyof typeof colorClasses]
                    }`}
                >
                  <section.icon className="w-3 h-3" />
                </div>
                <h4 className={`text-xs font-bold ${textClass}`}>
                  {section.category}
                </h4>
              </div>
              <div className="space-y-1.5">
                {section.examples
                  .slice(0, 2)
                  .map((prompt: string, pIdx: number) => (
                    <button
                      key={pIdx}
                      onClick={() => {
                        onExampleClick(prompt);
                        vibrate(ImpactStyle.Light);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all min-h-[44px] active:scale-[0.98] ${darkMode
                        ? "bg-gray-700/70 hover:bg-gray-700 active:bg-gray-600 text-gray-200"
                        : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700"
                        }`}
                    >
                      {prompt}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div
          className={`rounded-xl border p-4 ${darkMode
            ? "bg-purple-600/10 border-purple-500/30"
            : "bg-purple-50 border-purple-200"
            }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4 text-purple-500" />
            <span className={`text-xs font-semibold ${textClass}`}>
              Añadir gasto rápido
            </span>
          </div>
          <p className={`text-xs ${textSecondaryClass} mb-2`}>
            Di algo como: "25€ en supermercado" o "50 en gasolina"
          </p>
          <div className="flex gap-2">
            {["25€ en supermercado", "50€ en gasolina"].map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onExampleClick(example);
                  vibrate(ImpactStyle.Light);
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
                  }`}
              >
                {example.split(" en ")[1] || example}
              </button>
            ))}
          </div>
        </div>

        {/* Análisis Completo - Destacado */}
        <div
          className={`rounded-xl border-2 p-4 ${darkMode
            ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50"
            : "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300"
            }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className={`text-xs font-bold ${textClass}`}>
              🔥 Análisis Completo
            </span>
          </div>
          <p className={`text-xs ${textSecondaryClass} mb-3`}>
            Obtén un reporte detallado con tendencias, patrones y
            recomendaciones personalizadas
          </p>
          <button
            onClick={() => {
              onExampleClick("Analiza todos mis gastos");
              vibrate(ImpactStyle.Medium);
            }}
            className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg ${darkMode
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              }`}
          >
            Ver Análisis Completo →
          </button>
        </div>
      </div>
    );
  }
);

WelcomeScreen.displayName = "WelcomeScreen";

// ============================================
// PROCESADOR INTELIGENTE DE QUERIES
// ============================================

const callAIAssistant = async (
  query: string,
  analysis: Analysis,
  _allExpenses: any[] = [],
  income: number = 0,
  _budgets: { [key: string]: number } = {}
): Promise<{ content: string; quotas?: AIQuotas }> => {
  try {
    const functions = getFunctions(undefined, "europe-west1");
    const askDeepSeek = httpsCallable<
      {
        query: string;
        contextData: {
          totalExpenses: number;
          income: number;
          avgDaily: number;
          topCategories: Array<{ category: string; total: number }>;
          trend: "up" | "down" | "stable";
          daysLeft?: number;
          smallExpenses?: number;
          projectedTotal?: number;
          savingsGoal?: number;
          currentSavings?: number;
          hasOverBudget?: boolean;
          maxSpendDay?: { name: string; amount: number } | null;
          recentHistory?: Array<any>;
          goals?: number;
        };
      },
      {
        success: boolean;
        content?: string;
        error?: string;
        quotas?: AIQuotas;
        fallbackUsed?: boolean;
      }
    >(functions, "askDeepSeek");

    const result = await askDeepSeek({
      query,
      contextData: {
        totalExpenses: analysis.totalThisMonth,
        income,
        avgDaily: analysis.avgDailySpend,
        topCategories: analysis.categoryAnalysis.slice(0, 5).map((cat) => ({
          category: cat.category,
          total: cat.total,
        })),
        trend: analysis.trendDirection,
        daysLeft: analysis.daysLeft,
        smallExpenses: analysis.smallExpenses,
        projectedTotal: analysis.projectedMonthTotal,
        // ✅ CONTEXTO POTENTE (AÑADIDO)
        savingsGoal: analysis.savingsGoal,
        currentSavings: analysis.currentSavings,
        hasOverBudget: analysis.hasOverBudget,
        maxSpendDay: analysis.maxSpendDay,
        // Últimos 10 gastos para contexto inmediato
        recentHistory: _allExpenses.slice(0, 10).map(e => ({
          name: e.name,
          amount: e.amount,
          category: e.category,
          date: e.date
        })),
        goals: analysis.goalProgress
      },
    });

    if (result.data.success && result.data.content) {
      return {
        content: result.data.content,
        quotas: result.data.quotas,
      };
    } else {
      throw new Error(result.data.error || "Error en la respuesta");
    }
  } catch (error: any) {
    console.error("Error llamando a askDeepSeek:", error);
    throw error;
  }
};

const createQueryProcessor = (
  analysis: Analysis,
  allExpenses: any[],
  isLoading: boolean
) => {
  return (query: string): { content: string; action?: string; useAPI: boolean } => {
    const lowerQuery = query.toLowerCase();

    // ============================================
    // ✅ CHECK GENERAL: Detectar queries que necesitan datos
    // ============================================
    const needsDataKeywords = [
      "proyect",
      "proyección",
      "analiza",
      "análisis",
      "reporte",
      "resumen",
      "patrón",
      "patrones",
      "cuándo",
      "cuánto",
      "debo gastar",
      "puedo gastar",
      "hormiga",
      "pequeño",
      "presupuesto",
      "límite",
      "ahorrar",
      "recortar",
      "reducir",
      "optimizar",
      "qué día",
      "cuándo gasto",
      "compar",
      "anterior",
      "vs",
      "versus",
      "tendencia",
      "predicc",
    ];

    const queryNeedsExpenses = needsDataKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    // Si la query necesita datos pero los gastos todavía se están cargando,
    // devolver un mensaje de estado en lugar de decir que no hay datos.
    if (queryNeedsExpenses && isLoading) {
      return {
        content:
          "⏳ **Cargando tus gastos...**\n\n" +
          "Estoy terminando de leer tus datos. Intenta esta misma pregunta en unos segundos.",
        action: "insight",
        useAPI: false,
      };
    }

    // Si la query necesita datos y realmente no hay movimientos, responder apropiadamente
    const hasAnyExpense = Array.isArray(allExpenses) && allExpenses.length > 0;
    if (queryNeedsExpenses && !hasAnyExpense) {
      return {
        content:
          `📭 **No tienes gastos registrados aún**\n\n` +
          `Para usar el análisis IA, necesito que primero añadas algunos gastos.\n\n` +
          `💡 **Formas rápidas de empezar:**\n\n` +
          `1️⃣ **Voz rápida:**\n` +
          `   • "25€ en supermercado"\n` +
          `   • "50€ en gasolina"\n` +
          `   • "15€ en cenas"\n\n` +
          `2️⃣ **Botón + (abajo):**\n` +
          `   • Formulario completo con detalles\n\n` +
          `3️⃣ **Gastos recurrentes:**\n` +
          `   • Configura suscripciones mensuales\n` +
          `   • Se añaden automáticamente cada mes\n\n` +
          `📊 **Una vez tengas datos, podré:**\n` +
          `• Analizar tus patrones de gasto\n` +
          `• Hacer predicciones del mes completo\n` +
          `• Detectar gastos hormiga\n` +
          `• Darte recomendaciones personalizadas\n` +
          `• Proyectar tus finanzas futuras\n` +
          `• ¡Y mucho más!\n\n` +
          `🚀 ¡Empieza ahora!`,
        action: "insight",
        useAPI: false,
      };
    }

    // Detectar si debe usar la API
    const useAPIKeywords = [
      "analiza todos",
      "análisis completo",
      "reporte completo",
      "cómo puedo",
      "dame consejo",
      "sugiere",
      "recomienda",
      "qué hago",
      "ayúdame",
      "explica",
      "por qué",
    ];

    const shouldUseAPI = useAPIKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    if (shouldUseAPI && hasAnyExpense) {
      return {
        content: "",
        action: "insight",
        useAPI: true,
      };
    }

    // PREDICCIONES
    if (
      lowerQuery.includes("cuándo") &&
      (lowerQuery.includes("objetivo") || lowerQuery.includes("meta"))
    ) {
      if (
        analysis.savingsGoal > 0 &&
        analysis.currentSavings < analysis.savingsGoal
      ) {
        const remaining = analysis.savingsGoal - analysis.currentSavings;
        const daysAtCurrentRate = Math.ceil(
          remaining /
          (analysis.avgDailySpend > 0
            ? analysis.income - analysis.avgDailySpend * 30
            : 1)
        );

        return {
          content:
            `📊 **Proyección de Objetivo**\n\n` +
            `• Objetivo: €${analysis.savingsGoal.toFixed(0)}\n` +
            `• Ahorrado: €${analysis.currentSavings.toFixed(
              0
            )} (${analysis.goalProgress.toFixed(0)}%)\n` +
            `• Falta: €${remaining.toFixed(0)}\n\n` +
            `🎯 Al ritmo actual, lo alcanzarás en **${daysAtCurrentRate} días**.\n\n` +
            `💡 **Consejo:** Si ahorras €10 extra al día, lo lograrás ${Math.floor(
              daysAtCurrentRate * 0.25
            )} días antes.`,
          action: "prediction",
          useAPI: false,
        };
      }
      return {
        content:
          "Para hacer predicciones, primero configura un objetivo de ahorro en la sección de Objetivos.",
        action: "recommendation",
        useAPI: false,
      };
    }

    // PROYECCIONES
    if (
      lowerQuery.includes("proyect") ||
      lowerQuery.includes("proyección") ||
      (lowerQuery.includes("gastar") && lowerQuery.includes("mes"))
    ) {
      if (analysis.projectedMonthTotal > 0) {
        const diff = analysis.projectedMonthTotal - analysis.totalThisMonth;
        const savingsProjected = analysis.income - analysis.projectedMonthTotal;

        return {
          content:
            `📈 **Proyección del Mes**\n\n` +
            `• Gastado hoy: €${analysis.totalThisMonth.toFixed(2)}\n` +
            `• Proyección total: €${analysis.projectedMonthTotal.toFixed(
              2
            )}\n` +
            `• Diferencia: €${diff.toFixed(2)}\n` +
            `• Días restantes: ${analysis.daysLeft}\n` +
            `• Promedio diario: €${analysis.avgDailySpend.toFixed(2)}\n\n` +
            (analysis.income > 0
              ? `💰 Ahorro proyectado: **€${savingsProjected.toFixed(2)}**\n\n`
              : "") +
            (analysis.trendDirection === "up"
              ? `⚠️ Tus gastos están **aumentando**. Considera ajustar.`
              : analysis.trendDirection === "down"
                ? `✅ ¡Bien! Tus gastos están **bajando**.`
                : ``),
          action: "prediction",
          useAPI: false,
        };
      }
    }

    // CUÁNTO DEBO GASTAR AL DÍA
    if (
      lowerQuery.includes("debo gastar") ||
      lowerQuery.includes("puedo gastar")
    ) {
      if (analysis.income > 0 && analysis.daysLeft > 0) {
        const remaining = analysis.income - analysis.totalThisMonth;
        const dailyBudget = remaining / analysis.daysLeft;
        const comparison = dailyBudget / analysis.avgDailySpend;

        return {
          content:
            `💰 **Presupuesto Diario Restante**\n\n` +
            `• Disponible: €${remaining.toFixed(2)}\n` +
            `• Días restantes: ${analysis.daysLeft}\n` +
            `• **Máximo por día: €${dailyBudget.toFixed(2)}**\n\n` +
            (comparison < 0.8
              ? `⚠️ Debes reducir un **${((1 - comparison) * 100).toFixed(
                0
              )}%** tu gasto diario.`
              : comparison > 1.2
                ? `✅ Tienes margen! Puedes gastar **${(
                  (comparison - 1) *
                  100
                ).toFixed(0)}%** más.`
                : `✅ Mantén tu ritmo actual.`),
          action: "recommendation",
          useAPI: false,
        };
      }
    }

    // PATRONES DE GASTO
    if (lowerQuery.includes("qué día") || lowerQuery.includes("cuándo gasto")) {
      if (analysis.maxSpendDay) {
        const today = new Date();
        const thisMonthExpenses = allExpenses.filter((exp) =>
          exp.date?.startsWith(today.toISOString().slice(0, 7))
        );

        const expensesByDay = thisMonthExpenses.reduce((acc: any, exp) => {
          const day = new Date(exp.date).getDay();
          if (!acc[day]) acc[day] = [];
          acc[day].push(exp.amount);
          return acc;
        }, {});

        const dayStats = Object.entries(expensesByDay)
          .map(([day, amounts]: any) => ({
            day: parseInt(day),
            name: DAY_NAMES[parseInt(day)],
            avg:
              amounts.reduce((a: number, b: number) => a + b, 0) /
              amounts.length,
            count: amounts.length,
          }))
          .sort((a, b) => b.avg - a.avg);

        return {
          content:
            `📅 **Patrón de Gasto Semanal**\n\n` +
            `• Día con más gasto: **${analysis.maxSpendDay.name}**\n` +
            `• Promedio ese día: €${analysis.maxSpendDay.amount.toFixed(
              2
            )}\n\n` +
            `📊 **Top 3 días:**\n` +
            dayStats
              .slice(0, 3)
              .map(
                (d, i) =>
                  `${i + 1}. ${d.name}: €${d.avg.toFixed(2)} (${d.count
                  } gastos)`
              )
              .join("\n") +
            `\n\n💡 **Consejo:** Planifica mejor tus ${analysis.maxSpendDay.name}s.`,
          action: "insight",
          useAPI: false,
        };
      }
    }

    // PRESUPUESTOS
    if (lowerQuery.includes("presupuesto") || lowerQuery.includes("límite")) {
      const overBudget = analysis.categoryAnalysis.filter(
        (c) => c.isOverBudget
      );
      const warning = analysis.categoryAnalysis.filter((c) => c.isWarning);
      const ok = analysis.categoryAnalysis.filter(
        (c) => !c.isOverBudget && !c.isWarning
      );

      let content = "📊 **Estado de Presupuestos**\n\n";

      if (overBudget.length > 0) {
        content += "🚨 **SUPERADOS:**\n";
        overBudget.forEach((c) => {
          const excess = c.total - c.budget;
          content += `• ${c.category}: €${c.total.toFixed(
            0
          )} / €${c.budget.toFixed(0)} (+€${excess.toFixed(0)})\n`;
        });
        content += "\n";
      }

      if (warning.length > 0) {
        content += "⚠️ **CERCA DEL LÍMITE:**\n";
        warning.forEach((c) => {
          content += `• ${c.category}: ${c.usage.toFixed(0)}% usado\n`;
        });
        content += "\n";
      }

      if (ok.length > 0 && overBudget.length === 0) {
        content += "✅ **TODO BAJO CONTROL**\n";
        ok.slice(0, 3).forEach((c) => {
          content += `• ${c.category}: ${c.usage.toFixed(0)}% usado\n`;
        });
        content += "\n";
      }

      content += `⏳ Te quedan **${analysis.daysLeft} días** del mes.`;

      return {
        content,
        action: overBudget.length > 0 ? "warning" : "insight",
        useAPI: false,
      };
    }

    // GASTOS HORMIGA
    if (lowerQuery.includes("hormiga") || lowerQuery.includes("pequeño")) {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);

      const smallExpenses = allExpenses.filter(
        (exp) => exp.amount < 10 && exp.date?.startsWith(currentMonth)
      );

      const smallTotal = smallExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );
      const percentage = (smallTotal / analysis.totalThisMonth) * 100;

      // Top categorías de gastos pequeños
      const smallByCategory = smallExpenses.reduce((acc: any, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {});

      const topSmall = Object.entries(smallByCategory)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3);

      return {
        content:
          `🐜 **Análisis de Gastos Hormiga**\n\n` +
          `• Total: €${smallTotal.toFixed(2)}\n` +
          `• Número de gastos: ${smallExpenses.length}\n` +
          `• Representa: **${percentage.toFixed(1)}%** del total\n` +
          `• Promedio: €${(smallTotal / smallExpenses.length).toFixed(2)}\n\n` +
          (topSmall.length > 0
            ? `📊 **Top categorías:**\n${topSmall
              .map(([cat, amt]: any) => `• ${cat}: €${amt.toFixed(2)}`)
              .join("\n")}\n\n`
            : "") +
          (percentage > 20
            ? `⚠️ **Alerta:** Tus gastos pequeños suman demasiado.`
            : percentage > 10
              ? `⚡ **Nota:** Vigila estos gastos.`
              : `✅ Tus gastos pequeños están controlados.`),
        action: "insight",
        useAPI: false,
      };
    }

    // OPTIMIZACIÓN / AHORRO
    if (
      lowerQuery.includes("ahorrar") ||
      lowerQuery.includes("recortar") ||
      lowerQuery.includes("reducir") ||
      lowerQuery.includes("optimizar")
    ) {
      const suggestions: any[] = [];

      // Buscar categorías con potencial de ahorro
      analysis.categoryAnalysis.forEach((c) => {
        if (c.total > 50 && c.usage < 80) {
          const potentialSavings = c.total * 0.2;
          if (potentialSavings > 15) {
            suggestions.push({
              category: c.category,
              current: c.total,
              savings: potentialSavings,
              newTotal: c.total - potentialSavings,
            });
          }
        }
      });

      // Si hay categorías pasadas
      const overCategories = analysis.categoryAnalysis.filter(
        (c) => c.isOverBudget
      );
      if (overCategories.length > 0) {
        overCategories.forEach((c) => {
          const excess = c.total - c.budget;
          suggestions.push({
            category: c.category,
            current: c.total,
            savings: excess,
            newTotal: c.budget,
            priority: true,
          });
        });
      }

      suggestions.sort(
        (a, b) =>
          (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || b.savings - a.savings
      );

      const totalSavings = suggestions.reduce((sum, s) => sum + s.savings, 0);

      if (suggestions.length > 0) {
        return {
          content:
            `💰 **Plan de Optimización**\n\n` +
            `🎯 Ahorro potencial: **€${totalSavings.toFixed(0)}/mes**\n\n` +
            `📋 **Acciones recomendadas:**\n\n` +
            suggestions
              .slice(0, 3)
              .map(
                (s, i) =>
                  `${i + 1}. **${s.category}**\n` +
                  `   ${s.priority ? "🚨 URGENTE - " : ""
                  }Reduce €${s.savings.toFixed(0)} (de €${s.current.toFixed(
                    0
                  )} a €${s.newTotal.toFixed(0)})\n`
              )
              .join("\n") +
            `\n💡 **Tip:** ${suggestions[0].priority
              ? `Prioriza ${suggestions[0].category} ya que superaste el presupuesto.`
              : `Empieza reduciendo ${suggestions[0].category}, es donde más puedes ahorrar.`
            }`,
          action: "recommendation",
          useAPI: false,
        };
      }

      return {
        content:
          "📊 Tus gastos parecen bien equilibrados. No detecto áreas obvias de optimización.\n\n" +
          `💡 **Consejo general:** Intenta reducir un 10% en tu categoría de mayor gasto (${analysis.categoryAnalysis[0]?.category || "tu categoría principal"
          }).`,
        action: "insight",
        useAPI: false,
      };
    }

    // ANÁLISIS COMPLETO DE TODOS LOS GASTOS
    if (
      lowerQuery.includes("analiza todos") ||
      lowerQuery.includes("análisis completo") ||
      lowerQuery.includes("reporte completo") ||
      lowerQuery.includes("análisis total") ||
      lowerQuery.includes("todos mis gastos") ||
      lowerQuery.includes("resumen total")
    ) {
      const today = new Date();

      // Gastos por mes (últimos 3 meses)
      const last3Months = Array.from({ length: 3 }, (_, i) => {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        return d.toISOString().slice(0, 7);
      }).reverse();

      const monthlyTotals = last3Months.map((month) => {
        const monthExpenses = allExpenses.filter((exp) =>
          exp.date?.startsWith(month)
        );
        const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        return { month, total, count: monthExpenses.length };
      });

      // Tendencia 3 meses
      const trend3M =
        monthlyTotals.length >= 2
          ? monthlyTotals[monthlyTotals.length - 1].total >
            monthlyTotals[monthlyTotals.length - 2].total
            ? "aumentando"
            : "disminuyendo"
          : "estable";

      // Categorías top 3
      const topCategories = analysis.categoryAnalysis.slice(0, 3);

      // Gastos recurrentes detectados
      const recurringExpenses = allExpenses.filter((exp) => exp.isRecurring);
      const recurringTotal = recurringExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      // Gastos únicos grandes
      const largeOneTime = allExpenses
        .filter((exp) => !exp.isRecurring && exp.amount >= 100)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      // Días con más gastos
      const expensesByDay = allExpenses.reduce((acc: any, exp) => {
        const day = new Date(exp.date).getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});
      const mostActiveDay = Object.entries(expensesByDay).reduce(
        (max: any, [day, count]: any) =>
          count > (max.count || 0)
            ? { day: DAY_NAMES[parseInt(day)], count }
            : max,
        {}
      );

      // Velocidad de gasto
      const daysWithExpenses = new Set(allExpenses.map((exp) => exp.date)).size;
      const avgExpensesPerDay =
        allExpenses.length / Math.max(daysWithExpenses, 1);

      // Rango de precios
      const amounts = allExpenses
        .map((exp) => exp.amount)
        .sort((a, b) => a - b);
      const q1 = amounts[Math.floor(amounts.length * 0.25)] || 0;
      const q3 = amounts[Math.floor(amounts.length * 0.75)] || 0;

      // Ratio ahorro
      const savingsRate =
        analysis.income > 0
          ? ((analysis.income - analysis.totalThisMonth) / analysis.income) *
          100
          : 0;

      let content = `📊 **ANÁLISIS COMPLETO DE TODOS TUS GASTOS**\n\n`;

      // Sección 1: Vista General
      content += `═══ 📈 VISTA GENERAL ═══\n\n`;
      content += `• **Total gastado este mes:** €${analysis.totalThisMonth.toFixed(
        2
      )}\n`;
      content += `• **Total de transacciones:** ${allExpenses.length}\n`;
      content += `• **Promedio por gasto:** €${(allExpenses.length > 0
        ? analysis.totalThisMonth / allExpenses.length
        : 0
      ).toFixed(2)}\n`;
      content += `• **Días activos:** ${daysWithExpenses} (${avgExpensesPerDay.toFixed(
        1
      )} gastos/día)\n`;
      if (analysis.income > 0) {
        content += `• **Tasa de ahorro:** ${savingsRate.toFixed(1)}%\n`;
      }
      content += `\n`;

      // Sección 2: Tendencia
      content += `═══ 📉 TENDENCIA (últimos 3 meses) ═══\n\n`;
      monthlyTotals.forEach((m, i) => {
        const monthName = new Date(m.month + "-01").toLocaleDateString(
          "es-ES",
          { month: "short", year: "2-digit" }
        );
        const emoji =
          i === monthlyTotals.length - 1 ? "→" : i === 0 ? "←" : "•";
        content += `${emoji} **${monthName}:** €${m.total.toFixed(2)} (${m.count
          } gastos)\n`;
      });
      content += `\n**Tendencia:** Tus gastos están **${trend3M}** 📊\n\n`;

      // Sección 3: Categorías
      content += `═══ 🏷️ TOP CATEGORÍAS ═══\n\n`;
      topCategories.forEach((cat, i) => {
        const total = Number(cat.total ?? 0);
        const percentage = Number(cat.percentage ?? 0);
        const average = Number(cat.average ?? 0);

        content += `${i + 1}. **${cat.category || "Sin categoría"}**\n`;
        content += `   💰 €${total.toFixed(2)} (${percentage.toFixed(1)}%)\n`;
        content += `   📦 ${cat.count ?? 0} gastos • Promedio: €${average.toFixed(
          2
        )}\n`;
        if (cat.isOverBudget) {
          content += `   ⚠️ SUPERADO - Reduce urgentemente\n`;
        } else if (cat.isWarning) {
          content += `   ⚡ CERCA DEL LÍMITE - Ten cuidado\n`;
        }
        content += `\n`;
      });

      // Sección 4: Patrones
      content += `═══ 🔍 PATRONES DETECTADOS ═══\n\n`;

      if (analysis.maxSpendDay) {
        content += `• **Día de mayor gasto:** ${analysis.maxSpendDay.name}\n`;
        content += `  Gastas ${(
          (analysis.maxSpendDay.amount / analysis.avgDailySpend) * 100 -
          100
        ).toFixed(0)}% más que otros días\n\n`;
      }

      if (mostActiveDay.day) {
        content += `• **Día más activo:** ${mostActiveDay.day}\n`;
        content += `  ${mostActiveDay.count} transacciones registradas\n\n`;
      }

      if (analysis.trendDirection !== "stable") {
        content += `• **Tendencia semanal:** ${analysis.trendDirection === "up"
          ? "⬆️ Gastos aumentando"
          : "⬇️ Gastos disminuyendo"
          }\n`;
        content += `  Promedio semanal: €${analysis.weeklyAverage.toFixed(
          2
        )}/día\n\n`;
      }

      // Gastos hormiga
      if (analysis.smallExpenses > 0) {
        const smallPercent =
          (analysis.smallExpenses / analysis.totalThisMonth) * 100;
        content += `• **Gastos hormiga (<€10):** €${analysis.smallExpenses.toFixed(
          2
        )}\n`;
        content += `  Representan el ${smallPercent.toFixed(1)}% del total\n`;
        if (smallPercent > 15) {
          content += `  ⚠️ ALERTA: Tus pequeños gastos suman demasiado\n`;
        }
        content += `\n`;
      }

      // Rango de precios
      content += `• **Rango de precios:**\n`;
      content += `  25% gastos: <€${q1.toFixed(2)}\n`;
      content += `  50% gastos: €${q1.toFixed(2)} - €${q3.toFixed(2)}\n`;
      content += `  25% gastos: >€${q3.toFixed(2)}\n\n`;

      // Sección 5: Gastos Recurrentes
      if (recurringExpenses.length > 0) {
        content += `═══ 🔄 GASTOS RECURRENTES ═══\n\n`;
        content += `• **Total:** €${recurringTotal.toFixed(2)}/mes\n`;
        content += `• **Número:** ${recurringExpenses.length} suscripciones\n`;
        content += `• **Impacto:** ${(
          (recurringTotal / analysis.totalThisMonth) *
          100
        ).toFixed(1)}% del gasto mensual\n\n`;

        const topRecurring = [...recurringExpenses]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3);

        topRecurring.forEach((exp, i) => {
          content += `${i + 1}. ${exp.name}: €${exp.amount.toFixed(2)}/mes\n`;
        });
        content += `\n`;
      }

      // Sección 6: Gastos Únicos Grandes
      if (largeOneTime.length > 0) {
        content += `═══ 💰 GASTOS ÚNICOS GRANDES ═══\n\n`;
        largeOneTime.forEach((exp, i) => {
          const date = new Date(exp.date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
          });
          content += `${i + 1}. **${exp.name}** - €${exp.amount.toFixed(2)}\n`;
          content += `   ${exp.category} • ${date}\n\n`;
        });
      }

      // Sección 7: Proyección
      content += `═══ 🔮 PROYECCIÓN ═══\n\n`;
      if (analysis.projectedMonthTotal > 0) {
        content += `• **Gasto proyectado fin de mes:** €${analysis.projectedMonthTotal.toFixed(
          2
        )}\n`;
        const diff = analysis.projectedMonthTotal - analysis.totalThisMonth;
        content += `• **Te quedan por gastar:** €${diff.toFixed(2)} en ${analysis.daysLeft
          } días\n`;
        const dailyBudget =
          analysis.income > 0
            ? (analysis.income - analysis.totalThisMonth) / analysis.daysLeft
            : diff / analysis.daysLeft;
        content += `• **Presupuesto diario sugerido:** €${dailyBudget.toFixed(
          2
        )}/día\n\n`;
      }

      // Sección 8: Recomendaciones
      content += `═══ 💡 RECOMENDACIONES ═══\n\n`;

      const recommendations: string[] = [];

      // Basadas en categorías sobre presupuesto
      const overCategories = analysis.categoryAnalysis.filter(
        (c) => c.isOverBudget
      );
      if (overCategories.length > 0) {
        recommendations.push(
          `**URGENTE:** Reduce ${overCategories[0].category} en €${(
            overCategories[0].total - overCategories[0].budget
          ).toFixed(2)}`
        );
      }

      // Basadas en gastos hormiga
      if (analysis.smallExpenses > analysis.totalThisMonth * 0.15) {
        recommendations.push(
          `**Controla gastos pequeños:** Tus gastos hormiga son altos. Intenta reducirlos un 30%.`
        );
      }

      // Basadas en día de mayor gasto
      if (
        analysis.maxSpendDay &&
        analysis.maxSpendDay.amount > analysis.avgDailySpend * 1.5
      ) {
        recommendations.push(
          `**Planifica ${analysis.maxSpendDay.name}s:** Es tu día de mayor gasto. Establece un límite diario.`
        );
      }

      // Basadas en tendencia
      if (analysis.trendDirection === "up") {
        recommendations.push(
          `**Frena el aumento:** Tus gastos suben semana a semana. Establece alertas diarias.`
        );
      }

      // Basadas en tasa de ahorro
      if (savingsRate < 20 && analysis.income > 0) {
        recommendations.push(
          `**Aumenta ahorro:** Solo ahorras ${savingsRate.toFixed(
            0
          )}%. Intenta llegar al 20%.`
        );
      }

      // Recurrentes
      if (recurringTotal > analysis.income * 0.3) {
        recommendations.push(
          `**Revisa suscripciones:** Gastas ${(
            (recurringTotal / analysis.income) *
            100
          ).toFixed(0)}% en recurrentes. ¿Todas son necesarias?`
        );
      }

      // Si no hay recomendaciones urgentes, dar consejos generales
      if (recommendations.length === 0) {
        recommendations.push(
          `**¡Vas bien!** Tus finanzas están equilibradas. Sigue así.`,
          `**Optimiza más:** Intenta reducir tu categoría top en un 10%.`,
          `**Aumenta ahorro:** Desafíate a ahorrar €50 extra este mes.`
        );
      }

      recommendations.forEach((rec, i) => {
        content += `${i + 1}. ${rec}\n\n`;
      });

      // Footer
      content += `───────────────────────\n`;
      content += `📊 Análisis basado en ${allExpenses.length} gastos\n`;
      content += `🎯 Sigue mejorando tu salud financiera`;

      return {
        content,
        action: "insight",
        useAPI: false,
      };
    }

    // COMPARACIÓN TEMPORAL
    if (
      lowerQuery.includes("compar") ||
      lowerQuery.includes("anterior") ||
      lowerQuery.includes("vs") ||
      lowerQuery.includes("versus")
    ) {
      return {
        content:
          `📊 **Comparación Temporal**\n\n` +
          `Esta función está en desarrollo. Pronto podrás comparar:\n\n` +
          `• Este mes vs mes anterior\n` +
          `• Esta semana vs semana anterior\n` +
          `• Este año vs año anterior\n` +
          `• Tendencias por categoría\n\n` +
          `💡 Mientras tanto, mira tu "Tendencia" en el dashboard.`,
        action: "insight",
        useAPI: false,
      };
    }

    // DEFAULT: Dar insights contextuales
    const contextualInsights = generateSmartInsights(analysis);

    if (contextualInsights.length > 0) {
      return {
        content:
          `📊 **Resumen de tu Situación Financiera**\n\n` +
          contextualInsights
            .map((insight, i) => `${i + 1}. ${insight}`)
            .join("\n\n") +
          `\n\n💡 Haz preguntas más específicas para análisis detallados.`,
        action: "insight",
        useAPI: false,
      };
    }

    return {
      content:
        "No entiendo del todo tu pregunta. Intenta preguntar:\n\n" +
        "• ¿Cuándo alcanzaré mi objetivo?\n" +
        "• Proyecta mi gasto del mes\n" +
        "• ¿Qué días gasto más?\n" +
        "• ¿Cómo puedo ahorrar?\n" +
        "• Analiza mis gastos hormiga",
      action: undefined,
      useAPI: false,
    };
  };
};

const QuotasBadge: React.FC<{
  quotas: AIQuotas | null;
  darkMode: boolean;
}> = ({ quotas, darkMode }) => {
  if (!quotas) return null;

  const isLow = quotas.remaining <= 1 && !quotas.unlimited;
  const isEmpty = quotas.remaining === 0 && !quotas.unlimited;

  return (
    <div
      className={`flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-md md:rounded-lg border transition-all ${isEmpty
        ? darkMode
          ? "bg-red-600/20 border-red-500/30"
          : "bg-red-100 border-red-300"
        : isLow
          ? darkMode
            ? "bg-yellow-600/20 border-yellow-500/30"
            : "bg-yellow-100 border-yellow-300"
          : darkMode
            ? "bg-green-600/20 border-green-500/30"
            : "bg-green-100 border-green-300"
        }`}
      title={
        quotas.unlimited
          ? "Consultas ilimitadas"
          : `${quotas.remaining}/${quotas.total} consultas restantes`
      }
    >
      {quotas.unlimited ? (
        <>
          <Infinity className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-500 flex-shrink-0" />
          <span
            className={`text-[10px] md:text-xs font-semibold whitespace-nowrap ${darkMode ? "text-purple-300" : "text-purple-700"
              }`}
          >
            {quotas.plan === "free" ? "Admin" : "Premium"}
          </span>
        </>
      ) : (
        <>
          <Zap
            className={`w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0 ${isEmpty
              ? "text-red-500"
              : isLow
                ? "text-yellow-500"
                : "text-green-500"
              }`}
          />
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span
              className={`text-[10px] md:text-xs font-bold ${isEmpty
                ? "text-red-500"
                : isLow
                  ? "text-yellow-500"
                  : "text-green-500"
                }`}
            >
              {quotas.remaining}
            </span>
            <span
              className={`text-[9px] md:text-[10px] ${darkMode ? "text-gray-400" : "text-gray-600"
                }`}
            >
              /{quotas.total}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const AIAssistant: React.FC<AIAssistantProps> = memo(
  ({
    darkMode,
    textClass,
    textSecondaryClass,
    categories,
    addExpense,
    isActive: _isActive,
    allExpenses = [],
    income = 0,
    budgets = {},
    goals = null,
    categoryTotals = [],
    isLoading: isDataLoading = false,
  }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [quotas, setQuotas] = useState<AIQuotas | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<FixedSizeList>(null);
    const keyboardHeight = useKeyboardHeight();

    // Análisis con caché (solo recalcula si cambian los datos)
    const analysis = useMemo(
      () =>
        analyzeUserData(allExpenses, income, budgets, goals, categoryTotals),
      [allExpenses, income, budgets, goals, categoryTotals]
    );

    // Insights y prompts (también con caché)
    const insights = useMemo(() => generateSmartInsights(analysis), [analysis]);

    const smartPrompts = useMemo(() => getSmartPrompts(analysis), [analysis]);

    // Procesador de queries
    const processQuery = useMemo(
      () => createQueryProcessor(analysis, allExpenses, isDataLoading),
      [analysis, allExpenses, isDataLoading]
    );

    // Category matcher
    const findBestCategory = useMemo(
      () => createCategoryMatcher(categories),
      [categories]
    );

    // Handlers optimizados
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
      },
      []
    );

    const handleVoiceTranscript = useCallback((text: string) => {
      setInput(text);
    }, []);

    const handleVoiceEnd = useCallback(() => {
      setTimeout(() => {
        const currentInput = inputRef.current?.value || "";
        const detected = detectExpenseFromText(currentInput);
        if (detected && currentInput.trim()) {
          sendMessage();
        }
      }, 300);
    }, []);

    const { isListening, toggle: toggleListening } = useVoiceRecognition(
      handleVoiceTranscript,
      handleVoiceEnd
    );

    // Scroll optimizado - usa la lista virtualizada
    const scrollToBottom = useCallback(() => {
      requestAnimationFrame(() => {
        if (listRef.current && messages.length > 0) {
          listRef.current.scrollToItem(messages.length - 1, "end");
        } else {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      });
    }, [messages.length]);

    useEffect(() => {
      if (messages.length > 0) {
        scrollToBottom();
      }
    }, [messages.length, scrollToBottom]);

    // Autofocus removido - Los prompts inteligentes hacen que no sea necesario
    // useEffect(() => {
    //   if (!isActive) return;
    //   const timer = setTimeout(() => {
    //     inputRef.current?.focus();
    //   }, 300);
    //   return () => clearTimeout(timer);
    // }, [isActive]);

    const handleCopyMessage = useCallback(
      async (index: number, content: string) => {
        try {
          if (isNative) {
            await Share.share({
              title: 'Clarity AI Insight',
              text: content,
              dialogTitle: 'Compartir análisis',
            });
          } else {
            await navigator.clipboard.writeText(content);
            await vibrate(ImpactStyle.Light);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
          }
        } catch (error) {
          console.error("Error compartiendo/copiando:", error);
        }
      },
      []
    );

    const handleClearChat = useCallback(async () => {
      if (window.confirm("¿Borrar toda la conversación?")) {
        await vibrate(ImpactStyle.Medium);
        startTransition(() => {
          setMessages([]);
        });
      }
    }, []);

    // Send message (optimizado)
    const sendMessage = useCallback(async () => {
      if (!input.trim() || isLoading) return;

      await vibrate(ImpactStyle.Light);

      const userMessage = input.trim();
      const timestamp = Date.now();
      const messageId = `msg-${timestamp}`;

      // Detectar gasto directo
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

            const userMsg: Message = {
              role: "user",
              content: userMessage,
              timestamp,
              id: messageId,
            };

            const newTotal = analysis.totalThisMonth + directExpense.amount;
            const newDailyAvg = newTotal / new Date().getDate();

            const aiMsg: Message = {
              role: "assistant",
              content:
                `✅ **Gasto añadido exitosamente**\n\n` +
                `• Monto: €${directExpense.amount.toFixed(2)}\n` +
                `• Categoría: ${matchedCategory}\n` +
                `• Fecha: ${directExpense.date}\n\n` +
                `📊 **Actualizado:**\n` +
                `• Total del mes: €${newTotal.toFixed(2)}\n` +
                `• Promedio diario: €${newDailyAvg.toFixed(2)}` +
                (analysis.income > 0
                  ? `\n• Disponible: €${(analysis.income - newTotal).toFixed(
                    2
                  )}`
                  : ""),
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

      // Pregunta / Query
      setInput("");
      const userMsg: Message = {
        role: "user",
        content: userMessage,
        timestamp,
        id: messageId,
      };

      startTransition(() => {
        setMessages((prev) => [...prev, userMsg]);
      });

      setIsLoading(true);

      try {
        const localResponse = processQuery(userMessage);

        let finalContent = localResponse.content;
        let finalAction = localResponse.action;

        // Si debe usar API, llamar
        if (localResponse.useAPI) {
          try {
            console.log("🤖 Llamando a la API de IA...");
            const apiResponse = await callAIAssistant(
              userMessage,
              analysis,
              allExpenses,
              income,
              budgets
            );

            finalContent = apiResponse.content;
            finalAction = "insight";

            if (apiResponse.quotas) {
              setQuotas(apiResponse.quotas);
            }

            console.log("✅ Respuesta de IA recibida");
          } catch (apiError: any) {
            console.error("❌ Error de API:", apiError);

            if (apiError.message?.includes("agotado")) {
              finalContent = `⚠️ **Cuotas IA agotadas**\n\n${apiError.message}`;
              finalAction = "warning";
            } else {
              finalContent =
                `⚠️ **IA temporalmente no disponible**\n\n` +
                `${generateSmartInsights(analysis)
                  .slice(0, 3)
                  .map((insight, i) => `${i + 1}. ${insight}`)
                  .join("\n\n")}\n\n` +
                `*Esta respuesta no consumió tu cuota.*`;
              finalAction = "insight";
            }
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        const aiMessage: Message = {
          role: "assistant",
          content: finalContent,
          action: finalAction as any,
          timestamp: Date.now(),
          id: `msg-${Date.now()}`,
        };

        startTransition(() => {
          setMessages((prev) => [...prev, aiMessage]);
        });
      } catch (error) {
        console.error("Error procesando query:", error);
        const errorMessage: Message = {
          role: "assistant",
          content: "❌ Error al procesar tu pregunta. Intenta de nuevo.",
          timestamp: Date.now(),
          id: `msg-${Date.now()}`,
        };
        startTransition(() => {
          setMessages((prev) => [...prev, errorMessage]);
        });
      } finally {
        setIsLoading(false);
      }
    }, [
      input,
      isLoading,
      addExpense,
      categories,
      findBestCategory,
      processQuery,
      analysis,
      allExpenses,
      income,
      budgets,
      quotas,
    ]);

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
      setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    // Altura dinámica - ultra optimizada para móvil con padding extra
    const listHeight = useMemo(() => {
      if (typeof window === "undefined") return 400;
      const base = window.innerHeight;
      // En móvil: reservar más espacio (header + input + padding extra para navegación)
      const isMobile = window.innerWidth < 768;
      // Añadir padding extra: 20px arriba (navegación) + 20px abajo (input)
      const reserved = isMobile ? 180 + keyboardHeight : 260 + keyboardHeight;
      return Math.max(isMobile ? 300 : 320, base - reserved);
    }, [keyboardHeight]);

    // Ancho del contenedor para react-window - se recalcula en resize
    const containerRef = useRef<HTMLDivElement>(null);
    const [listWidth, setListWidth] = useState(() => {
      if (typeof window === "undefined") return 600;
      // En móvil: ancho completo menos padding (px-2 = 8px cada lado = 16px total)
      return window.innerWidth < 768 ? window.innerWidth - 16 : 600;
    });

    // Actualizar ancho cuando cambia el tamaño de la ventana o el contenedor
    useEffect(() => {
      const updateWidth = () => {
        if (typeof window === "undefined" || !containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth;
        // Usar el ancho del contenedor real
        setListWidth(containerWidth || (window.innerWidth < 768 ? window.innerWidth - 16 : 600));
      };

      // Usar ResizeObserver para detectar cambios en el contenedor
      const resizeObserver = new ResizeObserver(updateWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener("resize", updateWidth);
      updateWidth(); // Llamar inmediatamente

      return () => {
        window.removeEventListener("resize", updateWidth);
        resizeObserver.disconnect();
      };
    }, []);


    return (
      <div
        className="flex flex-col w-full"
        style={{
          minHeight: 320,
          maxHeight: "80vh",
          height: "100%",
          paddingTop: "10px",
          paddingBottom: "10px",
        }}
      >
        {/* Header - ultra compacto en móvil */}
        <div className="flex items-center justify-between mb-1.5 md:mb-3 px-0.5 md:px-2">
          <div className="flex items-center gap-1 md:gap-3 flex-1 min-w-0">
            <div
              className={`p-1 md:p-2 rounded-lg flex-shrink-0 ${darkMode ? "bg-purple-500/20" : "bg-purple-100"
                }`}
            >
              <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-purple-500 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`text-xs md:text-base font-bold truncate ${textClass}`}>
                Asistente IA 🧠
              </h3>
              <p className={`text-[9px] md:text-xs truncate ${textSecondaryClass}`}>
                Powered by DeepSeek
              </p>
            </div>

            {/* Badge de cuotas - más compacto en móvil */}
            {quotas && (
              <div className="flex-shrink-0">
                <QuotasBadge quotas={quotas} darkMode={darkMode} />
              </div>
            )}

            {messages.length > 0 && (
              <span
                className={`text-[9px] md:text-xs ${textSecondaryClass} px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                {messages.length}
              </span>
            )}
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className={`p-1 md:p-2 rounded-lg transition-all min-h-[32px] min-w-[32px] md:min-h-[44px] md:min-w-[44px] flex items-center justify-center active:scale-95 flex-shrink-0 ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              title="Limpiar chat"
              aria-label="Limpiar conversación"
            >
              <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
            </button>
          )}
        </div>

        {/* Alerta de cuotas agotadas - compacta en móvil */}
        {quotas && !quotas.unlimited && quotas.remaining === 0 && (
          <div
            className={`mb-2 md:mb-3 p-2.5 md:p-4 rounded-lg md:rounded-xl border ${darkMode
              ? "bg-red-900/20 border-red-500/30"
              : "bg-red-50 border-red-200"
              }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
              <p className="text-xs md:text-sm font-bold text-red-500">
                Cuotas IA agotadas
              </p>
            </div>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
              Has usado tus {quotas.total} consultas mensuales.
            </p>
            {(!quotas.plan || quotas.plan === "free") && (
              <p className="text-[10px] md:text-xs text-purple-600 dark:text-purple-400 mt-1.5 md:mt-2 font-semibold">
                💡 Actualiza a Pro para 50 consultas/mes
              </p>
            )}
          </div>
        )}

        {/* Contenedor de mensajes - ultra optimizado para móvil con padding extra */}
        <div
          ref={containerRef}
          className={`flex-1 rounded-lg md:rounded-xl border mb-2 md:mb-4 transition-all ${darkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-200 shadow-sm"
            } overflow-hidden flex flex-col`}
          style={{
            height: listHeight,
            maxHeight: listHeight,
            minHeight: "280px",
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          {messages.length === 0 ? (
            <div
              className="flex-1 overflow-y-auto px-2 md:px-4 py-2 md:py-4"
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                paddingTop: "10px",
                paddingBottom: "10px",
              }}
            >
              <WelcomeScreen
                textClass={textClass}
                textSecondaryClass={textSecondaryClass}
                darkMode={darkMode}
                onExampleClick={handleExampleClick}
                smartPrompts={smartPrompts}
                insights={insights}
              />
            </div>
          ) : (
            <div className="flex-1 px-2 md:px-4 py-2 md:py-4">
              <List
                ref={listRef}
                height={listHeight - 20}
                itemCount={messages.length + (isLoading ? 1 : 0)}
                itemSize={ITEM_HEIGHT}
                width={listWidth - 16}
                overscanCount={3}
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                {({ index, style }) => {
                  // Si es el último mensaje y está cargando, mostrar indicador
                  if (isLoading && index === messages.length) {
                    return (
                      <div style={style}>
                        <div className="flex justify-start group mb-3">
                          <div
                            className={`max-w-[85%] md:max-w-[80%] rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 relative transition-all ${darkMode
                              ? "bg-gray-700 text-gray-100"
                              : "bg-gray-100 text-gray-900"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[0, 150, 300].map((delay, i) => (
                                  <div
                                    key={i}
                                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                    style={{ animationDelay: `${delay}ms` }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                                Analizando {allExpenses?.length || 0} movimientos...
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Mensaje normal
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
                }}
              </List>
            </div>
          )}
        </div>

        {/* Input Area - ultra compacto en móvil */}
        <div className="pb-0.5 md:pb-2">
          <div className="flex gap-1 md:gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Pregúntame sobre tus gastos..."
              disabled={isLoading || isPending}
              className={`flex-1 px-2.5 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs md:text-base min-h-[44px] ${darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            />

            <button
              onClick={toggleListening}
              disabled={isLoading || isPending}
              className={`px-2.5 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 flex-shrink-0 ${isListening
                ? "bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse"
                : darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={
                isListening ? "Detener grabación" : "Iniciar grabación de voz"
              }
            >
              {isListening ? (
                <MicOff className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isPending}
              className="px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg md:rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] flex items-center justify-center active:scale-95 shadow-lg shadow-purple-500/20 flex-shrink-0"
              aria-label="Enviar mensaje"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.darkMode === next.darkMode &&
      prev.isActive === next.isActive &&
      prev.categories === next.categories &&
      prev.allExpenses === next.allExpenses &&
      prev.income === next.income
    );
  }
);

AIAssistant.displayName = "AIAssistant";

export default AIAssistant;
