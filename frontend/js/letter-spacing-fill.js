// 使用 letterSpacing 属性的填充算法
class LetterSpacingFill {
    constructor() {
        this.ctx = null;
        this.fillCache = {}; // 添加填充缓存
        this.initCanvas();
    }

    initCanvas() {
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
    }

    // 使用 letterSpacing 填充到指定宽度
    fillToWidth(text, targetWidth, fontSize = 16) {
        // 检查缓存
        const cacheKey = `${text}_${targetWidth}_${fontSize}`;
        if (this.fillCache[cacheKey]) {
            return this.fillCache[cacheKey];
        }

        this.ctx.font = `${fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;

        const originalWidth = this.ctx.measureText(text).width;

        // 如果已经足够接近目标，直接返回
        if (originalWidth >= targetWidth * 0.98) {
            // 返回对象格式，保持一致性
            const result = {
                text: text,
                letterSpacing: 0
            };
            this.fillCache[cacheKey] = result;
            return result;
        }

        // 计算需要的额外宽度
        const neededWidth = targetWidth * 0.98 - originalWidth;

        // 计算字符间的字母间距
        // letterSpacing 是在每个字符后添加的间距
        const charCount = text.length;
        if (charCount === 0 || charCount === 1) {
            const result = {
                text: text,
                letterSpacing: 0
            };
            this.fillCache[cacheKey] = result;
            return result;
        }

        // 平均每个字符需要增加的间距
        let letterSpacingNeeded = neededWidth / (charCount - 1);

        // 限制最大间距，避免字符分离过开
        letterSpacingNeeded = Math.min(letterSpacingNeeded, fontSize * 0.5);

        // 使用原生 letterSpacing 属性
        try {
            // 设置字母间距
            this.ctx.letterSpacing = `${letterSpacingNeeded}px`;

            // 测量设置间距后的宽度
            let spacedWidth = this.ctx.measureText(text).width;

            // 如果超出，逐步减少间距
            let adjustedSpacing = letterSpacingNeeded;
            while (spacedWidth > targetWidth * 0.99 && adjustedSpacing > 0) {
                adjustedSpacing -= 0.5;
                this.ctx.letterSpacing = `${adjustedSpacing}px`;
                spacedWidth = this.ctx.measureText(text).width;
            }

            // 重置 letterSpacing（避免影响其他文本）
            this.ctx.letterSpacing = '0px';

            // 如果调整后的间距太小，使用空格填充
            if (adjustedSpacing < 1) {
                const result = this.fallbackSpaceFill(text, targetWidth, fontSize);
                this.fillCache[cacheKey] = result;
                return result;
            }

            // console.log('LetterSpacingFill debug:', {
            //     text,
            //     targetWidth,
            //     originalWidth,
            //     neededWidth,
            //     letterSpacingNeeded: adjustedSpacing.toFixed(2) + 'px',
            //     finalWidth: spacedWidth.toFixed(2)
            // });

            // 返回对象格式，包含间距信息
            const result = {
                text: text,
                letterSpacing: adjustedSpacing
            };

            // 缓存结果（限制缓存大小）
            if (Object.keys(this.fillCache).length > 200) {
                this.fillCache = {}; // 清空缓存，避免内存泄漏
            }
            this.fillCache[cacheKey] = result;
            return result;
        } catch (e) {
            console.error('letterSpacing not supported, falling back to space fill');
            // 回退到空格填充
            const result = this.fallbackSpaceFill(text, targetWidth, fontSize);
            this.fillCache[cacheKey] = result;
            return result;
        }
    }

    // 回退方案：使用空格填充
    fallbackSpaceFill(text, targetWidth, fontSize) {
        this.ctx.font = `${fontSize}px Arial`;
        const spaceWidth = this.ctx.measureText(' ').width;
        const remaining = targetWidth * 0.98 - this.ctx.measureText(text).width;
        const spaceCount = Math.max(0, Math.floor(remaining / spaceWidth));

        // 返回对象格式，保持一致性
        return {
            text: text + ' '.repeat(spaceCount),
            letterSpacing: 0 // 使用空格填充时不需要letterSpacing
        };
    }
}

// 导出类
window.LetterSpacingFill = LetterSpacingFill;