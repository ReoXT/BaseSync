import { Activity, AlertTriangle, DollarSign, RefreshCw, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminOverviewStats, getRecentActivity, searchUsers, useQuery, } from "wasp/client/operations";
import { Alert, AlertDescription } from "../../../client/components/ui/alert";
import { Badge } from "../../../client/components/ui/badge";
import { Button } from "../../../client/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../../../client/components/ui/card";
import { Input } from "../../../client/components/ui/input";
import { cn } from "../../../client/utils";
import DefaultLayout from "../../layout/DefaultLayout";
import LoadingSpinner from "../../layout/LoadingSpinner";
const OverviewPage = ({ user }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const { data: stats, isLoading: statsLoading } = useQuery(getAdminOverviewStats);
    const { data: recentActivity, isLoading: activityLoading } = useQuery(getRecentActivity);
    // Search users as they type
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length === 0) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchUsers({ query });
            setSearchResults(results || []);
        }
        catch (error) {
            console.error('Search error:', error);
        }
        finally {
            setIsSearching(false);
        }
    };
    if (statsLoading || !stats) {
        return (<DefaultLayout user={user}>
        <LoadingSpinner />
      </DefaultLayout>);
    }
    const hasAlerts = stats.alerts.failedSyncs > 0 ||
        stats.alerts.needsReauth > 0 ||
        stats.alerts.trialExpiringSoon > 0;
    return (<DefaultLayout user={user}>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-foreground text-3xl font-bold">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform health and manage users
          </p>
        </div>

        {/* Alert Bar */}
        {hasAlerts && (<div className="space-y-2">
            {stats.alerts.failedSyncs > 0 && (<Alert variant="destructive">
                <XCircle className="h-4 w-4"/>
                <AlertDescription className="ml-2 flex items-center justify-between">
                  <span>
                    <strong>{stats.alerts.failedSyncs} syncs failing</strong> (affecting{" "}
                    {stats.syncs.uniqueFailedUsers} users)
                    {stats.alerts.errorTypes.length > 0 && (<span className="ml-2 text-sm">
                        • {stats.alerts.errorTypes.map((e) => `${e.type} (${e.count})`).join(', ')}
                      </span>)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/sync-monitor')}>
                    View Details
                  </Button>
                </AlertDescription>
              </Alert>)}

            {stats.alerts.needsReauth > 0 && (<Alert variant="default">
                <AlertTriangle className="h-4 w-4"/>
                <AlertDescription className="ml-2 flex items-center justify-between">
                  <span>
                    <strong>{stats.alerts.needsReauth} users need OAuth reauth</strong>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
                    View Users
                  </Button>
                </AlertDescription>
              </Alert>)}

            {stats.alerts.trialExpiringSoon > 0 && (<Alert variant="default">
                <AlertTriangle className="h-4 w-4"/>
                <AlertDescription className="ml-2">
                  <strong>{stats.alerts.trialExpiringSoon} trial users</strong> expire in 3
                  days
                </AlertDescription>
              </Alert>)}
          </div>)}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Users Online */}
          <Card className="cursor-pointer hover:shadow-lg" onClick={() => navigate('/admin/users')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users Online Now</CardTitle>
              <Users className="text-muted-foreground h-4 w-4"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.online}</div>
              <p className="text-muted-foreground text-xs">
                {stats.users.total} total users, {stats.users.paid} paid
              </p>
            </CardContent>
          </Card>

          {/* Active Syncs */}
          <Card className="cursor-pointer hover:shadow-lg" onClick={() => navigate('/admin/sync-monitor')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Syncs</CardTitle>
              <RefreshCw className="text-muted-foreground h-4 w-4 animate-spin"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.syncs.active.length}</div>
              <p className="text-muted-foreground text-xs">
                {stats.syncs.completedToday} completed today
              </p>
              {stats.syncs.active.length > 0 && (<div className="mt-2 space-y-1">
                  {stats.syncs.active.slice(0, 2).map((sync) => (<p key={sync.id} className="text-muted-foreground truncate text-xs">
                      {sync.userEmail} - {sync.syncName}
                    </p>))}
                </div>)}
            </CardContent>
          </Card>

          {/* Failed Syncs */}
          <Card className={cn("cursor-pointer hover:shadow-lg", {
            "border-red-500": stats.alerts.failedSyncs > 0,
        })} onClick={() => navigate('/admin/sync-monitor')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Syncs (24h)</CardTitle>
              <XCircle className={cn("h-4 w-4", {
            "text-red-500": stats.alerts.failedSyncs > 0,
            "text-muted-foreground": stats.alerts.failedSyncs === 0
        })}/>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", {
            "text-red-500": stats.alerts.failedSyncs > 0
        })}>
                {stats.alerts.failedSyncs}
              </div>
              <p className="text-muted-foreground text-xs">
                Affecting {stats.syncs.uniqueFailedUsers} users
              </p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (MRR)</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.revenue.mrr}</div>
              <p className="text-muted-foreground text-xs">
                +{stats.revenue.newSubscriptionsThisMonth} new subs this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5"/>
                Recent Activity
              </CardTitle>
              <CardDescription>Live feed of platform events</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (<LoadingSpinner />) : (<div className="space-y-2">
                  {recentActivity && recentActivity.length > 0 ? (recentActivity.map((activity, idx) => {
                const timeAgo = getTimeAgo(new Date(activity.timestamp));
                const statusColor = activity.type === 'sync_failed' ? 'text-red-500' :
                    activity.type === 'sync_completed' ? 'text-green-500' :
                        'text-blue-500';
                return (<div key={idx} className="border-border flex items-start justify-between border-b pb-2 last:border-0 cursor-pointer hover:bg-accent/50 p-2 rounded" onClick={() => navigate(`/admin/users/${activity.userId}`)}>
                          <div className="flex-1">
                            <span className={cn("text-sm", statusColor)}>
                              [{timeAgo}]
                            </span>{" "}
                            <span className="text-sm">{activity.userEmail}</span>
                            <p className="text-muted-foreground text-xs">
                              {activity.description}
                            </p>
                          </div>
                        </div>);
            })) : (<p className="text-muted-foreground text-sm">No recent activity</p>)}
                </div>)}
            </CardContent>
          </Card>

          {/* Quick Search */}
          <Card>
            <CardHeader>
              <CardTitle>Quick User Search</CardTitle>
              <CardDescription>Search by email or username</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)}/>
                {isSearching && (<div className="absolute right-3 top-2">
                    <RefreshCw className="h-4 w-4 animate-spin"/>
                  </div>)}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (<div className="border-border space-y-2 rounded border p-2">
                  {searchResults.map((user) => (<div key={user.id} className="hover:bg-accent flex cursor-pointer items-center justify-between rounded p-2" onClick={() => {
                    navigate(`/admin/users/${user.id}`);
                    setSearchQuery("");
                    setSearchResults([]);
                }}>
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        {user.username && (<p className="text-muted-foreground text-xs">{user.username}</p>)}
                      </div>
                      <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                        {user.subscriptionPlan || 'Trial'}
                      </Badge>
                    </div>))}
                </div>)}

              {searchQuery.trim().length > 0 && searchResults.length === 0 && !isSearching && (<p className="text-muted-foreground text-sm">No users found</p>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </DefaultLayout>);
};
// Helper function to calculate time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
export default OverviewPage;
//# sourceMappingURL=OverviewPage.jsx.map