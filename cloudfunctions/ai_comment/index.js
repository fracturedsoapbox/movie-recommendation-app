/**
 * ============================================================
 * AI趣味影评生成云函数 - index.js
 * 基于微信CloudBase云开发 + TRAE IDE内置大模型
 * 适配「基于标签匹配的高分影视推荐+AI趣味影评小程序」项目
 * ============================================================
 */

// ==================== 云环境初始化 ====================
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 初始化为当前动态环境
});
const db = cloud.database();

// ==================== 配置常量 ====================
const STYLE_ENUM = ['搞笑吐槽', '文艺走心', '硬核解析', '朋友圈短句']; // 影评风格枚举列表
const COUNT_MIN = 1; // 每条影评最小数量
const COUNT_MAX = 5; // 每条影评最大数量
const COUNT_DEFAULT = 3; // 默认生成数量
const RATE_LIMIT_MAX = 5; // 单用户1分钟最大调用次数
const RATE_LIMIT_WINDOW = 60 * 1000; // 限流时间窗口（1分钟=60000毫秒）
const RATE_LIMIT_COLLECTION = 'temp_limit'; // 限流数据存储集合
const COMMENT_COLLECTION = 'comment_temp'; // 影评记录存储集合

// ==================== 限流控制模块 ====================
/**
 * 检查用户调用频率是否超限
 * @param {string} openid - 用户openid
 * @returns {Promise<{allowed: boolean, msg: string}>}
 */
async function checkRateLimit(openid) {
  try {
    const now = Date.now();
    const limitCollection = db.collection(RATE_LIMIT_COLLECTION);
    
    // 清理过期记录（只保留1分钟内的记录）
    await limitCollection.where({
      openid: openid,
      createTime: db.command.lt(now - RATE_LIMIT_WINDOW)
    }).remove();
    
    // 查询当前用户最近的调用记录
    const countResult = await limitCollection.where({
      openid: openid,
      createTime: db.command.gte(now - RATE_LIMIT_WINDOW)
    }).count();
    
    const currentCount = countResult.total;
    
    // 判断是否超限
    if (currentCount >= RATE_LIMIT_MAX) {
      return {
        allowed: false,
        msg: '操作过于频繁，请1分钟后重试'
      };
    }
    
    // 记录本次调用
    await limitCollection.add({
      data: {
        openid: openid,
        createTime: now
      }
    });
    
    return { allowed: true, msg: '' };
  } catch (error) {
    console.error('【限流检查异常】', error);
    // 限流异常时放行，但打印警告日志
    return { allowed: true, msg: '' };
  }
}

// ==================== 参数校验模块 ====================
/**
 * 校验前端传入参数完整性
 * @param {object} params - 前端传入参数
 * @returns {object} 校验结果
 */
function validateParams(params) {
  const { movieName, movieDesc, style, count } = params || {};
  
  // 校验movieName：必填，字符串，长度1-50
  if (!movieName || typeof movieName !== 'string' || movieName.trim().length === 0) {
    return { valid: false, code: -100, msg: '缺少必填参数：movieName（影视名称）' };
  }
  if (movieName.trim().length > 50) {
    return { valid: false, code: -100, msg: 'movieName（影视名称）长度不能超过50字符' };
  }
  
  // 校验movieDesc：字符串，长度0-800
  if (movieDesc !== undefined && movieDesc !== null && typeof movieDesc !== 'string') {
    return { valid: false, code: -100, msg: 'movieDesc（影视简介）必须为字符串类型' };
  }
  if (movieDesc && movieDesc.length > 800) {
    return { valid: false, code: -100, msg: 'movieDesc（影视简介）长度不能超过800字符' };
  }
  
  // 校验style：必填，仅允许4个固定枚举值
  if (!style || typeof style !== 'string') {
    return { valid: false, code: -100, msg: '缺少必填参数：style（影评风格）' };
  }
  if (!STYLE_ENUM.includes(style)) {
    return { 
      valid: false, 
      code: -100, 
      msg: `style（影评风格）非法，可选值：${STYLE_ENUM.join(' / ')}` 
    };
  }
  
  // 校验count：数字，取值范围1~5，超出自动修正为3
  let validCount = COUNT_DEFAULT;
  if (count !== undefined && count !== null) {
    if (typeof count !== 'number' || isNaN(count)) {
      return { valid: false, code: -100, msg: 'count（生成条数）必须为数字类型' };
    }
    validCount = Math.max(COUNT_MIN, Math.min(COUNT_MAX, Math.floor(count)));
  }
  
  return { valid: true, validCount };
}

