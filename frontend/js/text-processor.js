// 统一文本处理器 - 整合所有文本处理功能
class TextProcessor {
    constructor() {
        this.ctx = this.createCanvas();
        this.measurer = null;
        this.filler = null;
        this.initialized = false;
        this.initModules();
    }

    // 创建Canvas用于文本测量
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 1000; // 设置合适的尺寸
        canvas.height = 100;
        return canvas.getContext('2d');
    }

    // 初始化依赖模块
    initModules() {
        // 延迟初始化，确保所有模块都已加载
        const tryInit = () => {
            try {
                if (window.LetterSpacingFill && !window.letterSpacingFill) {
                    window.letterSpacingFill = new window.LetterSpacingFill();
                    console.log('TextProcessor: LetterSpacingFill 初始化成功');
                }

                if (window.EsperantoTextMeasure && !window.improvedTextMeasure) {
                    window.improvedTextMeasure = new window.EsperantoTextMeasure();
                    console.log('TextProcessor: EsperantoTextMeasure 初始化成功');
                }

                // 检查是否所有模块都已初始化
                if (window.letterSpacingFill && window.improvedTextMeasure) {
                    this.measurer = window.improvedTextMeasure;
                    this.filler = window.letterSpacingFill;
                    this.initialized = true;
                    console.log('TextProcessor: 所有模块初始化完成');
                }
            } catch (e) {
                console.error('TextProcessor: 模块初始化失败', e);
            }
        };

        // 立即尝试初始化
        tryInit();

        // 延迟重试
        setTimeout(tryInit, 100);
        setTimeout(tryInit, 500);
    }

    // 智能文本换行（支持letterSpacing）
    smartWrapText(text, maxWidth, fontSize, letterSpacing = 0) {
        // 如果模块未初始化，使用基础换行
        if (!this.initialized) {
            return this.basicWrapText(text, maxWidth, fontSize).map(line => ({
                text: line,
                letterSpacing: 0
            }));
        }

        try {
            // 使用改进的文本测量器
            const settings = {
                fontSize: fontSize,
                lineWidth: maxWidth,
                lineHeight: 30
            };

            // 获取换行结果
            const wrappedLines = this.measurer.wrapText(text, settings);

            // 如果需要letterSpacing，进一步处理
            if (letterSpacing > 0) {
                return wrappedLines.map(line => {
                    if (typeof line === 'object' && line.text) {
                        return line; // 已经处理过的对象
                    } else {
                        // 需要添加letterSpacing
                        const filledLine = this.filler.fillToWidth(line, maxWidth, fontSize);
                        return filledLine;
                    }
                });
            }

            // 转换为统一格式
            return wrappedLines.map(line => {
                if (typeof line === 'object' && line.text) {
                    return line;
                } else {
                    return {
                        text: line,
                        letterSpacing: 0
                    };
                }
            });

        } catch (e) {
            console.error('TextProcessor: 智能换行失败，使用基础方案', e);
            return this.basicWrapText(text, maxWidth, fontSize).map(line => ({
                text: line,
                letterSpacing: 0
            }));
        }
    }

    // 基础换行实现（回退方案）
    basicWrapText(text, maxWidth, fontSize) {
        // 设置字体
        this.ctx.font = `${fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;

        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                lines.push('');
                continue;
            }

            // 逐字符处理，确保精确
            let currentLine = '';
            let currentWidth = 0;

            for (let i = 0; i < paragraph.length; i++) {
                const char = paragraph[i];

                // 处理换行符
                if (char === '\n') {
                    lines.push(currentLine);
                    currentLine = '';
                    currentWidth = 0;
                    continue;
                }

                // 测量添加字符后的宽度
                const testLine = currentLine + char;
                const testWidth = this.ctx.measureText(testLine).width;

                if (testWidth <= maxWidth * 0.95) { // 保留5%空间
                    currentLine = testLine;
                    currentWidth = testWidth;
                } else {
                    // 当前行满，开始新行
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    currentLine = char;
                    currentWidth = this.ctx.measureText(char).width;
                }
            }

            // 添加最后的内容
            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    // 精确测量文本宽度
    measureText(text, fontSize) {
        this.ctx.font = `${fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;
        return this.ctx.measureText(text).width;
    }

    // 检查文本是否需要换行
    needsWrapping(text, maxWidth, fontSize) {
        const measuredWidth = this.measureText(text, fontSize);
        return measuredWidth > maxWidth * 0.95;
    }

    // 按宽度分割单词
    splitWordByWidth(word, maxWidth, fontSize) {
        const lines = [];
        let currentPart = '';

        for (const char of word) {
            const testPart = currentPart + char;
            const testWidth = this.measureText(testPart, fontSize);

            if (testWidth <= maxWidth * 0.95) {
                currentPart = testPart;
            } else {
                if (currentPart) {
                    lines.push(currentPart);
                }
                currentPart = char;
            }
        }

        if (currentPart) {
            lines.push(currentPart);
        }

        return lines;
    }

    // 创建使用空格填充的文本
    createSpaceFilledText(text, letterSpacing, fontSize) {
        const spaceWidth = this.measureText(' ', fontSize);
        const spaceCount = Math.max(1, Math.round(letterSpacing / spaceWidth));
        const spaceString = ' '.repeat(spaceCount);
        return text.split('').join(spaceString);
    }

    // 获取文本的字符数（考虑世界语特殊字符）
    getCharacterCount(text) {
        // 直接返回字符长度，JavaScript的字符串处理已经支持Unicode
        return text.length;
    }

    // 估算页数
    estimatePages(text, fontSize, lineSpacing, pageWidth = 694, pageHeight = 1003) {
        // 页面可用高度
        const availableHeight = pageHeight - 120; // 减去上下边距
        const linesPerPage = Math.floor(availableHeight / lineSpacing);

        // 使用智能换行计算行数
        const wrappedLines = this.smartWrapText(text, pageWidth, fontSize);
        const totalPages = Math.ceil(wrappedLines.length / linesPerPage);

        return totalPages;
    }

    // 清理资源
    cleanup() {
        if (this.ctx && this.ctx.canvas) {
            this.ctx.canvas.width = 0;
            this.ctx.canvas.height = 0;
        }
    }
}

// 创建全局文本处理器实例
window.textProcessor = new TextProcessor();

// 导出类
window.TextProcessor = TextProcessor;