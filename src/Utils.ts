import path = require('path');
import * as vscode from 'vscode';
import { ItemType } from './ItemType';
import { StateManager } from './misc/StateManager';
import { TreeItem } from './Provider/TreeDataProvider';

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

  public static getIcon(item: TreeItem): any {
    const nodeType = item.contextValue;
    if (nodeType === ItemType.File && item.active) {
      return {
        light: path.join(__filename, '..', '..', 'media', 'file_active_light.svg'),
        dark: path.join(__filename, '..', '..', 'media', 'file_active_dark.svg')
      }
    }
    if (nodeType === ItemType.File && !item.active) {
      return new vscode.ThemeIcon("eye-closed");
    }
    if (nodeType === ItemType.Result) {
      return new vscode.ThemeIcon("output");
    }
    if (nodeType === ItemType.Folder) {
      if (item.active) {
        return new vscode.ThemeIcon("folder-active");
      }
      return new vscode.ThemeIcon("folder");
    }
    return null;
  }

}