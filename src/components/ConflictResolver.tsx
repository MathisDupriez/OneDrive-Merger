import { X } from "lucide-react";
import type { AnalyzedFile, MergeAction } from "../types";
import { formatSize, formatDate } from "../utils/format";

interface ConflictResolverProps {
  file: AnalyzedFile;
  index: number;
  onResolve: (index: number, action: MergeAction) => void;
  onApplyToAll: (action: MergeAction) => void;
  onClose: () => void;
  conflictSuffix: string;
}

export function ConflictResolver({
  file,
  index,
  onResolve,
  onApplyToAll,
  onClose,
  conflictSuffix,
}: ConflictResolverProps) {
  const src = file.source_entry;
  const dest = file.dest_entry;

  const options: { label: string; action: MergeAction; description: string }[] =
    [
      {
        label: `Garder les deux (suffixe ${conflictSuffix})`,
        action: { KeepBoth: { suffix: conflictSuffix } },
        description:
          "Copie la version source avec un suffixe à côté de la version destination.",
      },
      {
        label: "Garder la version source (ancien local)",
        action: "KeepSource",
        description: "Écrase la version destination par la version source.",
      },
      {
        label: "Garder la version destination (OneDrive)",
        action: "KeepDest",
        description: "Garde la version destination, ignore la source.",
      },
      {
        label: "Ignorer ce fichier",
        action: "Skip",
        description: "Ne rien faire pour ce fichier.",
      },
    ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#16213e] border border-slate-700 rounded-xl w-[700px] max-h-[80vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200">
            Résoudre le conflit
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Comparaison côte à côte */}
        <div className="grid grid-cols-2 gap-4 p-4">
          {/* Source */}
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-semibold text-green-400 mb-2">
              Source (ancien local)
            </h4>
            {src && (
              <div className="space-y-1 text-sm">
                <p className="text-slate-300 break-all">{src.relative_path}</p>
                <p className="text-slate-400">Taille : {formatSize(src.size)}</p>
                <p className="text-slate-400">
                  Modifié : {formatDate(src.modified_at)}
                </p>
                <p className="text-slate-500 font-mono text-xs">
                  SHA-256 : {src.hash.slice(0, 16)}...
                </p>
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-semibold text-sky-400 mb-2">
              Destination (OneDrive)
            </h4>
            {dest && (
              <div className="space-y-1 text-sm">
                <p className="text-slate-300 break-all">{dest.relative_path}</p>
                <p className="text-slate-400">
                  Taille : {formatSize(dest.size)}
                </p>
                <p className="text-slate-400">
                  Modifié : {formatDate(dest.modified_at)}
                </p>
                <p className="text-slate-500 font-mono text-xs">
                  SHA-256 : {dest.hash.slice(0, 16)}...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onResolve(index, opt.action)}
              className="w-full text-left p-3 rounded-lg border border-slate-700 hover:border-sky-500 hover:bg-slate-800/50 transition-all"
            >
              <p className="text-sm font-medium text-slate-200">{opt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>

        {/* Appliquer à tous */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() =>
              onApplyToAll({ KeepBoth: { suffix: conflictSuffix } })
            }
            className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Appliquer "Garder les deux" à tous les conflits similaires
          </button>
        </div>
      </div>
    </div>
  );
}
