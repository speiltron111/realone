class CollectionFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.filterData = [];
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.collectionTemplate = document.querySelector(".collection-grid-section");
    this.searchTemplate = document.querySelector(".template-search");

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
    window.addEventListener('popstate', this.onHistoryChange.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  onSubmitHandler(event) {
    if (this.collectionTemplate) {
      event.preventDefault();
      const formData = new FormData(event.target.closest('form'));
      const searchParams = new URLSearchParams(formData).toString();
      this.renderPage(searchParams, event);

    } else if (this.searchTemplate) {
      // Store the initial URL so that we can get the search query from it to add to the formData object
      const searchParamsInitial = new URLSearchParams(window.location.search);

      // Get the selected result types, we will need to use them later
      const activeTypes = document.querySelector('#page-type-input').value;
      const types = Array.from(activeTypes.split(','));
      const defaultTypes = document.querySelector('#CollectionFiltersForm input[name="type"]');

      if (activeTypes == "") {
        const getInput = document.querySelector('#page-type-input');
        getInput.value = defaultTypes.value;
      }

      // Add the initial search query to the formData object otherwise the query will be lost and we will get an error
      const formData = new FormData(event.target.closest('form'));
      formData.append('q', searchParamsInitial.get('q'));

      // If the result type is not of type product, we want to disable the filter inputs and remove product type queries from the URL
      if (types.includes('article') && !types.includes('product') || types.includes('page') && !types.includes('product')) {
        const getInputs = document.querySelectorAll(`#${this.filterFormsId} input:not(#page-type-input)`);
        const getLabels = document.querySelectorAll(`#${this.filterFormsId} label:not(.collection-filters__label)`);

        // Disable the inputs if the result type is article or page
        for (let item of getInputs) {
          item.setAttribute('disabled', 'disabled');
        }

        for (let inputLabel of getLabels) {
          inputLabel.classList.add('facet-checkbox--disabled');
        }

        // If our result is an article or page type, remove all product related filters from the URL
        if (searchParamsInitial.has('filter.p.product_type')) {
          let newFormData = new URLSearchParams(window.location.search).toString();
          formData.delete('filter.p.product_type');
          this.renderPage(newFormData, event);
        }

        if (searchParamsInitial.has('filter.p.vendor')) {
          let newFormData = new URLSearchParams(window.location.search).toString();
          formData.delete('filter.p.vendor');
          this.renderPage(newFormData, event);
        }

        if (searchParamsInitial.has('filter.v.availability')) {
          let newFormData = new URLSearchParams(window.location.search).toString();
          formData.delete('filter.v.availability');
          this.renderPage(newFormData, event);
        }
      }



      const searchParams = new URLSearchParams(formData).toString();
      event.preventDefault();
      this.renderPage(searchParams, event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    this.toggleActiveFacets();
    this.renderPage(new URL(event.currentTarget.href).searchParams.toString());
  }

  onHistoryChange(event) {
    const searchParams = event.state ? event.state.searchParams : '';
    this.renderPage(searchParams, null, false);
  }

  toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  renderPage(searchParams, event, updateURLHash = true) {
    const sections = this.getSections();
    const countContainerDesktop = document.getElementById('CollectionProductCountDesktop');
    const IfCollectionProductCount = document.getElementById('CollectionProductCount');
    document.getElementById('CollectionProductGrid').querySelector('.collection').classList.add('loading');

    if (IfCollectionProductCount) {
      document.getElementById('CollectionProductCount').classList.add('loading');
    }

    if (countContainerDesktop){
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      this.filterData.some(filterDataUrl) ?
        this.renderSectionFromCache(filterDataUrl, event) :
        this.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) this.updateURLHash(searchParams);
  }

  renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        this.filterData = [...this.filterData, { html, url }];
        this.renderFilters(html, event);
        this.renderProductGrid(html);
        this.renderProductCount(html);
        this.openProductModal();
      });
  }

  renderSectionFromCache(filterDataUrl, event) {
    const html = this.filterData.find(filterDataUrl).html;
    this.renderFilters(html, event);
    this.renderProductGrid(html);
    this.renderProductCount(html);
  }

  renderProductGrid(html) {
    if (this.collectionTemplate) {

      let colCount = document.getElementById('main-collection-product-grid').classList;
      
      document.getElementById('CollectionProductGrid').innerHTML = new DOMParser()
        .parseFromString(html, 'text/html')
        .getElementById('CollectionProductGrid').innerHTML;
      
      colCount.forEach((colC) => {
        document.getElementById('main-collection-product-grid').classList.add(colC);
      });

      let navigation_layout_button = document.querySelector('nav.navigation-layout');
      let layout_button_2 = document.querySelector('.layout-2-col');
      let layout_button_3 = document.querySelector('.layout-3-col');
      let layout_button_4 = document.querySelector('.layout-4-col');
      let list_of_products = document.querySelector('.main-collection__list');

      if (navigation_layout_button) {
        if (layout_button_2.classList.contains('active')) {
          list_of_products.classList.remove('col-1');
          list_of_products.classList.remove('col-3');
          list_of_products.classList.remove('col-4');
          list_of_products.classList.add('col-2');
        } else if (layout_button_3.classList.contains('active')) {
          list_of_products.classList.remove('col-1');
          list_of_products.classList.remove('col-2');
          list_of_products.classList.remove('col-4');
          list_of_products.classList.add('col-3');
        } else if (layout_button_4.classList.contains('active')) {
          list_of_products.classList.remove('col-1');
          list_of_products.classList.remove('col-2');
          list_of_products.classList.remove('col-3');
          list_of_products.classList.add('col-4');
        }
      }

    } else if (this.searchTemplate) {

      const searchParamsInitial = new URLSearchParams(window.location.search);
      let beforeNewContent = new DOMParser()
          .parseFromString(html, 'text/html')
          .getElementById('CollectionProductGrid');

      if (beforeNewContent) {
        let newContent = beforeNewContent.innerHTML;
        document.getElementById('CollectionProductGrid').innerHTML = newContent;
      }

      const renderPaginate = new CustomEvent("paginate");
      document.dispatchEvent(renderPaginate);
    }
  }

  openProductModal() {
    const modal = document.querySelector('.modal-product-detail');
    let btns_modal_open = document.querySelectorAll('.button-product-detail');
    setTimeout(() => {
      btns_modal_open = document.querySelectorAll(".button-product-detail");
    }, "300");

    const btn_modal_close = document.querySelector('.modal-product-detail .close');
    const btnFormSubmit = document.querySelector('.modal-product-detail .product-form__submit');

    var Shopify = Shopify || {};
    Shopify.money_format = "${{ amount }}";
    Shopify.formatMoney = function(cents, format) {
      if (typeof cents == 'string') { 
        cents = cents.replace('.',''); 
      }
      var value = '';
      var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      // var formatString = (format || this.money_format);
      var formatString = this.money_format;

      function defaultOption(opt, def) {
        return (typeof opt == 'undefined' ? def : opt);
      }

      function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = defaultOption(precision, 2);
        thousands = defaultOption(thousands, ',');
        decimal   = defaultOption(decimal, '.');

        if (isNaN(number) || number == null) { return 0; }

        number = (number/100.0).toFixed(precision);

        var parts   = number.split('.'),
            dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
            cents   = parts[1] ? (decimal + parts[1]) : '';
        return dollars + cents;
      }
			
      const matchResult = formatString.match(placeholderRegex);
			if (matchResult) {
				switch(matchResult[1]) {
					case 'amount':
						value = formatWithDelimiters(cents, 2);
						break;
					case 'amount_no_decimals':
						value = formatWithDelimiters(cents, 0);
						break;
					case 'amount_with_comma_separator':
						value = formatWithDelimiters(cents, 2, '.', ',');
						break;
					case 'amount_no_decimals_with_comma_separator':
						value = formatWithDelimiters(cents, 0, '.', ',');
						break;
				}
			}
      return formatString.replace(placeholderRegex, value);
    };

    function openProductModal() {
      setTimeout(() => {
        btns_modal_open = document.querySelectorAll(".button-product-detail");
      }, "600");
      btns_modal_open.forEach(function (btn_modal_open_item) {
        btn_modal_open_item.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();

          let product_url = this.dataset.productUrl.split('?')[0];
          if (product_url.indexOf('.js') == -1) {
            product_url += '.js';
          }

          fetch(product_url)
            .then((response) => response.json())
            .then((data) => {
              // gallery
              let mainGallery = document.querySelector('#Slider-Gallery-quickview .swiper-wrapper');
              let thumbsGallery = document.querySelector('#Slider-Thumbnails-quickview .swiper-wrapper');
              let formInputId = document.querySelector('#product-form-quickview input[name="id"]'); 
              formInputId.value = data.variants[0]?.id;

              if (data.media) {
                data.media.forEach(function (dataMedia, index) {
                  document.querySelector('.slider-thumbs-wrapp').style.display = 'block';
                  document.querySelector('.swiper-button-next').style.display = 'flex';
                  document.querySelector('.swiper-button-prev').style.display = 'flex';

                  if (dataMedia.media_type == 'image') {
                    mainGallery.innerHTML += `
                        <div class="swiper-slide animate--fade-in" data-media-id="${dataMedia.id}">
                          <img srcset="${dataMedia.preview_image.src}"
                            src="${dataMedia.preview_image.src}"
                            sizes="(min-width: 320px) 500px"
                            loading="lazy"
                            width="${dataMedia.width}"
                            height="${dataMedia.height}"
                            alt="${data.title}">
                        </div>`;
                  } else if (dataMedia.media_type == 'video') {
                    mainGallery.innerHTML += `
                        <div class="swiper-slide animate--fade-in">
                            <deferred-media class="deferred-media media" style="height: 100%" data-media-id="${dataMedia.id}">
                              <video class="video-url-${index}" controls></video>
                            </deferred-media>
                        </div>`;
                    let videoUrl = document.querySelector('.video-url-' + index + '');
                    dataMedia.sources.forEach(function (dataSources, index) {
                      videoUrl.innerHTML += `<source src="${dataSources.url}" type="${dataSources.mime_type}">`;
                    });
                  } else if (dataMedia.media_type == 'external_video') {
                    if (dataMedia.host == 'youtube') {
                      mainGallery.innerHTML += `
                        <div class="swiper-slide">
                          <img srcset="${dataMedia.preview_image.src}" class="video-preview-image" src="${dataMedia.preview_image.src}"
                              loading="lazy" width="50" height="50" alt="${data.title}">

                          <div class="loading-overlay">
                            <div class="loading-overlay__spinner">
                              {% render 'icon-spinner' %}
                            </div>
                          </div>

                          <deferred-media class="deferred-media media" style="height: 100%" data-media-id="${dataMedia.id}">
                            <iframe class="js-youtube externa-video-url-${index}" width="100%" height="100%" src="" loading="lazy"></iframe> 
                          </deferred-media>
                        </div>`;

                      let videoUrl = document.querySelector('.externa-video-url-' + index + '');
                      videoUrl.setAttribute(
                        'src',
                        'https://www.youtube.com/embed/' + dataMedia.external_id + '?controls=1'
                      );
                    } else if (dataMedia.host == 'vimeo') {
                      mainGallery.innerHTML += `
                        <div class="swiper-slide">
                            <deferred-media class="deferred-media media" style="height: 100%" data-media-id="${dataMedia.id}">
                              <iframe class="externa-video-url-${index}" width="100%" height="100%" src=""></iframe> 
                            </deferred-media>
                        </div>`;

                      let videoUrl = document.querySelector('.externa-video-url-' + index + '');
                      videoUrl.setAttribute('src', 'https://player.vimeo.com/video/' + dataMedia.external_id + '');
                    } else {
                      mainGallery.innerHTML += `
                        <div class="swiper-slide">
                          <img srcset="${dataMedia.preview_image.src}"
                            src="${dataMedia.preview_image.src}"
                            sizes="(min-width: 320px) 500px"
                            loading="lazy"
                            width="${dataMedia.width}"
                            height="${dataMedia.height}"
                            alt="${data.title}">
                        </div>`;
                    }
                  } else if (dataMedia.media_type == 'model') {
                    const objectFormat = dataMedia.sources.find((element) => element.format === 'glb');
                    let objectUrl = false;
                    if (objectFormat) {
                      objectUrl = objectFormat.url;
                    }

                    mainGallery.innerHTML += `
                        <div class="swiper-slide">
                          <product-model class="deferred-media media media--transparent no-js-hidden" style="height:100%" data-media-id="${
                            dataMedia.id
                          }">
                            <button id="Deferred-Poster-${dataMedia.id}" class="deferred-media__poster" type="button">
                              <span class="deferred-media__poster-button motion-reduce">
                                <span class="visually-hidden">{{ 'products.product.media.play_model' | t }}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" role="presentation" class="icon icon-3d-model" fill="none" viewBox="0 0 18 21">
                                  <path d="M7.67998 20.629L1.28002 16.723C0.886205 16.4784 0.561675 16.1368 0.337572 15.731C0.113468 15.3251 -0.00274623 14.8686 -1.39464e-05 14.405V6.59497C-0.00238367 6.13167 0.113819 5.6755 0.33751 5.26978C0.561202 4.86405 0.884959 4.52227 1.278 4.27698L7.67796 0.377014C8.07524 0.131403 8.53292 0.000877102 8.99999 9.73346e-08C9.46678 -0.000129605 9.92446 0.129369 10.322 0.374024V0.374024L16.722 4.27399C17.1163 4.51985 17.4409 4.86287 17.6647 5.27014C17.8885 5.67742 18.0039 6.13529 18 6.59998V14.409C18.0026 14.8725 17.8864 15.3289 17.6625 15.7347C17.4386 16.1405 17.1145 16.4821 16.721 16.727L10.321 20.633C9.92264 20.8742 9.46565 21.0012 8.99999 21C8.53428 20.9998 8.07761 20.8714 7.67998 20.629V20.629ZM8.72398 2.078L2.32396 5.97803C2.22303 6.04453 2.14066 6.13551 2.08452 6.24255C2.02838 6.34959 2.00031 6.46919 2.00298 6.59003V14.4C2.00026 14.5205 2.02818 14.6396 2.08415 14.7463C2.14013 14.853 2.22233 14.9438 2.32298 15.01L7.99999 18.48V10.919C8.00113 10.5997 8.08851 10.2867 8.25292 10.0129C8.41732 9.73922 8.65267 9.51501 8.93401 9.36401L15.446 5.841L9.28001 2.08002C9.19614 2.02738 9.09901 1.99962 8.99999 2C8.90251 1.99972 8.8069 2.02674 8.72398 2.078V2.078Z" fill="currentColor"/>
                                </svg>
                              </span>
                              <img srcset="${dataMedia.preview_image.src}"
                                src="${dataMedia.preview_image.src}"
                                sizes="(min-width: 320px) 500px"
                                loading="lazy"
                                width="576"
                                height="${dataMedia.preview_image.height / 2}"
                                alt="${data.title}">
                            </button>
                            <template>
                              <model-viewer class="swiper-no-swiping" toggleable="true" src="${objectUrl}" ios-src="${objectUrl}" camera-controls="true" style="--poster-color: transparent;" data-shopify-feature="1.12" alt="Nick Test Product" poster="${
                      dataMedia.preview_image.src
                    }"></model-viewer>
                            </template>
                          </product-model>
                        </div>`;
                  } else {
                    mainGallery.innerHTML += `
                        <div class="swiper-slide">
                          <img srcset="${dataMedia.preview_image.src}"
                            src="${dataMedia.preview_image.src}"
                            sizes="(min-width: 320px) 500px"
                            loading="lazy"
                            width="${dataMedia.width}"
                            height="${dataMedia.height}"
                            alt="${data.title}">
                        </div>`;
                  }

                  if (data.media.length > 1) {
                    thumbsGallery.innerHTML += `
                        <div class="swiper-slide" data-media-id="${dataMedia.id}">
                          <img srcset="${dataMedia.preview_image.src}" src="${dataMedia.preview_image.src}"
                            loading="lazy" width="50" height="50" alt="${data.title}">
                        </div>`;
                  } else {
                    document.querySelector('.slider-thumbs-wrapp').style.display = 'none';
                    document.querySelector('.swiper-button-next').style.display = 'none';
                    document.querySelector('.swiper-button-prev').style.display = 'none';
                  }
                });

                var previewSlider = new Swiper('#Slider-Thumbnails-quickview', {
                  spaceBetween: 15,
                  slidesPerView: 4,
                  observer: true,
                  freeMode: true,
                  watchSlidesProgress: true,
                  slideToClickedSlide: true,
                });

                var previewSliderMain = new Swiper('#Slider-Gallery-quickview', {
                  spaceBetween: 10,
                  observer: true,
                  longSwipesRatio: 0.7,
                  focusableElements: 'input, select, option, textarea, button, video, label, canvas',
                  navigation: {
                    nextEl: '.quickview-next',
                    prevEl: '.quickview-prev',
                  },
                  thumbs: {
                    swiper: previewSlider,
                  },
                });
              } else {
                mainGallery.innerHTML += `{{ 'product-1' | placeholder_svg_tag }}`;
                document.querySelector('.slider-thumbs-wrapp').style.display = 'none';
                document.querySelector('.swiper-button-next').style.display = 'none';
                document.querySelector('.swiper-button-prev').style.display = 'none';
              }

              // title
              document.querySelector('.modal-product-detail .product__title').innerHTML = data.title;
              document.querySelector('.modal-product-detail .product__title-link').href = data.url;

              // description
              let modalDescriptionTrue = this.closest('a.full-unstyled-link[data-metafield]');
              if (modalDescriptionTrue) {
                let modalDescription = modalDescriptionTrue.dataset.metafield;
                document.querySelector('.modal-product-detail .product__description').innerHTML = modalDescription;
              }

              // price
              const priceSale = document.querySelector('.modal-product-detail .price-item--sale');
              const priceRegular = document.querySelector('.modal-product-detail .price-item--regular');
              const btnWithPrice = document.querySelector('.modal-product-detail [data-initial-price]');

              priceSale.innerHTML = `${Shopify.formatMoney(data.variants[0].price, '{{ shop.money_format }}')}`;

              if (btnWithPrice) {
                btnWithPrice.dataset.initialPrice = `${Shopify.formatMoney(data.variants[0].price, '{{ shop.money_format }}')}`;
                btnWithPrice.querySelector('.price-item--regular').innerHTML = `${Shopify.formatMoney(data.variants[0].price, '{{ shop.money_format }}')}`;
              }

              if ( data.variants[0].compare_at_price != null &&  data.variants[0].compare_at_price != data.variants[0].price) {
                const price = document.querySelector('.modal-product-detail .price__compare--regular');
                if (price) {
                  price.innerHTML = `-`;
                }
                priceRegular.innerHTML = `${Shopify.formatMoney(
                  data.variants[0].compare_at_price,
                  '{{ shop.money_format }}'
                )}`;
              }

              // checkout button
              const checkoutButton = document.querySelector('.modal-product-detail .shopify-payment-button__button');

              if (data.variants[0].available == true) {
                document.querySelector('.modal-product-detail .product-form__submit .add_to_cart').style.display = 'inline-block';
                document.querySelector('.modal-product-detail .product-form__submit .sold_out').style.display = 'none';
                document.querySelector('.modal-product-detail .product-form__submit').disabled = false;

                if (checkoutButton) {
                  checkoutButton.disabled = false;
                }

                document.querySelector('.modal-product-detail .product-form__submit .unavailable').style.display = 'none';
              } else {
                document.querySelector('.modal-product-detail .product-form__submit .sold_out').style.display = 'inline-block';
                document.querySelector('.modal-product-detail .product-form__submit').disabled = true;

                if (checkoutButton) {
                  checkoutButton.disabled = true;
                }

                document.querySelector('.modal-product-detail .product-form__submit .add_to_cart').style.display = 'none';
                document.querySelector('.modal-product-detail .product-form__submit .unavailable').style.display = 'none';
              }

              // options
              const elemenOption = document.querySelector('.product-quickview .variant-selects');
              const errorMessage = document.querySelector('.product-quickview .product-form__error-message-wrapper');
              const variantColorName = elemenOption.dataset.colorOptionName.replace(/,\s*/g, ',').split(',');;
              const variantSelecButon = elemenOption.dataset.selectType;
              const variantSelecColortButon = elemenOption.dataset.selectColor;

              if (data.variants.length > 1) {
                data.options.forEach(function (dataOption, index) {

                  if (variantColorName.find(name => name == dataOption.name) && variantSelecColortButon == 'true') {
                    elemenOption.innerHTML += `<div class="hidden product-form__input product-form__input--dropdown variant-color variant-${dataOption.name.replace(/\s+/g, '-')}">
                      <label class="form__label" for="Option-quickview-${dataOption.name.replace(/\s+/g, '-')}">
                        ${dataOption.name}
                      </label>
                      <div class="select">
                        <select id="Option-quickview-${dataOption.name.replace(/\s+/g, '-')}"
                          class="select__select {{ settings.picker_text_style }} select-${dataOption.name.replace(
                            /\s+/g,
                            '-'
                          )}"
                          name="options-${dataOption.name.replace(/\s+/g, '-')}"
                          form="product-form-quickview">
                        </select>
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true" focusable="false" role="presentation" class="icon icon-caret"><path d="M1 1L7 7.13636L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                      </div>
                    </div>
                    <fieldset 
                        class="color-button-swiched product-form__input variant-color variant-${dataOption.name.replace(/\s+/g, '-')}">
                      <label class="form__label">
                        ${dataOption.name} <span class="color-label"></span>
                      </label>
                      <div class="radio radio-js"></div>
                    </fieldset>`;
                  } else if (variantSelecButon == 'button') {
                    const variantLabel = variantColorName.find(name => name == dataOption.name.replace(/\s+/g, '-')) ? 'Color' : dataOption.name.replace(/\s+/g, '-');
                    elemenOption.innerHTML += 
                      `<div class="hidden product-form__input product-form__input--dropdown variant-${variantLabel}">
                        <label class="form__label" for="Option-quickview-${dataOption.name.replace(/\s+/g, '-')}">
                          ${dataOption.name}
                        </label>
                        <div class="select">
                          <select id="Option-quickview-${dataOption.name.replace(/\s+/g, '-')}"
                            class="select__select {{ settings.picker_text_style }} select-${dataOption.name.replace(
                              /\s+/g,
                              '-'
                            )}"
                            name="options-${dataOption.name.replace(/\s+/g, '-')}"
                            form="product-form-quickview">
                          </select>
                          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true" focusable="false" role="presentation" class="icon icon-caret"><path d="M1 1L7 7.13636L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </div>
                      </div>
                      <fieldset 
                          class="all-buttons product-form__input variant-${variantLabel}"
                          data-select-option="select-${dataOption.name.replace(/\s+/g, '-')}">
                        <label class="form__label">
                          ${dataOption.name}
                        </label>
                        <div class="radio radio-js"></div>
                      </fieldset>`;
                  } else {
                    const variantLabel = variantColorName.find(name => name == dataOption.name.replace(/\s+/g, '-')) ? 'color' : dataOption.name.replace(/\s+/g, '-');
                    elemenOption.innerHTML += `<div class="all-selects product-form__input product-form__input--dropdown variant-${variantLabel}">
                          <label class="form__label" for="Option-quickview-${dataOption.name.replace(/\s+/g, '-')}">${
                      dataOption.name
                    }</label>
                      <div class="select">
                        <select id="Option-quickview-${dataOption.name.replace(/\s+/g, '-')}"
                          class="select__select {{ settings.picker_text_style }} select-${dataOption.name.replace(
                            /\s+/g,
                            '-'
                          )}"
                          name="options-${dataOption.name.replace(/\s+/g, '-')}"
                          form="product-form-quickview">
                        </select>
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true" focusable="false" role="presentation" class="icon icon-caret"><path d="M1 1L7 7.13636L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                      </div>
                    </div>`;
                  }

                  let elemenOptionValues = document.querySelector(
                    '.product-quickview .select-' + dataOption.name.replace(/\s+/g, '-') + ''
                  );

                  dataOption.values.forEach(function (dataValue) {
                    elemenOptionValues.innerHTML += `<option value="${dataValue}">${dataValue}</option>`;
                  });

                  if (variantSelecButon == 'button' || variantSelecButon == 'dropdown') {
                    let elemenLabelValues = document.querySelector(
                      `.product-quickview fieldset.variant-${dataOption.name.replace(/\s+/g, '-')} .form__label .color-label`
                    );

                    const checkIsColorOption = () => {
                      let isColorOption = false;
                      variantColorName.forEach(name => {
                        if (elemenOptionValues.classList.contains(`select-${name}`)) {
                          isColorOption = true;
                        }
                      })
                      return isColorOption;
                    }

                    if (elemenLabelValues && checkIsColorOption()) {
                      elemenLabelValues.innerHTML = `(${elemenOptionValues.value})`;
                    }

                    let elemenRadiosValues = document.querySelector(`.product-quickview fieldset.variant-${dataOption.name.replace(/\s+/g, '-')} .radio`);

                    if (variantColorName.find(name => {
                      return name == dataOption.name 
                    }) && variantSelecColortButon == 'true') {
                      elemenRadiosValues = document.querySelector(`.product-quickview fieldset.variant-color .radio`);
                      dataOption.values.forEach(function (dataValue) {
                        elemenRadiosValues.innerHTML += `
                            <span class="color-variant color--${dataValue.toLowerCase().replace(/\s+/g, '-')}" 
                                  id="id-${dataValue.replace(/\s+/g, '-')}" 
                                  data-value="${dataValue}" 
                                  style='background-color:${dataValue.toLowerCase().replace(/\s/g, '')};'>
                            </span>`;
                        document
                          .querySelector('#id-' + elemenOptionValues.value.replace(/\s+/g, '-') + '')
                          .classList.add('checked');
                      });
                    } else if (variantSelecButon == 'button') {
                      let elemenRadiosValuesButton = document.querySelector(
                        `.product-quickview fieldset.variant-${dataOption.name.replace(/\s+/g, '-')} .radio`
                      );

                      dataOption.values.forEach(function (dataValue) {
                        if (elemenRadiosValuesButton) {
                          elemenRadiosValuesButton.innerHTML += `
                            <span class="option--${dataValue.toLowerCase().replace(/\s+/g, '-')}" 
                                  id="id-${dataValue.replace(/\s+/g, '-')}" 
                                  data-value="${dataValue}">
                              ${dataValue}
                            </span>`;
                        }
                        const btn =  document
                        .querySelector('#id-' + elemenOptionValues.value.replace(/\s+/g, '-') + '')
                        if (btn) {
                          btn.classList.add('checked');
                        }
                      });
                    }
                  }

                  let radioItem = document.querySelectorAll('.product-quickview .radio-js span');
                  if (radioItem.length >= 1) {
                    radioItem.forEach(function (item) {
                      item.addEventListener('click', function (event) {
                        let elemenLabelValues = document.querySelector(`.product-quickview fieldset.variant-${dataOption.name.replace(/\s+/g, '-')} .form__label .color-label`);
                        if (elemenLabelValues && this.classList.contains('color-variant')) {
                          elemenLabelValues.innerHTML = `(${this.dataset.value})`;
                        }

                        let getClosestFieldset = this.closest('.product-form__input');
                        let getSelectName = getClosestFieldset.dataset.selectOption;

                        let setSelect = document.querySelector(`.product-quickview .select__select.select-${variantColorName}`);
                        if (getSelectName) {
                          setSelect = document.querySelector(`.product-quickview .select__select.${getSelectName}`);
                        }
                        setSelect.value = item.dataset.value;

                        let thisRadioItems = getClosestFieldset.querySelectorAll('.radio-js span');
                        thisRadioItems.forEach(function (itemClass) {
                          itemClass.classList.remove('checked');
                        });
                        item.classList.add('checked');

                        if ('createEvent' in document) {
                          var evt = document.createEvent('HTMLEvents');
                          evt.initEvent('change', false, true);
                          setSelect.dispatchEvent(evt);
                        } else {
                          setSelect.fireEvent('onchange');
                        }
                      });
                    });
                  }
                });
              }

              function closeModal(event) {
                elemenOption.innerHTML = '';
                mainGallery.innerHTML = '';
                thumbsGallery.innerHTML = '';
                document.querySelector('.modal-product-detail .product__description').innerHTML = '';
                if(errorMessage) {
                  errorMessage.setAttribute('hidden', '');
                }
              }

              btn_modal_close.addEventListener('click', closeModal);

              let allSelects = document.querySelectorAll('.product-quickview .select__select');
              allSelects.forEach((item, index) => {
                const selectedObj = getSelectedOptions(allSelects);
                let variantsArr = data.variants;
                let cloneVariantsArr = variantsArr;
                let filteredvariantsArr = [];

                for (key in selectedObj) {
                  filteredvariantsArr = cloneVariantsArr.filter((variant) => variant[key] === selectedObj[key]);
                  cloneVariantsArr = filteredvariantsArr;
                }

                if (!filteredvariantsArr[0]) return;
                const activeVariantId = filteredvariantsArr[0].id;
                let formInputId = document.querySelector('#product-form-quickview input[name="id"]');

                formInputId.value = activeVariantId;
                item.addEventListener('change', (event) => {
                  let selectedOptions = item.options[item.selectedIndex].value;
                  selectedObj[index] = selectedOptions;

                  let updatedSelectedObj = getSelectedOptions(allSelects);
                  let updatedcloneVariantsArr = variantsArr;
                  let updatedfilteredvariantsArr = [];

                  for (key in updatedSelectedObj) {
                    updatedfilteredvariantsArr = updatedcloneVariantsArr.filter(
                      (variant) => variant[key] === updatedSelectedObj[key]
                    );
                    updatedcloneVariantsArr = updatedfilteredvariantsArr;
                  }

                  if (updatedfilteredvariantsArr.length > 0) {
                    const updatedactiveVariantId = updatedfilteredvariantsArr[0].id;
                    formInputId.value = updatedactiveVariantId;
                    document.querySelector('.modal-product-detail .product-form__submit').disabled = false;

                    if (checkoutButton) {
                      checkoutButton.disabled = false;
                    }

                    if (updatedfilteredvariantsArr[0].available == true) {
                      document.querySelector('.modal-product-detail .price').style.display = 'flex';
                      document.querySelector(
                        '.modal-product-detail .product-form__submit .add_to_cart'
                      ).style.display = 'inline-block';
                      document.querySelector(
                        '.modal-product-detail .product-form__submit .unavailable'
                      ).style.display = 'none';
                      document.querySelector('.modal-product-detail .product-form__submit .sold_out').style.display =
                        'none';
                    } else {
                      document.querySelector('.modal-product-detail .price').style.display = 'flex';
                      document.querySelector('.modal-product-detail .product-form__submit').disabled = true;

                      if (checkoutButton) {
                        checkoutButton.disabled = true;
                      }
                      document.querySelector('.modal-product-detail .product-form__submit .sold_out').style.display =
                        'inline-block';
                      document.querySelector(
                        '.modal-product-detail .product-form__submit .add_to_cart'
                      ).style.display = 'none';
                      document.querySelector(
                        '.modal-product-detail .product-form__submit .unavailable'
                      ).style.display = 'none';
                    }

                    if (updatedfilteredvariantsArr[0].featured_media != undefined) {
                      let activeSlide = document.querySelector(
                        '#Slider-Gallery-quickview [data-media-id="' +
                          updatedfilteredvariantsArr[0].featured_media.id +
                          '"]'
                      );
                      activeSlide.parentElement.insertBefore(activeSlide, activeSlide.parentElement.firstChild);

                      let activeSlideThumbs = document.querySelector(
                        '#Slider-Thumbnails-quickview [data-media-id="' +
                          updatedfilteredvariantsArr[0].featured_media.id +
                          '"]'
                      );

                      if (activeSlideThumbs) {
                        activeSlideThumbs.parentElement.insertBefore(
                          activeSlideThumbs,
                          activeSlideThumbs.parentElement.firstChild
                        );

                        let previewSlider = new Swiper('#Slider-Thumbnails-quickview', {
                          spaceBetween: 15,
                          slidesPerView: 4,
                          freeMode: true,
                          observer: true,
                          watchSlidesProgress: true,
                          slideToClickedSlide: true,
                        });

                        let previewSliderMain = new Swiper('#Slider-Gallery-quickview', {
                          spaceBetween: 10,
                          observer: true,
                          longSwipesRatio: 0.7,
                          focusableElements: 'input, select, option, textarea, button, video, label, canvas',
                          navigation: {
                            nextEl: '.quickview-next',
                            prevEl: '.quickview-prev',
                          },
                          thumbs: {
                            swiper: previewSlider,
                          },
                        });
                      } else {
                        let previewSliderMain = new Swiper('#Slider-Gallery-quickview', {
                          spaceBetween: 10,
                          observer: true,
                          navigation: {
                            nextEl: '.quickview-next',
                            prevEl: '.quickview-prev',
                          },
                        });
                      }
                    }

                    let newModalPrice = `${Shopify.formatMoney(
                      updatedfilteredvariantsArr[0].price,
                      '{{ shop.money_format }}'
                    )}`;
                    
                    priceSale.innerHTML = newModalPrice;

                    let btnWithPriceNew = document.querySelector('.modal-product-detail [data-initial-price]');
                    if (btnWithPriceNew) {
                      let priceButtonReplace = btnWithPriceNew.querySelector('.price-item--regular');
                      if (priceButtonReplace) {
                        priceButtonReplace.innerHTML = newModalPrice;
                      }
                    }

                    if ( updatedfilteredvariantsArr[0].compare_at_price != null && updatedfilteredvariantsArr[0].compare_at_price != updatedfilteredvariantsArr[0].price ) {
                      const price = document.querySelector('.modal-product-detail .price__compare--regular');

                      if (price) {
                        price.innerHTML = `-`;
                      }
                      priceRegular.innerHTML = `${Shopify.formatMoney(
                        updatedfilteredvariantsArr[0].compare_at_price,
                        '{{ shop.money_format }}'
                      )}`;
                    } else {
                      const comparePrices = document.querySelectorAll('.modal-product-detail .price__compare--regular, .modal-product-detail .price__compare .price-item--regular');
                      if (comparePrices.length) {
                        comparePrices.forEach((price) => {
                          price.innerHTML = ``;
                        }) 
                      }
                      priceRegular.innerHTML = ``;
                    }
                  } else {
                    document.querySelector('.modal-product-detail .price').style.display = 'none';
                    document.querySelector('.modal-product-detail .product-form__submit').disabled = true;
                    if (checkoutButton) {
                      checkoutButton.disabled = true;
                    }
                    document.querySelector('.modal-product-detail .product-form__submit .add_to_cart').style.display =
                      'none';
                    document.querySelector('.modal-product-detail .product-form__submit .sold_out').style.display =
                      'none';
                    document.querySelector('.modal-product-detail .product-form__submit .unavailable').style.display =
                      'inline-block';
                  }
                });
              });

              function getSelectedOptions(allSelects) {
                let selectedObj = {};
                allSelects.forEach((item, index) => {
                    let selectedOptions = item.options[item.selectedIndex].value;
                    selectedObj[`option${index + 1}`] = selectedOptions;
                });
                return selectedObj;
              }

              modal.style.display = 'flex';
              document.querySelector('body').classList.add('overflow-hidden');
            });
        });
      });
    }

    const checkRecommentains = document.querySelector('product-recommendations');
    if (checkRecommentains) {
      let checkButtons = setInterval(() => {
        btns_modal_open = document.querySelectorAll('.button-product-detail');
        if (btns_modal_open.length > 0) {
          openProductModal();
          clearInterval(checkButtons);
        } else {
          openProductModal();
        }
      }, 300);
    } else {
      openProductModal();
    }

		if (modal) {
			const quantity = modal.querySelector('.quantity__input');
			const reduceQuantity = () => quantity.value = 1;

			btn_modal_close.addEventListener('click', function (event) {
				modal.style.display = 'none';
				setTimeout(reduceQuantity, 250)
				document.querySelector('body').classList.remove('overflow-hidden');
			});
			
			window.click = function (event) {
				if (event.target == modal) {
					modal.style.display = 'none';
					setTimeout(reduceQuantity, 250)
					document.querySelector('body').classList.remove('overflow-hidden');
				}
			};
		}
  };

  renderProductCount(html) {
		const countElement = new DOMParser().parseFromString(html, 'text/html').getElementById('CollectionProductCount');
		if (countElement) {
			const count = countElement.innerHTML;
			const container = document.getElementById('CollectionProductCount');
			const containerDesktop = document.getElementById('CollectionProductCountDesktop');
			document.getElementById('main-collection-product-grid').classList.remove('loading');
			if (container) {
				container.innerHTML = count;
				container.classList.remove('loading');
			}
			if (containerDesktop) {
				containerDesktop.innerHTML = count;
				containerDesktop.classList.remove('loading');
			}
		}
  }

  renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements =
      parsedHTML.querySelectorAll('#CollectionFiltersForm .js-filter, #CollectionFiltersFormMobile .js-filter');
    const matchesIndex = (element) => { 
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false; 
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    this.renderActiveFacets(parsedHTML);
    this.renderAdditionalElements(parsedHTML);

    if (countsToRender) this.renderCounts(countsToRender, event.target.closest('.js-filter'));
  }

  renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    })

    this.toggleActiveFacets(false);
  }

  renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];
    const CollectionFiltersFormMobile1 = document.getElementById('CollectionFiltersFormMobile');

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });
    if (CollectionFiltersFormMobile1){
			let collectionFilterMenuDrawer = CollectionFiltersFormMobile1.closest('menu-drawer');
      if (collectionFilterMenuDrawer) {
        collectionFilterMenuDrawer.bindEvents();
      }
    }
  }

  renderCounts(source, target) {
    const countElementSelectors = ['.count-bubble','.facets__selected'];
    countElementSelectors.forEach((selector) => {
      const targetElement = target.querySelector(selector);
      const sourceElement = source.querySelector(selector);

      if (sourceElement && targetElement) {
        target.querySelector(selector).outerHTML = source.querySelector(selector).outerHTML;
      }
    });
  }

  updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  getSections() {
    return [
      {
        id: 'main-collection-product-grid',
        section: document.getElementById('main-collection-product-grid').dataset.id,
      }
    ]
  }
}

customElements.define('collection-filters-form', CollectionFiltersForm);

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input')
      .forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));

    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault();
      const forms = document.querySelectorAll('collection-filters-form');
      forms.forEach( form => {
				form.onActiveFilterClick(event);
			})
    });
  }
}

customElements.define('facet-remove', FacetRemove);

class PageType extends HTMLElement {
  constructor() {
    super()
    this.selector = document.querySelector('[data-page-type-selector]');
    this.selector.addEventListener('change', this.setValue);
  }

  setValue(e) {
    const selectedTypes = e.currentTarget.querySelectorAll('input:checked');
    const types = Array.from(selectedTypes).map(option => option.value).join(',');

    const typeInput = document.querySelector('#page-type-input');

    if (typeInput) {
      typeInput.value = types;
    }

    const event = new Event('input');
    typeInput.closest('form').dispatchEvent(event);
  }
}

customElements.define('page-type-selector', PageType);