// config.js
const CONFIG = {
    CANVAS_BG: '#0a0a0a',
    WOLF_SIZE: 80,
    BONE_SIZE: 40,
    MAX_WOLVES: 20,          // 最多20只狼，避免卡死
    WOLF_LIFETIME: 15000,    // 狼存活15秒
    BONE_SPAWN_RATE: 2000,   // 每2秒自动生一根骨头
    PARTICLE_COUNT: 12,
    PARTICLE_LIFE: 0.5,

    // ===== 重力&弹跳核心参数（调这里改手感！）=====
    GRAVITY: 0.18,           // 重力大小：0.1=轻，0.3=重
    BOUNCE_FACTOR: 0.75,     // 弹跳衰减：0.5=跳很低，1=不衰减
    MIN_BOUNCE_Y: -10,       // 最小弹跳力度（越负跳越高）
    MAX_BOUNCE_Y: -3,        // 最大弹跳力度（越负跳越高）
    MIN_DX: 1,               // 弹跳最小水平速度
    MAX_DX: 4,               // 弹跳最大水平速度

    // 表情配置
    USE_EMOJI: true,
    WOLF_EMOJI: '🐺',
    DOG_EMOJI: '🐶',
    BONE_EMOJI: '🦴',
};
