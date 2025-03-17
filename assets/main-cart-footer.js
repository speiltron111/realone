document.addEventListener('DOMContentLoaded', function() {
	function isIE() {
		const ua = window.navigator.userAgent;
		const msie = ua.indexOf('MSIE ');
		const trident = ua.indexOf('Trident/');

		return (msie > 0 || trident > 0);
	}

	if (!isIE()) return;
	const cartSubmitInput = document.createElement('input');
	cartSubmitInput.setAttribute('name', 'checkout');
	cartSubmitInput.setAttribute('type', 'hidden');
	document.querySelector('#cart').appendChild(cartSubmitInput);
	document.querySelector('#checkout').addEventListener('click', function(event) {
		document.querySelector('#cart').submit();
	});
});