import * as vscode from 'vscode';
import * as fs from 'fs';
import { Config } from '../Config';
import { StorageManager } from '../misc/StorageManager';

import { exec } from 'child_process';
import { Commands } from '../Commands';

// saves files to hidden vscode storage
export class FileMapper {

    context: vscode.ExtensionContext;
    onDone: Function | undefined;

    constructor(context: vscode.ExtensionContext, onDone?: Function | undefined) {
        this.context = context;
        this.onDone = onDone;
    }

    public async execute() {
        new Promise<void>((res, rej) => {
            fs.stat(Config.discopopFileMapper, (err) => {
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
        const fileMappingScriptPath = await sm.copyToStorage(Config.discopopFileMapper, 'dp-fmap');


        const options = {
            // this actually specifies folder where script saves > FileMapping.txt
            // maybe custom script which has folderPath as input?
            cwd: Config.getWorkspacePath()
        }

        // TODO avoid replacing to bash path style by using bash style in first place
        exec(fileMappingScriptPath.replace(" ", "\\ "), options, async (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage('Error creating File Mapping: ' + error);
                console.log(`error: ${error.message}`);
                return;
            }

            await sm.copyToStorage(Config.getWorkspacePath() + '/FileMapping.txt', 'FileMapping.txt');

            // todo cleanup FileMapping.txt from workspacePath

            vscode.commands.executeCommand(Commands.refreshFileMapping)

            vscode.window.showInformationMessage("File Mapping done!")
        });
    }

}