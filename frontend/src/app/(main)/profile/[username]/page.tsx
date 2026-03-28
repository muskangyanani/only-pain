"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PostCard } from "@/components/post/post-card";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "@/lib/time";
import { Ghost, Loader2, UserPlus, UserMinus, Pencil, Shield } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  isFollowing: boolean;
  isOwnProfile: boolean;
  _count: { posts: number; followers: number; following: number };
};

type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  tags: string[];
  createdAt: string;
  hasReacted: boolean;
  author: { id: string | null; username: string; avatarUrl: string | null };
  _count: { comments: number; reactions: number };
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user, isAuthenticated, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit Profile state
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    async function fetch() {
      const res = await api.get<Profile>(`/api/users/${username}`);
      if (res.success) {
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing);
        if (res.data.isOwnProfile) {
          setEditUsername(res.data.username);
          setEditBio(res.data.bio || "");
        }
      }
      setIsLoading(false);
    }
    fetch();
  }, [username]);

  const fetchPosts = useCallback(async (cursor: string | undefined) => {
    const p = new URLSearchParams();
    if (cursor) p.set("cursor", cursor);
    const res = await api.get<Post[]>(`/api/users/${username}/posts?${p}`);
    if (res.success) {
      const full = res as unknown as { data: Post[]; nextCursor: string | null; hasMore: boolean };
      return full;
    }
    return { data: [], nextCursor: null, hasMore: false };
  }, [username]);

  const fetchAnon = useCallback(async (cursor: string | undefined) => {
    const p = new URLSearchParams();
    if (cursor) p.set("cursor", cursor);
    const res = await api.get<Post[]>(`/api/users/me/anonymous-posts?${p}`);
    if (res.success) {
      const full = res as unknown as { data: Post[]; nextCursor: string | null; hasMore: boolean };
      return full;
    }
    return { data: [], nextCursor: null, hasMore: false };
  }, []);

  const postsScroll = useInfiniteScroll<Post>(fetchPosts);
  const anonScroll = useInfiniteScroll<Post>(fetchAnon);

  async function handleFollow() {
    if (!profile) return;
    const prev = isFollowing;
    setIsFollowing(!isFollowing);
    const res = await api.post<{ following: boolean }>(`/api/users/${profile.id}/follow`);
    if (!res.success) setIsFollowing(prev);
  }

  async function handleUpdateProfile() {
    setIsSavingProfile(true);
    const res = await api.patch("/api/settings/profile", {
      username: editUsername || undefined,
      bio: editBio || null,
    });
    if (res.success) {
      toast({ title: "Profile updated" });
      refreshUser();
      if (editUsername && editUsername !== username) {
        router.push(`/profile/${editUsername}`);
      }
    } else {
      toast({ title: "Update failed", description: res.error, variant: "destructive" });
    }
    setIsSavingProfile(false);
  }

  async function handleChangePassword() {
    setIsSavingPassword(true);
    const res = await api.patch("/api/settings/password", {
      currentPassword,
      newPassword,
    });
    if (res.success) {
      toast({ title: "Password changed" });
      setCurrentPassword("");
      setNewPassword("");
    } else {
      toast({ title: "Failed", description: res.error, variant: "destructive" });
    }
    setIsSavingPassword(false);
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      toast({ title: "Password required", description: "Enter your password to confirm.", variant: "destructive" });
      return;
    }
    const res = await api.delete("/api/settings/account", { password: deletePassword });
    if (res.success) {
      await logout();
      router.push("/");
    } else {
      toast({ title: "Failed", description: "error" in res ? res.error : "Could not delete account", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <p className="py-12 text-center text-muted-foreground">User not found.</p>;
  }

  return (
    <div>
      {/* Profile header */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary sm:h-16 sm:w-16 sm:text-2xl">
              {profile.username[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">{profile.username}</h1>
              {profile.bio && <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Joined {formatDistanceToNow(profile.createdAt)}
              </p>
            </div>
          </div>
          {isAuthenticated && !profile.isOwnProfile && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              className="w-full gap-1 sm:w-auto"
            >
              {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <span><strong className="text-foreground">{profile._count.posts}</strong> <span className="text-muted-foreground">posts</span></span>
          <span><strong className="text-foreground">{profile._count.followers}</strong> <span className="text-muted-foreground">followers</span></span>
          <span><strong className="text-foreground">{profile._count.following}</strong> <span className="text-muted-foreground">following</span></span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="mt-0">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            Posts
          </TabsTrigger>
          {profile.isOwnProfile && (
            <TabsTrigger value="anonymous" className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              <Ghost className="h-3.5 w-3.5" /> Anonymous
            </TabsTrigger>
          )}
          {profile.isOwnProfile && (
            <TabsTrigger value="edit-profile" className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </TabsTrigger>
          )}
          {profile.isOwnProfile && (
            <TabsTrigger value="security" className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              <Shield className="h-3.5 w-3.5" /> Password & Security
            </TabsTrigger>
          )}
        </TabsList>

        {/* Posts tab */}
        <TabsContent value="posts" className="mt-0">
          {postsScroll.items.length === 0 && !postsScroll.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            <>
              {postsScroll.items.map((p) => <PostCard key={p.id} post={p} />)}
              <div ref={postsScroll.sentinelRef} />
            </>
          )}
        </TabsContent>

        {/* Anonymous tab */}
        {profile.isOwnProfile && (
          <TabsContent value="anonymous" className="mt-0">
            {anonScroll.items.length === 0 && !anonScroll.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No anonymous posts.</p>
            ) : (
              <>
                {anonScroll.items.map((p) => <PostCard key={p.id} post={p} />)}
                <div ref={anonScroll.sentinelRef} />
              </>
            )}
          </TabsContent>
        )}

        {/* Edit Profile tab */}
        {profile.isOwnProfile && (
          <TabsContent value="edit-profile" className="mt-0 px-4 py-6">
            <div className="max-w-md space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-bio">Bio</Label>
                <Input
                  id="edit-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 160))}
                  placeholder="Tell us about yourself"
                />
                <p className="text-xs text-muted-foreground">{editBio.length}/160</p>
              </div>
              <Button onClick={handleUpdateProfile} disabled={isSavingProfile} size="sm">
                {isSavingProfile ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Password & Security tab */}
        {profile.isOwnProfile && (
          <TabsContent value="security" className="mt-0 px-4 py-6">
            <div className="max-w-md space-y-8">
              {/* Change password */}
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Change password</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isSavingPassword || !currentPassword || !newPassword}
                    size="sm"
                  >
                    {isSavingPassword ? "Changing..." : "Change password"}
                  </Button>
                </div>
              </section>

              <Separator />

              {/* Delete account */}
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-destructive">Danger zone</h2>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all your data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                      <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                      <Input
                        id="deletePassword"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your password"
                        className="mt-1"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                        Delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
