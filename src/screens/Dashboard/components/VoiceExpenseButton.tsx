import { CheckCircle2, Loader2, Mic, MicOff, X } from "lucide-react";
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

export interface VoiceSettings {
  silenceTimeout: number;
  autoConfirm: boolean;
  vibration: boolean;
  showSuggestions: boolean;
}

export interface VoiceStats {
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
  voiceSettings?: VoiceSettings;
}

// ============================================
// CONSTANTS
// ============================================
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  silenceTimeout: 2000,
  autoConfirm: false,
  vibration: true,
  showSuggestions: true,
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

// Storage
const STORAGE_KEYS = {
  DRAFT: "clarity_voice_draft",
  STATS: "clarity_voice_stats",
  OFFLINE_QUEUE: "clarity_offline_expenses",
};

export const loadVoiceStats = (): VoiceStats => {
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

export const saveVoiceStats = (stats: VoiceStats) => {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
};

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
    voiceSettings = DEFAULT_VOICE_SETTINGS,
  }) => {
    // State
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
    const [pendingExpenses, setPendingExpenses] = useState<PreviewExpense[]>(
      []
    );
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [offlineQueue, setOfflineQueue] = useState<ExpenseData[]>(
      loadOfflineQueue()
    );
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Refs
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ============================================
    // DETECTAR CONEXIÓN Y SINCRONIZAR
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

    const syncOfflineExpenses = useCallback(async () => {
      if (!isOnline || offlineQueue.length === 0) return;

      let synced = 0;
      const remaining: ExpenseData[] = [];

      for (const expense of offlineQueue) {
        try {
          await addExpense(expense);
          synced++;
          if (voiceSettings.vibration) vibrate(50);
        } catch (error) {
          remaining.push(expense);
        }
      }

      setOfflineQueue(remaining);
      saveOfflineQueue(remaining);

      if (synced > 0) {
        showNotification?.(`✅ ${synced} gastos sincronizados`, "success");
      }
    }, [
      isOnline,
      offlineQueue,
      addExpense,
      voiceSettings.vibration,
      showNotification,
    ]);

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
    // PERSISTENCIA
    // ============================================
    useEffect(() => {
      if (transcript) {
        localStorage.setItem(STORAGE_KEYS.DRAFT, transcript);
      }
    }, [transcript]);

    useEffect(() => {
      const draft = localStorage.getItem(STORAGE_KEYS.DRAFT);
      if (draft) {
        setTranscript(draft);
      }
    }, []);

    const clearDraft = useCallback(() => {
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
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
    // SUGERENCIAS
    // ============================================
    const generateSuggestions = useCallback(
      (partialText: string): string[] => {
        if (
          !voiceSettings.showSuggestions ||
          !partialText ||
          partialText.length < 2
        )
          return [];

        const suggestions: Set<string> = new Set();
        const text = partialText.toLowerCase();

        Object.keys(categories).forEach((cat) => {
          if (cat.toLowerCase().startsWith(text)) suggestions.add(cat);
        });

        Object.values(categories).forEach((catData) => {
          catData.subcategories?.forEach((sub) => {
            if (sub.toLowerCase().startsWith(text)) suggestions.add(sub);
          });
        });

        Object.keys(learnedPatterns).forEach((keyword) => {
          if (keyword.startsWith(text)) suggestions.add(keyword);
        });

        return Array.from(suggestions).slice(0, 3);
      },
      [categories, learnedPatterns, voiceSettings.showSuggestions]
    );

    // ============================================
    // CATEGORIZACIÓN
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
        
        // Limpiar el texto
        const cleanText = text.trim();

        // Patrón mejorado: detecta número al inicio seguido de "en" o "de" y descripción
        // Ejemplos: "2 en regalo laura", "20 en cena", "5 euros en café"
        const improvedPatterns: RegExp[] = [
          // Patrón 1: "NÚMERO en DESCRIPCIÓN" (más común)
          /^(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)?\s*(?:en|de|a|para)\s+(.+?)$/i,
          // Patrón 2: "NÚMERO DESCRIPCIÓN" (sin preposición)
          /^(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)?\s+(.+?)$/i,
          // Patrón 3: "DESCRIPCIÓN NÚMERO" (menos común)
          /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)?$/i,
          // Patrón 4: Con verbos al inicio
          /(?:añade?|añad[íi]|gast[ée]|pagu[ée])\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)?\s*(?:en|de|a|para)\s+(.+?)(?:\s|$|[.,;])/i,
        ];

        for (const pattern of improvedPatterns) {
          const match = cleanText.match(pattern);
          if (!match) continue;

          let amount: number | null = null;
          let description = "";

          // Determinar qué grupo es el número y cuál la descripción
          if (pattern.source.includes('^(.+?)\\s+(\\d+')) {
            // Patrón 3: descripción primero, número después
            description = match[1].trim();
            const numStr = match[2].replace(',', '.');
            amount = parseFloat(numStr);
          } else {
            // Patrones 1, 2, 4: número primero
            const numStr = match[1].replace(',', '.');
            amount = parseFloat(numStr);
            description = match[2]?.trim() || match[3]?.trim() || "";
          }

          // Validar que tenemos monto y descripción
          if (amount && !isNaN(amount) && amount > 0 && description.length > 0) {
            // Limpiar la descripción
            description = description
              .replace(/\s*(?:ayer|anteayer|hace\s+\d+\s+días?)/i, "")
              .replace(/\s*(?:€|euros?|eur)\s*$/i, "")
              .replace(/^\s*(?:en|de|a|para)\s+/i, "") // Quitar preposiciones al inicio
              .trim();

            if (description.length > 0) {
              return { amount, description, date: expenseDate };
            }
          }
        }

        // Fallback: intentar detectar número al inicio del texto
        const numberAtStart = cleanText.match(/^(\d+(?:[.,]\d+)?)/);
        if (numberAtStart) {
          const amount = parseFloat(numberAtStart[1].replace(',', '.'));
          if (amount > 0) {
            // Todo lo que sigue al número es la descripción
            const description = cleanText
              .substring(numberAtStart[0].length)
              .replace(/^\s*(?:€|euros?|eur)?\s*(?:en|de|a|para)?\s*/i, "")
              .trim();
            
            if (description.length > 0) {
              return { amount, description, date: expenseDate };
            }
          }
        }

        return null;
      },
      []
    );

    const detectMultipleExpenses = useCallback(
      (text: string): DetectedExpense[] => {
        // Primero, detectar si hay múltiples números en el texto
        const numberMatches = text.match(/\d+(?:[.,]\d+)?/g);
        const hasMultipleNumbers = numberMatches && numberMatches.length > 1;

        let segments: string[] = [];
        
        if (hasMultipleNumbers && numberMatches) {
          // Si hay múltiples números, dividir el texto basándose en esos números
          // Estrategia: encontrar cada número y su contexto hasta el siguiente separador o número
          const separators = /\s+y\s+|,\s*|;\s*|\s+también\s+|\s+además\s+|\s+luego\s+|\s+después\s+/i;
          
          // Primero intentar dividir por separadores tradicionales
          const separatorSplit = text.split(separators).map(s => s.trim()).filter(s => s.length > 0);
          
          // Si los separadores dividieron correctamente (cada segmento tiene un número), usarlos
          const segmentsWithNumbers = separatorSplit.filter(seg => /\d+(?:[.,]\d+)?/.test(seg));
          
          if (segmentsWithNumbers.length > 1) {
            segments = segmentsWithNumbers;
          } else {
            // Si no, dividir manualmente por números
            let lastIndex = 0;
            const newSegments: string[] = [];
            
            for (let i = 0; i < numberMatches.length; i++) {
              const numStr = numberMatches[i];
              const numIndex = text.indexOf(numStr, lastIndex);
              
              if (numIndex === -1) continue;
              
              // Buscar el final del segmento: siguiente número o separador
              let segmentEnd = text.length;
              
              // Buscar siguiente número
              if (i + 1 < numberMatches.length) {
                const nextNumIndex = text.indexOf(numberMatches[i + 1], numIndex + numStr.length);
                if (nextNumIndex !== -1) {
                  segmentEnd = nextNumIndex;
                }
              }
              
              // Buscar separadores antes del siguiente número
              const separatorMatch = text.substring(numIndex, segmentEnd).match(separators);
              if (separatorMatch && separatorMatch.index !== undefined) {
                segmentEnd = numIndex + separatorMatch.index + separatorMatch[0].length;
              }
              
              // Extraer el segmento
              const segment = text.substring(i === 0 ? 0 : numIndex, segmentEnd).trim();
              if (segment.length > 0) {
                newSegments.push(segment);
              }
              
              lastIndex = segmentEnd;
            }
            
            segments = newSegments.filter(s => s.length > 0);
          }
        } else {
          // Si solo hay un número o ninguno, usar separadores tradicionales
          segments = text
            .split(/\s+y\s+|,\s*|;\s*|\s+también\s+|\s+además\s+|\s+luego\s+|\s+después\s+/i)
            .map((s) => s.trim())
            .filter((s) => s.length > 3);
        }

        const detected: DetectedExpense[] = [];

        for (const segment of segments) {
          const expense = detectSingleExpense(segment);
          if (expense && expense.amount > 0) {
            detected.push(expense);
          }
        }

        // Log para debugging
        if (detected.length > 1) {
          console.log('🎤 Múltiples gastos detectados:', detected);
          console.log('📝 Segmentos procesados:', segments);
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

        if (previews.length > 0 && voiceSettings.vibration) {
          vibrate(50);
        }
      },
      [detectMultipleExpenses, findBestCategory, voiceSettings.vibration]
    );

    // ============================================
    // EDICIÓN
    // ============================================
    const updateExpenseCategory = useCallback(
      (index: number, category: string) => {
        setPendingExpenses((prev) => {
          const updated = [...prev];
          updated[index].category = category;
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
        if (voiceSettings.vibration) vibrate(100);
      },
      [voiceSettings.vibration]
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
              await addExpense(expenseData);
              successCount++;
            } else {
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

        // Actualizar stats
        const currentStats = loadVoiceStats();
        const newStats: VoiceStats = {
          totalVoiceExpenses: currentStats.totalVoiceExpenses + successCount,
          accuracy:
            pendingExpenses.reduce((sum, e) => sum + e.confidence, 0) /
            pendingExpenses.length,
          lastUsed: new Date().toISOString(),
          avgConfidence: currentStats.avgConfidence
            ? (currentStats.avgConfidence +
                pendingExpenses.reduce((sum, e) => sum + e.confidence, 0) /
                  pendingExpenses.length) /
              2
            : pendingExpenses.reduce((sum, e) => sum + e.confidence, 0) /
              pendingExpenses.length,
        };
        saveVoiceStats(newStats);

        // Limpiar todo
        setTranscript("");
        setInterimTranscript("");
        setPendingExpenses([]);
        setShowConfirmation(false);
        clearDraft();

        if (voiceSettings.vibration) vibrate([100, 50, 100]);

        if (successCount > 0) {
          const message = isOnline
            ? successCount === 1
              ? `✅ ${results[0]}`
              : `✅ ${successCount} gastos añadidos:\n${results.join("\n")}`
            : `💾 ${successCount} gastos guardados offline`;

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
        if (voiceSettings.vibration) vibrate(200);
      } finally {
        setIsProcessing(false);
      }
    }, [
      pendingExpenses,
      addExpense,
      showNotification,
      voiceSettings,
      isOnline,
      offlineQueue,
      clearDraft,
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

          if (voiceSettings.autoConfirm) {
            silenceTimerRef.current = setTimeout(() => {
              const fullTranscript = transcript + " " + finalText;
              updatePreview(fullTranscript.trim());
              setShowConfirmation(true);
            }, voiceSettings.silenceTimeout);
          } else {
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
      voiceSettings,
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
          // 🔥 FIX: RESETEAR TODO AL ABRIR
          setTranscript("");
          setInterimTranscript("");
          setPendingExpenses([]);
          setShowConfirmation(false);
          setSuggestions([]);
          clearDraft();

          recognitionRef.current.start();
          if (voiceSettings.vibration) vibrate(50);
        } catch (error) {
          showNotification?.("❌ Error al iniciar micrófono", "error");
        }
      }
    }, [isListening, showNotification, voiceSettings.vibration, clearDraft]);

    // ============================================
    // RENDER
    // ============================================
    const displayText = transcript + interimTranscript;
    const hasText = displayText.trim().length > 0;

    return (
      <>
        {/* Botón Principal - Estilo Minimalista */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`
            fixed right-4 z-40 md:hidden
            w-14 h-14 rounded-full
            flex items-center justify-center
            shadow-lg
            transition-all duration-200
            active:scale-95
            ${
              isProcessing
                ? darkMode
                  ? "bg-purple-500 text-white"
                  : "bg-purple-500 text-white"
                : isListening
                ? darkMode
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-red-500 text-white animate-pulse"
                : darkMode
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }
            ${isProcessing ? "cursor-wait" : ""}
          `}
          style={{
            bottom: hasFilterButton
              ? "calc(9.5rem + env(safe-area-inset-bottom))"
              : "calc(5.5rem + env(safe-area-inset-bottom))",
          }}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        {/* Indicador offline - Minimalista */}
        {!isOnline && (
          <div
            className={`
              fixed left-4 z-40
              px-3 py-1.5 rounded-full
              text-xs font-medium
              shadow-lg
              ${
                darkMode
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
              }
            `}
            style={{
              bottom: hasFilterButton
                ? "calc(9.5rem + env(safe-area-inset-bottom))"
                : "calc(5.5rem + env(safe-area-inset-bottom))",
            }}
          >
            📴 Sin conexión{" "}
            {offlineQueue.length > 0 && `(${offlineQueue.length})`}
          </div>
        )}

        {/* Modal de Grabación */}
        {isListening && !showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
              className={`
                relative max-w-lg w-full rounded-3xl shadow-2xl
                transition-all
                ${darkMode ? "bg-gray-900" : "bg-white"}
              `}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span
                  className={`text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Grabando
                </span>
              </div>

              <div className="p-8 pt-12 space-y-6">
                <div className="flex items-center justify-center">
                  <div
                    className={`p-6 rounded-full ${
                      darkMode ? "bg-red-500/10" : "bg-red-50"
                    }`}
                  >
                    <Mic
                      className={`w-10 h-10 ${
                        darkMode ? "text-red-400" : "text-red-500"
                      } animate-pulse`}
                    />
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <p
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {hasText ? "Transcripción:" : "Habla ahora..."}
                  </p>
                  <div
                    className={`
                      min-h-[100px] p-4 rounded-2xl
                      ${darkMode ? "bg-gray-800" : "bg-gray-50"}
                    `}
                  >
                    {hasText ? (
                      <>
                        <p
                          className={`text-lg ${
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
                        {suggestions.length > 0 && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {suggestions.map((sug, idx) => (
                              <span
                                key={idx}
                                className={`
                                  text-xs px-3 py-1 rounded-full
                                  ${
                                    darkMode
                                      ? "bg-blue-500/20 text-blue-300"
                                      : "bg-blue-100 text-blue-700"
                                  }
                                `}
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
                          className={`
                            p-3 rounded-xl
                            ${darkMode ? "bg-yellow-500/10" : "bg-yellow-50"}
                          `}
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
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pendingExpenses.map((expense, idx) => (
                        <div
                          key={idx}
                          className={`
                            flex items-center gap-2 p-3 rounded-xl
                            ${darkMode ? "bg-green-500/10" : "bg-green-50"}
                          `}
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

        {/* Modal de Confirmación */}
        {showConfirmation && pendingExpenses.length > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              className={`
                relative max-w-lg w-full rounded-3xl shadow-2xl
                max-h-[80vh] overflow-y-auto
                ${darkMode ? "bg-gray-900" : "bg-white"}
              `}
            >
              <div
                className={`
                  sticky top-0 p-4 border-b flex items-center justify-between
                  ${
                    darkMode
                      ? "bg-gray-900 border-gray-800"
                      : "bg-white border-gray-200"
                  }
                `}
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
                  className={`
                    p-2 rounded-xl transition-colors
                    ${
                      darkMode
                        ? "hover:bg-gray-800 text-gray-400"
                        : "hover:bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {pendingExpenses.map((expense, idx) => (
                  <div
                    key={idx}
                    className={`
                      p-4 rounded-2xl
                      ${darkMode ? "bg-gray-800" : "bg-gray-50"}
                    `}
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
                        className={`
                          p-2 rounded-xl transition-colors
                          ${
                            darkMode
                              ? "hover:bg-red-500/20 text-red-400"
                              : "hover:bg-red-50 text-red-600"
                          }
                        `}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
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
                          className={`
                            w-full px-3 py-2 rounded-xl text-sm
                            ${
                              darkMode
                                ? "bg-gray-700 text-gray-100"
                                : "bg-white border border-gray-200 text-gray-900"
                            }
                          `}
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
                              className={`
                              w-full px-3 py-2 rounded-xl text-sm
                              ${
                                darkMode
                                  ? "bg-gray-700 text-gray-100"
                                  : "bg-white border border-gray-200 text-gray-900"
                              }
                            `}
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

                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        >
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

              <div
                className={`
                  sticky bottom-0 p-4 border-t flex gap-3
                  ${
                    darkMode
                      ? "bg-gray-900 border-gray-800"
                      : "bg-white border-gray-200"
                  }
                `}
              >
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setPendingExpenses([]);
                  }}
                  className={`
                    flex-1 px-4 py-3 rounded-xl font-medium transition-colors
                    ${
                      darkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    }
                  `}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAndSave}
                  disabled={isProcessing}
                  className={`
                    flex-1 px-4 py-3 rounded-xl font-medium transition-colors
                    ${
                      isProcessing
                        ? "bg-gray-400 cursor-wait"
                        : darkMode
                        ? "bg-green-600 hover:bg-green-500 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }
                  `}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    `Guardar ${
                      pendingExpenses.length > 1
                        ? `(${pendingExpenses.length})`
                        : ""
                    }`
                  )}
                </button>
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
