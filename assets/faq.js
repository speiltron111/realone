;(function () {
	'use strict';
  function openFaq() {
    let faqAccordion = document.querySelectorAll(".faq-wrapp .item-heading");
    faqAccordion.forEach(function(item) {
			if (item.dataset.isInit) return;

      item.addEventListener("click", function() {
        if (item.parentElement.classList.contains('active')) {
          item.parentElement.classList.remove('active');
        } else {
          item.parentElement.classList.add('active');
        }
      });
			
			item.dataset.isInit = 'true';
    });
  };

  document.addEventListener('DOMContentLoaded', openFaq);
  document.addEventListener('shopify:section:load', openFaq);
})()

