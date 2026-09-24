/**
 * ============================================================
 * ランダム風景アプリ用 通知ハブ (NotificationHub.gs)
 * Chatwork未読メッセージ & Gmail未読メール 配信Web API
 * ============================================================
 *
 * 【機能】
 * Google Apps Script を Web アプリケーションとしてデプロイし、
 * ランダム風景アプリへ Chatwork の未読メッセージと Gmail の未読メールを
 * JSON 形式でセキュアに配信します。
 *
 * 【セットアップ手順】
 * 1. Google Drive (https://drive.google.com) を開き、「新規」>「その他」>「Google Apps Script」
 * 2. プロジェクト名を設定（例: `RandomView-NotificationHub`）
 * 3. 本スクリプトの内容をエディタに貼り付けて保存 (Ctrl+S / Cmd+S)
 * 4. Chatworkと連携する場合:
 *    - 左側の ⚙️「プロジェクトの設定」をクリック
 *    - 「スクリプト プロパティ」に以下を追加:
 *      ・ プロパティ名: `CHATWORK_API_TOKEN`
 *      ・ 値: ご自身のChatwork APIトークン
 *      （※Gmailのみ利用する場合は設定不要です）
 * 5. デプロイ:
 *    - 右上の「デプロイ」>「新しいデプロイ」をクリック
 *    - 種類の選択（歯車アイコン）>「ウェブアプリ」を選択
 *    - 次の通り設定:
 *      ・ 説明: `v1`
 *      ・ 次のユーザーとして実行: `自分`
 *      ・ アクセスできるユーザー: `全員` (重要: アプリからアクセスするため)
 *    - 「デプロイ」をクリックし、初回のみGoogleアカウントの権限を承認
 *    - 発行された「ウェブアプリのURL」をコピー
 * 6. ランダム風景アプリの画面右上 ⚙️（設定）を開き、「GAS Web App URL」に貼り付けて保存！
 */

// ============================================================
// 設定
// ============================================================
const CONFIG = {
  GMAIL_MAX_THREADS: 10,        // Gmailから取得する最大スレッド数
  GMAIL_QUERY: 'is:unread in:inbox category:primary', // Gmail検索クエリ（受信トレイの「メイン」タブの未読のみ。新着やフォーラム等を除外）
  CHATWORK_MAX_ROOMS: 15,      // 未読チェックする最大ルーム数
  CHATWORK_MAX_MSGS_PER_ROOM: 5 // 1ルームあたりの最大未読取得数
};

/**
 * Webアプリケーション リクエスト ハンドラ
 * - 通常アクセス（ブラウザ / iPhone）: ランダム風景アプリ画面（HTML）を直接配信！
 * - ?api=notify アクセス: JSON APIとして未読データを配信
 */
