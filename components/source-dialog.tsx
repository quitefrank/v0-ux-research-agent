"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { addSourceAction, updateSourceAction } from "@/lib/actions"
import type { Source } from "@/lib/types"

interface SourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  source?: Source
}

export function SourceDialog({ open, onOpenChange, mode, source }: SourceDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (mode === "edit" && source) {
        formData.set("id", source.id)
        await updateSourceAction(formData)
      } else {
        await addSourceAction(formData)
      }
      router.refresh()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Source" : "Edit Source"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Configure a new research source for indexing."
              : "Update the source configuration."}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g., Nielsen Norman Group"
              defaultValue={source?.name}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="base_url">Base URL</Label>
            <Input
              id="base_url"
              name="base_url"
              type="url"
              required
              placeholder="https://example.com"
              defaultValue={source?.base_url}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="crawl_depth">Crawl Depth (0-2)</Label>
              <Input
                id="crawl_depth"
                name="crawl_depth"
                type="number"
                min={0}
                max={2}
                defaultValue={source?.crawl_depth ?? 1}
              />
            </div>

            <div className="flex flex-col gap-2 justify-end">
              <div className="flex items-center gap-2 h-9">
                <Switch
                  id="enabled"
                  name="enabled"
                  defaultChecked={source?.enabled ?? true}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="include_patterns">Include Patterns</Label>
            <Input
              id="include_patterns"
              name="include_patterns"
              placeholder="/articles/*, /guides/*"
              defaultValue={source?.include_patterns}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="exclude_patterns">Exclude Patterns</Label>
            <Input
              id="exclude_patterns"
              name="exclude_patterns"
              placeholder="/admin/*, /login/*"
              defaultValue={source?.exclude_patterns}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="usability, research, heuristics"
              defaultValue={source?.tags.join(", ")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Optional notes about this source..."
              defaultValue={source?.notes}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                mode === "add" ? "Add Source" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
