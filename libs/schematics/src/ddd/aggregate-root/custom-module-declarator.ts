import {
  DeclarationOptions,
  ModuleDeclarator,
  ModuleImportDeclarator,
} from '@nestjs/schematics'
import { AliasedDeclarationOptions } from './aliased-declaration-options'
import { CustomModuleMetadataDeclarator } from './custom-module-metadata.declarator'
import { LiteralModuleImportDeclarator } from './literal-module-import.declarator'

export class CustomModuleDeclarator extends ModuleDeclarator {
  constructor(
    imports: any = new LiteralModuleImportDeclarator(),
    metadata: any = new CustomModuleMetadataDeclarator()
  ) {
    super(imports as ModuleImportDeclarator, metadata), metadata
  }
  declare(
    content: string,
    options: DeclarationOptions & { alias?: string }
  ): string {
    options = this.computeSymbol2(options) // this['computeSymbol'](options);
    content = this['imports'].declare(content, options)
    if (this['metadata']) {
      content = this['metadata'].declare(content, options)
    }
    return content
  }

  // copied from nest
  private computeSymbol2(
    options: AliasedDeclarationOptions
  ): DeclarationOptions {
    const target = Object.assign({}, options)
    if (options.alias) {
      target.aliased = options.name
      target.symbol = options.alias
    } else {
      target.symbol = options.name
    }
    // original code
    // if (options.className) {
    //   target.symbol = options.className;
    // } else if (options.type !== undefined) {
    //   target.symbol = classify(options.name).concat(capitalize(options.type));
    // } else {
    //   target.symbol = classify(options.name);
    // }
    return target
  }
}
