import {
  Clock,
  Download,
  Filter,
  Lightbulb,
  LogOut,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { memo } from "react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";

interface MobileMenuProps {
  visible: boolean;
  darkMode: boolean;
  textClass: string;
  onClose: () => void;
  onShowCategories: () => void;
  onShowRecurring: () => void;
  onShowSettings: () => void;
  onShowTips: () => void;
  onExportCSV: () => void;
  onLogout: () => Promise<void> | void;
}

const MobileMenu = memo(
  ({
    visible,
    darkMode,
    textClass,
    onClose,
    onShowCategories,
    onShowRecurring,
    onShowSettings,
    onShowTips,
    onExportCSV,
    onLogout,
  }: MobileMenuProps) => {
    const { t } = useTranslation();
    
    // Deshabilitar scroll del body cuando el menú está abierto
    useDisableBodyScroll(visible);

    if (!visible) {
      return null;
    }

    const panelClasses = darkMode ? "bg-gray-800" : "bg-white";
    const buttonBase = darkMode
      ? "bg-gray-700 hover:bg-gray-600"
      : "bg-purple-50 hover:bg-purple-100";

    const handleAction = (action: () => void | Promise<void>) => {
      action();
      onClose();
    };

    return (
      <div className="fixed inset-0" style={{ zIndex: 9999999 }}>
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div
          className={`absolute right-0 top-0 h-full w-80 ${panelClasses} shadow-2xl p-6 overflow-y-auto`}
          style={{
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-2xl font-bold ${textClass}`}>
              {t("dashboard.menu")}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
              } transition-all`}
            >
              <X className={`w-6 h-6 ${textClass}`} />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleAction(onShowCategories)}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
            >
              <Filter
                className={`w-5 h-5 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
              <span className={`font-medium ${textClass}`}>
                {t("dashboard.categories")}
              </span>
            </button>

            <button
              onClick={() => handleAction(onShowRecurring)}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
            >
              <Clock
                className={`w-5 h-5 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
              <span className={`font-medium ${textClass}`}>
                {t("dashboard.recurringExpenses")}
              </span>
            </button>

            <div
              className={`h-px ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              } my-2`}
            ></div>

            <button
              onClick={() => handleAction(onShowTips)}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
            >
              <Lightbulb
                className={`w-5 h-5 ${
                  darkMode ? "text-amber-400" : "text-amber-600"
                }`}
              />
              <span className={`font-medium ${textClass}`}>
                {t("dashboard.tips")}
              </span>
            </button>

            <button
              onClick={() => handleAction(onExportCSV)}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
            >
              <Download
                className={`w-5 h-5 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
              <span className={`font-medium ${textClass}`}>
                {t("dashboard.exportCSV")}
              </span>
            </button>

            <button
              onClick={() => handleAction(onShowSettings)}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
            >
              <SettingsIcon
                className={`w-5 h-5 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
              <span className={`font-medium ${textClass}`}>
                {t("dashboard.settings")}
              </span>
            </button>

            <button
              onClick={() => handleAction(onLogout)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl ${
                darkMode
                  ? "bg-red-900/50 hover:bg-red-900"
                  : "bg-red-50 hover:bg-red-100"
              } transition-all`}
            >
              <LogOut className="w-5 h-5 text-red-600" />
              <span
                className={`font-medium ${
                  darkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                {t("auth.logout")}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

MobileMenu.displayName = "MobileMenu";

export default MobileMenu;
