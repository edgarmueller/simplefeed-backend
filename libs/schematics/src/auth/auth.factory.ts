import { Path } from '@angular-devkit/core';
import {
	//  branchAndMerge,
	chain,
	externalSchematic, MergeStrategy, mergeWith, Rule, SchematicContext,
	Tree
} from '@angular-devkit/schematics';
import { AuthSchema } from './auth.schema';
import * as fs from 'fs';

function collectRules(tree: Tree, options: AuthSchema): Rule[] {
  const rules: Rule[] = []

	if (!tree.exists(`libs/auth/src/lib/auth.module.ts`)) {
		rules.push(
			externalSchematic('@nrwl/nest', 'library', {
				buildable: true,
				name: 'auth'
			})
		)
	}
	rules.push(generateFiles(tree, options, './templates/auth.constants.ts' as Path))

	if (options.model.modules.auth.storage) {

	}

	// refresh token --
	if (options.model.modules.auth.refreshToken.enabled) {
		rules.push(generateFiles(tree, options, './templates/refresh-token.entity.ts' as Path))
		rules.push(generateFiles(tree, options, './templates/strategies/jwt-refresh.guard.ts' as Path))
		rules.push(generateFiles(tree, options, './templates/strategies/jwt-refresh.strategy.ts' as Path))
	}
	return rules;
}

function generateFiles(tree: Tree, options: AuthSchema, filesPath: Path) {
	return mergeWith(generate(tree, options, filesPath), MergeStrategy.Overwrite)
}

function generate(tree: Tree, _options: AuthSchema, filesPath: Path) {
  return (_context: SchematicContext) => {
		const readPath = `${__dirname}/${filesPath}`
		const content  = fs.readFileSync(readPath)
		const tokens = filesPath.split('/')
		const idx = filesPath.indexOf('templates')
		const writePath = `${_options.path}/${tokens.slice(idx).join('/')}`
		tree.overwrite(writePath, content)
		return tree
  }
}

export function main(options: AuthSchema): Rule {
  return async (tree: Tree, _context: SchematicContext): Promise<Rule> => {
    const rules = collectRules(tree, options)
    return chain(rules)
  }
}
