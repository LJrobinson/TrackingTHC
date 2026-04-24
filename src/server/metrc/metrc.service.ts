import "server-only";

import { FakeMetrcAdapter } from "./adapters/fake-metrc.adapter";
import type { MetrcAdapter } from "./adapters/metrc-adapter";

export function getMetrcAdapter(): MetrcAdapter {
  const mode = process.env.METRC_ADAPTER_MODE ?? "fake";

  if (mode !== "fake") {
    throw new Error("Only the fake Metrc adapter is implemented in the foundation.");
  }

  return new FakeMetrcAdapter();
}
