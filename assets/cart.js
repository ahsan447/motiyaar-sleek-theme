class CartDrawer extends DrawerComponent {
  constructor() {
    super();
    window.FoxKitSections = FoxTheme.utils.getSectionId(this);
  }

  get requiresBodyAppended() {
    return false;
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener('cart:grouped-sections', this.getSectionToRender.bind(this));
  }

  getSectionToRender(event) {
    event.detail.sections.push(FoxTheme.utils.getSectionId(this));
  }

  show(focusElement = null, animate = true) {
    super.show(focusElement, animate);

    if (this.open) {
      FoxTheme.a11y.trapFocus(this, this.focusElement);

      this.querySelectorAll('cart-drawer-products-recommendation').forEach((recommendation) => {
        if (typeof recommendation.refreshCarousel === 'function') {
          recommendation.refreshCarousel();
        }
      });
    }
  }
}
customElements.define('cart-drawer', CartDrawer);
class CartQuantity extends QuantitySelector {
  constructor() {
    super();
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    super.connectedCallback();
    this.quantityUpdateUnsubscriber = FoxTheme.pubsub.subscribe(
      FoxTheme.pubsub.PUB_SUB_EVENTS.quantityUpdate,
      this.checkQuantityRules.bind(this)
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  checkQuantityRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector('[name="minus"]');
      if (buttonMinus) {
        buttonMinus.disabled = parseInt(value) <= parseInt(this.input.min);
      }
    }
    if (this.input.max) {
      const buttonPlus = this.querySelector('[name="plus"]');
      if (buttonPlus) {
        buttonPlus.disabled = parseInt(value) >= parseInt(this.input.max);
      }
    }
  }
}

