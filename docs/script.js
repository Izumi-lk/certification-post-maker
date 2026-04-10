const DEFAULT_PATTERN = {
  watermarkText: '@sample',
  fontSize: 80,
  fontWeight: '400',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  lineHeight: '1.5',
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

const STORAGE_KEY = 'helper_patterns';
const SAMPLE_FILE_NAME = 'sample_light.png';
const SAMPLE_SRC = './sample_light.png';

const FONT_OPTIONS = [
  {
    value: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    label: '標準'
  },
  {
    value: '"Hiragino Maru Gothic ProN", "Arial Rounded MT Bold", sans-serif',
    label: '丸ゴ'
  },
  {
    value: '"Hiragino Sans", "Yu Gothic", Meiryo, sans-serif',
    label: '日本語標準'
  },
  {
    value: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
    label: 'インパクト'
  },
  {
    value: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    label: '韓国語向け'
  }
];

const HIGHLIGHT_COLOR_OPTIONS = [
  '#ffe4f0',
  '#ffffff',
  '#fff2b8',
  '#dff4ff',
  '#efe6ff',
  '#c8ffd8',
  'transparent',
  'custom'
];

const COMMON_COLOR_OPTIONS = [
  '#ffffff',
  '#000000',
  '#ff2b88',
  '#ffe4f0',
  '#fff2b8',
  '#dff4ff',
  '#efe6ff',
  '#c8ffd8',
  '#b9c6ff',
  'custom'
];

const LINE_HEIGHT_OPTIONS = [
  { value: '1', label: '1.0' },
  { value: '1.25', label: '1.25' },
  { value: '1.5', label: '1.5' },
  { value: '1.75', label: '1.75' },
  { value: '2', label: '2.0' }
];

const TOOLBAR_CATEGORY_CONFIG = {
  font: {
    label: 'フォント',
    subtitle: '候補から1つ選択',
    getValueText(pattern) {
      const found = FONT_OPTIONS.find((item) => item.value === pattern.fontFamily);
      return found ? found.label : '標準';
    }
  },
  textColor: {
    label: '文字色',
    subtitle: 'パレットから文字色を選択',
    getValueText(pattern) {
      return pattern.textColor || DEFAULT_PATTERN.textColor;
    }
  },
  size: {
    label: 'サイズ',
    subtitle: '文字サイズと太さを調整',
    getValueText(pattern) {
      return `${pattern.fontSize} / ${pattern.fontWeight}`;
    }
  },
  outline: {
    label: 'アウトライン',
    subtitle: '太さと色を調整',
    getValueText(pattern) {
      return `${pattern.outlineWidth} / 色`;
    }
  },
  highlight: {
    label: 'ハイライト',
    subtitle: '余白量と背景色を調整',
    getValueText(pattern) {
      return pattern.highlightEnabled ? 'ON' : 'OFF';
    }
  },
  position: {
    label: '位置',
    subtitle: 'X座標とY座標を調整',
    getValueText(pattern) {
      return `X ${pattern.positionX} / Y ${pattern.positionY}`;
    }
  },
  opacity: {
    label: '透明度',
    subtitle: '文字全体の透明度を調整',
    getValueText(pattern) {
      return `${pattern.opacity}%`;
    }
  },
  lineHeight: {
    label: '行間',
    subtitle: '複数行テキストの間隔を調整',
    getValueText(pattern) {
      return String(pattern.lineHeight);
    }
  }
};

const state = {
  activePatternId: 1,
  activeToolbarCategory: 'font',
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

let rerenderTimer = null;
let $els = {};

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function cacheElements() {
  $els = {
    patternTabs: $('.tab'),
    savePatternBtn: $('#savePatternBtn'),
    copyPostBtn: $('#copyPostBtn'),

    imageFiles: $('#imageFiles'),
    shareAllBtn: $('#shareAllBtn'),
    shareCurrentBtn: $('#shareCurrentBtn'),

    prevPreviewBtn: $('#prevPreviewBtn'),
    nextPreviewBtn: $('#nextPreviewBtn'),
    previewFileName: $('#previewFileName'),
    previewMainImg: $('#previewMainImg'),

    watermarkText: $('#watermarkText'),
    postText: $('#postText'),
    includeCurrentTimeInput: $('#includeCurrentTimeInput'),
    timePreview: $('#timePreview'),

    generateStatus: $('#generateStatus'),
    resultStatus: $('#resultStatus'),
    settingsStatus: $('#settingsStatus'),

    toolbarPanelBody: $('#toolbarPanelBody'),
    toolbarCategoryButtons: $('[data-category]'),

    toolbarTextColorCustomInput: $('#toolbarTextColorCustomInput'),
    toolbarOutlineColorCustomInput: $('#toolbarOutlineColorCustomInput'),
    toolbarHighlightColorCustomInput: $('#toolbarHighlightColorCustomInput')
  };
}

function imageFilesInput() {
  return $els.imageFiles.get(0);
}

function getActivePattern() {
  return state.patterns[state.activePatternId] || { ...DEFAULT_PATTERN };
}

function savePersistedState() {
  const payload = {
    activePatternId: state.activePatternId,
    patterns: state.patterns,
    drafts: state.drafts
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function updateActivePattern(patch) {
  state.patterns[state.activePatternId] = {
    ...DEFAULT_PATTERN,
    ...state.patterns[state.activePatternId],
    ...patch
  };
  savePersistedState();
}

function getHighlightDisplayColor(pattern) {
  return pattern.highlightEnabled ? pattern.highlightColor : 'transparent';
}

function setHighlightFromDisplayColor(color) {
  if (color === 'transparent') {
    updateActivePattern({
      highlightEnabled: false,
      highlightColor: DEFAULT_PATTERN.highlightColor
    });
    return;
  }

  updateActivePattern({
    highlightEnabled: true,
    highlightColor: color
  });
}

function updatePatternTabs() {
  $els.patternTabs.each(function () {
    const id = Number($(this).data('pattern'));
    $(this).toggleClass('active', id === state.activePatternId);
  });
}

function refreshToolbarHeader() {
  const categoryKey = state.activeToolbarCategory;
  $els.toolbarCategoryButtons.each(function () {
    $(this).toggleClass('active', $(this).data('category') === categoryKey);
  });
}

function renderFontPanel(pattern) {
  const chips = FONT_OPTIONS.map((item) => {
    const active = item.value === pattern.fontFamily ? ' active' : '';
    return `
      <button class="font-chip${active}" type="button" data-font-family="${escapeHtml(item.value)}">
        ${escapeHtml(item.label)}
      </button>
    `;
  }).join('');

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="font-row">${chips}</div>
    </div>
  `);
}

function renderTextColorPanel(pattern) {
  const chips = COMMON_COLOR_OPTIONS.map((color) => {
    if (color === 'custom') {
      return '<button class="color-chip custom" type="button" data-text-color="custom">＋</button>';
    }

    const active = color === pattern.textColor ? ' active' : '';
    return `<button class="color-chip${active}" type="button" data-text-color="${escapeHtml(color)}" style="--chip:${escapeHtml(color)};"></button>`;
  }).join('');

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">文字色</span>
        <span class="control-value" id="toolbarTextColorValue">${escapeHtml(pattern.textColor)}</span>
      </div>
      <div class="color-palette">${chips}</div>
    </div>
  `);
}

function renderSizePanel(pattern) {
  const sizeValue = Number(pattern.fontSize ?? DEFAULT_PATTERN.fontSize);
  const weightValue = Number(pattern.fontWeight ?? DEFAULT_PATTERN.fontWeight);

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">文字サイズ</span>
        <span class="control-value" id="toolbarFontSizeValue">${sizeValue}</span>
      </div>
      <input type="range" id="toolbarFontSizeSlider" min="10" max="160" step="1" value="${sizeValue}" />
      <div class="slider-labels"></div>

      <div class="control-head">
        <span class="control-label">太さ</span>
        <span class="control-value" id="toolbarFontWeightValue">${weightValue}</span>
      </div>
      <div class="segmented-row">
        <button class="segment-btn${weightValue === 400 ? ' active' : ''}" type="button" data-font-weight="400">400</button>
        <button class="segment-btn${weightValue === 700 ? ' active' : ''}" type="button" data-font-weight="700">700</button>
      </div>
    </div>
  `);
}

function renderOutlinePanel(pattern) {
  const chips = COMMON_COLOR_OPTIONS.map((color) => {
    if (color === 'custom') {
      return '<button class="color-chip custom" type="button" data-outline-color="custom">＋</button>';
    }

    const active = color === pattern.outlineColor ? ' active' : '';
    return `<button class="color-chip${active}" type="button" data-outline-color="${escapeHtml(color)}" style="--chip:${escapeHtml(color)};"></button>`;
  }).join('');

  const widthValue = Number(pattern.outlineWidth ?? DEFAULT_PATTERN.outlineWidth);

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">太さ</span>
        <span class="control-value" id="toolbarOutlineWidthValue">${widthValue}</span>
      </div>
      <input type="range" id="toolbarOutlineWidthSlider" min="0" max="40" step="1" value="${widthValue}" />
      <div class="slider-labels"></div>
      <div class="color-palette">${chips}</div>
    </div>
  `);
}

function renderHighlightPanel(pattern) {
  const paddingValue = Number(pattern.highlightPadding ?? DEFAULT_PATTERN.highlightPadding);
  const displayColor = getHighlightDisplayColor(pattern);

  const chips = HIGHLIGHT_COLOR_OPTIONS.map((color) => {
    if (color === 'custom') {
      return '<button class="color-chip custom" type="button" data-highlight-color="custom">＋</button>';
    }

    const active = color === displayColor ? ' active' : '';
    const extraClass = color === 'transparent' ? ' transparent' : '';
    const style = color === 'transparent' ? '' : ` style="--chip:${escapeHtml(color)};"`;

    return `<button class="color-chip${extraClass}${active}" type="button" data-highlight-color="${escapeHtml(color)}"${style}></button>`;
  }).join('');

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">背景余白量</span>
        <span class="control-value" id="toolbarHighlightPaddingValue">${paddingValue}</span>
      </div>
      <input type="range" id="toolbarHighlightPaddingSlider" min="0" max="30" step="1" value="${paddingValue}" />
      <div class="slider-labels"></div>
      <div class="color-palette">${chips}</div>
    </div>
  `);
}

function renderPositionPanel(pattern) {
  const xValue = Number(pattern.positionX ?? DEFAULT_PATTERN.positionX);
  const yValue = Number(pattern.positionY ?? DEFAULT_PATTERN.positionY);

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">X座標</span>
        <span class="control-value" id="toolbarPositionXValue">${xValue}</span>
      </div>
      <input type="range" id="toolbarPositionXSlider" min="-50" max="50" step="1" value="${xValue}" />
      <div class="slider-labels"></div>

      <div class="control-head">
        <span class="control-label">Y座標</span>
        <span class="control-value" id="toolbarPositionYValue">${yValue}</span>
      </div>
      <input type="range" id="toolbarPositionYSlider" min="-50" max="50" step="1" value="${yValue}" />
      <div class="slider-labels"></div>
    </div>
  `);
}

function renderOpacityPanel(pattern) {
  const value = Number(pattern.opacity ?? DEFAULT_PATTERN.opacity);

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">透明度</span>
        <span class="control-value" id="toolbarOpacityValue">${value}%</span>
      </div>
      <input type="range" id="toolbarOpacitySlider" min="0" max="100" step="1" value="${value}" />
      <div class="slider-labels"></div>
    </div>
  `);
}

function renderLineHeightPanel(pattern) {
  const current = String(pattern.lineHeight ?? DEFAULT_PATTERN.lineHeight);

  const buttons = LINE_HEIGHT_OPTIONS.map((item) => `
    <button class="segment-btn${item.value === current ? ' active' : ''}" type="button" data-line-height="${item.value}">
      ${item.label}
    </button>
  `).join('');

  $els.toolbarPanelBody.html(`
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">行間</span>
        <span class="control-value" id="toolbarLineHeightValue">${current}</span>
      </div>
      <div class="segmented-row segmented-row-5">${buttons}</div>
    </div>
  `);
}

function renderToolbarCategory() {
  const categoryKey = state.activeToolbarCategory;
  const pattern = getActivePattern();

  if (categoryKey === 'font') return renderFontPanel(pattern);
  if (categoryKey === 'textColor') return renderTextColorPanel(pattern);
  if (categoryKey === 'size') return renderSizePanel(pattern);
  if (categoryKey === 'outline') return renderOutlinePanel(pattern);
  if (categoryKey === 'highlight') return renderHighlightPanel(pattern);
  if (categoryKey === 'position') return renderPositionPanel(pattern);
  if (categoryKey === 'opacity') return renderOpacityPanel(pattern);
  if (categoryKey === 'lineHeight') return renderLineHeightPanel(pattern);

  $els.toolbarPanelBody.empty();
}

function updateToolbarUI() {
  refreshToolbarHeader();
  renderToolbarCategory();
}

function switchToolbarCategory(categoryKey) {
  if (!TOOLBAR_CATEGORY_CONFIG[categoryKey]) return;
  if (state.activeToolbarCategory === categoryKey) return;

  state.activeToolbarCategory = categoryKey;
  updateToolbarUI();
}

function applyPatternToForm(pattern) {
  const p = { ...DEFAULT_PATTERN, ...(pattern || {}) };
  $els.watermarkText.val(p.watermarkText);
  $els.postText.val(p.postText);
  $els.includeCurrentTimeInput.prop('checked', !!p.includeCurrentTime);
}

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

function refreshTimePreview() {
  const includeCurrentTime = !!$els.includeCurrentTimeInput.prop('checked');
  const currentLabel = getCurrentTimeLabel();

  $els.timePreview.text(currentLabel);
  $els.timePreview.toggleClass('is-disabled-look', !includeCurrentTime);
  $els.timePreview.attr('aria-hidden', includeCurrentTime ? 'false' : 'true');
}

function setStatus($target, text, isError = false) {
  $target.text(text || '');
  $target.css('color', isError ? '#c0392b' : '');
}

function readFormToPartialPattern() {
  return {
    watermarkText: ($els.watermarkText.val() || '').trim() || DEFAULT_PATTERN.watermarkText,
    postText: ($els.postText.val() || '').trim(),
    includeCurrentTime: !!$els.includeCurrentTimeInput.prop('checked')
  };
}

function buildPatternFromUI() {
  return {
    ...getActivePattern(),
    ...readFormToPartialPattern()
  };
}

function persistCurrentEditorState() {
  const pattern = buildPatternFromUI();
  state.patterns[state.activePatternId] = { ...DEFAULT_PATTERN, ...pattern };
  state.drafts[state.activePatternId] = pattern.postText || '';
  savePersistedState();
}

function saveCurrentPattern() {
  const pattern = buildPatternFromUI();
  state.patterns[state.activePatternId] = { ...DEFAULT_PATTERN, ...pattern };
  state.drafts[state.activePatternId] = pattern.postText || '';
  savePersistedState();
  refreshTimePreview();
  updateToolbarUI();
  $els.settingsStatus.html('<span class="ok">このパターンを保存しました。</span>');
}

function switchPattern(patternId) {
  const nextId = Number(patternId);
  if (!state.patterns[nextId]) return;

  state.patterns[state.activePatternId] = {
    ...DEFAULT_PATTERN,
    ...buildPatternFromUI()
  };
  state.drafts[state.activePatternId] = $els.postText.val() || '';

  state.activePatternId = nextId;

  applyPatternToForm(state.patterns[nextId]);
  updatePatternTabs();
  updateToolbarUI();
  savePersistedState();
  refreshTimePreview();
  setStatus($els.settingsStatus, `パターン${nextId}に切り替えました。`);

  if (hasSelectedImages()) {
    schedulePreviewRerender(0);
  } else {
    renderSamplePreview();
  }
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

async function copyPostAndOpenX() {
  const pattern = buildPatternFromUI() || DEFAULT_PATTERN;
  const finalText = buildFinalPostText(pattern);

  try {
    await navigator.clipboard.writeText(finalText);
  } catch (_) {
    // 失敗してもXは開く
  }

  window.open(buildTweetUrl(finalText), '_blank', 'noopener');
}

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
    updateToolbarUI();
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
    updateToolbarUI();
  }
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

function loadImageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('サンプル画像の読み込みに失敗しました。'));
    img.src = src;
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

  const lineHeight = style.fontSize * style.lineHeight;
  const textWidths = lines.map((line) => ctx.measureText(line).width);
  const maxTextWidth = Math.max(...textWidths, 0);

  const blockHeight = lineHeight * lines.length;
  const blockTop = style.y - blockHeight / 2;

  const paddingX = style.highlightPadding;
  const paddingY = style.highlightPadding;
  const rectX = style.x - maxTextWidth / 2 - paddingX;
  const rectY = blockTop - paddingY;
  const rectWidth = maxTextWidth + paddingX * 2;
  const rectHeight = blockHeight + paddingY * 2;
  const rectRadius = 0;

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

function patternToRenderStyle(pattern, imageWidth, imageHeight) {
  const baseWidth = 1080;
  const scale = Math.min(imageWidth, imageHeight) / baseWidth;

  return {
    fontSize: Number(pattern.fontSize) * scale,
    fontWeight: String(pattern.fontWeight),
    fontFamily: pattern.fontFamily || '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    lineHeight: Number(pattern.lineHeight) || 1.5,
    fillStyle: pattern.textColor,
    strokeStyle: pattern.outlineColor,
    lineWidth: Number(pattern.outlineWidth) * scale,
    highlightEnabled: !!pattern.highlightEnabled,
    highlightColor: pattern.highlightColor,
    highlightPadding: Number(pattern.highlightPadding || 8) * scale,
    opacity: Math.max(0, Math.min(1, Number(pattern.opacity) / 100)),
    x: imageWidth / 2 + (Number(pattern.positionX) / 50) * (imageWidth / 2),
    y: imageHeight / 2 + (Number(pattern.positionY) * (-1) / 50) * (imageHeight / 2)
  };
}

function resetStateImages() {
  state.images = [];
  state.currentPreviewIndex = 0;
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

  if (state.currentPreviewIndex < 0) state.currentPreviewIndex = 0;
  if (state.currentPreviewIndex > state.images.length - 1) {
    state.currentPreviewIndex = state.images.length - 1;
  }
}

function setButtonsDisabled(disabled) {
  $els.shareAllBtn.prop('disabled', disabled);
  $els.shareCurrentBtn.prop('disabled', disabled);
}

async function renderSamplePreview() {
  try {
    const pattern = buildPatternFromUI() || DEFAULT_PATTERN;
    const sampleImg = await loadImageFromUrl(SAMPLE_SRC);
    const renderStyle = patternToRenderStyle(pattern, sampleImg.width, sampleImg.height);
    const dataUrl = drawTextOnImage(sampleImg, pattern.watermarkText, renderStyle);

    $els.previewFileName.text(SAMPLE_FILE_NAME);
    $els.previewMainImg.attr({ src: dataUrl, alt: '文字入りサンプル画像' });
    $els.prevPreviewBtn.prop('disabled', true);
    $els.nextPreviewBtn.prop('disabled', true);
    setButtonsDisabled(true);
  } catch (err) {
    $els.previewFileName.text(SAMPLE_FILE_NAME);
    $els.previewMainImg.attr({ src: SAMPLE_SRC, alt: 'サンプル画像' });
    $els.prevPreviewBtn.prop('disabled', true);
    $els.nextPreviewBtn.prop('disabled', true);
    setButtonsDisabled(true);
  }
}

function renderEmptyPreview() {
  renderSamplePreview();
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

  $els.previewFileName.text(current.fileName || `画像${state.currentPreviewIndex + 1}`);
  $els.previewMainImg.attr({
    src: current.dataUrl,
    alt: `${state.currentPreviewIndex + 1}枚目のプレビュー画像`
  });

  $els.prevPreviewBtn.prop('disabled', !hasMultiple || state.currentPreviewIndex === 0);
  $els.nextPreviewBtn.prop('disabled', !hasMultiple || state.currentPreviewIndex === images.length - 1);
  setButtonsDisabled(false);
}

async function generateImages(options = {}) {
  const { preserveIndex = false, silentStatus = false } = options;

  try {
    if (!silentStatus) {
      setStatus($els.generateStatus, '画像を生成中...');
      setStatus($els.resultStatus, '');
    }

    setButtonsDisabled(true);

    const previousIndex = state.currentPreviewIndex;
    const files = Array.from(imageFilesInput()?.files || []);

    if (files.length < 1 || files.length > 4) {
      resetStateImages();
      renderPreviewViewer();
      throw new Error('画像は1〜4枚選択してください。');
    }

    const pattern = buildPatternFromUI() || DEFAULT_PATTERN;
    const loadedImages = await Promise.all(files.map((file) => loadImageFromFile(file)));
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

      return { index, fileName, dataUrl, file };
    });

    state.currentPreviewIndex = preserveIndex ? previousIndex : 0;
    renderPreviewViewer();

    if (!silentStatus) {
      setStatus($els.generateStatus, '画像を生成しました。');
      setStatus(
        $els.resultStatus,
        `生成完了\n${state.images.map((item) => item.fileName).join('\n')}`
      );
    }
  } catch (err) {
    if (!silentStatus) {
      setStatus($els.generateStatus, err.message || '画像生成に失敗しました。', true);
    }
  }
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

    setStatus($els.resultStatus, '共有しました。');
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);

    if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('abort')) {
      return;
    }

    setStatus($els.resultStatus, `共有に失敗しました。\n${msg}`, true);
  }
}

async function shareCurrentPreview() {
  const current = getCurrentPreviewItem();

  if (!current || !current.file) {
    setStatus($els.resultStatus, '先に画像を生成してください。', true);
    return;
  }

  await shareFiles([current.file], current.fileName || 'image.png');
}

async function shareAll() {
  const files = (getAllImages() || []).map((item) => item.file).filter(Boolean);

  if (!files.length) {
    setStatus($els.resultStatus, '先に画像を生成してください。', true);
    return;
  }

  await shareFiles(files, 'Streaming Images');
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

function hasSelectedImages() {
  const input = imageFilesInput();
  return !!(input && input.files && input.files.length > 0);
}

function schedulePreviewRerender(delay = 120) {
  if (!hasSelectedImages()) return;

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

  if (hasSelectedImages()) {
    schedulePreviewRerender();
  } else {
    renderSamplePreview();
  }
}

function handlePostTextChange() {
  persistCurrentEditorState();
}

function updatePreviewAfterToolbarChange() {
  if (hasSelectedImages()) {
    schedulePreviewRerender();
  } else {
    renderSamplePreview();
  }
}

function bindStaticEvents() {
  $els.imageFiles.on('change', handleImageFilesChange);
  $els.imageFiles.on('click', function () {
    this.value = '';
  });

  $els.shareAllBtn.on('click', shareAll);
  $els.shareCurrentBtn.on('click', shareCurrentPreview);
  $els.prevPreviewBtn.on('click', showPrevPreview);
  $els.nextPreviewBtn.on('click', showNextPreview);
  $els.copyPostBtn.on('click', copyPostAndOpenX);
  $els.savePatternBtn.on('click', saveCurrentPattern);

  $els.patternTabs.on('click', function () {
    switchPattern($(this).data('pattern'));
  });

  $els.toolbarCategoryButtons.on('click', function () {
    switchToolbarCategory($(this).data('category'));
  });

  $els.toolbarTextColorCustomInput.on('input', function () {
    const value = $(this).val();
    updateActivePattern({ textColor: value });
    refreshToolbarHeader();
    $('#toolbarTextColorValue').text(value);
    $els.toolbarPanelBody.find('[data-text-color]').removeClass('active');
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarOutlineColorCustomInput.on('input', function () {
    const value = $(this).val();
    updateActivePattern({ outlineColor: value });
    refreshToolbarHeader();
    $('#toolbarOutlineColorValue').text(value);
    $els.toolbarPanelBody.find('[data-outline-color]').removeClass('active');
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarHighlightColorCustomInput.on('input', function () {
    const value = $(this).val();
    updateActivePattern({
      highlightEnabled: true,
      highlightColor: value
    });
    refreshToolbarHeader();
    $('#toolbarHighlightColorValue').text('色あり');
    $els.toolbarPanelBody.find('[data-highlight-color]').removeClass('active');
    updatePreviewAfterToolbarChange();
  });

  [
    $els.watermarkText,
    $els.includeCurrentTimeInput
  ].forEach(($el) => {
    if (!$el || $el.length === 0) return;
    const el = $el.get(0);
    const eventName =
      el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'color'
        ? 'change'
        : 'input';

    $el.on(eventName, handleEditorValueChange);
  });

  $els.postText.on('input', handlePostTextChange);
}

function bindDynamicToolbarEvents() {
  $els.toolbarPanelBody.on('click', '[data-font-family]', function () {
    const fontFamily = $(this).data('font-family');
    updateActivePattern({ fontFamily });
    refreshToolbarHeader();
    $els.toolbarPanelBody.find('[data-font-family]').removeClass('active');
    $(this).addClass('active');
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('click', '[data-text-color]', function () {
    const value = $(this).data('text-color');

    if (value === 'custom') {
      $els.toolbarTextColorCustomInput.val(getActivePattern().textColor || DEFAULT_PATTERN.textColor).trigger('click');
      return;
    }

    updateActivePattern({ textColor: value });
    refreshToolbarHeader();
    $('#toolbarTextColorValue').text(value);
    $els.toolbarPanelBody.find('[data-text-color]').removeClass('active');
    $(this).addClass('active');
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('input', '#toolbarFontSizeSlider', function () {
    const value = Number($(this).val());
    updateActivePattern({ fontSize: value });
    refreshToolbarHeader();
    $('#toolbarFontSizeValue').text(String(value));
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('click', '[data-font-weight]', function () {
    const value = Number($(this).data('font-weight'));
    updateActivePattern({ fontWeight: value });
    refreshToolbarHeader();
    $('#toolbarFontWeightValue').text(String(value));
    $els.toolbarPanelBody.find('[data-font-weight]').removeClass('active');
    $(this).addClass('active');
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('input', '#toolbarOutlineWidthSlider', function () {
    const value = Number($(this).val());
    updateActivePattern({ outlineWidth: value });
    refreshToolbarHeader();
    $('#toolbarOutlineWidthValue').text(String(value));
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('click', '[data-outline-color]', function () {
    const value = $(this).data('outline-color');

    if (value === 'custom') {
      $els.toolbarOutlineColorCustomInput.val(getActivePattern().outlineColor || DEFAULT_PATTERN.outlineColor).trigger('click');
      return;
    }

    updateActivePattern({ outlineColor: value });
    refreshToolbarHeader();
    $els.toolbarPanelBody.find('[data-outline-color]').removeClass('active');
    $(this).addClass('active');
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('input', '#toolbarHighlightPaddingSlider', function () {
    const value = Number($(this).val());
    updateActivePattern({ highlightPadding: value });
    refreshToolbarHeader();
    $('#toolbarHighlightPaddingValue').text(String(value));
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('click', '[data-highlight-color]', function () {
    const value = $(this).data('highlight-color');

    if (value === 'custom') {
      $els.toolbarHighlightColorCustomInput.val(getActivePattern().highlightColor || DEFAULT_PATTERN.highlightColor).trigger('click');
      return;
    }

    setHighlightFromDisplayColor(value);
    refreshToolbarHeader();
    $els.toolbarPanelBody.find('[data-highlight-color]').removeClass('active');
    $(this).addClass('active');
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('input', '#toolbarPositionXSlider', function () {
    const value = Number($(this).val());
    updateActivePattern({ positionX: value });
    refreshToolbarHeader();
    $('#toolbarPositionXValue').text(String(value));
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('input', '#toolbarPositionYSlider', function () {
    const value = Number($(this).val());
    updateActivePattern({ positionY: value });
    refreshToolbarHeader();
    $('#toolbarPositionYValue').text(String(value));
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('input', '#toolbarOpacitySlider', function () {
    const value = Number($(this).val());
    updateActivePattern({ opacity: value });
    refreshToolbarHeader();
    $('#toolbarOpacityValue').text(`${value}%`);
    updatePreviewAfterToolbarChange();
  });

  $els.toolbarPanelBody.on('click', '[data-line-height]', function () {
    const value = $(this).data('line-height');
    updateActivePattern({ lineHeight: value });
    refreshToolbarHeader();
    $('#toolbarLineHeightValue').text(value);
    $els.toolbarPanelBody.find('[data-line-height]').removeClass('active');
    $(this).addClass('active');
    updatePreviewAfterToolbarChange();
  });
}

$(function () {
  cacheElements();
  bindStaticEvents();
  bindDynamicToolbarEvents();
  loadPersistedState();
  updateToolbarUI();
  renderPreviewViewer();
});