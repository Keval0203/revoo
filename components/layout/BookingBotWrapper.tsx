"use client";

import dynamic from "next/dynamic";

const BookingBotDynamic = dynamic(
  () => import("./BookingBot").then((mod) => mod.BookingBot),
  { ssr: false }
);

export function BookingBotWrapper() {
  return <BookingBotDynamic />;
}
