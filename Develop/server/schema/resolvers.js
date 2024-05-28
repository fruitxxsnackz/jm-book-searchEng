const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { resolvetoken } = require('../utils/auth');

const authorize = (context) => {
  if (!context.user) {
    throw new AuthenticationError('Login first');
  }
};

const resolver = {
  Query: {
    me: async (parent, args, context) => {
      authorize(context);
      return User.findOne({ _id: context.user._id }).populate('savedBooks');
    },
    books: async () => {
      return Book.find();
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = resolvetoken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect input');
      }

      const passwordval = await user.isCorrectPassword(password);

      if (!passwordval) {
        throw new AuthenticationError('Incorrect input');
      }

      const token = resolvetoken(user);
      return { token, user };
    },
    saveBook: async (parent, { bookData }, context) => {
      authorize(context);
      return User.findOneAndUpdate(
        { _id: context.user._id },
        { $addToSet: { savedBooks: bookData } },
        { new: true }
      );
    },
    removeBook: async (parent, { bookId }, context) => {
      authorize(context);
      return User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
    },
  },
};

module.exports = resolver;