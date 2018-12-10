import { parse } from 'babylon';
import { existsSync } from 'fs'
import { chain } from 'lodash';
import { tryRequire } from '../utils';

const typescript = tryRequire('typescript');

export default function parseTypescript(content, filePath) {
  if (!typescript) {
    return [];
  }

  const tsconfigPath = chain(filePath)
    .split('/')
    .drop()
    .dropRight()
    .map((directory, i) =>
      chain(filePath)
        .split('/')
        .dropRight()
        .dropRight(i)
        .join('/')
        .value()
    )
    .map(path => `${ path }/tsconfig${ /\.tsx$/.test(filePath) ? '-web' : '' }.json`)
    .find(existsSync)
    .value()

  if (!tsconfigPath)
    throw new Error(`No tsconfig.json file found for ${ filePath }`)

  const tsconfig = require(tsconfigPath)

  const result = typescript.transpile(
    content,
    tsconfig.compileOptions,
    filePath);

  // TODO avoid parse source file twice, use Typescript native traverser to find out dependencies.
  // Reference: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#traversing-the-ast-with-a-little-linter
  return parse(result, {
    sourceType: 'module',
  });
}
