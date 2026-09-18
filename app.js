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
  const STORAGE_KEY_NOTIFY_ENABLED = 'random_sv_notify_enabled';
  const STORAGE_KEY_NOTIFY_TICKER = 'random_sv_notify_ticker';
  const STORAGE_KEY_NOTIFY_SOURCE = 'random_sv_notify_source';
  const STORAGE_KEY_NOTIFY_GAS_URL = 'random_sv_notify_gas_url';
  const STORAGE_KEY_NOTIFY_INTERVAL = 'random_sv_notify_interval';
  const STORAGE_KEY_NOTIFY_POS = 'random_sv_notify_pos';

  // --- 安全なストレージラッパー (GAS iframe / Safari サードパーティCookieブロック対策) ---
  const safeStorage = {
    _mem: {},
    getItem: function (key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) return val;
        }
      } catch (e) {
        // iframe / プライベートブラウズでの SecurityError を安全に握り潰す
      }
      return this._mem[key] !== undefined ? this._mem[key] : null;
    },
    setItem: function (key, value) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, String(value));
          return;
        }
      } catch (e) {}
      this._mem[key] = String(value);
    },
    removeItem: function (key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch (e) {}
      delete this._mem[key];
    }
  };

  let apiKey = safeStorage.getItem(STORAGE_KEY_API_KEY) || '';
  let intervalSeconds = parseInt(safeStorage.getItem(STORAGE_KEY_INTERVAL) || '60', 10);
  let wanderMode = safeStorage.getItem(STORAGE_KEY_WANDER_MODE) || 'wander';
  let favoritesList = [];

  // 通知機能の状態
  let notifyEnabled = safeStorage.getItem(STORAGE_KEY_NOTIFY_ENABLED) !== 'false';
  let notifyTickerEnabled = safeStorage.getItem(STORAGE_KEY_NOTIFY_TICKER) !== 'false';
  let notifySource = safeStorage.getItem(STORAGE_KEY_NOTIFY_SOURCE) || 'demo'; // 'demo' | 'gas'
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbw8Ogsccbj67RVnDV-f3aZ0UONdgH_-9bVzS8cupdmjvJXFTM9bL13u4uWDYbqCHu4wiQ/exec';
  let notifyGasUrl = safeStorage.getItem(STORAGE_KEY_NOTIFY_GAS_URL) || DEFAULT_GAS_URL;
  let notifyIntervalSeconds = parseInt(safeStorage.getItem(STORAGE_KEY_NOTIFY_INTERVAL) || '180', 10);

  let notifyData = {
    chatwork: { unread_count: 0, items: [] },
    gmail: { unread_count: 0, items: [] }
  };
  let notifyTimerId = null;
  let notifyTickerTimerId = null;
  let currentTickerItems = [];
  let currentTickerIndex = 0;
  let notifyActiveTab = 'all'; // 'all' | 'chatwork' | 'gmail'
  let lastNotifyFetchTime = null;

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

  // 通知ウィジェット DOM
  const notifyWidget = document.getElementById('notify-widget');
  const notifyCwBadge = document.getElementById('notify-cw-badge');
  const notifyGmailBadge = document.getElementById('notify-gmail-badge');
  const notifyTicker = document.getElementById('notify-ticker');
  const notifyTickerText = document.getElementById('notify-ticker-text');
  const notifySyncSpinner = document.getElementById('notify-sync-spinner');

  // 通知詳細モーダル DOM
  const notifyModal = document.getElementById('notify-modal-backdrop');
  const btnCloseNotify = document.getElementById('btn-close-notify');
  const btnRefreshNotify = document.getElementById('btn-refresh-notifications');
  const notifyModalTotalBadge = document.getElementById('notify-modal-total-badge');
  const tabBadgeAll = document.getElementById('tab-badge-all');
  const tabBadgeCw = document.getElementById('tab-badge-cw');
  const tabBadgeGmail = document.getElementById('tab-badge-gmail');
  const notifyList = document.getElementById('notify-list');
  const notifyLastUpdated = document.getElementById('notify-last-updated');
  const btnOpenNotifySettings = document.getElementById('btn-open-notify-settings');

  // 設定モーダル内の通知項目 DOM
  const checkNotifyEnabled = document.getElementById('check-notify-enabled');
  const checkNotifyTicker = document.getElementById('check-notify-ticker');
  const selectNotifySource = document.getElementById('select-notify-source');
  const settingsGasUrlGroup = document.getElementById('settings-gas-url-group');
  const inputNotifyGasUrl = document.getElementById('input-notify-gas-url');
  const btnTestGas = document.getElementById('btn-test-gas-connection');
  const btnShowGasInstructions = document.getElementById('btn-show-gas-instructions');
  const gasInstructionsCard = document.getElementById('gas-instructions-card');
  const btnCopyGasCode = document.getElementById('btn-copy-gas-code');
  const selectNotifyInterval = document.getElementById('select-notify-interval');

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

    let isDone = false;
    const handleLoaded = () => {
      if (isDone) return;
      isDone = true;
      nextImg.src = preload.src;
      nextImg.classList.add('active');
      activeImg.classList.remove('active');
      currentLayer = currentLayer === 'a' ? 'b' : 'a';
      if (onReady) setTimeout(onReady, 50);
    };

    const preload = new Image();
    preload.onload = handleLoaded;
    preload.onerror = () => {
      preload.src = loc.demoImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80';
      handleLoaded();
    };

    // タイムアウト：もし画像が500ms以内にロードされなければ強制表示して進行
    setTimeout(() => {
      if (!isDone) {
        nextImg.src = imageUrl;
        nextImg.classList.add('active');
        activeImg.classList.remove('active');
        currentLayer = currentLayer === 'a' ? 'b' : 'a';
        if (onReady) onReady();
      }
    }, 600);

    preload.src = imageUrl;
  }

  // =========================================================================
  // 7. シネマティック フェードイン/アウト トランジション
  // =========================================================================
  function transitionToLocation(loc, isDirectJump = false) {
    if (!loc) return;
    if (isTransitioning) return;
    isTransitioning = true;

    // 1. フェードアウト（画面暗転＆住所文字のフェード）
    if (sceneCurtain) sceneCurtain.classList.add('fade-out');
    const locationInfo = document.querySelector('.location-info');
    if (locationInfo) locationInfo.classList.add('fading');

    // 暗転完了タイミング（約400ms後）にコンテンツ差し替え
    setTimeout(() => {
      currentLocation = loc;

      // 国名・住所テキストの反映
      const flagPrefix = loc.flag ? `${loc.flag} ` : '';
      if (locCountry) locCountry.textContent = `${flagPrefix}${loc.country}`;
      if (locDetail) locDetail.textContent = loc.addressText || `${loc.region} ${loc.city}`;

      // お気に入り状態のUI反映
      updateFavoriteButtonsState();

      // 新しい地点の描画完了時コールバック（カーテンを開く）
      let hasRevealed = false;
      const revealScene = () => {
        if (hasRevealed) return;
        hasRevealed = true;
        setTimeout(() => {
          if (locationInfo) locationInfo.classList.remove('fading');
          if (sceneCurtain) sceneCurtain.classList.remove('fade-out');
          resetTimer();
          setTimeout(() => {
            isTransitioning = false;
          }, 400);
        }, 80);
      };

      // フェイルセーフ：画像ロードが遅れても最大800ms後には必ずカーテンを開く！
      setTimeout(() => {
        if (!hasRevealed) revealScene();
      }, 800);

      if (apiKey && apiKey.trim().length > 0) {
        if (isGoogleMapsLoaded) {
          updateInteractivePanorama(loc, revealScene, isDirectJump);
        } else {
          loadGoogleMapsScript(apiKey, () => {
            updateInteractivePanorama(loc, revealScene, isDirectJump);
          });
        }
      } else {
        if (panoContainer) panoContainer.classList.remove('active');
        loadStaticDemoImage(loc, revealScene);
      }
    }, 380);
  }

  function showNextLocation(immediate = false) {
    const loc = getNextLocation();
    if (!loc) return;

    if (immediate) {
      currentLocation = loc;
      const flagPrefix = loc.flag ? `${loc.flag} ` : '';
      if (locCountry) locCountry.textContent = `${flagPrefix}${loc.country}`;
      if (locDetail) locDetail.textContent = loc.addressText || `${loc.region} ${loc.city}`;
      updateFavoriteButtonsState();
      loadStaticDemoImage(loc);
      if (sceneCurtain) sceneCurtain.classList.remove('fade-out');
      isTransitioning = false;
      return;
    }

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
      const raw = safeStorage.getItem(STORAGE_KEY_FAVORITES);
      favoritesList = raw ? JSON.parse(raw) : [];
    } catch (e) {
      favoritesList = [];
    }
    updateFavoritesBadge();
    updateFavoriteButtonsState();
  }

  function saveFavorites() {
    try {
      safeStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favoritesList));
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

    // 通知設定の反映
    if (checkNotifyEnabled) checkNotifyEnabled.checked = notifyEnabled;
    if (checkNotifyTicker) checkNotifyTicker.checked = notifyTickerEnabled;
    if (selectNotifySource) selectNotifySource.value = notifySource;
    if (inputNotifyGasUrl) inputNotifyGasUrl.value = notifyGasUrl;
    if (selectNotifyInterval) selectNotifyInterval.value = notifyIntervalSeconds.toString();
    if (settingsGasUrlGroup) settingsGasUrlGroup.style.display = (notifySource === 'gas') ? 'block' : 'none';
    if (gasInstructionsCard) gasInstructionsCard.style.display = 'none';

    settingsModal.classList.add('open');
  }

  function closeSettingsModal() {
    settingsModal.classList.remove('open');
  }

  function saveSettings() {
    apiKey = inputApiKey.value.trim();
    intervalSeconds = parseInt(selectInterval.value, 10) || 60;
    wanderMode = selectWanderMode ? selectWanderMode.value : 'wander';

    safeStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
    safeStorage.setItem(STORAGE_KEY_INTERVAL, intervalSeconds.toString());
    safeStorage.setItem(STORAGE_KEY_WANDER_MODE, wanderMode);

    // 通知設定の保存
    if (checkNotifyEnabled) {
      notifyEnabled = checkNotifyEnabled.checked;
      safeStorage.setItem(STORAGE_KEY_NOTIFY_ENABLED, notifyEnabled ? 'true' : 'false');
      if (notifyWidget) {
        if (notifyEnabled) {
          notifyWidget.classList.remove('hidden');
        } else {
          notifyWidget.classList.add('hidden');
        }
      }
    }

    if (checkNotifyTicker) {
      notifyTickerEnabled = checkNotifyTicker.checked;
      safeStorage.setItem(STORAGE_KEY_NOTIFY_TICKER, notifyTickerEnabled ? 'true' : 'false');
    }

    if (selectNotifySource) {
      notifySource = selectNotifySource.value;
      safeStorage.setItem(STORAGE_KEY_NOTIFY_SOURCE, notifySource);
    }

    if (inputNotifyGasUrl) {
      notifyGasUrl = inputNotifyGasUrl.value.trim();
      safeStorage.setItem(STORAGE_KEY_NOTIFY_GAS_URL, notifyGasUrl);
    }

    if (selectNotifyInterval) {
      notifyIntervalSeconds = parseInt(selectNotifyInterval.value, 10) || 180;
      safeStorage.setItem(STORAGE_KEY_NOTIFY_INTERVAL, notifyIntervalSeconds.toString());
    }

    closeSettingsModal();
    resetTimer();

    // 通知ポーリングの再設定 & 即時データ更新
    startNotificationPolling();
    fetchNotificationData();

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
      safeStorage.removeItem(storageKey);
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';
      element.style.bottom = '';
      element.style.right = '';
      element.style.margin = '';
    }

    function restorePosition() {
      const saved = safeStorage.getItem(storageKey);
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
        safeStorage.setItem(storageKey, JSON.stringify({ ratioX, ratioY }));
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
  // 9. 未読通知システム (Chatwork & Gmail)
  // =========================================================================

  const DEMO_NOTIFY_DATA = {
    chatwork: {
      unread_count: 2,
      items: [
        {
          id: 'cw-1',
          room_id: '248815614',
          room_name: 'デザイン・校正共有',
          sender_name: '佐藤 健太',
          body: 'ストリートビューのUIデザイン確認しました。通知バッジが風景の邪魔にならずとても良い感じです！',
          date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          date_formatted: '15分前'
        },
        {
          id: 'cw-2',
          room_id: '123456789',
          room_name: 'プロジェクト進捗',
          sender_name: '山田 太郎',
          body: '来週の更新リスト同期について、GASの最新コードを共有いたします。',
          date: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
          date_formatted: '48分前'
        }
      ]
    },
    gmail: {
      unread_count: 2,
      items: [
        {
          id: 'gm-1',
          from: 'Google Cloud Platform',
          from_email: 'cloud-noreply@google.com',
          subject: '【重要】Maps JavaScript APIの月次クォータ使用状況レポート',
          date: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          date_formatted: '25分前',
          snippet: 'プロジェクトの利用状況レポートが準備できました。コンソールよりご確認いただけます。'
        },
        {
          id: 'gm-2',
          from: 'GitHub Notifications',
          from_email: 'notifications@github.com',
          subject: '[GitHub] あなたのリポジトリへのPull Requestが承認されました',
          date: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
          date_formatted: '1時間前',
          snippet: 'All status checks have passed. You can now merge the pull request.'
        }
      ]
    }
  };

  /**
   * 通知システム全体の初期化
   */
  function initNotificationSystem() {
    if (!notifyWidget) return;

    if (notifyEnabled) {
      notifyWidget.classList.remove('hidden');
    } else {
      notifyWidget.classList.add('hidden');
    }

    // 初回データ取得
    fetchNotificationData();

    // 定期ポーリング開始
    startNotificationPolling();
  }

  /**
   * ポーリングタイマー開始
   */
  function startNotificationPolling() {
    if (notifyTimerId) {
      clearInterval(notifyTimerId);
      notifyTimerId = null;
    }
    const intervalMs = Math.max(30, notifyIntervalSeconds) * 1000;
    notifyTimerId = setInterval(() => {
      fetchNotificationData();
    }, intervalMs);
  }

  /**
   * 未読データの取得（デモモード または GAS連携）
   */
  function fetchNotificationData(isManual = false) {
    if (!notifyEnabled && !isManual) return;

    if (notifySyncSpinner) notifySyncSpinner.style.display = 'inline-block';
    if (btnRefreshNotify) btnRefreshNotify.classList.add('rotating');

    if (notifySource === 'demo' || !notifyGasUrl) {
      // デモモード（またはURL未設定時のフォールバック）
      setTimeout(() => {
        notifyData = JSON.parse(JSON.stringify(DEMO_NOTIFY_DATA));
        lastNotifyFetchTime = new Date();
        updateNotificationUI();
        if (notifySyncSpinner) notifySyncSpinner.style.display = 'none';
        if (btnRefreshNotify) btnRefreshNotify.classList.remove('rotating');

        if (isManual) {
          showToast(notifySource === 'demo' ? 'デモ用通知データを更新しました' : 'GAS URL未設定のためデモを表示中');
        }
      }, isManual ? 400 : 100);
      return;
    }

    // A. GASのWebアプリ（HTML Service）として実行されている場合は直接サーバー関数を呼出
    if (window.google && window.google.script && window.google.script.run) {
      google.script.run
        .withSuccessHandler((json) => {
          if (json && json.status === 'success') {
            notifyData = {
              chatwork: json.chatwork || { unread_count: 0, items: [] },
              gmail: json.gmail || { unread_count: 0, items: [] }
            };
            lastNotifyFetchTime = new Date();
            updateNotificationUI();
            if (isManual) showToast('未読通知を最新に更新しました（GAS直接連携）');
          } else {
            console.warn('GAS内部エラー:', json);
            if (isManual) showToast('通知取得でエラーが発生しました');
          }
          if (notifySyncSpinner) notifySyncSpinner.style.display = 'none';
          if (btnRefreshNotify) btnRefreshNotify.classList.remove('rotating');
        })
        .withFailureHandler((err) => {
          console.warn('google.script.run 失敗:', err);
          if (isManual) showToast('GAS通信に失敗しました');
          if (notifySyncSpinner) notifySyncSpinner.style.display = 'none';
          if (btnRefreshNotify) btnRefreshNotify.classList.remove('rotating');
        })
        .getNotificationDataFromGAS();
      return;
    }

    // B. 通常のWeb環境・ローカル環境では GAS Web App 経由でデータ取得
    const requestUrl = notifyGasUrl.trim();
    fetch(requestUrl, {
      method: 'GET',
      mode: 'cors'
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (json.status === 'error') {
          throw new Error(json.message || 'GAS内部エラー');
        }
        notifyData = {
          chatwork: json.chatwork || { unread_count: 0, items: [] },
          gmail: json.gmail || { unread_count: 0, items: [] }
        };
        lastNotifyFetchTime = new Date();
        updateNotificationUI();
        if (isManual) showToast('未読通知を最新に更新しました');
      })
      .catch(err => {
        console.warn('通知データの取得に失敗しました:', err);
        if (isManual) showToast('通知取得に失敗。GAS URLを確認してください');
      })
      .finally(() => {
        if (notifySyncSpinner) notifySyncSpinner.style.display = 'none';
        if (btnRefreshNotify) btnRefreshNotify.classList.remove('rotating');
      });
  }

  /**
   * UIおよびティッカーの更新
   */
  function updateNotificationUI() {
    const cwItems = (notifyData.chatwork && notifyData.chatwork.items) || [];
    const gmailItems = (notifyData.gmail && notifyData.gmail.items) || [];
    const cwCount = notifyData.chatwork ? (notifyData.chatwork.unread_count ?? cwItems.length) : 0;
    const gmailCount = notifyData.gmail ? (notifyData.gmail.unread_count ?? gmailItems.length) : 0;
    const totalCount = cwCount + gmailCount;

    // Chatwork バッジ
    if (notifyCwBadge) {
      if (cwCount > 0) {
        notifyCwBadge.textContent = cwCount > 99 ? '99+' : cwCount;
        notifyCwBadge.style.display = 'inline-flex';
        notifyCwBadge.classList.remove('zero');
      } else {
        notifyCwBadge.textContent = '0';
        notifyCwBadge.style.display = 'none';
      }
    }

    // Gmail バッジ
    if (notifyGmailBadge) {
      if (gmailCount > 0) {
        notifyGmailBadge.textContent = gmailCount > 99 ? '99+' : gmailCount;
        notifyGmailBadge.style.display = 'inline-flex';
        notifyGmailBadge.classList.remove('zero');
      } else {
        notifyGmailBadge.textContent = '0';
        notifyGmailBadge.style.display = 'none';
      }
    }

    // モーダルの総合バッジ & タブバッジ
    if (notifyModalTotalBadge) notifyModalTotalBadge.textContent = `${totalCount}件`;
    if (tabBadgeAll) tabBadgeAll.textContent = totalCount;
    if (tabBadgeCw) tabBadgeCw.textContent = cwCount;
    if (tabBadgeGmail) tabBadgeGmail.textContent = gmailCount;

    // 最終更新日時
    if (notifyLastUpdated) {
      if (lastNotifyFetchTime) {
        const timeStr = lastNotifyFetchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sourceLabel = notifySource === 'demo' ? ' (デモ)' : '';
        notifyLastUpdated.textContent = `最終確認: ${timeStr}${sourceLabel}`;
      } else {
        notifyLastUpdated.textContent = '未取得';
      }
    }

    // ティッカー表示アイテムの構築
    currentTickerItems = [];
    cwItems.forEach(item => {
      currentTickerItems.push({
        type: 'chatwork',
        prefix: '💬',
        sender: item.sender_name || 'Chatwork',
        text: item.body || item.room_name || '新着メッセージ',
        time: item.date_formatted || ''
      });
    });

    gmailItems.forEach(item => {
      currentTickerItems.push({
        type: 'gmail',
        prefix: '✉️',
        sender: item.from || 'Gmail',
        text: item.subject || '(件名なし)',
        time: item.date_formatted || ''
      });
    });

    // ティッカー回転の開始/停止
    startTickerRotation(totalCount);

    // モーダルが開いていれば再レンダリング
    if (notifyModal && notifyModal.classList.contains('open')) {
      renderNotificationModalList();
    }
  }

  /**
   * 穏やかなティッカー（テロップ）回転
   */
  function startTickerRotation(totalCount) {
    if (notifyTickerTimerId) {
      clearInterval(notifyTickerTimerId);
      notifyTickerTimerId = null;
    }

    if (!notifyTicker || !notifyTickerText) return;

    if (!notifyTickerEnabled) {
      notifyTicker.style.display = 'none';
      return;
    }

    notifyTicker.style.display = 'flex';

    if (totalCount === 0 || currentTickerItems.length === 0) {
      notifyTickerText.textContent = '未読なし ✨';
      notifyTickerText.classList.remove('fade-out');
      return;
    }

    // 最初のアイテムを表示
    showTickerItem(currentTickerIndex % currentTickerItems.length);

    if (currentTickerItems.length > 1) {
      notifyTickerTimerId = setInterval(() => {
        currentTickerIndex = (currentTickerIndex + 1) % currentTickerItems.length;
        notifyTickerText.classList.add('fade-out');
        setTimeout(() => {
          showTickerItem(currentTickerIndex);
          notifyTickerText.classList.remove('fade-out');
          notifyTickerText.classList.add('fade-in');
          setTimeout(() => notifyTickerText.classList.remove('fade-in'), 400);
        }, 350);
      }, 4800);
    }
  }

  function showTickerItem(index) {
    if (!currentTickerItems || currentTickerItems.length === 0) return;
    const item = currentTickerItems[index];
    if (!item) return;
    notifyTickerText.textContent = `${item.prefix} ${item.sender}: ${item.text}`;
  }

  /**
   * 通知モーダルの開閉
   */
  function openNotifyModal() {
    if (!notifyModal) return;
    renderNotificationModalList();
    notifyModal.classList.add('open');
  }

  function closeNotifyModal() {
    if (!notifyModal) return;
    notifyModal.classList.remove('open');
  }

  /**
   * 通知モーダルのリストを描画
   */
  function renderNotificationModalList() {
    if (!notifyList) return;
    notifyList.innerHTML = '';

    const cwItems = (notifyData.chatwork && notifyData.chatwork.items) || [];
    const gmailItems = (notifyData.gmail && notifyData.gmail.items) || [];

    let filteredItems = [];

    if (notifyActiveTab === 'all') {
      cwItems.forEach(i => filteredItems.push({ service: 'chatwork', ...i }));
      gmailItems.forEach(i => filteredItems.push({ service: 'gmail', ...i }));
      filteredItems.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    } else if (notifyActiveTab === 'chatwork') {
      filteredItems = cwItems.map(i => ({ service: 'chatwork', ...i }));
    } else if (notifyActiveTab === 'gmail') {
      filteredItems = gmailItems.map(i => ({ service: 'gmail', ...i }));
    }

    if (filteredItems.length === 0) {
      notifyList.innerHTML = `
        <div class="notify-empty-state">
          <div class="notify-empty-icon">🌿</div>
          <div class="notify-empty-text">未読はありません</div>
          <div class="notify-empty-sub">現在確認すべき未読メッセージやメールはありません。風景をゆっくりお楽しみください。</div>
        </div>
      `;
      return;
    }

    filteredItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'notify-item';

      if (item.service === 'chatwork') {
        const timeDisplay = item.date_formatted || (item.date ? new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
        const chatworkLink = item.room_id ? `https://www.chatwork.com/#!rid${item.room_id}` : 'https://www.chatwork.com/';

        card.innerHTML = `
          <div class="notify-item-header">
            <div class="notify-item-sender-wrap">
              <span class="notify-service-tag tag-chatwork">💬 Chatwork</span>
              <span class="notify-item-sender">${escapeHtml(item.sender_name || 'Unknown')}</span>
            </div>
            <span class="notify-item-time">${escapeHtml(timeDisplay)}</span>
          </div>
          ${item.room_name ? `<div class="notify-item-room">📁 ${escapeHtml(item.room_name)}</div>` : ''}
          <div class="notify-item-body">${escapeHtml(item.body || '(本文なし)')}</div>
          <div class="notify-item-actions">
            <a href="${chatworkLink}" target="_blank" rel="noopener noreferrer" class="notify-open-btn">
              Chatworkで開く
              <svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/></svg>
            </a>
          </div>
        `;
      } else {
        // Gmail
        const timeDisplay = item.date_formatted || (item.date ? new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
        const gmailLink = 'https://mail.google.com/';

        card.innerHTML = `
          <div class="notify-item-header">
            <div class="notify-item-sender-wrap">
              <span class="notify-service-tag tag-gmail">✉️ Gmail</span>
              <span class="notify-item-sender">${escapeHtml(item.from || 'Unknown')}</span>
            </div>
            <span class="notify-item-time">${escapeHtml(timeDisplay)}</span>
          </div>
          <div class="notify-item-subject">${escapeHtml(item.subject || '(件名なし)')}</div>
          ${item.snippet ? `<div class="notify-item-body">${escapeHtml(item.snippet)}</div>` : ''}
          <div class="notify-item-actions">
            <a href="${gmailLink}" target="_blank" rel="noopener noreferrer" class="notify-open-btn">
              Gmailで開く
              <svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/></svg>
            </a>
          </div>
        `;
      }

      notifyList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 10. イベントリスナー登録
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

    // 時計ウィジェット & 場所カード & 通知ウィジェットをドラッグ可能に
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

    if (notifyWidget) {
      makeDraggable(notifyWidget, STORAGE_KEY_NOTIFY_POS, {
        onClick: (e) => {
          e.stopPropagation();
          openNotifyModal();
        }
      });
    }

    // 通知モーダルイベント
    if (btnCloseNotify) {
      btnCloseNotify.addEventListener('click', closeNotifyModal);
    }
    if (notifyModal) {
      notifyModal.addEventListener('click', (e) => {
        if (e.target === notifyModal) {
          closeNotifyModal();
        }
      });
    }
    if (btnRefreshNotify) {
      btnRefreshNotify.addEventListener('click', (e) => {
        e.stopPropagation();
        fetchNotificationData(true);
      });
    }
    if (btnOpenNotifySettings) {
      btnOpenNotifySettings.addEventListener('click', () => {
        closeNotifyModal();
        openSettingsModal();
      });
    }

    // 通知タブ切り替え
    const notifyTabBtns = document.querySelectorAll('.notify-tab-btn');
    notifyTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        notifyTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        notifyActiveTab = btn.dataset.tab || 'all';
        renderNotificationModalList();
      });
    });

    // 設定モーダル内の通知連携項目
    if (selectNotifySource && settingsGasUrlGroup) {
      selectNotifySource.addEventListener('change', () => {
        settingsGasUrlGroup.style.display = (selectNotifySource.value === 'gas') ? 'block' : 'none';
      });
    }

    if (btnShowGasInstructions && gasInstructionsCard) {
      btnShowGasInstructions.addEventListener('click', () => {
        const isHidden = gasInstructionsCard.style.display === 'none';
        gasInstructionsCard.style.display = isHidden ? 'block' : 'none';
        btnShowGasInstructions.textContent = isHidden ? '閉じる' : '❓ GAS設定手順とコード';
      });
    }

    if (btnTestGas && inputNotifyGasUrl) {
      btnTestGas.addEventListener('click', () => {
        const url = inputNotifyGasUrl.value.trim();
        if (!url) {
          showToast('GAS Web App URL を入力してください');
          return;
        }
        btnTestGas.disabled = true;
        btnTestGas.textContent = '接続中...';

        fetch(url, { method: 'GET', mode: 'cors' })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            const cwCount = (data.chatwork && data.chatwork.unread_count) || 0;
            const gmCount = (data.gmail && data.gmail.unread_count) || 0;
            showToast(`✅ 接続成功！ (Chatwork: ${cwCount}件, Gmail: ${gmCount}件)`);
          })
          .catch(err => {
            console.error('GAS接続テスト失敗:', err);
            showToast('❌ 接続に失敗しました。URLまたはデプロイ権限を確認してください');
          })
          .finally(() => {
            btnTestGas.disabled = false;
            btnTestGas.textContent = '🔗 接続テスト';
          });
      });
    }

    if (btnCopyGasCode) {
      btnCopyGasCode.addEventListener('click', () => {
        // NotificationHub.gs のコードを取得してクリップボードにコピー
        fetch('NotificationHub.gs')
          .then(res => res.text())
          .then(code => {
            navigator.clipboard.writeText(code).then(() => {
              showToast('📋 GASコードをクリップボードにコピーしました！');
            }).catch(() => {
              showToast('コピーに失敗しました。NotificationHub.gsファイルを開いてください');
            });
          })
          .catch(() => {
            showToast('NotificationHub.gs を直接エディタで開いてコピーしてください');
          });
      });
    }

    // 画面向き変更・リサイズ時の位置再計算
    window.addEventListener('resize', () => {
      draggableElements.forEach(item => {
        const saved = safeStorage.getItem(item.storageKey);
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
          const saved = safeStorage.getItem(item.storageKey);
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
    try { loadFavorites(); } catch (e) { console.warn('loadFavorites warning:', e); }
    try { initClockTicks(); } catch (e) { console.warn('initClockTicks warning:', e); }
    try { updateClock(); } catch (e) { console.warn('updateClock warning:', e); }
    try { initEvents(); } catch (e) { console.warn('initEvents warning:', e); }
    try { initNotificationSystem(); } catch (e) { console.warn('initNotificationSystem warning:', e); }

    // 最初の地点を表示（immediate=trueでカーテン待機なく即時表示）＆タイマースタート
    try {
      showNextLocation(true);
      startTimer();
    } catch (e) {
      console.error('初期地点表示エラー:', e);
    }
  }

  // DOMContentLoadedで起動
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
