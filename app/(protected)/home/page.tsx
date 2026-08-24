import { redirect } from "next/navigation"

import { BoardFeed } from "@/components/board-feed"
import { createClient } from "@/lib/supabase/server"
import type { BoardComment, BoardPost, Profile } from "@/lib/types"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>()

  const canPost = profile?.role === "MASTER" || profile?.role === "ADM"

  const { data: posts } = await supabase
    .from("board_posts")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: comments } = await supabase
    .from("board_comments")
    .select("*")
    .order("created_at", { ascending: true })

  const commentsByPost = new Map<string, BoardComment[]>()
  for (const comment of (comments as BoardComment[] | null) ?? []) {
    const list = commentsByPost.get(comment.post_id) ?? []
    list.push(comment)
    commentsByPost.set(comment.post_id, list)
  }

  const postsWithDetails = await Promise.all(
    ((posts as BoardPost[] | null) ?? []).map(async (post) => {
      let imageUrl: string | null = null
      if (post.image_path) {
        const { data: signed } = await supabase.storage
          .from("board-images")
          .createSignedUrl(post.image_path, 3600)
        imageUrl = signed?.signedUrl ?? null
      }
      return {
        ...post,
        imageUrl,
        comments: commentsByPost.get(post.id) ?? [],
      }
    })
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Avisos e publicações do sistema.
        </p>
      </div>
      <BoardFeed posts={postsWithDetails} canPost={canPost} canEdit={canPost} />
    </div>
  )
}
