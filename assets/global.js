function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) {
      model.modelViewerUI.pause();
    }
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { 
      bubbles: true 
    })
		this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

	quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

	onInputChange(event) {
    this.validateQtyRules();
    this.updateBtnPrice();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    
    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) {
      this.input.dispatchEvent(this.changeEvent);
    }
  }

	updateBtnPrice() {
		const submitBtn = this.parentNode.parentNode.querySelector('.product-form__submit');
    if (!submitBtn) {
			return; 
		}

		const price = submitBtn.dataset.initialPrice;

		if (!price) {
			return; 
		}

		const numericValue = parseFloat(price.replace(/[^0-9.]/g, ''));
		const amount = this.input.value; 
		const totalPrice = numericValue * amount;
		const currencySymbol = price.replace(/[0-9.]/g, '');
		const newPrice = currencySymbol + totalPrice.toFixed(2);
		const priceContainer = submitBtn.querySelector('.price-item--regular');

		if(priceContainer) {
			priceContainer.innerHTML = newPrice;
		}
	}

	validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', value <= min);
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const serializeForm = form => {
  const obj = {};
  const formData = new FormData(form);

  for (const key of formData.keys()) {
    const regex = /(?:^(properties\[))(.*?)(?:\]$)/;

    if (regex.test(key)) { 
      obj.properties = obj.properties || {};
      obj.properties[regex.exec(key)[2]] = formData.get(key);
    } else {
      obj[key] = formData.get(key);
    }
  }

  return JSON.stringify(obj);
};

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');
    const summaryElements = this.querySelectorAll('summary');

    this.addAccessibilityAttributes(summaryElements);

    if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button:not(.localization-selector):not(.country-selector__close-button):not(.country-filter__reset-button)').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  addAccessibilityAttributes(summaryElements) {
    summaryElements.forEach(element => {
      element.setAttribute('role', 'button');
      element.setAttribute('aria-expanded', false);
      element.setAttribute('aria-controls', element.nextElementSibling.id);
    });
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));

      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
      });
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
		const closeBtn = document.querySelector(".mobile-facets__header .mobile-facets__close");
		if(closeBtn) {
			closeBtn.addEventListener('click', () => {

				this.mainDetailsToggle.classList.remove('menu-opening');
				this.mainDetailsToggle.querySelectorAll('details').forEach(details =>  {
					details.removeAttribute('open');
					details.classList.remove('menu-opening');
				});
				this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
				document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
				document.querySelector('html').classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
				this.closeAnimation(this.mainDetailsToggle);
			})
		}
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove('menu-opening');
      this.mainDetailsToggle.querySelectorAll('details').forEach(details =>  {
        details.removeAttribute('open');
        details.classList.remove('menu-opening');
      });
      this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
      document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
      document.querySelector('html').classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove('menu-opening');
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}
customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');
    this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty('--header-bottom-position', `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`);

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }
}
customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target.nodeName === 'MODAL-DIALOG') this.hide();
      });
    }
  }

  show(opener) {

    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();

    trapFocus(this, this.querySelector('[role="dialog"]'));
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;

    button.addEventListener('click', (e) => {
			e.preventDefault();
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
    
    this.positon = this.dataset.position

    if(this.positon == 1) {
      this.loadContent()
    }
  }



  loadContent() {

    if(this.positon != 1) {
       window.pauseAllMedia();
    }
    // window.pauseAllMedia();
    // if (!this.getAttribute('loaded')) {
    //   const content = document.createElement('div');

    //   content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

    //   this.setAttribute('loaded', true);
    //   this.appendChild(content.querySelector('video, model-viewer, iframe')).focus();
    // }

    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));
      this.setAttribute('loaded', true);
      this.iframe = content.querySelector('video, model-viewer, iframe');
      this.appendChild(this.iframe).focus();
    }
    if (this.getAttribute('loaded')) {
      this.focus();
			if(this.iframe.play) this.iframe.play();
    }


  }
}
customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('ul.slider--mobile');
    this.sliderItems = this.querySelectorAll('li');
    this.pageCount = this.querySelector('.slider-counter--current');
    this.pageTotal = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');
    this.sliderBullets = this.querySelectorAll('.slider-bullet');

    if (this.slider && this.nextButton) {
      const resizeObserver = new ResizeObserver(entries => this.initPages());
      resizeObserver.observe(this.slider);
  
      this.slider.addEventListener('scroll', this.update.bind(this));
      
      this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
      this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
    }

    else if (this.slider && this.sliderBullets.length != 0) {
      const resizeObserver = new ResizeObserver(entries => this.initPages());
      resizeObserver.observe(this.slider);
  
      this.slider.addEventListener('scroll', this.updateBullet.bind(this));

      this.sliderBullets.forEach(element => element.addEventListener('click', this.onBulletClick.bind(this)));
    }
    else return;
  }

  initPages() {
    const sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    this.sliderLastItem = sliderItemsToShow[sliderItemsToShow.length - 1];
    if (sliderItemsToShow.length === 0) return;
    this.slidesPerPage = Math.floor(this.slider.clientWidth / sliderItemsToShow[0].clientWidth);
    this.totalPages = sliderItemsToShow.length - this.slidesPerPage + 1;
    if (this.slider && this.nextButton) {
      this.update();
    } 
    else if (this.slider && this.sliderBullets.length != 0) {
      this.updateBullet();
    }
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    if (!this.pageCount || !this.pageTotal) return;
		
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderLastItem.clientWidth) + 1;

    if (this.currentPage === 1) {
      this.prevButton.setAttribute('disabled', true);
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.currentPage === this.totalPages) {
      this.nextButton.setAttribute('disabled', true);
    } else {
      this.nextButton.removeAttribute('disabled');
    }

    this.pageCount.textContent = this.currentPage;
    this.pageTotal.textContent = this.totalPages;
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (element.offsetLeft + element.clientWidth) <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const sliderScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + this.sliderLastItem.clientWidth : this.slider.scrollLeft - this.sliderLastItem.clientWidth;
    this.slider.scrollTo({
      left: sliderScrollPosition
    });
  }

  updateBullet() {
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderLastItem.clientWidth);
    this.sliderBullets.forEach(element => element.classList.remove("active"));
    this.sliderBullets[this.currentPage].classList.add("active");
  }

  onBulletClick(event) {
    event.preventDefault();
    const bulletScrollPosition = this.sliderLastItem.clientWidth * (event.target.getAttribute("data-bullet") - 1);

    this.slider.scrollTo({
      left: bulletScrollPosition
    });
    // this.sliderBullets.forEach(element => element.classList.remove("active"));
    // event.target.classList.add("active");
  }
  
}
customElements.define('slider-component', SliderComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
    this.changeImages(this.onVariantChange);
    this.sliderBullets = document.querySelectorAll('.slider-bullet');
    this.formModal = document.querySelector('.modal-product-detail[style="display: flex;"]') || this.closest('quick-add-modal');
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.updateStockCount();

    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
    
    if (this.sliderBullets.length != 0) {
      this.sliderBullets.forEach(element => element.classList.remove("active"));
      this.sliderBullets[0].classList.add("active");
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);

    let selectOptionsList = this.querySelectorAll('select:not([name="options[Color]"])');

    selectOptionsList.forEach((selectOptionsItem) => {
      let selectOptionsItemValue = selectOptionsItem.value;
      let escapedValue = CSS.escape(selectOptionsItemValue);
      let selectEqualInput = document.querySelector(`fieldset .radio input[value='${escapedValue}']`);
      if (selectEqualInput) {
        selectEqualInput.checked = true;
      }
    });
  }
  
  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {

    if (!this.currentVariant) return;

    if (!this.currentVariant.featured_media) return;


    let setCurrentVariant = this.closest('.product__info-container');
    setCurrentVariant.setAttribute("data-current-variant", `${this.dataset.section}-${this.currentVariant.featured_media.id}`);

    const mediaGallery = document.getElementById(`MediaGallery-${this.dataset.section}`);

    if (mediaGallery) {
      mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true);
    }

    const newMedia = document.querySelector(
      `[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`
    );

    // slider thumbs 
    const newMedia2 = document.querySelector(
      `.slider-product-thumb [data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`
    );
    const allMedia2 = document.querySelectorAll(
      `.slider-product-thumb .swiper-slide[data-media-id]`
    );
    if (newMedia2 !== null) {

      const parent2 = newMedia2.parentElement;
      
      parent2.prepend(newMedia2);

      for (var i = 0; i < allMedia2.length; i++) {
        allMedia2[i].classList.remove('swiper-slide-thumb-active');
        allMedia2[i].classList.remove('swiper-slide-active');
        allMedia2[i].classList.remove('swiper-slide-next');
      };

			
      newMedia2.classList.add('swiper-slide-thumb-active');
      newMedia2.classList.add('swiper-slide-active');

      const nextEl2 = newMedia2.nextSibling;
      nextEl2.classList.add('swiper-slide-next');
    }

    // slider thumbs end

    if (!newMedia) return;
    
    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`) || this.closest('quick-add-modal')
		
    const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
    const parent = newMedia.parentElement;
    
    if (parent.firstChild == newMedia) return;
    
    if (parent.classList.contains('gallery-denominations') == true ) {
      parent.prepend(newMedia);
			if (parent.children.length) {
				Array.from(parent.children).forEach((galeryItem) => {
					galeryItem.addEventListener('click', function() {
						if (parent.firstChild == galeryItem) return;
						modalContent.prepend(galeryItem);
						parent.prepend(galeryItem);
					});
				});
			}
    } else {
      modalContent.prepend(newMediaModal);
      parent.prepend(newMedia);
    }


    this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');

    if(this.stickyHeader) {
      this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
    }

    window.setTimeout(() => { 
      parent.scrollLeft = 0;
      let ifListExist = document.querySelector('li.product__media-item');
      if (ifListExist !== null) {
        parent.querySelector('li.product__media-item').scrollIntoView({
          behavior: 'smooth'
        });
      }
    });

  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(elementList, availableValuesList) {
    elementList.forEach((element) => {
      const value = element.getAttribute('value');
      const availableElement = availableValuesList.includes(value);

      if (element.tagName === 'INPUT') {
        element.classList.toggle('disabled', !availableElement);
      } else if (element.tagName === 'OPTION') {
        element.innerText = availableElement
          ? value
          : window.variantStrings.unavailable_with_option.replace('[value]', value);
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  updateStockCount() {
    const stockStatus  = document.querySelector('.stock-status');
    if (!stockStatus) return;

    if (this.currentVariant && this.currentVariant.available) {
      stockStatus.classList.remove('out-of-stock');
      stockStatus.classList.add('in-stock');
    } else {
      stockStatus.classList.remove('in-stock');
      stockStatus.classList.add('out-of-stock');
    }
  }

  renderProductInfo() {

    if (this.formModal) {
      fetch(`${this.dataset.url}?variant=${this.currentVariant.id}`)
      .then((response) => response.text())
      .then((responseText) => {
        
        const id = `price-${this.dataset.section}`;
        const idBadge = `price-${this.dataset.section}-badge`;
        const html = new DOMParser().parseFromString(responseText, 'text/html');
				const modal = document.querySelector(".modal-product-detail") || this.formModal;
        const destination = modal.querySelector('.product__info-container .product__price');
				
        const destinationBadge = modal.querySelector('.product__info-container .product__price');

        const source = html.querySelector('.product__info-container .product__price');
				
        const sourceBadge = html.getElementById(idBadge);

        if (source && destination) {
          destination.innerHTML = source.innerHTML;
        }

        if (sourceBadge && destinationBadge) {
          destinationBadge.innerHTML = sourceBadge.innerHTML;
        }

        const price = modal.querySelector(`#price-${this.dataset.section}`);

        if (price) {
					price.classList.remove('visibility-hidden');
					const initialPrice = price.querySelector('.price-item--regular')?.innerHTML || submitBtn.dataset.initialPrice;
					const submitBtn = this.closest('.product').querySelector('.product-form__submit');
					
					if (submitBtn && submitBtn?.dataset?.initialPrice && initialPrice) {
						submitBtn.dataset.initialPrice = initialPrice;
					}
				} 

        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
    } else {

      const requestedVariantId = this.currentVariant.id;
      const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

      fetch(`${this.dataset.url}?variant=${requestedVariantId}`)
        .then((response) => response.text())
        .then((responseText) => {

          // if (this.currentVariant.id !== requestedVariantId) return;

          const id = `price-${this.dataset.section}`;
          const idBadge = `price-${this.dataset.section}-badge`;
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const destination = document.getElementById(id);
          const destinationBadge = document.getElementById(idBadge);
          const source = html.getElementById(id);

          const sourceBadge = html.getElementById(idBadge);
					const skuSource = html.getElementById(
						`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
					);
					const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
					const inventorySource = html.getElementById(
						`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
					);
					const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);

          if (source && destination) {
            destination.innerHTML = source.innerHTML;
						
          }

          if (sourceBadge && destinationBadge) {
            destinationBadge.innerHTML = sourceBadge.innerHTML;
          }
  
          const price = document.getElementById(`price-${this.dataset.section}`);
  
          if (price) {
						price.classList.remove('visibility-hidden');
						const initialPrice = price.querySelector('.price-item--regular')?.innerHTML || submitBtn.dataset.initialPrice;
						
						const submitBtn = this.closest('.product').querySelector('.product-form__submit');
						
						if (submitBtn && submitBtn?.dataset?.initialPrice && initialPrice) {
							submitBtn.dataset.initialPrice = initialPrice;
						}
					} 

					if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
					if (skuSource && skuDestination) {
						skuDestination.innerHTML = skuSource.innerHTML;
						skuDestination.classList.toggle('hidden', skuSource.classList.contains('hidden'));
					}

					if (inventoryDestination && inventorySource)
          inventoryDestination.classList.toggle('hidden', inventorySource.innerText === '');

					if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
					if (skuSource && skuDestination) {
						skuDestination.innerHTML = skuSource.innerHTML;
						skuDestination.classList.toggle('hidden', skuSource.classList.contains('hidden'));
					}

					if (inventoryDestination && inventorySource)
          inventoryDestination.classList.toggle('hidden', inventorySource.innerText === '');
				
          this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
        });
    } 
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    if (this.formModal) {
			const modal = document.querySelector(".modal-product-detail") || this.formModal;
      const productForm = modal.querySelector(`.form-modal#product_form_${this.dataset.section}`) || modal.querySelector('.product-form__buttons');
      if (!productForm) return;
      const addButton = productForm.querySelector('[name="add"]');

      if (!addButton) return;

      if (disable) {
        addButton.setAttribute('disabled', true);
        if (text) addButton.textContent = text;
      } else {
        addButton.removeAttribute('disabled');
        addButton.textContent = window.variantStrings.addToCart;
      }

			const submitBtn = this.parentNode.parentNode.querySelector('.product-form__submit');
			
			if (submitBtn) {
				
				const initialPrice = submitBtn.dataset.initialPrice;
				
				let amount = 1;
				const quantityInput = this.parentNode.parentNode.querySelector('quantity-input');

				if (quantityInput) {
					amount = quantityInput.input.value;
				}
				if (initialPrice) {
					const numericValue = parseFloat(initialPrice.replace(/[^0-9.]/g, ''));
					const totalPrice = numericValue * amount;
					const currencySymbol = initialPrice.replace(/[0-9.]/g, '');
					const newPrice = currencySymbol + totalPrice.toFixed(2);

					const priceContainer = document.createElement('div');
					priceContainer.classList.add('price__container');
					priceContainer.innerHTML = `
						<div class="price__regular">
							<span class="price-item price-item--regular">
							${newPrice}
							</span>
						</div>
					`
					submitBtn.prepend(priceContainer)
				}
			}

      if (!modifyClass) return;

    } else {

      const productForm = document.getElementById(`product-form-${this.dataset.section}`);
      if (!productForm) return;
      const addButton = productForm.querySelector('[name="add"]');
  
      if (!addButton) return;
  
      if (disable) {
        addButton.setAttribute('disabled', true);
        if (text) addButton.textContent = text;
      } else {
        addButton.removeAttribute('disabled');

        addButton.textContent = window.variantStrings.addToCart;

				const submitBtn = this.parentNode.parentNode.querySelector('.product-form__submit');
				
				if (submitBtn) {
					
					const initialPrice = submitBtn.dataset.initialPrice;
					
					let amount = 1;
					const quantityInput = this.parentNode.parentNode.querySelector('quantity-input');

					if (quantityInput) {
						amount = quantityInput.input.value;
					}
					if (initialPrice) {
						const numericValue = parseFloat(initialPrice.replace(/[^0-9.]/g, ''));
						const totalPrice = numericValue * amount;
						const currencySymbol = initialPrice.replace(/[0-9.]/g, '');
						const newPrice = currencySymbol + totalPrice.toFixed(2);

						const priceContainer = document.createElement('div');
						priceContainer.classList.add('price__container');
						priceContainer.innerHTML = `
							<div class="price__regular">
								<span class="price-item price-item--regular">
								${newPrice}
								</span>
							</div>
						`
						submitBtn.prepend(priceContainer)
					}
				}
      }
  
      if (!modifyClass) return;
    };
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const price = document.getElementById(`price-${this.dataset.section}`);

    if (!addButton) return;
    addButton.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  changeImages(callback) {
    
    let thumbnails = document.querySelectorAll('.ab-product-gift img');
    let this_calback = this;
    let infoDenominations = this.closest(".product__info-wrapper");
    let checkDenominations = infoDenominations.classList.contains('info-denominations');
    
    if (thumbnails.length > 1 && document.querySelectorAll('.ab-product-gift').length) {
      
      thumbnails.forEach((item) => {
        
        let itemParent = item.closest(".product__media-item");
        
        itemParent.addEventListener('click', (e) => {

          itemParent.parentNode.prepend(itemParent);

          e.preventDefault();

          if (checkDenominations == true) {

            let imgSrc = item.getAttribute('src').split('?')[0].split('.');
            let strExtention = imgSrc.pop();
            let strRemaining = imgSrc.pop().replace(/\?v=.*?$/g,'');
            let strNewImage = imgSrc.join('.')+"."+strRemaining+"."+strExtention;


            if (typeof variantImages[strNewImage] !== 'undefined') {

              productOptions.forEach(function (value, i) {

                optionValue = variantImages[strNewImage]['option-'+i];

                let optionValue1 = variantImages[strNewImage]['option-0'];

                let variantDenomination1 = Object.values(infoDenominations.querySelectorAll('.product-form__input--pills input'));
                let variantDenomination2 = Object.values(infoDenominations.querySelectorAll('.product-form__input--dropdown select option'));

                if (variantDenomination1.length > 0) {
                  variantDenomination1[i].removeAttribute("checked");

                  if (optionValue1 == variantDenomination1[i].value) {
                    variantDenomination1[i].checked = true;
                  }

                } else if (variantDenomination2.length > 0) {
                  variantDenomination2.forEach((option) => {
                    if (optionValue1 == option.value) {
                      option.selected = true;
                    }
                  });
                }
              });
            }

            callback.call(this_calback);
          }
        });
      });
    }
  }
}
customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      let selectedVariant = Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
      let colorLabel = fieldset.querySelectorAll('.color-label');

      const fieldsetsColor = Array.from(this.querySelectorAll('fieldset.variant-color'));
      if (fieldsetsColor.length){
        fieldsetsColor.map((fieldsetsColorItem) => {
  
          let fieldsetsColorVariants = Array.from(fieldsetsColorItem.querySelectorAll('input'));
          let fieldsetsColorSelected = fieldsetsColorVariants.find((radio) => radio.checked).value;
          let colorHiddenSelect = document.querySelector('.select__select[name="options[Color]"]');
          if (colorHiddenSelect) {
            colorHiddenSelect.querySelector(`[value="${fieldsetsColorSelected}"]`).selected = 'selected';
          }
        });
      }

      if (selectedVariant && colorLabel.length > 0) {
        colorLabel[0].innerHTML = selectedVariant;
      }

      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}
