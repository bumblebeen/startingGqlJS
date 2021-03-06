const { ObjectID } = require('mongodb');
const {URL} = require('url');
const pubsub = require('../pubsub');

class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.field = field;
    }
}

function assertValidLink ({url}) {
	try {
		// new URL(url)
	} catch (error) {
        let err = new ValidationError(error, 'url');
        err.message = "WEH" + err.message
		throw err
	}
}

const links = [
  {
    id: 1,
    url: 'http://graphql.org/',
    description: 'The Best Query Language'
  },
  {
    id: 2,
    url: 'http://dev.apollodata.co	m',
    description: 'Awesome GraphQL Client'
  },
];

const buildFilters = ({OR= [], description_contains, url_contains}) => {
	const filter = (description_contains || url_contains) ? {} : null;
	if (description_contains) {
		filter.description = { $regex: `.*${description_contains}.*`};
	}
    if (url_contains) {
        filter.url = { $regex: `.*${url_contains}.*`};
    }

    let filters = filter ? [filter] : [];
	for (let i =0; i< OR.length; i++) {
		filters = filters.concat(buildFilters(OR[i]))
	}
	return filters;
};

module.exports = {
    Subscription: {
        Link: {
            subscribe: () => pubsub.asyncIterator('Link')
		}
	},
	Query: {
        allLinks: async (root, {filter, skip, first}, {mongo: {Links}}) => { // 1
			let query = filter ? {$or: buildFilters(filter)} : {};
			const cursor = Links.find(query);
			if (first) cursor.limit(first)
			if (skip) cursor.skip(skip);
            return cursor.toArray(); // 2
        }
	},
	Mutation: {
		createVote: async (root, data, {mongo: {Votes}, user}) => {
			const newVote = {
				userId: user && user._id,
				linkId: new ObjectID(data.linkId)
			};
			const response = await Votes.insert(newVote);
			return Object.assign({id: response.insertedIds[0]}, newVote);
		},
	    createLink: async (root, data, {mongo: {Links}, user}) => {
		  assertValidLink(data);
	      const newLink = Object.assign({postedById: user && user._id}, data);
	      const response = await Links.insert(newLink);

	      newLink.id = response.insertedIds[0];
	      const publishable = Object.assign({postedBy: user._id}, newLink);
	      pubsub.publish('Link', {Link: {mutation: 'CREATED', node: publishable}});
	      return newLink;
	    },
		createUser: async (root, data, {mongo: {Users}}) => {
			const newUser = {
				name: data.name,
				email: data.authProvider.email.email,
                password: data.authProvider.email.password,
			};
			const response = await Users.insert(newUser);
			return Object.assign({id: response.insertedIds[0]}, newUser);
		},
        signInUser: async (root, data, {mongo: {Users}}) => {
            const user = await Users.findOne({email: data.email.email});
            if (data.email.password === user.password) {
                return {token: `token-${user.email}`, user};
            }
        }
	},
	Link: {
		id:(root) => {
			return root._id || root.id
        },
        postedBy: async({postedById}, data, {dataloaders: {userLoader}}) => {
			console.log('I am not called');
        	return await userLoader.load(postedById);
        },
		// postedBy: async({postedById}, data, {mongo: {Users}}) => {
		// 	return await Users.findOne({_id: postedById});
		// },
        votes: async ({_id}, data, {mongo: {Votes}}) => {
            return await Votes.find({linkId: _id}).toArray()
        }
	},
	User: {
		id: root => root._id || root.id,
        votes: async ({_id}, data, {mongo: {Votes}}) => {
            return await Votes.find({userId: _id}).toArray()
        }
	},
	Vote: {
        id: root => root._id || root.id,
		// user: async({userId}, args, {mongo:{Users}}) => {
        	// return await Users.findOne({_id: userId});
		// },
        user: async({userId}, args, {dataloaders: {userLoader}}) => {
            return await userLoader.load(userId);
        },
        link: async({linkId}, args, {mongo: {Links}}) => {
        	return await Links.findOne({_id: linkId});
		}
	}
};