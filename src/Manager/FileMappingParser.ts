import path = require('path');
import * as vscode from 'vscode';
import { TreeItem } from '../TreeDataProvider';

function createNode(tree: TreeItem[], filePath: string[], id: string) {
    let label = filePath.shift();
    const idx = tree.findIndex((node) => {
        return node.label === label;
    });

    if(idx < 0) {
        // todo handle root workspace. Meaning put all root elements in one node
        tree.push({
            label: label,
            children: [],
            collapsibleState: filePath.length === 0 ? 1 : 2,
            id: filePath.length === 0 ? id : undefined,
            name: filePath.length === 0 ? getFileName(label) : undefined
        });
        if (filePath.length !== 0) {
            createNode(tree[tree.length-1].children, filePath, id);
        }
    } else {
        createNode(tree[idx].children, filePath, id);
    }
}

function getFileName(label: string) {
    return path.parse(label).name
}

export default function parseMappingToTree(fileMapping: string): any {
    const lines = fileMapping.split("\n").filter((line) => line !== "");

    let tree: TreeItem[] = [];

    lines.map((line) => {
        const lineArr = line.split("\t");
        let [id, path] = lineArr;

        path = removeAbsoluteSubpath(path);
        const split = path.split('/');

        createNode(tree, split, id);
    });

    return tree;
}

// UTILS
export function getPathById(tree: TreeItem[], id: string, path: string) {
    const idx = tree.findIndex((node) => {
        return node.id === id
    });
    if (idx < 0) {
        for (const node of tree) {
            if (node.children) {
                if (node.label) {
                    path += "/" + node.label
                }
                
                return getPathById(node.children, id, path);
            }
        }
    } else {
        // if index found this means that the file has been found and full path can be returned
        path += "/" + tree[idx].label;
        return path;
    }
}

export function removeAbsoluteSubpath(path: string) {
    // /a/b/c/workingDirectory/d/e/f -> d/e/f
    const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    return path.replace(workspacePath + "/", '');
}