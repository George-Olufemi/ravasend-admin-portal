import { Button } from "@/components/ui/button";
import React from "react";

interface PurpleBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function PurpleBtn({ children, onClick, className = "", size = "md", disabled }: PurpleBtnProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
