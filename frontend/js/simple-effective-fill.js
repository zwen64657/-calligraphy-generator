// 简单有效的填充算法
class SimpleEffectiveFill {
    constructor() {
        this.ctx = null;
        this.initCanvas();
    }

    initCanvas() {
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
    }

    // 填充到指定宽度
    fillToWidth(text, targetWidth, fontSize = 16) {
        this.ctx.font = `${fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;

        const originalWidth = this.ctx.measureText(text).width;

        // 如果已经达到目标，直接返回
        if (originalWidth >= targetWidth * 0.95) {
            return text;
        }

        // 获取空格宽度
        const spaceWidth = this.ctx.measureText(' ').width;

        // 计算需要的空格数量
        const remaining = targetWidth * 0.98 - originalWidth; // 目标98%
        let spaceCount = Math.max(0, Math.floor(remaining / spaceWidth));

        // 创建填充后的文本
        let filledText = text + ' '.repeat(spaceCount);

        // 微调：如果还没达到95%，继续添加
        let currentWidth = this.ctx.measureText(filledText).width;
        while (currentWidth < targetWidth * 0.95) {
            filledText += ' ';
            currentWidth = this.ctx.measureText(filledText).width;
        }

        // 确保不超过目标
        while (currentWidth > targetWidth * 0.99 && filledText.endsWith(' ')) {
            filledText = filledText.slice(0, -1);
            currentWidth = this.ctx.measureText(filledText).width;
        }

        return filledText;
    }
}

// 导出类
window.SimpleEffectiveFill = SimpleEffectiveFill;