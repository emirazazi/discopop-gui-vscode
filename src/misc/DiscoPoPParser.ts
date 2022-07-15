import { StateManager } from "./StateManager"
import * as vscode from "vscode";



export default class DiscoPoPParser {

    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    parseResultString = () => {
        // parse discoPoP result from state manager and apply it to eisting treeView
        // the application to the treeview would consist to adding items type result
        // retrieve id from the result file and with this id get the childbyid TreeUtils.getChildBId()
        const stateManager = new StateManager(this.context);

        const resultString = stateManager.read('explorerResult')

        console.log(`result string retrieved by explorerResult is: ${resultString}`)
    }
}