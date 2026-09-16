(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {};
  const config = configs[path];
  if (!config) return;
})();
