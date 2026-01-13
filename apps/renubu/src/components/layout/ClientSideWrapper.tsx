import ClientSide from "./ClientSide";

interface ClientSideWrapperProps {
  children: React.ReactNode;
}

// This is a server component
export default function ClientSideWrapper({ children }: ClientSideWrapperProps) {
  return <ClientSide>{children}</ClientSide>;
} 