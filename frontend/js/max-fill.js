// 最大填充算法 - 不留空白
class MaxFill {
    constructor() {
        this.ctx = null;
        this.initCanvas();
    }

    initCanvas() {
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
    }

    // 最大填充到指定宽度
    fillToWidth(text, targetWidth, fontSize = 16) {
        this.ctx.font = `${fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;

        const originalWidth = this.ctx.measureText(text).width;

        // 如果已经达到目标，直接返回
        if (originalWidth >= targetWidth * 0.95) {
            return text;
        }

        // 获取多种填充字符
        const spaceWidth = this.ctx.measureText(' ').width;
        const dotWidth = this.ctx.measureText('·').width;
        const thinSpaceWidth = this.ctx.measureText(' ').width; // 窄空格 (U+202F)

        // 找到最小的填充字符
        let minWidth = Math.min(spaceWidth, dotWidth);
        if (thinSpaceWidth > 0) {
            minWidth = Math.min(minWidth, thinSpaceWidth);
        }

        // 使用最小字符填充
        let fillChar = '·';
        if (spaceWidth <= minWidth) fillChar = ' ';
        if (thinSpaceWidth > 0 && thinSpaceWidth <= minWidth) fillChar = ' ';

        const charWidth = this.ctx.measureText(fillChar).width;

        // 计算需要填充的字符数
        const remainingWidth = targetWidth * 0.999 - originalWidth; // 99.9%目标
        let fillCount = Math.floor(remainingWidth / charWidth);

        // 确保至少尝试一定数量
        fillCount = Math.max(fillCount, 100); // 至少100个字符

        // 从计算值开始，向上查找最佳填充数
        let bestFillCount = fillCount;
        let bestWidth = 0;
        let bestFillRate = 0;

        // 测试范围内所有可能的填充数
        const testRange = 50; // 测试范围
        for (let i = Math.max(0, fillCount - testRange); i <= fillCount + testRange; i++) {
            const testText = text + fillChar.repeat(i);
            const testWidth = this.ctx.measureText(testText).width;
            const fillRate = testWidth / targetWidth;

            // 找到最大且不超过目标的填充率
            if (fillRate > bestFillRate && fillRate <= 0.999) {
                bestFillRate = fillRate;
                bestWidth = testWidth;
                bestFillCount = i;
            }

            // 如果达到98%以上，可以提前退出
            if (fillRate >= 0.98) {
                break;
            }
        }

        // 创建最终填充文本
        const finalText = text + fillChar.repeat(bestFillCount);

        console.log('MaxFill debug:', {
            text,
            targetWidth,
            originalWidth,
            fillChar,
            fillCount: bestFillCount,
            finalWidth: this.ctx.measureText(finalText).width,
            fillRate: (this.ctx.measureText(finalText).width / targetWidth * 100).toFixed(2) + '%'
        });

        return finalText;
    }
}

// 导出类
window.MaxFill = MaxFill;