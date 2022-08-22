// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as fs from 'fs'
import { Commands } from './Commands'
import { CUGen } from './TaskRunners/CUGen'
import { DepProfiling } from './TaskRunners/DepProfiling'
import { PatternIdentification } from './TaskRunners/PatternIdentification'
import { RedOp } from './TaskRunners/RedOp'
import { StorageManager } from './misc/StorageManager'
import { SidebarProvider } from './Provider/SidebarProvider'
import { TreeDataProvider, TreeItem } from './Provider/TreeDataProvider'
import Utils from './Utils'
import CodeLensProvider from './Provider/CodeLensProvider'
import { StateManager } from './misc/StateManager'
import DiscoPoPParser from './misc/DiscoPoPParser'
import { DetailViewProvider } from './Provider/DetailViewProvider'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: vscode.Disposable[] = []

export function activate(context: vscode.ExtensionContext) {
    vscode.commands.executeCommand(Commands.initApplication)

    // SIDEBAR
    const sidebarProvider = new SidebarProvider(context)
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'execution-view',
            sidebarProvider
        )
    )

    // DETAIL VIEW
    const detailViewProvider = new DetailViewProvider(context)
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'detail-view',
            detailViewProvider
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.sendToDetail, (id) => {
            detailViewProvider.loadResultData(id)
        })
    )

    // TREE VIEW
    const treeDataProvider = new TreeDataProvider(context, '')
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('explorerId', treeDataProvider)
    )

    // TOGGLE TREE VIEW FILE
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.toggleEntry,
            (entry: TreeItem) => {
                treeDataProvider.toggleEntry(entry)
            }
        )
    )

    // TOGGLE TREE VIEW FOLDER
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.toggleFolder,
            (entry: TreeItem) => {
                treeDataProvider.toggleFolder(entry)
            }
        )
    )

    // CODE LENS
    const codeLensProvider = new CodeLensProvider(context)
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            '*', //wildcard all for now
            codeLensProvider
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('discopop.enableCodeLens', () => {
            vscode.workspace
                .getConfiguration('discopop')
                .update('recommendationsCodeLens', true, true)
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('discopop.disableCodeLens', () => {
            vscode.workspace
                .getConfiguration('discopop')
                .update('recommendationsCodeLens', false, true)
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'discopop.codelensAction',
            (lineNumber) => {
                codeLensProvider.insertRecommendation(lineNumber)
            }
        )
    )

    // INIT APPLICATION
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.initApplication, async () => {
            if (!treeDataProvider.loadTreeFromState()) {
                vscode.commands.executeCommand(Commands.refreshFileMapping)
                vscode.window.showInformationMessage(
                    'Loaded tree from FileMapping.txt!'
                )
                return
            }

            vscode.window.showInformationMessage('Loaded tree from tree state!')
        })
    )

    // REFRESH TREE VIEW COMMAND
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.refreshFileMapping,
            async () => {
                codeLensProvider.hideCodeLenses()
                if (
                    fs.existsSync(
                        `${Utils.hiddenStorage(context)}/FileMapping.txt`
                    )
                ) {
                    const localSM = new StorageManager(context)
                    const newFileMapping = (await localSM.readFile(
                        'FileMapping.txt',
                        true
                    )) as string

                    const stateManager = new StateManager(context)
                    stateManager.save('fileMapping', newFileMapping)
                    treeDataProvider.reloadFileMappingFromState()
                }
            }
        )
    )

    // EXECUTE CU GEN
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeCUGen, async () => {
            codeLensProvider.hideCodeLenses()
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Generating Computational Units',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const cugenRunner = new CUGen(context)
                    const files = treeDataProvider.getActiveFiles()
                    if (!files || !files?.length) {
                        vscode.window.showInformationMessage(
                            'Please select at least one file before executing a task!'
                        )
                    }
                    cugenRunner.setFiles(files)
                    await cugenRunner.executeDefault()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // EXECUTE DEP PROF
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeDepProf, async () => {
            codeLensProvider.hideCodeLenses()
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Profiling Data Dependencies',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const depprofRunner = new DepProfiling(context)

                    const files = treeDataProvider.getActiveFiles()
                    if (!files || !files?.length) {
                        vscode.window.showInformationMessage(
                            'Please select at least one file before executing a task!'
                        )
                    }
                    depprofRunner.setFiles(files)
                    await depprofRunner.executeDefault()
                    await depprofRunner.executeLinking()
                    await depprofRunner.executeDpRun()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // EXECUTE RED OP
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeRedOp, async () => {
            codeLensProvider.hideCodeLenses()
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Detecting Reduction Patterns',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const redopRunner = new RedOp(context)

                    const files = treeDataProvider.getActiveFiles()
                    if (!files || !files?.length) {
                        vscode.window.showInformationMessage(
                            'Please select at least one file before executing a task!'
                        )
                    }
                    redopRunner.setFiles(files)
                    await redopRunner.executeDefault()
                    await redopRunner.linkInstrumentedLoops()
                    await redopRunner.executeDpRunRed()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // EXECUTE PATTERN ID
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executePatternId, async () => {
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Identifying Parallel Patterns',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const patternidRunner = new PatternIdentification(context)
                    await patternidRunner.executeDefault()

                    vscode.commands.executeCommand(
                        Commands.applyResultsToTreeView
                    )

                    codeLensProvider.unhideCodeLenses()
                    codeLensProvider._onDidChangeCodeLenses.fire()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // APPLY RESULTS TO TREE VIEW
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.applyResultsToTreeView,
            async () => {
                detailViewProvider.clearView()
                const parser = new DiscoPoPParser(context, treeDataProvider)

                await parser.parseResultString()
            }
        )
    )

    // EXECUTE ALL
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.executeAll,
            async () => {
                // CUGEN
                const cugenRunner = new CUGen(context)
                    const files = treeDataProvider.getActiveFiles()
                    if (!files || !files?.length) {
                        vscode.window.showInformationMessage(
                            'Please select at least one file before executing a task!'
                        )
                    }
                    cugenRunner.setFiles(files)
                    await cugenRunner.executeDefault()

                    // DEP PROF
                    const depprofRunner = new DepProfiling(context)
                    depprofRunner.setFiles(files)
                    await depprofRunner.executeDefault()
                    await depprofRunner.executeLinking()
                    await depprofRunner.executeDpRun()

                    const redopRunner = new RedOp(context)
                    // RED OP
                    redopRunner.setFiles(files)
                    await redopRunner.executeDefault()
                    await redopRunner.linkInstrumentedLoops()
                    await redopRunner.executeDpRunRed()

                    const patternidRunner = new PatternIdentification(context)
                    await patternidRunner.executeDefault()

                    vscode.commands.executeCommand(
                        Commands.applyResultsToTreeView
                    )

                    codeLensProvider.unhideCodeLenses()
                    codeLensProvider._onDidChangeCodeLenses.fire()
            }
        )
    )
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (disposables) {
        disposables.forEach((item) => item.dispose())
    }
    disposables = []
}
