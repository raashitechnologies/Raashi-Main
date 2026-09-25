import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, Briefcase, Mail, BarChart3,
  LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
const sidebarSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/coordinator/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Applications",
    items: [
      { label: "Internship Applications", href: "/coordinator/internship-applications", icon: ClipboardList },
      { label: "Career Applications", href: "/coordinator/career-applications", icon: Briefcase },
      { label: "Contacts", href: "/coordinator/contacts", icon: Mail },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Reports", href: "/coordinator/reports", icon: BarChart3 },
    ],
  },
];

// Flat list for breadcrumb lookup
const allSidebarLinks = sidebarSections.flatMap((s) => s.items);

export default function CoordinatorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const currentLabel = allSidebarLinks.find(
    (l) => location.pathname === l.href || location.pathname.startsWith(l.href + "/")
  )?.label || "Coordinator";

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "C";

  const renderNavItems = (onItemClick?: () => void) =>
    sidebarSections.map((section) => (
      <div key={section.label}>
        <p className="sidebar-section-label">{section.label}</p>
        <div className="space-y-1">
          {section.items.map(({ label, href, icon: Icon }) => {
            const isActive = location.pathname === href || location.pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                to={href}
                onClick={onItemClick}
                className={`sidebar-nav-item ${
                  isActive ? "sidebar-nav-item--active" : "sidebar-nav-item--inactive"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    ));

  const renderProfile = (showDetails: boolean) => (
    <div className="border-t border-white/[0.06] p-3">
      {showDetails && (
        <div className="flex items-center gap-3 px-2 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue/40 to-brand-royal/40 flex items-center justify-center shrink-0 ring-1 ring-white/10">
            <span className="text-xs font-bold text-white">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-white/35 truncate">{user?.email}</p>
          </div>
        </div>
      )}
      <button
        onClick={() => { logout(); navigate("/"); }}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 mt-1 rounded-lg text-xs font-medium text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </div>
  );

  return (
    <div className="min-h-viewport bg-dashboard flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 sidebar-gradient fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Raashi" className="h-9 w-auto object-contain bg-white rounded-lg p-1" />
          </Link>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Coordinator</p>
            <p className="text-[10px] text-white/30">Raashi CT</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {renderNavItems()}
        </nav>

        {renderProfile(true)}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 w-64 sidebar-gradient z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Raashi" className="h-8 w-auto bg-white rounded-lg p-1" />
                  <p className="text-xs font-bold text-white">Coordinator</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {renderNavItems(() => setSidebarOpen(false))}
              </nav>
              {renderProfile(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 lg:ml-64 min-h-viewport flex flex-col">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/60 h-14 flex items-center px-4 lg:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 mr-3 transition-colors"><Menu size={20} /></button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link to="/coordinator/dashboard" className="hover:text-brand-blue transition-colors">Coordinator</Link>
            <ChevronRight size={12} />
            <span className="font-medium text-gray-800">{currentLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
