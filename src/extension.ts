// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { Commands } from './Commands';
import { CUGen } from './TaskRunners/CUGen';
import { DepProfiling } from './TaskRunners/DepProfiling';
import { PatternIdentification } from './TaskRunners/PatternIdentification';
import { RedOp } from './TaskRunners/RedOp';
import { StorageManager } from './misc/StorageManager';
import { SidebarProvider } from './Provider/SidebarProvider';
import { TreeDataProvider, TreeItem } from './Provider/TreeDataProvider';
import Utils from './Utils';
import RecommendationsCodeLensProvider from './Provider/RecommendationsCodeLensProvider';
import { StateManager } from './misc/StateManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.executeCommand(Commands.initApplication)

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

	// TOGGLE TREE VIEW ENTRY
	
	context.subscriptions.push(vscode.commands.registerCommand(Commands.toggleEntry, (entry: TreeItem) => {
		treeDataProvider.toggleEntry(entry);
	}));

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
	context.subscriptions.push(vscode.commands.registerCommand(Commands.initApplication, async () => {
		vscode.commands.executeCommand(Commands.refreshFileMapping)
	}))

	// REFRESH TREE VIEW COMMAND
	context.subscriptions.push(vscode.commands.registerCommand(Commands.refreshFileMapping, async () => {
		if (fs.existsSync(`${Utils.hiddenStorage(context)}/FileMapping.txt`)) {
			const localSM = new StorageManager(context);
			const newFileMapping =  await localSM.readFile('FileMapping.txt', true) as string
	
			const stateManager = new StateManager(context);
			stateManager.save("fileMapping", newFileMapping);
			treeDataProvider.reloadFileMappingFromState();
		}
	}))

	// EXECUTE CU GEN
	context.subscriptions.push(vscode.commands.registerCommand(Commands.executeCUGen, async () => {
		const cugenRunner = new CUGen(context)
		cugenRunner.setFiles(treeDataProvider.getActiveFiles())
		await cugenRunner.executeDefault()
	}))

	// EXECUTE DEP PROF
	context.subscriptions.push(vscode.commands.registerCommand(Commands.executeDepProf, async () => {
		const depprofRunner = new DepProfiling(context);
		depprofRunner.setFiles(treeDataProvider.getActiveFiles())
		await depprofRunner.executeDefault()
		await depprofRunner.executeLinking()
		await depprofRunner.executeDpRun()
	}))

	// EXECUTE RED OP
	context.subscriptions.push(vscode.commands.registerCommand(Commands.executeRedOp, async () => {
		const redopRunner = new RedOp(context);
		redopRunner.setFiles(treeDataProvider.getActiveFiles())
		await redopRunner.executeDefault()
		await redopRunner.linkInstrumentedLoops()
		await redopRunner.executeDpRunRed()
	}))

	// EXECUTE PATTERN ID
	context.subscriptions.push(vscode.commands.registerCommand(Commands.executePatternId, async () => {
		const patternidRunner = new PatternIdentification(context);
		patternidRunner.setFiles(treeDataProvider.getActiveFiles())
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
