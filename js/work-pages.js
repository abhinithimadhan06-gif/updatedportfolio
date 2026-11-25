(() => {
  const projects = window.ARCHIVAL_DOSSIERS;
  const detail = document.getElementById('workDetail');
  const imageVariant = (imagePath, width) => {
    const imageRoot = 'assets/images/';
    if (!imagePath.startsWith(imageRoot)) {
      throw new Error(`Unsupported project image path: ${imagePath}`);
    }

    const relativePath = imagePath.slice(imageRoot.length).replace(/\.[^.]+$/, '');
    return `${imageRoot}optimized-v1/${relativePath}-${width}.webp`;
  };
  const setResponsiveImage = (image, imagePath, sizes) => {
    image.src = imageVariant(imagePath, 640);
    image.srcset = [
      `${imageVariant(imagePath, 640)} 640w`,
      `${imageVariant(imagePath, 960)} 960w`,
      `${imageVariant(imagePath, 1600)} 1600w`
    ].join(', ');
    image.sizes = sizes;
    image.decoding = 'async';
  };
  const setMetaContent = (selector, content) => {
    const meta = document.head.querySelector(selector);
    if (meta) meta.content = content;
  };

  if (!projects || !detail) {
    throw new Error('The project detail page could not be initialized.');
  }

  const selectedId = new URLSearchParams(window.location.search).get('look');
  const project = projects[selectedId];

  if (!project) {
    document.title = 'Project Not Found — Abhinithi Madhan';
    setMetaContent('meta[name="robots"]', 'noindex, nofollow');
    const notFound = document.createElement('section');
    notFound.className = 'project-not-found';
    const label = document.createElement('span');
    label.className = 'section-tag-red';
    label.textContent = 'PROJECT NOT FOUND';
    const heading = document.createElement('h1');
    heading.textContent = 'This atelier dossier is unavailable.';
    const backLink = document.createElement('a');
    backLink.className = 'project-back-link';
    backLink.href = 'index.html#works';
    backLink.textContent = '← BACK TO CLIENT FOLDERS';
    notFound.append(label, heading, backLink);
    detail.replaceChildren(notFound);
    return;
  }

  // ─── FOLDER INDEX VIEW ────────────────────────────────────────────────────
  if (project.type === 'folder') {
    const header = document.createElement('header');
    header.className = 'project-gallery-header';

    const headingCopy = document.createElement('div');
    const category = document.createElement('span');
    category.className = 'section-tag-red';
    category.textContent = project.category || project.title;

    const title = document.createElement('h1');
    title.textContent = project.title;
    headingCopy.append(category, title);

    const backLink = document.createElement('a');
    backLink.className = 'project-gallery-back';
    backLink.href = 'index.html#works';
    backLink.textContent = '← BACK TO CLIENT FOLDERS';
    header.append(headingCopy, backLink);

    const folderGrid = document.createElement('div');
    folderGrid.className = 'shoot-folder-grid';

    (project.subFolders || []).forEach((subId, i) => {
      const sub = projects[subId];
      if (!sub) return;

      const card = document.createElement('article');
      card.className = 'shoot-folder-card';

      const link = document.createElement('a');
      link.href = `work.html?look=${subId}`;
      link.className = 'shoot-folder-link';
      link.setAttribute('aria-label', `Open ${sub.title}`);

      const imgWrap = document.createElement('div');
      imgWrap.className = 'shoot-folder-img-wrap';

      const img = document.createElement('img');
      img.alt = sub.title;
      setResponsiveImage(img, sub.image, '(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw');
      img.loading = i < 2 ? 'eager' : 'lazy';
      if (i === 0) img.fetchPriority = 'high';

      const overlay = document.createElement('div');
      overlay.className = 'shoot-folder-overlay';
      const openLabel = document.createElement('span');
      openLabel.className = 'shoot-folder-open';
      openLabel.textContent = 'OPEN ↗';
      overlay.append(openLabel);
      imgWrap.append(img, overlay);

      const caption = document.createElement('div');
      caption.className = 'shoot-folder-caption';

      const catSpan = document.createElement('span');
      catSpan.className = 'shoot-folder-cat';
      catSpan.textContent = sub.category || project.category;

      const nameH3 = document.createElement('h3');
      nameH3.className = 'shoot-folder-name';
      nameH3.textContent = sub.title;

      caption.append(catSpan, nameH3);
      link.append(imgWrap, caption);
      card.append(link);
      folderGrid.append(card);
    });

    detail.replaceChildren(header, folderGrid);
    document.title = `${project.title} — Abhinithi Madhan`;
    const description = `Explore ${project.title.toLowerCase()} projects by fashion stylist and art director Abhinithi Madhan.`;
    const canonicalUrl = `https://abhinithimadhan.com/work.html?look=${encodeURIComponent(selectedId)}`;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', document.title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', document.title);
    setMetaContent('meta[name="twitter:description"]', description);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;
    return;
  }

  // ─── INDIVIDUAL SHOOT — SIMPLE PHOTO GRID ────────────────────────────────
  if (!Array.isArray(project.gallery) || project.gallery.length === 0) {
    throw new Error(`The gallery is missing for project "${selectedId}".`);
  }

  // Header
  const header = document.createElement('header');
  header.className = 'project-gallery-header';

  const headingCopy = document.createElement('div');
  const catTag = document.createElement('span');
  catTag.className = 'section-tag-red';
  catTag.textContent = project.category;

  const titleEl = document.createElement('h1');
  titleEl.textContent = project.title;
  headingCopy.append(catTag, titleEl);

  const backLink = document.createElement('a');
  backLink.className = 'project-gallery-back';
  backLink.href = 'index.html#works';
  backLink.textContent = '← BACK TO CLIENT FOLDERS';
  header.append(headingCopy, backLink);

  // Simple photo grid
  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  grid.setAttribute('aria-label', `${project.title} photo gallery`);

  project.gallery.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photo-grid-btn';
    btn.setAttribute('aria-label', `View full image: ${item.title} ${item.caption}`);
    btn.dataset.galleryIndex = String(index);

    const img = document.createElement('img');
    img.alt = `${item.title} — ${item.caption}`;
    setResponsiveImage(img, item.image, '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw');
    img.loading = index < 4 ? 'eager' : 'lazy';
    if (index === 0) img.fetchPriority = 'high';

    btn.append(img);
    grid.append(btn);
  });

  // Lightbox
  const lightbox = document.createElement('dialog');
  lightbox.className = 'project-image-lightbox';
  lightbox.setAttribute('aria-label', 'Full-size project image');

  const lightboxImage = document.createElement('img');
  lightboxImage.className = 'project-image-lightbox-image';
  lightboxImage.alt = '';
  lightboxImage.decoding = 'async';

  const lightboxCaption = document.createElement('p');
  lightboxCaption.className = 'project-image-lightbox-caption';
  let currentGalleryIndex = 0;
  let swipeStart = null;
  let suppressBackdropClick = false;
  let navigationRequestId = 0;
  let imageTransition = null;
  const preloadedImages = new Map();

  const getPreloadedImage = (index) => {
    const normalizedIndex = (index + project.gallery.length) % project.gallery.length;
    let preloadedImage = preloadedImages.get(normalizedIndex);
    if (!preloadedImage) {
      preloadedImage = new Image();
      preloadedImage.decoding = 'async';
      preloadedImage.src = imageVariant(project.gallery[normalizedIndex].image, 1600);
      preloadedImages.set(normalizedIndex, preloadedImage);
    }
    return preloadedImage;
  };

  const preloadAdjacentImages = () => {
    preloadedImages.clear();
    if (project.gallery.length < 2) return;
    getPreloadedImage(currentGalleryIndex + 1);
    getPreloadedImage(currentGalleryIndex - 1);
  };

  const showGalleryImage = (index, direction = 0) => {
    currentGalleryIndex = (index + project.gallery.length) % project.gallery.length;
    const item = project.gallery[currentGalleryIndex];
    const imageSrc = imageVariant(item.image, 1600);
    const requestId = ++navigationRequestId;

    const updateImage = () => {
      if (requestId !== navigationRequestId || (direction !== 0 && !lightbox.open)) return;

      if (imageTransition) {
        imageTransition.cancel();
        imageTransition = null;
      }

      lightboxImage.src = imageSrc;
      lightboxImage.alt = `${item.title} — ${item.caption}`;
      lightboxCaption.textContent = `${item.title} — ${item.caption}`;

      if (direction !== 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        imageTransition = lightboxImage.animate([
          { opacity: 0.7, transform: `translate3d(${direction * 12}px, 0, 0)` },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], {
          duration: 180,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        });
      }

      if (direction !== 0) preloadAdjacentImages();
    };

    if (direction === 0) {
      updateImage();
      preloadAdjacentImages();
      return;
    }

    const preloadedImage = getPreloadedImage(currentGalleryIndex);
    preloadedImages.clear();
    preloadedImages.set(currentGalleryIndex, preloadedImage);
    preloadedImage.decode().then(updateImage, (error) => {
      if (requestId !== navigationRequestId || !lightbox.open) return;
      console.error(`Unable to decode gallery image: ${item.image}`, error);
      updateImage();
    });
  };

  const lightboxClose = document.createElement('button');
  lightboxClose.className = 'project-image-lightbox-close';
  lightboxClose.type = 'button';
  lightboxClose.setAttribute('aria-label', 'Close full-size image');
  lightboxClose.textContent = 'CLOSE ×';

  lightbox.append(lightboxImage, lightboxCaption, lightboxClose);

  // Lightbox open on grid click
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.photo-grid-btn');
    if (!btn) return;
    showGalleryImage(Number(btn.dataset.galleryIndex));
    lightbox.showModal();
  });

  // Lightbox close handlers
  lightboxClose.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (e) => {
    if (e.target !== lightbox) return;
    if (suppressBackdropClick) {
      suppressBackdropClick = false;
      return;
    }
    lightbox.close();
  });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      lightbox.close();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      showGalleryImage(currentGalleryIndex + direction, direction);
    }
  });
  lightbox.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || e.target !== lightboxImage) return;
    swipeStart = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
  });
  lightbox.addEventListener('pointerup', (e) => {
    if (!swipeStart || e.pointerId !== swipeStart.pointerId) return;

    const deltaX = e.clientX - swipeStart.x;
    const deltaY = e.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    const direction = deltaX < 0 ? 1 : -1;
    showGalleryImage(currentGalleryIndex + direction, direction);
    suppressBackdropClick = true;
    window.setTimeout(() => {
      suppressBackdropClick = false;
    }, 0);
  });
  lightbox.addEventListener('pointercancel', () => {
    swipeStart = null;
  });
  lightbox.addEventListener('close', () => {
    swipeStart = null;
    navigationRequestId += 1;
    if (imageTransition) {
      imageTransition.cancel();
      imageTransition = null;
    }
  });

  detail.replaceChildren(header, grid, lightbox);
  document.title = `${project.title} — Abhinithi Madhan`;
  const description = `View the ${project.category.toLowerCase()} photo story ${project.title} by fashion stylist and art director Abhinithi Madhan.`;
  const canonicalUrl = `https://abhinithimadhan.com/work.html?look=${encodeURIComponent(selectedId)}`;
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:title"]', document.title);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[property="og:url"]', canonicalUrl);
  setMetaContent('meta[name="twitter:title"]', document.title);
  setMetaContent('meta[name="twitter:description"]', description);
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = canonicalUrl;
})();
