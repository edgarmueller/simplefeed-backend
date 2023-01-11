import { join, Path } from '@angular-devkit/core'
import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Source,
  Tree,
  url,
} from '@angular-devkit/schematics'
import { templateRule } from '../../common/template-rule'
import { ErrorSchema } from './error.schema'

async function transformOptions(options: ErrorSchema) {
  checkName(options.name)
  checkName(options.aggregate)

  return { ...options }
}

function checkName(name: string) {
  if (!name) {
    throw new Error('Please specify a name.')
  }
  if (!name.match(/^[a-z-_]+$/)) {
    throw new Error('Invalid name. Accepted: [a-z-_]+')
  }
}

function generate(options: ErrorSchema, filesPath: Path): Source {
  return (context: SchematicContext) => {
    const source = apply(url(join(filesPath)), [
      templateRule(options),
      move(`src/modules/${options.aggregate}`),
    ])(context)
    return source
  }
}

export function main(options: ErrorSchema): Rule {
  return async (_tree: Tree, _context: SchematicContext): Promise<Rule> => {
    options = await transformOptions(options)
    return chain([mergeWith(generate(options, './files' as Path))])
  }
}
