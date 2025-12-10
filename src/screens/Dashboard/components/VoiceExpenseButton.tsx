import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * VoiceExpenseButton - Reconocimiento de voz HÍBRIDO
 * - iOS nativo (Capacitor): Plugin @capgo/capacitor-speech-recognition
 * - Web/PWA: Web Speech API
 */

// ============================================
// TYPES & INTERFACES
// ============================================
export interface VoiceSettings {
  autoConfirm: boolean;
  vibration: boolean;
  showSuggestions: boolean;
  silenceTimeout: number; // en milisegundos
}

export interface VoiceStats {
  totalUses: number;
  successfulUses: number;
  failedUses: number;
  lastUsed?: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  autoConfirm: true,
  vibration: true,
  showSuggestions: true,
  silenceTimeout: 3000, // 3 segundos
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
export const loadVoiceStats = (): VoiceStats => {
  try {
    const stored = localStorage.getItem("voiceStats");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading voice stats:", error);
  }
  return {
    totalUses: 0,
    successfulUses: 0,
    failedUses: 0,
  };
};

export const saveVoiceStats = (stats: VoiceStats) => {
  try {
    localStorage.setItem("voiceStats", JSON.stringify(stats));
  } catch (error) {
    console.error("Error saving voice stats:", error);
  }
};

// ============================================
// COMPONENT PROPS
// ============================================
interface VoiceExpenseButtonProps {
  onAddExpense: (expense: any) => Promise<void>;
  darkMode: boolean;
  showNotification?: (message: string, type: "success" | "error" | "info") => void;
  hasFilterButton?: boolean;
  categories?: any[];
  subcategories?: any[];
}

const VoiceExpenseButton = ({
  onAddExpense,
  darkMode,
  showNotification,
  hasFilterButton = false,
  categories: _categories = [],
  subcategories: _subcategories = [],
}: VoiceExpenseButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'

  console.log(`[Voice] Platform: ${platform}, Native: ${isNative}`);

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    const initSpeech = async () => {
      if (isNative) {
        // CAPACITOR: Usar plugin nativo
        console.log("[Voice] Initializing native speech recognition");
        try {
          const availableResult = await SpeechRecognition.available();
          console.log("[Voice] Native speech available result:", availableResult);

          const available = availableResult?.available ?? false;
          console.log("[Voice] Native speech available:", available);

          if (available) {
            try {
              const permission = await SpeechRecognition.requestPermissions();
              console.log("[Voice] Permission result:", permission);

              const hasPermission = permission?.speechRecognition === "granted";
              setVoiceAvailable(hasPermission);

              if (!hasPermission) {
                console.warn("[Voice] Permission not granted");
                // No mostrar error aquí, se mostrará cuando se intente usar
              } else {
                console.log("[Voice] ✅ Native speech recognition ready");
              }
            } catch (permError: any) {
              console.error("[Voice] Error requesting permissions:", permError);
              // Si el error es UNIMPLEMENTED, el plugin no está disponible
              if (permError?.code === 'UNIMPLEMENTED') {
                console.warn("[Voice] Plugin not implemented, trying Web Speech API fallback");
                setVoiceAvailable(false);
                // Intentar inicializar Web Speech API como fallback
                initWebSpeech();
                return;
              }
              setVoiceAvailable(false);
            }
          } else {
            console.warn(
              "[Voice] Speech recognition not available on this device"
            );
            setVoiceAvailable(false);
            // Intentar Web Speech API como fallback
            initWebSpeech();
          }
        } catch (error: any) {
          console.error("[Voice] Error checking native speech:", error);
          // Si el error es UNIMPLEMENTED, intentar Web Speech API
          if (error?.code === 'UNIMPLEMENTED') {
            console.warn("[Voice] Plugin not implemented, trying Web Speech API fallback");
            setVoiceAvailable(false);
            initWebSpeech();
          } else {
            setVoiceAvailable(false);
          }
        }
      } else {
        initWebSpeech();
      }
    };

    const initWebSpeech = () => {
      // WEB/PWA: Web Speech API
      console.log("[Voice] Initializing Web Speech API");
      const hasWebSpeech =
        "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
      console.log("[Voice] Web Speech available:", hasWebSpeech);
      
      if (hasWebSpeech) {
        setVoiceAvailable(true);
        const SpeechRecognitionAPI =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "es-ES";

        recognition.onresult = (event) => {
          let interim = "";
          let final = "";

          for (let i = (event as any).resultIndex; i < (event as any).results.length; i++) {
            const result = (event as any).results[i];
            if (result.isFinal) {
              final += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }

          console.log("[Voice] Result - Final:", final, "Interim:", interim);

          if (final) {
            setTranscript((prev) => prev + " " + final);
            processTranscript(final);
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
          console.error("[Voice] Web Speech error:", event.error);
          if (event.error === "not-allowed") {
            showNotification?.("❌ Micrófono denegado", "error");
          } else if (event.error === "service-not-allowed") {
            showNotification?.("❌ Servicio de reconocimiento no disponible", "error");
          } else if (event.error !== "no-speech" && event.error !== "aborted") {
            showNotification?.(`❌ Error: ${event.error}`, "error");
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          console.log("[Voice] Web Speech ended");
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        console.log("[Voice] ✅ Web Speech API initialized");
      } else {
        setVoiceAvailable(false);
        console.warn("[Voice] Web Speech API not available");
      }
    };

    initSpeech();

    initSpeech();

    return () => {
      if (recognitionRef.current && !isNative) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("[Voice] Error stopping web recognition:", e);
        }
      }
    };
  }, [isNative, showNotification]);

  // ============================================
  // PROCESAR TRANSCRIPCIÓN
  // ============================================
  const processTranscript = useCallback(
    async (text: string) => {
      if (isProcessing) return;

      console.log("[Voice] Processing transcript:", text);
      setIsProcessing(true);

      try {
        // Extraer información del texto
        const expenseData = parseExpense(text);

        if (!expenseData) {
          showNotification?.("❌ No se pudo entender el gasto", "error");
          return;
        }

        console.log("[Voice] Parsed expense:", expenseData);

        // Añadir gasto
        await onAddExpense(expenseData);
        showNotification?.(
          `✅ Añadido: €${expenseData.amount} en ${expenseData.category}`,
          "success"
        );

        // Limpiar
        setTranscript("");
        setInterimTranscript("");

        // Detener escucha después de añadir
        if (isListening) {
          setTimeout(() => {
            toggleListening();
          }, 1000);
        }
      } catch (error) {
        console.error("[Voice] Error adding expense:", error);
        showNotification?.("❌ Error al añadir gasto", "error");
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, onAddExpense, showNotification, isListening]
  );

  // ============================================
  // PARSER DE GASTOS
  // ============================================
  const parseExpense = (text: string) => {
    // Convertir a minúsculas
    const lowerText = text.toLowerCase().trim();

    // Extraer cantidad
    const amountMatch = lowerText.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€)?/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(",", "."));

    // Buscar categoría (palabras clave)
    let category = "Otros";
    let subcategory = null;

    const categoryKeywords = {
      Alimentación: [
        "supermercado",
        "comida",
        "mercado",
        "alimentación",
        "compra",
      ],
      Transporte: [
        "gasolina",
        "combustible",
        "parking",
        "taxi",
        "uber",
        "transporte",
      ],
      Ocio: ["cine", "teatro", "concierto", "entretenimiento", "ocio"],
      Salud: ["farmacia", "médico", "hospital", "salud"],
      Hogar: ["casa", "hogar", "muebles", "decoración"],
      Ropa: ["ropa", "zapatos", "vestir"],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        category = cat;
        break;
      }
    }

