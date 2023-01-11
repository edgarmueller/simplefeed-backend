import { Path } from '@angular-devkit/core'

export interface UsecasesOptions {
  /**
   * The name of the usecase collection.
   */
  name: string
  /**
   * The path to create the usecases file.
   */
  path?: string | Path
  /**
   * The path to insert the usecases declaration.
   */
  module?: Path
  /**
   * Directive to insert declaration in module.
   */
  skipImport?: boolean
}
