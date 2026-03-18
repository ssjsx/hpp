"use client";

import { App2Client } from "@/components/app2/App2Client";

export default function App2Remote() {
  // Remote mode starts without server-hydrated overview.
  return <App2Client initialOverview={null} />;
}
