import { useEffect, useRef } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { useMergeStore } from "../stores/mergeStore";
import { useScan } from "../hooks/useScan";
import { useAnalysis } from "../hooks/useAnalysis";
import { ProgressBar } from "./ProgressBar";
import { formatSize, truncatePath } from "../utils/format";

export function StepScan() {
  const {
    scanProgressSource,
    scanProgressDest,
    isScanning,
    sourceFiles,
    destFiles,
    isAnalyzing,
    analysisResult,
    setStep,
  } = useMergeStore();

  const { startScan } = useScan();
  const { startAnalysis } = useAnalysis();
  const scanStarted = useRef(false);

  // Lancer le scan automatiquement au montage
  useEffect(() => {
    if (!scanStarted.current) {
      scanStarted.current = true;
      startScan();
    }
  }, [startScan]);

  // Lancer l'analyse automatiquement quand le scan est terminé
  useEffect(() => {
    if (
      !isScanning &&
      sourceFiles.length > 0 &&
      !analysisResult &&
      !isAnalyzing
    ) {
      startAnalysis();
    }
  }, [isScanning, sourceFiles.length, analysisResult, isAnalyzing, startAnalysis]);

  // Passer à l'étape 3 automatiquement quand l'analyse est terminée
  useEffect(() => {
    if (analysisResult && !isAnalyzing) {
      setStep(3);
    }
  }, [analysisResult, isAnalyzing, setStep]);

  const sourceTotal = sourceFiles.reduce((acc, f) => acc + f.size, 0);
  const destTotal = destFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 p-8">
      <h2 className="text-2xl font-bold text-slate-200">
        Analyse en cours...
      </h2>

      <div className="w-full max-w-2xl space-y-8">
        {/* Source */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {scanProgressSource?.phase === "complete" ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            )}
            <h3 className="text-sm font-semibold text-slate-300">
              Source (ancien local)
            </h3>
          </div>

          <ProgressBar
            value={scanProgressSource?.scanned_files ?? 0}
            max={scanProgressSource?.total_files ?? 1}
            label={phaseLabel(scanProgressSource?.phase)}
            color={scanProgressSource?.phase === "complete" ? "green" : "blue"}
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>
              {scanProgressSource?.scanned_files ?? 0} /{" "}
              {scanProgressSource?.total_files ?? "?"} fichiers
            </span>
            {sourceFiles.length > 0 && <span>{formatSize(sourceTotal)}</span>}
          </div>

          {scanProgressSource?.current_file && (
            <p className="text-xs text-slate-600 truncate">
              {truncatePath(scanProgressSource.current_file, 80)}
            </p>
          )}
        </div>

        {/* Destination */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {scanProgressDest?.phase === "complete" ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            )}
            <h3 className="text-sm font-semibold text-slate-300">
              Destination (OneDrive)
            </h3>
          </div>

          <ProgressBar
            value={scanProgressDest?.scanned_files ?? 0}
            max={scanProgressDest?.total_files ?? 1}
            label={phaseLabel(scanProgressDest?.phase)}
            color={scanProgressDest?.phase === "complete" ? "green" : "blue"}
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>
              {scanProgressDest?.scanned_files ?? 0} /{" "}
              {scanProgressDest?.total_files ?? "?"} fichiers
            </span>
            {destFiles.length > 0 && <span>{formatSize(destTotal)}</span>}
          </div>

          {scanProgressDest?.current_file && (
            <p className="text-xs text-slate-600 truncate">
              {truncatePath(scanProgressDest.current_file, 80)}
            </p>
          )}
        </div>

        {/* Analyse */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            <div>
              <p className="text-sm text-slate-300 font-medium">
                Analyse comparative en cours...
              </p>
              <p className="text-xs text-slate-500">
                Comparaison de {sourceFiles.length} + {destFiles.length} fichiers
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setStep(1)}
        className="mt-4 px-6 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        Retour
      </button>
    </div>
  );
}

function phaseLabel(phase?: string): string {
  switch (phase) {
    case "discovering":
      return "Découverte des fichiers...";
    case "hashing":
      return "Calcul des signatures...";
    case "complete":
      return "Terminé";
    default:
      return "En attente...";
  }
}
