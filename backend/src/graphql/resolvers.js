const User = require('../models/User');
const Session = require('../models/Session');

const resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      return User.findById(id).populate('friends');
    },

    getSessions: async (_, { status }) => {
      const filter = status ? { status } : {};
      return Session.find(filter)
        .populate('participants')
        .populate('host')
        .sort({ createdAt: -1 });
    },

    getCompletedSessions: async (_, { userId }) => {
      return Session.find({
        status: 'completed',
        participants: userId,
        ratedBy: { $ne: userId }
      })
        .populate('participants')
        .populate('host')
        .sort({ createdAt: -1 });
    },

    getFriends: async (_, { userId }) => {
      const user = await User.findById(userId).populate('friends');
      return user ? user.friends : [];
    },

    getNearbySessions: async (_, { latitude, longitude, radiusKm }) => {
      const radiusInMeters = radiusKm * 1000;
      return Session.find({
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusInMeters
          }
        },
        status: { $in: ['upcoming', 'in_progress'] }
      })
        .populate('participants')
        .populate('host')
        .sort({ createdAt: -1 });
    }
  },

  Mutation: {
    submitRatings: async (_, { sessionId, raterId, ratings }) => {
      const session = await Session.findById(sessionId);
      if (!session) throw new Error('Session not found');
      if (session.status !== 'completed') throw new Error('This session has not ended yet');

      const participantIds = session.participants.map((participant) => participant.toString());
      if (!participantIds.includes(raterId)) {
        throw new Error('Only session participants can submit ratings');
      }
      if ((session.ratedBy || []).some((participant) => participant.toString() === raterId)) {
        throw new Error('You have already rated this session');
      }

      const ratingIds = ratings.map(({ userId }) => userId);
      const expectedRatingIds = participantIds.filter((participantId) => participantId !== raterId);
      const submittedIdsAreValid =
        ratingIds.length === expectedRatingIds.length &&
        new Set(ratingIds).size === ratingIds.length &&
        ratingIds.every((userId) => expectedRatingIds.includes(userId));

      if (!submittedIdsAreValid) {
        throw new Error('Submit one rating for each other session participant');
      }
      if (ratings.some(({ rating }) => !Number.isInteger(rating) || rating < 1 || rating > 5)) {
        throw new Error('Ratings must be whole numbers from 1 to 5');
      }

      let totalGiven = 0;
      let friendsSent = 0;
      const updatedUsers = [];
      const rater = await User.findById(raterId);
      if (!rater) throw new Error('Rater not found');

      for (const { userId, rating, addFriend } of ratings) {
        const user = await User.findById(userId);
        if (!user) continue;

        user.addRating(rating);
        await user.save();
        totalGiven += rating;
        updatedUsers.push(user);

        if (addFriend) {
          const isAlreadyFriend = rater.friends.some((friendId) => friendId.toString() === userId);
          if (!isAlreadyFriend) {
            rater.friends.push(userId);
            await rater.save();
            if (!user.friends.some((friendId) => friendId.toString() === raterId)) {
              user.friends.push(raterId);
              await user.save();
            }
            friendsSent++;
          }
        }
      }

      session.ratedBy.push(raterId);
      await session.save();

      const avgRatingGiven = ratings.length > 0
        ? Math.round((totalGiven / ratings.length) * 10) / 10
        : 0;

      return {
        success: true,
        message: 'Ratings submitted successfully!',
        avgRatingGiven,
        friendRequestsSent: friendsSent,
        updatedUsers
      };
    },

    addFriend: async (_, { userId, friendId }) => {
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
      if (!user || !friend) throw new Error('User not found');

      if (!user.friends.some((id) => id.toString() === friendId)) {
        user.friends.push(friendId);
        await user.save();
      }
      if (!friend.friends.some((id) => id.toString() === userId)) {
        friend.friends.push(userId);
        await friend.save();
      }

      return User.findById(userId).populate('friends');
    }
  }
};

module.exports = resolvers;
