import path = require('path');
import * as vscode from 'vscode';
import { TreeItemCollapsibleState } from 'vscode';
import { Config } from '../Config';
import { ItemType, TreeItem } from '../Provider/TreeDataProvider';

function createNode(tree: TreeItem[], filePath: string[], id: string) {
    let label = filePath.shift();
    const idx = tree.findIndex((node) => {
        return node.label === label;
    });

    if(idx < 0) {
        // todo handle root workspace. Meaning put all root elements in one node
        const isFile = filePath.length === 0;
        tree.push({
            active: false,
            label: label,
            children: [],
            // 0 no children
            // 1 collapsed
            // 2 expanded
            // give 0 on init and if we have results for a file set to either 1 or 2
            collapsibleState: isFile ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Expanded,
            id: isFile ? id : undefined,
            isFile: isFile,
            contextValue: isFile ? ItemType.File : ItemType.Folder,
            name: isFile ? getFileName(label) : undefined
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

export default function parseMappingToTree(fileMapping: string): TreeItem {
    const lines = fileMapping.split("\n").filter((line) => line !== "");

    let tree: TreeItem[] = [];

    lines.map((line) => {
        const lineArr = line.split("\t");
        let [id, path] = lineArr;

        path = removeAbsoluteSubpath(path);
        const split = path.split('/');

        createNode(tree, split, id);
    });


    let root = new TreeItem(Config.getRootLabel(), tree);
    root.collapsibleState = TreeItemCollapsibleState.Expanded;
    root.contextValue = ItemType.Folder;

    return root;
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
    const workspacePath = Config.getWorkspacePath();
    return path.replace(workspacePath + "/", '');
}