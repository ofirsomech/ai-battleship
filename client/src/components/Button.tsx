import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-brass-500 text-navy-950 border-brass-500 hover:bg-brass-400 hover:border-brass-400 active:bg-brass-600 shadow-brass-glow",
  secondary:
    "bg-navy-800 text-navy-100 border-navy-600/60 hover:bg-navy-700 hover:border-navy-500/80 active:bg-navy-750",
  danger:
    "bg-danger-600/20 text-danger-400 border-danger-600/40 hover:bg-danger-600/30 hover:border-danger-500/60 hover:text-danger-300 active:bg-danger-700/40",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "relative inline-flex items-center justify-center gap-2",
        "font-mono tracking-[0.1em] uppercase rounded-sm border",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sonar-500 focus-visible:ring-offset-1 focus-visible:ring-offset-navy-900",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-20"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-80"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
