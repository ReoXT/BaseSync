/**
 * BaseSync Notification Email Templates
 *
 * Email templates for usage limits, trial expiration, and other notifications.
 * These templates are used with the Wasp emailSender to notify users.
 */
// ============================================================================
// Usage Limit Emails
// ============================================================================
/**
 * Email sent when user reaches 80% of their usage limit
 */
export function getApproachingLimitEmailContent({ userName, limitType, currentUsage, limit, planName, upgradePlanName, upgradeUrl, }) {
    const percentage = Math.round((currentUsage / limit) * 100);
    const limitTypeText = limitType === 'records' ? 'records per sync' : 'sync configurations';
    return {
        subject: "You're approaching your BaseSync limit",
        text: `Hi ${userName},

You've used ${percentage}% of your ${planName} plan limit.

Current usage: ${currentUsage.toLocaleString()} ${limitTypeText}
Plan limit: ${limit.toLocaleString()} ${limitTypeText}

To avoid any interruption to your syncs, consider upgrading to ${upgradePlanName}.

Upgrade now: ${upgradeUrl}

Thanks,
The BaseSync Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #f59e0b; margin-top: 0;">Heads up! You're approaching your limit</h2>

    <p>Hi ${userName},</p>

    <p>You've used <strong>${percentage}%</strong> of your ${planName} plan limit.</p>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Current usage:</strong> ${currentUsage.toLocaleString()} ${limitTypeText}</p>
      <p style="margin: 10px 0 0 0;"><strong>Plan limit:</strong> ${limit.toLocaleString()} ${limitTypeText}</p>
    </div>

    <p>To avoid any interruption to your syncs, consider upgrading to <strong>${upgradePlanName}</strong>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${upgradeUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Upgrade Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Your data is safe and your current syncs will continue working until you reach 100% of your limit.</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks,<br>The BaseSync Team</p>
  </div>
</body>
</html>`,
    };
}
/**
 * Email sent when user reaches 100% of their usage limit
 */
export function getLimitReachedEmailContent({ userName, limitType, currentUsage, limit, planName, upgradePlanName, upgradeUrl, }) {
    const limitTypeText = limitType === 'records' ? 'records per sync' : 'sync configurations';
    return {
        subject: "Your BaseSync sync has paused",
        text: `Hi ${userName},

Your sync has been paused because you've reached your ${planName} plan limit of ${limit.toLocaleString()} ${limitTypeText}.

Don't worry - your data is completely safe. Your existing syncs and all your data remain intact.

To resume syncing, upgrade to ${upgradePlanName}: ${upgradeUrl}

What happens now:
- Your data remains safe and unchanged
- You can still access your dashboard and view sync history
- Syncs will automatically resume once you upgrade

Thanks,
The BaseSync Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #ef4444; margin-top: 0;">Your sync has been paused</h2>

    <p>Hi ${userName},</p>

    <p>Your sync has been paused because you've reached your <strong>${planName}</strong> plan limit of <strong>${limit.toLocaleString()} ${limitTypeText}</strong>.</p>

    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600;">Don't worry - your data is completely safe.</p>
      <p style="margin: 10px 0 0 0;">Your existing syncs and all your data remain intact.</p>
    </div>

    <p>To resume syncing, upgrade to <strong>${upgradePlanName}</strong>:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${upgradeUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Upgrade to Resume</a>
    </div>

    <h3 style="color: #333; margin-top: 30px;">What happens now:</h3>
    <ul style="color: #666;">
      <li>Your data remains safe and unchanged</li>
      <li>You can still access your dashboard and view sync history</li>
      <li>Syncs will automatically resume once you upgrade</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks,<br>The BaseSync Team</p>
  </div>
</body>
</html>`,
    };
}
// ============================================================================
// Trial Emails
// ============================================================================
/**
 * Email sent 3 days before trial expires
 */
