import { useState, useRef, useEffect, memo } from 'react';
import { Send, Loader2, Sparkles, Check, TrendingUp, Target, Lightbulb, Plus } from 'lucide-react';
import { useTranslation } from '../../../contexts/LanguageContext';

// Hook para detectar el teclado virtual
const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const heightDiff = windowHeight - viewportHeight;
      
      // Si la diferencia es significativa (>150px), asumimos que el teclado está abierto
      if (heightDiff > 150) {
        setKeyboardHeight(heightDiff);
      } else {
        setKeyboardHeight(0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return keyboardHeight;
};

const AIAssistant = memo(({
  darkMode,
  textClass,
  textSecondaryClass,
  expenses = [],
  allExpenses = [],
  categories = {},
  budgets = {},
  categoryTotals = [],
  income = null,
  goals = null,
  recurringExpenses = [],
  addExpense,
  isActive = true, // Indica si la vista está activa
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const keyboardHeight = useKeyboardHeight();

  // Auto-scroll: arriba cuando no hay mensajes, abajo cuando hay mensajes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (messages.length === 0) {
      // Sin mensajes: scroll al inicio (arriba)
      container.scrollTop = 0;
    } else {
      // Con mensajes: scroll al final
      const scrollToEnd = () => {
        container.scrollTop = container.scrollHeight;
      };
      
      // Usar requestAnimationFrame para asegurar que el DOM está actualizado
      requestAnimationFrame(() => {
        scrollToEnd();
        // Intentos adicionales con delays
        setTimeout(scrollToEnd, 100);
        setTimeout(scrollToEnd, 300);
        setTimeout(scrollToEnd, 500);
      });
    }
  }, [messages, isLoading, keyboardHeight]);

  // Auto-focus mejorado para PWA y diferentes navegadores
  useEffect(() => {
    if (!isActive) return; // Solo hacer focus si la vista está activa

    const focusInput = () => {
      const input = inputRef.current;
      if (!input) return;

      // Estrategia 1: Focus directo (funciona en Chrome, Firefox)
      try {
        input.focus();
      } catch (e) {
        console.log('Focus directo falló:', e);
      }

      // Estrategia 2: Click programático (mejor para Safari iOS)
      // Safari iOS a veces requiere un click real para permitir el focus
      setTimeout(() => {
        try {
          input.click();
          input.focus();
        } catch (e) {
          console.log('Click + focus falló:', e);
        }
      }, 50);

      // Estrategia 3: Focus con scrollIntoView (ayuda en algunos casos)
      setTimeout(() => {
        try {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input.focus();
        } catch (e) {
          console.log('ScrollIntoView + focus falló:', e);
        }
      }, 150);

      // Estrategia 4: Para Safari iOS en PWA, a veces necesitamos esperar más
      // y usar requestAnimationFrame
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            input.focus();
            // Forzar el teclado en iOS (si es posible)
            if (input.setSelectionRange) {
              input.setSelectionRange(0, 0);
            }
          } catch (e) {
            console.log('Focus final falló:', e);
          }
        }, 200);
      });
    };

    // Delay inicial para asegurar que el DOM está listo
    const timer = setTimeout(focusInput, 100);
    
    // También intentar cuando la vista se vuelve visible (útil para PWA)
    if (document.visibilityState === 'visible') {
      setTimeout(focusInput, 300);
    }

    return () => clearTimeout(timer);
  }, [isActive]); // Ejecutar cuando isActive cambia

  // Detectar cuando la ventana/PWA se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);


  // Preparar contexto del usuario para la IA
  const prepareUserContext = () => {
    // Usar todos los gastos (allExpenses) para el contexto completo
    const allUserExpenses = (allExpenses && allExpenses.length > 0) ? allExpenses : expenses;
    const totalExpenses = allUserExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const expenseCount = allUserExpenses.length;
    
    // Información del día actual
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthProgress = ((currentDay / daysInMonth) * 100).toFixed(1);

    // Calcular gastos del mes actual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    
    const monthlyExpenses = allUserExpenses.filter(exp => {
      if (!exp.date) return false;
      // Manejar formato YYYY-MM-DD
      const expDateStr = exp.date.substring(0, 7); // YYYY-MM
      return expDateStr === currentMonthStr;
    });
    const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calcular gastos del mes pasado
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthStr = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}`;
    
    const lastMonthExpenses = allUserExpenses.filter(exp => {
      if (!exp.date) return false;
      // Manejar formato YYYY-MM-DD
      const expDateStr = exp.date.substring(0, 7); // YYYY-MM
      return expDateStr === lastMonthStr;
    });
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calcular gastos por mes (últimos 6 meses)
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthExpenses = allUserExpenses.filter(exp => {
        if (!exp.date) return false;
        return exp.date.substring(0, 7) === monthStr;
      });
      const monthTotal = monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      monthlyBreakdown.push({
        month: monthStr,
        total: monthTotal,
        count: monthExpenses.length
      });
    }

    // Información de categorías - Recalcular desde todos los gastos para contexto correcto
    const categoryNames = Object.keys(categories);
    
    // Calcular totales de categorías desde todos los gastos (no solo filtrados)
    const allCategoryTotals = allUserExpenses.reduce((acc, exp) => {
      if (!exp.category) return acc;
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
      return acc;
    }, {});
    
    // Calcular totales del mes actual por categoría
    const monthlyCategoryTotals = monthlyExpenses.reduce((acc, exp) => {
      if (!exp.category) return acc;
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
      return acc;
    }, {});
    
    // Calcular total del mes para porcentajes
    const totalMonthly = monthlyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const categoryInfo = Object.entries(monthlyCategoryTotals)
      .map(([category, monthlyTotal]) => {
        const budget = budgets[category];
        const totalHistorical = allCategoryTotals[category] || 0;
        const percentage = totalMonthly > 0 ? ((monthlyTotal / totalMonthly) * 100).toFixed(1) : 0;
        return {
          name: category,
          total: monthlyTotal, // Total del mes actual
          totalHistorical: totalHistorical, // Total histórico para referencia
          percentage,
          budget: budget || null,
          budgetUsed: budget ? ((monthlyTotal / budget) * 100).toFixed(1) : null
        };
      })
      .filter(c => c.total > 0) // Solo categorías con gastos este mes
      .sort((a, b) => b.total - a.total);

    // Información de ingresos
    const incomeInfo = income ? {
      monthly: income,
      annual: income * 12,
      availableThisMonth: income - monthlyTotal
    } : null;

    // Información de objetivos
    const goalsInfo = goals ? {
      totalSavingsGoal: goals.totalSavingsGoal || null,
      monthlySavingsGoal: goals.monthlySavingsGoal || null,
      categoryGoals: goals.categoryGoals || {},
      longTermGoals: goals.longTermGoals || []
    } : null;

    // Información de gastos recurrentes
    const recurringInfo = recurringExpenses.length > 0 ? {
      total: recurringExpenses.length,
      active: recurringExpenses.filter(r => r.active !== false).length,
      monthlyTotal: recurringExpenses
        .filter(r => r.active !== false && r.frequency === 'monthly')
        .reduce((sum, r) => sum + (r.amount || 0), 0)
    } : null;

    return {
      totalExpenses,
      expenseCount,
      monthlyTotal,
      monthlyCount: monthlyExpenses.length,
      lastMonthTotal,
      lastMonthCount: lastMonthExpenses.length,
      monthlyBreakdown,
      categories: categoryInfo,
      categoryNames,
      hasBudgets: Object.keys(budgets).length > 0,
      income: incomeInfo,
      goals: goalsInfo,
      recurring: recurringInfo,
      allExpensesCount: allUserExpenses.length,
      currentDay,
      daysInMonth,
      monthProgress
    };
  };

  // Función mejorada para encontrar la categoría más apropiada
  // IMPORTANTE: Devuelve la clave EXACTA que existe en categories (case-sensitive)
  const findBestCategory = (suggestedCategory, description) => {
    const categoryNames = Object.keys(categories);
    if (categoryNames.length === 0) return null;

    const searchText = (suggestedCategory || description || '').toLowerCase().trim();
    if (!searchText) return categoryNames[0]; // Si no hay texto, usar la primera
    
    // 1. Match exacto (case-insensitive) - devolver la clave EXACTA
    let match = categoryNames.find(
      cat => cat.toLowerCase() === searchText
    );
    if (match) {
      // Validar que existe en categories
      if (categories[match]) return match;
    }

    // 2. Match parcial (contiene) - devolver la clave EXACTA
    match = categoryNames.find(
      cat => {
        const catLower = cat.toLowerCase();
        return (catLower.includes(searchText) || searchText.includes(catLower)) && categories[cat];
      }
    );
    if (match) return match;

    // 3. Sinónimos comunes - buscar y devolver la clave EXACTA
    const synonyms = {
      'comida': ['alimentación', 'alimentos', 'supermercado', 'mercado', 'compras', 'grocery'],
      'transporte': ['transporte', 'gasolina', 'gasoil', 'metro', 'autobús', 'taxi', 'uber', 'cabify'],
      'restaurante': ['restaurante', 'comer', 'cenar', 'bar', 'café', 'cafetería'],
      'ocio': ['ocio', 'entretenimiento', 'cine', 'teatro', 'concierto', 'fiesta'],
      'salud': ['salud', 'médico', 'farmacia', 'hospital', 'dentista'],
      'ropa': ['ropa', 'vestimenta', 'moda', 'zapatos', 'calzado'],
      'casa': ['casa', 'hogar', 'vivienda', 'alquiler', 'hipoteca', 'luz', 'agua', 'gas'],
      'hogar': ['casa', 'hogar', 'vivienda', 'alquiler', 'hipoteca', 'luz', 'agua', 'gas'],
      'educación': ['educación', 'curso', 'universidad', 'colegio', 'libros'],
      'tecnología': ['tecnología', 'tech', 'ordenador', 'móvil', 'teléfono', 'internet'],
      'tabaco': ['tabaco', 'cigarrillos', 'cigarrillo', 'puros'],
    };

    // Buscar en sinónimos
    for (const [key, values] of Object.entries(synonyms)) {
      if (values.some(syn => searchText.includes(syn))) {
        // Buscar categoría que coincida con la clave del sinónimo
        match = categoryNames.find(cat => {
          const catLower = cat.toLowerCase();
          return (catLower.includes(key) || key.includes(catLower)) && categories[cat];
        });
        if (match) return match;
      }
    }

    // 4. Si no encuentra nada, usar la primera categoría válida
    return categoryNames.find(cat => categories[cat]) || categoryNames[0];
  };

  // Detectar gasto directamente desde el texto (sin IA)
  const detectExpenseDirectly = (text) => {
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
        break;
      }
    }

    // Patrones comunes: "gasté 50€ en X", "añade 20€ de X", "pagué 15€ en X", etc.
    const patterns = [
      /(?:gast[ée]|gastado|gastando)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por)\s+(.+?)(?:\s|$|\.|,)/i,
      /(?:añade?|añad[íi]|añadido)\s+(?:un\s+)?gasto\s+(?:de\s+)?(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por|del|de\s+el)\s+(.+?)(?:\s|$|\.|,)/i,
      /(?:pagu[ée]|pagado|pagando)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por)\s+(.+?)(?:\s|$|\.|,)/i,
      /(?:compr[ée]|comprado|comprando)\s+(?:€|euros?)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?\s*(?:en|de|por)\s+(.+?)(?:\s|$|\.|,)/i,
      /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s*(?:en|de|por)\s+(.+?)(?:\s|$|\.|,)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(',', '.'));
        let description = match[2].trim();
        
        // Limpiar descripción de referencias temporales
        description = description.replace(/\s*(?:del|de\s+el)\s+mes\s+(?:pasado|anterior)/i, '');
        description = description.replace(/\s*el\s+mes\s+(?:pasado|anterior)/i, '');
        
        if (amount > 0 && description) {
          return { amount, description, date: expenseDate };
        }
      }
    }
    return null;
  };

  // Procesar respuesta de IA para detectar acciones
  const processAIResponse = async (aiResponse) => {
    // Buscar patrón [ACTION:{...}]
    const actionMatch = aiResponse.match(/\[ACTION:(.*?)\]/s);
    
    if (!actionMatch) {
      return aiResponse; // No hay acción, devolver respuesta normal
    }

    try {
      const actionData = JSON.parse(actionMatch[1]);
      
      if (actionData.type === 'ADD_EXPENSE' && addExpense) {
        // Verificar que hay categorías
        const categoryNames = Object.keys(categories);
        if (categoryNames.length === 0) {
          return aiResponse.replace(/\[ACTION:.*?\]/s, '') + '\n\n⚠️ No puedo añadir el gasto porque no hay categorías configuradas. Ve a Categorías y crea al menos una categoría primero.';
        }

        // Buscar categoría mejorada
        const matchedCategory = findBestCategory(
          actionData.category,
          actionData.description || actionData.name
        );

        // Validar que la categoría existe y es válida
        if (!matchedCategory || !categories[matchedCategory]) {
          console.error('❌ Categoría no válida:', matchedCategory, 'Categorías disponibles:', Object.keys(categories));
          return aiResponse.replace(/\[ACTION:.*?\]/s, '') + '\n\n⚠️ No se pudo encontrar una categoría apropiada. Por favor, verifica que la categoría existe.';
        }

        // Buscar subcategoría si existe
        let matchedSubcategory = '';
        const categoryData = categories[matchedCategory];
        if (categoryData && categoryData.subcategories && Array.isArray(categoryData.subcategories)) {
          const subcategories = categoryData.subcategories;
          if (subcategories.length > 0) {
            const desc = (actionData.description || actionData.name || '').toLowerCase();
            const subMatch = subcategories.find(sub => {
              if (!sub || typeof sub !== 'string') return false;
              const subLower = sub.toLowerCase();
              return subLower.includes(desc) || desc.includes(subLower);
            });
            if (subMatch) {
              matchedSubcategory = subMatch; // Usar la subcategoría exacta del array
            }
          }
        }

        // Preparar objeto de gasto
        const expenseData = {
          name: actionData.description || actionData.name || 'Gasto añadido desde chat',
          amount: parseFloat(actionData.amount) || 0,
          category: matchedCategory,
          subcategory: matchedSubcategory,
          date: actionData.date || new Date().toISOString().slice(0, 10),
          paymentMethod: 'Tarjeta',
          isRecurring: false,
          recurringId: null,
        };

        // Añadir el gasto
        await addExpense(expenseData);

        // Eliminar el comando de la respuesta visible
        const cleanResponse = aiResponse.replace(/\[ACTION:.*?\]/s, '').trim();
        
        // Retornar respuesta con indicador de acción exitosa
        return {
          content: cleanResponse,
          action: 'expense_added',
          expenseData
        };
      }
    } catch (error) {
      console.error('Error procesando acción de IA:', error);
      // Si falla el parsing, devolver respuesta sin el comando
      return aiResponse.replace(/\[ACTION:.*?\]/s, '');
    }

    // Si no es ADD_EXPENSE, devolver respuesta normal sin el comando
    return aiResponse.replace(/\[ACTION:.*?\]/s, '');
  };

  // Enviar mensaje a la IA
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    // MODO RÁPIDO: Detectar gasto directamente sin usar IA (ahorra tokens)
    const directExpense = detectExpenseDirectly(userMessage);
    if (directExpense && addExpense) {
      const categoryNames = Object.keys(categories);
      if (categoryNames.length > 0) {
        const matchedCategory = findBestCategory(null, directExpense.description);
        
        // Validar que la categoría existe y es válida
        if (!matchedCategory || !categories[matchedCategory]) {
          console.error('❌ Categoría no válida en modo rápido:', matchedCategory, 'Categorías disponibles:', categoryNames);
          // Continuar con la IA si falla la detección directa
        } else {
          // Buscar subcategoría
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
                matchedSubcategory = subMatch; // Usar la subcategoría exacta del array
              }
            }
          }

          const expenseData = {
            name: directExpense.description,
            amount: directExpense.amount,
            category: matchedCategory,
            subcategory: matchedSubcategory,
            date: directExpense.date || new Date().toISOString().slice(0, 10),
            paymentMethod: 'Tarjeta',
            isRecurring: false,
            recurringId: null,
          };

          try {
            await addExpense(expenseData);
            setInput('');
            setMessages(prev => [...prev, 
              { role: 'user', content: userMessage },
              { 
                role: 'assistant', 
                content: `✅ ¡Gasto añadido! ${directExpense.amount}€ en ${matchedCategory}${matchedSubcategory ? ` - ${matchedSubcategory}` : ''}`,
                action: 'expense_added',
                expenseData
              }
            ]);
            return;
          } catch (error) {
            console.error('Error añadiendo gasto:', error);
            // Si falla, continuar con la IA
          }
        }
      }
    }

    // Si no se detectó gasto directo, usar IA
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const context = prepareUserContext();
      
      // ========================================
      // OPCIÓN A: DeepSeek (MÁS BARATO) - RECOMENDADO
      // ========================================
      // En desarrollo: usar proxy de Vite
      // En producción: usar Cloud Function
      const isDevelopment = import.meta.env.DEV;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const API_URL = isDevelopment 
        ? "/api/ai"  // Proxy de Vite en desarrollo
        : `https://europe-west1-${projectId}.cloudfunctions.net/aiProxy`; // Cloud Function en producción
      const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
      const API_MODEL = "deepseek-chat";
      
      // ========================================
      // OPCIÓN B: Claude Sonnet 4 (ACTUAL)
      // ========================================
      // const API_URL = isDevelopment 
      //   ? "/api/ai-claude"
      //   : "https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/aiProxyClaude";
      // const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
      // const API_MODEL = "claude-sonnet-4-20250514";
      
      // ========================================
      // OPCIÓN C: OpenAI GPT-4o mini
      // ========================================
      // const API_URL = isDevelopment 
      //   ? "/api/ai-openai"
      //   : "https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/aiProxyOpenAI";
      // const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
      // const API_MODEL = "gpt-4o-mini";

      // Construir prompt del sistema mejorado con análisis estructurado
      const gastosPrevios = context.monthlyBreakdown.map(m => `${m.month}: €${m.total.toFixed(2)}`).join(', ');
      const categoriasFrecuentes = context.categories.slice(0, 5).map(c => c.name).join(', ');
      const presupuestoPromedio = context.income?.monthly || 0;
      const mesActual = new Date().toISOString().slice(0, 7);

      const systemPrompt = `Eres un asistente financiero experto en análisis de gastos personales.

CONTEXTO DEL USUARIO:
- Gastos históricos (últimos 6 meses): ${gastosPrevios}
- Categorías más frecuentes este mes: ${categoriasFrecuentes}
- Presupuesto mensual promedio: €${presupuestoPromedio.toFixed(2)}
- Mes actual: ${mesActual}
- Día del mes: ${context.currentDay} de ${context.daysInMonth} (${context.monthProgress}% transcurrido)

TAREAS PRINCIPALES:
1. Analizar patrones de gasto y proporcionar insights valiosos
2. Estimar gasto total del mes y proyecciones por categoría
3. Alertar si va a superar presupuestos
4. **AÑADIR GASTOS AUTOMÁTICAMENTE** cuando el usuario mencione un gasto
5. Responder preguntas específicas sobre finanzas personales

💰 CUANDO EL USUARIO MENCIONE UN GASTO:
Ejemplos: "gasté 50€ en supermercado", "añade 20€ de transporte", "pagué 15€ en farmacia"
- Responde de forma natural, amigable y breve (1-2 párrafos)
- Al final de tu respuesta, SIEMPRE añade este comando exacto:
  [ACTION:{"type":"ADD_EXPENSE","amount":"50.00","category":"Alimentación","description":"supermercado","date":"${new Date().toISOString().slice(0, 10)}"}]

📋 REGLAS PARA AÑADIR GASTOS:
1. Cantidad (amount): Extrae el número del mensaje, formato decimal con 2 decimales (ej: "50.00")
2. Categoría: Usa EXACTAMENTE uno de estos nombres (case-sensitive, sin cambios):
   ${context.categoryNames.map(c => `- "${c}"`).join('\n   ')}
   ⚠️ NO inventes categorías. Si no encaja, usa: "${context.categoryNames[0] || 'General'}"
3. Descripción (description): Extrae del mensaje del usuario, máximo 50 caracteres
4. Fecha: Si menciona "mes pasado", "ayer", "hace X días", calcula la fecha. Si no, usa: ${new Date().toISOString().slice(0, 10)}

📊 ANÁLISIS Y PROYECCIONES:

REGLAS DE CÁLCULO:
- Para gastos recurrentes: multiplicar por frecuencia (mensual = 1x, trimestral = 0.33x, etc.)
- Considerar estacionalidad (Navidad, verano, etc.) si hay datos históricos
- Si faltan datos o estamos a principios de mes (día 1-15), indicar "confianza: baja" en proyecciones
- No inventar categorías, solo usar las del usuario

ESTIMACIONES ACTUALES:
- Total este mes hasta ahora: €${context.monthlyTotal.toFixed(2)} en ${context.monthlyCount} gastos
- Proyección mensual estimada: €${(context.monthlyTotal * (context.daysInMonth / context.currentDay)).toFixed(2)} (${context.monthProgress < 50 ? 'confianza: baja' : context.monthProgress < 75 ? 'confianza: media' : 'confianza: alta'})
- Mes pasado: €${context.lastMonthTotal.toFixed(2)} en ${context.lastMonthCount} gastos

📁 CATEGORÍAS ESTE MES (ordenadas por gasto):
${context.categories.slice(0, 8).map((c, i) => {
  const proyeccion = (c.total * (context.daysInMonth / context.currentDay));
  const confianza = context.monthProgress < 50 ? 'baja' : context.monthProgress < 75 ? 'media' : 'alta';
  return `${i + 1}. ${c.name}: €${c.total.toFixed(2)} (proyección: €${proyeccion.toFixed(2)}, confianza: ${confianza})${c.budget ? ` | Presupuesto: €${c.budget} (${c.budgetUsed}% usado)${proyeccion > c.budget ? ' ⚠️ ALERTA: Superará presupuesto' : ''}` : ''}`;
}).join('\n')}

${context.income ? `💵 INGRESOS:
- Mensuales: €${context.income.monthly.toFixed(2)}
- Disponible este mes: €${context.income.availableThisMonth.toFixed(2)} ${context.income.availableThisMonth < 0 ? '⚠️ (negativo)' : '✅'}
- Ahorro hasta ahora: €${(context.income.monthly - context.monthlyTotal).toFixed(2)} (${context.monthProgress}% del mes)` : '⚠️ Ingresos no configurados'}

${context.goals ? `🎯 OBJETIVOS:
${context.goals.totalSavingsGoal ? `- Ahorro total: €${context.goals.totalSavingsGoal.toFixed(2)}` : ''}
${context.goals.monthlySavingsGoal ? `- Ahorro mensual objetivo: €${context.goals.monthlySavingsGoal.toFixed(2)} | Ahorro actual: €${((context.income?.monthly || 0) - context.monthlyTotal).toFixed(2)}` : ''}
${Object.keys(context.goals.categoryGoals || {}).length > 0 ? `- Límites por categoría: ${Object.entries(context.goals.categoryGoals).slice(0, 3).map(([cat, limit]) => `${cat}: €${limit.toFixed(2)}`).join(', ')}` : ''}` : ''}

${context.recurring ? `🔄 GASTOS RECURRENTES:
- ${context.recurring.active} activos de ${context.recurring.total} total
- Total mensual estimado: €${context.recurring.monthlyTotal.toFixed(2)}` : ''}

💬 ESTILO DE RESPUESTA:
- Sé conciso: máximo 2-3 párrafos
- Usa emojis relevantes (💰📊💡✅⚠️)
- Da consejos específicos basados en los datos
- Sé positivo y motivador
- Si hay problemas, sugiere soluciones concretas
- Cuando hagas proyecciones, indica el nivel de confianza (alta/media/baja)

⚠️ REGLAS IMPORTANTES:
1. Si el usuario menciona un gasto, SIEMPRE añade [ACTION:...] al final
2. Usa EXACTAMENTE los nombres de categoría de la lista (case-sensitive)
3. **NO felicites por cumplir objetivos mensuales si estamos a principios de mes** (día 1-15). Solo menciona el progreso actual.
4. **Sé realista**: A principios de mes, los datos pueden cambiar mucho. Sé cauteloso con predicciones y marca confianza "baja".
5. **Proyecciones**: Si mencionas proyecciones, aclara que son estimaciones basadas en el ritmo actual e indica confianza.
6. **Alertas**: Si una categoría va a superar su presupuesto, menciona la alerta claramente.
7. Sé específico y práctico en tus consejos
8. Si hay problemas financieros, sugiere soluciones concretas`;

      // Validar que hay API key configurada (solo en desarrollo, en producción la Cloud Function la tiene)
      if (isDevelopment && !API_KEY) {
        throw new Error('API_KEY_NOT_CONFIGURED');
      }

      // Preparar headers según el entorno
      const headers = {
        "Content-Type": "application/json",
      };
      
      // En desarrollo, el proxy de Vite añade la API key automáticamente
      // En producción, la Cloud Function maneja la autenticación
      if (!isDevelopment && API_KEY) {
        headers["Authorization"] = `Bearer ${API_KEY}`;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: API_MODEL,
          max_tokens: 1000,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userMessage
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || errorData.error?.code || `Error ${response.status}`;
        console.error('Error de API:', errorMessage, errorData);
        throw new Error(`API_ERROR: ${errorMessage}`);
      }

      const data = await response.json();
      
      // Extraer respuesta según el formato de la API
      let aiResponseText = '';
      if (data.choices && data.choices[0]) {
        // Formato OpenAI/DeepSeek
        aiResponseText = data.choices[0].message?.content || '';
      } else if (data.content && Array.isArray(data.content)) {
        // Formato Claude
        aiResponseText = data.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');
      } else if (data.content && typeof data.content === 'string') {
        aiResponseText = data.content;
      }

      if (!aiResponseText) {
        console.error('Respuesta de API sin contenido:', data);
        throw new Error('API_RESPONSE_EMPTY');
      }

      // Procesar respuesta para detectar acciones
      const processedResponse = await processAIResponse(aiResponseText);

      if (typeof processedResponse === 'object' && processedResponse.action === 'expense_added') {
        // Gasto añadido exitosamente
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: processedResponse.content,
          action: 'expense_added',
          expenseData: processedResponse.expenseData
        }]);
      } else {
        // Respuesta normal sin acción
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: typeof processedResponse === 'string' ? processedResponse : aiResponseText
        }]);
      }

    } catch (error) {
      console.error('Error al comunicar con la IA:', error);
      
      let errorMessage = t('aiAssistant.error') || 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.';
      
      // Mensajes de error más específicos
      if (error.message === 'API_KEY_NOT_CONFIGURED') {
        errorMessage = '⚠️ La API key no está configurada. Por favor, configura VITE_DEEPSEEK_API_KEY en tu archivo .env para usar el asistente.';
      } else if (error.message.includes('API_ERROR')) {
        const apiError = error.message.replace('API_ERROR: ', '');
        if (apiError.includes('401') || apiError.includes('Unauthorized')) {
          errorMessage = '⚠️ API key inválida. Por favor, verifica tu configuración.';
        } else if (apiError.includes('402') || apiError.includes('Payment Required') || apiError.includes('Insufficient Balance')) {
          errorMessage = '💰 Saldo insuficiente en tu cuenta de DeepSeek. Por favor, añade crédito en https://platform.deepseek.com o verifica tu saldo.';
        } else if (apiError.includes('429') || apiError.includes('rate limit')) {
          errorMessage = '⚠️ Límite de peticiones alcanzado. Por favor, intenta más tarde.';
        } else {
          errorMessage = `⚠️ Error de API: ${apiError}`;
        }
      } else if (error.message === 'API_RESPONSE_EMPTY') {
        errorMessage = '⚠️ La API no devolvió una respuesta válida. Por favor, intenta de nuevo.';
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  // Calcular altura dinámica considerando el teclado y la barra de navegación
  // La barra de navegación tiene 5.5rem de altura
  // El input del chat está fijo, así que necesitamos espacio para él
  const navBarHeight = 5.5; // rem
  const inputAreaHeight = 4; // rem (altura aproximada del input + padding)
  
  const containerHeight = keyboardHeight > 0 
    ? `calc(100vh - ${keyboardHeight}px - ${navBarHeight}rem - ${inputAreaHeight}rem)`
    : `calc(100vh - ${navBarHeight}rem - ${inputAreaHeight}rem)`;

  return (
    <div className="h-full flex flex-col px-0 md:px-0" style={{
      height: containerHeight,
      maxHeight: containerHeight,
      paddingTop: 0,
      paddingBottom: keyboardHeight > 0 ? `${inputAreaHeight}rem` : `${inputAreaHeight}rem`, // Espacio para input fijo
      marginTop: 0,
      marginBottom: 0,
    }}>
      {/* Chat Container */}
      <div className={`rounded-lg md:rounded-xl border ${
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      } overflow-hidden flex flex-col h-full`}>
        
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-1 md:px-4 py-0.5 md:py-2 space-y-2 md:space-y-4" 
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            minHeight: 0,
            maxHeight: '100%',
            paddingTop: 0,
            // Menos padding cuando no hay mensajes (bienvenida), más cuando hay mensajes
            paddingBottom: messages.length === 0 ? '1rem' : `${inputAreaHeight}rem`,
          }}>
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="flex flex-col items-center text-center px-1 md:px-4 pt-1 md:pt-4">
              <div className="flex items-center justify-center gap-1.5 md:gap-3 mb-1.5 md:mb-3">
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-purple-500 flex-shrink-0" />
                <h3 className={`text-sm md:text-xl font-semibold ${textClass}`}>
                  {t('aiAssistant.welcome') || '¡Hola! Soy tu asistente financiero'}
                </h3>
              </div>
              <p className={`text-[10px] md:text-sm ${textSecondaryClass} max-w-md mx-auto px-1 mb-2 md:mb-4`}>
                {t('aiAssistant.welcomeDesc') || 'Puedo ayudarte a analizar tus gastos, darte consejos personalizados, responder tus preguntas sobre finanzas y añadir gastos por ti.'}
              </p>

              {/* Capabilities - Versión compacta */}
              <div className="grid grid-cols-2 gap-1.5 md:gap-3 w-full max-w-md px-1">
                {(t('aiAssistant.capabilities') || [
                  { icon: 'TrendingUp', text: 'Analizar patrones de gasto' },
                  { icon: 'Plus', text: 'Añadir gastos por texto' },
                  { icon: 'Target', text: 'Comparar con presupuestos' },
                  { icon: 'Lightbulb', text: 'Dar consejos personalizados' }
                ]).map((capability, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-1 md:gap-2 p-1 md:p-2 rounded-lg ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    {capability.icon === 'TrendingUp' && <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />}
                    {capability.icon === 'Plus' && <Plus className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />}
                    {capability.icon === 'Target' && <Target className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />}
                    {capability.icon === 'Lightbulb' && <Lightbulb className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />}
                    <span className={`text-[9px] md:text-xs ${textClass} break-words leading-tight`}>{capability.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <>
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[80%] rounded-xl md:rounded-2xl px-2.5 md:px-4 py-1.5 md:py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : darkMode
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-[11px] md:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    {message.action === 'expense_added' && (
                      <div className="mt-2 flex items-center gap-2 text-green-500 text-xs font-medium">
                        <Check className="w-4 h-4" />
                        <span>Gasto añadido correctamente</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading Animation */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`rounded-2xl px-4 py-3 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area - Fijo arriba del teclado */}
        <div className={`border-t p-1 md:p-4 flex-shrink-0 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} md:relative`} style={{
          position: 'fixed',
          bottom: keyboardHeight > 0 
            ? `${keyboardHeight}px` 
            : `calc(${navBarHeight}rem + env(safe-area-inset-bottom))`,
          left: '0.125rem',
          right: '0.125rem',
          paddingLeft: '0.375rem',
          paddingRight: '0.375rem',
          paddingTop: '0.375rem',
          paddingBottom: keyboardHeight > 0 
            ? '0.375rem' 
            : `max(0.375rem, env(safe-area-inset-bottom))`,
          zIndex: 50,
          backdropFilter: 'blur(10px)',
          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '0.75rem 0.75rem 0 0',
        }}>
          <div className="flex gap-1 md:gap-2">
            <input
              ref={inputRef}
              type="text"
              autoFocus // Fallback HTML nativo
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('aiAssistant.placeholder') || 'Pregúntame sobre tus gastos...'}
              disabled={isLoading}
              className={`flex-1 px-2 md:px-4 py-1.5 md:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-[12px] md:text-base ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } disabled:opacity-50`}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-2 md:px-4 py-1.5 md:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
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
    </div>
  );
});

AIAssistant.displayName = 'AIAssistant';

export default AIAssistant;

