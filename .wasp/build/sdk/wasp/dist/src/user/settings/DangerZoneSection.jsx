import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from 'wasp/client/auth';
import { exportUserData, deleteAccount } from 'wasp/client/operations';
import { logout } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../client/components/ui/button';
import { Input } from '../../client/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '../../client/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from '../../client/components/ui/form';
import { useToast } from '../../client/hooks/use-toast';
import { Loader2, AlertTriangle, Download, Trash2 } from 'lucide-react';
// ============================================================================
// SCHEMA
// ============================================================================
const deleteAccountSchema = z.object({
    confirmationText: z.string().refine((val) => val === 'DELETE MY ACCOUNT', {
        message: 'Please type exactly: DELETE MY ACCOUNT',
    }),
    password: z.string().min(1, 'Password is required'),
});
// ============================================================================
// COMPONENT
// ============================================================================
export default function DangerZoneSection() {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-red-400">Danger Zone</h2>
        <p className="text-muted-foreground mt-1">
          Irreversible and destructive actions
        </p>
      </div>

      {/* Warning Alert */}
      <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-sm p-4 animate-pulse-subtle">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5"/>
          <p className="text-sm text-foreground">
            <strong className="font-semibold">Warning:</strong> Actions in this section are permanent and cannot be undone. Please proceed with caution.
          </p>
        </div>
      </div>

      <ExportDataCard />
      <DeleteAccountCard />
    </div>);
}
// ============================================================================
// EXPORT DATA CARD
// ============================================================================
function ExportDataCard() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await exportUserData();
            // Create JSON blob
            const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
            // Create download link
            const url = URL.createObjectURL(jsonBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `basesync-data-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({
                title: 'Export Complete',
                description: 'Your data has been downloaded as a JSON file',
            });
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: error.message || 'Failed to export your data',
            });
        }
        finally {
            setIsExporting(false);
        }
    };
    return (<div className="rounded-2xl border border-amber-500/30 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-amber-500/50">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Download className="h-5 w-5 text-amber-400"/>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Export Your Data</h3>
            <p className="text-sm text-muted-foreground">
              Download a copy of all your data (GDPR compliance)
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Your export will include:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-none">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Profile information (email, username)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Subscription and billing history
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Sync configurations and field mappings
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Sync logs (last 100 syncs)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Usage statistics
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Connection metadata (OAuth tokens excluded for security)
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm p-4">
          <p className="text-sm text-foreground/90">
            <strong className="font-semibold">Note:</strong> OAuth access tokens are excluded from the export for security reasons. Reconnecting services will require re-authorization.
          </p>
        </div>

        <Button variant="outline" onClick={handleExport} disabled={isExporting} className="border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 transition-all duration-300">
          {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
          <Download className="mr-2 h-4 w-4"/>
          Export Data as JSON
        </Button>
      </div>
    </div>);
}
// ============================================================================
// DELETE ACCOUNT CARD
// ============================================================================
function DeleteAccountCard() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { data: user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const form = useForm({
        resolver: zodResolver(deleteAccountSchema),
        defaultValues: {
            confirmationText: '',
            password: '',
        },
    });
    const onSubmit = async (data) => {
        setIsDeleting(true);
        try {
            await deleteAccount({
                confirmationText: data.confirmationText,
                password: data.password,
            });
            toast({
                title: 'Account Deleted',
                description: 'Your account has been permanently deleted',
            });
            // Logout and redirect to home
            await logout();
            navigate('/');
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Failed to delete account',
            });
            setIsDeleting(false);
        }
    };
    const handleDialogOpenChange = (open) => {
        setIsOpen(open);
        if (!open) {
            form.reset();
        }
    };
    return (<div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-600/5 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-red-500/50">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-400"/>
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400">Delete Account</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5"/>
            <p className="text-sm text-foreground">
              <strong className="font-semibold">This action cannot be undone.</strong> This will permanently delete your account and remove all data from our servers, including:
            </p>
          </div>
        </div>

        <ul className="text-sm text-muted-foreground space-y-2 list-none">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            All sync configurations
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            All sync logs and history
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            OAuth connections to Airtable and Google Sheets
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Subscription and billing information
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Usage statistics
          </li>
        </ul>

        <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300">
              <Trash2 className="mr-2 h-4 w-4"/>
              Delete My Account
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-red-400">Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5"/>
                    <p className="text-sm text-foreground">
                      Your data will be permanently deleted. Consider exporting your data first.
                    </p>
                  </div>
                </div>

                <FormField control={form.control} name="confirmationText" render={({ field }) => (<FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Type "DELETE MY ACCOUNT" to confirm</FormLabel>
                      <FormControl>
                        <Input placeholder="DELETE MY ACCOUNT" {...field} className="font-mono border-border bg-background/50 backdrop-blur-sm focus:border-red-500/50 transition-colors"/>
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        This must match exactly (all caps)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="password" render={({ field }) => (<FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Enter your password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} className="border-border bg-background/50 backdrop-blur-sm focus:border-red-500/50 transition-colors"/>
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Verify your identity to proceed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>)}/>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={isDeleting} className="border-border hover:bg-card/50">
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isDeleting} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Delete Account Permanently
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>);
}
//# sourceMappingURL=DangerZoneSection.jsx.map