// ==================== 安全内容校验模块 ====================
/**
 * 调用微信msgSecCheck进行内容安全检测
 * @param {string} content - 待检测文本内容
 * @returns {Promise<{passed: boolean, msg: string}>}
 */
async function checkContentSecurity(content) {
  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: content,
      scene: 2, // 社区场景
      version: 2
    });
    
    console.log('【安全校验结果】', JSON.stringify(result));
    
    if (result.errCode === 0) {
      return { passed: true, msg: '' };
    }
    
    // suggest为risky或block时视为不通过
    if (result.suggest === 'risky' || result.suggest === 'block') {
      return { passed: false, msg: '影视内容包含违规信息，无法生成影评' };
    }
    
    return { passed: true, msg: '' };
  } catch (error) {
    console.error('【安全校验异常】', error);
    // 安全校验异常时，根据错误码判断是否放行
    if (error.errCode === 87014) {
      return { passed: false, msg: '影视内容包含违规信息，无法生成影评' };
    }
    // 其他异常情况放行，避免阻塞正常业务流程
    return { passed: true, msg: '' };
  }
}

/**
 * 对单条影评进行内容安全二次检测
 * @param {string} review - 单条影评文本
 * @returns {Promise<boolean>} true=合规，false=违规
 */
async function checkSingleReviewSecurity(review) {
  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: review,
      scene: 2,
      version: 2
    });
    
    if (result.errCode === 0) {
      return true;
    }
    
    return result.suggest === 'pass';
  } catch (error) {
    console.error('【单条影评校验异常】', error);
    // 异常时默认放行，避免过度拦截
    return true;
  }
}

// ==================== AI模型调用模块 ====================
/**
 * 获取分风格System Prompt
 * @param {string} style - 影评风格
 * @returns {string} 完整的system prompt
 */
function getStyleSystemPrompt(style) {
  // 通用基础角色设定（所有风格共用）
  const baseRole = `你是资深影视趣味影评博主，熟悉电影、电视剧、动漫，禁止过度剧透核心结局，语言生活化、有网感、不生硬，无学术晦涩词汇，每一段独立完整，段落简短易复制，不出现敏感暴力、色情、政治、引战内容。`;

  // 分风格强制输出规则
  const styleRules = {
    '搞笑吐槽': `输出规则：玩梗、幽默犀利、自嘲式吐槽、轻松搞笑，适合发短视频评论，单段80-150字。`,
    '文艺走心': `输出规则：细腻共情、氛围感强、侧重情绪与影片内核、温柔治愈，适合小红书文案，单段100-200字。`,
    '硬核解析': `输出规则：客观分析镜头、叙事逻辑、人物隐喻、导演巧思，理性客观，少量专业术语，单段120-220字。`,
    '朋友圈短句': `输出规则：极简金句、短句分行、适合配图发朋友圈，单段30-80字，短小精炼。`
  };

  return `${baseRole}${styleRules[style] || styleRules['搞笑吐槽']}`;
}

/**
 * 组装用户输入消息
 * @param {string} movieName - 影视名称
 * @param {string} movieDesc - 影视简介
 * @param {string} style - 影评风格
 * @param {number} count - 生成数量
 * @returns {string} 用户消息内容
 */
