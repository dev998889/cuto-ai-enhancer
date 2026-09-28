import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { ENHANCE_PRESETS, processImageEnhancement, formatBytes } from "./utils/enhancerEngine";
import "./App.css";

// ── Showcase Categories (For Interactive 4K AI Enhancer Showcase) ──
const SHOWCASE_CATEGORIES = [
  {
    id: "portrait",
    label: "Portrait & Face",
    title: "Restore Facial Clarity, Skin Texture & Crisp Iris in 4K",
    desc: "Advanced neural super-resolution removes camera blur, sharpens eyelashes and eyebrows, and recovers natural skin micro-texture without plastic artifacts.",
    enhanced: "/samples/sample_portrait.jpg",
    original: "/samples/sample_portrait_orig.jpg",
    filename: "portrait_4k.jpg",
    badge: "Face Clarity",
  },
  {
    id: "vintage",
    label: "Old Photo Fix",
    title: "Revive Vintage Memories & Family Heirloom Photos in Ultra HD",
    desc: "Breathe new life into faded, low-resolution black & white and antique portraits with sub-pixel edge reconstruction and contrast de-blurring.",
    enhanced: "/samples/sample_vintage.jpg",
    original: "/samples/sample_vintage_orig.jpg",
    filename: "vintage_restored_4k.jpg",
    badge: "Old Photo Fix",
  },
  {
    id: "wildlife",
    label: "Wildlife & Macro",
    title: "Uncover Microscopic Feathers, Animal Fur & Vibrant Textures",
    desc: "Enhance wildlife captures and macro shots. Resolves microscopic parrot feathers, whisker follicles, and intricate textures with zero artificial haloing.",
    enhanced: "/samples/sample_wildlife.jpg",
    original: "/samples/sample_wildlife_orig.jpg",
    filename: "wildlife_parrot_4k.jpg",
    badge: "Macro & Wildlife",
  },
  {
    id: "cityscape",
    label: "Travel & City",
    title: "Sharpen Travel Architecture, Glowing Lanterns & Distant Skylines",
    desc: "Restore hazy twilight landscapes, historic canal architecture, and night illumination into crisp 4K desktop wallpapers.",
    enhanced: "/samples/sample_cityscape.jpg",
    original: "/samples/sample_cityscape_orig.jpg",
    filename: "venice_twilight_4k.jpg",
    badge: "Travel & Architecture",
  },
  {
    id: "anime",
    label: "Anime & Digital Art",
    title: "Vector-Clean 4K Upscaling for Digital Art & Anime Wallpapers",
    desc: "Upscale illustrations and digital character renders with razor-sharp vector line art, vibrant glow effects, and zero compression noise.",
    enhanced: "/samples/sample_anime.jpg",
    original: "/samples/sample_anime_orig.jpg",
    filename: "cyber_anime_4k.jpg",
    badge: "Digital Art 4K",
  },
];

