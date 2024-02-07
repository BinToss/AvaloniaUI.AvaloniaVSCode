import type { ExtensionContext } from 'vscode';
import { initIntegration } from './redhat.vscode-xml';

export async function initExtensionIntegrations(context: ExtensionContext) {
    initIntegration(context);
}
