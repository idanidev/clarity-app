import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";

// ============================================
// TYPES & INTERFACES
// ============================================
export interface VoiceSettings {
  autoConfirm: boolean;
  vibration: boolean;
  showSuggestions: boolean;
  silenceTimeout: number;
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
  silenceTimeout: 3000,
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
  showNotification?: (
    message: string,
    type: "success" | "error" | "info"
  ) => void;
  hasFilterButton?: boolean;
  categories?: string[];
  voiceSettings?: VoiceSettings;
}

const VoiceExpenseButton = ({
  onAddExpense,
  darkMode,
  showNotification,
  hasFilterButton = false,
  categories = [],
  voiceSettings = DEFAULT_VOICE_SETTINGS,
}: VoiceExpenseButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const recognitionRef = useRef<any>(null);
  const listenersAddedRef = useRef(false);
  const isNative = Capacitor.isNativePlatform();
  // Plataforma no utilizada actualmente, pero se deja Capacitor para detección nativa

  // Mantener siempre los últimos ajustes de voz sin re-crear callbacks
  const voiceSettingsRef = useRef<VoiceSettings>(voiceSettings);
  useEffect(() => {
    voiceSettingsRef.current = voiceSettings;
  }, [voiceSettings]);

  const { microphone } = usePermissions();

  const hasWebSpeechAPI =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // Log de depuración eliminado para producción

  // ============================================
  // INICIALIZACIÓN (SOLO UNA VEZ)
  // ============================================
  useEffect(() => {
    let mounted = true;

    const checkAvailability = async () => {
      if (isNative) {
        // CAPACITOR: Solo verificar disponibilidad (NO solicitar permisos aquí)
        try {
          const availableResult = await SpeechRecognition.available();
          const available = availableResult?.available ?? false;
          console.log("[Voice] Native speech available:", available);

          if (mounted) {
            setVoiceAvailable(available);
          }
        } catch (error: any) {
          console.error("[Voice] Error checking native speech:", error);
          if (mounted) {
            setVoiceAvailable(false);
          }
        }
      } else {
        // WEB/PWA: Web Speech API
        if (hasWebSpeechAPI && mounted) {
          setVoiceAvailable(true);
          initWebSpeech();
        }
      }
    };

    const initWebSpeech = () => {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-ES";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + " " + final);
          processTranscript(final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.error("[Voice] Web Speech error:", event.error);
        if (event.error === "not-allowed") {
          showNotification?.("❌ Permiso de micrófono denegado", "error");
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          showNotification?.(`❌ Error: ${event.error}`, "error");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    };

    checkAvailability();

      return () => {
      mounted = false;

      if (recognitionRef.current && !isNative) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("[Voice] Error stopping web recognition:", e);
        }
      }

      if (isNative && listenersAddedRef.current) {
        try {
          SpeechRecognition.removeAllListeners();
        } catch (e) {
          console.error("[Voice] Error removing listeners:", e);
        }
        listenersAddedRef.current = false;
      }
    };
  }, []);

  // ============================================
  // PROCESAR TRANSCRIPCIÓN
  // ============================================

  // ============================================
  // PARSER DE GASTOS
  // ============================================
  const parseExpense = (text: string) => {
    const lowerText = text.toLowerCase().trim();

    const amountMatch = lowerText.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€)?/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(",", "."));

    let category = "Otros";

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

    const date = new Date().toISOString().split("T")[0];

    return {
      amount,
      category,
      subcategory: null,
      name: `Añadido por voz: ${text}`,
      date,
      paymentMethod: "Tarjeta",
    };
  };

  // ============================================
  // CONFIRMAR GASTO
  // ============================================
  const confirmExpense = async () => {
    if (!pendingExpense) return;

    setIsProcessing(true);
    try {
      await onAddExpense(pendingExpense);
      showNotification?.(
        `✅ Añadido: €${pendingExpense.amount.toFixed(2)} en ${pendingExpense.category}`,
        "success"
      );
      setShowConfirmDialog(false);
      setPendingExpense(null);
      setTranscript("");
      setInterimTranscript("");
    } catch (error) {
      console.error("[Voice] Error adding expense:", error);
      showNotification?.("❌ Error al añadir gasto", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // CANCELAR
  // ============================================
  const cancelExpense = () => {
    setShowConfirmDialog(false);
    setPendingExpense(null);
    setTranscript("");
    setInterimTranscript("");
  };

  // ============================================
  // PROCESAR TRANSCRIPCIÓN - NUEVA VERSIÓN CON DIÁLOGO
  // ============================================
  const processTranscript = useCallback(
    async (text: string) => {
      if (isProcessing) return;

      console.log("[Voice] Processing transcript:", text);

      try {
        const expenseData = parseExpense(text);

        if (!expenseData) {
          showNotification?.("❌ No se pudo entender el gasto", "error");
          return;
        }

        console.log("[Voice] Parsed expense:", expenseData);

        // ✅ DETENER GRABACIÓN INMEDIATAMENTE
        if (isListening) {
          setIsListening(false);
          if (isNative) {
            try {
              await SpeechRecognition.stop();
              if (listenersAddedRef.current) {
                await SpeechRecognition.removeAllListeners();
                listenersAddedRef.current = false;
              }
            } catch (error) {
              console.error("[Voice] Error stopping recognition:", error);
            }
          } else if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }

        const currentSettings = voiceSettingsRef.current;

        // ✅ Si está activada la confirmación automática, guardar sin mostrar diálogo
        if (currentSettings?.autoConfirm) {
          setIsProcessing(true);
          try {
            await onAddExpense(expenseData);
            showNotification?.(
              `✅ Añadido: €${expenseData.amount.toFixed(2)} en ${expenseData.category}`,
              "success"
            );
            setPendingExpense(null);
            setTranscript("");
            setInterimTranscript("");
          } catch (error) {
            console.error("[Voice] Error adding expense (auto-confirm):", error);
            showNotification?.("❌ Error al añadir gasto", "error");
          } finally {
            setIsProcessing(false);
          }
        } else {
          // ✅ MOSTRAR DIÁLOGO DE CONFIRMACIÓN
          setPendingExpense(expenseData);
          setShowConfirmDialog(true);
        }

      } catch (error) {
        console.error("[Voice] Error parsing expense:", error);
        showNotification?.("❌ Error al procesar gasto", "error");
      }
    },
    [isProcessing, isListening, showNotification, isNative, onAddExpense]
  );

  // ============================================
  // TOGGLE LISTENING
  // ============================================
  const toggleListening = async () => {
    console.log("[Voice] Toggle listening, current state:", isListening);

    // Haptic feedback
    if (isNative) {
      try {
        await Haptics.impact({
          style: isListening ? ImpactStyle.Medium : ImpactStyle.Light,
        });
      } catch (error) {
        // Silencioso
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

          // ✅ Limpiar listeners al detener
          if (listenersAddedRef.current) {
            await SpeechRecognition.removeAllListeners();
            listenersAddedRef.current = false;
          }
        } catch (error) {
          console.error("[Voice] Error stopping native recognition:", error);
        }
      } else {
        console.log("[Voice] Starting native recognition");

        // ✅ Solicitar permisos SOLO cuando se presiona el botón
        try {
          const permission = await SpeechRecognition.requestPermissions();
          const hasPermission = permission?.speechRecognition === "granted";

          if (!hasPermission) {
            showNotification?.("❌ Permiso de micrófono denegado", "error");
            return;
          }

          setTranscript("");
          setInterimTranscript("");

          // ✅ Agregar listeners SOLO UNA VEZ
          if (!listenersAddedRef.current) {
            await SpeechRecognition.addListener(
              "partialResults",
              (data: any) => {
                console.log("[Voice] Partial results:", data);
                if (data.matches && data.matches.length > 0) {
                  const text = data.matches[0];
                  setInterimTranscript(text);
                }
              }
            );

            await SpeechRecognition.addListener(
              "listeningState",
              (data: any) => {
                console.log("[Voice] Listening state:", data);
                const isListeningState = data.status === "started";
                setIsListening(isListeningState);

                if (data.status === "stopped") {
                  setTranscript((prev) => {
                    const finalText = interimTranscript || prev;
                    if (finalText) {
                      processTranscript(finalText);
                    }
                    return finalText;
                  });
                }
              }
            );

            listenersAddedRef.current = true;
          }

          await SpeechRecognition.start({
            language: "es-ES",
            maxResults: 1,
            prompt: 'Di tu gasto (ej: "25 euros en supermercado")',
            partialResults: true,
            popup: false,
          });

          console.log("[Voice] Native recognition started");
          setIsListening(true);
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
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("[Voice] Error stopping:", e);
        }
        setIsListening(false);
        setTranscript("");
        setInterimTranscript("");
      } else {
        console.log("[Voice] Starting web recognition");
        try {
          // ✅ Verificar estado del permiso primero
          const micStatus = microphone.status;
          console.log("[Voice] Microphone permission status:", micStatus);

          if (micStatus === "denied" || microphone.permanentlyDenied) {
            showNotification?.(
              "❌ Permiso de micrófono denegado. Habilítalo en la configuración.",
              "error"
            );
            return;
          }

          // ✅ Si el permiso no está concedido, solicitarlo SOLO cuando el usuario presiona el botón
          if (micStatus !== "granted") {
            console.log("[Voice] Requesting microphone permission...");
            const granted = await microphone.request();
            if (!granted) {
              showNotification?.("❌ Permiso de micrófono necesario para usar la voz", "error");
              return;
            }
          }

          setTranscript("");
          setInterimTranscript("");
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error: any) {
          console.error("[Voice] Error starting web recognition:", error);
          if (error.name === "NotAllowedError") {
            showNotification?.("❌ Permiso de micrófono denegado", "error");
          } else {
            showNotification?.("❌ Error al iniciar micrófono", "error");
          }
        }
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================
  const shouldShowButton = isNative ? voiceAvailable : hasWebSpeechAPI;

  if (!shouldShowButton) {
    return null;
  }


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
        className={`fixed right-4 z-40 p-4 rounded-full shadow-2xl backdrop-blur-xl border transition-all active:scale-95 ${
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
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
          style={{ zIndex: 9999999 }}
        >
          <div
            className={`relative max-w-md w-full rounded-2xl shadow-2xl border backdrop-blur-xl transition-all pointer-events-auto ${
              darkMode
                ? "bg-gray-800/95 border-gray-700/50"
                : "bg-white/95 border-white/50"
            }`}
          >
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

            <div className="p-6 pt-12">
              <h3
                className={`text-lg font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                🎤 Di tu gasto
              </h3>

              <div
                className={`min-h-[100px] p-4 rounded-xl mb-4 ${
                  darkMode ? "bg-gray-900/50" : "bg-gray-100"
                }`}
              >
                {(transcript + interimTranscript).trim() ? (
                  <p
                    className={`text-lg ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {transcript + interimTranscript}
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

      {/* ✅ DIÁLOGO DE CONFIRMACIÓN */}
      {showConfirmDialog && pendingExpense && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 99999999 }}
        >
          <div
            className={`max-w-md w-full rounded-2xl shadow-2xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-xl font-bold mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                ✅ ¿Añadir este gasto?
              </h3>
              <p
                className={`text-xs mb-4 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Ejemplos que puedes decir:{" "}
                <span className="font-medium">
                  “20€ en cenas con amigos”, “Compra del super 45€”, “Gasolina 60€”
                </span>
              </p>

              <div
                className={`p-4 rounded-xl mb-6 space-y-4 ${
                  darkMode ? "bg-gray-900/50" : "bg-gray-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Cantidad
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    €{pendingExpense.amount.toFixed(2)}
                  </span>
                </div>

                {/* Categoría editable */}
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Categoría
                  </label>
                  {categories.length > 0 ? (
                    <select
                      value={pendingExpense.category || categories[0]}
                      onChange={(e) =>
                        setPendingExpense({
                          ...pendingExpense,
                          category: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {pendingExpense.category}
                    </p>
                  )}
                </div>

                {/* Subcategoría editable (texto libre) */}
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Subcategoría (opcional)
                  </label>
                  <input
                    type="text"
                    value={pendingExpense.subcategory || ""}
                    onChange={(e) =>
                      setPendingExpense({
                        ...pendingExpense,
                        subcategory: e.target.value,
                      })
                    }
                    placeholder="Ej: Cenas, Netflix, Farmacia..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                {/* Descripción editable */}
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={pendingExpense.name || ""}
                    onChange={(e) =>
                      setPendingExpense({
                        ...pendingExpense,
                        name: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? "bg-gray-900 border-gray-700 text-gray-100"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={cancelExpense}
                  disabled={isProcessing}
                  className={`min-w-[120px] py-3 rounded-xl font-medium transition-colors ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmExpense}
                  disabled={isProcessing}
                  className="min-w-[120px] py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Añadir"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceExpenseButton;