customElements.define('cart-quantity', CartQuantity);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('change', FoxTheme.utils.debounce(this.onChange.bind(this), 300));
    this.cartUpdateUnsubscriber = FoxTheme.pubsub.subscribe(
      FoxTheme.pubsub.PUB_SUB_EVENTS.cartUpdate,
      this.onCartUpdate.bind(this)
    );

    this.cartItemProducts = this.querySelectorAll('.cart-item__product');
    if (this.cartItemProducts) {
      this.cartItemProducts.forEach((cartItemProduct) => {
        const template = cartItemProduct.querySelector('template');
        const templateContent = template && document.importNode(template.content, true);
        const parent = cartItemProduct.querySelector('.cart-item__product--info');
        if (parent && template) {
          parent.appendChild(templateContent);
        }
      });
    }

    window.FoxKitSections = FoxTheme.utils.getSectionId(this);
  }

  cartUpdateUnsubscriber = undefined;

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  onChange(event) {
    this.updateQuantity(
      event.target.dataset.index,
      event.target.value,
      document.activeElement.getAttribute('name'),
      event.target
    );
  }

  onCartUpdate(event) {
    if (event.cart.errors) {
      this.onCartError(event.cart.errors, event.target);
      return;
    }

    const sectionId = FoxTheme.utils.getSectionId(this);
    const sectionToRender = new DOMParser().parseFromString(event.cart.sections[sectionId], 'text/html');

    const cartDrawer = document.querySelector(`#CartDrawer-${sectionId}`);
    const cartDrawerBody = document.querySelector(`#CartDrawerBody-${sectionId}`);
    const cartDrawerFooter = document.querySelector(`#CartDrawerFooter-${sectionId}`);
    const cartDrawerEmpty = document.querySelector(`#CartDrawerEmpty-${sectionId}`);
    if (cartDrawer) {
      // const updatedElement = sectionToRender.querySelector(`#CartDrawer-${sectionId}`);
      // if (updatedElement) {
      //   cartDrawer.innerHTML = updatedElement.innerHTML;
      // }
      const cartDrawerBodyUpdate = sectionToRender.querySelector(`#CartDrawerBody-${sectionId}`);
      const cartDrawerFooterUpdate = sectionToRender.querySelector(`#CartDrawerFooter-${sectionId}`);
      const cartDrawerEmptyUpdate = sectionToRender.querySelector(`#CartDrawerEmpty-${sectionId}`);

      if (cartDrawerBodyUpdate) {
        cartDrawerBody.innerHTML = cartDrawerBodyUpdate.innerHTML;
      }
      if (cartDrawerFooterUpdate) {
        cartDrawerFooter.innerHTML = cartDrawerFooterUpdate.innerHTML;
      }

      if (cartDrawerEmptyUpdate) {
        cartDrawerEmpty.innerHTML = cartDrawerEmptyUpdate.innerHTML;
      }

      if (event.cart.item_count > 0) {
        cartDrawerBody.classList.remove('hidden');
        cartDrawerFooter.classList.remove('hidden');
        cartDrawerEmpty.classList.add('hidden');
      } else {
        cartDrawerBody.classList.add('hidden');
        cartDrawerFooter.classList.add('hidden');
        cartDrawerEmpty.classList.remove('hidden');
      }
    }

    const mainCart = document.querySelector(`#MainCart-${sectionId}`);
    if (mainCart) {
      const updatedElement = sectionToRender.querySelector(`#MainCart-${sectionId}`);
      if (updatedElement) {
        mainCart.innerHTML = updatedElement.innerHTML;
      } else {
        mainCart.closest('.cart').classList.add('is-empty');
        mainCart.remove();
      }
    }

    const lineItem =
      document.getElementById(`CartItem-${event.line}`) || document.getElementById(`CartDrawer-Item-${event.line}`);

    if (lineItem && lineItem.querySelector(`[name="${event.name}"]`)) {
      FoxTheme.a11y.trapFocus(mainCart || cartDrawer, lineItem.querySelector(`[name="${event.name}"]`));
    } else if (event.cart.item_count === 0) {
      cartDrawer
        ? FoxTheme.a11y.trapFocus(cartDrawer, cartDrawer.querySelector('a'))
        : FoxTheme.a11y.trapFocus(document.querySelector('.cart__empty'), document.querySelector('a'));
    } else {
      cartDrawer
        ? FoxTheme.a11y.trapFocus(cartDrawer, cartDrawer.querySelector('.cart-item__title'))
        : FoxTheme.a11y.trapFocus(mainCart, mainCart.querySelector('.cart-item__title'));
    }

    document.dispatchEvent(
      new CustomEvent('cart:updated', {
        detail: {
          cart: event.cart,
        },
      })
    );
  }

  updateQuantity(line, quantity, name, target) {
    this.showLoader(line);

    let sectionsToBundle = [];
    document.documentElement.dispatchEvent(
      new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections: sectionsToBundle } })
    );

    const body = JSON.stringify({
      line,
      quantity,
      sections: sectionsToBundle,
    });

    fetch(`${FoxTheme.routes.cart_change_url}`, { ...FoxTheme.utils.fetchConfig(), ...{ body } })
      .then((response) => response.json())
      .then((parsedState) => {
        FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.cartUpdate, { cart: parsedState, target, line, name });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  showLoader(line) {
    const sectionId = FoxTheme.utils.getSectionId(this);
    const loaders = document.querySelectorAll(`#Loader-${sectionId}-${line}`);
    if (loaders) {
      loaders.forEach((loader) => {
        loader.classList.add('btn--loading');
      });
    }
  }
}

customElements.define('cart-items', CartItems);

class CartRemoveItem extends HTMLAnchorElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();

      const cartItems = this.closest('cart-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}
customElements.define('cart-remove-item', CartRemoveItem, { extends: 'a' });
class CartNote extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('change', FoxTheme.utils.debounce(this.onChange.bind(this), 300));

    if (this.button && this.cartNoteDetailsSummary) {
      this.button.addEventListener('click', () => {
        this.cartNoteDetailsSummary.close();
      });
    }
  }

  get cartNoteDetailsSummary() {
    return this.closest('[is="accordion-details"]');
  }

  get button() {
    return this.querySelector('[type="button"]');
  }

  onChange(event) {
    const body = JSON.stringify({ note: event.target.value });
    fetch(`${FoxTheme.routes.cart_update_url}`, { ...FoxTheme.utils.fetchConfig(), ...{ body } });
  }
}
customElements.define('cart-note', CartNote);

