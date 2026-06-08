import { clsx } from "clsx";

const sizeClass = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
} as const;

interface AppLogoProps {
  size?: keyof typeof sizeClass;
  className?: string;
}

export function AppLogo({ size = "sm", className }: AppLogoProps) {
  return (
    <img
      src="/logo-tt.svg"
      alt="TT"
      width={size === "lg" ? 48 : size === "md" ? 40 : 32}
      height={size === "lg" ? 48 : size === "md" ? 40 : 32}
      className={clsx(sizeClass[size], "rounded-xl shrink-0", className)}
    />
  );
}
