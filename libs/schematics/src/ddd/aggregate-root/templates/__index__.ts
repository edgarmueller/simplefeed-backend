export { <%= typeName %> } from './lib/<%= lowercased(name) %>'
export { <%= pluralize(typeName)%>Repository } from './lib/<%= lowercased(name)%>.repository'
export { <%= typeName %>AlreadyExistsError } from './lib/errors/<%= lowercased(name) %>-already-exists.error'
export { <%= typeName %>NotFoundError } from './lib/errors/<%= lowercased(name) %>-not-found.error'
export { <%= typeName %>Module } from './lib/<%= lowercased(name) %>.module'
<%  for (let entity of entities) { %>
export { <%= entity %> } from "./lib/<%= lowercased(entity) %>" <% } %>
