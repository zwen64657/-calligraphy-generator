// 纯前端PDF生成器
class PDFGenerator {
    constructor() {
        this.jsPDF = null;
        this.fontsLoaded = false;
        this.loadJsPDF();
    }

    // 加载jsPDF库
    loadJsPDF() {
        // 创建script标签加载jsPDF
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            this.jsPDF = window.jspdf.jsPDF;
            this.loadFonts();
            console.log('jsPDF已加载');
        };
        script.onerror = () => {
            console.error('jsPDF加载失败');
        };
        document.head.appendChild(script);
    }

    // 加载支持世界语的字体
    async loadFonts() {
        // 尝试加载Noto Sans字体，支持世界语字符
        try {
            // 从CDN加载Noto Sans字体文件
            const fontResponse = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@4.5.11/files/noto-sans-latin-400-normal.woff');
            if (fontResponse.ok) {
                const fontBytes = await fontResponse.arrayBuffer();
                const base64Font = btoa(String.fromCharCode(...new Uint8Array(fontBytes)));

                // 添加字体到jsPDF
                this.jsPDF.addFileToVFS('NotoSans-normal.ttf', base64Font);
                this.jsPDF.addFont('NotoSans-normal.ttf', 'NotoSans', 'normal');
                this.fontsLoaded = true;
                console.log('Noto Sans字体已加载');
            }
        } catch (error) {
            console.log('无法加载Noto Sans字体，使用默认字体');
        }
    }

    // 生成PDF
    async generatePDF(text, settings) {
        if (!this.jsPDF) {
            throw new Error('jsPDF未加载完成');
        }

        // 等待字体加载完成（最多等待3秒）
        let attempts = 0;
        while (!this.fontsLoaded && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        // 创建PDF实例
        const pdf = new this.jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        // 页面设置
        const pageWidth = pdf.internal.pageSize.getWidth();  // 595.28 pt (A4)
        const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt (A4)
        const margin = 50;
        const contentWidth = pageWidth - margin * 2;
        const lineHeight = settings.lineSpacing || 30;

        // 使用世界语文本测量器
        const measure = new window.EsperantoTextMeasure();
        measure.ctx.font = `${settings.fontSize}px Arial`;

        // 处理文本
        const lines = measure.wrapText(text, {
            fontSize: settings.fontSize,
            lineWidth: contentWidth,
            lineHeight: lineHeight
        });

        // 分页
        const pages = measure.paginateText(lines, lineHeight, pageHeight);

        // 绘制每一页
        pages.forEach((pageLines, pageIndex) => {
            if (pageIndex > 0) {
                pdf.addPage();
            }

            // 绘制横线
            pdf.setDrawColor(settings.lineColor);
            pdf.setLineWidth(0.5);

            const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
            for (let i = 0; i < linesPerPage; i++) {
                const y = margin + i * lineHeight;
                pdf.line(margin, y, pageWidth - margin, y);
            }

            // 绘制文本
            pdf.setFontSize(settings.fontSize);
            pdf.setTextColor(settings.fontColor);

            // 尝试使用Noto Sans，如果没有则使用默认字体
            if (this.fontsLoaded) {
                pdf.setFont('NotoSans', 'normal');
            } else {
                pdf.setFont('helvetica');
            }

            // 处理每行文本
            pageLines.forEach((line, lineIndex) => {
                if (line.trim()) {
                    const y = margin + lineIndex * lineHeight + settings.fontSize;

                    // 如果没有加载特殊字体，尝试使用Unicode替代方案
                    if (!this.fontsLoaded) {
                        // 转换世界语特殊字符为可显示的替代字符
                        const displayLine = this.convertEsperantoChars(line);
                        pdf.text(displayLine, margin, y);
                    } else {
                        // 使用Noto Sans字体直接显示
                        pdf.text(line, margin, y);
                    }
                }
            });

            // 绘制页码
            pdf.setFontSize(10);
            pdf.setTextColor('#666666');
            pdf.text(
                `${pageIndex + 1} / ${pages.length}`,
                pageWidth / 2,
                pageHeight - 20,
                { align: 'center' }
            );
        });

        // 返回PDF的blob
        return pdf.output('blob');
    }

    // 转换世界语字符为ASCII替代字符（备用方案）
    convertEsperantoChars(text) {
        const charMap = {
            'ĉ': 'cx', 'Ĉ': 'CX',
            'ĝ': 'gx', 'Ĝ': 'GX',
            'ĥ': 'hx', 'Ĥ': 'HX',
            'ĵ': 'jx', 'Ĵ': 'JX',
            'ŝ': 'sx', 'Ŝ': 'SX',
            'ŭ': 'ux', 'Ŭ': 'UX'
        };

        return text.replace(/[ĉĝĥĵŝŭĈĜĤĴŜŬ]/g, (match) => charMap[match] || match);
    }
}

// 导出类
window.PDFGenerator = PDFGenerator;