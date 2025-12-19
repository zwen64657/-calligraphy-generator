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

        Utils.showToast('字帖生成器已就绪', 'success');
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
        document.getElementById('lineSpacing').value = this.settings.lineSpacing;
        document.getElementById('fontSize').value = this.settings.fontSize;

        // 设置线条样式
        document.querySelectorAll('#lineStyleSelector .style-option').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.style === this.settings.lineStyle) {
                btn.classList.add('selected');
            }
        });

        // 设置线条颜色
        document.querySelectorAll('#lineColorSelector .color-circle').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.color === this.settings.lineColor) {
                btn.classList.add('selected');
            }
        });

        // 设置字体颜色
        document.querySelectorAll('#fontColorSelector .color-circle').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.color === this.settings.fontColor) {
                btn.classList.add('selected');
            }
        });

        // 更新显示值
        document.getElementById('lineSpacingValue').textContent = this.settings.lineSpacing;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize;
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 设置相关事件
        // 线条样式选择器
        document.querySelectorAll('#lineStyleSelector .style-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有选中状态
                document.querySelectorAll('#lineStyleSelector .style-option').forEach(b => b.classList.remove('selected'));
                // 添加选中状态
                btn.classList.add('selected');
                // 更新设置
                this.settings.lineStyle = btn.dataset.style;
                this.updatePreview();
                this.saveSettings();
            });
        });

        // 线条颜色选择器
        document.querySelectorAll('#lineColorSelector .color-circle').forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有选中状态
                document.querySelectorAll('#lineColorSelector .color-circle').forEach(b => b.classList.remove('selected'));
                // 添加选中状态
                btn.classList.add('selected');
                // 更新设置
                this.settings.lineColor = btn.dataset.color;
                this.updatePreview();
                this.saveSettings();
            });
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

        // 字体颜色选择器
        document.querySelectorAll('#fontColorSelector .color-circle').forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有选中状态
                document.querySelectorAll('#fontColorSelector .color-circle').forEach(b => b.classList.remove('selected'));
                // 添加选中状态
                btn.classList.add('selected');
                // 更新设置
                this.settings.fontColor = btn.dataset.color;
                this.updatePreview();
                this.saveSettings();
            });
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
        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportPDF();
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

    
    // 重置设置
    resetSettings() {
        if (confirm('确定要重置所有设置吗？')) {
            this.settings = Utils.resetSettings();
            this.applySettingsToForm(); // 应用设置到UI
            this.saveSettings();
            this.updatePreview();
            Utils.showToast('设置已重置', 'success');
        }
    }

    // 导出PDF
    async exportPDF() {
        const text = document.getElementById('textInput').value;

        // 检查是否有内容
        if (!text || text.trim() === '') {
            Utils.showToast('请先输入文本内容', 'warning');
            return;
        }

        // 确保预览已生成
        if (!previewRenderer.pages || previewRenderer.pages.length === 0) {
            Utils.showToast('正在生成预览，请稍候...', 'info');
            return;
        }

        try {
            // 显示进度提示
            Utils.showToast('正在生成PDF...', 'info');

            // 生成PDF
            const pdfData = await pdfGenerator.generatePDF(
                text,
                this.settings,
                previewRenderer,
                {
                    quality: 0.8,
                    dpi: 150,
                    pageRange: 'all',
                    filename: '字帖.pdf',
                    progressCallback: (current, total) => {
                        const progress = Math.round((current / total) * 100);
                        Utils.showToast(`正在生成PDF... ${progress}%`, 'info');
                    }
                }
            );

            // 下载PDF
            await pdfGenerator.downloadPDF(pdfData, pdfData.filename);

            // 获取文件大小
            const fileSize = pdfGenerator.getPDFSize(pdfData);
            Utils.showToast(`PDF已生成 (${fileSize} KB)`, 'success');

        } catch (error) {
            console.error('PDF生成失败:', error);
            Utils.showToast('PDF生成失败: ' + error.message, 'error');
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