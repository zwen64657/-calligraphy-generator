// 预览渲染模块
class PreviewRenderer {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentPage = 0;
        this.pages = [];
        this.scale = 1; // 缩放比例
        this.isRendering = false; // 防止重复渲染
        this.renderQueue = false; // 渲染队列标记

        // A4尺寸设置
        this.width = 794;
        this.height = 1123;
        this.marginLeft = 50;
        this.marginRight = 50;
        this.marginTop = 60;
        this.marginBottom = 60;
        this.contentWidth = this.width - this.marginLeft - this.marginRight;
        this.contentHeight = this.height - this.marginTop - this.marginBottom;

        // 初始化canvas尺寸
        this.initCanvas();
    }

    initCanvas() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    // 设置缩放比例
    setScale(scale) {
        this.scale = scale;
        this.canvas.style.width = `${this.width * scale}px`;
        this.canvas.style.height = `${this.height * scale}px`;
    }

    // 清除画布
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        // 白色背景
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);
        // 添加灰色边框以便调试可见性
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.width, this.height);
    }

    // 绘制线条
    drawLines(settings) {
        this.ctx.strokeStyle = settings.lineColor;
        this.ctx.lineWidth = 1;

        // 根据线条样式设置
        switch (settings.lineStyle) {
            case 'dashed':
                this.ctx.setLineDash([5, 5]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 3]);
                break;
            default:
                this.ctx.setLineDash([]);
        }

        const startY = this.marginTop;
        const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);

        for (let i = 0; i < linesPerPage; i++) {
            const y = startY + (i * settings.lineSpacing);
            this.ctx.beginPath();
            this.ctx.moveTo(this.marginLeft, y);
            this.ctx.lineTo(this.width - this.marginRight, y);
            this.ctx.stroke();
        }

        // 重置线条样式
        this.ctx.setLineDash([]);
    }

    // 绘制文本
    drawText(lines, settings, pageIndex = 0) {
        // 设置字体
        this.ctx.font = `italic ${settings.fontSize}px Calibri`;
        this.ctx.fillStyle = settings.fontColor;

        const startY = this.marginTop;

        // 横向文本绘制
        this.drawHorizontalText(lines, settings, startY);
    }

    // 绘制横向文本（优化版）
    drawHorizontalText(lines, settings, startY) {
        this.ctx.textBaseline = 'bottom'; // 使用bottom基线让文本底部与线条对齐

        // 绘制每一行
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const y = startY + (i * settings.lineSpacing); // 修复：让文本显示在对应的横线上

            // 如果超出页面高度，停止绘制
            if (y > this.height - this.marginBottom - settings.lineSpacing) {
                break;
            }

            // 处理文本行
            if (line && line.trim() !== '') {
                // 兼容不同的数据结构
                let textToDraw = '';
                let letterSpacing = 0;

                if (typeof line === 'object' && line.text) {
                    textToDraw = line.text;
                    letterSpacing = line.letterSpacing || 0;
                } else if (typeof line === 'string') {
                    textToDraw = line;
                }

                if (textToDraw) {
                    // 保存当前渲染状态
                    const currentFont = this.ctx.font;
                    const currentFillStyle = this.ctx.fillStyle;
                    const currentLetterSpacing = this.ctx.letterSpacing || '0px';

                    // 确保字体设置正确
                    this.ctx.font = `italic ${settings.fontSize}px Calibri`;
                    this.ctx.fillStyle = settings.fontColor;

                    // 尝试设置字母间距
                    let letterSpacingApplied = false;
                    if (letterSpacing > 0) {
                        letterSpacingApplied = this.applyLetterSpacing(letterSpacing);
                    }

                    // 如果letterSpacing不支持，使用空格填充回退方案
                    if (letterSpacing > 0 && !letterSpacingApplied) {
                        textToDraw = this.createSpaceFilledText(textToDraw, letterSpacing, settings.fontSize);
                    }

                    // 精确对齐的文本绘制
                    this.ctx.fillText(textToDraw, this.marginLeft, y);

                    // 恢复渲染状态
                    this.ctx.font = currentFont;
                    this.ctx.fillStyle = currentFillStyle;
                    this.ctx.letterSpacing = currentLetterSpacing;
                }
            }
        }
    }

    // 应用字母间距（支持兼容性检测）
    applyLetterSpacing(letterSpacing) {
        try {
            // 测试浏览器是否支持letterSpacing
            const testText = 'test';
            const originalWidth = this.ctx.measureText(testText).width;

            this.ctx.letterSpacing = `${letterSpacing}px`;
            const spacedWidth = this.ctx.measureText(testText).width;

            // 如果宽度有变化，说明letterSpacing生效
            if (spacedWidth > originalWidth) {
                return true;
            } else {
                // 不支持，重置并返回false
                this.ctx.letterSpacing = '0px';
                return false;
            }
        } catch (e) {
            console.warn('letterSpacing not supported in this browser, using fallback');
            return false;
        }
    }

    // 创建使用空格填充的文本（letterSpacing回退方案）
    createSpaceFilledText(text, letterSpacing, fontSize) {
        // 计算一个空格的宽度
        const spaceWidth = this.ctx.measureText(' ').width;

        // 计算需要的空格数量
        const spaceCount = Math.max(1, Math.round(letterSpacing / spaceWidth));
        const spaceString = ' '.repeat(spaceCount);

        // 在字符之间插入空格
        return text.split('').join(spaceString);
    }

    
    // 绘制页码
    drawPageNumber(pageIndex, totalPages) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `第 ${pageIndex + 1} 页 / 共 ${totalPages} 页`,
            this.width / 2,
            this.height - 20
        );
        this.ctx.textAlign = 'left'; // 重置对齐方式
    }

    // 渲染单个页面
    renderPage(pageIndex, text, settings) {
        this.clear();

        // 绘制线条
        this.drawLines(settings);

        // 获取当前页的文本行
        let pageLines = [];
        let totalPages = 1;

        if (this.pages && this.pages.length > 0) {
            // 使用已处理的分页数据
            pageLines = this.pages[pageIndex] || [];
            totalPages = this.pages.length;
        } else {
            // 前端简单处理（备用方案）
            // 横向模式：使用原有的换行逻辑
            const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);
            const allLines = Utils.splitTextIntoLines(text, Math.floor(this.contentWidth / (settings.fontSize * 0.6)));
            const startIndex = pageIndex * linesPerPage;
            pageLines = allLines.slice(startIndex, startIndex + linesPerPage);
            totalPages = Math.ceil(allLines.length / linesPerPage);
        }

        // 绘制文本
        if (pageLines.length > 0) {
            this.drawText(pageLines, settings, pageIndex);
        }

        // 绘制页码
        this.drawPageNumber(pageIndex, totalPages);

        return totalPages;
    }

    // 更新预览（实时更新版本）
    updatePreview(text, settings) {
        // 如果没有文本，显示空白页
        if (!text || text.trim() === '') {
            this.clear();
            this.drawLines(settings);
            this.drawPageNumber(0, 1);
            this.updatePageNavigation();
            return;
        }

        // 防止同时渲染多个请求
        if (this.isRendering) {
            this.renderQueue = true; // 标记需要重新渲染
            return;
        }

        this.isRendering = true;

        // 优化缓存：只在文本完全相同时使用缓存
        const cacheKey = `${text}_${JSON.stringify(settings)}`;
        if (this.lastRenderCache && this.lastRenderCache.key === cacheKey) {
            this.isRendering = false;
            return; // 使用缓存，避免重复渲染
        }

        // 直接渲染，无延迟
        try {
            // 优先使用TextProcessor
            if (window.textProcessor && window.textProcessor.initialized) {
                const processor = window.textProcessor;

                // 使用智能文本处理
                const processedLines = processor.smartWrapText(
                    text,
                    this.contentWidth,
                    settings.fontSize,
                    settings.letterSpacing || 0
                );

                // 分页处理
                const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);
                this.pages = [];

                for (let i = 0; i < processedLines.length; i += linesPerPage) {
                    this.pages.push(processedLines.slice(i, i + linesPerPage));
                }

                this.currentPage = 0;
                this.renderCurrentPage(text, settings);
                this.updatePageNavigation();

                // 缓存渲染结果
                this.lastRenderCache = {
                    key: cacheKey,
                    timestamp: Date.now()
                };
            } else if (window.improvedTextMeasure) {
                // 备选方案：使用改进的文本测量
                const measure = window.improvedTextMeasure;

                // 精确测量每一行的宽度
                const lines = measure.wrapText(text, settings);

                // 分页处理
                this.pages = measure.paginateText(lines, settings.lineSpacing);
                this.currentPage = 0;

                // 渲染当前页
                this.renderCurrentPage(text, settings);
                this.updatePageNavigation();

                // 缓存渲染结果
                this.lastRenderCache = {
                    key: cacheKey,
                    timestamp: Date.now()
                };
            } else {
                // 使用备用方案
                this.simpleTextUpdatePreview(text, settings);
            }
        } catch (error) {
            console.error('文本渲染失败，使用简单方案:', error);
            this.simpleTextUpdatePreview(text, settings);
        }

        this.isRendering = false;

        // 如果有新的渲染请求，处理队列
        if (this.renderQueue) {
            this.renderQueue = false;
            // 使用 setTimeout 确保不会造成阻塞
            setTimeout(() => {
                this.updatePreview(text, settings);
            }, 0);
        }
    }

    // 简单文本更新预览（支持自动换行和竖向模式）
    simpleTextUpdatePreview(text, settings) {
        try {
            // 清空画布并绘制线条
            this.clear();
            this.drawLines(settings);

            // 设置字体
            this.ctx.font = `${settings.fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;
            this.ctx.fillStyle = settings.fontColor;

            // 横向模式：自动换行处理
            this.renderHorizontalText(text, settings);
        } catch (error) {
            console.error('文本渲染失败:', error);
            // 回退到简单渲染
            this.fallbackSimpleTextRender(text, settings);
        }
    }

    // 渲染横向文本
    renderHorizontalText(text, settings) {
        // 计算可用宽度
        const availableWidth = this.width - this.marginLeft - this.marginRight;

        // 自动换行处理
        const wrappedLines = this.wrapTextToWidth(text, availableWidth, settings.fontSize);

        // 分页处理
        const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);
        const pages = [];
        
        for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
            pages.push(wrappedLines.slice(i, i + linesPerPage));
        }

        // 绘制当前页（第一页）
        const currentPageLines = pages[0] || [];
        this.ctx.textBaseline = 'bottom'; // 文本底部与线条对齐
        for (let i = 0; i < currentPageLines.length; i++) {
            const line = currentPageLines[i];
            const y = this.marginTop + (i * settings.lineSpacing); // 修复：让文本显示在对应的横线上

            if (line.trim() !== '') {
                // 精确对齐的文本渲染
                this.ctx.fillText(line, this.marginLeft, y);
            }
        }

        // 更新分页信息
        this.pages = pages;
        this.currentPage = 0;

        // 绘制页码
        const totalPages = pages.length || 1;
        this.drawPageNumber(0, totalPages);

        // 更新导航
        this.updatePageNavigation();

        console.log('自动换行文本渲染完成，共', totalPages, '页');
    }

    
    // 文本自动换行到指定宽度（改进版）
    wrapTextToWidth(text, maxWidth, fontSize) {
        // 设置字体以确保准确测量
        this.ctx.font = `italic ${fontSize}px Calibri`;

        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                lines.push(''); // 空行
                continue;
            }

            // 按空格分割单词
            const words = paragraph.split(' ');
            let currentLine = '';

            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const testWidth = this.ctx.measureText(testLine).width;

                if (testWidth <= maxWidth) {
                    currentLine = testLine;
                } else {
                    // 如果当前行为空，说明单个单词太长，需要按字符分割
                    if (!currentLine) {
                        // 处理超长单词：按字符分割
                        const splitWords = this.splitWordByWidth(word, maxWidth, fontSize);
                        lines.push(...splitWords);
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
            }

            // 添加最后一行
            if (currentLine) {
                // 检查最后一行是否也超长
                const lastLineWidth = this.ctx.measureText(currentLine).width;
                if (lastLineWidth > maxWidth) {
                    // 如果超长，按字符分割
                    const splitWords = this.splitWordByWidth(currentLine, maxWidth, fontSize);
                    lines.push(...splitWords);
                } else {
                    lines.push(currentLine);
                }
            }
        }

        return lines;
    }

    // 按宽度分割单词（处理超长单词）
    splitWordByWidth(word, maxWidth, fontSize) {
        const lines = [];
        let currentPart = '';

        // 确保字体设置正确
        this.ctx.font = `italic ${fontSize}px Calibri`;

        for (const char of word) {
            const testPart = currentPart + char;
            const testWidth = this.ctx.measureText(testPart).width;

            if (testWidth <= maxWidth) {
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

    // 简单的文本渲染回退方案
    fallbackSimpleTextRender(text, settings) {
        // 清空画布并绘制线条
        this.clear();
        this.drawLines(settings);

        // 设置字体
        this.ctx.font = `italic ${settings.fontSize}px Calibri`;
        this.ctx.fillStyle = settings.fontColor;

        // 横向模式渲染
        this.ctx.textBaseline = 'bottom';
        const lines = text.split('\n');
        const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);

        // 限制显示行数
        const displayLines = lines.slice(0, linesPerPage);

        // 绘制每一行文本
        for (let i = 0; i < displayLines.length; i++) {
            const line = displayLines[i];
            const y = this.marginTop + (i * settings.lineSpacing); // 修复：让文本显示在对应的横线上

            if (line.trim() !== '') {
                this.ctx.fillText(line, this.marginLeft, y);
            }
        }

        // 更新分页信息
        const totalPages = Math.ceil(lines.length / linesPerPage) || 1;
        this.pages = [];
        for (let i = 0; i < lines.length; i += linesPerPage) {
            this.pages.push(lines.slice(i, i + linesPerPage));
        }
        this.currentPage = 0;

        // 绘制页码
        this.drawPageNumber(0, this.pages.length || 1);

        // 更新导航
        this.updatePageNavigation();

        console.log('简单文本渲染完成，共', this.pages.length || 1, '页');
    }

    // 备用预览更新方案
    fallbackUpdatePreview(text, settings) {
        requestAnimationFrame(() => {
            try {
                // 计算最大文本宽度
                const maxTextWidth = this.width - this.marginLeft - this.marginRight; // 794 - 50 - 50 = 694
                const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);

                // 分割文本
                const allLines = text.split('\n');
                const wrappedLines = [];

                for (const line of allLines) {
                    if (line.trim() === '') {
                        wrappedLines.push('');
                        continue;
                    }

                    // 创建临时Canvas来测量文本宽度
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.font = `${settings.fontSize}px Arial`;

                    // 如果没有 LetterSpacingFill，使用简单方案
                    if (!window.letterSpacingFill) {
                        // 简单按字符宽度分割
                        const maxCharsPerLine = Math.floor(maxTextWidth / (settings.fontSize * 0.6));
                        if (line.length <= maxCharsPerLine) {
                            wrappedLines.push(line);
                        } else {
                            // 分割长行
                            for (let i = 0; i < line.length; i += maxCharsPerLine) {
                                wrappedLines.push(line.substring(i, i + maxCharsPerLine));
                            }
                        }
                        continue;
                    }

                    // 使用 LetterSpacingFill 处理
                    try {
                        // 使用 letterSpacingFill 填充到指定宽度
                        const filledLine = window.letterSpacingFill.fillToWidth(
                            line,
                            maxTextWidth,
                            settings.fontSize
                        );
                        wrappedLines.push(filledLine);
                    } catch (e) {
                        console.error('填充文本失败，使用原文本:', e);
                        wrappedLines.push(line);
                    }
                }

                // 分页
                this.pages = [];
                for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
                    this.pages.push(wrappedLines.slice(i, i + linesPerPage));
                }

                this.currentPage = 0;
                this.renderCurrentPage(text, settings);
                this.updatePageNavigation();
            } catch (error) {
                console.error('备用预览方案失败:', error);
                // 最简单的回退：只显示线条
                this.clear();
                this.drawLines(settings);
                this.drawPageNumber(0, 1);
                this.pages = [[]];
                this.currentPage = 0;
                this.updatePageNavigation();
            }
        });
    }

    // 渲染当前页
    renderCurrentPage(text, settings) {
        const totalPages = this.renderPage(this.currentPage, text, settings);
        document.getElementById('totalPages').textContent = totalPages;
    }

    // 上一页
    previousPage(text, settings) {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderCurrentPage(text, settings);
            this.updatePageNavigation();
        }
    }

    // 下一页
    nextPage(text, settings) {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            this.renderCurrentPage(text, settings);
            this.updatePageNavigation();
        }
    }

    // 更新页面导航状态
    updatePageNavigation() {
        const currentPageElement = document.getElementById('currentPage');
        const totalPagesElement = document.getElementById('totalPages');
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');

        if (currentPageElement) currentPageElement.textContent = (this.currentPage + 1) || 1;
        if (totalPagesElement) totalPagesElement.textContent = this.pages.length || 1;
        if (prevPageBtn) prevPageBtn.disabled = this.currentPage === 0 || !this.pages.length;
        if (nextPageBtn) nextPageBtn.disabled = this.currentPage >= (this.pages.length - 1) || !this.pages.length;
    }

    // 获取预览数据URL（用于生成PDF）
    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }

    // 缩放预览以适应容器
    fitToContainer() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 40; // 减去padding
        const containerHeight = container.clientHeight - 40;

        const scaleX = containerWidth / this.width;
        const scaleY = containerHeight / this.height;
        const scale = Math.min(scaleX, scaleY, 1); // 不超过原始尺寸

        this.setScale(scale);
    }
}

// 创建全局预览渲染器实例
window.previewRenderer = new PreviewRenderer();