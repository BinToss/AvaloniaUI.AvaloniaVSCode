import type { ExtensionContext } from 'vscode';
import { initIntegration as initXml } from './redhat.vscode-xml';

export async function initExtensionIntegrations(context: ExtensionContext) {
    initXml(context);
}
