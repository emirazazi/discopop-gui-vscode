import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import { StateManager } from '../StateManager';
import mkdirp = require('mkdirp');
import Utils from '../../Utils';
import { TreeItem } from '../../TreeDataProvider';

export class CUGen extends TaskExecuter {

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    clearDataXml(path): void {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
    }

    async executeDefault(options?: any | undefined): Promise<any> {

        return await Promise.all(this.files.map(async (file: TreeItem) => {
             // fail first all header files
            if (file.path.endsWith('.h')) {
                return
            }
            const fileId = file.id
            
            const options = {
                cwd: `${Utils.hiddenStorage(this.context)}/results/${fileId}`
            }

            await mkdirp(options.cwd)
            
            this.clearDataXml(`${options.cwd}/Data.xml`)

            const executeString = `${ConfigProvider.clang} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${ConfigProvider.discopopBuild}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ../../FileMapping.txt -o dp_cu_${file.name}.ll -c ${file.path}`;
            
            exec(executeString,  options, (err, stdout, stderr) => {
                if (err) {
                    console.log(`error: ${err.message}`);
                    return;
                }

                if (fs.existsSync(`${options.cwd}/Data.xml`)) {
                    const xmlString = fs.readFileSync(`${options.cwd}/Data.xml`).toString();
                    if (fileId) {
                        const entryName = StateManager.getXmlEntryNameForFile(fileId)

                        const stateManager = new StateManager(this.context);
                        stateManager.save(entryName, xmlString);

                        vscode.window.showInformationMessage("CUGen done for file: " + file.name)
                    }
                }

                // callback can be completly avoided... just await whole function and resolve with success
                /* if (this.onDone) {
                    this.onDone.call(null,1);
                } */
            })
        }));
    }
    

    executeMakefile() {
        throw new Error('Method not implemented.');
    }
}