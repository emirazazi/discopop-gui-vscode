import { StateManager } from "./StateManager"
import * as vscode from "vscode";
import { StorageManager } from "./StorageManager";
import { ItemType } from "../ItemType";
import { ResultType } from "../ResultType";


interface IBaseResult {
    resultType: ResultType,
    fileId: number
}

interface IReduction extends IBaseResult {
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

interface IDoAll extends IBaseResult {
    line: number,
    startLine: number,
    endLine: number,
    iterations: number,
    instructions: number,
    workload: number,
    pragma: string,
    priv: string[],
    shared: string[],
    firstPrivate: string[],
    reduction: string[],
    lastPrivate: string[]
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

        const doAllRegex = new RegExp('Do-all at')

        await Promise.all(lines.map(async (element, index, arr) => {
            if (reductionRegex.test(element.toString())) {
                this.parseReduction(arr, index);
            }

            /* if (doAllRegex.test(element.toString())) {
                this.parseDoAll(arr, index);
            } */

            return
        })
        )
    }

    private parseDoAll = (lines, index: number) => {
        const firstLine = lines[index].split(":");

        const fileId = parseInt(firstLine[firstLine.length - 2].substr(1));

        const line = parseInt(firstLine[firstLine.length - 1]);

        const startLine = parseInt(lines[index + 1].split(":")[firstLine.length - 1]);

        const endLine = parseInt(lines[index + 2].split(":")[firstLine.length - 1]);

        const numberPattern = /\d+/g;

        const iterations = parseInt(lines[index + 3].match(numberPattern)[0]);

        const instructions = parseInt(lines[index + 4].match(numberPattern)[0]);

        const workload = parseInt(lines[index + 5].match(numberPattern)[0]);

        // todo handle pragma
        const pragma = this.parseDoAllPragma(lines[index + 6]);

        const priv = this.parseArray(lines[index + 7]);

        const shared = this.parseArray(lines[index + 8]);

        const firstPrivate = this.parseArray(lines[index + 9]);

        const reduction = this.parseArray(lines[index + 10]);

        const lastPrivate = this.parseArray(lines[index + 11]);

        const doAllResult: IDoAll = {
            resultType: ResultType.DoAll,
            fileId,
            line,
            startLine,
            endLine,
            iterations,
            instructions,
            workload,
            pragma,
            priv,
            shared,
            firstPrivate,
            reduction,
            lastPrivate
        }

        console.log(doAllResult)
    }

    private parseReduction = (lines, index) => {
        const firstLine = lines[index].split(":");

        const fileId = parseInt(firstLine[firstLine.length - 2].substr(1));

        const line = parseInt(firstLine[firstLine.length - 1]);

        const startLine = parseInt(lines[index + 1].split(":")[firstLine.length - 1]);

        const endLine = parseInt(lines[index + 2].split(":")[firstLine.length - 1]);

        const pragma = this.parseReductionPragma(lines[index + 3]);

        const priv = this.parseArray(lines[index + 4]);

        const shared = this.parseArray(lines[index + 5]);

        const firstPrivate = this.parseArray(lines[index + 6]);

        const reduction = this.parseArray(lines[index + 7]);

        const lastPrivate = this.parseArray(lines[index + 8]);

        const reductionResult: IReduction = {
            resultType: ResultType.Reduction,
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

    // !!! CAUTION !!!
    // Do-all pragma example: pragma: "#pragma omp parallel for"
    // Reduction pragma example: pragma: #pragma omp parallel for
    // why you do this to me :(?
    private parseDoAllPragma = (line): string => {
        // match for string which is inside two quotes
        const regex = new RegExp('\"[^\"]*\"', 'g')

        const match = line.match(regex);

        if (!match.length) {
            return ""
        }

        return match[0].slice(1, -1)
    }

    private parseReductionPragma = (line): string => {
        const regex = new RegExp('\#(.*)', 'g')

        const match = line.match(regex);

        if (!match.length) {
            return ""
        }

        return match[0]
    }

    private parseArray = (line): Array<string> => {
        // match for all strings which are inside two single quotes
        const regex = new RegExp('\'[^\']*\'', 'g')

        let result = []

        let match
        while (match = regex.exec(line)) {
            result.push(match[0].slice(1, -2))
        }

        return result
    }

    private parseGeometricDecomposition = (lines: []) => {

    }

    /* private parseTaskParallelism = (lines: []) => {

    }

    private parsePipeline = (lines: []) => {

    } */
}