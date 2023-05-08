const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist(name, owner) {
    await this.verifyNewPlaylist(name);

    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menambah playlist');
    }

    return result.rows[0].id;
  }

  async addPlaylistSong(playlistId, songId, owner) {
    await this.verifyPlaylistAccess(playlistId, owner);
    await this.verifySong(playlistId, songId);

    const id = `psongs-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambah playlist');
    }

    await this.addPlaylistSongActivities(playlistId, songId, owner);
  }

  async getPlaylist(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists 
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      LEFT JOIN users ON playlists.owner = users.id
      WHERE playlists.owner = $1 OR collaborations.user_id = $1
      GROUP BY playlists.id, users.username`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistSongsByIdHandler(id, owner) {
    await this.verifyPlaylistAccess(id, owner);

    const querySong = {
      text: `SELECT songs.id, songs.title, songs.performer FROM playlist_songs LEFT JOIN songs ON songs.id = playlist_songs.song_id 
      WHERE playlist_songs.playlist_id = $1`,
      values: [id],
    };

    const queryPlaylist = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlist_songs 
      LEFT JOIN playlists ON playlists.id = playlist_songs.playlist_id
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlist_songs.playlist_id = $1`,
      values: [id],
    };
    const resultSong = await this._pool.query(querySong);
    const resultPlaylist = await this._pool.query(queryPlaylist);

    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return {
      ...resultPlaylist.rows[0],
      songs: resultSong.rows,
    };
  }

  async deletePlaylist(id, owner) {
    await this.verifyPlaylistOwner(id, owner);

    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 AND owner = $2 RETURNING id',
      values: [id, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Playlist gagal dihapus');
    }
  }

  async deletePlaylistSongById(playlistId, songId, owner) {
    await this.verifyPlaylistAccess(playlistId, owner);

    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus');
    }

    await this.deletePlaylistSongActivities(playlistId, songId, owner);
  }

  async addPlaylistSongActivities(playlistId, songId, userId) {
    const playlistActivityId = `playlist-activity-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [playlistActivityId, playlistId, songId, userId, 'add'],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambah Activity');
    }
  }

  async deletePlaylistSongActivities(playlistId, songId, userId) {
    const playlistActivityId = `playlist-activity-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [playlistActivityId, playlistId, songId, userId, 'delete'],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambah Activity');
    }
  }

  async getPlaylistSongActivities(id, owner) {
    await this.verifyPlaylistAccess(id, owner);
    const query = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time
      FROM playlist_song_activities
      JOIN songs ON songs.id = playlist_song_activities.song_id
      JOIN users ON users.id = playlist_song_activities.user_id
      WHERE playlist_song_activities.playlist_id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    return result.rows;
  }

  async verifySong(playlistId, songId) {
    const songQuery = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    };

    const playlistQuery = {
      text: 'SELECT * FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlistId, songId],
    };

    const songResult = await this._pool.query(songQuery);
    const playlistResult = await this._pool.query(playlistQuery);

    if (!songResult.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    if (playlistResult.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan lagu. Lagu sudah ada');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyNewPlaylist(name) {
    const query = {
      text: 'SELECT name FROM playlists WHERE name = $1',
      values: [name],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan playlist. Nama sudah digunakan');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
