import { useHousehold } from "@/hooks/useHousehold";
import { HouseholdInfo } from "@/features/household/components/HouseholdInfo";
import { CreateHouseholdDialog } from "@/features/household/components/CreateHouseholdDialog";
import { JoinHouseholdDialog } from "@/features/household/components/JoinHouseholdDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn, SlideIn } from "@/components/ui/motion";
import { HouseholdSkeleton } from "@/components/ui/skeletons";

export default function HouseholdPage() {
  const { household, isLoading } = useHousehold();

  if (isLoading) {
    return <HouseholdSkeleton />;
  }

  if (household) {
    return (
      <div className="space-y-6">
        <FadeIn>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            My Household
          </h1>
          <p className="text-muted-foreground">
            Manage your household settings and members.
          </p>
        </FadeIn>
        <HouseholdInfo />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8">
      <FadeIn className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Welcome to HomeBase
        </h1>
        <p className="mt-2 text-muted-foreground">
          To get started, create a new household or join an existing one.
        </p>
      </FadeIn>

      <div className="grid w-full max-w-md gap-6">
        <SlideIn direction="left" delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>New Household</CardTitle>
              <CardDescription>
                Create a fresh space for your home. You'll get an invite code to
                share.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateHouseholdDialog />
            </CardContent>
          </Card>
        </SlideIn>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <SlideIn direction="right" delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Join Household</CardTitle>
              <CardDescription>
                Have an invite code? Enter it here to join your household.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JoinHouseholdDialog />
            </CardContent>
          </Card>
        </SlideIn>
      </div>
    </div>
  );
}
