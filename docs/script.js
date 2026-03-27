const DEFAULT_PATTERN = {
  watermarkText: '@inu_5122',
  fontSize: 80,
  fontWeight: 800,
  fontFamily: 'Arial, sans-serifault',
  textColor: '#ffffff',
  outlineColor: '#ff2b88',
  outlineWidth: 2,
  highlightEnabled: true,
  highlightColor: '#ffe4f0',
  highlightPadding: 8,
  opacity: 100,
  positionX: 0,
  positionY: 0,
  postText: 'テストテキスト\n#내가_살아있다는_증거_MV_스트리밍',
  includeCurrentTime: true
};

/*const AU_STYLE = {
  fontSize: 80,
  fontWeight: '600',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  offsetX: 0,
  offsetY: 0,
  lineWidth: 26,
  strokeStyle: '#f7bacf',
  fillStyle: '#ffffff',
  shadowColor: 'rgba(0,0,0,0)',
  shadowBlur: 0
};*/

const state = {
  activePatternId: 1,

  patterns: {
    1: { ...DEFAULT_PATTERN },
    2: { ...DEFAULT_PATTERN },
    3: { ...DEFAULT_PATTERN }
  },

  drafts: {
    1: null,
    2: null,
    3: null
  },

  images: [] // 最大4件
};

const els = {
  imageFiles: document.getElementById('imageFiles'),
  generateBtn: document.getElementById('generateBtn'),
  shareAllBtn: document.getElementById('shareAllBtn'),
  mvActionStatus: document.getElementById('mvActionStatus'),
  stActionStatus: document.getElementById('stActionStatus'),
  generateStatus: document.getElementById('generateStatus'),
  resultStatus: document.getElementById('resultStatus'),
  settingsStatus: document.getElementById('settingsStatus'),

  //新規追加
  patternTabs: document.querySelectorAll('.tab'),
  savePatternBtn: document.getElementById('savePatternBtn'),
  copyPostBtn: document.getElementById('copyPostBtn'),

  imageFiles: document.getElementById('imageFiles'),
  generateBtn: document.getElementById('generateBtn'),
  shareAllBtn: document.getElementById('shareAllBtn'),

  watermarkText: document.getElementById('watermarkText'),
  fontSizeInput: document.getElementById('fontSizeInput'),
  fontWeightInput: document.getElementById('fontWeightInput'),
  fontFamilySelect: document.getElementById('fontFamilySelect'),
  textColorInput: document.getElementById('textColorInput'),
  outlineColorInput: document.getElementById('outlineColorInput'),
  outlineWidthInput: document.getElementById('outlineWidthInput'),
  highlightEnabledInput: document.getElementById('highlightEnabledInput'),
  highlightColorInput: document.getElementById('highlightColorInput'),
  opacityInput: document.getElementById('opacityInput'),
  positionXInput: document.getElementById('positionXInput'),
  positionYInput: document.getElementById('positionYInput'),
  postText: document.getElementById('postText'),
  includeCurrentTimeInput: document.getElementById('includeCurrentTimeInput'),

  previewGrid: document.getElementById('previewGrid'),

  generateStatus: document.getElementById('generateStatus'),
  resultStatus: document.getElementById('resultStatus'),
  settingsStatus: document.getElementById('settingsStatus')
};

function saveSettings() {
  const settings = {
    watermarkText: (els.watermarkText.value || '').trim() || DEFAULT_PATTERN.watermarkText
  };

  const STORAGE_KEY = 'mv_helper_patterns_v2';
  refreshPostTexts();
  els.settingsStatus.innerHTML = '<span class="ok">設定を保存しました。</span>';
}

// 3-6. saveSettings / loadSettings / applySettings を作り直す

function loadPersistedState() { }
function savePersistedState() { }
function getCurrentDraft() { }
function readFormToPattern() { }
function applyPatternToForm(pattern) { }
function saveCurrentPattern() { }
function switchPattern(patternId) { }

// 3-7. 投稿文まわりを再設計

//refreshPostTexts()
//updatePostLinks()

function getCurrentTimeLabel() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour24 = now.getHours();

  const suffix = hour24 < 12 ? 'am' : 'pm';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  return `${month}/${day} ${hour12}${suffix}`;
}

function buildFinalPostText(pattern) {
  const parts = [];

  if (/*pattern.includeCurrentTime*/ true) { //TODO readFormToPattern() の作成後
    parts.push(getCurrentTimeLabel());
  }

  const text = (pattern.postText || '').trim();
  if (text) parts.push(text);

  return parts.join('\n');
}

function refreshPostTexts() {
  console.log('refreshPostTexts');
  const pattern = readFormToPattern() || DEFAULT_PATTERN;
  const finalText = buildFinalPostText(pattern);
  els.postText.value = finalText;
}

function copyPostAndOpenX() {
  const pattern = readFormToPattern() || DEFAULT_PATTERN;
  const finalText = buildFinalPostText(pattern);

  navigator.clipboard.writeText(finalText).catch(() => { });
  window.open(buildTweetUrl(finalText), '_blank'/*, 'noopener'*/);
}

