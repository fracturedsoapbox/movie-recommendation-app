// 影视服务
import { Movie, MovieFilter, MovieListResponse } from '../types/movie';
import { getFilteredMovies, getMovieDetail } from '../data/movies';

class MovieService {
  // 获取影视列表
  async getMovies(filter: MovieFilter = {}, page: number = 1, pageSize: number = 10): Promise<MovieListResponse> {
    try {
      console.log('[MovieService] Get movies with filter:', filter, 'page:', page);

      // 使用新的筛选函数
      let filteredMovies = await getFilteredMovies(filter);

      // 分页
      const total = filteredMovies.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const list = filteredMovies.slice(start, end);
      const hasMore = end < total;

      console.log('[MovieService] Return movies:', list.length, 'total:', total);

      return {
        list,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[MovieService] Get movies failed:', error);
      throw error;
    }
  }

  // 获取影视详情
  async getMovieDetail(id: string): Promise<Movie | null> {
    try {
      console.log('[MovieService] Get movie detail:', id);
      return await getMovieDetail(id);
    } catch (error) {
      console.error('[MovieService] Get movie detail failed:', error);
      throw error;
    }
  }
}

export default new MovieService();
