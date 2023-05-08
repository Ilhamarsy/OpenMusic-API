const InvariantError = require('../../exceptions/InvariantError');
const { PostPlaylistPayloadSchema, PostSongsToPlaylistPayloadSchema } = require('./schema');

const PlaylistsValidator = {
  validatePostPlaylistPayload: (payload) => {
    const validationResult = PostPlaylistPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePostSongsToPlaylistPayload: (payload) => {
    const validationResult = PostSongsToPlaylistPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = PlaylistsValidator;
