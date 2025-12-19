// PDF生成器模块
class PDFGenerator {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
        this.quality = 0.8; // JPEG压缩质量
        this.dpi = 150; // 打印用DPI
    }

    // 生成PDF文档
    async generatePDF(text, settings, previewRenderer, options = {}) {
        // 合并默认选项
        const opts = {
            quality: options.quality || this.quality,
            dpi: options.dpi || this.dpi,
            pageRange: options.pageRange || 'all', // 'all', 'current', 或 {start, end}
            filename: options.filename || '字帖.pdf',
            progressCallback: options.progressCallback || null
        };

        // 检查jsPDF是否已加载
        if (!this.jsPDF) {
            throw new Error('jsPDF库未加载');
        }

        // 创建PDF文档
        const pdf = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // A4尺寸（毫米）
        const pageWidth = 210;
        const pageHeight = 297;

        // 获取页面数据
        const pages = this.getPagesToGenerate(previewRenderer, opts.pageRange);

        if (pages.length === 0) {
            throw new Error('没有页面可以导出');
        }

        // 生成每一页
        for (let i = 0; i < pages.length; i++) {
            const pageIndex = pages[i];

            // 更新进度
            if (opts.progressCallback) {
                opts.progressCallback(i + 1, pages.length);
            }

            // 如果不是第一页，添加新页
            if (i > 0) {
                pdf.addPage();
            }

            // 渲染页面到高DPI Canvas
            const canvasData = await this.renderHighDPICanvas(pageIndex, text, settings, previewRenderer);

            // 添加到PDF
            pdf.addImage(
                canvasData,
                'JPEG',
                0,
                0,
                pageWidth,
                pageHeight,
                undefined,
                'FAST'
            );
        }

        return { pdf, filename: opts.filename };
    }

    // 获取需要生成的页面
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

        return [0]; // 默认第一页
    }

    // 渲染高DPI Canvas
    async renderHighDPICanvas(pageIndex, text, settings, previewRenderer) {
        return new Promise((resolve) => {
            // 创建临时Canvas用于高DPI渲染
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            // 设置高DPI尺寸（2倍）
            const scale = 2;
            tempCanvas.width = previewRenderer.width * scale;
            tempCanvas.height = previewRenderer.height * scale;

            // 缩放上下文
            tempCtx.scale(scale, scale);

            // 保存原始Canvas状态
            const originalCanvas = previewRenderer.canvas;
            const originalCtx = previewRenderer.ctx;

            // 临时切换到高DPI Canvas
            previewRenderer.canvas = tempCanvas;
            previewRenderer.ctx = tempCtx;

            // 渲染页面
            previewRenderer.renderPage(pageIndex, text, settings);

            // 获取高质量图片数据
            const dataURL = tempCanvas.toDataURL('image/jpeg', this.quality);

            // 恢复原始Canvas
            previewRenderer.canvas = originalCanvas;
            previewRenderer.ctx = originalCtx;

            // 重新渲染当前页面以恢复预览
            previewRenderer.renderPage(previewRenderer.currentPage, text, settings);

            resolve(dataURL);
        });
    }

    // 下载PDF
    async downloadPDF(pdfData, filename) {
        const blob = pdfData.pdf.output('blob');
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 清理URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // 获取文件大小（KB）
    getPDFSize(pdfData) {
        const blob = pdfData.pdf.output('blob');
        return (blob.size / 1024).toFixed(2);
    }
}

// 创建全局PDF生成器实例
window.pdfGenerator = new PDFGenerator();