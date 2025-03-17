'use strict';

(function () {
	function announcement() {
		const swiperAnnouncement = document.querySelector('.announcement-bar');
		if (swiperAnnouncement) {
			let { autoplay, delay, pauseOnMouseEnter, loop, speed, slidesPerView } = swiperAnnouncement.dataset;
			pauseOnMouseEnter == 'true' ? pauseOnMouseEnter = true : pauseOnMouseEnter = false;
			loop == 'true' ? loop = true : loop = false;
			if (autoplay == 'true') {
				autoplay = {
					delay: +delay,
					disableOnInteraction: false,
					pauseOnMouseEnter: pauseOnMouseEnter,
				}
			} else {
				autoplay: false;
			}
			const swiperAnnouncementBar = new Swiper('.announcement-bar .swiper', {
				lazy: false,
				pagination: false,
				navigation: false,
				slidesPerView: 1,
				keyboard: {
					enabled: true,
				},
				mousewheel: true,
				autoplay,
				loop: +loop,
				speed: +speed,
				breakpoints: {
					1166: {
						slidesPerView: +slidesPerView
					}
				}
			});
		} else {
			return
		}
	}

	document.addEventListener('DOMContentLoaded', announcement);
	document.addEventListener('shopify:section:load', announcement);
	window.addEventListener('resize', announcement);
})();