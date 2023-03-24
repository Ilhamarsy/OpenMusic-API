const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongService {
  constructor() {
    this._songs = [];
  }

  addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = `song-${nanoid(16)}`;

    const newSong = {
      id, title, year, genre, performer, duration, albumId,
    };

    this._songs.push(newSong);

    const isSuccess = this._songs.filter((song) => song.id === id).length > 0;

    if (!isSuccess) {
      throw new InvariantError('Gagal menambahkan album');
    }

    return id;
  }

  getSong() {
    return this._songs.map((song) => (
      { id: song.id, title: song.title, performer: song.performer }
    ));
  }

  getAlbumById(id) {
    const song = this._songs.filter((n) => n.id === id)[0];
    if (!song) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    return song;
  }

  editAlbumById(id, {
    title, year, genre, performer, duration, albumId,
  }) {
    const index = this._songs.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    this._songs[index] = {
      ...this._songs[index],
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    };
  }

  deleteAlbumById(id) {
    const index = this._songs.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    this._songs.splice(index, 1);
  }
}

module.exports = SongService;
