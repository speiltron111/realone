;(function () {
	'use strict';

	if (!customElements.get('trending-products')) {
		class TrendingProducts extends HTMLElement {
			constructor() {
				super();
				this.slider = this.querySelector('.swiper.ab-trending-products__slider');
				this.slides = Array.from(this.querySelectorAll('.swiper-slide'));
				this.nextBtns = Array.from(this.querySelectorAll('.ab-next'));
				this.prevBtns = Array.from(this.querySelectorAll('.ab-prev'));
				this.swiper = null;
			}

			connectedCallback() {
				this.initSwiper();
				window.addEventListener('resize', () => this.initSwiper.call(this));
			}
		}

		TrendingProducts.prototype.initSwiper = function() {
			if (this.slider) {
				let { slidesPerView, gap } = this.dataset;
				slidesPerView = this.slides.length <= slidesPerView && this.slides.length != 1 ?  this.slides.length - 1 : slidesPerView;
				const spaceBetween = gap == 'true' ? 0 : 30;
				this.swiper = new Swiper(this.slider, {
					loop: false,
					lazy: true,
					autoplay: false,
					speed: 400,
					spaceBetween: 30,
					slidesPerView: 1,
					breakpoints: {
						750: {
							slidesPerView: 1.4,
							spaceBetween
						},
						950: {
							slidesPerView: 2.3,
							spaceBetween
						},
						1100: {
							slidesPerView,
							spaceBetween
						}
					},
					navigation: {
						nextEl: this.nextBtns[0],
						prevEl: this.prevBtns[0],
						disabledClass: 'ab-nav--disabled'
					}
				});

				this.nextBtns.forEach((btn, ind) => {
					if (ind == 0) {
						return
					}
						btn.addEventListener('click', () => this.swiper.slideNext());
				});

				this.prevBtns.forEach((btn, ind) => {
					if (ind == 0) {
						return
					}
						btn.addEventListener('click', () => this.swiper.slidePrev());
				});
			}
		};

		customElements.define('trending-products', TrendingProducts);
	}
})()
