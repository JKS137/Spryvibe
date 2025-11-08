import { Button } from "@/components/ui/button";
import { Sparkles, Glasses, X } from "lucide-react";

interface EffectSelectorProps {
  activeEffect: "glowing-eyes" | "sunglasses" | null;
  onEffectChange: (effect: "glowing-eyes" | "sunglasses" | null) => void;
  disabled?: boolean;
}

export function EffectSelector({ activeEffect, onEffectChange, disabled = false }: EffectSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Effect:</span>
      
      <div className="flex gap-2">
        <Button
          variant={activeEffect === "glowing-eyes" ? "default" : "outline"}
          size="sm"
          onClick={() => onEffectChange(activeEffect === "glowing-eyes" ? null : "glowing-eyes")}
          disabled={disabled}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Glowing Eyes
        </Button>

        <Button
          variant={activeEffect === "sunglasses" ? "default" : "outline"}
          size="sm"
          onClick={() => onEffectChange(activeEffect === "sunglasses" ? null : "sunglasses")}
          disabled={disabled}
          className="gap-2"
        >
          <Glasses className="h-4 w-4" />
          Sunglasses
        </Button>

        {activeEffect && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEffectChange(null)}
            disabled={disabled}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