class CalculateShipping extends ModalComponent {
  constructor() {
    super();
    this.countryProvince = this.querySelector('country-province');
    this.isCountrySetup = false;
  }
  static get observedAttributes() {
    return [...super.observedAttributes, 'data-show'];
  }
  show() {
    super.show();
    this.setAttribute('data-show', true);
  }

  hide() {
    super.hide();
    this.setAttribute('data-show', false);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === 'data-show' && newValue === 'true' && !this.isCountrySetup && this.countryProvince) {
      const template = this.countryProvince.querySelector('template');
      const templateContent = document.importNode(template.content, true);
      this.countryProvince.countryElement.appendChild(templateContent);
      this.countryProvince.init();
      this.isCountrySetup = true;
    }
  }
}
customElements.define('calculate-shipping', CalculateShipping);
class CountryProvinceForm extends HTMLElement {
  constructor() {
    super();
    this.provinceElement = this.querySelector('[name="address[province]"]');
    this.countryElement = this.querySelector('[name="address[country]"]');
    this.template = this.dataset.template;
    this.countryElement.addEventListener('change', this.handleCountryChange.bind(this));
    if (this.template && this.template === 'cart') {
      this.init();
    }
  }

  init() {
    if (this.getAttribute('country') !== '') {
      this.countryElement.selectedIndex = Math.max(
        0,
        Array.from(this.countryElement.options).findIndex((option) => option.textContent === this.dataset.country)
      );
      this.countryElement.dispatchEvent(new Event('change'));
    } else {
      this.handleCountryChange();
    }
  }

  handleCountryChange() {
    const option = this.countryElement.options[this.countryElement.selectedIndex],
      provinces = JSON.parse(option.dataset.provinces);

    this.provinceElement.closest('.form-field').hidden = provinces.length === 0;

    if (provinces.length === 0) {
      return;
    }

    this.provinceElement.innerHTML = '';

    provinces.forEach((data) => {
      const selected = data[1] === this.dataset.province;
      this.provinceElement.options.add(new Option(data[1], data[0], selected, selected));
    });
  }
}
customElements.define('country-province', CountryProvinceForm);

class ShippingCalculator extends HTMLFormElement {
  constructor() {
    super();

    this.submitButton = this.querySelector('[type="submit"]');
    this.resultsElement = this.lastElementChild;

    this.submitButton.addEventListener('click', this.handleFormSubmit.bind(this));
  }

