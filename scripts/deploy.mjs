// Bouwt de app en zet dist/ op de branch gh-pages van origin.
import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const git = process.env.GIT ?? 'git'
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: cmd === 'npm' })
const lees = (args) => execFileSync(git, args, { encoding: 'utf8' }).trim()

const remote = lees(['remote', 'get-url', 'origin'])
const versie = lees(['rev-parse', '--short', 'HEAD'])

run('npm', ['run', 'build'])
writeFileSync(join('dist', '.nojekyll'), '')

rmSync(join('dist', '.git'), { recursive: true, force: true })
const id = ['-c', 'user.name=ronaldsteenkamp', '-c', 'user.email=336406225+ronaldsteenkamp@users.noreply.github.com']
run(git, ['init', '-q', '-b', 'gh-pages'], 'dist')
run(git, ['add', '-A'], 'dist')
run(git, [...id, 'commit', '-q', '-m', `Publiceer ${versie}`], 'dist')
run(git, ['push', '-f', remote, 'gh-pages'], 'dist')
rmSync(join('dist', '.git'), { recursive: true, force: true })
console.log(`Gepubliceerd: ${versie}`)
