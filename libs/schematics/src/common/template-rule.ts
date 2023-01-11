import { EntitySchema } from './../ddd/entity/entity.schema'
import {
  capitalize,
  classify,
  dasherize,
} from '@angular-devkit/core/src/utils/strings'
import { template } from '@angular-devkit/schematics'
import * as pluralize from 'pluralize'

export interface TemplateOptions {
  name: string
}
export const templateRule = (options: TemplateOptions) => () => {
  return template({
    classify,
    typeName: classify(options.name),
    dot: '.',
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

export function isPrimitive(prop: any) {
  return ['string', 'number', 'boolean', 'Date'].includes(prop.type)
}

export function collectImports(aggregateName: string, aggregate: any) {
  return Object.keys(aggregate.props)
    .filter((propName) => {
      const prop = aggregate.props[propName]
      return !isPrimitive(prop)
    })
    .map((propName) => aggregate.props[propName].type)
    .filter((t) => t.toLowerCase() !== aggregateName.toLowerCase())
}

export const entityTemplateRule = (options: EntitySchema) => () => {
  const entity = options.model.modules[options.module][classify(options.name)]
  return template({
    classify,
    typeName: classify(options.name),
    aggregateName: options.name && classify(options.name),
    dot: '.',
    ...options,
    // TODO
    props: entity.props,
    imports: collectImports(options.name, entity),
    keywordString: 'TODO',
    lowercased: (name: string) => {
      const classifiedName = classify(name)
      return classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1)
    },
    dasherize: (name: string) => dasherize(name),
    readme: (name: string) =>
      capitalize(name.replace('-', ' ').replace('  ', ' ')),
    stringify: (name: string) => JSON.stringify(name),
    pluralize,
    conditional: (expr: boolean) => (ifTrue: string) => (otherwise: string) =>
      expr ? ifTrue : otherwise,
  })
}
