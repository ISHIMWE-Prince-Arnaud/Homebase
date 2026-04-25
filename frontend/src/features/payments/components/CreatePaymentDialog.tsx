import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePayments } from "@/hooks/usePayments";
import { useHousehold } from "@/hooks/useHousehold";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { createPaymentSchema, type CreatePaymentInput } from "../schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Banknote, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreatePaymentDialog() {
  const [open, setOpen] = useState(false);
  const { createPayment, isCreating } = usePayments();
  const { household } = useHousehold();
  const { user } = useAuth();
  const { mySettlements, mySettlementsScale } = useExpenses();

  const form = useForm<
    z.input<typeof createPaymentSchema>,
    unknown,
    CreatePaymentInput
  >({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      toUserId: undefined,
      amount: 0,
    },
  });

  const selectedToUserId = useWatch({
    control: form.control,
    name: "toUserId",
  });

  const amountValue = useWatch({
    control: form.control,
    name: "amount",
  });

  // Find how much the user owes to the selected recipient
  const maxPayableAmount = useMemo(() => {
    if (!selectedToUserId || !mySettlements) return 0;

    const settlement = mySettlements.find(
      (s) => s.fromUserId === user?.id && s.toUserId === selectedToUserId
    );

    if (!settlement) return 0;

    // Divide by scale to get display amount
    return settlement.amount / (mySettlementsScale || 1);
  }, [selectedToUserId, mySettlements, mySettlementsScale, user?.id]);

  // Get only people the user owes money to
  const recipients = useMemo(() => {
    if (!household || !household.members || !mySettlements) return [];

    // Get all unique user IDs that the current user owes
    const owedToUserIds = new Set(
      mySettlements
        .filter((s) => s.fromUserId === user?.id)
        .map((s) => s.toUserId)
    );

    // Filter household members to only include those the user owes
    return household.members.filter(
      (m) => m.id !== user?.id && owedToUserIds.has(m.id)
    );
  }, [household, mySettlements, user?.id]);

  const onSubmit = (data: CreatePaymentInput) => {
    createPayment(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset({
          toUserId: undefined,
          amount: 0,
        });
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: household?.currency || "USD",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Banknote className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Record Payment</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment you made to settle a debt with another household
            member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {recipients.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You don't owe anyone money right now. All your debts are
                  settled!
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="toUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid To</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          // Reset amount when recipient changes
                          form.setValue("amount", 0);
                        }}
                        value={field.value ? String(field.value) : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recipient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recipients.map((member) => {
                            const settlement = mySettlements?.find(
                              (s) =>
                                s.fromUserId === user?.id &&
                                s.toUserId === member.id
                            );
                            const owedAmount = settlement
                              ? settlement.amount / (mySettlementsScale || 1)
                              : 0;
                            return (
                              <SelectItem
                                key={member.id}
                                value={member.id.toString()}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{member.name}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({formatCurrency(owedAmount)})
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Only showing people you owe money to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedToUserId && maxPayableAmount > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You owe{" "}
                      <strong>{formatCurrency(maxPayableAmount)}</strong> to
                      this person. You can pay up to this amount.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => {
                    const amountValue =
                      typeof field.value === "number" ||
                      typeof field.value === "string"
                        ? Number(field.value) || 0
                        : 0;
                    const exceedsMax: boolean =
                      Boolean(selectedToUserId) &&
                      maxPayableAmount > 0 &&
                      amountValue > maxPayableAmount;

                    return (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={
                              maxPayableAmount > 0
                                ? maxPayableAmount
                                : undefined
                            }
                            placeholder="0.00"
                            {...field}
                            value={
                              typeof field.value === "number" ||
                              typeof field.value === "string"
                                ? field.value
                                : ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? undefined : val);
                            }}
                            className={exceedsMax ? "border-destructive" : ""}
                          />
                        </FormControl>
                        {Boolean(selectedToUserId) && maxPayableAmount > 0 && (
                          <FormDescription>
                            Maximum: {formatCurrency(maxPayableAmount)}
                          </FormDescription>
                        )}
                        {exceedsMax && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              Amount exceeds what you owe (
                              {formatCurrency(maxPayableAmount)})
                            </span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isCreating ||
                      !selectedToUserId ||
                      (selectedToUserId &&
                        maxPayableAmount > 0 &&
                        Number(amountValue || 0) > maxPayableAmount)
                    }>
                    {isCreating ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
