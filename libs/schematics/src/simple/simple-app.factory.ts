import { join, Path } from '@angular-devkit/core'
import {
  capitalize,
  classify,
  dasherize,
} from '@angular-devkit/core/src/utils/strings'
import {
  apply,
  chain,
  externalSchematic,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Source,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics'
import * as pluralize from 'pluralize'
import { AppSchema } from './simple-app.schema'

function generate(options: AppSchema, _tree: Tree): Source {
  const { name, path: path } = options
  return (context: SchematicContext) => {
    console.log(`Generating to ${path}`)
    const source = apply(url(join('../common/files' as Path)), [
      template({
        classify,
        typeName: classify(name),
        dot: '.',
        ...options,
        keywordString: 'TODO',
        lowercased: (name: string) => {
          const classifiedName = classify(name)
          return (
            classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
          )
        },
        dasherize: (name: string) => dasherize(name),
        // singular: (name: string) => pluralize.singular(name),
        readme: (name: string) =>
          capitalize(name.replace('-', ' ').replace('  ', ' ')),
        ent: (name: string) => name + '.entity',
        stringify: (name: string) => JSON.stringify(name),
        pluralize,
        conditional:
          (expr: boolean) => (ifTrue: string) => (otherwise: string) =>
            expr ? ifTrue : otherwise,
      }),
      move(path),
    ])(context)
    return source
  }
}

function generateNestJsApp(name: string) {
  return externalSchematic('@nestjs/schematics', 'application', {
    name,
  })
}

export function main(options: AppSchema): Rule {
  const { name } = options
  return async (_tree: Tree, _context: SchematicContext): Promise<Rule> => {
    //options = await transformOptions(options);
    return chain([
      generateNestJsApp(name),
      mergeWith(generate({ name, path: name }, _tree)),
    ])
  }
}
