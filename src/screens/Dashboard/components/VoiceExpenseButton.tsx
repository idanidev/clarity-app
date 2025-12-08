import { Loader2, Mic, MicOff } from "lucide-react";
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
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>("");
    const [interimTranscript, setInterimTranscript] = useState<string>("");
    const [currentExampleIndex, setCurrentExampleIndex] = useState<number>(0);
    const recognitionRef = useRef<any>(null);
    const lastSpeechTimeRef = useRef<number>(Date.now());
    const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ============================================
    // Rotar ejemplos cada 3 segundos mientras graba
    // ============================================
    useEffect(() => {
      if (!isListening) return;

      const interval = setInterval(() => {
        setCurrentExampleIndex((prev) => (prev + 1) % 3);
      }, 3000);

      return () => clearInterval(interval);
    }, [isListening]);

    // ============================================
    // APRENDIZAJE: Analizar gastos previos
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
          if (!patterns[keyword]) {
            patterns[keyword] = {};
          }
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

      console.log("📚 Patrones aprendidos:", patterns);
      return patterns;
    }, [expenses]);

    // ============================================
    // CATEGORIZACIÓN INTELIGENTE (sin IA)
    // ============================================
    const findBestCategory = useCallback(
      (description: string): Categorization | null => {
        const categoryNames = Object.keys(categories);
        if (categoryNames.length === 0) return null;

        const desc = description.toLowerCase();
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

        // 0. PRIORIDAD ULTRA: Buscar en SUBCATEGORÍAS primero (100 puntos)
        categoryNames.forEach((cat) => {
          const catData = categories[cat];
          const subcategories = catData?.subcategories || [];

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
            console.log(`🎯 Match en subcategoría: "${matchedSub}" → ${cat}`);
          }
        });

        // 1. Patrones aprendidos (80 puntos)
        words.forEach((word) => {
          if (learnedPatterns[word]) {
            Object.keys(learnedPatterns[word]).forEach((cat) => {
              if (scores[cat]) {
                const count = learnedPatterns[word][cat].count;
                scores[cat].score += count * 20;
                if (!scores[cat].reason) {
                  scores[
                    cat
                  ].reason = `📚 Usado "${word}" en ${cat} ${count} veces`;
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

        // 2. Match exacto categoría (60 puntos)
        categoryNames.forEach((cat) => {
          const catLower = cat.toLowerCase();
          if (desc === catLower) {
            scores[cat].score += 60;
            if (!scores[cat].reason) {
              scores[cat].reason = "✓ Categoría exacta";
            }
          } else if (desc.includes(catLower) || catLower.includes(desc)) {
            scores[cat].score += 50;
            if (!scores[cat].reason) {
              scores[cat].reason = "✓ Categoría encontrada";
            }
          }
        });

        // 3. Sinónimos (40 puntos)
        const synonyms: { [key: string]: string[] } = {
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
          transporte: [
            "gasolina",
            "gasoil",
            "diesel",
            "metro",
            "bus",
            "taxi",
            "uber",
            "tren",
          ],
          restaurante: ["restaurante", "comer", "cenar", "bar", "café"],
          ocio: ["ocio", "cine", "teatro", "concierto", "spotify", "netflix"],
          salud: ["salud", "médico", "farmacia", "hospital", "dentista"],
          ropa: ["ropa", "moda", "zapatos", "zara", "pull", "h&m"],
          casa: ["casa", "hogar", "alquiler", "luz", "agua", "gas", "internet"],
          tabaco: ["tabaco", "cigarrillos", "vaper"],
          vicios: ["tabaco", "cigarrillos", "vaper"],
        };

        Object.keys(synonyms).forEach((key) => {
          const syns = synonyms[key];
          const found = syns.find((syn) => desc.includes(syn));

          if (found) {
            const matchedCat = categoryNames.find((cat) => {
              const catLower = cat.toLowerCase();
              return catLower.includes(key) || key.includes(catLower);
            });

            if (matchedCat && scores[matchedCat]) {
              scores[matchedCat].score += 40;
              if (!scores[matchedCat].reason) {
                scores[matchedCat].reason = `🔍 "${found}" → ${matchedCat}`;
              }
            }
          }
        });

        // Encontrar mejor
        let bestCat: string | null = null;
        let bestScore = 0;

        Object.keys(scores).forEach((cat) => {
          if (scores[cat].score > bestScore) {
            bestScore = scores[cat].score;
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

        console.log("✅ Mejor:", bestCat, "Score:", bestScore);

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
    // DETECCIÓN de gastos
    // ============================================
    const detectMultipleExpensesFromText = useCallback(
      (text: string): DetectedExpense[] => {
        console.log("🔍 Analizando múltiples gastos:", text);
        
        // Dividir el texto por separadores comunes
        // Incluye: "y", comas, puntos, punto y coma, "también", "además", "luego"
        const segments = text
          .split(/\s+y\s+|,\s*|;\s*|\.\s+|\\s+también\s+|\\s+además\s+|\\s+luego\s+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        console.log("📝 Segmentos encontrados:", segments);
        
        const detectedExpenses: DetectedExpense[] = [];
        
        segments.forEach((segment, index) => {
          const detected = detectSingleExpenseFromText(segment);
          if (detected) {
            console.log(`✅ Gasto ${index + 1} detectado:`, detected);
            detectedExpenses.push(detected);
          }
        });
        
        return detectedExpenses;
      },
      [categories, learnedPatterns]
    );

    const detectSingleExpenseFromText = useCallback(
      (text: string): DetectedExpense | null => {
        console.log("🔍 Analizando gasto individual:", text);

        let expenseDate = new Date().toISOString().slice(0, 10);

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
            pattern: /hace\s+(\d+)\s+días?/i,
            offset: (d, match) => {
              if (match) d.setDate(d.getDate() - parseInt(match[1]));
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

        const numberWords: { [key: string]: number } = {
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
          veinte: 20,
          treinta: 30,
          cuarenta: 40,
          cincuenta: 50,
          sesenta: 60,
          setenta: 70,
          ochenta: 80,
          noventa: 90,
        };

        const convertTextToNumber = (textNumber: string): number => {
          const comaPattern = /(\w+)\s+(?:coma|con)\s+(\w+)/i;
          const comaMatch = textNumber.match(comaPattern);

          if (comaMatch) {
            const parteEntera =
              numberWords[comaMatch[1].toLowerCase()] ?? parseInt(comaMatch[1]);
            const parteDecimal =
              numberWords[comaMatch[2].toLowerCase()] ?? parseInt(comaMatch[2]);

            if (!isNaN(parteEntera) && !isNaN(parteDecimal)) {
              const decimalStr =
                parteDecimal < 10 ? `0${parteDecimal}` : `${parteDecimal}`;
              return parseFloat(`${parteEntera}.${decimalStr}`);
            }
          }

          const singleWord = numberWords[textNumber.toLowerCase()];
          if (singleWord !== undefined) {
            return singleWord;
          }

          return parseFloat(textNumber.replace(",", "."));
        };

        const patterns: RegExp[] = [
          /(?:añade?|añad[íi])\s+(.+?)\s+(?:en|de|a)\s+(.+?)(?:\s|$|\.|,)/i,
          /^(.+?)\s+(?:a|en|de)\s+(.+?)$/i,
          /(.+?)\s+(?:en|de|a)\s+(.+?)(?:\s|$|\.|,)/i,
        ];

        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const match = text.match(pattern);

          if (match) {
            console.log(`✅ Patrón ${i + 1}:`, match);

            let amount: number | null = null;
            let description = "";

            const part1 = match[1].trim();
            const part2 = match[2].trim();

            const num1 = convertTextToNumber(part1);
            const num2 = convertTextToNumber(part2);

            if (!isNaN(num1) && num1 > 0) {
              amount = num1;
              description = part2;
            } else if (!isNaN(num2) && num2 > 0) {
              amount = num2;
              description = part1;
            }

            description = description
              .replace(/\s*(?:ayer|hace\s+\d+\s+días?)/i, "")
              .replace(/\s*(?:€|euros?)\s*$/i, "")
              .trim();

            if (
              amount !== null &&
              !isNaN(amount) &&
              amount > 0 &&
              description
            ) {
              console.log("✅ Detectado:", {
                amount,
                description,
                date: expenseDate,
              });
              return { amount, description, date: expenseDate };
            }
          }
        }

        return null;
      },
      []
    );

    // Mantener compatibilidad con código existente
    const detectExpenseFromText = useCallback(
      (text: string): DetectedExpense | null => {
        const expenses = detectMultipleExpensesFromText(text);
        return expenses.length > 0 ? expenses[0] : null;
      },
      [detectMultipleExpensesFromText]
    );

    // ============================================
    // Procesar transcripción
    // ============================================
    const processTranscript = useCallback(
      async (text: string): Promise<void> => {
        if (!text || !addExpense) return;

        setIsProcessing(true);

        try {
          const categoryNames = Object.keys(categories);
          if (categoryNames.length === 0) {
            showNotification?.("⚠️ No hay categorías", "error");
            setIsProcessing(false);
            return;
          }

          // Detectar múltiples gastos
          const detectedExpenses = detectMultipleExpensesFromText(text);

          if (detectedExpenses.length === 0) {
            showNotification?.(
              '❌ No entendí. Prueba: "veinte en tabaco y diez en comida"',
              "error"
            );
            setIsProcessing(false);
            return;
          }

          console.log(`💰 ${detectedExpenses.length} gasto(s) detectado(s)`);

          let successCount = 0;
          const results: string[] = [];

          // Procesar cada gasto detectado
          for (const detected of detectedExpenses) {
            const categorization = findBestCategory(detected.description);

            if (!categorization) {
              console.warn(`⚠️ No se pudo categorizar: ${detected.description}`);
              continue;
            }

            const expenseData: ExpenseData = {
              name: detected.description,
              amount: detected.amount,
              category: categorization.category,
              subcategory: categorization.subcategory || "",
              date: detected.date,
              paymentMethod: "Tarjeta",
              isRecurring: false,
              recurringId: null,
            };

            console.log("💾 Guardando gasto:", expenseData);
            await addExpense(expenseData);

            const categoryDetails = categorization.subcategory
              ? `${categorization.category} (${categorization.subcategory})`
              : categorization.category;

            results.push(`${detected.amount}€ → ${categoryDetails}`);
            successCount++;
          }

          setTranscript("");
          setInterimTranscript("");

          // Mostrar resultado
          if (successCount > 0) {
            const message = successCount === 1 
              ? `✅ ${results[0]}`
              : `✅ ${successCount} gastos:\n${results.join('\n')}`;
            
            showNotification?.(message, "success");
          } else {
            showNotification?.("❌ No se pudo guardar ningún gasto", "error");
          }

          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        } catch (error) {
          console.error("❌ Error:", error);
          showNotification?.("❌ Error al añadir", "error");
        } finally {
          setIsProcessing(false);
        }
      },
      [
        addExpense,
        categories,
        detectExpenseFromText,
        findBestCategory,
        showNotification,
      ]
    );

    // ============================================
    // Reconocimiento de voz
    // ============================================
    useEffect(() => {
      if (typeof window === "undefined") return;

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("⚠️ Voz no disponible");
        return;
      }

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

        // Actualizar timestamp de última palabra detectada
        lastSpeechTimeRef.current = Date.now();

        // Limpiar timer de pausa anterior
        if (pauseTimerRef.current) {
          clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = null;
        }

        setInterimTranscript(interimText);

        if (finalText && !isProcessing) {
          setTranscript((prev) => {
            const newTranscript = prev + finalText;
            
            // Si ya hay texto previo y no termina en separador, añadir uno
            if (prev.trim() && !prev.trim().match(/[,;]$/)) {
              return prev.trim() + ', ' + finalText;
            }
            return newTranscript;
          });
          setInterimTranscript("");
          
          // No procesar inmediatamente, esperar a ver si hay más gastos
          // Configurar timer para procesar después de 2 segundos de silencio
          pauseTimerRef.current = setTimeout(() => {
            const fullTranscript = transcript + finalText;
            if (fullTranscript.trim()) {
              console.log("🎤 Pausa detectada, procesando múltiples gastos");
              processTranscript(fullTranscript.trim());
            }
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          showNotification?.("❌ Micrófono denegado", "error");
        } else if (event.error !== "no-speech") {
          showNotification?.(`❌ Error: ${event.error}`, "error");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        
        // Limpiar timer de pausa al terminar
        if (pauseTimerRef.current) {
          clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = null;
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
    }, [processTranscript, isProcessing, showNotification]);

    const toggleListening = (): void => {
      if (!recognitionRef.current) {
        showNotification?.("❌ Voz no disponible en este navegador", "error");
        return;
      }

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        setTranscript("");
        setInterimTranscript("");
      } else {
        try {
          setTranscript("");
          setInterimTranscript("");
          recognitionRef.current.start();
        } catch (error) {
          showNotification?.("❌ Error al iniciar micrófono", "error");
        }
      }
    };

    const displayText = transcript + interimTranscript;
    const hasText = displayText.trim().length > 0;

    const voiceExamples = [
      '💡 "25 en supermercado"',
      '💡 "nueve coma sesenta en tabaco"',
      '💡 "50 euros en gasolina ayer"',
    ];

    return (
      <>
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
          title={
            isProcessing
              ? "Añadiendo..."
              : isListening
              ? "Detener"
              : "Añadir por voz"
          }
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {isListening && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div
              className={`relative max-w-md w-full rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
                darkMode
                  ? "bg-gray-800/95 border-gray-700/50"
                  : "bg-white/95 border-white/50"
              }`}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span
                  className={`text-xs font-medium ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Grabando...
                </span>
              </div>

              <div className="p-6 pt-12">
                <div className="flex items-center justify-center mb-4">
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
                            {voiceExamples[currentExampleIndex]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div
            className="fixed right-16 z-40 md:hidden px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-lg text-xs font-medium"
            style={{
              bottom: hasFilterButton
                ? "calc(9.5rem + env(safe-area-inset-bottom))"
                : "calc(5.5rem + env(safe-area-inset-bottom))",
              ...(darkMode
                ? {
                    backgroundColor: "rgba(107, 114, 128, 0.6)",
                    borderColor: "rgba(75, 85, 99, 0.4)",
                    color: "#f3f4f6",
                  }
                : {
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    color: "#7c3aed",
                  }),
            }}
          >
            Añadiendo...
          </div>
        )}
      </>
    );
  }
);

VoiceExpenseButton.displayName = "VoiceExpenseButton";

export default VoiceExpenseButton;
