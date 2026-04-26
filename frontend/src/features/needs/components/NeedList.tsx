import { useNeeds } from "@/hooks/useNeeds";
import { NeedItem } from "./NeedItem";
import { MarkPurchasedDialog } from "./MarkPurchasedDialog";
import { useState } from "react";
import type { Need } from "../api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, AlertCircle } from "lucide-react";
import { NeedListSkeleton } from "@/components/ui/skeletons";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

export function NeedList() {
  const { needs, isLoading, error } = useNeeds();
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"pending" | "purchased" | "all">("pending");

  const handleMarkPurchased = (need: Need) => {
    setSelectedNeed(need);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <NeedListSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load shopping list"
        description="Something went wrong while fetching your items. Please try again later."
      />
    );
  }

  // Filter needs based on search and purchase status
  const filteredNeeds = (needs || []).filter((need) => {
    const matchesSearch =
      !searchQuery ||
      need.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      need.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const pendingNeeds = filteredNeeds.filter((n) => !n.isPurchased);
  const purchasedNeeds = filteredNeeds.filter((n) => n.isPurchased);
  const combinedNeeds = [...pendingNeeds, ...purchasedNeeds];

  const renderList = (items: Need[], emptyMessage: string) => {
    if (items.length === 0) {
      if (searchQuery) {
        return (
          <EmptyState
            icon={ShoppingBag}
            title={`No items found matching "${searchQuery}"`}
            description="Try a different search term."
          />
        );
      }
      return (
        <EmptyState
          icon={ShoppingBag}
          title={emptyMessage}
          description="Add items to your shopping list to keep track of what your household needs."
        />
      );
    }

    return (
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((need) => (
          <StaggerItem key={need.id}>
            <NeedItem need={need} onMarkPurchased={handleMarkPurchased} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs for All/Pending/Purchased */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "pending" | "purchased" | "all")}>
          <TabsList>
            <TabsTrigger value="all">All ({combinedNeeds.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingNeeds.length})
            </TabsTrigger>
            <TabsTrigger value="purchased">
              Purchased ({purchasedNeeds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {renderList(pendingNeeds, "All caught up!")}
          </TabsContent>

          <TabsContent value="purchased" className="mt-4">
            {renderList(purchasedNeeds, "No purchased items yet")}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {renderList(combinedNeeds, "No items yet")}
          </TabsContent>
        </Tabs>
      </div>

      <MarkPurchasedDialog
        need={selectedNeed}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
