if (!customElements.get('cart-notification')) {
	class CartNotification extends HTMLElement {
		constructor() {
			super();

			this.notification = document.getElementById('cart-notification');
			this.header = document.querySelector('sticky-header');
			this.onBodyClick = this.handleBodyClick.bind(this);
			
			this.notification.addEventListener('keyup', (evt) => 
				evt.code === 'Escape' && this.close()
			);

			this.querySelectorAll('.cart-notification__close[type="button"]').forEach((closeButton) =>
				closeButton.addEventListener('click', this.close.bind(this))
			);
			
			const notificationOverlay = this.notification.querySelector('.cart-notification-overlay');
			if (notificationOverlay) {
				notificationOverlay.addEventListener('click', () => this.close());
			}

			const buttonContinue = this.notification.querySelector('.link.link--continue');
			if (buttonContinue) {
				buttonContinue.addEventListener('click', () => this.close());
			}
		}

		open() {
			this.notification.classList.add('active');

			this.notification.addEventListener('transitionend', () => {
				this.notification.focus();
				trapFocus(this.notification);
			}, { once: true });

			document.body.classList.add('overflow-hidden');
			this.notification.classList.remove('empty');

			document.body.addEventListener('click', this.onBodyClick);
		}

		close() {

			this.notification.classList.remove('active');
			document.body.classList.remove('overflow-hidden');

			document.body.removeEventListener('click', this.onBodyClick);

			removeTrapFocus(this.activeElement);
		}
		
		renderContents(parsedState) {
			this.productId = parsedState.id;

			this.getSectionsToRender().forEach((section => {
				if(section != null) {
					const container = document.getElementById(section.id);
					if(container) {
						container.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
					}
				}
			}));

			if (this.header && this.header.classList.contains('sticky')) {
				this.header.reveal();
			}
			this.open();
		}

		getSectionsToRender() {
			return [
				{
					id: 'cart-notification-product'
				},
				{
					id: 'cart-notification-button'
				},
				{
					id: 'cart-notification-checkout'
				},
				{
					id: 'cart-icon-bubble'
				},
				{
					id: 'cart-icon-bubble-sticky'
				}
			];
		}

		getSectionInnerHTML(html, selector = '.shopify-section') {
			return new DOMParser()
				.parseFromString(html, 'text/html')
				.querySelector(selector).innerHTML;
		}

		handleBodyClick(evt) {
			const target = evt.target;
			if (target !== this.notification && !target.closest('cart-notification')) {
				const disclosure = target.closest('details-disclosure');
				this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
				this.close();
			}
		}

		setActiveElement(element) {
			this.activeElement = element;
		}
	}
	customElements.define('cart-notification', CartNotification);
}

if (!customElements.get('cart-remove-button')) {
	class CartRemoveButton extends HTMLElement {
		constructor() {
			super();
			this.addEventListener('click', (event) => {
				event.preventDefault();
				this.closest('cart-notification-item').updateQuantity(this.dataset.index, 0);
			});
		}
	}

	customElements.define('cart-remove-button', CartRemoveButton);
}

