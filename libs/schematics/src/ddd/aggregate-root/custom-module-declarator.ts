import { DeclarationOptions, ModuleDeclarator, ModuleImportDeclarator } from '@nestjs/schematics';
import { CustomModuleMetadataDeclarator } from './custom-module-metadata.declarator';

export class CustomModuleDeclarator extends ModuleDeclarator {
  constructor(
    imports: any = new ModuleImportDeclarator(),
    metadata: any = new CustomModuleMetadataDeclarator(),
  ) {
    super(imports as ModuleImportDeclarator, metadata), metadata
  }
  declare(content: string, options: DeclarationOptions): string {
    options = this['computeSymbol'](options);
    content = this['imports'].declare(content, options);
    if (this['metadata']) {
      content = this['metadata'].declare(content, options);
    }
    return content;
  }
}