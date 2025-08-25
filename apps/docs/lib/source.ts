import { loader } from "fumadocs-core/source";
import { createOpenAPI, attachFile } from "fumadocs-openapi/server";
import { icons } from "lucide-react";
import { createElement } from "react";

import { docs } from "@/.source";

export const source = loader({
	icon(icon) {
		if (!icon) {
			return;
		}
		if (icon in icons) {
			return createElement(icons[icon as keyof typeof icons]);
		}
	},
	baseUrl: "/",
	source: docs.toFumadocsSource(),
	pageTree: {
		attachFile,
	},
});

export const openapi = createOpenAPI({
	proxyUrl: "/api/proxy",
});
