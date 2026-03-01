export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-xs font-bold text-primary-foreground">
                FR
              </span>
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              Fancy Robot
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#about"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Fancy Robot Creative
          </p>
        </div>
      </div>
    </footer>
  );
}
