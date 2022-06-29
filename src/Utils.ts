import * as vscode from 'vscode';

export default class Utils {

    static hiddenStorage = (context: vscode.ExtensionContext) => {
        return context.storageUri?.path
    }
}