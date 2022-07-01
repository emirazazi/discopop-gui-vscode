import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import mkdirp = require('mkdirp');
import Utils from '../../Utils';
import { TreeItem } from '../../TreeDataProvider';

export class DepProfiling extends TaskExecuter {

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    getOptions() {
        const options = {
            cwd: `${Utils.hiddenStorage(this.context)}/results`
        }
        return options
    }

    workInFileFolder(fileId) {
        let options = this.getOptions()
        options.cwd = options.cwd + `/${fileId}`
        return options
    }

    workInResultsFolder() {
        return this.getOptions()
    }

    // (Command 2: Instrumenting memory access instructions in a input file)
    async executeDefault(): Promise<any> {
        await Promise.all(this.files.map(async (file: TreeItem) => {
            // todo copy header files to results folder

            // fail first all header files
            if (file.path.endsWith('.h')) {
                return
            }
  
            const fileId = file.id

            const options = this.workInFileFolder(fileId)

            await mkdirp(options.cwd)

            // $CLANG -g -O0 -S -emit-llvm -fno-discard-value-names \
            // -Xclang -load -Xclang ${DISCOPOP_BUILD}/libi/LLVMDPInstrumentation.so \
            // -mllvm -fm-path -mllvm ./FileMapping.txt \
            // -I $include_dir -o${src_file}_dp.ll $src_file
            const command2 = `${ConfigProvider.clang} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${ConfigProvider.discopopBuild}/libi/LLVMDPInstrumentation.so -mllvm -fm-path -mllvm ../../FileMapping.txt -o dp_inst_${file.name}.ll -c ${file.path}`;

            await exec(command2,  options, (err) => {
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
        const options = this.workInResultsFolder()

        // todo DRY
        const llPaths = this.files.reduce(
            (prev, curr) => {
                if (curr.path.endsWith('.h')) {
                    return prev
                }
                if (curr.id && curr.name) {
                    const subpath = `${curr.id}/dp_inst_${curr.name}.ll`;
                    if(fs.existsSync(`${options.cwd}/${subpath}`)) {
                        const path = `./${subpath}`;
                        return prev += " " + path
                    }
                }
                return prev
            },
            ""
        );
        await new Promise(async () => {

            // $CLANG++ ${src_file}_dp.ll  -o dp_run -L${DISCOPOP_BUILD}/rtlib -lDiscoPoP_RT -lpthread
            const command3 = `${ConfigProvider.clangPP}${llPaths} -o dp_run -L${ConfigProvider.discopopBuild}/rtlib -lDiscoPoP_RT -lpthread`;

            await exec(command3,  options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                return;
            });
        });
    }

    // (Command 4: Executing the program to obtain data dependences)
    async executeDpRun(): Promise<any> {
        await new Promise(async () => { 
            const options = this.workInResultsFolder()

            const command4 = `./dp_run`;
            exec(command4, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }
                vscode.window.showInformationMessage("Profiler done")
                if (this.onDone) {
                    this.onDone(null, 2);
                }
            });
        })
    }

    executeMakefile() {

    }
}