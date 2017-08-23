const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const schema = require('./schema');

const connectMongo = require('./mongo-connector');


const start = async () => {
	const PORT = 3000;

	const mongo = await connectMongo();
	let app = express();

	app.use('/graphql', bodyParser.json(), graphqlExpress({
		context: {mongo},
		schema
	}));
	app.use('/graphiql', graphiqlExpress({
	  endpointURL: '/graphql',
	}));
	app.listen(PORT, () => {
	  console.log(`Hackernews GraphQL server running on port ${PORT}.`)
	});
};

start();