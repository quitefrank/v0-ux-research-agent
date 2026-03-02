"use client"

import { useActionState } from "react"
import { runResearch } from "@/lib/actions"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight, Loader2 } from "lucide-react"

const PLATFORMS = ["iOS", "Android", "Web", "Cross-platform"]
const PATTERN_TYPES = [
  "Navigation",
  "Forms",
  "Onboarding",
  "Search",
  "Data Display",
  "Feedback",
  "Authentication",
  "Settings",
  "Checkout",
]
const PRODUCT_CATEGORIES = [
  "E-commerce",
  "SaaS",
  "Social",
  "Productivity",
  "Finance",
  "Healthcare",
  "Education",
  "Media",
]

export function ResearchForm() {
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      await runResearch(formData)
    },
    null
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Textarea
        name="query"
        placeholder="e.g., What are the best practices for mobile checkout flows?"
        required
        rows={4}
        className="resize-none text-base bg-card"
        disabled={isPending}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select name="platform">
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select name="pattern_type">
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="Pattern type" />
          </SelectTrigger>
          <SelectContent>
            {PATTERN_TYPES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select name="product_category">
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Researching...
          </>
        ) : (
          <>
            Run Research
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
