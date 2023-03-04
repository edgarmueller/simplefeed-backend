import { join, Path } from '@angular-devkit/core';
import {
  capitalize,
  classify,
  dasherize
} from '@angular-devkit/core/src/utils/strings';
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
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { Location, mergeSourceRoot, NameParser } from '@nestjs/schematics';
import * as pluralize from 'pluralize';
import { ModuleOptions } from '../../common/module.schema';
import { generateRefDescriptors as generateReferenceDesciptors, isSimpleProp } from '../../common/refs';
import { collectImports } from '../../common/template-rule';
import { DomainReferenceSerializer } from './../../common/refs';
import { EntitySchema } from './entity.schema';

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
    return apply(url(__dirname + '/' + join(filesPath)), [
      filter((path: string, _entry: Readonly<FileEntry>) => {
        return !tree.exists(
          options.path + path.replace('__name__', options.name)
        )
      }),
      entityTemplateRule(options),
      move(options.path),
    ])(context)
  }
}

function entityTemplateRule(options: EntitySchema) {
  const domainRefSerializer = new DomainReferenceSerializer()
  return () => {
    const typeName = classify(options.name)
    const m = options.model.modules[options.module!]
    const entity =
      options.model.modules[options.module!][classify(options.name)]
    return template({
      ...options,
      index: 'index',
      entities: Object.keys(m).filter((key) => m[key].type === 'Entity'),
      dot: '.',
      // TODO
      props: entity.props,
      queryableProps: Object.keys(entity.props).filter((key) => entity.props[key].queryable),
      simpleProps: Object.keys(entity.props).filter((key) => isSimpleProp(entity.props[key].type)),
      relations: Object.keys(entity.props).filter((key) => {
        // TODO: generalize relation types
        return entity.props[key].multiplicity !== undefined
      }),
      stringifiedRefs: generateReferenceDesciptors(entity, typeName, options.genContext).flatMap(ref => {
        const refs = []
        refs.push(domainRefSerializer.serialize(ref));
        if (ref.isSelfReference) {
          refs.push(domainRefSerializer.serialize(ref.inverseSide));
        }
        return refs;
      }),
      imports: collectImports(options, entity),
      classify,
      capitalize,
      typeName,
      snakeCase: (name: string) => dasherize(name).replace(/-/g, '_'),
      lowercased: (name: string) => {
        const classifiedName = classify(name)
        return classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
      },
      dasherize: (name: string) => dasherize(name),
      pluralize,
    })
  }
}

export function main(options: EntitySchema): Rule {
  return async (_tree: Tree, _context: SchematicContext): Promise<Rule> => {
    //const moduleName = options.name
    const newModuleOptions = {
      ...(await toModuleOptions(options)),
      //name: moduleName,
      //path: options.path,
    }
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
