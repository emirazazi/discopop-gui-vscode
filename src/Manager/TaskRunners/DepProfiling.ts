import * as vscode from 'vscode';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";

export class DepProfiling extends TaskExecuter {

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    async executeDefault(): Promise<any> {

        return await Promise.all(this.files.map(async (file, index) => {
  
            const fileId = file.id

            const options = {
                cwd: `${this.context.storageUri?.path}/results/${fileId}`
            }

            const command1 = `${ConfigProvider.clangPath} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${ConfigProvider.buildPath}/libi/LLVMDPInstrumentation.so -mllvm -fm-path -mllvm ../../FileMapping.txt -o dp_inst_${file.name}.ll ${file.path}`;

            exec(command1,  options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }

                // todo reduce linkedFile to one single file
                const command2 = `${ConfigProvider.clangPath} dp_inst_${file.name}.ll -o dp_run -L${ConfigProvider.buildPath}/rtlib -lDiscoPoP_RT -lpthread`;
                exec(command2, options, (err) => {
                    if (err) {
                        console.log(`error: ${err.message}`);
                        return;
                    }

                    // todo just execute single ./dp_run
                    const command3 = `./dp_run`;
                    exec(command3, options, (err) => {
                        if (err) {
                            console.log(`error: ${err.message}`);
                            return;
                        }
                        vscode.window.showInformationMessage("DepProf done for file: " + file.name)
                        if (this.onDone) {
                            this.onDone(null, 2);
                        }

                    });
                });
            });
        }));
    }

    executeMakefile() {

    }
}