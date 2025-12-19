import JSZip from 'jszip';
import type { CollectionItem } from './types';
import { apiClient } from './api-client';

interface ExportOptions {
  collectionName: string;
  items: CollectionItem[];
}

export async function exportSlideshow({ collectionName, items }: ExportOptions): Promise<Blob> {
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
  const html = generateHTML(collectionName, items);
  zip.file('index.html', html);

  // Generate ZIP
  return await zip.generateAsync({ type: 'blob' });
}

function generateHTML(collectionName: string, items: CollectionItem[]): string {
  // Build slides data
  const slidesData = items.map((item, index) => {
    if (item.type === 'photo') {
      const photoIndex = items.slice(0, index + 1).filter(i => i.type === 'photo').length - 1;
      return {
        type: 'photo',
        src: `images/photo-${photoIndex}.jpg`,
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
      background: #000;
      color: #fff;
      overflow: hidden;
      height: 100vh;
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

    /* Fade transition */
    .transition-fade .slide {
      transition: opacity 0.8s ease-in-out;
    }

    /* Slide transition */
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

    /* Zoom transition */
    .transition-zoom .slide {
      transition: transform 0.8s ease-in-out, opacity 0.8s ease-in-out;
      transform: scale(0.8);
    }
    .transition-zoom .slide.active {
      transform: scale(1);
    }

    /* Flip transition */
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

    .text-slide {
      max-width: 800px;
      padding: 60px;
      background: white;
      color: #1a1a1a;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
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
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      padding: 15px 25px;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(10px);
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
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    button:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }

    button:active {
      transform: translateY(0);
    }

    .counter {
      color: rgba(255,255,255,0.8);
      padding: 10px 20px;
      font-size: 14px;
      display: flex;
      align-items: center;
    }

    /* Settings panel */
    #settings {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 12px;
      z-index: 100;
      min-width: 250px;
      transition: opacity 0.3s, transform 0.3s;
    }

    #settings.hidden {
      opacity: 0;
      transform: translateY(-100px);
      pointer-events: none;
    }

    #settings h3 {
      margin-bottom: 15px;
      font-size: 16px;
    }

    .setting {
      margin-bottom: 15px;
    }

    .setting label {
      display: block;
      margin-bottom: 5px;
      font-size: 13px;
      color: rgba(255,255,255,0.8);
    }

    select, input[type="range"] {
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.1);
      color: white;
      font-size: 14px;
    }

    input[type="range"] {
      padding: 0;
    }

    /* Progress bar */
    #progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      transition: width 0.3s;
      z-index: 101;
    }

    /* Navigation hints */
    .nav-hint {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      padding: 20px;
      font-size: 3rem;
      color: rgba(255,255,255,0.2);
      cursor: pointer;
      transition: all 0.2s;
      z-index: 50;
      user-select: none;
    }

    .nav-hint:hover {
      color: rgba(255,255,255,0.6);
      transform: translateY(-50%) scale(1.2);
    }

    .nav-hint.left {
      left: 20px;
    }

    .nav-hint.right {
      right: 20px;
    }

    .nav-hint.hidden {
      display: none;
    }

    /* Fullscreen */
    :fullscreen #controls,
    :fullscreen #settings {
      opacity: 0;
      pointer-events: none;
    }

    :fullscreen .nav-hint {
      display: none;
    }
  </style>
</head>
<body>
  <div id="progress"></div>
  
  <div id="slideshow" class="transition-fade">
    <!-- Slides will be inserted here -->
  </div>

  <div class="nav-hint left" onclick="previousSlide()">‹</div>
  <div class="nav-hint right" onclick="nextSlide()">›</div>

  <div id="settings">
    <h3>⚙️ Innstillinger</h3>
    <div class="setting">
      <label>Overgang:</label>
      <select id="transition" onchange="changeTransition()">
        <option value="fade">Fade</option>
        <option value="slide">Slide</option>
        <option value="zoom">Zoom</option>
        <option value="flip">Flip</option>
        <option value="random">🎲 Tilfeldig</option>
      </select>
    </div>
    <div class="setting">
      <label>Hastighet: <span id="speedValue">4s</span></label>
      <input type="range" id="speed" min="2" max="10" value="4" step="0.5" oninput="updateSpeed()">
    </div>
  </div>

  <div id="controls">
    <button onclick="previousSlide()">‹ Forrige</button>
    <div class="counter">
      <span id="current">1</span> / <span id="total">${items.length}</span>
    </div>
    <button onclick="nextSlide()">Neste ›</button>
    <button onclick="togglePlay()" id="playBtn">⏸ Pause</button>
    <button onclick="toggleFullscreen()">⛶ Fullskjerm</button>
  </div>

  <script>
    const slides = ${JSON.stringify(slidesData)};
    let currentIndex = 0;
    let isPlaying = true;
    let playInterval = null;
    let speed = 4000;
    let transition = 'fade';

    // Initialize
    function init() {
      const container = document.getElementById('slideshow');
      
      slides.forEach((slide, index) => {
        const div = document.createElement('div');
        div.className = 'slide' + (index === 0 ? ' active' : '');
        
        if (slide.type === 'photo') {
          const img = document.createElement('img');
          img.src = slide.src;
          img.alt = 'Slide ' + (index + 1);
          div.appendChild(img);
        } else {
          const textDiv = document.createElement('div');
          textDiv.className = 'text-slide';
          textDiv.innerHTML = '<h1>' + escapeHtml(slide.title) + '</h1><p>' + escapeHtml(slide.body) + '</p>';
          div.appendChild(textDiv);
        }
        
        container.appendChild(div);
      });

      updateCounter();
      updateProgress();
      startAutoPlay();
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
      const next = (currentIndex + 1) % slides.length;
      maybeChangeTransition();
      showSlide(next);
    }

    function previousSlide() {
      const prev = (currentIndex - 1 + slides.length) % slides.length;
      maybeChangeTransition();
      showSlide(prev);
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      const btn = document.getElementById('playBtn');
      btn.textContent = isPlaying ? '⏸ Pause' : '▶ Spill av';
      
      if (isPlaying) {
        startAutoPlay();
      } else {
        stopAutoPlay();
      }
    }

    function startAutoPlay() {
      stopAutoPlay();
      if (isPlaying) {
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

    function changeTransition() {
      transition = document.getElementById('transition').value;
      applyTransition();
    }

    function applyTransition() {
      const container = document.getElementById('slideshow');
      container.className = 'transition-' + (transition === 'random' ? getRandomTransition() : transition);
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

    function updateSpeed() {
      speed = parseFloat(document.getElementById('speed').value) * 1000;
      document.getElementById('speedValue').textContent = (speed / 1000) + 's';
      startAutoPlay(); // Restart with new speed
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

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          previousSlide();
          break;
        case 'ArrowRight':
          nextSlide();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    });

    // Mouse click navigation
    document.getElementById('slideshow').addEventListener('click', (e) => {
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
      touchStartX = e.touches[0].clientX;
    });

    document.addEventListener('touchend', (e) => {
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
      const settings = document.getElementById('settings');
      const navHints = document.querySelectorAll('.nav-hint');
      
      if (document.fullscreenElement) {
        controls.classList.add('hidden');
        settings.classList.add('hidden');
        navHints.forEach(hint => hint.classList.add('hidden'));
      } else {
        controls.classList.remove('hidden');
        settings.classList.remove('hidden');
        navHints.forEach(hint => hint.classList.remove('hidden'));
      }
    });

    // Initialize on load
    init();
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
