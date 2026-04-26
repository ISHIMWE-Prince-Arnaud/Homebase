import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChores } from "@/hooks/useChores";
import { updateChoreSchema, type UpdateChoreInput } from "../schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useHousehold } from "@/hooks/useHousehold";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Chore } from "../api";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";

type EditChoreDialogProps = {
  chore: Chore;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChoreFormValues = {
  title: string;
  description: string;
  dueDate: string;
  assignedToId?: number | null;
};

export function EditChoreDialog({
  chore,
  open,
  onOpenChange,
}: EditChoreDialogProps) {
  const { updateChore, isUpdating } = useChores();
  const { household } = useHousehold();

  const form = useForm<ChoreFormValues>({
    resolver: zodResolver(updateChoreSchema) as Resolver<ChoreFormValues>,
    defaultValues: {
      title: chore.title,
      description: chore.description || "",
      dueDate: chore.dueDate || "",
      assignedToId: chore.assignedToId,
    },
  });

  // Reset form when chore changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: chore.title,
        description: chore.description || "",
        dueDate: chore.dueDate || "",
        assignedToId: chore.assignedToId,
      });
    }
  }, [chore, open, form]);

  const onSubmit = (data: ChoreFormValues) => {
    // Only send changed fields or all fields?
    // Since it's a PATCH, we can send what we have.
    // The schema allows optionals.
    const payload: UpdateChoreInput = {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      assignedToId: data.assignedToId,
    };

    updateChore(
      { id: chore.id, data: payload },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Chore</DialogTitle>
          <DialogDescription>
            Update the details of this chore.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* TITLE */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Clean the kitchen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DESCRIPTION */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DUE DATE */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => {
                const dateValue = field.value ? new Date(field.value) : null;
                const isValidDate = dateValue && !isNaN(dateValue.getTime());

                return (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !isValidDate && "text-muted-foreground"
                            )}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {isValidDate
                              ? format(dateValue!, "PPP HH:mm")
                              : "Pick date & time"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-2" align="start">
                        <Calendar
                          mode="single"
                          selected={isValidDate ? dateValue! : undefined}
                          onSelect={(selected: Date | undefined) => {
                            if (!selected) return;
                            const updated = isValidDate
                              ? new Date(dateValue!)
                              : new Date();
                            updated.setFullYear(selected.getFullYear());
                            updated.setMonth(selected.getMonth());
                            updated.setDate(selected.getDate());
                            field.onChange(updated.toISOString());
                          }}
                        />

                        <div className="mt-2 flex gap-2">
                          <Input
                            type="time"
                            className="w-[140px]"
                            value={
                              isValidDate
                                ? `${String(dateValue!.getHours()).padStart(
                                    2,
                                    "0"
                                  )}:${String(dateValue!.getMinutes()).padStart(
                                    2,
                                    "0"
                                  )}`
                                : ""
                            }
                            onChange={(e) => {
                              const [h, m] = e.target.value
                                .split(":")
                                .map(Number);
                              const updated = isValidDate
                                ? new Date(dateValue!)
                                : new Date();
                              updated.setHours(h);
                              updated.setMinutes(m);
                              field.onChange(updated.toISOString());
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* ASSIGNED TO */}
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  {household?.members.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No members to assign"
                      description="Add household members first to assign chores."
                      size="sm"
                    />
                  ) : (
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === "unassigned" ? null : Number(val))
                      }
                      value={
                        field.value === null || field.value === undefined
                          ? "unassigned"
                          : String(field.value)
                      }>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {household?.members.map((member) => (
                          <SelectItem
                            key={member.id}
                            value={member.id.toString()}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SUBMIT BUTTON */}
            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
