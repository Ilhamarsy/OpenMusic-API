const autoBind = require('auto-bind');

class PlaylistHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayload(request.payload);

    const { id: credentialId } = request.auth.credentials;
    const { name } = request.payload;

    const playlistId = await this._service.addPlaylist(name, credentialId);

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async postPlaylistSongsByIdHandler(request, h) {
    this._validator.validatePostSongsToPlaylistPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;

    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    await this._service.addPlaylistSong(playlistId, songId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan lagu ke playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylist(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async getPlaylistSongsByIdHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;

    const playlist = await this._service.getPlaylistSongsByIdHandler(id, credentialId);
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;
    await this._service.deletePlaylist(id, credentialId);

    return {
      status: 'success',
      message: 'Berhasil menghapus playlist',
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;

    await this._service.deletePlaylistSongById(playlistId, songId, credentialId);

    return {
      status: 'success',
      message: 'Berhasil menghapus lagu playlist',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;

    const activities = await this._service.getPlaylistSongActivities(playlistId, credentialId);
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistHandler;
