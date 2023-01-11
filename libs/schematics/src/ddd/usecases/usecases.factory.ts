import { Path } from '@angular-devkit/core'
import { dasherize } from '@angular-devkit/core/src/utils/strings'
import {
  chain,
  MergeStrategy,
  mergeWith,
  Rule,
  apply,
  move,
  url,
  SchematicContext,
  Tree,
  Source,
} from '@angular-devkit/schematics'
import {
  DeclarationOptions,
  Location,
  ModuleDeclarator,
  ModuleFinder,
  NameParser,
} from '@nestjs/schematics'
import { readWorkspace } from 'nx/src/generators/utils/project-configuration'
import { templateRule } from '../../common/template-rule'
import { UsecasesOptions } from './usecases.schema'

const ELEMENT_TYPE = 'usecases'
const ELEMENT_METADATA = 'providers'

async function transformOptions(tree: Tree, options: UsecasesOptions) {
  if (!options.name) {
    throw new Error('Please specify a name.')
  }
  const target: any = Object.assign({}, options)
  const location: Location = new NameParser().parse(target)
  const basePath = dasherize(location.path)
  const ws = readWorkspace(tree as any)

  return {
    ...target,
    metadata: ELEMENT_METADATA,
    type: ELEMENT_TYPE,
    name: location.name,
    path: `${ws.projects.app.sourceRoot!}${basePath}/${location.name}`,
  }
}

//function generate(tree: Tree, _options: UsecasesOptions, filesPath: Path) {
//  return (_context: SchematicContext) => {
//		const readPath = `${__dirname}/${filesPath}`
//		const content  = fs.readFileSync(readPath)
//		const tokens = filesPath.split('/')
//		const idx = filesPath.indexOf('templates')
//		let writePath = `${_options.path}/${tokens.slice(idx).join('/')}`
//    writePath = writePath.replace('__name__', _options.name)
//		if (tree.exists(writePath)) {
//			tree.overwrite(writePath, content)
//		} else {
//			tree.create(writePath, content)
//		}
//		return tree
//  }
//}

function generate(
  _tree: Tree,
  options: UsecasesOptions,
  filesPath: Path
): Source {
  return (context: SchematicContext) => {
    // const ws = readWorkspace(_tree as any)
    // const writePath = `${ws.projects.app.sourceRoot}/${options.name}`
    console.log(filesPath)
    console.log(__dirname + '/' + filesPath)
    const source = apply(url(__dirname + '/' + filesPath), [
      templateRule(options),
      move(options.path!),
    ])(context)
    return source
  }
}

export function main(options: UsecasesOptions): Rule {
  return async (_tree: Tree, _context: SchematicContext): Promise<Rule> => {
    options = await transformOptions(_tree, options)
    return chain([
      mergeWith(
        generate(_tree, options, './templates' as Path),
        MergeStrategy.Overwrite
      ),
      addDeclarationToModule(options),
    ])
  }
}

export function addDeclarationToModule(options: UsecasesOptions): Rule {
  return (tree: Tree) => {
    // if (options.skipImport !== undefined && options.skipImport) {
    //   return tree
    // }
    options.module = new ModuleFinder(tree).find({
      name: options.name,
      path: options.path as any,
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

// TODO:
// clean options and schema types
// specify own addDeclarationToModule based on options
// remove hard coded hacks
// check if custom module declarator is needed
