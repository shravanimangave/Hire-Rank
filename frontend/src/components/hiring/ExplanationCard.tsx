import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { ScoreBar } from "./ScoreBar";

interface ExplanationCardProps {
  explanation: string;
  confidence: number;
}

export function ExplanationCard({ explanation, confidence }: ExplanationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl gradient-primary">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            AI Analysis
            <Sparkles className="w-4 h-4 text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground">Powered by AI reasoning</p>
        </div>
      </div>

      <p className="text-sm text-secondary-foreground leading-relaxed">
        {explanation}
      </p>

      <div className="pt-2 border-t border-border">
        <ScoreBar score={confidence} label="Confidence" size="sm" />
      </div>
    </motion.div>
  );
}

