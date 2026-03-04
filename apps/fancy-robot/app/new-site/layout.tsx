import { AuthProvider } from "@/components/auth/AuthProvider";

export default function NewSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
