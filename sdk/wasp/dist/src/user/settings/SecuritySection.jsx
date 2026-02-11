import { useState } from 'react';
import { requestPasswordReset } from 'wasp/client/auth';
import { useAuth } from 'wasp/client/auth';
import { Button } from '../../client/components/ui/button';
import { useToast } from '../../client/hooks/use-toast';
import { Loader2, CheckCircle2, Info, Mail } from 'lucide-react';
// ============================================================================
// COMPONENT
// ============================================================================
export default function SecuritySection() {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account security and authentication
        </p>
      </div>

      <ChangePasswordCard />
      <ActiveSessionsCard />
      <TwoFactorCard />
    </div>);
}
// ============================================================================
// CHANGE PASSWORD CARD (Email-based reset)
// ============================================================================
function ChangePasswordCard() {
    const { toast } = useToast();
    const { data: user } = useAuth();
    const [isSending, setIsSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const handleRequestPasswordReset = async () => {
        if (!user?.email) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No email address found for your account',
            });
            return;
        }
        setIsSending(true);
        setEmailSent(false);
        try {
            await requestPasswordReset({ email: user.email });
            setEmailSent(true);
            toast({
                title: 'Email Sent',
                description: `Password reset instructions have been sent to ${user.email}`,
            });
            // Clear success message after 10 seconds
            setTimeout(() => setEmailSent(false), 10000);
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to send password reset email',
            });
        }
        finally {
            setIsSending(false);
        }
    };
    return (<div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Change Password</h3>
          <p className="text-sm text-muted-foreground">
            Request a password reset email to securely update your password
          </p>
        </div>

        {emailSent && (<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5"/>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Password reset email sent
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your inbox at <span className="font-mono text-foreground">{user?.email}</span> and follow the instructions to reset your password.
                </p>
              </div>
            </div>
          </div>)}

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5"/>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                How it works
              </p>
              <p className="text-sm text-muted-foreground">
                Click the button below to receive a secure password reset link at your registered email address ({user?.email}).
                The link will be valid for 24 hours.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleRequestPasswordReset} disabled={isSending || emailSent} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300">
          {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
          {emailSent && <CheckCircle2 className="mr-2 h-4 w-4"/>}
          {emailSent ? 'Email Sent' : 'Send Password Reset Email'}
        </Button>
      </div>
    </div>);
}
// ============================================================================
// ACTIVE SESSIONS CARD (PLACEHOLDER)
// ============================================================================
function ActiveSessionsCard() {
    return (<div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            Manage devices where you're currently logged in
          </p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5"/>
            <p className="text-sm text-foreground/90">
              Session management is coming soon. You'll be able to view and revoke access from other devices.
            </p>
          </div>
        </div>
      </div>
    </div>);
}
// ============================================================================
// TWO-FACTOR AUTH CARD (PLACEHOLDER)
// ============================================================================
function TwoFactorCard() {
    return (<div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5"/>
            <p className="text-sm text-foreground/90">
              Two-factor authentication is coming soon. This will add an extra layer of security by requiring a verification code in addition to your password.
            </p>
          </div>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=SecuritySection.jsx.map