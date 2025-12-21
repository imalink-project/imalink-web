import JSZip from 'jszip';
import QRCode from 'qrcode';
import type { CollectionItem } from './types';
import { apiClient } from './api-client';

interface ExportOptions {
  collectionName: string;
  collectionDescription?: string;
  collectionId: number;
  items: CollectionItem[];
}

export async function exportSlideshow({ collectionName, collectionDescription, collectionId, items }: ExportOptions): Promise<Blob> {
  const zip = new JSZip();
  
  // Create images folder
  const imagesFolder = zip.folder('images');
  if (!imagesFolder) throw new Error('Failed to create images folder');

  // Download all photos
  const photoItems = items.filter(item => item.type === 'photo');
  const downloadPromises = photoItems.map(async (item, index) => {
    if (item.type !== 'photo') return;
    
    try {
      // Fetch the coldpreview image
      const response = await fetch(apiClient.getColdPreviewUrl(item.photo_hothash, 2000), {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch image ${item.photo_hothash}`);
      
      const blob = await response.blob();
      imagesFolder.file(`photo-${index}.jpg`, blob);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  });

  await Promise.all(downloadPromises);

  // Generate HTML content
  const html = await generateHTML(collectionName, collectionDescription, collectionId, items);
  zip.file('index.html', html);

  // Generate ZIP
  return await zip.generateAsync({ type: 'blob' });
}

async function generateHTML(collectionName: string, collectionDescription: string | undefined, collectionId: number, items: CollectionItem[]): Promise<string> {
  // Generate QR code for collection URL
  const collectionUrl = `https://imalink.trollfjell.com/collections/${collectionId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(collectionUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  // Count photos and text cards
  const photoCount = items.filter(item => item.type === 'photo').length;
  const textCardCount = items.filter(item => item.type === 'text').length;

  // Build slides data
  const slidesData = items.map((item, index) => {
    if (item.type === 'photo') {
      const photoIndex = items.slice(0, index + 1).filter(i => i.type === 'photo').length - 1;
      return {
        type: 'photo',
        src: `images/photo-${photoIndex}.jpg`,
        caption: item.caption || null,
      };
    } else {
      return {
        type: 'text',
        title: item.text_card.title,
        body: item.text_card.body,
      };
    }
  });

  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(collectionName)} - Lysbildevisning</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0a0a0a;
      color: #fff;
      overflow: hidden;
      height: 100vh;
    }

    /* Info page */
    #info-page {
      display: flex;
      width: 100%;
      height: 100vh;
      padding: 60px 80px;
      gap: 80px;
    }

    #info-page.hidden {
      display: none;
    }

    .info-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 700px;
    }

    .info-right {
      flex: 0 0 380px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 35px;
    }

    .info-title {
      font-size: 3.5rem;
      font-weight: 700;
      margin-bottom: 24px;
      line-height: 1.1;
      background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .info-description {
      font-size: 1.3rem;
      line-height: 1.7;
      color: rgba(255,255,255,0.75);
      margin-bottom: 35px;
      white-space: pre-wrap;
    }

    .info-stats {
      display: flex;
      gap: 40px;
      margin-bottom: 50px;
      padding: 25px 0;
      border-top: 1px solid rgba(255,255,255,0.1);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .info-stat {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.15rem;
    }

    .info-stat-icon {
      font-size: 1.8rem;
      opacity: 0.8;
    }

    .info-controls h3 {
      font-size: 1.6rem;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .control-list {
      list-style: none;
      padding: 0;
    }

    .control-list li {
      padding: 12px 0;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-size: 1.05rem;
    }

    .control-list li:last-child {
      border-bottom: none;
    }

    .control-key {
      background: rgba(255,255,255,0.12);
      padding: 5px 14px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.95em;
      font-weight: 500;
    }

    .settings-panel {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 28px;
    }

    .settings-panel h3 {
      font-size: 1.3rem;
      margin-bottom: 22px;
      font-weight: 600;
    }

    .setting {
      margin-bottom: 22px;
    }

    .setting:last-child {
      margin-bottom: 0;
    }

    .setting label {
      display: block;
      margin-bottom: 10px;
      font-size: 1rem;
      color: rgba(255,255,255,0.85);
      font-weight: 500;
    }

    select, input[type="range"] {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.08);
      color: white;
      font-size: 1.05rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    select:hover, select:focus {
      border-color: rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.12);
    }

    input[type="range"] {
      padding: 0;
      height: 8px;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #667eea;
      cursor: pointer;
    }

    .qr-section {
      text-align: center;
    }

    .qr-code {
      padding: 16px;
      background: white;
      border-radius: 14px;
      display: inline-block;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .qr-code img {
      display: block;
      width: 180px;
      height: 180px;
    }

    .qr-label {
      margin-top: 16px;
      font-size: 0.95rem;
      color: rgba(255,255,255,0.6);
      line-height: 1.5;
    }

    .start-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      padding: 22px 60px;
      border-radius: 50px;
      cursor: pointer;
      font-size: 1.6rem;
      font-weight: 600;
      transition: all 0.3s;
      box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
      margin-top: 40px;
      width: 100%;
    }

    .start-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 18px 45px rgba(102, 126, 234, 0.6);
    }

    .start-button:active {
      transform: translateY(0);
    }

    /* Slideshow container */
    #slideshow-container {
      display: none;
      width: 100%;
      height: 100vh;
      position: relative;
    }

    #slideshow-container.active {
      display: block;
    }

    #slideshow {
      position: relative;
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.8s ease-in-out;
    }

    .slide.active {
      opacity: 1;
      z-index: 1;
    }

    /* Transition effects */
    .transition-fade .slide {
      transition: opacity 0.8s ease-in-out;
    }

    .transition-slide .slide {
      transition: transform 0.8s ease-in-out, opacity 0.8s ease-in-out;
      transform: translateX(100%);
    }
    .transition-slide .slide.active {
      transform: translateX(0);
    }
    .transition-slide .slide.prev {
      transform: translateX(-100%);
    }

    .transition-zoom .slide {
      transition: transform 0.8s ease-in-out, opacity 0.8s ease-in-out;
      transform: scale(0.8);
    }
    .transition-zoom .slide.active {
      transform: scale(1);
    }

    .transition-flip .slide {
      transition: transform 0.8s ease-in-out, opacity 0.8s ease-in-out;
      transform: perspective(1000px) rotateY(90deg);
    }
    .transition-flip .slide.active {
      transform: perspective(1000px) rotateY(0deg);
    }

    .slide img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      user-select: none;
    }

    /* Photo caption */
    .photo-caption {
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 60%;
      text-align: center;
      color: rgba(255,255,255,0.9);
      font-size: 1rem;
      line-height: 1.5;
      padding: 12px 24px;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      z-index: 10;
    }

    .text-slide {
      max-width: 800px;
      padding: 60px;
      background: white;
      color: #1a1a1a;
      border-radius: 16px;
      box-shadow: 0 25px 70px rgba(0,0,0,0.4);
      text-align: center;
    }

    .text-slide h1 {
      font-size: 2.5rem;
      margin-bottom: 30px;
      font-weight: 700;
    }

    .text-slide p {
      font-size: 1.25rem;
      line-height: 1.8;
      white-space: pre-wrap;
    }

    /* Controls */
    #controls {
      position: fixed;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      padding: 18px 30px;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(15px);
      border-radius: 50px;
      z-index: 100;
      transition: opacity 0.3s, transform 0.3s;
    }

    #controls.hidden {
      opacity: 0;
      transform: translateX(-50%) translateY(100px);
      pointer-events: none;
    }

    button {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 11px 22px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    button:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }

    button:active {
      transform: translateY(0);
    }

    .counter {
      color: rgba(255,255,255,0.85);
      padding: 11px 22px;
      font-size: 15px;
      display: flex;
      align-items: center;
      font-weight: 500;
    }

    /* Progress bar */
    #progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s;
      z-index: 101;
    }

    /* Navigation hints */
    .nav-hint {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      padding: 20px;
      font-size: 3.5rem;
      color: rgba(255,255,255,0.15);
      cursor: pointer;
      transition: all 0.2s;
      z-index: 50;
      user-select: none;
    }

    .nav-hint:hover {
      color: rgba(255,255,255,0.5);
      transform: translateY(-50%) scale(1.2);
    }

    .nav-hint.left {
      left: 25px;
    }

    .nav-hint.right {
      right: 25px;
    }

    .nav-hint.hidden {
      display: none;
    }

    /* Fullscreen */
    :fullscreen #controls {
      opacity: 0;
      pointer-events: none;
    }

    :fullscreen .nav-hint {
      display: none;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      #info-page {
        flex-direction: column;
        padding: 40px;
        gap: 40px;
        overflow-y: auto;
      }

      .info-left, .info-right {
        max-width: 100%;
        flex: none;
      }

      .info-title {
        font-size: 2.5rem;
      }
    }
  </style>
