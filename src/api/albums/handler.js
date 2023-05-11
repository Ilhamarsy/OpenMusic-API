const autoBind = require('auto-bind');

class AlbumHandler {
  constructor(albumsService, storageService, albumValidator, uploadsValidator) {
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._albumValidator = albumValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._albumValidator.validateAlbumPayload(request.payload);

    const { name, year } = request.payload;
    const albumId = await this._albumsService.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._albumValidator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diubah',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);

    await this._albumsService.addCoverAlbumById(id, filename);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikesHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    await this._albumsService.addLikeAlbumById(albumId, userId);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil disukai',
    });
    response.code(201);
    return response;
  }

  async getLikesAlbumByIdHandler(request, h) {
    const { id } = request.params;

    const { cache, rowCount } = await this._albumsService.getLikesAlbumById(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: rowCount,
      },
    });

    if (cache) response.header('X-Data-Source', 'cache');
    response.code(200);
    return response;
  }

  async deleteLikesAlbumByIdHandler(request) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    await this._albumsService.deleteLikeAlbumById(userId, albumId);
    return {
      status: 'success',
      message: 'Album berhenti disukai',
    };
  }
}

module.exports = AlbumHandler;
