import { useState } from "react";
import { ArrowRight, FolderInput, FolderOutput, X, Plus, FolderX } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useMergeStore } from "../stores/mergeStore";
import clsx from "clsx";

export function StepSelect() {
  const {
    sourcePath,
    destPath,
    setSourcePath,
    setDestPath,
    setStep,
    excludeDirs,
    addExcludeDir,
    removeExcludeDir,
  } = useMergeStore();

  const [newExclude, setNewExclude] = useState("");

  const selectFolder = async (type: "source" | "dest") => {
    const selected = await open({
      directory: true,
      multiple: false,
      title:
        type === "source"
          ? "Sélectionner le dossier source (ancien local)"
          : "Sélectionner le dossier destination (OneDrive)",
    });

    if (selected) {
      if (type === "source") {
        setSourcePath(selected as string);
      } else {
        setDestPath(selected as string);
      }
    }
  };

  const handleAddExclude = () => {
    const trimmed = newExclude.trim();
    if (trimmed) {
      addExcludeDir(trimmed);
      setNewExclude("");
    }
  };

  const canProceed = sourcePath && destPath && sourcePath !== destPath;

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-200 mb-2">
          Sélection des dossiers
        </h2>
        <p className="text-slate-400 text-sm max-w-lg">
          Choisissez le dossier source (ancien dossier local avant la perte de
          sync) et le dossier destination (nouveau dossier OneDrive
          resynchronisé).
        </p>
      </div>

      <div className="flex items-center gap-6 w-full max-w-3xl">
        {/* Source */}
        <button
          onClick={() => selectFolder("source")}
          className={clsx(
            "flex-1 flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer",
            sourcePath
              ? "border-green-600 bg-green-900/10"
              : "border-slate-600 bg-slate-800/30 hover:border-sky-500 hover:bg-slate-800/50"
          )}
        >
          <FolderInput
            className={clsx(
              "w-12 h-12",
              sourcePath ? "text-green-400" : "text-slate-500"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-300 mb-1">
              Dossier Source
            </p>
            <p className="text-xs text-slate-500">(Ancien local)</p>
          </div>
          {sourcePath ? (
            <p className="text-xs text-green-400 break-all text-center max-w-full">
              {sourcePath}
            </p>
          ) : (
            <p className="text-xs text-slate-500">Cliquer pour sélectionner</p>
          )}
        </button>

        <ArrowRight className="w-8 h-8 text-slate-600 flex-shrink-0" />

        {/* Destination */}
        <button
          onClick={() => selectFolder("dest")}
          className={clsx(
            "flex-1 flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer",
            destPath
              ? "border-green-600 bg-green-900/10"
              : "border-slate-600 bg-slate-800/30 hover:border-sky-500 hover:bg-slate-800/50"
          )}
        >
          <FolderOutput
            className={clsx(
              "w-12 h-12",
              destPath ? "text-green-400" : "text-slate-500"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-300 mb-1">
              Dossier Destination
            </p>
            <p className="text-xs text-slate-500">(Nouveau OneDrive)</p>
          </div>
          {destPath ? (
            <p className="text-xs text-green-400 break-all text-center max-w-full">
              {destPath}
            </p>
          ) : (
            <p className="text-xs text-slate-500">Cliquer pour sélectionner</p>
          )}
        </button>
      </div>

      {sourcePath && destPath && sourcePath === destPath && (
        <p className="text-sm text-red-400">
          Les deux dossiers doivent être différents.
        </p>
      )}

      {/* Exclusion de dossiers */}
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <FolderX className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-400">
            Dossiers à exclure du scan
          </span>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newExclude}
            onChange={(e) => setNewExclude(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddExclude()}
            placeholder="Ex: node_modules, .git, AppData..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleAddExclude}
            disabled={!newExclude.trim()}
            className={clsx(
              "px-3 py-2 rounded-lg text-sm transition-colors",
              newExclude.trim()
                ? "bg-sky-600 hover:bg-sky-700 text-white"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {excludeDirs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {excludeDirs.map((dir) => (
              <span
                key={dir}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300"
              >
                {dir}
                <button
                  onClick={() => removeExcludeDir(dir)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        disabled={!canProceed}
        onClick={() => setStep(2)}
        className={clsx(
          "mt-2 px-8 py-3 rounded-lg font-semibold text-sm transition-all",
          canProceed
            ? "bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
            : "bg-slate-700 text-slate-500 cursor-not-allowed"
        )}
      >
        Suivant
      </button>
    </div>
  );
}
