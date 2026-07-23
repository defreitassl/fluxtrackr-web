import { Suspense } from "react";

import { EventsScreen } from "@/features/events/events-screen";

export const metadata = { title: "Eventos" };

export default function EventsPage() {
  return (
    <Suspense>
      <EventsScreen />
    </Suspense>
  );
}
