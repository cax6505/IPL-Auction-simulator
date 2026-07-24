"use client";

import { AuctionProvider } from "@/components/auction/AuctionContext";
import { AuctionErrorBoundary } from "@/components/auction/ErrorBoundary";
import React from "react";

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuctionErrorBoundary>
      <AuctionProvider>{children}</AuctionProvider>
    </AuctionErrorBoundary>
  );
}
