;(function () {
	'use strict';

	if (!customElements.get('featured-slider')) {
		class FeaturedSlider extends HTMLElement {
			constructor() {
				super();
				this.slider = this.querySelector('.swiper.featured-blog-slider');
				this.nextBtn = this.querySelector('.blog-button-next');
				this.prevBtn = this.querySelector('.blog-button-prev');
				this.swiper = null;
			}

			connectedCallback() {
				if (this.slider) {
					this.initSwiper();
				}

				window.addEventListener('resize', () => this.initSwiper.call(this));
			}
		}

		FeaturedSlider.prototype.initSwiper = function() {
			const { slidesPerView, slidesPerViewDesktop } = this.dataset;
			
			const sliderInit = () => {
				
				this.swiper = new Swiper(this.slider, {
					loop: false,
					lazy: true,
					speed: 400,
					slidesPerView: 1,
					spaceBetween: 15,
					pagination: {
						el: this.querySelector('.swiper-pagination'), 
						type: "bullets",
						clickable: true
					},
					breakpoints: {
						320: {
							slidesPerView,
							spaceBetween: 15
						},
						750: {
							slidesPerView,
							spaceBetween: 30
						},
						1025: {
							slidesPerView: slidesPerViewDesktop,
							spaceBetween: 30,
							pagination: true,
							navigation: {
								nextEl: this.nextBtn,
								prevEl: this.prevBtn,
							}
						}
					}
				});

				this.swiper.on('slideChange', () => {
					if(this.swiper.pagination) {
						this.swiper.pagination.update();
					}
				});
			}
			
			sliderInit();
		};

		customElements.define('featured-slider', FeaturedSlider);
	}
})()