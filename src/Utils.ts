import * as vscode from 'vscode';
import { StateManager } from './misc/StateManager';

export default class Utils {

  static hiddenStorage = (context: vscode.ExtensionContext) => {
    return context.storageUri?.path
  }

  static getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  static async handleClArgs(context): Promise<string> {
    const stateManager = new StateManager(context);

    const existingClArgs = stateManager.read("clArgs");
    const value = existingClArgs ? existingClArgs : "";

    const clArgs = await vscode.window.showInputBox({
      value: value,
      prompt: "Please enter the command line arguments: "
    });

    if (!clArgs?.length) {
      vscode.window.showInformationMessage("Executing with DiscoPoP default command line arguments!");
    }

    if (clArgs?.length) {
      stateManager.save("clArgs", clArgs);
    }

    return clArgs
  }

}