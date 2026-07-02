import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">Column mapping configuration will be implemented in Milestone 5.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Excel Mapping Templates</CardTitle>
          <CardDescription>Templates define sheet names, header rows, and mapped columns.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Template list placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
