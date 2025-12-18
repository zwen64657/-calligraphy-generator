// 预览优化模块
class PreviewOptimizer {
    constructor() {
        this.renderQueue = [];
        this.isRendering = false;
        this.lastRenderTime = 0;
        this.minRenderInterval = 16; // 最小渲染间隔16ms (60fps)
        this.offscreenCanvas = null;
        this.offscreenCtx = null;
        this.initOffscreenCanvas();
    }

    // 初始化离屏Canvas以提高性能
    initOffscreenCanvas() {
        try {
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = 794;
            this.offscreenCanvas.height = 1123;
            this.offscreenCtx = this.offscreenCanvas.getContext('2d');
            console.log('离屏Canvas初始化成功');
        } catch (e) {
            console.warn('离屏Canvas初始化失败，使用主Canvas', e);
        }
    }

    // 检查是否应该跳过渲染
    shouldSkipRender() {
        const now = Date.now();
        if (now - this.lastRenderTime < this.minRenderInterval) {
            return true;
        }
        return false;
    }

    // 队列化渲染请求
    queueRender(renderCallback) {
        // 如果已经在渲染队列中有相同的请求，先移除
        this.renderQueue = this.renderQueue.filter(cb => cb !== renderCallback);

        // 添加到队列
        this.renderQueue.push(renderCallback);

        // 处理队列
        this.processRenderQueue();
    }

    // 处理渲染队列
    processRenderQueue() {
        if (this.isRendering || this.renderQueue.length === 0) {
            return;
        }

        if (this.shouldSkipRender()) {
            // 延迟处理
            setTimeout(() => this.processRenderQueue(), this.minRenderInterval);
            return;
        }

        this.isRendering = true;
        const renderCallback = this.renderQueue.shift();

        try {
            requestAnimationFrame(() => {
                renderCallback();
                this.lastRenderTime = Date.now();
                this.isRendering = false;

                // 处理下一个渲染请求
                if (this.renderQueue.length > 0) {
                    setTimeout(() => this.processRenderQueue(), 0);
                }
            });
        } catch (e) {
            console.error('渲染失败:', e);
            this.isRendering = false;
            // 继续处理下一个请求
            if (this.renderQueue.length > 0) {
                setTimeout(() => this.processRenderQueue(), 0);
            }
        }
    }

    // 批量处理文本测量
    batchMeasureText(texts, fontSize) {
        if (!this.offscreenCtx) {
            return null;
        }

        const results = {};
        this.offscreenCtx.font = `${fontSize}px Arial`;

        for (const text of texts) {
            results[text] = this.offscreenCtx.measureText(text).width;
        }

        return results;
    }

    // 预渲染页面到离屏Canvas
    prerenderPage(pageData, settings) {
        if (!this.offscreenCtx) {
            return false;
        }

        try {
            // 清空离屏Canvas
            this.offscreenCtx.clearRect(0, 0, 794, 1123);
            this.offscreenCtx.fillStyle = 'white';
            this.offscreenCtx.fillRect(0, 0, 794, 1123);

            // 在离屏Canvas上绘制
            this.renderToCanvas(this.offscreenCtx, pageData, settings);

            return true;
        } catch (e) {
            console.error('预渲染失败:', e);
            return false;
        }
    }

    // 渲染到指定Canvas
    renderToCanvas(ctx, pageData, settings) {
        // 这里可以实现具体的渲染逻辑
        // 主要用于离屏预渲染
    }

    // 清理资源
    cleanup() {
        this.renderQueue = [];
        this.isRendering = false;
        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = 0;
            this.offscreenCanvas.height = 0;
        }
    }
}

// 创建全局预览优化器实例
window.previewOptimizer = new PreviewOptimizer();

// 导出类
window.PreviewOptimizer = PreviewOptimizer;