customElements.define('variant-radios', VariantRadios);

// header
const minWidthForHover = 990;
const menuDropdownsHover = document.querySelectorAll('.on-hover [id^="Details-HeaderSubMenu-"] .list-menu__item');

function toggleDropdown(dropdown, addAttribute) {
	const parentDetails = dropdown.closest('[id^="Details-HeaderSubMenu-"]');
	if (parentDetails && window.innerWidth >= minWidthForHover) {
		addAttribute ? parentDetails.setAttribute('open', 'open') : parentDetails.removeAttribute('open');
	}
}

if (menuDropdownsHover.length) {
	menuDropdownsHover.forEach(dropdown => {
		dropdown.addEventListener('mouseenter', () => toggleDropdown(dropdown, true));
		dropdown.addEventListener('mouseleave', () => toggleDropdown(dropdown, false));
	});
}

const menuDropdownsClick = document.querySelectorAll('.header__submenu:not(.on-hover)>li');

function closeSiblings(dropdown) {
	const siblings = Array.from(dropdown.parentElement.children);
		siblings.forEach(sibling => {
			const details = sibling.querySelector('[id^="Details-HeaderSubMenu-"]')
			if (details && sibling !== dropdown && details.hasAttribute('open')) {
				details.removeAttribute('open');
			}
	});
}

