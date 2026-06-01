import {Users} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {ProjectItem} from "@/lib/constants/mock-data";

const statusKeyByValue: Record<string, string> = {
  Planning: "planning",
  "In Progress": "inProgress",
  Recruiting: "recruiting",
};

export async function ProjectCard({project}: {project: ProjectItem}) {
  const t = await getTranslations("Projects");
  const statusKey = statusKeyByValue[project.status] ?? "planning";

  return (
    <Card className="overflow-hidden">
      <img src={project.image} alt={project.title} className="h-44 w-full object-cover" />
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{project.title}</CardTitle>
          <Badge>{t(`status.${statusKey}`)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <p>{t("progress")}</p>
            <p>{project.progress}%</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{width: `${project.progress}%`}} />
          </div>
        </div>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users size={13} />
          {t("volunteers", {count: project.volunteers})}
        </p>
      </CardContent>
    </Card>
  );
}

