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
  // fontSizeInput: document.getElementById('fontSizeInput'),
  fontWeightInput: document.getElementById('fontWeightInput'),
  fontFamilySelect: document.getElementById('fontFamilySelect'),
  lineHeightSelect: document.getElementById('lineHeightSelect'),
  textColorInput: document.getElementById('textColorInput'),
  outlineColorInput: document.getElementById('outlineColorInput'),
  // outlineWidthInput: document.getElementById('outlineWidthInput'),
  highlightEnabledInput: document.getElementById('highlightEnabledInput'),
  // highlightPaddingInput: document.getElementById('highlightPaddingInput'),
  highlightColorInput: document.getElementById('highlightColorInput'),
  // opacityInput: document.getElementById('opacityInput'),
  // positionXInput: document.getElementById('positionXInput'),
  // positionYInput: document.getElementById('positionYInput'),
  postText: document.getElementById('postText'),
  includeCurrentTimeInput: document.getElementById('includeCurrentTimeInput'),
  timePreview: document.getElementById('timePreview'),

  generateStatus: document.getElementById('generateStatus'),
  resultStatus: document.getElementById('resultStatus'),
  settingsStatus: document.getElementById('settingsStatus'),

  toolbarPanelTitle: document.getElementById('toolbarPanelTitle'),
  toolbarPanelSubtitle: document.getElementById('toolbarPanelSubtitle'),
  toolbarPanelValue: document.getElementById('toolbarPanelValue'),
  toolbarPanelBody: document.getElementById('toolbarPanelBody'),
  toolbarCategoryButtons: document.querySelectorAll('[data-category]'),

  toolbarTextColorCustomInput: document.getElementById('toolbarTextColorCustomInput'),
  toolbarOutlineColorCustomInput: document.getElementById('toolbarOutlineColorCustomInput'),
  toolbarHighlightColorCustomInput: document.getElementById('toolbarHighlightColorCustomInput'),
};

function getActivePattern() {
  return state.patterns[state.activePatternId] || { ...DEFAULT_PATTERN };
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
  } else {
    updateActivePattern({
      highlightEnabled: true,
      highlightColor: color
    });
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ツールバーの設定
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

/*
function updateToolbarUI() {
  const categoryKey = state.activeToolbarCategory;
  const config = TOOLBAR_CATEGORY_CONFIG[categoryKey];
  if (!config) return;

  const pattern = getActivePattern();

  els.toolbarPanelTitle.textContent = config.label;
  els.toolbarPanelSubtitle.textContent = config.subtitle;
  els.toolbarPanelValue.textContent = config.getValueText(pattern);

  els.toolbarCategoryButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.category === categoryKey);
  });

  if (categoryKey === 'font') return renderFontPanel(pattern);
  if (categoryKey === 'textColor') return renderTextColorPanel(pattern);
  if (categoryKey === 'size') return renderSizePanel(pattern);
  if (categoryKey === 'outline') return renderOutlinePanel(pattern);
  if (categoryKey === 'highlight') return renderHighlightPanel(pattern);
  if (categoryKey === 'position') return renderPositionPanel(pattern);
  if (categoryKey === 'opacity') return renderOpacityPanel(pattern);
  if (categoryKey === 'lineHeight') return renderLineHeightPanel(pattern);

  els.toolbarPanelBody.innerHTML = '';
}*/

function updateToolbarUI() {
  refreshToolbarHeader();
  renderToolbarCategory();
}

function switchToolbarCategory(categoryKey) {
  if (!TOOLBAR_CATEGORY_CONFIG[categoryKey]) return;
  if (state.activeToolbarCategory === categoryKey) return;

  state.activeToolbarCategory = categoryKey;
  refreshToolbarHeader();
  renderToolbarCategory();
}

function refreshToolbarHeader() {
  const categoryKey = state.activeToolbarCategory;
  const config = TOOLBAR_CATEGORY_CONFIG[categoryKey];
  if (!config) return;

  const pattern = getActivePattern();

  els.toolbarCategoryButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.category === categoryKey);
  });
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

  els.toolbarPanelBody.innerHTML = '';
}

// 各ツールのパネル内容をレンダリング
// パネル表示

