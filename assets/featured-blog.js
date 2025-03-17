;(function () {
	'use strict';

	if (!customElements.get('featured-blog')) {
		class FeaturedBlog extends HTMLElement {
			constructor() {
				super();
				this.blogSlider = this.querySelector('.swiper.featured-blog-slider');
				this.swiper = null;
				this.enableSliderDesktop = this.dataset.enableSliderDesktop === 'true';
				this.enableSliderMobile = this.dataset.enableSliderMobile === 'true';
			}

			connectedCallback() {
				if(this.enableSliderDesktop || this.enableSliderMobile) {
					if (this.blogSlider) {
						this.initSwiper();
					}
	
					window.addEventListener('resize', () => this.initSwiper.call(this));
				}
			}
		}

		FeaturedBlog.prototype.initSwiper = function() {
			const { gap, gapMobile, slidesPerView, slidesPerViewDesktop, enableSliderDesktop, enableSliderMobile } = this.dataset;
			
			const sliderInit = () => {
				let spaceBetween = 0;
				let spaceBetweenMb = 0;
				switch (gap) {
					case 'offset-col-lg-3':
						spaceBetween = 30;
						break;
					case 'offset-col-lg-2':
						spaceBetween = 20;
						break;
				}

				if(gapMobile == 'offset-col-sm-2') {
					spaceBetweenMb = 20;
				}
				
				this.swiper = new Swiper(this.blogSlider, {
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
							spaceBetween: spaceBetweenMb,
						},
						750: {
							slidesPerView,
							spaceBetween,
						},
						990: {
							slidesPerView,
							spaceBetween,
						},
						1025: {
							slidesPerView: slidesPerViewDesktop,
							spaceBetween,
							navigation: {
								nextEl: ".blog-button-next",
								prevEl: ".blog-button-prev",
							}
						},
						1200: {
							slidesPerView: slidesPerViewDesktop,
							spaceBetween,
							pagination: false,
							navigation: {
								nextEl: ".blog-button-next",
								prevEl: ".blog-button-prev",
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

			const sliderWidth = 1200;
			if (enableSliderDesktop == 'false' && enableSliderMobile == 'true' && window.innerWidth < sliderWidth) {
				sliderInit();
			} else if (enableSliderDesktop == 'true' && enableSliderMobile == 'false' && window.innerWidth > sliderWidth ) {
				sliderInit();
			} else if (enableSliderDesktop == 'true' && enableSliderMobile == 'true' ) {
				sliderInit();
			} else {
				if (this.swiper ) {
					this.swiper.destroy()
				}
			};
		};

		customElements.define('featured-blog', FeaturedBlog);
	}
})()

