import { Toaster } from "@/components/ui/sonner";
import {
  BarChart2,
  BookOpen,
  Package,
  Receipt,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import Inventory from "./components/Inventory";
import Khatabook from "./components/Khatabook";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import SmartBilling from "./components/SmartBilling";
import SupplierLedger from "./components/SupplierLedger";

type Module =
  | "billing"
  | "khatabook"
  | "inventory"
  | "suppliers"
  | "reports"
  | "settings";

const MODULES = [
  {
    id: "billing" as Module,
    label: "Smart Billing",
    shortLabel: "Billing",
    icon: Receipt,
  },
  {
    id: "khatabook" as Module,
    label: "Khatabook",
    shortLabel: "Khatabook",
    icon: BookOpen,
  },
  {
    id: "inventory" as Module,
    label: "Inventory",
    shortLabel: "Stock",
    icon: Package,
  },
  {
    id: "suppliers" as Module,
    label: "Supplier Ledger",
    shortLabel: "Suppliers",
    icon: Users,
  },
  {
    id: "reports" as Module,
    label: "Reports",
    shortLabel: "Reports",
    icon: BarChart2,
  },
  {
    id: "settings" as Module,
    label: "Settings",
    shortLabel: "Settings",
    icon: SettingsIcon,
  },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>("billing");

  const renderModule = () => {
    switch (activeModule) {
      case "billing":
        return <SmartBilling />;
      case "khatabook":
        return <Khatabook />;
      case "inventory":
        return <Inventory />;
      case "suppliers":
        return <SupplierLedger />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" richColors />

      {/* ─── DESKTOP LAYOUT ─── */}
      <div className="hidden md:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-56 bg-card border-r border-border flex flex-col shrink-0 sticky top-0 h-screen">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/generated/gallery-logo-transparent.dim_200x200.png"
                alt="The Digital Gallery"
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <p className="font-serif text-sm font-bold text-foreground leading-tight">
                  The Digital
                </p>
                <p className="font-serif text-sm font-bold text-[#436B95] leading-tight">
                  Gallery
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
              by Emon — Business OS
            </p>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button
                  type="button"
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  data-ocid={`nav.${mod.id}.link`}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#436B95]/10 text-[#436B95] border border-[#436B95]/30"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-[#436B95]" : ""
                    }`}
                  />
                  {mod.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              📞 +91 93652 46096
            </p>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed mt-0.5">
              Kokrajhar · Bongaigaon · Barpeta Road
            </p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
            <h1 className="font-serif text-xl font-bold text-foreground">
              The Digital Gallery{" "}
              <span className="text-[#436B95]">by Emon</span>
            </h1>
          </header>

          <main className="flex-1 p-8 max-w-4xl w-full">{renderModule()}</main>

          <footer className="border-t border-border px-8 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#436B95] hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="flex flex-col md:hidden min-h-screen">
        <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/gallery-logo-transparent.dim_200x200.png"
              alt="Logo"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <h1 className="font-serif text-base font-bold text-foreground">
              The Digital <span className="text-[#436B95]">Gallery</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">by Emon</p>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 overflow-y-auto">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {renderModule()}
          </motion.div>
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center z-30"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                type="button"
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                data-ocid={`nav.${mod.id}.tab`}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-all ${
                  isActive ? "text-[#436B95]" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#436B95] rounded-full" />
                )}
                <Icon className="h-4 w-4" />
                <span className="text-[9px] font-medium leading-tight">
                  {mod.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