  handleFormSubmit(event) {
    event.preventDefault();

    const zip = this.querySelector('[name="address[zip]"]').value,
      country = this.querySelector('[name="address[country]"]').value,
      province = this.querySelector('[name="address[province]"]').value;

    this.submitButton.classList.add('btn--loading');

    const body = JSON.stringify({
      shipping_address: { zip, country, province },
    });
    let sectionUrl = `${FoxTheme.routes.cart_url}/shipping_rates.json`;

    sectionUrl = sectionUrl.replace('//', '/');

    fetch(sectionUrl, { ...FoxTheme.utils.fetchConfig('javascript'), ...{ body } })
      .then((response) => response.json())
      .then((parsedState) => {
        if (parsedState.shipping_rates) {
          this.formatShippingRates(parsedState.shipping_rates);
        } else {
          this.formatError(parsedState);
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.resultsElement.hidden = false;
        this.submitButton.classList.remove('btn--loading');
      });
  }

  formatError(errors) {
    const shippingRatesList = Object.keys(errors).map((errorKey) => {
      return `<li>${errors[errorKey]}</li>`;
    });
    this.resultsElement.innerHTML = `
      <div class="alert alert--error blocks-radius grid gap-2">
        <p class="font-body-bolder m-0">${FoxTheme.shippingCalculatorStrings.error}</p>
        <ul class="list-disc grid gap-1 text-sm" role="list">${shippingRatesList.join('')}</ul>
      </div>
    `;
  }

  formatShippingRates(shippingRates) {
    const shippingRatesList = shippingRates.map(({ presentment_name, currency, price }) => {
      return `<li>${presentment_name}: ${currency} ${price}</li>`;
    });
    this.resultsElement.innerHTML = `
      <div class="alert blocks-radius alert--${
        shippingRates.length === 0 ? 'error' : 'success'
      } grid gap-2 leading-tight">
        <p class="font-body-bolder m-0">${
          shippingRates.length === 0
            ? FoxTheme.shippingCalculatorStrings.notFound
            : shippingRates.length === 1
            ? FoxTheme.shippingCalculatorStrings.oneResult
            : FoxTheme.shippingCalculatorStrings.multipleResults
        }</p>
        ${
          shippingRatesList === ''
            ? ''
            : `<ul class="list-disc grid gap-1 text-sm" role="list">${shippingRatesList.join('')}</ul>`
        }
      </div>
    `;
  }
}
customElements.define('shipping-calculator', ShippingCalculator, { extends: 'form' });

class CartDrawerProductsRecommendation extends HTMLElement {
  constructor() {
    super();
    if ('requestIdleCallback' in window) {
      requestIdleCallback(this.init.bind(this), { timeout: 1500 });
    } else {
      const userAgent = navigator.userAgent;
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      if (isSafari) {
        this.init();
      } else {
        FoxTheme.Motion.inView(this, this.init.bind(this), { margin: '600px 0px 600px 0px' });
      }
    }
  }

  get slideContainer() {
    return this.querySelector('.swiper');
  }

  get sliderPagination() {
    return this.querySelector('.swiper-pagination');
  }

  get sliderNext() {
    return this.querySelector('.swiper-button-next');
  }

  get sliderPrev() {
    return this.querySelector('.swiper-button-prev');
  }

  get wrapper() {
    return this.querySelector('.swiper-wrapper');
  }

  shuffle(items) {
    const shuffled = items.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  init() {
    const wrapper = this.wrapper;
    const slides = wrapper ? Array.from(wrapper.children) : [];

    if (!slides.length) {
      this.classList.add('hidden');
      this.dispatchEvent(new CustomEvent('is-empty'));
      return;
    }

    const limit = parseInt(this.dataset.limit, 10) || slides.length;
    const shuffled = this.shuffle(slides);

    shuffled.forEach((slide) => wrapper.appendChild(slide));
    shuffled.slice(limit).forEach((slide) => slide.remove());

    this.classList.remove('hidden');
    this.initCarousel();
    this.slidesReady = true;
    this.dispatchEvent(new CustomEvent('recommendations:loaded'));
  }

  initCarousel() {
    this.carousel = new FoxTheme.Carousel(
      this.slideContainer,
      {
        slidesPerView: 1,
        spaceBetween: 10,
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
        pagination: {
          el: this.sliderPagination,
          type: 'fraction',
        },
        navigation: {
          nextEl: this.sliderNext,
          prevEl: this.sliderPrev,
        },
      },
      [FoxTheme.Swiper.Autoplay]
    );

    this.carousel && this.carousel.init();
  }

  refreshCarousel() {
    // The cart drawer starts hidden, so if this initialized while the drawer
    // was still closed, Swiper measured everything at 0 width and its
    // autoplay timer never got a valid loop to run against. A plain
    // `update()` isn't enough to recover autoplay reliably, so rebuild the
    // instance now that we're actually visible. Skip this if the one-time
    // slide setup in init() hasn't run yet -- it will build the carousel
    // itself, and by then the drawer will already be open.
    if (!this.slidesReady) return;

    if (this.carousel && this.carousel.slider) {
      this.carousel.slider.destroy(true, true);
      this.carousel = null;
    }

    if (this.slideContainer) {
      this.initCarousel();
    }
  }
}

customElements.define('cart-drawer-products-recommendation', CartDrawerProductsRecommendation);

class CartDrawerUpsellScroll extends HTMLElement {
  constructor() {
    super();
    this.isDown = false;
    this.hasDragged = false;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  connectedCallback() {
    this.addEventListener('pointerdown', this.onPointerDown);
    this.addEventListener('pointermove', this.onPointerMove);
    this.addEventListener('pointerup', this.onPointerUp);
    this.addEventListener('pointercancel', this.onPointerUp);
  }

  onPointerDown(event) {
    if (event.pointerType === 'touch') return;

    this.isDown = true;
    this.hasDragged = false;
    this.startX = event.clientX;
    this.scrollLeftStart = this.scrollLeft;
    this.setPointerCapture(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.isDown) return;

    const walk = event.clientX - this.startX;
    if (Math.abs(walk) > 5 && !this.hasDragged) {
      this.hasDragged = true;
      this.classList.add('is-dragging');
    }
    if (this.hasDragged) {
      event.preventDefault();
      this.scrollLeft = this.scrollLeftStart - walk;
    }
  }

  onPointerUp(event) {
    if (!this.isDown) return;

    this.isDown = false;
    if (this.hasPointerCapture(event.pointerId)) {
      this.releasePointerCapture(event.pointerId);
    }

    if (this.hasDragged) {
      setTimeout(() => this.classList.remove('is-dragging'), 0);
    }
  }
}
customElements.define('cart-drawer-upsell-scroll', CartDrawerUpsellScroll);

class MainCart extends HTMLElement {
  constructor() {
    super();

    document.addEventListener('cart:grouped-sections', this.getSectionToRender.bind(this));
  }

