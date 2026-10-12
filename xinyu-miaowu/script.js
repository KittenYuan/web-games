// 游戏状态管理
let gameState = {
    currentScene: 0,
    currentDialogue: 0,
    isTyping: false,
    isCollecting: false,    // 新增：是否正在收集物品（冷却状态）
    playerChoices: {
        emotion: null,      // A: 疲惫, B: 紧张, C: 思念
        response: null,     // A: 积极, B: 倾诉, C: 寻求安慰
        insight: null,      // A: 轻松, B: 方法, C: 感谢
        foundItems: []      // 收集到的所有物品
    },
    collectionProgress: {
        tired: [],
        nervous: [],
        missing: []
    },
    audioEnabled: true,
};

// 高性能视频优化管理器
const videoOptimizer = {
    isOptimized: false,
    videoCache: new Map(),
    performanceMonitor: null,
    
    // 设备性能检测
    detectDevicePerformance() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        
        return {
            hasWebGL: !!gl,
            isMobile,
            cores,
            memory,
            isLowEnd: isMobile && memory < 4,
            isHighEnd: !isMobile && cores >= 8 && memory >= 8
        };
    },
    
    // 核心视频优化函数
    optimizeVideoPlayback() {
        if (this.isOptimized) {
            console.log('🎬 视频已优化，跳过重复优化');
            return;
        }
        
        console.log('🎬 开始高性能视频优化...');
        const performance = this.detectDevicePerformance();
        const videos = document.querySelectorAll('.video-background, .exploration-video');
        
        videos.forEach((video, index) => {
            this.optimizeSingleVideo(video, performance, index);
        });
        
        this.startPerformanceMonitoring();
        this.isOptimized = true;
        const intro = document.querySelector('#scene-0.active .video-background, #intro-video');
        if (intro) {
            intro.muted = true;
            intro.playsInline = true;
            const tryPlay = () => intro.play().catch(() => {});
            if (intro.readyState >= 2) tryPlay();
            else intro.addEventListener('canplay', tryPlay, { once: true });
            tryPlay();
        }
        console.log('✅ 视频优化完成');
    },
    
    // 优化单个视频
    optimizeSingleVideo(video, performance, index) {
        // 移除旧的事件监听器，避免重复绑定
        this.removeOldListeners(video);
        
        // 基础设置
        this.setBasicVideoProperties(video, performance);
        
        // 高级渲染优化
        this.applyRenderingOptimizations(video, performance);
        
        // 智能预加载策略
        this.setupSmartPreloading(video, performance);
        
        // 高性能事件监听
        this.setupOptimizedEventListeners(video);
        
        // 缓存视频信息
        this.videoCache.set(video.src, {
            element: video,
            index,
            lastUpdate: Date.now(),
            performance: performance
        });
    },
    
    // 设置基础视频属性
    setBasicVideoProperties(video, performance) {
        // 基础播放设置
        video.defaultMuted = true;
        video.muted = true;
        video.loop = true;
        video.autoplay = false;
        video.playsInline = true;
        video.controls = false;
        video.disablePictureInPicture = true;
        
        // 如果场景容器已经在视口附近，尽快启动首屏视频读取。
        const scene = video.closest('.scene');
        const isActiveScene = scene && scene.classList.contains('active');
        video.preload = isActiveScene ? 'auto' : 'none';
        
        // 播放速率优化
        video.playbackRate = 1.0;
        
        // 移动端特殊设置
        if (performance.isMobile) {
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('x-webkit-airplay', 'deny');
            video.playsInline = true;
            video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
        }
    },
    
    // 应用高级渲染优化
    applyRenderingOptimizations(video, performance) {
        const style = video.style;
        
        // GPU硬件加速
        style.transform = 'translateZ(0)';
        style.backfaceVisibility = 'hidden';
        style.perspective = '1000px';
        style.willChange = 'transform, opacity';
        
        // 渲染优化
        style.imageRendering = 'optimizeSpeed';
        if (performance.isLowEnd) {
            style.imageRendering = 'pixelated'; // 低端设备使用像素化渲染
        } else {
            style.imageRendering = '-webkit-optimize-contrast';
        }
        
        // 合成层优化
        style.isolation = 'isolate';
        style.transformStyle = 'preserve-3d';
        
        // 内存和性能优化
        if (performance.isLowEnd) {
            style.filter = 'none'; // 移除所有滤镜
            style.opacity = '0.95'; // 轻微透明度减少渲染负担
        }
        
        // 视频容器优化
        const container = video.parentElement;
        if (container) {
            container.style.transform = 'translateZ(0)';
            container.style.willChange = 'transform';
        }
    },
    
    // 智能预加载策略
    setupSmartPreloading(video, performance) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 视频进入视口时开始预加载
                    if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) {
                        video.load();
                    }
                } else if (!performance.isHighEnd) {
                    // 低端设备在视频离开视口时暂停
                    const scene = video.closest('.scene');
                    if (scene && !scene.classList.contains('active')) {
                        video.pause();
                    }
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });
        
        observer.observe(video);
    },
    
    // 设置优化的事件监听器
    setupOptimizedEventListeners(video) {
        // 使用防抖的事件处理
        const debouncedRestart = this.debounce(() => {
            this.restartVideoPlayback(video);
        }, 1000);
        
        // 加载完成事件
        video.addEventListener('loadeddata', () => {
            console.log(`📹 视频加载完成: ${video.src.split('/').pop()}`);
            video.currentTime = 0;
        }, { once: true });
        
        // 可以流畅播放事件
        video.addEventListener('canplaythrough', () => {
            console.log(`✅ 视频可流畅播放: ${video.src.split('/').pop()}`);
            video.loop = true;
        }, { once: true });
        
        // 播放结束事件（双重保险）
        video.addEventListener('ended', () => {
            video.currentTime = 0;
            const scene = video.closest('.scene');
            if (scene && scene.classList.contains('active')) {
                video.play().catch(e => console.log('循环播放失败:', e));
            }
        });
        
        // 错误处理
        video.addEventListener('error', (e) => {
            console.error(`❌ 视频错误: ${video.src.split('/').pop()}`, e);
            debouncedRestart();
        });
        
        // 卡顿检测和处理
        video.addEventListener('waiting', () => {
            console.log(`⏳ 视频缓冲: ${video.src.split('/').pop()}`);
        });
        
        // 暂停事件处理
        video.addEventListener('pause', (e) => {
            // 只在非用户操作时自动恢复
            if (!e.isTrusted) {
                setTimeout(() => {
                    const scene = video.closest('.scene');
                    if (scene && scene.classList.contains('active') && video.readyState >= 2) {
                        video.play().catch(e => console.log('自动恢复播放失败:', e));
                    }
                }, 200);
            }
        });
        
        // 时间更新优化（减少频率）
        let timeUpdateCount = 0;
        video.addEventListener('timeupdate', () => {
            timeUpdateCount++;
            if (timeUpdateCount % 10 === 0) { // 每10次更新才检查一次
                if (video.duration && video.currentTime > video.duration - 0.2) {
                    video.currentTime = 0;
                }
            }
        });
    },
    
    // 不要 clone 视频节点：克隆会中断开场视频，表现为先卡一下再重新出现
    removeOldListeners(video) {
        return video;
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 重启视频播放
    restartVideoPlayback(video) {
        console.log(`🔄 重启视频: ${video.src.split('/').pop()}`);
        video.pause();
        video.currentTime = 0;
        video.load();
        
        setTimeout(() => {
            const scene = video.closest('.scene');
            if (scene && scene.classList.contains('active')) {
                video.play().catch(e => console.log('重启播放失败:', e));
            }
        }, 200);
    },
    
    // 性能监控
    startPerformanceMonitoring() {
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
        }
        
        this.performanceMonitor = setInterval(() => {
            this.checkVideoPerformance();
        }, 15000); // 每15秒检查一次
    },
    
    // 检查视频性能
    checkVideoPerformance() {
        const activeVideos = document.querySelectorAll('.video-background.active, .exploration-video.active');
        
        activeVideos.forEach(video => {
            const scene = video.closest('.scene');
            const isSceneActive = scene && scene.classList.contains('active');
            
            if (isSceneActive) {
                // 检查视频状态
                if (video.paused && video.readyState >= 2) {
                    video.play().catch(() => {});
                }
                
                // 检查播放时间异常
                if (video.currentTime === 0 && !video.paused) {
                    setTimeout(() => {
                        if (video.currentTime === 0) {
                            this.restartVideoPlayback(video);
                        }
                    }, 1000);
                }
            }
        });
    },
    
    // 智能视频切换
    switchVideo(fromVideo, toVideo) {
        console.log('🔄 智能视频切换');
        
        // 暂停旧视频
        if (fromVideo) {
            fromVideo.pause();
            fromVideo.currentTime = 0;
        }
        
        // 启动新视频
        if (toVideo) {
            toVideo.preload = 'auto';
            toVideo.currentTime = 0;
            if (toVideo.networkState === HTMLMediaElement.NETWORK_EMPTY) toVideo.load();
            toVideo.play().catch(() => {});
        }
    },
    
    // 清理资源
    cleanup() {
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
            this.performanceMonitor = null;
        }
        this.videoCache.clear();
        this.isOptimized = false;
    }
};

// 强制重启视频播放
function restartVideoPlayback(videoElement) {
    videoOptimizer.restartVideoPlayback(videoElement);
}

// 高性能页面加载优化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 页面加载完成，开始高性能优化...');
    
    // 延迟优化视频，避免阻塞页面渲染
    setTimeout(() => {
        videoOptimizer.optimizeVideoPlayback();
    }, 500);
    
    // 页面可见性检测，暂停不可见页面的视频
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('📱 页面隐藏，暂停所有视频');
            document.querySelectorAll('.video-background, .exploration-video').forEach(video => {
                if (!video.paused) {
                    video.pause();
                    video.dataset.wasPlaying = 'true';
                }
            });
        } else {
            console.log('📱 页面可见，恢复视频播放');
            setTimeout(() => {
                document.querySelectorAll('.video-background, .exploration-video').forEach(video => {
                    const scene = video.closest('.scene');
                    if (video.dataset.wasPlaying === 'true' && scene && scene.classList.contains('active')) {
                        video.play().catch(e => console.log('恢复播放失败:', e));
                        delete video.dataset.wasPlaying;
                    }
                });
            }, 300);
        }
    });
    
    // 内存压力检测和清理
    if ('memory' in performance) {
        setInterval(() => {
            if (performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.8) {
                console.log('⚠️ 内存使用过高，触发垃圾回收');
                // 触发垃圾回收的操作
                if (window.gc) {
                    window.gc();
                }
            }
        }, 60000);
    }
});

