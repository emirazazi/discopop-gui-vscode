import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigProvider } from '../../ConfigProvider';
import { StorageManager } from '../../misc/StorageManager';

import {exec} from 'child_process';

// saves files to hidden vscode storage
export class FileMapper {

    context: vscode.ExtensionContext;
    onDone: Function | undefined;

    constructor (context: vscode.ExtensionContext, onDone?: Function | undefined) {
        this.context = context;
        this.onDone = onDone;
    }

    public async execute() {
        new Promise<void>((res, rej) => {
            fs.stat(ConfigProvider.fileMapperPath, (err) => {
                // ERROR DP-FMAP NOT FOUND
                if (err) {
                    console.log(`error: ${err.message}`);
                    rej();
                    return;
                }
                res();
                return;
            });
        });

        const sm = new StorageManager(this.context);
        const fileMappingScriptPath = await sm.copyToStorage(ConfigProvider.fileMapperPath, 'dp-fmap');


        const options = {
            // this actually specifies folder where script saves > FileMapping.txt
            // maybe custom script which has folderPath as input?
            cwd: ConfigProvider.getWorkspacePath()
        }

        // TODO avoid replacing to bash path style by using bash style in first place
        exec(fileMappingScriptPath.replace(" ", "\\ "), options, async (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage('Error creating File Mapping: ' + error);
                console.log(`error: ${error.message}`);
                return;
            }

            await sm.copyToStorage(ConfigProvider.getWorkspacePath() + '/FileMapping.txt', 'FileMapping.txt');

            // todo cleanup FileMapping.txt from workspacePath

            // externalize commands list in a seperate file
            vscode.commands.executeCommand('discopop.refreshFileMapping')


            if (this.onDone) {
                this.onDone.call(null, 0);
            }
        });
    }

}