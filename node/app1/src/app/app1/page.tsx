import type { Metadata } from "next";
import { App1Client } from "@/components/app1/App1Client";
import { getInitialEstimateHistory } from "@/lib/serverHistory";

export const metadata: Metadata = {
  title: "Property Value Estimator",
};

export default async function App1Page() {
  const initialHistory = await getInitialEstimateHistory();
  return <App1Client initialHistory={initialHistory} />;
}
