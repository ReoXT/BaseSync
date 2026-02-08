import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type AuthUser } from "wasp/auth";
import { getSyncMonitor, useQuery } from "wasp/client/operations";
import { Badge } from "../../../client/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../client/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../client/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../client/components/ui/tabs";
import { cn } from "../../../client/utils";
import Breadcrumb from "../../layout/Breadcrumb";
import DefaultLayout from "../../layout/DefaultLayout";
import LoadingSpinner from "../../layout/LoadingSpinner";

const SyncMonitorPage = ({ user }: { user: AuthUser }) => {
  const navigate = useNavigate();
  const { data: syncData, isLoading } = useQuery(getSyncMonitor);

  if (isLoading || !syncData) {
    return (
      <DefaultLayout user={user}>
        <LoadingSpinner />
      </DefaultLayout>
    );
  }

  const { active, recentCompleted, failed } = syncData;

  return (
    <DefaultLayout user={user}>
      <div className="space-y-6">
        <Breadcrumb pageName="Sync Monitor" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{active.length}</div>
              <p className="text-muted-foreground text-xs">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Success</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCompleted.length}</div>
              <p className="text-muted-foreground text-xs">Last hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed (24h)</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", {
                "text-red-500": failed.length > 0
              })}>
                {failed.length}
              </div>
              <p className="text-muted-foreground text-xs">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={failed.length > 0 ? "failed" : "active"}>
          <TabsList>
            <TabsTrigger value="active">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              Recent Success ({recentCompleted.length})
            </TabsTrigger>
            <TabsTrigger value="failed" className={cn({
              "text-red-600": failed.length > 0
            })}>
              Failed ({failed.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Syncs */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Syncs</CardTitle>
                <CardDescription>Syncs currently in progress</CardDescription>
              </CardHeader>
              <CardContent>
                {active.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Sync Name</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {active.map((log: any) => {
                        const duration = Math.floor(
                          (new Date().getTime() - new Date(log.startedAt).getTime()) / 1000
                        );
                        return (
                          <TableRow
                            key={log.id}
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => navigate(`/admin/users/${log.syncConfig.userId}`)}
                          >
                            <TableCell className="font-medium">
                              {log.syncConfig.user.email}
                            </TableCell>
                            <TableCell>{log.syncConfig.name}</TableCell>
                            <TableCell>
                              {new Date(log.startedAt).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>{duration}s</TableCell>
                            <TableCell>
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Running
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">No active syncs right now</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Completed */}
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recently Completed</CardTitle>
                <CardDescription>Successful syncs in the last hour</CardDescription>
              </CardHeader>
              <CardContent>
                {recentCompleted.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Sync Name</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCompleted.map((log: any) => {
                        const duration = log.completedAt && log.startedAt
                          ? Math.floor(
                              (new Date(log.completedAt).getTime() -
                                new Date(log.startedAt).getTime()) /
                                1000
                            )
                          : 0;
                        return (
                          <TableRow
                            key={log.id}
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => navigate(`/admin/users/${log.syncConfig.userId}`)}
                          >
                            <TableCell className="font-medium">
                              {log.syncConfig.user.email}
                            </TableCell>
                            <TableCell>{log.syncConfig.name}</TableCell>
                            <TableCell>
                              {log.completedAt
                                ? new Date(log.completedAt).toLocaleTimeString()
                                : "N/A"}
                            </TableCell>
                            <TableCell>{log.recordsSynced}</TableCell>
                            <TableCell>{duration}s</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No completed syncs in the last hour</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failed Syncs */}
          <TabsContent value="failed">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Failed Syncs</CardTitle>
                <CardDescription>Syncs that failed in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {failed.length > 0 ? (
                  <div className="space-y-4">
                    {failed.map((log: any) => {
                      let errorMessage = "Unknown error";
                      if (log.errors) {
                        try {
                          const errors = JSON.parse(log.errors);
                          if (Array.isArray(errors) && errors.length > 0) {
                            errorMessage = errors[0].error || errorMessage;
                          }
                        } catch (e) {
                          errorMessage = log.errors.substring(0, 100);
                        }
                      }

                      return (
                        <Card
                          key={log.id}
                          className="border-red-200 cursor-pointer hover:shadow-md"
                          onClick={() => navigate(`/admin/users/${log.syncConfig.userId}`)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {log.syncConfig.name}
                                </CardTitle>
                                <CardDescription>
                                  User: {log.syncConfig.user.email}
                                </CardDescription>
                              </div>
                              <Badge variant="destructive">Failed</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800 p-3">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                  Error:
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {errorMessage}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Failed: {new Date(log.startedAt).toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">
                                  Records attempted: {log.recordsSynced}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <p className="text-muted-foreground mt-2">
                      No failed syncs in the last 24 hours!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DefaultLayout>
  );
};

export default SyncMonitorPage;
