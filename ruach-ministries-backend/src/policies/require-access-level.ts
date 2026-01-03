type AccessLevel = "basic" | "full" | "leader";

type PolicyContext = {
  state?: {
    user?: {
      accessLevel?: string | null;
      membershipStatus?: string | null;
    };
  };
  params?: Record<string, string>;
  query?: Record<string, string | string[]>;
  request?: {
    query?: Record<string, string | string[]>;
  };
  unauthorized(message?: string): never;
};

type PolicyConfig = {
  contentType?: string;
  requiredField?: string;
  operation?: "find" | "findOne";
};

const LEVEL_RANK: Record<AccessLevel, number> = {
  basic: 1,
  full: 2,
  leader: 3,
};

const DEFAULT_REQUIRED_FIELD = "requiredAccessLevel";

function normalizeAccessLevel(value?: string | null): AccessLevel {
  if (!value || typeof value !== "string") {
    return "basic";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "full") return "full";
  if (normalized === "leader") return "leader";
  return "basic";
}

function getAllowedLevels(accessLevel: AccessLevel): AccessLevel[] {
  const rank = LEVEL_RANK[accessLevel] ?? LEVEL_RANK.basic;
  return (Object.keys(LEVEL_RANK) as AccessLevel[]).filter(
    (level) => LEVEL_RANK[level] <= rank
  );
}

function parseQueryValues(raw?: string | string[]): string[] {
  if (!raw) return [];
  const normalize = (value: string) => value.trim().toLowerCase();
  if (Array.isArray(raw)) {
    return raw
      .flatMap((value) => value.split(","))
      .map(normalize)
      .filter(Boolean);
  }
  return raw
    .split(",")
    .map(normalize)
    .filter(Boolean);
}

function setQueryValue(ctx: PolicyContext, key: string, value: string) {
  if (ctx.query) {
    ctx.query[key] = value;
  }
  if (ctx.request?.query) {
    ctx.request.query[key] = value;
  }
}

function ensureQueryFilters(
  ctx: PolicyContext,
  requiredField: string,
  allowedLevels: AccessLevel[]
) {
  const eqKey = `filters[${requiredField}][$eq]`;
  const inKey = `filters[${requiredField}][$in]`;
  const eqValues = parseQueryValues(ctx.request?.query?.[eqKey] ?? ctx.query?.[eqKey]);

  if (eqValues.length) {
    const desired = eqValues[0] as AccessLevel;
    if (!allowedLevels.includes(desired)) {
      ctx.unauthorized("Access level insufficient");
    }
    setQueryValue(ctx, inKey, desired);
    return;
  }

  const existingIn = parseQueryValues(ctx.request?.query?.[inKey] ?? ctx.query?.[inKey]);
  if (existingIn.length) {
    const intersection = existingIn.filter((level) => allowedLevels.includes(level as AccessLevel));
    if (!intersection.length) {
      ctx.unauthorized("Access level insufficient");
    }
    setQueryValue(ctx, inKey, intersection.join(","));
    return;
  }

  setQueryValue(ctx, inKey, allowedLevels.join(","));
}

function extractSlug(query?: Record<string, string | string[]>): string | null {
  if (!query) return null;
  const keys = ["filters[slug][$eq]", "filters[slug][$eqi]"];
  for (const key of keys) {
    const values = parseQueryValues(query[key]);
    if (values.length) {
      return values[0];
    }
  }
  return null;
}

async function ensureEntryAccess(
  ctx: PolicyContext,
  strapi: any,
  contentType: string,
  requiredField: string,
  allowedLevels: AccessLevel[]
) {
  const identifier = ctx.params?.id;
  let requiredLevel: AccessLevel | null = null;

  if (identifier) {
    const entry = await strapi.entityService.findOne(contentType, Number(identifier), {
      fields: [requiredField],
    } as any);
    requiredLevel = normalizeAccessLevel(entry?.[requiredField]);
  } else {
    const slug = extractSlug(ctx.request?.query ?? ctx.query);
    if (slug) {
      const matches = await strapi.entityService.findMany(contentType, {
        filters: { slug },
        fields: [requiredField],
        limit: 1,
      } as any);
      const fetched = Array.isArray(matches) ? matches[0] : null;
      requiredLevel = normalizeAccessLevel(fetched?.[requiredField]);
    }
  }

  if (requiredLevel && !allowedLevels.includes(requiredLevel)) {
    ctx.unauthorized("Access level insufficient");
  }
}

export default async function requireAccessLevel(
  ctx: PolicyContext,
  config: PolicyConfig = {},
  { strapi }: { strapi: any }
) {
  const contentType = config.contentType;
  if (!contentType) {
    return true;
  }

  const operation = config.operation ?? "find";
  const requiredField = config.requiredField ?? DEFAULT_REQUIRED_FIELD;

  const user = ctx.state?.user;
  if (user && user.membershipStatus !== "active") {
    ctx.unauthorized("Membership not active");
  }

  const userLevel = normalizeAccessLevel(user?.accessLevel);
  const allowedLevels = getAllowedLevels(userLevel);

  ensureQueryFilters(ctx, requiredField, allowedLevels);

  if (operation === "findOne") {
    await ensureEntryAccess(ctx, strapi, contentType, requiredField, allowedLevels);
  }

  return true;
}
