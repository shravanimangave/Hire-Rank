import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, GitCompareArrows, User, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/hiring/AppHeader";
import { ScoreBar } from "@/components/hiring/ScoreBar";
import { RecommendationBadge } from "@/components/hiring/RecommendationBadge";
import { CandidateRadarChart } from "@/components/hiring/CandidateRadarChart";
import { Button } from "@/components/ui/button";
import { CandidateResult, exportCsv, getResults, ResultsPayload } from "@/services/api";

export default function DashboardPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      setError("No analysis session was provided.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    getResults(sessionId)
      .then((data) => {
        if (!active) return;
        setResults(data);
        setSelectedId(data.candidates[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load results.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId]);

  const candidates = useMemo(
    () => [...(results?.candidates ?? [])].sort((a, b) => b.score - a.score),
    [results]
  );

  const selected: CandidateResult | null =
    candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0] ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8 text-sm text-muted-foreground">Loading results...</main>
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8 text-sm text-destructive">
          {error || "No analysis session was provided."}
        </main>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8 text-sm text-muted-foreground">
          This session has no candidates yet.
        </main>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportCsv(sessionId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not export results.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Candidate Rankings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {results?.session.job_title || "Hiring Session"} • {candidates.length} candidates analyzed
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate(`/compare?session=${sessionId}`)}>
            <GitCompareArrows className="mr-2 h-4 w-4" />
            Compare Candidates
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 space-y-3">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => setSelectedId(candidate.id)}
                className={`glass-card-hover cursor-pointer p-4 ${
                  selected.id === candidate.id ? "border-primary/50 neon-glow" : ""
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{candidate.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {candidate.role || "Role not detected"}
                      </p>
                    </div>
                  </div>
                  <RecommendationBadge recommendation={candidate.recommendation} size="sm" />
                </div>
                <ScoreBar score={candidate.score} size="sm" showLabel />
              </motion.div>
            ))}
          </div>

          <div className="col-span-7 space-y-6">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.role || "Role not detected"} • {selected.experience ?? 0} yrs experience
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <RecommendationBadge recommendation={selected.recommendation} />
                  <button
                    onClick={() => navigate(`/candidate/${selected.id}?session=${sessionId}`)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View Full Profile →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Score Breakdown
                  </h3>
                  <div className="space-y-3">
                    {selected.skills.map((skill) => (
                      <ScoreBar key={skill.name} label={skill.name} score={skill.score} size="sm" />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Competency Radar</h3>
                  <CandidateRadarChart data={selected.radar_data} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="mb-2 text-sm font-semibold text-foreground">AI Summary</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {selected.ai_explanation || "No explanation was generated for this candidate."}
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