function buildUserMessage(movieName, movieDesc, style, count) {
  return `影视名称：${movieName}
影片简介：${movieDesc || '暂无简介'}
需要生成风格：${style}
需要生成${count}条独立影评，严格仅输出JSON字符串数组，禁止额外内容。`;
}

/**
 * 调用TRAE内置大模型生成影评
 * @param {string} movieName - 影视名称
 * @param {string} movieDesc - 影视简介
 * @param {string} style - 影视风格
 * @param {number} count - 生成数量
 * @returns {Promise<string[]>} 生成的影评数组
 */
async function generateReviewsWithAI(movieName, movieDesc, style, count) {
  const startTime = Date.now();
  
  // 组装messages数组
  const messages = [
    { role: 'system', content: getStyleSystemPrompt(style) },
    { role: 'user', content: buildUserMessage(movieName, movieDesc, style, count) }
  ];
  
  console.log('【AI调用参数】', JSON.stringify({
    messages: messages,
    temperature: 0.85,
    max_tokens: 1200
  }));
  
  // 调用TRAE内置大模型对话接口
  // 使用cloud.openapi.callContainer调用TRAE封装的大模型接口
  const response = await cloud.openapi.callContainer({
    service: 'trae',
    path: '/v1/chat/completions',
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    data: {
      messages: messages,
      temperature: 0.85,
      max_tokens: 1200
    }
  });
  
  const duration = Date.now() - startTime;
  console.log('【AI调用耗时】', `${duration}ms`);
  
  if (!response || !response.data || !response.data.choices || !response.data.choices[0]) {
    throw new Error('AI模型返回数据格式异常');
  }
  
  // 提取AI返回的原始文本内容
  let rawContent = response.data.choices[0].message.content;
  console.log('【AI原始输出】', rawContent);
  
  // 清洗多余符号、换行、注释，提取纯JSON数组
  return extractJsonArray(rawContent);
}

/**
 * 从AI输出中提取纯JSON数组
 * @param {string} rawContent - AI原始输出
 * @returns {string[]} 解析后的影评数组
 */
function extractJsonArray(rawContent) {
  // 移除markdown代码块标记
  let cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // 移除注释行
  cleaned = cleaned.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // 去除首尾空白
  cleaned = cleaned.trim();
  
  // 尝试直接解析
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item));
    }
  } catch (e) {
    // 解析失败，尝试提取数组部分
  }
  
  // 尝试提取JSON数组部分
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item));
      }
    } catch (e) {
      console.error('【JSON提取解析失败】', e);
    }
  }
  
  throw new Error('AI返回内容无法解析为JSON数组');
}

/**
 * 带重试机制的AI生成函数
 * @param {string} movieName - 影视名称
 * @param {string} movieDesc - 影视简介
 * @param {string} style - 影评风格
 * @param {number} count - 生成数量
 * @returns {Promise<string[]>} 生成的影评数组
 */
async function generateReviewsWithRetry(movieName, movieDesc, style, count) {
  let lastError = null;
  
  // 最多尝试2次
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`【AI生成尝试】第${attempt}次`);
      return await generateReviewsWithAI(movieName, movieDesc, style, count);
    } catch (error) {
      lastError = error;
      console.error(`【AI生成失败】第${attempt}次:`, error.message);
      if (attempt === 1) {
        console.log('【准备重试】');
      }
    }
  }
  
  throw lastError;
}

// ==================== 数据存储模块 ====================
/**
 * 保存影评生成记录到云数据库
 * @param {string} openid - 用户openid
 * @param {string} movieName - 影视名称
 * @param {string} style - 影评风格
 * @param {string[]} reviewList - 生成的影评数组
 */
