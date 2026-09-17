/**
 * ランダム世界ストリートビュー - メインアプリケーション
 */

(function () {
  'use strict';

  // --- 定数 & 状態 ---
  const STORAGE_KEY_API_KEY = 'random_streetview_api_key';
  const STORAGE_KEY_INTERVAL = 'random_streetview_interval';
  const STORAGE_KEY_WANDER_MODE = 'random_streetview_wander_mode';
  const STORAGE_KEY_FAVORITES = 'random_streetview_favorites_v1';

  let apiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  let intervalSeconds = parseInt(localStorage.getItem(STORAGE_KEY_INTERVAL) || '60', 10);
  let wanderMode = localStorage.getItem(STORAGE_KEY_WANDER_MODE) || 'wander';
  let favoritesList = [];

  let isPaused = false;
  let remainingSeconds = intervalSeconds;
  let timerIntervalId = null;
  let currentLocation = null;
  let locationQueue = [];
  let currentLayer = 'a'; // 'a' or 'b'
  let leafletMap = null;
  let currentMarker = null;
  let isTransitioning = false;

  // --- DOM要素キャッシュ ---
  const viewContainer = document.getElementById('view-container');
  const sceneCurtain = document.getElementById('scene-curtain');
  const layerA = document.getElementById('view-layer-a');
  const layerB = document.getElementById('view-layer-b');
  const progressFill = document.getElementById('progress-bar-fill');

  const locCard = document.getElementById('location-card');
  const locCountry = document.getElementById('loc-country');
  const locDetail = document.getElementById('loc-detail');
  const btnFavToggle = document.getElementById('btn-fav-toggle');

  const hourHand = document.getElementById('hour-hand');
  const minuteHand = document.getElementById('minute-hand');
  const secondHand = document.getElementById('second-hand');
  const clockTicksGroup = document.getElementById('clock-ticks');

  const btnTogglePlay = document.getElementById('btn-toggle-play');
  const iconPause = document.getElementById('icon-pause');
  const iconPlay = document.getElementById('icon-play');
  const btnNext = document.getElementById('btn-next');
  const btnOpenFavorites = document.getElementById('btn-open-favorites');
  const favBadge = document.getElementById('fav-badge');
  const btnReload = document.getElementById('btn-reload');
  const btnSettings = document.getElementById('btn-settings');

  const mapModal = document.getElementById('map-modal-backdrop');
  const btnCloseMap = document.getElementById('btn-close-map');
  const modalPlaceTitle = document.getElementById('modal-place-title');
  const modalPlaceSub = document.getElementById('modal-place-sub');
  const modalCoords = document.getElementById('modal-coords');
  const btnModalFav = document.getElementById('btn-modal-fav');
  const modalFavText = document.getElementById('modal-fav-text');
  const btnOpenGoogleMaps = document.getElementById('btn-open-google-maps');

  const settingsModal = document.getElementById('settings-modal-backdrop');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const inputApiKey = document.getElementById('input-api-key');
  const selectInterval = document.getElementById('select-interval');
  const selectWanderMode = document.getElementById('select-wander-mode');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  const favoritesModal = document.getElementById('favorites-modal-backdrop');
  const btnCloseFavorites = document.getElementById('btn-close-favorites');
  const favModalCount = document.getElementById('fav-modal-count');
  const favoritesListContainer = document.getElementById('favorites-list');
  const btnClearAllFavorites = document.getElementById('btn-clear-all-favorites');

  const toastNotification = document.getElementById('toast-notification');
  const panoContainer = document.getElementById('pano-container');
  let isGoogleMapsLoaded = false;
  let googlePano = null;

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
    const secDeg = (seconds + millis / 1000) * 6;

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
  // 3. Google Maps JavaScript API 動的ローダー
  // =========================================================================
  function loadGoogleMapsScript(key, onReady) {
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      if (onReady) onReady();
      return;
    }

    const existingScript = document.getElementById('google-maps-api-script');
    if (existingScript) existingScript.remove();

    window.__initGoogleMaps = function () {
      isGoogleMapsLoaded = true;
      if (onReady) onReady();
    };

    const script = document.createElement('script');
    script.id = 'google-maps-api-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key.trim())}&callback=__initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = function () {
      console.warn('Google Maps JavaScript API の読み込みに失敗しました。');
      isGoogleMapsLoaded = false;
    };
    document.head.appendChild(script);
  }

  let streetViewService = null;
  let geocoder = null;
  let skipAttempts = 0;

  // =========================================================================
  // 4. 逆ジオコーディング（大まかな住所取得：番地除外）
  // =========================================================================
  function reverseGeocodeLocation(lat, lng, defaultFlag) {
    if (!window.google || !window.google.maps) return;
    if (!geocoder) geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const components = results[0].address_components;
        let country = '';
        let adminArea = '';
        let locality = '';
        let sublocality = '';

        for (const c of components) {
          if (c.types.includes('country')) {
            country = c.long_name;
          } else if (c.types.includes('administrative_area_level_1')) {
            adminArea = c.long_name;
          } else if (c.types.includes('locality')) {
            locality = c.long_name;
          } else if (c.types.includes('sublocality_level_1') || c.types.includes('administrative_area_level_2')) {
            if (!sublocality) sublocality = c.long_name;
          }
        }

        const flagPrefix = defaultFlag ? `${defaultFlag} ` : '';
        if (country) locCountry.textContent = `${flagPrefix}${country}`;

        const details = [adminArea, locality, sublocality].filter(Boolean);
        if (details.length > 0) {
          locDetail.textContent = details.join(' ');
          if (currentLocation) {
            currentLocation.addressText = details.join(' ');
          }
        }
        updateFavoriteButtonsState();
      }
    });
  }

  // =========================================================================
  // 5. 360°パノラマ（実在ストリートビュー自動検索＆ランダム散歩）
  // =========================================================================
  function updateInteractivePanorama(loc, onReady, isDirectJump = false) {
    if (!window.google || !window.google.maps) {
      if (onReady) onReady();
      return false;
    }

    if (!streetViewService) {
      streetViewService = new google.maps.StreetViewService();
    }

    if (!googlePano) {
      googlePano = new google.maps.StreetViewPanorama(panoContainer, {
        zoom: 1,
        disableDefaultUI: true,
        linksControl: false,          // 道路の矢印非表示
        panControl: false,            // コンパス非表示
        zoomControl: false,           // ズームボタン非表示
        addressControl: false,        // 住所バー非表示
        fullscreenControl: false,     // 全画面ボタン非表示
        motionTracking: false,        // ★ジャイロ無効化（指の操作のみ）
        motionTrackingControl: false, // ★ジャイロ切替ボタン非表示
        clickToGo: false,             // タップで別地点へ移動するのを防止
        showRoadLabels: false,        // 道路名非表示
        visible: true
      });
    }

    // もしすでにパノラマIDが直接指定されている場合（保存済み地点など）
    if (loc.panoId) {
      googlePano.setPano(loc.panoId);
      googlePano.setPov({
        heading: loc.heading || 0,
        pitch: loc.pitch || 0
      });
      panoContainer.classList.add('active');
      if (onReady) setTimeout(onReady, 350);
      return true;
    }

    // 探索ターゲット座標の決定
    let searchLat = loc.actualLat || loc.lat;
    let searchLng = loc.actualLng || loc.lng;

    // お気に入りからの直接ジャンプでない場合のみ、散歩オフセットを適用
    if (!isDirectJump && wanderMode === 'wander') {
      const angle = Math.random() * Math.PI * 2;
      const distKm = 0.8 + Math.random() * 4.2; // 0.8km〜5.0km
      const dLat = (distKm / 111) * Math.cos(angle);
      const dLng = (distKm / (111 * Math.cos((loc.lat * Math.PI) / 180))) * Math.sin(angle);
      searchLat += dLat;
      searchLng += dLng;
    }

    // 周囲の「実際に存在する屋外ストリートビュー撮影地点」を探索
    streetViewService.getPanorama({
      location: { lat: searchLat, lng: searchLng },
      radius: (!isDirectJump && wanderMode === 'wander') ? 3500 : 2500,
      preference: google.maps.StreetViewPreference.NEAREST,
      source: google.maps.StreetViewSource.OUTDOOR
    }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK && data && data.location) {
        skipAttempts = 0;

        // 実際に撮影された道路・ポイントの正確な座標を記録
        const actualLat = data.location.latLng.lat();
        const actualLng = data.location.latLng.lng();
        loc.actualLat = actualLat;
        loc.actualLng = actualLng;
        loc.panoId = data.location.pano;

        googlePano.setPano(data.location.pano);
        googlePano.setPov({
          heading: loc.heading !== undefined ? loc.heading : (data.tiles ? data.tiles.centerHeading : 0),
          pitch: loc.pitch !== undefined ? loc.pitch : 0
        });
        panoContainer.classList.add('active');

        // ランダム散歩モード時は、到達した未知の街角の住所を動的取得
        if (!isDirectJump && wanderMode === 'wander') {
          reverseGeocodeLocation(actualLat, actualLng, loc.flag);
        }

        // タイル描画の初期安定を待ってからフェードイン完了へ
        if (onReady) setTimeout(onReady, 400);
      } else {
        // オフセット地点で見つからなかった場合、ベース地点を試す
        if (!isDirectJump && wanderMode === 'wander' && (searchLat !== loc.lat || searchLng !== loc.lng)) {
          streetViewService.getPanorama({
            location: { lat: loc.lat, lng: loc.lng },
            radius: 2500,
            source: google.maps.StreetViewSource.OUTDOOR
          }, (baseData, baseStatus) => {
            if (baseStatus === google.maps.StreetViewStatus.OK && baseData && baseData.location) {
              loc.actualLat = baseData.location.latLng.lat();
              loc.actualLng = baseData.location.latLng.lng();
              loc.panoId = baseData.location.pano;
              googlePano.setPano(baseData.location.pano);
              googlePano.setPov({
                heading: loc.heading || 0,
                pitch: loc.pitch || 0
              });
              panoContainer.classList.add('active');
              if (onReady) setTimeout(onReady, 400);
            } else {
              // ベース地点でも見つからなければ次の場所へスキップ
              showNextLocation();
            }
          });
        } else {
          skipAttempts++;
          if (skipAttempts < 5) {
            showNextLocation();
          } else {
            panoContainer.classList.remove('active');
            skipAttempts = 0;
            if (onReady) onReady();
          }
        }
      }
    });

    return true;
  }

  // =========================================================================
  // 6. デモ画像・フォールバック表示
  // =========================================================================
  function getStreetViewImageUrl(loc) {
    if (apiKey && apiKey.trim().length > 0) {
      const width = Math.min(window.screen.width || 640, 640);
      const height = Math.min(window.screen.height || 640, 640);
      const heading = loc.heading !== undefined ? loc.heading : 0;
      const pitch = loc.pitch !== undefined ? loc.pitch : 0;
      return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&scale=2&location=${loc.lat},${loc.lng}&heading=${heading}&pitch=${pitch}&fov=90&key=${apiKey.trim()}`;
    }
    return loc.demoImage;
  }

  function loadStaticDemoImage(loc, onReady) {
    const imageUrl = getStreetViewImageUrl(loc);
    const nextImg = currentLayer === 'a' ? layerB : layerA;
    const activeImg = currentLayer === 'a' ? layerA : layerB;

    const preload = new Image();
    const handleLoaded = () => {
      nextImg.src = preload.src;
      nextImg.classList.add('active');
      activeImg.classList.remove('active');
      currentLayer = currentLayer === 'a' ? 'b' : 'a';
      if (onReady) setTimeout(onReady, 100);
    };

    preload.onload = handleLoaded;
    preload.onerror = () => {
      preload.src = loc.demoImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80';
      handleLoaded();
    };
    preload.src = imageUrl;
  }

  // =========================================================================
  // 7. シネマティック フェードイン/アウト トランジション
  // =========================================================================
  function transitionToLocation(loc, isDirectJump = false) {
    if (isTransitioning) return;
    isTransitioning = true;

    // 1. フェードアウト（画面暗転＆住所文字のフェード）
    if (sceneCurtain) sceneCurtain.classList.add('fade-out');
    const locationInfo = document.querySelector('.location-info');
    if (locationInfo) locationInfo.classList.add('fading');

    // 暗転完了タイミング（約450ms後）にコンテンツ差し替え
    setTimeout(() => {
      currentLocation = loc;

      // 国名・住所テキストの反映
      const flagPrefix = loc.flag ? `${loc.flag} ` : '';
      locCountry.textContent = `${flagPrefix}${loc.country}`;
      locDetail.textContent = loc.addressText || `${loc.region} ${loc.city}`;

      // お気に入り状態のUI反映
      updateFavoriteButtonsState();

      // 新しい地点の描画完了時コールバック（カーテンを開く）
      const revealScene = () => {
        setTimeout(() => {
          if (locationInfo) locationInfo.classList.remove('fading');
          if (sceneCurtain) sceneCurtain.classList.remove('fade-out');
          resetTimer();
          setTimeout(() => {
            isTransitioning = false;
          }, 600);
        }, 150);
      };

      if (apiKey && apiKey.trim().length > 0) {
        if (isGoogleMapsLoaded) {
          updateInteractivePanorama(loc, revealScene, isDirectJump);
        } else {
          loadGoogleMapsScript(apiKey, () => {
            updateInteractivePanorama(loc, revealScene, isDirectJump);
          });
        }
      } else {
        panoContainer.classList.remove('active');
        loadStaticDemoImage(loc, revealScene);
      }
    }, 450);
  }

  function showNextLocation() {
    const loc = getNextLocation();
    transitionToLocation(loc, false);
  }

  // =========================================================================
  // 8. タイマー＆プログレスバー
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
  // 9. お気に入り（保存）機能
  // =========================================================================
  function loadFavorites() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
      favoritesList = raw ? JSON.parse(raw) : [];
    } catch (e) {
      favoritesList = [];
    }
    updateFavoritesBadge();
    updateFavoriteButtonsState();
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favoritesList));
    } catch (e) {
      console.error('お気に入りの保存に失敗しました:', e);
    }
    updateFavoritesBadge();
    updateFavoriteButtonsState();
  }

  function updateFavoritesBadge() {
    const count = favoritesList.length;
    if (favBadge) {
      if (count > 0) {
        favBadge.textContent = count > 99 ? '99+' : count;
        favBadge.style.display = 'flex';
      } else {
        favBadge.style.display = 'none';
      }
    }
    if (favModalCount) {
      favModalCount.textContent = `${count}件`;
    }
  }

  function isLocationFavorited(loc) {
    if (!loc) return false;
    const lat = loc.actualLat || loc.lat;
    const lng = loc.actualLng || loc.lng;
    return favoritesList.some(item => {
      if (item.panoId && loc.panoId && item.panoId === loc.panoId) return true;
      const itemLat = item.actualLat || item.lat;
      const itemLng = item.actualLng || item.lng;
      const dist = Math.hypot(itemLat - lat, itemLng - lng);
      return dist < 0.003 || (item.city === loc.city && item.country === loc.country && dist < 0.05);
    });
  }

  function updateFavoriteButtonsState() {
    const isFav = isLocationFavorited(currentLocation);
    if (btnFavToggle) {
      btnFavToggle.classList.toggle('is-favorite', isFav);
      btnFavToggle.title = isFav ? 'お気に入りを解除' : 'この場所をお気に入りに保存';
    }
    if (btnModalFav) {
      btnModalFav.classList.toggle('is-favorite', isFav);
      if (modalFavText) {
        modalFavText.textContent = isFav ? '保存済み' : '保存する';
      }
    }
  }

  function toggleFavoriteCurrentLocation() {
    if (!currentLocation) return;
    const isFav = isLocationFavorited(currentLocation);
    const lat = currentLocation.actualLat || currentLocation.lat;
    const lng = currentLocation.actualLng || currentLocation.lng;

    if (isFav) {
      // 登録解除
      favoritesList = favoritesList.filter(item => {
        const itemLat = item.actualLat || item.lat;
        const itemLng = item.actualLng || item.lng;
        const dist = Math.hypot(itemLat - lat, itemLng - lng);
        return dist >= 0.003 && !(item.city === currentLocation.city && item.country === currentLocation.country && dist < 0.05);
      });
      saveFavorites();
      showToast('お気に入りから削除しました');
    } else {
      // 新規保存
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const dateStr = `${month}/${day} ${hours}:${minutes}`;

      const favItem = {
        id: 'fav_' + Date.now(),
        flag: currentLocation.flag || '📍',
        country: currentLocation.country || '',
        region: currentLocation.region || '',
        city: currentLocation.city || '',
        addressText: locDetail ? locDetail.textContent : '',
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        actualLat: lat,
        actualLng: lng,
        panoId: currentLocation.panoId || null,
        heading: currentLocation.heading || 0,
        pitch: currentLocation.pitch || 0,
        demoImage: currentLocation.demoImage || '',
        dateStr: dateStr,
        timestamp: Date.now()
      };

      favoritesList.unshift(favItem);
      saveFavorites();
      showToast('⭐️ お気に入りに保存しました');
    }

    updateFavoriteButtonsState();
    if (favoritesModal && favoritesModal.classList.contains('open')) {
      renderFavoritesList();
    }
  }

  let toastTimerId = null;
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    if (toastTimerId) clearTimeout(toastTimerId);
    toastTimerId = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2200);
  }

  function openFavoritesModal() {
    renderFavoritesList();
    favoritesModal.classList.add('open');
  }

  function closeFavoritesModal() {
    favoritesModal.classList.remove('open');
  }

  function renderFavoritesList() {
    if (!favoritesListContainer) return;
    favoritesListContainer.innerHTML = '';
    updateFavoritesBadge();

    if (favoritesList.length === 0) {
      favoritesListContainer.innerHTML = `
        <div class="fav-empty">
          <span class="fav-empty-icon">⭐️</span>
          <p>保存した場所はまだありません。</p>
          <p style="font-size: 11px; margin-top: 8px; color: rgba(255,255,255,0.45); line-height: 1.5;">
            画面下の場所カードにある ♡ ボタンを押すと、<br>いつでもお気に入りの街角を保存できます。
          </p>
        </div>
      `;
      if (btnClearAllFavorites) btnClearAllFavorites.style.display = 'none';
      return;
    }

    if (btnClearAllFavorites) btnClearAllFavorites.style.display = 'block';

    favoritesList.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'fav-item';

      const lat = item.actualLat || item.lat;
      const lng = item.actualLng || item.lng;
      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      card.innerHTML = `
        <div class="fav-item-main">
          <div class="fav-item-place">
            <span>${item.flag || '📍'}</span>
            <span>${item.country}</span>
          </div>
          <div class="fav-item-sub">${item.addressText || item.city || ''}</div>
          <div class="fav-item-date">${item.dateStr || ''} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)</div>
        </div>
        <div class="fav-item-actions">
          <button class="fav-btn-view" data-index="${index}" title="この場所を360度で見る">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            見る
          </button>
          <a class="fav-btn-gmaps" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" title="Googleマップで開く">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </a>
          <button class="fav-btn-delete" data-index="${index}" title="削除">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;

      card.querySelector('.fav-btn-view').addEventListener('click', (e) => {
        e.stopPropagation();
        closeFavoritesModal();
        transitionToLocation(item, true);
      });

      card.querySelector('.fav-btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        favoritesList.splice(index, 1);
        saveFavorites();
        renderFavoritesList();
        showToast('削除しました');
      });

      favoritesListContainer.appendChild(card);
    });
  }

  function clearAllFavorites() {
    if (favoritesList.length === 0) return;
    if (confirm('保存した場所をすべて削除しますか？')) {
      favoritesList = [];
      saveFavorites();
      renderFavoritesList();
      showToast('すべての場所を削除しました');
    }
  }

  // =========================================================================
  // 10. 地図モーダル（Leaflet & Googleマップ連携）
  // =========================================================================
  function openMapModal() {
    if (!currentLocation) return;

    updateFavoriteButtonsState();

    // タイマーを一時停止
    const prevPausedState = isPaused;
    isPaused = true;

    // 実際に撮影されたパノラマ座標（実在地点）があればそちらを優先
    const lat = currentLocation.actualLat !== undefined ? currentLocation.actualLat : currentLocation.lat;
    const lng = currentLocation.actualLng !== undefined ? currentLocation.actualLng : currentLocation.lng;

    modalPlaceTitle.textContent = `${currentLocation.country}・${currentLocation.region}`;
    modalPlaceSub.textContent = currentLocation.city;
    modalCoords.textContent = `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;

    // Googleマップ直接リンク
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    btnOpenGoogleMaps.href = gmapsUrl;

    mapModal.classList.add('open');

    // Leafletマップの初期化または更新
    setTimeout(() => {

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
    if (selectWanderMode) selectWanderMode.value = wanderMode;
    settingsModal.classList.add('open');
  }

  function closeSettingsModal() {
    settingsModal.classList.remove('open');
  }

  function saveSettings() {
    apiKey = inputApiKey.value.trim();
    intervalSeconds = parseInt(selectInterval.value, 10) || 60;
    wanderMode = selectWanderMode ? selectWanderMode.value : 'wander';

    localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEY_INTERVAL, intervalSeconds.toString());
    localStorage.setItem(STORAGE_KEY_WANDER_MODE, wanderMode);

    closeSettingsModal();
    resetTimer();

    // 現在の地点を新しいAPIキー設定に合わせて再読み込み
    if (apiKey && apiKey.trim().length > 0) {
      if (isGoogleMapsLoaded) {
        if (currentLocation) updateInteractivePanorama(currentLocation);
      } else {
        loadGoogleMapsScript(apiKey, () => {
          if (currentLocation) updateInteractivePanorama(currentLocation);
        });
      }
    } else {
      panoContainer.classList.remove('active');
      if (currentLocation) {
        const imageUrl = getStreetViewImageUrl(currentLocation);
        const activeImg = currentLayer === 'a' ? layerA : layerB;
        activeImg.src = imageUrl;
      }
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
    // 静止画表示時の画面タップで地図を開く
    viewContainer.addEventListener('click', () => {
      if (!panoContainer.classList.contains('active')) {
        openMapModal();
      }
    });

    // 360°パノラマ操作時のタップ判定（ぐりぐり操作と地図オープン用タップを分離）
    let panoStartX = 0;
    let panoStartY = 0;
    let panoStartTime = 0;
    let panoMoved = false;

    panoContainer.addEventListener('pointerdown', (e) => {
      panoStartX = e.clientX;
      panoStartY = e.clientY;
      panoStartTime = Date.now();
      panoMoved = false;
    });

    panoContainer.addEventListener('pointermove', (e) => {
      const dx = e.clientX - panoStartX;
      const dy = e.clientY - panoStartY;
      if (Math.hypot(dx, dy) > 8) {
        panoMoved = true;
      }
    });

    panoContainer.addEventListener('pointerup', (e) => {
      const elapsed = Date.now() - panoStartTime;
      // 8px以内の微小移動 ＆ 280ms以内の短時間タップの場合のみ地図を開く
      if (!panoMoved && elapsed < 280) {
        openMapModal();
      }
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

    // アプリ強制再読み込み（PWAキャッシュバイパス）
    function forceReloadApp() {
      const url = new URL(window.location.href);
      url.searchParams.set('reload', Date.now().toString());
      window.location.replace(url.toString());
    }

    if (btnReload) {
      btnReload.addEventListener('click', (e) => {
        e.stopPropagation();
        forceReloadApp();
      });
    }

    const btnForceReload = document.getElementById('btn-force-reload');
    if (btnForceReload) {
      btnForceReload.addEventListener('click', () => {
        forceReloadApp();
      });
    }

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

    // お気に入りトグル（場所カード内）
    if (btnFavToggle) {
      btnFavToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // カードタップで地図が開かないように伝播阻止
        toggleFavoriteCurrentLocation();
      });
    }

    // お気に入りトグル（地図モーダル内）
    if (btnModalFav) {
      btnModalFav.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteCurrentLocation();
      });
    }

    // お気に入り一覧モーダルを開く
    if (btnOpenFavorites) {
      btnOpenFavorites.addEventListener('click', (e) => {
        e.stopPropagation();
        openFavoritesModal();
      });
    }

    // お気に入り一覧モーダルを閉じる
    if (btnCloseFavorites) {
      btnCloseFavorites.addEventListener('click', closeFavoritesModal);
    }
    if (favoritesModal) {
      favoritesModal.addEventListener('click', (e) => {
        if (e.target === favoritesModal) {
          closeFavoritesModal();
        }
      });
    }

    // お気に入り全削除ボタン
    if (btnClearAllFavorites) {
      btnClearAllFavorites.addEventListener('click', (e) => {
        e.stopPropagation();
        clearAllFavorites();
      });
    }

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
  // 11. 初期化
  // =========================================================================
  function init() {
    loadFavorites();
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
