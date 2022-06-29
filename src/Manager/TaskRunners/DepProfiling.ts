import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import { StorageManager } from '../../misc/StorageManager';

export class DepProfiling extends TaskExecuter {

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    getOptionsForFileId(fileId) {
        const options = {
            cwd: `${this.context.storageUri?.path}/results/${fileId}`
        }
        return options
    }

    /* getOptionsForLinkedFile() {
        const options = {
            cwd: `${this.context.storageUri?.path}/results`
        }
        return options
    } */

    // (Command 2: Instrumenting memory access instructions in a input file)
    async executeDefault(): Promise<any> {
        await Promise.all(this.files.map(async (file, index) => {
  
            const fileId = file.id

            const options = this.getOptionsForFileId(fileId)

            // $CLANG -g -O0 -S -emit-llvm -fno-discard-value-names \
            // -Xclang -load -Xclang ${DISCOPOP_BUILD}/libi/LLVMDPInstrumentation.so \
            // -mllvm -fm-path -mllvm ./FileMapping.txt \
            // -I $include_dir -o${src_file}_dp.ll $src_file
            const command2 = `${ConfigProvider.clangPath} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${ConfigProvider.buildPath}/libi/LLVMDPInstrumentation.so -mllvm -fm-path -mllvm ../../FileMapping.txt -o dp_inst_${file.name}.ll -c ${file.path}`;

            await exec(command2,  options, (err, stdout, stderr) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                return;
            });
        }));
    }

    // (Command 3: Linking instrumented code with DiscoPoP runtime libraries)
    async executeLinking(): Promise<any> {
        await Promise.all(this.files.map(async (file, index) => {
  
            const fileId = file.id

            const options = this.getOptionsForFileId(fileId)

            // $CLANG++ ${src_file}_dp.ll  -o dp_run -L${DISCOPOP_BUILD}/rtlib -lDiscoPoP_RT -lpthread
            const command3 = `${ConfigProvider.clangPath} ./dp_inst_${file.name}.ll -o dp_run -L${ConfigProvider.buildPath}/rtlib -lDiscoPoP_RT -lpthread`;

            await exec(command3,  options, (err, stdout, stderr) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                return;
            });
        }));
    }

    // (Command 4: Executing the program to obtain data dependences)
    async executeDpRun(): Promise<any> {
        await Promise.all(this.files.map(async (file, index) => {
  
            const fileId = file.id

            const options = this.getOptionsForFileId(fileId)

            const command4 = `sudo ./dp_run`;
            exec(command4, options, (err) => {
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

/*     async combineLinkedFiles() {
        let linkedFiles = []
        this.files.map(async (file, index) => {
  
            const fileId = file.id

            const options = this.getOptionsForFileId(fileId)

            // todo reduce linkedFile to one single file
            console.log(`does following exist? dp_inst_${file.name}.ll`)
            console.log(fs.existsSync(`${options.cwd}/dp_inst_${file.name}.ll`))

            if (fs.existsSync(`${options.cwd}/dp_inst_${file.name}.ll`)) {
                const ll = fs.readFileSync(`${options.cwd}/dp_inst_${file.name}.ll`)
                console.log(ll.length)
                linkedFiles.push(ll)
            }
        });
    
        const linkedFile = linkedFiles.join(" ")
        
        fs.writeFileSync(`${this.context.storageUri?.path}/results/linkedFile.ll`, linkedFile, {flag:'w'})
    }

    async executeLinkedFile() {
        await new Promise(async () => {
            const options = this.getOptionsForLinkedFile()
            const command2 = `${ConfigProvider.clangPath} linkedFile.ll -o dp_run -L${ConfigProvider.buildPath}/rtlib -lDiscoPoP_RT -lpthread`;
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
                        vscode.window.showInformationMessage("DepProf done!!!")
                        if (this.onDone) {
                            this.onDone(null, 2);
                        }

                    });
                });
        });
    } */

    executeMakefile() {

    }
}