// 视觉小说对话数据
const vnDialogues = {
    scene1: [
        {
            speaker: "猫导师",
            text: "（在角落安静地看着书，翻页的声音轻柔...）",
            characterState: "reading"
        },
        {
            speaker: "猫导师", 
            text: "...嗯？",
            characterState: "transition"
        },
        {
            speaker: "猫导师",
            text: "喵呜~ 欢迎你，旅行者。",
            characterState: "talking"
        },
        {
            speaker: "猫导师",
            text: '猫导师合上书，往旁边挪出一个位置。你可以先坐一会儿。',
            characterState: "talking"
        },
        {
            speaker: "猫导师",
            text: "请坐，这里很安全。你想要分享什么呢？",
            characterState: "talking",
            showChoices: true
        }
    ],
    scene2: {
        A: [ // 疲惫
            {
                speaker: "猫导师",
                text: "啊，能量的小风车需要一点润滑剂了。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "没关系，偶尔停下来，听听树叶的低语也是必要的喵。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "或许我们可以一起找找，是什么暂时卡住了它？",
                characterState: "talking",
                showChoices: true,
                choices: [
                    "我想试试让它转起来！",
                    "其实是因为...最近睡不好",
                    "嗯...就是想听听你的声音"
                ]
            }
        ],
        B: [ // 紧张
            {
                speaker: "猫导师",
                text: "小小的紧张感，像爪子上沾了水珠，有点不自在喵。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "让我们轻轻抖落它，或者...把它变成闪亮的露珠？",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "你愿意和我说说，那让你心弦微颤的小挑战是什么吗？",
                characterState: "talking",
                showChoices: true,
                choices: [
                    "我想试试面对它！",
                    "其实是因为...怕自己搞砸",
                    "嗯...就是想找个地方躲躲"
                ]
            }
        ],
        C: [ // 思念
            {
                speaker: "猫导师",
                text: "思念是心头暖暖的小烛火，有时也会带来一丝微风般的凉意喵。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "那个温暖的人，一定也在某个地方闪耀着光芒。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "我们可以让这份思念变得更轻盈一些。",
                characterState: "talking",
                showChoices: true,
                choices: [
                    "我想试试做点什么！",
                    "其实是因为...很久没联系了",
                    "嗯...就是想感受一点温暖"
                ]
            }
        ]
    },
    scene4: {
        A: [ // 疲惫 → 轻松
            {
                speaker: "猫导师",
                text: "你回来了喵~ 看起来...小风车好像开始慢慢转动了呢。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "感觉好些了吗？小小的风车找到了风... 每一次倾听自己的心音，都是了不起的成长喵。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "现在，让我们把这份平静的力量，凝聚成一个温暖的小伙伴吧~",
                characterState: "talking",
                showChoices: true
            }
        ],
        B: [ // 紧张 → 勇敢
            {
                speaker: "猫导师",
                text: "你回来了喵~ 看起来那些水珠已经变成了闪亮的露珠呢。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "感觉好些了吗？露珠映出了彩虹... 每一次面对不安，都让内心更加坚强喵。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "现在，让我们把这份勇气的力量，凝聚成一个陪伴你的小伙伴吧~",
                characterState: "talking",
                showChoices: true
            }
        ],
        C: [ // 思念 → 温暖
            {
                speaker: "猫导师",
                text: "你回来了喵~ 看起来那团小烛火变得更加温暖明亮了呢。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "感觉好些了吗？烛火温暖了掌心... 每一份思念，都是心中珍贵的光芒喵。",
                characterState: "talking"
            },
            {
                speaker: "猫导师",
                text: "现在，让我们把这份温暖的力量，凝聚成一个守护你的小伙伴吧~",
                characterState: "talking",
                showChoices: true
            }
        ]
    }
};

['A', 'B', 'C'].forEach(emotion => {
    const opening = {
        A: '累的时候，小风车也可以停下来。今天不用急着把所有事做完。',
        B: '明天的事还没发生，身体却已经绷紧了。我们先让肩膀松一点。',
        C: '想起一个人时，心里可能同时有暖意和难受。你不用只留下其中一种。'
    }[emotion];
    vnDialogues.scene2[emotion] = [
        { speaker: '猫导师', text: opening, characterState: 'talking' },
        { speaker: '猫导师', text: '现在，你更需要哪一种陪伴？', characterState: 'talking', showChoices: true,
          choices: ['想做一点事。', '想把事情说出来。', '想安静待着。'] }
    ];
    vnDialogues.scene4[emotion] = [
        { speaker: '猫导师', text: '猫导师把椅子拉回桌边。欢迎回来，不用急着告诉我探索有没有用。', characterState: 'talking' },
        { speaker: '猫导师', text: '现在的感觉，更接近哪一种？', characterState: 'talking', showChoices: true,
          choices: ['比刚才轻松一点。', '还没有，不过这里让我舒服些。', '我说不清，想再坐一会儿。'] }
    ];
});

// 游戏数据
const gameData = {
    scenes: {
        1: {
            responses: {
                A: {
                    dialogue: "啊，能量的小风车需要一点润滑剂了。没关系，偶尔停下来，听听树叶的低语也是必要的喵。或许我们可以一起找找，是什么暂时卡住了它？",
                    atmosphere: "tired",
                    catColor: "light-gray"
                },
                B: {
                    dialogue: "小小的紧张感，像爪子上沾了水珠，有点不自在喵。让我们轻轻抖落它，或者...把它变成闪亮的露珠？你愿意和我说说，那让你心弦微颤的小挑战是什么吗？",
                    atmosphere: "nervous",
                    catColor: "warm-gold"
                },
                C: {
                    dialogue: "思念是心头暖暖的小烛火，有时也会带来一丝微风般的凉意喵。那个温暖的人，一定也在某个地方闪耀着光芒。我们可以让这份思念变得更轻盈一些。",
                    atmosphere: "missing",
                    catColor: "soft-pink"
                }
            }
        },
        2: {
            choices: {
                A: {
                    tired: "我想试试让它转起来！",
                    nervous: "我想试试面对它！",
                    missing: "我想试试做点什么！"
                },
                B: {
                    tired: "其实是因为...最近睡不好",
                    nervous: "其实是因为...怕自己搞砸",
                    missing: "其实是因为...很久没联系了"
                },
                C: {
                    tired: "嗯...就是想听听你的声音",
                    nervous: "嗯...就是想找个地方躲躲",
                    missing: "嗯...就是想感受一点温暖"
                }
            }
        },
        puzzle: {
            environments: {
                tired: "moonlight-garden",
                nervous: "morning-forest", 
                missing: "starry-platform"
            },
            items: {
                // 疲惫分支物品 - 神秘花园
                tired: {
                    "courage-stone": {
                        name: "勇气小石头",
                        description: "这颗温暖的小石头里蕴含着内在的力量，就像你心中沉睡的勇气。握住它，感受那份坚定的能量喵~",
                        meaning: "内在力量",
                        collectible: true
                    },
                    "glowing-orchid": {
                        name: "发光小兰花",
                        description: "这朵散发柔和光芒的兰花象征着平静与优雅，它会教你如何在疲惫中找到美丽喵~",
                        meaning: "宁静优雅",
                        collectible: true
                    },
                    "crystal-chime": {
                        name: "水晶小风铃",
                        description: "这个美丽的水晶风铃会奏响平静的旋律，帮你找回内心的宁静喵~",
                        meaning: "心灵平静",
                        collectible: true
                    }
                },
                // 紧张分支物品 - 清晨林间
                nervous: {
                    "cloud-pillow": {
                        name: "云朵小抱枕",
                        description: "这个柔软的云朵抱枕会给你温暖的拥抱，让紧张的心慢慢放松下来喵~",
                        meaning: "温暖拥抱",
                        collectible: true
                    },
                    "starlight-bottle": {
                        name: "星光小瓶子",
                        description: "这个装满星光的小瓶子会照亮前路，驱散内心的不安与恐惧喵~",
                        meaning: "照亮前路",
                        collectible: true
                    },
                    "courage-stone": {
                        name: "勇气小石头",
                        description: "在紧张时刻，这颗勇气小石头会提醒你，勇敢其实就在心中喵~",
                        meaning: "勇敢面对",
                        collectible: true
                    }
                },
                // 思念分支物品 - 星空岛屿
                missing: {
                    "crystal-chime": {
                        name: "水晶小风铃",
                        description: "这个美丽的水晶风铃会奏响思念的旋律，将你的温暖传递给远方的那个人喵~",
                        meaning: "传递温暖",
                        collectible: true
                    },
                    "glowing-orchid": {
                        name: "发光小兰花",
                        description: "即使在思念中，这朵花也会提醒你，美好的回忆永远绽放在心中喵~",
                        meaning: "美好回忆",
                        collectible: true
                    },
                    "starlight-bottle": {
                        name: "星光小瓶子",
                        description: "收集满满的星光，就像收集着对那个人的温暖思念喵~",
                        meaning: "思念之光",
                        collectible: true
                    }
                }
            }
        },
        final: {
            summaries: {
                tired: "小小的风车找到了风",
                nervous: "露珠映出了彩虹",
                missing: "烛火温暖了掌心"
            }
        }
    },
    

};

