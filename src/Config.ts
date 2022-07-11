import * as vscode from 'vscode';


export class Config {

    public static getWorkspacePath = (): string => {
        if (vscode.workspace.workspaceFolders) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath
        }
        return ""
    };

    public static getRootLabel = () => {
        const workspacePath = this.getWorkspacePath()

        const pathParts = workspacePath.split('/');

        if(!pathParts.length) {
            return ''
        }

        return pathParts[pathParts.length - 1];
    }

    public static discopopRoot: string = vscode.workspace.getConfiguration("discopop")?.get("discopopRoot");

    public static discopopBuild: string = vscode.workspace.getConfiguration("discopop").get("discopopRoot") + "/build";

    public static discopopFileMapper: string = vscode.workspace.getConfiguration("discopop").get("discopopRoot") + "/scripts/dp-fmap";
    
    public static clang: string = vscode.workspace.getConfiguration("discopop").get("clang");

    public static clangPP: string = vscode.workspace.getConfiguration("discopop").get("clangPP");

    public static codeLensEnabled: boolean = vscode.workspace.getConfiguration("discopop").get("recommendationsCodeLens", true);
}