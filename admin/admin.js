    // --- CONFIG ---
    const REPO_FILE_PATH = 'data.json'; // Путь к файлу в репозитории
    const BRANCH = 'main'; // Ваша ветка

    let CLOUD_NAME = null;
    let API_KEY = null;
    let currentData = null;
    let fileSha = null;
    let authToken = null;
    let uploadTargetIndex = null;
    let uploadTargetField = null;
    let selectedPhotos = new Set();
    let cropper = null;
    let cropQueue = [];
    let croppedPhotos = [];

    let CATEGORIES = ['beauty', 'streetwear', 'commercial', 'casual', 'ugc', 'food', 'acting'];

    // --- TOAST NOTIFICATIONS ---
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const icons = { success: 'ri-check-line', error: 'ri-error-warning-line', info: 'ri-information-line' };
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${message}`;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // --- DYNAMIC CATEGORIES ---
    function getCategories() {
      const cats = new Set(CATEGORIES);
      if (currentData?.photos) currentData.photos.forEach(p => p.category.split(' ').forEach(c => cats.add(c)));
      if (currentData?.videos) currentData.videos.forEach(v => v.category.split(' ').forEach(c => cats.add(c)));
      return [...cats].sort();
    }

    function populateCategorySelects() {
      const cats = getCategories();
      // Populate batch category select
      const batchSelect = document.getElementById('batch-category-select');
      if (batchSelect) {
        batchSelect.innerHTML = cats.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('');
      }
      // Populate crop modal category select
      const cropSelect = document.getElementById('crop-category');
      if (cropSelect) {
        const current = cropSelect.value;
        cropSelect.innerHTML = cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('');
      }
    }

    // --- BATCH CATEGORY CHANGE ---
    function batchChangeCategory() {
      if (selectedPhotos.size === 0) return showToast('Сначала выберите фото', 'error');
      const cat = document.getElementById('batch-category-select').value;
      if (!cat) return;

      const indices = Array.from(selectedPhotos);
      indices.forEach(i => { currentData.photos[i].category = cat; });
      clearSelection();
      showToast(`Категория ${cat} применена к ${indices.length} фото`, 'success');
      saveData(currentData, `Batch category change to ${cat}`);
    }

    // --- AUTHENTICATION ---
    netlifyIdentity.on('init', user => {
      if (user) handleLogin(user);
    });
    netlifyIdentity.on('login', user => handleLogin(user));
    netlifyIdentity.on('logout', () => {
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('dashboard').classList.add('hidden');
      authToken = null;
    });

    async function handleLogin(user) {
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
      document.getElementById('user-email').innerText = user.email;

      // Получаем JWT токен ПЕРВЫМ — нужен для всех API-вызовов
      authToken = await user.jwt();

      // Загружаем конфиг (теперь с авторизацией)
      try {
        const cfgRes = await fetch('/.netlify/functions/get-config', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!cfgRes.ok) throw new Error(`Config fetch failed with status ${cfgRes.status}`);
        const config = await cfgRes.json();
        CLOUD_NAME = config.cloud_name;
        API_KEY = config.api_key;
      } catch (e) {
        console.error("Failed to load Cloudinary config", e);
        showToast("Ошибка загрузки Cloudinary конфига", "error");
      }

      fetchData();
      initSortable();
      initVideoSortable();
      initDragAndDrop();
      populateCategorySelects();
    }

    // --- SORTABLE JS ---
    function initSortable() {
      const grid = document.getElementById('photo-grid');
      new Sortable(grid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function (evt) {
          if (evt.oldIndex === evt.newIndex) return;

          // Меняем порядок в массиве
          const item = currentData.photos.splice(evt.oldIndex, 1)[0];
          currentData.photos.splice(evt.newIndex, 0, item);

          // Сбрасываем выделение при сортировке, чтобы не перепутать индексы
          clearSelection();

          // Сохраняем
          showStatus('Сохранение порядка...');
          saveData(currentData, `Reordered photos`);
        }
      });
    }

    function initVideoSortable() {
      const grid = document.getElementById('video-grid');
      new Sortable(grid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.drag-handle', // Перетаскивать только за постер
        onEnd: function (evt) {
          if (evt.oldIndex === evt.newIndex) return;

          const item = currentData.videos.splice(evt.oldIndex, 1)[0];
          currentData.videos.splice(evt.newIndex, 0, item);

          showStatus('Сохранение порядка видео...', 'video-status-msg');
          saveData(currentData, `Reordered videos`, 'video-status-msg');
        }
      });
    }

    // --- GITHUB API (VIA GIT GATEWAY) ---
    async function fetchData() {
      try {
        const response = await fetch(`/.netlify/git/github/contents/${REPO_FILE_PATH}?ref=${BRANCH}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const json = await response.json();

        fileSha = json.sha;
        // Декодируем Base64 (с поддержкой кириллицы)
        const content = decodeURIComponent(escape(window.atob(json.content)));
        currentData = JSON.parse(content);
        console.log('Data loaded:', currentData);
      } catch (error) {
        console.error(error);
        showToast('Ошибка загрузки данных', 'error');
      }
    }

    async function saveData(newData, message, statusId = 'status-msg') {
      showLoader(true);
      try {
        // Кодируем в Base64 (с поддержкой кириллицы)
        const content = window.btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

        const response = await fetch(`/.netlify/git/github/contents/${REPO_FILE_PATH}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            content: content,
            sha: fileSha,
            branch: BRANCH
          })
        });

        if (!response.ok) throw new Error('Failed to save');
        const json = await response.json();
        fileSha = json.content.sha; // Обновляем SHA для следующих сохранений
        currentData = newData; // Обновляем локальные данные
        renderGallery();
        renderVideoGallery();
        populateCategorySelects();
        showStatus('Сохранено успешно!', statusId);
      } catch (error) {
        console.error(error);
        showToast('Ошибка сохранения!', 'error');
      } finally {
        showLoader(false);
      }
    }

    // --- UI LOGIC ---
    function showGallery() {
      document.getElementById('main-menu').classList.add('hidden');
      document.getElementById('video-view').classList.add('hidden');
      document.getElementById('gallery-view').classList.remove('hidden');
      clearSelection(); // Сброс при входе
      renderGallery();
    }

    function showVideoGallery() {
      document.getElementById('main-menu').classList.add('hidden');
      document.getElementById('gallery-view').classList.add('hidden');
      document.getElementById('video-view').classList.remove('hidden');
      renderVideoGallery();
    }

    function hideGallery() {
      document.getElementById('gallery-view').classList.add('hidden');
      document.getElementById('main-menu').classList.remove('hidden');
      document.getElementById('status-msg').innerText = '';
    }

    function hideVideoGallery() {
      document.getElementById('video-view').classList.add('hidden');
      document.getElementById('main-menu').classList.remove('hidden');
      document.getElementById('video-status-msg').innerText = '';
    }

    function renderGallery() {
      const grid = document.getElementById('photo-grid');
      grid.innerHTML = '';

      if (!currentData || !currentData.photos) return;

      currentData.photos.forEach((photo, index) => {
        const isSelected = selectedPhotos.has(index);
        const div = document.createElement('div');
        div.className = `relative group aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden cursor-move transition-all duration-200 ${isSelected ? 'ring-4 ring-pink-600' : ''}`;

        // Fix relative paths for admin panel (./img -> ../img)
        let displaySrc = photo.thumb || photo.src;
        if (displaySrc && displaySrc.startsWith('./')) displaySrc = '.' + displaySrc;

        div.innerHTML = `
          <!-- Checkbox -->
          <div class="absolute top-2 left-2 z-20">
            <input type="checkbox" class="w-5 h-5 accent-pink-600 cursor-pointer shadow-md" 
                   ${isSelected ? 'checked' : ''} 
                   onclick="event.stopPropagation(); togglePhotoSelection(${index})">
          </div>

          <img src="${displaySrc}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition">
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
            <select onchange="updateCategory(${index}, this.value)" class="bg-black text-xs text-white border border-gray-600 rounded px-2 py-1 outline-none">
              ${getCategories().map(c => `<option value="${c}" ${photo.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
            </select>
            <button onclick="deletePhoto(${index})" class="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center mt-2">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        `;
        grid.appendChild(div);
      });
    }

    function renderVideoGallery() {
      const grid = document.getElementById('video-grid');
      grid.innerHTML = '';

      if (!currentData || !currentData.videos) return;

      currentData.videos.forEach((video, index) => {
        const div = document.createElement('div');
        div.className = 'relative group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 flex flex-col';

        // Poster (Drag Handle)
        let posterUrl = video.poster || 'https://via.placeholder.com/300x533/111/555?text=NO+POSTER';
        if (posterUrl.startsWith('./')) posterUrl = '.' + posterUrl;

        div.innerHTML = `
          <div class="relative aspect-[9/16] bg-black cursor-move drag-handle group/poster">
             <img src="${posterUrl}" class="w-full h-full object-cover opacity-80 group-hover/poster:opacity-100 transition">
             
             ${video.src ? `
             <div class="absolute top-2 left-2 z-20">
                <button onclick="previewVideo(${index})" class="bg-black/60 hover:bg-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition border border-white/20 shadow-lg" title="Play Video">
                   <i class="ri-play-fill"></i>
                </button>
             </div>` : ''}

             <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 bg-black/40 transition">
                <span onclick="updateVideoMedia(${index}, 'poster')" class="bg-black/80 text-white px-3 py-1 text-xs rounded uppercase tracking-wider border border-gray-600 cursor-pointer hover:bg-white hover:text-black transition">
                  <i class="ri-image-edit-line"></i> Change Poster
                </span>
             </div>
             <div class="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                <i class="ri-drag-move-2-line"></i> ${index + 1}
             </div>
          </div>
          
          <div class="p-3 space-y-3 flex-1 flex flex-col">
             <input type="text" value="${video.label || ''}" onchange="updateVideoField(${index}, 'label', this.value)" class="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-pink-500 outline-none" placeholder="Название (Label)">
             <div class="flex gap-2">
                <input type="text" value="${video.video_url || ''}" onchange="updateVideoField(${index}, 'video_url', this.value)" class="flex-1 bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-pink-500 outline-none" placeholder="YouTube / Vimeo Link">
                <button onclick="fetchInstagramPoster(${index})" class="bg-gray-800 hover:bg-pink-600 text-white px-2 rounded border border-gray-700 transition" title="Найти обложку"><i class="ri-magic-line"></i></button>
                ${video.src ? `<button onclick="openFrameCapture(${index})" class="bg-gray-800 hover:bg-pink-600 text-white px-2 rounded border border-gray-700 transition" title="Стоп-кадр"><i class="ri-camera-line"></i></button>` : ''}
             </div>
             
             <select onchange="updateVideoField(${index}, 'category', this.value)" class="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-pink-500 outline-none">
                ${getCategories().map(c =>
          `<option value="${c}" ${video.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
        ).join('')}
             </select>

             <div class="flex justify-between items-center mt-auto pt-2 border-t border-gray-800">
                <button onclick="triggerFileUpload(${index}, 'src')" class="text-[10px] uppercase tracking-wider text-gray-400 hover:text-blue-400 transition flex items-center gap-1" title="${video.src || 'No file'}">
                  <i class="ri-movie-line"></i> ${video.src ? 'Change MP4' : 'Upload MP4'}
                </button>
                <button onclick="deleteVideo(${index})" class="text-gray-500 hover:text-red-500 transition"><i class="ri-delete-bin-line text-lg"></i></button>
             </div>
          </div>
        `;
        grid.appendChild(div);
      });
    }

    async function deletePhoto(index) {
      if (!confirm('Удалить это фото?')) return;

      const photo = currentData.photos[index];

      // Удаляем из Cloudinary (если это ссылка на Cloudinary)
      if (photo.src.includes('cloudinary.com')) {
        // Пытаемся найти public_id в ссылке (между версией v... и расширением)
        const parts = photo.src.split('/upload/');
        if (parts.length === 2) {
          const match = parts[1].match(/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
          if (match && match[1]) {
            showStatus('Удаление файла из облака...');
            // Вызываем нашу функцию (не ждем ответа, чтобы не тормозить интерфейс)
            fetch('/.netlify/functions/delete-image', {
              method: 'POST', body: JSON.stringify({ public_id: match[1] }),
              headers: { 'Authorization': `Bearer ${authToken}` }
            }).catch(e => console.error('Cloudinary delete error:', e));
          }
        }
      }

      const updatedData = { ...currentData };
      updatedData.photos.splice(index, 1);
      saveData(updatedData, 'Deleted photo via Admin');
    }

    // --- BULK ACTIONS ---
    function togglePhotoSelection(index) {
      if (selectedPhotos.has(index)) selectedPhotos.delete(index);
      else selectedPhotos.add(index);

      updateBulkToolbar();

      // Обновляем стиль карточки без полной перерисовки
      const grid = document.getElementById('photo-grid');
      const card = grid.children[index];
      if (card) {
        if (selectedPhotos.has(index)) card.classList.add('ring-4', 'ring-pink-600');
        else card.classList.remove('ring-4', 'ring-pink-600');
      }
    }

    function selectAllPhotos() {
      if (!currentData.photos) return;
      currentData.photos.forEach((_, i) => selectedPhotos.add(i));
      renderGallery();
      updateBulkToolbar();
    }

    function clearSelection() {
      selectedPhotos.clear();
      renderGallery();
      updateBulkToolbar();
    }

    function updateBulkToolbar() {
      const toolbar = document.getElementById('bulk-actions');
      const countSpan = document.getElementById('selection-count');

      if (selectedPhotos.size > 0) {
        toolbar.classList.remove('hidden');
        countSpan.innerText = `${selectedPhotos.size} фото выбрано`;
      } else {
        toolbar.classList.add('hidden');
      }
    }

    async function deleteSelectedPhotos() {
      if (selectedPhotos.size === 0) return;
      if (!confirm(`Вы уверены, что хотите удалить ${selectedPhotos.size} фото?`)) return;

      showLoader(true);

      // 1. Удаляем из Cloudinary (фоново)
      const indices = Array.from(selectedPhotos);
      indices.forEach(index => {
        const photo = currentData.photos[index];
        if (photo.src.includes('cloudinary.com')) {
          const parts = photo.src.split('/upload/');
          if (parts.length === 2) {
            const match = parts[1].match(/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
            if (match && match[1]) {
              fetch('/.netlify/functions/delete-image', {
                method: 'POST', body: JSON.stringify({ public_id: match[1] }),
                headers: { 'Authorization': `Bearer ${authToken}` }
              }).catch(console.error);
            }
          }
        }
      });

      // 2. Удаляем из JSON (фильтруем массив)
      const updatedData = { ...currentData };
      updatedData.photos = updatedData.photos.filter((_, index) => !selectedPhotos.has(index));

      clearSelection();
      await saveData(updatedData, 'Bulk deleted photos via Admin');
    }

    async function deleteVideo(index) {
      if (!confirm('Удалить это видео?')) return;
      const updatedData = { ...currentData };
      updatedData.videos.splice(index, 1);
      saveData(updatedData, 'Deleted video via Admin', 'video-status-msg');
    }

    function addVideo() {
      const newVideo = {
        category: 'casual',
        src: '',
        video_url: '',
        label: 'New Reel',
        poster: ''
      };
      const updatedData = { ...currentData };
      if (!updatedData.videos) updatedData.videos = [];
      updatedData.videos.unshift(newVideo); // Добавляем в начало
      saveData(updatedData, 'Added new video placeholder', 'video-status-msg');
    }

    function updateVideoField(index, field, value) {
      currentData.videos[index][field] = value;
      showStatus('Обновление...', 'video-status-msg');
      saveData(currentData, `Updated video ${field}`, 'video-status-msg');
    }

    function updateVideoMedia(index, field) {
      if (!window.cloudinary) return;

      // Настройки для постера или видео
      const options = {
        cloud_name: CLOUD_NAME,
        api_key: API_KEY,
        multiple: false,
        resource_type: field === 'src' ? 'video' : 'image', // Видео или Картинка
        insert_transformation: true
      };

      window.cloudinary.openMediaLibrary(options, {
        insertHandler: function (data) {
          if (data.assets && data.assets.length > 0) {
            const url = data.assets[0].secure_url;
            currentData.videos[index][field] = url;
            saveData(currentData, `Updated video ${field}`, 'video-status-msg');
          }
        }
      });
    }

    // --- DIRECT FILE UPLOAD ---
    function triggerFileUpload(index, field) {
      uploadTargetIndex = index;
      uploadTargetField = field;
      const input = document.getElementById('file-upload-input');
      input.accept = field === 'src' ? 'video/*' : 'image/*';
      input.click();
    }

    async function handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      // Сбрасываем инпут, чтобы можно было выбрать тот же файл повторно
      e.target.value = '';

      const loaderText = document.getElementById('loader-text');
      const progressContainer = document.getElementById('upload-progress-container');
      const progressBar = document.getElementById('upload-progress-bar');
      const progressText = document.getElementById('upload-progress-text');

      showStatus('Подготовка к загрузке...', 'video-status-msg');
      showLoader(true);

      try {
        // 1. Получаем подпись от нашей функции
        const sigRes = await fetch('/.netlify/functions/sign-upload', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!sigRes.ok) throw new Error('Failed to get signature');
        const { signature, timestamp } = await sigRes.json();

        // 2. Загружаем напрямую в Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);

        loaderText.innerText = 'Загрузка в облако...';
        progressContainer.classList.remove('hidden');
        progressText.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.innerText = '0%';

        const resourceType = uploadTargetField === 'src' ? 'video' : 'image';
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

        const data = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              progressBar.style.width = percent + '%';
              progressText.innerText = percent + '%';
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
            else reject(new Error('Cloudinary upload failed'));
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        // Скрываем прогресс
        progressContainer.classList.add('hidden');
        progressText.classList.add('hidden');
        loaderText.innerText = 'Сохранение ссылки...';

        // 3. Сохраняем ссылку и обновляем JSON
        currentData.videos[uploadTargetIndex][uploadTargetField] = data.secure_url;
        saveData(currentData, `Uploaded new ${uploadTargetField} via Admin`, 'video-status-msg');

      } catch (error) {
        console.error(error);
        showToast('Ошибка: ' + error.message, 'error');
        showLoader(false);
        showStatus('Ошибка загрузки', 'video-status-msg');
        // Сброс UI
        progressContainer.classList.add('hidden');
        progressText.classList.add('hidden');
        loaderText.innerText = 'Сохранение...';
      }
    }

    // --- NEW VIDEO UPLOAD (DASHBOARD) ---
    async function handleNewVideoUpload(e) {
      if (!e.target.files[0]) return;
      const file = e.target.files[0];
      e.target.value = ''; // Сброс
      processNewVideo(file);
    }

    async function processNewVideo(file) {
      const loaderText = document.getElementById('loader-text');
      const progressContainer = document.getElementById('upload-progress-container');
      const progressBar = document.getElementById('upload-progress-bar');
      const progressText = document.getElementById('upload-progress-text');

      showLoader(true);

      try {
        // 1. Подпись
        const sigRes = await fetch('/.netlify/functions/sign-upload', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!sigRes.ok) throw new Error('Failed to get signature');
        const { signature, timestamp } = await sigRes.json();

        // 2. Загрузка с прогрессом
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);

        loaderText.innerText = 'Загрузка видео...';
        progressContainer.classList.remove('hidden');
        progressText.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.innerText = '0%';

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

        const data = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              progressBar.style.width = percent + '%';
              progressText.innerText = percent + '%';
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
            else reject(new Error('Upload failed'));
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        // 3. Создаем запись
        const newVideo = {
          category: 'casual',
          src: data.secure_url,
          video_url: '',
          label: 'New Video',
          poster: data.secure_url.replace(/\.[^/.]+$/, ".jpg") // Авто-постер из видео
        };

        const updatedData = { ...currentData };
        if (!updatedData.videos) updatedData.videos = [];
        updatedData.videos.unshift(newVideo);

        loaderText.innerText = 'Сохранение...';
        progressContainer.classList.add('hidden');
        progressText.classList.add('hidden');

        await saveData(updatedData, 'Uploaded new video via Dashboard', 'video-status-msg');
        showVideoGallery(); // Переходим в галерею

      } catch (error) {
        console.error(error);
        showToast('Ошибка: ' + error.message, 'error');
        showLoader(false);
      }
    }

    // --- BULK PHOTO UPLOAD ---
    async function handleBulkUpload(e) {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      e.target.value = ''; // Сброс инпута
      startBulkUpload(files);
    }

    function startBulkUpload(files) {
      cropQueue = files;
      croppedPhotos = [];
      processCropQueue();
    }

    function processCropQueue() {
      if (cropQueue.length === 0) {
        if (croppedPhotos.length > 0) {
          finalizeBulkUpload();
        }
        return;
      }

      const file = cropQueue[0]; // Get the next file
      openCropModal(file);
    }

    function openCropModal(file) {
      const modal = document.getElementById('crop-modal');
      const image = document.getElementById('crop-image');
      const queueStatus = document.getElementById('crop-queue-status');

      queueStatus.innerText = `Фото ${croppedPhotos.length + 1} из ${croppedPhotos.length + cropQueue.length}`;

      const reader = new FileReader();
      reader.onload = (e) => {
        image.src = e.target.result;
        modal.classList.remove('hidden');

        if (cropper) cropper.destroy();

        cropper = new Cropper(image, {
          aspectRatio: 2 / 3,
          viewMode: 1,
          background: false,
          autoCropArea: 0.9,
          movable: true,
          zoomable: true,
          rotatable: true,
          scalable: true,
        });
      };
      reader.readAsDataURL(file);
    }

    async function cropAndUpload() {
      if (!cropper) return;

      const btn = document.getElementById('crop-and-upload-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="loader"></div>';

      cropper.getCroppedCanvas({ width: 1600, imageSmoothingQuality: 'high' }).toBlob(async (blob) => {
        try {
          const sigRes = await fetch('/.netlify/functions/sign-upload', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!sigRes.ok) throw new Error('Failed to get signature');
          const { signature, timestamp } = await sigRes.json();

          const formData = new FormData();
          formData.append('file', blob, cropQueue[0].name);
          formData.append('api_key', API_KEY);
          formData.append('timestamp', timestamp);
          formData.append('signature', signature);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
          if (!uploadRes.ok) throw new Error(`Failed to upload ${cropQueue[0].name}`);
          const data = await uploadRes.json();

          const fullUrl = data.secure_url.replace('/upload/', '/upload/w_1600,c_limit,q_auto,f_auto/');
          const thumbUrl = data.secure_url.replace('/upload/', '/upload/w_500,c_limit,q_auto,f_auto/');
          const fileName = cropQueue[0].name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
          const category = document.getElementById('crop-category').value;
          croppedPhotos.push({ src: fullUrl, thumb: thumbUrl, category: category, alt: fileName });

          cropQueue.shift();

          btn.disabled = false;
          btn.innerHTML = '<i class="ri-crop-line text-lg"></i> Обрезать и загрузить';

          if (cropQueue.length > 0) processCropQueue();
          else {
            document.getElementById('crop-modal').classList.add('hidden');
            finalizeBulkUpload();
          }
        } catch (error) {
          console.error(error);
          showToast('Ошибка: ' + error.message, 'error');
          btn.disabled = false;
          btn.innerHTML = '<i class="ri-crop-line text-lg"></i> Обрезать и загрузить';
        }
      }, 'image/jpeg', 0.9);
    }

    function finalizeBulkUpload() {
      if (croppedPhotos.length === 0) return;

      const updatedData = { ...currentData };
      if (!updatedData.photos) updatedData.photos = [];
      updatedData.photos = [...croppedPhotos, ...updatedData.photos];

      showLoader(true);
      document.getElementById('loader-text').innerText = 'Сохранение...';
      saveData(updatedData, `Added ${croppedPhotos.length} cropped photos via Admin`);

      croppedPhotos = [];
    }

    function cancelCropping() {
      if (cropper) cropper.destroy();
      cropper = null;
      cropQueue = [];
      croppedPhotos = [];
      document.getElementById('crop-modal').classList.add('hidden');
    }

    function setCropAspectRatio(ratio) {
      if (cropper) cropper.setAspectRatio(ratio);
    }

    async function fetchInstagramPoster(index) {
      const link = currentData.videos[index].video_url;
      if (!link) return showToast('Сначала вставьте ссылку!', 'error');

      showStatus('Поиск и загрузка обложки...', 'video-status-msg');

      try {
        const res = await fetch('/.netlify/functions/fetch-instagram', {
          method: 'POST',
          body: JSON.stringify({ url: link }),
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await res.json();
        if (data.url) {
          currentData.videos[index].poster = data.url;
          saveData(currentData, `Auto-fetched poster for video ${index}`, 'video-status-msg');
        } else {
          showToast('Не удалось найти обложку', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Ошибка. Загрузите вручную', 'error');
      }
    }

    function updateCategory(index, newCategory) {
      // Не сохраняем сразу, чтобы не спамить коммитами. 
      // Можно добавить кнопку "Сохранить изменения" или сохранять с debounce.
      // Для простоты сохраним сразу, но это может быть медленно.
      // Лучше обновим локально, а сохраним по кнопке? 
      // Пользователь просил "ничего лишнего". Сделаем автосохранение.

      currentData.photos[index].category = newCategory;
      // Небольшая задержка, чтобы UI не дергался
      showStatus('Изменение категории...');
      saveData(currentData, `Updated category for photo ${index}`);
    }

    function showLoader(show) {
      const loader = document.getElementById('global-loader');
      const text = document.getElementById('loader-text');
      if (show) {
        loader.classList.remove('hidden');
      } else {
        loader.classList.add('hidden');
        if (text) text.innerText = 'Сохранение...';
      }
    }

    function showStatus(msg, elementId = 'status-msg') {
      const el = document.getElementById(elementId);
      el.innerText = msg;
      setTimeout(() => el.innerText = '', 3000);
    }

    // --- VIDEO PREVIEW ---
    function previewVideo(index) {
      let src = currentData.videos[index].src;
      if (!src) return;
      if (src.startsWith('./')) src = '.' + src;

      const modal = document.getElementById('video-preview-modal');
      const player = document.getElementById('preview-player');
      player.src = src;
      modal.classList.remove('hidden');
      player.play().catch(e => console.log(e));
    }

    function closeVideoPreview() {
      const modal = document.getElementById('video-preview-modal');
      const player = document.getElementById('preview-player');
      player.pause();
      player.src = '';
      modal.classList.add('hidden');
    }

    // --- FRAME CAPTURE ---
    let captureTargetIndex = null;

    function openFrameCapture(index) {
      const video = currentData.videos[index];
      if (!video.src) return showToast('Видео файл не найден', 'error');

      let src = video.src;
      if (src.startsWith('./')) src = '.' + src;

      captureTargetIndex = index;
      const player = document.getElementById('capture-player');
      player.src = src;
      document.getElementById('frame-capture-modal').classList.remove('hidden');
    }

    function closeFrameCapture() {
      const player = document.getElementById('capture-player');
      player.pause();
      player.src = '';
      document.getElementById('frame-capture-modal').classList.add('hidden');
    }

    function captureCurrentFrame() {
      const player = document.getElementById('capture-player');
      const canvas = document.getElementById('capture-canvas');
      const ctx = canvas.getContext('2d');

      if (player.readyState < 2) return showToast('Видео еще не загрузилось', 'info');

      canvas.width = player.videoWidth;
      canvas.height = player.videoHeight;
      ctx.drawImage(player, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return showToast('Ошибка создания изображения', 'error');
        if (!confirm('Использовать этот кадр как обложку?')) return;

        showLoader(true);
        document.getElementById('loader-text').innerText = 'Загрузка обложки...';
        closeFrameCapture();

        try {
          const sigRes = await fetch('/.netlify/functions/sign-upload', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const { signature, timestamp } = await sigRes.json();
          const formData = new FormData();
          formData.append('file', blob, 'poster_capture.jpg');
          formData.append('api_key', API_KEY);
          formData.append('timestamp', timestamp);
          formData.append('signature', signature);
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
          const data = await uploadRes.json();
          const optimizedUrl = data.secure_url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/');
          currentData.videos[captureTargetIndex].poster = optimizedUrl;
          saveData(currentData, 'Updated poster from video frame', 'video-status-msg');
        } catch (e) { console.error(e); showToast('Ошибка: ' + e.message, 'error'); showLoader(false); }
      }, 'image/jpeg', 0.9);
    }

    // --- DRAG & DROP INITIALIZATION ---
    function initDragAndDrop() {
      const photoZone = document.getElementById('bulk-upload-zone');
      const videoZone = document.getElementById('new-video-zone');

      setupZone(photoZone, (files) => startBulkUpload(files));
      setupZone(videoZone, (files) => {
        if (files.length > 0) processNewVideo(files[0]);
      });
    }

    function setupZone(zone, callback) {
      if (!zone) return;

      // Предотвращаем стандартное поведение браузера (открытие файла)
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
      });

      // Визуальная подсветка
      zone.addEventListener('dragover', () => zone.classList.add('border-2', 'border-dashed', 'border-white', 'bg-white/10'));
      zone.addEventListener('dragleave', () => zone.classList.remove('border-2', 'border-dashed', 'border-white', 'bg-white/10'));
      zone.addEventListener('drop', (e) => {
        zone.classList.remove('border-2', 'border-dashed', 'border-white', 'bg-white/10');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) callback(files);
      });
    }