if (menuDropdownsClick.length) {
	menuDropdownsClick.forEach(dropdown => {
		dropdown.addEventListener('click', () => {
			closeSiblings(dropdown);
		});
	})
}

class MegaMenuHover extends HTMLElement {
  constructor() {
    super();
    this.megaMenuItemsImage = document.querySelectorAll('.header__submenu a[data-image]');
    this.megaMenuItemsImage.forEach(element => element.addEventListener('mouseover', this.onLinkHover.bind(this)));
		this.currentImage = null;
  }

  onLinkHover(event) {
    event.preventDefault();
    const linkDataImage = event.target.dataset.image;

    if (linkDataImage.length > 0) {
			if (this.currentImage == linkDataImage) return;
      const megaMenuImageWrp = event.target.closest('.header__submenu-main').querySelector('.js-megaMenuImgWrp');
      const collectionImage = `<img srcset="${linkDataImage}" src="${linkDataImage}" loading="lazy" width="555" height="421" alt="Collection image">`;
      megaMenuImageWrp.innerHTML = collectionImage;
			this.currentImage = linkDataImage;
    }
  }
}
customElements.define('variant-megamenu-img', MegaMenuHover);

// number validation
if (document.querySelectorAll('input[type=number]') != null) {
  const validateNumber = (e) => { if (e.which < 48 || e.which > 57) { e.preventDefault() } }
  const preventEmpty = (e) => { if (!e.target.value.length) { e.target.value = 1 } }
  document.querySelectorAll('input[type=number]').forEach(i => { i.addEventListener('input', (e) => { validateNumber(e) }) });
  document.querySelectorAll('input[type=number]').forEach(i => { i.addEventListener('keypress', (e) => { validateNumber(e) }) });
  document.querySelectorAll('input[type=number]').forEach(i => { i.addEventListener('focusout', (e) => { preventEmpty(e) }) })
}

