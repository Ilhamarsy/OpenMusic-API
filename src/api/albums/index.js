const AlbumHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, {
    albumsService, storageService, albumValidator, uploadsValidator,
  }) => {
    const albumHandler = new AlbumHandler(
      albumsService,
      storageService,
      albumValidator,
      uploadsValidator,
    );
    server.route(routes(albumHandler));
  },
};
