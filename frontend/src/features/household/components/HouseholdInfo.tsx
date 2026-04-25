import { useHousehold } from "@/hooks/useHousehold";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, LogOut, Users, Crown, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";

export function HouseholdInfo() {
  const { household, leaveHousehold, isLeaving, updateHousehold, isUpdating } = useHousehold();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(household?.name || "");

  if (!household) return null;

  const copyInviteCode = () => {
    navigator.clipboard.writeText(household.inviteCode);
    toast.success("Invite code copied!");
  };

  const handleSaveName = () => {
    if (editName.trim() && editName !== household.name) {
      updateHousehold({ name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(household.name);
    setIsEditingName(false);
  };

  const isAdmin = (memberId: number) => memberId === household.createdById;

  return (
    <FadeIn className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-lg font-semibold max-w-[200px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName} disabled={isUpdating}>
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl truncate">{household.name}</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingName(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <CardDescription className="text-xs sm:text-sm">
                {household.members.length} members · Created {new Date(household.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 sm:w-auto sm:px-3 p-0 text-muted-foreground hover:text-destructive hover:border-destructive shrink-0">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Leave</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Household?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this household? You will lose
                    access to all household data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => leaveHousehold()}>
                    {isLeaving ? "Leaving..." : "Leave"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 sm:p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Invite Code</p>
              <p className="text-xs text-muted-foreground">
                Share to invite new members
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="relative rounded bg-background border px-3 py-1.5 font-mono text-sm font-semibold tracking-widest">
                {household.inviteCode}
              </code>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 px-3"
                onClick={copyInviteCode}>
                <Copy className="h-4 w-4 mr-1.5" />
                <span className="text-xs">Copy</span>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <Users className="mr-2 h-4 w-4" />
              Members ({household.members.length})
            </h3>
            <StaggerContainer className="grid gap-2 sm:gap-3 sm:grid-cols-2">
              {household.members.map((member) => (
                <StaggerItem key={member.id}>
                  <div className="group flex items-center gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 hover:bg-muted/20 transition-colors">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border shrink-0">
                      <AvatarImage
                        src={member.profileImage}
                        alt={member.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium leading-none truncate">
                          {member.name}
                        </p>
                        {isAdmin(member.id) && (
                          <span title="Household Admin">
                            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
