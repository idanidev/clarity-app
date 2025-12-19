// ============================================
// ICONOS CENTRALIZADOS - TREE-SHAKING OPTIMIZADO
// ============================================
// Importa iconos individualmente para tree-shaking automático
// Reduce bundle de ~200KB a ~30-40KB

// Exportar todo desde un solo archivo facilita cambios futuros
export {
    // UI General
    X,
    Plus,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    ChevronLeft,
    Search,
    Edit2,
    Loader2,
    Check,
    CheckCircle2,
    Filter,
    RefreshCw,
    Eye,
    EyeOff,
    Pencil,
    Clock,

    // Iconos de Alerta/Estado
    AlertCircle,
    AlertTriangle,
    WifiOff,
    FolderOpen,

    // Iconos de Audio/Voz
    Mic,
    MicOff,
    Bell,
    BellRing,

    // Iconos Financieros
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    CreditCard,

    // Iconos de Auth/Security
    Lock,
    Mail,
    ArrowRight,
    Fingerprint,
    Smartphone,
    Shield,

    // Iconos de Settings/UI
    Sun,
    Moon,
    Globe,
    Calendar,
    RotateCcw,
    Settings,
    Menu,
    LogOut,
    Download,

    // Iconos Especiales
    Sparkles,
    Send,
    Trash2,
    Zap,
    Target,
    BarChart3,
    Lightbulb,
    Infinity,
    Copy,
    CheckCircle,
    Bot,
    Table,
    Repeat,

    // Iconos de Categorías
    Heart,
    Dumbbell,
    Gamepad2,
    UtensilsCrossed,
    Car,
    ShoppingBag,
    Home,
} from "lucide-react";

// Exportar el tipo LucideIcon para uso en componentes
export type { LucideIcon } from "lucide-react";

// ============================================
// NOTA: Vite automáticamente hace tree-shaking
// de imports nombrados desde lucide-react
// ============================================
