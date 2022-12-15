import { IS_WINDOWS, RUNTIME } from "./deps.ts";

let currentDirectory = "";
const envMap : { [key: string]: string | undefined } = {};
const keyMap : { [key: string]: string | undefined } = {
    "HOME": "USERPROFILE",
    "USERPROFILE": "HOME",
    "USER": "USERNAME",
    "USERNAME": "USER",
    "HOSTNAME": "COMPUTERNAME",
    "COMPUTERNAME": "HOSTNAME",  
};

function mapKey(key: string) : string  {
    if(keyMap[key]) {
        return keyMap[key] as string;
    }

    return key;
}

let getEnvProvider : (key: string) => string | undefined;
let setEnvProvider : (key: string, value: string) => void;
let deleteEnvProvider : (key: string) => void;
let toObjectEnvProvider : () => { [key: string]: string  };

let cwdProvider : () => string | void = () =>  {
    return currentDirectory;
}

let chdirProvider : (directory: string | URL) => void = (directory: string | URL) => {
    currentDirectory = directory.toString();
}

let exitProvider : (code?: number) => void = _ => {};

let pidProvider : () => number = () => { return 0; }

let uidProvider : () => number | null = () => {
    return null;
}

let gidProvider : () => number | null = () => {
    return null;
}

function trimTrailingSlashes(path: string) {
    let end =  0;
    for(let i = path.length - 1; i > 0; i--) {
        const k = path[i];
        if(k !== '/' && k !== '\\') {
            break;
        }
        end++;
    }

    if(end > 0) {
        return  path.substring(0, path.length - end);
    }

    return path;
}



switch(RUNTIME) {
    case 'deno':
        getEnvProvider = (key: string) => Deno.env.get(mapKey(key));
        setEnvProvider = (key: string, value: string) => Deno.env.set(key, value);
        deleteEnvProvider = (key: string) => Deno.env.delete(key);
        toObjectEnvProvider = () => Deno.env.toObject();
        pidProvider = () => Deno.pid;
        uidProvider = () => Deno.uid();
        gidProvider = () => Deno.gid();
        cwdProvider = () => Deno.cwd();
        chdirProvider = (directory: string | URL) => Deno.chdir(directory);
        exitProvider = (code?: number) => Deno.exit(code);
        break;

    case 'node':
    case 'bun':
        // @ts-ignore process is available in node
        getEnvProvider = (key: string) => process.env[mapKey(key)];
        
        // @ts-ignore process is available in node
        setEnvProvider = (key: string, value: string) => process.env[key] = value;

        // @ts-ignore process is available in node
        deleteEnvProvider = (key: string) => delete process.env[key];

        // @ts-ignore process is available in node
        toObjectEnvProvider = () => {
            const obj : { [key: string]: string } = {};
            for(const key in envMap) {
                obj[key] = envMap[key] as string;
            }
            return obj;
        };

        // @ts-ignore process is available in node
        pidProvider = (): number  => process.pid;

        // @ts-ignore process is available in node
        gidProvider = (): number | null => process.getgid();

        // @ts-ignore process is available in node
        uidProvider = () : number | null => process.getuid();

        cwdProvider = (): string => {
            // @ts-ignore process is available in node
            return process.cwd();
        }

        chdirProvider = (directory: string | URL) => {
            // @ts-ignore process is available in node
            process.chdir(directory);
        }

        exitProvider = (code?: number) => {
            // @ts-ignore process is available in node
            process.exit(code);
        }
        break;
    
    default: 
        getEnvProvider = (key: string) => envMap[mapKey(key)];
        setEnvProvider = (key: string, value: string) => envMap[key] = value;
        deleteEnvProvider = (key: string) => delete envMap[key];
        toObjectEnvProvider = () => {
            const obj : { [key: string]: string } = {};
            for(const key in envMap) {
                obj[key] = envMap[key] as string;
            }
            return obj;
        }

        exitProvider = _ => {
            self.window.close();
        }
        break;
}

export const chdir = chdirProvider;

export const cwd = cwdProvider;

export const exit = exitProvider;

export const getEnv = getEnvProvider;

export const setEnv = setEnvProvider;

export const deleteEnv = deleteEnvProvider;

export const getEnvObject = toObjectEnvProvider;

export function expandEnv(template: string, throwOnError = false) : string {
    template = template.replace(/%([^%]+)%/gi, function (_, variableName) {
        const value = getEnv(variableName);
        if (!value && throwOnError) {
            throw new Error(`Variable ${variableName} not found`);
        }

        return value || '';
    });

    template = template.replace(
        /\$\{([^\}]+)\}/g,
        function (_, variableName: string) {

            if(variableName.includes(":-")) {
                const parts = variableName.split(":-");
                const value = getEnv(parts[0]);
                if(value) {
                    return value;
                }

                return parts[1];
            }

            const value2 = getEnv(variableName);
            if (throwOnError && !value2) {
                throw new Error(`Variable ${variableName} not found`);
            }

            return value2 || '';
        },
    );

    // linux environment variable style expansion $variable
    template = template.replace(
        /\$([A-Za-z0-9]+)/g,
        function (_, variableName) {
            const value = getEnv(variableName);
            if (!value && throwOnError) {
                throw new Error(`Variable ${variableName} not found`);
            }

            return value || '';
        },
    );

    return template;
}

export const pid = pidProvider;

export const uid = uidProvider;

export const gid = gidProvider;


export const DEV_NULL = IS_WINDOWS ? "\\\\.\\nul" : "/dev/null";


export function tmpDir() {
    const tempDir = getEnvProvider('TEMP') || getEnvProvider('TMP') || getEnvProvider('TMPDIR');

    if (!tempDir) {
        if(IS_WINDOWS) {
           const base = getEnvProvider('SYSTEMROOT') || getEnvProvider('WINDIR');
           if (base) {
               return `${base}\\temp`;
           }
        } else {

            return '/tmp';
        }

        return null;
    }

    return trimTrailingSlashes(tempDir);
}

export function username() : string {
    const user = getEnv("USER");
    if(!user) {
        throw new Error("Unable to resolve the username.")
    }

    return user;
}

export function hostname() : string {
    const host = getEnv("HOST");
    if(!host) {
        throw new Error("Unable to resolve the hostname.")
    }

    return host;
}

export function optDir() : string {
    if (IS_WINDOWS) {
        return getEnvProvider("Program Files") || "C:\\Program Files";
    }

    return  "/opt";
}

export function homeDir() {
    const homeDir = getEnvProvider('HOME');
    if (!homeDir) {
        if (IS_WINDOWS) {
            const drive = getEnvProvider('SYSTEMDRIVE') || 'C:';
            return `${drive}\\Users\\${username()}`
        } else {
            return '/home/' + username();
        }
    }

    return trimTrailingSlashes(homeDir);
}

export function homeConfigDir() {
    if (IS_WINDOWS) {
        return getEnvProvider("APPDATA") ?? `${homeDir()}\\AppData\\Roaming`;
    }

    return `${homeDir()}/.config`;
}

export function homeCacheDir() : string {
    if (IS_WINDOWS) {
        return getEnvProvider("LOCALAPPDATA") ?? `${homeDir()}\\AppData\\Local`;
    }

    return `${homeDir()}/.cache`;
}

export function endianness(): "BE" | "LE" {
    // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#Endianness
    const buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
    // Int16Array uses the platform's endianness.
    return new Int16Array(buffer)[0] === 256 ? "LE" : "BE";
}

export const EOL = IS_WINDOWS ? "\r\n" : "\n";