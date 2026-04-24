import { useChores } from "@/hooks/useChores";
import { useNeeds } from "@/hooks/useNeeds";
import { useExpenses } from "@/hooks/useExpenses";
import { useNotifications } from "@/hooks/useNotifications";
import { useHousehold } from "@/hooks/useHousehold";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckSquare,
  ShoppingBag,
  Receipt,
  Bell,
  ArrowRight,
  CreditCard,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  StaggerContainer,
  StaggerItem,
  FadeIn,
  SlideIn,
} from "@/components/ui/motion";

export default function DashboardPage() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const { chores, isLoading: isLoadingChores } = useChores();
  const { needs, isLoading: isLoadingNeeds } = useNeeds();
  const { balance, isLoading: isLoadingExpenses } = useExpenses();
  const { notifications, isLoading: isLoadingNotifications } =
    useNotifications();

  if (!user || !household) return null;

  // Summaries
  const pendingChores = chores?.filter((c) => !c.isComplete).length || 0;
  const myPendingChores =
    chores?.filter((c) => !c.isComplete && c.assignedToId === user.id).length ||
    0;
  const activeNeeds = needs?.filter((n) => !n.isPurchased).length || 0;
  const unreadNotifications =
    notifications?.filter((n) => !n.isRead).length || 0;

  // Calculate balance - find user's balance from array
  const myBalanceItem = balance?.find((b) => b.userId === user.id);
  const myBalance = myBalanceItem?.net || 0;
  const balanceColor =
    myBalance > 0
      ? "text-green-600"
      : myBalance < 0
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <StaggerContainer className="space-y-8">
      <FadeIn className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back,{" "}
          <span className="font-semibold text-foreground">
            {user.name.split(" ")[0]}
          </span>
          ! Here's what's happening in{" "}
          <span className="font-semibold text-foreground">
            {household.name}
          </span>
          .
        </p>
      </FadeIn>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Chores
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingChores ? (
                <Skeleton className="h-8 w-16" />
              ) : pendingChores === 0 ? (
                <div className="flex items-center gap-2 text-2xl font-bold text-success">
                  <CheckCircle2 className="h-6 w-6" />
                  <span>All done!</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{pendingChores}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {pendingChores === 0
                  ? "No chores pending"
                  : `${myPendingChores} assigned to you`}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Shopping List
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNeeds ? (
                <Skeleton className="h-8 w-16" />
              ) : activeNeeds === 0 ? (
                <div className="flex items-center gap-2 text-2xl font-bold text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6" />
                  <span>All set!</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{activeNeeds}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {activeNeeds === 0 ? "No items needed" : "Items to buy"}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Your Balance
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-info/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses ? (
                <Skeleton className="h-8 w-24" />
              ) : myBalance === 0 ? (
                <div className="flex items-center gap-2 text-2xl font-bold text-success">
                  <CheckCircle2 className="h-6 w-6" />
                  <span>You're settled!</span>
                </div>
              ) : (
                <div className={`text-2xl font-bold ${balanceColor}`}>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: household.currency || "USD",
                  }).format(Math.abs(myBalance))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {myBalance === 0
                  ? "All balances settled"
                  : myBalance > 0
                  ? "You are owed"
                  : "You owe"}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notifications
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <Skeleton className="h-8 w-16" />
              ) : unreadNotifications === 0 ? (
                <div className="flex items-center gap-2 text-2xl font-bold text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6" />
                  <span>All caught up!</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{unreadNotifications}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {unreadNotifications === 0 ? "No unread messages" : "Unread updates"}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Quick Actions */}
        <SlideIn
          direction="left"
          delay={0.2}
          className="border-none shadow-none bg-transparent">
          <Card className="border-none shadow-none bg-transparent">
            <div className="mb-4">
              <h3 className="text-lg font-semibold tracking-tight">
                Quick Actions
              </h3>
              <p className="text-sm text-muted-foreground">
                Jump to common tasks
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                variant="outline"
                className="h-auto py-6 flex-col items-start justify-center space-y-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                asChild>
                <Link to="/chores" className="w-full">
                  <div className="p-2 rounded-full bg-primary/10 mb-2">
                    <CheckSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">View Chores</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Check what needs doing
                    </span>
                  </div>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col items-start justify-center space-y-2 hover:border-warning/50 hover:bg-warning/5 transition-all"
                asChild>
                <Link to="/needs" className="w-full">
                  <div className="p-2 rounded-full bg-warning/10 mb-2">
                    <ShoppingBag className="h-5 w-5 text-warning" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Shopping List</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Add or view items
                    </span>
                  </div>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col items-start justify-center space-y-2 hover:border-info/50 hover:bg-info/5 transition-all"
                asChild>
                <Link to="/expenses" className="w-full">
                  <div className="p-2 rounded-full bg-info/10 mb-2">
                    <CreditCard className="h-5 w-5 text-info" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Add Expense</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Track spending
                    </span>
                  </div>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col items-start justify-center space-y-2 hover:border-secondary/50 hover:bg-secondary/5 transition-all"
                asChild>
                <Link to="/household" className="w-full">
                  <div className="p-2 rounded-full bg-secondary/10 mb-2">
                    <Users className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Household</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Manage members
                    </span>
                  </div>
                </Link>
              </Button>
            </div>
          </Card>
        </SlideIn>

        {/* Household Preview */}
        <SlideIn
          direction="right"
          delay={0.3}
          className="flex flex-col h-full w-full">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Household Members
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="space-y-4">
                {household.members.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background ring-1 ring-muted transition-transform group-hover:scale-105">
                        <AvatarImage
                          src={member.profileImage}
                          alt={member.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {household.members.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{household.members.length - 3} more members
                  </p>
                )}
              </div>

              <div className="mt-auto pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-between group"
                  asChild>
                  <Link to="/household">
                    View All Members
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </SlideIn>
      </div>
    </StaggerContainer>
  );
}
