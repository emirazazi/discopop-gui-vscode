import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { PathLike } from 'fs';
import * as vscode from 'vscode';
import Utils from '../Utils';

export class StorageManager {
    path: any;

    constructor(context: vscode.ExtensionContext, useWorkspace?: boolean) {
        this.path = Utils.hiddenStorage(context)
        if (useWorkspace) {
            this.path = vscode.workspace.workspaceFolders[0].uri.path
        }
    }

    readFile(fileName: string, asString?: boolean): Promise<Buffer | String> {
        return new Promise((res, rej) => {
            if (!this.path || !fs.existsSync(this.path as PathLike)) {
                rej();
                return;
            }
            if (asString) {
                res(fs.readFileSync((this.path + "/" + fileName) as PathLike, 'utf-8'));
            }

            return;
        });
    }

    writeToFile(fileName: string, object: any) {
        return new Promise((res, rej) => {
            // do I need here || !fs.existsSync(this.path as PathLike) too?
            if (!this.path) {
                rej();
                return;
            }
            const path = this.path + "/" + fileName;
            if (fs.existsSync(path)) {
                res(fs.writeFileSync(path, JSON.stringify(object), { encoding: 'utf8', flag: 'w' }));
                return;
            }

            res(mkdirp(path).then(() => {
                fs.writeFileSync(path, JSON.stringify(object), { encoding: 'utf8', flag: 'w' });
                return;
            }));

        });
    }

    // returns path of file location
    copyToStorage(from: string, destFileName: string) {
        return new Promise<string>(async (res, rej) => {
            if (!this.path
                || !fs.existsSync(from as PathLike)) {
                rej();
                return;
            }

            const destination = this.path + "/" + destFileName

            await mkdirp(this.path);

            fs.copyFile(from, destination, (err) => {
                if (err) {
                    console.log(`Error on copying file ${from} with error message: ` + err)
                    rej()
                }
                res(destination);
            });
        });
    }
}