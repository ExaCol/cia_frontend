import React from "react";
import s from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: Props) {
  const classes = [
    s.btn,
    s[variant],
    s[size],
    fullWidth ? s.full : "",
    className || "",
  ].join(" ");
  return <button className={classes} {...props} />;
}
