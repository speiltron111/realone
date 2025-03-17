function scrollAnimation() {
  const scrollElements = document.querySelectorAll(".scroll-animation");

  let elementInView = (el, dividend = 1) => {
    const elementTop = el.getBoundingClientRect().top;

    return (
      elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
    );
  };

  let elementOutofView = (el) => {
    const elementTop = el.getBoundingClientRect().top;

    return (
      elementTop > (window.innerHeight || document.documentElement.clientHeight)
    );
  };

  let displayScrollElement = (element) => {
    element.classList.add("active");
  };

  let hideScrollElement = (element) => {
    element.classList.remove("active");
  };

  let handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el, 1.25)) {
        displayScrollElement(el);
      } else if (elementOutofView(el)) {
        hideScrollElement(el);
      }
    });
  };

  handleScrollAnimation();

  window.addEventListener("scroll", () => { 
    handleScrollAnimation();
  });
}

document.addEventListener('DOMContentLoaded', scrollAnimation);
document.addEventListener('shopify:section:load', scrollAnimation);