import { Edit, Play, Trash2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "../utils";
/**
 * Display user's sync configurations in a table/list view
 * Shows: Name, Source→Destination, Status, Last Sync, Actions
 */
export function SyncConfigList({ syncConfigs, isLoading = false, onEdit, onSyncNow, onDelete, }) {
    const [deletingId, setDeletingId] = useState(null);
    const [syncingId, setSyncingId] = useState(null);
    // Handle sync now with loading state
    const handleSyncNow = async (config) => {
        if (!onSyncNow)
            return;
        setSyncingId(config.id);
        try {
            await onSyncNow(config);
        }
        finally {
            setSyncingId(null);
        }
    };
    // Handle delete with loading state
    const handleDelete = async (config) => {
        if (!onDelete)
            return;
        if (!window.confirm(`Are you sure you want to delete "${config.name}"?`)) {
            return;
        }
        setDeletingId(config.id);
        try {
            await onDelete(config);
        }
        finally {
            setDeletingId(null);
        }
    };
    // Format last sync timestamp
    const formatLastSync = (timestamp) => {
        if (!timestamp)
            return "Never";
        try {
            const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1)
                return "Just now";
            if (diffMins < 60)
                return `${diffMins}m ago`;
            if (diffHours < 24)
                return `${diffHours}h ago`;
            if (diffDays < 7)
                return `${diffDays}d ago`;
            return date.toLocaleDateString();
        }
        catch (error) {
            return "Unknown";
        }
    };
    // Get sync direction display
    const getSyncDirectionDisplay = (config) => {
        const source = config.airtableTableName || "Airtable";
        const destination = config.googleSheetName || "Google Sheets";
        switch (config.syncDirection) {
            case "AIRTABLE_TO_SHEETS":
                return (<div className="flex items-center gap-1 text-sm">
            <span className="truncate">{source}</span>
            <ArrowRight className="size-4 flex-shrink-0"/>
            <span className="truncate">{destination}</span>
          </div>);
            case "SHEETS_TO_AIRTABLE":
                return (<div className="flex items-center gap-1 text-sm">
            <span className="truncate">{destination}</span>
            <ArrowRight className="size-4 flex-shrink-0"/>
            <span className="truncate">{source}</span>
          </div>);
            case "BIDIRECTIONAL":
                return (<div className="flex items-center gap-1 text-sm">
            <span className="truncate">{source}</span>
            <span className="flex-shrink-0">↔</span>
            <span className="truncate">{destination}</span>
          </div>);
        }
    };
    // Get status badge
    const getStatusBadge = (status, isActive) => {
        if (!isActive) {
            return (<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          Paused
        </span>);
        }
        switch (status) {
            case "success":
                return (<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="size-3"/>
            Success
          </span>);
            case "failed":
                return (<span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
            <AlertCircle className="size-3"/>
            Failed
          </span>);
            case "partial":
                return (<span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
            <AlertCircle className="size-3"/>
            Partial
          </span>);
            default:
                return (<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            Pending
          </span>);
        }
    };
    // Empty state
    if (!isLoading && syncConfigs.length === 0) {
        return (<Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="size-12 text-muted-foreground mb-4"/>
          <h3 className="text-foreground text-lg font-semibold mb-2">
            No sync configurations yet
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Connect both Airtable and Google Sheets to start creating sync configurations.
          </p>
        </CardContent>
      </Card>);
    }
    // Loading state
    if (isLoading) {
        return (<Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>);
    }
    // Table view
    return (<div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Sync Direction
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Last Sync
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {syncConfigs.map((config) => (<tr key={config.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {config.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getSyncDirectionDisplay(config)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(config.lastSyncStatus, config.isActive)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatLastSync(config.lastSyncAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {onEdit && (<Button variant="ghost" size="sm" onClick={() => onEdit(config)} title="Edit">
                              <Edit className="size-4"/>
                            </Button>)}
                          {onSyncNow && config.isActive && (<Button variant="ghost" size="sm" onClick={() => handleSyncNow(config)} disabled={syncingId === config.id} title="Sync Now">
                              <Play className={cn("size-4", {
                    "animate-spin": syncingId === config.id,
                })}/>
                            </Button>)}
                          {onDelete && (<Button variant="ghost" size="sm" onClick={() => handleDelete(config)} disabled={deletingId === config.id} title="Delete" className="text-destructive hover:text-destructive/80">
                              <Trash2 className="size-4"/>
                            </Button>)}
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {syncConfigs.map((config) => (<Card key={config.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{config.name}</h3>
                    <div className="text-muted-foreground mt-1">
                      {getSyncDirectionDisplay(config)}
                    </div>
                  </div>
                  {getStatusBadge(config.lastSyncStatus, config.isActive)}
                </div>

                <div className="text-sm text-muted-foreground">
                  Last sync: {formatLastSync(config.lastSyncAt)}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  {onEdit && (<Button variant="outline" size="sm" onClick={() => onEdit(config)} className="flex-1">
                      <Edit className="size-4 mr-2"/>
                      Edit
                    </Button>)}
                  {onSyncNow && config.isActive && (<Button variant="outline" size="sm" onClick={() => handleSyncNow(config)} disabled={syncingId === config.id} className="flex-1">
                      <Play className={cn("size-4 mr-2", {
                    "animate-spin": syncingId === config.id,
                })}/>
                      Sync
                    </Button>)}
                  {onDelete && (<Button variant="ghost" size="sm" onClick={() => handleDelete(config)} disabled={deletingId === config.id} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="size-4"/>
                    </Button>)}
                </div>
              </div>
            </CardContent>
          </Card>))}
      </div>
    </div>);
}
//# sourceMappingURL=SyncConfigList.jsx.map