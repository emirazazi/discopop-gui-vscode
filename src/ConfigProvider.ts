import * as vscode from 'vscode';


export class ConfigProvider {

    public static workspacePath: string = vscode.workspace.workspaceFolders[0].uri.fsPath;

    public static discopopPath: string = vscode.workspace.getConfiguration("discopop").get("discopopPath");

    public static buildPath: string = vscode.workspace.getConfiguration("discopop").get("discopopPath") + "/build";

    public static fileMapperPath: string = vscode.workspace.getConfiguration("discopop").get("discopopPath") + "/scripts/dp-fmap";
    
    public static clangPath: string = vscode.workspace.getConfiguration("discopop").get("clangPath");
}