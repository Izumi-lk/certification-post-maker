const DEFAULT_PATTERN = {
  watermarkText: '@sample',
  fontSize: 80,
  fontWeight: 80,
  fontFamily: 'Arial, sans-serif',
  textColor: '#ffffff',
  outlineColor: '#ff2b88',
  outlineWidth: 10,
  highlightEnabled: true,
  highlightColor: '#ffe4f0',
  highlightPadding: 8,
  opacity: 100,
  positionX: 0,
  positionY: 0,
  postText: '例：テキスト\n#ハッシュタグ',
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

const STORAGE_KEY = 'helper_patterns';
const SAMPLE_FILE_NAME = 'sample.png';
const SAMPLE_SRC = './sample.png';

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

  images: [],
  currentPreviewIndex: 0
};

const els = {
  patternTabs: document.querySelectorAll('.tab'),
  savePatternBtn: document.getElementById('savePatternBtn'),
  copyPostBtn: document.getElementById('copyPostBtn'),

  imageFiles: document.getElementById('imageFiles'),
  shareAllBtn: document.getElementById('shareAllBtn'),
  shareCurrentBtn: document.getElementById('shareCurrentBtn'),

  prevPreviewBtn: document.getElementById('prevPreviewBtn'),
  nextPreviewBtn: document.getElementById('nextPreviewBtn'),
  previewFileName: document.getElementById('previewFileName'),
  previewMainImg: document.getElementById('previewMainImg'),

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

  generateStatus: document.getElementById('generateStatus'),
  resultStatus: document.getElementById('resultStatus'),
  settingsStatus: document.getElementById('settingsStatus')
};

// パターンの保存・切り替え

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
  refreshTimePreview();
  schedulePreviewRerender(0);
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
  refreshTimePreview();
  setStatus(els.settingsStatus, `パターン${nextId}に切り替えました。`);
  schedulePreviewRerender(0);
}

function updatePatternTabs() {
  els.patternTabs.forEach((tab) => {
    const id = Number(tab.dataset.pattern);
    tab.classList.toggle('active', id === state.activePatternId);
  });
}

// 投稿文まわりのロジック
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

// 画像生成ロジック
// TODO 複数行・座標・透明度・背景帯対応へ拡張
function drawTextOnImage(img, text, style) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  const rawText = typeof text === 'string' ? text : '';
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return canvas.toDataURL('image/png');
  }

  ctx.save();

  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.miterLimit = 2;

  const lineHeight = style.fontSize * 1.2;
  const textWidths = lines.map((line) => ctx.measureText(line).width);
  const maxTextWidth = Math.max(...textWidths, 0);

  const blockHeight = lineHeight * lines.length;
  const blockTop = style.y - blockHeight / 2;
  const blockBottom = style.y + blockHeight / 2;

  const paddingX = style.highlightPadding;
  const paddingY = Math.max(style.highlightPadding * 0.7, style.fontSize * 0.18);
  const rectX = style.x - maxTextWidth / 2 - paddingX;
  const rectY = blockTop - paddingY;
  const rectWidth = maxTextWidth + paddingX * 2;
  const rectHeight = blockHeight + paddingY * 2;
  const rectRadius = Math.max(style.fontSize * 0.2, 10);

  ctx.globalAlpha = style.opacity;

  if (style.highlightEnabled && rectWidth > 0 && rectHeight > 0) {
    ctx.fillStyle = style.highlightColor;
    drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, rectRadius);
    ctx.fill();
  }

  ctx.strokeStyle = style.strokeStyle;
  ctx.lineWidth = style.lineWidth;
  ctx.fillStyle = style.fillStyle;

  lines.forEach((line, index) => {
    const lineY = blockTop + lineHeight * index + lineHeight / 2;

    if (style.lineWidth > 0) {
      ctx.strokeText(line, style.x, lineY);
    }

    ctx.fillText(line, style.x, lineY);
  });

  ctx.restore();

  return canvas.toDataURL('image/png');
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
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
    //opacity: Number(pattern.opacity) / 100,
    opacity: Math.max(0, Math.min(1, Number(pattern.opacity) / 100)),
    x: imageWidth / 2 + (Number(pattern.positionX) / 50) * (imageWidth / 2),
    y: imageHeight / 2 + (Number(pattern.positionY) / 50) * (imageHeight / 2)
  };
}

function resetStateImages() {
  state.images = [];
  state.currentPreviewIndex = 0;
}

//async function generateImages() {
async function generateImages(options = {}) {
  const {
    preserveIndex = false,
    silentStatus = false
  } = options;

  try {
    if (!silentStatus) {
      setStatus(els.generateStatus, '画像を生成中...');
      setStatus(els.resultStatus, '');
    }
    els.shareAllBtn.disabled = true;
    els.shareCurrentBtn.disabled = true;

    const previousIndex = state.currentPreviewIndex;
    const files = Array.from(els.imageFiles.files || []);

    if (files.length < 1 || files.length > 4) {
      resetStateImages();
      renderPreviewViewer();
      throw new Error('画像は1〜4枚選択してください。');
    }

    const pattern = readFormToPattern() || DEFAULT_PATTERN;
    const loadedImages = await Promise.all(
      files.map((file) => loadImageFromFile(file))
    );
    const timestamp = getTimestampString();

    state.images = loadedImages.map((img, index) => {
      const renderStyle = patternToRenderStyle(pattern, img.width, img.height);
      const dataUrl = drawTextOnImage(img, pattern.watermarkText, renderStyle);
      const originalFile = files[index];
      const baseName = originalFile?.name
        ? originalFile.name.replace(/\.[^.]+$/, '')
        : `${index + 1}`;
      const fileName = escapeFileName(`${timestamp}_${baseName}.png`);
      const file = dataUrlToFile(dataUrl, fileName);

      return {
        index,
        fileName,
        dataUrl,
        file
      };
    });

    state.currentPreviewIndex = preserveIndex ? previousIndex : 0;
    renderPreviewViewer();

    els.shareAllBtn.disabled = false;
    els.shareCurrentBtn.disabled = false;

    if (!silentStatus) {
      setStatus(els.generateStatus, '画像を生成しました。');
      setStatus(
        els.resultStatus,
        `生成完了\n${state.images.map((item) => item.fileName).join('\n')}`
      );
    }
  } catch (err) {
    if (!silentStatus) {
      setStatus(
        els.generateStatus,
        err.message || '画像生成に失敗しました。',
        true
      );
    }
  }
}

