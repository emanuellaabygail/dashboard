import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Excel uploads will be implemented in Milestone 6.</p>
        </div>
        <Button disabled>
          <Upload className="size-4" aria-hidden="true" />
          Upload Report
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Uploaded Excel files will be parsed once into normalized rows.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Upload history placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
