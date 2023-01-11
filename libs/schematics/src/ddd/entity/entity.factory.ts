import { join, Path } from '@angular-devkit/core'
import { dasherize } from '@angular-devkit/core/src/utils/strings'
import {
  apply,
  branchAndMerge,
  chain,
  FileEntry,
  filter,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url
} from '@angular-devkit/schematics'
import {
  Location,
  mergeSourceRoot, NameParser
} from '@nestjs/schematics'
import { ModuleOptions } from '../../common/module.schema'
import { entityTemplateRule } from '../../common/template-rule'
import { EntitySchema } from './entity.schema'

async function toModuleOptions(options: EntitySchema): Promise<ModuleOptions> {
  const target: ModuleOptions = Object.assign(
    {},
    { path: options.path, name: options.name }
  )
  target.metadata = 'imports'
  target.type = 'module'

  const location: Location = new NameParser().parse(target)
  target.name = dasherize(location.name)
  target.language = target.language !== undefined ? target.language : 'ts'
  target.path = dasherize(location.path)

  target.path = target.flat
    ? target.path
    : join(target.path as Path, target.name)
  return target
}

function generate(tree: Tree, options: EntitySchema, filesPath: Path) {
  return (context: SchematicContext) => {
    return apply(url(__dirname + "/" + join(filesPath)), [
      filter((path: string, _entry: Readonly<FileEntry>) =>  {
        console.log('checking for ', options.path + path.replace('__name__', options.name))
        return !tree.exists(options.path + path.replace('__name__', options.name))
      }),
      entityTemplateRule(options),
      move(options.path),
    ])(context)
  }
}

export function main(options: EntitySchema): Rule {
  return async (_tree: Tree, _context: SchematicContext): Promise<Rule> => {
    const moduleName = options.name
    const newModuleOptions = {
      ...(await toModuleOptions(options)),
      name: moduleName,
      path: options.path,
    };
    return branchAndMerge(
      chain([
        mergeSourceRoot(newModuleOptions),
        mergeWith(
          generate(_tree, options, './templates' as Path),
          MergeStrategy.Overwrite
        ),
      ])
    )
  }
}
