const DEFAULT_PATTERN = {
  watermarkText: '@inu_5122',
  fontSize: 80,
  fontWeight: 800,
  fontFamily: 'Arial, sans-serif',
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

const STORAGE_KEY = 'mv_helper_patterns_v2';

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
  highlightPaddingInput: document.getElementById('highlightPaddingInput'),
  highlightColorInput: document.getElementById('highlightColorInput'),
  opacityInput: document.getElementById('opacityInput'),
  positionXInput: document.getElementById('positionXInput'),
  positionYInput: document.getElementById('positionYInput'),
  postText: document.getElementById('postText'),
  includeCurrentTimeInput: document.getElementById('includeCurrentTimeInput'),
  timePreview: document.getElementById('timePreview'),

  previewGrid: document.getElementById('previewGrid'),

  generateStatus: document.getElementById('generateStatus'),
  resultStatus: document.getElementById('resultStatus'),
  settingsStatus: document.getElementById('settingsStatus')
};

function saveSettings() {
  saveCurrentPattern();
/*
  const settings = {
    watermarkText: (els.watermarkText.value || '').trim() || DEFAULT_PATTERN.watermarkText
  };

  refreshPostTexts();
  els.settingsStatus.innerHTML = '<span class="ok">設定を保存しました。</span>';
  */
}

// 3-6. saveSettings / loadSettings / applySettings を作り直す

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      applyPatternToForm(state.patterns[state.activePatternId]);
      updatePatternTabs();
      refreshTimePreview();
      return;
    }

    const saved = JSON.parse(raw);

    if (saved && saved.patterns) {
      state.patterns = {
        1: { ...DEFAULT_PATTERN, ...(saved.patterns[1] || saved.patterns['1'] || {}) },
        2: { ...DEFAULT_PATTERN, ...(saved.patterns[2] || saved.patterns['2'] || {}) },
        3: { ...DEFAULT_PATTERN, ...(saved.patterns[3] || saved.patterns['3'] || {}) }
      };
    }

    if (saved && saved.drafts) {
      state.drafts = {
        1: saved.drafts[1] || saved.drafts['1'] || null,
        2: saved.drafts[2] || saved.drafts['2'] || null,
        3: saved.drafts[3] || saved.drafts['3'] || null
      };
    }

    if (saved && saved.activePatternId) {
      state.activePatternId = Number(saved.activePatternId) || 1;
    }

    applyPatternToForm(state.patterns[state.activePatternId]);
    updatePatternTabs();
    refreshTimePreview();
  } catch (e) {
    state.activePatternId = 1;
    state.patterns = {
      1: { ...DEFAULT_PATTERN },
      2: { ...DEFAULT_PATTERN },
      3: { ...DEFAULT_PATTERN }
    };
    state.drafts = {
      1: null,
      2: null,
      3: null
    };
    applyPatternToForm(state.patterns[1]);
    updatePatternTabs();
    //refreshPostTexts();
    refreshTimePreview();
  }
}

