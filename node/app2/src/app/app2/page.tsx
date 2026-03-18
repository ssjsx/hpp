import type { Metadata } from "next";
import { App2Client } from "@/components/app2/App2Client";
import { getInitialMarketOverview } from "@/lib/serverApp2";

export const metadata: Metadata = {
  title: "Property Market Analysis",
};

export default async function App2Page() {
  const initialOverview = await getInitialMarketOverview();
  return <App2Client initialOverview={initialOverview} />;
}
