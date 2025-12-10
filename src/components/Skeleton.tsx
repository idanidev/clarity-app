// ============================================
// Skeleton.tsx - Loading skeleton component
// ============================================
import { memo } from "react";

interface SkeletonProps {
  className?: string;
  darkMode?: boolean;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

const Skeleton = memo<SkeletonProps>(
  ({
    className = "",
    darkMode = false,
    variant = "rectangular",
    width,
    height,
    animation = "pulse",
  }) => {
    const baseClasses = `
      ${variant === "circular" ? "rounded-full" : variant === "text" ? "rounded" : "rounded-lg"}
      ${animation === "pulse" ? "animate-pulse" : animation === "wave" ? "animate-shimmer" : ""}
      ${darkMode ? "bg-gray-700/50" : "bg-gray-200/50"}
      ${className}
    `;

    const style: React.CSSProperties = {
      width: width || (variant === "circular" ? height : "100%"),
      height: height || (variant === "text" ? "1em" : "1rem"),
    };

    return <div className={baseClasses.trim()} style={style} />;
  }
);

Skeleton.displayName = "Skeleton";

// Skeleton variants predefinidos
export const ExpenseCardSkeleton = memo<{ darkMode?: boolean }>(
  ({ darkMode = false }) => (
    <div
      className={`rounded-xl p-4 space-y-3 ${
        darkMode ? "bg-gray-800/50" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="60%" darkMode={darkMode} />
        <Skeleton variant="text" width="30%" darkMode={darkMode} />
      </div>
      <Skeleton variant="text" width="40%" height="0.75em" darkMode={darkMode} />
    </div>
  )
);

ExpenseCardSkeleton.displayName = "ExpenseCardSkeleton";

export const StatCardSkeleton = memo<{ darkMode?: boolean }>(
  ({ darkMode = false }) => (
    <div
      className={`rounded-lg p-4 space-y-2 ${
        darkMode ? "bg-gray-800/50" : "bg-white/60"
      }`}
    >
      <Skeleton variant="circular" width={40} height={40} darkMode={darkMode} />
      <Skeleton variant="text" width="80%" darkMode={darkMode} />
      <Skeleton variant="text" width="60%" height="1.5em" darkMode={darkMode} />
    </div>
  )
);

StatCardSkeleton.displayName = "StatCardSkeleton";

export default Skeleton;

