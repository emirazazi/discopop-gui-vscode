import * as vscode from 'vscode';


export class ConfigProvider {

    public static getWorkspacePath = (): string => {
        if (vscode.workspace.workspaceFolders) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath
        }
        return ""
    };

    public static discopopPath: string = vscode.workspace.getConfiguration("discopop")?.get("discopopPath");

    public static buildPath: string = vscode.workspace.getConfiguration("discopop").get("discopopPath") + "/build";

    public static fileMapperPath: string = vscode.workspace.getConfiguration("discopop").get("discopopPath") + "/scripts/dp-fmap";
    
    public static clangPath: string = vscode.workspace.getConfiguration("discopop").get("clangPath");

    public static clangPlusPlusPath: string = vscode.workspace.getConfiguration("discopop").get("clangPlusPlusPath");
}