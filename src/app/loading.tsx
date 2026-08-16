export default function Loading() {
  return (
    <div className="container-page py-16" role="status" aria-label="Loading">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-10 w-2/3 max-w-md" />
      <div className="skeleton mt-3 h-4 w-full max-w-lg" />
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="space-y-3">
            <div className="skeleton aspect-square" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
