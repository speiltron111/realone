;(function () {
	'use strict';

	if (!customElements.get('slideshow-banner')) {
		class SlideshowBanner extends HTMLElement {
			constructor() {
				super();
				this.swiper = null;
			}

			connectedCallback() {
				this.initSwiper();
				window.addEventListener('resize', () => this.initSwiper.call(this));
			}
		}

		SlideshowBanner.prototype.initSwiper = function() {
			const { autoplay, delay, pauseOnMouseEnter, loop, speed } = this.dataset;
			const sliderPauseOnMouseEnter = pauseOnMouseEnter == 'true' ? true : false;
			const sliderAutoplay = autoplay == 'true' ? {
				delay: +delay,
				disableOnInteraction: false,
				pauseOnMouseEnter: sliderPauseOnMouseEnter
			} : false;

			this.swiper = new Swiper(this, {
				lazy: true,
				keyboard: {
					enabled: true,
				},
				pagination: {
					el: this.querySelector('.swiper-pagination'), 
					type: "bullets",
					clickable: true
				},
				navigation: {
					nextEl: '.swiper-button-next',
					prevEl: '.swiper-button-prev',
				},
				autoplay: sliderAutoplay,
				loop: loop === 'true',
				speed: +speed
			});

			this.swiper.on('slideChange', () => {
				if(this.swiper.pagination) {
					this.swiper.pagination.update();
				}
		});
		};

		customElements.define('slideshow-banner', SlideshowBanner);
	}
})()
