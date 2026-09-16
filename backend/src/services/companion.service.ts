import type { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { scanCrisis } from "../lib/crisis.js";
import { streamCompanionReply, type CompanionTurn } from "../ai/companion.js";
import { consume } from "../ai/quota.js";

export async function listSessions(userId: string) {
  return prisma.companionSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } },
  });
}

export async function createSession(userId: string) {
  return prisma.companionSession.create({ data: { userId }, select: { id: true, title: true, createdAt: true, updatedAt: true } });
}

export async function getSession(userId: string, id: string) {
  const session = await prisma.companionSession.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, riskLevel: true, createdAt: true } } },
  });
  if (!session) throw notFound("Conversation");
  return session;
}

export async function deleteSession(userId: string, id: string) {
  const res = await prisma.companionSession.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("Conversation");
}

export async function deleteAll(userId: string) {
  await prisma.companionSession.deleteMany({ where: { userId } });
}

/**
 * Validates, charges quota and persists the user turn up front (so failures
 * surface as normal JSON errors), then returns a generator that streams
 * Ember's reply and persists the assistant turn when it completes.
 */
export async function startReply(user: { id: string; plan: Plan }, sessionId: string, content: string) {
  const session = await prisma.companionSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 40, select: { role: true, content: true } } },
  });
  if (!session) throw notFound("Conversation");
  const quota = await consume(user.id, user.plan, "COMPANION");
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true, struggles: true } });
  const crisis = scanCrisis(content);
  const userMessage = await prisma.companionMessage.create({
    data: { sessionId, role: "USER", content, riskLevel: crisis.level === "NONE" ? "NONE" : crisis.level },
  });
  const history: CompanionTurn[] = session.messages.map((m) => ({ role: m.role === "USER" ? "user" : "assistant", content: m.content }));

  async function* stream() {
    let full = "";
    for await (const chunk of streamCompanionReply(history, content, { displayName: me?.displayName, struggles: me?.struggles, crisis: crisis.level })) {
      full += chunk;
      yield { type: "delta" as const, text: chunk };
    }
    const saved = await prisma.companionMessage.create({ data: { sessionId, role: "ASSISTANT", content: full } });
    await prisma.companionSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date(), ...(session!.title ? {} : { title: content.slice(0, 48) }) },
    });
    yield { type: "done" as const, messageId: saved.id, content: full };
  }

  return { meta: { crisis: crisis.level, quota, userMessageId: userMessage.id }, stream };
}
