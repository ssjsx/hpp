import type { Metadata } from "next";
import { ComparisonPage } from "@/components/app1/ComparisonPage";

export const metadata: Metadata = {
  title: "Compare Properties",
};

export default function App1ComparisonPage() {
  return <ComparisonPage />;
}
