(function () {
  'use strict';

  var gallery = document.getElementById('photography');
  var dialog = document.getElementById('photography-lightbox');
  if (!gallery || gallery.hasAttribute('data-photography-initialized')) return;

  var cards = [].slice.call(gallery.querySelectorAll('a.photography-card'));
  if (!cards.length) return;
  var visibleCards = cards.slice();
  var filters = gallery.querySelector('.photography-filters');
  var filterButtons = [].slice.call(gallery.querySelectorAll('[data-photo-filter]'));
  var results = gallery.querySelector('.photography-results');

  function applyPhotoFilter(filter) {
    if (filter !== 'all' && filter !== 'pre-wedding' && filter !== 'pre-debut' && filter !== 'debut') return;
    if (dialog && dialog.open) closeLightbox();
    cards.forEach(function (card) {
      card.hidden = filter !== 'all' && card.getAttribute('data-photo-category') !== filter;
    });
    visibleCards = cards.filter(function (card) { return !card.hidden; });
    filterButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-photo-filter') === filter ? 'true' : 'false');
    });
    if (results) results.textContent = visibleCards.length + ' photographs';
  }

  if (filters && filterButtons.length) {
    filters.addEventListener('click', function (event) {
      var button = event.target.closest('[data-photo-filter]');
      if (button && filterButtons.indexOf(button) !== -1) {
        applyPhotoFilter(button.getAttribute('data-photo-filter'));
      }
    });
    filters.addEventListener('keydown', function (event) {
      var index = filterButtons.indexOf(event.target);
      if (index === -1 || event.ctrlKey || event.metaKey || event.altKey) return;
      var next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % filterButtons.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + filterButtons.length) % filterButtons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = filterButtons.length - 1;
      else return;
      event.preventDefault();
      filterButtons[next].focus({ preventScroll: true });
      applyPhotoFilter(filterButtons[next].getAttribute('data-photo-filter'));
    });
    applyPhotoFilter('all');
    filters.hidden = false;
    if (results) results.hidden = false;
  }
  gallery.setAttribute('data-photography-initialized', 'true');

  // Entrances retain the shared observer's timing. Reset at the real viewport
  // edge so a slow upward exit also replays Photography on the next visit.
  if ('IntersectionObserver' in window && document.documentElement.classList.contains('reveal-ready')) {
    var revealMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!revealMotion.matches) {
      var photoRevealsStopped = false;
      var exitObserver = new IntersectionObserver(function (entries) {
        if (photoRevealsStopped || revealMotion.matches) return;
        entries.forEach(function (entry) {
          var rect = entry.boundingClientRect;
          if (!entry.isIntersecting && (rect.bottom <= 0 || rect.top >= window.innerHeight)) {
            entry.target.classList.remove('is-visible', 'is-arriving');
            entry.target.style.removeProperty('--reveal-delay');
          }
        });
      }, { threshold: 0 });
      exitObserver.observe(gallery);
      gallery.querySelectorAll('.reveal-item').forEach(function (item) { exitObserver.observe(item); });
      var stopPhotoReveals = function (event) {
        // The shared entrance observers also disconnect permanently on reduce.
        if (event.matches) {
          photoRevealsStopped = true;
          exitObserver.disconnect();
        }
      };
      if (revealMotion.addEventListener) revealMotion.addEventListener('change', stopPhotoReveals);
      else revealMotion.addListener(stopPhotoReveals);
    }
  }

  if (!dialog || typeof dialog.showModal !== 'function' ||
      dialog.hasAttribute('data-photography-initialized')) return;

  var lightboxCards = [];
  var image = dialog.querySelector('.photography-lightbox-image');
  var title = dialog.querySelector('#photography-lightbox-title');
  var closeButton = dialog.querySelector('.photography-lightbox-close');
  var previousButton = dialog.querySelector('.photography-lightbox-prev');
  var nextButton = dialog.querySelector('.photography-lightbox-next');
  var count = dialog.querySelector('.photography-lightbox-count');
  var status = dialog.querySelector('.photography-lightbox-status');
  if (!cards.length || !image || !closeButton || !previousButton || !nextButton || !count) return;

  var root = document.documentElement;
  var selectedIndex = 0;
  var opener = null;
  var scrollLock = null;
  var imageRequest = 0;
  var bodyProperties = ['position', 'top', 'left', 'width', 'overflow', 'padding-right', 'overscroll-behavior'];
  var rootProperties = ['overflow', 'scrollbar-gutter', 'scroll-behavior'];

  function rememberStyles(element, properties) {
    return properties.map(function (property) {
      return {
        property: property,
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property)
      };
    });
  }

  function restoreStyles(element, styles) {
    styles.forEach(function (saved) {
      if (saved.value) element.style.setProperty(saved.property, saved.value, saved.priority);
      else element.style.removeProperty(saved.property);
    });
  }

  function lockScroll() {
    if (scrollLock) return;
    var body = document.body;
    var previousWidth = root.clientWidth;
    var paddingRight = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    scrollLock = {
      x: window.scrollX,
      y: window.scrollY,
      bodyStyles: rememberStyles(body, bodyProperties),
      rootStyles: rememberStyles(root, rootProperties)
    };

    // A stable gutter keeps fixed navigation aligned when desktop scrollbars disappear.
    if (window.innerWidth > previousWidth && window.CSS &&
        window.CSS.supports('scrollbar-gutter', 'stable')) {
      root.style.setProperty('scrollbar-gutter', 'stable');
    }
    root.style.setProperty('overflow', 'hidden');
    var compensation = Math.max(0, root.clientWidth - previousWidth);
    body.style.setProperty('padding-right', (paddingRight + compensation) + 'px');
    // Fixed positioning also locks the page on iOS, where overflow alone is insufficient.
    body.style.setProperty('position', 'fixed');
    body.style.setProperty('top', -scrollLock.y + 'px');
    body.style.setProperty('left', -scrollLock.x + 'px');
    body.style.setProperty('width', '100%');
    body.style.setProperty('overflow', 'hidden');
    body.style.setProperty('overscroll-behavior', 'none');
  }

  function unlockScroll() {
    if (!scrollLock) return;
    var saved = scrollLock;
    scrollLock = null;
    restoreStyles(document.body, saved.bodyStyles);
    restoreStyles(root, saved.rootStyles);
    // Restoring a saved position must bypass the site's normal smooth anchor scrolling.
    root.style.setProperty('scroll-behavior', 'auto', 'important');
    window.scrollTo(saved.x, saved.y);
    var previousBehavior = saved.rootStyles.filter(function (style) {
      return style.property === 'scroll-behavior';
    });
    restoreStyles(root, previousBehavior);
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
      status.hidden = !message;
    }
  }

  function selectPhoto(index) {
    if (!lightboxCards.length) return;
    selectedIndex = (index + lightboxCards.length) % lightboxCards.length;
    var card = lightboxCards[selectedIndex];
    var thumbnail = card.querySelector('img');
    var category = card.querySelector('.photography-category');
    var source = card.getAttribute('href');
    var description = thumbnail ? thumbnail.alt : 'ACfilms photograph';
    var request = ++imageRequest;
    var loader = new Image();

    // Clear the preceding image before loading, including during rapid next/previous clicks.
    image.hidden = true;
    image.removeAttribute('src');
    image.alt = description;
    if (title) title.textContent = category ? category.textContent.trim() + ' Photography' : 'Photography';
    count.textContent = (selectedIndex + 1) + ' / ' + lightboxCards.length;
    count.setAttribute('aria-label', 'Photograph ' + (selectedIndex + 1) + ' of ' + lightboxCards.length);
    dialog.classList.add('is-loading');
    image.setAttribute('aria-busy', 'true');
    setStatus('Loading photograph…');

    loader.onload = function () {
      if (request !== imageRequest || !dialog.open) return;
      image.width = loader.naturalWidth;
      image.height = loader.naturalHeight;
      image.src = source;
      image.hidden = false;
      image.removeAttribute('aria-busy');
      dialog.classList.remove('is-loading');
      setStatus('');
    };
    loader.onerror = function () {
      if (request !== imageRequest || !dialog.open) return;
      image.removeAttribute('aria-busy');
      dialog.classList.remove('is-loading');
      setStatus('Unable to load this photograph. Try the next or previous photograph.');
    };
    loader.decoding = 'async';
    loader.src = source;
  }

  function finishClose() {
    if (!scrollLock) return;
    ++imageRequest;
    lightboxCards = [];
    image.hidden = true;
    image.removeAttribute('src');
    image.removeAttribute('aria-busy');
    dialog.classList.remove('is-open', 'is-loading');
    setStatus('');
    unlockScroll();
    var previousOpener = opener;
    opener = null;
    if (previousOpener && previousOpener.isConnected) {
      previousOpener.focus({ preventScroll: true });
    }
  }

  function closeLightbox() {
    if (!dialog.open) return;
    dialog.close();
    finishClose();
  }

  function openLightbox(card) {
    if (card.hidden || visibleCards.indexOf(card) === -1) return false;
    // The native modal's inert backdrop normally prevents this; the guard also covers
    // programmatic activation without altering the existing video player's behavior.
    if (document.querySelector('.video-modal[open]')) return true;
    if (!dialog.open) {
      // An external close can queue its close event until after another click.
      if (scrollLock) finishClose();
      opener = card;
      lockScroll();
      try {
        dialog.showModal();
      } catch (error) {
        finishClose();
        return false;
      }
      dialog.classList.add('is-open');
      closeButton.focus({ preventScroll: true });
    }
    lightboxCards = visibleCards.slice();
    selectPhoto(lightboxCards.indexOf(card));
    return true;
  }

  gallery.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey) return;
    var card = event.target.closest('a.photography-card');
    if (!card || card.hidden || cards.indexOf(card) === -1 || card.hasAttribute('download')) return;
    if (openLightbox(card)) event.preventDefault();
  });

  closeButton.addEventListener('click', closeLightbox);
  previousButton.addEventListener('click', function () { selectPhoto(selectedIndex - 1); });
  nextButton.addEventListener('click', function () { selectPhoto(selectedIndex + 1); });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog || event.target.classList.contains('photography-lightbox-stage')) {
      closeLightbox();
    }
  });
  dialog.addEventListener('cancel', function (event) {
    event.preventDefault();
    closeLightbox();
  });
  dialog.addEventListener('close', function () {
    // Ignore an earlier queued close event if the viewer has already reopened.
    if (!dialog.open) finishClose();
  });
  dialog.addEventListener('keydown', function (event) {
    if (!dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Tab') {
      var controls = [].slice.call(dialog.querySelectorAll('button:not(:disabled)')).filter(function (button) {
        return !button.hidden && button.getClientRects().length;
      });
      var focusedIndex = controls.indexOf(document.activeElement);
      if (controls.length && event.shiftKey && focusedIndex <= 0) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (controls.length && !event.shiftKey &&
                 (focusedIndex === -1 || focusedIndex === controls.length - 1)) {
        event.preventDefault();
        controls[0].focus();
      }
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      selectPhoto(selectedIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  dialog.setAttribute('data-photography-initialized', 'true');
}());
