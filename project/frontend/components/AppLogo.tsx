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
  const px = size === "lg" ? 48 : size === "md" ? 40 : 32;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG logo; middleware allows /logo-tt.svg
    <img
      src="/logo-tt.svg"
      alt="Logo TT"
      width={px}
      height={px}
      decoding="async"
      className={clsx(sizeClass[size], "rounded-xl shrink-0 object-contain", className)}
    />
  );
}
