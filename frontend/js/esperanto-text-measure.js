// 世界语文本测量和填充模块
class EsperantoTextMeasure {
    constructor() {
        this.fontCache = {};
        this.ctx = null;
        this.measureCache = {}; // 添加测量缓存
        this.initCanvas();
    }

    // 初始化Canvas用于文本测量
    initCanvas() {
        const canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
        this.ctx.font = '16px Arial';
    }

    // 获取字体
    getFont(fontSize = 16) {
        const key = `Arial_${fontSize}`;
        if (!this.fontCache[key]) {
            // 确保支持世界语特殊字符
            this.fontCache[key] = `${fontSize}px Arial, "Arial Unicode MS", "Noto Sans"`;
        }
        return this.fontCache[key];
    }

    // 检测世界语特殊字符
    isEsperantoChar(char) {
        const esperantoChars = ['ĉ', 'ĝ', 'ĥ', 'ĵ', 'ŝ', 'ŭ', 'Ĉ', 'Ĝ', 'Ĥ', 'Ĵ', 'Ŝ', 'Ŭ'];
        return esperantoChars.includes(char);
    }

    // 检测文本是否包含世界语特殊字符
    containsEsperantoChars(text) {
        const esperantoChars = ['ĉ', 'ĝ', 'ĥ', 'ĵ', 'ŝ', 'ŭ', 'Ĉ', 'Ĝ', 'Ĥ', 'Ĵ', 'Ŝ', 'Ŭ'];
        for (const char of text) {
            if (esperantoChars.includes(char)) {
                return true;
            }
        }
        return false;
    }

    // 精确的文本换行（改进版）
    wrapText(text, settings) {
        const {
            fontSize = 16,
            lineWidth = 694,
            lineHeight = 30
        } = settings;

        // 检查缓存
        const cacheKey = `${text}_${fontSize}_${lineWidth}`;
        if (this.measureCache[cacheKey]) {
            return this.measureCache[cacheKey];
        }

        // 设置字体以确保准确测量
        this.ctx.font = this.getFont(fontSize);

        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                lines.push('');
                continue;
            }

            // 使用改进的单词处理算法
            const processedLines = this.processParagraphWithWords(paragraph, lineWidth, fontSize);
            lines.push(...processedLines);
        }

        // 缓存结果（限制缓存大小）
        if (Object.keys(this.measureCache).length > 100) {
            this.measureCache = {}; // 清空缓存，避免内存泄漏
        }
        this.measureCache[cacheKey] = lines;

        return lines;
    }

    // 改进的段落处理方法，支持单词边界和字符测量
    processParagraphWithWords(paragraph, lineWidth, fontSize) {
        const lines = [];

        // 按空格分割，但保留空格信息
        const words = this.splitWordsPreservingSpaces(paragraph);
        let currentLine = '';
        let currentWidth = 0;

        for (const wordInfo of words) {
            const word = wordInfo.text;
            const hasSpaceBefore = wordInfo.hasSpaceBefore;

            // 构建测试行
            const testLine = hasSpaceBefore && currentLine ? currentLine + ' ' + word : currentLine + word;
            const testWidth = this.measureTextPrecisely(testLine, fontSize);

            if (testWidth <= lineWidth * 0.95) { // 保留5%空间用于填充
                currentLine = testLine;
                currentWidth = testWidth;
            } else {
                // 当前行满，填充并开始新行
                if (currentLine) {
                    lines.push(this.fillLine(currentLine, lineWidth, fontSize));
                }

                // 检查单词本身是否太长
                const wordWidth = this.measureTextPrecisely(word, fontSize);
                if (wordWidth > lineWidth * 0.95) {
                    // 单词太长，需要按字符分割
                    const splitWords = this.splitWordByWidth(word, lineWidth, fontSize);
                    lines.push(...splitWords.map(w => this.fillLine(w, lineWidth, fontSize)));
                    currentLine = '';
                    currentWidth = 0;
                } else {
                    currentLine = word;
                    currentWidth = wordWidth;
                }
            }
        }

        // 处理最后一行
        if (currentLine) {
            lines.push(this.fillLine(currentLine, lineWidth, fontSize));
        }

        return lines;
    }

    // 精确的文本测量，考虑世界语特殊字符
    measureTextPrecisely(text, fontSize) {
        // 确保字体设置正确
        this.ctx.font = this.getFont(fontSize);

        // 对于世界语特殊字符，使用双重测量确保准确性
        if (this.containsEsperantoChars(text)) {
            // 第一次测量
            const firstMeasure = this.ctx.measureText(text).width;

            // 对于包含特殊字符的文本，进行验证测量
            if (text.length > 1) {
                // 逐个字符测量再求和，验证准确性
                let charSumWidth = 0;
                for (const char of text) {
                    charSumWidth += this.ctx.measureText(char).width;
                }

                // 取较大值作为更准确的测量
                return Math.max(firstMeasure, charSumWidth * 0.95); // 5%的调整因子
            }

            return firstMeasure;
        }

        // 普通文本直接测量
        return this.ctx.measureText(text).width;
    }

    // 按单词分割，保留空格信息
    splitWordsPreservingSpaces(text) {
        const result = [];
        let currentWord = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === ' ') {
                if (currentWord) {
                    result.push({ text: currentWord, hasSpaceBefore: false });
                    currentWord = '';
                }
                // 连续空格作为单独的"单词"
                result.push({ text: ' ', hasSpaceBefore: true });
            } else {
                currentWord += char;
            }
        }

        if (currentWord) {
            result.push({ text: currentWord, hasSpaceBefore: false });
        }

        return result;
    }

    // 按宽度分割单词（处理超长单词）
    splitWordByWidth(word, maxWidth, fontSize) {
        const lines = [];
        let currentPart = '';

        // 确保字体设置正确
        this.ctx.font = this.getFont(fontSize);

        for (const char of word) {
            const testPart = currentPart + char;
            const testWidth = this.measureTextPrecisely(testPart, fontSize);

            if (testWidth <= maxWidth * 0.95) {
                currentPart = testPart;
            } else {
                // 如果当前部分为空，说明单个字符就超宽，强制添加
                if (currentPart === '') {
                    lines.push(char);
                } else {
                    lines.push(currentPart);
                    currentPart = char;
                }
            }
        }

        // 添加剩余部分
        if (currentPart) {
            lines.push(currentPart);
        }

        return lines;
    }

    // 填充行到指定宽度
    fillLine(text, maxWidth, fontSize) {
        this.ctx.font = this.getFont(fontSize);

        // 优先使用 letterSpacing 方法
        if (!window.letterSpacingFill) {
            window.letterSpacingFill = new window.LetterSpacingFill();
        }

        return window.letterSpacingFill.fillToWidth(text, maxWidth, fontSize);
    }

    // 分页处理
    paginateText(lines, lineHeight = 30, pageHeight = 1123) {
        const marginTop = 60;
        const marginBottom = 60;
        const availableHeight = pageHeight - marginTop - marginBottom;
        const linesPerPage = Math.floor(availableHeight / lineHeight);
        const pages = [];

        for (let i = 0; i < lines.length; i += linesPerPage) {
            const pageLines = lines.slice(i, i + linesPerPage);
            if (pageLines.length > 0) {
                pages.push(pageLines);
            }
        }

        return pages;
    }
}

// 导出类
window.EsperantoTextMeasure = EsperantoTextMeasure;