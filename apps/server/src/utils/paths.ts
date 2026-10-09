import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
const PACKAGE_FILE = 'package.json'
export function findPackageRoot(start: string): string {
  let dir = start
  for (;;) {
    const manifest = join(dir, PACKAGE_FILE)
    if (existsSync(manifest) && 'name' in JSON.parse(readFileSync(manifest, 'utf8'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return start
    dir = parent
  }
}