// email validation
if (document.querySelectorAll('input[type=email]') != null) {
  const validateEmail = (e) => {
    const target = e.target;
    const email = target.value;
    const parentForm = target.closest('form');
    const submit = parentForm.querySelector('button[type=submit]');

    // email regular expression
    const emailRegExp = (email) => {
      return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
    };

    if (emailRegExp(email)) {
      // valid
      target.style.boxShadow = "";
      target.style.backgroundColor = "rgba(0,128,0,.2)";
      target.classList.add('valid');
      // if (submit) {
      //   submit.disabled = false;
      // }
    }
    else {
      // not valid
      target.classList.remove('valid');
      // if (submit) {
      //   submit.disabled = true;
      // }
    }
  }
  document.querySelectorAll('input[type=email]').forEach(i => { i.addEventListener('input', (e) => { validateEmail(e) }) });
  document.querySelectorAll('input[type=email]').forEach(i => { i.addEventListener('focus', (e) => { validateEmail(e) }) });
  document.querySelectorAll('input[type=email]').forEach(i => { i.addEventListener('focusout', (e) => { e.target.style.backgroundColor = ''; }) });
}

// open Cart Notification
if (document.querySelectorAll('.cart-modal') != null) {
  document.querySelectorAll('.cart-modal').forEach(i => {
    i.addEventListener('click', () => {
      document.querySelector('#cart-notification').classList.add('active');
      document.body.classList.add('overflow-hidden')
    });
  });
}