  getSectionToRender(event) {
    event.detail.sections.push(FoxTheme.utils.getSectionId(this));
  }
}
customElements.define('main-cart', MainCart);

class FreeShippingGoal extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      leftToSpend: '[data-left-to-spend]',
    };
    this.goal = Number(this.dataset.minimumAmount) * Number(window.Shopify.currency.rate || 1) || 0;
    this.progress = this.querySelector('progress-bar');
    this.money_format = window.FoxTheme.settings.moneyFormat;
  }

  connectedCallback() {
    this.updateShippingGloal(Number(this.dataset.cartTotal));
    document.addEventListener('cart:updated', (event) => {
      this.updateShippingGloal(event.detail.cart.items_subtotal_price);
    });
  }

  updateShippingGloal(amount) {
    if (amount > 0) {
      this.classList.remove('hidden');
    } else {
      this.classList.add('hidden');
    }

    this.cartTotal = amount / 100;
    this.goalLeft = this.goal - this.cartTotal;
    this.goalDone = this.goalLeft <= 0;

    this.percent = (this.cartTotal * 100) / this.goal;

    if (this.percent >= 100) this.percent = 100;

    if (this.cartTotal >= this.goal) {
      this.progress.style.setProperty('--percent', `${this.percent}%`);
      this.classList.add('free-shipping-goal--done');
      this.progress.dataset.value = this.cartTotal;
      this.progress.dataset.max = this.goal;
    } else {
      let spend = (this.goal - this.cartTotal) * 100;
      this.querySelector(this.selectors.leftToSpend).innerHTML = FoxTheme.Currency.formatMoney(
        spend,
        this.money_format
      );
      this.classList.remove('free-shipping-goal--done');
      this.progress.style.setProperty('--percent', `${this.percent}%`);
      this.progress.dataset.value = this.cartTotal;
      this.progress.dataset.max = this.goal;
    }
  }
}
customElements.define('free-shipping-goal', FreeShippingGoal);

window.FoxKitAddToCart = async (payload) => {
  if (!payload?.properties?.['_FoxKit offer']) return;

  const cartJson = await (
    await fetch(`${FoxTheme.routes.cart_url}`, {
      ...FoxTheme.utils.fetchConfig(),
    })
  ).json();
  cartJson['sections'] = payload['sections'];
  FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.cartUpdate, { cart: cartJson });

  document.dispatchEvent(
    new CustomEvent('product-ajax:added', {
      detail: {
        product: payload,
      },
    })
  );
};
