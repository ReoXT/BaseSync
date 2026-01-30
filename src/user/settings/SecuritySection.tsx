import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { changePassword } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../client/components/ui/card';
import { Button } from '../../client/components/ui/button';
import { Input } from '../../client/components/ui/input';
import { Alert, AlertDescription } from '../../client/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../client/components/ui/form';
import { useToast } from '../../client/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

// ============================================================================
// SCHEMA
// ============================================================================

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================================================
// COMPONENT
// ============================================================================

export default function SecuritySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account security and authentication
        </p>
      </div>

      <ChangePasswordCard />
      <ActiveSessionsCard />
      <TwoFactorCard />
    </div>
  );
}

// ============================================================================
// CHANGE PASSWORD CARD
// ============================================================================

function ChangePasswordCard() {
  const { toast } = useToast();
  const [isChanging, setIsChanging] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsChanging(true);
    setSuccess(false);

    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Your password has been changed successfully',
      });

      // Reset form
      form.reset();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to change password',
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Change Password</h3>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure
          </p>
        </div>

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Password changed successfully. You can now login with your new password.
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Current Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      {...field}
                      className="border-border bg-background/50 backdrop-blur-sm focus:border-cyan-500/50 transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      {...field}
                      className="border-border bg-background/50 backdrop-blur-sm focus:border-cyan-500/50 transition-colors"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      {...field}
                      className="border-border bg-background/50 backdrop-blur-sm focus:border-cyan-500/50 transition-colors"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isChanging}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300"
            >
              {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVE SESSIONS CARD (PLACEHOLDER)
// ============================================================================

function ActiveSessionsCard() {
  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            Manage devices where you're currently logged in
          </p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90">
              Session management is coming soon. You'll be able to view and revoke access from other devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TWO-FACTOR AUTH CARD (PLACEHOLDER)
// ============================================================================

function TwoFactorCard() {
  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90">
              Two-factor authentication is coming soon. This will add an extra layer of security by requiring a verification code in addition to your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
