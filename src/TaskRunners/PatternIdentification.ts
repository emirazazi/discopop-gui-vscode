import * as vscode from 'vscode';
import { Config } from "../Config";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import mkdirp = require('mkdirp');
import Utils from '../Utils';

export class PatternIdentification extends TaskExecuter {

    constructor(context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    async executeDefault(): Promise<any> {

        return await Promise.all(this.files.map(async (file, index) => {
            const fileId = file.id

            const options = {
                cwd: Utils.hiddenStorage(this.context)
            }

            await mkdirp(options.cwd)

            // todo prepare analyzer 
            // mv $HOME_DIR/discopop/$bin_dir/dp_run_dep.txt $HOME_DIR/discopop/
            // mv $HOME_DIR/FileMapping.txt $HOME_DIR/discopop/
            const command1 = `python3 -m discopop_explorer --path=${options.cwd} --dep-file=${file.name + '_dp_run'}_dep.txt --fmap=${Utils.hiddenStorage(this.context)}/FileMapping.txt --json ${file.path}/patterns.json`;

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