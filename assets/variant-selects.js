
  if (!customElements.get('variant-selects')) {
    customElements.define(
      'variant-selects',
      class VariantSelects extends HTMLElement {
        constructor() {
          super();
          this.settings = {
            preorder_threshold: window.preorderThreshold || 0,
          };
        }

        get product_variants() {
          const dataElement = this.querySelector('[data-all-variant]');
          if (!dataElement) return [];
          try {
            return JSON.parse(dataElement.textContent);
          } catch (e) {
            return [];
          }
        }

        get selectedOptionValues() {
          return Array.from(this.querySelectorAll('select option[selected], fieldset input:checked')).map(
            ({ dataset }) => dataset.optionValueId
          );
        }

        getInputForEventTarget(target) {
          return target.tagName === 'SELECT' ? target.selectedOptions[0] : target;
        }

        connectedCallback() {
          this.addEventListener('change', (event) => {
            const target = this.getInputForEventTarget(event.target);
            this.updateSelectedSwatchValue(event);

            // Publish theme's event
            FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.optionValueSelectionChange, {
              data: {
                event,
                target,
                selectedOptionValues: this.selectedOptionValues,
              },
            });

            // Get current variant
            const currentVariant = this.getCurrentVariant();
            if (currentVariant) {
              // Update preorder UI
              this.updatePreorderUI(currentVariant);

              // Dispatch theme's variant change event
              this.dispatchEvent(
                new CustomEvent('variant:changed', {
                  bubbles: true,
                  detail: {
                    variant: currentVariant,
                  },
                })
              );
            }
          });

          // Initial check
          const currentVariant = this.getCurrentVariant();
          if (currentVariant) {
            this.updatePreorderUI(currentVariant);
          }
        }

        getCurrentVariant() {
          const optionValues = Array.from(this.querySelectorAll('.product-form__input')).map((wrapper) => {
            const select = wrapper.querySelector('select');
            if (select) return select.value;
            const checkedRadio = wrapper.querySelector('input[type="radio"]:checked');
            return checkedRadio ? checkedRadio.value : undefined;
          });

          return this.product_variants.find((variant) => {
            return variant.options.every((value, index) => value === optionValues[index]);
          });
        }

        updatePreorderUI(variant) {
          // Show selected variant info
          const variantInfoEl = document.getElementById('selectedVariantInfo');
          if (variantInfoEl) {
            variantInfoEl.innerHTML = `
              <div class="variant-info">
                <p><strong>Selected Variant:</strong> ${variant.title}</p>
                <p><strong>SKU:</strong> ${variant.sku || 'N/A'}</p>
                <p><strong>Price:</strong> ${variant.price}</p>
                <p><strong>Inventory:</strong> ${variant.inventory_quantity}</p>
                <p><strong>Status:</strong> ${variant.available ? 'Available' : 'Sold Out'}</p>
              </div>
            `;
            variantInfoEl.style.display = 'block';
            variantInfoEl.style.marginTop = '15px';
            variantInfoEl.style.padding = '10px';
            variantInfoEl.style.border = '1px solid #ddd';
            variantInfoEl.style.borderRadius = '4px';
          }

          // Update EMI prices
          const priceGrab = document.querySelector('.altpaymentopt-grab');
          const priceAtom = document.querySelector('.altpaymentopt-atom');
          if (priceGrab) priceGrab.textContent = variant.grab_price;
          if (priceAtom) priceAtom.textContent = variant.atom_price;

          // Update preorder badge
          const existingBadges = document.querySelectorAll('.badge-preorder');
          existingBadges.forEach((badge) => badge.remove());

          if (
            variant.inventory_policy == 'continue' &&
            variant.inventory_quantity <= this.settings.preorder_threshold
          ) {
            const variantSelectors = this.querySelectorAll('.form-control--select');
            variantSelectors.forEach((select) => {
              const wrapper = select.closest('.product-form__input');
              if (wrapper) {
                const badge = document.createElement('div');
                badge.className = 'badge-preorder';
                badge.textContent = 'Pre-Order';
                const selectContainer = wrapper.querySelector('.select');
                if (selectContainer) {
                  wrapper.insertBefore(badge, selectContainer);
                }
              }
            });
          }

          // Update preorder notice
          const existingNotices = document.querySelectorAll('.variant-preorder-notice');
          existingNotices.forEach((notice) => notice.remove());

          if (variant.notice && variant.notice !== 'null' && variant.notice.trim() !== '') {
            const variantSelectors = this.querySelectorAll('.form-control--select');
            variantSelectors.forEach((select) => {
              const wrapper = select.closest('.product-form__input');
              if (wrapper) {
                const notice = document.createElement('div');
                notice.className = 'variant-preorder-notice';
                notice.innerHTML = variant.notice;
                notice.style.color = '#e67e22';
                notice.style.marginTop = '10px';
                notice.style.fontSize = '14px';
                const selectContainer = wrapper.querySelector('.select');
                if (selectContainer) {
                  wrapper.insertBefore(notice, selectContainer);
                }
              }
            });
          }

          // Update button
          const btn = document.querySelector('.product-form__submit');
          if (btn) {
            const btnText = btn.querySelector('.addtocart');
            if (variant.available) {
              if (
                variant.inventory_policy == 'continue' &&
                variant.inventory_quantity <= this.settings.preorder_threshold
              ) {
                btnText.textContent = 'Pre order';
                btn.classList.remove('disabled');
                btn.removeAttribute('disabled');
                // Store the preorder state
                btn.dataset.isPreorder = 'true';
              } else {
                btn.classList.remove('disabled');
                btn.removeAttribute('disabled');
                // Remove preorder state
                btn.dataset.isPreorder = 'false';
              }
            } else {
              btnText.textContent = 'Sold out';
              btn.classList.add('disabled');
              btn.setAttribute('disabled', '');
              // Remove preorder state
              btn.dataset.isPreorder = 'false';
            }
          }
        }

        updateSelectedSwatchValue({ target }) {
          const { value, tagName } = target;

          if (tagName === 'SELECT' && target.selectedOptions.length) {
            Array.from(target.options)
              .find((option) => option.getAttribute('selected'))
              .removeAttribute('selected');
            target.selectedOptions[0].setAttribute('selected', 'selected');

            const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
            const selectedDropdownSwatchValue = target
              .closest('.product-form__input')
              .querySelector('[data-selected-value] > .swatch');
            if (!selectedDropdownSwatchValue) return;
            if (swatchValue) {
              selectedDropdownSwatchValue.style.setProperty('--swatch--background', swatchValue);
              selectedDropdownSwatchValue.classList.remove('swatch--unavailable');
            } else {
              selectedDropdownSwatchValue.style.setProperty('--swatch--background', 'unset');
              selectedDropdownSwatchValue.classList.add('swatch--unavailable');
            }

            selectedDropdownSwatchValue.style.setProperty(
              '--swatch-focal-point',
              target.selectedOptions[0].dataset.optionSwatchFocalPoint || 'unset'
            );
          } else if (tagName === 'INPUT' && target.type === 'radio') {
            const selectedSwatchValue = target
              .closest(`.product-form__input`)
              .querySelector('[data-selected-swatch-value]');
            if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
          }
        }
      }
    );
  }
