import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { ExpenseBalanceSkeleton } from "@/components/ui/skeletons";

export function ExpenseBalance() {
  const { balance, settlements, settlementsScale, isLoading } = useExpenses();
  const { household } = useHousehold();

  if (isLoading) {
    return <ExpenseBalanceSkeleton />;
  }

  const getMemberName = (id: number) => {
    return household?.members.find((m) => m.id === Number(id))?.name;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: household?.currency || "USD",
    }).format(amount);
  };

  // Sort balance by net amount (highest owed first, then highest owes)
  const sortedBalance = balance
    ? [...balance].sort((a, b) => b.net - a.net)
    : [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Net Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedBalance.length > 0 ? (
            sortedBalance.map((item) => (
              <div
                key={item.userId}
                className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      item.net >= 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                    <span className="text-sm font-bold">
                      {item.net >= 0 ? "+" : ""}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {getMemberName(item.userId) || item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.email || "Member"}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold ${
                    item.net >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                  {item.net >= 0 ? "gets back" : "owes"}{" "}
                  {formatCurrency(Math.abs(item.net))}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No balances found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Settlements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settlements && settlements.length > 0 ? (
            settlements.map((settlement, index) => {
              // Divide by scale to get display amount
              const displayAmount = settlement.amount / settlementsScale;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3 bg-muted/10">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {getMemberName(settlement.fromUserId) ||
                        settlement.fromName}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {getMemberName(settlement.toUserId) || settlement.toName}
                    </span>
                  </div>
                  <span className="font-bold text-primary text-sm">
                    {formatCurrency(displayAmount)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <p className="text-sm">All settled up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