// フォント //TODO 最新仕様に合わせる
function renderFontPanel(pattern) {
  const chips = FONT_OPTIONS.map((item) => {
    const active = item.value === pattern.fontFamily ? ' active' : '';
    return `
      <button class="font-chip${active}" type="button" data-font-family="${escapeHtml(item.value)}">
        ${escapeHtml(item.label)}
      </button>
    `;
  }).join('');

  els.toolbarPanelBody.innerHTML = `
    <div class="toolbar-section">
      <div class="font-row">${chips}</div>
    </div>
  `;

  els.toolbarPanelBody.querySelectorAll('[data-font-family]').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateActivePattern({ fontFamily: btn.dataset.fontFamily });

      if (hasSelectedImages()) {
        schedulePreviewRerender();
      } else {
        renderSamplePreview();
      }

      refreshToolbarHeader();

      els.toolbarPanelBody.querySelectorAll('[data-font-family]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.fontFamily === btn.dataset.fontFamily);
      });
    });
  });
}

// 文字色
function renderTextColorPanel(pattern) {
  const chips = COMMON_COLOR_OPTIONS.map((color) => {
    if (color === 'custom') {
      return `<button class="color-chip custom" type="button" data-text-color="custom">＋</button>`;
    }

    const active = color === pattern.textColor ? ' active' : '';
    return `<button class="color-chip${active}" type="button" data-text-color="${escapeHtml(color)}" style="--chip:${escapeHtml(color)};"></button>`;
  }).join('');

  els.toolbarPanelBody.innerHTML = `
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">文字色</span>
        <span class="control-value" id="toolbarTextColorValue">${pattern.textColor}</span>
      </div>
      <div class="color-palette">${chips}</div>
    </div>
  `;

  const valueEl = document.getElementById('toolbarTextColorValue');

  els.toolbarPanelBody.querySelectorAll('[data-text-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.textColor;

      if (value === 'custom') {
        els.toolbarTextColorCustomInput.value = getActivePattern().textColor || DEFAULT_PATTERN.textColor;
        els.toolbarTextColorCustomInput.click();
        return;
      }

      updateActivePattern({ textColor: value });
      refreshToolbarHeader();

      valueEl.textContent = value;

      els.toolbarPanelBody.querySelectorAll('[data-text-color]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.textColor === value);
      });

      if (hasSelectedImages()) {
        schedulePreviewRerender();
      } else {
        renderSamplePreview();
      }
    });
  });
}

// 文字サイズと太さ
function renderSizePanel(pattern) {
  const sizeValue = Number(pattern.fontSize ?? DEFAULT_PATTERN.fontSize);
  const weightValue = Number(pattern.fontWeight ?? DEFAULT_PATTERN.fontWeight);

  els.toolbarPanelBody.innerHTML = `
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
  `;

  const slider = document.getElementById('toolbarFontSizeSlider');
  const sizeValueEl = document.getElementById('toolbarFontSizeValue');
  const weightValueEl = document.getElementById('toolbarFontWeightValue');

  slider.addEventListener('input', () => {
    const value = Number(slider.value);
    updateActivePattern({ fontSize: value });
    refreshToolbarHeader();
    sizeValueEl.textContent = String(value);

    if (hasSelectedImages()) {
      schedulePreviewRerender();
    } else {
      renderSamplePreview();
    }
  });

  els.toolbarPanelBody.querySelectorAll('[data-font-weight]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = Number(btn.dataset.fontWeight);
      updateActivePattern({ fontWeight: value });
      refreshToolbarHeader();
      weightValueEl.textContent = String(value);

      els.toolbarPanelBody.querySelectorAll('[data-font-weight]').forEach((chip) => {
        chip.classList.toggle('active', Number(chip.dataset.fontWeight) === value);
      });

      if (hasSelectedImages()) {
        schedulePreviewRerender();
      } else {
        renderSamplePreview();
      }
    });
  });
}

