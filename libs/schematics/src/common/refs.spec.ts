import { generateRefDescriptors } from "./refs"

describe("test", () => {
  it('should work', () => {
    const model = {
      props: {
        foo: {
          multiplicity: 'one-to-one',
          type: 'Foo'
        },
        baz: {
          type: 'Bar',
          multiplicity: 'many-to-one',
          optional: true,
        }
      }
    };
    const refDescriptors = generateRefDescriptors(model, 'bar', { crossReferences:{}})
    expect(refDescriptors).toEqual([{
        name: 'foo',
        type: 'Foo',
        isOptional: false,
        isMany: false,
        multiplicity: 'one-to-one',
        isSelfReference: false,
        inverseSide: undefined,
      },
      {
        type: 'Bar',
        isOptional: true,
        isMany: true,
        multiplicity: 'many-to-one',
        name: 'baz',
        isSelfReference: false,
        inverseSide: undefined
      }])
  })
  it("bidirectional", () => {
    const model = {
      props: {
        foo: {
          type: "Profile",
          multiplicity: "many-to-many",
          inverseSide: "followedBy",
        }
      }
    }
    const refDescriptors = generateRefDescriptors(model, 'Profile', { crossReferences: {}})
    expect(refDescriptors).toEqual([{
      type: 'Profile',
      isMany: true,
      isOptional: false,
      multiplicity: 'many-to-many',
      name: 'foo',
      isSelfReference: true,
      inverseSide: {
        multiplicity: 'many-to-many',
        isOptional: false,
        name: 'followedBy',
        isMany: true,
        type: 'Profile',
        isSelfReference: true,
      }
    }])
  })
})