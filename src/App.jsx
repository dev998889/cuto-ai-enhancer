import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { ENHANCE_PRESETS, processImageEnhancement, formatBytes } from "./utils/enhancerEngine";
import "./App.css";

const SAMPLES = [
  { name: "Sneaker (D2C)", file: "/samples/sample_sneaker.png", icon: "👟" },
  { name: "Luxury Watch", file: "/samples/sample_watch.png", icon: "⌚" },
  { name: "Porsche GT", file: "/samples/sample_porsche.png", icon: "🏎️" },
  { name: "Golden Retriever", file: "/samples/sample_dog.png", icon: "🐕" }
];

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [originalImage, setOriginalImage] = useState(null);
  const [originalSrc, setOriginalSrc] = useState(null);
  const [originalMeta, setOriginalMeta] = useState({ width: 0, height: 0, size: 0, name: "" });

  const [enhancedCanvas, setEnhancedCanvas] = useState(null);
  const [enhancedSrc, setEnhancedSrc] = useState(null);
  const [enhancedMeta, setEnhancedMeta] = useState({ width: 0, height: 0, time: 0 });

  const [scale, setScale] = useState(4); // 2x, 4x, 8x
  const [preset, setPreset] = useState("ultra4k");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const compRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load sample image
  const loadSample = async (sample) => {
    try {
      const resp = await fetch(sample.file);
      const blob = await resp.blob();
      const file = new File([blob], sample.name + ".png", { type: "image/png" });
      handleFileSelected(file);
    } catch (e) {
      console.error("Error loading sample", e);
    }
  };

  // Handle file input
  const handleFileSelected = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setOriginalSrc(e.target.result);
        setOriginalMeta({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          size: file.size,
          name: file.name
        });
        // Trigger enhancement automatically
        runEnhance(img, scale, preset);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Run AI enhancement
  const runEnhance = async (imgToProcess = originalImage, targetScale = scale, targetPreset = preset) => {
    if (!imgToProcess) return;
    setIsProcessing(true);
    setProgress(5);

    try {
      const res = await processImageEnhancement(
        imgToProcess,
        targetScale,
        targetPreset,
        (p) => setProgress(p)
      );

      setEnhancedCanvas(res.canvas);
      setEnhancedSrc(res.canvas.toDataURL("image/png"));
      setEnhancedMeta({
        width: res.width,
        height: res.height,
        time: res.processingTime
      });
    } catch (err) {
      console.error("Enhancement failed:", err);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  // Slider dragging logic
  const handleMove = (clientX) => {
    if (!compRef.current) return;
    const rect = compRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const stopDrag = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", stopDrag);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [isDragging]);

  // Download Action
  const handleDownload = (format = "png") => {
    if (!enhancedCanvas) return;
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });

    const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const ext = format === "jpeg" ? "jpg" : format;
    const link = document.createElement("a");
    link.download = `cuto_enhanced_${scale}x_${originalMeta.name.replace(/\.[^/.]+$/, "")}.${ext}`;
    link.href = enhancedCanvas.toDataURL(mime, 0.98);
    link.click();
  };

  // Copy to clipboard
  const handleCopyClipboard = async () => {
    if (!enhancedCanvas) return;
    try {
      enhancedCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }, "image/png");
    } catch (e) {
      console.error("Clipboard copy error:", e);
    }
  };

  const resetAll = () => {
    setOriginalImage(null);
    setOriginalSrc(null);
    setEnhancedCanvas(null);
    setEnhancedSrc(null);
    setProgress(0);
  };

  return (
    <div className="app-container">
      {/* Ambient Cosmic Glows */}
      <div className="ambient-glow glow-purple" />
      <div className="ambient-glow glow-cyan" />

      {/* ── Top Cosmic Navbar ── */}
      <header className="cosmic-navbar">
        <div className="nav-inner">
          <div className="nav-brand" onClick={resetAll}>
            <div className="brand-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div className="brand-title">Cuto <span>Enhancer</span></div>
            <div className="brand-badge">4K AI</div>
          </div>

          <div className="nav-actions">
            <a
              href="https://cuto.devv.in"
              target="_blank"
              rel="noreferrer"
              className="nav-link-cuto"
              title="Visit Cuto BG Remover"
            >
              ✂️ BG Remover
            </a>
            <button
              className="btn-theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Dark / Light Theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Application Body ── */}
      <main className="main-wrapper">
        {/* Hero Header */}
        <section className="hero-header">
          <div className="hero-pill-badge">
            <span>✨ 100% In-Browser Super-Resolution</span>
          </div>
          <h1 className="hero-title">
            Enhance & Upscale Photos to <span className="gradient-text">Crystal-Clear 4K</span>
          </h1>
          <p className="hero-subtitle">
            Turn blurry, low-resolution, or vintage photos into ultra-sharp masterpieces in 3 seconds. Zero watermarks, unlimited exports, and 100% private.
          </p>
        </section>

        {/* Workspace Card */}
        <div className="workspace-card">
          {!originalSrc ? (
            /* Upload Zone */
            <div
              className="upload-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleFileSelected(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) handleFileSelected(e.target.files[0]);
                }}
              />
              <div className="upload-icon-circle">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h3>Drag & Drop your photo here</h3>
              <p>Supports JPG, PNG, WEBP, and HEIC up to 4K • 100% Private (0 cloud uploads)</p>
              
              <button
                type="button"
                className="btn-upload-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Photo Now — Free
              </button>

              {/* Sample Bar */}
              <div className="sample-bar" onClick={(e) => e.stopPropagation()}>
                <span>Or try with sample:</span>
                {SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sample-pill"
                    onClick={() => loadSample(s)}
                  >
                    <span>{s.icon}</span> {s.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Studio Workspace */
            <div className="studio-container">
              {/* Studio Header & Controls */}
              <div className="studio-header">
                <div className="studio-title-group">
                  <h3>AI Super-Resolution Studio</h3>
                  <p>
                    Original: {originalMeta.width}×{originalMeta.height} px • {formatBytes(originalMeta.size)}
                  </p>
                </div>

                {/* Scale Switcher */}
                <div className="scale-selector-bar">
                  {[2, 4, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn-scale-opt ${scale === s ? "active" : ""}`}
                      onClick={() => {
                        setScale(s);
                        runEnhance(originalImage, s, preset);
                      }}
                    >
                      {s}x {s === 2 ? "HD" : s === 4 ? "4K UHD" : "8K Studio"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Selector Grid */}
              <div className="presets-grid">
                {Object.values(ENHANCE_PRESETS).map((p) => (
                  <div
                    key={p.id}
                    className={`preset-card ${preset === p.id ? "active" : ""}`}
                    onClick={() => {
                      setPreset(p.id);
                      runEnhance(originalImage, scale, p.id);
                    }}
                  >
                    <div className="preset-card-top">
                      <span style={{ fontSize: "18px" }}>{p.icon}</span>
                      <h4>{p.name}</h4>
                    </div>
                    <p>{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Interactive Split Comparison Slider */}
              <div
                className="comparison-viewport"
                ref={compRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              >
                {/* Before Image (Original) */}
                <img
                  src={originalSrc}
                  alt="Original Low Res"
                  className="comp-img"
                />
                <span className="badge-before">Original</span>

                {/* After Image (Enhanced Overlay) */}
                <div
                  className="comp-enhanced-overlay"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={enhancedSrc || originalSrc}
                    alt="AI 4K Enhanced"
                    style={{
                      width: compRef.current ? compRef.current.clientWidth : "100%"
                    }}
                  />
                  <span className="badge-after">{scale}x 4K Enhanced</span>
                </div>

                {/* Slider Handle Line */}
                <div
                  className="slider-handle-line"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="slider-handle-button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="processing-overlay">
                    <div className="spinner-neural" />
                    <h4 style={{ color: "#FFF", fontSize: "16px", fontWeight: "700" }}>
                      Reconstructing Sub-Pixel Details ({progress}%)...
                    </h4>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Ribbon */}
              <div className="stats-ribbon">
                <div className="stat-item">
                  <div className="val">{originalMeta.width}×{originalMeta.height}</div>
                  <div className="lbl">Original Size</div>
                </div>
                <div className="stat-item">
                  <div className="val">➔ {enhancedMeta.width}×{enhancedMeta.height}</div>
                  <div className="lbl">Enhanced 4K Size</div>
                </div>
                <div className="stat-item">
                  <div className="val">{((enhancedMeta.width * enhancedMeta.height) / 1000000).toFixed(1)} MP</div>
                  <div className="lbl">Total Resolution</div>
                </div>
                <div className="stat-item">
                  <div className="val">{enhancedMeta.time ? `${enhancedMeta.time}ms` : "Instant"}</div>
                  <div className="lbl">AI Execution</div>
                </div>
                <div className="stat-item">
                  <div className="val" style={{ color: "#10B981" }}>0 Bytes</div>
                  <div className="lbl">Cloud Uploads</div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="action-toolbar">
                <button
                  type="button"
                  className="btn-download-primary"
                  onClick={() => handleDownload("png")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download {scale}x 4K UHD Image (Free)
                </button>

                <div className="secondary-actions">
                  <button
                    type="button"
                    className="btn-action-sec"
                    onClick={handleCopyClipboard}
                  >
                    {copied ? "✅ Copied!" : "📋 Copy PNG"}
                  </button>

                  <button
                    type="button"
                    className="btn-action-sec"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    🔄 Change Photo
                  </button>

                  <button
                    type="button"
                    className="btn-action-sec"
                    onClick={resetAll}
                    style={{ color: "#EF4444" }}
                  >
                    ✕ Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Cross-Promotion Banner to Cuto BG Remover ── */}
        <section className="cross-promo-card">
          <div className="cross-promo-info">
            <h4>✂️ Need to remove photo backgrounds?</h4>
            <p>Try our sister tool <strong>Cuto BG Remover</strong> — 100% free transparent PNG cutouts in 3 seconds.</p>
          </div>
          <a
            href="https://cuto.devv.in"
            target="_blank"
            rel="noreferrer"
            className="btn-promo-go"
          >
            Open Cuto BG Remover ➔
          </a>
        </section>

        {/* ── Features Grid ── */}
        <section className="features-section">
          <div className="section-head">
            <h2>Why Creators Choose <span>Cuto AI Enhancer</span></h2>
          </div>
          <div className="features-grid">
            <div className="feat-card">
              <div className="feat-icon">⚡</div>
              <h4>Zero Subscriptions or Paywalls</h4>
              <p>Unlike VanceAI or Remini which demand $15/month after 2 photos, Cuto Enhancer offers unlimited 4K exports for $0.00 forever.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">🛡️</div>
              <h4>100% Device Privacy</h4>
              <p>Your photos never travel to remote servers. All neural super-resolution matrices compute locally in your browser memory.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">🔍</div>
              <h4>Sub-Pixel De-Blur & Sharpening</h4>
              <p>Adaptive deconvolution recovers eye reflections, fine eyelashes, hair contours, and jewelry facets from blurry camera shots.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">🚀</div>
              <h4>Instant 3-Second Execution</h4>
              <p>High-efficiency SIMD WebAssembly pipeline delivers crisp 4K UHD graphics with zero server waiting queues.</p>
            </div>
          </div>
        </section>

        {/* ── Interactive FAQ Accordion ── */}
        <section className="faq-wrap" id="faq">
          <div className="section-head">
            <h2>Frequently Asked <span>Questions</span></h2>
          </div>
          {[
            {
              q: "Is Cuto AI Enhancer really 100% free with unlimited 4K downloads?",
              a: "Yes! Because the super-resolution computation runs directly on your device's browser using WebAssembly, there are zero expensive cloud GPU server bills for us. This allows us to keep the tool 100% free forever without subscriptions or watermarks."
            },
            {
              q: "Are my photos uploaded to external cloud servers?",
              a: "No, never! Your photos stay 100% on your phone or laptop. No image bytes are ever transmitted over the network or stored in databases, ensuring total legal safety for personal portraits and business assets."
            },
            {
              q: "Can I enhance old, blurry, or low-resolution WhatsApp photos?",
              a: "Yes! Choose the 'De-Blur & Old Photo Fix' preset. It applies an aggressive high-frequency deconvolution matrix that eliminates compression pixelation and sharpens faded edges."
            },
            {
              q: "Photo ki quality 4K me kaise convert karein bina paise diye?",
              a: "Bas apni photo ko drag & drop karein, '4x UHD' select karein, aur 3 second ke andar AI photo ko full 4K resolution me convert kar dega. Download bilkul free aur watermark-less hai."
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="faq-item"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="faq-q">
                <span>{faq.q}</span>
                <span>{openFaq === idx ? "▲" : "▼"}</span>
              </div>
              {openFaq === idx && <div className="faq-a">{faq.a}</div>}
            </div>
          ))}
        </section>
      </main>

      {/* ── Cosmic Footer ── */}
      <footer className="cosmic-footer">
        <div className="footer-inner">
          <div className="footer-brand">Cuto <span>AI Enhancer</span></div>
          <p className="footer-desc">
            The internet's #1 private, in-browser AI image enhancer and 4K super-resolution upscaler.
          </p>
          <p className="footer-copy">
            © 2026 Cuto AI • 100% Free & Open In-Browser AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
