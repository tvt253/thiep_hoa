import React, { useState } from 'react';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Plus, 
  Trash2, 
  Printer, 
  Download,
  Palette,
  Maximize,
  AlignJustify,
  Settings2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LayoutTemplate
} from 'lucide-react';

const SWATCHES = [
  { label: 'Đỏ', value: '#FF0000' },
  { label: 'Vàng', value: '#FFFF00' },
  { label: 'Đen', value: '#000000' },
  { label: 'Xanh dương', value: '#0000FF' },
  { label: 'Trắng', value: '#FFFFFF' },
];

const THEMES = [
  {
    id: 'dang_huong',
    name: 'Dâng hương',
    bgColor: '#FFFF00',
    textColor: '#FF0000',
    border: { type: 'single', color: '#FF0000', padding: 8, width: 4 },
    lines: [
      { id: 1, text: 'SỞ VĂN HÓA, THỂ THAO', scale: 100 },
      { id: 2, text: 'VÀ DU LỊCH TỈNH QUẢNG TRỊ', scale: 100 },
      { id: 3, text: 'KÍNH DÂNG', scale: 100 }
    ]
  },
  {
    id: 'kinh_le',
    name: 'Kính lễ',
    bgColor: '#FF0000',
    textColor: '#FFFF00',
    border: { type: 'single', color: '#FFFFFF', padding: 10, width: 2 },
    lines: [
      { id: 1, text: 'NGÂN HÀNG NHÀ NƯỚC', scale: 100 },
      { id: 2, text: 'QUẢNG TRỊ', scale: 100 },
      { id: 3, text: 'KÍNH LỄ!', scale: 100 }
    ]
  },
  {
    id: 'sinh_nhat',
    name: 'Sinh nhật',
    bgColor: '#FF0000',
    textColor: '#FFFFFF',
    border: { type: 'double', color: '#FFFFFF', padding: 10, width: 2, gap: 4 },
    lines: [
      { id: 1, text: 'GIA ĐÌNH EM SƠN NGA', scale: 100 },
      { id: 2, text: 'CHÚC MỪNG SINH NHẬT', scale: 100 },
      { id: 3, text: 'ANH TRAI', scale: 100 }
    ]
  },
  {
    id: 'kinh_vieng',
    name: 'Kính viếng',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    border: { type: 'double', color: '#FFFFFF', padding: 10, width: 2, gap: 4 },
    lines: [
      { id: 1, text: 'GIA ĐÌNH THÔNG GIA', scale: 100 },
      { id: 2, text: 'THÁI HỒNG VỆ', scale: 100 },
      { id: 3, text: 'KÍNH VIẾNG', scale: 100 }
    ]
  }
];

const getCanvasContext = () => {
  if (!window._canvasCtx) {
    const canvas = document.createElement('canvas');
    window._canvasCtx = canvas.getContext('2d');
  }
  return window._canvasCtx;
};

const measureTextWidth = (text, fontSize) => {
  const ctx = getCanvasContext();
  ctx.font = `bold ${fontSize}px "Times New Roman", Times, serif`;
  return ctx.measureText(text).width;
};

