import * as vscode from 'vscode';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import mkdirp = require('mkdirp');

export class RedOp extends TaskExecuter {

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

            const command1 = `${ConfigProvider.clangPath} -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${ConfigProvider.buildPath}/libi/LLVMDPReduction.so -mllvm -fm-path -mllvm ../../FileMapping.txt -o ${file.name}_red.bc ${file.path}`;

            exec(command1,  options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }

                const command2 = `${ConfigProvider.clangPath} ${file.name}_red.bc -o ${file.name}_dp_run_red -L${ConfigProvider.buildPath}/rtlib -lDiscoPoP_RT -lpthread`;
                exec(command2, options, (err) => {
                    if (err) {
                        console.log(`error: ${err.message}`);
                        return;
                    }

                    const command3 = `./${file.name}_dp_run_red`;
                    exec(command3, options, (err) => {
                        if (err) {
                            console.log(`error: ${err.message}`);
                            return;
                        }
                        vscode.window.showInformationMessage("RedOp done for file: " + file.name)
                        if (this.onDone) {
                            this.onDone.call(null, 2);
                        }
                    });
                });
            });
        }));
    }

    executeMakefile() {

    }
}