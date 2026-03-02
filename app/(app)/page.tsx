import { ResearchForm } from "@/components/research-form"

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            What do you want to research?
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Ask a UX design question and get evidence-based insights from leading research sources.
          </p>
        </div>
        <ResearchForm />
      </div>
    </div>
  )
}
