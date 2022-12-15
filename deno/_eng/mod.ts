import { resolve, fromFileUrl, dirname, join, } from './deps.ts';

const __filename = fromFileUrl(import.meta.url);
const __dirname = dirname(__filename);

export const rootDir = resolve(join(__dirname, '..'));
export const packagesDir = resolve(join(rootDir, 'npm', 'packages'));

export function getModuleSrcDir(name: string) {
    return resolve(join(rootDir, name));
}

export function resolveModuleFile(name: string, path: string) {
    return resolve(join(rootDir, name, path ));
}

export function getModuleDestDir(name: string) {
    return resolve(join(packagesDir, name))
}

export function copyModuleLicense(name: string) {
    const src = resolve(join(rootDir, name, 'LICENSE.md'));
    const dest = resolve(join(packagesDir, name, 'LICENSE.md'));
    Deno.copyFileSync(src, dest)
}

export function copyModuleReadMe(name: string) {
    const src = resolve(join(rootDir, name, 'README.md'));
    const dest = resolve(join(packagesDir, name, 'README.md'));
    Deno.copyFileSync(src, dest)
}


export function copyModuleChangeLog(name: string) {
    const src = resolve(join(rootDir, name, 'CHANGELOG.md'));
    const dest = resolve(join(packagesDir, name, 'CHANGELOG.md'));
    Deno.copyFileSync(src, dest)
}