import { StatCard } from "@/components/ui/stat-card";
import { getMetrcAdapter } from "@/server/metrc/metrc.service";

export default async function DashboardPage() {
  const metrcHealth = await getMetrcAdapter().healthCheck();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active packages" value="3" detail="Seeded demo inventory packages" />
        <StatCard label="Sync queue" value="1" detail="Sale receipt waiting for fake Metrc sync" />
        <StatCard label="Audit events" value="2" detail="Seeded audit trail entries" />
        <StatCard label="Adapter" value={metrcHealth.adapter} detail={metrcHealth.message} />
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">MVP foundation</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "Audit service is available before CRUD workflows.",
            "Fake Metrc adapter is server-side only.",
            "Facility selector is ready for multi-facility context.",
            "Inventory, product, sales, and sync pages are placeholders."
          ].map((item) => (
            <div key={item} className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/70">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
