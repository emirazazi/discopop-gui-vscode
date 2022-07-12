import * as vscode from 'vscode';
import * as fs from 'fs';
import { Config } from "../Config";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import { StateManager } from '../misc/StateManager';
import mkdirp = require('mkdirp');
import Utils from '../Utils';
import { TreeItem } from '../Provider/TreeDataProvider';

export class CUGen extends TaskExecuter {

    constructor(context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    clearDataXml(path): void {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
    }

    async executeDefault(): Promise<any> {

        const options = {
            cwd: Utils.hiddenStorage(this.context)
        }

        await mkdirp(options.cwd)

        this.clearDataXml(`${options.cwd}/Data.xml`)

        const starterPromise = Promise.resolve(null);
        await this.files.reduce(
            (p, file) => p.then(() => this.runTask(file, options).then()),
            starterPromise
        );

        if (fs.existsSync(`${options.cwd}/Data.xml`)) {
            vscode.window.showInformationMessage("CUGen done for all files.")
        }


        /* if (fs.existsSync(`${options.cwd}/Data.xml`)) {
            const xmlString = fs.readFileSync(`${options.cwd}/Data.xml`).toString();

            const stateManager = new StateManager(this.context);
            stateManager.save('dataxmlstring', xmlString);

            vscode.window.showInformationMessage("CUGen done for all files.")
        } */
    }

    async runTask(file, options) {
        if (file.path.endsWith('.h')) {
            return
        }

        const executeString = `${Config.clang} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${Config.discopopBuild}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ./FileMapping.txt -o dp_cu_${file.name}.ll -c ${file.path}`;

        await new Promise<void>((resolve) => {
            exec(executeString, options, (err, stdout, stderr) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                resolve()
            })
        })
    }


    executeMakefile() {
        throw new Error('Method not implemented.');
    }
}