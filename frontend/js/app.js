// 世界语字帖生成器
class CalligraphyApp {
    constructor() {
        this.settings = {
            lineStyle: 'solid',
            lineColor: '#666666',
            lineSpacing: 30,
            fontSize: 16,
            fontColor: '#333333'
        };

        this.init();
    }

    // 初始化应用
    async init() {
        // 初始化世界语文本测量模块
        this.initImprovedTextMeasure();

        // 加载保存的设置
        this.loadSavedSettings();

        // 绑定事件监听器
        this.bindEventListeners();

        // 初始化预览
        this.initPreview();

        // 设置模式指示器
        document.getElementById('modeIndicator').textContent = '世界语字帖生成器';
        Utils.showToast('世界语字帖生成器已就绪', 'success');
    }

    // 初始化世界语文本测量模块
    initImprovedTextMeasure() {
        const initModules = () => {
            try {
                // 确保 LetterSpacingFill 已加载
                if (window.LetterSpacingFill && !window.letterSpacingFill) {
                    window.letterSpacingFill = new window.LetterSpacingFill();
                    console.log('LetterSpacingFill 实例已创建');
                }

                // 确保 EsperantoTextMeasure 已加载
                if (window.EsperantoTextMeasure && !window.improvedTextMeasure) {
                    window.improvedTextMeasure = new window.EsperantoTextMeasure();
                    console.log('世界语文本测量模块已初始化');
                }

                // 如果两个模块都可用，标记初始化完成
                if (window.letterSpacingFill && window.improvedTextMeasure) {
                    console.log('所有文本处理模块初始化完成');
                    // 触发预览更新以确保同步
                    this.updatePreview();
                } else {
                    console.warn('部分文本处理模块未加载，将使用简化模式');
                }
            } catch (error) {
                console.error('初始化文本测量模块失败:', error);
            }
        };

        // 立即尝试初始化
        initModules();

        // 延迟再次尝试初始化（确保脚本加载完成）
        setTimeout(() => {
            initModules();
        }, 100);

        // 再次延迟初始化，确保所有资源都已加载
        setTimeout(() => {
            initModules();
        }, 500);
    }

    // 加载保存的设置
    loadSavedSettings() {
        const savedSettings = Utils.loadSettings();
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
            this.applySettingsToForm();
        }
    }

    // 应用设置到表单
    applySettingsToForm() {
        document.getElementById('lineStyle').value = this.settings.lineStyle;
        document.getElementById('lineColor').value = this.settings.lineColor;
        document.getElementById('lineSpacing').value = this.settings.lineSpacing;
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('fontColor').value = this.settings.fontColor;

        // 更新显示值
        document.getElementById('lineSpacingValue').textContent = this.settings.lineSpacing;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize;
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 设置相关事件
        document.getElementById('lineStyle').addEventListener('change', (e) => {
            this.settings.lineStyle = e.target.value;
            this.updatePreview();
            this.saveSettings();
        });

        document.getElementById('lineColor').addEventListener('change', (e) => {
            this.settings.lineColor = e.target.value;
            this.updatePreview();
            this.saveSettings();
        });

        document.getElementById('lineSpacing').addEventListener('input', (e) => {
            this.settings.lineSpacing = parseInt(e.target.value);
            document.getElementById('lineSpacingValue').textContent = this.settings.lineSpacing;
            this.updatePreview();
            this.saveSettings();
        });

        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = this.settings.fontSize;
            this.updatePreview();
            this.saveSettings();
        });

        document.getElementById('fontColor').addEventListener('change', (e) => {
            this.settings.fontColor = e.target.value;
            this.updatePreview();
            this.saveSettings();
        });

        
        // 文本输入事件 - 实时更新，无延迟
        const textInput = document.getElementById('textInput');

        // 直接绑定实时更新，不使用防抖
        textInput.addEventListener('input', () => {
            // 立即更新预览和文本信息
            this.updatePreview();
            this.updateTextInfo();
        });

        // 页面导航事件
        document.getElementById('prevPage').addEventListener('click', () => {
            const text = textInput.value;
            previewRenderer.previousPage(text, this.settings);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            const text = textInput.value;
            previewRenderer.nextPage(text, this.settings);
        });

        // 操作按钮事件
        document.getElementById('generatePdf').addEventListener('click', () => {
            this.generatePDF();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // 窗口大小改变事件
        window.addEventListener('resize', Utils.throttle(() => {
            previewRenderer.fitToContainer();
        }, 200));
    }

    // 初始化预览
    initPreview() {
        // 先适应容器
        previewRenderer.fitToContainer();

        // 延迟执行预览更新，确保所有模块都已加载
        setTimeout(() => {
            this.updatePreview();
        }, 100);
    }

    // 更新预览
    updatePreview() {
        const text = document.getElementById('textInput').value;
        previewRenderer.updatePreview(text, this.settings);
    }

    // 更新文本信息
    updateTextInfo() {
        const text = document.getElementById('textInput').value;
        const charCount = Utils.getCharCount(text);
        const estimatedPages = Utils.estimatePages(text, this.settings.fontSize, this.settings.lineSpacing);

        document.getElementById('charCount').textContent = charCount;
        document.getElementById('estimatedPages').textContent = estimatedPages;
    }

    // 生成PDF
    async generatePDF() {
        const text = document.getElementById('textInput').value;

        // 验证输入
        const validation = Utils.validateInput(text);
        if (!validation.valid) {
            Utils.showToast(validation.message, 'error');
            return;
        }

        // 显示加载状态
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.remove('hidden');

        try {
            const timestamp = Utils.formatDate(new Date()).replace(/[/:]/g, '-');
            const filename = `世界语字帖_${timestamp}.pdf`;

            // 使用Canvas PDF生成器（确保字符正确显示）
            if (!window.canvasPDFGenerator) {
                window.canvasPDFGenerator = new window.CanvasPDFGenerator();
            }

            // 生成PDF
            const pdfBlob = await window.canvasPDFGenerator.generatePDF(text, this.settings);

            // 下载PDF
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Utils.showToast('PDF生成成功（使用Canvas渲染，确保字符正确显示）', 'success');
        } catch (error) {
            console.error('生成PDF失败:', error);
            Utils.showToast('生成PDF失败：' + error.message, 'error');
        } finally {
            // 隐藏加载状态
            loadingOverlay.classList.add('hidden');
        }
    }

    // 重置设置
    resetSettings() {
        if (confirm('确定要重置所有设置吗？')) {
            this.settings = Utils.resetSettings();
            this.saveSettings();
            this.updatePreview();
            Utils.showToast('设置已重置', 'success');
        }
    }

    // 保存设置
    saveSettings() {
        Utils.saveSettings(this.settings);
    }

    // 检查后端服务（已移除）
    async checkBackendService() {
        return false; // 纯前端模式
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.calligraphyApp = new CalligraphyApp();
});

// 导出应用类
window.CalligraphyApp = CalligraphyApp;