const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const schema = require('./schema');
const { authenticate } = require('./authentication');
const buildDataloaders = require('./dataloaders');
const formatError = require('./formatError');

const connectMongo = require('./mongo-connector');

const start = async () => {
	const PORT = 3000;

	const mongo = await connectMongo();
	let app = express();

	const buildOptions = async (req, res) => {
		const user = await authenticate(req, mongo.Users);
		return {
			context: {
				dataloaders: buildDataloaders(mongo),
				mongo,
				user
			},
			formatError,
			schema
		};
	};

	app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));
	app.use('/graphiql', graphiqlExpress({
	  endpointURL: '/graphql',
	  passHeader: `'Authorization': 'bearer token-arcilla.marvin@ymail.com'`
	}));
	app.listen(PORT, () => {
	  console.log(`Hackernews GraphQL server running on port ${PORT}.`)
	});
};

start();