"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/lib/components/card";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { RadioGroup, RadioGroupItem } from "@/lib/components/radio-group";

interface ReferralStepProps {
	onComplete?: (source: string, details?: string) => void;
}

export function ReferralStep({ onComplete }: ReferralStepProps) {
	const [selectedSource, setSelectedSource] = useState<string>("");
	const [otherDetails, setOtherDetails] = useState<string>("");
	const onCompleteRef = useRef(onComplete);

	// Keep the ref updated with the latest onComplete function
	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	const referralSources = [
		{ value: "twitter", label: "X (Formerly Twitter)" },
		{ value: "email", label: "Email" },
		{ value: "reddit", label: "Reddit" },
		{ value: "producthunt", label: "ProductHunt" },
		{ value: "devntell", label: "DevNTell podcast" },
		{ value: "other", label: "Other (Specify)" },
	];

	// Handle completion when a source is selected or manually triggered
	useEffect(() => {
		if (selectedSource && selectedSource !== "other") {
			// Auto-complete for non-"other" selections after a brief delay
			const timer = setTimeout(() => {
				onCompleteRef.current?.(selectedSource);
			}, 1000); // Increased delay to give users time to change their mind
			return () => clearTimeout(timer);
		}
		// Return empty cleanup function if condition is not met
		return () => {};
	}, [selectedSource]);

	// Handle "other" completion when details are provided
	useEffect(() => {
		if (selectedSource === "other" && otherDetails.trim()) {
			const timer = setTimeout(() => {
				onCompleteRef.current?.(selectedSource, otherDetails);
			}, 1500); // Longer delay for typing
			return () => clearTimeout(timer);
		}
		// Return empty cleanup function if condition is not met
		return () => {};
	}, [selectedSource, otherDetails]);

	return (
		<div className="space-y-6">
			<div className="text-center space-y-2">
				<h2 className="text-3xl font-semibold tracking-tight">
					How did you find us?
				</h2>
				<p className="text-muted-foreground">
					Help us improve by letting us know how you found us. No pressure - you
					can skip this step.
				</p>
			</div>

			<Card>
				<CardContent className="pt-6 space-y-4">
					<RadioGroup
						value={selectedSource}
						onValueChange={setSelectedSource}
						className="space-y-3"
					>
						{referralSources.map((source) => (
							<div key={source.value} className="flex items-center space-x-2">
								<RadioGroupItem value={source.value} id={source.value} />
								<Label
									htmlFor={source.value}
									className="flex-1 cursor-pointer text-sm font-normal"
								>
									{source.label}
								</Label>
							</div>
						))}
					</RadioGroup>

					{selectedSource === "other" && (
						<div className="mt-4 space-y-2">
							<Label htmlFor="other-details" className="text-sm font-medium">
								Please specify:
							</Label>
							<Input
								id="other-details"
								placeholder="Blog, conference, friend, etc..."
								autoFocus
								value={otherDetails}
								onChange={(e) => setOtherDetails(e.target.value)}
								className="w-full"
							/>
						</div>
					)}

					{selectedSource && (
						<div className="text-sm text-muted-foreground text-center mt-4">
							{selectedSource === "other" && !otherDetails.trim()
								? "Please provide details above, or use the Next button to continue."
								: "Thanks! Moving to the next step automatically..."}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
