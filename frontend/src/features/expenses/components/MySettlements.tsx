import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MySettlementsSkeleton } from "@/components/ui/skeletons";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function MySettlements() {
  const { mySettlements, mySettlementsScale, isLoading } = useExpenses();
  const { household } = useHousehold();
  const { user } = useAuth();

  if (isLoading) {
    return <MySettlementsSkeleton />;
  }

  const getMemberName = (id: number) => {
    return household?.members.find((m) => m.id === id)?.name;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: household?.currency || "USD",
    }).format(amount);
  };

  const iOwe = mySettlements?.filter((s) => s.fromUserId === user?.id) || [];
  const owedToMe = mySettlements?.filter((s) => s.toUserId === user?.id) || [];

  // Only show "all settled" if we have data and it's actually empty
  // Don't show it while loading or if data hasn't loaded yet
  if (!isLoading && mySettlements && mySettlements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium">All settled up!</h3>
          <p className="text-muted-foreground mt-2">
            You don't owe anyone, and no one owes you.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* I Owe Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">You Owe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {iOwe.length === 0 ? (
            <p className="text-muted-foreground">You don't owe anyone.</p>
          ) : (
            iOwe.map((settlement, index) => {
              const displayAmount = settlement.amount / mySettlementsScale;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Pay{" "}
                        {getMemberName(settlement.toUserId) ||
                          settlement.toName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Settlement
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-red-600">
                    {formatCurrency(displayAmount)}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Owed To Me Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-500">Owed to You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {owedToMe.length === 0 ? (
            <p className="text-muted-foreground">No one owes you.</p>
          ) : (
            owedToMe.map((settlement, index) => {
              const displayAmount = settlement.amount / mySettlementsScale;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <ArrowRight className="h-5 w-5 rotate-180" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {getMemberName(settlement.fromUserId) ||
                          settlement.fromName}{" "}
                        pays you
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Settlement
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">
                    {formatCurrency(displayAmount)}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