// アウトライン
function renderOutlinePanel(pattern) {
  const chips = COMMON_COLOR_OPTIONS.map((color) => {
    if (color === 'custom') {
      return `<button class="color-chip custom" type="button" data-outline-color="custom">＋</button>`;
    }

    const active = color === pattern.outlineColor ? ' active' : '';
    return `<button class="color-chip${active}" type="button" data-outline-color="${escapeHtml(color)}" style="--chip:${escapeHtml(color)};"></button>`;
  }).join('');

  const widthValue = Number(pattern.outlineWidth ?? DEFAULT_PATTERN.outlineWidth);

  els.toolbarPanelBody.innerHTML = `
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">太さ</span>
        <span class="control-value" id="toolbarOutlineWidthValue">${widthValue}</span>
      </div>
      <input type="range" id="toolbarOutlineWidthSlider" min="0" max="40" step="1" value="${widthValue}" />
      <div class="slider-labels"></div>
      <div class="color-palette">${chips}</div>
    </div>
  `;

  const slider = document.getElementById('toolbarOutlineWidthSlider');
  const widthValueEl = document.getElementById('toolbarOutlineWidthValue');
  const colorValueEl = document.getElementById('toolbarOutlineColorValue');

  slider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    updateActivePattern({ outlineWidth: value });
    refreshToolbarHeader();
    widthValueEl.textContent = String(value);

    if (hasSelectedImages()) {
      schedulePreviewRerender();
    } else {
      renderSamplePreview();
    }
  });

  els.toolbarPanelBody.querySelectorAll('[data-outline-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.outlineColor;

      if (value === 'custom') {
        els.toolbarOutlineColorCustomInput.value = getActivePattern().outlineColor || DEFAULT_PATTERN.outlineColor;
        els.toolbarOutlineColorCustomInput.click();
        return;
      }

      updateActivePattern({ outlineColor: value });
      refreshToolbarHeader();
      colorValueEl.textContent = value;

      els.toolbarPanelBody.querySelectorAll('[data-outline-color]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.outlineColor === value);
      });

      if (hasSelectedImages()) {
        schedulePreviewRerender();
      } else {
        renderSamplePreview();
      }
    });
  });
}

// ハイライト
function renderHighlightPanel(pattern) {
  const paddingValue = Number(pattern.highlightPadding ?? DEFAULT_PATTERN.highlightPadding);
  const displayColor = getHighlightDisplayColor(pattern);

  const chips = HIGHLIGHT_COLOR_OPTIONS.map((color) => {
    if (color === 'custom') {
      return `<button class="color-chip custom" type="button" data-highlight-color="custom">＋</button>`;
    }

    const active = color === displayColor ? ' active' : '';
    const extraClass = color === 'transparent' ? ' transparent' : '';
    const style = color === 'transparent' ? '' : ` style="--chip:${escapeHtml(color)};"`;

    return `<button class="color-chip${extraClass}${active}" type="button" data-highlight-color="${escapeHtml(color)}"${style}></button>`;
  }).join('');

  els.toolbarPanelBody.innerHTML = `
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">背景余白量</span>
        <span class="control-value" id="toolbarHighlightPaddingValue">${paddingValue}</span>
      </div>
      <input type="range" id="toolbarHighlightPaddingSlider" min="0" max="30" step="1" value="${paddingValue}" />
      <div class="slider-labels"></div>
      <div class="color-palette">${chips}</div>
    </div>
  `;

  const slider = document.getElementById('toolbarHighlightPaddingSlider');
  const paddingValueEl = document.getElementById('toolbarHighlightPaddingValue');
  const colorValueEl = document.getElementById('toolbarHighlightColorValue');

  slider.addEventListener('input', () => {
    const value = Number(slider.value);
    updateActivePattern({ highlightPadding: value });
    refreshToolbarHeader();
    paddingValueEl.textContent = String(value);

    if (hasSelectedImages()) {
      schedulePreviewRerender();
    } else {
      renderSamplePreview();
    }
  });

  els.toolbarPanelBody.querySelectorAll('[data-highlight-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.highlightColor;

      if (value === 'custom') {
        els.toolbarHighlightColorCustomInput.value = getActivePattern().highlightColor || DEFAULT_PATTERN.highlightColor;
        els.toolbarHighlightColorCustomInput.click();
        return;
      }

      setHighlightFromDisplayColor(value);
      refreshToolbarHeader();
      colorValueEl.textContent = value === 'transparent' ? '透明' : '色あり';

      els.toolbarPanelBody.querySelectorAll('[data-highlight-color]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.highlightColor === value);
      });

      if (hasSelectedImages()) {
        schedulePreviewRerender();
      } else {
        renderSamplePreview();
      }
    });
  });
}

// 位置
function renderPositionPanel(pattern) {
  const xValue = Number(pattern.positionX ?? DEFAULT_PATTERN.positionX);
  const yValue = Number(pattern.positionY ?? DEFAULT_PATTERN.positionY);

  els.toolbarPanelBody.innerHTML = `
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
  `;

  const xValueEl = document.getElementById('toolbarPositionXValue');
  const yValueEl = document.getElementById('toolbarPositionYValue');

  document.getElementById('toolbarPositionXSlider').addEventListener('input', (e) => {
    const value = Number(e.target.value);
    updateActivePattern({ positionX: value });
    refreshToolbarHeader();
    xValueEl.textContent = String(value);

    if (hasSelectedImages()) {
      schedulePreviewRerender();
    } else {
      renderSamplePreview();
    }
  });

  document.getElementById('toolbarPositionYSlider').addEventListener('input', (e) => {
    const value = Number(e.target.value);
    updateActivePattern({ positionY: value });
    refreshToolbarHeader();
    yValueEl.textContent = String(value);

    if (hasSelectedImages()) {
      schedulePreviewRerender();
    } else {
      renderSamplePreview();
    }
  });
}

