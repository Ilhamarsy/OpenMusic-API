const Joi = require('joi');

const PostPlaylistPayloadSchema = Joi.object({
  name: Joi.string().required(),
});

const PostSongsToPlaylistPayloadSchema = Joi.object({
  songId: Joi.string().required(),
});

module.exports = { PostPlaylistPayloadSchema, PostSongsToPlaylistPayloadSchema };
