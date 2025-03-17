;(function () {
	'use strict';

	function collectionWithTabs() {
		const cwtSections = document.querySelectorAll('.collection-tabs-wrapper');
		if (cwtSections.length) {
			cwtSections.forEach((cwt) => {
				const id = cwt.dataset.id
				let cwtNavigation = cwt.querySelectorAll('.tabs-navigation-item');
				let cwtList = cwt.querySelectorAll('.products-list');
				cwtNavigation.forEach(function(item) {
					item.addEventListener("click", function() {
						cwtNavigation.forEach(function(element) {
							element.classList.remove('active');
						});
						item.classList.add('active');
						let tagid = item.dataset.tab;
						cwtList.forEach(function(element) {
							element.classList.remove('active');
						});
						cwt.querySelector(`#${tagid}`).classList.add('active');
					});
					item.addEventListener("keyup", function() {
						cwtNavigation.forEach(function(element) {
							element.classList.remove('active');
						});
						item.classList.add('active');
						let tagid = item.dataset.tab;
						cwtList.forEach(function(element) {
							element.classList.remove('active');
						});
						cwt.querySelector(`#${tagid}`).classList.add('active');
					});
				});
			})
		};
	};
	
	document.addEventListener('DOMContentLoaded', collectionWithTabs);
	document.addEventListener('shopify:section:load', collectionWithTabs);
	window.addEventListener('resize', collectionWithTabs);
})()