// 音效管理
const audioManager = {
    bgmStart: null,
    bgmScene1: null,
    bgmExploration: null,
    bgmScene4: null,
    clickSound: null,
    purrSound: null,
    currentBGM: null,
    
    init() {
        this.bgmStart = document.getElementById('bgm-start');
        this.bgmScene1 = document.getElementById('bgm-scene1');
        this.bgmExploration = document.getElementById('bgm-exploration');
        this.bgmScene4 = document.getElementById('bgm-scene4');
        this.clickSound = document.getElementById('click-sound');
        this.purrSound = document.getElementById('purr-sound');
        
        // 设置所有BGM的默认音量
        const allBGMs = [this.bgmStart, this.bgmScene1, this.bgmExploration, this.bgmScene4];
        allBGMs.forEach(bgm => {
            if (bgm) {
                bgm.volume = 0.4;
            }
        });
        
        console.log('🎵 音效管理器初始化完成');
    },
    
    // 播放指定的BGM
    playBGM(bgmType) {
        if (!gameState.audioEnabled) return;
        
        let targetBGM = null;
        
        switch(bgmType) {
            case 'start':
                targetBGM = this.bgmStart;
                break;
            case 'scene1':
                targetBGM = this.bgmScene1;
                break;
            case 'exploration':
                targetBGM = this.bgmExploration;
                break;
            case 'scene4':
                targetBGM = this.bgmScene4;
                break;
            default:
                console.log('⚠️ 未知的BGM类型:', bgmType);
                return;
        }
        
        // 如果已经在播放同一首BGM，不需要切换
        if (this.currentBGM === targetBGM && targetBGM && !targetBGM.paused) {
            console.log('🎵 BGM已在播放，无需切换:', bgmType);
            return;
        }
        
        // 停止当前播放的BGM
        this.stopAllBGM();
        
        // 播放新的BGM
        if (targetBGM) {
            targetBGM.currentTime = 0;
            targetBGM.play().then(() => {
                this.currentBGM = targetBGM;
                console.log('🎵 开始播放BGM:', bgmType);
            }).catch(e => {
                console.log('🎵 BGM播放失败:', bgmType, e);
            });
        }
    },
    
    // 停止所有BGM
    stopAllBGM() {
        const allBGMs = [this.bgmStart, this.bgmScene1, this.bgmExploration, this.bgmScene4];
        allBGMs.forEach(bgm => {
            if (bgm && !bgm.paused) {
                bgm.pause();
                bgm.currentTime = 0;
            }
        });
        this.currentBGM = null;
    },
    
    // 渐入播放BGM
    fadeInBGM(bgmType, duration = 2000) {
        if (!gameState.audioEnabled) return;
        
        this.playBGM(bgmType);
        
        if (this.currentBGM) {
            this.currentBGM.volume = 0;
            const targetVolume = 0.4;
            const fadeSteps = 20;
            const stepTime = duration / fadeSteps;
            const volumeStep = targetVolume / fadeSteps;
            
            let step = 0;
            const fadeInterval = setInterval(() => {
                if (step < fadeSteps && this.currentBGM) {
                    this.currentBGM.volume = Math.min(volumeStep * step, targetVolume);
                    step++;
                } else {
                    clearInterval(fadeInterval);
                }
            }, stepTime);
        }
    },
    
    // 渐出停止BGM
    fadeOutBGM(duration = 1000) {
        if (!this.currentBGM) return;
        
        const startVolume = this.currentBGM.volume;
        const fadeSteps = 20;
        const stepTime = duration / fadeSteps;
        const volumeStep = startVolume / fadeSteps;
        
        let step = 0;
        const fadeInterval = setInterval(() => {
            if (step < fadeSteps && this.currentBGM) {
                this.currentBGM.volume = Math.max(startVolume - (volumeStep * step), 0);
                step++;
            } else {
                this.stopAllBGM();
                clearInterval(fadeInterval);
            }
        }, stepTime);
    },
    
    playClick() {
        if (this.clickSound && gameState.audioEnabled) {
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(e => console.log('Click sound play failed:', e));
        }
    },
    
    playPurr() {
        if (this.purrSound && gameState.audioEnabled) {
            this.purrSound.currentTime = 0;
            this.purrSound.play().catch(e => console.log('Purr sound play failed:', e));
        }
    },
    
    toggleAudio() {
        gameState.audioEnabled = !gameState.audioEnabled;
        const toggleBtn = document.querySelector('.audio-toggle');
        if (gameState.audioEnabled) {
            toggleBtn.textContent = '🔊';
            // 根据当前场景播放对应的BGM
            if (gameState.currentScene === 0) {
                this.playBGM('start');
            } else if (gameState.currentScene === 1) {
                this.playBGM('scene1');
            } else if (gameState.currentScene === 3) {
                this.playBGM('exploration');
            } else if (gameState.currentScene === 4) {
                this.playBGM('scene4');
            }
        } else {
            toggleBtn.textContent = '🔇';
            this.stopAllBGM();
        }
    }
};

// 场景加载管理器
const loadingManager = {
    isShowing: false,
    quotesInterval: null,
    progressInterval: null,
    currentQuoteIndex: 0,
    currentProgress: 0,
    
    // 场景名称映射
    sceneNames: {
        0: "初遇的温暖",
        1: "心灵小屋",
        2: "倾诉时光",
        3: "心绪探索",
        4: "温柔陪伴",
        5: "心灵花园"
    },
    
    // 温馨治愈话语库
    healingQuotes: [
        "在这里，每一份情感都被温柔以待...",
        "慢慢来，心灵的花朵需要时间绽放 🌸",
        "你比你想象的更坚强，也更值得被爱 💕",
        "每一次呼吸都是新的开始，每一次心跳都充满希望 ✨",
        "小猫咪正在为你准备温暖的拥抱 🐱",
        "在宁静中找到自己，在温暖中治愈心灵 ☁️",
        "这里没有评判，只有理解和陪伴 🌟",
        "你的感受都是真实且珍贵的 💝",
        "给自己一点时间，让内心慢慢平静下来 🌿",
        "每个人都值得拥有一个温柔的角落 🏠",
        "在这片天空下，你并不孤单 🌈",
        "让我们一起在心灵的花园里漫步 🌺",
        "温暖的光芒会驱散内心的阴霾 ☀️",
        "你的心像羽毛一样珍贵，需要被轻柔对待 🪶",
        "在这个温馨的小世界里，时间都变得缓慢而美好 ⏰"
    ],
    
    // 显示加载页面
    show(targetSceneId, duration = 2000, autoHide = true) {
        if (this.isShowing) return;
        
        console.log('🌸 显示场景加载页面，目标场景:', targetSceneId);
        
        const loadingElement = document.getElementById('scene-loading');
        const sceneName = document.getElementById('loading-scene-name');
        
        if (!loadingElement || !sceneName) {
            console.error('❌ 加载页面元素未找到');
            return;
        }
        
        // 设置场景名称
        sceneName.textContent = this.sceneNames[targetSceneId] || "神秘的地方";
        
        // 重置进度条
        this.resetProgress();
        
        // 显示加载页面
        loadingElement.classList.add('active');
        this.isShowing = true;
        
        // 开始轮播温馨话语
        this.startQuoteRotation();
        
        // 开始进度条动画
        this.startProgress(duration);
        
        // 自动隐藏
        if (autoHide) {
            setTimeout(() => this.hide(), duration);
        }
    },
    
    // 隐藏加载页面
    hide() {
        if (!this.isShowing) return;
        
        console.log('🌸 隐藏场景加载页面');
        
        const loadingElement = document.getElementById('scene-loading');
        if (loadingElement) {
            loadingElement.classList.remove('active');
        }
        
        this.isShowing = false;
        this.stopQuoteRotation();
        this.stopProgress();
    },
    
    // 开始轮播温馨话语
    startQuoteRotation() {
        this.stopQuoteRotation(); // 确保没有重复的定时器
        
        // 立即显示第一条话语
        this.showNextQuote();
        
        // 每3秒切换一次话语
        this.quotesInterval = setInterval(() => {
            this.showNextQuote();
        }, 3000);
    },
    
    // 停止轮播
    stopQuoteRotation() {
        if (this.quotesInterval) {
            clearInterval(this.quotesInterval);
            this.quotesInterval = null;
        }
    },
    
    // 显示下一条话语
    showNextQuote() {
        const quoteElement = document.getElementById('quote-text');
        if (!quoteElement) return;
        
        // 淡出当前话语
        quoteElement.style.opacity = '0';
        quoteElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            // 更新话语内容
            const quote = this.healingQuotes[this.currentQuoteIndex];
            quoteElement.textContent = quote;
            
            // 淡入新话语
            quoteElement.style.opacity = '1';
            quoteElement.style.transform = 'translateY(0)';
            
            // 移动到下一条话语
            this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.healingQuotes.length;
        }, 300);
    },
    
    // 随机获取一条话语
    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.healingQuotes.length);
        return this.healingQuotes[randomIndex];
    },
    
    // 重置进度条
    resetProgress() {
        this.currentProgress = 0;
        const progressBar = document.getElementById('progress-bar-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (progressPercentage) {
            progressPercentage.textContent = '0%';
        }
    },
    
    // 开始进度条动画
    startProgress(duration) {
        this.stopProgress(); // 确保没有重复的定时器
        
        this.currentProgress = 0;
        const progressBar = document.getElementById('progress-bar-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (!progressBar || !progressPercentage) return;
        
        // 每100ms更新一次进度条，平滑动画
        const updateInterval = 100;
        const totalSteps = duration / updateInterval;
        const progressStep = 100 / totalSteps;
        
        this.progressInterval = setInterval(() => {
            this.currentProgress += progressStep;
            
            // 限制在100%以内
            if (this.currentProgress >= 100) {
                this.currentProgress = 100;
                this.stopProgress();
            }
            
            // 更新进度条和百分比显示
            progressBar.style.width = `${Math.floor(this.currentProgress)}%`;
            progressPercentage.textContent = `${Math.floor(this.currentProgress)}%`;
            
        }, updateInterval);
    },
    
    // 停止进度条动画
    stopProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
};

