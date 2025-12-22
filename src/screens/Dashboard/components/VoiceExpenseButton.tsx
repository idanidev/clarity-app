import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { Loader2, Mic, MicOff } from "@/components/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import AudioWaveVisualizer from "../../../components/AudioWaveVisualizer";
import { usePermissions } from "../../../hooks/usePermissions";
import { useHapticFeedback } from "../../../hooks/useHapticFeedback";

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
  silenceTimeout: 10000, // 10 segundos - duplicado para más tiempo
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
  categories?: string[];
  categoriesWithSubcategories?: Record<string, { subcategories?: string[]; color?: string }>;
  voiceSettings?: VoiceSettings;
  isNavbarButton?: boolean;
  hasFilterButton?: boolean;
}

const VoiceExpenseButton = ({
  onAddExpense,
  darkMode,
  showNotification,
  categories = [],
  categoriesWithSubcategories = {},
  voiceSettings = DEFAULT_VOICE_SETTINGS,
  isNavbarButton = false,
  hasFilterButton: _hasFilterButton = false,
}: VoiceExpenseButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 🎯 Mejoras Premium
  const [detectedCategory, setDetectedCategory] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  const recognitionRef = useRef<any>(null);
  const listenersAddedRef = useRef(false);
  const hasDetectedSpeechRef = useRef(false); // 🎯 Track if we've detected any speech yet
  const transcriptRef = useRef(""); // 🎯 Track transcript for closure
  const interimTranscriptRef = useRef(""); // 🎯 Track interim for closure
  const isNative = Capacitor.isNativePlatform();
  // Plataforma no utilizada actualmente, pero se deja Capacitor para detección nativa

  // Mantener siempre los últimos ajustes de voz sin re-crear callbacks
  const voiceSettingsRef = useRef<VoiceSettings>(voiceSettings);
  useEffect(() => {
    voiceSettingsRef.current = voiceSettings;
  }, [voiceSettings]);

  // 👁️ DEBUG: Monitorear cambios de estado del diálogo
  useEffect(() => {
    console.log("👁️ [Voice] STATE CHANGE - showConfirmDialog:", showConfirmDialog, "pendingExpense:", pendingExpense);
  }, [showConfirmDialog, pendingExpense]);



  // ============================================
  // CONFIRMAR Y CANCELAR GASTO
  // ============================================
  const confirmExpenseRef = useRef<() => Promise<void>>();

  confirmExpenseRef.current = async () => {
    if (!pendingExpense) return;

    // 🎯 Validar que la subcategoría esté seleccionada
    if (!pendingExpense.subcategory || pendingExpense.subcategory.trim() === "") {
      showNotification?.("⚠️ Selecciona una subcategoría", "error");
      return;
    }

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

  const confirmExpense = () => confirmExpenseRef.current?.();

  const cancelExpense = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingExpense(null);
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const { microphone } = usePermissions();
  const haptic = useHapticFeedback();
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasWebSpeechAPI =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // ============================================
  // STOP RECORDING HELPER
  // ============================================
  const stopRecording = useCallback(async () => {
    console.log("[Voice] Stopping recording (Silence/Manual)...");

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setIsListening(false);

    if (isNative) {
      try {
        await SpeechRecognition.stop();
        if (listenersAddedRef.current) {
          await SpeechRecognition.removeAllListeners();
          listenersAddedRef.current = false;
        }
      } catch (error) {
        console.error("[Voice] Error stopping native recognition:", error);
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("[Voice] Error stopping web recognition:", error);
      }
    }
  }, [isNative]);

  // ============================================
  // SILENCE TIMER
  // ============================================
  const resetSilenceTimer = useCallback(() => {
    const timeoutMs = voiceSettingsRef.current?.silenceTimeout || 3000;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Solo iniciar timer si estamos escuchando (o a punto de)
    silenceTimerRef.current = setTimeout(() => {
      console.log("[Voice] Silence timeout reached, stopping...");
      stopRecording();
    }, timeoutMs);
  }, [stopRecording]);

  // Log de depuración eliminado para producción

  // ============================================
  // INICIALIZACIÓN (SOLO UNA VEZ)
  // ============================================
  useEffect(() => {
    let mounted = true;

    const checkAvailability = async () => {
      if (isNative) {
        // CAPACITOR:Solo verificar disponibilidad (NO solicitar permisos aquí)
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
        // WEB/PWA:Web Speech API
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

      recognition.onstart = () => {
        console.log("🎤 [Voice] Web recognition STARTED");
        setIsListening(true);
        hasDetectedSpeechRef.current = false; // 🎯 Reset flag
        // ❌ NO iniciar timer aquí - esperar a que hable
      };

      recognition.onresult = (event: any) => {
        console.log("📝 [Voice] Got speech result, event:", event);

        // ✅ Solo iniciar timer DESPUÉS de detectar la primera voz
        if (!hasDetectedSpeechRef.current) {
          console.log("✅ [Voice] First speech detected! Starting silence timer now");
          hasDetectedSpeechRef.current = true;
        }

        resetSilenceTimer(); // Reset timer on speech activity
        let interim = "";
        let final = "";
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const confidence = result[0].confidence || 0;
          maxConfidence = Math.max(maxConfidence, confidence);

          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        // 🎯 Actualizar confianza
        if (maxConfidence > 0) {
          setConfidenceLevel(maxConfidence);
        }

        // 🎯 Detectar categoría en tiempo real
        const currentText = final || interim;
        if (currentText) {
          const parsed = parseExpense(currentText);
          if (parsed) {
            setDetectedCategory(parsed.category || "Sin categoría");
          }
        }

        // Only accumulate transcript, don't process yet
        if (final) {
          setTranscript((prev) => {
            const newVal = (prev + " " + final).trim();
            transcriptRef.current = newVal; // 🎯 Keep ref in sync
            return newVal;
          });
        }
        setInterimTranscript(interim);
        interimTranscriptRef.current = interim; // 🎯 Keep ref in sync
      };

      recognition.onerror = (event: any) => {
        console.log("[Voice] Web Speech error:", event.error);

        // Ignorar errores de no-speech y aborted - no cerramos el modal
        if (event.error === "no-speech" || event.error === "aborted") {
          console.log("[Voice] Ignorando error:", event.error);
          return; // NO cerramos, el usuario debe detener manualmente
        }

        // Solo cerrar para errores reales
        if (event.error === "not-allowed") {
          showNotification?.("❌ Permiso de micrófono denegado", "error");
          stopRecording();
        } else {
          showNotification?.(`❌ Error: ${event.error}`, "error");
          stopRecording();
        }
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        console.log("🛑 [Voice] Recognition ENDED");

        // 🎯 Usar REFS para obtener valores actuales (evitar closure stale)
        const currentTranscript = transcriptRef.current.trim();
        const currentInterim = interimTranscriptRef.current.trim();
        const finalText = (currentTranscript + " " + currentInterim).trim();

        console.log("📊 [Voice] Transcript ref:", currentTranscript);
        console.log("📊 [Voice] Interim ref:", currentInterim);
        console.log("📊 [Voice] Final text:", finalText);

        if (finalText) {
          console.log("✅ [Voice] Processing final text:", finalText);
          setIsListening(false); // Parar para procesar
          processTranscript(finalText);
        } else {
          console.log("[Voice] No text yet, restarting recognition to keep modal open");
          // No hay texto aún, reiniciar el reconocimiento para mantener modal abierto
          // El usuario debe pulsar "Detener" manualmente
          try {
            if (isListening && recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {
            console.log("[Voice] Recognition already running or error:", e);
          }
        }
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

  // 🔄 useEffect para rotar ejemplos mientras escucha
  useEffect(() => {
    if (!isListening) {
      setCurrentExampleIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % 6); // 6 ejemplos
    }, 2500); // Cambiar cada 2.5 segundos

    return () => clearInterval(interval);
  }, [isListening]);

  // ============================================
  // PROCESAR TRANSCRIPCIÓN
  // ============================================

  // ============================================
  // LIMPIAR TEXTO HABLADO
  // ============================================
  const cleanSpokenText = (text: string): string => {
    let cleaned = text.trim();

    // Remover palabras de comando al principio
    const commandWords = [
      /^añádeme\s+/i,
      /^añade\s+/i,
      /^añadir\s+/i,
      /^gasta\s+/i,
      /^gastado\s+/i,
      /^he\s+gastado\s+/i,
      /^compra\s+/i,
      /^comprado\s+/i,
    ];

    commandWords.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Intentar extraer descripción después de "en" o "de"
    const descMatch = cleaned.match(/(?:en|de)\s+(.+)$/i);
    if (descMatch) {
      const description = descMatch[1]
        .replace(/\d+(?:[.,]\d+)?\s*(?:euros?|€)?/gi, '') // Remover cantidad
        .trim();
      if (description) {
        return description.charAt(0).toUpperCase() + description.slice(1);
      }
    }

    // Remover cantidad de cualquier parte del texto
    cleaned = cleaned.replace(/\d+(?:[.,]\d+)?\s*(?:euros?|€)?/gi, '').trim();

    if (cleaned) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Fallback:usar el texto original
    return text.trim();
  };

  // ============================================
  // PARSER DE GASTOS
  // ============================================

  // 🎯 Convertir palabras numéricas en español a dígitos
  const spanishNumberToDigit = (text: string): string => {
    const numberWords: Record<string, number> = {
      // Unidades
      'cero': 0, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
      'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,
      // Decenas
      'diez': 10, 'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14,
      'quince': 15, 'dieciséis': 16, 'dieciseis': 16, 'diecisiete': 17,
      'dieciocho': 18, 'diecinueve': 19,
      'veinte': 20, 'veintiuno': 21, 'veintidos': 22, 'veintitrés': 23,
      'veintitres': 23, 'veinticuatro': 24, 'veinticinco': 25,
      'veintiseis': 26, 'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,
      'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60,
      'setenta': 70, 'ochenta': 80, 'noventa': 90,
      // Centenas
      'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300,
      'cuatrocientos': 400, 'quinientos': 500, 'seiscientos': 600,
      'setecientos': 700, 'ochocientos': 800, 'novecientos': 900,
      // Otros
      'mil': 1000,
    };

    let result = text.toLowerCase();

    // Reemplazar palabras numéricas por dígitos
    Object.entries(numberWords).forEach(([word, digit]) => {
      // Match palabra + posible "y" + otra palabra (ej: "treinta y cinco")
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, String(digit));
    });

    // Manejar "X y Y" patterns (ej: "30 y 5" -> "35")
    result = result.replace(/(\d+)\s+y\s+(\d+)/gi, (_, tens, units) => {
      return String(parseInt(tens) + parseInt(units));
    });

    console.log("🔢 [Voice] Number conversion:", text, "->", result);
    return result;
  };

  const parseExpense = (text: string) => {
    // 🎯 Primero convertir palabras numéricas a dígitos
    const convertedText = spanishNumberToDigit(text);
    const lowerText = convertedText.toLowerCase().trim();

    const amountMatch = lowerText.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€)?/i);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(",", "."));

    // No default a "Otros"-dejar vacío si no se detecta
    let category = "";

    const categoryKeywords = {
      Alimentación: [
        "supermercado",
        "comida",
        "mercado",
        "alimentación",
        "compra",
        "cenas",
        "cena",
        "desayuno",
        "almuerzo",
        "merienda",
        "restaurante",
        "bar",
        "cafetería",
        "café",
        "pizza",
        "comida rápida",
        "burguer",
      ],
      Transporte: [
        "gasolina",
        "combustible",
        "parking",
        "aparcamiento",
        "taxi",
        "uber",
        "cabify",
        "transporte",
        "metro",
        "autobús",
        "bus",
        "tren",
        "peaje",
      ],
      Ocio: [
        "cine",
        "teatro",
        "concierto",
        "entretenimiento",
        "ocio",
        "fiesta",
        "copas",
        "discoteca",
        "cerveza",
        "cervezas",
        "birra",
        "birras",
        "bar",
        "pub",
      ],
      Salud: [
        "farmacia",
        "médico",
        "doctor",
        "hospital",
        "salud",
        "dentista",
      ],
      Hogar: [
        "casa",
        "hogar",
        "muebles",
        "decoración",
        "alquiler",
        "luz",
        "agua",
        "gas",
        "internet",
      ],
      Ropa: [
        "ropa",
        "zapatos",
        "vestir",
        "calzado",
      ],
      Tabaco: [
        "tabaco",
        "cigarros",
        "cigarrillos",
        "estanco",
      ],
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
      category, // Vacío si no se detectó
      subcategory: null,
      name: cleanSpokenText(text), // Texto limpio en lugar de literal
      date,
      paymentMethod: "Tarjeta",
    };
  };



  // ============================================
  // PROCESAR TRANSCRIPCIÓN-NUEVA VERSIÓN CON DIÁLOGO
  // ============================================
  const processTranscript = useCallback(
    async (text: string) => {
      console.log("🔄 [Voice] processTranscript CALLED with:", text);
      console.log("🔄 [Voice] isProcessing:", isProcessing);

      if (isProcessing) {
        console.log("⚠️ [Voice] Already processing, SKIPPING");
        return;
      }

      console.log("✅ [Voice] Starting to process transcript:", text);

      // Indicar que estamos procesando
      setIsProcessing(true);
      console.log("🔄 [Voice] Set isProcessing = true");

      try {
        const expenseData = parseExpense(text);
        console.log("🔍 [Voice] parseExpense returned:", expenseData);

        // Don't show error immediately-give user context via dialog instead
        if (!expenseData) {
          console.log("❌ [Voice] Could not parse expense from:", text);
          setIsProcessing(false);
          showNotification?.("❌ No se pudo entender el gasto", "error");
          setIsListening(false);
          return;
        }

        console.log("✅ [Voice] Successfully parsed expense:", expenseData);

        // ✅ DETENER GRABACIÓN
        setIsListening(false);
        console.log("🛑 [Voice] Set isListening = false");

        // Pequeña pausa para que el usuario vea el feedback
        console.log("⏳ [Voice] Waiting 300ms before showing dialog...");
        await new Promise(resolve => setTimeout(resolve, 300));

        // ✅ Mostrar diálogo de confirmación
        console.log("🎯 [Voice] NOW SHOWING CONFIRMATION DIALOG");
        console.log("🎯 [Voice] Setting pendingExpense to:", expenseData);
        setPendingExpense(expenseData);
        console.log("🎯 [Voice] Setting showConfirmDialog = true");
        setShowConfirmDialog(true);
        console.log("🎯 [Voice] Dialog should be visible now!");

      } catch (error) {
        console.error("💥 [Voice] EXCEPTION in processTranscript:", error);
        showNotification?.("❌ Error al procesar gasto", "error");
        setIsListening(false);
      } finally {
        console.log("🏁 [Voice] processTranscript FINISHED, setting isProcessing = false");
        setIsProcessing(false);
      }
    },
    [isProcessing, showNotification]
  );

  // ============================================
  // TOGGLE LISTENING
  // ============================================
  const toggleListening = async () => {
    console.log("[Voice] Toggle listening, current state:", isListening);

    // Haptic feedback
    if (isNative) {
      try {
        if (isListening) {
          haptic.medium();
        } else {
          haptic.light();
        }
      } catch (error) {
        // Silencioso
      }
    }

    if (isNative) {
      // ============================================
      // CAPACITOR:Plugin nativo
      // ============================================
      if (isListening) {
        await stopRecording();
      } else {
        console.log("[Voice] Starting native recognition");

        // 🎯 Reset speech detection flag
        hasDetectedSpeechRef.current = false;

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
          transcriptRef.current = ""; // 🎯 Reset refs
          interimTranscriptRef.current = ""; // 🎯 Reset refs

          // ✅ Agregar listeners SOLO UNA VEZ
          if (!listenersAddedRef.current) {
            await SpeechRecognition.addListener(
              "partialResults",
              (data: any) => {
                console.log("[Voice] Partial results:", data);

                // ✅ Solo iniciar timer DESPUÉS de detectar la primera voz
                if (!hasDetectedSpeechRef.current && data.matches && data.matches.length > 0) {
                  console.log("✅ [Voice] First speech detected (native)! Starting silence timer now");
                  hasDetectedSpeechRef.current = true;
                }

                resetSilenceTimer(); // Reset timer on speech activity
                if (data.matches && data.matches.length > 0) {
                  const text = data.matches[0];
                  setInterimTranscript(text);
                  interimTranscriptRef.current = text; // 🎯 Keep ref in sync
                }
              }
            );

            await SpeechRecognition.addListener(
              "listeningState",
              (data: any) => {
                console.log("[Voice] Listening state:", data);
                const isListeningState = data.status === "started";
                setIsListening(isListeningState);

                // ❌ NO iniciar timer cuando empieza - esperar a que hable
                // if (isListeningState) {
                //   resetSilenceTimer();
                // }

                if (data.status === "stopped") {
                  if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                  // 🎯 Usar refs para obtener valores actuales
                  const finalText = interimTranscriptRef.current || transcriptRef.current;
                  console.log("📊 [Voice Native] Final text from refs:", finalText);

                  if (finalText) {
                    processTranscript(finalText);
                  }
                }
              }
            );

            listenersAddedRef.current = true;
          }

          await SpeechRecognition.start({
            language: "es-ES",
            maxResults: 1,
            prompt: 'Di tu gasto (ej:"25 euros en supermercado")',
            partialResults: true,
            popup: false,
          });

          console.log("[Voice] Native recognition started");
          setIsListening(true);
          resetSilenceTimer(); // Initial timer
        } catch (error) {
          console.error("[Voice] Error starting native recognition:", error);
          showNotification?.("❌ Error al iniciar micrófono", "error");
          await stopRecording();
        }
      }
    } else {
      // ============================================
      // WEB/PWA:Web Speech API
      // ============================================
      if (!recognitionRef.current) {
        showNotification?.("❌ Voz no disponible en este navegador", "error");
        return;
      }

      if (isListening) {
        await stopRecording();
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
          transcriptRef.current = ""; // 🎯 Reset refs
          interimTranscriptRef.current = ""; // 🎯 Reset refs
          hasDetectedSpeechRef.current = false; // 🎯 Reset flag
          recognitionRef.current.start();
          // isListening will be set in onstart
        } catch (error: any) {
          console.error("[Voice] Error starting web recognition:", error);
          if (error.name === "NotAllowedError") {
            showNotification?.("❌ Permiso de micrófono denegado", "error");
          } else {
            showNotification?.("❌ Error al iniciar micrófono", "error");
          }
          await stopRecording();
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



  // ✅ Renderizado condicional: navbar vs flotante
  if (isNavbarButton) {
    // Modo NAVBAR: compacto, solo icono (igual que botón manual)
    return (
      <>
        {/* Efecto Siri: borde morado que rodea la pantalla */}
        {isListening && (
          <>
            <div
              className="fixed inset-0 pointer-events-none z-50"
              style={{
                border: "4px solid transparent",
                borderImage: "linear-gradient(135deg, #667eea, #764ba2, #f093fb, #667eea) 1",
                animation: "siri-pulse 2s ease-in-out infinite",
              }}
            />
            <style>{`
              @keyframes siri-pulse {
                0%, 100% {
                  border-image: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #667eea) 1;
                  opacity: 0.7;
                }
                50% {
                  border-image: linear-gradient(135deg, #f093fb, #667eea, #764ba2, #f093fb) 1;
                  opacity: 1;
                }
              }
            `}</style>
          </>
        )}

        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`navbar-button flex items-center justify-center p-3 rounded-xl transition-all ${isListening
            ? "bg-gradient-to-br from-pink-600 via-purple-600 to-pink-600 text-white shadow-2xl scale-110 animate-pulse"
            : darkMode
              ? "bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-purple-600/30 text-purple-300 hover:from-purple-600/40 hover:via-pink-600/40 hover:to-purple-600/40 shadow-xl hover:shadow-2xl hover:scale-105"
              : "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500 text-white shadow-xl hover:shadow-2xl hover:scale-105"
            }`}
          style={{
            WebkitTapHighlightColor: "transparent",
            boxShadow: isListening
              ? "0 8px 32px rgba(236, 72, 153, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)"
              : darkMode
                ? "0 8px 24px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                : "0 8px 24px rgba(236, 72, 153, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          }}
          title={isListening ? "Detener grabación" : "Añadir por voz"}
          aria-label={isListening ? "Detener grabación" : "Añadir por voz"}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 animate-pulse" strokeWidth={2.5} />
          ) : (
            <Mic className="w-6 h-6" strokeWidth={2.5} />
          )}
        </button>
      </>
    );
  }

  // Modo FLOTANTE: FAB original
  return (
    <>
      {/* Botón flotante - Premium iOS Style */}
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`group fixed right-4 z-40 p-5 rounded-full
          transform transition-all duration-500 ease-out
          ${isProcessing
            ? "cursor-wait scale-95"
            : isListening
              ? "scale-110 animate-pulse"
              : "hover:scale-110 active:scale-95"
          }
          ${isProcessing
            ? darkMode
              ? "bg-gradient-to-br from-purple-600/50 to-blue-600/50"
              : "bg-gradient-to-br from-purple-500/50 to-blue-500/50"
            : isListening
              ? "bg-gradient-to-br from-red-600 via-pink-600 to-red-600 shadow-2xl shadow-red-500/50"
              : darkMode
                ? "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60"
                : "bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70"
          }
          border-2 ${darkMode ? "border-white/20" : "border-white/30"}
          backdrop-blur-xl`}
        style={{
          bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
        }}
        title={
          isProcessing
            ? "Añadiendo..."
            : isListening
              ? "Detener"
              : "Añadir por voz"
        }
      >
        {/* Gradient glow ring - animado */}
        <div className={`absolute -inset-2 rounded-full blur-xl opacity-60 transition-opacity duration-500
          ${isListening
            ? "bg-gradient-to-r from-red-500 to-pink-500"
            : "bg-gradient-to-r from-purple-500 to-blue-500 group-hover:opacity-80"
          }
          ${isProcessing ? "animate-pulse" : "animate-pulse-slow"}`}
        />

        {/* Icon */}
        <div className="relative z-10">
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </div>
      </button>

      {/* Modal de transcripción - iOS Glassmorphism */}
      {(isListening || isProcessing) && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
        >
          {/* Backdrop con blur */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !isProcessing && stopRecording()}
          />

          {/* Modal Container - Premium Glass Effect */}
          <div
            className={`relative max-w-md w-full rounded-3xl 
              transform transition-all duration-500 ease-out
              ${darkMode
                ? "bg-gray-900/80 border-gray-700/30 shadow-purple-500/20"
                : "bg-white/80 border-white/30 shadow-purple-500/30"
              }
              backdrop-blur-2xl
              border
              shadow-2xl
              ring-1 ring-purple-500/10
              animate-in zoom-in-95 fade-in duration-300`}
          >
            {/* Gradient overlay sutil */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

            {/* Header con estado */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  <span
                    className={`text-xs font-medium ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                  >
                    Procesando...
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  <span
                    className={`text-xs font-semibold ${darkMode ? "text-red-400" : "text-red-600"}`}
                  >
                    Grabando
                  </span>
                </>
              )}
            </div>

            {/* Content */}
            <div className="relative p-8 pt-14">
              {/* Título con emoji */}
              <h3
                className={`text-2xl font-bold mb-6 text-center
                  bg-gradient-to-r ${darkMode
                    ? "from-purple-400 via-blue-400 to-purple-400"
                    : "from-purple-600 via-blue-600 to-purple-600"
                  }
                  bg-clip-text text-transparent
                  animate-pulse-slow`}
              >
                {isProcessing ? "⚙️ Procesando..." : "🎤 Di tu gasto"}
              </h3>

              {/* Onda de Audio - Solo cuando graba */}
              {!isProcessing && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/20">
                  <AudioWaveVisualizer isActive={isListening} darkMode={darkMode} />
                </div>
              )}

              {/* Transcript area */}
              <div
                className={`min-h-[100px] p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-900/50" : "bg-gray-100"
                  } `}
              >
                {(transcript + interimTranscript).trim() ? (
                  <div>
                    <p
                      className={`text-lg mb-3 ${darkMode ? "text-white" : "text-gray-900"
                        } `}
                    >
                      {transcript + interimTranscript}
                    </p>

                    {/* 🎯 Categoría detectada en tiempo real */}
                    {detectedCategory && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} `}>
                          Categoría:
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${detectedCategory && detectedCategory !== "Sin categoría"
                          ? "bg-purple-500 text-white"
                          : "bg-gray-500 text-white"
                          } `}>
                          {detectedCategory}
                        </span>
                      </div>
                    )}

                    {/* ✅ Barra de confianza */}
                    {confidenceLevel > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} `}>
                            Confianza:
                          </span>
                          <span className={`text-xs font-medium ${confidenceLevel > 0.8 ? "text-green-500" :
                            confidenceLevel > 0.5 ? "text-yellow-500" :
                              "text-red-500"
                            } `}>
                            {Math.round(confidenceLevel * 100)}%
                          </span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-300"
                          } `}>
                          <div
                            className={`h-full transition-all duration-300 ${confidenceLevel > 0.8 ? "bg-green-500" :
                              confidenceLevel > 0.5 ? "bg-yellow-500" :
                                "bg-red-500"
                              } `}
                            style={{ width: `${confidenceLevel * 100}% ` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p
                      className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"
                        } `}
                    >
                      Escuchando...
                    </p>
                    {/* 🔄 Ejemplos rotativos */}
                    <div className="space-y-1">
                      {[
                        '💡 "25 en supermercado"',
                        '💡 "Cena con amigos 37€"',
                        '💡 "50 de gasolina"',
                        '💡 "9.60 en tabaco"',
                        '💡 "He gastado 12 en café"',
                        '💡 "18€ en copas"',
                      ].map((example, idx) => (
                        <p
                          key={idx}
                          className={`text-xs transition-opacity duration-300 ${idx === currentExampleIndex
                            ? darkMode ? "text-purple-400 font-medium" : "text-purple-600 font-medium"
                            : "opacity-30"
                            } ${darkMode ? "text-gray-500" : "text-gray-400"} `}
                        >
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de detener - Grande y visible */}
              {!isProcessing && (
                <button
                  onClick={stopRecording}
                  className={`w-full py-4 rounded-2xl font-semibold
                    transition-all duration-300
                    transform hover:scale-[1.02] active:scale-[0.98]
                    ${darkMode
                      ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border-2 border-red-500/40"
                      : "bg-red-500/20 hover:bg-red-500/30 text-red-600 border-2 border-red-500/40"
                    }
                    backdrop-blur-xl`}
                >
                  🛑 Detener grabación
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación - Premium Glass */}
      {(() => {
        console.log("👁️ [Voice] RENDER CHECK - showConfirmDialog:", showConfirmDialog, "pendingExpense:", pendingExpense);
        return showConfirmDialog && pendingExpense;
      })() && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ zIndex: 99999999 }}
            onClick={() => console.log("🖱️ [Voice] Dialog backdrop clicked")}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300"
              onClick={cancelExpense}
            />

            {/* Dialog Container - iOS Glassmorphism */}
            <div
              className={`relative max-w-md w-full rounded-3xl p-8
              transform transition-all duration-500 ease-out
              ${darkMode
                  ? "bg-gray-900/90 border-gray-700/30 shadow-purple-500/20"
                  : "bg-white/90 border-white/40 shadow-purple-500/30"
                }
              backdrop-blur-2xl
              border
              shadow-2xl
              ring-1 ring-purple-500/10
              animate-in zoom-in-95 fade-in duration-300`}
            >
              {/* Gradient overlay  */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

              {/* Content */}
              <div className="relative">
                <h3
                  className={`text-2xl font-bold mb-2 text-center
                  bg-gradient-to-r ${darkMode
                      ? "from-purple-400 to-blue-400"
                      : "from-purple-600 to-blue-600"
                    }
                  bg-clip-text text-transparent`}
                >
                  Confirmar Gasto
                </h3>
                <p
                  className={`text-sm mb-6 text-center ${darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Revisa los datos antes de continuar
                </p>

                {/* Expense details */}
                <div
                  className={`p-5 rounded-2xl mb-6 space-y-4
                  ${darkMode ? "bg-gray-900/50" : "bg-white/50"}
                  backdrop-blur-xl
                  border ${darkMode ? "border-gray-700/30" : "border-white/40"}`}
                >
                  {/* Cantidad editable */}
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                    >
                      Cantidad (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pendingExpense.amount}
                      onChange={(e) =>
                        setPendingExpense({
                          ...pendingExpense,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-sm font-bold ${darkMode
                        ? "bg-gray-900 border-gray-700 text-gray-100"
                        : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  {/* Categoría editable */}
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"
                        } `}
                    >
                      Categoría
                    </label>
                    {categories.length > 0 ? (
                      <select
                        value={pendingExpense.category || ""}
                        onChange={(e) =>
                          setPendingExpense({
                            ...pendingExpense,
                            category: e.target.value,
                            subcategory: "", // 🎯 Reset subcategory when category changes
                          })
                        }
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode
                          ? "bg-gray-900 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      >
                        {!pendingExpense.category && (
                          <option value="">-- Selecciona categoría --</option>
                        )}
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p
                        className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"
                          } `}
                      >
                        {pendingExpense.category}
                      </p>
                    )}
                  </div>

                  {/* Subcategoría - OBLIGATORIA, basada en categoría */}
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"
                        } `}
                    >
                      Subcategoría <span className="text-red-500">*</span>
                    </label>
                    {(() => {
                      const selectedCat = pendingExpense.category;
                      const subcats = categoriesWithSubcategories[selectedCat]?.subcategories || [];

                      if (!selectedCat) {
                        // No hay categoría seleccionada
                        return (
                          <select
                            disabled
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode
                              ? "bg-gray-900 border-gray-700 text-gray-500"
                              : "bg-white border-gray-300 text-gray-400"
                              } focus:outline-none cursor-not-allowed`}
                          >
                            <option value="">-- Selecciona categoría primero --</option>
                          </select>
                        );
                      } else if (subcats.length > 0) {
                        return (
                          <select
                            value={pendingExpense.subcategory || ""}
                            onChange={(e) =>
                              setPendingExpense({
                                ...pendingExpense,
                                subcategory: e.target.value,
                              })
                            }
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode
                              ? "bg-gray-900 border-gray-700 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          >
                            <option value="">-- Selecciona subcategoría --</option>
                            {subcats.map((sub: string) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                        );
                      } else {
                        // Categoría seleccionada pero sin subcategorías definidas
                        return (
                          <select
                            disabled
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode
                              ? "bg-gray-900 border-gray-700 text-gray-500"
                              : "bg-white border-gray-300 text-gray-400"
                              } focus:outline-none cursor-not-allowed`}
                          >
                            <option value="">-- No hay subcategorías para {selectedCat} --</option>
                          </select>
                        );
                      }
                    })()}
                  </div>

                  {/* Descripción editable */}
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"
                        } `}
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
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode
                        ? "bg-gray-900 border-gray-700 text-gray-100"
                        : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  {/* Cancel - Glass button */}
                  <button
                    onClick={cancelExpense}
                    className={`flex-1 py-4 rounded-2xl font-semibold
                    transition-all duration-300
                    transform hover:scale-[1.02] active:scale-[0.98]
                    ${darkMode
                        ? "bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
                        : "bg-gray-900/10 hover:bg-gray-900/20 text-gray-700 hover:text-gray-900"
                      }
                    backdrop-blur-xl
                    border ${darkMode ? "border-gray-700/30" : "border-gray-300/30"}`}
                  >
                    Cancelar
                  </button>

                  {/* Confirm - Gradient button */}
                  <button
                    onClick={confirmExpense}
                    disabled={isProcessing}
                    className={`flex-1 py-4 rounded-2xl font-semibold relative overflow-hidden
                    transform transition-all duration-300
                    hover:scale-[1.02] active:scale-[0.98]
                    ${isProcessing
                        ? "bg-gradient-to-r from-purple-600/50 to-blue-600/50 cursor-wait"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      }
                    text-white
                    shadow-lg ${isProcessing ? "shadow-purple-500/20" : "shadow-green-500/30 hover:shadow-green-500/40"}
                    border-2 border-white/20`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Añadiendo...</span>
                      </div>
                    ) : (
                      "✅ Confirmar"
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