// comment form
if (document.getElementById('comment_form')) {
  const commentForm = document.getElementById('comment_form');
  const commentAuthor = commentForm.querySelector('#CommentForm-author');
  const commentEmail = commentForm.querySelector('#CommentForm-email');
  const commentText = commentForm.querySelector('#CommentForm-body');
  const commentSubmit = commentForm.querySelector('input[type=submit]');
  
  // check comment author
  commentAuthor.addEventListener('input', (e) => {
    e.target.value ? e.target.classList.add('valid') : e.target.classList.remove('valid');
    e.target.classList.contains('valid') && commentEmail.classList.contains('valid') && commentText.classList.contains('valid') ? commentSubmit.disabled = false : commentSubmit.disabled = true;
  });
  
  // check comment email
  commentEmail.addEventListener('input', (e) => {
    e.target.classList.contains('valid') && commentAuthor.classList.contains('valid') && commentText.classList.contains('valid') ? commentSubmit.disabled = false : commentSubmit.disabled = true;
  });
  
  // check comment text
  commentText.addEventListener('input', (e) => {
    e.target.value ? e.target.classList.add('valid') : e.target.classList.remove('valid');
    e.target.classList.contains('valid') && commentAuthor.classList.contains('valid') && commentEmail.classList.contains('valid') ? commentSubmit.disabled = false : commentSubmit.disabled = true;
  });
}

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (!this.querySelector('.complementary-products__slideshow') && this.classList.contains('complementary-products')) {
            this.remove();
          }

          if (html.querySelector('.grid__item')) {
            this.classList.add('product-recommendations--loaded');
          }

					const slider = this.querySelector('.swiper');
					const slidesPerView = this.dataset.slidesPerView;
					let slidesPerViewMobile = 1;

          if (slidesPerView >= 2) {
            slidesPerViewMobile = 2;
          }

					if (slider && slidesPerView) {
						const swiper = new Swiper(slider, {
							slidesPerView: slidesPerViewMobile,
							slidesPerGroup: slidesPerViewMobile,
							spaceBetween: 15,
							allowTouchMove: false,
							centeredSlides: false,
							centeredSlidesBounds: true,
							navigation: {
								nextEl: this.querySelector('.swiper-button-next'),
								prevEl: this.querySelector('.swiper-button-prev'),
							},
							breakpoints: {
								950: {
									slidesPerView: slidesPerView,
									slidesPerGroup: slidesPerView,
								}
							},
							on: {
								slideChange: function () {
									updatePagination();
								},
							},
						})
						const updatePagination = () => {
							var swiperPagination = this.querySelector('.swiper-pagination-custom');
							var currentSlide = swiper.snapIndex + 1;
							var totalSlides = swiper.snapGrid.length;
							swiperPagination.textContent = currentSlide + ' / ' + totalSlides;
						}
						updatePagination();
					}
        })
        .catch(e => {
          console.error(e);
        });
    }

    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
  }
}
customElements.define('product-recommendations', ProductRecommendations);

