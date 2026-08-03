if (!customElements.get('customer-reviews-slider')) {
  class CustomerReviewsSlider extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.sliderWrapper = this.querySelector('.customer-reviews__items');
      this.pagination = this.querySelector('.customer-reviews__pagination');
      this.nextEl = this.querySelector('.swiper-btn-next');
      this.prevEl = this.querySelector('.swiper-btn-prev');

      this.itemsDesktop = parseInt(this.dataset.itemsDesktop) || 3;
      this.autoplayDelay = this.dataset.autoplay ? parseInt(this.dataset.autoplay) : 0;
      this.sliderInstance = false;

      this.initSlider();
    }

    initSlider() {
      const columnGap = window.getComputedStyle(this.sliderWrapper).getPropertyValue('--column-gap');
      const spaceBetween = parseFloat(columnGap.replace('rem', '')) * 10 || 24;

      const modules = [FoxTheme.Swiper.Navigation, FoxTheme.Swiper.Pagination];

      const sliderOptions = {
        modules: modules,
        slidesPerView: 1,
        spaceBetween: spaceBetween,
        navigation: {
          nextEl: this.nextEl,
          prevEl: this.prevEl,
        },
        pagination: {
          el: this.pagination,
          clickable: true,
        },
        breakpoints: {
          768: {
            slidesPerView: this.itemsDesktop > 2 ? 2 : this.itemsDesktop,
          },
          1024: {
            slidesPerView: this.itemsDesktop,
          },
        },
        loop: true,
        threshold: 2,
        grabCursor: true,
        allowTouchMove: true,
      };

      if (this.autoplayDelay > 0) {
        modules.push(FoxTheme.Swiper.Autoplay);
        sliderOptions.autoplay = {
          delay: this.autoplayDelay,
          disableOnInteraction: false,
        };
      }

      this.sliderInstance = new window.FoxTheme.Carousel(this.sliderWrapper, sliderOptions);
      this.sliderInstance.init();

      if (Shopify.designMode) {
        document.addEventListener('shopify:block:select', (e) => {
          if (e.detail.sectionId != this.dataset.sectionId) return;
          const { target } = e;
          const index = Number(target.dataset.index);
          if (!isNaN(index) && this.sliderInstance.slider) {
            this.sliderInstance.slider.slideToLoop(index);
          }
        });
      }
    }
  }
  customElements.define('customer-reviews-slider', CustomerReviewsSlider);
}
