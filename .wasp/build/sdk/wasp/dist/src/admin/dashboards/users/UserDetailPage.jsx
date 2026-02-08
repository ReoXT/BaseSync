import { AlertCircle, CheckCircle, Clock, Edit, Mail, Pause, Play, RefreshCw, Trash2, UserX, Zap, } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { deleteUser, forceRefreshUserToken, getUserDetail, pauseResumeSync, triggerManualSyncAdmin, updateUser, useQuery, } from "wasp/client/operations";
import { Alert, AlertDescription } from "../../../client/components/ui/alert";
import { Badge } from "../../../client/components/ui/badge";
import { Button } from "../../../client/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../../../client/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../../../client/components/ui/dialog";
import { Input } from "../../../client/components/ui/input";
import { Label } from "../../../client/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../../client/components/ui/select";
import { Switch } from "../../../client/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../client/components/ui/tabs";
import { cn } from "../../../client/utils";
import Breadcrumb from "../../layout/Breadcrumb";
import DefaultLayout from "../../layout/DefaultLayout";
import LoadingSpinner from "../../layout/LoadingSpinner";
const UserDetailPage = ({ user }) => {
    const { userId } = useParams();
    const { data: userDetail, isLoading, refetch } = useQuery(getUserDetail, { userId: userId });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    if (isLoading || !userDetail) {
        return (<DefaultLayout user={user}>
        <LoadingSpinner />
      </DefaultLayout>);
    }
    const handleOpenEditModal = () => {
        setEditFormData({
            email: userDetail.email || "",
            username: userDetail.username || "",
            subscriptionStatus: userDetail.subscriptionStatus || "",
            subscriptionPlan: userDetail.subscriptionPlan || "",
            credits: userDetail.credits || 0,
            isAdmin: userDetail.isAdmin || false,
            emailNotifications: userDetail.emailNotifications ?? true,
            syncFailureAlerts: userDetail.syncFailureAlerts ?? true,
            weeklyDigest: userDetail.weeklyDigest ?? false,
        });
        setEditModalOpen(true);
    };
    const handleSaveUser = async () => {
        try {
            await updateUser({ userId: userId, updates: editFormData });
            setEditModalOpen(false);
            refetch();
        }
        catch (error) {
            alert(error.message || "Failed to update user");
        }
    };
    const handleDeleteUser = async () => {
        if (deleteConfirmEmail !== userDetail.email) {
            alert("Email confirmation does not match");
            return;
        }
        setIsDeleting(true);
        try {
            await deleteUser({ userId: userId, confirmEmail: deleteConfirmEmail });
            alert("User deleted successfully");
            window.location.href = "/admin/users";
        }
        catch (error) {
            alert(error.message || "Failed to delete user");
            setIsDeleting(false);
        }
    };
    const handleRefreshToken = async (service) => {
        try {
            const result = await forceRefreshUserToken({ userId: userId, service });
            alert(result?.message || 'Token refresh initiated');
            refetch();
        }
        catch (error) {
            alert(error.message || "Failed to refresh token");
        }
    };
    const handleToggleSync = async (syncId, currentStatus) => {
        try {
            await pauseResumeSync({ syncConfigId: syncId, isActive: !currentStatus });
            refetch();
        }
        catch (error) {
            alert(error.message || "Failed to toggle sync");
        }
    };
    const handleTriggerSync = async (syncId) => {
        try {
            await triggerManualSyncAdmin({ syncConfigId: syncId });
            alert("Sync triggered successfully");
            refetch();
        }
        catch (error) {
            alert(error.message || "Failed to trigger sync");
        }
    };
    const airtableConnection = userDetail.airtableConnections?.[0];
    const googleConnection = userDetail.googleSheetsConnections?.[0];
    return (<DefaultLayout user={user}>
      <div className="space-y-6">
        <Breadcrumb pageName={`User: ${userDetail.email || "Unknown"}`}/>

        {/* User Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{userDetail.email || "No email"}</CardTitle>
                {userDetail.username && (<CardDescription className="text-base">@{userDetail.username}</CardDescription>)}
                <p className="text-muted-foreground mt-2 text-sm">
                  ID: {userDetail.id} • Joined{" "}
                  {new Date(userDetail.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Badge variant={userDetail.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                    {userDetail.subscriptionPlan || 'Trial'}
                  </Badge>
                  {userDetail.isAdmin && <Badge variant="destructive">Admin</Badge>}
                </div>
                {userDetail.subscriptionStatus && (<Badge variant="outline">{userDetail.subscriptionStatus}</Badge>)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handleOpenEditModal} size="sm">
                <Edit className="mr-2 h-4 w-4"/>
                Edit User
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4"/>
                Send Email
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)}>
                <UserX className="mr-2 h-4 w-4"/>
                Delete User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="syncs">
          <TabsList>
            <TabsTrigger value="syncs">
              Syncs ({userDetail.syncConfigs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="oauth">OAuth Connections</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
          </TabsList>

          {/* Syncs Tab */}
          <TabsContent value="syncs" className="space-y-4">
            {userDetail.syncConfigs && userDetail.syncConfigs.length > 0 ? (userDetail.syncConfigs.map((sync) => (<Card key={sync.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{sync.name}</CardTitle>
                        <Badge variant={sync.lastSyncStatus === 'success'
                ? 'default'
                : sync.lastSyncStatus === 'failed'
                    ? 'destructive'
                    : 'secondary'}>
                          {sync.isActive ? (sync.lastSyncStatus || 'Pending') : ('Paused')}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleSync(sync.id, sync.isActive)}>
                          {sync.isActive ? (<>
                              <Pause className="mr-2 h-4 w-4"/>
                              Pause
                            </>) : (<>
                              <Play className="mr-2 h-4 w-4"/>
                              Resume
                            </>)}
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleTriggerSync(sync.id)}>
                          <Zap className="mr-2 h-4 w-4"/>
                          Sync Now
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {sync.airtableTableName || 'Airtable'} ↔{' '}
                      {sync.googleSheetName || 'Google Sheets'}
                      {sync.lastSyncAt && (<>
                          {" "}• Last synced{" "}
                          {new Date(sync.lastSyncAt).toLocaleString()}
                        </>)}
                    </CardDescription>
                  </CardHeader>
                  {sync.lastErrorMessage && (<CardContent>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription className="ml-2">
                          {sync.lastErrorMessage}
                        </AlertDescription>
                      </Alert>
                    </CardContent>)}
                  {sync.syncLogs && sync.syncLogs.length > 0 && (<CardContent>
                      <p className="text-sm font-medium mb-2">Recent Logs:</p>
                      <div className="space-y-1">
                        {sync.syncLogs.slice(0, 5).map((log) => (<div key={log.id} className="border-border flex items-center justify-between border-b pb-1 text-sm last:border-0">
                            <span className="text-muted-foreground">
                              {new Date(log.startedAt).toLocaleString()}
                            </span>
                            <span className={cn({
                        "text-green-600": log.status === 'SUCCESS',
                        "text-red-600": log.status === 'FAILED',
                        "text-yellow-600": log.status === 'PARTIAL',
                    })}>
                              {log.status} - {log.recordsSynced} records
                            </span>
                          </div>))}
                      </div>
                    </CardContent>)}
                </Card>))) : (<Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No sync configurations yet</p>
                </CardContent>
              </Card>)}
          </TabsContent>

          {/* OAuth Tab */}
          <TabsContent value="oauth" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Airtable Connection</CardTitle>
                    <CardDescription>
                      {airtableConnection
            ? airtableConnection.needsReauth
                ? "Needs Reauthentication"
                : "Connected"
            : "Not Connected"}
                    </CardDescription>
                  </div>
                  {airtableConnection ? (airtableConnection.needsReauth ? (<AlertCircle className="h-6 w-6 text-yellow-500"/>) : (<CheckCircle className="h-6 w-6 text-green-500"/>)) : (<Clock className="h-6 w-6 text-gray-400"/>)}
                </div>
              </CardHeader>
              {airtableConnection && (<CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Account ID:</p>
                    <p className="text-muted-foreground text-sm">
                      {airtableConnection.accountId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Token Expiry:</p>
                    <p className="text-muted-foreground text-sm">
                      {airtableConnection.tokenExpiry
                ? new Date(airtableConnection.tokenExpiry).toLocaleString()
                : "N/A"}
                    </p>
                  </div>
                  {airtableConnection.lastRefreshError && (<Alert variant="destructive">
                      <AlertCircle className="h-4 w-4"/>
                      <AlertDescription className="ml-2">
                        {airtableConnection.lastRefreshError}
                      </AlertDescription>
                    </Alert>)}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRefreshToken('airtable')}>
                      <RefreshCw className="mr-2 h-4 w-4"/>
                      Force Refresh Token
                    </Button>
                  </div>
                </CardContent>)}
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Google Sheets Connection</CardTitle>
                    <CardDescription>
                      {googleConnection
            ? googleConnection.needsReauth
                ? "Needs Reauthentication"
                : "Connected"
            : "Not Connected"}
                    </CardDescription>
                  </div>
                  {googleConnection ? (googleConnection.needsReauth ? (<AlertCircle className="h-6 w-6 text-yellow-500"/>) : (<CheckCircle className="h-6 w-6 text-green-500"/>)) : (<Clock className="h-6 w-6 text-gray-400"/>)}
                </div>
              </CardHeader>
              {googleConnection && (<CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Google Account:</p>
                    <p className="text-muted-foreground text-sm">
                      {googleConnection.googleAccountEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Token Expiry:</p>
                    <p className="text-muted-foreground text-sm">
                      {googleConnection.tokenExpiry
                ? new Date(googleConnection.tokenExpiry).toLocaleString()
                : "N/A"}
                    </p>
                  </div>
                  {googleConnection.lastRefreshError && (<Alert variant="destructive">
                      <AlertCircle className="h-4 w-4"/>
                      <AlertDescription className="ml-2">
                        {googleConnection.lastRefreshError}
                      </AlertDescription>
                    </Alert>)}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRefreshToken('google')}>
                      <RefreshCw className="mr-2 h-4 w-4"/>
                      Force Refresh Token
                    </Button>
                  </div>
                </CardContent>)}
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  Activity log coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage & Billing Tab */}
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Month Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {userDetail.usageStats && userDetail.usageStats.length > 0 ? (<div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Records Synced:</p>
                      <p className="text-2xl font-bold">
                        {userDetail.usageStats[0].recordsSynced}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sync Configs Created:</p>
                      <p className="text-2xl font-bold">
                        {userDetail.usageStats[0].syncConfigsCreated}
                      </p>
                    </div>
                  </div>) : (<p className="text-muted-foreground">No usage data yet</p>)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={editFormData.email || ""} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}/>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={editFormData.username || ""} onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}/>
              </div>
              <div>
                <Label htmlFor="subscriptionStatus">Subscription Status</Label>
                <Select value={editFormData.subscriptionStatus || ""} onValueChange={(value) => setEditFormData({ ...editFormData, subscriptionStatus: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                <Select value={editFormData.subscriptionPlan || ""} onValueChange={(value) => setEditFormData({ ...editFormData, subscriptionPlan: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="credits">Credits</Label>
                <Input id="credits" type="number" value={editFormData.credits || 0} onChange={(e) => setEditFormData({
            ...editFormData,
            credits: parseInt(e.target.value),
        })}/>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isAdmin" checked={editFormData.isAdmin || false} onCheckedChange={(checked) => setEditFormData({ ...editFormData, isAdmin: checked })}/>
                <Label htmlFor="isAdmin">Admin Access</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete User</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the user and
                all associated data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertDescription className="ml-2">
                  Will delete {userDetail.syncConfigs?.length || 0} sync configs and all
                  associated data
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="confirmEmail">
                  Type <strong>{userDetail.email}</strong> to confirm
                </Label>
                <Input id="confirmEmail" value={deleteConfirmEmail} onChange={(e) => setDeleteConfirmEmail(e.target.value)} placeholder="user@example.com"/>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
            setDeleteModalOpen(false);
            setDeleteConfirmEmail("");
        }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting || deleteConfirmEmail !== userDetail.email}>
                {isDeleting ? "Deleting..." : "Delete User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>);
};
export default UserDetailPage;
//# sourceMappingURL=UserDetailPage.jsx.map