function doGet(e) {
  // 1. JSON APIモード（?api=notify のとき）
  if (e && e.parameter && e.parameter.api === 'notify') {
    try {
      const result = {
        status: 'success',
        timestamp: new Date().toISOString(),
        chatwork: getChatworkUnread(),
        gmail: getGmailUnread()
      };
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      const errorResult = {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error.toString(),
        chatwork: { unread_count: 0, items: [] },
        gmail: { unread_count: 0, items: [] }
      };
      return ContentService.createTextOutput(JSON.stringify(errorResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 2. ランダム風景アプリ画面（HTML）配信
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Random StreetView - 世界の街角')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * クライアント側（ブラウザのJS）から google.script.run で直接呼べる関数
 */
function getNotificationDataFromGAS() {
  try {
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      chatwork: getChatworkUnread(),
      gmail: getGmailUnread()
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.toString(),
      chatwork: { unread_count: 0, items: [] },
      gmail: { unread_count: 0, items: [] }
    };
  }
}

/**
 * Gmailの未読メールを取得（送信元・件名・日時・スニペット）
 */
function getGmailUnread() {
  const items = [];
  try {
    const threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, CONFIG.GMAIL_MAX_THREADS);
    let totalUnreadCount = 0;

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      const unreadCountInThread = thread.getMessageCount();
      const messages = thread.getMessages();

      // スレッド内の未読メッセージを走査
      for (let j = 0; j < messages.length; j++) {
        const msg = messages[j];
        if (msg.isUnread()) {
          totalUnreadCount++;

          // 送信元の整形（"山田 太郎 <yamada@example.com>" -> 名前とアドレスを抽出）
          const rawFrom = msg.getFrom() || '';
          let senderName = rawFrom;
          let senderEmail = '';
          const emailMatch = rawFrom.match(/<([^>]+)>/);
          if (emailMatch) {
            senderEmail = emailMatch[1];
            senderName = rawFrom.replace(/<[^>]+>/, '').replace(/["']/g, '').trim();
            if (!senderName) senderName = senderEmail;
          }

          items.push({
            id: msg.getId(),
            thread_id: thread.getId(),
            from: senderName,
            from_email: senderEmail,
            subject: msg.getSubject() || '(件名なし)',
            date: msg.getDate() ? msg.getDate().toISOString() : new Date().toISOString(),
            date_formatted: msg.getDate() ? Utilities.formatDate(msg.getDate(), 'Asia/Tokyo', 'MM/dd HH:mm') : '',
            snippet: (msg.getPlainBody() || '').replace(/\s+/g, ' ').slice(0, 100).trim()
          });
        }
      }
    }

    return {
      unread_count: totalUnreadCount,
      items: items.slice(0, 15) // 最大15件
    };
  } catch (err) {
    Logger.log('Gmail取得エラー: ' + err);
    return {
      unread_count: 0,
      items: [],
      error: err.toString()
    };
  }
}

/**
 * Chatworkの未読メッセージを取得
 */
function getChatworkUnread() {
  const token = PropertiesService.getScriptProperties().getProperty('CHATWORK_API_TOKEN');
  if (!token) {
    return {
      unread_count: 0,
      items: [],
      note: 'CHATWORK_API_TOKEN is not configured in Script Properties'
    };
  }

  const items = [];
  try {
    // 1. ルーム一覧を取得して未読があるルームを特定
    const roomsUrl = 'https://api.chatwork.com/v2/rooms';
    const response = UrlFetchApp.fetch(roomsUrl, {
      method: 'get',
      headers: { 'X-ChatWorkToken': token },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      return {
        unread_count: 0,
        items: [],
        error: 'Chatwork API HTTP ' + response.getResponseCode() + ': ' + response.getContentText()
      };
    }

    const rooms = JSON.parse(response.getContentText());
    let totalUnreadCount = 0;

    // 未読があるルームのみフィルタ
    const unreadRooms = rooms.filter(r => (r.unread_num && r.unread_num > 0) || (r.mention_num && r.mention_num > 0));

    for (let i = 0; i < unreadRooms.length && i < CONFIG.CHATWORK_MAX_ROOMS; i++) {
      const r = unreadRooms[i];
      totalUnreadCount += (r.unread_num || 0);

      // force=0 で未読メッセージを取得（既読にはなりません）
      try {
        const msgsUrl = 'https://api.chatwork.com/v2/rooms/' + r.room_id + '/messages?force=0';
        const msgRes = UrlFetchApp.fetch(msgsUrl, {
          method: 'get',
          headers: { 'X-ChatWorkToken': token },
          muteHttpExceptions: true
        });

        if (msgRes.getResponseCode() === 200) {
          const msgs = JSON.parse(msgRes.getContentText());
          if (Array.isArray(msgs)) {
            msgs.slice(-CONFIG.CHATWORK_MAX_MSGS_PER_ROOM).forEach(m => {
              const bodyClean = (m.body || '')
                .replace(/\[To:\d+\].*?($|\n)/g, '')
                .replace(/\[rp aid=\d+ to=\d+-\d+\].*?($|\n)/g, '')
                .replace(/\[\/?(info|title|code)\]/g, ' ')
                .replace(/\s+/g, ' ')
                .slice(0, 100)
                .trim();

              const sendTime = m.send_time ? new Date(m.send_time * 1000) : new Date();

              items.push({
                id: m.message_id,
                room_id: r.room_id,
                room_name: r.name,
                sender_name: (m.account && m.account.name) ? m.account.name : 'Unknown',
                sender_avatar: (m.account && m.account.avatar_image_url) ? m.account.avatar_image_url : '',
                body: bodyClean || '(メッセージ本文なし)',
                date: sendTime.toISOString(),
                date_formatted: Utilities.formatDate(sendTime, 'Asia/Tokyo', 'MM/dd HH:mm')
              });
            });
          }
        }
      } catch (e) {
        Logger.log('ルーム ' + r.room_id + ' のメッセージ取得エラー: ' + e);
      }
    }

    return {
      unread_count: totalUnreadCount,
      items: items.slice(0, 15) // 最大15件
    };
  } catch (err) {
    Logger.log('Chatwork取得全体エラー: ' + err);
    return {
      unread_count: 0,
      items: [],
      error: err.toString()
    };
  }
}

/**
 * 動作テスト用関数（GASエディタ内で直接実行可能）
 */
function testNotificationHub() {
  const result = doGet({});
  Logger.log(result.getContent());
}
