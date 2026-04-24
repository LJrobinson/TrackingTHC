export function FacilitySelector() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm shadow-sm">
      <span className="text-ink/60">Facility</span>
      <select
        className="bg-transparent font-medium text-ink outline-none"
        aria-label="Current facility"
        defaultValue="desert-bloom-las-vegas"
      >
        <option value="desert-bloom-las-vegas">Desert Bloom Retail - Las Vegas</option>
      </select>
    </div>
  );
}
