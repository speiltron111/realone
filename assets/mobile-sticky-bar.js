const mobileStickyBar = document.querySelectorAll('.mobile-sticky-bar');

function showmobileStickyBar() {


  const endScreenOnScroll = document.body.offsetHeight - window.innerHeight * 1.5;

  if (document.documentElement.scrollTop > (window.innerHeight / 2) && document.documentElement.scrollTop < endScreenOnScroll) {
    mobileStickyBar.forEach(bar => bar.classList.add('active'));
  } else {
    mobileStickyBar.forEach(bar => bar.classList.remove('active'));
  }
}

window.addEventListener('scroll', () => {
  showmobileStickyBar();
});