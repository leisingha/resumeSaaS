"use client";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "circular" | "linear";
  showLabel?: boolean;
  className?: string;
  color?: string;
  thickness?: number;
  animated?: boolean;
}

export function ModernProgress({
  value,
  max = 100,
  size = "md",
  variant = "circular",
  showLabel = true,
  className,
  color = "bg-gradient-to-r from-violet-500 to-cyan-500",
  thickness = 8,
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeMap = {
    sm: variant === "circular" ? "h-16 w-16" : "h-2",
    md: variant === "circular" ? "h-24 w-24" : "h-3",
    lg: variant === "circular" ? "h-32 w-32" : "h-4",
  };

  if (variant === "linear") {
    return (
      <div className={cn("w-full flex flex-col gap-1", className)}>
        <div
          className="relative w-full bg-gray-700/50 rounded-full overflow-hidden"
          style={{ height: thickness }}
        >
          <motion.div
            className={cn("h-full rounded-full", color)}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
          />
        </div>
        {showLabel && (
          <div className="text-sm text-gray-300 font-medium self-end">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }

  // For circular variant
  const size_px = size === "sm" ? 64 : size === "md" ? 96 : 128;
  const radius = size_px / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="mobile-break:flex mobile-break:items-center mobile-break:gap-3 flex items-center justify-center">
      {showLabel && (
        <div className="text-center mobile-break:block hidden">
          <div className="text-title-md2 font-bold text-primary-light">{`${Math.round(
            percentage
          )}%`}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Complete
          </div>
        </div>
      )}
      <div
        className={cn(
          "relative flex items-center justify-center",
          sizeMap[size],
          className
        )}
      >
        <svg className="w-full h-full" viewBox={`0 0 ${size_px} ${size_px}`}>
          {/* Background circle */}
          <circle
            className="text-gray-700/50"
            strokeWidth={thickness}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size_px / 2}
            cy={size_px / 2}
          />

          {/* Progress circle with gradient */}
          <motion.circle
            className={color}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={animated ? circumference : strokeDashoffset}
            strokeLinecap="round"
            stroke="url(#gradient)"
            fill="transparent"
            r={radius}
            cx={size_px / 2}
            cy={size_px / 2}
            transform={`rotate(-90 ${size_px / 2} ${size_px / 2})`}
            initial={
              animated
                ? { strokeDashoffset: circumference }
                : { strokeDashoffset }
            }
            animate={{ strokeDashoffset }}
            transition={{ duration: animated ? 1.5 : 0, ease: "easeOut" }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(139, 92, 246)" />{" "}
              {/* violet-500 */}
              <stop offset="100%" stopColor="rgb(34, 211, 238)" />{" "}
              {/* cyan-400 */}
            </linearGradient>
          </defs>
        </svg>

        {/* Percentage text inside the circle for mobile */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center mobile-break:hidden">
            <div className="text-xs font-bold text-primary-light">{`${Math.round(
              percentage
            )}%`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