// 场景管理
const sceneManager = {
    async switchScene(sceneId) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        const loadingDuration = 7500;
        const targetScene = document.getElementById(`scene-${sceneId}`);
        if (!targetScene) {
            this.isTransitioning = false;
            return;
        }
        loadingManager.show(sceneId, loadingDuration, false);
        vnSystem.cancelDialogue();
        document.querySelectorAll('#new-continue-btn, #final-scene-btn, #note-scene-btn, #exploration-next').forEach(btn => btn.remove());
        document.querySelectorAll('video').forEach(video => video.pause());
        document.querySelectorAll('.scene').forEach(scene => scene.classList.remove('active'));

        const explorationId = { A: 'exploration-tired', B: 'exploration-nervous', C: 'exploration-missing' }[gameState.playerChoices.emotion];
        const video = sceneId === 3 ? document.getElementById(explorationId) : targetScene.querySelector('.video-background');
        const bgm = document.getElementById(({ 0: 'bgm-start', 1: 'bgm-scene1', 3: 'bgm-exploration', 4: 'bgm-scene4', 5: 'bgm-scene4' })[sceneId]);
        if (bgm) {
            bgm.preload = 'auto';
            if (bgm.networkState === HTMLMediaElement.NETWORK_EMPTY) bgm.load();
        }
        const waitForVideo = video ? new Promise(resolve => {
            if (video.readyState >= 3 || video.error) return resolve();
            const ready = () => {
                video.removeEventListener('canplay', ready);
                video.removeEventListener('error', ready);
                resolve();
            };
            video.addEventListener('canplay', ready);
            video.addEventListener('error', ready);
            video.preload = 'auto';
            if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
        }) : Promise.resolve();
        const waitForImages = Promise.all(Array.from(targetScene.querySelectorAll('.cat-character')).map(image => {
            image.loading = 'eager';
            return image.decode().catch(() => {});
        }));
        await Promise.all([
            new Promise(resolve => setTimeout(resolve, loadingDuration)),
            Promise.race([waitForVideo, new Promise(resolve => setTimeout(resolve, 7000))]),
            waitForImages
        ]);
        targetScene.classList.add('active');
        gameState.currentScene = sceneId;
        if (video && !video.error) {
            video.play().then(() => new Promise(resolve => {
                if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(resolve);
                else requestAnimationFrame(() => requestAnimationFrame(resolve));
            })).catch(() => {});
        }
        this.playSceneBGM(sceneId);
        if (sceneId === 5) clearAllAtmosphereEffects();
        this.initScene(sceneId);
        if (sceneId === 1) vnSystem.initVNScene(1);
        loadingManager.hide();
        this.isTransitioning = false;
    },
    
    // 播放场景对应的BGM
    playSceneBGM(sceneId) {
        switch(sceneId) {
            case 0:
                // 游戏初始界面
                audioManager.fadeInBGM('start', 1500);
                break;
            case 1:
                // 场景一：与猫导师对话
                audioManager.fadeInBGM('scene1', 2000);
                break;
            case 2:
                // 场景二：继续与猫导师对话，保持scene1的BGM
                // 不切换BGM，保持连续性
                break;
            case 3:
                // 场景三：探索场景
                audioManager.fadeInBGM('exploration', 2500);
                break;
            case 4:
                // 场景四：探索完毕后与猫导师对话
                audioManager.fadeInBGM('scene4', 2000);
                break;
            case 5:
                // 场景五：最终场景，保持scene4的BGM或使用更温柔的音乐
                // 可以选择继续使用scene4的BGM或淡出
                break;
            default:
                console.log('🎵 未定义场景BGM:', sceneId);
        }
    },
    
    initScene(sceneId) {
        console.log('🎬 初始化场景:', sceneId);
        switch(sceneId) {
            case 1:
                this.initCatHouse();
                break;
            case 2:
                this.initScene2();
                break;
            case 3:
                this.initPuzzleScene();
                break;
            case 4:
                this.initScene4();
                break;
            case 5:
                this.initFinalScene();
                break;
        }
    },
    
    initCatHouse() {
        console.log('🏠 初始化猫导师小屋');
        
        // 确保对话框可见
        const dialogue = document.getElementById('vn-dialogue');
        if (dialogue) {
            dialogue.style.display = 'block';
            dialogue.style.visibility = 'visible';
            dialogue.style.opacity = '1';
            console.log('✅ 对话框已设置为可见');
        }
        
        // 确保角色容器可见
        const characterContainer = document.querySelector('.vn-character-container');
        if (characterContainer) {
            characterContainer.style.display = 'flex';
            characterContainer.style.visibility = 'visible';
            characterContainer.style.opacity = '1';
            console.log('✅ 角色容器已设置为可见');
        }
        
        // 初始化猫导师外观
        this.updateCatMentor('cat-mentor', 'default');
        
        // 延迟一下确保所有元素都已渲染
        setTimeout(() => {
            const nameBox = document.getElementById('vn-name');
            const textContent = document.getElementById('vn-text-content');
            console.log('🔍 对话框元素检查:', {
                nameBox: !!nameBox,
                textContent: !!textContent,
                nameBoxVisible: nameBox ? window.getComputedStyle(nameBox).display : 'null',
                textContentVisible: textContent ? window.getComputedStyle(textContent).display : 'null'
            });
        }, 100);
    },
    
    initScene2() {
        const emotion = gameState.playerChoices.emotion;
        const data = gameData.scenes[1].responses[emotion];
        
        // 更新对话
        document.getElementById('dialogue-text-2').textContent = data.dialogue;
        
        // 更新氛围
        const atmosphereEl = document.getElementById('atmosphere-effects');
        atmosphereEl.className = `atmosphere-effects ${data.atmosphere}`;
        
        // 更新猫导师外观
        this.updateCatMentor('cat-mentor-2', data.catColor);
        
        // 更新选择按钮
        const choiceData = gameData.scenes[2].choices;
        document.getElementById('choice-2A').textContent = choiceData.A[data.atmosphere];
        document.getElementById('choice-2B').textContent = choiceData.B[data.atmosphere];
        document.getElementById('choice-2C').textContent = choiceData.C[data.atmosphere];
    },
    
    initPuzzleScene() {
        const emotion = gameState.playerChoices.emotion;
        
        // 启动探索界面展示流程
        this.startExplorationSequence(emotion);
    },
    
    // 新的探索界面展示流程
    startExplorationSequence(emotion) {
        console.log(`开始探索序列，情绪: ${emotion}`);
        
        // 第一步：立即显示对应的视频背景
        this.showExplorationVideo(emotion);
        
        // 第二步：1秒后显示大气效果
        setTimeout(() => {
            this.showExplorationAtmosphere(emotion);
        }, 1000);
        
        // 第三步：3.5秒后显示对话框和交互元素
        setTimeout(() => {
            this.showExplorationContent(emotion);
        }, 3500);
    },
    
    // 显示探索视频背景
    showExplorationVideo(emotion) {
        const currentActiveVideo = document.querySelector('.exploration-video.active');
        
        // 根据情绪确定目标视频
        let videoId;
        switch(emotion) {
            case 'A': // 疲惫 -> 神秘花园
                videoId = 'exploration-tired';
                break;
            case 'B': // 紧张 -> 清晨林间
                videoId = 'exploration-nervous';
                break;
            case 'C': // 思念 -> 星空岛屿
                videoId = 'exploration-missing';
                break;
        }
        
        const targetVideo = document.getElementById(videoId);
        
        if (targetVideo) {
            // 隐藏所有探索视频
            document.querySelectorAll('.exploration-video').forEach(video => {
                video.classList.remove('active');
                video.classList.add('hidden');
            });
            
            // 显示目标视频
            targetVideo.classList.remove('hidden');
            targetVideo.classList.add('active');
            
            // 使用智能视频切换
            videoOptimizer.switchVideo(currentActiveVideo, targetVideo);
            console.log(`智能切换探索视频: ${videoId}`);
        }
    },
    
    // 显示探索大气效果
    showExplorationAtmosphere(emotion) {
        // 隐藏所有大气效果
        document.querySelectorAll('.exploration-atmosphere').forEach(atmosphere => {
            atmosphere.classList.remove('active');
            atmosphere.classList.add('hidden');
        });
        
        // 显示对应大气效果
        let atmosphereId;
        switch(emotion) {
            case 'A': // 疲惫
                atmosphereId = 'exploration-atmosphere-tired';
                break;
            case 'B': // 紧张
                atmosphereId = 'exploration-atmosphere-nervous';
                break;
            case 'C': // 思念
                atmosphereId = 'exploration-atmosphere-missing';
                break;
        }
        
        const atmosphere = document.getElementById(atmosphereId);
        if (atmosphere) {
            atmosphere.classList.remove('hidden');
            atmosphere.classList.add('active');
            console.log(`显示大气效果: ${atmosphereId}`);
        }
    },
    
    // 显示探索内容（对话框和交互元素）
    showExplorationContent(emotion) {
        // 显示引导文字内容
        const explorationContent = document.getElementById('exploration-content');
        if (explorationContent) {
            explorationContent.classList.remove('hidden');
            explorationContent.classList.add('active');
        }
        
        // 显示收集进度
        setTimeout(() => {
            const progressBar = document.getElementById('collection-progress');
            if (progressBar) {
                progressBar.classList.add('active');
                updateProgressDisplay(emotion);
            }
        }, 800);
        
        // 1秒后显示对应的物品
        setTimeout(() => {
            this.showExplorationItems(emotion);
        }, 1000);
        
        console.log('探索内容已显示');
    }
    ,
    
    // 显示探索物品
    showExplorationItems(emotion) {
        // 隐藏所有物品容器
        document.querySelectorAll('.exploration-items').forEach(items => {
            items.classList.remove('active');
            items.classList.add('hidden');
        });
        
        // 显示对应情绪的物品
        let itemsId;
        switch(emotion) {
            case 'A': // 疲惫 -> 神秘花园物品
                itemsId = 'exploration-items-tired';
                break;
            case 'B': // 紧张 -> 清晨林间物品
                itemsId = 'exploration-items-nervous';
                break;
            case 'C': // 思念 -> 星空岛屿物品
                itemsId = 'exploration-items-missing';
                break;
        }
        
        const itemsContainer = document.getElementById(itemsId);
        if (itemsContainer) {
            itemsContainer.classList.remove('hidden');
            itemsContainer.classList.add('active');
            console.log(`显示探索物品: ${itemsId}`);
        }
    },
    
    initScene4() {
        const emotion = gameState.playerChoices.emotion;
        
        // 显示对应情绪的氛围效果
        this.applyScene4Atmosphere(emotion);
        
        // 使用视觉小说系统初始化场景4
        vnSystem.initVNScene(4);
    },
    
    applyScene4Atmosphere(emotion) {
        // 清除所有氛围效果
        const atmosphereElements = document.querySelectorAll('#scene-4 .atmosphere-overlay');
        atmosphereElements.forEach(el => el.classList.remove('active'));
        
        // 根据情绪应用对应的氛围效果
        let atmosphereId;
        switch(emotion) {
            case 'A':
                atmosphereId = 'atmosphere-tired-4';
                break;
            case 'B':
                atmosphereId = 'atmosphere-nervous-4';
                break;
            case 'C':
                atmosphereId = 'atmosphere-missing-4';
                break;
        }
        
        if (atmosphereId) {
            const atmosphereElement = document.getElementById(atmosphereId);
            if (atmosphereElement) {
                atmosphereElement.classList.add('active');
            }
        }
    },
    
    initFinalScene() {
        clearAllAtmosphereEffects();
        renderNote();
    },
    
    updateCatMentor(mentorId, style) {
        const mentor = document.getElementById(mentorId);
        if (!mentor) return;
        
        const catSprite = mentor.querySelector('.cat-sprite');
        
        // 根据样式更新猫导师外观
        switch(style) {
            case 'light-gray':
                catSprite.style.background = 'linear-gradient(45deg, #D3D3D3, #E6E6E6)';
                break;
            case 'warm-gold':
                catSprite.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
                break;
            case 'soft-pink':
                catSprite.style.background = 'linear-gradient(45deg, #FFB6C1, #FFC0CB)';
                break;
            case 'peaceful':
                catSprite.style.background = 'linear-gradient(45deg, #F0F8FF, #E6E6FA)';
                catSprite.style.filter = 'brightness(1.1)';
                break;
            default:
                catSprite.style.background = 'linear-gradient(45deg, #C0C0C0, #DCDCDC)';
        }
        
        // 添加呼噜声效果
        if (style !== 'default') {
            setTimeout(() => {
                audioManager.playPurr();
            }, 500);
        }
    },
    

    
};

