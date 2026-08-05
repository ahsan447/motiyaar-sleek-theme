if (!customElements.get('trust-hero-quotes-slider')) {
  class TrustHeroQuotesSlider extends HTMLElement {
    connectedCallback() {
      this.sliderWrapper = this.querySelector('.trust-hero__quotes');
      this.sliderInstance = false;

      this.initSlider();
    }

    initSlider() {
      if (!this.sliderWrapper) return;

      const sliderOptions = {
        modules: [FoxTheme.Swiper.Autoplay],
        slidesPerView: 1.5,
        spaceBetween: 24,
        breakpoints: {
          768: {
            slidesPerView: 3,
          },
        },
        loop: true,
        threshold: 2,
        grabCursor: true,
        allowTouchMove: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
      };

      this.sliderInstance = new window.FoxTheme.Carousel(this.sliderWrapper, sliderOptions);
      this.sliderInstance.init();
    }
  }
  customElements.define('trust-hero-quotes-slider', TrustHeroQuotesSlider);
}

if (!customElements.get('trust-hero-media-slider')) {
  class TrustHeroMediaSlider extends HTMLElement {
    connectedCallback() {
      this.sliderWrapper = this.querySelector('.trust-hero__media-slider');
      this.sliderInstance = false;

      this.initSlider();
    }

    initSlider() {
      if (!this.sliderWrapper) return;

      const slidesCount = this.sliderWrapper.querySelectorAll('.swiper-slide').length;

      const sliderOptions = {
        modules: [FoxTheme.Swiper.Autoplay],
        slidesPerView: 1,
        loop: slidesCount > 1,
        threshold: 2,
        grabCursor: true,
        allowTouchMove: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
      };

      this.sliderInstance = new window.FoxTheme.Carousel(this.sliderWrapper, sliderOptions);
      this.sliderInstance.init();
    }
  }
  customElements.define('trust-hero-media-slider', TrustHeroMediaSlider);
}
