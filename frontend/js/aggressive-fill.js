// 激进的文本填充算法
class AggressiveTextFill {
    constructor() {
        this.ctx = null;
        this.initCanvas();
    }

    initCanvas() {
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
    }

    // 智能填充到指定宽度
    fillToWidth(text, targetWidth, fontSize = 16) {
        this.ctx.font = `${fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;

        const originalText = text;
        const originalWidth = this.ctx.measureText(originalText).width;

        // 如果已经达到目标，直接返回
        if (originalWidth >= targetWidth * 0.95) {
            return originalText;
        }

        // 获取不同填充字符的宽度
        const fillChars = [
            { char: ' ', width: this.ctx.measureText(' ').width },
            { char: '·', width: this.ctx.measureText('·').width },
            { char: '˙', width: this.ctx.measureText('˙').width },  // 更小的点
            { char: '.', width: this.ctx.measureText('.').width },
            { char: '_', width: this.ctx.measureText('_').width }
        ];

        // 过滤掉宽度为0的字符
        const validFillChars = fillChars.filter(fc => fc.width > 0);

        // 按字符宽度排序（小的在前）
        validFillChars.sort((a, b) => a.width - b.width);

        let bestResult = originalText;
        let bestWidth = originalWidth;

        // 尝试多种填充组合
        // 策略1：只使用最小的字符
        const smallestChar = validFillChars[0];
        if (smallestChar) {
            const remaining = targetWidth - originalWidth;
            const maxCount = Math.floor(remaining / smallestChar.width);

            // 从最大数量开始向下查找
            // 对于目标宽度694px和最小字符宽度4px，需要约170个字符
            for (let count = maxCount; count >= Math.max(0, maxCount - 50); count--) {
                const testText = originalText + smallestChar.char.repeat(count);
                const testWidth = this.ctx.measureText(testText).width;

                // 优先选择填充率更高的结果
                const fillRate = testWidth / targetWidth;
                const bestFillRate = bestWidth / targetWidth;

                if (testWidth <= targetWidth && fillRate > bestFillRate) {
                    bestResult = testText;
                    bestWidth = testWidth;
                }

                // 如果已经达到95%以上，可以提前退出
                if (fillRate >= 0.95) {
                    break;
                }
            }
        }

        // 策略2：混合使用不同的字符
        // 先用小字符填充大部分，再用大字符微调
        if (validFillChars.length >= 2) {
            const smallChar = validFillChars[0];
            const largeChar = validFillChars[validFillChars.length - 1];

            const remaining = targetWidth - originalWidth;
            const smallCount = Math.floor(remaining * 0.9 / smallChar.width);

            if (smallCount > 0) {
                let testText = originalText + smallChar.char.repeat(smallCount);
                let currentWidth = this.ctx.measureText(testText).width;

                // 用大字符微调
                while (currentWidth < targetWidth * 0.98) {
                    testText += largeChar.char;
                    currentWidth = this.ctx.measureText(testText).width;

                    if (currentWidth > targetWidth) {
                        testText = testText.slice(0, -1);
                        break;
                    }
                }

                if (currentWidth > bestWidth && currentWidth <= targetWidth) {
                    bestResult = testText;
                    bestWidth = currentWidth;
                }
            }
        }

        // 策略3：渐变填充（从小到大）
        let testText = originalText;
        let currentWidth = originalWidth;

        for (const fillChar of validFillChars) {
            while (currentWidth < targetWidth * 0.95) {
                testText += fillChar.char;
                currentWidth = this.ctx.measureText(testText).width;

                if (currentWidth > targetWidth) {
                    testText = testText.slice(0, -1);
                    currentWidth = this.ctx.measureText(testText).width;
                    break;
                }
            }

            if (currentWidth > bestWidth) {
                bestResult = testText;
                bestWidth = currentWidth;
            }
        }

        return bestResult;
    }
}

// 导出类
window.AggressiveTextFill = AggressiveTextFill;