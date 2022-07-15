import { StateManager } from "./StateManager"
import * as vscode from "vscode";
import { StorageManager } from "./StorageManager";


interface IReduction {
    fileId: number,
    line: number,
    startLine: number,
    endLine: number,
    pragma: string, // maybe this will turn to enum strings or some form of mapping
    priv: string[],
    shared: string[],
    firstPrivate: string[],
    reduction: string[],
    lastPrivate: string[]
}

interface IDoAll {
    fileId: number,
    line: number,
    startLine: number,
    endLine: number,
    iterations: number,
    instructions: number,
    workload: number,
    pragma: string,
    priv: [],
    shared: [],
    firstPrivate: [],
    reduction: [],
    lastPrivate: []
}

export default class DiscoPoPParser {

    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    parseResultString = async () => {
        // parse discoPoP result from state manager and apply it to eisting treeView
        // the application to the treeview would consist to adding items type result
        // retrieve id from the result file and with this id get the childbyid TreeUtils.getChildBId()
        /* const stateManager = new StateManager(this.context);
    
        const resultString = stateManager.read('explorerResult') */

        const storageManager = new StorageManager(this.context, true);

        const resultString = await storageManager.readFile("ranked_patterns.txt", true) as any;

        const lines = resultString.split("\n");

        const reductionRegex = new RegExp('Reduction at')

        await Promise.all(lines.map(async (element, index, arr) => {
            if (reductionRegex.test(element.toString())) {
                this.parseReduction(arr, index);
            }
        })
        )
    }

    private parseDoAll = (lines: [], index: number) => {

    }

    private parseArrayFromLine = (line, arrayStartIndex): Array<string> => {
        console.log(line.substr(arrayStartIndex - 1, line.length - arrayStartIndex + 1))
        // todo fix this
        return line.substr(arrayStartIndex - 1, line.length - arrayStartIndex + 1);
    }

    private parseReduction = (lines: any, index) => {
        const firstLine = lines[index].split(":");

        const fileId = parseInt(firstLine[firstLine.length - 2].substr(1));

        const line = parseInt(firstLine[firstLine.length - 1]);

        const startLine = parseInt(lines[index + 1].split(":")[firstLine.length - 1]);

        const endLine = parseInt(lines[index + 2].split(":")[firstLine.length - 1]);

        const pragma = lines[index + 3];

        const priv = this.parseArrayFromLine(lines[index + 4], 8);

        const shared = this.parseArrayFromLine(lines[index + 5], 9);

        const firstPrivate = this.parseArrayFromLine(lines[index + 6], 16);

        const reduction = this.parseArrayFromLine(lines[index + 7], 12);

        const lastPrivate = this.parseArrayFromLine(lines[index + 8], 15);

        const reductionResult: IReduction = {
            fileId,
            line,
            startLine,
            endLine,
            pragma,
            priv,
            shared,
            firstPrivate,
            reduction,
            lastPrivate
        }

        console.log(reductionResult)
    }

    private parseGeometricDecomposition = (lines: []) => {

    }

    /* private parseTaskParallelism = (lines: []) => {

    }

    private parsePipeline = (lines: []) => {

    } */
}