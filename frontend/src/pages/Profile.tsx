import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/features/auth/schema";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Camera } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function ProfilePage() {
  const { user, updateProfile, isUpdatingProfile, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || "",
      currentPassword: "",
      newPassword: "",
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile(data, {
      onSuccess: () => {
        form.reset({
          name: data.name,
          currentPassword: "",
          newPassword: "",
        });
      },
    });
  };

  if (!user) return null;

  return (
    <>
      <StaggerContainer className="space-y-6">
      <FadeIn>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2">
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your public profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-muted">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary font-semibold">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Future: Profile picture upload button */}
                  <button 
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                    title="Change profile picture (coming soon)"
                    disabled>
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : new Date().getFullYear()}
                  </p>
                </div>
              </div>

              <Separator />

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 rounded-lg border p-3 sm:p-4 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Change Password</h3>
                      <span className="text-[10px] font-normal text-muted-foreground bg-background border px-1.5 py-0.5 rounded">
                        Optional
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave blank if you don't want to change your password.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Button type="submit" disabled={isUpdatingProfile} className="sm:w-auto w-full">
                      {isUpdatingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="sm:hidden w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowLogoutDialog(true)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to
              access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => logout()}>
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
