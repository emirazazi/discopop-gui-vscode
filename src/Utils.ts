import * as vscode from 'vscode';

export default class Utils {

    static hiddenStorage = (context: vscode.ExtensionContext) => {
        return context.storageUri?.path
    }

    static getNonce () {
        let text = "";
        const possible =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
      }

}