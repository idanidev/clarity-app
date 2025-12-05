import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceExpenseButton = memo(({
  darkMode,
  categories,
  addExpense,
  showNotification,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Función para encontrar la mejor categoría
  const findBestCategory = (suggestedCategory, description) => {
    const categoryNames = Object.keys(categories);
    if (categoryNames.length === 0) return null;

    const searchText = (suggestedCategory || description || '').toLowerCase();
    
    // 1. Match exacto (case-insensitive)
    let match = categoryNames.find(
      cat => cat.toLowerCase() === searchText
    );
    if (match) return match;

    // 2. Match parcial (contiene)
    match = categoryNames.find(
      cat => cat.toLowerCase().includes(searchText) || searchText.includes(cat.toLowerCase())
    );
    if (match) return match;

    // 3. Sinónimos comunes
    const synonyms = {
      'comida': ['alimentación', 'alimentos', 'supermercado', 'mercado', 'compras', 'grocery'],
      'transporte': ['transporte', 'gasolina', 'gasoil', 'metro', 'autobús', 'taxi', 'uber', 'cabify'],
      'restaurante': ['restaurante', 'comer', 'cenar', 'bar', 'café', 'cafetería'],
      'ocio': ['ocio', 'entretenimiento', 'cine', 'teatro', 'concierto', 'fiesta'],
      'salud': ['salud', 'médico', 'farmacia', 'hospital', 'dentista'],
      'ropa': ['ropa', 'vestimenta', 'moda', 'zapatos', 'calzado'],
      'casa': ['casa', 'hogar', 'vivienda', 'alquiler', 'hipoteca', 'luz', 'agua', 'gas'],
      'educación': ['educación', 'curso', 'universidad', 'colegio', 'libros'],
      'tecnología': ['tecnología', 'tech', 'ordenador', 'móvil', 'teléfono', 'internet'],
    };

    // Buscar en sinónimos
    for (const [key, values] of Object.entries(synonyms)) {
      if (values.some(syn => searchText.includes(syn))) {
        match = categoryNames.find(cat => 
          cat.toLowerCase().includes(key) || key.includes(cat.toLowerCase())
        );
        if (match) return match;
      }
    }

    // 4. Si no encuentra nada, usar la primera categoría
    return categoryNames[0];
  };

  // Convertir números en texto a números (ej: "nueve coma treinta" -> 9.30)
  const textToNumber = (text) => {
    const numberWords = {
      'cero': 0, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
      'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
      'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
      'dieciséis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19, 'veinte': 20,
      'veintiuno': 21, 'veintidós': 22, 'veintitrés': 23, 'veinticuatro': 24, 'veinticinco': 25,
      'veintiséis': 26, 'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29, 'treinta': 30,
      'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,
      'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300, 'cuatrocientos': 400,
      'quinientos': 500, 'seiscientos': 600, 'setecientos': 700, 'ochocientos': 800, 'novecientos': 900,
      'mil': 1000
    };

    // Buscar patrón "X coma Y" (ej: "nueve coma treinta")
    const comaPattern = /(\w+)\s+coma\s+(\w+)/i;
    const comaMatch = text.match(comaPattern);
    if (comaMatch) {
      const parteEntera = numberWords[comaMatch[1].toLowerCase()] || parseInt(comaMatch[1]);
      const parteDecimal = numberWords[comaMatch[2].toLowerCase()] || parseInt(comaMatch[2]);
      if (parteEntera !== undefined && parteDecimal !== undefined) {
        return parseFloat(`${parteEntera}.${parteDecimal}`);
      }
    }

    // Buscar número simple en texto
    for (const [word, value] of Object.entries(numberWords)) {
      if (text.toLowerCase().includes(word)) {
        return value;
      }
    }

    return null;
  };

  // Detectar gasto directamente desde el texto
  const detectExpenseDirectly = (text) => {
    console.log('🔍 detectExpenseDirectly analizando:', text);
    // Extraer fecha si se menciona "mes pasado", "mes anterior", "ayer", etc.
    let expenseDate = new Date().toISOString().slice(0, 10); // Por defecto hoy
    
    const datePatterns = [
      { pattern: /(?:mes\s+pasado|mes\s+anterior|último\s+mes)/i, offset: (d) => { d.setMonth(d.getMonth() - 1); return d; } },
      { pattern: /ayer/i, offset: (d) => { d.setDate(d.getDate() - 1); return d; } },
      { pattern: /hace\s+(\d+)\s+días?/i, offset: (d, match) => { d.setDate(d.getDate() - parseInt(match[1])); return d; } },
      { pattern: /hace\s+(\d+)\s+meses?/i, offset: (d, match) => { d.setMonth(d.getMonth() - parseInt(match[1])); return d; } },
    ];

    for (const { pattern, offset } of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const d = new Date();
        expenseDate = offset(d, match).toISOString().slice(0, 10);
        console.log('📅 Fecha detectada:', expenseDate);
        break;
      }
    }

    // Patrones más flexibles y naturales (ordenados por especificidad)
    const patterns = [
      // "que X a Y" (ej: "que nueve coma treinta a tabaco") - PATRÓN MÁS COMÚN
      /que\s+(.+?)\s+(?:a|en|de|por)\s+(.+?)(?:\s|$|\.|,|€|euros?)/i,
      // "X a Y" (sin "que", ej: "nueve coma treinta a tabaco")
      /^(.+?)\s+(?:a|en|de|por)\s+(.+?)(?:\s|$|\.|,|€|euros?)/i,
      // "gasto a/en X que me ha costado Y" (ej: "gasto a tabaco que me ha costado nueve coma treinta")
      /gasto\s+(?:a|en|de)\s+(.+?)\s+que\s+me\s+ha\s+costado\s+(.+?)(?:\s|$|\.|,|€|euros?)/i,
      // "gasté 50 euros en supermercado"
      /(?:gast[ée]|gastado|gastando)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|a)\s+(.+?)(?:\s|$|\.|,|del|de\s+el)/i,
      // "gasté X en Y"
      /(?:gast[ée]|gastado|gastando)\s+(.+?)\s+(?:en|de|por|a)\s+(.+?)(?:\s|$|\.|,)/i,
      // "añade 20 euros de transporte"
      /(?:añade?|añad[íi]|añadido)\s+(?:un\s+)?gasto\s+(?:de\s+)?(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|del|de\s+el|a)\s+(.+?)(?:\s|$|\.|,)/i,
      // "pagué 15 euros en restaurante"
      /(?:pagu[ée]|pagado|pagando)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|a)\s+(.+?)(?:\s|$|\.|,)/i,
      // "compré 30 euros en tienda"
      /(?:compr[ée]|comprado|comprando)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|a)\s+(.+?)(?:\s|$|\.|,)/i,
      // "50 euros en comida" (más simple)
      /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s*(?:en|de|por|a)\s+(.+?)(?:\s|$|\.|,)/i,
      // "50 en comida" (sin euros)
      /(\d+(?:[.,]\d+)?)\s+(?:en|de|por|a)\s+(.+?)(?:\s|$|\.|,)/i,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = text.match(pattern);
      if (match) {
        console.log(`✅ Patrón ${i + 1} coincidió:`, match);
        
        let amount = null;
        let description = '';

        // Patrones especiales: "que X a Y" o "X a Y" (cantidad primero)
        if (i === 0 || i === 1) {
          const amountText = match[1].trim();
          description = match[2].trim();
          
          // Intentar convertir número en texto a número
          amount = textToNumber(amountText);
          if (!amount || isNaN(amount)) {
            // Intentar parsear como número normal
            const cleaned = amountText.replace(/[^\d.,]/g, '').replace(',', '.');
            amount = parseFloat(cleaned);
          }
        }
        // Patrón especial: "gasto a X que me ha costado Y" (descripción primero)
        else if (i === 2) {
          description = match[1].trim();
          const amountText = match[2].trim();
          
          // Intentar convertir número en texto a número
          amount = textToNumber(amountText);
          if (!amount || isNaN(amount)) {
            // Intentar parsear como número normal
            const cleaned = amountText.replace(/[^\d.,]/g, '').replace(',', '.');
            amount = parseFloat(cleaned);
          }
        } 
        // Patrones normales: cantidad y descripción
        else if (match[1] && match[2]) {
          const amountText = match[1];
          description = match[2].trim();
          
          // Intentar parsear como número
          amount = parseFloat(amountText.replace(',', '.'));
          
          // Si no es un número, intentar convertir de texto
          if (isNaN(amount)) {
            amount = textToNumber(amountText);
          }
        } else {
          continue;
        }
        
        // Limpiar descripción de referencias temporales y palabras innecesarias
        description = description.replace(/\s*(?:del|de\s+el)\s+mes\s+(?:pasado|anterior)/i, '');
        description = description.replace(/\s*el\s+mes\s+(?:pasado|anterior)/i, '');
        description = description.replace(/\s*(?:que\s+me\s+ha\s+costado|que\s+cost[óo]|de\s+coste)/i, '');
        description = description.trim();
        
        if (amount && !isNaN(amount) && amount > 0 && description) {
          console.log('✅ Gasto detectado:', { amount, description, date: expenseDate });
          return { amount, description, date: expenseDate };
        } else {
          console.log('⚠️ Cantidad o descripción inválida:', { amount, description, isNaN: isNaN(amount) });
        }
      }
    }
    console.log('❌ No se detectó ningún gasto en el texto');
    return null;
  };

  // Categorizar gasto usando IA (prompt mejorado)
  const categorizeWithAI = async (transcription) => {
    try {
      const categoryNames = Object.keys(categories);
      if (categoryNames.length === 0) return null;

      // Preparar categorías con subcategorías para el prompt
      const categoriasUsuario = categoryNames.map(cat => {
        const catData = categories[cat];
        return {
          nombre: cat,
          subcategorias: catData?.subcategories || []
        };
      });

      const voicePrompt = `Eres un experto en categorizar gastos a partir de descripciones de voz.

CATEGORÍAS DISPONIBLES:
${JSON.stringify(categoriasUsuario, null, 2)}

TEXTO TRANSCRITO:
"${transcription}"

TAREA:
Extrae la siguiente información:
1. Monto (convertir "veinte euros" → 20, "dos con cincuenta" → 2.50)
2. Categoría (de la lista disponible, usar la más cercana)
3. Subcategoría (si se menciona o se puede inferir)
4. Descripción limpia (quitar muletillas, ruido)
5. Método de pago (si se menciona: tarjeta, efectivo, transferencia)

FORMATO DE RESPUESTA (JSON estricto):
{
  "amount": number,
  "category": "string",
  "subcategory": "string",
  "description": "string",
  "paymentMethod": "tarjeta|efectivo|transferencia",
  "confidence": 0-100
}

REGLAS:
- Si no estás seguro de la categoría, usa "confidence" bajo
- Normaliza nombres: "super" → "Supermercado", "gasolinera" → "Transporte"
- Si menciona múltiples gastos, solo el primero
- Si no hay categoría clara, usa "${categoryNames[0] || 'Otros'}" con confidence bajo
- Usa EXACTAMENTE los nombres de categoría de la lista (case-sensitive)

Responde SOLO con el JSON, sin texto adicional.`;

      const isDevelopment = import.meta.env.DEV;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const API_URL = isDevelopment 
        ? "/api/ai"
        : `https://europe-west1-${projectId}.cloudfunctions.net/aiProxy`;
      const API_MODEL = "deepseek-chat";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: API_MODEL,
          max_tokens: 200,
          messages: [
            {
              role: "system",
              content: voicePrompt
            },
            {
              role: "user",
              content: transcription
            }
          ],
        }),
      });

      if (!response.ok) {
        console.error('Error en API de categorización:', response.status);
        return null;
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      // Extraer JSON de la respuesta
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      return null;
    } catch (error) {
      console.error('Error categorizando con IA:', error);
      return null;
    }
  };

  // Procesar transcripción y añadir gasto si se detecta
  const processTranscript = useCallback(async (text) => {
    console.log('🔍 processTranscript llamado con:', text);
    if (!text || !addExpense) {
      console.log('⚠️ No hay texto o addExpense no está disponible');
      return;
    }

    setIsProcessing(true);

    try {
      const categoryNames = Object.keys(categories);
      if (categoryNames.length === 0) {
        showNotification?.('No hay categorías configuradas. Crea al menos una categoría primero.', 'error');
        setIsProcessing(false);
        return;
      }

      // Primero intentar detección directa (rápida)
      let expenseData = null;
      const directExpense = detectExpenseDirectly(text);
      
      if (directExpense) {
        console.log('✅ Gasto detectado directamente:', directExpense);
        const matchedCategory = findBestCategory(null, directExpense.description);
        
        if (matchedCategory && categories[matchedCategory]) {
          let matchedSubcategory = '';
          const categoryData = categories[matchedCategory];
          if (categoryData && categoryData.subcategories && Array.isArray(categoryData.subcategories)) {
            const subcategories = categoryData.subcategories;
            if (subcategories.length > 0) {
              const desc = directExpense.description.toLowerCase();
              const subMatch = subcategories.find(sub => {
                if (!sub || typeof sub !== 'string') return false;
                const subLower = sub.toLowerCase();
                return subLower.includes(desc) || desc.includes(subLower);
              });
              if (subMatch) {
                matchedSubcategory = subMatch;
              }
            }
          }

          expenseData = {
            name: directExpense.description,
            amount: directExpense.amount,
            category: matchedCategory,
            subcategory: matchedSubcategory,
            date: directExpense.date || new Date().toISOString().slice(0, 10),
            paymentMethod: 'Tarjeta',
            isRecurring: false,
            recurringId: null,
          };
        }
      }

      // Si la detección directa falló o tiene poca confianza, usar IA
      if (!expenseData) {
        console.log('🤖 Usando IA para categorizar...');
        const aiResult = await categorizeWithAI(text);
        
        if (aiResult && aiResult.amount && aiResult.category && aiResult.confidence >= 50) {
          // Validar que la categoría existe
          const validCategory = categoryNames.find(cat => cat === aiResult.category);
          if (validCategory && categories[validCategory]) {
            let matchedSubcategory = '';
            const categoryData = categories[validCategory];
            if (categoryData && categoryData.subcategories && Array.isArray(categoryData.subcategories)) {
              const subcategories = categoryData.subcategories;
              if (aiResult.subcategory) {
                const subMatch = subcategories.find(sub => 
                  sub && typeof sub === 'string' && sub.toLowerCase() === aiResult.subcategory.toLowerCase()
                );
                if (subMatch) {
                  matchedSubcategory = subMatch;
                }
              }
            }

            expenseData = {
              name: aiResult.description || text.substring(0, 50),
              amount: parseFloat(aiResult.amount),
              category: validCategory,
              subcategory: matchedSubcategory,
              date: new Date().toISOString().slice(0, 10),
              paymentMethod: aiResult.paymentMethod || 'Tarjeta',
              isRecurring: false,
              recurringId: null,
            };
          }
        }
      }

      if (expenseData) {
        await addExpense(expenseData);
        setTranscript('');
        showNotification?.(`✅ Gasto añadido: ${expenseData.amount}€ en ${expenseData.category}${expenseData.subcategory ? ` - ${expenseData.subcategory}` : ''}`, 'success');
        
        // Detener reconocimiento después de añadir el gasto
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } else {
        showNotification?.('No se pudo detectar un gasto válido. Intenta ser más específico.', 'error');
      }
    } catch (error) {
      console.error('Error procesando transcripción:', error);
      showNotification?.('Error al procesar el gasto. Intenta de nuevo.', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [addExpense, categories, showNotification]);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Reconocimiento de voz no disponible en este navegador');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
      console.log('🎤 Reconocimiento de voz iniciado');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interimText += transcript;
        }
      }

      console.log('🎤 Transcripción final:', finalText);
      console.log('🎤 Transcripción provisional:', interimText);

      // Actualizar transcripción provisional en tiempo real
      setInterimTranscript(interimText);

      if (finalText && !isProcessing) {
        const textToProcess = finalText.trim();
        console.log('🎤 Procesando texto:', textToProcess);
        setTranscript(prev => prev + finalText);
        setInterimTranscript(''); // Limpiar provisional
        processTranscript(textToProcess);
      } else if (interimText) {
        console.log('🎤 Esperando transcripción final...');
      }
    };

    recognition.onerror = (event) => {
      console.error('Error en reconocimiento de voz:', event.error);
      
      if (event.error === 'not-allowed') {
        showNotification?.('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración del navegador.', 'error');
      } else if (event.error === 'network') {
        showNotification?.('Error de conexión. Verifica tu conexión a internet.', 'error');
      } else if (event.error === 'no-speech') {
        // Ignorar errores de "no-speech" - es normal cuando no hay audio
        return;
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🎤 Reconocimiento de voz finalizado');
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignorar errores al detener
        }
      }
    };
  }, [processTranscript, isProcessing]);

  const toggleListening = () => {
    console.log('🎤 toggleListening llamado, isListening:', isListening);
    if (!recognitionRef.current) {
      console.error('❌ Reconocimiento de voz no disponible');
      showNotification?.('Reconocimiento de voz no disponible en este navegador.', 'error');
      return;
    }

    if (isListening) {
      console.log('🛑 Deteniendo reconocimiento...');
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
      setInterimTranscript('');
    } else {
      try {
        console.log('▶️ Iniciando reconocimiento...');
        setTranscript('');
        setInterimTranscript('');
        recognitionRef.current.start();
      } catch (error) {
        console.error('❌ Error iniciando reconocimiento:', error);
        showNotification?.('Error al iniciar el reconocimiento de voz. Verifica los permisos del micrófono.', 'error');
      }
    }
  };

  const displayText = transcript + interimTranscript;
  const hasText = displayText.trim().length > 0;

  return (
    <>
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`fixed bottom-40 right-4 z-40 md:hidden p-4 rounded-full shadow-2xl backdrop-blur-xl border transition-all active:scale-95 ${
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
        } ${isProcessing ? 'cursor-wait' : ''}`}
        style={{ bottom: 'calc(9.5rem + env(safe-area-inset-bottom))' }}
        title={isProcessing ? "Añadiendo gasto..." : isListening ? "Detener grabación" : "Añadir gasto por voz"}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
      
      {/* Modal de transcripción en tiempo real */}
      {isListening && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <div 
            className={`relative max-w-md w-full rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
              darkMode
                ? "bg-gray-800/95 border-gray-700/50"
                : "bg-white/95 border-white/50"
            }`}
            style={{
              boxShadow: darkMode
                ? "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
                : "0 20px 60px rgba(31, 38, 135, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.6) inset",
            }}
          >
            {/* Indicador de grabación */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Grabando...
              </span>
            </div>

            {/* Contenido */}
            <div className="p-6 pt-12">
              <div className="flex items-center justify-center mb-4">
                <div className={`p-4 rounded-full ${
                  darkMode ? "bg-red-600/20" : "bg-red-100"
                }`}>
                  <Mic className={`w-8 h-8 ${darkMode ? "text-red-400" : "text-red-600"} animate-pulse`} />
                </div>
              </div>

              <div className="text-center">
                <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {hasText ? "Transcripción:" : "Habla ahora..."}
                </p>
                <div className={`min-h-[60px] p-4 rounded-xl ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                } border ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                  {hasText ? (
                    <p className={`text-lg font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                      {transcript}
                      {interimTranscript && (
                        <span className={`${darkMode ? "text-gray-400" : "text-gray-500"} italic`}>
                          {interimTranscript}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"} italic`}>
                      Esperando tu voz...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador discreto de procesamiento */}
      {isProcessing && (
        <div 
          className="fixed bottom-40 right-16 z-40 md:hidden px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-lg text-xs font-medium transition-all"
          style={{ 
            bottom: 'calc(9.5rem + env(safe-area-inset-bottom))',
            ...(darkMode 
              ? { backgroundColor: 'rgba(107, 114, 128, 0.6)', borderColor: 'rgba(75, 85, 99, 0.4)', color: '#f3f4f6' }
              : { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: 'rgba(255, 255, 255, 0.4)', color: '#7c3aed' }
            )
          }}
        >
          Añadiendo...
        </div>
      )}
    </>
  );
});

VoiceExpenseButton.displayName = 'VoiceExpenseButton';

export default VoiceExpenseButton;

