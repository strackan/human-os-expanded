"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavbarAuthed } from "@/components/navbar-authed";
import {
  LayoutDashboard,
  Camera,
  Building2,
  FileBarChart,
  Shield,
  CreditCard,
  Settings,
} from "lucide-react";

const sidebarLinks = [
  { label: "Overview", href: "/new-site/dashboard", icon: LayoutDashboard },
  { label: "Snapshots", href: "/new-site/dashboard/snapshots", icon: Camera },
  { label: "Brands", href: "/new-site/dashboard/brands", icon: Building2 },
  { label: "Audit", href: "/new-site/dashboard/audit", icon: Shield },
  { label: "Reports", href: "/new-site/dashboard/reports", icon: FileBarChart },
  { label: "Billing", href: "/new-site/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/new-site/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <NavbarAuthed />
      <div className="flex min-h-screen pt-20">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:block">
          <nav className="sticky top-20 space-y-1 p-4">
            {sidebarLinks.map((link) => {
              const isActive =
                link.href === "/new-site/dashboard"
                  ? pathname === "/new-site/dashboard"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