function savePersistedState() {
  const payload = {
    activePatternId: state.activePatternId,
    patterns: state.patterns,
    drafts: state.drafts
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function getCurrentDraft() {
  return state.drafts[state.activePatternId];
}

function readFormToPattern() {
  return {
    watermarkText: (els.watermarkText.value || '').trim() || DEFAULT_PATTERN.watermarkText,
    fontSize: Number(els.fontSizeInput.value) || DEFAULT_PATTERN.fontSize,
    fontWeight: Number(els.fontWeightInput.value) || DEFAULT_PATTERN.fontWeight,
    fontFamily: els.fontFamilySelect.value || DEFAULT_PATTERN.fontFamily,
    textColor: els.textColorInput.value || DEFAULT_PATTERN.textColor,
    outlineColor: els.outlineColorInput.value || DEFAULT_PATTERN.outlineColor,
    outlineWidth: Number(els.outlineWidthInput.value) || 0,
    highlightEnabled: !!els.highlightEnabledInput.checked,
    highlightColor: els.highlightColorInput.value || DEFAULT_PATTERN.highlightColor,
    highlightPadding: Number(els.highlightPaddingInput.value) || DEFAULT_PATTERN.highlightPadding,
    opacity: Number(els.opacityInput.value) || DEFAULT_PATTERN.opacity,
    positionX: Number(els.positionXInput.value) || 0,
    positionY: Number(els.positionYInput.value) || 0,
    postText: (els.postText.value || '').trim(),
    includeCurrentTime: !!els.includeCurrentTimeInput.checked
  };
}

function applyPatternToForm(pattern) {
  const p = { ...DEFAULT_PATTERN, ...(pattern || {}) };

  els.watermarkText.value = p.watermarkText;
  els.fontSizeInput.value = p.fontSize;
  els.fontWeightInput.value = p.fontWeight;
  els.fontFamilySelect.value = p.fontFamily;
  els.textColorInput.value = p.textColor;
  els.outlineColorInput.value = p.outlineColor;
  els.outlineWidthInput.value = p.outlineWidth;
  els.highlightEnabledInput.checked = !!p.highlightEnabled;
  els.highlightColorInput.value = p.highlightColor;
  els.highlightPaddingInput.value = p.highlightPadding;
  els.opacityInput.value = p.opacity;
  els.positionXInput.value = p.positionX;
  els.positionYInput.value = p.positionY;
  els.postText.value = p.postText;
  els.includeCurrentTimeInput.checked = !!p.includeCurrentTime;
}

function saveCurrentPattern() {
  const pattern = readFormToPattern();
  state.patterns[state.activePatternId] = { ...DEFAULT_PATTERN, ...pattern };
  state.drafts[state.activePatternId] = pattern.postText || '';
  savePersistedState();
  //refreshPostTexts();
  refreshTimePreview();
  els.settingsStatus.innerHTML = '<span class="ok">このパターンを保存しました。</span>';
}

function switchPattern(patternId) {
  const nextId = Number(patternId);
  if (!state.patterns[nextId]) return;

  // 切り替え前の編集中内容を保持
  state.patterns[state.activePatternId] = {
    ...DEFAULT_PATTERN,
    ...readFormToPattern()
  };
  state.drafts[state.activePatternId] = els.postText.value || '';

  state.activePatternId = nextId;

  applyPatternToForm(state.patterns[nextId]);
  updatePatternTabs();
  savePersistedState();
  //refreshPostTexts();
  refreshTimePreview();
  setStatus(els.settingsStatus, `パターン${nextId}に切り替えました。`);
}

function updatePatternTabs() {
  els.patternTabs.forEach((tab) => {
    const id = Number(tab.dataset.pattern);
    tab.classList.toggle('active', id === state.activePatternId);
  });
}

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

  if (pattern.includeCurrentTime) {
    parts.push(getCurrentTimeLabel());
  }

  const text = (pattern.postText || '').trim();
  if (text) parts.push(text);

  return parts.join('\n');
}

function refreshPostTexts() {
  const pattern = readFormToPattern() || DEFAULT_PATTERN;
  const finalText = buildFinalPostText(pattern);
  els.postText.value = finalText;
}

/*
function refreshTimePreview() {
  const includeCurrentTime = !!els.includeCurrentTimeInput.checked;

  if (!includeCurrentTime) {
    els.timePreview.textContent = '';
    els.timePreview.classList.add('is-hidden');
    return;
  }

  els.timePreview.textContent = getCurrentTimeLabel();
  els.timePreview.classList.remove('is-hidden');
}
*/
function refreshTimePreview() {
  const includeCurrentTime = !!els.includeCurrentTimeInput.checked;
  const currentLabel = getCurrentTimeLabel();

  els.timePreview.textContent = currentLabel;

  if (includeCurrentTime) {
    els.timePreview.classList.remove('is-disabled-look');
    els.timePreview.setAttribute('aria-hidden', 'false');
  } else {
    els.timePreview.classList.add('is-disabled-look');
    els.timePreview.setAttribute('aria-hidden', 'true');
  }
}

async function copyPostAndOpenX() {
  const pattern = readFormToPattern() || DEFAULT_PATTERN;
  const finalText = buildFinalPostText(pattern);

  try {
    await navigator.clipboard.writeText(finalText);
  } catch (_) {
    // 失敗してもXは開く
  }

  window.open(buildTweetUrl(finalText), '_blank', 'noopener');
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
  loadPersistedState();
}

function applySettings(settings) {
  applyPatternToForm(settings);
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
      `生成完了\n${images.map(item => item.fileName).join('\n')}` //TODO ファイル名表示いらないかも
    );
  } catch (err) {
    setStatus(els.generateStatus, err.message || '画像生成に失敗しました。', true);
  }
}

function getAllImages() {
  return state.images;
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
els.copyPostBtn.addEventListener('click', copyPostAndOpenX);

els.savePatternBtn.addEventListener('click', saveCurrentPattern);
els.patternTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    switchPattern(tab.dataset.pattern);
  });
});

/*
els.watermarkText.addEventListener('input', saveSettings);
els.fontSizeInput.addEventListener('input', saveSettings);
els.fontWeightInput.addEventListener('input', saveSettings);
els.fontFamilySelect.addEventListener('change', saveSettings);
*/

//els.mvPostText.addEventListener('input', updatePostLinks);
//els.stPostText.addEventListener('input', updatePostLinks);
//els.xIdInput.addEventListener('input', saveSettings);
//els.includeCurrentTimeInput.addEventListener('change', syncTimeLabelInPostText);

els.includeCurrentTimeInput.addEventListener('change', () => {
  refreshTimePreview();
  //saveDraftState();
});

window.addEventListener('load', () => {
  loadPersistedState();
});