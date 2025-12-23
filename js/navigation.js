function goTo(url) {
  document.body.style.opacity = 0;
  setTimeout(() => {
    window.location.href = url;
  }, 200);
}
