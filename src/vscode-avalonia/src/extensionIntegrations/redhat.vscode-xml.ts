import * as vscode from 'vscode';
import * as util from '../util/Utilities';

export function initIntegration(context: vscode.ExtensionContext) {
    /* subscribe for events */
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.languageId === util.avaloniaLanguageId && vscode.workspace.getConfiguration("", document).get<string>('editor.defaultFormatter') === 'redhat.vscode-xml') {
                activateRedhatXmlIfAvailable()?.then(() => {
                    /* rather than immediately formatting with default settings (which
                    are undesired for AXAML/XAML), we should prompt the user...or write
                    the settings we recommend to the workspace under [AXAML]...when
                    vscode-xml allows settings to be overridden on a per-language basis.
                    */
                    //vscode.commands.executeCommand('editor.action.formatDocument.multiple', 'redhat.vscode-xml')
                });
            }
        }),
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && util.isAvaloniaFile(editor.document)) {
                activateRedhatXmlIfAvailable();
            }
        }),
        vscode.extensions.onDidChange(() => {
            const editor = vscode.window.activeTextEditor;
            if (editor && util.isAvaloniaFile(editor.document)) {
                activateRedhatXmlIfAvailable();
            }
        })
    );
}

export function activateRedhatXmlIfAvailable() {
    /*  When AXAML is activated (that's us), try activating redhat.vscode-xml so its formatter is available.
        We inform redhat.vscode-xml of our XML-based language via contributes.xmlLanguageParticipants in our package.json. See https://github.com/redhat-developer/vscode-xml/blob/main/docs/Extensions.md#contribution-in-packagejson
    */
    const xml = vscode.extensions.getExtension("redhat.vscode-xml");
    if (xml && !xml.isActive) {
        return xml.activate();
    }
}
