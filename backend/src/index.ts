import 'reflect-metadata';
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from './constants';
import express from 'express';
import mikroConfig from './mikro-orm.config';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

import redis from 'redis';
import connectRedis from 'connect-redis';
import session from 'express-session';

import PostResolver from "./resolvers/post";
import UserResolver from './resolvers/user';

const main = async () => {

	const orm = await MikroORM.init(mikroConfig);

	await orm.getMigrator().up();

	const app = express();

	const RedisStore = connectRedis(session);
	const redisClient = redis.createClient();

	app.use(
		session(
			{
				name: 'cookId',
				store: new RedisStore({
					client: redisClient,
					// TODO: add TTL and reenable touch
					disableTouch: true			
				}),
				cookie: {
					maxAge: 1000 * 60 * 60 * 24 * 365 * 5,
					httpOnly: true,
					sameSite: 'lax', // csrf
					secure: __prod__ // TODO: set if use https in prod
				},
				secret: "big wizzy", // TODO: hash something better and ENV hide this
				resave: false
			}
		)
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [PostResolver, UserResolver],
			validate: false
		}),
		context: (req, res) => ({ em: orm.em, req, res })
	});

	apolloServer.applyMiddleware({ app });

	app.listen(4000, () => {
		console.log('listening on localhost:4000');
	});

}

main().catch(err => {
	console.error(err);
});