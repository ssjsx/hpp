import type { Metadata } from "next";
import { App1Client } from "@/components/app1/App1Client";

export const metadata: Metadata = {
  title: "Property Value Estimator",
};

export default function App1Page() {
  return <App1Client />;
}
