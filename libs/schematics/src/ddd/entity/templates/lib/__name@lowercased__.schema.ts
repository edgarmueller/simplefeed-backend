import { EntitySchema } from 'typeorm'
import { <%= typeName %> } from './<%= lowercased(name)%>'
<% for (const imp of imports) {%>import { <%= capitalize(imp) %> } from './<%= lowercased(imp)%>' <% } %>

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
      <% if (props[prop].metadata === 'createdAt') { %>
      createDate: true,
      <% } else if (props[prop].metadata === 'updatedAt') { %>
      updateDate: true
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
      <% if (props[relation].eager) { %>eager: <%= props[relation].eager %>,<% } %>
      <% if (props[relation].cascade) { %>cascade: <%= props[relation].cascade %>,<% } %>
      <% if (props[relation].onDelete) { %>onDelete: "<%= props[relation].onDelete %>",<% } %>
      <% if (props[relation].type !== typeName) { %>joinColumn: { name: "<%= `${lowercased(props[relation].type)}_id` %>", }<% } %>
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
    },
		<% } %>
  }
})