class VariantSwatch extends HTMLElement {
  constructor() {
    super();
		this.elements = {};
		this.options = null;
  }

	connectedCallback() {
		this.getElements();
    this.addEventListener('click', this.onClick);
		this.currentId = this.dataset.productId
	}

	disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
	}

	getElements() {
		this.elements.labels = this.querySelectorAll('.variant-swatch__label-wrapper')
		this.elements.product = this.closest('.product-card');
		const product = this.elements.product;
		if (!product) return;

		this.elements.forms = [...product.querySelectorAll('.form')];
		this.elements.imgWrappers = product.querySelectorAll('.media');
		if (product.classList.contains('style-4')) {
			const form = product.nextElementSibling;
			if (form) {
				this.elements.forms.push(form)
			}
		}
	}
  onClick(event) {
		event.preventDefault();
		event.stopPropagation();

    this.updateOptions(event);
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updateVariantStatuses();

    if (this.currentVariant) {
      this.updateMedia();
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }

	getTargetLabel(target) {
		if (!target) return null;
		if (target.classList.contains('')) return target;
		const parent = target.closest('.variant-swatch__label-wrapper')
		if(parent) return parent
	}

  updateOptions(e) {
		const target = this.getTargetLabel(e.target);
		
		if (!target) return;

    this.options = Array.from(this.querySelectorAll('variant-swatch-input'), (element) => {
			const option =  Array.from(element.querySelectorAll('.variant-swatch__label-wrapper')).find((label) => label == target || label.classList.contains('checked'))
			let value = null
			if (option) {
				value = option?.dataset.value;
			}
			return value;
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
					if (this.options) {
						return this?.options[index] === option;
					}
        })
        .includes(false);
    });
  }


  updateMedia() {
		const imgWrappers = this.elements.imgWrappers;
		
    if (!this.currentVariant && !imgWrappers) return;
		imgWrappers.forEach(wrapper => {
			const img = wrapper.querySelector('img');
			if (this.currentVariant.featured_image) {
				img.src = this.currentVariant.featured_image.src;
				img.srcset = this.currentVariant.featured_image.src;
			}
		})
  }

  updateVariantInput() {
    const productForms = this.elements.forms;
		if (!productForms) return;

    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');

			if (!input) return;
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector('.checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(elementList, availableValuesList) {
    elementList.forEach((element) => {
      const value = element.getAttribute('value');
      const availableElement = availableValuesList.includes(value);

      if (element.tagName === 'INPUT') {
        element.classList.toggle('disabled', !availableElement);
      } else if (element.tagName === 'OPTION') {
        element.innerText = availableElement
          ? value
          : window.variantStrings.unavailable_with_option.replace('[value]', value);
      }
    });
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    fetch(
      `${this.dataset.url}?variant=${requestedVariantId}`
    )
      .then((response) => response.text())
      .then((responseText) => {
        if (this.currentVariant.id !== requestedVariantId) return;
        const html = new DOMParser().parseFromString(responseText, 'text/html');
				
				// Update label availability
				this.updateLabelsAvailability(html);

				// Update button state
        const addButtonUpdated = html.querySelector(`.product-section .product-form__submit`);
				const btnText = addButtonUpdated.hasAttribute('disabled') ? window.variantStrings.soldOut : window.variantStrings.addToCart;
        this.toggleAddButton(
          addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true,
          btnText
        );
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForms = this.elements.forms;
    if (!productForms) return;

		productForms.forEach((productForm) => {

			const addButton = productForm.querySelector('[name="add"]');
			const addButtonText = productForm.querySelector('[name="add"] > span');
			if (!addButton) return;

			if (disable) {
				addButton.setAttribute('disabled', 'disabled');
				if (text) {
					if (addButton) addButton.textContent = text;
					if (addButtonText) addButtonText.textContent = text;
				}
			} else {
				addButton.removeAttribute('disabled');

				if (addButton) addButton.textContent = text;
				if (addButtonText) addButtonText.textContent = window.variantStrings.addToCart;
			}

			if (!modifyClass) return;
		})
  }

	updateLabelsAvailability(html) {
		if(!html) return;
		const options = html.querySelectorAll('.variant-picker input, .variant-picker option')
		if (!options) return;

		options.forEach((option) => {
			const optionValue = option.value;
			const isDisabled = option.classList.contains('disabled') ? true : false;
			this.elements.labels.forEach(label => {
				const { value, name } = label.dataset
				if (value == optionValue) {
					if (isDisabled) {
						label.classList.add('disabled')
					} else {
						label.classList.remove('disabled')
					}
				}
			})
		})
	}

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-swatch', VariantSwatch);
class VariantSwatchInput extends HTMLElement {
  constructor() {
    super();
		this.elements = {};
		this.swiper = null;
		this.timeoutId = null;
  }

	connectedCallback() {
		this.getElements();

		this.onClick = this.onClick.bind(this)
    this.addEventListener('click', this.onClick);
		this.timeoutId = setTimeout(() => this.initSlider(), 1000);
	}
	
	disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
		this.timeoutId = null;
	}

  getElements() {
		this.elements.labels = this.querySelectorAll('.variant-swatch__label-wrapper');
		this.elements.swiperWrapper = this.querySelector('.variant-swatch__wrapper');
		this.elements.checkedElement = this.querySelector('.checked');
	}

	initSlider() {	
		if (!this.elements.labels || this.elements.labels.length < 4) return;

		this.classList.add('swiper');
		this.elements.swiperWrapper.classList.add('swiper-wrapper');
		this.elements.labels.forEach(label => label.classList.add('swiper-slide'));

		this.swiper = new Swiper(this, {
			slidesPerView: 'auto',
			spaceBetween: 8,
		})
	}

  onClick(e) {
		const targetLabel = this.getTargetLabel(e.target);
    if (!targetLabel || targetLabel === this.elements.checkedElement) return;

    if (this.elements.checkedElement) {
      this.elements.checkedElement.classList.remove('checked');
    }

    targetLabel.classList.add('checked');
    this.elements.checkedElement = targetLabel;	
	}

	getTargetLabel(target) {
		if (!target) return null;
		if (target.classList.contains('.variant-swatch__label-wrapper')) return target;
		const parent = target.closest('.variant-swatch__label-wrapper');
		if(parent) return parent
	}
}

customElements.define('variant-swatch-input', VariantSwatchInput);

console.log('Abode-3.1.0');