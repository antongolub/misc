import {readPackageUp} from 'read-pkg-up'

export const pkg = async (cwd?: string) => (await readPackageUp({cwd}))?.packageJson
