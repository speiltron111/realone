;(function () {
	'use strict';

	if (!customElements.get('testimonials-component')) {
		class TestimonialsComponent extends HTMLElement {
			constructor() {
				super();
				this.slider = this.querySelector('.swiper.testimonials-slider');
				this.slides = Array.from(this.querySelectorAll('.swiper-slide'));
				this.swiper = null;
			}

			connectedCallback() {
				this.initSwiper();
				window.addEventListener('resize', () => this.initSwiper.call(this));
			}
		}

		TestimonialsComponent.prototype.initSwiper = function() {
			if (this.slider) {
				let { slidesPerView } = this.dataset;
				slidesPerView = this.slides.length < slidesPerView ?  this.slides.length : slidesPerView;
				this.swiper = new Swiper(this.slider, {
					loop: true,
					lazy: true,
					speed: 400,
					slidesPerView: 1,
					centeredSlides: true,
					spaceBetween: 15,
					pagination: {
						el: this.querySelector('.swiper-pagination'), 
						type: "bullets",
						clickable: true
					},
					breakpoints: {
						750: {
							slidesPerView: 1.5,
							spaceBetween: 30
						},
						1200: {
							slidesPerView,
							spaceBetween: 70
						}
					}
				});

				this.swiper.on('slideChange', () => {
					if(this.swiper.pagination) {
						this.swiper.pagination.update();
					}
				});
			}
		};

		customElements.define('testimonials-component', TestimonialsComponent);
	}
})()

