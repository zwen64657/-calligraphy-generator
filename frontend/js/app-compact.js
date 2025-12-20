// 世界语字帖生成器
class CalligraphyApp {
    constructor() {
        this.settings = {
            lineStyle: 'solid',
            lineColor: '#1a1a1a',
            lineSpacing: 35,
            fontSize: 20,
            fontColor: '#333333'
        };
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.initPreview();
    }

    bindEventListeners() {
        // 线条样式选择器
        document.querySelectorAll('#lineStyleSelector .style-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#lineStyleSelector .style-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.settings.lineStyle = btn.dataset.style;
                this.updatePreview();
            });
        });

        // 线条颜色选择器
        document.querySelectorAll('#lineColorSelector .color-circle').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#lineColorSelector .color-circle').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.settings.lineColor = btn.dataset.color;
                this.updatePreview();
            });
        });

        // 线条间距
        document.getElementById('lineSpacing').addEventListener('input', (e) => {
            this.settings.lineSpacing = parseInt(e.target.value);
            document.getElementById('lineSpacingValue').textContent = this.settings.lineSpacing;
            this.updatePreview();
        });

        // 字体大小
        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = this.settings.fontSize;
            this.updatePreview();
        });

        // 字体颜色选择器
        document.querySelectorAll('#fontColorSelector .color-circle').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#fontColorSelector .color-circle').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.settings.fontColor = btn.dataset.color;
                this.updatePreview();
            });
        });

        // 文本输入
        document.getElementById('textInput').addEventListener('input', () => {
            this.updatePreview();
            this.updateTextInfo();
        });

        // 页面导航
        document.getElementById('prevPage').addEventListener('click', () => {
            previewRenderer.previousPage(document.getElementById('textInput').value, this.settings);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            previewRenderer.nextPage(document.getElementById('textInput').value, this.settings);
        });

        // 操作按钮
        document.getElementById('exportPDF').addEventListener('click', () => this.exportPDF());

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // 窗口大小改变
        window.addEventListener('resize', () => {
            previewRenderer.fitToContainer();
        });
    }

    initPreview() {
        previewRenderer.fitToContainer();
        this.updatePreview();
    }

    updatePreview() {
        const text = document.getElementById('textInput').value;
        previewRenderer.updatePreview(text, this.settings);
    }

    updateTextInfo() {
        const text = document.getElementById('textInput').value;
        document.getElementById('charCount').textContent = text.length;
        const estimatedPages = Math.ceil(text.length / 500);
        document.getElementById('estimatedPages').textContent = estimatedPages;
    }

    resetSettings() {
        if (confirm('确定要重置所有设置吗？')) {
            this.settings = {
                lineStyle: 'solid',
                lineColor: '#1a1a1a',
                lineSpacing: 35,
                fontSize: 20,
                fontColor: '#333333'
            };
            this.applySettingsToForm();
            this.updatePreview();
            this.showToast('设置已重置', 'success');
        }
    }

    applySettingsToForm() {
        document.getElementById('lineSpacing').value = this.settings.lineSpacing;
        document.getElementById('fontSize').value = this.settings.fontSize;

        document.querySelectorAll('#lineStyleSelector .style-option').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.style === this.settings.lineStyle) {
                btn.classList.add('selected');
            }
        });

        document.querySelectorAll('#lineColorSelector .color-circle').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.color === this.settings.lineColor) {
                btn.classList.add('selected');
            }
        });

        document.querySelectorAll('#fontColorSelector .color-circle').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.color === this.settings.fontColor) {
                btn.classList.add('selected');
            }
        });

        document.getElementById('lineSpacingValue').textContent = this.settings.lineSpacing;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    async exportPDF() {
        const text = document.getElementById('textInput').value;
        if (!text || text.trim() === '') {
            this.showToast('请先输入文本内容', 'warning');
            return;
        }
        if (!previewRenderer.pages || previewRenderer.pages.length === 0) {
            this.showToast('正在生成预览，请稍候...', 'info');
            return;
        }
        try {
            this.showToast('正在生成PDF...', 'info');
            const pdfData = await pdfGenerator.generatePDF(text, this.settings, previewRenderer, {
                quality: 0.8,
                dpi: 150,
                pageRange: 'all',
                filename: '字帖.pdf'
            });
            await pdfGenerator.downloadPDF(pdfData, pdfData.filename);
            const fileSize = pdfGenerator.getPDFSize(pdfData);
            this.showToast(`PDF已生成 (${fileSize} KB)`, 'success');
        } catch (error) {
            this.showToast('PDF生成失败: ' + error.message, 'error');
        }
    }
}

