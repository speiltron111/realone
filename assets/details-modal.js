class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');
		if (this.detailsContainer) {
			this.detailsContainer.addEventListener('keyup', (event) => {
				if(event.code) {
					event.code.toUpperCase() === 'ESCAPE' && this.close()
				}
			});
		}

		if (this.summaryToggle) {
			this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));
			this.summaryToggle.setAttribute('role', 'button');
			this.summaryToggle.setAttribute('aria-expanded', 'false');
		}
    
    const typeButton = this.querySelector('button[type="button"]');
    if (typeButton != null) {
      typeButton.addEventListener('click', this.close.bind(this));
    }
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');

    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'),
      this.detailsContainer.querySelector('input:not([type="hidden"])')
    );
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('overflow-hidden');
  }
}

customElements.define('details-modal', DetailsModal);
