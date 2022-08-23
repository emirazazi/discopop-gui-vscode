import * as vscode from 'vscode'
import * as fs from 'fs'
import { Config } from '../Config'
import { exec } from 'child_process'
import { TaskExecuter } from './TaskExecuter'
import mkdirp = require('mkdirp')
import Utils from '../Utils'
import { TreeItem } from '../Provider/TreeDataProvider'
import { window } from 'vscode'
import { StateManager } from '../misc/StateManager'

export class DepProfiling extends TaskExecuter {
    constructor(context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone)
    }

    getOptions() {
        const options = {
            cwd: Utils.getCWD(this.context),
        }
        return options
    }

    // (Command 2: Instrumenting memory access instructions in a input file)
    async executeDefault(): Promise<void> {
        const options = this.getOptions()

        await mkdirp(options.cwd)

        const starterPromise = Promise.resolve(null)
        await this.files.reduce(
            (p, file) => p.then(() => this.runTask(file, options).then()),
            starterPromise
        )
    }

    async runTask(file, options) {
        if (file.path.endsWith('.h')) {
            return
        }

        // $CLANG -g -O0 -S -emit-llvm -fno-discard-value-names \
        // -Xclang -load -Xclang ${DISCOPOP_BUILD}/libi/LLVMDPInstrumentation.so \
        // -mllvm -fm-path -mllvm ./FileMapping.txt \
        // -I $include_dir -o${src_file}_dp.ll $src_file
        const command2 = `${Config.clang} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${Config.discopopBuild}/libi/LLVMDPInstrumentation.so -mllvm -fm-path -mllvm ./FileMapping.txt -o dp_inst_${file.name}.ll -c ${file.path}`

        console.log('Instrumenting DepProf...')
        console.log(command2)

        await new Promise<void>((resolve, reject) => {
            exec(command2, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    vscode.window.showErrorMessage(
                        `Dependency Profiling failed with error message ${err.message}`
                    )
                    reject()
                    return
                }
                console.log('Instrumenting DepProf done!')
                resolve()
                return
            })
        })
    }

    // (Command 3: Linking instrumented code with DiscoPoP runtime libraries)
    async executeLinking(): Promise<void> {
        const options = this.getOptions()

        const llPaths = this.files.reduce((prev, curr) => {
            if (curr.path.endsWith('.h')) {
                return prev
            }
            if (curr.id && curr.name) {
                const fileName = `dp_inst_${curr.name}.ll`
                if (fs.existsSync(`${options.cwd}/${fileName}`)) {
                    const path = `${fileName}`
                    return (prev += ' ' + path)
                }
            }
            return prev
        }, '')
        await new Promise<void>((resolve, reject) => {
            console.log('Linking DepProf...')

            // $CLANG++ ${src_file}_dp.ll -o dp_run -L${DISCOPOP_BUILD}/rtlib -lDiscoPoP_RT -lpthread
            const command3 = `${Config.clangPP}${llPaths} -o dp_run -L${Config.discopopBuild}/rtlib -lDiscoPoP_RT -lpthread`
            console.log(command3)

            exec(command3, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    vscode.window.showErrorMessage(
                        `Dependency Profiling failed with error message ${err.message}`
                    )
                    reject()
                    return
                }
                console.log('Linking done!')
                resolve()
                return
            })
        })
    }

    // (Command 4: Executing the program to obtain data dependences)
    async executeDpRun(): Promise<void> {
        await new Promise<void>(async (resolve, reject) => {
            console.log('Profiling...')
            const options = this.getOptions()

            const clArgs = await Utils.handleClArgs(this.context)

            let command4 = `./dp_run`
            console.log(command4)

            if (clArgs?.length) {
                command4 += ' ' + clArgs
            }

            exec(command4, options, (err) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    vscode.window.showErrorMessage(
                        `Dependency Profiling failed with error message ${err.message}`
                    )
                    reject()
                    return
                }
                console.log('Profiler done!')
                vscode.window.showInformationMessage('Profiler done!')
                resolve()
            })
        })
    }

    executeMakefile() {}
}
