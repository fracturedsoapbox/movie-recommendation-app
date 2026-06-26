// AI影评服务 - 调用外部AI API生成趣味影评
declare const wx: any;

const AI_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const AI_API_KEY = 'b00c2bfccd7f1efbd893266452d1309c'; // 需要填写你的API Key

const STYLE_PROMPTS = {
  搞笑吐槽: '用幽默吐槽的风格，夸张地评价这部电影，找出它的槽点，但不失可爱。语言要轻松搞笑，让人不禁笑出声。控制在80字以内。',
  文艺走心: '用文艺小清新的风格，走心地评价这部电影，文字要优美有意境，让人感受到你对电影的深情。控制在100字以内。',
  硬核解析: '用专业影评人的风格，深入分析这部电影的主题、镜头语言、表演等方面，展现你的专业素养。控制在120字以内。',
  朋友圈短句: '像发朋友圈一样，用简短精炼的句子评价这部电影，要有趣、有梗，让人想点赞。控制在50字以内。'
};

const REVIEW_TEMPLATES: Record<string, string[]> = {
  'default': [
    '这部电影简直是视觉盛宴，每一帧都能当壁纸！看完感觉自己升华了，精神得到了洗礼！',
    '剧情紧凑，节奏把控堪称完美。两个多小时一点都不会觉得无聊，全程高能！',
    '演员的表演太炸裂了，每一个眼神都是戏。这种投入感，真的让人沉浸其中无法自拔！',
    '年度最佳预定！不仅故事讲得好，主题深度也够，看完还能让人回味好久。',
    '看完只想说：太牛了！导演的镜头语言和叙事节奏简直是教科书级别的。'
  ],
  '搞笑吐槽': [
    '这电影啊，看得我一愣一愣的。说好看吧，好像也就那样；说难看吧，又有点意思。反正就是那种让人纠结的神奇存在！',
    '我原本以为是烂片，结果看得停不下来；我原本以为是神作，结果又想打导演。这部电影就是这么魔性！',
    '看完最大的感受就是：我钱怎么这么好赚！各种套路轮番上阵，偏偏我还就吃这套，绝了！'
  ],
  '文艺走心': [
    '如同一杯陈年老酒，越品越有味道。那些细腻的情感，在光影间缓缓流淌，直抵人心最柔软的角落。',
    '在这个快节奏的时代，这部电影像一阵温柔的风，轻轻拂过心田，带走了所有的烦躁与不安。',
    '每一帧画面都是一首诗，每一个音符都是一滴泪。这不只是一部电影，这是一次灵魂的对话。'
  ],
  '硬核解析': [
    '从叙事结构来看，影片采用了非线性剪辑手法，将时间线打碎重组，形成了独特的叙事张力。这种处理方式与主题形成了完美的呼应。',
    '导演在视觉呈现上展现了极高的艺术追求，大量使用冷暖色调对比来烘托人物内心世界，同时长镜头的运用也增强了影片的沉浸感。',
    '影片的剧本结构堪称教科书级别，每一场戏都服务于人物弧线的建构，没有一丝冗余。这种剧本完成度在商业片中实属难得。'
  ],
  '朋友圈短句': [
    '绝了👍这部电影我要吹爆！',
    '看完emo了...后劲太大',
    '今年最佳！没有之一',
    '救命！太好看了555',
    '值回票价，不接受反驳'
  ]
};

const getRandomReview = (style?: string): string => {
  let templates = REVIEW_TEMPLATES['default'];
  
  if (style && REVIEW_TEMPLATES[style]) {
    templates = REVIEW_TEMPLATES[style];
  } else {
    const allStyles = Object.keys(REVIEW_TEMPLATES);
    const randomStyle = allStyles[Math.floor(Math.random() * allStyles.length)];
    templates = REVIEW_TEMPLATES[randomStyle];
  }
  
  return templates[Math.floor(Math.random() * templates.length)];
};

const wxRequest = (url: string, options: { method?: string; headers?: Record<string, string>; data?: any }): Promise<any> => {
  return new Promise((resolve, reject) => {
    (wx as any).request({
      url: url,
      method: options.method || 'GET',
      header: options.headers,
      data: options.data,
      success: (res: any) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP error! status: ${res.statusCode}`));
        }
      },
      fail: (err: any) => {
        reject(err);
      }
    });
  });
};

export const generateAIReview = async (
  movieName: string,
  style: string = 'default'
): Promise<{ success: boolean; review: string; error?: string }> => {
  if (!AI_API_KEY) {
    console.log('[AIReview] No API Key, using local template');
    return {
      success: true,
      review: getRandomReview(style)
    };
  }

  try {
    const styleKey = style as keyof typeof STYLE_PROMPTS;
    const stylePrompt = STYLE_PROMPTS[styleKey] || '用幽默有趣的风格为这部电影生成一段影评，控制在100字以内。';
    
    const data = await wxRequest(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [{
          role: 'user',
          content: `你是一位幽默风趣的影评人，请为电影"${movieName}"生成一段有趣的电影评论。
          
要求：
1. 语言要生动有趣，让人印象深刻
2. 结合电影类型和特点来写
3. ${stylePrompt}
4. 直接输出评论内容，不要其他解释`
        }],
        temperature: 0.8,
        max_tokens: 200
      })
    });

    const review = data.choices?.[0]?.message?.content?.trim() || getRandomReview(style);

    return {
      success: true,
      review
    };
  } catch (error) {
    console.error('[AIReview] API call failed:', error);
    return {
      success: true,
      review: getRandomReview(style)
    };
  }
};

export const getReviewStyles = () => {
  return [
    { key: 'default', name: '随机风格', emoji: '🎲' },
    { key: '搞笑吐槽', name: '搞笑吐槽', emoji: '😂' },
    { key: '文艺走心', name: '文艺走心', emoji: '🌸' },
    { key: '硬核解析', name: '硬核解析', emoji: '🔍' },
    { key: '朋友圈短句', name: '朋友圈短句', emoji: '📱' }
  ];
};

export default {
  generateAIReview,
  getReviewStyles
};
