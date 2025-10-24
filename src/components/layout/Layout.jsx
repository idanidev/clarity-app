import {
  IconBell,
  IconCategory,
  IconClock,
  IconHome,
  IconLogout,
  IconMenu2,
  IconReceipt,
  IconSettings,
  IconTarget,
  IconX,
} from "@tabler/icons-react";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { auth } from "../../firebase";
import { cn } from "../../lib/utils";
import { useExpenseStore } from "../../store/expenseStore";
import { Button } from "../ui/Button";

export const Layout = ({ children }) => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const darkMode = useExpenseStore((state) => state.darkMode);
  const getOverBudgetCategories = useExpenseStore(
    (state) => state.getOverBudgetCategories
  );
  const overBudgetCategories = getOverBudgetCategories();

  const navigation = [
    { name: t("home"), path: "/", icon: IconHome },
    { name: t("expenses"), path: "/expenses", icon: IconReceipt },
    { name: t("categories"), path: "/categories", icon: IconCategory },
    { name: t("budgets"), path: "/budgets", icon: IconTarget },
    { name: t("recurringExpenses"), path: "/recurring", icon: IconClock },
    { name: t("settings"), path: "/settings", icon: IconSettings },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t("logout"));
    } catch (error) {
      toast.error(t("errorOccurred"));
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300",
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50"
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-40 backdrop-blur-md border-b",
          darkMode
            ? "bg-gray-800/95 border-gray-700"
            : "bg-white/60 border-white/60"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Clarity
                </h1>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;

                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <IconLogout className="w-4 h-4" />
                {t("logout")}
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              {overBudgetCategories.length > 0 && (
                <Link href="/budgets">
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative border-red-200 hover:bg-red-50"
                  >
                    <IconBell className="w-5 h-5 text-red-600" />
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {overBudgetCategories.length}
                    </span>
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(true)}
              >
                <IconMenu2 className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 md:hidden"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "absolute right-0 top-0 h-full w-80 p-6 shadow-2xl overflow-y-auto",
              darkMode ? "bg-gray-800" : "bg-white"
            )}
          >
            <div className="flex justify-between items-center mb-8">
              <h3
                className={cn(
                  "text-2xl font-bold",
                  darkMode ? "text-gray-100" : "text-purple-900"
                )}
              >
                {t("home")}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(false)}
              >
                <IconX className="w-6 h-6" />
              </Button>
            </div>

            <nav className="space-y-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;

                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start gap-3"
                      onClick={() => setShowMenu(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 dark:text-red-400"
                onClick={() => {
                  setShowMenu(false);
                  handleLogout();
                }}
              >
                <IconLogout className="w-5 h-5" />
                {t("logout")}
              </Button>
            </nav>
          </motion.div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
