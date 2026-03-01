export function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div
      className={`${dims} animate-spin rounded-full border-2 border-accent border-t-transparent mx-auto`}
    />
  );
}
