import * as vscode from 'vscode';
import { TreeItem } from '../../TreeDataProvider';

export enum ExecutionModes {
    "default" = "DEFAULT",
    "makefile" = "MAKEFILE"
}

export abstract class TaskExecuter {

    context: vscode.ExtensionContext; // needed to retrieve workspace folder
    mode: ExecutionModes = ExecutionModes.default;
    onDone: Function;

    files: TreeItem[];

    re = new RegExp(/[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/g);

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        this.context = context;
        this.onDone = onDone;
    }

    public setExecutionMode(mode: ExecutionModes): void {
        this.mode = mode;
    }

    public setFiles(files: any) {
        this.files = files;
    }

    public execute() {
        if (this.mode === ExecutionModes.default) {
            this.executeDefault();
        } else {
            this.executeMakefile();
        }
    }

    abstract executeDefault()

    abstract executeMakefile()
}