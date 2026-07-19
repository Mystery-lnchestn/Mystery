// game.js (片段)

// 触摸/点击生成狼
function handleTap(x, y) {
    createWolf(x, y); // 调用 entities.js 里的函数
    wolvesCount++;
}

// 监听触摸（iPad 专用）
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    handleTap(
        e.changedTouches[0].clientX - rect.left,
        e.changedTouches[0].clientY - rect.top
    );
});

// 监听鼠标点击（电脑调试用）
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleTap(e.clientX - rect.left, e.clientY - rect.top);
});
