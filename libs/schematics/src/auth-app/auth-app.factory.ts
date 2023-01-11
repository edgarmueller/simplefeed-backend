import { dasherize } from '@angular-devkit/core/src/utils/strings'
import { Path } from '@angular-devkit/core'
import {
  apply,
  chain,
  externalSchematic,
  mergeWith,
  MergeStrategy,
  move,
  Rule,
  SchematicContext,
  Tree,
  url,
} from '@angular-devkit/schematics'
import {
  DeclarationOptions,
  Location,
  ModuleDeclarator,
  ModuleFinder,
  NameParser,
} from '@nestjs/schematics'
import { readWorkspace } from 'nx/src/generators/utils/project-configuration'
import { addDeclarationToAppModule } from '../common/rules'
import { AuthAppOptions } from './auth-app.schema'
import { templateRule } from '../common/template-rule'

function transformOptions(tree: Tree, options: AuthAppOptions): AuthAppOptions {
  const target: AuthAppOptions = Object.assign(
    {},
    { path: options.path, name: options.name }
  )
  //target.metadata = 'imports'
  //target.type = 'module'
  const ws = readWorkspace(tree as any)

  const location: Location = new NameParser().parse(target)
  target.name = dasherize(location.name)
  target.path = dasherize(location.path)

  const basePath = dasherize(location.path)
  //target.path = join(target.path as Path, target.name)
  target.path = `${ws.projects.app.sourceRoot!}${basePath}/${location.name}`
  return target
}

function collectRules(tree: Tree, _options: AuthAppOptions): Rule[] {
  const rules: Rule[] = []

  const ws = readWorkspace(tree as any)
  // generate app auth module --
  rules.push(
    externalSchematic('@nrwl/nest', 'module', {
      name: `${ws.projects.app.sourceRoot!}/app/auth`,
      project: 'app',
    })
  )

  // rules.push(
  // 	addDeclarationToAggregateRootModule(
  // 		`${ws.projects.app.sourceRoot!}/app/auth`,
  // 		{
  // 			path: '@kittgen/auth' as Path,
  // 			metadata: 'imports',
  // 			name: 'AuthModule',
  // 			alias: 'AuthCoreModule'
  // 		}
  // 	)
  // )

  rules.push(
    mergeWith(
      generate(tree, _options, './templates' as Path),
      MergeStrategy.Overwrite
    )
  )
  rules.push(
    addDeclarationToAppModule({
      // skipImport: tree.exists(options.path + `/${options.name}.module.ts`),
      name: `AuthModule`,
      path: './auth/auth.module',
      metadata: 'imports',
    })
  )
  return rules
}

function generate(
  _tree: Tree,
  options: AuthAppOptions,
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

export function addDeclarationToModule(options: AuthAppOptions): Rule {
  return (tree: Tree) => {
    // if (options.skipImport !== undefined && options.skipImport) {
    //   return tree
    // }
    const ws = readWorkspace(tree as any)
    options.module = new ModuleFinder(tree).find({
      path: `${ws.projects.app.sourceRoot}/app` as Path,
    })!
    if (!options.module) {
      return tree
    }
    const content = tree.read(options.module)!.toString()
    const declarator: ModuleDeclarator = new ModuleDeclarator()
    tree.overwrite(
      options.module,
      declarator.declare(content, options as DeclarationOptions)
    )
    return tree
  }
}

export function main(options: AuthAppOptions): Rule {
  return async (tree: Tree, _context: SchematicContext): Promise<Rule> => {
    options = transformOptions(tree, options)
    console.log({ options })
    const rules = collectRules(tree, options)

    return chain(rules)
  }
}
