// 影视数据管理 - 结合TMDB API + 本地缓存 + 本地备选数据
import { Movie, MovieFilter } from '../types/movie';
import tmdbApi, { TMDBMovie } from '../services/tmdb';

// 本地备选数据（当API不可用时使用）
const localBackupMovies: Movie[] = [
  {
    id: '550',
    title: '搏击俱乐部',
    poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    rating: 8.8,
    year: 1999,
    tags: ['剧情', '惊悚', '悬疑'],
    description: '一个患有失眠症的白领遇到肥皂销售员泰勒·德顿后，创立了搏击俱乐部——一个让人们释放压力的地下组织。',
    director: '大卫·芬奇',
    actors: ['布拉德·皮特', '爱德华·诺顿'],
    duration: '139分钟',
    review: '',
  },
  {
    id: '680',
    title: '盗梦空间',
    poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    rating: 8.7,
    year: 2010,
    tags: ['动作', '科幻', '悬疑'],
    description: '柯布是一位经验老道的窃贼，专门从他人内心盗取珍贵的秘密。但是他接到了一个几乎不可能完成的任务：将意念植入别人的潜意识。',
    director: '克里斯托弗·诺兰',
    actors: ['莱昂纳多·迪卡普里奥', '约瑟夫·高登-莱维特'],
    duration: '148分钟',
    review: '',
  },
  {
    id: '238',
    title: '教父',
    poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    rating: 8.7,
    year: 1972,
    tags: ['剧情', '犯罪'],
    description: '维托·唐·柯里昂是黑手党柯里昂家族的首领，带领家族从事非法的勾当，但他内心慈悲为怀、乐善好施。在女儿的婚礼上，他为来宾们点燃复仇之火。',
    director: '弗朗西斯·福特·科波拉',
    actors: ['马龙·白兰度', '阿尔·帕西诺'],
    duration: '175分钟',
    review: '',
  },
  {
    id: '155',
    title: '黑暗骑士',
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    rating: 8.5,
    year: 2008,
    tags: ['动作', '犯罪', '剧情'],
    description: '从亲眼目睹父母被人杀死的小男孩变成蝙蝠侠，他将对付更加强大的敌人。',
    director: '克里斯托弗·诺兰',
    actors: ['克里斯蒂安·贝尔', '希斯·莱杰'],
    duration: '152分钟',
    review: '',
  },
  {
    id: '278',
    title: '肖申克的救赎',
    poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    rating: 8.6,
    year: 1994,
    tags: ['剧情', '犯罪'],
    description: '一场谋杀案使银行家安迪蒙冤入狱，他在肖申克监狱历经磨难，用19年时间挖出一条通往自由的隧道。',
    director: '弗兰克·德拉邦特',
    actors: ['蒂姆·罗宾斯', '摩根·弗里曼'],
    duration: '142分钟',
    review: '',
  },
  {
    id: '13',
    title: '阿甘正传',
    poster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
    rating: 8.5,
    year: 1994,
    tags: ['剧情', '爱情'],
    description: '阿甘是个智商只有75的低能儿，但他拥有一颗单纯的心。在母亲的鼓励下，他"傻人有傻福"地得到上天眷顾，创造出一个又一个奇迹。',
    director: '罗伯特·泽米吉斯',
    actors: ['汤姆·汉克斯', '罗宾·怀特'],
    duration: '142分钟',
    review: '',
  },
  {
    id: '157336',
    title: '星际穿越',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    rating: 8.4,
    year: 2014,
    tags: ['科幻', '冒险', '剧情'],
    description: '在不远的未来，地球环境急剧恶化。库珀等科学家通过土星附近的一个虫洞穿越到更远的星系寻找适合人类生存的星球。',
    director: '克里斯托弗·诺兰',
    actors: ['马修·麦康纳', '安妮·海瑟薇'],
    duration: '169分钟',
    review: '',
  },
  {
    id: '429',
    title: '动作总统',
    poster: 'https://image.tmdb.org/t/p/w500/hgr0gdzMCtF3qfcLkJ3Th3PzS2L.jpg',
    rating: 8.0,
    year: 1993,
    tags: ['动作', '喜剧'],
    description: '特工总统查宁·塔图姆在完成任务后退休，却被迫再次出山拯救世界。',
    director: '大卫·佐克尔',
    actors: ['查宁·塔图姆', '艾玛·斯通'],
    duration: '105分钟',
    review: '',
  },
];

// 内存缓存
let moviesCache: Movie[] = [];
let cacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
let useBackupData = false; // 是否使用备选数据

