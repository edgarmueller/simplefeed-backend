import { join, Path } from "@angular-devkit/core";
import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Source,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { templateRule } from "../../common/template-rule";
import { UseCaseSchema } from "./usecase.schema";

async function transformOptions(options: UseCaseSchema) {
  if (!options.name) {
    throw new Error("Please specify a name.");
  }
  if (!options.name.match(/^[a-z-_]+$/)) {
    throw new Error("Invalid name. Accepted: [a-z-_]+");
  }

  return {
    ...options,
  };
}

function generate(options: UseCaseSchema, filesPath: Path): Source {
  return (context: SchematicContext) => {
    const source = apply(url(join(filesPath)), [
      templateRule(options),
      move(`src/modules/${options.aggregate}`),
    ])(context);
    return source;
  };
}

export function main(options: UseCaseSchema): Rule {
  return async (_tree: Tree, _context: SchematicContext): Promise<Rule> => {
    options = await transformOptions(options);
    return chain([
      mergeWith(generate(options, './files' as Path))
    ]);
  };
}
