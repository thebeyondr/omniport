export type User = {
	id: string;
	email: string;
	name: string | null;
} | null;

export interface ApiKey {
	id: string;
	createdAt: string;
	updatedAt: string;
	maskedToken: string;
	status: "active" | "inactive" | "deleted" | null;
	usageLimit: string | null;
	usage: string;
	description: string;
	projectId: string;
	iamRules?: Array<{
		id: string;
		createdAt: string;
		updatedAt: string;
		ruleType:
			| "allow_models"
			| "deny_models"
			| "allow_pricing"
			| "deny_pricing"
			| "allow_providers"
			| "deny_providers";
		ruleValue: {
			models?: string[];
			providers?: string[];
			pricingType?: "free" | "paid";
			maxInputPrice?: number;
			maxOutputPrice?: number;
		};
		status: "active" | "inactive";
	}>;
}

export interface ComboboxModel {
	id: string; // providerId/modelName (value sent to API)
	name?: string; // Friendly model name
	provider?: string; // Provider display name
	providerId?: string; // Provider id
	family?: string; // Model family for icon fallback
	context?: number;
	inputPrice?: number;
	outputPrice?: number;
	vision?: boolean;
	tools?: boolean;
}
