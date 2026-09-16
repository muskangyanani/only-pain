// Shared Prisma `select` shapes. Leaf module: must not import any service.
export const authorSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
export const circleSelect = { id: true, slug: true, name: true, emoji: true, hue: true } as const;
