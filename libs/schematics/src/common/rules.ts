import { readWorkspace } from 'nx/src/generators/utils/project-configuration'
import { Path } from '@angular-devkit/core'
import { Rule, Tree } from '@angular-devkit/schematics'
import {
  DeclarationOptions,
  ModuleDeclarator,
  ModuleFinder,
} from '@nestjs/schematics'
import { CustomModuleDeclarator } from '../ddd/aggregate-root/custom-module-declarator'
import { ModuleOptions } from './module.schema'
import { LiteralModuleImportDeclarator } from '../ddd/aggregate-root/literal-module-import.declarator'
import { CustomModuleMetadataDeclarator } from '../ddd/aggregate-root/custom-module-metadata.declarator'

export function addDeclarationToAppModule(options: ModuleOptions): Rule {
  return (tree: Tree) => {
    if (options.skipImport !== undefined && options.skipImport) {
      return tree
    }
    const ws = readWorkspace(tree as any)
    options.module = new ModuleFinder(tree).find({
      path: `${ws.projects.app.sourceRoot}/app` as Path,
    })!
    if (!options.module) {
      return tree
    }
    const content = tree.read(options.module)!.toString()
    const declarator: ModuleDeclarator = new CustomModuleDeclarator()
    tree.overwrite(
      options.module,
      declarator.declare(content, options as DeclarationOptions)
    )
    return tree
  }
}

export function addDeclarationToModule(
  modulePath: string,
  declarationOptions: Omit<DeclarationOptions, 'module'> & { alias?: string },
  declareModuleImports = true
): Rule {
  return (tree: Tree) => {
    const module = new ModuleFinder(tree).find({
      path: modulePath as Path,
    })!
    if (!module) {
      return tree
    }
    const content = tree.read(module)!.toString()
    const declarator: ModuleDeclarator = new CustomModuleDeclarator(
      new LiteralModuleImportDeclarator(),
      declareModuleImports ? new CustomModuleMetadataDeclarator() : null
    )
    tree.overwrite(
      module,
      declarator.declare(content, {
        ...declarationOptions,
        module,
      })
    )
    return tree
  }
}
