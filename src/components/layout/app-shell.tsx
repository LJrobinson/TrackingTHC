import { FacilitySelector } from "./facility-selector";
import { NavLink } from "./nav-link";
import type { CurrentUser } from "@/server/auth/current-user";

type AppShellProps = {
  user: CurrentUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-black/10 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-mint">TrackingTHC</p>
            <h1 className="text-lg font-semibold">Compliance Operations Console</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-white/60">Role: {user.role}</p>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-6 pb-3">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/inventory" label="Inventory" />
          <NavLink href="/products" label="Products" />
          <NavLink href="/sales" label="Sales" />
          <NavLink href="/sync-status" label="Sync Status" />
          <NavLink href="/audit" label="Audit" />
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-moss">Development dashboard</p>
            <p className="text-sm text-ink/60">
              Auth is stubbed. Current role: {user.role}.
            </p>
          </div>
          <FacilitySelector />
        </div>
        {children}
      </main>
    </div>
  );
}
