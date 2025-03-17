class GiftWrapping extends HTMLElement {
    constructor() {
      super();
      this.productUpsellId = this.dataset.productUpsellId;
      this.productUpsellTrue = this.dataset.productUpsellTrue;
      this.cartItemsSize = parseInt(this.getAttribute('cart-items-size'));
  
      // When the gift-wrapping checkbox is checked or unchecked.
      this.querySelector('[name="attributes[gift-wrapping]"]').addEventListener("change", (event) => {
        event.target.checked ? this.setGiftWrap() : this.removeGiftWrap();
      });

    }
  
    setGiftWrap() {
  
      const sections = this.getSectionsToRender().map((section) => section.section);

      const body = JSON.stringify({
        updates: {
          [this.productUpsellId]: this.itemsInCart
        },
        attributes: {
          'data-product-upsell-true': true
        },
        sections: sections,
        sections_url: window.location.pathname

      });
  
      fetch(`${routes.cart_update_url}`, {...fetchConfig(), ...{ body }})
        .then((response) => response.json())
        .then((response) => {
  
          if (document.body.classList.contains('template-cart')) {
            window.location.href = routes.cart_url;
            return;
          }
  
          this.miniCart && this.miniCart.renderContents(response);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  
    removeGiftWrap() {
  
      const sections = this.getSectionsToRender().map((section) => section.section);
      const body = JSON.stringify({
        updates: {
          [this.productUpsellId]: 0
        },
        attributes: {
          'gift-wrapping': '',
          'gift-note': ''
        },
        sections: sections,
        sections_url: window.location.pathname
      });
  
      fetch(`${routes.cart_update_url}`, {...fetchConfig(), ...{ body }})
        .then((response) => response.json())
        .then((response) => {
          
          if (document.body.classList.contains('template-cart')) {
            window.location.href = routes.cart_url;
            return;
          }
  
          this.miniCart && this.miniCart.renderContents(response);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  
    getSectionsToRender() {
      return [
        {
          id: 'mini-cart',
          section: 'mini-cart',
          selector: '.shopify-section'
        },
        {
          id: 'cart-icon-bubble',
          section: 'cart-icon-bubble',
          selector: '.shopify-section'
        },
        {
          id: 'cart-live-region-text',
          section: 'cart-live-region-text',
          selector: '.shopify-section'
        }
      ];
    }
}
customElements.define('upsell-product', GiftWrapping);