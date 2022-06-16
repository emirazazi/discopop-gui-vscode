import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigProvider } from "../../ConfigProvider";
import { exec } from 'child_process';
import { TaskExecuter } from "./TaskExecuter";
import { StateManager } from '../StateManager';
import mkdirp = require('mkdirp');

export class CUGen extends TaskExecuter {

    constructor (context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone);
    }

    async executeDefault(options?: any | undefined): Promise<any> {

        return await Promise.all(this.files.map(async (file: any) => {
            const fileId = file.id
            
            const options = {
                cwd: `${this.context.storageUri?.path}/results/${fileId}`
            }

            await mkdirp(options.cwd)

            const executeString = `${ConfigProvider.clangPath} -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${ConfigProvider.buildPath}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ../../FileMapping.txt -c ${file.path}`;

            // todo: exec appends CUs to an existing Data.xml... make sure that Data.xml is clear before running
            // check if fileKey can be written too
            
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

                    // if (fileId) {
                    //     // this shit leads to complete restart of discopop when reopening app
                    //     FileManager.getFile(fileId)?.updateDataXML(xmlString);
                    //     // this is also COMPLETE garbage. Literally at every CUGen every fucking file is saved inside a config file
                    //     // just use statemanager here to save the result???
                    //     FileManager.writeToConfigFile();
                    // }
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