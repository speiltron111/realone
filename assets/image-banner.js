function lazyBackgroundFunction() {
	let lazyBackgrounds = [].slice.call(document.querySelectorAll('.lazy-background'));

	if ('IntersectionObserver' in window) {
		let lazyBackgroundObserver = new IntersectionObserver(function (entries, observer) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
					lazyBackgroundObserver.unobserve(entry.target);
				}
			});
		});

		lazyBackgrounds.forEach(function (lazyBackground) {
			lazyBackgroundObserver.observe(lazyBackground);
		});
	}
}

document.addEventListener('DOMContentLoaded', lazyBackgroundFunction);
window.addEventListener('resize', lazyBackgroundFunction);
document.addEventListener('shopify:section:load', lazyBackgroundFunction);

;(function () {
	'use strict';

	const parallaxElements = document.querySelectorAll('.img-parallax');

	const updateParallax = () => {
		const windowHeight = window.innerHeight;
	
		parallaxElements.forEach(element => {
			const boundingBox = element.getBoundingClientRect();
			const percentageScrolled = (windowHeight - boundingBox.top) / windowHeight * 100;
			const translateY = ((percentageScrolled / 50 - 1) * 25) / 2; 

			if(window.innerWidth <= 1024) {
				if(translateY > -25 && translateY < 25) {
					element.style.transform = `translate(0, ${translateY}%)`;
				}
			} else {
				element.style.transform = `unset`;
			}
		});
	};
	
	window.addEventListener('scroll', updateParallax);
	window.addEventListener('resize', updateParallax);
	
	updateParallax();
})() 