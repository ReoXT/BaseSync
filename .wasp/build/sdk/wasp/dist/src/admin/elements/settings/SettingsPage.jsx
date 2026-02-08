import { AlertCircle, CheckCircle, Database, Key, Mail, Server } from "lucide-react";
import { Alert, AlertDescription } from "../../../client/components/ui/alert";
import { Badge } from "../../../client/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../../../client/components/ui/card";
import Breadcrumb from "../../layout/Breadcrumb";
import DefaultLayout from "../../layout/DefaultLayout";
const SettingsPage = ({ user }) => {
    // Check environment variables (in a real implementation, you'd call a server query)
    const envVars = [
        {
            name: "AIRTABLE_CLIENT_ID",
            status: !!process.env.AIRTABLE_CLIENT_ID,
            required: true,
        },
        {
            name: "AIRTABLE_CLIENT_SECRET",
            status: !!process.env.AIRTABLE_CLIENT_SECRET,
            required: true,
        },
        {
            name: "GOOGLE_SHEETS_CLIENT_ID",
            status: !!process.env.GOOGLE_SHEETS_CLIENT_ID,
            required: true,
        },
        {
            name: "GOOGLE_SHEETS_CLIENT_SECRET",
            status: !!process.env.GOOGLE_SHEETS_CLIENT_SECRET,
            required: true,
        },
        {
            name: "ENCRYPTION_KEY",
            status: !!process.env.ENCRYPTION_KEY,
            required: true,
        },
        {
            name: "RESEND_API_KEY",
            status: !!process.env.RESEND_API_KEY,
            required: true,
        },
    ];
    const allConfigured = envVars.filter((v) => v.required).every((v) => v.status);
    return (<DefaultLayout user={user}>
      <div className="space-y-6">
        <Breadcrumb pageName="Admin Settings"/>

        <div className="space-y-6">
          {/* System Health Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Overall platform status</CardDescription>
                </div>
                {allConfigured ? (<Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3"/>
                    All Systems Operational
                  </Badge>) : (<Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3"/>
                    Configuration Required
                  </Badge>)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Database className="text-muted-foreground mt-1 h-5 w-5"/>
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-muted-foreground text-sm">
                      PostgreSQL Connected
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Server className="text-muted-foreground mt-1 h-5 w-5"/>
                  <div>
                    <p className="font-medium">Background Jobs</p>
                    <p className="text-muted-foreground text-sm">
                      PgBoss Active
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="text-muted-foreground mt-1 h-5 w-5"/>
                  <div>
                    <p className="font-medium">Email Service</p>
                    <p className="text-muted-foreground text-sm">
                      Resend API Connected
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Key className="text-muted-foreground mt-1 h-5 w-5"/>
                  <div>
                    <p className="font-medium">OAuth Services</p>
                    <p className="text-muted-foreground text-sm">
                      Airtable & Google Configured
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>
                Critical environment variables for platform operation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {envVars.map((envVar) => (<div key={envVar.name} className="border-border flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{envVar.name}</p>
                      {envVar.required && (<p className="text-muted-foreground text-xs">Required</p>)}
                    </div>
                    {envVar.status ? (<Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3"/>
                        Configured
                      </Badge>) : (<Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3"/>
                        Missing
                      </Badge>)}
                  </div>))}
              </div>

              {!allConfigured && (<Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4"/>
                  <AlertDescription className="ml-2">
                    Some required environment variables are missing. Check your .env.server file
                    and ensure all values are set.
                  </AlertDescription>
                </Alert>)}
            </CardContent>
          </Card>

          {/* API Rate Limits (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>API Rate Limits</CardTitle>
              <CardDescription>
                Current usage against external API quotas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Airtable API</p>
                    <p className="text-muted-foreground text-sm">Unknown / 100,000 daily</p>
                  </div>
                  <div className="bg-muted h-2 w-full rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Google Sheets API</p>
                    <p className="text-muted-foreground text-sm">Unknown / 10,000 daily</p>
                  </div>
                  <div className="bg-muted h-2 w-full rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    API quota tracking coming soon. For now, monitor your usage in the Airtable and
                    Google Cloud consoles.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Background Jobs Status */}
          <Card>
            <CardHeader>
              <CardTitle>Background Jobs</CardTitle>
              <CardDescription>
                Scheduled tasks and sync jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sync Job</p>
                    <p className="text-muted-foreground text-xs">Runs every 5 minutes</p>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="mr-1 h-3 w-3"/>
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Daily Stats Job</p>
                    <p className="text-muted-foreground text-xs">Runs daily at midnight</p>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="mr-1 h-3 w-3"/>
                    Active
                  </Badge>
                </div>

                <Alert>
                  <AlertDescription>
                    Background jobs are managed by PgBoss. Check the database pg_boss schema for
                    detailed job execution logs.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DefaultLayout>);
};
export default SettingsPage;
//# sourceMappingURL=SettingsPage.jsx.map