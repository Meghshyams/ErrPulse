import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  installCommand?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function EmptyState({ icon, title, description, installCommand }: EmptyStateProps) {
  return (
    <div className="py-16 flex flex-col items-center text-center animate-fade-up">
      <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground max-w-xs">{description}</p>
      {installCommand && (
        <div className="relative mt-4 rounded-lg border border-border/50 bg-surface px-4 py-2.5 pr-10 font-mono text-[12px] text-muted-foreground">
          <span className="text-primary/60 select-none">$ </span>
          {installCommand}
          <CopyButton text={installCommand} />
        </div>
      )}
    </div>
  );
}
