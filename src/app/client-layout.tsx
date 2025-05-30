'use client';

import { Toaster } from "@/components/ui/toaster";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
} 