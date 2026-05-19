let slideIndex = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.remove('active');
    dots[i].classList.remove('active');
  });

  slides[index].classList.add('active');
  dots[index].classList.add('active');
}

function nextSlide() {
  slideIndex = (slideIndex + 1) % slides.length;
  showSlide(slideIndex);
}

dots.forEach(dot => {
  dot.addEventListener('click', (e) => {
    slideIndex = parseInt(dot.getAttribute('data-index'));
    showSlide(slideIndex);
  });
});

window.addEventListener('DOMContentLoaded', () => {
  showSlide(slideIndex);
  setInterval(nextSlide, 3000);
});
