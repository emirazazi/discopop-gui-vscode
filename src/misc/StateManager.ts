import * as vscode from 'vscode';

export class StateManager{

    // StateManager working with Memento API for workspacewide state

    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    save(entry: string, value: any) {
        return this.context.workspaceState.update(entry, value);
    }

    read(entry: string): any {
        return this.context.workspaceState.get(entry);
    }

    saveObject(object: object) {
        Object.keys(object).map((key, value) => {
            this.context.workspaceState.update(key, value);
        });
    }

    static getXmlEntryNameForFile(fileId) {
        return "xmlstring" + fileId;
    }
}