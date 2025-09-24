"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { UserProvider } from "@/components/providers/user-provider";
import { useUser } from "@/hooks/useUser";

export function OnboardingClient() {
	const router = useRouter();
	const { user, isLoading, error } = useUser();

	useEffect(() => {
		if (!isLoading && !user && !error) {
			router.push("/login");
		}
	}, [user, isLoading, error, router]);

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-6xl py-10 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto max-w-6xl py-10 flex items-center justify-center">
				<div className="text-center">
					<p className="text-destructive mb-4">Failed to load user data</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-primary text-primary-foreground rounded"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<UserProvider>
			<OnboardingWizard />
		</UserProvider>
	);
}
