export type Engine = 'v8' | 'spidermonkey' | 'jsc' | 'chromium' | 'rhino' | 'unknown';
export type Runtime = 'deno' | 'node' | 'bun' | 'browser' | 'electron' | 'unknown';

export type OsFamily =
    | 'unix'
    | 'linux'
    | 'darwin'
    | 'windows'
    | 'sunos'
    | 'freebsd'
    | 'openbsd'
    | 'netbsd'
    | 'aix'
    | 'unknown';
export type RuntimeArch =
    | 'arm'
    | 'arm64'
    | 'ia32'
    | 'mips'
    | 'mipsel'
    | 'ppc'
    | 'ppc64'
    | 's390'
    | 's390x'
    | 'x64'
    | 'x86_64'
    | 'x86'
    | 'aarch'
    | 'aarch64'
    | 'unknown';