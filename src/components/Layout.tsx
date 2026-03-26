import type { ReactNode } from "react";
import { Stepper } from "./Stepper";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-800 bg-[#0f0f0f]">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2.5">
            <img src="/portal-logo.png" alt="Portal" className="w-7 h-7" />
            <h1 className="text-sm font-bold text-sky-400 tracking-wide">
              OneDrive Smart Merge
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Portal ICT</span>
          </div>
        </div>
        <Stepper />
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
