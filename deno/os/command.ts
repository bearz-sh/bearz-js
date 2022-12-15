import { IS_DENO, IS_NODELIKE, IS_BUN, spawn, spawnSync, Buffer } from "./deps.ts";

export type StandardStream = 'inherit' | 'piped' | 'null';

interface IProcessOptions {
    args?: string[];
    cwd?: string;
    env?: { [key: string]: string };
    stdin?: StandardStream;
    stdout?: StandardStream;
    stderr?: StandardStream;
    uid?: number;
    gid?: number;
}


export type Signal = | "SIGABRT"
| "SIGALRM"
| "SIGBREAK"
| "SIGBUS"
| "SIGCHLD"
| "SIGCONT"
| "SIGEMT"
| "SIGFPE"
| "SIGHUP"
| "SIGILL"
| "SIGINFO"
| "SIGINT"
| "SIGIO"
| "SIGKILL"
| "SIGPIPE"
| "SIGPROF"
| "SIGPWR"
| "SIGQUIT"
| "SIGSEGV"
| "SIGSTKFLT"
| "SIGSTOP"
| "SIGSYS"
| "SIGTERM"
| "SIGTRAP"
| "SIGTSTP"
| "SIGTTIN"
| "SIGTTOU"
| "SIGURG"
| "SIGUSR1"
| "SIGUSR2"
| "SIGVTALRM"
| "SIGWINCH"
| "SIGXCPU"
| "SIGXFSZ"

interface IProcessStartOptions extends IProcessOptions {
    fileName: string | URL;
}

interface ISpawnOutput extends ICommandStatus {
    stdout: Uint8Array;
    stderr: Uint8Array;
}

interface ICommandStatus {
    exitCode: number;
    signal: Signal;
}

interface ICommandOutput extends ISpawnOutput {
    fileName: string | URL;
    args?: string[];
    startedAt: Date;
    endedAt: Date;
}

interface IChildProcess {
    kill(signal?: Signal): void;
    pid : number;
    status: Promise<ICommandStatus>;
    ref() : void;
    outputAsync(): Promise<ISpawnOutput>;
    unref() : void;
    stderr: ReadableStream<Uint8Array>;
    stdout: ReadableStream<Uint8Array>;
    stdin: WritableStream<Uint8Array>;
}


export class Command {
    #options: IProcessStartOptions;
    
    constructor(fileName: string | URL, options?: IProcessOptions) {
        const o = (options || {}) as IProcessStartOptions;
        o.fileName = fileName;
        this.#options = o;
    }

    get startInfo() : IProcessStartOptions {
        return this.#options;
    }

    outputAsync() : Promise<ICommandOutput> {
        throw new Error("Not implemented")
    }

    output() : ICommandOutput {
        throw new Error("Not implemented")
    }

    spawn() : IChildProcess {
        throw new Error("Not implemented");
    }

}


