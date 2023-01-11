import { DeclarationOptions } from "@nestjs/schematics";
import { CustomMetadataManager } from "./custom-metadata.manager";

export class CustomModuleMetadataDeclarator {
  public declare(content: string, declarationOpts: DeclarationOptions): string {
    const manager = new CustomMetadataManager(content);
    const inserted = manager.insert(
      declarationOpts.metadata,
      declarationOpts.symbol!,
      declarationOpts.staticOptions,
    );
    return inserted;
  }
}