</head>
<body>
  <!-- Info Page -->
  <div id="info-page">
    <div class="info-left">
      <h1 class="info-title">${escapeHtml(collectionName)}</h1>
      ${collectionDescription ? `<p class="info-description">${escapeHtml(collectionDescription)}</p>` : ''}
      
      <div class="info-stats">
        <div class="info-stat">
          <span class="info-stat-icon">🖼️</span>
          <span>${photoCount} ${photoCount === 1 ? 'bilde' : 'bilder'}</span>
        </div>
        <div class="info-stat">
          <span class="info-stat-icon">📝</span>
          <span>${textCardCount} ${textCardCount === 1 ? 'tekstkort' : 'tekstkort'}</span>
        </div>
      </div>

      <div class="info-controls">
        <h3>📺 Bruk fjernkontrollen</h3>
        <ul class="control-list">
          <li><span>Neste / Forrige</span> <span class="control-key">← →</span></li>
          <li><span>Start / Pause</span> <span class="control-key">Enter</span></li>
          <li><span>Fullskjerm</span> <span class="control-key">F</span></li>
          <li><span>Tilbake hit</span> <span class="control-key">H</span></li>
          <li><span>Hopp til slide</span> <span class="control-key">1-9</span></li>
        </ul>
      </div>

      <button class="start-button" onclick="startSlideshow()">▶ Start lysbildevisning</button>
    </div>

    <div class="info-right">
      <div class="settings-panel">
        <h3>⚙️ Innstillinger</h3>
        <div class="setting">
          <label>Overgang:</label>
          <select id="transition">
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="zoom">Zoom</option>
            <option value="flip">Flip</option>
            <option value="random">🎲 Tilfeldig</option>
          </select>
        </div>
        <div class="setting">
          <label>Hastighet: <span id="speedValue">5s</span></label>
          <input type="range" id="speed" min="2" max="10" value="5" step="0.5" oninput="updateSpeedLabel()">
        </div>
        <div class="setting">
          <label>Auto-play:</label>
          <select id="autoplay">
            <option value="manual">Manuell</option>
            <option value="auto">Automatisk</option>
          </select>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-code">
          <img src="${qrCodeDataUrl}" alt="QR Code">
        </div>
        <p class="qr-label">Skann for å åpne<br>samlingen på ImaLink</p>
      </div>
    </div>
  </div>

  <!-- Slideshow Container -->
  <div id="slideshow-container">
    <div id="progress"></div>
    
    <div id="slideshow" class="transition-fade">
      <!-- Slides will be inserted here -->
    </div>

    <div class="nav-hint left" onclick="previousSlide()">‹</div>
    <div class="nav-hint right" onclick="nextSlide()">›</div>

    <div id="controls">
      <button onclick="goHome()">🏠 Hjem</button>
      <button onclick="previousSlide()">‹ Forrige</button>
      <div class="counter">
        <span id="current">1</span> / <span id="total">${items.length}</span>
      </div>
      <button onclick="nextSlide()">Neste ›</button>
      <button onclick="togglePlay()" id="playBtn">▶ Start</button>
      <button onclick="toggleFullscreen()">⛶ Fullskjerm</button>
    </div>
  </div>

  <script>
    const slides = ${JSON.stringify(slidesData)};
    let currentIndex = 0;
    let isPlaying = false;
    let playInterval = null;
    let speed = 5000;
    let transition = 'fade';
    let inSlideshow = false;

    // Initialize slides
    function initSlides() {
      const container = document.getElementById('slideshow');
      container.innerHTML = ''; // Clear any existing slides
      
      slides.forEach((slide, index) => {
        const div = document.createElement('div');
        div.className = 'slide' + (index === 0 ? ' active' : '');
        
        if (slide.type === 'photo') {
          const img = document.createElement('img');
          img.src = slide.src;
          img.alt = 'Slide ' + (index + 1);
          div.appendChild(img);
          
          // Add caption if present
          if (slide.caption) {
            const captionDiv = document.createElement('div');
            captionDiv.className = 'photo-caption';
            captionDiv.textContent = slide.caption;
            div.appendChild(captionDiv);
          }
        } else {
          const textDiv = document.createElement('div');
          textDiv.className = 'text-slide';
          textDiv.innerHTML = '<h1>' + escapeHtml(slide.title) + '</h1><p>' + escapeHtml(slide.body) + '</p>';
          div.appendChild(textDiv);
        }
        
        container.appendChild(div);
      });
    }

    function startSlideshow() {
      // Get settings
      transition = document.getElementById('transition').value;
      speed = parseFloat(document.getElementById('speed').value) * 1000;
      const autoplay = document.getElementById('autoplay').value;
      
      // Initialize
      initSlides();
      currentIndex = 0;
      isPlaying = autoplay === 'auto';
      inSlideshow = true;
      
      // Update UI
      document.getElementById('info-page').classList.add('hidden');
      document.getElementById('slideshow-container').classList.add('active');
      document.getElementById('playBtn').textContent = isPlaying ? '⏸ Pause' : '▶ Start';
      
      applyTransition();
      updateCounter();
      updateProgress();
      
      if (isPlaying) {
        startAutoPlay();
      }
    }

    function goHome() {
      // Stop slideshow
      stopAutoPlay();
      inSlideshow = false;
      isPlaying = false;
      
      // Reset to start
      currentIndex = 0;
      
      // Show info page
      document.getElementById('slideshow-container').classList.remove('active');
      document.getElementById('info-page').classList.remove('hidden');
    }

    function showSlide(index) {
      const allSlides = document.querySelectorAll('.slide');
      allSlides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i === index) {
          slide.classList.add('active');
        } else if (i === index - 1) {
          slide.classList.add('prev');
        }
      });
      currentIndex = index;
      updateCounter();
      updateProgress();
    }

    function nextSlide() {
      if (!inSlideshow) return;
      const next = (currentIndex + 1) % slides.length;
      maybeChangeTransition();
      showSlide(next);
    }

    function previousSlide() {
      if (!inSlideshow) return;
      const prev = (currentIndex - 1 + slides.length) % slides.length;
      maybeChangeTransition();
      showSlide(prev);
    }

    function togglePlay() {
      if (!inSlideshow) return;
      isPlaying = !isPlaying;
      const btn = document.getElementById('playBtn');
      btn.textContent = isPlaying ? '⏸ Pause' : '▶ Start';
      
      if (isPlaying) {
        startAutoPlay();
      } else {
        stopAutoPlay();
      }
    }

    function startAutoPlay() {
      stopAutoPlay();
      if (isPlaying && inSlideshow) {
        playInterval = setInterval(nextSlide, speed);
      }
    }

    function stopAutoPlay() {
      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }
    }

    function updateCounter() {
      document.getElementById('current').textContent = currentIndex + 1;
      document.getElementById('total').textContent = slides.length;
    }

    function updateProgress() {
      const progress = ((currentIndex + 1) / slides.length) * 100;
      document.getElementById('progress').style.width = progress + '%';
    }

    function updateSpeedLabel() {
      const value = document.getElementById('speed').value;
      document.getElementById('speedValue').textContent = value + 's';
    }

    function applyTransition() {
      const container = document.getElementById('slideshow');
      const trans = transition === 'random' ? getRandomTransition() : transition;
      container.className = 'transition-' + trans;
    }

    function getRandomTransition() {
      const transitions = ['fade', 'slide', 'zoom', 'flip'];
      return transitions[Math.floor(Math.random() * transitions.length)];
    }

    function maybeChangeTransition() {
      if (transition === 'random') {
        applyTransition();
      }
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Keyboard navigation (including TV remote controls)
    document.addEventListener('keydown', (e) => {
      // Home key - always works
      if (e.key === 'h' || e.key === 'H' || e.key === 'Home') {
        e.preventDefault();
        if (inSlideshow) {
          goHome();
        }
        return;
      }

      // Only handle other keys if in slideshow
      if (!inSlideshow) {
        // Allow Enter to start from info page
        if (e.key === 'Enter') {
          e.preventDefault();
          startSlideshow();
        }
        return;
      }

      switch(e.key) {
        // Navigation: Arrow keys (most remotes)
        case 'ArrowLeft':
        case 'MediaRewind':
        case 'BrowserBack':
          e.preventDefault();
          previousSlide();
          break;
        case 'ArrowRight':
        case 'MediaFastForward':
        case 'BrowserForward':
          e.preventDefault();
          nextSlide();
          break;
        
        // Play/Pause
        case ' ':
        case 'Enter':
        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause':
          e.preventDefault();
          togglePlay();
          break;
        
        // Fullscreen
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        
        // Exit fullscreen
        case 'Escape':
        case 'MediaStop':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
        
        // Channel up/down
        case 'ChannelUp':
        case 'PageUp':
          e.preventDefault();
          nextSlide();
          break;
        case 'ChannelDown':
        case 'PageDown':
          e.preventDefault();
          previousSlide();
          break;
        
        // Number keys: Jump to slide
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const slideNumber = parseInt(e.key);
          if (slideNumber > 0 && slideNumber <= slides.length) {
            showSlide(slideNumber - 1);
          }
          break;
      }
    });

    // Mouse click navigation (only in slideshow)
    document.getElementById('slideshow').addEventListener('click', (e) => {
      if (!inSlideshow) return;
      const width = window.innerWidth;
      if (e.clientX < width / 2) {
        previousSlide();
      } else {
        nextSlide();
      }
    });

    // Touch swipe navigation
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
      if (!inSlideshow) return;
      touchStartX = e.touches[0].clientX;
    });

    document.addEventListener('touchend', (e) => {
      if (!inSlideshow) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          nextSlide();
        } else {
          previousSlide();
        }
      }
    });

    // Hide controls on fullscreen
    document.addEventListener('fullscreenchange', () => {
      const controls = document.getElementById('controls');
      const navHints = document.querySelectorAll('.nav-hint');
      
      if (document.fullscreenElement) {
        controls.classList.add('hidden');
        navHints.forEach(hint => hint.classList.add('hidden'));
      } else {
        controls.classList.remove('hidden');
        navHints.forEach(hint => hint.classList.remove('hidden'));
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
