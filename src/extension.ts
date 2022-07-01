// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { CommandProvider } from './CommandProvider';
import { CUGen } from './Manager/TaskRunners/CUGen';
import { DepProfiling } from './Manager/TaskRunners/DepProfiling';
import { PatternIdentification } from './Manager/TaskRunners/PatternIdentification';
import { RedOp } from './Manager/TaskRunners/RedOp';
import { StorageManager } from './misc/StorageManager';
import { SidebarProvider } from './SidebarProvider';
import { TreeDataProvider } from './TreeDataProvider';
import Utils from './Utils';
import RecommendationsCodeLensProvider from './RecommendationsCodeLensProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.executeCommand(CommandProvider.initApplication)

	// SIDEBAR
	const sidebarProvider = new SidebarProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("discopop-view", sidebarProvider)
	);
	
	// TREE VIEW
	const treeDataProvider = new TreeDataProvider(context, "");
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider("explorerId", treeDataProvider)
	);

	// CODE LENS 
	/* const codeLensProvider = new RecommendationsCodeLensProvider()
	context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            "*", //wildcard all for now
			codeLensProvider));

	context.subscriptions.push(vscode.commands.registerCommand("discopop.enableCodeLens", () => {
		vscode.workspace.getConfiguration("discopop").update("recommendationsCodeLens", true, true);
		})
	)

	context.subscriptions.push(vscode.commands.registerCommand("discopop.disableCodeLens", () => {
		vscode.workspace.getConfiguration("discopop").update("recommendationsCodeLens", false, true);
		})
	)

	context.subscriptions.push(vscode.commands.registerCommand("discopop.codelensAction", (args: any) => {
		vscode.window.showInformationMessage(`CodeLens action clicked with args=${args}`);
		})
	) */

	// INIT APPLICATION
	context.subscriptions.push(vscode.commands.registerCommand(CommandProvider.initApplication, async () => {
		if (fs.existsSync(`${Utils.hiddenStorage(context)}/FileMapping.txt`)) {
			const localSM = new StorageManager(context);
			let newFileMapping =  await localSM.readFile('FileMapping.txt', true) as string
			treeDataProvider.reloadMapping(newFileMapping)
			vscode.window.showInformationMessage("Loaded existing file mapping from storage!")
		}
	}))
	// REFRESH TREE VIEW COMMAND
	context.subscriptions.push(vscode.commands.registerCommand(CommandProvider.refreshFileMapping, async () => {
		const localSM = new StorageManager(context);
		let newFileMapping =  await localSM.readFile('FileMapping.txt', true) as string
		treeDataProvider.reloadMapping(newFileMapping)
	}))

	// EXECUTE CU GEN
	context.subscriptions.push(vscode.commands.registerCommand(CommandProvider.executeCUGen, async () => {
		const cugenRunner = new CUGen(context)
		cugenRunner.setFiles(treeDataProvider.getAllFiles())
		await cugenRunner.executeDefault()
	}))

	// EXECUTE DEP PROF
	context.subscriptions.push(vscode.commands.registerCommand(CommandProvider.executeDepProf, async () => {
		const depprofRunner = new DepProfiling(context);
		depprofRunner.setFiles(treeDataProvider.getAllFiles())
		await depprofRunner.executeDefault()
		await depprofRunner.executeLinking()
		await depprofRunner.executeDpRun()
	}))

	// EXECUTE RED OP
	context.subscriptions.push(vscode.commands.registerCommand(CommandProvider.executeRedOp, async () => {
		const redopRunner = new RedOp(context);
		redopRunner.setFiles(treeDataProvider.getAllFiles())
		await redopRunner.executeDefault()
		await redopRunner.linkInstrumentedLoops()
		await redopRunner.executeDpRunRed()
	}))

	// EXECUTE PATTERN ID
	context.subscriptions.push(vscode.commands.registerCommand(CommandProvider.executePatternId, async () => {
		const patternidRunner = new PatternIdentification(context);
		patternidRunner.setFiles(treeDataProvider.getAllFiles())
		await patternidRunner.executeDefault()
	}))
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (disposables) {
        disposables.forEach(item => item.dispose());
    }
    disposables = [];
}
