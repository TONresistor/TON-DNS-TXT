import { ButtonHTMLAttributes, CSSProperties } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  small?: boolean;
}

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "inherit",
  fontWeight: 600,
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease",
  border: "none",
  whiteSpace: "nowrap",
};

const variants: Record<Variant, CSSProperties> = {
  primary: {
    background: "var(--accent)",
    color: "#fff",
    boxShadow: "0 12px 24px rgba(0, 152, 234, 0.18)",
  },
  secondary: {
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "var(--bg-muted)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "var(--bg-muted)",
    color: "var(--error)",
    border: "1px solid rgba(239,68,68,0.3)",
  },
};

export default function Button({
  variant = "primary",
  fullWidth,
  small,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const size: CSSProperties = small
    ? { fontSize: 13, padding: "4px 10px" }
    : { fontSize: 15, padding: "12px 18px" };

  return (
    <button
      style={{
        ...base,
        ...size,
        ...variants[variant],
        ...(fullWidth ? { width: "100%" } : {}),
        ...(disabled ? { opacity: 0.45, cursor: "not-allowed", transform: "none" } : {}),
        ...style,
      }}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === "primary") {
            e.currentTarget.style.background = "var(--accent-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          } else if (variant === "danger") {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          } else {
            e.currentTarget.style.background = "var(--bg-glass-hover)";
          }
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === "primary") {
            e.currentTarget.style.background = "var(--accent)";
            e.currentTarget.style.transform = "none";
          } else if (variant === "danger") {
            e.currentTarget.style.background = "var(--bg-muted)";
          } else {
            e.currentTarget.style.background = variants[variant].background as string;
          }
        }
        onMouseLeave?.(e);
      }}
      {...props}
    />
  );
}
