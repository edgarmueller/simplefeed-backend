import { DeclarationOptions } from '@nestjs/schematics';

export class CustomModuleImportDeclarator {

  public declare(content: string, options: DeclarationOptions): string {
    const toInsert = this.buildLineToInsert(options);
    const contentLines = content.split('\n');
    const finalImportIndex = this.findImportsEndpoint(contentLines);
    contentLines.splice(finalImportIndex + 1, 0, toInsert);
    return contentLines.join('\n');
  }

  private findImportsEndpoint(contentLines: string[]): number {
    const reversedContent = Array.from(contentLines).reverse();
    const reverseImports = reversedContent.filter(line =>
      line.match(/\} from ('|")/),
    );
    if (reverseImports.length <= 0) {
      return 0;
    }
    return contentLines.indexOf(reverseImports[0]);
  }

  private buildLineToInsert(options: DeclarationOptions): string {
    return `import { ${options.symbol} } from '${options.path}'`
  }
}