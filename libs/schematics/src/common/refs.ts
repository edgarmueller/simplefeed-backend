export function isSimpleProp(type: string) {
  return (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'Date'
  )
}

export type Multiplicity = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';

export interface ReferenceDescriptor {
  name: string;
  type: string;
  isSelfReference: boolean;
  isOptional: boolean;
  isMany: boolean;
  multiplicity: Multiplicity;
  inverseSide?: ReferenceDescriptor;
}

export interface IReferenceSerializer {
  serialize(refDescriptor: ReferenceDescriptor): string | undefined;
}

export class DomainReferenceSerializer implements IReferenceSerializer {
  serialize(refDescriptor: ReferenceDescriptor | undefined): string | undefined {
    if (!refDescriptor) {
      return undefined
    }
    return `${refDescriptor.name}${refDescriptor.isOptional ? '?' : ''}: ${refDescriptor.type}${refDescriptor.isMany ? '[]' : ''}`
  }
}

export function generateRefDescriptors(entity: { props: { [name: string]: any } }, typeName: string, genContext: any): ReferenceDescriptor[] {
  return Object
    .entries(entity.props)
    .filter(([_, value]) => !isSimpleProp(value.type))
    .reduce((acc, [refName, ref]) => {
      const multiplicity = ref.multiplicity
      if (!multiplicity) {
        throw new Error(`Missing multiplicity for ${refName}`)
      }
      const [source, _, target] = multiplicity.split('-')
      const isSelfReference = ref.type === typeName;
      const inverseRef = {
        name: ref.inverseSide,
        type: typeName,
        isSelfReference,
        multiplicity: `${target}-to-${source}` as Multiplicity,
        isMany: target === 'many',
        isOptional: ref.optional || false,
      } as ReferenceDescriptor
      if (ref.inverseSide && !isSelfReference && genContext.crossReferences[`${typeName}.${refName}`]) {
        const inverseSide = genContext.crossReferences[`${typeName}.${refName}`]
        console.log(`${typeName}.${refName}:`, { inverseSide })
        // TODO: compare reference types
      } else if (ref.inverseSide && !isSelfReference) {
        // Profile.user
        genContext.crossReferences[`${ref.type}.${ref.inverseSide}`] = inverseRef;
      }
      acc.push({
        name: refName,
        type: ref.type,
        isSelfReference: ref.type === typeName,
        isOptional: ref.optional || false,
        isMany: source === 'many',
        multiplicity,
        inverseSide: ref.inverseSide ? inverseRef : undefined,
      } as ReferenceDescriptor)
      return acc
    }, [] as ReferenceDescriptor[])
}