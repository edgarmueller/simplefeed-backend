import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { <%= pluralize(typeName)%>Repository } from './<%= lowercased(typeName)%>.repository';
import { <%= typeName%>Schema } from './<%= lowercased(typeName)%>.schema';
<%  for (let entity of imports) { %>import { <%= entity %>Schema } from "./<%= lowercased(entity) %>.schema" <% } %>

@Module({
  imports: [
		TypeOrmModule.forFeature([<%= typeName %>Schema]),
		<%  for (let entity of imports) { %>TypeOrmModule.forFeature([<%=entity%>Schema]),<% } %>
		CqrsModule
	],
	controllers: [],
	providers: [<%= pluralize(typeName) %>Repository],
	exports: [<%= pluralize(typeName) %>Repository],
})
export class <%= typeName %>Module {}
