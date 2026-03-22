/* GAS適用時は全体を<script>で囲む */
const DEFAULTS = {
  xId: '@inu_5122',
  mvPostId: '',
  stPostId: ''
};

const MV_HASHTAG = '#내가_살아있다는_증거_MV_스트리밍';
const AU_HASHTAG = '#내가_살아있다는_증거_음원_스트리밍';

const MV_STYLE = {
  fontSize: 80,
  fontWeight: '600',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  offsetX: 0,
  offsetY: -0.21,
  lineWidth: 26,
  strokeStyle: '#f7bacf',
  fillStyle: '#ffffff',
  shadowColor: 'rgba(0,0,0,0)',
  shadowBlur: 0
};

const AU_STYLE = {
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
};

const state = {
  image1: null,
  image2: null,
  image3: null,
  image4: null
};

const els = {
  xIdInput: document.getElementById('xIdInput'),
  imageFiles: document.getElementById('imageFiles'),
  generateBtn: document.getElementById('generateBtn'),
  shareAllBtn: document.getElementById('shareAllBtn'),

  mvPostText: document.getElementById('mvPostText'),
  mvPostIdInput: document.getElementById('mvPostIdInput'),
  mvActionLink: document.getElementById('mvActionLink'),
  //mvActionStatus: document.getElementById('mvActionStatus'),

  stPostText: document.getElementById('stPostText'),
  stPostIdInput: document.getElementById('stPostIdInput'),
  stActionLink: document.getElementById('stActionLink'),
  //stActionStatus: document.getElementById('stActionStatus'),

  mvPreviewGrid: document.getElementById('mvPreviewGrid'),
  stPreviewGrid: document.getElementById('stPreviewGrid'),

  generateStatus: document.getElementById('generateStatus'),
  resultStatus: document.getElementById('resultStatus'),
  //settingsStatus: document.getElementById('settingsStatus')
};

function saveSettings() {
  const settings = {
    xId: (els.xIdInput.value || '').trim() || DEFAULTS.xId,
    mvPostId: (els.mvPostIdInput.value || '').trim(),
    stPostId: (els.stPostIdInput.value || '').trim()
  };

  localStorage.setItem('mv_helper_settings', JSON.stringify(settings));
  refreshPostTexts();
  updateReplyLinks();
  els.settingsStatus.innerHTML = '<span class="ok">設定を保存しました。</span>';
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('mv_helper_settings');
    if (!raw) {
      applySettings(DEFAULTS);
      return;
    }

    const saved = JSON.parse(raw);
    applySettings({
      xId: saved.xId || DEFAULTS.xId,
      mvPostId: saved.mvPostId || DEFAULTS.mvPostId,
      stPostId: saved.stPostId || DEFAULTS.stPostId
    });
  } catch (e) {
    applySettings(DEFAULTS);
  }
}

