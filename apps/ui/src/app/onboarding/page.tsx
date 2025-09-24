import { OnboardingClient } from "./onboarding-client";

// Force dynamic rendering since this page uses client-side data fetching
export const dynamic = "force-dynamic";

export default function OnboardingPage() {
	return <OnboardingClient />;
}
