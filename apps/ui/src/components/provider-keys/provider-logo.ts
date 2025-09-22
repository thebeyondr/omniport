import { ProviderIcons } from "@/components/ui/providers-icons";

import type { ProviderId } from "@llmgateway/models";

export const providerLogoUrls: Partial<
	Record<ProviderId, React.FC<React.SVGProps<SVGSVGElement>>>
> = {
	openai: ProviderIcons.openai,
	anthropic: ProviderIcons.anthropic,
	"google-ai-studio": ProviderIcons["google-ai-studio"],
	"inference.net": ProviderIcons["inference.net"],
	"together.ai": ProviderIcons["together.ai"],
	cloudrift: ProviderIcons.cloudrift,
	mistral: ProviderIcons.mistral,
	groq: ProviderIcons.groq,
	xai: ProviderIcons.xai,
	deepseek: ProviderIcons.deepseek,
	perplexity: ProviderIcons.perplexity,
	moonshot: ProviderIcons.moonshot,
	novita: ProviderIcons.novita,
	alibaba: ProviderIcons.alibaba,
	nebius: ProviderIcons.nebius,
	zai: ProviderIcons.zai,
	routeway: ProviderIcons.routeway,
	"routeway-discount": ProviderIcons.routeway,
};

export const getProviderLogoDarkModeClasses = () => {
	return "";
};
