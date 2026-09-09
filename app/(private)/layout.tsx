import { AuthProvider } from "@/components/auth/auth-provider";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
