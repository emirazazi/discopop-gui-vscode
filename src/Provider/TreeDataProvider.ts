import * as vscode from 'vscode';
import { TreeItemLabel, Uri, Command } from 'vscode';
import parseMappingToTree, { getPathById, removeAbsoluteSubpath } from '../misc/FileMappingParser';

enum NodeType {
  path = "PATH",
  file = "FILE",
  // TODO more specific discopop results
  discopopResult = "DISCO",
}

// custom node type for internal usage
interface NodeItem {
  id: string;
  fsPath?: string;
  isFolder?: boolean; // if node.id -> isFolder
  nodeType?: NodeType;
  resourceUri?: Uri;
  line?: number;
  column?: number;
}

export class TreeItem extends vscode.TreeItem implements NodeItem {
  children: TreeItem[]|undefined;
  id: string;
  path?: string;
  name?: string;
  
  constructor(label: string, children?: TreeItem[]) {
    super(
        label,
        /* vscode.TreeItemCollapsibleState.Expanded) */
        /* children === undefined ? vscode.TreeItemCollapsibleState.None :
                                  vscode.TreeItemCollapsibleState.Expanded); */
    )
    this.children = children;
    }
  }

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  data: TreeItem[] | undefined;

  private _context: vscode.ExtensionContext;
  private _workspaceRoot: string | undefined;

  constructor(_context: vscode.ExtensionContext, fileMapping: string) {
    this._context = _context;
    this._workspaceRoot = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
    this.data = parseMappingToTree(fileMapping);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    // Implement this to return the UI representation (TreeItem) of the element that 
    // gets displayed in the view.
    return element;
  }

  getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
    // Implement this to return the children for the given element or root (if no element is passed).

    if (!this._workspaceRoot) {
      vscode.window.showInformationMessage('No files to inspect in empty workspace');
      return [];
    }
    if (element === undefined) {
      // display full results
      return this.data;
    }
    return element.children;
  }

  public filterFiles(node, root, arr) {
    if (node.id) {
      arr.push({
        id: node.id,
        path: getPathById(this.data, node.id, root),
        name: node.name
      })
    }
    if (node.children) {
      node.children.map((children) => this.filterFiles(children, root, arr))
    }
    return
  }

  public getAllFiles() {
    let root = vscode.workspace.workspaceFolders[0].uri.fsPath
    let res = []
    this.data.map((node) => this.filterFiles(node, root, res))

    return res
  }



  public reloadMapping(fileMapping: string) {
    this.data = parseMappingToTree(fileMapping)
    this._onDidChangeTreeData.fire();
  }
}

















const getCommand = (fsPath: string, line: number): Command => {
  let comm = {
    title: "Jump to recommendation",
    command: "vscode.open",
    arguments: [
      vscode.Uri.file(fsPath),
      {selection: new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0))}
    ]
  };
  return comm;
}