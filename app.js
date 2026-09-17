/**
 * ランダム世界ストリートビュー - メインアプリケーション
 */

(function () {
  'use strict';

  // --- 定数 & 状態 ---
  const STORAGE_KEY_API_KEY = 'random_streetview_api_key';
  const STORAGE_KEY_INTERVAL = 'random_streetview_interval';

  let apiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  let intervalSeconds = parseInt(localStorage.getItem(STORAGE_KEY_INTERVAL) || '60', 10);

  let isPaused = false;
  let remainingSeconds = intervalSeconds;
  let timerIntervalId = null;
  let currentLocation = null;
  let locationQueue = [];
  let currentLayer = 'a'; // 'a' or 'b'
  let leafletMap = null;
  let currentMarker = null;

  // --- DOM要素キャッシュ ---
  const viewContainer = document.getElementById('view-container');
  const layerA = document.getElementById('view-layer-a');
  const layerB = document.getElementById('view-layer-b');
  const progressFill = document.getElementById('progress-bar-fill');

  const locCard = document.getElementById('location-card');
  const locCountry = document.getElementById('loc-country');
  const locDetail = document.getElementById('loc-detail');

  const hourHand = document.getElementById('hour-hand');
  const minuteHand = document.getElementById('minute-hand');
  const secondHand = document.getElementById('second-hand');
  const clockTicksGroup = document.getElementById('clock-ticks');

  const btnTogglePlay = document.getElementById('btn-toggle-play');
  const iconPause = document.getElementById('icon-pause');
  const iconPlay = document.getElementById('icon-play');
  const btnNext = document.getElementById('btn-next');
  const btnSettings = document.getElementById('btn-settings');

  const mapModal = document.getElementById('map-modal-backdrop');
  const btnCloseMap = document.getElementById('btn-close-map');
  const modalPlaceTitle = document.getElementById('modal-place-title');
  const modalPlaceSub = document.getElementById('modal-place-sub');
  const modalCoords = document.getElementById('modal-coords');
  const btnOpenGoogleMaps = document.getElementById('btn-open-google-maps');

  const settingsModal = document.getElementById('settings-modal-backdrop');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const inputApiKey = document.getElementById('input-api-key');
  const selectInterval = document.getElementById('select-interval');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  // =========================================================================
  // 1. アナログ針時計の構築 & 更新
  // =========================================================================
  function initClockTicks() {
    const cx = 50;
    const cy = 50;
    const r = 44;
    clockTicksGroup.innerHTML = '';

    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * (Math.PI / 180);
      const isMajor = i % 5 === 0;
      const tickLength = isMajor ? 5 : 2.5;
      const x1 = cx + (r - tickLength) * Math.cos(angle);
      const y1 = cy + (r - tickLength) * Math.sin(angle);
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('class', isMajor ? 'clock-tick major' : 'clock-tick');
      clockTicksGroup.appendChild(line);
    }
  }

  function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const millis = now.getMilliseconds();

    // 角度計算
    const hourDeg = (hours + minutes / 60 + seconds / 3600) * 30;
    const minDeg = (minutes + seconds / 60) * 6;
    // 秒針：ステップ針＋滑らかさ（1秒ごとのシャープな刻み）
    const secDeg = (seconds + millis / 1000) * 6;

    // SVG viewBoxの中心 (50, 50) を軸に回転
    hourHand.setAttribute('transform', `rotate(${hourDeg} 50 50)`);
    minuteHand.setAttribute('transform', `rotate(${minDeg} 50 50)`);
    secondHand.setAttribute('transform', `rotate(${secDeg} 50 50)`);

    requestAnimationFrame(updateClock);
  }

  // =========================================================================
  // 2. 地点キュー管理 & シャッフル
  // =========================================================================
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getNextLocation() {
    if (locationQueue.length === 0) {
      locationQueue = shuffleArray(WORLD_LOCATIONS);
    }
    return locationQueue.pop();
  }

  // =========================================================================
  // 3. ストリートビュー画像URLの生成
  // =========================================================================
  function getStreetViewImageUrl(loc) {
    if (apiKey && apiKey.trim().length > 0) {
      // Google Street View Static API
      // 移動ボタンや矢印などの操作UIが一切入らない高画質な静止画像
      const fov = 90;
      const heading = loc.heading !== undefined ? loc.heading : 0;
      const pitch = loc.pitch !== undefined ? loc.pitch : 0;
      // iPhoneのRetinaディスプレイに最適な解像度
      const width = Math.min(window.screen.width || 640, 640);
      const height = Math.min(window.screen.height || 640, 640);
      return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&scale=2&location=${loc.lat},${loc.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey.trim()}`;
    } else {
      // APIキー未設定時はデモ用の高解像度風景画像
      return loc.demoImage;
    }
  }

  // =========================================================================
  // 4. 新しい地点への切り替え（クロスフェード）
  // =========================================================================
  function showNextLocation() {
    const loc = getNextLocation();
    currentLocation = loc;

    // 国名（国旗付き）と大まかな住所の表示（番地は含めない）
    const flagPrefix = loc.flag ? `${loc.flag} ` : '';
    locCountry.textContent = `${flagPrefix}${loc.country}`;
    locDetail.textContent = `${loc.region} ${loc.city}`;

    const imageUrl = getStreetViewImageUrl(loc);

    // 画像の事前ロードを行ってからスムーズにクロスフェード
    const nextImg = currentLayer === 'a' ? layerB : layerA;
    const activeImg = currentLayer === 'a' ? layerA : layerB;

    const preload = new Image();
    preload.onload = function () {
      nextImg.src = imageUrl;
      nextImg.classList.add('active');
      activeImg.classList.remove('active');
      currentLayer = currentLayer === 'a' ? 'b' : 'a';
    };
    preload.onerror = function () {
      console.warn('Image load failed, using fallback:', loc.demoImage);
      nextImg.src = loc.demoImage;
      nextImg.classList.add('active');
      activeImg.classList.remove('active');
      currentLayer = currentLayer === 'a' ? 'b' : 'a';
    };
    preload.src = imageUrl;

    // タイマーリセット
    resetTimer();
  }

  // =========================================================================
  // 5. タイマー＆プログレスバー
  // =========================================================================
  function resetTimer() {
    remainingSeconds = intervalSeconds;
    updateProgress();
  }

  function updateProgress() {
    const percent = ((intervalSeconds - remainingSeconds) / intervalSeconds) * 100;
    progressFill.style.width = `${Math.min(percent, 100)}%`;
  }

  function startTimer() {
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(() => {
      if (isPaused) return;

      remainingSeconds -= 0.5;
      updateProgress();

      if (remainingSeconds <= 0) {
        showNextLocation();
      }
    }, 500);
  }

  function togglePlayPause() {
    isPaused = !isPaused;
    if (isPaused) {
      iconPause.style.display = 'none';
      iconPlay.style.display = 'block';
    } else {
      iconPause.style.display = 'block';
      iconPlay.style.display = 'none';
    }
  }

  // =========================================================================
  // 6. 地図モーダル（Leaflet & Googleマップ連携）
  // =========================================================================
  function openMapModal() {
    if (!currentLocation) return;

    // タイマーを一時停止
    const prevPausedState = isPaused;
    isPaused = true;

    modalPlaceTitle.textContent = `${currentLocation.country}・${currentLocation.region}`;
    modalPlaceSub.textContent = currentLocation.city;
    modalCoords.textContent = `${currentLocation.lat.toFixed(5)}°, ${currentLocation.lng.toFixed(5)}°`;

    // Googleマップ直接リンク
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`;
    btnOpenGoogleMaps.href = gmapsUrl;

    mapModal.classList.add('open');

    // Leafletマップの初期化または更新
    setTimeout(() => {
      const lat = currentLocation.lat;
      const lng = currentLocation.lng;

      // モダンなSVGマップピンアイコン
      const pinIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
            <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#EF4444"/>
            <circle cx="17" cy="17" r="6.5" fill="#FFFFFF"/>
          </svg>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -40]
      });

      if (!leafletMap) {
        leafletMap = L.map('leaflet-map', {
          zoomControl: true,
          attributionControl: true
        }).setView([lat, lng], 13);

        // 高解像度・見やすい標準OpenStreetMapタイル
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(leafletMap);

        currentMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(leafletMap);
      } else {
        leafletMap.invalidateSize();
        leafletMap.setView([lat, lng], 13);
        if (currentMarker) {
          currentMarker.setLatLng([lat, lng]);
          currentMarker.setIcon(pinIcon);
        } else {
          currentMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(leafletMap);
        }
      }

      const flag = currentLocation.flag ? `${currentLocation.flag} ` : '';
      currentMarker.bindPopup(`<b>${flag}${currentLocation.country}</b><br>${currentLocation.city}`).openPopup();
    }, 150);

    // 閉じたときのタイマー復元用リスナー
    mapModal.dataset.resume = prevPausedState ? 'no' : 'yes';
  }

  function closeMapModal() {
    mapModal.classList.remove('open');
    if (mapModal.dataset.resume === 'yes') {
      isPaused = false;
    }
  }

  // =========================================================================
  // 7. 設定モーダル
  // =========================================================================
  function openSettingsModal() {
    inputApiKey.value = apiKey;
    selectInterval.value = intervalSeconds.toString();
    settingsModal.classList.add('open');
  }

  function closeSettingsModal() {
    settingsModal.classList.remove('open');
  }

  function saveSettings() {
    apiKey = inputApiKey.value.trim();
    intervalSeconds = parseInt(selectInterval.value, 10) || 60;

    localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEY_INTERVAL, intervalSeconds.toString());

    closeSettingsModal();
    resetTimer();

    // 現在の地点をAPIキー設定に合わせて再読み込み
    if (currentLocation) {
      const imageUrl = getStreetViewImageUrl(currentLocation);
      const activeImg = currentLayer === 'a' ? layerA : layerB;
      activeImg.src = imageUrl;
    }
  }

  // =========================================================================
  // 8. ドラッグ＆ドロップ機能（時計・場所表示カード）
  // =========================================================================
  const draggableElements = [];

  function makeDraggable(element, storageKey, options = {}) {
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let isDragging = false;
    let lastTapTime = 0;

    function applyRatioPosition(ratioX, ratioY) {
      const width = element.offsetWidth || 80;
      const height = element.offsetHeight || 80;
      const minX = 8;
      const maxX = Math.max(minX, window.innerWidth - width - 8);
      const minY = 8;
      const maxY = Math.max(minY, window.innerHeight - height - 8);

      let targetX = window.innerWidth * ratioX;
      let targetY = window.innerHeight * ratioY;

      targetX = Math.max(minX, Math.min(maxX, targetX));
      targetY = Math.max(minY, Math.min(maxY, targetY));

      element.style.position = 'fixed';
      element.style.left = `${targetX}px`;
      element.style.top = `${targetY}px`;
      element.style.bottom = 'auto';
      element.style.right = 'auto';
      element.style.margin = '0';
    }

    function resetToDefault() {
      localStorage.removeItem(storageKey);
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';
      element.style.bottom = '';
      element.style.right = '';
      element.style.margin = '';
    }

    function restorePosition() {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const { ratioX, ratioY } = JSON.parse(saved);
          applyRatioPosition(ratioX, ratioY);
          return;
        } catch (e) {
          console.error(e);
        }
      }
      resetToDefault();
    }

    element.addEventListener('pointerdown', (e) => {
      // 内部のリンクやボタンのタップは邪魔しない
      if (e.target.closest('button') || e.target.closest('a')) return;

      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      isDragging = false;

      element.setPointerCapture(e.pointerId);
    });

    element.addEventListener('pointermove', (e) => {
      if (!element.hasPointerCapture(e.pointerId)) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!isDragging && Math.hypot(dx, dy) > 5) {
        isDragging = true;
        element.classList.add('is-dragging');
      }

      if (isDragging) {
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const minX = 8;
        const maxX = Math.max(minX, window.innerWidth - width - 8);
        const minY = 8;
        const maxY = Math.max(minY, window.innerHeight - height - 8);

        let targetX = initialLeft + dx;
        let targetY = initialTop + dy;

        targetX = Math.max(minX, Math.min(maxX, targetX));
        targetY = Math.max(minY, Math.min(maxY, targetY));

        element.style.position = 'fixed';
        element.style.left = `${targetX}px`;
        element.style.top = `${targetY}px`;
        element.style.bottom = 'auto';
        element.style.right = 'auto';
        element.style.margin = '0';
      }
    });

    element.addEventListener('pointerup', (e) => {
      if (element.hasPointerCapture(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
      }

      element.classList.remove('is-dragging');

      if (isDragging) {
        const rect = element.getBoundingClientRect();
        const ratioX = rect.left / window.innerWidth;
        const ratioY = rect.top / window.innerHeight;
        localStorage.setItem(storageKey, JSON.stringify({ ratioX, ratioY }));
        isDragging = false;
        return;
      }

      // 単なるタップだった場合
      const now = Date.now();
      if (now - lastTapTime < 320) {
        // ダブルタップで位置を初期位置にリセット
        resetToDefault();
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;

      if (options.onClick) {
        options.onClick(e);
      }
    });

    element.addEventListener('pointercancel', (e) => {
      if (element.hasPointerCapture(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
      }
      element.classList.remove('is-dragging');
      isDragging = false;
    });

    draggableElements.push({ element, storageKey, applyRatioPosition, resetToDefault });
    restorePosition();
  }

  // =========================================================================
  // 9. イベントリスナー登録
  // =========================================================================
  function initEvents() {
    // 画面タップで地図を開く（背景画像領域）
    viewContainer.addEventListener('click', () => {
      openMapModal();
    });

    // 右上コントロール
    btnTogglePlay.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
    });

    btnNext.addEventListener('click', (e) => {
      e.stopPropagation();
      showNextLocation();
    });

    btnSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      openSettingsModal();
    });

    // 地図モーダル閉じる
    btnCloseMap.addEventListener('click', closeMapModal);
    mapModal.addEventListener('click', (e) => {
      if (e.target === mapModal) {
        closeMapModal();
      }
    });

    // 設定モーダル閉じる & 保存
    btnCloseSettings.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });
    btnSaveSettings.addEventListener('click', saveSettings);

    // ウィジェット位置初期化ボタン
    const btnResetPositions = document.getElementById('btn-reset-positions');
    if (btnResetPositions) {
      btnResetPositions.addEventListener('click', () => {
        draggableElements.forEach(item => item.resetToDefault());
        closeSettingsModal();
      });
    }

    // 時計ウィジェット & 場所カードをドラッグ可能に
    const clockWidget = document.getElementById('clock-widget');
    makeDraggable(clockWidget, 'random_sv_clock_pos', {
      onClick: (e) => {
        e.stopPropagation();
      }
    });

    makeDraggable(locCard, 'random_sv_loc_pos', {
      onClick: (e) => {
        e.stopPropagation();
        openMapModal();
      }
    });

    // 画面向き変更・リサイズ時の位置再計算
    window.addEventListener('resize', () => {
      draggableElements.forEach(item => {
        const saved = localStorage.getItem(item.storageKey);
        if (saved) {
          try {
            const { ratioX, ratioY } = JSON.parse(saved);
            item.applyRatioPosition(ratioX, ratioY);
          } catch (err) {}
        }
      });

      if (leafletMap && mapModal.classList.contains('open')) {
        setTimeout(() => leafletMap.invalidateSize(), 200);
      }
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        draggableElements.forEach(item => {
          const saved = localStorage.getItem(item.storageKey);
          if (saved) {
            try {
              const { ratioX, ratioY } = JSON.parse(saved);
              item.applyRatioPosition(ratioX, ratioY);
            } catch (err) {}
          }
        });
        if (leafletMap && mapModal.classList.contains('open')) {
          leafletMap.invalidateSize();
        }
      }, 300);
    });
  }

  // =========================================================================
  // 10. 初期化
  // =========================================================================
  function init() {
    initClockTicks();
    updateClock();
    initEvents();

    // 最初の地点を表示＆タイマースタート
    showNextLocation();
    startTimer();
  }

  // DOMContentLoadedで起動
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
