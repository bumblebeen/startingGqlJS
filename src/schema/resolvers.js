const { ObjectID } = require('mongodb');

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

module.exports = {
	Query: {
        allLinks: async (root, data, {mongo: {Links}}) => { // 1
            return await Links.find({}).toArray(); // 2
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
	      const newLink = Object.assign({postedById: user && user._id}, data);
	      console.log(newLink);
	      const response = await Links.insert(newLink);
	      return Object.assign({id: response.insertedIds[0]}, newLink); // 4
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