// 3-8. 「チェックONなら投稿文欄に時刻文字列を含める」処理

function syncTimeLabelInPostText() {
  const checked = els.includeCurrentTimeInput.checked;
  const currentValue = els.postText.value || '';
  const lines = currentValue.split('\n');
  const timeLabel = getCurrentTimeLabel();

  const firstLine = lines[0]?.trim();
  const looksLikeTime = /^\d{1,2}\/\d{1,2}\s+\d{1,2}(am|pm)$/i.test(firstLine);

  if (checked) {
    if (!looksLikeTime) {
      els.postText.value = currentValue.trim()
        ? `${timeLabel}\n${currentValue}`
        : timeLabel;
    } else {
      lines[0] = timeLabel;
      els.postText.value = lines.join('\n');
    }
  } else {
    if (looksLikeTime) {
      els.postText.value = lines.slice(1).join('\n');
    }
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('mv_helper_settings');
    if (!raw) {
      applySettings(DEFAULT_PATTERN);
      return;
    }

    const saved = JSON.parse(raw);
    applySettings({
      watermarkText: saved.watermarkText || DEFAULT_PATTERN.watermarkText
    });
  } catch (e) {
    applySettings(DEFAULT_PATTERN);
  }
}

function applySettings(settings) {
  els.watermarkText.value = settings.watermarkText || DEFAULT_PATTERN.watermarkText;
  refreshPostTexts();
  //updatePostLinks();
}

function setStatus(target, text, isError = false) {
  target.textContent = text || '';
  target.style.color = isError ? '#c0392b' : '';
}

function escapeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}

function getTimestampString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${mi}`;
}


function buildTweetUrl(text) {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text || '')}`;
}


function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('画像ファイルが選択されていません。'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl, filename) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// 3-11. drawCenteredTextOnImage を複数行・座標・透明度・背景帯対応へ拡張
function drawTextOnImage(img, text, style) {
  // 複数行
  // outlineWidth = 0 のとき stroke しない
  // highlightEnabled のとき背景帯を描画
  // opacity を rgba / globalAlpha に反映
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const x = style.x;
  const y = style.y;

  ctx.shadowColor = style.shadowColor;
  ctx.shadowBlur = style.shadowBlur;

  ctx.lineWidth = style.lineWidth;
  ctx.strokeStyle = style.strokeStyle;
  ctx.strokeText(text, x, y);

  ctx.fillStyle = style.fillStyle;
  ctx.fillText(text, x, y);

  return canvas.toDataURL('image/png');
}

function patternToRenderStyle(pattern, imageWidth, imageHeight) {
  const baseWidth = 1080;
  const scale = imageWidth / baseWidth;
  console.log('patternToRenderStyle', { imageWidth, imageHeight, scale });
  console.log('fontSize ', Number(pattern.fontSize) * scale);
  return {
    fontSize: Number(pattern.fontSize) * scale,
    fontWeight: String(pattern.fontWeight),
    fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif', // resolveFontFamily(pattern.fontFamily), 
    // TODO readFormToPattern() の作成後
    fillStyle: pattern.textColor,
    strokeStyle: pattern.outlineColor,
    lineWidth: Number(pattern.outlineWidth) * scale,
    highlightEnabled: !!pattern.highlightEnabled,
    highlightColor: pattern.highlightColor,
    highlightPadding: Number(pattern.highlightPadding || 8) * scale,
    opacity: Number(pattern.opacity) / 100,
    x: imageWidth / 2 + (Number(pattern.positionX) / 50) * (imageWidth / 2),
    y: imageHeight / 2 + (Number(pattern.positionY) / 50) * (imageHeight / 2)
  };
}

// 不要
function drawCenteredTextOnImage(img, text, style) { }

function resetStateImages() {
  state.image1 = null;
  state.image2 = null;
  state.image3 = null;
  state.image4 = null;
}

async function generateImages() {
  try {
    setStatus(els.generateStatus, '画像を生成中...');
    setStatus(els.resultStatus, '');
    els.shareAllBtn.disabled = true;
    els.previewGrid.innerHTML = '';
    resetStateImages();

    const files = Array.from(els.imageFiles.files || []);

    // 3-9. 画像生成ロジックを 1〜4枚対応に変更
    if (files.length < 1 || files.length > 4) {
      throw new Error('画像は1〜4枚選択してください。');
    }

    const pattern = readFormToPattern() || DEFAULT_PATTERN;
    const loadedImages = await Promise.all(
      files.map(file => loadImageFromFile(file))
    );
    const timestamp = getTimestampString();

    // 加工済み画像を配列で作る
    state.images = loadedImages.map((img, index) => {
      const renderStyle = patternToRenderStyle(pattern, img.width, img.height);
      const dataUrl = drawTextOnImage(img, pattern.watermarkText, renderStyle);
      const fileName = escapeFileName(`${timestamp}_${index + 1}.png`);
      const file = dataUrlToFile(dataUrl, fileName);

      return {
        index,
        fileName,
        dataUrl,
        file
      };
    });

    renderPreview();
    els.shareAllBtn.disabled = false;
    els.imageFiles.value = '';

    const images = getAllImages();
    setStatus(els.generateStatus, '画像を生成しました。');
    setStatus(
      els.resultStatus,
      `生成完了\n${images.map(item => item.name).join('\n')}`
    );
  } catch (err) {
    setStatus(els.generateStatus, err.message || '画像生成に失敗しました。', true);
  }
}