// 游戏主要函数
function startGame() {
    console.log('🎮 开始游戏');
    audioManager.playClick();
    
    // 重置游戏状态
    gameState.currentScene = 0;
    gameState.currentDialogue = 0;
    gameState.isTyping = false;
    gameState.playerChoices = {
        emotion: null,
        response: null,
        insight: null,
        foundItems: []
    };
    
    sceneManager.switchScene(1);
    
}

function showContinueButtonForExploration() {
    const parent = document.getElementById('vn-dialogue');
    document.getElementById('exploration-next')?.remove();
    const button = document.createElement('button');
    button.id = 'exploration-next';
    button.className = 'vn-choice-btn';
    button.textContent = '准备好了，去走走';
    button.onclick = () => { button.remove(); sceneManager.switchScene(3); };
    parent.appendChild(button);
}

function makeChoice(scene, choice) {
    audioManager.playClick();
    
    switch(scene) {
        case 1:
            // 第一轮选择：选择情绪状态
            if (!gameState.playerChoices.emotion) {
                console.log('🎭 第一轮选择，设置情绪:', choice);
                gameState.playerChoices.emotion = choice;
                
                // 隐藏选择按钮
                vnSystem.hideChoices(1);
                
                // 激活对应的氛围效果
                applyAtmosphereEffect(choice);
                
                // 显示对应的回复对话序列
                const responseDialogues = vnDialogues.scene2[choice];
                console.log('🗣️ 准备播放回复对话:', responseDialogues);
                
                if (responseDialogues && responseDialogues.length > 0) {
                    setTimeout(() => {
                        // 更新猫导师状态
                        vnSystem.updateCharacter('talking', 1);
                        
                        // 设置回复对话状态
                        vnSystem.responseDialogues = responseDialogues;
                        vnSystem.currentDialogueIndex = 0;
                        vnSystem.currentResponseChoice = choice;
                        vnSystem.isPlayingResponse = true;
                        
                        // 开始播放第一段回复对话
                        vnSystem.playDialogue(responseDialogues[0], 1);
                        console.log('✅ 开始播放第一段回复对话');
                    }, 500);
                } else {
                    console.error('❌ 回复对话数据不存在:', choice);
                }
            } else {
                // 第二轮选择：选择回应方式
                console.log('🎭 第二轮选择，设置回应方式:', choice);
                gameState.playerChoices.response = choice;
                vnSystem.hideChoices(1);
                
                // 清除回复对话状态
                vnSystem.isPlayingResponse = false;
                vnSystem.responseDialogues = null;
                vnSystem.currentDialogueIndex = undefined;
                
                // 显示总结对话并准备进入解谜
                setTimeout(() => {
                    const textContent = document.getElementById('vn-text-content');
                    if (textContent) {
                        const responses = {
                            A: { A: '先试一件小事：找一个能让你停下来歇歇的东西。今天不用把全部事情做完。', B: '明天的挑战先放在明天。现在找一样东西，提醒自己只做第一步。', C: '可以先想一句你想对那个人说的话，不必立刻发出去。我们去找个能承载它的小东西。' },
                            B: { A: '睡不好会让白天更难熬。谢谢你告诉我；先不用找原因，我们去找一个适合歇息的地方。', B: '怕搞砸的时候，每一步都像考试。这里不用交出正确答案，你可以慢慢来。', C: '很久没联系，想开口又怕打扰，是吗？你可以先把想说的话留给自己。' },
                            C: { A: '那就先安静待着。我会在这里，不催你恢复精神。想走走时，我们再去花园。', B: '暂时躲一会儿也可以。猫导师把书放到一边。林间没有人等你交作业。', C: '我们不必猜那个人现在在哪里。你可以带着这份思念，安静看一会儿星星。' }
                        };
                        vnSystem.typeText(textContent, responses[choice][gameState.playerChoices.emotion], () => {
                            showContinueButtonForExploration();
                        });
                    }
                }, 500);
            }
            break;
            
        case 2:
            gameState.playerChoices.response = choice;
            setTimeout(() => {
                sceneManager.switchScene(3);
            }, 1000);
            break;
            
        case 4:
            gameState.playerChoices.insight = choice;
            vnSystem.hideChoices(4);
            
            // 显示感谢对话
            setTimeout(() => {
                const textContent = document.getElementById('vn-text-content-4');
                if (textContent) {
                    console.log('🎯 开始显示最终对话');
                    
                    // 使用回调机制，确保在文字完全显示完成后才显示按钮
                    const feedback = { A: '轻松一点就好，不必把它变成今天必须达到的目标。', B: '谢谢你直说。没好转也没关系，我们可以把这段舒服的时间留下。', C: '说不清也可以。我给你留一张便笺，你想坐多久都行。' }[choice];
                    vnSystem.typeText(textContent, feedback, () => {
                        console.log('🎯 文字显示完成，现在显示按钮');
                        console.log('🔍 当前游戏状态:', gameState);
                        console.log('🔍 当前场景:', gameState.currentScene);
                        showContinueButtonForNote();
                    });
                }
            }, 500);
            break;
    }
}

// 物品收集系统
function clickExplorationItem(itemId) {
    console.log('=== 点击物品调试开始 ===');
    console.log('物品ID:', itemId);
    
    // 检查是否在收集冷却期间
    if (gameState.isCollecting) {
        console.log('⏳ 收集冷却中，忽略点击');
        return;
    }
    
    audioManager.playClick();
    
    const emotion = gameState.playerChoices.emotion;
    let emotionKey = emotion === 'A' ? 'tired' : emotion === 'B' ? 'nervous' : 'missing';
    
    console.log('当前情绪:', emotion, '转换后的key:', emotionKey);
    console.log('游戏状态:', gameState);
    console.log('当前收集进度:', gameState.collectionProgress[emotionKey]);
    
    const itemData = gameData.scenes.puzzle.items[emotionKey][itemId];
    const clickedItem = document.querySelector(`[data-item="${itemId}"]`);
    
    console.log('物品数据:', itemData);
    console.log('点击的DOM元素:', clickedItem);
    
    // 检查是否已经收集过这个物品
    if (gameState.collectionProgress[emotionKey].includes(itemId)) {
        console.log('物品已收集，显示提示');
        // 已收集，显示温馨提示
        showCollectedHint();
        return;
    }
    
    if (itemData && itemData.collectible) {
        console.log('开始收集物品...');
        
        // 设置收集冷却状态
        gameState.isCollecting = true;
        
        // 收集物品
        gameState.collectionProgress[emotionKey].push(itemId);
        gameState.playerChoices.foundItems.push(itemData);
        
        console.log('收集后的进度:', gameState.collectionProgress[emotionKey]);
        
        // 视觉反馈 - 物品被收集（温和效果）
        if (clickedItem) {
            clickedItem.style.transform = 'scale(0.95)';
            clickedItem.style.opacity = '0.6';
            clickedItem.style.pointerEvents = 'none';
            // 添加一个轻微的边框提示已收集
            clickedItem.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            clickedItem.style.borderRadius = '8px';
        }
        
        // 播放收集音效
        audioManager.playPurr();
        
        // 显示收集成功提示
        showCollectionSuccess(itemData);
        
        // 更新进度显示
        updateProgressDisplay(emotion);
        
        // 1秒后解除冷却状态
        setTimeout(() => {
            gameState.isCollecting = false;
            console.log('✅ 收集冷却解除');
        }, 1000);
        
        // 检查是否收集完所有物品
        const currentProgress = gameState.collectionProgress[emotionKey];
        const totalItems = Object.keys(gameData.scenes.puzzle.items[emotionKey]).length;
        
        console.log('检查收集完成状态:');
        console.log('当前收集数量:', currentProgress.length);
        console.log('总物品数量:', totalItems);
        console.log('可用物品列表:', Object.keys(gameData.scenes.puzzle.items[emotionKey]));
        
        if (currentProgress.length >= totalItems) {
            console.log('🎉 收集完毕！开始显示完成消息和按钮');
            // 收集完毕，显示完成消息和继续按钮
            setTimeout(() => {
                console.log('显示完成消息...');
                showCompletionMessage();
                setTimeout(() => {
                    console.log('准备显示继续按钮...');
                    showContinueButton();
                }, 1200);
            }, 1800);
        } else {
            console.log('还需要收集更多物品:', totalItems - currentProgress.length);
        }
    } else {
        console.log('❌ 物品数据无效或不可收集:', itemData);
    }
    console.log('=== 点击物品调试结束 ===');
}

// 显示已收集物品的提示
function showCollectedHint() {
    updateFloatingGuide("这个小宝贝已经和你在一起了呢，试试其他的吧~ 喵", 1.5);
}

