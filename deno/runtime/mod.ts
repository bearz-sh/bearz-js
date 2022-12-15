// @ts-nocheck 2304
import { OsFamily, Runtime, RuntimeArch } from "./interfaces.ts";

export type { OsFamily, Runtime, RuntimeArch };

let isDeno  = false;
let isNode = false;
let isBun = false;
let isBrower = false;
let osFamily : OsFamily = 'unknown';
let processArch : RuntimeArch = 'unknown';
let isMobile = false;
let runtime : Runtime = 'unknown';
let runtimeVersion = '';
let componentVersions : { [key: string]: string } = {};



// @ts-ignore process is available in node
if(typeof process !== 'undefined') {
    if(process.isBun) {
        isBun = true;
        runtime = 'bun';
        runtimeVersion = process.versions.bun;
    } else {
        isNode = true;
        runtime = 'node';
        runtimeVersion = process.versions.node;
    }
    componentVersions = process.versions;

    // @ts-ignore process is available in node
    if(process.platform === 'win32') {
        osFamily = 'windows';
    } else {
        osFamily = process.platform as OsFamily;
    }

    // @ts-ignore process is available in node
    processArch = process.arch as RuntimeArch;


} else if (typeof Deno !== 'undefined') {
    isDeno = true;
    osFamily = Deno.build.os as OsFamily;
    processArch = Deno.build.arch as RuntimeArch;
    runtime = 'deno';
    runtimeVersion = Deno.version.deno;
    componentVersions = Deno.version;
    
} else if (typeof self !== 'undefined' && typeof self.window !== 'undefined') {
    isBrower = true;
    runtime = 'browser';
    // deno-lint-ignore no-explicit-any
    const uaData = (self.navigator as any).userAgentData;
    
    if(uaData) {
        let platform = uaData.platform.toLowerCase(); 
        isMobile = uaData.mobile === true;
        switch (platform) {
            case 'windows':
                platform = 'windows';
                break;
            case 'macos':
                platform = 'darwin';
                break;
            case 'linux':
                platform = 'linux';
                break;
            case 'android':
                mobile = true;
                platform = 'android';
                break;
            case 'ios':
                mobile = true;
                platform = 'darwin';
                break;

            case 'unknown':
            default:
                platform = 'unknown';
                break;
        }

        osFamily = platform as OsFamily;
        await uaData.getHighEntropyValues(['bitness', 'architecture', 'fullVersionList', 'platformVersion']).then(
            (o: { bitness: string; architecture: RuntimeArch | undefined, fullVersionList: Array<{brand: string, version: string}>, platformVersion: string }) => {
                if (o.bitness === 'x64') {
                    is64bit = true;
                }
                if (o.architecture) {
                    arch = o.architecture;
                    if (is64bit) {
                        if (arch === 'arm') {
                            processArch = 'arm64';
                        } else if (arch === 'x86') {
                            processArch = 'x86_64';
                        }
                    } else {
                        processArch = arch;
                    }
                }

                o.fullVersionList.forEach(n => {
                    componentVersions[n.brand] = n.version;
                });

                runtimeVersion = o.fullVersionList.filter(o => o.brand !== 'Chromium' && !o.brand.includes('Brand'))
                    .map(o => o.version)
                    .join(' ')
                    .trim();

                componentVersions['platformVersion'] = o.platformVersion;
                componentVersions['bitness'] = o.bitness;
                componentVersions['architecture'] = o.architecture;
                componentVersions['platform'] = uaData.platform;
            },
        );
    }
}

export const OS_FAMILY = osFamily;
export const PROCESS_ARCH = processArch;
export const IS_64BIT = processArch === 'x64' || processArch === 'x86_64' || processArch === 'arm64' || processArch === 'aarch64' || processArch === 'ppc64' || processArch === 's390x';
export const IS_WINDOWS = osFamily === 'windows';
export const IS_DARWIN = osFamily === 'darwin';
export const IS_LINUX = osFamily === 'linux';
export const IS_BROWSER = isBrower;
export const IS_NODE = isNode;
export const IS_NODELIKE = isNode || isBun;
export const IS_DENO = isDeno;
export const IS_BUN = isBun;
export const IS_MOBILE = isMobile;
export const RUNTIME = runtime;
export const RUNTIME_VERSION = runtimeVersion;