function getAllImages() {
  return state.images;
}

async function copyMvPostText() {
  try {
    refreshPostTexts();
    await navigator.clipboard.writeText(els.mvPostText.value);
    setStatus(els.mvActionStatus, 'MV投稿文をコピーしました。');
    return true;
  } catch (err) {
    setStatus(els.mvActionStatus, 'コピーに失敗しました。手動でテキストを選択してください。', true);
    return false;
  }
}

async function copyStPostText() {
  try {
    refreshPostTexts();
    await navigator.clipboard.writeText(els.stPostText.value);
    setStatus(els.stActionStatus, '音源投稿文をコピーしました。');
    return true;
  } catch (err) {
    setStatus(els.stActionStatus, 'コピーに失敗しました。手動でテキストを選択してください。', true);
    return false;
  }
}

function bindCopyAndOpen(linkEl, copyFn, statusEl, label) {
  linkEl.addEventListener('click', async (event) => {
    if (!linkEl.href || linkEl.href === '#') {
      event.preventDefault();
      setStatus(statusEl, `${label}の返信先投稿IDを入力してください。`, true);
      return;
    }

    const ok = await copyFn();
    if (!ok) {
      // コピー失敗時は遷移を止める
      event.preventDefault();
      return;
    }
    // preventDefault はしない
    // 実リンクのタップ遷移をそのまま生かす
  });
}

async function shareFiles(files, titleText) {
  try {
    if (!files || files.length === 0) {
      throw new Error('共有する画像がありません。');
    }

    if (!navigator.share) {
      throw new Error('このブラウザではファイル共有に対応していません。');
    }

    await navigator.share({
      files,
      title: titleText,
      text: '画像を保存または共有してください。'
    });

    setStatus(els.resultStatus, '共有シートを開きました。');
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);

    if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('abort')) {
      return;
    }

    setStatus(
      els.resultStatus,
      `共有に失敗しました。\n${msg}`,
      true
    );
  }
}

function createPreviewBox(item, labelPrefix) {
  const box = document.createElement('div');
  box.className = 'preview-box';

  const head = document.createElement('div');
  head.className = 'preview-head';
  head.textContent = `${labelPrefix}（生成後）`;

  const img = document.createElement('img');
  img.className = 'preview-img';
  img.src = item.dataUrl;
  img.alt = `${labelPrefix}のプレビュー`;

  const actions = document.createElement('div');
  actions.className = 'preview-actions';

  const btn = document.createElement('button');
  btn.className = 'mini-btn';
  btn.type = 'button';
  btn.textContent = 'この画像を保存 / 共有';
  btn.addEventListener('click', async () => {
    await shareFiles([item.file], item.name);
  });

  actions.appendChild(btn);
  box.appendChild(head);
  box.appendChild(img);
  box.appendChild(actions);

  return box;
}

function renderPreview() {
  els.previewGrid.innerHTML = '';

  state.images.forEach((item, index) => {
    const box = document.createElement('div');
    box.className = 'preview-box';
    box.innerHTML = `
      <div class="preview-head">画像${index + 1}</div>
      <img class="preview-img" src="${item.dataUrl}" alt="画像${index + 1}">
      <div class="preview-actions">
        <button class="mini-btn" id="shareBtn${index}" type="button">この画像を保存 / 共有</button>
      </div>
    `;
    els.previewGrid.appendChild(box);
    document.getElementById(`shareBtn${index}`).addEventListener('click', async () => {
      await shareFiles([item.file], item.fileName);
    });
  });
}

function renderMvPreviewList() {
  els.previewGrid.innerHTML = '';
  const images = getMvImages();

  images.forEach((item, index) => {
    const label = `画像 ${index + 1}`;
    els.previewGrid.appendChild(createPreviewBox(item, label));
  });
}

async function shareAll() {
  const files = (state.images || [])
    .map(item => item.file)
    .filter(Boolean);

  if (!files.length) {
    setStatus(els.resultStatus, '先に画像を生成してください。', true);
    return;
  }

  await shareFiles(files, 'Streaming Images');
}

els.generateBtn.addEventListener('click', generateImages);
els.shareAllBtn.addEventListener('click', shareAll);

//els.mvPostText.addEventListener('input', updatePostLinks);
//els.stPostText.addEventListener('input', updatePostLinks);
//els.xIdInput.addEventListener('input', saveSettings);

els.includeCurrentTimeInput.addEventListener('change', syncTimeLabelInPostText);

//bindCopyAndOpen(els.mvActionLink, copyMvPostText, els.mvActionStatus, 'MV');
//bindCopyAndOpen(els.stActionLink, copyStPostText, els.stActionStatus, '音源');

window.addEventListener('load', () => {
  loadSettings();
  refreshPostTexts();
  //updatePostLinks();
  //loadLatestReplyPostIds();
});
