const preconnectGoogle = document.createElement('link');
preconnectGoogle.rel = 'preconnect';
preconnectGoogle.href = 'https://fonts.googleapis.com';
document.head.appendChild(preconnectGoogle);

const preconnectGstatic = document.createElement('link');
preconnectGstatic.rel = 'preconnect';
preconnectGstatic.href = 'https://fonts.gstatic.com';
preconnectGstatic.crossOrigin = 'anonymous';
document.head.appendChild(preconnectGstatic);

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';

document.head.appendChild(fontLink);