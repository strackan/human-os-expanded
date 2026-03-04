"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Why Us", href: "/#why-it-works" },
  { label: "Who It's For", href: "/#who-its-for" },
  { label: "About", href: "/#about" },
];

export function NavbarAuthed() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              FR
            </span>
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Fancy Robot
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <>
              <a
                href="/new-site/dashboard"
                className="text-sm font-medium text-foreground transition-colors hover:text-accent"
              >
                Dashboard
              </a>
              <button
                onClick={signOut}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign Out
              </button>
            </>
          ) : !loading ? (
            <>
              <a
                href="/new-site/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Log In
              </a>
              <a
                href="/snapshot"
                className="inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
              >
                Get Your Score
              </a>
            </>
          ) : (
            <a
              href="/snapshot"
              className="inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
            >
              Get Your Score
            </a>
          )}
        </div>

        <button
          type="button"
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {!loading && user ? (
              <>
                <a
                  href="/new-site/dashboard"
                  className="text-sm font-medium text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </a>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign Out
                </button>
              </>
            ) : !loading ? (
              <>
                <a
                  href="/new-site/login"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  Log In
                </a>
                <a
                  href="/snapshot"
                  className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Your Score
                </a>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