if (!customElements.get('cart-notification-item')) {
	class cartNotificationItem extends HTMLElement {
		constructor() {
			super();

			this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status');

			this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
				.reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

			this.debouncedOnChange = debounce((event) => {
				this.onChange(event);
			}, 300);

			this.addEventListener('change', this.debouncedOnChange.bind(this));
		}

		onChange(event) {
			this.updateQuantity(
				event.target.dataset.index, 
				event.target.value, 
				document.activeElement.getAttribute('name')
			);
		}

		getSectionsToRender() {
			return [
				{
					id: 'cart-icon-bubble',
					section: 'cart-icon-bubble',
					selector: '.shopify-section'
				},
				{
					id: 'cart-icon-bubble-sticky',
					section: 'cart-icon-bubble-sticky',
					selector: '.shopify-section'
				},
				{
					id: 'cart-notification-product',
					section: 'cart-notification-product',
					selector: '.cart__contents'
				},
				{
					id: 'cart-notification-button',
					section: 'cart-notification-button',
					selector: '#cn-counter'
				},
				{
					id: 'cart-notification-checkout',
					section: 'cart-notification-checkout',
					selector: '.shopify-section'
				}
			];
		}

		updateQuantity(line, quantity, name) {
			this.enableLoading(line);

			const body = JSON.stringify({
				line,
				quantity,
				sections: this.getSectionsToRender().map((section) => section.section),
				sections_url: window.location.pathname
			});

			fetch(`${routes.cart_change_url}`, { ...fetchConfig(), body })
				
				.then((response) => {
					return response.json();
				})

				.then((state) => {

					const parsedState = state;

					this.classList.toggle('is-empty', parsedState.item_count === 0);
					
					const lineItem =  document.getElementById(`CartItem-${line}`);

					let quantityElementValue = 0;

					let quantityElement;
					if (lineItem) {
						quantityElement = lineItem.querySelector(`[name="updates[]"]`);
						quantityElementValue = quantityElement.value;
					}
					
					if (quantity != 0) {
						this.updateLiveRegions(line, quantityElementValue);
					}

					if (parsedState.item_count == 0) {
						document.getElementById('cart-notification').classList.add('empty');
					}

					if (lineItem && lineItem.querySelector(`[name="${name}"]`)) lineItem.querySelector(`[name="${name}"]`).focus();

					if (parsedState.errors) {
						quantityElement.value = quantityElement.getAttribute('value');
						this.updateLiveRegions(line, parsedState.errors);
						return;
					}

					document.getElementById('cart-errors').textContent = '';

					this.getSectionsToRender().forEach((section => {
						const elementToReplace = 
							document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id);
							if (elementToReplace ) {
								elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
							}
					}));

					this.disableLoading();
				})

				.catch((error) => {
					document.getElementById('cart-errors').textContent = window.cartStrings.error;
					this.disableLoading();
				});
		}

		updateLiveRegions(line, itemCount) {

			document.getElementById(`Line-item-error-${line}`).querySelector('.cart-notification-item__error-text').innerHTML = 
				window.cartStrings.quantityError.replace('[quantity]', document.getElementById(`Quantity-${line}`).value);

			document.getElementById(`Line-item-error-${line}`).style.display = "block";

			this.disableLoading();

			if (this.currentItemCount == itemCount) {
				document.getElementById(`Line-item-error-${line}`)
					.querySelector('.cart-notification-item__error-text')
					.innerHTML = window.cartStrings.quantityError.replace('[quantity]', document.getElementById(`Quantity-${line}`).value);

				document.getElementById(`Line-item-error-${line}`).style.display = "block";
			}

			this.currentItemCount = itemCount;
			this.lineItemStatusElement.setAttribute('aria-hidden', true);
			
			// check on all value 
			if (this.currentItemCount == 0) {
				document.getElementById('cart-notification').classList.add('empty');
			}

			const cartStatus = document.getElementById('cart-live-region-text');
			cartStatus.setAttribute('aria-hidden', false);

			setTimeout(() => {
				cartStatus.setAttribute('aria-hidden', true);
			}, 1000);
		}

		getSectionInnerHTML(html, selector) {
			return new DOMParser()
				.parseFromString(html, 'text/html')
				.querySelector(selector).innerHTML;
		}

		enableLoading(line) {
			document.getElementById('cart-notification').classList.add('cart__items--disabled');
			this.querySelectorAll(`#CartItem-${line} .loading-overlay`).forEach((overlay) => overlay.classList.remove('hidden'));
			document.activeElement.blur();
			this.lineItemStatusElement.setAttribute('aria-hidden', false);
		}

		disableLoading() {
			this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));

			document.getElementById('cart-notification').classList.remove('cart__items--disabled');
		}
	}

	customElements.define('cart-notification-item', cartNotificationItem);
}

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}