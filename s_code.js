const CONFIG = {
  SHEET_NAME: 'x_posts',
  TOKEN_KEY: 'API_TOKEN', // Script Properties に保存するキー名
};

/**
 * Webアプリ入口
 * ショートカットから POST される想定
 */
function doPost(e) {
  try {
    const body = parseRequestBody_(e);
    const token = body.token || '';
    const url = body.url || '';
    const note = body.note || '';

    validateToken_(token);

    if (!url) {
      return jsonResponse_({
        ok: false,
        message: 'url が空です',
      });
    }

    const info = extractXPostInfo_(url);
    if (!info.postId) {
      return jsonResponse_({
        ok: false,
        message: '投稿IDを抽出できませんでした',
        receivedUrl: url,
      });
    }

    const sheet = getSheet_();
    const savedAt = new Date();

    sheet.appendRow([
      savedAt,
      info.normalizedUrl,
      String(info.postId),
      info.username || '',
      note || ''
    ]);

    return jsonResponse_({
      ok: true,
      message: '保存しました',
      postId: String(info.postId),
      username: info.username || '',
      normalizedUrl: info.normalizedUrl,
    });

  } catch (err) {
    return jsonResponse_({
      ok: false,
      message: err.message || String(err),
    });
  }
}

/**
 * 動作確認用
 */
/**
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      message: 'web app is running',
      params: e && e.parameter ? e.parameter : {},
    }))
    .setMimeType(ContentService.MimeType.JSON);
}*/

function parseRequestBody_(e) {
  if (!e) return {};

  // application/json で来る場合
  if (e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    try {
      return JSON.parse(raw);
    } catch (jsonErr) {
      // form-urlencoded の時は parameter を使う
    }
  }

  return e.parameter || {};
}

function validateToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(CONFIG.TOKEN_KEY);
  if (!expected) {
    throw new Error('Script Properties に API_TOKEN が未設定です');
  }
  if (token !== expected) {
    throw new Error('token が不正です');
  }
}

function extractXPostInfo_(url) {
  const s = String(url).trim();

  // t.co や不要パラメータが来ても、まずURL文字列中から /status/数字 を探す
  // 例:
  // https://x.com/inu_5122/status/2029749491944018421?s=46&t=xxxx
  // https://twitter.com/inu_5122/status/2029749491944018421
  const m = s.match(/https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\?\#]+)\/status\/(\d+)/i);
  if (!m) {
    return {
      username: '',
      postId: '',
      normalizedUrl: s,
    };
  }

  const username = m[1];
  const postId = m[2];
  const normalizedUrl = `https://x.com/${username}/status/${postId}`;

  return {
    username,
    postId,
    normalizedUrl,
  };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error(`シート ${CONFIG.SHEET_NAME} が見つかりません`);
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 初期設定用
 * 1回だけ実行して Script Properties にトークンを保存
 */
function saveApiToken() {
  PropertiesService.getScriptProperties().setProperty(CONFIG.TOKEN_KEY, 'xpostsave_20260307_inu_5122');
}