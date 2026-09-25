import type { ReactionType, Tag } from "./constants";

export type Role = "USER" | "MOD" | "ADMIN";
export type Plan = "FREE" | "PLUS";
export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";
export type Moderation = "VISIBLE" | "PENDING" | "HIDDEN" | "REMOVED";

export type Me = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  pronouns: string | null;
  avatarUrl: string | null;
  bio: string | null;
  struggles: string[];
  onboardedAt: string | null;
  emailVerified: boolean;
  role: Role;
  plan: Plan;
  planRenewsAt: string | null;
  subscriptionStatus: string | null;
  dmPrivacy: "EVERYONE" | "FOLLOWING" | "NOBODY";
  showMoodOnProfile: boolean;
  emailNotifications: boolean;
  createdAt: string;
};

export type Author = { id: string | null; username: string; displayName?: string | null; avatarUrl: string | null };

export type Circle = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string | null;
  icon: string;
  hue: number;
  tags: string[];
  guidelines: string | null;
  isOfficial: boolean;
  memberCount: number;
  postCount: number;
  createdAt: string;
  isMember: boolean;
  myRole: string | null;
  moderators?: (Author & { role: string })[];
  matchingTags?: string[];
};

export type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  tags: Tag[];
  circleId: string | null;
  circle: { id: string; slug: string; name: string; icon: string; hue: number } | null;
  contentWarning: string | null;
  moderation: Moderation;
  riskLevel: RiskLevel;
  reactionCount: number;
  commentCount: number;
  editedAt: string | null;
  createdAt: string;
  authorId: string | null;
  author: Author;
  reactions: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  isBookmarked: boolean;
  isMine: boolean;
};

export type Comment = {
  id: string;
  content: string;
  isAnonymous: boolean;
  parentCommentId: string | null;
  createdAt: string;
  authorId: string | null;
  author: Author;
  isMine: boolean;
  replies?: Comment[];
};

export type Safety = { showResources: boolean; level: "NONE" | "MEDIUM" | "HIGH" };

export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  pronouns: string | null;
  avatarUrl: string | null;
  bio: string | null;
  struggles: string[];
  role: Role;
  plan: Plan;
  showMoodOnProfile: boolean;
  lastActiveAt: string;
  createdAt: string;
  _count: { posts: number; followers: number; following: number };
  isOwn: boolean;
  isFollowing: boolean;
  followsYou: boolean;
  isBlocked: boolean;
  sharedStruggles: string[];
  canMessage: boolean;
  moodRing: { dayKey: string; score: number }[] | null;
};

export type Person = Author & { bio?: string | null; struggles?: string[]; sharedStruggles?: string[]; sharedCircles?: number; lastActiveAt?: string };

export type Conversation = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  other: Author & { lastActiveAt: string };
  isInitiator: boolean;
  unread: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
};

export type Message = { id: string; conversationId: string; senderId: string; content: string; createdAt: string; sender: Author };

export type Notification = {
  id: string;
  type: "COMMENT" | "REPLY" | "REACTION" | "FOLLOW" | "CIRCLE_JOIN" | "DM_REQUEST" | "DM_ACCEPTED" | "DM_MESSAGE" | "SUPPORT" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
  message: string | null;
  actor: Author;
  post: { id: string; preview: string } | null;
  comment: { id: string; preview: string } | null;
  conversationId: string | null;
  circle: { id: string; slug: string; name: string; icon: string } | null;
};

export type MoodEntry = { id?: string; dayKey: string; score: number; feelings: string[]; note: string | null; createdAt?: string };
export type MoodSummary = { today: MoodEntry | null; streak: number; avg7: number | null; avg30: number | null; total: number; topFeelings: string[] };

export type CompanionSession = { id: string; title: string | null; createdAt: string; updatedAt: string; _count?: { messages: number } };
export type CompanionMessage = { id: string; role: "USER" | "ASSISTANT"; content: string; riskLevel?: RiskLevel; createdAt: string; pending?: boolean };

export type Reframe = {
  id: string;
  thought: string;
  validation: string;
  patterns: { name: string; how: string }[];
  reframe: string;
  tinyStep: string;
  createdAt: string;
};

export type Reflection = { weekKey: string; cached: boolean; createdAt: string; content: { headline: string; observations: string[]; gentleSuggestion: string; affirmation: string } };

export type AiStatus = { live: boolean; plan: Plan; limits: Record<string, number>; used: Partial<Record<string, number>> };

export type BillingStatus = { enabled: boolean; plan: Plan; subscriptionStatus: string | null; renewsAt: string | null; hasCustomer: boolean; priceLabel: string };

export type Report = {
  id: string;
  source: "USER" | "AI";
  reason: string;
  details: string | null;
  riskLevel: RiskLevel | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  resolution: string | null;
  createdAt: string;
  reporter: Author | null;
  targetUser: (Author & { isBanned: boolean }) | null;
  post: { id: string; content: string; isAnonymous: boolean; moderation: Moderation; riskLevel: RiskLevel; contentWarning: string | null; createdAt: string } | null;
  comment: { id: string; content: string; isAnonymous: boolean; moderation: Moderation; riskLevel: RiskLevel; postId: string; createdAt: string } | null;
  resolvedBy: Author | null;
};

export type Page<T> = { data: T[]; nextCursor: string | null; hasMore: boolean };
