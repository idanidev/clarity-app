import {
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Settings,
  TrendingUp,
  X,
  Zap
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

// ============================================
// TYPES & INTERFACES
// ============================================
interface Category {
  subcategories?: string[];
  [key: string]: any;
}

interface Categories {
  [categoryName: string]: Category;
}

interface Expense {
  id?: string;
  name: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string;
  paymentMethod: string;
  isRecurring?: boolean;
  recurringId?: string | null;
  createdAt?: any;
  updatedAt?: any;
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

interface DetectedExpense {
  amount: number;
  description: string;
  date: string;
}

interface Categorization {
  category: string;
  subcategory: string;
  confidence: number;
  reason: string;
}

interface PreviewExpense extends DetectedExpense {
  category: string;
  subcategory: string;
  confidence: number;
}

interface LearnedPattern {
  [keyword: string]: {
    [category: string]: {
      count: number;
      subcategories: {
        [subcategory: string]: number;
      };
    };
  };
}

interface VoiceSettings {
  silenceTimeout: number;
  autoConfirm: boolean;
  vibration: boolean;
  showSuggestions: boolean;
}

interface VoiceStats {
  totalVoiceExpenses: number;
  accuracy: number;
  lastUsed: string;
  avgConfidence: number;
}

interface VoiceExpenseButtonProps {
  darkMode: boolean;
  categories: Categories;
  addExpense: (expense: ExpenseData) => Promise<void>;
  showNotification?: (
    message: string,
    type: "success" | "error" | "info"
  ) => void;
  hasFilterButton?: boolean;
  expenses?: Expense[];
}

// ============================================
// CONSTANTS
// ============================================
const DEFAULT_SETTINGS: VoiceSettings = {
  silenceTimeout: 2000,
  autoConfirm: false, // 🎯 Mejora 1: Requiere confirmación
  vibration: true, // 📳 Mejora 3: Vibración habilitada
  showSuggestions: true, // 🎯 Mejora 5: Sugerencias activas
};

const NUMBER_WORDS: { [key: string]: number } = {
  cero: 0,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  veinte: 20,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
};

const SYNONYMS: { [key: string]: string[] } = {
  alimentación: [
    "comida",
    "alimentos",
    "super",
    "supermercado",
    "mercado",
    "mercadona",
    "lidl",
    "carrefour",
    "dia",
  ],
  transporte: ["gasolina", "diesel", "metro", "bus", "taxi", "uber", "tren"],
  restaurante: ["restaurante", "comer", "cenar", "bar", "café"],
  ocio: ["ocio", "cine", "teatro", "concierto", "spotify", "netflix"],
  salud: ["salud", "médico", "farmacia", "hospital", "dentista"],
  ropa: ["ropa", "moda", "zapatos", "zara", "h&m"],
  casa: ["casa", "hogar", "alquiler", "luz", "agua", "gas", "internet"],
  tabaco: ["tabaco", "cigarrillos", "vaper"],
  vicios: ["tabaco", "cigarrillos", "vaper"],
};

const VOICE_EXAMPLES = [
  '💡 "25 en supermercado"',
  '💡 "nueve coma sesenta en tabaco"',
  '💡 "50 en gasolina y 20 en comida"',
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

// 📳 Mejora 3: Vibración háptica
const vibrate = (pattern: number | number[]) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const convertTextToNumber = (textNumber: string): number => {
  const comaPattern = /(\w+)\s+(?:coma|con)\s+(\w+)/i;
  const comaMatch = textNumber.match(comaPattern);

  if (comaMatch) {
    const parteEntera =
      NUMBER_WORDS[comaMatch[1].toLowerCase()] ?? parseInt(comaMatch[1]);
    const parteDecimal =
      NUMBER_WORDS[comaMatch[2].toLowerCase()] ?? parseInt(comaMatch[2]);

    if (!isNaN(parteEntera) && !isNaN(parteDecimal)) {
      const decimalStr =
        parteDecimal < 10 ? `0${parteDecimal}` : `${parteDecimal}`;
      return parseFloat(`${parteEntera}.${decimalStr}`);
    }
  }

  const singleWord = NUMBER_WORDS[textNumber.toLowerCase()];
  if (singleWord !== undefined) return singleWord;

  return parseFloat(textNumber.replace(",", "."));
};

const extractDate = (text: string): string => {
  const today = new Date();
  const datePatterns: Array<{
    pattern: RegExp;
    offset: (d: Date, match?: RegExpMatchArray) => Date;
  }> = [
    {
      pattern: /ayer/i,
      offset: (d) => {
        d.setDate(d.getDate() - 1);
        return d;
      },
    },
    {
      pattern: /anteayer/i,
      offset: (d) => {
        d.setDate(d.getDate() - 2);
        return d;
      },
    },
    {
      pattern: /hace\s+(\d+)\s+días?/i,
      offset: (d, match) => {
        if (match) d.setDate(d.getDate() - parseInt(match[1]));
        return d;
      },
    },
  ];

  for (const { pattern, offset } of datePatterns) {
    const match = text.match(pattern);
    if (match) return offset(new Date(today), match).toISOString().slice(0, 10);
  }

  return today.toISOString().slice(0, 10);
};

// 💾 Mejora 4: Persistencia
const STORAGE_KEYS = {
  DRAFT: "clarity_voice_draft",
  SETTINGS: "clarity_voice_settings",
  STATS: "clarity_voice_stats",
  OFFLINE_QUEUE: "clarity_offline_expenses",
};

const saveToDraft = (transcript: string) => {
  if (transcript.trim()) {
    localStorage.setItem(STORAGE_KEYS.DRAFT, transcript);
  }
};

const loadFromDraft = (): string => {
  return localStorage.getItem(STORAGE_KEYS.DRAFT) || "";
};

const clearDraft = () => {
  localStorage.removeItem(STORAGE_KEYS.DRAFT);
};

// ⚙️ Mejora 7: Configuración
const loadSettings = (): VoiceSettings => {
  const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

const saveSettings = (settings: VoiceSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// 📊 Mejora 6: Stats
const loadStats = (): VoiceStats => {
  const saved = localStorage.getItem(STORAGE_KEYS.STATS);
  return saved
    ? JSON.parse(saved)
    : {
        totalVoiceExpenses: 0,
        accuracy: 0,
        lastUsed: "",
        avgConfidence: 0,
      };
};

const saveStats = (stats: VoiceStats) => {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
};

// 🔌 Mejora 8: Offline Queue
const loadOfflineQueue = (): ExpenseData[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
  return saved ? JSON.parse(saved) : [];
};

const saveOfflineQueue = (queue: ExpenseData[]) => {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
};

// ============================================
// MAIN COMPONENT
// ============================================
const VoiceExpenseButton = memo<VoiceExpenseButtonProps>(
  ({
    darkMode,
    categories,
    addExpense,
    showNotification,
    hasFilterButton = true,
    expenses = [],
  }) => {
    // State
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

    // 🎯 Mejora 1: Confirmación
    const [pendingExpenses, setPendingExpenses] = useState<PreviewExpense[]>(
      []
    );
    const [showConfirmation, setShowConfirmation] = useState(false);

    // ⚙️ Mejora 7: Settings
    const [settings, setSettings] = useState<VoiceSettings>(loadSettings());
    const [showSettings, setShowSettings] = useState(false);

    // 📊 Mejora 6: Stats
    const [stats, setStats] = useState<VoiceStats>(loadStats());
    const [showStats, setShowStats] = useState(false);

    // 🔌 Mejora 8: Offline
    const [offlineQueue, setOfflineQueue] = useState<ExpenseData[]>(
      loadOfflineQueue()
    );
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // 🎯 Mejora 5: Sugerencias
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Refs
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ============================================
    // 🔌 Mejora 8: Detectar conexión
    // ============================================
    useEffect(() => {
      const handleOnline = () => {
        setIsOnline(true);
        if (offlineQueue.length > 0) {
          showNotification?.(
            `🔄 Sincronizando ${offlineQueue.length} gastos...`,
            "info"
          );
          syncOfflineExpenses();
        }
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }, [offlineQueue.length]);

    // ============================================
    // 🔌 Mejora 8: Sincronizar offline
    // ============================================
    const syncOfflineExpenses = useCallback(async () => {
      if (!isOnline || offlineQueue.length === 0) return;

      let synced = 0;
      const remaining: ExpenseData[] = [];

      for (const expense of offlineQueue) {
        try {
          await addExpense(expense);
          synced++;
          vibrate(50); // Feedback por cada sincronización
        } catch (error) {
          remaining.push(expense);
        }
      }

      setOfflineQueue(remaining);
      saveOfflineQueue(remaining);

      if (synced > 0) {
        showNotification?.(`✅ ${synced} gastos sincronizados`, "success");
      }
    }, [isOnline, offlineQueue, addExpense, showNotification]);

    // ============================================
    // ROTAR EJEMPLOS
    // ============================================
    useEffect(() => {
      if (!isListening) return;
      const interval = setInterval(() => {
        setCurrentExampleIndex((prev) => (prev + 1) % VOICE_EXAMPLES.length);
      }, 3000);
      return () => clearInterval(interval);
    }, [isListening]);

    // ============================================
    // 💾 Mejora 4: Persistencia de draft
    // ============================================
    useEffect(() => {
      if (transcript) {
        saveToDraft(transcript);
      }
    }, [transcript]);

    // Cargar draft al montar
    useEffect(() => {
      const draft = loadFromDraft();
      if (draft) {
        setTranscript(draft);
      }
    }, []);

    // ============================================
    // APRENDIZAJE DE PATRONES
    // ============================================
    const learnedPatterns = useMemo<LearnedPattern>(() => {
      if (!expenses || expenses.length === 0) return {};

      const patterns: LearnedPattern = {};
      const recentExpenses = expenses.slice(-100);

      recentExpenses.forEach((expense) => {
        const description = (expense.name || "").toLowerCase();
        const category = expense.category;
        const subcategory = expense.subcategory || "";

        if (!description || !category) return;

        const keywords = description
          .split(/\s+/)
          .filter((word) => word.length > 2)
          .filter((word) => !/^(en|de|del|por|para|con|sin)$/i.test(word));

        keywords.forEach((keyword) => {
          if (!patterns[keyword]) patterns[keyword] = {};
          if (!patterns[keyword][category]) {
            patterns[keyword][category] = { count: 0, subcategories: {} };
          }
          patterns[keyword][category].count++;

          if (subcategory) {
            if (!patterns[keyword][category].subcategories[subcategory]) {
              patterns[keyword][category].subcategories[subcategory] = 0;
            }
            patterns[keyword][category].subcategories[subcategory]++;
          }
        });
      });

      return patterns;
    }, [expenses]);

    // ============================================
    // 🎯 Mejora 5: Generar sugerencias
    // ============================================
    const generateSuggestions = useCallback(
      (partialText: string): string[] => {
        if (!settings.showSuggestions || !partialText || partialText.length < 2)
          return [];

        const suggestions: Set<string> = new Set();
        const text = partialText.toLowerCase();

        // Sugerencias de categorías
        Object.keys(categories).forEach((cat) => {
          if (cat.toLowerCase().startsWith(text)) {
            suggestions.add(cat);
          }
        });

        // Sugerencias de subcategorías
        Object.values(categories).forEach((catData) => {
          catData.subcategories?.forEach((sub) => {
            if (sub.toLowerCase().startsWith(text)) {
              suggestions.add(sub);
            }
          });
        });

        // Sugerencias de patrones aprendidos
        Object.keys(learnedPatterns).forEach((keyword) => {
          if (keyword.startsWith(text)) {
            suggestions.add(keyword);
          }
        });

        return Array.from(suggestions).slice(0, 3);
      },
      [categories, learnedPatterns, settings.showSuggestions]
    );

    // ============================================
    // CATEGORIZACIÓN INTELIGENTE
    // ============================================
    const findBestCategory = useCallback(
      (description: string): Categorization | null => {
        const categoryNames = Object.keys(categories);
        if (categoryNames.length === 0) return null;

        const desc = description.toLowerCase().trim();
        const words = desc.split(/\s+/).filter((w) => w.length > 2);

        const scores: {
          [key: string]: {
            score: number;
            subcategory: string;
            reason: string;
          };
        } = {};

        categoryNames.forEach((cat) => {
          scores[cat] = { score: 0, subcategory: "", reason: "" };
        });

        // Subcategorías (100 pts)
        categoryNames.forEach((cat) => {
          const subcategories = categories[cat]?.subcategories || [];
          const matchedSub = subcategories.find(
            (sub) =>
              sub.toLowerCase() === desc ||
              desc.includes(sub.toLowerCase()) ||
              sub.toLowerCase().includes(desc)
          );

          if (matchedSub) {
            scores[cat].score += 100;
            scores[cat].subcategory = matchedSub;
            scores[cat].reason = `✓ Subcategoría: "${matchedSub}"`;
          }
        });

        // Patrones aprendidos (80 pts)
        words.forEach((word) => {
          if (learnedPatterns[word]) {
            Object.keys(learnedPatterns[word]).forEach((cat) => {
              if (scores[cat]) {
                const count = learnedPatterns[word][cat].count;
                scores[cat].score += count * 20;
                if (!scores[cat].reason) {
                  scores[cat].reason = `📚 "${word}" usado ${count}x`;
                }

                const subs = learnedPatterns[word][cat].subcategories;
                const mostCommon = Object.keys(subs).sort(
                  (a, b) => subs[b] - subs[a]
                )[0];
                if (mostCommon && !scores[cat].subcategory) {
                  scores[cat].subcategory = mostCommon;
                }
              }
            });
          }
        });

        // Match exacto (60 pts)
        categoryNames.forEach((cat) => {
          const catLower = cat.toLowerCase();
          if (desc === catLower) {
            scores[cat].score += 60;
            if (!scores[cat].reason) scores[cat].reason = "✓ Categoría exacta";
          } else if (desc.includes(catLower) || catLower.includes(desc)) {
            scores[cat].score += 50;
            if (!scores[cat].reason)
              scores[cat].reason = "✓ Categoría encontrada";
          }
        });

        // Sinónimos (40 pts)
        Object.entries(SYNONYMS).forEach(([key, syns]) => {
          const found = syns.find((syn) => desc.includes(syn));
          if (found) {
            const matchedCat = categoryNames.find((cat) => {
              const catLower = cat.toLowerCase();
              return catLower.includes(key) || key.includes(catLower);
            });

            if (matchedCat && scores[matchedCat]) {
              scores[matchedCat].score += 40;
              if (!scores[matchedCat].reason) {
                scores[matchedCat].reason = `🔍 "${found}"`;
              }
            }
          }
        });

        let bestCat: string | null = null;
        let bestScore = 0;

        Object.entries(scores).forEach(([cat, data]) => {
          if (data.score > bestScore) {
            bestScore = data.score;
            bestCat = cat;
          }
        });

        if (bestScore < 10) {
          return {
            category: categoryNames[0],
            subcategory: "",
            confidence: 30,
            reason: "⚠️ Sin coincidencias",
          };
        }

        return {
          category: bestCat!,
          subcategory: scores[bestCat!].subcategory || "",
          confidence: Math.min(100, bestScore),
          reason: scores[bestCat!].reason,
        };
      },
      [categories, learnedPatterns]
    );

    // ============================================
    // DETECCIÓN DE GASTOS
    // ============================================
    const detectSingleExpense = useCallback(
      (text: string): DetectedExpense | null => {
        const expenseDate = extractDate(text);

        const patterns: RegExp[] = [
          /(?:añade?|añad[íi])\s+(.+?)\s+(?:en|de|a|para)\s+(.+?)(?:\s|$|[.,;])/i,
          /^(.+?)\s+(?:a|en|de|para)\s+(.+?)$/i,
          /(?:gast[ée]|pagu[ée])\s+(.+?)\s+(?:en|de|a|para)\s+(.+?)(?:\s|$|[.,;])/i,
          /(.+?)\s+(?:en|de|a|para)\s+(.+?)(?:\s|$|[.,;])/i,
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (!match) continue;

          const part1 = match[1].trim();
          const part2 = match[2].trim();

          const num1 = convertTextToNumber(part1);
          const num2 = convertTextToNumber(part2);

          let amount: number | null = null;
          let description = "";

          if (!isNaN(num1) && num1 > 0) {
            amount = num1;
            description = part2;
          } else if (!isNaN(num2) && num2 > 0) {
            amount = num2;
            description = part1;
          }

          if (amount && description) {
            description = description
              .replace(/\s*(?:ayer|anteayer|hace\s+\d+\s+días?)/i, "")
              .replace(/\s*(?:€|euros?)\s*$/i, "")
              .trim();

            return { amount, description, date: expenseDate };
          }
        }

        return null;
      },
      []
    );

    const detectMultipleExpenses = useCallback(
      (text: string): DetectedExpense[] => {
        const segments = text
          .split(/\s+y\s+|,\s*|;\s*|\s+también\s+|\s+además\s+/i)
          .map((s) => s.trim())
          .filter((s) => s.length > 3);

        const detected: DetectedExpense[] = [];

        for (const segment of segments) {
          const expense = detectSingleExpense(segment);
          if (expense) detected.push(expense);
        }

        return detected;
      },
      [detectSingleExpense]
    );

    // ============================================
    // ACTUALIZAR PREVIEW
    // ============================================
    const updatePreview = useCallback(
      (text: string) => {
        if (!text.trim()) {
          setPendingExpenses([]);
          return;
        }

        const detected = detectMultipleExpenses(text);
        const previews: PreviewExpense[] = [];

        for (const expense of detected) {
          const categorization = findBestCategory(expense.description);
          if (categorization) {
            previews.push({
              ...expense,
              category: categorization.category,
              subcategory: categorization.subcategory,
              confidence: categorization.confidence,
            });
          }
        }

        setPendingExpenses(previews);

        // 📳 Mejora 3: Vibrar al detectar
        if (previews.length > 0 && settings.vibration) {
          vibrate(50);
        }
      },
      [detectMultipleExpenses, findBestCategory, settings.vibration]
    );

    // ============================================
    // 🎯 Mejora 2: Corrección inline
    // ============================================
    const updateExpenseCategory = useCallback(
      (index: number, category: string) => {
        setPendingExpenses((prev) => {
          const updated = [...prev];
          updated[index].category = category;
          // Resetear subcategoría si cambia categoría
          updated[index].subcategory = "";
          return updated;
        });
      },
      []
    );

    const updateExpenseSubcategory = useCallback(
      (index: number, subcategory: string) => {
        setPendingExpenses((prev) => {
          const updated = [...prev];
          updated[index].subcategory = subcategory;
          return updated;
        });
      },
      []
    );

    const removeExpense = useCallback(
      (index: number) => {
        setPendingExpenses((prev) => prev.filter((_, i) => i !== index));
        // 📳 Mejora 3: Vibrar al eliminar
        if (settings.vibration) vibrate(100);
      },
      [settings.vibration]
    );

    // ============================================
    // CONFIRMAR Y GUARDAR
    // ============================================
    const confirmAndSave = useCallback(async () => {
      if (pendingExpenses.length === 0) return;

      setIsProcessing(true);

      try {
        let successCount = 0;
        const results: string[] = [];

        for (const expense of pendingExpenses) {
          const expenseData: ExpenseData = {
            name: expense.description,
            amount: expense.amount,
            category: expense.category,
            subcategory: expense.subcategory || "",
            date: expense.date,
            paymentMethod: "Tarjeta",
            isRecurring: false,
            recurringId: null,
          };

          try {
            if (isOnline) {
              // Online: guardar directamente
              await addExpense(expenseData);
              successCount++;
            } else {
              // 🔌 Mejora 8: Offline queue
              const newQueue = [...offlineQueue, expenseData];
              setOfflineQueue(newQueue);
              saveOfflineQueue(newQueue);
              successCount++;
            }

            const catDetails = expense.subcategory
              ? `${expense.category} (${expense.subcategory})`
              : expense.category;

            results.push(`${expense.amount}€ → ${catDetails}`);
          } catch (error) {
            console.error("Error al guardar:", error);
          }
        }

        // 📊 Mejora 6: Actualizar stats
        const newStats: VoiceStats = {
          totalVoiceExpenses: stats.totalVoiceExpenses + successCount,
          accuracy:
            pendingExpenses.reduce((sum, e) => sum + e.confidence, 0) /
            pendingExpenses.length,
          lastUsed: new Date().toISOString(),
          avgConfidence: stats.avgConfidence
            ? (stats.avgConfidence +
                pendingExpenses.reduce((sum, e) => sum + e.confidence, 0) /
                  pendingExpenses.length) /
              2
            : pendingExpenses.reduce((sum, e) => sum + e.confidence, 0) /
              pendingExpenses.length,
        };
        setStats(newStats);
        saveStats(newStats);

        // Limpiar todo
        setTranscript("");
        setInterimTranscript("");
        setPendingExpenses([]);
        setShowConfirmation(false);
        clearDraft();

        // 📳 Mejora 3: Vibrar al éxito
        if (settings.vibration) vibrate([100, 50, 100]);

        if (successCount > 0) {
          const message = isOnline
            ? successCount === 1
              ? `✅ ${results[0]}`
              : `✅ ${successCount} gastos añadidos:\n${results.join("\n")}`
            : `💾 ${successCount} gastos guardados offline (se sincronizarán cuando haya conexión)`;

          showNotification?.(message, "success");
        } else {
          showNotification?.("❌ No se pudo guardar ningún gasto", "error");
        }

        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (error) {
        console.error("Error:", error);
        showNotification?.("❌ Error al añadir gastos", "error");
        // 📳 Mejora 3: Vibrar al error
        if (settings.vibration) vibrate(200);
      } finally {
        setIsProcessing(false);
      }
    }, [
      pendingExpenses,
      addExpense,
      showNotification,
      stats,
      settings,
      isOnline,
      offlineQueue,
    ]);

    // ============================================
    // RECONOCIMIENTO DE VOZ
    // ============================================
    useEffect(() => {
      if (typeof window === "undefined") return;

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-ES";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcriptPart + " ";
          } else {
            interimText += transcriptPart;
          }
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        setInterimTranscript(interimText);

        // 🎯 Mejora 5: Generar sugerencias
        if (interimText) {
          const lastWord = interimText.split(" ").pop() || "";
          setSuggestions(generateSuggestions(lastWord));
        }

        if (finalText && !isProcessing) {
          setTranscript((prev) => {
            const newTranscript = prev.trim()
              ? `${prev.trim()}, ${finalText.trim()}`
              : finalText.trim();

            updatePreview(newTranscript);
            return newTranscript;
          });
          setInterimTranscript("");
          setSuggestions([]);

          // Auto-confirmar o esperar silencio
          if (settings.autoConfirm) {
            silenceTimerRef.current = setTimeout(() => {
              const fullTranscript = transcript + " " + finalText;
              updatePreview(fullTranscript.trim());
              setShowConfirmation(true);
            }, settings.silenceTimeout);
          } else {
            // Mostrar confirmación inmediatamente
            setShowConfirmation(true);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          showNotification?.("❌ Permiso de micrófono denegado", "error");
        } else if (event.error !== "no-speech") {
          showNotification?.(`❌ Error: ${event.error}`, "error");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignorar
          }
        }
      };
    }, [
      isProcessing,
      showNotification,
      settings,
      transcript,
      updatePreview,
      generateSuggestions,
    ]);

    // ============================================
    // TOGGLE LISTENING
    // ============================================
    const toggleListening = useCallback((): void => {
      if (!recognitionRef.current) {
        showNotification?.("❌ Reconocimiento de voz no disponible", "error");
        return;
      }

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          // 📳 Mejora 3: Vibrar al iniciar
          if (settings.vibration) vibrate(50);
        } catch (error) {
          showNotification?.("❌ Error al iniciar micrófono", "error");
        }
      }
    }, [isListening, showNotification, settings.vibration]);

    // ============================================
    // RENDER
    // ============================================
    const displayText = transcript + interimTranscript;
    const hasText = displayText.trim().length > 0;

    return (
      <>
        {/* Botón Principal */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`fixed right-4 z-40 md:hidden p-4 rounded-full shadow-2xl backdrop-blur-xl border transition-all active:scale-95 ${
            isProcessing
              ? darkMode
                ? "bg-purple-600/25 border-purple-500/40 text-white"
                : "bg-purple-600/25 border-purple-400/40 text-white"
              : isListening
              ? darkMode
                ? "bg-red-600/25 border-red-500/40 text-white animate-pulse"
                : "bg-red-600/25 border-red-400/40 text-white animate-pulse"
              : darkMode
              ? "bg-gray-800/25 backdrop-blur-xl border-gray-700/40 text-gray-300"
              : "bg-white/25 backdrop-blur-xl border-white/40 text-purple-600"
          } ${isProcessing ? "cursor-wait" : ""}`}
          style={{
            bottom: hasFilterButton
              ? "calc(9.5rem + env(safe-area-inset-bottom))"
              : "calc(5.5rem + env(safe-area-inset-bottom))",
          }}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Botón Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className={`fixed right-16 z-40 md:hidden p-3 rounded-full shadow-lg backdrop-blur-xl border transition-all active:scale-95 ${
            darkMode
              ? "bg-gray-800/25 border-gray-700/40 text-gray-300"
              : "bg-white/25 border-white/40 text-purple-600"
          }`}
          style={{
            bottom: hasFilterButton
              ? "calc(9.5rem + env(safe-area-inset-bottom))"
              : "calc(5.5rem + env(safe-area-inset-bottom))",
          }}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Indicador offline */}
        {!isOnline && (
          <div
            className={`fixed left-4 z-40 px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-lg text-xs font-medium ${
              darkMode
                ? "bg-yellow-600/25 border-yellow-500/40 text-yellow-300"
                : "bg-yellow-100 border-yellow-300 text-yellow-800"
            }`}
            style={{
              bottom: hasFilterButton
                ? "calc(9.5rem + env(safe-area-inset-bottom))"
                : "calc(5.5rem + env(safe-area-inset-bottom))",
            }}
          >
            📴 Sin conexión{" "}
            {offlineQueue.length > 0 && `(${offlineQueue.length} pendientes)`}
          </div>
        )}

        {/* Modal de Grabación */}
        {isListening && !showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div
              className={`relative max-w-lg w-full rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
                darkMode
                  ? "bg-gray-800/95 border-gray-700/50"
                  : "bg-white/95 border-white/50"
              }`}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span
                  className={`text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Grabando...
                </span>
              </div>

              <div className="p-6 pt-12 space-y-4">
                <div className="flex items-center justify-center">
                  <div
                    className={`p-4 rounded-full ${
                      darkMode ? "bg-red-600/20" : "bg-red-100"
                    }`}
                  >
                    <Mic
                      className={`w-8 h-8 ${
                        darkMode ? "text-red-400" : "text-red-600"
                      } animate-pulse`}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <p
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {hasText ? "Transcripción:" : "Habla ahora..."}
                  </p>
                  <div
                    className={`min-h-[80px] p-4 rounded-xl ${
                      darkMode ? "bg-gray-700/50" : "bg-gray-50"
                    } border ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {hasText ? (
                      <>
                        <p
                          className={`text-lg font-medium ${
                            darkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          {transcript}
                          {interimTranscript && (
                            <span
                              className={`${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              } italic`}
                            >
                              {interimTranscript}
                            </span>
                          )}
                        </p>
                        {/* 🎯 Mejora 5: Sugerencias */}
                        {suggestions.length > 0 && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {suggestions.map((sug, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded ${
                                  darkMode
                                    ? "bg-blue-600/20 text-blue-300"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                💡 {sug}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          } italic`}
                        >
                          Esperando...
                        </p>
                        <div
                          className={`p-3 rounded-lg ${
                            darkMode ? "bg-yellow-500/10" : "bg-yellow-50"
                          } border ${
                            darkMode
                              ? "border-yellow-500/20"
                              : "border-yellow-200"
                          }`}
                        >
                          <p
                            className={`text-sm font-medium ${
                              darkMode ? "text-yellow-400" : "text-yellow-700"
                            }`}
                          >
                            {VOICE_EXAMPLES[currentExampleIndex]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {pendingExpenses.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className={`text-xs font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {pendingExpenses.length === 1
                        ? "Gasto detectado:"
                        : `${pendingExpenses.length} gastos detectados:`}
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {pendingExpenses.map((expense, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded-lg ${
                            darkMode
                              ? "bg-green-600/10 border border-green-500/20"
                              : "bg-green-50 border border-green-200"
                          }`}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 flex-shrink-0 ${
                              darkMode ? "text-green-400" : "text-green-600"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                darkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {expense.amount}€ → {expense.category}
                              {expense.subcategory &&
                                ` (${expense.subcategory})`}
                            </p>
                            <p
                              className={`text-xs truncate ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {expense.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 🎯 Mejora 1: Modal de Confirmación con Edición */}
        {showConfirmation && pendingExpenses.length > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              className={`relative max-w-lg w-full rounded-2xl shadow-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } max-h-[80vh] overflow-y-auto`}
            >
              <div
                className="sticky top-0 p-4 border-b flex items-center justify-between"
                style={
                  darkMode
                    ? {
                        backgroundColor: "rgb(31, 41, 55)",
                        borderColor: "rgb(55, 65, 81)",
                      }
                    : {
                        backgroundColor: "white",
                        borderColor: "rgb(229, 231, 235)",
                      }
                }
              >
                <h3
                  className={`text-lg font-semibold ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Confirmar {pendingExpenses.length} gasto
                  {pendingExpenses.length > 1 ? "s" : ""}
                </h3>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {pendingExpenses.map((expense, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p
                          className={`text-lg font-semibold ${
                            darkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          {expense.amount}€
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {expense.description}
                        </p>
                      </div>
                      <button
                        onClick={() => removeExpense(idx)}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode
                            ? "hover:bg-red-600/20 text-red-400"
                            : "hover:bg-red-50 text-red-600"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 🎯 Mejora 2: Selectores de categoría y subcategoría */}
                    <div className="space-y-2">
                      <div>
                        <label
                          className={`text-xs font-medium mb-1 block ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Categoría:
                        </label>
                        <select
                          value={expense.category}
                          onChange={(e) =>
                            updateExpenseCategory(idx, e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            darkMode
                              ? "bg-gray-600 border-gray-500 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        >
                          {Object.keys(categories).map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {categories[expense.category]?.subcategories &&
                        categories[expense.category].subcategories!.length >
                          0 && (
                          <div>
                            <label
                              className={`text-xs font-medium mb-1 block ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Subcategoría:
                            </label>
                            <select
                              value={expense.subcategory}
                              onChange={(e) =>
                                updateExpenseSubcategory(idx, e.target.value)
                              }
                              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                darkMode
                                  ? "bg-gray-600 border-gray-500 text-gray-100"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                            >
                              <option value="">Sin subcategoría</option>
                              {categories[expense.category].subcategories!.map(
                                (sub) => (
                                  <option key={sub} value={sub}>
                                    {sub}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        )}

                      {/* Indicador de confianza */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              expense.confidence > 70
                                ? "bg-green-500"
                                : expense.confidence > 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${expense.confidence}%` }}
                          />
                        </div>
                        <span
                          className={
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          {expense.confidence.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de acción */}
              <div
                className="sticky bottom-0 p-4 border-t flex gap-3"
                style={
                  darkMode
                    ? {
                        backgroundColor: "rgb(31, 41, 55)",
                        borderColor: "rgb(55, 65, 81)",
                      }
                    : {
                        backgroundColor: "white",
                        borderColor: "rgb(229, 231, 235)",
                      }
                }
              >
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setPendingExpenses([]);
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={confirmAndSave}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isProcessing
                      ? "bg-gray-400 cursor-wait"
                      : darkMode
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    `✅ Guardar ${pendingExpenses.length > 1 ? "Todo" : ""} (${
                      pendingExpenses.length
                    })`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ⚙️ Mejora 7: Modal de Settings */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              className={`relative max-w-md w-full rounded-2xl shadow-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className="p-4 border-b flex items-center justify-between"
                style={
                  darkMode
                    ? { borderColor: "rgb(55, 65, 81)" }
                    : { borderColor: "rgb(229, 231, 235)" }
                }
              >
                <h3
                  className={`text-lg font-semibold ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  ⚙️ Configuración de Voz
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-2 rounded-lg ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Auto-confirmar */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      Confirmación automática
                    </p>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Guardar sin preguntar después de{" "}
                      {settings.silenceTimeout / 1000}s
                    </p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={settings.autoConfirm}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          autoConfirm: e.target.checked,
                        };
                        setSettings(newSettings);
                        saveSettings(newSettings);
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors peer-checked:bg-green-500 ${
                        darkMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>

                {/* Vibración */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      📳 Vibración
                    </p>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Feedback táctil al detectar gastos
                    </p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={settings.vibration}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          vibration: e.target.checked,
                        };
                        setSettings(newSettings);
                        saveSettings(newSettings);
                        if (e.target.checked) vibrate(50);
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors peer-checked:bg-green-500 ${
                        darkMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>

                {/* Sugerencias */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      💡 Sugerencias inteligentes
                    </p>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Mostrar sugerencias mientras hablas
                    </p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={settings.showSuggestions}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          showSuggestions: e.target.checked,
                        };
                        setSettings(newSettings);
                        saveSettings(newSettings);
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors peer-checked:bg-green-500 ${
                        darkMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>

                {/* Tiempo de silencio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className={`font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      ⏱️ Tiempo de silencio
                    </p>
                    <span
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {settings.silenceTimeout / 1000}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="5000"
                    step="500"
                    value={settings.silenceTimeout}
                    onChange={(e) => {
                      const newSettings = {
                        ...settings,
                        silenceTimeout: parseInt(e.target.value),
                      };
                      setSettings(newSettings);
                      saveSettings(newSettings);
                    }}
                    className="w-full"
                  />
                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Espera entre múltiples gastos
                  </p>
                </div>

                {/* 📊 Mejora 6: Stats button */}
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowStats(true);
                  }}
                  className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    darkMode
                      ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Ver Estadísticas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📊 Mejora 6: Modal de Stats */}
        {showStats && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              className={`relative max-w-md w-full rounded-2xl shadow-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className="p-4 border-b flex items-center justify-between"
                style={
                  darkMode
                    ? { borderColor: "rgb(55, 65, 81)" }
                    : { borderColor: "rgb(229, 231, 235)" }
                }
              >
                <h3
                  className={`text-lg font-semibold ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  📊 Estadísticas de Voz
                </h3>
                <button
                  onClick={() => setShowStats(false)}
                  className={`p-2 rounded-lg ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-green-600/10" : "bg-green-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        darkMode ? "text-green-400" : "text-green-700"
                      }`}
                    >
                      Total de gastos por voz
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}
                    >
                      {stats.totalVoiceExpenses}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-blue-600/10" : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        darkMode ? "text-blue-400" : "text-blue-700"
                      }`}
                    >
                      Precisión promedio
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      {stats.avgConfidence.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${stats.avgConfidence}%` }}
                    />
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-purple-600/10" : "bg-purple-50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? "text-purple-400" : "text-purple-700"
                    }`}
                  >
                    Última vez usado
                  </span>
                  <p
                    className={`text-sm mt-1 ${
                      darkMode ? "text-purple-300" : "text-purple-600"
                    }`}
                  >
                    {stats.lastUsed
                      ? new Date(stats.lastUsed).toLocaleString("es-ES")
                      : "Nunca"}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-yellow-600/10" : "bg-yellow-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap
                      className={`w-5 h-5 ${
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        darkMode ? "text-yellow-400" : "text-yellow-700"
                      }`}
                    >
                      Velocidad
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-yellow-300" : "text-yellow-600"
                    }`}
                  >
                    Añades gastos{" "}
                    {stats.totalVoiceExpenses > 10
                      ? "3x más rápido"
                      : "2x más rápido"}{" "}
                    que manualmente
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

VoiceExpenseButton.displayName = "VoiceExpenseButton";

export default VoiceExpenseButton;
