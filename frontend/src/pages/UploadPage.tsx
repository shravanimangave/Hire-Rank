import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Sparkles, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/hiring/AppHeader";
import {
  pollStatus,
  rememberSessionAccess,
  startAnalysis,
  uploadResumes,
} from "@/services/api";

type Stage = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleAnalyze = async () => {
    if (!files.length || !jobDescription.trim()) return;
    setError("");

    try {
      // Step 1 — upload
      setStage("uploading");
      setProgress("Uploading resumes...");
      const { session_id, session_access_token } = await uploadResumes(
        files,
        jobDescription,
        jobTitle
      );
      rememberSessionAccess(session_id, session_access_token);

      // Step 2 — trigger analysis
      setStage("analyzing");
      setProgress("AI is analysing candidates...");
      await startAnalysis(session_id, jobDescription, jobTitle);

      // Step 3 — poll until done
      let attempts = 0;
      while (attempts < 60) {
        await new Promise((r) => setTimeout(r, 2000));
        const { status, candidate_count } = await pollStatus(session_id);
        if (status === "done") {
          setProgress(`Done! ${candidate_count} candidate${candidate_count !== 1 ? "s" : ""} analysed.`);
          setStage("done");
          setTimeout(() => navigate(`/dashboard?session=${session_id}`), 1200);
          return;
        }
        if (status === "error") throw new Error("Analysis failed on the server.");
        attempts++;
        setProgress(
          `Processing${".".repeat((attempts % 3) + 1)} (${candidate_count} so far)`
        );
      }
      throw new Error("Analysis timed out. Please try again.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("error");
    }
  };

  const isLoading = stage === "uploading" || stage === "analyzing";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-text">AI-Powered</span> Candidate Analysis
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload resumes and let AI find your best candidates
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`glass-card border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/5 neon-glow"
                : "border-border hover:border-primary/40"
            } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              onChange={handleFileInput}
              disabled={isLoading}
            />
            <motion.div
              animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="p-4 rounded-2xl bg-primary/10">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-lg">
                  Drop resumes here or click to browse
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Supports PDF files · Multiple uploads
                </p>
              </div>
            </motion.div>
          </div>

          {/* File list */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-4 space-y-2"
              >
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {files.length} resume{files.length > 1 ? "s" : ""} added
                </p>
                {files.map((file, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    {!isLoading && (
                      <button
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job title (optional) */}
          <div className="glass-card p-6 space-y-3">
            <label className="text-sm font-medium text-foreground">
              Job Title <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              disabled={isLoading}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Job description */}
          <div className="glass-card p-6 space-y-3">
            <label className="text-sm font-medium text-foreground">
              Job Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here — the AI uses this to match and score candidates..."
              rows={7}
              disabled={isLoading}
              className="w-full bg-secondary/50 border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA / progress */}
          <AnimatePresence mode="wait">
            {isLoading || stage === "done" ? (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 flex items-center gap-4"
              >
                {stage === "done" ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-6 h-6 text-primary animate-spin flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{progress}</p>
                  {isLoading && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This may take 10–30 seconds depending on resume count.
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  onClick={handleAnalyze}
                  disabled={!files.length || !jobDescription.trim()}
                  className="w-full h-14 text-base font-semibold gradient-primary text-primary-foreground rounded-xl neon-glow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Candidates
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