// 显示收集成功提示
function showCollectionSuccess(itemData) {
    updateFloatingGuide(`太好了！你找到了『${itemData.name}』~ ${itemData.meaning}的力量现在和你同在喵~`, 1);
}

// 显示完成消息
function showCompletionMessage() {
    console.log('🎊 showCompletionMessage 被调用');
    updateFloatingGuide("太棒了！你收集齐了所有的心灵碎片！你的心灵感受已经被温柔地收集起来了 喵~", 1);
}

// 显示继续按钮 - 全新重写版本
function showContinueButton() {
    console.log('🚀 重新创建继续按钮');
    
    // 删除现有按钮
    const oldBtn = document.getElementById('continue-exploration-btn');
    if (oldBtn) {
        oldBtn.remove();
        console.log('删除旧按钮');
    }
    
    // 创建全新的按钮
    const newBtn = document.createElement('button');
    newBtn.id = 'new-continue-btn';
    newBtn.innerHTML = `
        <span style="margin-right: 6px;">继续我的心灵之旅</span>
        <span>✨</span>
    `;
    
    // 设置按钮样式（参考提示词样式）
    newBtn.style.cssText = `
        position: absolute !important;
        bottom: 15% !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        padding: 20px 30px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 20px !important;
        color: rgba(255, 255, 255, 0.95) !important;
        font-size: 1rem !important;
        font-weight: normal !important;
        cursor: pointer !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        transition: all 0.3s ease !important;
        pointer-events: auto !important;
        user-select: none !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        line-height: 1.6 !important;
        text-align: center !important;
    `;
    
    // 鼠标悬停效果（参考提示词样式）
    newBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 255, 255, 0.25) !important';
        this.style.borderColor = 'rgba(255, 255, 255, 0.4) !important';
        this.style.transform = 'translateX(-50%) translateY(-2px) scale(1.02) !important';
    });
    
    newBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 255, 255, 0.15) !important';
        this.style.borderColor = 'rgba(255, 255, 255, 0.2) !important';
        this.style.transform = 'translateX(-50%) translateY(0) scale(1) !important';
    });
    
    // 绑定点击事件 - 多种方式确保能点击
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎉 新按钮被点击！');
        continueToNextScene();
    });
    
    newBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎉 新按钮mousedown事件！');
        continueToNextScene();
    });
    
    newBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎉 新按钮onclick事件！');
        continueToNextScene();
    };
    
    // 添加到场景3的容器中（确保在游戏画面内）
    const scene3 = document.getElementById('scene-3');
    if (scene3) {
        scene3.appendChild(newBtn);
    } else {
        document.body.appendChild(newBtn);
    }
    
    console.log('✅ 新按钮已创建并添加到页面');
    
    // 验证按钮状态
    setTimeout(() => {
        const rect = newBtn.getBoundingClientRect();
        console.log('新按钮位置:', rect);
        console.log('新按钮是否可见:', rect.width > 0 && rect.height > 0);
    }, 100);
}

// 显示进入最终场景的按钮
function showContinueButtonForNote() {
    const scene = document.getElementById('scene-4');
    document.getElementById('note-scene-btn')?.remove();
    const button = document.createElement('button');
    button.id = 'note-scene-btn';
    button.className = 'vn-choice-btn';
    button.textContent = '写下今天的便笺';
    button.onclick = () => { button.remove(); sceneManager.switchScene(5); };
    scene.querySelector('.vn-dialogue-container')?.appendChild(button);
}


function continueToNextScene() {
    console.log('🎉 continueToNextScene 被调用！');
    audioManager.playClick();
    
    // 隐藏新按钮
    const newBtn = document.getElementById('new-continue-btn');
    if (newBtn) {
        newBtn.remove();
        console.log('✅ 新按钮已删除');
    }
    
    // 也删除旧按钮（以防万一）
    const oldBtn = document.getElementById('continue-exploration-btn');
    if (oldBtn) {
        oldBtn.remove();
        console.log('✅ 旧按钮已删除');
    }
    
    // 显示过渡提示
    updateFloatingGuide("让我们去看看会发生什么神奇的事情吧~ 喵", 1.5);
    console.log('✅ 显示过渡提示');
    
    // 延迟跳转到下一场景
    setTimeout(() => {
        console.log('⏰ 准备切换到场景4');
        sceneManager.switchScene(4);
        console.log('✅ 场景切换完成');
    }, 2000);
}

// 防重复显示的消息队列
let messageQueue = [];
let isShowingMessage = false;

// 通用的浮动引导更新函数
function updateFloatingGuide(message, duration = 1.5) {
    // 将消息加入队列
    messageQueue.push({ message, duration });
    
    // 如果当前没有显示消息，开始处理队列
    if (!isShowingMessage) {
        processMessageQueue();
    }
}

// 处理消息队列，防止重复显示
function processMessageQueue() {
    if (messageQueue.length === 0) {
        isShowingMessage = false;
        return;
    }
    
    isShowingMessage = true;
    const { message, duration } = messageQueue.shift();
    
    const floatingGuide = document.getElementById('floating-guide');
    const guideText = document.getElementById('guide-text-floating');
    
    if (floatingGuide && guideText) {
        // 清除之前的动画
        guideText.style.animation = 'none';
        guideText.style.opacity = '0';
        
        // 设置新消息
        setTimeout(() => {
            guideText.textContent = message;
            guideText.style.animation = `floating-appear 0.8s ease-out forwards, floating-disappear 0.8s ease-in ${duration}s forwards`;
        }, 100);
        
        // 等待当前消息完成后处理下一个
        setTimeout(() => {
            processMessageQueue();
        }, (duration + 1.6) * 1000); // 0.8s appear + duration + 0.8s disappear
    } else {
        isShowingMessage = false;
    }
}

// 更新收集进度显示
function updateProgressDisplay(emotion) {
    const emotionKey = emotion === 'A' ? 'tired' : emotion === 'B' ? 'nervous' : 'missing';
    const currentProgress = gameState.collectionProgress[emotionKey];
    const totalItems = Object.keys(gameData.scenes.puzzle.items[emotionKey]).length;
    
    // 更新进度数字
    const progressCount = document.getElementById('progress-count');
    if (progressCount) {
        progressCount.textContent = `${currentProgress.length}/${totalItems}`;
    }
    
    // 更新进度点
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`progress-dot-${i}`);
        if (dot) {
            if (i <= currentProgress.length) {
                dot.textContent = '●';
                dot.classList.add('collected');
            } else {
                dot.textContent = '○';
                dot.classList.remove('collected');
            }
        }
    }
}

function addMissEffect(area) {
    // 创建温馨的反馈效果
    const effects = ['✨', '🌟', '💫', '🦋', '🌸'];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    
    const effectEl = document.createElement('div');
    effectEl.textContent = randomEffect;
    effectEl.style.position = 'absolute';
    effectEl.style.top = '50%';
    effectEl.style.left = '50%';
    effectEl.style.transform = 'translate(-50%, -50%)';
    effectEl.style.fontSize = '2rem';
    effectEl.style.pointerEvents = 'none';
    effectEl.style.animation = 'float 2s ease-out forwards';
    
    area.appendChild(effectEl);
    
    setTimeout(() => {
        effectEl.remove();
    }, 2000);
}

function renderNote(selectedName) {
    const choices = gameState.playerChoices;
    const items = choices.foundItems;
    const select = document.getElementById('note-item');
    if (!selectedName) {
        select.replaceChildren();
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.name;
            option.textContent = item.name;
            select.appendChild(option);
        });
    }
    const item = items.find(entry => entry.name === (selectedName || select.value)) || items[0];
    choices.noteItem = item?.name || '一段安静的时间';
    const emotion = { A: '疲惫', B: '紧张', C: '思念' }[choices.emotion];
    const need = { A: '想做一点事', B: '想把事情说出来', C: '想安静待着' }[choices.response];
    document.getElementById('note-context').textContent = `今天带着${emotion}来到这里，你选择了${need}。`;
    document.getElementById('note-message').textContent = {
        A: '只做一个小步骤也可以。完成之后，记得给自己留一点空白。',
        B: '你说出来的事情，我听见了。它不需要立刻被整理成一个答案。',
        C: '安静待着也是一种需要。今天不用证明自己有多努力。'
    }[choices.response];
    document.getElementById('note-action').textContent = `带走${choices.noteItem}：${item?.description || '给自己留一分钟，不安排任务。'}`;
    document.getElementById('note-status').textContent = '';
    document.getElementById('note-download').hidden = true;
}

async function saveNote() {
    const status = document.getElementById('note-status');
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) { status.textContent = '此浏览器不能导出图片，可以截图保存便笺。'; return; }
    ctx.fillStyle = '#fff8ee';
    ctx.fillRect(0, 0, 800, 1000);
    ctx.fillStyle = '#403831';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('喵屋便笺', 60, 85);
    const mentor = document.querySelector('.note-mentor');
    await mentor.decode().catch(() => {});
    if (mentor.naturalWidth) ctx.drawImage(mentor, 580, 30, 150, 180);
    ctx.font = '26px sans-serif';
    let y = 260;
    for (const id of ['note-context', 'note-message', 'note-action']) {
        let row = '';
        for (const character of document.getElementById(id).textContent) {
            if (ctx.measureText(row + character).width > 670) {
                ctx.fillText(row, 60, y); y += 44; row = '';
            }
            row += character;
        }
        ctx.fillText(row, 60, y); y += 95;
    }
    ctx.font = '22px sans-serif';
    ctx.fillText('不用马上好起来。这里仍有一个位置。', 60, 920);
    try {
        const data = canvas.toDataURL('image/png');
        const link = document.getElementById('note-download');
        link.href = data;
        link.hidden = false;
        link.click();
        status.textContent = '已生成便笺并请求下载。没有下载时，可点击下面的链接或截图保存。';
    } catch {
        status.textContent = '图片导出不可用，请截图保存当前便笺。';
    }
}

