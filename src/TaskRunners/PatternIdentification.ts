import * as vscode from 'vscode';
import { Config } from "../Config";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import mkdirp = require('mkdirp');
import Utils from '../Utils';
import { StateManager } from '../misc/StateManager';

export class PatternIdentification extends TaskExecuter {

    constructor(context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    getOptions() {
        const options = {
            cwd: Utils.hiddenStorage(this.context)
        }
        return options
    }

    async exportDPInstall(): Promise<void> {
        const command = `export DISCOPOP_INSTALL=${Config.discopopBuild}`;
        await new Promise<void>((resolve) => {
            exec(command, this.getOptions(), (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                resolve()
            });
        })
    }

    async executeDefault(): Promise<void> {

        const options = this.getOptions();

        await mkdirp(options.cwd);

        await this.exportDPInstall();

        // mv $HOME_DIR/discopop/$bin_dir/dp_run_dep.txt $HOME_DIR/discopop/
        // mv $HOME_DIR/FileMapping.txt $HOME_DIR/discopop/
        // python3 -m discopop_explorer --path=<path> --cu-xml=<cuxml> --dep-file=<depfile> --loop-counter=<loopcount> --reduction=<reduction> --generate-data-cu-inst=<outputdir>
        const command1 = `python3 -m discopop_explorer --path=${options.cwd} --cu-xml=${options.cwd}/Data.xml --dep-file=${options.cwd}/dp_run_dep.txt --reduction=${options.cwd}/reduction.txt`;

        await new Promise<void>((resolve) => {
            console.log("Starting PatternIdentification")
            console.log(options.cwd)
            exec(command1, options, (err, stdout, stderr) => {
                if (stderr) {
                    console.log(`error: ${stderr}`);
                    resolve()
                    return;
                }

                console.log("PatternIdentification Done!")

                if (stdout) {
                    const stateManager = new StateManager(this.context);
                    stateManager.save('explorerResult', stdout);
                    console.log(stdout)
                }

                vscode.window.showInformationMessage("Pattern Identification done!")

                resolve()
            });
        })
    }

    executeMakefile() {

    }
}