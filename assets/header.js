'use strict';
function fixedHeaderTransparent() {
	let checkHeaderHeight = setInterval(function(){
		let headerElement = document.querySelector('.section-header');
		let headerFixedElement = headerElement.getElementsByClassName('color-background-transparent');
		
		if(headerFixedElement.length) {
			let headerTopPositionElement = headerElement.offsetHeight;
			// if (window.innerWidth > 990) {
			// 	headerElement.style.marginBottom = "-" + headerTopPositionElement + "px";
			// } else {
			// 	headerElement.style.marginBottom = "-" + headerTopPositionElement / 2 + "px";
			// }
				headerElement.style.marginBottom = "-" + headerTopPositionElement + "px";
		}
	}, 100);
	setTimeout(() => { 
		clearInterval(checkHeaderHeight);
	}, 8000);
}

document.addEventListener('shopify:section:load', fixedHeaderTransparent);
document.addEventListener('DOMContentLoaded', fixedHeaderTransparent);
window.addEventListener('resize', fixedHeaderTransparent);

class StickyHeader extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.header = document.querySelector('.section-header');
		
		this.headerBounds = {};
		this.currentScrollTop = 0;
		this.preventReveal = false;
		this.predictiveSearch = this.querySelector('predictive-search');
		this.headerFixed = this.header.getElementsByClassName('color-background-transparent');

		if(this.headerFixed.length){
			this.headerTopPosition = this.header.offsetHeight;
			// if (window.innerWidth > 990) {
			// 	this.header.style.marginBottom = "-" + this.headerTopPosition + "px";
			// } else {
			// 	this.header.style.marginBottom = "-" + this.headerTopPosition / 2 + "px";
			// }

			this.header.style.marginBottom = "-" + this.headerTopPosition + "px";
		} 

		this.onScrollHandler = this.onScroll.bind(this);
		this.hideHeaderOnScrollUp = () => this.preventReveal = true;

		this.addEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
		window.addEventListener('scroll', this.onScrollHandler, false);

		this.createObserver();
	}

	disconnectedCallback() {
		this.removeEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
		window.removeEventListener('scroll', this.onScrollHandler);
	}

	createObserver() {
		let observer = new IntersectionObserver((entries, observer) => {
			this.headerBounds = entries[0].intersectionRect;
			observer.disconnect();
		});

		observer.observe(this.header);
	}

	onScroll() {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

		if (this.predictiveSearch && this.predictiveSearch.isOpen) return;

		if (scrollTop > this.currentScrollTop && scrollTop > this.headerBounds.bottom) {
			requestAnimationFrame(this.hide.bind(this));
			this.classList.add('sticky');
		} else if (scrollTop < this.currentScrollTop && scrollTop > this.headerBounds.bottom) {
			if (!this.preventReveal) {
				requestAnimationFrame(this.reveal.bind(this));
			} else {
				window.clearTimeout(this.isScrolling);

				this.isScrolling = setTimeout(() => {
					this.preventReveal = false;
				}, 66);

				requestAnimationFrame(this.hide.bind(this));
			}
		} else if (scrollTop <= this.headerBounds.top) {
			this.classList.remove('sticky');
			requestAnimationFrame(this.reset.bind(this));
		}


		this.currentScrollTop = scrollTop;
	}

	hide() {
		this.header.classList.add('shopify-section-header-hidden', 'shopify-section-header-sticky');
		this.closeMenuDisclosure();
		this.closeSearchModal();
		if(this.headerFixed.length){
			this.header.style.top = "0";
		} 
	}

	reveal() {
		this.header.classList.add('shopify-section-header-sticky', 'animate');
		this.header.classList.remove('shopify-section-header-hidden');
	}
	
	reset() {
		this.header.classList.remove('shopify-section-header-hidden', 'shopify-section-header-sticky', 'animate');
		if(this.headerFixed.length){
			this.header.style.top = " " + this.headerTopPosition + "px";
		} 
	}

	closeMenuDisclosure() {
		this.disclosures = this.disclosures || this.header.querySelectorAll('details-disclosure');
		this.disclosures.forEach(disclosure => disclosure.close());
	}

	closeSearchModal() {
		this.searchModal = this.searchModal || this.header.querySelector('details-modal');
		if (this.searchModal) {
			this.searchModal.close(false);
		}
	}
}

customElements.define('sticky-header', StickyHeader);