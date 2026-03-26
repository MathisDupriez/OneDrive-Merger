import clsx from "clsx";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: "blue" | "green" | "yellow" | "red";
  showPercent?: boolean;
}

export function ProgressBar({
  value,
  max,
  label,
  color = "blue",
  showPercent = true,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  const barColor = {
    blue: "bg-sky-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  }[color];

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-slate-300">{label}</span>
          {showPercent && <span className="text-slate-400">{percent}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
