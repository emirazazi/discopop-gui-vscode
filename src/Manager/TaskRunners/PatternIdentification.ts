import * as vscode from 'vscode';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import mkdirp = require('mkdirp');

export class PatternIdentification extends TaskExecuter {

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    async executeDefault(): Promise<any> {

        return await Promise.all(this.files.map(async (file, index) => {
            const fileId = file.id
            
            const options = {
                cwd: `${this.context.storageUri?.path}/results/${fileId}`
            }

            await mkdirp(options.cwd)

            const command1 = `python3 -m discopop_explorer --path=${file.path} --dep-file=${file.name + '_dp_run'}_dep.txt --fmap=${this.context.storageUri?.path}/FileMapping.txt --json ${file.path}/patterns.json`;

            exec(command1, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }

                vscode.window.showInformationMessage("PatternId done for file: " + file.name)

                if (this.onDone) {
                    this.onDone.call(null, 3);
                }

                // todo final result is ready here. Show results but do this outside of this class (source highlighting + result tree)
            });
        }));
    }

    executeMakefile() {

    }
}