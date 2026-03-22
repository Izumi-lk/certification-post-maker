function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle('スミン認証メーカー')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://drive.google.com/uc?id=1w98S6r5557INAW5JFjoWa3ccbuUfExHH&.png');
}

//ファイル分割に必要
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getLatestReplyPostIds() {
  const SHEET_NAME = 'x_posts';
  const HEADER_SAVED_AT = 'saved_at';
  const HEADER_NOTE = 'note';
  const HEADER_POST_ID = 'post_id';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`シート「${SHEET_NAME}」が見つかりません。`);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { mvPostId: '', stPostId: '' };
  }

  const headers = values[0];
  const rows = values.slice(1);

  const savedAtIdx = headers.indexOf(HEADER_SAVED_AT);
  const noteIdx = headers.indexOf(HEADER_NOTE);
  const postIdIdx = headers.indexOf(HEADER_POST_ID);

  if (savedAtIdx < 0 || noteIdx < 0 || postIdIdx < 0) {
    throw new Error('必要な列が見つかりません。saved_at / note / post_id を確認してください。');
  }

  let latestMv = null;
  let latestAu = null;

  for (const row of rows) {
    const note = String(row[noteIdx] || '').trim().toLowerCase();
    const postId = String(row[postIdIdx] || '').trim();
    const savedAtRaw = row[savedAtIdx];

    if (!postId || !savedAtRaw) continue;

    const savedAt = savedAtRaw instanceof Date ? savedAtRaw : new Date(savedAtRaw);
    if (isNaN(savedAt.getTime())) continue;

    if (note === 'mv') {
      if (!latestMv || savedAt > latestMv.savedAt) {
        latestMv = { postId, savedAt };
      }
    } else if (note === 'au') {
      if (!latestAu || savedAt > latestAu.savedAt) {
        latestAu = { postId, savedAt };
      }
    }
  }

  return {
    mvPostId: latestMv ? latestMv.postId : '',
    stPostId: latestAu ? latestAu.postId : ''
  };
}