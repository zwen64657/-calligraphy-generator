// 工具函数模块
class Utils {
    // 世界语特殊字符映射
    static esperantoChars = {
        'C': 'Ĉ', 'c': 'ĉ',
        'G': 'Ĝ', 'g': 'ĝ',
        'H': 'Ĥ', 'h': 'ĥ',
        'J': 'Ĵ', 'j': 'ĵ',
        'S': 'Ŝ', 's': 'ŝ',
        'U': 'Ŭ', 'u': 'ŭ'
    };

    
    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 格式化文件大小
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 计算文本字符数（包括世界语字符）
    static getCharCount(text) {
        return text.length;
    }

    // 估算页数
    static estimatePages(text, fontSize = 16, lineSpacing = 30) {
        const linesPerPage = Math.floor(1003 / lineSpacing); // 可用高度 / 行距
        const charsPerLine = Math.floor(694 / (fontSize * 0.6)); // 可用宽度 / 字符宽度估算
        const totalLines = Math.ceil(text.length / charsPerLine);
        return Math.ceil(totalLines / linesPerPage);
    }

    // 将文本分割成行（前端优化版）
    static splitTextIntoLines(text, maxCharsPerLine) {
        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (paragraph === '') {
                // 空行
                lines.push('');
            } else {
                // 创建临时canvas测量文本宽度
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = '16px Arial'; // 默认字体大小

                // 按行处理段落
                const words = paragraph.split(' ');
                let currentLine = '';

                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    const testLine = currentLine + (currentLine ? ' ' : '') + word;
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;

                    // 估算最大宽度（基于字符数）
                    if (testLine.length <= maxCharsPerLine && i < words.length - 1) {
                        currentLine = testLine;
                    } else {
                        if (currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            // 单个词太长，按字符分割
                            for (const char of word) {
                                if (currentLine.length < maxCharsPerLine) {
                                    currentLine += char;
                                } else {
                                    if (currentLine) {
                                        lines.push(currentLine);
                                    }
                                    currentLine = char;
                                }
                            }
                            if (currentLine) {
                                lines.push(currentLine);
                                currentLine = '';
                            }
                        }
                    }
                }

                if (currentLine) {
                    lines.push(currentLine);
                }
            }
        }

        return lines;
    }

    // 检查后端服务是否可用
    static async checkBackendAvailable() {
        try {
            const response = await fetch('http://localhost:8000/health', {
                method: 'GET',
                mode: 'no-cors',
                timeout: 1000
            });
            return true;
        } catch {
            return false;
        }
    }

    // 将文本分割成页面
    static splitTextIntoPages(text, fontSize = 16, lineSpacing = 30) {
        const linesPerPage = Math.floor(1003 / lineSpacing);
        const charsPerLine = Math.floor(694 / (fontSize * 0.6));
        const lines = this.splitTextIntoLines(text, charsPerLine);
        const pages = [];

        for (let i = 0; i < lines.length; i += linesPerPage) {
            pages.push(lines.slice(i, i + linesPerPage));
        }

        return pages;
    }

    // 检测是否为世界语字符
    static isEsperantoChar(char) {
        return Object.values(this.esperantoChars).includes(char);
    }

    // 转换世界语字符为HTML实体
    static escapeEsperantoHTML(text) {
        return text.replace(/[ĉĝĥĵŝŭĈĜĤĴŜŬ]/g, (match) => {
            const entities = {
                'ĉ': '&ccirc;', 'ĝ': '&gcirc;', 'ĥ': '&hcirc;',
                'ĵ': '&jcirc;', 'ŝ': '&scirc;', 'ŭ': '&ubreve;',
                'Ĉ': '&Ccirc;', 'Ĝ': '&Gcirc;', 'Ĥ': '&Hcirc;',
                'Ĵ': '&Jcirc;', 'Ŝ': '&Scirc;', 'Ŭ': '&Ubreve;'
            };
            return entities[match] || match;
        });
    }

    // 下载文件
    static downloadFile(content, filename, mimeType = 'application/pdf') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // 显示提示信息
    static showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toast.className = `toast ${type}`;

        // 显示提示
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 格式化日期
    static formatDate(date) {
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // 验证输入
    static validateInput(text) {
        if (!text || text.trim().length === 0) {
            return {
                valid: false,
                message: '请输入世界语文本'
            };
        }

        if (text.length > 10000) {
            return {
                valid: false,
                message: '文本过长，请限制在10000字符以内'
            };
        }

        return { valid: true };
    }

    // 获取设置值
    static getSettings() {
        return {
            lineStyle: document.getElementById('lineStyle').value,
            lineColor: document.getElementById('lineColor').value,
            lineSpacing: parseInt(document.getElementById('lineSpacing').value),
            fontSize: parseInt(document.getElementById('fontSize').value),
            fontColor: document.getElementById('fontColor').value
        };
    }

    // 保存设置到本地存储
    static saveSettings(settings) {
        localStorage.setItem('calligraphySettings', JSON.stringify(settings));
    }

    // 从本地存储加载设置
    static loadSettings() {
        const saved = localStorage.getItem('calligraphySettings');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }

    // 重置设置为默认值
    static resetSettings() {
        const defaults = {
            lineStyle: 'solid',
            lineColor: '#666666',
            lineSpacing: 30,
            fontSize: 16,
            fontColor: '#333333'
        };

        document.getElementById('lineStyle').value = defaults.lineStyle;
        document.getElementById('lineColor').value = defaults.lineColor;
        document.getElementById('lineSpacing').value = defaults.lineSpacing;
        document.getElementById('fontSize').value = defaults.fontSize;
        document.getElementById('fontColor').value = defaults.fontColor;

        // 更新显示值
        document.getElementById('lineSpacingValue').textContent = defaults.lineSpacing;
        document.getElementById('fontSizeValue').textContent = defaults.fontSize;

        return defaults;
    }
}

// 导出到全局
window.Utils = Utils;