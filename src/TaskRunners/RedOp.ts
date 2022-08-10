import * as vscode from 'vscode'
import { Config } from '../Config'
import { exec } from 'child_process'
import { TaskExecuter } from './TaskExecuter'
import mkdirp = require('mkdirp')
import * as fs from 'fs'
import Utils from '../Utils'
import { TreeItem } from '../Provider/TreeDataProvider'

export class RedOp extends TaskExecuter {
    constructor(context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone)
    }

    getOptions() {
        const options = {
            cwd: Utils.hiddenStorage(this.context),
        }
        return options
    }

    // (Command 5: Instrumenting loops with the LLVM pass which detects reduction pattern )
    async executeDefault(): Promise<void> {
        await Promise.all(
            this.files.map(async (file: TreeItem) => {
                if (file.path.endsWith('.h')) {
                    return
                }

                const options = this.getOptions()

                await mkdirp(options.cwd)

                // $CLANG -g -O0 -S -emit-llvm -fno-discard-value-names \
                // -Xclang -load -Xclang ${DISCOPOP_BUILD}/libi/LLVMDPReduction.so \
                // -mllvm -fm-path -mllvm ./FileMapping.txt \
                // -I $include_dir -o ${src_file}_red.bc $src_file
                const command5 = `${Config.clang} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${Config.discopopBuild}/libi/LLVMDPReduction.so -mllvm -fm-path -mllvm ./FileMapping.txt -o dp_red_${file.name}.ll -c ${file.path}`

                console.log('Instrumenting RedOp...')
                await new Promise<void>((resolve, reject) => {
                    exec(command5, options, (err) => {
                        if (err) {
                            console.log(`error: ${err.message}`)
                            vscode.window.showErrorMessage(
                                `Pattern Detection failed with error message ${err.message}`
                            )
                            reject()
                            return
                        }
                        console.log('Instrumenting RedOp done!')
                        resolve()
                        return
                    })
                })
            })
        )
    }

    // (Command 6: Linking the instrumented loops with DiscoPoP runtime libraries for the reduction detection)
    async linkInstrumentedLoops(): Promise<any> {
        const options = this.getOptions()

        const llPaths = this.files.reduce((prev, curr) => {
            if (curr.path.endsWith('.h')) {
                return prev
            }
            if (curr.id && curr.name) {
                const fileName = `dp_red_${curr.name}.ll`
                if (fs.existsSync(`${options.cwd}/${fileName}`)) {
                    const path = `${fileName}`
                    return (prev += ' ' + path)
                }
            }
            return prev
        }, '')
        await new Promise<void>((resolve, reject) => {
            // $CLANG $bin_dir/${src_file}_red.bc -o dp_run_red -L${DISCOPOP_BUILD}/rtlib -lDiscoPoP_RT -lpthread
            const command6 = `${Config.clangPP}${llPaths} -o dp_run_red -L${Config.discopopBuild}/rtlib -lDiscoPoP_RT -lpthread`

            exec(command6, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    vscode.window.showErrorMessage(
                        `Pattern Detection failed with error message ${err.message}`
                    )
                    reject()
                    return
                }
                resolve()
                return
            })
        })
    }

    // ((Command 7: executing the program which is instrumented to detect reduction pattern)
    async executeDpRunRed(): Promise<void> {
        await new Promise<void>(async (resolve, reject) => {
            const options = this.getOptions()

            const clArgs = await Utils.handleClArgs(this.context)
            let command7 = `./dp_run_red`

            if (clArgs?.length) {
                command7 += ' ' + clArgs
            }

            console.log('Identfying Patterns...')

            exec(command7, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    vscode.window.showErrorMessage(
                        `Pattern Detection failed with error message ${err.message}`
                    )
                    reject()
                    return
                }
                console.log('Pattern Detection done!')
                vscode.window.showInformationMessage('Reduction done!')
                resolve()
            })
        })
    }

    executeMakefile() {}
}
