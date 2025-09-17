import { Badge } from "@/lib/components/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
	status: "active" | "inactive" | "deleted" | null;
	variant?: "simple" | "detailed";
}

export function StatusBadge({
	status,
	variant = "detailed",
}: StatusBadgeProps) {
	if (variant === "simple") {
		return (
			<Badge
				variant={status === "active" ? "default" : "secondary"}
				className="text-xs"
			>
				{status}
			</Badge>
		);
	}

	return (
		<Badge
			variant="secondary"
			className={cn(
				"text-xs uppercase text-gray-500 border-gray-500/50 dark:text-gray-300 dark:border-gray-300/50",
				status === "active" &&
					"bg-green-600/10 text-green-600 border-green-600/50 dark:text-green-500 dark:border-green-500/50",
			)}
		>
			{status}
		</Badge>
	);
}
