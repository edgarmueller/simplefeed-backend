import { join, Path } from '@angular-devkit/core'
import { classify, dasherize } from '@angular-devkit/core/src/utils/strings'
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
  DeclarationOptions,
  Location,
  mergeSourceRoot,
  ModuleDeclarator,
  ModuleFinder,
  NameParser
} from '@nestjs/schematics'
import * as pluralize from 'pluralize'
import { ModuleOptions } from '../../common/module.schema'
import { aggregateRootTemplateRule } from '../../common/template-rule'
import { AggregateRootSchema } from './aggregate-root.schema'
import { CustomModuleDeclarator } from './custom-module-declarator'
import { CustomModuleImportDeclarator } from './custom-module-import.declarator'
import { CustomModuleMetadataDeclarator } from './custom-module-metadata.declarator'

async function toModuleOptions(
  options: AggregateRootSchema
): Promise<ModuleOptions> {
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

function addDeclarationToAggregateRootModule(
  options: ModuleOptions,
  declarationOptions: DeclarationOptions,
  declareModuleImports: boolean = true
): Rule {
  return (tree: Tree) => {
    options.module = new ModuleFinder(tree).find({
      name: `${pluralize(classify(options.name))}Module`,
      path: options.path as Path,
    })!
    if (!options.module) {
      return tree
    }
    const content = tree.read(options.module)!.toString()
    const declarator: ModuleDeclarator = new CustomModuleDeclarator(
      new CustomModuleImportDeclarator(),
      declareModuleImports ? new CustomModuleMetadataDeclarator() : null
    )
    tree.overwrite(
      options.module,
      declarator.declare(content, declarationOptions)
    )
    return tree
  }
}

function generate(tree: Tree, options: AggregateRootSchema, filesPath: Path) {
  return (context: SchematicContext) => {
    return apply(url(__dirname + "/" + join(filesPath)), [
      filter((path: string, _entry: Readonly<FileEntry>) => 
        !tree.exists(options.path + path.replace('__name__', options.name))
      ),
      aggregateRootTemplateRule(options),
      move(options.path),
    ])(context)
  }
}

export function main(options: AggregateRootSchema): Rule {
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
        addDeclarationToAggregateRootModule(newModuleOptions, {
          path: '@nestjs/cqrs' as Path,
          name: 'CqrsModule',
          metadata: 'imports',
          module: newModuleOptions.module!,
        }),
        addDeclarationToAggregateRootModule(
          newModuleOptions,
          {
            path: '@nestjs/cqrs' as Path,
            name: 'EventPublisher',
            metadata: 'imports',
            module: newModuleOptions.module!,
          },
          false
        ),
      ])
    )
  }
}
