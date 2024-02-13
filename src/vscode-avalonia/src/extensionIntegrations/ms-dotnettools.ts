import * as vscode from "vscode";
import { Csdevkit } from "./ms-dotnettools.csdevkit";

export class ExtensionIDs {
    static readonly csharp = 'ms-dotnettools.csharp';
};

export class MSExtensions extends vscode.Disposable {
    constructor() { super(() => { }); }
    static preferCsharpOverCsdevkit() {
        return vscode.workspace.getConfiguration('').get<boolean>('dotnet.preferCSharpExtension') === true;
    }
    static shouldUseOmnisharp() {
        // note: if CsDevKit is active, 'csharp.server.useOmnisharp' is ignored.
        // csdevkit is inactive
        return Csdevkit.tryGetExtension()?.isActive !== true
            // and csharp is active
            && vscode.extensions.getExtension('ms-dotnettools.csharp')?.isActive === true
            && vscode.workspace.getConfiguration('dotnet.server').Get('UseOmnisharp') === true;
    }
}
// see vscode-csharp/src/lsptoolshost/services/solutionSnapshotProvider.ts
// export class AvaloniaBrokeredService /*implements IAvaloniaBrokeredService */ {
//     constructor(private _languageServerPromise: Promise<RoslynLanguageServer>) { }
// }