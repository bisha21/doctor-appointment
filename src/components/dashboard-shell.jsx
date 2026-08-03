export function DashboardShell({ title, description, sidebar, children }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 md:items-start">
        <aside className="md:w-64 shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] md:overflow-y-auto">
          {sidebar}
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
