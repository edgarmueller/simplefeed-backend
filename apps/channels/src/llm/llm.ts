/**
 * The little the channels need from a language model: given instructions
 * and input, answer with a JSON object. Callers validate the result, since
 * models can return anything.
 */
export interface JsonModel {
  readonly name: string
  completeJson(instructions: string, input: string): Promise<unknown>
}
