"use client";

import { App1Client } from "@/components/app1/App1Client";

export default function App1Remote() {
  // Remote mode starts without server-hydrated history.
  return <App1Client initialHistory={[]} />;
}
