import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useAuth } from "@/hooks/useAuth";
import { createExpenseSchema, type CreateExpenseInput } from "../schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

export function CreateExpenseDialog() {
  const [open, setOpen] = useState(false);
  const { createExpense, isCreating } = useExpenses();
  const { household } = useHousehold();
  const { user } = useAuth();

  const form = useForm<
    z.input<typeof createExpenseSchema>,
    unknown,
    CreateExpenseInput
  >({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      description: "",
      totalAmount: 0,
      date: new Date().toISOString().split("T")[0],
      paidById: user?.id || 0,
      participants: [],
    },
  });

  // Set default payer to current user when user loads
  useEffect(() => {
    if (user && !form.getValues("paidById")) {
      form.setValue("paidById", user.id);
    }
  }, [user, form]);

  // Set all members as participants by default when household loads
  useEffect(() => {
    if (household?.members) {
      const memberIds = household.members.map((m) => m.id);
      form.setValue("participants", memberIds);
    }
  }, [household, form]);

  const onSubmit = (data: CreateExpenseInput) => {
    // Ensure paidById is included in participants (backend requirement)
    const participants = Array.isArray(data.participants)
      ? [...new Set([...data.participants, data.paidById])] // Remove duplicates
      : [data.paidById];

    createExpense(
      { ...data, participants },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset({
            description: "",
            totalAmount: 0,
            date: new Date().toISOString().split("T")[0],
            paidById: user?.id || 0,
            participants: household?.members.map((m) => m.id) || [],
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Record a shared expense for the household.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Groceries, Internet..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          typeof field.value === "string" ? field.value : ""
                        }
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paidById"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid By</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      const newPaidById = Number(val);
                      field.onChange(newPaidById);
                      // Automatically add payer to participants if not already included
                      const currentParticipants =
                        form.getValues("participants") || [];
                      if (!currentParticipants.includes(newPaidById)) {
                        form.setValue("participants", [
                          ...currentParticipants,
                          newPaidById,
                        ]);
                      }
                    }}
                    value={
                      field.value === undefined || field.value === null
                        ? ""
                        : String(field.value)
                    }>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {household?.members.map((member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participants"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Split With</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {household?.members.map((member) => (
                      <FormField
                        key={member.id}
                        control={form.control}
                        name="participants"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={member.id}
                              className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={
                                    Array.isArray(field.value)
                                      ? field.value.includes(member.id)
                                      : false
                                  }
                                  onCheckedChange={(checked) => {
                                    const current = Array.isArray(field.value)
                                      ? field.value
                                      : [];
                                    return checked
                                      ? field.onChange([...current, member.id])
                                      : field.onChange(
                                          current.filter(
                                            (value) => value !== member.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {member.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
