import type { Metadata } from "next";
import { ComparisonPage } from "@/components/app1/ComparisonPage";
import { getInitialEstimateHistory } from "@/lib/serverHistory";

export const metadata: Metadata = {
  title: "Compare Properties",
};

export default async function ComparisonRoutePage() {
  const initialHistory = await getInitialEstimateHistory();
  return <ComparisonPage initialHistory={initialHistory} />;
}
