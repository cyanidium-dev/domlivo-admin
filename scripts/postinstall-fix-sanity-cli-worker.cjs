const fs = require('fs')
const path = require('path')

/**
 * Workaround for a Windows install layout where `@sanity/cli` tries to load
 * `@sanity/cli-core` worker from a nested path:
 *   node_modules/@sanity/cli/node_modules/@sanity/cli-core/...
 *
 * npm may hoist `@sanity/cli-core` to:
 *   node_modules/@sanity/cli-core/...
 *
 * If the nested path is missing but hoisted file exists, we copy the needed files.
 */

const hoistedRoot = path.join('node_modules', '@sanity', 'cli-core')
const nestedRoot = path.join('node_modules', '@sanity', 'cli', 'node_modules', '@sanity', 'cli-core')

const hoistedDir = path.join(hoistedRoot, 'dist', 'loaders', 'tsx')
const nestedDir = path.join(nestedRoot, 'dist', 'loaders', 'tsx')

const files = [
  'tsxWorkerLoader.worker.js',
  'tsxWorkerLoader.worker.js.map',
  'tsxWorkerTask.js',
  'tsxWorkerTask.js.map',
]

function exists(p) {
  try {
    fs.accessSync(p)
    return true
  } catch {
    return false
  }
}

const hoistedWorker = path.join(hoistedDir, 'tsxWorkerLoader.worker.js')
const nestedWorker = path.join(nestedDir, 'tsxWorkerLoader.worker.js')

if (!exists(hoistedWorker)) {
  // Nothing we can do.
  process.exit(0)
}

function ensureNestedCliCoreLinked() {
  // If nested cli-core is missing (common with npm hoisting), create a junction to the hoisted package.
  if (!exists(hoistedRoot)) return

  const nestedPkgJson = path.join(nestedRoot, 'package.json')
  if (exists(nestedPkgJson)) return

  const nestedParent = path.dirname(nestedRoot)
  fs.mkdirSync(nestedParent, {recursive: true})

  // If directory exists but is incomplete, remove it before linking.
  if (exists(nestedRoot)) {
    try {
      fs.rmSync(nestedRoot, {recursive: true, force: true})
    } catch {
      // ignore
    }
  }

  try {
    fs.symlinkSync(path.resolve(hoistedRoot), nestedRoot, 'junction')
    process.stdout.write(
      `[postinstall] Linked nested @sanity/cli-core -> hoisted @sanity/cli-core via junction.\n`,
    )
  } catch (e) {
    // Fallback: if we cannot link, we continue with the copy workaround below.
    process.stdout.write(`[postinstall] Warning: failed to create junction for @sanity/cli-core.\n`)
  }
}

ensureNestedCliCoreLinked()

// If still missing worker at nested path, copy just the worker files as a last resort.
if (!exists(nestedWorker)) {
  fs.mkdirSync(nestedDir, {recursive: true})
  for (const f of files) {
    const src = path.join(hoistedDir, f)
    const dst = path.join(nestedDir, f)
    if (exists(src) && !exists(dst)) {
      fs.copyFileSync(src, dst)
    }
  }
  process.stdout.write(
    `[postinstall] Fixed Sanity CLI worker path by copying from "${hoistedDir}" to "${nestedDir}".\n`,
  )
}

process.exit(0)

