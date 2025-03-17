;(function () {
	'use strict';

	if (!customElements.get('recomendation-products')) {
		class RecomendationProducts extends HTMLElement {
			constructor() {
				super();
				this.slider = this.querySelector('.slider-recommendations');
				this.swiper = null;
			}

			connectedCallback() {
				this.initSwiper();
				window.addEventListener('resize', () => this.initSwiper.call(this));
			}
		}

		RecomendationProducts.prototype.initSwiper = function() {
			let sliderRecommendationsWidth = window.innerWidth;

			if (sliderRecommendationsWidth < 750) {
				this.swiper = new Swiper(this.slider, {
					slidesPerView: 1,
					pagination: {
						el: this.querySelector('.swiper-pagination'), 
						type: "bullets",
						clickable: true
					}
				});

				this.swiper.on('slideChange', () => {
					if(this.swiper.pagination) {
						this.swiper.pagination.update();
					}
				});
			}
			else {
				if(this.swiper) {
					this.swiper.destroy(true, true);
				}
			}
		};

		customElements.define('recomendation-products', RecomendationProducts);
	}
})()