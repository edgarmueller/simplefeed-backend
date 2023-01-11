import { DeclarationOptions } from '@nestjs/schematics'
import { AliasedDeclarationOptions } from './aliased-declaration-options'

/**
 * Uses options path as given for import declarations without
 * noramlizing paths to relative paths.
 */
export class LiteralModuleImportDeclarator {
  public declare(content: string, options: DeclarationOptions): string {
    const toInsert = this.buildLineToInsert(options)
    const contentLines = content.split('\n')
    const finalImportIndex = this.findImportsEndpoint(contentLines)
    contentLines.splice(finalImportIndex + 1, 0, toInsert)
    return contentLines.join('\n')
  }

  private findImportsEndpoint(contentLines: string[]): number {
    const reversedContent = Array.from(contentLines).reverse()
    const reverseImports = reversedContent.filter((line) =>
      line.match(/\} from ('|")/)
    )
    if (reverseImports.length <= 0) {
      return 0
    }
    return contentLines.indexOf(reverseImports[0])
  }

  private buildLineToInsert(options: AliasedDeclarationOptions): string {
    if (options.alias) {
      return `import { ${options.aliased} as ${options.alias} } from '${options.path}'`
    }
    return `import { ${options.symbol} } from '${options.path}'`
  }
}
