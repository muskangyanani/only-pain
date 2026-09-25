import { prisma } from "../lib/prisma.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { cursorArgs, paginate } from "../lib/pagination.js";
import { notify } from "./notification.service.js";
import { authorSelect } from "../lib/selects.js";

export const circleCard = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  description: true,
  icon: true,
  hue: true,
  tags: true,
  guidelines: true,
  isOfficial: true,
  memberCount: true,
  postCount: true,
  createdAt: true,
  createdById: true,
} as const;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

async function withMembership<T extends { id: string }>(circles: T[], viewerId: string | null) {
  if (!viewerId || circles.length === 0) return circles.map((c) => ({ ...c, isMember: false, myRole: null as string | null }));
  const rows = await prisma.circleMember.findMany({
    where: { userId: viewerId, circleId: { in: circles.map((c) => c.id) } },
    select: { circleId: true, role: true },
  });
  const map = new Map(rows.map((r) => [r.circleId, r.role]));
  return circles.map((c) => ({ ...c, isMember: map.has(c.id), myRole: map.get(c.id) ?? null }));
}

export async function listCircles(viewerId: string | null, opts: { q?: string; mine?: boolean }) {
  const where = {
    ...(opts.q ? { OR: [{ name: { contains: opts.q, mode: "insensitive" as const } }, { tagline: { contains: opts.q, mode: "insensitive" as const } }] } : {}),
    ...(opts.mine && viewerId ? { members: { some: { userId: viewerId } } } : {}),
  };
  const circles = await prisma.circle.findMany({
    where,
    orderBy: [{ isOfficial: "desc" }, { memberCount: "desc" }],
    take: 60,
    select: circleCard,
  });
  return withMembership(circles, viewerId);
}

export async function getCircle(slug: string, viewerId: string | null) {
  const circle = await prisma.circle.findUnique({ where: { slug }, select: circleCard });
  if (!circle) throw notFound("Circle");
  const [withM] = await withMembership([circle], viewerId);
  const mods = await prisma.circleMember.findMany({
    where: { circleId: circle.id, role: { in: ["OWNER", "MOD"] } },
    include: { user: { select: authorSelect } },
    take: 5,
  });
  return { ...withM!, moderators: mods.map((m) => ({ ...m.user, role: m.role })) };
}

export async function createCircle(
  userId: string,
  input: { name: string; tagline: string; description?: string | null; icon?: string; hue?: number; tags: string[]; guidelines?: string | null }
) {
  const slug = slugify(input.name);
  if (slug.length < 3) throw badRequest("Pick a slightly longer name.");
  const exists = await prisma.circle.findUnique({ where: { slug }, select: { id: true } });
  if (exists) throw conflict("A circle with that name already exists.", "CIRCLE_EXISTS");
  const circle = await prisma.circle.create({
    data: {
      slug,
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      description: input.description?.trim() || null,
      icon: input.icon || "together",
      hue: input.hue ?? Math.floor(Math.random() * 360),
      tags: input.tags,
      guidelines: input.guidelines?.trim() || null,
      createdById: userId,
      memberCount: 1,
      members: { create: { userId, role: "OWNER" } },
    },
    select: circleCard,
  });
  return { ...circle, isMember: true, myRole: "OWNER" };
}

export async function joinCircle(userId: string, slug: string) {
  const circle = await prisma.circle.findUnique({ where: { slug }, select: { id: true, createdById: true } });
  if (!circle) throw notFound("Circle");
  const existing = await prisma.circleMember.findUnique({ where: { circleId_userId: { circleId: circle.id, userId } } });
  if (existing) return { joined: true };
  await prisma.$transaction([
    prisma.circleMember.create({ data: { circleId: circle.id, userId } }),
    prisma.circle.update({ where: { id: circle.id }, data: { memberCount: { increment: 1 } } }),
  ]);
  if (circle.createdById) {
    void notify({ userId: circle.createdById, type: "CIRCLE_JOIN", actorId: userId, circleId: circle.id });
  }
  return { joined: true };
}

export async function leaveCircle(userId: string, slug: string) {
  const circle = await prisma.circle.findUnique({ where: { slug }, select: { id: true } });
  if (!circle) throw notFound("Circle");
  const existing = await prisma.circleMember.findUnique({ where: { circleId_userId: { circleId: circle.id, userId } } });
  if (!existing) return { joined: false };
  if (existing.role === "OWNER") throw forbidden("Owners can't leave their circle. Transfer ownership first.", "OWNER_CANT_LEAVE");
  await prisma.$transaction([
    prisma.circleMember.delete({ where: { id: existing.id } }),
    prisma.circle.update({ where: { id: circle.id }, data: { memberCount: { decrement: 1 } } }),
  ]);
  return { joined: false };
}

export async function circleMembers(slug: string, cursor: string | undefined, limit: number) {
  const circle = await prisma.circle.findUnique({ where: { slug }, select: { id: true } });
  if (!circle) throw notFound("Circle");
  const rows = await prisma.circleMember.findMany({
    where: { circleId: circle.id },
    ...cursorArgs(cursor, limit),
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    include: { user: { select: { ...authorSelect, bio: true, struggles: true } } },
  });
  const page = paginate(rows, limit);
  return { ...page, data: page.data.map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt })) };
}

export async function circleIdBySlug(slug: string) {
  const circle = await prisma.circle.findUnique({ where: { slug }, select: { id: true } });
  if (!circle) throw notFound("Circle");
  return circle.id;
}
