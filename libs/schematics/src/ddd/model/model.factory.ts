import { Path } from '@angular-devkit/core'
import {
  externalSchematic,
  branchAndMerge,
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics'
import { main as aggregateRootRule } from '../aggregate-root/aggregate-root.factory'
import { main as entityRule } from '../entity/entity.factory'
import { main as authRule } from '../../auth/auth.factory'
import { ModelSchema } from './model.schema.'
import * as fs from 'fs'

const collectTypes = (targetType: string) => (module: any) =>
  Object.keys(module).filter((key) => module[key].type === targetType)

const collectEntities = collectTypes('Entity')
const collectAggregateRoots = collectTypes('AggregateRoot')

function collectRules(tree: Tree, model: any): Rule[] {
  const rules: Rule[] = []
  Object.keys(model.modules).forEach((moduleName) => {
    const currentModule = model.modules[moduleName]
    const moduleType = currentModule.type
    if (moduleType === 'domain') {
      if (!tree.exists(`libs/${moduleName}/src/lib/${moduleName}.module.ts`)) {
        rules.push(
          externalSchematic('@nrwl/nest', 'library', {
            buildable: true,
            name: moduleName,
          })
        )
      }
      const genContext = {
        crossReferences: {}
      };
      // aggregates --
      const aggregates = collectAggregateRoots(currentModule)
      aggregates.forEach((aggregate) => {
        rules.push(
          aggregateRootRule({
            module: moduleName as Path,
            name: aggregate,
            path: `libs/${moduleName}/src`,
            model,
            genContext
          })
        )
      })
      // entities --
      const entities = collectEntities(currentModule)
      entities.forEach((entity) => {
        rules.push(
          entityRule({
            module: moduleName,
            name: entity,
            path: `libs/${moduleName}/src`,
            model,
            genContext
          })
        )
      })
    }
  })

  if (model.modules.auth) {
    rules.push(
      authRule({
        name: 'auth',
        model,
        path: 'libs/auth/src',
      })
    )
  }

  return rules
}

export function main(options: ModelSchema): Rule {
  const input = fs.readFileSync(options.inputFile as string, 'utf8')
  const model = JSON.parse(input)
  return async (tree: Tree, _context: SchematicContext): Promise<Rule> => {
    const rules = collectRules(tree, model);
    return branchAndMerge(chain(rules))
  }
}