async function saveCommentRecord(openid, movieName, style, reviewList) {
  try {
    await db.collection(COMMENT_COLLECTION).add({
      data: {
        openid: openid,
        movieName: movieName,
        style: style,
        reviewList: reviewList,
        createTime: Date.now()
      }
    });
    console.log('【记录存储成功】', `openid: ${openid}, movieName: ${movieName}`);
  } catch (error) {
    // 记录存储失败不影响主流程，仅打印警告
    console.warn('【记录存储失败】', error.message);
  }
}

// ==================== 主入口云函数 ====================
/**
 * 云函数入口：生成AI趣味影评
 * @param {object} event - 前端传入参数
 * @param {string} event.movieName - 影视名称（必填）
 * @param {string} event.movieDesc - 影视简介（可选）
 * @param {string} event.style - 影评风格（必填）
 * @param {number} event.count - 生成数量（可选，默认3）
 */
exports.main = async (event, context) => {
  console.log('【云函数入参】', JSON.stringify(event));
  console.log('【用户调用环境】', context.appid);
  
  try {
    // ==================== 第1步：获取用户openid ====================
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID || wxContext.openid;
    
    if (!openid) {
      return { code: -100, msg: '无法获取用户身份，请检查登录状态' };
    }
    
    console.log('【用户openid】', openid);
    
    // ==================== 第2步：参数校验 ====================
    const validateResult = validateParams(event);
    if (!validateResult.valid) {
      return { code: validateResult.code, msg: validateResult.msg };
    }
    
    const validCount = validateResult.validCount;
    console.log('【参数校验通过】', `movieName: ${event.movieName}, style: ${event.style}, count: ${validCount}`);
    
    // ==================== 第3步：限流检查 ====================
    const rateLimitResult = await checkRateLimit(openid);
    if (!rateLimitResult.allowed) {
      return { code: -300, msg: rateLimitResult.msg };
    }
    
    // ==================== 第4步：内容安全校验（合并movieName+movieDesc） ====================
    const combinedContent = `${event.movieName} ${event.movieDesc || ''}`;
    const securityResult = await checkContentSecurity(combinedContent);
    
    if (!securityResult.passed) {
      return { code: -1, msg: securityResult.msg };
    }
    
    console.log('【内容安全校验通过】');
    
    // ==================== 第5步：AI生成影评（带重试机制） ====================
    let reviewList;
    try {
      reviewList = await generateReviewsWithRetry(
        event.movieName.trim(),
        event.movieDesc ? event.movieDesc.trim() : '',
        event.style,
        validCount
      );
    } catch (aiError) {
      console.error('【AI生成异常】', aiError.message);
      return { code: -200, msg: `AI模型调用失败：${aiError.message}，请稍后重试` };
    }
    
    console.log('【AI生成影评条数】', reviewList.length);
    
    // ==================== 第6步：AI结果二次内容过滤 ====================
    const filteredReviews = [];
    for (const review of reviewList) {
      const isSafe = await checkSingleReviewSecurity(review);
      if (isSafe) {
        filteredReviews.push(review);
      } else {
        console.warn('【单条影评违规已剔除】', review.substring(0, 50));
      }
    }
    
    // 兜底：如果过滤后为空，补充一条默认文案
    if (filteredReviews.length === 0) {
      filteredReviews.push(`这部《${event.movieName}》真的很有意思，推荐大家去看看！`);
    }
    
    console.log('【二次过滤后影评条数】', filteredReviews.length);
    
    // ==================== 第7步：存储记录 ====================
    await saveCommentRecord(openid, event.movieName, event.style, filteredReviews);
    
    // ==================== 第8步：返回成功结果 ====================
    return {
      code: 0,
      msg: '影评生成成功',
      data: {
        movieName: event.movieName,
        style: event.style,
        reviewList: filteredReviews,
        createTime: Date.now()
      }
    };
    
  } catch (error) {
    // ==================== 全链路异常捕获 ====================
    console.error('【云函数异常】', error);
    return {
      code: -200,
      msg: `服务异常：${error.message || '未知错误'}，请稍后重试`
    };
  }
};