function getAllImages() {
  return state.images;
}

function getCurrentPreviewItem() {
  if (!state.images || state.images.length === 0) return null;
  return state.images[state.currentPreviewIndex] || null;
}

function normalizePreviewIndex() {
  if (!state.images || state.images.length === 0) {
    state.currentPreviewIndex = 0;
    return;
  }

  if (state.currentPreviewIndex < 0) {
    state.currentPreviewIndex = 0;
  }

  if (state.currentPreviewIndex > state.images.length - 1) {
    state.currentPreviewIndex = state.images.length - 1;
  }
}

function renderEmptyPreview() {
  els.previewFileName.textContent = SAMPLE_FILE_NAME;
  els.previewMainImg.src = SAMPLE_SRC;
  els.previewMainImg.alt = 'サンプル画像';
  els.prevPreviewBtn.disabled = true;
  els.nextPreviewBtn.disabled = true;
  els.shareAllBtn.disabled = true;
  els.shareCurrentBtn.disabled = true;
}

function renderPreviewViewer() {
  const images = state.images || [];

  if (!images.length) {
    renderEmptyPreview();
    return;
  }

  normalizePreviewIndex();

  const current = getCurrentPreviewItem();
  const hasMultiple = images.length > 1;

  els.previewFileName.textContent = current.fileName || `画像${state.currentPreviewIndex + 1}`;
  els.previewMainImg.src = current.dataUrl;
  els.previewMainImg.alt = `${state.currentPreviewIndex + 1}枚目のプレビュー画像`;

  els.prevPreviewBtn.disabled = !hasMultiple || state.currentPreviewIndex === 0;
  els.nextPreviewBtn.disabled = !hasMultiple || state.currentPreviewIndex === images.length - 1;
  els.shareAllBtn.disabled = false;
  els.shareCurrentBtn.disabled = false;
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

    setStatus(els.resultStatus, '共有しました。');
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

// 不要
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

//不要
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

async function shareCurrentPreview() {
  const current = getCurrentPreviewItem();

  if (!current || !current.file) {
    setStatus(els.resultStatus, '先に画像を生成してください。', true);
    return;
  }

  await shareFiles([current.file], current.fileName || 'image.png');
}

function showPrevPreview() {
  if (!state.images || state.images.length === 0) return;
  if (state.currentPreviewIndex <= 0) return;

  state.currentPreviewIndex -= 1;
  renderPreviewViewer();
}

function showNextPreview() {
  if (!state.images || state.images.length === 0) return;
  if (state.currentPreviewIndex >= state.images.length - 1) return;

  state.currentPreviewIndex += 1;
  renderPreviewViewer();
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

let rerenderTimer = null;

function hasSelectedImages() {
  return !!(els.imageFiles.files && els.imageFiles.files.length > 0);
}

function persistCurrentEditorState() {
  const pattern = readFormToPattern();
  state.patterns[state.activePatternId] = { ...DEFAULT_PATTERN, ...pattern };
  state.drafts[state.activePatternId] = pattern.postText || '';
  savePersistedState();
}

function schedulePreviewRerender(delay = 120) {
  if (!hasSelectedImages()) {
    return;
  }

  clearTimeout(rerenderTimer);
  rerenderTimer = setTimeout(async () => {
    await generateImages({ preserveIndex: true, silentStatus: true });
  }, delay);
}

async function handleImageFilesChange() {
  await generateImages();
}

function handleEditorValueChange() {
  persistCurrentEditorState();
  refreshTimePreview();
  schedulePreviewRerender();
}

function handlePostTextChange() {
  persistCurrentEditorState();
}

els.imageFiles.addEventListener('change', handleImageFilesChange);
els.imageFiles.addEventListener('click', () => {
  els.imageFiles.value = '';
});
els.shareAllBtn.addEventListener('click', shareAll);
els.shareCurrentBtn.addEventListener('click', shareCurrentPreview);
els.prevPreviewBtn.addEventListener('click', showPrevPreview);
els.nextPreviewBtn.addEventListener('click', showNextPreview);
els.copyPostBtn.addEventListener('click', copyPostAndOpenX);

els.savePatternBtn.addEventListener('click', saveCurrentPattern);
els.patternTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    switchPattern(tab.dataset.pattern);
  });
});

[
  els.watermarkText,
  els.fontSizeInput,
  els.fontWeightInput,
  els.fontFamilySelect,
  els.textColorInput,
  els.outlineColorInput,
  els.outlineWidthInput,
  els.highlightEnabledInput,
  els.highlightColorInput,
  els.highlightPaddingInput,
  els.opacityInput,
  els.positionXInput,
  els.positionYInput,
  els.includeCurrentTimeInput
].forEach((el) => {
  const eventName =
    el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'color'
      ? 'change'
      : 'input';

  el.addEventListener(eventName, handleEditorValueChange);
});

els.postText.addEventListener('input', handlePostTextChange);

window.addEventListener('load', () => {
  loadPersistedState();
  renderPreviewViewer();
});