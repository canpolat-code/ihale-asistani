import React from 'react';
import { Link, useLocation } from 'wouter';
import { FileText, List, Briefcase, Calculator } from 'lucide-react';

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'İhale Projeleri', icon: Briefcase },
    { href: '/fiyat-listeleri', label: 'Birim Fiyat Listeleri', icon: List },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
            <Calculator className="w-5 h-5" />
            <span>İhale Asistanı</span>
          </div>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t text-xs text-muted-foreground">
          <p>Tender Unit Price Assistant</p>
          <p className="mt-1 opacity-70">Professional Workspace</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-auto bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}
