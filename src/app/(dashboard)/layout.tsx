import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return <AppShell user={user}>{children}</AppShell>;
}
