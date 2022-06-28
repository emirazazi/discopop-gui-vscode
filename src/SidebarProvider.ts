import * as vscode from "vscode";
import { CommandProvider } from "./CommandProvider";
import { getNonce } from "./getNonce";
import { FileMapper } from "./Manager/TaskRunners/FileMapper";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  private _extensionUri: vscode.Uri;
  private context;

  constructor(context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
    this.context = context;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "executeFilemapping": {
          const fm = new FileMapper(this.context);
          fm.execute();
          break;
        }
        case "executeCUGen": {
          vscode.commands.executeCommand(CommandProvider.executeCUGen)
          break;
        }
        case "executeDepProf": {
          vscode.commands.executeCommand(CommandProvider.executeDepProf)
          break;
        }
        case "executeRedOp": {
          vscode.commands.executeCommand(CommandProvider.executeRedOp)
          break;
        }
        case "executePatterinId": {
          vscode.commands.executeCommand(CommandProvider.executePatternId)
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebarProvider.js'));

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        
			</head>
            <body>
                <button class="execute-filemapping">Run Filemapping</button>
                <button class="execute-cugen">Run CUGen</button>
                <button class="execute-depprof">Run DepProf</button>
                <button class="execute-redop">Run RedOp</button>
                <button class="execute-patternid">Run PatternId</button>
                <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}