export default function OvalBannerEditor() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [activeShape, setActiveShape] = useState('oval');
  const [activeThemeId, setActiveThemeId] = useState('dang_huong');
  
  const [bgColor, setBgColor] = useState(THEMES[0].bgColor);
  const [textColor, setTextColor] = useState(THEMES[0].textColor);
  const [currentBorder, setCurrentBorder] = useState(THEMES[0].border);
  
  const [ovalScaleX, setOvalScaleX] = useState(95); 
  const [ovalScaleY, setOvalScaleY] = useState(70); 
  const [lineSpacing, setLineSpacing] = useState(1.5); 
  const [autoFit, setAutoFit] = useState(true);
  
  const [lines, setLines] = useState(THEMES[0].lines);

  const applyTheme = (themeId) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    setActiveThemeId(themeId);
    setBgColor(theme.bgColor);
    setTextColor(theme.textColor);
    setCurrentBorder(theme.border);
    setLines(theme.lines.map((l, i) => ({ ...l, id: Date.now() + i })));
  };

  const addLine = () => setLines([...lines, { id: Date.now(), text: '', scale: 100 }]);
  const removeLine = (id) => setLines(lines.filter(l => l.id !== id));
  
  const updateLine = (id, field, value) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        let val = value;
        if (field === 'text') val = val.toUpperCase();
        return { ...l, [field]: val };
      }
      return l;
    }));
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    alert("Để tải PDF với chất lượng tốt nhất, vui lòng bấm 'In trực tiếp' (hoặc Ctrl+P) và chọn máy in là 'Save as PDF' (Lưu dưới dạng PDF) của trình duyệt.");
  };

  const SVG_WIDTH = 297;
  const SVG_HEIGHT = 210;
  const CENTER_X = SVG_WIDTH / 2;
  const CENTER_Y = SVG_HEIGHT / 2;

  const maxRx = (SVG_WIDTH / 2) - 2; 
  const maxRy = (SVG_HEIGHT / 2) - 2;
  const rx = (maxRx * ovalScaleX) / 100;
  const ry = (maxRy * ovalScaleY) / 100;

  const baseFontSize = 14; 
  
  const maxAllowedHeight = (ry * 2) * 0.85;

  let currentMetrics = lines.map(line => {
    const fontSize = baseFontSize * (line.scale / 100);
    const exactWidth = measureTextWidth(line.text, fontSize);
    const height = fontSize * lineSpacing;
    return { 
       ...line, 
       originalFontSize: fontSize, 
       originalExactWidth: exactWidth,
       finalFontSize: fontSize, 
       finalHeight: height, 
       isClamped: false, 
       clampedScale: line.scale 
    };
  });

  for (let iter = 0; iter < 5; iter++) {
    let totalHeight = currentMetrics.reduce((sum, m) => sum + m.finalHeight, 0);
    
    let verticalRatio = 1;
    if (autoFit && totalHeight > maxAllowedHeight) {
      verticalRatio = maxAllowedHeight / totalHeight;
    }

    currentMetrics = currentMetrics.map(m => {
      const vFontSize = m.originalFontSize * verticalRatio;
      return {
         ...m,
         vFontSize,
         vExactWidth: m.originalExactWidth * verticalRatio,
         vHeight: vFontSize * lineSpacing,
      };
    });

    totalHeight = currentMetrics.reduce((sum, m) => sum + m.vHeight, 0);
    let startY = CENTER_Y - (totalHeight / 2);

    currentMetrics = currentMetrics.map(m => {
      const yPos = startY + (m.vHeight / 2);
      startY += m.vHeight;

      const dy = Math.abs(yPos - CENTER_Y);
      let safeWidth = 0;
      if (dy < ry) {
        const dx = rx * Math.sqrt(1 - Math.pow(dy / ry, 2));
        safeWidth = (dx * 2) * 0.95;
      }

      let hRatio = 1;
      if (autoFit && m.vExactWidth > safeWidth && safeWidth > 0) {
        hRatio = safeWidth / m.vExactWidth;
      }
      
      return { ...m, yPosApprox: yPos, safeWidth, hRatio };
    });

    if (autoFit && currentMetrics.length > 1) {
      const effectiveSizes = currentMetrics.map(l => l.vFontSize * l.hRatio);
      const minSize = Math.min(...effectiveSizes);
      const maxAllowedSize = minSize * 1.5;

      currentMetrics = currentMetrics.map(l => {
         let size = l.vFontSize * l.hRatio;
         l.harmonyRatio = size > maxAllowedSize ? (maxAllowedSize / size) : 1;
         return l;
      });
    } else {
      currentMetrics = currentMetrics.map(l => ({ ...l, harmonyRatio: 1 }));
    }

    currentMetrics = currentMetrics.map(m => {
      let newFontSize = m.vFontSize * m.hRatio * m.harmonyRatio;
      let finalRatio = verticalRatio * m.hRatio * m.harmonyRatio;
      
      const newHeight = newFontSize * lineSpacing;
      let expectedWidth = m.vExactWidth * m.hRatio * m.harmonyRatio;

      return { 
         ...m, 
         finalFontSize: newFontSize, 
         finalHeight: newHeight, 
         finalYPos: m.yPosApprox, 
         isClamped: finalRatio < 0.99, 
         clampedScale: Math.floor(m.scale * finalRatio),
         expectedWidth
      };
    });
  }

  // letter-spacing stretch removed

  const lineMetrics = currentMetrics;

  // syncSizes removed

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
      <div 
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-500 ease-in-out z-10 hide-on-print shadow-[4px_0_24px_rgba(0,0,0,0.05)] ${
          isSidebarOpen ? 'w-[30%] min-w-[340px] opacity-100' : 'w-0 min-w-0 overflow-hidden border-none opacity-0'
        }`}
      >
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <h2 className="text-2xl font-bold mb-8 text-slate-800 tracking-tight">Thiệp Hoa</h2>
          
          <div className="space-y-8">
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-200">
                <LayoutTemplate size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Mẫu & Kiểu</h3>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Hình dáng mẫu</label>
                  <select 
                    value={activeShape} 
                    onChange={(e) => setActiveShape(e.target.value)}
                    className="w-full text-sm font-semibold border border-slate-200 rounded p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="oval">Hình Ovan</option>
                    <option value="placeholder_1" disabled>Hình chữ nhật (Sắp ra mắt)</option>
                    <option value="placeholder_2" disabled>Hình thoi (Sắp ra mắt)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Chủ đề thiết kế</label>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => applyTheme(theme.id)}
                        className={`text-xs py-2 px-2 rounded border transition-colors ${activeThemeId === theme.id ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'}`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm border-b border-transparent"
                style={{ borderBottomColor: isSettingsOpen ? '#e2e8f0' : 'transparent' }}
              >
                <div className="flex items-center gap-2">
                  <Settings2 size={16} />
                  <span>Tùy chỉnh Màu sắc & Kích thước</span>
                </div>
                {isSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <div className={`transition-all duration-300 ease-in-out ${isSettingsOpen ? 'max-h-[1000px] opacity-100 p-4' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-200">
                      <Palette size={16} />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Màu sắc</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200 shadow-sm">
                        <label className="text-xs font-medium text-slate-700">Màu nền Ovan</label>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 mr-2">
                            {SWATCHES.map(s => (
                              <button 
                                key={`bg-${s.value}`}
                                onClick={() => setBgColor(s.value)}
                                className={`w-5 h-5 rounded-full border shadow-sm transition-transform hover:scale-110 ${bgColor === s.value ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent' : 'border-slate-300'}`}
                                style={{ backgroundColor: s.value }}
                                title={s.label}
                              />
                            ))}
                          </div>
                          <input 
                            type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200 shadow-sm">
                        <label className="text-xs font-medium text-slate-700">Màu chữ</label>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 mr-2">
                            {SWATCHES.map(s => (
                              <button 
                                key={`text-${s.value}`}
                                onClick={() => setTextColor(s.value)}
                                className={`w-5 h-5 rounded-full border shadow-sm transition-transform hover:scale-110 ${textColor === s.value ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent' : 'border-slate-300'}`}
                                style={{ backgroundColor: s.value }}
                                title={s.label}
                              />
                            ))}
                          </div>
                          <input 
                            type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-200">
                      <Maximize size={16} />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Kích thước & Bố cục</h3>
                    </div>
                    
                    <div className="space-y-4 bg-white p-3 rounded border border-slate-200 shadow-sm">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <label>Kích thước Ngang (%)</label>
                          <span className="text-blue-600 bg-blue-50 px-1.5 rounded">{ovalScaleX}%</span>
                        </div>
                        <input type="range" min="50" max="100" value={ovalScaleX} onChange={(e) => setOvalScaleX(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer h-1.5" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <label>Kích thước Dọc (%)</label>
                          <span className="text-blue-600 bg-blue-50 px-1.5 rounded">{ovalScaleY}%</span>
                        </div>
                        <input type="range" min="50" max="100" value={ovalScaleY} onChange={(e) => setOvalScaleY(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer h-1.5" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <label>Khoảng cách dòng</label>
                          <span className="text-blue-600 bg-blue-50 px-1.5 rounded">{lineSpacing}</span>
                        </div>
                        <input type="range" min="0.5" max="3.0" step="0.1" value={lineSpacing} onChange={(e) => setLineSpacing(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <AlignJustify size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Văn bản</h3>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded hover:bg-slate-100 transition-colors border border-slate-200">
                  <input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                  Tự động vừa khung
                </label>
              </div>

              <div className="space-y-3">
                {lineMetrics.map((line, index) => (
                  <div key={line.id} className={`bg-white p-3 rounded-lg border shadow-sm space-y-3 transition hover:shadow-md ${line.isClamped ? 'border-orange-300 ring-1 ring-orange-100' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${line.isClamped ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                        {index + 1}
                      </div>
                      <input 
                        type="text" value={line.text} onChange={(e) => updateLine(line.id, 'text', e.target.value)}
                        placeholder="Nhập nội dung..."
                        className="flex-1 text-sm border-b border-slate-200 px-1 py-1 focus:outline-none focus:border-blue-500 uppercase font-semibold text-slate-800 bg-transparent"
                      />
                      <button onClick={() => removeLine(line.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Xóa dòng này">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 pl-8">
                      <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Size %:</span>
                      <input type="range" min="50" max="250" value={line.scale} onChange={(e) => updateLine(line.id, 'scale', Number(e.target.value))} className={`flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer ${line.isClamped ? 'accent-orange-500' : 'accent-slate-600'}`} />
                      <div className="flex flex-col items-end w-10">
                        <span className={`text-xs font-bold ${line.isClamped ? 'text-orange-600' : 'text-slate-600'}`}>{line.scale}%</span>
                        {line.isClamped && <span className="text-[9px] text-orange-500 font-medium leading-none -mt-0.5" title="Đã chạm viền">Max: {line.clampedScale}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <button onClick={addLine} className="w-full text-sm font-medium flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-2.5 rounded-md hover:bg-blue-100 transition-colors border border-dashed border-blue-300">
                    <Plus size={16} /> Thêm dòng mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-white grid grid-cols-2 gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/20 font-semibold text-sm">
            <Printer size={18} /> In
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 py-2.5 rounded-lg hover:bg-slate-50 transition shadow-sm font-semibold text-sm">
            <Download size={18} /> Tải PDF
          </button>
        </div>
      </div>

      <div className={`relative transition-all duration-500 ease-in-out flex flex-col items-center justify-center preview-container ${isSidebarOpen ? 'w-[70%]' : 'w-full'}`}>
        
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`absolute top-1/2 -translate-y-1/2 bg-white p-2.5 rounded-r-xl shadow-[4px_0_15px_rgba(0,0,0,0.1)] border border-l-0 border-slate-200 text-slate-500 hover:text-blue-600 z-20 hide-on-print transition-all duration-500 ${isSidebarOpen ? 'left-0' : 'left-0'}`} title={isSidebarOpen ? "Thu gọn bảng điều khiển" : "Mở rộng bảng điều khiển"}>
          {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
        </button>

        <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] print-paper w-[90%] max-w-[1200px] aspect-[297/210] relative flex items-center justify-center border border-slate-200 overflow-hidden">
          
          <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <ellipse cx={CENTER_X} cy={CENTER_Y} rx={rx} ry={ry} fill={bgColor} />

            {currentBorder && currentBorder.type === 'single' && (
              <ellipse 
                cx={CENTER_X} cy={CENTER_Y} 
                rx={Math.max(0, rx - currentBorder.padding)} 
                ry={Math.max(0, ry - currentBorder.padding)} 
                fill="none" stroke={currentBorder.color} strokeWidth={currentBorder.width} 
              />
            )}
            
            {currentBorder && currentBorder.type === 'double' && (
              <>
                <ellipse 
                  cx={CENTER_X} cy={CENTER_Y} 
                  rx={Math.max(0, rx - currentBorder.padding)} 
                  ry={Math.max(0, ry - currentBorder.padding)} 
                  fill="none" stroke={currentBorder.color} strokeWidth={currentBorder.width} 
                />
                <ellipse 
                  cx={CENTER_X} cy={CENTER_Y} 
                  rx={Math.max(0, rx - currentBorder.padding - currentBorder.gap - currentBorder.width)} 
                  ry={Math.max(0, ry - currentBorder.padding - currentBorder.gap - currentBorder.width)} 
                  fill="none" stroke={currentBorder.color} strokeWidth={currentBorder.width} 
                />
              </>
            )}

            {lineMetrics.map((line) => {
              if (line.text.trim().length > 0) {
                return (
                  <text
                    key={line.id}
                    x={CENTER_X}
                    y={line.finalYPos}
                    fontFamily='"Times New Roman", Times, serif'
                    fontWeight="bold"
                    fontSize={line.finalFontSize}
                    fill={textColor}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontStyle={line.text.includes('!') ? 'italic' : 'normal'}
                  >
                    {line.text}
                  </text>
                );
              }
              return null;
            })}
          </svg>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; }
          .hide-on-print { display: none !important; }
          .preview-container { width: 100% !important; height: 100vh !important; display: block !important; padding: 0 !important; margin: 0 !important; }
          .print-paper { width: 100% !important; max-width: none !important; height: 100vh !important; box-shadow: none !important; margin: 0 !important; border: none !important; aspect-ratio: auto !important; }
          .print-paper svg { width: 100vw !important; height: 100vh !important; }
        }
      `}</style>
    </div>
  );
}
