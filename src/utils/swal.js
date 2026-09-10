import Swal from 'sweetalert2';

// Dynamic theme resolver helper
const getSwalThemeConfig = () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light' || localStorage.getItem('apex_theme') === 'light';
  if (isLight) {
    return {
      background: '#ffffff',
      color: '#0f172a',
      confirmButtonColor: '#ff5e00',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'cyber-swal-popup light-swal-popup',
        title: 'cyber-swal-title light-swal-title',
        htmlContainer: 'cyber-swal-content light-swal-content',
        confirmButton: 'glow-btn cyber-swal-btn',
        cancelButton: 'outline-btn cyber-swal-cancel-btn'
      }
    };
  }
  return {
    background: '#0d0d12',
    color: '#ffffff',
    confirmButtonColor: '#ff5e00',
    cancelButtonColor: '#ff3e6c',
    customClass: {
      popup: 'cyber-swal-popup',
      title: 'cyber-swal-title',
      htmlContainer: 'cyber-swal-content',
      confirmButton: 'glow-btn cyber-swal-btn',
      cancelButton: 'outline-btn cyber-swal-cancel-btn'
    }
  };
};

// Custom SweetAlert2 Dynamic Theme Proxy
export const CustomSwal = {
  fire: (options = {}, ...args) => {
    const themeConfig = getSwalThemeConfig();
    let finalOptions = {};
    if (typeof options === 'string') {
      finalOptions = {
        title: options,
        text: args[0] || '',
        icon: args[1] || null
      };
    } else {
      finalOptions = { ...options };
    }

    return Swal.fire({
      ...themeConfig,
      buttonsStyling: false,
      ...finalOptions,
      customClass: {
        ...themeConfig.customClass,
        ...(finalOptions.customClass || {})
      }
    });
  }
};

// Toast SweetAlert popup helper
export const ToastSwal = {
  fire: (options = {}) => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || localStorage.getItem('apex_theme') === 'light';
    return Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: isLight ? '#ffffff' : '#12121a',
      color: isLight ? '#0f172a' : '#ffffff',
      ...options,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
        if (options.didOpen) options.didOpen(toast);
      }
    });
  }
};

export default CustomSwal;
