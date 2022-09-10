import * as vscode from 'vscode'
import { Commands } from '../Commands'
import { IDoAll, IReduction } from '../misc/DiscoPoPParser'
import { StateManager } from '../misc/StateManager'
import { ResultStatus } from '../ResultStatus'
import { ResultType } from '../ResultType'
import Utils from '../Utils'

export class DetailViewProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView
    _doc?: vscode.TextDocument

    private _extensionUri: vscode.Uri
    private context: vscode.ExtensionContext

    private resultData: IDoAll | IReduction

    constructor(context: vscode.ExtensionContext) {
        this._extensionUri = context.extensionUri
        this.context = context
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'onInfo': {
                    if (!data.value) {
                        return
                    }
                    vscode.window.showInformationMessage(data.value)
                    break
                }
                case 'onError': {
                    if (!data.value) {
                        return
                    }
                    vscode.window.showErrorMessage(data.value)
                    break
                }
                /* case "printDetail": {
            console.log(`Recommendation received with value: `)
            console.log(data.value);
            break;
        } */
            }
        })
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel
    }

    public loadResultData(id) {
        const stateManager = new StateManager(this.context)
        const data = JSON.parse(stateManager.read(id))
        if (!data) {
            return
        }

        this.resultData = data
        const webviewView = this._view
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)
    }

    public clearView() {
        this.resultData = undefined
        const webviewView = this._view
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        //const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebarProvider.js'));

        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        )
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        )

        // Use a nonce to only allow a specific script to be run.
        const nonce = Utils.getNonce()

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
                ${this.resultData ? this.resultHtml() : this.emptyHtml()}
			</body>
			</html>`
    }

    private resultHtml = () => {
        return `<table style="width:100%">
        <tr>
          <th>Status:</th>
          <td>${
              this.resultData.status === ResultStatus.New
                  ? 'Not Applied'
                  : 'Applied'
          }</td>
        </tr>
        ${
            this.resultData.resultType === ResultType.DoAll
                ? this.doAllEntries()
                : ''
        }
        ${
            this.resultData.resultType === ResultType.Reduction
                ? this.reductionEntries()
                : ''
        }
      </table>`
    }

    private doAllEntries = () => {
        const doAll = this.resultData as IDoAll
        return `
        <tr>
          <th>Type:</th>
          <td>${doAll.resultType}</td>
        </tr>
        <tr>
          <th>Line:</th>
          <td>${doAll.line}</td>
        </tr>
        <tr>
          <th>Start Line:</th>
          <td>${doAll.startLine}</td>
        </tr>
        <tr>
          <th>End Line:</th>
          <td>${doAll.endLine}</td>
        </tr>
        <tr>
          <th>Pragma:</th>
          <td>${doAll.pragma}</td>
        </tr>
        <tr>
          <th>Iterations:</th>
          <td>${doAll.iterations}</td>
        </tr>
        <tr>
          <th>Instructions:</th>
          <td>${doAll.instructions}</td>
        </tr>
        <tr>
          <th>Workload:</th>
          <td>${doAll.workload}</td>
        </tr>
        <tr>
          <th>Private:</th>
          <td>${doAll.priv}</td>
        </tr>
        <tr>
          <th>Shared:</th>
          <td>${doAll.shared}</td>
        </tr>
        <tr>
          <th>First Private:</th>
          <td>${doAll.firstPrivate}</td>
        </tr>
        <tr>
          <th>Reduction:</th>
          <td>${doAll.reduction}</td>
        </tr>
        <tr>
          <th>Last Private:</th>
          <td>${doAll.lastPrivate}</td>
        </tr>
        `
    }

    private reductionEntries = () => {
        const reduction = this.resultData as IReduction
        return `
        <tr>
          <th>Type:</th>
          <td>${reduction.resultType}</td>
        </tr>
        <tr>
        <th>Line:</th>
        <td>${reduction.line}</td>
        </tr>
        <tr>
          <th>Start Line:</th>
          <td>${reduction.startLine}</td>
        </tr>
        <tr>
          <th>End Line:</th>
          <td>${reduction.endLine}</td>
        </tr>
        <tr>
          <th>Pragma:</th>
          <td>${reduction.pragma}</td>
        </tr>
        <tr>
          <th>Private:</th>
          <td>${reduction.priv}</td>
        </tr>
        <tr>
          <th>Shared:</th>
          <td>${reduction.shared}</td>
        </tr>
        <tr>
          <th>First Private:</th>
          <td>${reduction.firstPrivate}</td>
        </tr>
        <tr>
          <th>Reduction:</th>
          <td>${reduction.reduction}</td>
        </tr>
        <tr>
          <th>Last Private:</th>
          <td>${reduction.lastPrivate}</td>
        </tr>
        `
    }

    private emptyHtml = () => {
        return `<p>
        After running DiscoPoP, select a recommendation in the FILES view to display information about it here.
        </p>
        `
    }
}
