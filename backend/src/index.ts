import 'reflect-metadata';
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from './constants';
import express from 'express';
import mikroConfig from './mikro-orm.config';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import PostResolver from "./resolvers/post";
import UserResolver from './resolvers/user';

const main = async () => {

	const orm = await MikroORM.init(mikroConfig);

	await orm.getMigrator().up();

	const app = express();

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false
		}),
		context: () => ({ em: orm.em })
	});

	apolloServer.applyMiddleware({ app });

	app.listen(4000, () => {
		console.log('listening on localhost:4000');
	});

}

main().catch(err => {
	console.error(err);
});