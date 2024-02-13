import * as vscode from "vscode";
import { ServiceMoniker, Formatters, MessageDelimiters, ServiceJsonRpcDescriptor } from "@microsoft/servicehub-framework";
import cancellationToken from "cancellationtoken";
import { MSExtensions } from "./ms-dotnettools";
import type { CSharpDevKitExports } from "vscode-csharp/src/csharpDevKitExports";

export const extensionID = 'ms-dotnettools.csdevkit';

export class Csdevkit {
    private _exports: CSharpDevKitExports | undefined = Csdevkit.tryGetExtension()?.exports;
    constructor(context: vscode.ExtensionContext) {
        /** use context for disposables, if needed */
    }
    static currentInstance: Csdevkit;
    static tryGetExtension() {
        if (MSExtensions.preferCsharpOverCsdevkit() || MSExtensions.shouldUseOmnisharp()) {
            return undefined;
        }
        return vscode.extensions.getExtension<CSharpDevKitExports>(extensionID);
    }
    get exports() { return this._exports; }

    //todo: subscribe for vscode.extensions.onChanged
}

let pipe;
export async function playground(context: vscode.ExtensionContext) {
    if (Csdevkit.currentInstance.exports === undefined) { return; }

    const csdevkitExports = Csdevkit.currentInstance.exports;

    async function pipeNegotiation(_context: vscode.ExtensionContext) {
        //globalBrokeredServiceContainer.
        /*
        const remoteServiceBroker = new RemoteServiceBroker(
            { ...(await (await MSExtensions.csdevkit).serviceBroker), },
            {},
            undefined
        );
        */
        // ! this pipe name isn't a service moniker. roslynLanguageServer does the following: this._languageClient.sendNotification('serviceBroker/connect', { pipeName: pipeName });
        const serviceMoniker = ServiceMoniker.create(await csdevkitExports.getBrokeredServiceServerPipeName());
        const csDevKitServiceDescriptor = new ServiceJsonRpcDescriptor(serviceMoniker, Formatters.MessagePack, MessageDelimiters.HttpLikeHeaders, undefined);
        const cancelTokenGetProxy = cancellationToken.create();
        const serviceProxy = await csdevkitExports.serviceBroker.getProxy(csDevKitServiceDescriptor, undefined, cancelTokenGetProxy.token);
        if (csdevkitExports.hasServerProcessLoaded()) {
            // dead end :(. serviceBroker/connect is a Notification. We can only send Requests.
            //csharpExports.experimental.sendServerRequest(new RequestType('serviceBroker/connect'), { pipeName: pipeName },null);
            pipe = await csdevkitExports.serviceBroker.getPipe(serviceMoniker);
            // we now have a read-write pipe :)
        }
        else {
            /** shamelessly copied from vscode-csharp */
            /*
            _context.subscriptions.push(
                exports.serverProcessLoaded(async () => (await roslynLanguageServerPromise).sendOrSubscribeForServiceBrokerConnection())
            );
            */
        }
    }

    function searchOutput() {
        // search csdevkit output for this. Why is its API so...obtuse?
        const completedCommandRestoreSolutionKeywords = ["dotnet", "restore", ".sln"];
        /* dead-end.
        VSCode does not expose an API to read others' Output channels
        Additionally, ms-dotnettools.csharp and csdevkit do not write their Output streams to files.
        */
        //vscode.window.outputs
    }
}
//# sourceMappingURL=ms-dotnettools.csdevkit.js.map