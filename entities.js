/**
 * entities.js - 狼族传说：所有游戏实体的逻辑管理
 * 负责：狼/骨头的创建、更新、碰撞检测、绘制
 */

// 从配置文件读参数（所有可调参数都在 config.js 里，不用改这里）
import { CONFIG } from './config.js';
// 从工具库拿函数（碰撞检测、粒子特效等）
import { random, isCollide, spawnParticles } from './utils.js';

// ==================== 全局实体存储 ====================
// 所有存活的狼
export const wolves = [];
// 所有存活的骨头
export const bones = [];
// 图片缓存（即使不用图片也留着接口，以后换图直接用）
const assetCache = {
    wolf: null,
    dog: null,
    bone: null
};

// ==================== 资源加载 ====================
/**
 * 加载图片资源（如果用 emoji 可以不调用，但留着兼容）
 */
export function loadAssets() {
    if (!CONFIG.USE_EMOJI) {
        const wolfImg = new Image();
        wolfImg.src = './assets/wolf.png';
        assetCache.wolf = wolfImg;

        const dogImg = new Image();
        dogImg.src = './assets/dog.png';
        assetCache.dog = dogImg;

        const boneImg = new Image();
        boneImg.src = './assets/bone.png';
        assetCache.bone = boneImg;
    }
}

// ==================== 实体创建 ====================
/**
 * 创建一只狼（从点击位置生成）
 * @param {number} x - 点击位置的 X 坐标（左上角）
 * @param {number} y - 点击位置的 Y 坐标（左上角）
 * @returns {Object|null} 创建的狼对象，数量超限返回 null
 */
export function createWolf(x, y) {
    // 限制狼的最大数量，避免 iPad 卡死
    if (wolves.length >= CONFIG.MAX_WOLVES) return null;

    // 修正位置：让狼的中心对准手指（不然会偏右下角）
    const spawnX = x - CONFIG.WOLF_SIZE / 2;
    const spawnY = y - CONFIG.WOLF_SIZE / 2;

    const wolf = {
        x: spawnX,
        y: spawnY,
        // 初始水平速度：微小随机值，避免垂直死掉
        dx: random(-1, 1),
        // 初始垂直速度：轻微向下，符合重力直觉
        dy: random(0.5, 1.5),
        // 类型：wolf=🐺，dog=🐶（撞狼后会切换）
        type: 'wolf',
        // 出生时间戳，用于15秒后自动消失
        bornTime: Date.now()
    };

    wolves.push(wolf);
    return wolf;
}

/**
 * 创建一个骨头
 * @param {number} x - 骨头 X 坐标
 * @param {number} y - 骨头 Y 坐标
 * @returns {Object} 骨头对象
 */
export function createBone(x, y) {
    const bone = {
        x: x - CONFIG.BONE_SIZE / 2,
        y: y - CONFIG.BONE_SIZE / 2
    };
    bones.push(bone);
    return bone;
}

/**
 * 自动生成骨头（定时调用）
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 */
export function autoSpawnBone(canvasWidth, canvasHeight) {
    // 随机位置，避开边缘（至少留一个骨头大小的边距）
    const x = random(CONFIG.BONE_SIZE, canvasWidth - CONFIG.BONE_SIZE);
    const y = random(CONFIG.BONE_SIZE, canvasHeight - CONFIG.BONE_SIZE);
    createBone(x, y);
}

// ==================== 实体更新（核心逻辑） ====================
/**
 * 更新所有实体的状态（每帧调用）
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @param {number} deltaTime - 帧间隔（秒）
 * @returns {Object|null} 碰撞事件（比如吃到骨头）
 */
