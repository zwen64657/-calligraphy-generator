// API通信模块
class ApiClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    // 处理文本换行
    async processText(text, settings) {
        try {
            const response = await fetch(`${this.baseUrl}/api/process-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    font_size: settings.fontSize,
                    line_height: settings.lineSpacing,
                    page_width: 694,
                    font_family: 'Arial'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('处理文本失败:', error);
            throw error;
        }
    }

    // 生成PDF
    async generatePDF(processedData, settings) {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    processed_data: processedData,
                    settings: {
                        line_style: settings.lineStyle,
                        line_color: settings.lineColor,
                        font_color: settings.fontColor,
                        font_size: settings.fontSize,
                        line_spacing: settings.lineSpacing
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 检查响应类型
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
                // 直接返回PDF二进制数据
                return await response.blob();
            } else {
                // 返回JSON响应（可能是错误信息）
                return await response.json();
            }
        } catch (error) {
            console.error('生成PDF失败:', error);
            throw error;
        }
    }

    // 检查后端服务状态
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 使用纯前端方案生成PDF（作为后端不可用时的备用方案）
    async generatePDFWithJsPDF(text, settings) {
        // 这里使用前端PDF生成方案
        // 注意：这是一个简化的实现，主要用于演示
        return new Promise((resolve) => {
            // 创建一个模拟的PDF blob
            // 实际应用中可以使用jsPDF或其他前端PDF库
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // A4纸尺寸（像素）
            canvas.width = 794;
            canvas.height = 1123;

            // 白色背景
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 设置字体
            ctx.font = `${settings.fontSize}px Arial`;
            ctx.fillStyle = settings.fontColor;

            // 绘制文本（简化版）
            const lines = text.split('\n');
            let y = 100;

            for (const line of lines) {
                ctx.fillText(line, 60, y);
                y += settings.lineSpacing;
            }

            // 转换为blob
            canvas.toBlob((blob) => {
                resolve(blob);
            });
        });
    }
}

// 创建全局API客户端实例
window.apiClient = new ApiClient();