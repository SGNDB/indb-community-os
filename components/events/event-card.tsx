import {CalendarDays, MapPin} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {EventItem} from "@/lib/constants/mock-data";

export async function EventCard({event}: {event: EventItem}) {
  const t = await getTranslations("Events");

  return (
    <Card className="overflow-hidden">
      <img src={event.image} alt={event.title} className="h-44 w-full object-cover" />
      <CardHeader>
        <CardTitle className="text-base">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays size={13} />
          {event.date}
        </p>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={13} />
          {event.location}
        </p>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <Button className="w-full">{t("rsvp")}</Button>
      </CardContent>
    </Card>
  );
}

