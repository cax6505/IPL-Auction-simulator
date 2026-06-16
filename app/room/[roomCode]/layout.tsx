"use client";

import { AuctionProvider } from "@/components/auction/AuctionContext";
import React from "react";

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <AuctionProvider>{children}</AuctionProvider>;
}
