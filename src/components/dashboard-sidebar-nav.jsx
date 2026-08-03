"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DashboardSidebarNav({ items, active, onChange, className }) {
  return (
    <nav
      className={cn(
        "flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;

        return (
          <Button
            key={item.key}
            type="button"
            variant="ghost"
            onClick={() => onChange(item.key)}
            className={cn(
              "justify-start gap-2 shrink-0 md:w-full",
              isActive &&
                "bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-400"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.count != null && (
              <Badge
                variant="outline"
                className={cn(
                  "ml-auto",
                  isActive
                    ? "border-emerald-700/40 text-emerald-400"
                    : "text-muted-foreground"
                )}
              >
                {item.count}
              </Badge>
            )}
          </Button>
        );
      })}
    </nav>
  );
}
