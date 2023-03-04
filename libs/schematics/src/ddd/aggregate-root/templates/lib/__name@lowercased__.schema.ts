import { EntitySchema } from 'typeorm'
import { <%= typeName %> } from './<%= lowercased(name)%>'

export const <%= typeName %>Schema = new EntitySchema<<%= typeName %>>({
  target: <%= typeName %>,
  name: "<%= name %>",
  tableName: "<%= lowercased(name) %>",
  columns: {
    id: {
      type: String,
      primary: true,
    },
		<% for (const prop of simpleProps) { %>
		<%= prop %>: {
			type: <%= capitalize(props[prop].type) %>,
			unique: <%= props[prop].unique || false%>,
			nullable: <%= props[prop].optional || false %>,
      name: '<%= snakeCase(prop) %>',
      <%   if (props[prop]?.meta?.orm?.createdAt === true) { %> createDate: true,
      <% } else if (props[prop].meta?.orm?.updatedAt === true) { %> updateDate: true
      <% } %>
		},
		<% } %>
  },
  relations: {
    <% for (const relation of relations) { %>
      <%= relation %>: {
        type: "<%= props[relation].multiplicity %>",
        target: "<%= props[relation].type %>",
        <% if (props[relation].inverseSide) { %>inverseSide: '<%= lowercased(props[relation].inverseSide) %>',<% } %>
        <% if (props[relation]?.meta?.orm?.eager === true)   { %> eager: true, <% } %>
        <% if (props[relation]?.meta?.orm?.cascade === true) { %> cascade: true, <% } %>
        <% if (props[relation].onDelete) { %>onDelete: "<%= props[relation].onDelete %>",<% } %>
        <% if (props[relation].multiplicity === 'many-to-many') { %>
          joinTable: {
            joinColumn: {
              name: '<%= `${snakeCase(name)}_id` %>',
              referencedColumnName: 'id' 
            },
            inverseJoinColumn: {
              name: '<%= `${snakeCase(props[relation].inverseSide)}_id` %>',
              referencedColumnName: 'id' 
            }
          }
        <% } %>
        <% if (props[relation].type !== typeName && props[relation].multiplicity === 'many-to-one') { %>joinColumn: { name: "<%= `${relation}_id` %>", }<% } %>
      },
      <% } %>
  }
})
