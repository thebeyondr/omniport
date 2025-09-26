/**
 * Utility functions for detecting self-hosted environments
 */

/**
 * Checks if a hostname indicates a self-hosted or local environment
 * @param hostname - The hostname to check
 * @returns true if the hostname indicates self-hosting
 */
export function isSelfHostedHost(hostname: string): boolean {
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
		/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
		/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
		hostname.endsWith(".local")
	);
}

/**
 * Detects if the current environment is self-hosted based on window.location.hostname
 * @returns true if running in a self-hosted environment
 */
export function isSelfHostedEnvironment(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return isSelfHostedHost(window.location.hostname);
}
