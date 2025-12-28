# 外语字帖生成器

> 版本: 2.2.1
> 作者联系: 1877303149@qq.com
> AI驱动: 智谱GLM

## 项目简介

> **注意**: 本项目文档由AI辅助生成，请注意分辨内容的准确性。

外语字帖生成器是一个纯前端的Web应用，用于生成可打印的外语字帖PDF。用户可以输入大多数语言的文本内容，自定义线条样式、字体大小和颜色等参数，实时预览效果并导出高清PDF文件。

## 功能特性

| 功能 | 描述 |
|------|------|
| 多语言支持 | 支持大多数语言字符输入 |
| 线条样式 | 直线、虚线、点线、点划线 |
| 线条颜色 | 5种预设颜色可选 |
| 线条间距 | 20-50px可调，支持自动调整 |
| 字体大小 | 20-40px可调 |
| 字体颜色 | 5种预设颜色可选 |
| 字体系列 | Calibri (可扩展) |
| 实时预览 | Canvas实时渲染预览 |
| 分页导航 | 支持多页字帖翻页预览 |
| PDF导出 | 高清A4格式PDF导出 |

## 项目结构

```
外语字帖/
├── frontend/
│   ├── index.html           # 主页面
│   ├── css/
│   │   ├── main.css         # 主样式文件
│   │   └── components.css   # 组件样式文件
│   ├── js/
│   │   └── app-compact.js   # 核心JavaScript逻辑
│   └── libs/
│       └── jspdf/
│           └── jspdf.umd.min.js  # jsPDF库
```

## 技术栈

- **HTML5**: 页面结构
- **CSS3**: 样式与动画
- **Vanilla JavaScript**: 核心逻辑，无框架依赖
- **Canvas API**: 实时预览渲染
- **jsPDF**: PDF生成

## 核心架构

### 类设计

```
CalligraphyApp          # 主应用控制器
├── PreviewRenderer     # Canvas预览渲染器
└── PDFGenerator        # PDF生成器
```

### CalligraphyApp (主应用)

**职责**: 应用状态管理、事件绑定、UI交互

**核心方法**:
| 方法 | 说明 |
|------|------|
| `init()` | 初始化应用 |
| `bindEventListeners()` | 绑定所有UI事件 |
| `updatePreview()` | 更新预览 |
| `resetSettings()` | 重置设置 |
| `exportPDF()` | 导出PDF |

**设置对象** (`this.settings`):
```javascript
{
    lineStyle: 'solid',      // 线条样式
    lineColor: '#1a1a1a',    // 线条颜色
    lineSpacing: 35,         // 线条间距(px)
    fontSize: 20,            // 字体大小(px)
    fontColor: '#333333',    // 字体颜色
    fontFamily: 'Calibri',   // 字体系列
    autoLineSpacing: true    // 自动调整行间距
}
```

### PreviewRenderer (预览渲染器)

**职责**: Canvas渲染、文本处理、分页计算

**核心属性**:
| 属性 | 值 |
|------|-----|
| `width` | 794px (A4宽度) |
| `height` | 1123px (A4高度) |
| `marginLeft/Right` | 50px |
| `marginTop/Bottom` | 60px |
| `contentWidth` | 694px |
| `contentHeight` | 1003px |

**核心方法**:
| 方法 | 说明 |
|------|------|
| `cleanText(rawText)` | 清理Markdown符号和垃圾换行 |
| `wrapTextToWidth()` | 文本自动换行 |
| `drawLines(settings)` | 绘制线条 |
| `renderHorizontalText()` | 渲染横向文本 |
| `updatePreview()` | 更新预览 |
| `previousPage/nextPage()` | 翻页 |

**文本清洗逻辑**:
1. 清理 Markdown 符号造成的断行 (`**\n\n**`)
2. 按空行拆分段落
3. 合并段落内部的垃圾换行
4. 用双换行连接段落

### PDFGenerator (PDF生成器)

**职责**: 高清PDF生成、下载

**核心方法**:
| 方法 | 说明 |
|------|------|
| `generatePDF()` | 生成PDF文档 |
| `renderHighDPICanvas()` | 高DPI渲染(2倍缩放) |
| `downloadPDF()` | 触发下载 |
| `getPDFSize()` | 获取文件大小 |

**导出参数**:
- 格式: A4 (210mm x 297mm)
- 分辨率: 150 DPI
- 质量: JPEG 0.8
- 缩放: 2x

## CSS样式说明

### 颜色规范

| 用途 | 颜色 |
|------|------|
| 主色 | `#0066cc` |
| 文字主色 | `#333333` |
| 边框 | `#ddd` |
| 背景 | `#bababa` / `#fff` |

### 响应式断点

| 断点 | 布局 |
|------|------|
| > 1200px | 三栏布局 (280px | 1fr | 320px) |
| 992-1200px | 三栏布局 (260px | 1fr | 280px) |
| 576-992px | 单栏垂直堆叠 |
| < 576px | 移动端优化 |

### 组件样式

**线条样式选择器** (`.style-selector`):
- 4种样式: 直线、虚线、点线、点划线
- 选中状态: 蓝色边框 + 浅蓝背景

**颜色选择器** (`.color-selector`):
- 圆形按钮预览
- 选中显示勾选标记

**欢迎弹窗** (`.intro-modal`):
- 毛玻璃效果 (backdrop-filter)
- 40px 模糊 + 180% 饱和度

## 使用指南

### 快速开始

1. 用浏览器打开 `frontend/index.html`
2. 在右侧文本框输入内容
3. 调整左侧设置参数
4. 中间预览区查看效果
5. 点击"导出PDF"下载

### 自动行间距

启用后，行间距按字体大小的1.75倍自动计算:
```
行间距 = 字体大小 × 1.75
范围限制: 20px - 50px
```

### 文本清洗规则

应用会自动清理以下内容:
- Markdown粗体符号造成的断行
- 段落内的垃圾换行
- 保留段落间双换行间距

## 扩展开发

### 添加新字体

在 `index.html` 的字体选择器中添加:
```html
<button type="button" class="font-circle" data-font="FontName"
    style="font-family: FontName, sans-serif">
    FontName
</button>
```

### 添加新颜色

在颜色选择器中添加:
```html
<button type="button" class="color-circle"
    data-color="#hexcode"
    style="background-color: #hexcode">
</button>
```

### 添加线条样式

1. 在 `app-compact.js` 的 `drawLines()` 方法中添加样式:
```javascript
case 'newstyle':
    this.ctx.setLineDash([pattern]);
    break;
```

2. 在HTML中添加对应按钮

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 2.2.1 | 最新 | 当前版本 |

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系: 1877303149@qq.com