export function getTrialEndingSoonEmailContent({ userName, daysRemaining, recordsSynced, syncConfigsCount, pricingUrl, }) {
    return {
        subject: `Your BaseSync trial ends in ${daysRemaining} days`,
        text: `Hi ${userName},

Your free trial ends in ${daysRemaining} days.

During your trial, you've:
- Synced ${recordsSynced.toLocaleString()} records
- Created ${syncConfigsCount} sync configuration${syncConfigsCount === 1 ? '' : 's'}

To keep your syncs running without interruption, choose a plan that fits your needs:

Starter ($9/mo): 1 sync, 1,000 records
Pro ($19/mo): 3 syncs, 5,000 records - MOST POPULAR
Business ($39/mo): 10 syncs, unlimited records

View pricing and upgrade: ${pricingUrl}

After your trial:
- Syncs will pause (no data is lost)
- You can upgrade anytime to resume

Thanks for trying BaseSync!
The BaseSync Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea; margin-top: 0;">Your trial ends in ${daysRemaining} days</h2>

    <p>Hi ${userName},</p>

    <p>Your free trial is coming to an end. Here's what you've accomplished:</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <div style="font-size: 28px; font-weight: bold; color: #667eea;">${recordsSynced.toLocaleString()}</div>
          <div style="color: #666; font-size: 14px;">Records Synced</div>
        </div>
        <div>
          <div style="font-size: 28px; font-weight: bold; color: #667eea;">${syncConfigsCount}</div>
          <div style="color: #666; font-size: 14px;">Sync${syncConfigsCount === 1 ? '' : 's'} Created</div>
        </div>
      </div>
    </div>

    <p>To keep your syncs running without interruption, choose a plan that fits your needs:</p>

    <div style="margin: 25px 0;">
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
        <strong>Starter</strong> - $9/mo
        <span style="color: #666; float: right;">1 sync, 1,000 records</span>
      </div>
      <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 2px solid #667eea;">
        <strong>Pro</strong> - $19/mo
        <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">MOST POPULAR</span>
        <span style="color: #666; float: right;">3 syncs, 5,000 records</span>
      </div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <strong>Business</strong> - $39/mo
        <span style="color: #666; float: right;">10 syncs, unlimited records</span>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${pricingUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Choose Your Plan</a>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>After your trial:</strong> Syncs will pause but no data is lost. You can upgrade anytime to resume.</p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks for trying BaseSync!<br>The BaseSync Team</p>
  </div>
</body>
</html>`,
    };
}
// ============================================================================
// Sync Failure Emails
// ============================================================================
/**
 * Email sent when a sync fails
 */
export function getSyncFailedEmailContent({ userName, syncName, errorMessage, dashboardUrl, }) {
    return {
        subject: `BaseSync: "${syncName}" sync failed`,
        text: `Hi ${userName},

Your sync "${syncName}" has failed.

Error: ${errorMessage}

Please check your dashboard for more details and to retry the sync: ${dashboardUrl}

Common causes:
- OAuth token expired - try reconnecting your Airtable or Google Sheets account
- Rate limit exceeded - the sync will automatically retry
- Field mapping issue - check if any fields have been renamed or deleted

Thanks,
The BaseSync Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">BaseSync</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #ef4444; margin-top: 0;">Sync Failed</h2>

    <p>Hi ${userName},</p>

    <p>Your sync <strong>"${syncName}"</strong> has failed.</p>

    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Error:</strong></p>
      <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 14px; color: #666;">${errorMessage}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Dashboard</a>
    </div>

    <h3 style="color: #333; margin-top: 30px;">Common causes:</h3>
    <ul style="color: #666;">
      <li><strong>OAuth token expired</strong> - try reconnecting your Airtable or Google Sheets account</li>
      <li><strong>Rate limit exceeded</strong> - the sync will automatically retry</li>
      <li><strong>Field mapping issue</strong> - check if any fields have been renamed or deleted</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>Thanks,<br>The BaseSync Team</p>
  </div>
</body>
</html>`,
    };
}
//# sourceMappingURL=baseSyncEmails.js.map