class PreviewRenderer {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentPage = 0;
        this.pages = [];
        this.scale = 1;
        this.isRendering = false;
        this.renderQueue = false;
        this.width = 794;
        this.height = 1123;
        this.marginLeft = 50;
        this.marginRight = 50;
        this.marginTop = 60;
        this.marginBottom = 60;
        this.contentWidth = this.width - this.marginLeft - this.marginRight;
        this.contentHeight = this.height - this.marginTop - this.marginBottom;
        this.initCanvas();
    }

    initCanvas() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setScale(scale) {
        this.scale = scale;
        this.canvas.style.width = `${this.width * scale}px`;
        this.canvas.style.height = `${this.height * scale}px`;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.width, this.height);
    }

    drawLines(settings) {
        this.ctx.strokeStyle = settings.lineColor;
        this.ctx.lineWidth = 1;
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
        this.ctx.setLineDash([]);
    }

    drawText(lines, settings, pageIndex = 0) {
        this.ctx.font = `italic ${settings.fontSize}px Calibri`;
        this.ctx.fillStyle = settings.fontColor;
        const startY = this.marginTop;
        this.drawHorizontalText(lines, settings, startY);
    }

    drawHorizontalText(lines, settings, startY) {
        this.ctx.textBaseline = 'alphabetic';
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const y = startY + (i * settings.lineSpacing);
            if (y > this.height - this.marginBottom - settings.lineSpacing) break;
            if (line && line.trim() !== '') {
                let textToDraw = '';
                if (typeof line === 'object' && line.text) {
                    textToDraw = line.text;
                } else if (typeof line === 'string') {
                    textToDraw = line;
                }
                if (textToDraw) {
                    // 绘制文本，添加3px的垂直偏移让文字离开横线
                    const adjustedY = y - 3;
                    this.ctx.fillText(textToDraw, this.marginLeft, adjustedY);

                    // 验证边界
                    const isWithinBounds = this.validateTextBounds(textToDraw, this.marginLeft, this.contentWidth);
                    if (!isWithinBounds) {
                        console.warn(`文本超出边界: "${textToDraw}" 在位置 ${this.marginLeft}, 宽度限制: ${this.contentWidth}`);
                    }
                }
            }
        }
    }

    drawPageNumber(pageIndex, totalPages) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`第 ${pageIndex + 1} 页 / 共 ${totalPages} 页`, this.width / 2, this.height - 20);
        this.ctx.textAlign = 'left';
    }

    renderPage(pageIndex, text, settings) {
        this.clear();
        this.drawLines(settings);
        let pageLines = [];
        let totalPages = 1;

        if (this.pages && this.pages.length > 0) {
            pageLines = this.pages[pageIndex] || [];
            totalPages = this.pages.length;
        } else {
            // 使用相同的换行逻辑
            const wrappedLines = this.wrapTextToWidth(text, this.contentWidth, settings.fontSize);
            const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);
            const startIndex = pageIndex * linesPerPage;
            pageLines = wrappedLines.slice(startIndex, startIndex + linesPerPage);
            totalPages = Math.ceil(wrappedLines.length / linesPerPage);
        }

        if (pageLines.length > 0) {
            this.drawText(pageLines, settings, pageIndex);
        }
        this.drawPageNumber(pageIndex, totalPages);
        return totalPages;
    }

    splitTextIntoLines(text, maxCharsPerLine) {
        // 此函数不再使用，改用 wrapTextToWidth
        return this.wrapTextToWidth(text, this.contentWidth, 20);
    }

    updatePreview(text, settings) {
        if (!text || text.trim() === '') {
            this.clear();
            this.drawLines(settings);
            this.drawPageNumber(0, 1);
            this.updatePageNavigation();
            return;
        }
        if (this.isRendering) {
            this.renderQueue = true;
            return;
        }
        this.isRendering = true;
        this.simpleTextUpdatePreview(text, settings);
        this.isRendering = false;
        if (this.renderQueue) {
            this.renderQueue = false;
            setTimeout(() => this.updatePreview(text, settings), 0);
        }
    }

    simpleTextUpdatePreview(text, settings) {
        try {
            this.clear();
            this.drawLines(settings);
            this.ctx.font = `italic ${settings.fontSize}px Calibri`;
            this.ctx.fillStyle = settings.fontColor;
            this.renderHorizontalText(text, settings);
        } catch (error) {
            this.fallbackSimpleTextRender(text, settings);
        }
    }

    renderHorizontalText(text, settings) {
        const availableWidth = this.contentWidth; // 使用contentWidth而不是计算
        const wrappedLines = this.wrapTextToWidth(text, availableWidth, settings.fontSize);
        const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);
        const pages = [];
        for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
            pages.push(wrappedLines.slice(i, i + linesPerPage));
        }
        const currentPageLines = pages[0] || [];
        this.ctx.textBaseline = 'bottom';
        this.ctx.textAlign = 'left'; // 确保左对齐
        for (let i = 0; i < currentPageLines.length; i++) {
            const line = currentPageLines[i];
            const y = this.marginTop + (i * settings.lineSpacing);
            if (line.trim() !== '') {
                // 从左边距开始绘制
                this.ctx.fillText(line, this.marginLeft, y);
            }
        }
        this.pages = pages;
        this.currentPage = 0;
        const totalPages = pages.length || 1;
        this.drawPageNumber(0, totalPages);
        this.updatePageNavigation();
    }

    wrapTextToWidth(text, maxWidth, fontSize) {
        // 设置字体确保测量准确
        this.ctx.font = `italic ${fontSize}px Calibri`;
        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                lines.push('');
                continue;
            }

            // 处理每个段落
            const words = paragraph.split(' ');
            let currentLine = '';

            for (let i = 0; i < words.length; i++) {
                const word = words[i];

                if (currentLine === '') {
                    // 当前行是空的，尝试添加单词
                    const wordWidth = this.ctx.measureText(word).width;
                    if (wordWidth <= maxWidth - 5) {  // 添加5px容差
                        currentLine = word;
                    } else {
                        // 单词太长，分割它
                        const splitWords = this.splitWordByMeasure(word, maxWidth);
                        lines.push(...splitWords);
                    }
                } else {
                    // 当前行不为空，尝试添加空格和单词
                    const testLine = currentLine + ' ' + word;
                    const testWidth = this.ctx.measureText(testLine).width;

                    if (testWidth <= maxWidth - 5) {  // 添加5px容差
                        currentLine = testLine;
                    } else {
                        // 添加当前行，开始新行
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
            }

            // 添加最后一行
            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    splitWordByMeasure(word, maxWidth) {
        const lines = [];
        let currentPart = '';
        const minChunkSize = 2; // 最小分割块大小，避免单字符分割

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const testPart = currentPart + char;
            const testWidth = this.ctx.measureText(testPart).width;

            if (testWidth <= maxWidth - 5) {  // 添加5px容差
                currentPart = testPart;
            } else {
                // 只有当当前部分不为空且达到最小大小时才分割
                if (currentPart !== '') {
                    lines.push(currentPart);
                }
                // 开始新部分
                currentPart = char;
            }
        }

        // 处理最后一部分，如果太短则合并到前一行
        if (currentPart !== '') {
            if (lines.length > 0 && currentPart.length < minChunkSize &&
                this.ctx.measureText(lines[lines.length - 1] + currentPart).width <= maxWidth - 5) {
                // 合并到前一行
                lines[lines.length - 1] += currentPart;
            } else {
                lines.push(currentPart);
            }
        }

        return lines;
    }

    validateTextBounds(text, x, maxWidth) {
        const actualWidth = this.ctx.measureText(text).width;
        return actualWidth <= maxWidth;
    }

    fallbackSimpleTextRender(text, settings) {
        this.clear();
        this.drawLines(settings);
        this.ctx.font = `italic ${settings.fontSize}px Calibri`;
        this.ctx.fillStyle = settings.fontColor;
        this.ctx.textBaseline = 'bottom';
        const lines = text.split('\n');
        const linesPerPage = Math.floor(this.contentHeight / settings.lineSpacing);
        const displayLines = lines.slice(0, linesPerPage);
        for (let i = 0; i < displayLines.length; i++) {
            const line = displayLines[i];
            const y = this.marginTop + (i * settings.lineSpacing);
            if (line.trim() !== '') {
                this.ctx.fillText(line, this.marginLeft, y);
            }
        }
        const totalPages = Math.ceil(lines.length / linesPerPage) || 1;
        this.pages = [];
        for (let i = 0; i < lines.length; i += linesPerPage) {
            this.pages.push(lines.slice(i, i + linesPerPage));
        }
        this.currentPage = 0;
        this.drawPageNumber(0, this.pages.length || 1);
        this.updatePageNavigation();
    }

    renderCurrentPage(text, settings) {
        const totalPages = this.renderPage(this.currentPage, text, settings);
        document.getElementById('totalPages').textContent = totalPages;
    }

    previousPage(text, settings) {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderCurrentPage(text, settings);
            this.updatePageNavigation();
        }
    }

    nextPage(text, settings) {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            this.renderCurrentPage(text, settings);
            this.updatePageNavigation();
        }
    }

    updatePageNavigation() {
        document.getElementById('currentPage').textContent = (this.currentPage + 1) || 1;
        document.getElementById('totalPages').textContent = this.pages.length || 1;
        document.getElementById('prevPage').disabled = this.currentPage === 0 || !this.pages.length;
        document.getElementById('nextPage').disabled = this.currentPage >= (this.pages.length - 1) || !this.pages.length;
    }

    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }

    fitToContainer() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        const scaleX = containerWidth / this.width;
        const scaleY = containerHeight / this.height;
        const scale = Math.min(scaleX, scaleY, 1);
        this.setScale(scale);
    }
}