    // Fecha (por defecto hoy)
    const date = new Date().toISOString().split("T")[0];

    return {
      amount,
      category,
      subcategory,
      description: `Añadido por voz: ${text}`,
      date,
      paymentMethod: "Tarjeta",
    };
  };

  // ============================================
  // TOGGLE LISTENING
  // ============================================
  const toggleListening = async () => {
    console.log("[Voice] Toggle listening, current state:", isListening);

    // Haptic feedback (nativo)
    if (isNative) {
      try {
        await Haptics.impact({
          style: isListening ? ImpactStyle.Medium : ImpactStyle.Light,
        });
      } catch (error) {
        // Fallback silencioso
      }
    }

    if (isNative) {
      // ============================================
      // CAPACITOR: Plugin nativo
      // ============================================
      if (isListening) {
        console.log("[Voice] Stopping native recognition");
        try {
          await SpeechRecognition.stop();
          setIsListening(false);
          setTranscript("");
          setInterimTranscript("");
        } catch (error) {
          console.error("[Voice] Error stopping native recognition:", error);
        }
      } else {
        console.log("[Voice] Starting native recognition");
        try {
          setTranscript("");
          setInterimTranscript("");

          // Iniciar reconocimiento
          await SpeechRecognition.start({
            language: "es-ES",
            maxResults: 1,
            prompt: 'Di tu gasto (ej: "25 euros en supermercado")',
            partialResults: true,
            popup: false, // No mostrar popup nativo de iOS
          });

          console.log("[Voice] Native recognition started");
          setIsListening(true);

          // Listener de resultados parciales
          await SpeechRecognition.addListener("partialResults", (data: any) => {
            console.log("[Voice] Partial results:", data);
            if (data.matches && data.matches.length > 0) {
              const text = data.matches[0];
              setInterimTranscript(text);
            }
          });

          // Listener de estado
          await SpeechRecognition.addListener("listeningState", (data: any) => {
            console.log("[Voice] Listening state:", data);
            const isListeningState = data.status === 'started';
            setIsListening(isListeningState);
            
            // Cuando se detiene, procesar el texto final
            if (data.status === 'stopped') {
              // Usar el transcript intermedio actual
              setTranscript((prev) => {
                const finalText = interimTranscript || prev;
                if (finalText) {
                  processTranscript(finalText);
                }
                return finalText;
              });
            }
          });
        } catch (error) {
          console.error("[Voice] Error starting native recognition:", error);
          showNotification?.("❌ Error al iniciar micrófono", "error");
          setIsListening(false);
        }
      }
    } else {
      // ============================================
      // WEB/PWA: Web Speech API
      // ============================================
      if (!recognitionRef.current) {
        showNotification?.("❌ Voz no disponible en este navegador", "error");
        return;
      }

      if (isListening) {
        console.log("[Voice] Stopping web recognition");
        recognitionRef.current.stop();
        setIsListening(false);
        setTranscript("");
        setInterimTranscript("");
      } else {
        console.log("[Voice] Starting web recognition");
        try {
          setTranscript("");
          setInterimTranscript("");
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error("[Voice] Error starting web recognition:", error);
          showNotification?.("❌ Error al iniciar micrófono", "error");
        }
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Si voz no disponible, no mostrar botón
  if (!voiceAvailable) {
    console.warn("[Voice] Voice not available, hiding button");
    return null;
  }

  const displayText = transcript + interimTranscript;
  const hasText = displayText.trim().length > 0;

  const voiceExamples = [
    '💡 "25 en supermercado"',
    '💡 "nueve coma sesenta en tabaco"',
    '💡 "50 euros en gasolina"',
  ];

  return (
    <>
      {/* Botón flotante */}
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

      {/* Modal de transcripción */}
      {isListening && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <div
            className={`relative max-w-md w-full rounded-2xl shadow-2xl border backdrop-blur-xl transition-all pointer-events-auto ${
              darkMode
                ? "bg-gray-800/95 border-gray-700/50"
                : "bg-white/95 border-white/50"
            }`}
          >
            {/* Indicador de grabación */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Grabando
              </span>
            </div>

            {/* Contenido */}
            <div className="p-6 pt-12">
              {/* Título */}
              <h3
                className={`text-lg font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                🎤 Di tu gasto
              </h3>

              {/* Transcripción */}
              <div
                className={`min-h-[100px] p-4 rounded-xl mb-4 ${
                  darkMode ? "bg-gray-900/50" : "bg-gray-100"
                }`}
              >
                {hasText ? (
                  <p
                    className={`text-lg ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {displayText}
                  </p>
                ) : (
                  <div>
                    <p
                      className={`text-sm mb-2 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Escuchando...
                    </p>
                    <div className="space-y-1">
                      {voiceExamples.map((example, idx) => (
                        <p
                          key={idx}
                          className={`text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón detener */}
              <button
                onClick={toggleListening}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  darkMode
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Detener
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceExpenseButton;
