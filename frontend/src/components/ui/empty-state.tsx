import {type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-6",
      icon: "h-8 w-8",
      title: "text-base",
      description: "text-xs",
    },
    md: {
      container: "py-12",
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-20",
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-base",
    },
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeClasses[size].container,
        className
      )}>
      <div className="flex items-center justify-center rounded-full bg-muted/30 p-4 mb-4">
        <Icon className={cn("text-muted-foreground", sizeClasses[size].icon)} />
      </div>
      <h3 className={cn("font-semibold text-foreground mb-1", sizeClasses[size].title)}>
        {title}
      </h3>
      <p className={cn("text-muted-foreground max-w-[280px] mx-auto", sizeClasses[size].description)}>
        {description}
      </p>
    </div>
  );
}
