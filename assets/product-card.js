;(function () {
	'use strict';
	
	const showBtnOnHover = () => {
		let resizeTimeout;
	
		const updateTransforms = () => {
			const btns = document.querySelectorAll(".style-4 .product-form, .product-recommendations .product-form");
			btns.forEach((btn) => {
				const observedElement = btn.closest('.collection__item, .ab-trending-products__item');
				const cardInfo = observedElement?.querySelector('.card-information');
				if (!cardInfo) return;
	
				if (window.innerWidth > 989) {
					const height = btn.clientHeight;
					cardInfo.style.transform = `translateY(-${height}px)`;
				} else {
					cardInfo.style.transform = `translateY(0)`;
				}
			});
		};
	
		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				updateTransforms();
			}, 200);
		};
	
		const observerCallback = (entries) => {
			entries.forEach(() => {
				if (window.innerWidth > 989) {
					updateTransforms();
				}
			});
		};
	
		const btns = document.querySelectorAll(".style-4 .product-form, .product-recommendations .product-form");
		const resize_ob = new ResizeObserver(observerCallback);
	
		btns.forEach((btn) => {
			if (btn.dataset.hasObserver != "true") {
				resize_ob.observe(btn);
			}
			btn.dataset.hasObserver = "true";
		});
	
		window.addEventListener('resize', handleResize);
		updateTransforms();
	};
	
	showBtnOnHover();

	const productLists = document.querySelectorAll(".collection-grid-section, .main-collection__list.style-4, .product-recommendations");

	if(productLists.length > 0) {
		const observeProductListChanges = (list) => {
			const observerCallback = (mutationsList, observer) => {
				for (const mutation of mutationsList) {
					if (mutation.type === 'childList') {
						showBtnOnHover();
					}
				}
			};
	
			const observerConfig = { childList: true, subtree: true };
	
			const observer = new MutationObserver(observerCallback);
			observer.observe(list, observerConfig);
		}

		productLists.forEach(list => {
			observeProductListChanges(list);
		})
	}

	let formWrapper = document.querySelector('#FacetsWrapperDesktop')
	document.addEventListener('click', function () {
		setTimeout(function () {
			let formChildren = document.querySelectorAll('.disclosure-has-popup')
			if (formChildren.length) {
				for (let i = 0; i < formChildren.length; i++) {
					if (formChildren[i].hasAttribute('open') && screen.width > 750) {
						if (formWrapper) {
							formWrapper.classList.add('style-3__facest__wrapper')
						}
						break;
					} else {
						if(formWrapper) {
							formWrapper.classList.remove('style-3__facest__wrapper')
						}
					}
				}
			}
		}, 1)
	})
})()