import { DeclarationOptions } from '@nestjs/schematics'

export interface AliasedDeclarationOptions extends DeclarationOptions {
  alias?: string
  aliased?: string
}
