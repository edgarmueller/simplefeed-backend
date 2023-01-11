import {
  capitalize,
  classify,
  dasherize,
} from '@angular-devkit/core/src/utils/strings'
import * as pluralize from 'pluralize'
//import { join, Path } from '@angular-devkit/core'
import {
  apply,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  url,
  Tree,
} from '@angular-devkit/schematics'
import { AuthSchema } from './auth.schema'
import { template } from '@angular-devkit/schematics'
import { NameParser, Location } from '@nestjs/schematics'

function transformOptions(options: AuthSchema): AuthSchema {
  const target: AuthSchema = Object.assign(
    {},
    { path: options.path, name: options.name }
  )
  // target.metadata = 'imports'
  // target.type = 'module'

  const location: Location = new NameParser().parse(target)
  target.name = dasherize(location.name)
  // target.language = target.language !== undefined ? target.language : 'ts'
  //target.path = dasherize(location.path)

  //target.path = join(target.path as Path, target.name)
  console.log(target.path)
  return target
}

function collectRules(tree: Tree, options: AuthSchema): Rule[] {
  const rules: Rule[] = []

  if (!tree.exists(`libs/auth/src/lib/auth.module.ts`)) {
    rules.push(
      externalSchematic('@nrwl/nest', 'library', {
        buildable: true,
        name: 'auth',
      })
    )
  }

  rules.push(
    mergeWith(generate(tree, options, './templates'), MergeStrategy.Overwrite)
  )
  return rules
}

// TODO: do we need pass entire options?
function generate(
  _tree: Tree,
  options: AuthSchema,
  fromPath: string,
  toPath?: string
) {
  const target = toPath ? `${options.path}/${toPath}` : options.path
  return (context: SchematicContext) => {
    return apply(url(`${__dirname}/${fromPath}`), [
      templateRule(options as any),
      move(target),
    ])(context)
  }
}

// function generate(tree: Tree, _options: AuthSchema, filesPath: Path) {
//   return (_context: SchematicContext) => {
//     const readPath = `${__dirname}/${filesPath}`
//     const content = fs.readFileSync(readPath)
//     const tokens = filesPath.split('/')
//     const idx = filesPath.indexOf('templates')
//     const writePath = `${_options.path}/${tokens.slice(idx).join('/')}`
//     if (tree.exists(writePath)) {
//       tree.overwrite(writePath, content)
//     } else {
//       tree.create(writePath, content)
//     }
//     return tree
//   }
// }

export function main(options: AuthSchema): Rule {
  return async (tree: Tree, _context: SchematicContext): Promise<Rule> => {
    options = transformOptions(options)
    const rules = collectRules(tree, options)

    return chain(rules)
  }
}

export const templateRule = (options: AuthSchema) => () => {
  return template({
    classify,
    typeName: classify(options.name),
    dot: '.',
    index: 'index',
    ...options,
    // TODO
    keywordString: 'TODO',
    lowercased: (name: string) => {
      const classifiedName = classify(name)
      return classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
    },
    dasherize: (name: string) => dasherize(name),
    readme: (name: string) =>
      capitalize(name.replace('-', ' ').replace('  ', ' ')),
    stringify: (name: string) => JSON.stringify(name),
    imports: [],
    pluralize,
    conditional: (expr: boolean) => (ifTrue: string) => (otherwise: string) =>
      expr ? ifTrue : otherwise,
  })
}