export function updateEntities(canvasWidth, canvasHeight, deltaTime) {
    const now = Date.now();

    // ---------- 遍历所有狼 ----------
    for (let i = wolves.length - 1; i >= 0; i--) {
        const wolf = wolves[i];

        // 1. 生命周期结束：15秒后自动消失，炸灰色粒子
        if (now - wolf.bornTime > CONFIG.WOLF_LIFETIME) {
            spawnParticles(
                wolf.x + CONFIG.WOLF_SIZE / 2,
                wolf.y + CONFIG.WOLF_SIZE / 2,
                '#666666'
            );
            wolves.splice(i, 1);
            continue;
        }

        // 2. 重力作用：每帧增加向下的速度（核心！）
        wolf.dy += CONFIG.GRAVITY;

        // 3. 更新位置
        wolf.x += wolf.dx;
        wolf.y += wolf.dy;

        // 4. 底部边界碰撞（地面）：弹跳逻辑
        const wolfBottom = wolf.y + CONFIG.WOLF_SIZE;
        if (wolfBottom >= canvasHeight) {
            // 修正位置：防止狼穿模到地面以下
            wolf.y = canvasHeight - CONFIG.WOLF_SIZE;

            // 只有向下落的时候才触发弹跳（避免连续触发）
            if (wolf.dy > 0) {
                // 随机弹跳高度：负值=向上跳，范围从 CONFIG 取
                const bouncePower = -random(
                    CONFIG.MIN_BOUNCE_Y,
                    CONFIG.MAX_BOUNCE_Y
                );
                wolf.dy = bouncePower;

                // 随机水平方向：可能变向，也可能保持原方向
                wolf.dx = (Math.random() > 0.5 ? 1 : -1) *
                    random(CONFIG.MIN_DX, CONFIG.MAX_DX);

                // 落地炸棕色粒子（泥土感）
                spawnParticles(
                    wolf.x + CONFIG.WOLF_SIZE / 2,
                    canvasHeight,
                    '#8B4513'
                );
            }
        }

        // 5. 顶部边界碰撞
        if (wolf.y <= 0) {
            wolf.y = 0;
            wolf.dy = Math.abs(wolf.dy) * CONFIG.BOUNCE_FACTOR; // 衰减弹跳
            spawnParticles(wolf.x + CONFIG.WOLF_SIZE / 2, 0, '#888888');
        }

        // 6. 左右边界碰撞
        if (wolf.x <= 0) {
            wolf.x = 0;
            wolf.dx = Math.abs(wolf.dx); // 向右弹
            spawnParticles(0, wolf.y + CONFIG.WOLF_SIZE / 2, '#888888');
        }
        if (wolf.x + CONFIG.WOLF_SIZE >= canvasWidth) {
            wolf.x = canvasWidth - CONFIG.WOLF_SIZE;
            wolf.dx = -Math.abs(wolf.dx); // 向左弹
            spawnParticles(canvasWidth, wolf.y + CONFIG.WOLF_SIZE / 2, '#888888');
        }

        // 7. 狼与狼碰撞：变脸 + 互换速度
        for (let j = i + 1; j < wolves.length; j++) {
            const otherWolf = wolves[j];
            if (isCollide(wolf, otherWolf, CONFIG.WOLF_SIZE, CONFIG.WOLF_SIZE)) {
                // 互换类型（狼变狗，狗变狼）
                [wolf.type, otherWolf.type] = [otherWolf.type, wolf.type];
                // 互换速度（简化弹性碰撞）
                [wolf.dx, otherWolf.dx] = [otherWolf.dx, wolf.dx];
                [wolf.dy, otherWolf.dy] = [otherWolf.dy, wolf.dy];
                // 炸橙色粒子
                spawnParticles(
                    wolf.x + CONFIG.WOLF_SIZE / 2,
                    wolf.y + CONFIG.WOLF_SIZE / 2,
                    '#FF4500'
                );
            }
        }
    }

    // ---------- 狼与骨头碰撞检测 ----------
    for (let i = wolves.length - 1; i >= 0; i--) {
        const wolf = wolves[i];
        for (let j = bones.length - 1; j >= 0; j--) {
            const bone = bones[j];
            if (isCollide(wolf, bone, CONFIG.WOLF_SIZE, CONFIG.BONE_SIZE)) {
                // 炸金色粒子（得分反馈）
                spawnParticles(
                    bone.x + CONFIG.BONE_SIZE / 2,
                    bone.y + CONFIG.BONE_SIZE / 2,
                    '#FFD700'
                );
                // 移除骨头
                bones.splice(j, 1);
                // 返回事件给 game.js 更新分数
                return { type: 'eat_bone' };
            }
        }
    }

    return null;
}

// ==================== 实体绘制 ====================
/**
 * 绘制所有实体（每帧调用）
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 */
export function drawEntities(ctx) {
    // ---------- 绘制骨头 ----------
    bones.forEach(bone => {
        if (CONFIG.USE_EMOJI) {
            // emoji 模式：设置字体和对齐方式
            ctx.font = `${CONFIG.BONE_SIZE}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                CONFIG.BONE_EMOJI,
                bone.x + CONFIG.BONE_SIZE / 2,
                bone.y + CONFIG.BONE_SIZE / 2
            );
        } else {
            // 图片模式
            ctx.drawImage(
                assetCache.bone,
                bone.x,
                bone.y,
                CONFIG.BONE_SIZE,
                CONFIG.BONE_SIZE
            );
        }
    });

    // ---------- 绘制狼 ----------
    wolves.forEach(wolf => {
        const emoji = wolf.type === 'wolf' ? CONFIG.WOLF_EMOJI : CONFIG.DOG_EMOJI;
        if (CONFIG.USE_EMOJI) {
            ctx.font = `${CONFIG.WOLF_SIZE}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                emoji,
                wolf.x + CONFIG.WOLF_SIZE / 2,
                wolf.y + CONFIG.WOLF_SIZE / 2
            );
        } else {
            const img = wolf.type === 'wolf' ? assetCache.wolf : assetCache.dog;
            ctx.drawImage(
                img,
                wolf.x,
                wolf.y,
                CONFIG.WOLF_SIZE,
                CONFIG.WOLF_SIZE
            );
        }
    });
}