// 透明度
function renderOpacityPanel(pattern) {
  const value = Number(pattern.opacity ?? DEFAULT_PATTERN.opacity);

  els.toolbarPanelBody.innerHTML = `
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">透明度</span>
        <span class="control-value" id="toolbarOpacityValue">${value}%</span>
      </div>
      <input type="range" id="toolbarOpacitySlider" min="0" max="100" step="1" value="${value}" />
      <div class="slider-labels"></div>
    </div>
  `;

  const valueEl = document.getElementById('toolbarOpacityValue');

  document.getElementById('toolbarOpacitySlider').addEventListener('input', (e) => {
    const value = Number(e.target.value);
    updateActivePattern({ opacity: value });
    refreshToolbarHeader();
    valueEl.textContent = `${value}%`;

    if (hasSelectedImages()) {
      schedulePreviewRerender();
    } else {
      renderSamplePreview();
    }
  });
}

// 行間
function renderLineHeightPanel(pattern) {
  const current = String(pattern.lineHeight ?? DEFAULT_PATTERN.lineHeight);

  const buttons = LINE_HEIGHT_OPTIONS.map((item) => `
    <button class="segment-btn${item.value === current ? ' active' : ''}" type="button" data-line-height="${item.value}">
      ${item.label}
    </button>
  `).join('');

  els.toolbarPanelBody.innerHTML = `
    <div class="toolbar-section">
      <div class="control-head">
        <span class="control-label">行間</span>
        <span class="control-value" id="toolbarLineHeightValue">${current}</span>
      </div>
      <div class="segmented-row segmented-row-5">${buttons}</div>
    </div>
  `;

  const valueEl = document.getElementById('toolbarLineHeightValue');

  els.toolbarPanelBody.querySelectorAll('[data-line-height]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.lineHeight;
      updateActivePattern({ lineHeight: value });
      refreshToolbarHeader();
      valueEl.textContent = value;

      els.toolbarPanelBody.querySelectorAll('[data-line-height]').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.lineHeight === value);
      });

      if (hasSelectedImages()) {
        schedulePreviewRerender();
      } else {
        renderSamplePreview();
      }
    });
  });
}

function updatePatternAndPreview(patch, options = {}) {
  const {
    rerenderPanel = false
  } = options;

  updateActivePattern(patch);
  refreshToolbarHeader();

  if (rerenderPanel) {
    renderToolbarCategory();
  }

  if (hasSelectedImages()) {
    schedulePreviewRerender();
  } else {
    renderSamplePreview();
  }
}


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

function readFormToPartialPattern() {
  return {
    watermarkText: (els.watermarkText.value || '').trim() || DEFAULT_PATTERN.watermarkText,
    postText: (els.postText.value || '').trim(),
    includeCurrentTime: !!els.includeCurrentTimeInput.checked
  };
}

function buildPatternFromUI() {
  return {
    ...getActivePattern(),
    ...readFormToPartialPattern()
  };
}

function applyPatternToForm(pattern) {
  const p = { ...DEFAULT_PATTERN, ...(pattern || {}) };

  els.watermarkText.value = p.watermarkText;
  els.postText.value = p.postText;
  els.includeCurrentTimeInput.checked = !!p.includeCurrentTime;
}

function saveCurrentPattern() {
  const pattern = buildPatternFromUI();
  state.patterns[state.activePatternId] = { ...DEFAULT_PATTERN, ...pattern };
  state.drafts[state.activePatternId] = pattern.postText || '';
  savePersistedState();
  refreshTimePreview();
  updateToolbarUI();
  els.settingsStatus.innerHTML = '<span class="ok">このパターンを保存しました。</span>';
}

