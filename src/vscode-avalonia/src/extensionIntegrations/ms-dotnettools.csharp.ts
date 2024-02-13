import { Formatters, MessageDelimiters, ServiceMoniker, ServiceJsonRpcDescriptor } from '@microsoft/servicehub-framework';
import * as vscode from 'vscode';
import { WorkspaceDebugConfigurationRequest } from 'vscode-csharp/src/lsptoolshost/roslynProtocol';
import Descriptors from 'vscode-csharp/src/lsptoolshost/services/descriptors';
import { MSExtensions } from "./ms-dotnettools";
import type { CSharpExtensionExports, OmnisharpExtensionExports } from 'vscode-csharp/src/csharpExtensionExports';

export const extensionID = 'ms-dotnettools.csharp';

export class CSharp {
    private _exports = CSharp.tryGetExtension()?.exports;
    constructor(context: vscode.ExtensionContext) {

    }
    static currentInstance: CSharp;
    static tryGetExtension() {
        if (MSExtensions.shouldUseOmnisharp()) {
            return vscode.extensions.getExtension<OmnisharpExtensionExports>(extensionID);
        } else {
            return vscode.extensions.getExtension<CSharpExtensionExports>(extensionID);
        }
    }
    get exports() { return this._exports; }
}
/** May by OmniSharp -or- CSharp */
// see vscode-csharp/src/lsptoolshost/services/brokeredServicesHosting
import { URI as lspURI } from 'vscode-languageserver-protocol';
export async function playground(context: vscode.ExtensionContext) {

    const csharpExports = CSharp.currentInstance.exports as CSharpExtensionExports;
    if (!csharpExports || !csharpExports.profferBrokeredServices) {
        throw new Error("");
    }

    const srCancelToken = new vscode.CancellationTokenSource();
    const response = await csharpExports
        .experimental
        .sendServerRequest(// roslyn server
            WorkspaceDebugConfigurationRequest.type,
            { workspacePath: vscode.window.activeTextEditor?.document.uri.fsPath },
            srCancelToken.token
        );
    console.log(response);
}
