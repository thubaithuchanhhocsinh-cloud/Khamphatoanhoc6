import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  RotateCw, 
  FlipHorizontal, 
  Play, 
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

import confetti from 'canvas-confetti';

// --- Types & Constants ---

type Tab = 'integer' | 'point' | 'line';

interface Axis {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isSymmetric: boolean;
}

interface ShapeData {
  id: string;
  name: string;
  path: string;
  viewBox: string;
  centerX: number;
  centerY: number;
  hasPointSymmetry: boolean;
  axes: Axis[];
}

// --- Helper Components ---

const Button = ({ onClick, children, className = '', disabled = false, variant = 'primary' }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- Main Components ---

const IntegerAddition = () => {
  const [expression, setExpression] = useState('(-2) + 3');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [currentPos, setCurrentPos] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [step, setStep] = useState(0); // 0: idle, 1: first num, 2: second num, 3: result
  const [result, setResult] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // New state for manual control
  const [history, setHistory] = useState<{ from: number, to: number, value: number, id: number }[]>([]);
  const [moveValue, setMoveValue] = useState(2);

  const range = 20;
  const unitSize = 30; // pixels per unit
  const centerX = 400; // SVG center

  const parseExpression = (expr: string) => {
    try {
      const cleaned = expr.replace(/\s+/g, '').replace(/\(/g, '').replace(/\)/g, '');
      const parts = cleaned.split('+');
      if (parts.length === 2) {
        return [parseInt(parts[0]), parseInt(parts[1])];
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const handleExecute = async () => {
    const parsed = parseExpression(expression);
    if (!parsed) {
      setErrorMessage('Vui lòng nhập phép tính đúng định dạng (ví dụ: (-2) + 3)');
      return;
    }
    setErrorMessage('');
    reset();

    const [n1, n2] = parsed;
    setNum1(n1);
    setNum2(n2);
    setIsAnimating(true);

    await new Promise(r => setTimeout(r, 500));

    // Step 1: Move first number
    setStep(1);
    const move1 = { from: 0, to: n1, value: n1, id: Date.now() };
    setHistory([move1]);
    setCurrentPos(n1);
    await new Promise(r => setTimeout(r, 2000));

    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Move second number
    setStep(2);
    const move2 = { from: n1, to: n1 + n2, value: n2, id: Date.now() + 1 };
    setHistory(prev => [...prev, move2]);
    setCurrentPos(n1 + n2);
    await new Promise(r => setTimeout(r, 2000));

    // Step 3: Show result
    setStep(3);
    const finalResult = n1 + n2;
    setResult(finalResult);
    setIsAnimating(false);
  };

  const handleManualMove = async (direction: 'pos' | 'neg') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setErrorMessage('');
    setResult(null);
    setStep(2); // Use step 2 style for manual moves

    const val = direction === 'pos' ? moveValue : -moveValue;
    const from = currentPos;
    const to = from + val;

    const newMove = { from, to, value: val, id: Date.now() };
    setHistory(prev => [...prev, newMove]);
    setCurrentPos(to);

    await new Promise(r => setTimeout(r, 2000));
    
    setResult(to);
    setIsAnimating(false);
  };

  const reset = () => {
    setStep(0);
    setCurrentPos(0);
    setResult(null);
    setHistory([]);
    setErrorMessage('');
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Mô phỏng cộng số nguyên</h2>
      
      <div className="flex flex-col gap-6 mb-8 w-full max-w-xl">
        {/* Automatic Mode */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Chế độ nhập phép tính</p>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ví dụ: (-2) + 3"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-mono"
              disabled={isAnimating}
            />
            <Button onClick={handleExecute} disabled={isAnimating}>
              <Play size={18} /> Thực hiện
            </Button>
          </div>
        </div>

        {/* Manual Mode */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <p className="text-sm font-semibold text-indigo-500 mb-3 uppercase tracking-wider">Chế độ điều khiển con chạy</p>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 text-sm font-medium">Giá trị:</span>
              <input 
                type="number" 
                value={moveValue}
                onChange={(e) => setMoveValue(Math.abs(parseInt(e.target.value) || 0))}
                className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                disabled={isAnimating}
              />
            </div>
            <div className="flex gap-2 flex-1">
              <Button onClick={() => handleManualMove('neg')} disabled={isAnimating} variant="danger" className="flex-1 py-1.5 text-sm">
                <ArrowLeft size={16} /> Chiều âm (-)
              </Button>
              <Button onClick={() => handleManualMove('pos')} disabled={isAnimating} variant="success" className="flex-1 py-1.5 text-sm">
                Chiều dương (+) <ArrowRight size={16} />
              </Button>
            </div>
            <Button onClick={reset} variant="secondary" disabled={isAnimating} className="py-1.5">
              <RefreshCw size={16} /> Làm lại
            </Button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <div className="relative w-full overflow-x-auto py-24 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <svg width="800" height="220" className="mx-auto">
          {/* Number Line */}
          <line x1="50" y1="120" x2="750" y2="120" stroke="#64748b" strokeWidth="2" />
          {/* Ticks and Labels */}
          {Array.from({ length: range + 1 }).map((_, i) => {
            const val = i - range / 2;
            const x = centerX + val * unitSize;
            return (
              <g key={val}>
                <line x1={x} y1="115" x2={x} y2="125" stroke="#64748b" strokeWidth="2" />
                <text x={x} y="145" textAnchor="middle" fontSize="12" className="fill-slate-500 font-medium">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Arrows from History */}
          <AnimatePresence>
            {history.map((move, index) => (
              <motion.g key={move.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.line
                  initial={{ x2: centerX + move.from * unitSize }}
                  animate={{ x2: centerX + move.to * unitSize }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  x1={centerX + move.from * unitSize}
                  y1={90 - (index % 3) * 25}
                  y2={90 - (index % 3) * 25}
                  stroke={move.value > 0 ? "#10b981" : "#ef4444"}
                  strokeWidth="3"
                  markerEnd={move.value > 0 ? "url(#arrowhead-green)" : "url(#arrowhead-red)"}
                />
                <motion.text 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  x={centerX + (move.from + move.to) * unitSize / 2} 
                  y={80 - (index % 3) * 25} 
                  textAnchor="middle" 
                  className={move.value > 0 ? "fill-emerald-600 font-bold text-xs" : "fill-red-600 font-bold text-xs"}
                >
                  {move.value > 0 ? `+${move.value}` : move.value}
                </motion.text>
              </motion.g>
            ))}
          </AnimatePresence>

          {/* Runner (Con chạy) */}
          <motion.circle
            animate={{ 
              cx: centerX + currentPos * unitSize 
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
            cy="120"
            r="10"
            fill="#4f46e5"
            stroke="white"
            strokeWidth="2"
            className="shadow-lg"
          />

          {/* Markers */}
          <defs>
            <marker id="arrowhead-red" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
            </marker>
            <marker id="arrowhead-green" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#10b981" />
            </marker>
          </defs>
        </svg>
      </div>

      {result !== null && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center w-full max-w-md"
        >
          <p className="text-indigo-900 font-semibold text-xl">
            Kết quả: <span className="text-indigo-600 font-bold">{result}</span>
          </p>
          {history.length > 0 && (
            <p className="text-slate-500 text-sm mt-1 font-mono">
              0 {history.map(m => (m.value >= 0 ? `+ ${m.value}` : `- ${Math.abs(m.value)}`)).join(' ')} = {result}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
};

const PointSymmetry = () => {
  const [category, setCategory] = useState<'plane' | 'real' | 'letter'>('plane');
  const [selectedShape, setSelectedShape] = useState<ShapeData | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [message, setMessage] = useState('');

  const shapes: Record<string, ShapeData[]> = {
    plane: [
      { id: 'rect', name: 'Hình chữ nhật', path: 'M 20 40 H 180 V 160 H 20 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'square', name: 'Hình vuông', path: 'M 40 40 H 160 V 160 H 40 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'rhombus', name: 'Hình thoi', path: 'M 100 20 L 180 100 L 100 180 L 20 100 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'para', name: 'Hình bình hành', path: 'M 60 40 L 180 40 L 140 160 L 20 160 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'hex', name: 'Hình lục giác đều', path: 'M 100 20 L 170 60 L 170 140 L 100 180 L 30 140 L 30 60 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'circle', name: 'Hình tròn', path: 'M 100 100 m -80 0 a 80 80 0 1 0 160 0 a 80 80 0 1 0 -160 0', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'tri', name: 'Tam giác đều', path: 'M 100 30 L 180 170 L 20 170 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 110, hasPointSymmetry: false, axes: [] },
      { id: 'trap', name: 'Hình thang cân', path: 'M 60 40 L 140 40 L 180 160 L 20 160 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: false, axes: [] },
    ],
    real: [
      { id: 'fan2', name: 'Chong chóng 2 cánh', path: 'M 100 100 L 100 20 L 120 20 L 120 100 M 100 100 L 100 180 L 80 180 L 80 100', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'fan4', name: 'Chong chóng 4 cánh', path: 'M 100 100 L 100 20 L 120 20 L 120 100 M 100 100 L 180 100 L 180 120 L 100 120 M 100 100 L 100 180 L 80 180 L 80 100 M 100 100 L 20 100 L 20 80 L 100 80', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [] },
      { id: 'fan3', name: 'Chong chóng 3 cánh', path: 'M 100 100 L 100 20 L 120 20 L 120 100 M 100 100 L 170 140 L 160 155 L 100 100 M 100 100 L 30 140 L 40 155 L 100 100', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: false, axes: [] },
      { id: 'kite', name: 'Cánh diều', path: 'M 100 20 L 160 80 L 100 180 L 40 80 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 90, hasPointSymmetry: false, axes: [] },
      { id: 'house', name: 'Ngôi nhà', path: 'M 40 100 L 100 40 L 160 100 V 160 H 40 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 110, hasPointSymmetry: false, axes: [] },
    ],
    letter: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(char => ({
      id: `letter-${char}`,
      name: `Chữ ${char}`,
      path: char, 
      viewBox: '0 0 100 100',
      centerX: 50,
      centerY: 50,
      hasPointSymmetry: ['H', 'I', 'N', 'O', 'S', 'X', 'Z'].includes(char),
      axes: []
    }))
  };

  useEffect(() => {
    if (!selectedShape && shapes[category].length > 0) {
      setSelectedShape(shapes[category][0]);
    }
  }, [category]);

  const handleRotate = async () => {
    if (!selectedShape || isRotating) return;
    setIsRotating(true);
    setMessage('');
    setRotation(0);

    const duration = 3000;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setRotation(progress * 180);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsRotating(false);
        if (selectedShape.hasPointSymmetry) {
          setMessage('Hình có tâm đối xứng');
        } else {
          setMessage('Hình không có tâm đối xứng');
        }
      }
    };
    
    requestAnimationFrame(animate);
  };

  const reset = () => {
    setRotation(0);
    setMessage('');
    setIsRotating(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Mô phỏng hình có tâm đối xứng</h2>
      
      <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-xl">
        <button 
          onClick={() => { setCategory('plane'); reset(); setSelectedShape(shapes.plane[0]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === 'plane' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Hình phẳng
        </button>
        <button 
          onClick={() => { setCategory('real'); reset(); setSelectedShape(shapes.real[0]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === 'real' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Hình thực tế
        </button>
        <button 
          onClick={() => { setCategory('letter'); reset(); setSelectedShape(shapes.letter[0]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === 'letter' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Chữ cái
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
        <div className="md:col-span-1 flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {shapes[category].map(shape => (
            <button
              key={shape.id}
              onClick={() => { setSelectedShape(shape); reset(); }}
              className={`text-left px-4 py-3 rounded-xl transition-all border ${selectedShape?.id === shape.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              {shape.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-8 border border-slate-100 relative min-h-[400px]">
          {selectedShape && (
            <div className="relative w-64 h-64">
              <svg viewBox={selectedShape.viewBox} className="absolute inset-0 w-full h-full opacity-10">
                {selectedShape.id.startsWith('letter-') ? (
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="60" fontWeight="bold" fill="currentColor">{selectedShape.path}</text>
                ) : (
                  <path d={selectedShape.path} fill="currentColor" />
                )}
              </svg>

              <motion.div 
                style={{ 
                  rotate: rotation,
                  transformOrigin: (() => {
                    const parts = selectedShape.viewBox.split(' ');
                    const vbW = parseInt(parts[2]);
                    const vbH = parseInt(parts[3]);
                    return `${(selectedShape.centerX / vbW) * 100}% ${(selectedShape.centerY / vbH) * 100}%`;
                  })()
                }}
                className="w-full h-full"
              >
                <svg viewBox={selectedShape.viewBox} className="w-full h-full drop-shadow-md">
                  {selectedShape.id.startsWith('letter-') ? (
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="60" fontWeight="bold" fill="#4f46e5">{selectedShape.path}</text>
                  ) : (
                    <path d={selectedShape.path} fill="#4f46e5" stroke="#312e81" strokeWidth="2" />
                  )}
                </svg>
              </motion.div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full z-10 shadow-sm" style={{ left: `${(selectedShape.centerX / parseInt(selectedShape.viewBox.split(' ')[2])) * 100}%`, top: `${(selectedShape.centerY / parseInt(selectedShape.viewBox.split(' ')[3])) * 100}%` }}></div>
            </div>
          )}

          <div className="mt-12 flex gap-4">
            <Button onClick={handleRotate} disabled={isRotating}>
              <RotateCw size={18} /> QUAY NỬA VÒNG TRÒN
            </Button>
            <Button onClick={reset} variant="secondary" disabled={isRotating}>
              <RefreshCw size={18} /> Làm lại
            </Button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`mt-6 px-6 py-3 rounded-full font-bold text-lg flex items-center gap-2 ${selectedShape?.hasPointSymmetry ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
              >
                {selectedShape?.hasPointSymmetry ? <CheckCircle2 /> : <XCircle />}
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const LineSymmetry = () => {
  const [category, setCategory] = useState<'plane' | 'real' | 'letter'>('plane');
  const [selectedShape, setSelectedShape] = useState<ShapeData | null>(null);
  const [selectedAxis, setSelectedAxis] = useState<number | null>(null);
  const [isFolding, setIsFolding] = useState(false);
  const [foldProgress, setFoldProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number, y: number } | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const shapes: Record<string, ShapeData[]> = {
    plane: [
      { 
        id: 'rect', name: 'Hình chữ nhật', path: 'M 20 40 H 180 V 160 H 20 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true,
        axes: [
          { name: 'Trục ngang', x1: 0, y1: 100, x2: 200, y2: 100, isSymmetric: true },
          { name: 'Trục dọc', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true }
        ]
      },
      { 
        id: 'square', name: 'Hình vuông', path: 'M 40 40 H 160 V 160 H 40 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true,
        axes: [
          { name: 'Trục ngang', x1: 0, y1: 100, x2: 200, y2: 100, isSymmetric: true },
          { name: 'Trục dọc', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true },
          { name: 'Đường chéo 1', x1: 0, y1: 0, x2: 200, y2: 200, isSymmetric: true },
          { name: 'Đường chéo 2', x1: 200, y1: 0, x2: 0, y2: 200, isSymmetric: true }
        ]
      },
      { 
        id: 'rhombus', name: 'Hình thoi', path: 'M 100 20 L 180 100 L 100 180 L 20 100 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true,
        axes: [
          { name: 'Đường chéo 1', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true },
          { name: 'Đường chéo 2', x1: 0, y1: 100, x2: 200, y2: 100, isSymmetric: true }
        ]
      },
      { 
        id: 'para', name: 'Hình bình hành', path: 'M 60 40 L 180 40 L 140 160 L 20 160 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true,
        axes: [
          { name: 'Trục nối trung điểm 1', x1: 120, y1: 40, x2: 80, y2: 160, isSymmetric: false },
          { name: 'Trục nối trung điểm 2', x1: 40, y1: 100, x2: 160, y2: 100, isSymmetric: false },
          { name: 'Đường chéo 1', x1: 60, y1: 40, x2: 140, y2: 160, isSymmetric: false },
          { name: 'Đường chéo 2', x1: 180, y1: 40, x2: 20, y2: 160, isSymmetric: false }
        ]
      },
      { 
        id: 'hex', name: 'Hình lục giác đều', path: 'M 100 20 L 170 60 L 170 140 L 100 180 L 30 140 L 30 60 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true,
        axes: [
          { name: 'Trục 1 (Đỉnh-Đỉnh)', x1: 100, y1: 20, x2: 100, y2: 180, isSymmetric: true },
          { name: 'Trục 2 (Đỉnh-Đỉnh)', x1: 30, y1: 60, x2: 170, y2: 140, isSymmetric: true },
          { name: 'Trục 3 (Đỉnh-Đỉnh)', x1: 170, y1: 60, x2: 30, y2: 140, isSymmetric: true },
          { name: 'Trục 4 (Cạnh-Cạnh)', x1: 30, y1: 100, x2: 170, y2: 100, isSymmetric: true },
          { name: 'Trục 5 (Cạnh-Cạnh)', x1: 65, y1: 40, x2: 135, y2: 160, isSymmetric: true },
          { name: 'Trục 6 (Cạnh-Cạnh)', x1: 135, y1: 40, x2: 65, y2: 160, isSymmetric: true }
        ]
      },
      { 
        id: 'circle', name: 'Hình tròn', path: 'M 100 100 m -80 0 a 80 80 0 1 0 160 0 a 80 80 0 1 0 -160 0', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true,
        axes: [
          { name: 'Đường kính 1', x1: 0, y1: 100, x2: 200, y2: 100, isSymmetric: true },
          { name: 'Đường kính 2', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true },
          { name: 'Đường kính 3', x1: 30, y1: 30, x2: 170, y2: 170, isSymmetric: true }
        ]
      },
      { 
        id: 'tri', name: 'Tam giác đều', path: 'M 100 30 L 180 170 L 20 170 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 110, hasPointSymmetry: false,
        axes: [
          { name: 'Trục 1', x1: 100, y1: 30, x2: 100, y2: 170, isSymmetric: true },
          { name: 'Trục 2', x1: 180, y1: 170, x2: 60, y2: 100, isSymmetric: true },
          { name: 'Trục 3', x1: 20, y1: 170, x2: 140, y2: 100, isSymmetric: true }
        ]
      },
      { 
        id: 'trap', name: 'Hình thang cân', path: 'M 60 40 L 140 40 L 180 160 L 20 160 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: false,
        axes: [
          { name: 'Trục đối xứng', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true }
        ]
      },
    ],
    real: [
      { id: 'star', name: 'Sao biển', path: 'M 100 20 L 120 80 L 180 80 L 130 120 L 150 180 L 100 140 L 50 180 L 70 120 L 20 80 L 80 80 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: false, axes: [{ name: 'Trục dọc', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true }] },
      { id: 'flower4', name: 'Hoa 4 cánh', path: 'M 100 100 m 0 -60 a 30 30 0 1 1 0 60 a 30 30 0 1 1 0 -60 M 100 100 m 60 0 a 30 30 0 1 1 -60 0 a 30 30 0 1 1 60 0 M 100 100 m 0 60 a 30 30 0 1 1 0 -60 a 30 30 0 1 1 0 60 M 100 100 m -60 0 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: true, axes: [{ name: 'Trục ngang', x1: 0, y1: 100, x2: 200, y2: 100, isSymmetric: true }, { name: 'Trục dọc', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true }] },
      { id: 'sign', name: 'Biển báo giao thông', path: 'M 100 20 L 180 160 L 20 160 Z M 100 60 L 110 130 H 90 Z M 100 140 a 5 5 0 1 1 0 10 a 5 5 0 1 1 0 -10', viewBox: '0 0 200 200', centerX: 100, centerY: 100, hasPointSymmetry: false, axes: [{ name: 'Trục dọc', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true }] },
      { id: 'kite', name: 'Cánh diều', path: 'M 100 20 L 160 80 L 100 180 L 40 80 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 90, hasPointSymmetry: false, axes: [{ name: 'Trục dọc', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true }] },
      { id: 'house', name: 'Ngôi nhà', path: 'M 40 100 L 100 40 L 160 100 V 160 H 40 Z', viewBox: '0 0 200 200', centerX: 100, centerY: 110, hasPointSymmetry: false, axes: [{ name: 'Trục dọc', x1: 100, y1: 0, x2: 100, y2: 200, isSymmetric: true }] },
    ],
    letter: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(char => {
      const axes: Axis[] = [];
      if (['A', 'H', 'I', 'M', 'O', 'T', 'U', 'V', 'W', 'X', 'Y'].includes(char)) axes.push({ name: 'Trục dọc', x1: 50, y1: 0, x2: 50, y2: 100, isSymmetric: true });
      if (['B', 'C', 'D', 'E', 'H', 'I', 'K', 'O', 'X'].includes(char)) axes.push({ name: 'Trục ngang', x1: 0, y1: 50, x2: 100, y2: 50, isSymmetric: true });
      return {
        id: `letter-${char}`,
        name: `Chữ ${char}`,
        path: char,
        viewBox: '0 0 100 100',
        centerX: 50,
        centerY: 50,
        hasPointSymmetry: false, 
        axes
      };
    })
  };

  useEffect(() => {
    if (!selectedShape && shapes[category].length > 0) {
      setSelectedShape(shapes[category][0]);
    }
  }, [category]);

  const handleFold = async () => {
    if (selectedAxis === null || isFolding || !selectedShape) return;
    setIsFolding(true);
    setMessage('');
    
    const duration = 2500; // 2.5 seconds as requested
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setFoldProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsFolding(false);
        const axis = selectedShape.axes[selectedAxis];
        if (axis.isSymmetric) {
          setMessage('Hình có trục đối xứng theo trục này');
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else {
          setMessage('Hình không có trục đối xứng theo trục này');
        }
      }
    };
    
    requestAnimationFrame(animate);
  };

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    
    if ('touches' in e) {
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else {
      pt.x = e.clientX;
      pt.y = e.clientY;
    }
    
    const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: cursor.x, y: cursor.y };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isFolding) return;
    const pos = getMousePos(e);
    if (pos) {
      setDrawStart(pos);
      setDrawEnd(pos);
      setIsDrawing(true);
      setSelectedAxis(null);
      setFoldProgress(0);
      setMessage('');
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    if (pos) {
      setDrawEnd(pos);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart || !drawEnd || !selectedShape) {
      setIsDrawing(false);
      return;
    }
    setIsDrawing(false);

    // Check if the drawn line is close to any symmetric axis
    let foundIdx = -1;
    const threshold = 15; // pixels

    selectedShape.axes.forEach((axis, idx) => {
      if (!axis.isSymmetric) return;

      // Distance from drawn points to the axis line
      const distStart = distToLine(drawStart.x, drawStart.y, axis.x1, axis.y1, axis.x2, axis.y2);
      const distEnd = distToLine(drawEnd.x, drawEnd.y, axis.x1, axis.y1, axis.x2, axis.y2);

      if (distStart < threshold && distEnd < threshold) {
        foundIdx = idx;
      }
    });

    if (foundIdx !== -1) {
      setSelectedAxis(foundIdx);
      // Auto fold if correct
      setTimeout(() => handleFold(), 100);
    } else {
      setMessage('Đây không phải là trục đối xứng, hãy thử vẽ lại!');
      setDrawStart(null);
      setDrawEnd(null);
    }
  };

  const distToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const reset = () => {
    setFoldProgress(0);
    setMessage('');
    setIsFolding(false);
    setSelectedAxis(null);
    setDrawStart(null);
    setDrawEnd(null);
  };

  const getAxisAngle = (axis: any) => {
    return Math.atan2(axis.y2 - axis.y1, axis.x2 - axis.x1) * (180 / Math.PI);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Mô phỏng hình có trục đối xứng</h2>
      
      <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-xl">
        <button 
          onClick={() => { setCategory('plane'); reset(); setSelectedShape(shapes.plane[0]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === 'plane' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Hình phẳng
        </button>
        <button 
          onClick={() => { setCategory('real'); reset(); setSelectedShape(shapes.real[0]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === 'real' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Hình thực tế
        </button>
        <button 
          onClick={() => { setCategory('letter'); reset(); setSelectedShape(shapes.letter[0]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === 'letter' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Chữ cái
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
        <div className="md:col-span-1 flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {shapes[category].map(shape => (
            <button
              key={shape.id}
              onClick={() => { setSelectedShape(shape); reset(); }}
              className={`text-left px-4 py-3 rounded-xl transition-all border ${selectedShape?.id === shape.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              {shape.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-8 border border-slate-100 relative min-h-[400px]">
          <div className="absolute top-4 right-4 flex items-center gap-2 text-slate-400 text-sm">
            <Info size={16} />
            <span>Dùng chuột vẽ trục đối xứng lên hình</span>
          </div>

          {selectedShape && (
            <div className="relative w-64 h-64 flex flex-col items-center">
              <div className="relative w-full h-full overflow-hidden cursor-crosshair">
                <svg 
                  ref={svgRef}
                  viewBox={selectedShape.viewBox} 
                  className="absolute inset-0 w-full h-full"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => setIsDrawing(false)}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                >
                  <defs>
                    {selectedAxis !== null && (
                      <>
                        <clipPath id="clip-stationary">
                          <rect 
                            x="-500" y="0" width="500" height="1000" 
                            transform={`translate(${selectedShape.axes[selectedAxis].x1}, ${selectedShape.axes[selectedAxis].y1}) rotate(${getAxisAngle(selectedShape.axes[selectedAxis])})`}
                          />
                        </clipPath>
                        <clipPath id="clip-folding">
                          <rect 
                            x="0" y="0" width="500" height="1000" 
                            transform={`translate(${selectedShape.axes[selectedAxis].x1}, ${selectedShape.axes[selectedAxis].y1}) rotate(${getAxisAngle(selectedShape.axes[selectedAxis])})`}
                          />
                        </clipPath>
                      </>
                    )}
                  </defs>

                  {selectedShape.id.startsWith('letter-') ? (
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="60" fontWeight="bold" fill="#4f46e5" opacity={0.3}>{selectedShape.path}</text>
                  ) : (
                    <path d={selectedShape.path} fill="#4f46e5" opacity={0.3} />
                  )}
                </svg>

                {selectedAxis !== null && (
                  <>
                    {/* Stationary Half */}
                    <svg viewBox={selectedShape.viewBox} className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: 'url(#clip-stationary)' }}>
                      {selectedShape.id.startsWith('letter-') ? (
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="60" fontWeight="bold" fill="#4f46e5">{selectedShape.path}</text>
                      ) : (
                        <path d={selectedShape.path} fill="#4f46e5" stroke="#312e81" strokeWidth="2" />
                      )}
                    </svg>

                    {/* Folding Half */}
                    <motion.div 
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ 
                        perspective: '1000px',
                        clipPath: 'url(#clip-folding)'
                      }}
                    >
                      <motion.div
                        style={{
                          width: '100%',
                          height: '100%',
                          transformOrigin: `${selectedShape.axes[selectedAxis].x1}px ${selectedShape.axes[selectedAxis].y1}px`,
                          transform: `rotate(${getAxisAngle(selectedShape.axes[selectedAxis])}deg) rotateX(${foldProgress * 180}deg) rotate(${-getAxisAngle(selectedShape.axes[selectedAxis])}deg)`
                        }}
                      >
                         <svg viewBox={selectedShape.viewBox} className="w-full h-full">
                          {selectedShape.id.startsWith('letter-') ? (
                            <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="60" fontWeight="bold" fill="#4f46e5">{selectedShape.path}</text>
                          ) : (
                            <path d={selectedShape.path} fill="#4f46e5" stroke="#312e81" strokeWidth="1" />
                          )}
                        </svg>
                      </motion.div>
                    </motion.div>
                  </>
                )}

                <svg viewBox={selectedShape.viewBox} className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Base shape only if not folding or to show the other half if clip fails */}
                  {selectedAxis === null && (
                    selectedShape.id.startsWith('letter-') ? (
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="60" fontWeight="bold" fill="#4f46e5">{selectedShape.path}</text>
                    ) : (
                      <path d={selectedShape.path} fill="#4f46e5" stroke="#312e81" strokeWidth="2" />
                    )
                  )}
                  
                  {selectedAxis !== null && (
                    <line 
                      x1={selectedShape.axes[selectedAxis].x1} 
                      y1={selectedShape.axes[selectedAxis].y1} 
                      x2={selectedShape.axes[selectedAxis].x2} 
                      y2={selectedShape.axes[selectedAxis].y2} 
                      stroke="#ef4444" 
                      strokeWidth="3" 
                      strokeDasharray="5,5"
                    />
                  )}

                  {isDrawing && drawStart && drawEnd && (
                    <line 
                      x1={drawStart.x} 
                      y1={drawStart.y} 
                      x2={drawEnd.x} 
                      y2={drawEnd.y} 
                      stroke="#ef4444" 
                      strokeWidth="3" 
                      strokeDasharray="5,5"
                    />
                  )}
                </svg>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 justify-center">
                {selectedShape.axes.map((axis, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedAxis(idx); setFoldProgress(0); setMessage(''); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedAxis === idx ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'}`}
                  >
                    {axis.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex gap-4">
            <Button onClick={handleFold} disabled={selectedAxis === null || isFolding}>
              <FlipHorizontal size={18} /> GẬP HÌNH
            </Button>
            <Button onClick={reset} variant="secondary" disabled={isFolding}>
              <RefreshCw size={18} /> Làm lại
            </Button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`mt-6 px-6 py-3 rounded-full font-bold text-lg flex flex-col items-center gap-1 ${selectedShape?.axes[selectedAxis!]?.isSymmetric ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
              >
                <div className="flex items-center gap-2">
                  {selectedShape?.axes[selectedAxis!]?.isSymmetric ? <CheckCircle2 /> : <XCircle />}
                  {message}
                </div>
                {selectedShape?.axes[selectedAxis!]?.isSymmetric && (
                  <span className="text-sm font-medium">Hình có {selectedShape?.axes.filter(a => a.isSymmetric).length} trục đối xứng</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('integer');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Plus size={24} strokeWidth={3} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">
              Khám Phá Toán Học 6
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('integer')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'integer' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cộng số nguyên
            </button>
            <button 
              onClick={() => setActiveTab('point')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'point' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tâm đối xứng
            </button>
            <button 
              onClick={() => setActiveTab('line')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Trục đối xứng
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            {activeTab === 'integer' && "MÔ PHỎNG CỘNG SỐ NGUYÊN"}
            {activeTab === 'point' && "MÔ PHỎNG HÌNH CÓ TÂM ĐỐI XỨNG"}
            {activeTab === 'line' && "MÔ PHỎNG HÌNH CÓ TRỤC ĐỐI XỨNG"}
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Học toán trực quan thông qua các mô hình tương tác sinh động.
          </p>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'integer' && <IntegerAddition />}
          {activeTab === 'point' && <PointSymmetry />}
          {activeTab === 'line' && <LineSymmetry />}
        </motion.div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2026 Khám Phá Toán Học 6. Tất cả các mô phỏng được thiết kế cho mục đích giáo dục.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Info size={20} /></a>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
