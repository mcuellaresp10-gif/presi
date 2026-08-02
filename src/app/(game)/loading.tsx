export default function GameLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col gap-4 px-4 pb-28 pt-6">
      <div className="h-8 w-40 animate-pulse rounded-md bg-white/10" />
      <div className="h-4 w-56 animate-pulse rounded-md bg-white/5" />
      <div className="mt-2 aspect-[3/4] w-full animate-pulse rounded-2xl bg-white/5" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-16 animate-pulse rounded-xl bg-white/5" />
        <div className="h-16 animate-pulse rounded-xl bg-white/5" />
        <div className="h-16 animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