function switchPattern(patternId) {
  const nextId = Number(patternId);
  if (!state.patterns[nextId]) return;

  state.patterns[state.activePatternId] = {
    ...DEFAULT_PATTERN,
    ...buildPatternFromUI()
  };
  state.drafts[state.activePatternId] = els.postText.value || '';

  state.activePatternId = nextId;

  applyPatternToForm(state.patterns[nextId]);
  updatePatternTabs();
  updateToolbarUI();
  savePersistedState();
  refreshTimePreview();
  setStatus(els.settingsStatus, `パターン${nextId}に切り替えました。`);

  if (hasSelectedImages()) {
    schedulePreviewRerender(0);
  } else {
    renderSamplePreview();
  }
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
  const pattern = buildPatternFromUI() || DEFAULT_PATTERN;
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

// 画像生成ロジック
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
  const blockBottom = style.y + blockHeight / 2;

  const paddingX = style.highlightPadding;
  const paddingY = style.highlightPadding;
  const rectX = style.x - maxTextWidth / 2 - paddingX;
  const rectY = blockTop - paddingY;
  const rectWidth = maxTextWidth + paddingX * 2;
  const rectHeight = blockHeight + paddingY * 2;
  const rectRadius = 0;
  // Math.max(style.fontSize * 0.2, 10);

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

    const pattern = buildPatternFromUI() || DEFAULT_PATTERN;
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
  renderSamplePreview();
}

async function renderSamplePreview() {
  try {
    const pattern = buildPatternFromUI() || DEFAULT_PATTERN;
    const sampleImg = await loadImageFromUrl(SAMPLE_SRC);
    const renderStyle = patternToRenderStyle(pattern, sampleImg.width, sampleImg.height);
    const dataUrl = drawTextOnImage(sampleImg, pattern.watermarkText, renderStyle);

    els.previewFileName.textContent = SAMPLE_FILE_NAME;
    els.previewMainImg.src = dataUrl;
    els.previewMainImg.alt = '文字入りサンプル画像';
    els.prevPreviewBtn.disabled = true;
    els.nextPreviewBtn.disabled = true;
    els.shareAllBtn.disabled = true;
    els.shareCurrentBtn.disabled = true;
  } catch (err) {
    els.previewFileName.textContent = SAMPLE_FILE_NAME;
    els.previewMainImg.src = SAMPLE_SRC;
    els.previewMainImg.alt = 'サンプル画像';
    els.prevPreviewBtn.disabled = true;
    els.nextPreviewBtn.disabled = true;
    els.shareAllBtn.disabled = true;
    els.shareCurrentBtn.disabled = true;
  }
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
  const pattern = buildPatternFromUI();
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
  //updateToolbarUI();

  if (hasSelectedImages()) {
    schedulePreviewRerender();
  } else {
    renderSamplePreview();
  }
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

els.toolbarCategoryButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    switchToolbarCategory(btn.dataset.category);
  });
});

els.toolbarTextColorCustomInput.addEventListener('input', () => {
  const value = els.toolbarTextColorCustomInput.value;
  updateActivePattern({ textColor: value });
  refreshToolbarHeader();

  const valueEl = document.getElementById('toolbarTextColorValue');
  if (valueEl) valueEl.textContent = value;

  els.toolbarPanelBody.querySelectorAll('[data-text-color]').forEach((chip) => {
    chip.classList.remove('active');
  });

  if (hasSelectedImages()) {
    schedulePreviewRerender();
  } else {
    renderSamplePreview();
  }
});

els.toolbarOutlineColorCustomInput.addEventListener('input', () => {
  const value = els.toolbarOutlineColorCustomInput.value;
  updateActivePattern({ outlineColor: value });
  refreshToolbarHeader();

  const valueEl = document.getElementById('toolbarOutlineColorValue');
  if (valueEl) valueEl.textContent = value;

  els.toolbarPanelBody.querySelectorAll('[data-outline-color]').forEach((chip) => {
    chip.classList.remove('active');
  });

  if (hasSelectedImages()) {
    schedulePreviewRerender();
  } else {
    renderSamplePreview();
  }
});

els.toolbarHighlightColorCustomInput.addEventListener('input', () => {
  const value = els.toolbarHighlightColorCustomInput.value;
  updateActivePattern({
    highlightEnabled: true,
    highlightColor: value
  });
  refreshToolbarHeader();

  const valueEl = document.getElementById('toolbarHighlightColorValue');
  if (valueEl) valueEl.textContent = '色あり';

  els.toolbarPanelBody.querySelectorAll('[data-highlight-color]').forEach((chip) => {
    chip.classList.remove('active');
  });

  if (hasSelectedImages()) {
    schedulePreviewRerender();
  } else {
    renderSamplePreview();
  }
});

[
  els.watermarkText,
  els.lineHeightSelect,
  els.textColorInput,
  els.outlineColorInput,
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
  updateToolbarUI();
  renderPreviewViewer();
});