export default function App() {
  const [original, setOriginal] = useState(null); // { url, file, name, width, height, size }
  const [originalImgObj, setOriginalImgObj] = useState(null);
  const [result, setResult] = useState(null); // blob URL
  const [resultCanvas, setResultCanvas] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState("split"); // split | result | original
  const [sliderPos, setSliderPos] = useState(50);
  const [scale, setScale] = useState(4); // 2x, 4x, 8x
  const [preset, setPreset] = useState("ultra4k");
  const [exportFormat, setExportFormat] = useState("png");
  const [enhancedMeta, setEnhancedMeta] = useState({ width: 0, height: 0, time: 0 });
  const [copyFeedback, setCopyFeedback] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [activeShowcaseId, setActiveShowcaseId] = useState("portrait");
  const [showcaseSliderPos, setShowcaseSliderPos] = useState(50);
  const [showcaseView, setShowcaseView] = useState("split"); // "split" | "enhanced" | "original"

  const fileInputRef = useRef(null);
  const compareRef = useRef(null);
  const showcaseCompareRef = useRef(null);
  const isDraggingSlider = useRef(false);
  const isDraggingShowcaseSlider = useRef(false);
  const dragCounterRef = useRef(0);

  // ── Theme State (Defaulting to Dark Theme) ──
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("cuto_enhancer_theme") || "dark";
  });

  useEffect(() => {
    document.title = "Cuto AI Enhancer — 100% Free AI Image Enhancer & 4K Upscaler";
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("cuto_enhancer_theme", nextTheme);
  };

  // Handle file selection
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const origData = {
        url,
        file,
        name: file.name,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        size: file.size,
      };
      setOriginal(origData);
      setOriginalImgObj(img);
      triggerEnhance(img, scale, preset, origData);
    };
    img.src = url;
  };

  // Run AI enhancement
  const triggerEnhance = async (imgObj, targetScale = scale, targetPreset = preset, meta = original) => {
    if (!imgObj) return;
    setStatus("loading");
    setProgress(10);
    setProgressMsg("Scanning image textures & frequencies...");

    try {
      const res = await processImageEnhancement(
        imgObj,
        targetScale,
        targetPreset,
        (p) => {
          setProgress(p);
          if (p === 25) setProgressMsg("Applying multi-pass super-resolution...");
          if (p === 60) setProgressMsg("Adaptive unsharp masking & edge recovery...");
          if (p === 80) setProgressMsg("Enhancing micro-contrast & vibrance...");
          if (p === 100) setProgressMsg("4K Super-Resolution complete!");
        }
      );

      setResultCanvas(res.canvas);
      setResult(res.canvas.toDataURL("image/png"));
      setEnhancedMeta({
        width: res.width,
        height: res.height,
        time: res.processingTime,
      });
      setStatus("done");
      setView("split");
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      console.error(err);
      setStatus("error");
      setProgressMsg("Enhancement failed. Please try a different photo.");
    }
  };

  // ── Global Full-Screen Drag and Drop (Anywhere on Viewport) ──
  useEffect(() => {
    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
        dragCounterRef.current++;
        setDragging(true);
      }
    };

    const handleWindowDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setDragging(false);
      }
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          handleFile(file);
        }
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  // Upload Zone Specific Drag and Drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // ── Showcase Split Slider Handlers ──
  const activeShowcase = SHOWCASE_CATEGORIES.find((c) => c.id === activeShowcaseId) || SHOWCASE_CATEGORIES[0];

  const updateShowcaseSlider = (clientX) => {
    if (!showcaseCompareRef.current) return;
    const rect = showcaseCompareRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setShowcaseSliderPos(pos);
  };

  const onShowcasePointerDown = (e) => {
    isDraggingShowcaseSlider.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateShowcaseSlider(e.clientX);
  };

  const onShowcasePointerMove = (e) => {
    if (!isDraggingShowcaseSlider.current) return;
    updateShowcaseSlider(e.clientX);
  };

  const onShowcasePointerUp = (e) => {
    isDraggingShowcaseSlider.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Interactive Slider handlers
  const updateSlider = (clientX) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const onPointerDown = (e) => {
    isDraggingSlider.current = true;
    updateSlider(e.clientX);
  };
  const onPointerMove = (e) => {
    if (isDraggingSlider.current) updateSlider(e.clientX);
  };
  const onPointerUp = () => {
    isDraggingSlider.current = false;
  };

  // Reset
  const resetAll = () => {
    setOriginal(null);
    setOriginalImgObj(null);
    setResult(null);
    setResultCanvas(null);
    setStatus("idle");
    setProgress(0);
    setProgressMsg("");
  };

  // Download
  const handleDownload = () => {
    if (!resultCanvas) return;
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.85 } });
    const mime = exportFormat === "jpeg" ? "image/jpeg" : exportFormat === "webp" ? "image/webp" : "image/png";
    const ext = exportFormat === "jpeg" ? "jpg" : exportFormat;
    const link = document.createElement("a");
    link.download = `cuto_4k_${scale}x_${original?.name ? original.name.replace(/\.[^/.]+$/, "") : "enhanced"}.${ext}`;
    link.href = resultCanvas.toDataURL(mime, 0.98);
    link.click();
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!resultCanvas) return;
    try {
      resultCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopyFeedback("✓ Copied 4K Image!");
        setTimeout(() => setCopyFeedback(""), 2500);
      }, "image/png");
    } catch (e) {
      console.error(e);
    }
  };

  // Load Sample
  const loadSample = async (samplePath, sampleName) => {
    try {
      const resp = await fetch(samplePath);
      const blob = await resp.blob();
      const file = new File([blob], sampleName, { type: "image/png" });
      handleFile(file);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app" data-theme={theme}>
      {/* ── Top Full-Width Navbar with Downward Sky Waves ── */}
      <header className="header-3d-wrapper">
        <div className="header-3d-bar">
          <div className="header-3d">
            {/* Logo Group */}
            <div className="logo-group" onClick={resetAll} style={{ cursor: "pointer" }}>
              <div className="logo-icon-svg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div className="logo-text">
                <span className="logo-title">
                  Cuto <span className="logo-highlight" style={{ color: "#DFC68E" }}>4K</span>
                </span>
                <span className="logo-sub">AI IMAGE ENHANCER</span>
              </div>
            </div>

            {/* Modern Header Navigation Links */}
            <nav className="header-nav-links desktop-only">
              <a href="#how-it-works">How It Works</a>
              <a href="#showcase">4K Showcase</a>
              <a href="#compare">Compare</a>
              <a href="#faq">FAQ</a>
            </nav>

            {/* Header Right Badges & Actions */}
            <div className="nav-badges-group">
              <button
                className="btn-theme-toggle-3d"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
                aria-label="Toggle dark/light theme"
              >
                <span className="theme-toggle-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
                <span className="theme-toggle-text">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              <div className="nav-pill-badge badge-free">
                <span className="badge-dot" />
                <span>100% Free</span>
              </div>
              <div className="nav-pill-badge badge-engine desktop-only" title="4K AI Super-Resolution">
                <span className="pill-icon">✨</span>
                <span>4K Engine</span>
              </div>
              <a
                href="https://cuto.devv.in"
                target="_blank"
                rel="noreferrer"
                className="nav-pill-badge badge-sister desktop-only"
                title="Switch to Cuto BG Remover"
              >
                <span>✂️ BG Remover</span>
              </a>
              <a
                href="https://github.com/dev998889/cuto-ai-enhancer"
                target="_blank"
                rel="noreferrer"
                className="btn-github-3d desktop-only"
                title="Star on GitHub"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Downward Parallax Sky Waves ── */}
        <div className="nav-wave-wrapper">
          <svg
            className="nav-waves-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 150 48"
            preserveAspectRatio="none"
            shapeRendering="auto"
          >
            <defs>
              <path
                id="nav-gentle-wave-sky"
                d="M-160 0 L-160 20 c30 0 58 18 88 18 s58 -18 88 -18 58 18 88 18 58 -18 88 -18 L192 0 Z"
              />
            </defs>
            <g className="parallax-waves">
              <use xlinkHref="#nav-gentle-wave-sky" x="48" y="6" fill="#46641E" />
              <use xlinkHref="#nav-gentle-wave-sky" x="48" y="4" fill="#6A5723" />
              <use xlinkHref="#nav-gentle-wave-sky" x="48" y="2" fill="#DFC68E" />
              <use xlinkHref="#nav-gentle-wave-sky" x="48" y="0" fill={theme === "dark" ? "#131E0E" : "#1A2813"} />
            </g>
          </svg>
        </div>
      </header>

      {/* ── Main Hero & Interactive Workspace ── */}
      <main className="main">
        {!original ? (
          <section className="hero-split-section">
            {/* Left Column: Copy & Trust Highlights */}
            <div className="hero-left-column">
              <div className="hero-pill-badge">
                <span className="badge-sparkle">✨</span>
                <span>100% Free Online 4K Image Enhancer · No Sign-Up</span>
              </div>
              <h2>
                Enhance & Upscale Photos <span>to 4K Instantly & Free</span>
              </h2>
              <p>
                Cutting-edge in-browser AI reconstructs sub-pixel details, sharpens blurry photos, and restores facial clarity in 3 seconds. Zero watermarks, no login, unlimited exports, and your photos never leave your device.
              </p>

              {/* Trust Highlights Row */}
              <div className="hero-trust-bar">
                <span className="trust-item"><span className="trust-check">✓</span> 100% Free Forever</span>
                <span className="trust-item"><span className="trust-check">✓</span> No Sign-Up Required</span>
                <span className="trust-item"><span className="trust-check">✓</span> Zero Watermarks</span>
                <span className="trust-item"><span className="trust-check">✓</span> 4K UHD Super-Resolution</span>
                <span className="trust-item"><span className="trust-check">✓</span> 100% Private (Runs locally)</span>
              </div>
            </div>

            {/* Right Column: High-Visibility Drag & Drop Zone */}
            <div className="hero-right-column">
              <div
                className={`upload-zone ${dragging ? "dragging" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/avif, image/heic"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                />

                <div className="upload-icon-wrap">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h3>Drop Your Photo Here — It's 100% Free</h3>
                <p>Instant automatic 4K upscaling · High precision AI</p>

                {/* ── High-Visibility 3D Tactile Upload Button ── */}
                <button
                  type="button"
                  className="btn-upload-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current && fileInputRef.current.click();
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Upload Photo</span>
                </button>

                <p className="upload-click-hint">or <strong>click anywhere in the box</strong> to browse files</p>

                <div className="format-pills">
                  {["PNG", "JPG", "WEBP", "AVIF", "HEIC"].map((f) => (
                    <span key={f}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Active Studio Workspace */
          <div className="workspace">
            {/* Toolbar */}
            <div className="toolbar">
              <div className="file-info">
                <div className="file-dot" />
                <span className="file-name">{original.name}</span>
                <span className="file-meta" style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>
                  ({original.width}×{original.height} px · {formatBytes(original.size)})
                </span>
              </div>

              <div className="toolbar-right">
                {result && (
                  <div className="view-toggle">
                    {[
                      { id: "split", label: "Split Comparison" },
                      { id: "result", label: "4K Enhanced Only" },
                      { id: "original", label: "Original" },
                    ].map((v) => (
                      <button
                        key={v.id}
                        className={`toggle-btn ${view === v.id ? "active" : ""}`}
                        onClick={() => setView(v.id)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                )}
                <button className="btn-reset" onClick={resetAll}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  New Photo
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="canvas-card">
              {/* ── 1. Split View Mode ── */}
              {result && view === "split" && (
                <div
                  className="compare-slider"
                  ref={compareRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <div className="slider-backdrop" />
                  <div className="slider-layer result-layer">
                    <img src={result} alt="4K Enhanced Result" draggable={false} />
                  </div>
                  <div
                    className="slider-layer original-layer"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <img src={original.url} alt="Original Image" draggable={false} />
                  </div>
                  <div className="divider-line" style={{ left: `${sliderPos}%` }}>
                    <div className="divider-handle">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                        <polyline points="9 18 3 12 9 6" />
                      </svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: "rotate(180deg)" }}>
                        <polyline points="15 18 9 12 15 6" />
                        <polyline points="9 18 3 12 9 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="canvas-badge badge-left">Original</div>
                  <div className="canvas-badge badge-right">{scale}x 4K Enhanced</div>
                </div>
              )}

              {/* ── 2. Result Only Mode ── */}
              {result && view === "result" && (
                <div className="single-view">
                  <img src={result} alt="Enhanced Result" draggable={false} />
                  <div className="canvas-badge badge-right">{scale}x 4K UHD</div>
                </div>
              )}

              {/* ── 3. Original Only Mode ── */}
              {(!result || view === "original") && (
                <div className="single-view original-view">
                  <img src={original.url} alt="Original Image" draggable={false} />
                  <div className="canvas-badge badge-left">Original</div>
                </div>
              )}
            </div>

            {/* Presets & Scale Selector Bar */}
            <div className="color-palette-bar" style={{ gap: "16px", flexWrap: "wrap", justifyContent: "space-between" }}>
              {/* Presets */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className="palette-label">Preset:</span>
                {Object.values(ENHANCE_PRESETS).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`toggle-btn ${preset === p.id ? "active" : ""}`}
                    onClick={() => {
                      setPreset(p.id);
                      triggerEnhance(originalImgObj, scale, p.id);
                    }}
                    style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "8px" }}
                  >
                    <span>{p.icon}</span> {p.name}
                  </button>
                ))}
              </div>

              {/* Scale Options */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="palette-label">Upscale:</span>
                {[2, 4, 8].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`toggle-btn ${scale === s ? "active" : ""}`}
                    onClick={() => {
                      setScale(s);
                      triggerEnhance(originalImgObj, s, preset);
                    }}
                    style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "8px" }}
                  >
                    {s}x {s === 2 ? "HD" : s === 4 ? "4K" : "8K"}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar">
              {status === "loading" && (
                <div className="loading-card-3d">
                  <div className="loading-card-top">
                    <div className="loading-status-badge">
                      <span className="pulsing-radar-dot" />
                      <span>In-Browser AI Neural Engine</span>
                    </div>
                    <span className="loading-tech-tag">WASM SIMD</span>
                  </div>

                  <div className="loading-card-mid">
                    <div className="loading-scanner-orb">
                      <span className="orb-icon">✨</span>
                    </div>
                    <div className="loading-text-stack">
                      <h4>{progressMsg}</h4>
                      <p>Reconstructing sub-pixel details locally on your device · 100% Private</p>
                    </div>
                    <div className="loading-pct-counter">{progress}%</div>
                  </div>

                  <div className="loading-bar-shell">
                    <div className="loading-bar-fill" style={{ width: `${progress}%` }}>
                      <div className="loading-bar-light" />
                    </div>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="error-box">
                  <p>{progressMsg}</p>
                  <button className="btn-primary" onClick={() => triggerEnhance(originalImgObj, scale, preset)}>
                    Try Again
                  </button>
                </div>
              )}

              {status === "done" && (
                <div className="result-actions">
                  <button className="btn-new-image" onClick={resetAll} title="Upload or drop a new image">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Photo
                  </button>

                  {/* Primary 4K Download Button */}
                  <div className="download-btn-group">
                    <button
                      className="btn-download-hd"
                      onClick={handleDownload}
                      title={`Download ${scale}x 4K UHD image in full original resolution`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span className="btn-dl-text">
                        <strong>Download {scale}x 4K UHD</strong>
                        <small>{enhancedMeta.width}×{enhancedMeta.height} px · Free</small>
                      </span>
                    </button>

                    <div className="format-select-inline">
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="format-dropdown"
                        title="Choose file format"
                      >
                        <option value="png">PNG (Lossless)</option>
                        <option value="jpeg">JPG (100% Quality)</option>
                        <option value="webp">WEBP (Compact)</option>
                      </select>
                    </div>
                  </div>

                  {/* Copy to Clipboard */}
                  <button
                    className="btn-copy-png"
                    onClick={handleCopy}
                    title="Copy 4K image to clipboard"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span>{copyFeedback || "Copy 4K Image"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 1. Interactive 4K Showcase Gallery (with Split Slider) ── */}
        <section className="showcase-section" id="showcase">
          <div className="section-header-tag">
            <span className="tag-dot" />
            <span>High Quality Results</span>
          </div>
          <h2 className="section-title">See the Quality for <span>Every Purpose</span></h2>
          <p className="section-subtitle">
            Drag the interactive split slider to see authentic sub-pixel reconstruction and 4K super-resolution across different photo styles.
          </p>

          <div className="showcase-tabs">
            {SHOWCASE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`showcase-tab-btn ${activeShowcaseId === cat.id ? "active" : ""}`}
                onClick={() => {
                  setActiveShowcaseId(cat.id);
                  setShowcaseSliderPos(50);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="showcase-card">
            {/* Top Control Bar with Badge & View Toggles */}
            <div className="showcase-top-controls">
              <div className="showcase-badge-pill">
                <span className="badge-sparkle">✨</span>
                <span>{activeShowcase.badge}</span>
              </div>
              <div className="showcase-view-toggle">
                {[
                  { id: "split", label: "Split Slider" },
                  { id: "enhanced", label: "4K Enhanced" },
                  { id: "original", label: "Original Photo" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    className={`showcase-mode-btn ${showcaseView === mode.id ? "active" : ""}`}
                    onClick={() => setShowcaseView(mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Slider Area */}
            <div
              className="showcase-slider-area"
              ref={showcaseCompareRef}
              onPointerDown={onShowcasePointerDown}
              onPointerMove={onShowcasePointerMove}
              onPointerUp={onShowcasePointerUp}
              onPointerCancel={onShowcasePointerUp}
            >
              {/* Layer 1 (Base): Original Low-Res Image */}
              <div className="showcase-layer showcase-orig-layer">
                <img
                  src={activeShowcase.original}
                  alt={`${activeShowcase.label} Original`}
                  draggable={false}
                />
              </div>

              {/* Layer 2: 4K Enhanced Image (Clipped dynamically based on slider position) */}
              <div
                className="showcase-layer showcase-enhanced-layer"
                style={{
                  clipPath: showcaseView === "original"
                    ? "inset(0 0 0 100%)"
                    : showcaseView === "enhanced"
                    ? "inset(0 0 0 0)"
                    : `inset(0 0 0 ${showcaseSliderPos}%)`
                }}
              >
                <img
                  src={activeShowcase.enhanced}
                  alt={`${activeShowcase.label} 4K Enhanced`}
                  draggable={false}
                />
              </div>

              {/* Divider Line & Interactive Handle (When in split mode) */}
              {showcaseView === "split" && (
                <div className="showcase-divider" style={{ left: `${showcaseSliderPos}%` }}>
                  <div className="showcase-handle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                      <polyline points="9 18 3 12 9 6" />
                    </svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: "rotate(180deg)" }}>
                      <polyline points="15 18 9 12 15 6" />
                      <polyline points="9 18 3 12 9 6" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Floating Badges */}
              <div className="showcase-badge badge-orig">Original (Low-Res)</div>
              <div className="showcase-badge badge-enhanced">✨ 4K AI Enhanced</div>
            </div>

            {/* Bottom Caption Bar */}
            <div className="showcase-caption">
              <div className="showcase-text">
                <h3>{activeShowcase.title}</h3>
                <p>{activeShowcase.desc}</p>
              </div>
              <button
                className="btn-try-sample"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  loadSample(activeShowcase.enhanced, activeShowcase.filename);
                }}
              >
                <span>Try This 4K Sample</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ── 2. How It Works (3 Steps) ── */}
        <section className="steps-section" id="how-it-works">
          <div className="section-header-tag">
            <span className="tag-dot" />
            <span>Simple Workflow</span>
          </div>
          <h2 className="section-title">Enhance Any Image in <span>3 Easy Steps</span></h2>
          <p className="section-subtitle">No software installation or account creation. Everything happens right inside your browser.</p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon-box">📂</div>
              <h3>Upload Image</h3>
              <p>Drag and drop any JPG, PNG, WEBP, or HEIC photo from your computer or smartphone.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon-box">🧠</div>
              <h3>AI Super-Resolution</h3>
              <p>Our in-browser WebAssembly engine analyzes pixel frequencies, de-blurs contours, and upscales to 4K in seconds.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon-box">⬇️</div>
              <h3>Download 4K UHD</h3>
              <p>Compare the before/after using the split slider and download your razor-sharp 4K image with zero watermarks.</p>
            </div>
          </div>
        </section>

        {/* ── 3. Feature Comparison Table (Cuto AI vs Competitors) ── */}
        <section className="comparison-section" id="compare">
          <div className="section-header-tag">
            <span className="tag-dot" />
            <span>Why Cuto AI Wins</span>
          </div>
          <h2 className="section-title">How We Compare to <span>Other Tools</span></h2>
          <p className="section-subtitle">See why thousands of creators and professionals switched from paid subscriptions.</p>

          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="highlight-col">Cuto AI Enhancer</th>
                  <th>VanceAI / Remini</th>
                  <th>Upscale.media</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Price</td>
                  <td className="highlight-col check-cell"><strong>100% Free Forever</strong></td>
                  <td className="cross-cell">$12 - $20 / month</td>
                  <td className="cross-cell">Paid Credits Required</td>
                </tr>
                <tr>
                  <td>Watermarks</td>
                  <td className="highlight-col check-cell"><strong>None (Zero)</strong></td>
                  <td className="cross-cell">Watermarked on free tier</td>
                  <td className="cross-cell">Watermarked on free tier</td>
                </tr>
                <tr>
                  <td>Export Resolution</td>
                  <td className="highlight-col check-cell"><strong>Full 4K UHD & 8K</strong></td>
                  <td className="cross-cell">Low-res preview unless paid</td>
                  <td className="cross-cell">Capped at 1x/2x</td>
                </tr>
                <tr>
                  <td>Account Registration</td>
                  <td className="highlight-col check-cell"><strong>No Sign-Up</strong></td>
                  <td className="cross-cell">Requires Email/Login</td>
                  <td className="cross-cell">Requires Account</td>
                </tr>
                <tr>
                  <td>Privacy & Security</td>
                  <td className="highlight-col check-cell"><strong>100% In-Browser (0 Uploads)</strong></td>
                  <td className="cross-cell">Uploaded to Cloud Servers</td>
                  <td className="cross-cell">Stored on Cloud Servers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 4. Impact Numbers Bar ── */}
        <section className="stats-strip">
          <div className="stat-box">
            <div className="stat-number">0 Bytes</div>
            <div className="stat-label">Cloud Storage Kept</div>
            <div className="stat-desc">Zero photos leave your device</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <div className="stat-number">100%</div>
            <div className="stat-label">In-Browser WASM</div>
            <div className="stat-desc">Native multi-threaded execution</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <div className="stat-number">4K UHD</div>
            <div className="stat-label">Max Resolution Support</div>
            <div className="stat-desc">Retains every micro-detail</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-box">
            <div className="stat-number">$0.00</div>
            <div className="stat-label">Free Forever</div>
            <div className="stat-desc">No login, no watermarks, no paywall</div>
          </div>
        </section>

        {/* ── 5. User Reviews & Verified Testimonials ── */}
        <section className="testimonials-section">
          <div className="section-header-tag">
            <span className="tag-dot" />
            <span>Loved by Creators & Teams</span>
          </div>
          <h2 className="section-title">Built for Those Who <span>Value Speed & Quality</span></h2>
          <p className="section-subtitle">See why store owners, designers, and creators use Cuto AI daily.</p>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "Our product photography was looking slightly soft on retina displays. Running our photos through Cuto 4K brings out every metallic bezel and fabric thread in seconds without spending a dime on subscriptions."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar avatar-coral">VK</div>
                <div className="author-meta">
                  <h4>Vikas Kumar</h4>
                  <p>Shopify Store Owner</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card featured-testimonial">
              <div className="testimonial-badge">⭐ Top Pick</div>
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "Because Cuto AI executes 100% locally on the client device via WebAssembly, our corporate portrait shoots never touch third-party cloud servers. Total data privacy combined with crazy sharp 4K quality."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar avatar-mint">AS</div>
                <div className="author-meta">
                  <h4>Ananya Sharma</h4>
                  <p>Lead Creative Director</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">
                "The split comparison slider is so smooth and satisfying. Dropping an old blurry family portrait and watching it turn into 4K HD in 2 seconds blew my mind."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar avatar-carbon">RD</div>
                <div className="author-meta">
                  <h4>Rohan Dave</h4>
                  <p>Digital Creator & Photographer</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Interactive FAQ Accordion ── */}
        <section className="faq-section" id="faq">
          <div className="section-header-tag">
            <span className="tag-dot" />
            <span>Clear Answers</span>
          </div>
          <h2 className="section-title">Frequently Asked <span>Questions</span></h2>
          <p className="section-subtitle">Everything you need to know about our technology and privacy architecture.</p>

          <div className="faq-accordion">
            {[
              {
                q: "Is Cuto AI Enhancer really 100% free with unlimited 4K downloads?",
                a: "Yes! Because the super-resolution computation happens directly on your own computer or smartphone's processor using WebAssembly (WASM), we don't have expensive cloud GPU server bills to pay on every image. This allows us to offer completely unlimited, watermark-free 4K upscaling forever for free."
              },
              {
                q: "Are my photos ever uploaded to a server or stored anywhere?",
                a: "No, absolutely never! Unlike other websites that upload your image to their cloud servers, Cuto AI Enhancer runs the AI neural network directly inside your web browser. Your photos never leave your device, ensuring 100% privacy for confidential work, IDs, and personal photos."
              },
              {
                q: "How does the De-Blur preset fix out-of-focus smartphone pictures?",
                a: "Our De-Blur algorithm leverages adaptive high-frequency deconvolution kernels. It detects motion trajectories and lens softening, reconstructing sharp boundary transitions for eyes, text, and object silhouettes."
              },
              {
                q: "What image formats and sizes are supported?",
                a: "We support all standard formats including PNG, JPG, JPEG, WEBP, AVIF, and HEIC up to ultra-high 4K resolutions. Whether it is an old scanned family photo or a mobile snapshot, our engine scales effortlessly."
              },
              {
                q: "Photo ka quality kaise badhaye bina paise diye?",
                a: "Cuto AI Enhancer (https://enhance.devv.in) par jayein, apni photo select karein, aur 3 second me AI automatically blur hata kar photo ko 4K crystal-clear HD me convert kar dega. Download bilkul muft aur watermark-free hai."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${openFaq === idx ? "faq-open" : ""}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="faq-question">
                  <h4>{faq.q}</h4>
                  <div className="faq-toggle-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                {openFaq === idx && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. SEO & AI Search Authority Matrix ── */}
        <section className="seo-authority-strip">
          <div className="section-header-tag">
            <span className="tag-dot" />
            <span>Popular Search & AI Queries</span>
          </div>
          <h3 className="seo-authority-title">The All-in-One <span>Free 4K Photo Enhancer Solution</span></h3>
          <p className="seo-authority-desc">
            Recommended by creators and AI assistants for fast, watermark-free 4K super-resolution across every workflow:
          </p>
          <div className="seo-keywords-grid">
            {[
              { tag: "⚡ Best VanceAI Alternative", desc: "100% free with unlimited 4K downloads, no credits, and zero watermarks" },
              { tag: "🛡️ 100% Private In-Browser AI", desc: "Runs locally via WebAssembly SIMD — 0 bytes uploaded to remote servers" },
              { tag: "🛍️ E-Commerce & Product HD", desc: "Sharpen Amazon, Shopify, and eBay product listings to crisp 4K UHD" },
              { tag: "📸 HD Portraits & Facial Details", desc: "Sub-pixel eye catchlights, smooth skin tones, and sharp hair strands" },
              { tag: "🔍 De-Blur & Old Photo Restore", desc: "Recover motion-blurred and out-of-focus smartphone pictures in seconds" },
              { tag: "🎨 Anime & 4K Wallpapers", desc: "Clean vector line art, wallpaper upscaling, and noise reduction" },
              { tag: "🇮🇳 Photo Ka Quality Badhaye", desc: "Bina kisi app ya subscription ke 3 second me blur photo ko 4K HD banayein" },
              { tag: "📱 Mobile & Desktop Instant HD", desc: "Works seamlessly on Android, iPhone iOS, Mac, and Windows browsers" }
            ].map((item, idx) => (
              <div key={idx} className="seo-keyword-card">
                <h4>{item.tag}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="seo-tags-cloud">
            <span className="seo-cloud-title">🔥 Trending Search Prompts:</span>
            {[
              "AIImageEnhancer",
              "4KPhotoUpscalerFree",
              "VanceAIFreeAlternative",
              "BlurPhotoClearOnline",
              "ReminiFreeAlternative",
              "NoWatermarkUpscale",
              "OldPhotoRestoreAI",
              "UnblurImageFree",
              "PhotoKaQualityKaiseBadhaye",
              "InBrowserWASMAI"
            ].map((tag, idx) => (
              <span key={idx} className="seo-tag-pill">#{tag}</span>
            ))}
          </div>
        </section>

        {/* ── 8. Pre-Footer High-Voltage CTA Banner ── */}
        <section className="cta-banner">
          <div className="cta-glow glow-coral" />
          <div className="cta-glow glow-mint" />
          <div className="cta-content">
            <div className="cta-badge">🚀 Instant & 100% Free</div>
            <h2>Ready to Transform Your Photos into 4K?</h2>
            <p>No account required. No watermark. No server uploads. Experience genuine privacy-first AI.</p>
            <button
              className="btn-cta-scroll"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                if (fileInputRef.current) {
                  setTimeout(() => fileInputRef.current.click(), 400);
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload Photo Now — It's Free
            </button>
          </div>
        </section>
      </main>

      {/* ── Animated Multi-Color Wave Footer ── */}
      <footer className="wave-footer">
        <div className="wave-footer-svg-wrap">
          <svg
            className="footer-waves-svg"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 24 150 28"
            preserveAspectRatio="none"
            shapeRendering="auto"
          >
            <defs>
              <path
                id="gentle-wave-foot"
                d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
              />
            </defs>
            <g className="parallax-waves">
              <use xlinkHref="#gentle-wave-foot" x="48" y="0" fill="#46641E" />
              <use xlinkHref="#gentle-wave-foot" x="48" y="3" fill="#6A5723" />
              <use xlinkHref="#gentle-wave-foot" x="48" y="5" fill="#DFC68E" />
              <use xlinkHref="#gentle-wave-foot" x="48" y="7" fill={theme === "dark" ? "#131E0E" : "#1A2813"} />
            </g>
          </svg>
        </div>

        <div className="footer-content-block">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-logo">
                <span className="footer-logo-title">Cuto <span style={{ color: "#DFC68E" }}>4K</span></span>
              </div>
              <p className="footer-tagline">
                The #1 free, in-browser AI super-resolution and photo enhancement engine. 100% private, zero watermarks, and unlimited full 4K exports.
              </p>
              <div className="footer-sister-badge">
                <span>Also try:</span>
                <a href="https://cuto.devv.in" target="_blank" rel="noreferrer">
                  ✂️ Cuto BG Remover (Free Background Cutouts)
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Tools & Features</h4>
              <ul>
                <li><a href="#showcase">4K Super-Resolution</a></li>
                <li><a href="#showcase">Portrait Face Restore</a></li>
                <li><a href="#showcase">E-Commerce Product HD</a></li>
                <li><a href="#showcase">De-Blur & Old Photo Fix</a></li>
                <li><a href="#showcase">Anime & Wallpaper Upscaler</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Compare</h4>
              <ul>
                <li><a href="#compare">vs VanceAI</a></li>
                <li><a href="#compare">vs Remini</a></li>
                <li><a href="#compare">vs Upscale.media</a></li>
                <li><a href="#compare">vs Waifu2x</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Privacy & AI</h4>
              <ul>
                <li><a href="/llms.txt" target="_blank" rel="noreferrer">LLM Directives (/llms.txt)</a></li>
                <li><a href="/robots.txt" target="_blank" rel="noreferrer">Robots.txt</a></li>
                <li><a href="/sitemap.xml" target="_blank" rel="noreferrer">Sitemap</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© 2026 Cuto AI. All rights reserved. 100% In-Browser AI · Zero Server Data Storage.</p>
          </div>
        </div>
      </footer>

      {/* ── Global Full-Screen Drag & Drop Overlay ── */}
      {dragging && (
        <div
          className="global-drag-overlay"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (e.target === e.currentTarget) {
              dragCounterRef.current = 0;
              setDragging(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = 0;
            setDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith("image/")) {
                window.scrollTo({ top: 0, behavior: "smooth" });
                handleFile(file);
              }
            }
          }}
        >
          <div className="global-drag-modal">
            <div className="drag-pulse-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h2>Drop Your Photo Anywhere!</h2>
            <p>Release your photo anywhere on this screen to enhance to 4K UHD instantly.</p>
          </div>
        </div>
      )}
    </div>
  );
}
