export type AccessLevel = "public" | "partner" | "builder" | "steward";

export const ACCESS_LEVEL_RANK: Record<AccessLevel, number> = {
  public: 0,
  partner: 1,
  builder: 2,
  steward: 3,
};

export function normalizeAccessLevel(value?: string | null): AccessLevel {
  if (!value) return "partner";
  switch (value.toString().toLowerCase()) {
    case "public":
      return "public";
    case "partner":
      return "partner";
    case "builder":
      return "builder";
    case "steward":
      return "steward";
    default:
      return "partner";
  }
}

export type MembershipStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "unknown";

export type ViewerAccess = {
  accessLevel?: AccessLevel | null;
  membershipTier?: AccessLevel | null;
  membershipStatus?: MembershipStatus | string | null;
  membershipCurrentPeriodEnd?: string | null;
};

const ACTIVE_STATUSES = new Set<MembershipStatus>([
  "trialing",
  "active",
  "past_due",
  "paused",
]);

function isMembershipActive(viewer: ViewerAccess | null | undefined): boolean {
  if (!viewer) return false;
  const status = (viewer.membershipStatus ?? "none").toString().toLowerCase() as MembershipStatus;
  if (!ACTIVE_STATUSES.has(status)) {
    return false;
  }
  if (viewer.membershipCurrentPeriodEnd) {
    const end = Date.parse(viewer.membershipCurrentPeriodEnd);
    if (!Number.isFinite(end)) return false;
    if (end < Date.now()) return false;
  }
  return true;
}

export type CourseAccessMeta = {
  requiredAccessLevel: AccessLevel;
};

export function canAccessCourse(args: {
  viewer: ViewerAccess | null | undefined;
  course: CourseAccessMeta;
  ownsCourse?: boolean;
}) {
  const { viewer, course, ownsCourse = false } = args;
  if (course.requiredAccessLevel === "public") {
    return true;
  }
  if (ownsCourse) {
    return true;
  }
  if (!isMembershipActive(viewer)) {
    return false;
  }
  const userLevel: AccessLevel =
    viewer?.accessLevel ?? viewer?.membershipTier ?? "public";
  return ACCESS_LEVEL_RANK[userLevel] >= ACCESS_LEVEL_RANK[course.requiredAccessLevel];
}

export function canAccessLesson(args: {
  viewer: ViewerAccess | null | undefined;
  requiredAccessLevel: AccessLevel;
  ownsCourse?: boolean;
}) {
  return canAccessCourse({
    viewer: args.viewer,
    course: { requiredAccessLevel: args.requiredAccessLevel },
    ownsCourse: args.ownsCourse,
  });
}
