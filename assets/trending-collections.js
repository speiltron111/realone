;(function () {
	'use strict';

	if (!customElements.get('trending-collections')) {
		class TrendingCollections extends HTMLElement {
			constructor() {
				super();
				this.slider = this.querySelector('.swiper.ab-trending-collections__slider');
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

		TrendingCollections.prototype.initSwiper = function() {
			if (this.slider) {
				let { slidesPerView } = this.dataset;
				slidesPerView = this.slides.length <= slidesPerView && this.slides.length != 1 ?  this.slides.length - 1 : slidesPerView;
				this.swiper = new Swiper(this.slider, {
					loop: false,
					autoplay: false,
					speed: 400,
					spaceBetween: 30,
					slidesPerView: 1,
					breakpoints: {
						750: {
							slidesPerView: 1.4
						},
						990: {
							slidesPerView: 2.4
						},
						1100: {
							slidesPerView
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

		customElements.define('trending-collections', TrendingCollections);
	}
})()


