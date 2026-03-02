"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, FileText, Lightbulb, BookOpen, LayoutGrid, Code } from "lucide-react"
import type { RunResult } from "@/lib/types"

export function RunResultTabs({ result }: { result: RunResult }) {
  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="summary" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Summary
        </TabsTrigger>
        <TabsTrigger value="evidence" className="gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Evidence
        </TabsTrigger>
        <TabsTrigger value="examples" className="gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5" />
          Examples
        </TabsTrigger>
        <TabsTrigger value="options" className="gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" />
          Options
        </TabsTrigger>
        <TabsTrigger value="output" className="gap-1.5">
          <Code className="h-3.5 w-3.5" />
          Output
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Research Summary</CardTitle>
            <CardDescription>AI-generated synthesis of findings from indexed sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground">
              {result.summary.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="evidence" className="mt-4">
        <div className="flex flex-col gap-3">
          {result.evidence.map((item, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {item.claim}
                  </p>
                  <Separator />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Citations
                    </span>
                    {item.citations.map((citation, j) => (
                      <a
                        key={j}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {citation.title}
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="examples" className="mt-4">
        <div className="flex flex-col gap-3">
          {result.examples.map((example, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{example.source}</CardTitle>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {example.pattern_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1.5">
                  {example.links.map((link, j) => (
                    <a
                      key={j}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {link.title}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="options" className="mt-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {result.options.map((option, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{option.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-col gap-4">
                  {option.pros && option.pros.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Pros
                      </span>
                      {option.pros.map((pro, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">+</span>
                          <span className="text-foreground">{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {option.cons && option.cons.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Cons
                      </span>
                      {option.cons.map((con, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-destructive mt-0.5 shrink-0">&ndash;</span>
                          <span className="text-foreground">{con}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="output" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Raw Markdown Output</CardTitle>
            <CardDescription>Full research output in markdown format</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono text-foreground leading-relaxed overflow-auto max-h-[600px]">
              {result.markdown}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
