import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from 'wasp/client/auth';
import { updateUsername, requestEmailChange, updateNotificationPreferences, } from 'wasp/client/operations';
import { Button } from '../../client/components/ui/button';
import { Input } from '../../client/components/ui/input';
import { Switch } from '../../client/components/ui/switch';
import { Separator } from '../../client/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from '../../client/components/ui/form';
import { useToast } from '../../client/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
// ============================================================================
// SCHEMAS
// ============================================================================
const usernameSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, dashes, and underscores'),
});
const emailSchema = z.object({
    newEmail: z.string().email('Invalid email address'),
});
const notificationsSchema = z.object({
    emailNotifications: z.boolean(),
    syncFailureAlerts: z.boolean(),
    weeklyDigest: z.boolean(),
});
// ============================================================================
// COMPONENT
// ============================================================================
export default function ProfileSection() {
    const { data: user } = useAuth();
    const { toast } = useToast();
    if (!user)
        return null;
    return (<div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your profile information and preferences
        </p>
      </div>

      <UsernameCard currentUsername={user.username || ''}/>
      <EmailCard currentEmail={user.email || ''} pendingEmail={user.pendingEmail}/>
      <NotificationsCard user={user}/>
    </div>);
}
// ============================================================================
// USERNAME CARD
// ============================================================================
function UsernameCard({ currentUsername }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const form = useForm({
        resolver: zodResolver(usernameSchema),
        defaultValues: { username: currentUsername },
    });
    const onSubmit = async (data) => {
        setIsUpdating(true);
        try {
            await updateUsername(data);
            toast({
                title: 'Success',
                description: 'Username updated successfully',
            });
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update username',
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    return (<div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">Username</h3>
          <p className="text-sm text-muted-foreground">
            This is your public display name. It can be your real name or a pseudonym.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="username" render={({ field }) => (<FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} className="border-border bg-background/50 backdrop-blur-sm focus:border-cyan-500/50 transition-colors"/>
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    3-30 characters, letters, numbers, dashes, and underscores only
                  </FormDescription>
                  <FormMessage />
                </FormItem>)}/>
            <Button type="submit" disabled={isUpdating} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300">
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Update Username
            </Button>
          </form>
        </Form>
      </div>
    </div>);
}
// ============================================================================
// EMAIL CARD
// ============================================================================
function EmailCard({ currentEmail, pendingEmail }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const form = useForm({
        resolver: zodResolver(emailSchema),
        defaultValues: { newEmail: '' },
    });
    const onSubmit = async (data) => {
        setIsUpdating(true);
        try {
            await requestEmailChange(data);
            toast({
                title: 'Verification email sent',
                description: 'Please check your new email address to verify the change',
            });
            form.reset();
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to request email change',
            });
        }
        finally {
            setIsUpdating(false);
        }
    };
    return (<div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Email Address</h3>
          <p className="text-sm text-muted-foreground">
            Update your email address. You'll need to verify the new address before the change takes effect.
          </p>
        </div>

        {/* Current Email */}
        <div>
          <label className="text-sm font-medium text-foreground">Current Email</label>
          <div className="mt-2 px-4 py-3 bg-muted/50 backdrop-blur-sm rounded-xl border border-border">
            <p className="text-sm text-foreground font-mono">{currentEmail || 'No email set'}</p>
          </div>
        </div>

        {/* Pending Email Alert */}
        {pendingEmail && (<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5"/>
              <p className="text-sm text-foreground">
                Verification pending for <strong className="font-semibold">{pendingEmail}</strong>. Please check your email to confirm the change.
              </p>
            </div>
          </div>)}

        <Separator className="bg-border/50"/>

        {/* New Email Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="newEmail" render={({ field }) => (<FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">New Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter new email" {...field} className="border-border bg-background/50 backdrop-blur-sm focus:border-cyan-500/50 transition-colors"/>
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    We'll send a verification link to this address
                  </FormDescription>
                  <FormMessage />
                </FormItem>)}/>
            <Button type="submit" disabled={isUpdating} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300">
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Send Verification Email
            </Button>
          </form>
        </Form>
      </div>
    </div>);
}
// ============================================================================
// NOTIFICATIONS CARD
// ============================================================================
function NotificationsCard({ user }) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm({
        resolver: zodResolver(notificationsSchema),
        defaultValues: {
            emailNotifications: user.emailNotifications ?? true,
            syncFailureAlerts: user.syncFailureAlerts ?? true,
            weeklyDigest: user.weeklyDigest ?? false,
        },
    });
    const onSubmit = async (data) => {
        setIsSaving(true);
        try {
            await updateNotificationPreferences(data);
            toast({
                title: 'Saved',
                description: 'Notification preferences updated',
            });
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update preferences',
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    // Auto-save on change
    const handleChange = (field, value) => {
        form.setValue(field, value);
        form.handleSubmit(onSubmit)();
    };
    return (<div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Email Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage which emails you receive from BaseSync
          </p>
        </div>

        <Form {...form}>
          <div className="space-y-3">
            <FormField control={form.control} name="emailNotifications" render={({ field }) => (<FormItem className="flex items-center justify-between space-y-0 rounded-xl border border-border bg-background/30 backdrop-blur-sm p-4 transition-all duration-300 hover:border-cyan-500/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold text-foreground">Email Notifications</FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
                      Receive all email notifications from BaseSync
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={(value) => handleChange('emailNotifications', value)}/>
                  </FormControl>
                </FormItem>)}/>

            <FormField control={form.control} name="syncFailureAlerts" render={({ field }) => (<FormItem className="flex items-center justify-between space-y-0 rounded-xl border border-border bg-background/30 backdrop-blur-sm p-4 transition-all duration-300 hover:border-cyan-500/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold text-foreground">Sync Failure Alerts</FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
                      Get notified when a sync fails
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={(value) => handleChange('syncFailureAlerts', value)} disabled={!form.watch('emailNotifications')}/>
                  </FormControl>
                </FormItem>)}/>

            <FormField control={form.control} name="weeklyDigest" render={({ field }) => (<FormItem className="flex items-center justify-between space-y-0 rounded-xl border border-border bg-background/30 backdrop-blur-sm p-4 transition-all duration-300 hover:border-cyan-500/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold text-foreground">Weekly Digest</FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
                      Receive a weekly summary of your sync activity
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={(value) => handleChange('weeklyDigest', value)} disabled={!form.watch('emailNotifications')}/>
                  </FormControl>
                </FormItem>)}/>
          </div>
        </Form>

        {isSaving && (<div className="flex items-center text-sm text-cyan-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            Saving preferences...
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=ProfileSection.jsx.map