import { usePayments } from "@/hooks/usePayments";
import { useHousehold } from "@/hooks/useHousehold";
import { Card } from "@/components/ui/card";
import { ArrowRight, Banknote } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { PaymentListSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";

export function PaymentList() {
  const { payments, isLoading } = usePayments();
  const { household } = useHousehold();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Recent Payments</h3>
      {isLoading ? (
        <PaymentListSkeleton />
      ) : payments?.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payments recorded"
          description="Record a payment when you settle a debt with a household member."
          size="sm"
        />
      ) : (
        <StaggerContainer className="space-y-2">
          {payments?.map((payment) => {
            const fromName =
              payment.fromUser?.name ||
              payment.fromUser?.email ||
              String(payment.fromUserId);
            const toName =
              payment.toUser?.name ||
              payment.toUser?.email ||
              String(payment.toUserId);
            return (
              <StaggerItem key={payment.id}>
                <Card className="flex flex-row items-center justify-between p-4 hover:shadow-md transition-shadow border-l-4 border-l-green-500/20">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shrink-0">
                      <Banknote className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-medium text-base">
                        <span>{fromName}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{toName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(payment.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: household?.currency || "USD",
                      }).format(payment.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Settled
                    </p>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
