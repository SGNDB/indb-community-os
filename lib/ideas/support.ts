export type IdeaBadge = "new_idea" | "growing_support" | "popular" | "community_priority" | "top_priority";

export interface IdeaSupportInfo {
  supportPercentage: number;
  badge: IdeaBadge;
}

export function calculateIdeaSupport(votesCount: number, totalUsers: number): IdeaSupportInfo {
  const supportPercentage = totalUsers > 0
    ? Math.round((votesCount / totalUsers) * 1000) / 10
    : 0;

  let badge: IdeaBadge;
  if (supportPercentage >= 25) badge = "top_priority";
  else if (supportPercentage >= 10) badge = "community_priority";
  else if (supportPercentage >= 5) badge = "popular";
  else if (supportPercentage >= 2) badge = "growing_support";
  else badge = "new_idea";

  return {supportPercentage, badge};
}
