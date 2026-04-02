"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/providers/context-provider";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Kanban, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Pipeline {
  key: string;
  label: string;
}

interface Team {
  key: string;
  label: string;
  pipelines: Pipeline[];
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kanban", label: "Templates", icon: Kanban },
  { href: "/catalogo", label: "Catálogo", icon: BookOpen },
  { href: "/admin", label: "Gestão", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    selectedTeam,
    selectedPipeline,
    setSelectedTeam,
    setSelectedPipeline,
  } = useAppContext();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const currentTeam = teams.find((t) => t.key === selectedTeam);
  const pipelines = currentTeam?.pipelines ?? [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0f172a]">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">
            C
          </div>
          <span className="text-lg font-semibold text-white">CommHub</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-xs text-slate-500">CommHub v1.0</p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex w-full flex-1 flex-col pl-64">
        {/* Context bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-white px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Time:
            </span>
            <Select
              value={selectedTeam ?? ""}
              onValueChange={(value) => setSelectedTeam(value as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um time" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.key} value={team.key}>
                    {team.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Pipeline:
            </span>
            <Select
              value={selectedPipeline ?? ""}
              onValueChange={(value) => setSelectedPipeline(value as string)}
              disabled={!selectedTeam}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedTeam
                      ? "Selecione uma pipeline"
                      : "Selecione um time primeiro"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.key} value={pipeline.key}>
                    {pipeline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
