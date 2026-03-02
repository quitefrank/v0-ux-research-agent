"use client"

import { useState, useTransition } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"
import { Plus, RefreshCw, Pencil, Trash2, Loader2 } from "lucide-react"
import { toggleSourceAction, deleteSourceAction, indexSources } from "@/lib/actions"
import type { Source, IndexResult } from "@/lib/types"
import { SourceDialog } from "@/components/source-dialog"
import { useRouter } from "next/navigation"

export function SourcesTable({ sources }: { sources: Source[] }) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editSource, setEditSource] = useState<Source | null>(null)
  const [isPending, startTransition] = useTransition()
  const [indexing, setIndexing] = useState(false)
  const [indexResults, setIndexResults] = useState<IndexResult[] | null>(null)

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleSourceAction(id)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSourceAction(id)
      router.refresh()
    })
  }

  async function handleIndex() {
    setIndexing(true)
    setIndexResults(null)
    try {
      const results = await indexSources()
      setIndexResults(results)
      router.refresh()
    } finally {
      setIndexing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4" />
          Add Source
        </Button>
        <Button
          onClick={handleIndex}
          variant="outline"
          size="sm"
          disabled={indexing}
        >
          {indexing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {indexing ? "Indexing..." : "Index Enabled Sources"}
        </Button>
      </div>

      {indexResults && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Indexing Results</h3>
          <div className="flex flex-col gap-1.5">
            {indexResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge
                  variant={r.status === "success" ? "default" : "destructive"}
                  className="text-[11px] px-1.5"
                >
                  {r.status}
                </Badge>
                <span className="text-foreground font-medium">{r.source_name}</span>
                <span className="text-muted-foreground">
                  {r.pages_added} added, {r.pages_updated} updated
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">URL</TableHead>
              <TableHead className="text-center">Enabled</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Depth</TableHead>
              <TableHead className="hidden lg:table-cell">Tags</TableHead>
              <TableHead className="hidden lg:table-cell">Last Indexed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No sources configured. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium text-foreground">{source.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                      {source.base_url}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={() => handleToggle(source.id)}
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {source.crawl_depth}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {source.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {source.last_indexed ? (
                      <span className="text-sm text-muted-foreground">
                        {new Date(source.last_indexed).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditSource(source)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete source</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &ldquo;{source.name}&rdquo;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(source.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SourceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
      />

      {editSource && (
        <SourceDialog
          open={!!editSource}
          onOpenChange={(open) => {
            if (!open) setEditSource(null)
          }}
          mode="edit"
          source={editSource}
        />
      )}
    </div>
  )
}
