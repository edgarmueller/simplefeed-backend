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

function collectRules(tree: Tree, model: any): Rule[] {
  const rules: Rule[] = []
  Object.keys(model.modules).forEach((moduleName) => {
    const moduleType = model.modules[moduleName].type
    if (moduleType === 'domain') {
      if (!tree.exists(`libs/${moduleName}/src/lib/${moduleName}.module.ts`)) {
        rules.push(
          externalSchematic('@nrwl/nest', 'library', {
            buildable: true,
            name: moduleName,
          })
        )
      }
      // aggregates --
      const aggregates = Object.keys(model.modules[moduleName]).filter(
        (key) => {
          return model.modules[moduleName][key].type === 'AggregateRoot'
        }
      )
      aggregates.forEach((aggregate) => {
        rules.push(
          aggregateRootRule({
            module: moduleName,
            name: aggregate,
            path: `libs/${moduleName}/src/lib`,
            model,
          })
        )
      })
      // entities --
      const entities = Object.keys(model.modules[moduleName]).filter((key) => {
        return model.modules[moduleName][key].type === 'Entity'
      })
      entities.forEach((aggregate) => {
        rules.push(
          entityRule({
            module: moduleName,
            name: aggregate,
            path: `libs/${moduleName}/src/lib`,
            model,
          })
        )
      })
    }

    if (moduleType === "auth") {
      console.log('auth module found')
      rules.push(authRule({
        model,
        path: `libs/${moduleName}/src/lib`,
      }))
    }
  })
  return rules
}

export function main(options: ModelSchema): Rule {
  const input = fs.readFileSync(options.inputFile as string, 'utf8')
  const model = JSON.parse(input)
  return async (tree: Tree, _context: SchematicContext): Promise<Rule> => {
    const rules = collectRules(tree, model)
    return branchAndMerge(chain(rules))
  }
}
