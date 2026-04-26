import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChores } from "@/hooks/useChores";
import { createChoreSchema, type CreateChoreInput } from "../schema";
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
import { useState } from "react";
import { Plus } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";

type ChoreFormValues = {
  title: string;
  description: string;
  dueDate: string;
  assignedToId?: number;
};

export function CreateChoreDialog() {
  const [open, setOpen] = useState(false);
  const { createChore, isCreating } = useChores();
  const { household } = useHousehold();

  const form = useForm<ChoreFormValues>({
    resolver: zodResolver(createChoreSchema) as Resolver<ChoreFormValues>,
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      assignedToId: undefined,
    },
  });

  const onSubmit = (data: ChoreFormValues) => {
    const parsed: CreateChoreInput = createChoreSchema.parse(
      data as z.input<typeof createChoreSchema>
    );

    createChore(parsed, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Chore</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Chore</DialogTitle>
          <DialogDescription>
            Create a new chore for your household.
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

            {/* DUE DATE — CUSTOM DATE + TIME PICKER */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => {
                const dateValue = field.value ? new Date(field.value) : null;

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
                              !field.value && "text-muted-foreground"
                            )}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateValue
                              ? format(dateValue, "PPP HH:mm")
                              : "Pick date & time"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-2" align="start">
                        <Calendar
                          mode="single"
                          selected={dateValue || undefined}
                          onSelect={(selected: Date | undefined) => {
                            if (!selected) return;
                            const updated = dateValue
                              ? new Date(dateValue)
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
                              dateValue
                                ? `${String(dateValue.getHours()).padStart(
                                    2,
                                    "0"
                                  )}:${String(dateValue.getMinutes()).padStart(
                                    2,
                                    "0"
                                  )}`
                                : ""
                            }
                            onChange={(e) => {
                              const [h, m] = e.target.value
                                .split(":")
                                .map(Number);
                              const updated = dateValue
                                ? new Date(dateValue)
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
                        field.onChange(
                          val === "unassigned" ? undefined : Number(val)
                        )
                      }
                      value={
                        field.value === undefined || field.value === null
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
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Chore"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
