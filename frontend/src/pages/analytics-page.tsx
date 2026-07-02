import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Filtering and CSV export will be implemented in Milestone 9.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Progress Analysis</CardTitle>
          <CardDescription>Date, discipline, and project filters will drive this view.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Analytics placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
