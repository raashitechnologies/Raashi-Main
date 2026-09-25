import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Menu, Bell } from "lucide-react";

export interface NavbarBreadcrumbProps {
  notificationCount?: number;
  breadcrumbs?: { label: string; href?: string }[];
  onMenuClick?: () => void;
}

export default function NavbarBreadcrumb({
  notificationCount = 0,
  breadcrumbs = [],
  onMenuClick,
}: NavbarBreadcrumbProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200/80 h-14 flex items-center px-4 lg:px-6 shadow-sm">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 mr-3"
        >
          <Menu size={20} />
        </button>
      )}
      
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-brand-blue transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={`font-medium ${isLast ? 'text-gray-800' : ''}`}>{crumb.label}</span>
              )}
              {!isLast && <ChevronRight size={12} />}
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <Link
          to="/"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
        >
          View Website →
        </Link>
        <button className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
