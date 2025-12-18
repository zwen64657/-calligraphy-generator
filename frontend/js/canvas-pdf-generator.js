// Canvas转PDF生成器 - 使用Canvas渲染确保字符正确显示
class CanvasPDFGenerator {
    constructor() {
        this.jsPDF = null;
        this.loadPromise = null;
        this.isLoaded = false;
        this.loadError = null;
    }

    // 加载jsPDF库 - 返回Promise
    loadJsPDF() {
        // 如果已经加载成功
        if (this.isLoaded && this.jsPDF) {
            return Promise.resolve(this.jsPDF);
        }

        // 如果加载失败过
        if (this.loadError) {
            return Promise.reject(this.loadError);
        }

        // 如果正在加载，返回缓存的Promise
        if (this.loadPromise) {
            return this.loadPromise;
        }

        // 开始新的加载
        this.loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'libs/jspdf/jspdf.umd.min.js';

            script.onload = () => {
                this.jsPDF = window.jspdf.jsPDF;
                this.isLoaded = true;
                this.loadError = null;
                console.log('jsPDF已加载');
                resolve(this.jsPDF);
            };

            script.onerror = () => {
                this.loadError = new Error('jsPDF加载失败，请确保文件已下载到正确位置');
                this.loadPromise = null; // 允许重试
                console.error(this.loadError.message);
                reject(this.loadError);
            };

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    // 生成PDF
    async generatePDF(text, settings) {
        const TIMEOUT = 5000; // 5秒超时
        let timeoutId;

        try {
            // 使用Promise.race实现超时控制
            const loadPromise = this.loadJsPDF();
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('jsPDF加载超时，请检查网络连接或刷新页面重试'));
                }, TIMEOUT);
            });

            this.jsPDF = await Promise.race([loadPromise, timeoutPromise]);
            clearTimeout(timeoutId);

            // 创建PDF实例
            const pdf = new this.jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            // 页面设置
            const pageWidth = pdf.internal.pageSize.getWidth();  // 595.28 pt (A4)
            const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt (A4)

            // 创建离屏Canvas用于渲染
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 设置Canvas尺寸（使用高DPI支持）
            const scale = 2; // 提高清晰度
            canvas.width = pageWidth * scale;
            canvas.height = pageHeight * scale;
            ctx.scale(scale, scale);

            // 设置字体
            ctx.font = `${settings.fontSize}px Arial, "Arial Unicode MS", "Noto Sans", "Microsoft YaHei"`;
            ctx.fillStyle = settings.fontColor;
            ctx.textBaseline = 'bottom'; // 使用bottom基线，让文本底部贴着横线

            // 边距设置
            const margin = 50;
            const contentWidth = pageWidth - margin * 2;
            const lineHeight = settings.lineSpacing || 30;

            // 使用世界语文本测量器（如果可用）
            let lines = [];
            let pages = [];

            if (window.EsperantoTextMeasure) {
                const measure = new window.EsperantoTextMeasure();
                measure.ctx.font = ctx.font;

                // 处理文本
                lines = measure.wrapText(text, {
                    fontSize: settings.fontSize,
                    lineWidth: contentWidth,
                    lineHeight: lineHeight
                });

                // 分页
                pages = measure.paginateText(lines, lineHeight, pageHeight);
            } else {
                // 备用方案：简单按行分割
                lines = text.split('\n');
                const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

                for (let i = 0; i < lines.length; i += linesPerPage) {
                    pages.push(lines.slice(i, i + linesPerPage));
                }
            }

            // 生成每一页
            for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                if (pageIndex > 0) {
                    pdf.addPage();
                }

                // 清空画布
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, pageWidth, pageHeight);

                // 绘制横线
                ctx.strokeStyle = settings.lineColor;
                ctx.lineWidth = 1;
                ctx.setLineDash([]);

                const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
                for (let i = 0; i < linesPerPage; i++) {
                    const y = margin + i * lineHeight;
                    ctx.beginPath();
                    ctx.moveTo(margin, y);
                    ctx.lineTo(pageWidth - margin, y);
                    ctx.stroke();
                }

                // 绘制文本
                const pageLines = pages[pageIndex];
                ctx.fillStyle = settings.fontColor;

                pageLines.forEach((line, lineIndex) => {
                    // line 可能是字符串或对象（包含text属性）
                    const lineText = typeof line === 'object' ? line.text : line;
                    if (lineText && lineText.trim()) {
                        const y = margin + lineIndex * lineHeight; // 修复：让文本显示在对应的横线上
                        ctx.fillText(lineText, margin, y);
                    }
                });

                // 绘制页码
                ctx.font = '12px Arial';
                ctx.fillStyle = '#666666';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${pageIndex + 1} / ${pages.length}`,
                    pageWidth / 2,
                    pageHeight - 20
                );
                ctx.textAlign = 'left';

                // 将Canvas转换为图片并添加到PDF
                const imageData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight);
            }

            // 返回PDF的blob
            return pdf.output('blob');

        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            // 提供更友好的错误信息
            if (error.message.includes('加载')) {
                throw new Error(`无法生成PDF：${error.message}`);
            } else {
                throw new Error(`PDF生成失败：${error.message}`);
            }
        }
    }
}

// 导出类
window.CanvasPDFGenerator = CanvasPDFGenerator;