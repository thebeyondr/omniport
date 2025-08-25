import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";

import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			tree={source.pageTree}
			githubUrl="https://github.com/theopenco/llmgateway"
			{...baseOptions}
		>
			{children}
		</DocsLayout>
	);
}
