import {
	ArrowRight,
	Building,
	CheckCircle,
	CreditCard,
	Gift,
	Key,
	Lock,
} from "lucide-react";
import React from "react";

import { UpgradeToProDialog } from "@/components/shared/upgrade-to-pro-dialog";
import { useDefaultOrganization } from "@/hooks/useOrganization";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Step } from "@/lib/components/stepper";
import { useAppConfig } from "@/lib/config";

interface PlanChoiceStepProps {
	onSelectCredits: () => void;
	onSelectBYOK: () => void;
	onSelectFreePlan: () => void;
}

export function PlanChoiceStep({
	onSelectCredits,
	onSelectBYOK,
	onSelectFreePlan,
}: PlanChoiceStepProps) {
	const config = useAppConfig();
	const { data: organization } = useDefaultOrganization();
	const isProPlan = organization?.plan === "pro";
	const isLocalhost = !config.hosted;

	const plans = [
		{
			id: "free",
			name: "Free Plan",
			description: "Perfect for getting started and testing",
			icon: Gift,
			price: "$0",
			period: "forever",
			current: false,
			features: [
				"Access to ALL models",
				"Pay with credits",
				"5% LLMGateway fee on credit usage",
				"3-day data retention",
				"Standard support",
			],
			color: "green",
			buttonText: "Choose Free Plan",
			buttonVariant: "default" as const,
			buttonDisabled: false,
			onClick: onSelectFreePlan,
		},
		{
			id: "credits",
			name: "Credits",
			description: "Buy credits to use our managed service",
			icon: CreditCard,
			price: "Pay as you go",
			period: "",
			current: false,
			features: [
				"Simple pay-as-you-go pricing",
				"No API key management needed",
				"Built-in rate limiting and monitoring",
				"Works with any plan",
			],
			color: "blue",
			buttonText: config.hosted
				? "Choose Credits"
				: "Only available on llmgateway.io",
			buttonVariant: "default" as const,
			buttonDisabled: !config.hosted,
			onClick: onSelectCredits,
		},
		{
			id: "byok",
			name: "BYOK",
			description: "Use your own API keys",
			icon: Key,
			price: "$50",
			period: "/month",
			current: false,
			features: [
				"Full control over provider costs",
				"Direct billing from providers",
				"Custom rate limits and quotas",
				"Advanced enterprise features",
			],
			color: "purple",
			buttonText: isProPlan ? "Choose BYOK" : "Upgrade to Pro for BYOK",
			buttonVariant: "outline" as const,
			buttonDisabled: false,
			onClick: onSelectBYOK,
			requiresPro: !isProPlan,
			isPro: true,
		},
		{
			id: "enterprise",
			name: "Enterprise",
			description: "Custom solutions for large orgs",
			icon: Building,
			price: "Custom pricing",
			period: "",
			current: false,
			features: [
				"Everything in Pro",
				"Advanced security features",
				"Custom integrations",
				"Unlimited data retention",
				"24/7 premium support",
			],
			color: "gray",
			buttonText: "Contact Sales",
			buttonVariant: "outline" as const,
			buttonDisabled: false,
			onClick: () => window.open(`mailto:${config.contactEmail}`, "_blank"),
		},
	];

	const getColorClasses = (
		color: string,
		current: boolean,
		isPro?: boolean,
	) => {
		if (current) {
			return {
				card: "ring-2 ring-green-500 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
				dot: "bg-green-500",
			};
		}
		if (isPro) {
			return {
				card: "ring-1 ring-gray-300 border-gray-400 bg-white dark:bg-gray-900 dark:border-gray-200 dark:ring-gray-200",
				dot: "bg-gray-600 dark:bg-gray-400",
			};
		}
		switch (color) {
			case "blue":
				return { card: "", dot: "bg-blue-500" };
			case "purple":
				return { card: "", dot: "bg-purple-500" };
			case "gray":
				return { card: "", dot: "bg-gray-500" };
			default:
				return { card: "", dot: "bg-green-500" };
		}
	};

	return (
		<Step className="w-full">
			<div className="w-full flex flex-col gap-6">
				<div className="flex flex-col gap-2 text-center">
					<h1 className="text-3xl font-semibold">Choose your approach</h1>
					<p className="text-muted-foreground">
						{isLocalhost
							? "You're self-hosting (detected) - explore all your options below, or skip to continue with what you have."
							: isProPlan
								? "You're on the Pro plan. Explore additional options below, or skip to continue building."
								: "You're currently on the Free plan. Explore upgrade options below, or skip to continue building."}
					</p>
				</div>
			</div>

			{/* Responsive grid container */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
				{plans.map((plan) => {
					const colorClasses = getColorClasses(
						plan.color,
						plan.current,
						plan.isPro,
					);
					const IconComponent = plan.icon;

					return (
						<Card
							key={plan.id}
							className={`flex flex-col h-[500px] ${colorClasses.card}`}
						>
							<CardHeader className="pb-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<IconComponent className="h-5 w-5" />
										<CardTitle className="text-lg">{plan.name}</CardTitle>
									</div>
									{plan.current && (
										<Badge
											variant="secondary"
											className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
										>
											Active
										</Badge>
									)}
									{plan.requiresPro && (
										<Badge
											variant="default"
											className="text-xs font-medium text-white dark:text-black dark:bg-white px-1.5 py-0.5"
										>
											Pro
										</Badge>
									)}
								</div>
								<CardDescription className="text-sm">
									{plan.description}
								</CardDescription>
								<div className="mt-2">
									<span className="text-2xl font-bold">{plan.price}</span>
									{plan.period && (
										<span className="text-muted-foreground text-sm ml-1">
											{plan.period}
										</span>
									)}
								</div>
							</CardHeader>
							<CardContent className="flex-1 flex flex-col justify-between pt-0">
								<div className="space-y-3 flex-1">
									<ul className="space-y-2 text-sm">
										{plan.features.map((feature, index) => (
											<li key={index} className="flex items-start gap-2">
												<div
													className={`h-1.5 w-1.5 ${colorClasses.dot} rounded-full mt-2 flex-shrink-0`}
												/>
												<span>{feature}</span>
											</li>
										))}
									</ul>

									{plan.requiresPro && (
										<div className="rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 text-sm mt-3">
											<p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
												Pro Plan Required
											</p>
											<p className="text-gray-600 dark:text-gray-400">
												BYOK requires a Pro plan subscription.
											</p>
										</div>
									)}
								</div>

								<div className="mt-auto pt-4">
									{plan.requiresPro ? (
										<UpgradeToProDialog>
											<Button
												className="w-full bg-gray-900 hover:bg-gray-800 text-white border-0 font-medium"
												variant="default"
												disabled={plan.buttonDisabled}
											>
												<Lock className="mr-2 h-4 w-4" />
												{plan.buttonText}
											</Button>
										</UpgradeToProDialog>
									) : (
										<Button
											className="w-full"
											variant={plan.buttonVariant}
											disabled={plan.buttonDisabled}
											onClick={plan.onClick}
										>
											{plan.id === "credits" && !plan.buttonDisabled && (
												<ArrowRight className="mr-2 h-4 w-4" />
											)}
											{plan.id === "byok" && !plan.requiresPro && (
												<ArrowRight className="mr-2 h-4 w-4" />
											)}
											{plan.id === "free" && (
												<CheckCircle className="mr-2 h-4 w-4" />
											)}
											{plan.buttonText}
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</Step>
	);
}