if(IS_DENO) {
    Command.prototype.output = function() {
        const { fileName, args, cwd, env, stdin, stdout, stderr, uid, gid } = this.startInfo;
        const start = new Date();
        const p = new Deno.Command(fileName, {
            args,
            cwd,
            env,
            stdin: stdin || 'inherit',
            stdout: stdout || 'inherit',
            stderr: stderr || 'inherit',
            uid,
            gid
        });

        const o = p.outputSync();
        const end = new Date();
        return {
            fileName: fileName,
            args: args,
            startedAt: start,
            endedAt: end,
            exitCode: o.code,
            signal: o.signal,
            stdout: stdin === 'piped' ? o.stdout : new Uint8Array(),
            stderr: stderr === 'piped' ? o.stderr : new Uint8Array(),
        } as ICommandOutput;
    };

    Command.prototype.outputAsync = async function() {
        const { fileName, args, cwd, env, stdin, stdout, stderr, uid, gid } = this.startInfo;
        const start = new Date();
        const p = new Deno.Command(fileName, {
            args,
            cwd,
            env,
            stdin: stdin || 'inherit',
            stdout: stdout || 'inherit',
            stderr: stderr || 'inherit',
            uid,
            gid
        });

        const o = await p.output();
        const end = new Date();
        return {
            fileName: fileName,
            args: args,
            startedAt: start,
            endedAt: end,
            exitCode: o.code,
            signal: o.signal,
            stdout: stdin === 'piped' ? o.stdout : new Uint8Array(),
            stderr: stderr === 'piped' ? o.stderr : new Uint8Array(),
        } as ICommandOutput;
    }

    Command.prototype.spawn = function() {
        const { fileName, args, cwd, env, stdin, stdout, stderr, uid, gid } = this.startInfo;
        const p = new Deno.Command(fileName, {
            args,
            cwd,
            env,
            stdin: stdin || 'inherit',
            stdout: stdout || 'inherit',
            stderr: stderr || 'inherit',
            uid,
            gid
        });
    
        return p.spawn() as unknown as IChildProcess;
    }
} else if (IS_NODELIKE) {

    type NodeStandardStream = "pipe" | "ignore" | "inherit" | number | null | undefined;

    // deno-lint-ignore no-inner-declarations
    function convert(stream: StandardStream | undefined) {
        switch(stream) {
            case 'piped': return 'pipe';
            case "null": return 'ignore';
            case "inherit": return 'inherit';
            default: return undefined;
        }
    }

    // deno-lint-ignore no-inner-declarations
    function converToBuffer(stream: string | Buffer | null | undefined) {
        if(stream === null || stream === undefined) {
            return new Uint8Array();
        }
        if(typeof stream === 'string') {
            return new TextEncoder().encode(stream);
        }
        return stream as Uint8Array;
    }
    

    Command.prototype.output = function() {
        const { fileName, args, cwd, env, stdin, stdout, stderr, uid, gid } = this.startInfo;
        const start = new Date();

        const o = spawnSync(fileName.toString(), args, {
            cwd,
            gid,
            env,
            stdio: [convert(stdin), convert(stdout), convert(stderr)],
            uid,   
        })

        const end = new Date();
        return {
            fileName: fileName,
            args: args,
            startedAt: start,
            endedAt: end,
            exitCode: o.status || 1,
            signal: o.signal,
            stdout: converToBuffer(o.stdout),
            stderr: converToBuffer(o.stderr),
        } as ICommandOutput;
    };

    
    Command.prototype.outputAsync = async function() {
        const { fileName, args, cwd, env, stdin, stdout, stderr, uid, gid } = this.startInfo;
        const start = new Date();

        const o = spawn(fileName.toString(), args ?? [], {
            cwd,
            gid,
            env,
            stdio: [convert(stdin), convert(stdout), convert(stderr)],
            uid,   
        });

        const closeTask = new Promise<ICommandStatus>((resolve) => {
            o.on('close', (code : number | undefined, signal) => {
                const exitCode = code || 1;
                resolve({exitCode, signal});      
            });  
        });
        
        const stdoutTask = new Promise((resolve) => {
           
            let set = new Uint8Array();

            if(o.stdout) {
                
                o.stdout.on('data', (data) => {
                    // @ts-ignore may not exist
                    set = new Uint8Array([...set, ...data]);
                });
                o.stdout.on('end', () => {
                    resolve(set);
                })
            } else {
                resolve(set);
            }
        });

        const stderrTask = new Promise((resolve) => {
            let set = new Uint8Array();
            if(o.stderr) {
                
                o.stderr.on('data', (data) => {
                    set = new Uint8Array([...set, ...data]);
                });
                o.stderr.on('end', () => {
                    resolve(set);
                })
            } else {
                resolve(set);
            }
        });
        
        const [close, out, error] = await Promise.all([closeTask, stdoutTask, stderrTask]);
        
        const end = new Date();
        return {
            fileName: fileName,
            args: args,
            startedAt: start,
            endedAt: end,
            exitCode: close.exitCode,
            signal: close.signal,
            stdout: out,
            stderr: error,
        } as ICommandOutput;
    }

    Command.prototype.spawn = function() {

        const { fileName, args, cwd, env, stdin, stdout, stderr, uid, gid } = this.startInfo;
        const o = spawn(fileName.toString(), args ?? [], {
            cwd,
            gid,
            env,
            stdio: [convert(stdin), convert(stdout), convert(stderr)],
            uid,   
        });

        const stdStream = new ReadableStream<Uint8Array>({
            start: (controller) => {
                if(o.stdout) {
                    o.stdout.on('data', (data) => {
                        if (IS_BUN) {
                            // bun uses Uint8Array for data
                            controller.enqueue(data);
                        } else {
                            controller.enqueue(new Uint8Array(data.buffer));
                        }
                    });
    
                    o.stdout.on('end', () => {
                        controller.close();
                    });
                } else {
                    controller.close();
                }
            }
        });

        const stderrStream = new ReadableStream<Uint8Array>({
            start: (controller) => {
                if(o.stderr) {
                    o.stderr.on('data', (data) => {
                        if (IS_BUN) {
                            controller.enqueue(data);
                        } else {
                            controller.enqueue(new Uint8Array(data.buffer));
                        }
                    });
    
                    o.stderr.on('end', () => {
                        controller.close();
                    });
                } else {
                    controller.close();
                }
            }
        });

        const stdinStream = new WritableStream<Uint8Array>({
            write: (chunk) => {
                if(o.stdin) {
                    o?.stdin.write(new TextDecoder().decode(chunk));
                }
            },
               

            close: () => {
                if(o.stdin) {
                    o.stdin.end();
                }
            },

            abort: _ => {
                if(o.stdin) {
                    o.stdin.end();
                }
            }
        });


        const childProcess : IChildProcess ={
            status: new Promise<ICommandStatus>((resolve) => {
               o.on('close', (code, signal ) => {
                     resolve({
                          exitCode: code || 1,
                          signal: signal
                     });
               });
            }),
            stdout: stdStream,
            stderr: stderrStream,
            stdin: stdinStream,
            pid: o.pid,
            kill: (signal) => {
                o.kill(signal);
            },
            ref: () => o.ref(),
            unref: () => o.unref(),
            outputAsync: () => {
                return Promise.reject(new Error("Not implemented"));
            }
        }

        return childProcess;
    }
}
