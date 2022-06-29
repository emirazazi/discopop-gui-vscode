import * as vscode from 'vscode';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import mkdirp = require('mkdirp');

export class RedOp extends TaskExecuter {

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    getOptionsForFileId(fileId) {
        const options = {
            cwd: `${this.context.storageUri?.path}/results/${fileId}`
        }
        return options
    }

    // (Command 5: Instrumenting loops with the LLVM pass which detects reduction pattern )
    async executeDefault(): Promise<any> {

        return await Promise.all(this.files.map(async (file, index) => {
            const fileId = file.id

            const options = {
                cwd: `${this.context.storageUri?.path}/results/${fileId}`
            }

            await mkdirp(options.cwd)

            // $CLANG -g -O0 -S -emit-llvm -fno-discard-value-names \
            // -Xclang -load -Xclang ${DISCOPOP_BUILD}/libi/LLVMDPReduction.so \
            // -mllvm -fm-path -mllvm ./FileMapping.txt \
            // -I $include_dir -o ${src_file}_red.bc $src_file
            const command5 = `${ConfigProvider.clangPath} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${ConfigProvider.buildPath}/libi/LLVMDPReduction.so -mllvm -fm-path -mllvm ../../FileMapping.txt -o dp_red_${file.name}.ll -c ${file.path}`;

            exec(command5,  options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                return
            });
        }));
    }

    // (Command 6: Linking the instrumented loops with DiscoPoP runtime libraries for the reduction detection)
    async linkInstrumentedLoops(): Promise<any> {
        await Promise.all(this.files.map(async (file, index) => {
  
            const fileId = file.id

            const options = this.getOptionsForFileId(fileId)

            // $CLANG $bin_dir/${src_file}_red.bc -o dp_run_red -L${DISCOPOP_BUILD}/rtlib -lDiscoPoP_RT -lpthread
            const command6 = `${ConfigProvider.clangPath} ./dp_red_${file.name}.ll -o dp_run_red -L${ConfigProvider.buildPath}/rtlib -lDiscoPoP_RT -lpthread`;

            await exec(command6,  options, (err, stdout, stderr) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                return;
            });
        }));
    }

    // ((Command 7: executing the program which is instrumented to detect reduction pattern)
    async executeDpRunRed(): Promise<any> {
        await Promise.all(this.files.map(async (file, index) => {
  
            const fileId = file.id

            const options = this.getOptionsForFileId(fileId)

            const command7 = `sudo ./dp_run_red`;
            exec(command7, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                vscode.window.showInformationMessage("DepProf done for " + fileId)
                if (this.onDone) {
                    this.onDone(null, 2);
                }
            });
        }));
    }

    executeMakefile() {

    }
}