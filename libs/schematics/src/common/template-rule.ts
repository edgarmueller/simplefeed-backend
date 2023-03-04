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

export function collectImports(options: any, aggregateOrEntity: any) {
  const module = options.module;
  const aggregateName = options.name;
  const containedTypes = Object.keys(options.model.modules[module]).filter(name => name !== 'type')
  return Object.keys(aggregateOrEntity.props)
    .filter((propName) => {
      const prop = aggregateOrEntity.props[propName]
      return !isPrimitive(prop) && containedTypes.includes(prop.type)
    })
    .map((propName) => aggregateOrEntity.props[propName].type)
    .filter((t) => t.toLowerCase() !== aggregateName.toLowerCase())
}