function restartGame() {
    audioManager.playClick();
    
    // 清理动态创建的按钮
    const dynamicButtons = document.querySelectorAll('#new-continue-btn, #final-scene-btn, #note-scene-btn, #exploration-next');
    dynamicButtons.forEach(btn => btn.remove());
    
    // 隐藏加载页面（如果正在显示）
    loadingManager.hide();
    
    // 清理视频优化器资源
    videoOptimizer.cleanup();
    
    // 重置游戏状态
    gameState = {
        currentScene: 0,
        isCollecting: false,
        playerChoices: {
            emotion: null,
            response: null,
            insight: null,
            foundItems: []
        },
        collectionProgress: {
            tired: [],
            nervous: [],
            missing: []
        },
        audioEnabled: gameState.audioEnabled,
        };
    
    // 重置氛围效果
    resetAtmosphereEffects();
    
    // 重置探索界面
    resetExplorationScene();
    
    // 重置UI
    document.getElementById('found-item').style.display = 'none';
    
    // 回到开始场景
    sceneManager.switchScene(0);
    
    // 重新优化视频（因为清理后需要重新初始化）
    setTimeout(() => {
        videoOptimizer.optimizeVideoPlayback();
    }, 1000);
}

function toggleAudio() {
    audioManager.toggleAudio();
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    audioManager.init();
    
    // 添加CSS样式用于花纹
    const style = document.createElement('style');
    style.textContent = `
        .star-spots::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: 
                radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.6) 3px, transparent 3px),
                radial-gradient(circle at 70% 20%, rgba(255, 215, 0, 0.6) 2px, transparent 2px),
                radial-gradient(circle at 80% 70%, rgba(255, 215, 0, 0.6) 2px, transparent 2px),
                radial-gradient(circle at 30% 80%, rgba(255, 215, 0, 0.6) 3px, transparent 3px);
            border-radius: inherit;
        }
        
        .soft-stripes::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.3) 10px,
                rgba(255, 255, 255, 0.3) 15px
            );
            border-radius: inherit;
        }
        
        .heart-patches::before {
            content: '💕';
            position: absolute;
            top: 20%;
            left: 20%;
            font-size: 1.5rem;
            opacity: 0.7;
        }
        
        .heart-patches::after {
            content: '💕';
            position: absolute;
            bottom: 20%;
            right: 20%;
            font-size: 1rem;
            opacity: 0.7;
        }
    `;
    document.head.appendChild(style);
    
    // 添加键盘支持
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const activeScene = document.querySelector('.scene.active');
            if (activeScene) {
                const buttons = activeScene.querySelectorAll('button:not(.audio-toggle)');
                if (buttons.length > 0) {
                    buttons[0].click();
                }
            }
        }
    });
    
    // 添加触摸支持
    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', function(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        
        // 向上滑动继续游戏
        if (diff > 50) {
            const activeScene = document.querySelector('.scene.active');
            if (activeScene && activeScene.id === 'scene-0') {
                startGame();
            }
        }
    });
    
    // 延迟播放初始界面BGM，给音频元素时间加载
    setTimeout(() => {
        audioManager.playBGM('start');
        console.log('🎵 开始播放初始界面BGM');
    }, 1000);
    
    console.log('心语喵屋游戏已加载完成！');
});

// 视觉小说系统
const vnSystem = {
    dialogueVersion: 0,
    cancelDialogue() {
        this.dialogueVersion++;
        clearTimeout(this.typingTimer);
        clearTimeout(this.dialogueTimer);
        gameState.isTyping = false;
    },
    // 初始化视觉小说场景
    initVNScene(sceneId = null) {
        const scene = sceneId || gameState.currentScene;
        console.log('🎭 初始化视觉小说场景:', scene);
        
        // 重置对话状态
        gameState.currentDialogue = 0;
        gameState.isTyping = false;
        
        // 重置vnSystem状态
        this.isPlayingResponse = false;
        this.responseDialogues = null;
        this.currentDialogueIndex = undefined;
        this.currentResponseChoice = null;
        
        this.hideChoices(scene);
        
        // 绑定继续点击事件（避免重复绑定）
        this.bindContinueEvent(scene);
        
        // 开始对话
        this.startDialogue(scene);
    },
    
    // 绑定继续点击事件
    bindContinueEvent(scene) {
        const continueHint = document.getElementById(`vn-continue${scene > 1 ? '-' + scene : ''}`);
        if (continueHint) {
            // 检查是否已经绑定过事件
            if (!continueHint.hasAttribute('data-bound')) {
                console.log('🖱️ 绑定继续点击事件，场景:', scene);
                continueHint.addEventListener('click', () => {
                    console.log('🖱️ 继续提示被点击，场景:', scene);
                    this.nextDialogue(scene);
                });
                continueHint.setAttribute('data-bound', 'true');
            }
        }
    },
    
    // 开始对话
    startDialogue(scene = 1) {
        console.log('🎬 开始对话，场景:', scene);
        this.currentDialogueIndex = 0;
        this.currentScene = scene;
        
        let initialDialogue = null;
        
        if (scene === 1) {
            initialDialogue = vnDialogues.scene1[0];
            console.log('📖 场景1开始对话:', initialDialogue);
        } else if (scene === 2) {
            const emotion = gameState.playerChoices.emotion;
            initialDialogue = vnDialogues.scene2[emotion][0];
            console.log('📖 场景2开始对话，情绪:', emotion, initialDialogue);
        } else if (scene === 4) {
            const emotion = gameState.playerChoices.emotion;
            initialDialogue = vnDialogues.scene4[emotion][0];
            console.log('📖 场景4开始对话，情绪:', emotion, initialDialogue);
        }
        
        if (initialDialogue) {
            this.playDialogue(initialDialogue, scene);
        } else {
            console.error('❌ 找不到初始对话数据，场景:', scene);
        }
    },
    
    // 播放对话
    playDialogue(dialogue, scene = 1) {
        console.log('🎬 播放对话:', dialogue.speaker, dialogue.text.substring(0, 20) + '...');
        
        this.cancelDialogue();
        this.hideContinueHint(scene);
        const version = this.dialogueVersion;
        const suffix = scene > 1 ? `-${scene}` : '';
        const nameBox = document.getElementById(`vn-name${suffix}`);
        const textContent = document.getElementById(`vn-text-content${suffix}`);
        
        if (nameBox && textContent) {
            nameBox.textContent = dialogue.speaker;
            this.typeText(textContent, dialogue.text);
            this.updateCharacter(dialogue.characterState, scene);
            
            if (dialogue.showChoices) {
                console.log('🔘 对话包含选择，准备显示选择按钮');
                this.dialogueTimer = setTimeout(() => {
                    if (version !== this.dialogueVersion) return;
                    this.showChoices(scene);
                    this.hideContinueHint(scene);
                    // 更新选择按钮文本
                    if (dialogue.choices) {
                        console.log('🔘 更新选择按钮文本:', dialogue.choices);
                        this.updateChoiceButtons(dialogue.choices, scene);
                    }
                }, dialogue.text.length * 30 + 1000);
            } else {
                // 如果没有选择，显示继续提示
                console.log('➡️ 显示继续提示');
                this.dialogueTimer = setTimeout(() => {
                    if (version !== this.dialogueVersion) return;
                    this.showContinueHint(scene);
                }, dialogue.text.length * 30 + 500);
            }
        } else {
            console.error('❌ 对话框元素未找到:', `vn-name${suffix}`, `vn-text-content${suffix}`);
        }
    },
    
    // 打字机效果
    typeText(element, text, onComplete = null) {
        console.log('⌨️ 开始打字效果:', text.substring(0, 20) + '...');
        clearTimeout(this.typingTimer);
        const version = this.dialogueVersion;
        gameState.isTyping = true;
        element.textContent = '';
        let index = 0;
        
        const typeChar = () => {
            if (version !== this.dialogueVersion) return;
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                this.typingTimer = setTimeout(typeChar, 25);
            } else {
                console.log('✅ 打字效果完成');
                gameState.isTyping = false;
                // 文字显示完成后执行回调
                if (onComplete && typeof onComplete === 'function') {
                    this.typingTimer = setTimeout(() => {
                        if (version === this.dialogueVersion) onComplete();
                    }, 300);
                }
            }
        };
        
        typeChar();
    },
    
    // 更新角色状态
    updateCharacter(state, scene = 1) {
        if (scene === 1) {
            const readingCat = document.getElementById('cat-reading');
            const talkingCat = document.getElementById('cat-talking');
            
            if (readingCat && talkingCat) {
                switch(state) {
                    case 'reading':
                        readingCat.classList.remove('hidden');
                        talkingCat.classList.add('hidden');
                        break;
                    case 'transition':
                        setTimeout(() => {
                            readingCat.classList.add('hidden');
                            talkingCat.classList.remove('hidden');
                        }, 500);
                        break;
                    case 'talking':
                        readingCat.classList.add('hidden');
                        talkingCat.classList.remove('hidden');
                        break;
                }
            }
        } else if (scene === 2) {
            const talkingCat = document.getElementById('cat-talking-2');
            if (talkingCat) {
                talkingCat.classList.remove('hidden');
            }
        }
    },
    
    // 下一句对话
    nextDialogue(scene = 1) {
        if (gameState.isTyping) {
            console.log('⏳ 正在打字中，忽略点击');
            return; // 如果正在打字，忽略点击
        }
        
        console.log('🔄 nextDialogue 被调用，场景:', scene, '当前状态:', {
            isPlayingResponse: this.isPlayingResponse,
            currentDialogueIndex: this.currentDialogueIndex,
            responseDialogues: this.responseDialogues ? this.responseDialogues.length : 'null',
            currentDialogue: gameState.currentDialogue
        });
        
        // 如果正在播放回复对话
        if (this.isPlayingResponse && this.responseDialogues && this.currentDialogueIndex !== undefined) {
            this.currentDialogueIndex++;
            console.log('📖 回复对话进度:', this.currentDialogueIndex, '/', this.responseDialogues.length);
            
            if (this.currentDialogueIndex < this.responseDialogues.length) {
                // 继续播放下一段回复对话
                this.playDialogue(this.responseDialogues[this.currentDialogueIndex], scene);
                return;
            } else {
                // 回复对话播放完毕，显示第二级选择
                console.log('✅ 回复对话播放完毕，准备显示第二级选择');
                const emotion = gameState.playerChoices.emotion;
                const lastDialogue = this.responseDialogues[this.responseDialogues.length - 1];
                const secondLevelChoices = lastDialogue.choices;
                
                if (secondLevelChoices) {
                    console.log('🔘 显示第二级选择按钮:', secondLevelChoices);
                    setTimeout(() => {
                        this.updateChoiceButtons(secondLevelChoices, scene);
                        this.showChoices(scene);
                        this.hideContinueHint(scene);
                    }, 500);
                } else {
                    console.error('❌ 第二级选择数据不存在');
                }
                
                // 重置回复对话状态，但保持基本状态
                this.isPlayingResponse = false;
                this.responseDialogues = null;
                this.currentDialogueIndex = undefined;
                this.currentResponseChoice = null;
                return;
            }
        }
        
        // 正常的对话推进逻辑
        gameState.currentDialogue++;
        let currentSceneDialogues;
        
        if (scene === 1) {
            currentSceneDialogues = vnDialogues.scene1;
        } else if (scene === 2) {
            const emotion = gameState.playerChoices.emotion;
            currentSceneDialogues = vnDialogues.scene2[emotion];
        } else if (scene === 4) {
            const emotion = gameState.playerChoices.emotion;
            currentSceneDialogues = vnDialogues.scene4[emotion];
        }
        
        console.log('📚 当前场景对话数据:', currentSceneDialogues ? currentSceneDialogues.length : 'null', '当前索引:', gameState.currentDialogue);
        
        if (currentSceneDialogues && gameState.currentDialogue < currentSceneDialogues.length) {
            this.playDialogue(currentSceneDialogues[gameState.currentDialogue], scene);
        } else {
            console.log('⚠️ 没有更多对话可播放');
        }
    },
    
    // 显示选择
    showChoices(scene = 1) {
        const suffix = scene > 1 ? `-${scene}` : '';
        const choicesContainer = document.getElementById(`vn-choices${suffix}`);
        if (choicesContainer) {
            choicesContainer.classList.remove('hidden');
            
            // 添加淡入动画
            setTimeout(() => {
                choicesContainer.style.opacity = '1';
                choicesContainer.style.transform = 'translateY(0)';
            }, 100);
        }
    },
    
    // 隐藏选择
    hideChoices(scene = 1) {
        const suffix = scene > 1 ? `-${scene}` : '';
        const choicesContainer = document.getElementById(`vn-choices${suffix}`);
        if (choicesContainer) {
            choicesContainer.classList.add('hidden');
            choicesContainer.style.opacity = '0';
            choicesContainer.style.transform = 'translateY(20px)';
        }
    },
    
    // 显示继续提示
    showContinueHint(scene = 1) {
        const suffix = scene > 1 ? `-${scene}` : '';
        const continueHint = document.getElementById(`vn-continue${suffix}`);
        if (continueHint) {
            continueHint.classList.remove('hidden');
        }
    },
    
    // 隐藏继续提示
    hideContinueHint(scene = 1) {
        const suffix = scene > 1 ? `-${scene}` : '';
        const continueHint = document.getElementById(`vn-continue${suffix}`);
        if (continueHint) {
            continueHint.classList.add('hidden');
        }
    },
    
    // 更新选择按钮文本
    updateChoiceButtons(choices, scene = 1) {
        const suffix = scene > 1 ? `-${scene}` : '';
        choices.forEach((choice, index) => {
            const buttonId = `choice-${scene}${String.fromCharCode(65 + index)}`;
            const button = document.getElementById(buttonId);
            if (button) {
                button.textContent = choice;
                // 保持原有的onclick功能
                button.onclick = () => makeChoice(scene, String.fromCharCode(65 + index));
            }
        });
    }
}; 

