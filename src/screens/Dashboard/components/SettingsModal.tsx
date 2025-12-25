import { useState, useEffect } from "react";
import { Bell, DollarSign, Globe, Moon, Sun, X, Calendar, RotateCcw, Mic, Shield, CheckCircle2, AlertCircle, ChevronRight } from "@/components/icons";
import { useLanguage, useTranslation } from "../../../contexts/LanguageContext";
import { restoreCategoriesFromExpenses } from "../../../services/firestoreService";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";
import VoiceSettingsPanel from "./VoiceSettingsPanel";
import { VoiceSettings, DEFAULT_VOICE_SETTINGS } from "./VoiceExpenseButton";
import { requestNotificationPermissions, scheduleExpenseReminder, cancelAllNotifications, areNotificationsEnabled } from "../../../services/notifications";
import { isNative } from "../../../utils/platform";
import { usePermissions } from "../../../hooks/usePermissions";
import type { NotificationSettings } from "../../../types/dashboard";

interface SettingsModalProps {
  visible: boolean;
  darkMode: boolean;
  cardClass: string;
  textClass: string;
  textSecondaryClass: string;
  toggleDarkMode: () => void;
  onClose: () => void;
  income: number | null;
  onSaveIncome: (income: number | null) => void;
  notificationSettings?: Partial<NotificationSettings>;
  onSaveNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void> | void;
  onRequestPushPermission?: () => void;
  showNotification: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  userId?: string;
  voiceSettings?: VoiceSettings;
  onSaveVoiceSettings?: (settings: VoiceSettings) => void;
  isAdmin?: boolean;
}

type ActiveTab = "general" | "notifications" | "voice" | "permissions" | "admin";

const SettingsModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  toggleDarkMode,
  onClose,
  income,
  onSaveIncome,
  notificationSettings,
  onSaveNotificationSettings,
  onRequestPushPermission,
  showNotification,
  userId,
  isAdmin = false,
  voiceSettings = DEFAULT_VOICE_SETTINGS,
  onSaveVoiceSettings,
}: SettingsModalProps) => {
  const { t } = useTranslation();
  const { language, changeLanguage, availableLanguages } = useLanguage();
  const [localIncome, setLocalIncome] = useState<number | string>(() => {
    // Si income es null, undefined o 0, mostrar campo vacío
    if (income === null || income === undefined || income === 0) {
      return "";
    }
    return income;
  });

  // Actualizar localIncome cuando cambie income desde fuera
  useEffect(() => {
    if (income === null || income === undefined || income === 0) {
      setLocalIncome("");
    } else {
      setLocalIncome(income);
    }
  }, [income]);

  const [localNotificationSettings, setLocalNotificationSettings] = useState<NotificationSettings>(() => {
    const defaultSettings: NotificationSettings = {
      budgetAlerts: { enabled: true, at80: true, at90: true, at100: true },
      recurringReminders: { enabled: true },
      customReminders: { enabled: true, message: "No olvides registrar tus gastos", hour: 20, minute: 0 },
      weeklyReminder: { enabled: true, dayOfWeek: 0, hour: 21, minute: 0, message: "¡No olvides registrar tus gastos de esta semana en Clarity!" },
      monthlyIncomeReminder: { enabled: true, dayOfMonth: 28 },
      pushNotifications: { enabled: false },
    };

    if (notificationSettings) {
      // Asegurar que customReminders tenga hour y minute
      if (notificationSettings.customReminders) {
        defaultSettings.customReminders = {
          ...defaultSettings.customReminders,
          ...notificationSettings.customReminders,
          hour: notificationSettings.customReminders.hour ?? 20,
          minute: notificationSettings.customReminders.minute ?? 0,
        };
      }
      // Asegurar que weeklyReminder tenga hour y minute
      if (notificationSettings.weeklyReminder) {
        defaultSettings.weeklyReminder = {
          ...defaultSettings.weeklyReminder,
          ...notificationSettings.weeklyReminder,
          hour: notificationSettings.weeklyReminder.hour ?? 21,
          minute: notificationSettings.weeklyReminder.minute ?? 0,
        };
      }
      // Asegurar que monthlyIncomeReminder tenga dayOfMonth
      if (notificationSettings.monthlyIncomeReminder) {
        defaultSettings.monthlyIncomeReminder = {
          ...defaultSettings.monthlyIncomeReminder,
          ...notificationSettings.monthlyIncomeReminder,
          dayOfMonth: notificationSettings.monthlyIncomeReminder.dayOfMonth ?? 28,
        };
      }
      return {
        ...defaultSettings,
        ...notificationSettings,
        customReminders: defaultSettings.customReminders,
        weeklyReminder: defaultSettings.weeklyReminder,
        monthlyIncomeReminder: defaultSettings.monthlyIncomeReminder,
      };
    }

    return defaultSettings;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [localVoiceSettings, setLocalVoiceSettings] = useState<VoiceSettings>(voiceSettings);
  const [isRestoring, setIsRestoring] = useState(false);
  const [nativeNotificationsEnabled, setNativeNotificationsEnabled] = useState(false);
  const [checkingNativeNotifications, setCheckingNativeNotifications] = useState(false);
  const { microphone, notifications } = usePermissions(userId);

  const statusLabel = (status: string) => {
    switch (status) {
      case "granted":
        return "Concedido";
      case "denied":
        return "Denegado";
      case "prompt":
        return "Pendiente";
      case "unsupported":
        return "No soportado";
      default:
        return status;
    }
  };

  // Deshabilitar scroll del body cuando el modal está abierto
  useDisableBodyScroll(visible);

  // Verificar estado de notificaciones nativas al montar
  useEffect(() => {
    if (isNative && visible && activeTab === "notifications") {
      areNotificationsEnabled().then((enabled) => {
        setNativeNotificationsEnabled(enabled);
      });
    }
  }, [visible, activeTab]);

  if (!visible) {
    return null;
  }

  const handleRestoreCategories = async () => {
    if (!userId) {
      showNotification("Error: No se pudo identificar el usuario", "error");
      return;
    }

    if (isRestoring) {
      return;
    }

    setIsRestoring(true);
    try {
      showNotification("Restaurando categorías desde tus gastos...", "info");
      const result = await restoreCategoriesFromExpenses(userId);

      if (result.success) {
        showNotification(
          `✅ ${result.message}. Total: ${result.total} categorías`,
          "success"
        );
      } else {
        showNotification(result.message || "No se pudieron restaurar las categorías", "error");
      }
    } catch (error) {
      console.error("Error al restaurar categorías:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      showNotification("Error al restaurar categorías: " + errorMessage, "error");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveIncome = () => {
    // Si está vacío o es 0, guardar null (no configurado)
    const incomeToSave = localIncome === "" || localIncome === 0 || localIncome === "0" ? null : parseFloat(String(localIncome));
    onSaveIncome(incomeToSave);
  };

  const handleSaveNotifications = () => {
    onSaveNotificationSettings(localNotificationSettings);
  };

  const handleSaveVoiceSettings = () => {
    if (onSaveVoiceSettings) {
      onSaveVoiceSettings(localVoiceSettings);
      showNotification("✅ Ajustes de voz guardados", "success");
    }
  };

  const handleToggleNativeNotifications = async () => {
    if (checkingNativeNotifications) return;

    setCheckingNativeNotifications(true);
    try {
      if (!nativeNotificationsEnabled) {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleExpenseReminder(20); // 20:00
          setNativeNotificationsEnabled(true);
          showNotification("✅ Notificaciones nativas activadas", "success");
        } else {
          showNotification("❌ Permisos de notificaciones denegados", "error");
        }
      } else {
        await cancelAllNotifications();
        setNativeNotificationsEnabled(false);
        showNotification("✅ Notificaciones nativas desactivadas", "success");
      }
    } catch (error) {
      console.error("Error toggling native notifications:", error);
      showNotification("❌ Error al cambiar notificaciones", "error");
    } finally {
      setCheckingNativeNotifications(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 9999999 }}
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[90vh] flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${darkMode
            ? "bg-gray-800/95 border-b border-gray-700"
            : "bg-white/80 border-b border-purple-100"
            } backdrop-blur`}
        >
          <h3 className={`text-2xl font-bold ${textClass}`}>
            {t("settings.title")}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
              } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        {/* Tabs - Diseño moderno mejorado */}
        <div className={`px-4 sm:px-6 pt-4 pb-0 border-b ${darkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6 flex-nowrap">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all whitespace-nowrap flex items-center justify-center min-h-[44px] flex-shrink-0 ${activeTab === "general"
                ? darkMode
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : darkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
            >
              {t("settings.general")}
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center gap-2 whitespace-nowrap justify-center min-h-[44px] flex-shrink-0 ${activeTab === "notifications"
                ? darkMode
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : darkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
            >
              <Bell className="w-4 h-4" />
              {t("settings.notifications")}
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center gap-2 whitespace-nowrap justify-center min-h-[44px] flex-shrink-0 ${activeTab === "voice"
                ? darkMode
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : darkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
            >
              <Mic className="w-4 h-4" />
              Entrada por voz
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center gap-2 whitespace-nowrap justify-center min-h-[44px] flex-shrink-0 ${activeTab === "permissions"
                ? darkMode
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : darkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
            >
              <Shield className="w-4 h-4" />
              Permisos
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center gap-2 whitespace-nowrap justify-center min-h-[44px] flex-shrink-0 ${activeTab === "admin"
                  ? darkMode
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : darkMode
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-6">
          {activeTab === "general" && (
            <>
              {/* Ingresos */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <DollarSign
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                      {t("settings.income")}
                    </p>
                    <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-0.5 sm:mt-1`}>
                      {t("settings.incomeDescription")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={localIncome}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir string vacío o valores numéricos válidos
                      if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setLocalIncome(value === "" ? "" : parseFloat(value));
                      }
                    }}
                    className={`flex-1 px-3 sm:px-4 py-2 text-base rounded-lg border ${darkMode
                      ? "bg-gray-800 border-gray-600 text-gray-100"
                      : "bg-white border-purple-200 text-purple-900"
                      } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                    placeholder="Ingresa tus ingresos mensuales"
                  />
                </div>
              </div>

              {/* Tema */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {darkMode ? (
                      <Moon
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                          }`}
                      />
                    ) : (
                      <Sun
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                          }`}
                      />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                        {darkMode
                          ? t("settings.darkMode")
                          : t("settings.lightMode")}
                      </p>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                        {t("settings.changeTheme")}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={toggleDarkMode}
                      className="sr-only peer"
                      aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-purple-500" : "bg-gray-500/60"
                        }`}
                    />
                    <div
                      className={`
                        absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform
                        ${darkMode ? "translate-x-6" : "translate-x-0"}
                      `}
                    />
                  </label>
                </div>
              </div>

              {/* Idioma */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Globe
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                      {t("settings.language")}
                    </p>
                    <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-0.5 sm:mt-1`}>
                      {t("settings.languageDescription")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap mt-2 sm:mt-3">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${language === lang.code
                        ? darkMode
                          ? "bg-purple-600 text-white"
                          : "bg-purple-600 text-white"
                        : darkMode
                          ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                          : "bg-white text-gray-700 hover:bg-purple-100 border border-gray-200"
                        }`}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Restaurar Categorías */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <RotateCcw
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                      Restaurar categorías desde gastos
                    </p>
                    <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-0.5 sm:mt-1`}>
                      Recupera las categorías y subcategorías que usaste en tus gastos
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRestoreCategories}
                  disabled={isRestoring}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${isRestoring
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : darkMode
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                >
                  {isRestoring ? "Restaurando..." : "Restaurar categorías"}
                </button>
              </div>

              {/* Acerca de */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <p className={`text-sm sm:text-base font-medium ${textClass}`}>{t("settings.about")}</p>
                <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-0.5 sm:mt-1`}>
                  {t("settings.version")} 2.0.1 - Gestión de gastos personales
                </p>
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              {/* Notificaciones Push (activar permisos) */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Bell
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                        Activar notificaciones push
                      </p>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                        Pulsa este botón para conceder permisos en iOS y registrar este dispositivo para recibir recordatorios.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestPushPermission) {
                        onRequestPushPermission();
                      }
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-purple-600 text-white text-xs sm:text-sm font-medium hover:bg-purple-700 transition-all flex-shrink-0"
                  >
                    Activar
                  </button>
                </div>
                <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                  Si ya concediste permisos, este botón puede reintentar el registro del dispositivo si algo falló.
                </p>
              </div>

              {/* Notificaciones Nativas (solo en iOS/Android) */}
              {isNative && (
                <div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Bell
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                          }`}
                      />
                      <div className="min-w-0">
                        <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                          Recordatorios diarios (nativo)
                        </p>
                        <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                          Recibe una notificación diaria a las 20:00 para recordarte registrar tus gastos
                        </p>
                      </div>
                    </div>
                    <label
                      className={`relative inline-block w-12 h-6 cursor-pointer ${checkingNativeNotifications ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={nativeNotificationsEnabled}
                        onChange={handleToggleNativeNotifications}
                        disabled={checkingNativeNotifications}
                        className="sr-only peer"
                      />
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${nativeNotificationsEnabled ? "bg-purple-500" : "bg-gray-500/60"
                          }`}
                      />
                      <div
                        className={`
                          absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform
                          ${nativeNotificationsEnabled ? "translate-x-6" : "translate-x-0"}
                        `}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Recordatorio Semanal */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Calendar
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                        {t("settings.weeklyReminder")}
                      </p>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                        {t("settings.weeklyReminderDescription")}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localNotificationSettings.weeklyReminder?.enabled ?? false}
                      onChange={() => {
                        setLocalNotificationSettings({
                          ...localNotificationSettings,
                          weeklyReminder: {
                            ...localNotificationSettings.weeklyReminder,
                            enabled: !(localNotificationSettings.weeklyReminder?.enabled ?? false),
                          },
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors ${localNotificationSettings.weeklyReminder?.enabled
                        ? "bg-purple-500"
                        : "bg-gray-500/60"
                        }`}
                    />
                    <div
                      className={`
                        absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform
                        ${localNotificationSettings.weeklyReminder?.enabled ? "translate-x-6" : "translate-x-0"}
                      `}
                    />
                  </label>
                </div>
                {localNotificationSettings.weeklyReminder?.enabled && (
                  <div className="mt-3 sm:mt-4 pl-0 sm:pl-8 space-y-2 sm:space-y-3">
                    <div>
                      <label className={`block text-xs sm:text-sm font-medium ${textClass} mb-1.5 sm:mb-2`}>
                        {t("settings.weeklyReminderDay")}
                      </label>
                      <select
                        value={localNotificationSettings.weeklyReminder?.dayOfWeek ?? 0}
                        onChange={(e) => {
                          setLocalNotificationSettings({
                            ...localNotificationSettings,
                            weeklyReminder: {
                              enabled: localNotificationSettings.weeklyReminder?.enabled ?? false,
                              ...localNotificationSettings.weeklyReminder,
                              dayOfWeek: parseInt(e.target.value),
                            },
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`w-full px-3 sm:px-4 py-2 text-base rounded-lg border ${darkMode
                          ? "bg-gray-800 border-gray-600 text-gray-100"
                          : "bg-white border-purple-200 text-purple-900"
                          } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                      >
                        <option value="0">Domingo</option>
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                        <option value="6">Sábado</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className={`block text-xs sm:text-sm font-medium ${textClass} mb-1.5 sm:mb-2`}>
                          Hora
                        </label>
                        <select
                          value={localNotificationSettings.weeklyReminder?.hour ?? 21}
                          onChange={(e) => {
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              weeklyReminder: {
                                enabled: localNotificationSettings.weeklyReminder?.enabled ?? false,
                                ...localNotificationSettings.weeklyReminder,
                                hour: parseInt(e.target.value),
                              },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className={`w-full px-3 sm:px-4 py-2 text-base rounded-lg border ${darkMode
                            ? "bg-gray-800 border-gray-600 text-gray-100"
                            : "bg-white border-purple-200 text-purple-900"
                            } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs sm:text-sm font-medium ${textClass} mb-1.5 sm:mb-2`}>
                          Minutos
                        </label>
                        <select
                          value={localNotificationSettings.weeklyReminder?.minute ?? 0}
                          onChange={(e) => {
                            setLocalNotificationSettings({
                              ...localNotificationSettings,
                              weeklyReminder: {
                                enabled: localNotificationSettings.weeklyReminder?.enabled ?? false,
                                ...localNotificationSettings.weeklyReminder,
                                minute: parseInt(e.target.value),
                              },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className={`w-full px-3 sm:px-4 py-2 text-base rounded-lg border ${darkMode
                            ? "bg-gray-800 border-gray-600 text-gray-100"
                            : "bg-white border-purple-200 text-purple-900"
                            } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recordatorio de Ingresos Mensual */}
              <div
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <DollarSign
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-medium ${textClass}`}>
                        Recordatorio de ingresos mensual
                      </p>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                        Recibe un recordatorio para actualizar tus ingresos si varían cada mes
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localNotificationSettings.monthlyIncomeReminder?.enabled ?? false}
                      onChange={() => {
                        setLocalNotificationSettings({
                          ...localNotificationSettings,
                          monthlyIncomeReminder: {
                            ...localNotificationSettings.monthlyIncomeReminder,
                            enabled: !(localNotificationSettings.monthlyIncomeReminder?.enabled ?? false),
                          },
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors ${localNotificationSettings.monthlyIncomeReminder?.enabled
                        ? "bg-purple-500"
                        : "bg-gray-500/60"
                        }`}
                    />
                    <div
                      className={`
                        absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform
                        ${localNotificationSettings.monthlyIncomeReminder?.enabled ? "translate-x-6" : "translate-x-0"}
                      `}
                    />
                  </label>
                </div>
                {localNotificationSettings.monthlyIncomeReminder?.enabled && (
                  <div className="mt-3 sm:mt-4 pl-0 sm:pl-8 space-y-2 sm:space-y-3">
                    <div>
                      <label className={`block text-xs sm:text-sm font-medium ${textClass} mb-1.5 sm:mb-2`}>
                        Día del mes
                      </label>
                      <select
                        value={localNotificationSettings.monthlyIncomeReminder?.dayOfMonth ?? 28}
                        onChange={(e) => {
                          setLocalNotificationSettings({
                            ...localNotificationSettings,
                            monthlyIncomeReminder: {
                              enabled: localNotificationSettings.monthlyIncomeReminder?.enabled ?? false,
                              ...localNotificationSettings.monthlyIncomeReminder,
                              dayOfMonth: parseInt(e.target.value),
                            },
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`w-full px-3 sm:px-4 py-2 text-base rounded-lg border ${darkMode
                          ? "bg-gray-800 border-gray-600 text-gray-100"
                          : "bg-white border-purple-200 text-purple-900"
                          } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                      >
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = i + 1;
                          return (
                            <option key={day} value={day}>
                              Día {day}
                            </option>
                          );
                        })}
                      </select>
                      <p className={`text-xs ${textSecondaryClass} mt-1`}>
                        Se enviará el recordatorio el día seleccionado de cada mes a las 20:00
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </>
          )}

          {activeTab === "voice" && (
            <VoiceSettingsPanel
              darkMode={darkMode}
              settings={localVoiceSettings}
              onSettingsChange={setLocalVoiceSettings}
            />
          )}

          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div
                className={`p-3 sm:p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                  }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Shield className={`w-5 h-5 ${darkMode ? "text-purple-300" : "text-purple-600"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${textClass}`}>Permiso de micrófono</p>
                    <p className={`text-xs ${textSecondaryClass}`}>Necesario para añadir gastos por voz</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {microphone.status === "granted" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={textSecondaryClass}>{statusLabel(microphone.status)}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const granted = await microphone.request();
                    if (granted) {
                      showNotification("✅ Permiso de micrófono concedido", "success");
                    } else {
                      showNotification("❌ Permiso de micrófono denegado", "error");
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${darkMode
                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                >
                  Solicitar micrófono
                </button>
              </div>

              <div
                className={`p-3 sm:p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                  }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Bell className={`w-5 h-5 ${darkMode ? "text-blue-300" : "text-blue-600"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${textClass}`}>Permiso de notificaciones</p>
                    <p className={`text-xs ${textSecondaryClass}`}>Alertas de presupuesto y recordatorios</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {notifications.status === "granted" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={textSecondaryClass}>{statusLabel(notifications.status)}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const granted = await notifications.request(userId);
                    if (granted) {
                      showNotification("✅ Permiso de notificaciones concedido", "success");
                    } else {
                      showNotification("❌ Permiso de notificaciones denegado", "error");
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${darkMode
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  Solicitar notificaciones
                </button>
                {notifications.token && (
                  <p className={`mt-2 text-xs break-all ${textSecondaryClass}`}>
                    Token FCM: {notifications.token.slice(0, 24)}…
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab Admin */}
          {activeTab === "admin" && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                  }`}
              >
                <h4 className={`text-lg font-bold mb-2 ${textClass}`}>Panel de Administración</h4>
                <p className={`text-sm mb-4 ${textSecondaryClass}`}>
                  Herramientas exclusivas para administradores.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      window.location.hash = "#/admin/migration";
                      onClose();
                    }}
                    className={`w-full px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-between ${darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-700"
                      }`}
                  >
                    <span>Migración de Usuarios</span>
                    <ChevronRight className="w-5 h-5 opacity-70" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botón guardar */}
          <div className={`mt-6 pt-6 mb-6 border-t ${darkMode ? "border-gray-700" : "border-gray-200"
            }`}>
            {activeTab === "general" ? (
              <button
                onClick={handleSaveIncome}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                {t("common.save")}
              </button>
            ) : activeTab === "notifications" ? (
              <button
                onClick={handleSaveNotifications}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                {t("common.save")}
              </button>
            ) : activeTab === "voice" ? (
              <button
                onClick={handleSaveVoiceSettings}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                {t("common.save")}
              </button>
            ) : activeTab === "admin" ? (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Cerrar
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

