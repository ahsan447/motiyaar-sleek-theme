if (!customElements.get('pair-perfectly-with-slider')) {
  customElements.define(
    'pair-perfectly-with-slider',
    class PairPerfectlyWithSlider extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const slider = this.querySelector('.swiper');
        if (!slider) return;

        this.sliderOptions = {
          slidesPerView: 2,
          spaceBetween: 12,
          loop: true,
          grabCursor: true,
          allowTouchMove: true,
          threshold: 2,
          breakpoints: {
            1024: {
              slidesPerView: 4,
            },
          },
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
        };

        this.sliderInstance = new window.FoxTheme.Carousel(slider, this.sliderOptions, FoxTheme.Swiper.Autoplay);
        this.sliderInstance.init();

        this.fixQuickviewDuplicate();
      }

      fixQuickviewDuplicate() {
        let modalIds = [];
        Array.from(this.querySelectorAll('quick-view-modal')).forEach((modal) => {
          const modalID = modal.getAttribute('id');
          if (modalIds.includes(modalID)) {
            modal.remove();
          } else {
            modalIds.push(modalID);
          }
        });
      }
    }
  );
}