class PDFGenerator {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
        this.quality = 0.8;
        this.dpi = 150;
    }

    async generatePDF(text, settings, previewRenderer, options = {}) {
        const opts = {
            quality: options.quality || this.quality,
            dpi: options.dpi || this.dpi,
            pageRange: options.pageRange || 'all',
            filename: options.filename || '字帖.pdf',
            progressCallback: options.progressCallback || null
        };
        if (!this.jsPDF) {
            throw new Error('jsPDF库未加载');
        }
        const pdf = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        const pageWidth = 210;
        const pageHeight = 297;
        const pages = this.getPagesToGenerate(previewRenderer, opts.pageRange);
        if (pages.length === 0) {
            throw new Error('没有页面可以导出');
        }
        for (let i = 0; i < pages.length; i++) {
            const pageIndex = pages[i];
            if (opts.progressCallback) {
                opts.progressCallback(i + 1, pages.length);
            }
            if (i > 0) {
                pdf.addPage();
            }
            const canvasData = await this.renderHighDPICanvas(pageIndex, text, settings, previewRenderer);
            pdf.addImage(canvasData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        }
        return { pdf, filename: opts.filename };
    }

    getPagesToGenerate(previewRenderer, pageRange) {
        const totalPages = previewRenderer.pages.length || 1;
        if (pageRange === 'all') {
            return Array.from({ length: totalPages }, (_, i) => i);
        } else if (pageRange === 'current') {
            return [previewRenderer.currentPage || 0];
        } else if (typeof pageRange === 'object' && pageRange.start !== undefined) {
            const start = Math.max(0, pageRange.start);
            const end = Math.min(totalPages - 1, pageRange.end || totalPages - 1);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [0];
    }

    async renderHighDPICanvas(pageIndex, text, settings, previewRenderer) {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const scale = 2;
            tempCanvas.width = previewRenderer.width * scale;
            tempCanvas.height = previewRenderer.height * scale;
            tempCtx.scale(scale, scale);
            const originalCanvas = previewRenderer.canvas;
            const originalCtx = previewRenderer.ctx;
            previewRenderer.canvas = tempCanvas;
            previewRenderer.ctx = tempCtx;
            previewRenderer.renderPage(pageIndex, text, settings);
            const dataURL = tempCanvas.toDataURL('image/jpeg', this.quality);
            previewRenderer.canvas = originalCanvas;
            previewRenderer.ctx = originalCtx;
            previewRenderer.renderPage(previewRenderer.currentPage, text, settings);
            resolve(dataURL);
        });
    }

    async downloadPDF(pdfData, filename) {
        const blob = pdfData.pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    getPDFSize(pdfData) {
        const blob = pdfData.pdf.output('blob');
        return (blob.size / 1024).toFixed(2);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.previewRenderer = new PreviewRenderer();
    window.pdfGenerator = new PDFGenerator();
    window.calligraphyApp = new CalligraphyApp();
});