import { prisma } from "../lib/prisma.js";
import { hashPassword, comparePassword } from "../lib/password.js";

export async function updateProfile(
  userId: string,
  data: {
    username?: string;
    email?: string;
    bio?: string | null;
    avatarUrl?: string | null;
  }
) {
  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: userId } },
    });
    if (existing) throw new Error("Username already taken");
  }

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (existing) throw new Error("Email already in use");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) throw new Error("User not found");

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: "Password changed successfully" };
}

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) throw new Error("User not found");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new Error("Password is incorrect");

  await prisma.user.delete({ where: { id: userId } });
  return { message: "Account deleted" };
}
