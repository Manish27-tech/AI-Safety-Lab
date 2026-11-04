import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FlaskConical,
  ShieldAlert,
  FileText,
  Sliders,
  Settings,
  Menu,
  X,
  Cpu,
  Building,
  ChevronDown,
  Check,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface SidebarProps {
  apiStatus?: "online" | "offline";
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [identityDropdownOpen, setIdentityDropdownOpen] = useState(false);
  const { user, activeTenant, switchDemoUser, logout } = useAuth();
  const queryClient = useQueryClient();

  // Query engine health live
  const { data: healthData, isError } = useQuery({
    queryKey: ["sidebar-engine-health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Offline");
      return res.json();
    },
    refetchInterval: 12000,
    retry: 1
  });

  const isOnline = !isError && (healthData?.status === "healthy" || healthData?.status === "ok");

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIdentityDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRoleSwitch = async (role: "admin" | "analyst" | "viewer" | "beta_lead") => {
    setIdentityDropdownOpen(false);
    await switchDemoUser(role);
    queryClient.invalidateQueries();
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    setIdentityDropdownOpen(false);
    await logout();
    queryClient.invalidateQueries();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 relative select-none",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      isActive
        ? "bg-[#E0EEFD] text-blue-900 font-bold shadow-xs border-l-4 border-blue-600 pl-2.5"
        : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
    );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-bayora-sidebar border-r border-bayora-sidebarBorder w-64 select-none">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-1.5 focus:bg-white focus:text-blue-700 focus:shadow-md focus:rounded-md focus:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Branding Header with Tasteful Cyan-to-Blue Logo Accent */}
      <div className="p-4 border-b border-bayora-sidebarBorder flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-95"></div>
            <span className="font-heading font-extrabold text-white text-xl relative z-10 tracking-wider">
              B
            </span>
          </div>
          <div>
            <div className="font-heading font-bold text-base tracking-wider text-slate-900 leading-none">
              BAYORA
            </div>
            <div className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mt-1">
              ISOLATION LAB
            </div>
          </div>
        </div>

        {/* Mobile close button inside drawer */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tenant Context & Identity Switcher Block */}
      <div className="p-3 border-b border-bayora-sidebarBorder bg-white/70">
        <div className="relative">
          <button
            onClick={() => setIdentityDropdownOpen(!identityDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 transition-all text-left shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Switch active tenant and user role"
            aria-expanded={identityDropdownOpen}
            aria-haspopup="true"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {activeTenant?.name || "Alpha AI Safety Lab"}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    {activeTenant?.role || "analyst"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[70px]">
                    {activeTenant?.id || "tenant-alpha"}
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Quick Demo Switcher Popover */}
          {identityDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIdentityDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 w-full rounded-xl bg-white shadow-2xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                  <div className="font-bold text-slate-800">Switch Identity & Tenant</div>
                  <div className="text-[10px] text-slate-500">Live test switching for RBAC & isolation</div>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleRoleSwitch("admin")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Alpha Security Admin</div>
                      <div className="text-[10px] text-slate-500">Role: admin • tenant-alpha</div>
                    </div>
                    {activeTenant?.role === "admin" && activeTenant?.id === "tenant-alpha" && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleRoleSwitch("analyst")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Alice Safety Analyst</div>
                      <div className="text-[10px] text-slate-500">Role: analyst • tenant-alpha</div>
                    </div>
                    {activeTenant?.role === "analyst" && activeTenant?.id === "tenant-alpha" && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleRoleSwitch("viewer")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Auditor Viewer</div>
                      <div className="text-[10px] text-slate-500">Role: viewer • tenant-alpha</div>
                    </div>
                    {activeTenant?.role === "viewer" && activeTenant?.id === "tenant-alpha" && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1"></div>

                  <button
                    onClick={() => handleRoleSwitch("beta_lead")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-900 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold">Beta Security Lead</div>
                      <div className="text-[10px] text-rose-700">Role: admin • tenant-beta (Cross-Tenant)</div>
                    </div>
                    {activeTenant?.id === "tenant-beta" && (
                      <Check className="w-4 h-4 text-rose-600" />
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset / Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-heading">
            Primary Navigation
          </div>
          <nav className="space-y-1" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass} onClick={() => setIsOpen(false)}>
              <LayoutDashboard className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/experiments" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <FlaskConical className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Experiments</span>
            </NavLink>
            <NavLink to="/policies" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Isolation Policies</span>
            </NavLink>
            <NavLink to="/audit" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Audit Trail</span>
            </NavLink>
            <NavLink to="/reports" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Reports</span>
            </NavLink>
          </nav>
        </div>

        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-heading">
            Advanced Security
          </div>
          <nav className="space-y-1" aria-label="Security testing tools">
            <NavLink to="/sandbox" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <Cpu className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Synthetic Sandbox</span>
            </NavLink>
            <NavLink to="/settings" className={navLinkClass} onClick={() => setIsOpen(false)}>
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* User Identity & Live Engine Status Area Near Bottom */}
      <div className="p-3 border-t border-bayora-sidebarBorder bg-white/70">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {user?.full_name?.charAt(0) || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {user?.full_name || "Alice Safety Analyst"}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {user?.email || "analyst@alpha.io"}
            </div>
          </div>
        </div>

        {/* Live Engine Status Pill */}
        <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 px-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )}
            />
            <span className="font-medium text-slate-700">
              {isOnline ? "Engine online" : "Engine offline"}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 font-semibold">
            HACK IN HILLS ’26
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Toggle Button */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-white shadow-md border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        className="hidden lg:block shrink-0 sticky top-0 h-screen z-30"
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Collapsible Navigation Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation drawer"
      >
        {sidebarContent}
      </aside>
    </>
  );
};
