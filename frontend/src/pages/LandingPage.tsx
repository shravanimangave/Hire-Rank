import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, Sparkles, Shield, ChevronRight,
  FileSearch, BarChart3, MessageSquareText, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "10x", label: "Faster screening" },
  { value: "94%", label: "Match accuracy" },
  { value: "60%", label: "Bias reduction" },
  { value: "500+", label: "Resumes / session" },
];

const features = [
  {
    icon: FileSearch,
    title: "Intelligent Parsing",
    desc: "Extracts skills, experience depth, and context from PDF resumes — not just keywords.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  {
    icon: BarChart3,
    title: "Multi-Factor Scoring",
    desc: "Weighs skill match, experience depth, and context quality using semantic AI — not regex.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  {
    icon: MessageSquareText,
    title: "Explainable Decisions",
    desc: "Every recommendation comes with clear reasoning — strengths, risks, and confidence score.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

const steps = [
  { num: "01", title: "Upload resumes", desc: "Drop PDFs and paste your job description." },
  { num: "02", title: "AI analysis", desc: "The engine scores, ranks, and explains every candidate." },
  { num: "03", title: "Make decisions", desc: "Shortlist, compare, and export with full reasoning." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg gradient-primary">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">HireRank</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign in
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground neon-glow" onClick={() => navigate("/login?tab=signup")}>
              Get started free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container pt-24 pb-20 text-center relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by semantic AI — not keyword matching
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Hire smarter with
            <br />
            <span className="gradient-text">AI that explains itself</span>
          </h1>

          <p className="text-muted-foreground text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload resumes, paste a job description, and get ranked candidates with
            clear reasoning — strengths, gaps, and a hiring recommendation in seconds.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold gradient-primary text-primary-foreground rounded-xl neon-glow"
              onClick={() => navigate("/login?tab=signup")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start for free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base rounded-xl border-border"
              onClick={() => navigate("/upload")}
            >
              Try without account
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-3xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-muted-foreground text-sm">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for real hiring decisions
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Not a keyword filter. An AI system that evaluates candidates like an experienced recruiter.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 group hover:border-primary/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-6`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container py-24 border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground text-lg">Three steps from resumes to decision-ready insights.</p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 neon-glow">
                  <span className="text-lg font-bold text-primary-foreground">{s.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring formula callout */}
      <section className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 max-w-3xl mx-auto text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-accent/5" />
          <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">Transparent scoring formula</h3>
          <p className="text-muted-foreground text-sm mb-6">Every score is computed from three weighted factors — no black box.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm font-mono">
            <span className="px-3 py-2 rounded-lg bg-sky-400/10 text-sky-400 border border-sky-400/20">0.5 × Skill Match</span>
            <span className="text-muted-foreground">+</span>
            <span className="px-3 py-2 rounded-lg bg-violet-400/10 text-violet-400 border border-violet-400/20">0.3 × Experience</span>
            <span className="text-muted-foreground">+</span>
            <span className="px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">0.2 × Context</span>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold mb-4">
            Ready to hire <span className="gradient-text">smarter?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
            Free to start. No credit card. Upload your first batch of resumes in under 60 seconds.
          </p>
          <Button
            size="lg"
            className="h-14 px-10 text-base font-semibold gradient-primary text-primary-foreground rounded-xl neon-glow"
            onClick={() => navigate("/login?tab=signup")}
          >
            Get started free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>HireCopilot</span>
          </div>
          <span>AI-powered hiring, built with transparency.</span>
        </div>
      </footer>
    </div>
  );
}