function applySettings(settings) {
  els.xIdInput.value = settings.xId || DEFAULTS.xId;
  els.mvPostIdInput.value = settings.mvPostId || DEFAULTS.mvPostId;
  els.stPostIdInput.value = settings.stPostId || DEFAULTS.stPostId;
  refreshPostTexts();
  updateReplyLinks();
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

function buildPostText(type) {
  const timeLabel = getCurrentTimeLabel();
  const hashtag = type === 'mv' ? MV_HASHTAG : AU_HASHTAG;
  return `${timeLabel}\n${hashtag}`;
}

function refreshPostTexts() {
  els.mvPostText.value = buildPostText('mv');
  els.stPostText.value = buildPostText('st');
}

function loadLatestReplyPostIds() {
  google.script.run
    .withSuccessHandler((result) => {
      if (!result) return;

      if (result.mvPostId) {
        els.mvPostIdInput.value = result.mvPostId;
      }

      if (result.stPostId) {
        els.stPostIdInput.value = result.stPostId;
      }

      updateReplyLinks();
      setStatus(els.settingsStatus, 'スプレッドシートから最新の投稿IDを読み込みました。');
    })
    .withFailureHandler((error) => {
      console.error('投稿IDの取得に失敗しました:', error);
      setStatus(els.settingsStatus, 'スプレッドシートから投稿IDを取得できませんでした。', true);
    })
    .getLatestReplyPostIds();
}

function buildReplyUrl(postId) {
  return `https://x.com/inu_5122/status/${encodeURIComponent(postId)}/reply`;
}

function setActionLink(linkEl, postId) {
  if (!postId) {
    linkEl.href = '#';
    linkEl.style.pointerEvents = 'none';
    linkEl.style.opacity = '0.5';
    return;
  }

  linkEl.href = buildReplyUrl(postId);
  linkEl.style.pointerEvents = 'auto';
  linkEl.style.opacity = '1';
}

function updateReplyLinks() {
  setActionLink(els.mvActionLink, (els.mvPostIdInput.value || '').trim());
  setActionLink(els.stActionLink, (els.stPostIdInput.value || '').trim());
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

function drawCenteredTextOnImage(img, text, style) {
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

  const x = canvas.width / 2 + canvas.width * style.offsetX;
  const y = canvas.height / 2 + canvas.height * style.offsetY;

  ctx.shadowColor = style.shadowColor;
  ctx.shadowBlur = style.shadowBlur;

  ctx.lineWidth = style.lineWidth;
  ctx.strokeStyle = style.strokeStyle;
  ctx.strokeText(text, x, y);

  ctx.fillStyle = style.fillStyle;
  ctx.fillText(text, x, y);

  return canvas.toDataURL('image/png');
}

function resetStateImages() {
  state.image1 = null;
  state.image2 = null;
  state.image3 = null;
  state.image4 = null;
}

function getAllImages() {
  return [state.image1, state.image2, state.image3, state.image4].filter(Boolean);
}

function getMvImages() {
  return [state.image1, state.image2].filter(Boolean);
}

function getStImages() {
  return [state.image3, state.image4].filter(Boolean);
}

async function generateImages() {
  try {
    setStatus(els.generateStatus, '画像を生成中...');
    setStatus(els.resultStatus, '');
    els.shareAllBtn.disabled = true;
    els.mvPreviewGrid.innerHTML = '';
    els.stPreviewGrid.innerHTML = '';
    resetStateImages();

    const xId = (els.xIdInput.value || '').trim() || DEFAULTS.xId;
    const files = Array.from(els.imageFiles.files || []);

    if (files.length !== 4) {
      throw new Error('画像は4枚ちょうど選択してください。');
    }

    const loadedImages = await Promise.all(files.map(file => loadImageFromFile(file)));
    const timestamp = getTimestampString();

    loadedImages.forEach((img, index) => {
      const style = index < 2 ? MV_STYLE : AU_STYLE;
      const dataUrl = drawCenteredTextOnImage(img, xId, style);
      const name = escapeFileName(`${timestamp}_${index + 1}.png`);
      const imageObj = {
        dataUrl,
        file: dataUrlToFile(dataUrl, name),
        name
      };

      if (index === 0) state.image1 = imageObj;
      if (index === 1) state.image2 = imageObj;
      if (index === 2) state.image3 = imageObj;
      if (index === 3) state.image4 = imageObj;
    });

    renderMvPreviewList();
    renderStPreviewList();
    els.shareAllBtn.disabled = false;
    els.imageFiles.value = '';

    const images = getAllImages();
    setStatus(els.generateStatus, '画像を生成しました。');
    setStatus(
      els.resultStatus,
      `` //生成完了\n${images.map(item => item.name).join('\n')}
    );
  } catch (err) {
    setStatus(els.generateStatus, err.message || '画像生成に失敗しました。', true);
  }
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

function renderMvPreviewList() {
  els.mvPreviewGrid.innerHTML = '';
  const images = getMvImages();

  images.forEach((item, index) => {
    const label = `MV画像 ${index + 1}`;
    els.mvPreviewGrid.appendChild(createPreviewBox(item, label));
  });
}

function renderStPreviewList() {
  els.stPreviewGrid.innerHTML = '';
  const images = getStImages();

  images.forEach((item, index) => {
    const label = `音源画像 ${index + 1}`;
    els.stPreviewGrid.appendChild(createPreviewBox(item, label));
  });
}

async function shareAll() {
  const files = [];

  if (state.image1) files.push(state.image1.file);
  if (state.image2) files.push(state.image2.file);
  if (state.image3) files.push(state.image3.file);
  if (state.image4) files.push(state.image4.file);

  if (!files.length) {
    setStatus(els.resultStatus, '先に画像を生成してください。', true);
    return;
  }

  await shareFiles(files, 'MV / Audio Streaming Images');
}

els.generateBtn.addEventListener('click', generateImages);
els.shareAllBtn.addEventListener('click', shareAll);

els.mvPostIdInput.addEventListener('input', updateReplyLinks);
els.stPostIdInput.addEventListener('input', updateReplyLinks);

bindCopyAndOpen(els.mvActionLink, copyMvPostText, els.mvActionStatus, 'MV');
bindCopyAndOpen(els.stActionLink, copyStPostText, els.stActionStatus, '音源');

window.addEventListener('load', () => {
  loadSettings();
  refreshPostTexts();
  updateReplyLinks();
  loadLatestReplyPostIds();
});