// TMDB genre_id 到标签名的映射
const genreIdToTag: Record<number, string> = {
  28: '动作',
  12: '冒险',
  16: '动画',
  35: '喜剧',
  80: '犯罪',
  99: '纪录片',
  18: '剧情',
  10751: '家庭',
  14: '奇幻',
  36: '历史',
  27: '恐怖',
  10402: '音乐',
  9648: '悬疑',
  10749: '爱情',
  878: '科幻',
  10770: '电视电影',
  53: '惊悚',
  10752: '战争',
  37: '西部',
};

// 将TMDB数据转换为本地Movie格式
const transformMovie = (tmdbMovie: TMDBMovie): Movie => {
  // 根据genre_ids映射标签
  const tagNames = tmdbMovie.genre_ids
    .map(id => genreIdToTag[id])
    .filter(Boolean);

  return {
    id: String(tmdbMovie.id),
    title: tmdbMovie.title,
    poster: tmdbMovie.poster_path
      ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
      : '',
    rating: tmdbMovie.vote_average,
    year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split('-')[0]) : 0,
    tags: tagNames,
    description: tmdbMovie.overview || '暂无简介',
    director: '未知',
    actors: [],
    duration: '',
    review: '',
  };
};

// 从TMDB获取高分电影
export const getMoviesFromTMDB = async (): Promise<Movie[]> => {
  const now = Date.now();

  // 检查是否应该使用备选数据
  if (useBackupData) {
    console.log('[movies] 使用本地备选数据, 数量:', localBackupMovies.length);
    return localBackupMovies;
  }

  // 检查缓存
  if (moviesCache.length > 0 && now - cacheTime < CACHE_DURATION) {
    console.log('[movies] 使用缓存数据, 数量:', moviesCache.length);
    return moviesCache;
  }

  try {
    console.log('[movies] 开始从TMDB获取数据');
    // 获取多页数据以获得更多电影
    const [page1, page2] = await Promise.all([
      tmdbApi.getTopRatedMovies(1),
      tmdbApi.getTopRatedMovies(2),
    ]);

    const allMovies = [...page1.results, ...page2.results];
    moviesCache = allMovies.map(transformMovie);
    cacheTime = now;
    useBackupData = false; // API成功，重置标志

    console.log('[movies] 获取成功, 数量:', moviesCache.length);
    return moviesCache;
  } catch (error) {
    console.error('[movies] TMDB API 连接失败:', error);
    // API失败时使用备选数据
    useBackupData = true;
    console.log('[movies] 切换到本地备选数据, 数量:', localBackupMovies.length);
    return localBackupMovies;
  }
};

// 根据筛选条件获取电影
export const getFilteredMovies = async (filter: MovieFilter): Promise<Movie[]> => {
  let movies = await getMoviesFromTMDB();

  // 标签筛选
  if (filter.tags && filter.tags.length > 0) {
    movies = movies.filter(movie =>
      filter.tags!.some(tag => movie.tags.includes(tag))
    );
  }

  // 关键词搜索（搜索标题）
  if (filter.keyword) {
    const keyword = filter.keyword.toLowerCase();
    movies = movies.filter(movie =>
      movie.title.toLowerCase().includes(keyword)
    );
  }

  // 评分筛选
  if (filter.minRating) {
    movies = movies.filter(movie => movie.rating >= filter.minRating!);
  }

  return movies;
};

// 根据标签获取推荐电影（标签匹配核心算法）
export const getRecommendedByTags = async (selectedTags: string[]): Promise<Movie[]> => {
  if (selectedTags.length === 0) {
    return getMoviesFromTMDB();
  }

  const movies = await getMoviesFromTMDB();

  // 计算每部电影与选中标签的匹配度
  const scoredMovies = movies.map(movie => {
    const matchCount = movie.tags.filter(tag => selectedTags.includes(tag)).length;
    const matchScore = matchCount / selectedTags.length; // 匹配比例
    return { movie, matchScore };
  });

  // 按匹配度降序排序
  scoredMovies.sort((a, b) => b.matchScore - a.matchScore);

  // 返回匹配度大于0的电影
  return scoredMovies
    .filter(item => item.matchScore > 0)
    .map(item => item.movie);
};

// 获取电影详情
export const getMovieDetail = async (movieId: string): Promise<Movie | null> => {
  const movies = await getMoviesFromTMDB();
  return movies.find(m => m.id === movieId) || null;
};

// 清除缓存
export const clearMoviesCache = () => {
  moviesCache = [];
  cacheTime = 0;
  useBackupData = false;
  console.log('[movies] 缓存已清除');
};
