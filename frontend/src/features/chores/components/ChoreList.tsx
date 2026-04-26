import { useChores } from "@/hooks/useChores";
import { ChoreItem } from "./ChoreItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ChoreListSkeleton } from "@/components/ui/skeletons";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckSquare, AlertCircle } from "lucide-react";

export function ChoreList() {
  const { chores, isLoading, error } = useChores();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  if (isLoading) {
    return <ChoreListSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load chores"
        description="Something went wrong while fetching your chores. Please try again later."
      />
    );
  }

  const filteredChores = chores?.filter((chore) => {
    if (filter === "active") return !chore.isComplete;
    if (filter === "completed") return chore.isComplete;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs
          defaultValue="all"
          value={filter}
          onValueChange={(v) => setFilter(v as any)}
          className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredChores?.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No chores found"
          description={
            filter === "all"
              ? "Get started by adding your first chore to the household."
              : "Try adjusting your filters to see more results."
          }
        />
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChores?.map((chore) => (
            <StaggerItem key={chore.id}>
              <ChoreItem chore={chore} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
