import React from "react";
import { getCustomerPortalUrl } from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, } from "../client/components/ui/card";
import { Separator } from "../client/components/ui/separator";
import { SubscriptionStatus, parsePaymentPlanId, prettyPaymentPlanName, } from "../payment/plans";
export default function AccountPage({ user }) {
    return (<div className="mt-10 px-6">
      <Card className="mb-4 lg:m-8">
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold leading-6">
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {!!user.email && (<div className="px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                  <div className="text-muted-foreground text-sm font-medium">
                    Email address
                  </div>
                  <div className="text-foreground mt-1 text-sm sm:col-span-2 sm:mt-0">
                    {user.email}
                  </div>
                </div>
              </div>)}
            {!!user.username && (<>
                <Separator />
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                    <div className="text-muted-foreground text-sm font-medium">
                      Username
                    </div>
                    <div className="text-foreground mt-1 text-sm sm:col-span-2 sm:mt-0">
                      {user.username}
                    </div>
                  </div>
                </div>
              </>)}
            <Separator />
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                <div className="text-muted-foreground text-sm font-medium">
                  Your Plan
                </div>
                <UserCurrentSubscriptionPlan subscriptionPlan={user.subscriptionPlan} subscriptionStatus={user.subscriptionStatus} datePaid={user.datePaid}/>
              </div>
            </div>
            <Separator />
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                <div className="text-muted-foreground text-sm font-medium">
                  Credits
                </div>
                <div className="text-foreground mt-1 text-sm sm:col-span-1 sm:mt-0">
                  {user.credits} credits
                </div>
                <div className="ml-auto mt-4 sm:mt-0">
                  <BuyMoreButton subscriptionStatus={user.subscriptionStatus}/>
                </div>
              </div>
            </div>
            <Separator />
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                <div className="text-muted-foreground text-sm font-medium">
                  About
                </div>
                <div className="text-foreground mt-1 text-sm sm:col-span-2 sm:mt-0">
                  I'm a cool customer.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);
}
function UserCurrentSubscriptionPlan({ subscriptionPlan, subscriptionStatus, datePaid, }) {
    let subscriptionPlanMessage = "Free Plan";
    if (subscriptionPlan !== null &&
        subscriptionStatus !== null &&
        datePaid !== null) {
        subscriptionPlanMessage = formatSubscriptionStatusMessage(parsePaymentPlanId(subscriptionPlan), datePaid, subscriptionStatus);
    }
    return (<>
      <div className="text-foreground mt-1 text-sm sm:col-span-1 sm:mt-0">
        {subscriptionPlanMessage}
      </div>
      <div className="ml-auto mt-4 sm:mt-0">
        <CustomerPortalButton />
      </div>
    </>);
}
function formatSubscriptionStatusMessage(subscriptionPlan, datePaid, subscriptionStatus) {
    const paymentPlanName = prettyPaymentPlanName(subscriptionPlan);
    const statusToMessage = {
        active: `${paymentPlanName}`,
        past_due: `Payment for your ${paymentPlanName} plan is past due! Please update your subscription payment information.`,
        cancel_at_period_end: `Your ${paymentPlanName} plan subscription has been canceled, but remains active until the end of the current billing period: ${prettyPrintEndOfBillingPeriod(datePaid)}`,
        deleted: `Your previous subscription has been canceled and is no longer active.`,
    };
    if (!statusToMessage[subscriptionStatus]) {
        throw new Error(`Invalid subscription status: ${subscriptionStatus}`);
    }
    return statusToMessage[subscriptionStatus];
}
function prettyPrintEndOfBillingPeriod(date) {
    const oneMonthFromNow = new Date(date);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return oneMonthFromNow.toLocaleDateString();
}
function CustomerPortalButton() {
    const [isLoading, setIsLoading] = React.useState(false);
    const handleClick = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Pass current page as return URL
            const portalUrl = await getCustomerPortalUrl({
                returnUrl: window.location.pathname,
            });
            if (portalUrl) {
                window.open(portalUrl, "_blank", "noopener,noreferrer");
            }
        }
        catch (error) {
            console.error("Error opening customer portal:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<Button onClick={handleClick} disabled={isLoading} variant="link">
      {isLoading ? "Loading..." : "Manage Payment Details"}
    </Button>);
}
function BuyMoreButton({ subscriptionStatus, }) {
    if (subscriptionStatus === SubscriptionStatus.Active ||
        subscriptionStatus === SubscriptionStatus.CancelAtPeriodEnd) {
        return null;
    }
    return (<WaspRouterLink to={routes.PricingPageRoute.to} className="text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200">
      <Button variant="link">Buy More Credits</Button>
    </WaspRouterLink>);
}
//# sourceMappingURL=AccountPage.jsx.map