"use client"

import { useEffect, useRef, useState } from "react"
import { useActionState } from "react"

import {
  ChatCircleText,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react"

import { createComment, createPost, deletePost, updatePost } from "@/lib/actions/board"
import type { BoardComment, BoardPost } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type PostWithDetails = BoardPost & {
  imageUrl: string | null
  comments: BoardComment[]
}

function useAutoCloseOnSuccess(
  pending: boolean,
  error: string | undefined,
  onSuccess: () => void
) {
  const wasPending = useRef(false)
  useEffect(() => {
    if (wasPending.current && !pending && !error) {
      onSuccess()
    }
    wasPending.current = pending
  }, [pending, error, onSuccess])
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function BoardFeed({
  posts,
  canPost,
  canEdit,
}: {
  posts: PostWithDetails[]
  canPost: boolean
  canEdit: boolean
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<PostWithDetails | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {canPost && (
        <div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Novo post
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            canEdit={canEdit}
            onEdit={() => setEditingPost(post)}
          />
        ))}
        {!posts.length && (
          <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <ChatCircleText className="size-4" />
            Nenhuma publicação ainda.
          </p>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo post</DialogTitle>
          </DialogHeader>
          <CreatePostForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingPost !== null}
        onOpenChange={(open) => !open && setEditingPost(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <EditPostForm
              key={editingPost.id}
              post={editingPost}
              onSuccess={() => setEditingPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreatePostForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(createPost, undefined)
  useAutoCloseOnSuccess(pending, state?.error, onSuccess)

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="caption">Legenda</FieldLabel>
          <Textarea id="caption" name="caption" />
        </Field>
        <Field>
          <FieldLabel htmlFor="image">Imagem (opcional)</FieldLabel>
          <Input id="image" name="image" type="file" accept="image/*" />
        </Field>
        <Field>
          <FieldError
            errors={state?.error ? [{ message: state.error }] : undefined}
          />
          <Button type="submit" disabled={pending}>
            <Plus data-icon="inline-start" />
            {pending ? "Publicando..." : "Publicar"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

function EditPostForm({
  post,
  onSuccess,
}: {
  post: PostWithDetails
  onSuccess: () => void
}) {
  const [state, formAction, pending] = useActionState(updatePost, undefined)
  useAutoCloseOnSuccess(pending, state?.error, onSuccess)

  return (
    <form action={formAction}>
      <input type="hidden" name="post_id" value={post.id} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="caption">Legenda</FieldLabel>
          <Textarea id="caption" name="caption" defaultValue={post.caption ?? ""} />
        </Field>
        <Field>
          <FieldLabel htmlFor="image">
            {post.imageUrl ? "Substituir imagem" : "Imagem (opcional)"}
          </FieldLabel>
          <Input id="image" name="image" type="file" accept="image/*" />
        </Field>
        <Field>
          <FieldError
            errors={state?.error ? [{ message: state.error }] : undefined}
          />
          <Button type="submit" disabled={pending}>
            <PencilSimple data-icon="inline-start" />
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

function PostCard({
  post,
  canEdit,
  onEdit,
}: {
  post: PostWithDetails
  canEdit: boolean
  onEdit: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {post.author_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(post.created_at)}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilSimple data-icon="inline-start" />
              Editar
            </Button>
            <DeletePostButton postId={post.id} />
          </div>
        )}
      </div>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          className="max-h-96 w-full rounded-lg object-cover"
        />
      )}

      {post.caption && (
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {post.caption}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t pt-3">
        {post.comments.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ChatCircleText className="size-3.5" />
            {post.comments.length} comentário{post.comments.length > 1 ? "s" : ""}
          </p>
        )}
        {post.comments.map((comment) => (
          <div key={comment.id} className="text-sm">
            <span className="font-medium text-foreground">
              {comment.author_name}
            </span>{" "}
            <span className="text-muted-foreground">{comment.body}</span>
          </div>
        ))}
        <CommentForm postId={post.id} />
      </div>
    </div>
  )
}

function DeletePostButton({ postId }: { postId: string }) {
  const [, formAction, pending] = useActionState(deletePost, undefined)

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Excluir esta publicação? Esta ação não pode ser desfeita.")) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="post_id" value={postId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Trash data-icon="inline-start" />
        {pending ? "Excluindo..." : "Excluir"}
      </Button>
    </form>
  )
}

function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(createComment, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  useAutoCloseOnSuccess(pending, state?.error, () => formRef.current?.reset())

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="post_id" value={postId} />
      <div className="flex gap-2">
        <Textarea
          name="body"
          placeholder="Escreva um comentário..."
          className="min-h-9"
          required
        />
        <Button type="submit" variant="outline" size="icon" disabled={pending}>
          <PaperPlaneTilt />
        </Button>
      </div>
      <FieldError
        errors={state?.error ? [{ message: state.error }] : undefined}
      />
    </form>
  )
}
