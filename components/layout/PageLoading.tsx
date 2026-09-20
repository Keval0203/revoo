import { Loader } from "@/components/ui/loader";

export function PageLoading() {
  return (
    <div className="min-h-[40vh] w-full px-4 py-12" role="status" aria-label="Loading page">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 text-center">
        <Loader variant="dots" size="md" />
        <span className="text-sm text-muted-foreground">Loading courts...</span>
      </div>
    </div>
  );
}
