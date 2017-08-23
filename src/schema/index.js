const {makeExecutableSchema} = require('graphql-tools');
const resolvers = require('./resolvers');
// Define your types here.
const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String
    votes: [Vote!]!
  }

  type Link {
    id: ID!
    url: String!
    description: String!
    postedBy: User
    votes: [Vote!]!
  }

  input AuthProviderSignupData {
    email: AUTH_PROVIDER_EMAIL
  }

  input AUTH_PROVIDER_EMAIL {
    email: String!
    password: String!
  }

  type SigninPayload {
    token: String
    user: User
  }
  
  type Vote {
    id: ID!
    user: User!
    link: Link!
  }
  
  type Query {
  	allLinks: [Link!]!
  }
  type Mutation {
  	createLink(url: String!, description: String!): Link
  	createUser(name: String!, authProvider: AuthProviderSignupData!): User
  	signInUser(email: AUTH_PROVIDER_EMAIL): SigninPayload!
  	createVote(linkId: ID!): Vote
  }
`;

// Generate the schema object from your types definition.
module.exports = makeExecutableSchema({typeDefs, resolvers});