// ================ 氛围效果控制 ================

/**
 * 根据情绪选择应用氛围效果
 * @param {string} emotion - 情绪选择 ('A': 疲惫, 'B': 紧张, 'C': 思念)
 */
function applyAtmosphereEffect(emotion) {
    // 清除所有氛围效果
    clearAllAtmosphereEffects();
    
    // 获取视频背景元素
    const videoBackground = document.getElementById('scene1-video');
    
    // 根据选择应用对应的氛围效果
    switch(emotion) {
        case 'A': // 疲惫/低落
            const tiredOverlay = document.getElementById('atmosphere-tired');
            if (tiredOverlay) {
                tiredOverlay.classList.add('active');
            }
            if (videoBackground) {
                videoBackground.classList.add('atmosphere-tired');
            }
            console.log('应用疲惫氛围效果');
            break;
            
        case 'B': // 紧张
            const nervousOverlay = document.getElementById('atmosphere-nervous');
            if (nervousOverlay) {
                nervousOverlay.classList.add('active');
            }
            if (videoBackground) {
                videoBackground.classList.add('atmosphere-nervous');
            }
            console.log('应用紧张氛围效果');
            break;
            
        case 'C': // 思念
            const missingOverlay = document.getElementById('atmosphere-missing');
            if (missingOverlay) {
                missingOverlay.classList.add('active');
            }
            if (videoBackground) {
                videoBackground.classList.add('atmosphere-missing');
            }
            console.log('应用思念氛围效果');
            break;
    }
}

/**
 * 清除所有氛围效果
 */
function clearAllAtmosphereEffects() {
    console.log('🧹 清除所有氛围效果');
    
    // 清除覆盖层效果
    const overlays = document.querySelectorAll('.atmosphere-overlay');
    overlays.forEach(overlay => {
        overlay.classList.remove('active');
        overlay.style.opacity = '0';
        overlay.style.display = 'none';
    });
    
    // 清除所有视频的滤镜效果
    const allVideos = document.querySelectorAll('.video-background');
    allVideos.forEach(video => {
        video.classList.remove('atmosphere-tired', 'atmosphere-nervous', 'atmosphere-missing');
        video.style.filter = 'none';
        video.style.opacity = '1';
        console.log(`清除视频滤镜: ${video.id || video.src}`);
    });
    
    // 特别确保最终场景视频没有任何滤镜
    const scene5Video = document.getElementById('scene5-video');
    if (scene5Video) {
        scene5Video.style.filter = 'none !important';
        scene5Video.style.opacity = '1 !important';
        console.log('✅ 最终场景视频滤镜已清除');
    }
}

/**
 * 重置所有氛围效果（用于重新开始游戏）
 */
function resetAtmosphereEffects() {
    clearAllAtmosphereEffects();
    console.log('氛围效果已重置');
}

/**
 * 重置探索界面状态
 */
function resetExplorationScene() {
    // 隐藏所有探索视频
    document.querySelectorAll('.exploration-video').forEach(video => {
        video.classList.remove('active');
        video.classList.add('hidden');
    });
    
    // 隐藏所有大气效果
    document.querySelectorAll('.exploration-atmosphere').forEach(atmosphere => {
        atmosphere.classList.remove('active');
        atmosphere.classList.add('hidden');
    });
    
    // 隐藏所有探索物品
    document.querySelectorAll('.exploration-items').forEach(items => {
        items.classList.remove('active');
        items.classList.add('hidden');
    });
    
    // 重置所有物品的视觉状态
    document.querySelectorAll('.exploration-item').forEach(item => {
        item.style.transform = '';
        item.style.filter = '';
        item.style.opacity = '';
        item.style.pointerEvents = '';
        item.style.border = '';
        item.style.borderRadius = '';
    });
    
    // 隐藏探索内容
    const explorationContent = document.getElementById('exploration-content');
    if (explorationContent) {
        explorationContent.classList.remove('active');
        explorationContent.classList.add('hidden');
    }
    
    // 重置引导文字动画
    const guideText = document.getElementById('guide-text-floating');
    if (guideText) {
        guideText.textContent = "喵~ 看来我们需要一点小小的'心绪整理'。在这个安静的地方，藏着一些能让你此刻感到平静的小东西。用心感受，它会悄悄呼唤你...";
        guideText.style.animation = '';
    }
    
    // 重置收集进度显示
    const progressBar = document.getElementById('collection-progress');
    if (progressBar) {
        progressBar.classList.remove('active');
    }
    
    // 重置进度点
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`progress-dot-${i}`);
        if (dot) {
            dot.textContent = '○';
            dot.classList.remove('collected');
        }
    }
    
    // 重置进度计数
    const progressCount = document.getElementById('progress-count');
    if (progressCount) {
        progressCount.textContent = '0/3';
    }
    
    // 隐藏继续按钮
    const continueBtn = document.getElementById('continue-exploration-btn');
    if (continueBtn) {
        continueBtn.style.display = 'none';
        continueBtn.style.animation = '';
    }
    
    // 清空消息队列和重置消息状态
    messageQueue = [];
    isShowingMessage = false;
    
    // 停止所有探索视频播放
    document.querySelectorAll('.exploration-video').forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
    
    console.log('探索界面已重置');
} 

// 临时测试函数 - 直接显示按钮（用于调试）
function testButtonDisplay() {
    console.log('🧪 开始测试按钮显示功能');
    
    // 确保场景4是激活状态
    document.querySelectorAll('.scene').forEach(scene => {
        scene.classList.remove('active');
    });
    
    const scene4 = document.getElementById('scene-4');
    if (scene4) {
        scene4.classList.add('active');
        console.log('✅ 场景4已激活');
        
        // 确保对话框可见
        const dialogueContainer = document.getElementById('vn-dialogue-4');
        if (dialogueContainer) {
            dialogueContainer.style.display = 'block';
            console.log('✅ 对话框容器已显示');
        }
    }
    
    // 调用按钮显示函数
    showContinueButtonForNote();
}

// 测试BGM播放功能
function testBGM(bgmType) {
    console.log('🎵 测试BGM播放:', bgmType);
    audioManager.playBGM(bgmType);
}

// 测试加载页面功能
function testLoading(sceneId = 1, duration = 3000) {
    console.log('🌸 测试加载页面:', sceneId);
    loadingManager.show(sceneId, duration);
}

// 测试话语轮播功能
function testQuotes() {
    console.log('📝 测试话语轮播');
    loadingManager.startQuoteRotation();
    
    // 10秒后自动停止
    setTimeout(() => {
        loadingManager.stopQuoteRotation();
        console.log('📝 话语轮播测试结束');
    }, 10000);
}

// 将测试函数添加到全局作用域
window.testButtonDisplay = testButtonDisplay;
window.testBGM = testBGM;
window.testLoading = testLoading;
window.testQuotes = testQuotes;