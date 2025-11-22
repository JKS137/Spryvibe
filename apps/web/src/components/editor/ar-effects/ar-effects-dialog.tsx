import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AREffectsPanel } from "./index";
import { useState } from "react";

export function AREffectsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="text" size="icon" className="h-9 w-9">
          <Sparkles className="h-4 w-4" />
          <span className="sr-only">AR Effects</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>AR Effects Studio</DialogTitle>
        </DialogHeader>
        <div className="h-[600px] w-full">
          <AREffectsPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
