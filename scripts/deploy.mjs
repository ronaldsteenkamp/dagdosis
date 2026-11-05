// Bouwt de app en zet dist/ op de openbare repo dagdosis-site. Die bevat alleen
// de gebouwde site; de broncode blijft in de privé-repo. GitHub Pages kan op een
// gratis plan niet vanuit een privé-repo publiceren.
import { execFileSync, execSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const git = process.env.GIT ?? 'git'
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' })
const lees = (args) => execFileSync(git, args, { encoding: 'utf8' }).trim()

const remote = 'https://github.com/ronaldsteenkamp/dagdosis-site.git'
const versie = lees(['rev-parse', '--short', 'HEAD'])

execSync('npm run build', { stdio: 'inherit' })
writeFileSync(join('dist', '.nojekyll'), '')

rmSync(join('dist', '.git'), { recursive: true, force: true })
const id = ['-c', 'user.name=ronaldsteenkamp', '-c', 'user.email=336406225+ronaldsteenkamp@users.noreply.github.com']
run(git, ['init', '-q', '-b', 'main'], 'dist')
run(git, ['add', '-A'], 'dist')
run(git, [...id, 'commit', '-q', '-m', `Publiceer ${versie}`], 'dist')
run(git, ['push', '-f', remote, 'main'], 'dist')
rmSync(join('dist', '.git'), { recursive: true, force: true })
console.log(`Gepubliceerd: ${versie}`)
