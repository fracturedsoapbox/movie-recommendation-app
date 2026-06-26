// TMDB API 服务
// 文档: https://developer.themoviedb.org/docs

const API_KEY = 'b00c2bfccd7f1efbd893266452d1309c';
const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
  genre_ids: number[];
}

export interface TMDBMovieDetail extends TMDBMovie {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

const request = (url: string, method: string = 'GET'): Promise<any> => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: method,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP error! status: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

const tmdbApi = {
  getTopRatedMovies: async (page = 1): Promise<TMDBResponse> => {
    return request(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=zh-CN&page=${page}`);
  },

  getPopularMovies: async (page = 1): Promise<TMDBResponse> => {
    return request(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=zh-CN&page=${page}`);
  },

  getNowPlayingMovies: async (page = 1): Promise<TMDBResponse> => {
    return request(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=zh-CN&page=${page}`);
  },

  getMovieDetail: async (movieId: number): Promise<TMDBMovieDetail> => {
    return request(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=zh-CN`);
  },

  searchMovies: async (query: string, page = 1): Promise<TMDBResponse> => {
    return request(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=zh-CN&query=${encodeURIComponent(query)}&page=${page}`);
  },

  getGenres: async (): Promise<{ genres: { id: number; name: string }[] }> => {
    return request(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=zh-CN`);
  }
};

export default tmdbApi;
