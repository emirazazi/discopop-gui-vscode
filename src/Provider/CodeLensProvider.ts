import * as vscode from 'vscode';
import { CancellationToken, CodeLens, Command, Position, Range, SnippetString, TextDocument, window } from 'vscode';
import { Commands } from '../Commands';
import { Config } from '../Config';
import { IDoAll, IReduction } from '../misc/DiscoPoPParser';
import { StateManager } from '../misc/StateManager';
import { ResultStatus } from '../ResultStatus';
import { ResultType } from '../ResultType';

export default class CodeLensProvider implements vscode.CodeLensProvider {

    context: vscode.ExtensionContext;
    private codeLenses: vscode.CodeLens[] = [];

    private recommendations: IDoAll[] | IReduction[];
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(context) {
        this.context = context;

        this.recommendations = [];

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        if (Config.codeLensEnabled) {
            const stateManager = new StateManager(this.context);
            const ids = stateManager.read(document.fileName.toString())

            if (!ids) {
                return [];
            }

            const parsedIds = JSON.parse(ids);
            if (!parsedIds && !parsedIds.length) {
                return [];
            }

            console.log(parsedIds)

            this.recommendations = parsedIds.map((id) => {
                let res = stateManager.read(id)
                if (res) {
                    let recommendation = JSON.parse(res)
                    if (recommendation && recommendation.status !== ResultStatus.Applied) {
                        return recommendation
                    }
                }
                return
            })

            if (!this.recommendations) {
                return [];
            }

            this.recommendations = this.recommendations.filter((elem) => elem?.id);

            this.codeLenses = this.recommendations.map((recommendation) => this.buildCodeLens(recommendation))

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

    public buildCodeLens(result) {

        const position = new vscode.Position(result.line, 0);
        const range = new Range(position, position)

        const typeText = result.resultType === ResultType.DoAll ? "Do All" : "Reduction"

        const codeLens = new vscode.CodeLens(range, {
            title: `${typeText} recommended with pragma: ${result.pragma}. Click to insert.`,
            command: "discopop.codelensAction",
            arguments: [result.id]
        })

        return codeLens
    }
    public insertRecommendation = async (recommendationId) => {
        console.log("INSERTING " + recommendationId)
        let recommendation = this.recommendations?.find((elem) => elem.id === recommendationId)

        if (!recommendation) {
            return
        }

        if (recommendation.resultType === ResultType.DoAll) {
            this.insertDoAll(recommendation);
        }

        if (recommendation.resultType === ResultType.Reduction) {
            this.insertReduction(recommendation);
        }

        this.moveOtherRecommendations(recommendation);

        recommendation.status = ResultStatus.Applied;

        const stateManager = new StateManager(this.context);
        stateManager.save(recommendation.id, JSON.stringify(recommendation));

        vscode.commands.executeCommand(Commands.sendToDetail, [recommendation.id])
    }

    private moveOtherRecommendations = (removedRecommendation) => {
        this.recommendations.map((recommendation) => {
            console.log(recommendation)
            if (recommendation.id === removedRecommendation.id) {
                return
            }
            if (recommendation.line > removedRecommendation.line) {
                if (recommendation.startLine) {
                    recommendation.startLine += 1;
                }
                if (recommendation.line) {
                    recommendation.line += 1;
                }
                if (recommendation.endLine) {
                    recommendation.endLine += 1;
                }
                console.log(recommendation)
                const stateManager = new StateManager(this.context);
                stateManager.save(recommendation.id, JSON.stringify(recommendation));
            }
        })
        this._onDidChangeCodeLenses.fire();
    }

    private insertDoAll = (recommendation) => {
        console.log("Do all inserted")
    }

    private insertReduction = (recommendation) => {
        console.log("Reduction inserted")
    }

    /* static addConsoleLog = async (lineNumber) => {


        const editor = vscode.window.activeTextEditor;

        console.log(lineNumber)

        if (editor) {
            editor.edit(editBuilder => {
                editBuilder.insert(new Position(lineNumber, 0), "//this is an inserted snippet\n");
            })
        }
    } */
}