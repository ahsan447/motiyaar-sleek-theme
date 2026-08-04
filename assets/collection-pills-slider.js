if (!customElements.get('collection-pills-slider')) {
  customElements.define(
    'collection-pills-slider',
    class CollectionPillsSlider extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.selectors = {
          sliderWrapper: '.collection-pills__items',
        };

        this.sliderWrapper = this.querySelector(this.selectors.sliderWrapper);
        this.sliderInstance = false;

        this.initSlider();
      }

      initSlider() {
        if (typeof this.sliderInstance === 'object') return;

        const columnGap = window.getComputedStyle(this.sliderWrapper).getPropertyValue('--column-gap');
        const spaceBetween = parseFloat(columnGap.replace('rem', '')) * 10 || 8;

        const sliderOptions = {
          slidesPerView: 'auto',
          spaceBetween: spaceBetween,
          pagination: false,
          loop: false,
          threshold: 2,
          grabCursor: true,
          allowTouchMove: true,
        };

        this.sliderInstance = new window.FoxTheme.Carousel(this.sliderWrapper, sliderOptions);
        this.sliderInstance.init();
      }
    }
  );
}
