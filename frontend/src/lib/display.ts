import type { Household, HouseholdMember } from "@/features/household/api";
import { formatDistanceToNow, isToday, isYesterday, format, isSameWeek } from "date-fns";

export const getMemberById = (
  household: Household | null | undefined,
  id: number | undefined | null
): HouseholdMember | undefined => {
  if (!household || !id) return undefined;
  return household.members.find((m) => m.id === Number(id));
};

export const getDisplayName = (
  member: Pick<HouseholdMember, "name"> | undefined
): string => {
  return member?.name || "Former Member";
};

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);

  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }

  if (isYesterday(d)) {
    return "Yesterday";
  }

  const daysDiff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return format(d, "EEEE");
  }

  return format(d, "MMM d");
}

export function formatFullDate(date: string | Date): string {
  return format(new Date(date), "PPp");
}

export function getNotificationGroupKey(date: string | Date): "today" | "yesterday" | "thisWeek" | "earlier" {
  const d = new Date(date);

  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  if (isSameWeek(d, new Date(), { weekStartsOn: 1 })) return "thisWeek";
  return "earlier";
}
