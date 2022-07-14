import * as vscode from 'vscode';
import { CancellationToken, CodeLens, Command, Position, Range, SnippetString, TextDocument, window } from 'vscode';
import { Config } from '../Config';

export default class RecommendationsCodeLensProvider implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        this.regex = /(.+)/g;

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        if (Config.codeLensEnabled) {
            this.codeLenses = [];
            const regex = new RegExp(this.regex);
            const text = document.getText();
            let matches;

            // here just iterate over a list of lines where line is pragma insertion line
            while ((matches = regex.exec(text)) !== null) {
                const line = document.lineAt(document.positionAt(matches.index).line);
                const indexOf = line.text.indexOf(matches[0]);
                const position = new vscode.Position(line.lineNumber, indexOf);
                const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                if (range) {
                    const codeLens = new vscode.CodeLens(range, {
                        title: "Codelens provided by sample extension",
                        tooltip: "Tooltip provided by sample extension",
                        command: "discopop.codelensAction",
                        arguments: [line.lineNumber]
                    })
                    this.codeLenses.push(codeLens);
                }
            }
            return this.codeLenses;
        }
        return [];
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        if (Config.codeLensEnabled) {
            return codeLens;
        }
        return null;
    }

    static addConsoleLog = async (lineNumber) => {


        const editor = vscode.window.activeTextEditor;

        console.log(lineNumber)

        if (editor) {
            editor.edit(editBuilder => {
                editBuilder.insert(new Position(lineNumber, 0), "//this is an inserted snippet\n");
            })
        }
    }
}