import React from "react";
import { DashboardProvider } from "./context";
import { DashboardShell } from "./DashboardShell";

export const metadata = {
  title: "Nexo Gaming - Creator Dashboard",
  description: "Creator-as-a-Service (CaaS) video generation dashboard for gamers.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
