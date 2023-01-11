import { join, Path } from '@angular-devkit/core'
import {
  capitalize,
  classify,
  dasherize,
} from '@angular-devkit/core/src/utils/strings'
import {
  apply,
  branchAndMerge,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics'
import { Location, NameParser } from '@nestjs/schematics'
import * as pluralize from 'pluralize'
import { DomainReferenceSerializer, generateRefDescriptors } from '../../common/refs'
import {
  addDeclarationToAppModule,
  addDeclarationToModule,
} from '../../common/rules'
import { collectImports } from '../../common/template-rule'
import { AggregateRootOptions } from './aggregate-root.schema'

function transformOptions(options: AggregateRootOptions): AggregateRootOptions {
  const target: AggregateRootOptions = Object.assign(
    {},
    { path: options.path, name: options.name, genContext: options.genContext },
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

function generate(_tree: Tree, options: AggregateRootOptions, filesPath: Path) {
  return (context: SchematicContext) => {
    return apply(url(`${__dirname}/${filesPath}`), [
      aggregateRootTemplate(options),
      move(options.path as Path),
    ])(context)
  }
}

export function main(options: AggregateRootOptions): Rule {
  return async (tree: Tree, _context: SchematicContext): Promise<Rule> => {
    const transformedOptions = transformOptions(options)
    return branchAndMerge(
      chain([
        mergeWith(
          generate(tree, options, './templates' as Path),
          MergeStrategy.Overwrite
        ),
        addDeclarationToModule(transformedOptions.path as Path, {
          path: '@nestjs/cqrs' as Path,
          name: 'CqrsModule',
          metadata: 'imports',
        }),
        addDeclarationToModule(transformedOptions.path as Path, {
          path: `./${options.name}.repository` as Path,
          name: `${classify(options.name)}Module`,
          metadata: 'imports',
        }),
        addDeclarationToAppModule({
          skipImport: tree.exists(
            `${options.path}/lib/${options.name.toLowerCase()}.module.ts`
          ),
          name: `${classify(options.name)}Module`,
          path: `@kittgen/${options.name.toLowerCase()}`,
          metadata: 'imports',
        }),
      ])
    )
  }
}
function aggregateRootTemplate(options: AggregateRootOptions) {
  return () => {
    const m = options.model.modules[options.module!]
    const aggregate =
      options.model.modules[options.module!][classify(options.name)]
    const typeName = classify(options.name)
    const domainRefSerializer = new DomainReferenceSerializer()
    return template({
      ...options,
      index: 'index',
      classify,
      capitalize,
      typeName,
      aggregateName: options.name && classify(options.name),
      entities: Object.keys(m).filter((key) => {
        return m[key].type === 'Entity'
      }),
      // entities: aggregate.filter((key) => {
      //   return options.model.modules[agg][key].type === 'Entity'
      // }),
      dot: '.',
      // TODO
      props: aggregate.props,
      snakeCase: (name: string) => dasherize(name).replace(/-/g, '_'),
      queryableProps: Object.keys(aggregate.props).filter((key) => {
        return aggregate.props[key].queryable
      }),
      simpleProps: Object.keys(aggregate.props).filter((key) => {
        // TODO: generalize relation types
        const type = aggregate.props[key].type
        return type === 'string' || type === 'Date'
      }),
      stringifiedRefs: generateRefDescriptors(aggregate, typeName, options.genContext).flatMap(ref => {
        const refs = []
        refs.push(domainRefSerializer.serialize(ref));
        if (ref.isSelfReference) {
          refs.push(domainRefSerializer.serialize(ref.inverseSide));
        }
        return refs;
      }),
      relations: Object.keys(aggregate.props).filter((key) => {
        // TODO: generalize relation types
        return aggregate.props[key].multiplicity === 'one-to-one'
      }),
      imports: collectImports(options.name, aggregate),
      lowercased: (name: string) => {
        const classifiedName = classify(name)
        return classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
      },
      dasherize: (name: string) => dasherize(name),
      pluralize,
    })
  }
}
