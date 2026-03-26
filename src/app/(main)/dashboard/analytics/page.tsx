import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData } from "@/lib/actions/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, BarChart3, Download, Eye, FileUp, Users } from "lucide-react";
import { AnalyticsDaysFilter } from "@/components/dashboard/analytics-days-filter";

interface AnalyticsPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { days } = await searchParams;
  const withinDays = Math.min(Math.max(parseInt(days ?? "60", 10) || 60, 7), 365);

  const links = await getAnalyticsData(withinDays);

  const totalLinks = links.length;
  const openedLinks = links.filter((l) => l.open_count > 0).length;
  const linksWithGuestInfo = links.filter((l) => l.has_guest_info).length;
  const totalCsvUploads = links.reduce((sum, l) => sum + l.csv_uploads.length, 0);

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDateTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Track link opens, guest activity, and file uploads
              </p>
            </div>
          </div>
          <AnalyticsDaysFilter currentDays={withinDays} />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Links Sent
              </CardDescription>
              <CardTitle className="text-3xl">{totalLinks}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                In the last {withinDays} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                Links Opened
              </CardDescription>
              <CardTitle className="text-3xl">{openedLinks}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {totalLinks > 0
                  ? `${Math.round((openedLinks / totalLinks) * 100)}% open rate`
                  : "No links yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Guests Added Info
              </CardDescription>
              <CardTitle className="text-3xl">{linksWithGuestInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Added companies or uploaded a file
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <FileUp className="h-4 w-4" />
                CSV Uploads
              </CardDescription>
              <CardTitle className="text-3xl">{totalCsvUploads}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Files uploaded by guests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle>Link Activity</CardTitle>
            <CardDescription>
              All custom links sent in the last {withinDays} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No links found in the last {withinDays} days.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="text-center">Opens</TableHead>
                      <TableHead>Last Opened</TableHead>
                      <TableHead className="text-center">Guest Info</TableHead>
                      <TableHead className="text-center">Files Uploaded</TableHead>
                      <TableHead>Guest List Files</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">
                          {link.company_name}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {link.contact_name ?? "—"}
                            </p>
                            {link.contact_email && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {link.contact_email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(link.created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {link.open_count > 0 ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                              {link.open_count}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              0
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(link.last_opened_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {link.has_guest_info ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                              Yes
                              {link.guest_target_count > 0 && (
                                <span className="ml-1 opacity-70">
                                  ({link.guest_target_count})
                                </span>
                              )}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {link.csv_uploads.length > 0 ? (
                            <div className="flex flex-col gap-1 items-center">
                              {link.csv_uploads.map((upload) => (
                                <div
                                  key={upload.id}
                                  className="text-xs bg-orange-50 border border-orange-200 text-orange-800 rounded px-2 py-0.5 whitespace-nowrap max-w-40 truncate"
                                  title={upload.file_name ?? "Uploaded file"}
                                >
                                  {upload.file_name ?? "file.csv"} — {upload.success_count} rows
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {link.guest_files.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {link.guest_files.map((f) =>
                                f.signed_url ? (
                                  <a
                                    key={f.id}
                                    href={f.signed_url}
                                    download={f.file_name}
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                                    title={`Uploaded ${formatDateTime(f.created_at)}`}
                                  >
                                    <Download className="h-3 w-3 shrink-0" />
                                    {f.file_name}
                                  </a>
                                ) : (
                                  <span key={f.id} className="text-xs text-muted-foreground">
                                    {f.file_name}
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
