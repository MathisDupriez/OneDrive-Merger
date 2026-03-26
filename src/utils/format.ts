/** Formate une taille en bytes vers une chaîne lisible (Ko, Mo, Go). */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Formate un timestamp epoch ms vers une date lisible. */
export function formatDate(epochMs: number): string {
  if (epochMs === 0) return "—";
  const date = new Date(epochMs);
  return date.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formate une durée en ms vers une chaîne lisible. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} min ${remainingSeconds} s`;
}

/** Tronque un chemin de fichier pour l'affichage. */
export function truncatePath(path: string, maxLength: number = 60): string {
  if (path.length <= maxLength) return path;
  const parts = path.split("/");
  if (parts.length <= 2) return "..." + path.slice(-maxLength + 3);
  return parts[0] + "/.../" + parts.slice(-2).join("/");
}

/** Retourne le label français pour une catégorie de fichier. */
export function categoryLabel(
  category: string
): { label: string; color: string } {
  switch (category) {
    case "Identical":
      return { label: "Identique", color: "text-slate-400" };
    case "Moved":
      return { label: "Déplacé", color: "text-blue-400" };
    case "Renamed":
      return { label: "Renommé", color: "text-cyan-400" };
    case "Modified":
      return { label: "Modifié", color: "text-yellow-400" };
    case "SourceOnly":
      return { label: "Source uniquement", color: "text-green-400" };
    case "DestOnly":
      return { label: "Dest. uniquement", color: "text-slate-500" };
    case "Conflict":
      return { label: "Conflit", color: "text-red-400" };
    default:
      return { label: category, color: "text-slate-300" };
  }
}

/** Retourne le label français pour une action de merge. */
export function actionLabel(action: import("../types").MergeAction): string {
  if (action === "Skip") return "Ignorer";
  if (action === "CopyToDestination") return "Copier vers destination";
  if (action === "KeepSource") return "Garder source";
  if (action === "KeepDest") return "Garder destination";
  if (typeof action === "object" && "KeepBoth" in action)
    return `Garder les deux (${action.KeepBoth.suffix})`;
  if (typeof action === "object" && "MoveInDest" in action)
    return "Déplacer dans destination";
  return "?";
}
